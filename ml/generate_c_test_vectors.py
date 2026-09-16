#!/usr/bin/env python3
"""
StrideSense - Ground Truth C Test Vector Generator
Extracts real, authenticated feature windows from the master dataset
and formats them into test_vectors.h for rigorous C testbench verification.
"""

import os
import numpy as np
import pandas as pd
from feature_extractor import extract_dataset_features, FEATURE_NAMES
from export_c_model import CLASS_NAMES

def main():
    df = pd.read_csv("datasets/stridesense_master_dataset.csv")
    X, y_labels = extract_dataset_features(df, window_size=50, step_size=25)

    samples_per_class = 3
    selected_features = []
    selected_classes = []

    for class_idx, class_name in enumerate(CLASS_NAMES):
        indices = np.where(y_labels == class_name)[0]
        # Choose samples from the middle of the segment
        chosen = indices[len(indices)//4 : len(indices)//4 + samples_per_class]
        for idx in chosen:
            selected_features.append(X[idx])
            selected_classes.append(class_idx)

    num_vectors = len(selected_classes)

    header = f"""/*
 * Real-world Ground Truth Feature Vectors from StrideSense Master Dataset
 * Auto-generated for C/C++ Testbench Verification.
 */

#ifndef STRIDESENSE_TEST_VECTORS_H
#define STRIDESENSE_TEST_VECTORS_H

#define NUM_GROUND_TRUTH_TESTS {num_vectors}

static const int GROUND_TRUTH_LABELS[{num_vectors}] = {{
    {", ".join(map(str, selected_classes))}
}};

static const float GROUND_TRUTH_VECTORS[{num_vectors}][24] = {{
"""

    for i, vec in enumerate(selected_features):
        cls_name = CLASS_NAMES[selected_classes[i]]
        header += f"    // Test {i}: {cls_name}\n"
        header += f"    {{ {', '.join([f'{val:.5f}f' for val in vec])} }},\n"

    header += """};

#endif // STRIDESENSE_TEST_VECTORS_H
"""

    with open("ml/test_vectors.h", "w") as f:
        f.write(header)
    print(f"Generated {num_vectors} authentic ground-truth test vectors in ml/test_vectors.h")

if __name__ == "__main__":
    main()
