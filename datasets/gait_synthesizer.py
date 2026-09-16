#!/usr/bin/env python3
"""
StrideSense - High-Fidelity Biomechanical Gait & Fall Synthesizer
Generates realistic 12-channel time-series data for Smart Insole pressure (P1..P6)
and 6-DOF IMU (Ax, Ay, Az, Gx, Gy, Gz) across 5 activity classes.
"""

import os
import argparse
import numpy as np
import pandas as pd

SAMPLING_RATE = 50.0  # 50 Hz (20ms interval matching ESP32 firmware)
DT = 1.0 / SAMPLING_RATE

def generate_standing(num_samples: int, start_time: float):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    # Subtle postural sway (0.2 - 0.4 Hz)
    sway = 0.05 * np.sin(2 * np.pi * 0.25 * t)

    # 12-bit ADC range (0 - 4095)
    # Standing distributes ~55% heel, ~45% forefoot
    base_force = 1800.0
    P1 = np.clip(base_force * (0.55 + sway) + np.random.normal(0, 25, num_samples), 0, 4095)
    P2 = np.clip(base_force * (0.15 + 0.5 * sway) + np.random.normal(0, 15, num_samples), 0, 4095)
    P3 = np.clip(base_force * (0.12 - 0.5 * sway) + np.random.normal(0, 15, num_samples), 0, 4095)
    P4 = np.clip(base_force * (0.22 - sway) + np.random.normal(0, 20, num_samples), 0, 4095)
    P5 = np.clip(base_force * (0.25 - sway) + np.random.normal(0, 20, num_samples), 0, 4095)
    P6 = np.clip(base_force * (0.10 - 0.5 * sway) + np.random.normal(0, 15, num_samples), 0, 4095)

    # IMU: 1g vertical on Z axis, near 0 on X and Y
    Ax = np.random.normal(0.02, 0.03, num_samples)
    Ay = np.random.normal(0.01, 0.03, num_samples)
    Az = 1.0 + np.random.normal(0.0, 0.04, num_samples)

    Gx = np.random.normal(0.0, 1.2, num_samples)
    Gy = np.random.normal(0.0, 1.2, num_samples)
    Gz = np.random.normal(0.0, 0.8, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Standing"
    })

def generate_walking(num_samples: int, start_time: float):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    # Cadence: ~105 steps/min -> ~1.75 steps/s (stride frequency ~0.875 Hz per foot)
    freq = 0.90
    phase = 2 * np.pi * freq * t

    # Stance phase is ~60% of stride, swing phase is ~40%
    # Stance: force curve passes from heel (P1) -> mid (P2/P3) -> forefoot (P4/P5) -> toe (P6)
    P1 = np.zeros(num_samples)
    P2 = np.zeros(num_samples)
    P3 = np.zeros(num_samples)
    P4 = np.zeros(num_samples)
    P5 = np.zeros(num_samples)
    P6 = np.zeros(num_samples)

    for i in range(num_samples):
        # Normalized cycle position in [0, 1)
        cycle_pos = (phase[i] / (2 * np.pi)) % 1.0

        if cycle_pos < 0.60: # Stance phase
            # Heel strike at cycle_pos: 0.0 - 0.20
            p1_val = np.exp(-((cycle_pos - 0.10) ** 2) / (2 * 0.04 ** 2)) * 2900
            # Midfoot at cycle_pos: 0.15 - 0.35
            p2_val = np.exp(-((cycle_pos - 0.22) ** 2) / (2 * 0.05 ** 2)) * 1400
            p3_val = np.exp(-((cycle_pos - 0.24) ** 2) / (2 * 0.05 ** 2)) * 1100
            # Forefoot at cycle_pos: 0.25 - 0.48
            p4_val = np.exp(-((cycle_pos - 0.38) ** 2) / (2 * 0.06 ** 2)) * 2600
            p5_val = np.exp(-((cycle_pos - 0.40) ** 2) / (2 * 0.06 ** 2)) * 3100
            # Big toe-off at cycle_pos: 0.42 - 0.58
            p6_val = np.exp(-((cycle_pos - 0.50) ** 2) / (2 * 0.04 ** 2)) * 2300

            P1[i] = p1_val
            P2[i] = p2_val
            P3[i] = p3_val
            P4[i] = p4_val
            P5[i] = p5_val
            P6[i] = p6_val
        else:
            # Swing phase: foot airborne (minimal residual baseline)
            P1[i] = 10
            P2[i] = 5
            P3[i] = 5
            P4[i] = 8
            P5[i] = 8
            P6[i] = 5

    P1 = np.clip(P1 + np.random.normal(0, 30, num_samples), 0, 4095)
    P2 = np.clip(P2 + np.random.normal(0, 20, num_samples), 0, 4095)
    P3 = np.clip(P3 + np.random.normal(0, 20, num_samples), 0, 4095)
    P4 = np.clip(P4 + np.random.normal(0, 30, num_samples), 0, 4095)
    P5 = np.clip(P5 + np.random.normal(0, 30, num_samples), 0, 4095)
    P6 = np.clip(P6 + np.random.normal(0, 25, num_samples), 0, 4095)

    # IMU Kinematics during walking
    Ax = 0.25 * np.sin(phase) + np.random.normal(0, 0.06, num_samples)
    Ay = 0.55 * np.sin(phase + np.pi / 4) + np.random.normal(0, 0.08, num_samples)
    Az = 1.0 + 0.65 * np.sin(2 * phase) + np.random.normal(0, 0.09, num_samples)

    Gx = 30.0 * np.cos(phase) + np.random.normal(0, 5, num_samples)
    Gy = 180.0 * np.sin(phase) + np.random.normal(0, 10, num_samples) # Sagittal pitch swing
    Gz = 40.0 * np.cos(phase + np.pi / 3) + np.random.normal(0, 5, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Walking"
    })

def generate_running(num_samples: int, start_time: float):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    # Running: Cadence ~165 steps/min -> frequency ~1.37 Hz per foot
    freq = 1.35
    phase = 2 * np.pi * freq * t

    P1 = np.zeros(num_samples)
    P2 = np.zeros(num_samples)
    P3 = np.zeros(num_samples)
    P4 = np.zeros(num_samples)
    P5 = np.zeros(num_samples)
    P6 = np.zeros(num_samples)

    for i in range(num_samples):
        cycle_pos = (phase[i] / (2 * np.pi)) % 1.0
        # Running stance is much shorter (~40% of stride) and explosive
        if cycle_pos < 0.40:
            p1_val = np.exp(-((cycle_pos - 0.08) ** 2) / (2 * 0.025 ** 2)) * 3600
            p2_val = np.exp(-((cycle_pos - 0.14) ** 2) / (2 * 0.03 ** 2)) * 2100
            p3_val = np.exp(-((cycle_pos - 0.16) ** 2) / (2 * 0.03 ** 2)) * 1800
            p4_val = np.exp(-((cycle_pos - 0.22) ** 2) / (2 * 0.035 ** 2)) * 3800
            p5_val = np.exp(-((cycle_pos - 0.24) ** 2) / (2 * 0.035 ** 2)) * 4050
            p6_val = np.exp(-((cycle_pos - 0.32) ** 2) / (2 * 0.028 ** 2)) * 3400

            P1[i] = p1_val
            P2[i] = p2_val
            P3[i] = p3_val
            P4[i] = p4_val
            P5[i] = p5_val
            P6[i] = p6_val
        else:
            P1[i] = 10
            P2[i] = 5
            P3[i] = 5
            P4[i] = 5
            P5[i] = 5
            P6[i] = 5

    P1 = np.clip(P1 + np.random.normal(0, 45, num_samples), 0, 4095)
    P2 = np.clip(P2 + np.random.normal(0, 30, num_samples), 0, 4095)
    P3 = np.clip(P3 + np.random.normal(0, 30, num_samples), 0, 4095)
    P4 = np.clip(P4 + np.random.normal(0, 45, num_samples), 0, 4095)
    P5 = np.clip(P5 + np.random.normal(0, 45, num_samples), 0, 4095)
    P6 = np.clip(P6 + np.random.normal(0, 40, num_samples), 0, 4095)

    # Higher kinematic accelerations (up to 2.5g) and rapid rotation (up to 450 deg/s)
    Ax = 0.65 * np.sin(phase) + np.random.normal(0, 0.12, num_samples)
    Ay = 1.35 * np.sin(phase + np.pi / 3) + np.random.normal(0, 0.18, num_samples)
    Az = 1.0 + 1.85 * np.sin(2 * phase) + np.random.normal(0, 0.22, num_samples)

    Gx = 75.0 * np.cos(phase) + np.random.normal(0, 12, num_samples)
    Gy = 380.0 * np.sin(phase) + np.random.normal(0, 22, num_samples)
    Gz = 90.0 * np.cos(phase + np.pi / 4) + np.random.normal(0, 15, num_samples)

    return pd.DataFrame({
        "timestamp": np.round(time_series, 3),
        "P1": P1.astype(int), "P2": P2.astype(int), "P3": P3.astype(int),
        "P4": P4.astype(int), "P5": P5.astype(int), "P6": P6.astype(int),
        "Ax": np.round(Ax, 4), "Ay": np.round(Ay, 4), "Az": np.round(Az, 4),
        "Gx": np.round(Gx, 2), "Gy": np.round(Gy, 2), "Gz": np.round(Gz, 2),
        "activity": "Running"
    })

def generate_sitting(num_samples: int, start_time: float):
    t = np.arange(num_samples) * DT
    time_series = start_time + t

    # Sitting: foot resting lightly on ground without supporting bodyweight
    # All sensors read minimal baseline (< 350)
    P1 = np.clip(np.random.normal(120, 20, num_samples), 0, 4095)
    P2 = np.clip(np.random.normal(60, 15, num_samples), 0, 4095)
    P3 = np.clip(np.random.normal(50, 15, num_samples), 0, 4095)
    P4 = np.clip(np.random.normal(90, 18, num_samples), 0, 4095)
    P5 = np.clip(np.random.normal(105, 18, num_samples), 0, 4095)
    P6 = np.clip(np.random.normal(70, 15, num_samples), 0, 4095)

    # Stationary IMU
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

def generate_fall(num_samples: int, start_time: float):
    """
    Simulates a multi-phase fall event:
    1. Pre-fall loss of balance (high gyro, abnormal tilt) ~ 0.5s
    2. Free-fall drop (total acceleration < 0.5g) ~ 0.15s
    3. High-G impact collision (shock > 3.5g, pressure surge) ~ 0.15s
    4. Post-fall immobility (foot resting on side/tilt, Az ~ 0.2g, Ax ~ 0.9g, no motion) ~ rest
    """
    df = generate_standing(num_samples, start_time)

    # Place fall event in middle third of segment
    fall_idx = int(num_samples * 0.35)
    ff_duration = int(0.15 * SAMPLING_RATE) # ~7 samples
    impact_duration = int(0.15 * SAMPLING_RATE) # ~7 samples

    # Phase 1: Pre-fall balance loss (0.4s before fall)
    pre_idx = max(0, fall_idx - int(0.4 * SAMPLING_RATE))
    for i in range(pre_idx, fall_idx):
        df.loc[i, "Gy"] += np.random.uniform(120, 240)
        df.loc[i, "Gx"] += np.random.uniform(70, 150)
        df.loc[i, "Ay"] += 0.4

    # Phase 2: Free-fall drop (total acceleration drops near 0)
    for i in range(fall_idx, fall_idx + ff_duration):
        df.loc[i, "Ax"] = np.random.normal(0.05, 0.05)
        df.loc[i, "Ay"] = np.random.normal(0.05, 0.05)
        df.loc[i, "Az"] = np.random.normal(0.20, 0.08) # < 0.5g
        # Foot losing contact during airborne drop
        df.loc[i, ["P1", "P2", "P3", "P4", "P5", "P6"]] = np.random.randint(10, 60)

    # Phase 3: Impact shock spike
    impact_start = fall_idx + ff_duration
    for i in range(impact_start, impact_start + impact_duration):
        df.loc[i, "Ax"] = np.random.normal(1.8, 0.3)
        df.loc[i, "Ay"] = np.random.normal(2.5, 0.4)
        df.loc[i, "Az"] = np.random.normal(4.2, 0.6) # > 3.5g peak
        df.loc[i, "Gx"] = np.random.normal(250, 40)
        df.loc[i, "Gy"] = np.random.normal(320, 50)
        # Violently high impact pressure on lateral foot & heel
        df.loc[i, "P1"] = np.random.randint(3500, 4095)
        df.loc[i, "P2"] = np.random.randint(3200, 4095)
        df.loc[i, "P4"] = np.random.randint(2800, 3900)

    # Phase 4: Post-fall rest on ground (altered orientation, immobility)
    rest_start = impact_start + impact_duration
    for i in range(rest_start, num_samples):
        # Foot tilted on side: X-axis now experiences gravity (~0.9g), Z-axis ~0.2g
        df.loc[i, "Ax"] = 0.88 + np.random.normal(0, 0.02)
        df.loc[i, "Ay"] = 0.15 + np.random.normal(0, 0.02)
        df.loc[i, "Az"] = 0.22 + np.random.normal(0, 0.02)
        df.loc[i, "Gx"] = np.random.normal(0, 0.5)
        df.loc[i, "Gy"] = np.random.normal(0, 0.5)
        df.loc[i, "Gz"] = np.random.normal(0, 0.4)
        # Resting sideways: lateral sensors P2, P4 lightly compressed
        df.loc[i, "P1"] = np.random.randint(200, 450)
        df.loc[i, "P2"] = np.random.randint(500, 900)
        df.loc[i, "P3"] = np.random.randint(50, 150)
        df.loc[i, "P4"] = np.random.randint(450, 850)
        df.loc[i, "P5"] = np.random.randint(60, 180)
        df.loc[i, "P6"] = np.random.randint(40, 120)

    df["activity"] = "Fall"
    return df

def generate_full_dataset(total_samples: int):
    # Proportions: Standing (20%), Walking (35%), Running (20%), Sitting (15%), Fall (10%)
    counts = {
        "Standing": int(total_samples * 0.20),
        "Walking": int(total_samples * 0.35),
        "Running": int(total_samples * 0.20),
        "Sitting": int(total_samples * 0.15),
        "Fall": int(total_samples * 0.10)
    }

    chunks = []
    current_time = 0.0

    print("Generating synthetic biomechanical gait segments...")
    for activity, n in counts.items():
        print(f" - {activity}: {n} samples ({n * DT:.1f} seconds)")
        if activity == "Standing":
            chunk = generate_standing(n, current_time)
        elif activity == "Walking":
            chunk = generate_walking(n, current_time)
        elif activity == "Running":
            chunk = generate_running(n, current_time)
        elif activity == "Sitting":
            chunk = generate_sitting(n, current_time)
        elif activity == "Fall":
            # For falls, split into multiple realistic fall episodes
            episode_len = int(8.0 * SAMPLING_RATE) # 8-second episodes (400 samples)
            episodes = max(1, n // episode_len)
            fall_chunks = []
            ep_time = current_time
            for _ in range(episodes):
                fall_chunks.append(generate_fall(episode_len, ep_time))
                ep_time += episode_len * DT
            rem = n - (episodes * episode_len)
            if rem > 0:
                fall_chunks.append(generate_fall(rem, ep_time))
            chunk = pd.concat(fall_chunks, ignore_index=True)

        chunks.append(chunk)
        current_time += n * DT

    full_df = pd.concat(chunks, ignore_index=True)
    return full_df

def main():
    parser = argparse.ArgumentParser(description="StrideSense Biomechanical Gait Synthesizer")
    parser.add_argument("--samples", type=int, default=8000, help="Total number of 50 Hz samples to generate")
    parser.add_argument("--output", type=str, default="datasets/synthetic_gait.csv", help="Output CSV path")
    args = parser.parse_args()

    df = generate_full_dataset(args.samples)
    out_dir = os.path.dirname(os.path.abspath(args.output))
    os.makedirs(out_dir, exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"\nSuccessfully generated {len(df)} samples saved to: {args.output}")
    print("\nActivity distribution:")
    print(df["activity"].value_counts())

if __name__ == "__main__":
    main()
