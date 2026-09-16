#!/usr/bin/env python3
"""
StrideSense - Feature Extraction Pipeline
Extracts time-domain, frequency-domain, and biomechanical pressure features
from sliding windows of sensor readings (P1..P6, Ax, Ay, Az, Gx, Gy, Gz).
"""

import numpy as np
import pandas as pd
from typing import List, Tuple, Dict

FEATURE_NAMES = [
    "acc_x_mean", "acc_x_std",
    "acc_y_mean", "acc_y_std",
    "acc_z_mean", "acc_z_std",
    "gyro_x_mean", "gyro_x_std",
    "gyro_y_mean", "gyro_y_std",
    "gyro_z_mean", "gyro_z_std",
    "svm_acc_mean", "svm_acc_max", "svm_acc_std",
    "svm_gyro_mean", "svm_gyro_max",
    "force_total_mean", "force_total_std", "force_total_max",
    "heel_forefoot_ratio",
    "medial_lateral_ratio",
    "heel_force_mean",
    "forefoot_force_mean"
]

def extract_features_from_window(
    P1: np.ndarray, P2: np.ndarray, P3: np.ndarray,
    P4: np.ndarray, P5: np.ndarray, P6: np.ndarray,
    Ax: np.ndarray, Ay: np.ndarray, Az: np.ndarray,
    Gx: np.ndarray, Gy: np.ndarray, Gz: np.ndarray
) -> np.ndarray:
    """
    Computes a 24-dimensional feature vector from synchronized window arrays.
    Matches the exact computation performed by the ESP32 C++ firmware.
    """
    # Accelerometer statistics
    ax_mean, ax_std = float(np.mean(Ax)), float(np.std(Ax))
    ay_mean, ay_std = float(np.mean(Ay)), float(np.std(Ay))
    az_mean, az_std = float(np.mean(Az)), float(np.std(Az))

    # Gyroscope statistics
    gx_mean, gx_std = float(np.mean(Gx)), float(np.std(Gx))
    gy_mean, gy_std = float(np.mean(Gy)), float(np.std(Gy))
    gz_mean, gz_std = float(np.mean(Gz)), float(np.std(Gz))

    # Signal Vector Magnitude (SVM)
    svm_acc = np.sqrt(Ax**2 + Ay**2 + Az**2)
    svm_acc_mean = float(np.mean(svm_acc))
    svm_acc_max = float(np.max(svm_acc))
    svm_acc_std = float(np.std(svm_acc))

    svm_gyro = np.sqrt(Gx**2 + Gy**2 + Gz**2)
    svm_gyro_mean = float(np.mean(svm_gyro))
    svm_gyro_max = float(np.max(svm_gyro))

    # Total Plantar Force
    total_force = P1 + P2 + P3 + P4 + P5 + P6
    force_mean = float(np.mean(total_force))
    force_std = float(np.std(total_force))
    force_max = float(np.max(total_force))

    # Biomechanical Ratios
    # Heel: P1
    # Forefoot: P4 + P5 + P6
    # Lateral: P2 + P4
    # Medial: P3 + P5
    heel_sum = P1
    forefoot_sum = P4 + P5 + P6
    lateral_sum = P2 + P4
    medial_sum = P3 + P5

    heel_mean = float(np.mean(heel_sum))
    forefoot_mean = float(np.mean(forefoot_sum))

    heel_forefoot_ratio = float(heel_mean / (forefoot_mean + 1.0))
    medial_lateral_ratio = float(np.mean(medial_sum) / (np.mean(lateral_sum) + 1.0))

    return np.array([
        ax_mean, ax_std,
        ay_mean, ay_std,
        az_mean, az_std,
        gx_mean, gx_std,
        gy_mean, gy_std,
        gz_mean, gz_std,
        svm_acc_mean, svm_acc_max, svm_acc_std,
        svm_gyro_mean, svm_gyro_max,
        force_mean, force_std, force_max,
        heel_forefoot_ratio,
        medial_lateral_ratio,
        heel_mean,
        forefoot_mean
    ], dtype=np.float32)

def extract_dataset_features(df: pd.DataFrame, window_size: int = 50, step_size: int = 25) -> Tuple[np.ndarray, np.ndarray]:
    """
    Slides a window across continuous time-series dataframe and returns (X, y).
    """
    features_list = []
    labels_list = []

    # Process each activity segment independently to prevent window cross-contamination
    grouped = df.groupby((df['activity'] != df['activity'].shift()).cumsum())

    for _, group in grouped:
        activity = group['activity'].iloc[0]
        n_rows = len(group)

        if n_rows < window_size:
            continue

        p1 = group['P1'].values
        p2 = group['P2'].values
        p3 = group['P3'].values
        p4 = group['P4'].values
        p5 = group['P5'].values
        p6 = group['P6'].values
        ax = group['Ax'].values
        ay = group['Ay'].values
        az = group['Az'].values
        gx = group['Gx'].values
        gy = group['Gy'].values
        gz = group['Gz'].values

        for start in range(0, n_rows - window_size + 1, step_size):
            end = start + window_size
            feat = extract_features_from_window(
                p1[start:end], p2[start:end], p3[start:end],
                p4[start:end], p5[start:end], p6[start:end],
                ax[start:end], ay[start:end], az[start:end],
                gx[start:end], gy[start:end], gz[start:end]
            )
            features_list.append(feat)
            labels_list.append(activity)

    X = np.array(features_list, dtype=np.float32)
    y = np.array(labels_list)
    return X, y
