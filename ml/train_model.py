#!/usr/bin/env python3
"""
StrideSense - Machine Learning Training Script
Extracts features, trains lightweight Random Forest, evaluates performance,
and exports the C model header for ESP32 TinyML deployment.
"""

import os
import argparse
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

from feature_extractor import extract_dataset_features, FEATURE_NAMES
from export_c_model import export_random_forest_to_c, CLASS_NAMES

def main():
    parser = argparse.ArgumentParser(description="Train StrideSense Activity Recognition Model")
    parser.add_argument("--dataset", type=str, default="datasets/synthetic_gait.csv", help="Input dataset CSV")
    parser.add_argument("--export", type=str, default="firmware/StrideSense_Firmware/model_data.h", help="Output C header")
    parser.add_argument("--trees", type=int, default=7, help="Number of trees in Random Forest")
    parser.add_argument("--max-depth", type=int, default=6, help="Maximum tree depth (for TinyML)")
    args = parser.parse_args()

    print(f"Loading dataset from: {args.dataset}...")
    df = pd.read_csv(args.dataset)
    print(f"Total raw samples: {len(df)}")

    print("Extracting sliding-window features (Window=50, Step=25)...")
    X, y_labels = extract_dataset_features(df, window_size=50, step_size=25)
    print(f"Extracted {len(X)} feature windows across {len(FEATURE_NAMES)} features.")

    # Map labels to integers
    label_to_idx = {name: i for i, name in enumerate(CLASS_NAMES)}
    y = np.array([label_to_idx[lbl] for lbl in y_labels], dtype=int)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\nTraining Random Forest ({args.trees} trees, max_depth={args.max_depth})...")
    clf = RandomForestClassifier(
        n_estimators=args.trees,
        max_depth=args.max_depth,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(clf, X, y, cv=5)

    print("\n================ EVALUATION RESULTS ================")
    print(f"Test Set Accuracy:     {acc * 100:.2f}%")
    print(f"5-Fold CV Accuracy:    {cv_scores.mean() * 100:.2f}% (±{cv_scores.std() * 100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("===================================================\n")

    # Save model artifact
    model_path = "ml/stridesense_model.joblib"
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump({"model": clf, "feature_names": FEATURE_NAMES, "classes": CLASS_NAMES}, model_path)
    print(f"Model saved to: {model_path}")

    # Export C Header for ESP32
    export_random_forest_to_c(clf, FEATURE_NAMES, args.export)
    # Also save a copy inside ml/
    export_random_forest_to_c(clf, FEATURE_NAMES, "ml/model_data.h")

if __name__ == "__main__":
    main()
