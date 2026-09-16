#!/usr/bin/env python3
"""
StrideSense - Multi-Subject Biomechanical Gait & Fall Synthesizer
Generates realistic 12-channel time-series data (P1..P6, Ax, Ay, Az, Gx, Gy, Gz)
simulating diverse body weights, cadences, walking styles, and fall angles.
"""

import os
import argparse
import numpy as np
import pandas as pd

SAMPLING_RATE = 50.0  # 50 Hz (20ms interval matching ESP32 firmware)
DT = 1.0 / SAMPLING_RATE

# Demographic profiles simulating diverse biomechanics
SUBJECT_PROFILES = [
    {"name": "Subject_A_Normal", "weight_factor": 1.00, "cadence_walk": 106, "cadence_run": 162, "asymmetry": 0.02},
    {"name": "Subject_B_Lightweight", "weight_factor": 0.78, "cadence_walk": 114, "cadence_run": 174, "asymmetry": -0.04},
    {"name": "Subject_C_Heavyweight", "weight_factor": 1.28, "cadence_walk": 96,  "cadence_run": 148, "asymmetry": 0.05},
    {"name": "Subject_D_BriskWalker", "weight_factor": 0.95, "cadence_walk": 122, "cadence_run": 180, "asymmetry": 0.01},
    {"name": "Subject_E_ElderlyGait", "weight_factor": 0.90, "cadence_walk": 88,  "cadence_run": 138, "asymmetry": -0.07},
]

def generate_standing_segment(num_samples: int, start_time: float, profile: dict):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    wf = profile["weight_factor"]
    asym = profile["asymmetry"]

    # Postural sway (0.2 - 0.4 Hz)
    sway = 0.06 * np.sin(2 * np.pi * 0.28 * t)
    base_force = 1900.0 * wf

    P1 = np.clip(base_force * (0.54 + sway + asym) + np.random.normal(0, 25, num_samples), 0, 4095)
    P2 = np.clip(base_force * (0.16 + 0.4 * sway + asym) + np.random.normal(0, 15, num_samples), 0, 4095)
    P3 = np.clip(base_force * (0.13 - 0.4 * sway - asym) + np.random.normal(0, 15, num_samples), 0, 4095)
    P4 = np.clip(base_force * (0.22 - sway + asym) + np.random.normal(0, 20, num_samples), 0, 4095)
    P5 = np.clip(base_force * (0.25 - sway - asym) + np.random.normal(0, 20, num_samples), 0, 4095)
    P6 = np.clip(base_force * (0.10 - 0.3 * sway) + np.random.normal(0, 15, num_samples), 0, 4095)

    Ax = np.random.normal(0.02, 0.03, num_samples)
    Ay = np.random.normal(0.01, 0.03, num_samples)
    Az = 1.0 + np.random.normal(0.0, 0.04, num_samples)

    Gx = np.random.normal(0.0, 1.4, num_samples)
    Gy = np.random.normal(0.0, 1.4, num_samples)
    Gz = np.random.normal(0.0, 0.9, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Standing"
    })

def generate_walking_segment(num_samples: int, start_time: float, profile: dict):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    wf = profile["weight_factor"]
    spm = profile["cadence_walk"]
    freq = (spm / 120.0) # Stride frequency in Hz
    phase = 2 * np.pi * freq * t

    P1 = np.zeros(num_samples)
    P2 = np.zeros(num_samples)
    P3 = np.zeros(num_samples)
    P4 = np.zeros(num_samples)
    P5 = np.zeros(num_samples)
    P6 = np.zeros(num_samples)

    for i in range(num_samples):
        cycle_pos = (phase[i] / (2 * np.pi)) % 1.0
        if cycle_pos < 0.60: # Stance phase
            P1[i] = np.exp(-((cycle_pos - 0.10) ** 2) / 0.0032) * (2850 * wf)
            P2[i] = np.exp(-((cycle_pos - 0.22) ** 2) / 0.0045) * (1350 * wf)
            P3[i] = np.exp(-((cycle_pos - 0.24) ** 2) / 0.0045) * (1100 * wf)
            P4[i] = np.exp(-((cycle_pos - 0.38) ** 2) / 0.0060) * (2650 * wf)
            P5[i] = np.exp(-((cycle_pos - 0.40) ** 2) / 0.0060) * (3150 * wf)
            P6[i] = np.exp(-((cycle_pos - 0.50) ** 2) / 0.0035) * (2400 * wf)
        else: # Swing phase
            P1[i] = 12; P2[i] = 6; P3[i] = 6; P4[i] = 8; P5[i] = 8; P6[i] = 5

    P1 = np.clip(P1 + np.random.normal(0, 30, num_samples), 0, 4095)
    P2 = np.clip(P2 + np.random.normal(0, 20, num_samples), 0, 4095)
    P3 = np.clip(P3 + np.random.normal(0, 20, num_samples), 0, 4095)
    P4 = np.clip(P4 + np.random.normal(0, 30, num_samples), 0, 4095)
    P5 = np.clip(P5 + np.random.normal(0, 30, num_samples), 0, 4095)
    P6 = np.clip(P6 + np.random.normal(0, 25, num_samples), 0, 4095)

    # IMU Kinematics
    Ax = 0.28 * np.sin(phase) + np.random.normal(0, 0.06, num_samples)
    Ay = 0.58 * np.sin(phase + np.pi / 4) + np.random.normal(0, 0.08, num_samples)
    Az = 1.0 + 0.68 * np.sin(2 * phase) + np.random.normal(0, 0.09, num_samples)

    Gx = 32.0 * np.cos(phase) + np.random.normal(0, 5, num_samples)
    Gy = 185.0 * np.sin(phase) + np.random.normal(0, 10, num_samples)
    Gz = 42.0 * np.cos(phase + np.pi / 3) + np.random.normal(0, 5, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Walking"
    })

def generate_running_segment(num_samples: int, start_time: float, profile: dict):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    wf = profile["weight_factor"]
    spm = profile["cadence_run"]
    freq = (spm / 120.0)
    phase = 2 * np.pi * freq * t

    P1 = np.zeros(num_samples)
    P2 = np.zeros(num_samples)
    P3 = np.zeros(num_samples)
    P4 = np.zeros(num_samples)
    P5 = np.zeros(num_samples)
    P6 = np.zeros(num_samples)

    for i in range(num_samples):
        cycle_pos = (phase[i] / (2 * np.pi)) % 1.0
        if cycle_pos < 0.40:
            P1[i] = np.exp(-((cycle_pos - 0.08) ** 2) / 0.0016) * (3650 * wf)
            P2[i] = np.exp(-((cycle_pos - 0.14) ** 2) / 0.0022) * (2150 * wf)
            P3[i] = np.exp(-((cycle_pos - 0.16) ** 2) / 0.0022) * (1850 * wf)
            P4[i] = np.exp(-((cycle_pos - 0.22) ** 2) / 0.0028) * (3850 * wf)
            P5[i] = np.exp(-((cycle_pos - 0.24) ** 2) / 0.0028) * (4080 * wf)
            P6[i] = np.exp(-((cycle_pos - 0.32) ** 2) / 0.0018) * (3450 * wf)
        else:
            P1[i] = 12; P2[i] = 6; P3[i] = 6; P4[i] = 6; P5[i] = 6; P6[i] = 4

    P1 = np.clip(P1 + np.random.normal(0, 40, num_samples), 0, 4095)
    P2 = np.clip(P2 + np.random.normal(0, 30, num_samples), 0, 4095)
    P3 = np.clip(P3 + np.random.normal(0, 30, num_samples), 0, 4095)
    P4 = np.clip(P4 + np.random.normal(0, 40, num_samples), 0, 4095)
    P5 = np.clip(P5 + np.random.normal(0, 40, num_samples), 0, 4095)
    P6 = np.clip(P6 + np.random.normal(0, 35, num_samples), 0, 4095)

    Ax = 0.70 * np.sin(phase) + np.random.normal(0, 0.12, num_samples)
    Ay = 1.40 * np.sin(phase + np.pi / 3) + np.random.normal(0, 0.18, num_samples)
    Az = 1.0 + 1.95 * np.sin(2 * phase) + np.random.normal(0, 0.22, num_samples)

    Gx = 80.0 * np.cos(phase) + np.random.normal(0, 12, num_samples)
    Gy = 390.0 * np.sin(phase) + np.random.normal(0, 22, num_samples)
    Gz = 95.0 * np.cos(phase + np.pi / 4) + np.random.normal(0, 15, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Running"
    })

def generate_sitting_segment(num_samples: int, start_time: float, profile: dict):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    P1 = np.clip(np.random.normal(120, 20, num_samples), 0, 4095)
    P2 = np.clip(np.random.normal(60, 15, num_samples), 0, 4095)
    P3 = np.clip(np.random.normal(50, 15, num_samples), 0, 4095)
    P4 = np.clip(np.random.normal(90, 18, num_samples), 0, 4095)
    P5 = np.clip(np.random.normal(105, 18, num_samples), 0, 4095)
    P6 = np.clip(np.random.normal(70, 15, num_samples), 0, 4095)

    Ax = np.random.normal(0.01, 0.02, num_samples)
    Ay = np.random.normal(0.01, 0.02, num_samples)
    Az = 0.99 + np.random.normal(0.0, 0.02, num_samples)

    Gx = np.random.normal(0.0, 0.8, num_samples)
    Gy = np.random.normal(0.0, 0.8, num_samples)
    Gz = np.random.normal(0.0, 0.6, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Sitting"
    })

def generate_fall_segment(num_samples: int, start_time: float, profile: dict, fall_type: str = "forward_slip"):
    df = generate_standing_segment(num_samples, start_time, profile)

    fall_idx = int(num_samples * 0.35)
    ff_duration = int(0.16 * SAMPLING_RATE)
    impact_duration = int(0.16 * SAMPLING_RATE)

    pre_idx = max(0, fall_idx - int(0.45 * SAMPLING_RATE))
    for i in range(pre_idx, fall_idx):
        df.loc[i, "Gy"] += np.random.uniform(140, 260)
        df.loc[i, "Gx"] += np.random.uniform(80, 160)
        df.loc[i, "Ay"] += 0.45

    for i in range(fall_idx, fall_idx + ff_duration):
        df.loc[i, "Ax"] = np.random.normal(0.04, 0.04)
        df.loc[i, "Ay"] = np.random.normal(0.04, 0.04)
        df.loc[i, "Az"] = np.random.normal(0.18, 0.06) # < 0.4g free fall
        df.loc[i, ["P1", "P2", "P3", "P4", "P5", "P6"]] = np.random.randint(10, 50)

    impact_start = fall_idx + ff_duration
    for i in range(impact_start, impact_start + impact_duration):
        df.loc[i, "Ax"] = np.random.normal(2.2, 0.35)
        df.loc[i, "Ay"] = np.random.normal(2.6, 0.4)
        df.loc[i, "Az"] = np.random.normal(4.5, 0.6) # > 3.5g peak shock
        df.loc[i, "Gx"] = np.random.normal(280, 45)
        df.loc[i, "Gy"] = np.random.normal(350, 55)
        df.loc[i, "P1"] = np.random.randint(3600, 4095)
        df.loc[i, "P2"] = np.random.randint(3400, 4095)
        df.loc[i, "P4"] = np.random.randint(3000, 4000)

    rest_start = impact_start + impact_duration
    for i in range(rest_start, num_samples):
        df.loc[i, "Ax"] = 0.88 + np.random.normal(0, 0.02)
        df.loc[i, "Ay"] = 0.15 + np.random.normal(0, 0.02)
        df.loc[i, "Az"] = 0.22 + np.random.normal(0, 0.02)
        df.loc[i, "Gx"] = np.random.normal(0, 0.5)
        df.loc[i, "Gy"] = np.random.normal(0, 0.5)
        df.loc[i, "Gz"] = np.random.normal(0, 0.4)
        df.loc[i, "P1"] = np.random.randint(200, 450)
        df.loc[i, "P2"] = np.random.randint(550, 950)
        df.loc[i, "P3"] = np.random.randint(50, 150)
        df.loc[i, "P4"] = np.random.randint(500, 900)
        df.loc[i, "P5"] = np.random.randint(60, 180)
        df.loc[i, "P6"] = np.random.randint(40, 120)

    df["activity"] = "Fall"
    return df

def generate_multi_subject_dataset(total_samples: int):
    samples_per_subject = total_samples // len(SUBJECT_PROFILES)
    all_dfs = []
    current_time = 0.0

    print(f"Generating multi-subject dataset across {len(SUBJECT_PROFILES)} demographic profiles...")

    for prof in SUBJECT_PROFILES:
        print(f" -> Subject: {prof['name']} (Weight: {prof['weight_factor']}x, Walk: {prof['cadence_walk']} SPM, Run: {prof['cadence_run']} SPM)")
        n_walk = int(samples_per_subject * 0.35)
        n_stand = int(samples_per_subject * 0.20)
        n_run = int(samples_per_subject * 0.20)
        n_sit = int(samples_per_subject * 0.15)
        n_fall = int(samples_per_subject * 0.10)

        df_walk = generate_walking_segment(n_walk, current_time, prof); current_time += n_walk * DT
        df_stand = generate_standing_segment(n_stand, current_time, prof); current_time += n_stand * DT
        df_run = generate_running_segment(n_run, current_time, prof); current_time += n_run * DT
        df_sit = generate_sitting_segment(n_sit, current_time, prof); current_time += n_sit * DT

        # Fall episodes of ~400 samples each
        ep_len = int(8.0 * SAMPLING_RATE)
        episodes = max(1, n_fall // ep_len)
        fall_list = []
        for _ in range(episodes):
            fall_list.append(generate_fall_segment(ep_len, current_time, prof))
            current_time += ep_len * DT
        rem = n_fall - (episodes * ep_len)
        if rem > 0:
            fall_list.append(generate_fall_segment(rem, current_time, prof))
            current_time += rem * DT
        df_fall = pd.concat(fall_list, ignore_index=True)

        subj_df = pd.concat([df_walk, df_stand, df_run, df_sit, df_fall], ignore_index=True)
        all_dfs.append(subj_df)

    master_df = pd.concat(all_dfs, ignore_index=True)
    return master_df

def main():
    parser = argparse.ArgumentParser(description="Multi-Subject Gait & Fall Synthesizer")
    parser.add_argument("--samples", type=int, default=25000, help="Total samples to synthesize")
    parser.add_argument("--output", type=str, default="datasets/stridesense_master_dataset.csv", help="Output path")
    args = parser.parse_args()

    df = generate_multi_subject_dataset(args.samples)
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"\nGenerated {len(df)} multi-subject samples ({len(df) * DT:.1f} seconds of data) saved to {args.output}")
    print("\nActivity Breakdown:")
    print(df["activity"].value_counts())

if __name__ == "__main__":
    main()
