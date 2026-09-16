# StrideSense 👣
### AI-Powered Smart Insole for Gait Analysis and Fall Detection

[![Platform](https://img.shields.io/badge/Microcontroller-ESP32-blue.svg)](https://www.espressif.com/)
[![Sensors](https://img.shields.io/badge/Sensors-FSR%20%2B%20MPU6050-orange.svg)]()
[![AI](https://img.shields.io/badge/Edge%20AI-TinyML%20%2F%20TensorFlow%20Lite-green.svg)]()
[![Cloud](https://img.shields.io/badge/Cloud-Firebase-yellow.svg)](https://firebase.google.com/)
[![Dashboard](https://img.shields.io/badge/Dashboard-React%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)

StrideSense is an integrated IoT and Edge-AI medical and fitness device that fits into standard footwear to continuously monitor plantar foot pressure distribution, kinematic movement, gait anomalies, and emergency fall events.

---

## 🌟 Key Features

1. **Plantar Pressure Sensing**: 6 calibrated Force Sensitive Resistors (FSRs) measuring pressure at key anatomical landmarks (Heel, Midfoot Medial/Lateral, Forefoot/Metatarsals, and Hallux).
2. **6-DOF Kinematic Tracking**: MPU6050 IMU tracking 3D linear acceleration ($A_x, A_y, A_z$) and rotational velocity ($G_x, G_y, G_z$).
3. **Edge-AI / TinyML Activity Classification**: Real-time classification on the ESP32 for Standing, Walking, Running, Sitting, and Fall anomalies.
4. **Dual-Trigger Fall Detection**: Combines free-fall acceleration thresholding ($< 0.6g$), high-impact shock detection ($> 2.8g$), rapid angular tilt, and post-fall immobility with edge ML validation.
5. **Interactive Telemetry Dashboard**: Real-time 2D/3D interpolated foot pressure heatmaps, cadence gauge, gait symmetry index, and emergency cancellation countdown modal.
6. **Biomechanical Gait Synthesizer**: High-fidelity 12-channel time-series simulation engine for benchmark testing without connected hardware.

---

## 📐 System Architecture

```
                    STRIDESENSE SYSTEM
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
  HARDWARE LAYER                          SOFTWARE LAYER
 ┌───────────────┐                       ┌───────────────┐
 │ 6x FSR Sensors│                       │ Firmware (C++)│
 │ MPU6050 (IMU) │                       │ TinyML Engine │
 │ ESP32 Module  │                       │ ML Training   │
 │ Battery + LED │                       │ Web Dashboard │
 └───────┬───────┘                       └───────┬───────┘
         │                                       │
         └───────────────────┬───────────────────┘
                             ▼
                    ESP32 EDGE COMPUTING
                 (Windowing & Feature Vector)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   Activity Recognition                 Fall Detection
    (TinyML Inference)              (Heuristic + Anomaly)
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                     Wi-Fi / Firebase
                             │
                             ▼
                 REAL-TIME WEB DASHBOARD
        (Heatmaps, Gait Analytics, SOS Alerts)
```

---

## 📂 Project Structure

```
StrideSense/
├── datasets/            # Public dataset guides, automated downloaders, and biomechanical synthesizer
├── ml/                  # Feature extraction, model training, evaluation, and C-header exporter
├── firmware/            # Modular ESP32 Arduino C++ firmware and TinyML runtime
├── dashboard/           # Modern React + Vite web dashboard with live pressure heatmap
├── docs/                # Hardware wiring schematics, pinout diagrams, and calibration guide
└── StrideSense – Complete Project Master.docx
```

---

## 🚀 Quick Start

### 1. Generate Datasets & Train Machine Learning Model
```bash
# Generate synthetic biomechanical dataset
python3 datasets/gait_synthesizer.py --samples 6000 --output datasets/synthetic_gait.csv

# Extract features, train Random Forest / CNN, and export C header for ESP32
python3 ml/train_model.py --dataset datasets/synthetic_gait.csv --export firmware/StrideSense_Firmware/model_data.h
```

### 2. Run the Web Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### 3. Flash ESP32 Firmware
Open `firmware/StrideSense_Firmware/StrideSense_Firmware.ino` in Arduino IDE or VS Code PlatformIO, set your Wi-Fi credentials in `config.h`, and upload to your ESP32 board.
