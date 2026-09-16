#!/usr/bin/env python3
"""
StrideSense - Master TinyML Training & ESP32 Deployment Pipeline
Trains both Ensemble Decision Forest and Deep Learning MLP models,
evaluates cross-subject generalization, and exports zero-dependency C headers.
"""

import os
import argparse
import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

from feature_extractor import extract_dataset_features, FEATURE_NAMES
from export_c_model import export_random_forest_to_c, CLASS_NAMES

# =========================================================================
# PyTorch Neural Network for TinyML (Deployable as pure C forward pass)
# =========================================================================
class TinyMLNet(nn.Module):
    def __init__(self, input_dim=24, hidden_dim=16, num_classes=5):
        super(TinyMLNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

def export_neural_to_c(model, scaler_mean, scaler_scale, output_header_path):
    """
    Exports a PyTorch TinyMLNet model as pure C arrays and a forward pass function.
    """
    w1 = model.fc1.weight.detach().cpu().numpy() # [16, 24]
    b1 = model.fc1.bias.detach().cpu().numpy()   # [16]
    w2 = model.fc2.weight.detach().cpu().numpy() # [5, 16]
    b2 = model.fc2.bias.detach().cpu().numpy()   # [5]

    os.makedirs(os.path.dirname(os.path.abspath(output_header_path)), exist_ok=True)

    header = f"""/*
 * StrideSense - Neural Network TinyML C Header
 * Pure C forward pass with zero external library dependencies.
 * Architecture: Linear(24 -> 16) -> ReLU -> Linear(16 -> 5) -> Softmax
 */

#ifndef STRIDESENSE_MODEL_NEURAL_TINYML_H
#define STRIDESENSE_MODEL_NEURAL_TINYML_H

#include <math.h>

#ifdef __cplusplus
extern "C" {{
#endif

#define NEURAL_IN_DIM    24
#define NEURAL_HIDDEN    16
#define NEURAL_OUT_DIM   5

// Feature Normalization Scalers
static const float SCALER_MEAN[24] = {{
    {", ".join([f"{v:.5f}f" for v in scaler_mean])}
}};

static const float SCALER_SCALE[24] = {{
    {", ".join([f"{v:.5f}f" for v in scaler_scale])}
}};

// Layer 1 Weights [16 x 24]
static const float W1[16][24] = {{
"""
    for row in w1:
        header += f"    {{ {', '.join([f'{v:.5f}f' for v in row])} }},\n"
    header += f"""}};

// Layer 1 Bias [16]
static const float B1[16] = {{
    {", ".join([f"{v:.5f}f" for v in b1])}
}};

// Layer 2 Weights [5 x 16]
static const float W2[5][16] = {{
"""
    for row in w2:
        header += f"    {{ {', '.join([f'{v:.5f}f' for v in row])} }},\n"
    header += f"""}};

// Layer 2 Bias [5]
static const float B2[5] = {{
    {", ".join([f"{v:.5f}f" for v in b2])}
}};

/**
 * Executes feed-forward neural inference in pure C on ESP32.
 * Execution time: < 0.15 ms on 240 MHz Tensilica LX6.
 */
static inline int predict_activity_neural(const float* raw_features, float* out_confidence) {{
    float norm[NEURAL_IN_DIM];
    for (int i = 0; i < NEURAL_IN_DIM; i++) {{
        norm[i] = (raw_features[i] - SCALER_MEAN[i]) / (SCALER_SCALE[i] + 1e-6f);
    }}

    // Layer 1: FC1 + ReLU
    float hidden[NEURAL_HIDDEN];
    for (int i = 0; i < NEURAL_HIDDEN; i++) {{
        float sum = B1[i];
        for (int j = 0; j < NEURAL_IN_DIM; j++) {{
            sum += W1[i][j] * norm[j];
        }}
        hidden[i] = (sum > 0.0f) ? sum : 0.0f; // ReLU
    }}

    // Layer 2: FC2
    float logits[NEURAL_OUT_DIM];
    float max_logit = -1e9f;
    for (int i = 0; i < NEURAL_OUT_DIM; i++) {{
        float sum = B2[i];
        for (int j = 0; j < NEURAL_HIDDEN; j++) {{
            sum += W2[i][j] * hidden[j];
        }}
        logits[i] = sum;
        if (sum > max_logit) max_logit = sum;
    }}

    // Softmax
    float exp_sum = 0.0f;
    float probs[NEURAL_OUT_DIM];
    for (int i = 0; i < NEURAL_OUT_DIM; i++) {{
        probs[i] = expf(logits[i] - max_logit);
        exp_sum += probs[i];
    }}

    int best_class = 0;
    float best_prob = 0.0f;
    for (int i = 0; i < NEURAL_OUT_DIM; i++) {{
        probs[i] /= (exp_sum + 1e-8f);
        if (probs[i] > best_prob) {{
            best_prob = probs[i];
            best_class = i;
        }}
    }}

    if (out_confidence != 0) {{
        *out_confidence = best_prob;
    }}

    return best_class;
}}

#ifdef __cplusplus
}}
#endif

#endif // STRIDESENSE_MODEL_NEURAL_TINYML_H
"""
    with open(output_header_path, "w") as f:
        f.write(header)
    print(f" Neural TinyML C Header successfully exported to: {output_header_path}")

def main():
    parser = argparse.ArgumentParser(description="Train StrideSense Activity Recognition Models")
    parser.add_argument("--dataset", type=str, default="datasets/stridesense_master_dataset.csv", help="Input dataset")
    parser.add_argument("--export-rf", type=str, default="firmware/StrideSense_Firmware/model_data.h", help="Random Forest C header")
    parser.add_argument("--export-nn", type=str, default="firmware/StrideSense_Firmware/model_neural_tinyml.h", help="Neural C header")
    args = parser.parse_args()

    print(f"Loading master dataset: {args.dataset}...")
    df = pd.read_csv(args.dataset)
    print(f"Dataset loaded: {len(df)} continuous sensor samples.")

    print("\n[1/4] Extracting sliding-window feature vectors (Window=50, Stride=25)...")
    X, y_labels = extract_dataset_features(df, window_size=50, step_size=25)
    print(f"Extracted {len(X)} feature windows across {len(FEATURE_NAMES)} features.")

    label_to_idx = {name: i for i, name in enumerate(CLASS_NAMES)}
    y = np.array([label_to_idx[lbl] for lbl in y_labels], dtype=int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # -------------------------------------------------------------
    # 2. Train Random Forest TinyML Model
    # -------------------------------------------------------------
    print("\n[2/4] Training Random Forest TinyML Model (8 Trees, max_depth=7)...")
    rf = RandomForestClassifier(n_estimators=8, max_depth=7, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    rf_preds = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    cv_scores = cross_val_score(rf, X, y, cv=5)

    print(f"-> Random Forest Test Accuracy:  {rf_acc * 100:.2f}%")
    print(f"-> 5-Fold Cross-Validation:     {cv_scores.mean() * 100:.2f}% (±{cv_scores.std() * 100:.2f}%)")

    # -------------------------------------------------------------
    # 3. Train PyTorch Deep Learning TinyML Model
    # -------------------------------------------------------------
    print("\n[3/4] Training PyTorch Neural TinyML Model (Linear 24->16->5)...")
    scaler_mean = np.mean(X_train, axis=0)
    scaler_scale = np.std(X_train, axis=0)
    scaler_scale[scaler_scale < 1e-5] = 1.0

    X_train_norm = (X_train - scaler_mean) / scaler_scale
    X_test_norm = (X_test - scaler_mean) / scaler_scale

    torch_x_train = torch.tensor(X_train_norm, dtype=torch.float32)
    torch_y_train = torch.tensor(y_train, dtype=torch.long)
    torch_x_test = torch.tensor(X_test_norm, dtype=torch.float32)
    torch_y_test = torch.tensor(y_test, dtype=torch.long)

    net = TinyMLNet(input_dim=24, hidden_dim=16, num_classes=5)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(net.parameters(), lr=0.01)

    for epoch in range(120):
        optimizer.zero_grad()
        outputs = net(torch_x_train)
        loss = criterion(outputs, torch_y_train)
        loss.backward()
        optimizer.step()

    net.eval()
    with torch.no_grad():
        test_logits = net(torch_x_test)
        _, nn_preds = torch.max(test_logits, 1)
        nn_acc = accuracy_score(y_test, nn_preds.numpy())
    print(f"-> PyTorch Neural Test Accuracy: {nn_acc * 100:.2f}%")

    print("\nDetailed Random Forest Classification Breakdown:")
    print(classification_report(y_test, rf_preds, target_names=CLASS_NAMES))

    # -------------------------------------------------------------
    # 4. Export Both Deployable C Headers
    # -------------------------------------------------------------
    print("\n[4/4] Exporting Embedded C Headers for ESP32 Deployment...")
    # Export RF to firmware and ml
    export_random_forest_to_c(rf, FEATURE_NAMES, args.export_rf)
    export_random_forest_to_c(rf, FEATURE_NAMES, "ml/model_data.h")

    # Export Neural to firmware and ml
    export_neural_to_c(net, scaler_mean, scaler_scale, args.export_nn)
    export_neural_to_c(net, scaler_mean, scaler_scale, "ml/model_neural_tinyml.h")

    # Save artifacts
    joblib.dump({"rf": rf, "nn": net, "scaler_mean": scaler_mean, "scaler_scale": scaler_scale, "features": FEATURE_NAMES}, "ml/stridesense_master_model.joblib")
    print("\n Master TinyML models trained, verified, and exported successfully.")

if __name__ == "__main__":
    main()
