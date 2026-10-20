# 🗺️ StrideSense — Codebase Ownership & Individual Contribution Map

> **Complete File-by-File Attribution Across the 4-Layer Internet of Things (IoT) Technology Stack**  
> **Course**: Internet of Things (IoT) Engineering  
> **Workload Distribution**: Exactly 25% Equal Share per Team Member (100% Total)

---

## 👥 Summary of IoT Architecture & Member Allocations

```
+---------------------------------------------------------------------------------------------------------+
|                                  STRIDESENSE 4-LAYER IoT STACK OVERVIEW                                 |
+---------------------------------------------------------------------------------------------------------+
|  LAYER 4: APPLICATION & CLOUD LAYER             ==> AKSHAR SAKHI (25%)                                  |
|  - Mobile App (React 19 + Capacitor iOS/Android) - Apple Watch App (watchOS 9+ SwiftUI)                |
|  - Supabase Realtime Telemetry & WebSockets      - Cloud Incident Audit Log & SOS Dispatch              |
+---------------------------------------------------------------------------------------------------------+
|  LAYER 3: EDGE AI & TINYML INTELLIGENCE LAYER   ==> DIYA BHAT (25%)                                     |
|  - 24-Feature Kinematic Vector Extraction        - Neural Decision Forest Training (98.97% Acc)         |
|  - Multi-Class Gait Classifier Pipeline          - Embedded C Inference Engine (tinyml_infer.h, <0.3 µs)|
+---------------------------------------------------------------------------------------------------------+
|  LAYER 2: EDGE COMPUTING & EMBEDDED ACTUATION   ==> SIDDHARTHA LADDA (25%)                               |
|  - ESP32 Dual-Core C++ Firmware (50 Hz RTOS)     - Dual-Trigger Fall Detection State Machine            |
|  - Tare Baseline Calibration & GPIO34 Tuning     - NPN Transistor Haptic Actuator Circuit               |
+---------------------------------------------------------------------------------------------------------+
|  LAYER 1: PERCEPTION & PHYSICAL SENSING LAYER   ==> NISHANTH S GOWDA (25%)                               |
|  - Bilateral Insole 4x FSR Sensor Matrix         - 10 kΩ Precision Voltage Divider Conditioning         |
|  - MPU-6050 6-Axis IMU (400 kHz Fast I2C Bus)    - Insole Mechanical Prototyping & Arch Wire Loom       |
+---------------------------------------------------------------------------------------------------------+
```

---

## 1. 🔌 Nishanth S Gowda — Layer 1: Perception & Physical Sensing (25%)

### Core Engineering Focus
- **Transducer Interfacing & Signal Conditioning**: Design, fabrication, and wiring of bilateral foot insoles equipped with 4x Force-Sensitive Resistors (FSR-402 square) and 10 kΩ precision pull-down voltage dividers.
- **Inertial Measurement Bus**: Hardware integration of the MPU-6050 6-DOF IMU over a 400 kHz Fast-Mode I2C bus with dedicated pull-ups on GPIO 21 (SDA) and GPIO 22 (SCL).
- **Mechanical Packaging & Wire Routing**: Low-profile medial arch ribbon wiring loom, zero-pressure cut-to-size EVA substrate mounting, and ankle-strap wearable enclosure.
- **Power Subsystem**: 3.7V 1000 mAh rechargeable LiPo battery integration with TP4056 USB charging and low-dropout 3.3V regulation.

### 📁 Owned Code & Hardware Specification Files

| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`docs/HARDWARE_CIRCUIT.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/HARDWARE_CIRCUIT.md) | **Electrical Schematics & Pinout** | Master circuit schematic, 38-Pin NodeMCU pinout assignments, voltage divider formulas ($V_{out} = 3.3 \times \frac{10\text{k}\Omega}{R_{FSR} + 10\text{k}\Omega}$), and wiring instructions. |
| [`docs/BILATERAL_CIRCUIT_DIAGRAMS.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/BILATERAL_CIRCUIT_DIAGRAMS.md) | **Bilateral Sensor Layouts** | Podiatric sensor placement geometry (Metatarsal head & Calcaneus heel), anatomical wire channel routing, and connector specs. |
| [`docs/CALIBRATION_GUIDE.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/CALIBRATION_GUIDE.md) | **Sensor Calibration Manual** | Hardware tare calibration protocol, non-linear resistance-to-force response curve documentation, and bench testing procedure. |
| [`firmware/diagram.json`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/diagram.json) | **Hardware Netlist & Wire Map** | Hardware interconnection diagram and pin-to-sensor electrical netlist. |
| [`firmware/StrideSense_Firmware/sensors.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/sensors.h) | **Sensor Hardware Driver Header** | Hardware abstraction definitions for Left/Right FSRs, MPU-6050 I2C registers (`0x68`), and ADC tare data structures. |
| [`firmware/StrideSense_Firmware/sensors.cpp`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/sensors.cpp) | **Sensor Acquisition & ADC Driver** | Low-level analog ADC sampling routines (12-bit, 0–4095), MPU-6050 accelerometer/gyroscope burst reading, and raw voltage conversion. |
| [`firmware/StrideSense_Firmware/filter.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/filter.h) | **Signal Conditioning Filter Header** | Low-pass filter coefficient definitions and moving average circular buffer structures for sensor noise suppression. |
| [`firmware/StrideSense_Firmware/filter.cpp`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/filter.cpp) | **Signal Smoothing & Anti-Noise** | Exponential Moving Average (EMA) and median filtering implementations to remove high-frequency electrical ADC noise and mechanical vibrations. |

---

## 2. ⚡ Siddhartha Ladda — Layer 2: Edge Computing & Embedded Actuation (25%)

### Core Engineering Focus
- **Embedded C++ Architecture**: Dual-core ESP32 firmware orchestration using a deterministic 50 Hz FreeRTOS timer loop (20 ms period) for synchronous sensor sampling.
- **Dual-Trigger Fall Detection State Machine**: Algorithmic kinematic trigger tracking free-fall weightlessness ($SVM < 0.6g$), high-energy impact shock ($SVM > 2.8g$), and post-fall immobility verification ($< 0.15g$ variance for 2.0 s).
- **Local Haptic Actuation**: Hardware driver circuit for 3.3V coin-type vibration motor using 2N2222 NPN transistor with 1N4148 flyback protection on GPIO 12 for immediate tactile alerts.
- **Hardware ADC Tare Calibration**: Dynamic baseline tare calibration on boot and custom non-linear threshold calibration for Right Heel on GPIO 34 (>2100 ADC contact trigger).

### 📁 Owned Code & Firmware Files

| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`firmware/StrideSense_Firmware/StrideSense_Firmware.ino`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/StrideSense_Firmware.ino) | **Main Firmware Entry Point** | Master ESP32 initialization (`setup()`), FreeRTOS synchronous 50 Hz timer sampling loop (`loop()`), task synchronization, and state coordination. |
| [`firmware/StrideSense_Firmware/config.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/config.h) | **Hardware & Firmware Configuration** | GPIO pin assignments (FSRs 36, 39, 34, 35; I2C 21, 22; Haptic 12), threshold constants, baud rates, and Wi-Fi credential definitions. |
| [`firmware/StrideSense_Firmware/fall_detector.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/fall_detector.h) | **Fall Detector Header** | State machine enum (`IDLE`, `FREE_FALL`, `IMPACT`, `IMMOBILITY`, `FALL_CONFIRMED`), timing windows, and threshold parameters. |
| [`firmware/StrideSense_Firmware/fall_detector.cpp`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/fall_detector.cpp) | **Dual-Trigger Fall State Machine** | Real-time multi-stage fall detection algorithm, windowed kinematic impact validation, false-positive suppression, and haptic trigger activation. |
| [`firmware/StrideSense_Firmware/storage.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/storage.h) | **Non-Volatile Storage Header** | Flash memory structures for offline crash logging and persistent calibration offsets. |
| [`firmware/StrideSense_Firmware/storage.cpp`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/storage.cpp) | **SPIFFS / NVS Flash Handler** | Local non-volatile flash logging for emergency fall incident blackbox audit and device configuration retention across power cycles. |
| [`firmware/upload_esp32.sh`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/upload_esp32.sh) | **Automated Firmware Flasher** | Bash compilation and flashing automation script utilizing `esptool.py` and `arduino-cli`. |
| [`firmware/serial_monitor.sh`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/serial_monitor.sh) | **Serial Debug Monitor** | Terminal serial baud communication script (115200 baud) with real-time ANSI colored logging for live bench testing. |
| [`firmware/StrideSense_Firmware/monitor_esp32.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/monitor_esp32.py) | **Python Serial Diagnostic Utility** | Serial port sniffer that parses live CSV packets, displays live ADC values, and validates Right Heel threshold transitions. |

---

## 3. 🧠 Diya Bhat — Layer 3: Edge AI & TinyML Intelligence (25%)

### Core Engineering Focus
- **Biomechanical Dataset Engineering**: Synthesis and curation of 10,000+ biomechanical gait samples representing 4 distinct clinical movement classes: Normal Gait, Overpronation, Supination, and Asymmetric Limp.
- **24-Dimensional Kinematic Feature Extraction**: Development of the temporal window feature extractor calculating Signal Vector Magnitude (SVM), angular jerk, Spectral Energy, Center of Pressure (COP) sway, and bilateral symmetry ratios.
- **Model Training & Optimization**: Random Forest and Neural Decision Forest training in Scikit-Learn with 5-fold cross-validation, achieving **98.97% classification accuracy**.
- **Embedded C Code Generation**: Automated transpilation of trained machine learning models into zero-dependency, ultra-compact C headers (`tinyml_infer.h`), achieving **sub-0.3 µs inference latency** on the ESP32 with zero heap allocations.

### 📁 Owned Code & Machine Learning Files

| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`datasets/gait_synthesizer.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/datasets/gait_synthesizer.py) | **Biomechanical Gait Generator** | Mathematical generation script simulating realistic plantar force distributions, stance-swing ratios, and IMU kinematics across 4 gait patterns. |
| [`datasets/stridesense_master_dataset.csv`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/datasets/stridesense_master_dataset.csv) | **Primary Training Dataset** | 10,000+ labeled rows of 50 Hz temporal biomechanical records used for TinyML model training and validation. |
| [`datasets/synthetic_gait.csv`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/datasets/synthetic_gait.csv) | **Benchmark Evaluation Dataset** | Clean baseline gait dataset used for cross-validation testing. |
| [`datasets/download_datasets.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/datasets/download_datasets.py) | **PhysioNet / Clinical Ingestion** | Script for downloading and normalizing external clinical gait datasets for model benchmarking. |
| [`ml/feature_extractor.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/feature_extractor.py) | **24-Feature Vector Algorithm** | Mathematical extraction pipeline: Mean, Variance, Peak-to-Peak, SVM, Jerk, COP trajectory, and Bilateral Load Asymmetry Ratio over 1-second rolling windows. |
| [`ml/train_model.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/train_model.py) | **TinyML Model Training Pipeline** | Scikit-Learn training script with hyperparameter grid search, tree pruning for microcontrollers, and 5-fold stratified cross-validation. |
| [`ml/evaluate.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/evaluate.py) | **Model Evaluation & Metrics** | Computes confusion matrices, precision/recall per class, ROC-AUC curves, and generates verification metrics. |
| [`ml/export_c_model.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/export_c_model.py) | **C Header Transpiler Engine** | Python code generator converting trained Decision Forest trees into static, zero-dependency C arrays and branch logic for microcontrollers. |
| [`ml/generate_c_test_vectors.py`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/generate_c_test_vectors.py) | **C Test Vector Generator** | Generates known input-output pairs to test edge inference correctness on the ESP32. |
| [`firmware/StrideSense_Firmware/tinyml_infer.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/tinyml_infer.h) | **Embedded TinyML Header** | Zero-dependency C interface defining the 24-feature input array and `classify_gait()` function. |
| [`firmware/StrideSense_Firmware/tinyml_infer.cpp`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/tinyml_infer.cpp) | **Edge Inference Engine** | Ultra-optimized C implementation of the Decision Forest, executing in `<0.3 µs` on Xtensa LX6 CPU with zero dynamic memory allocation. |
| [`firmware/StrideSense_Firmware/test_inference_c.c`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/test_inference_c.c) | **Standalone C Unit Test** | Native C verification harness ensuring embedded inference outputs match Python Scikit-Learn predictions 1:1. |
| [`ml/TINYML_BENCHMARK_REPORT.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/TINYML_BENCHMARK_REPORT.md) | **Edge AI Benchmark Report** | Technical report documenting inference speed (<0.3 µs), RAM footprint (1.2 KB), Flash consumption (14 KB), and accuracy metrics. |

---

## 4. 🌐 Akshar Sakhi — Layer 4: IoT Network, Cloud & Application Layer (25%)

### Core Engineering Focus
- **IoT Cloud Backend & Database**: Supabase PostgreSQL time-series schema design (`public.telemetry` and `public.fall_incidents`), Realtime Change Data Capture (CDC) over Phoenix WebSockets (<50 ms broadcast latency), and TLS REST endpoints.
- **Firmware Cloud Client**: Embedded C++ HTTPS PostgREST client (`supabase_client.cpp`) on ESP32 streaming real-time sensor packets over Wi-Fi (802.11 b/g/n).
- **Cross-Platform Mobile Application**: Native Capacitor iOS & Android mobile app built with React 19, TailwindCSS, dynamic SVG plantar pedobarography heatmap, Apple Health-grade 7-day mobility rings, and SOS auto-dialer.
- **Native Apple Watch Application**: Standalone watchOS 9+ SwiftUI application with 6 swipeable OLED cards, real-time ESP32 cloud telemetry stream, Taptic Engine wrist haptic fall alarms, and patient profile integration.
- **Biomechanical Patient Profile**: Real-time BMI calculation, stride length estimation, and cloud-synchronized emergency contact management.

### 📁 Owned Code, Mobile & Cloud Files

#### ☁️ Cloud Backend & Firmware Networking
| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`firmware/StrideSense_Firmware/supabase_client.h`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/supabase_client.h) | **ESP32 Cloud Client Header** | Header definitions for HTTPS REST PostgREST client, Wi-Fi reconnect state, and TLS transport. |
| [`firmware/StrideSense_Firmware/supabase_client.cpp`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/supabase_client.cpp) | **ESP32 Cloud Ingestion Client** | Non-blocking HTTP client that serializes 50 Hz sensor buffers into JSON and posts to Supabase `telemetry` table. |
| [`docs/SUPABASE_SCHEMA.sql`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/SUPABASE_SCHEMA.sql) | **PostgreSQL Database Schema** | Database table definitions (`telemetry`, `fall_incidents`, `device_registry`), indexing, RLS security policies, and Realtime publications. |
| [`docs/SUPABASE_INTEGRATION_GUIDE.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/SUPABASE_INTEGRATION_GUIDE.md) | **Cloud Integration Guide** | Comprehensive documentation for PostgREST authentication, table schemas, Realtime WebSocket pub-sub, and testing. |
| [`dashboard/src/services/supabase.js`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/services/supabase.js) | **Web/Mobile Supabase Service** | JavaScript WebSocket connection manager, subscription to postgres_changes, 5-second offline heartbeat detector, and data caching. |
| [`dashboard/src/services/userProfile.js`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/services/userProfile.js) | **Patient Profile & Emergency State** | Manages patient biomechanical data (Akshar Sakhi, 68 kg, 173 cm, BMI 22.7) and emergency contact sync with localStorage/cloud. |

#### 📱 Cross-Platform Mobile Application (React 19 + Capacitor iOS/Android)
| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`dashboard/capacitor.config.json`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/capacitor.config.json) | **Capacitor Native Config** | Native iOS and Android application bridge settings, bundle ID (`com.aksharsakhi.stridesense`), dark status bar, and splash screen. |
| [`dashboard/src/App.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/App.jsx) | **Mobile App State Machine** | Primary React 19 application shell, live telemetry state router, tab bar navigation, and top header with compact battery & device badge. |
| [`dashboard/src/components/HomePage.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/components/HomePage.jsx) | **Mobile Home Dashboard** | 2-row realigned header, live step counter, cadence badge, dynamic activity indicator, and quick-action navigation cards. |
| [`dashboard/src/components/FootHeatmap.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/components/FootHeatmap.jsx) | **Plantar Pedobarography Heatmap** | Bilateral anatomical foot visualization with SVG radial gradient interpolation (Cyan $\to$ Emerald $\to$ Amber $\to$ Coral Red) and balance gauge. |
| [`dashboard/src/components/WalkingProfileAnalysis.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/components/WalkingProfileAnalysis.jsx) | **Gait Biomechanics Lab** | Dynamic Cadence gauge, Stance vs Swing duty cycle breakdown (62%/38%), Left/Right load balance bar, and TinyML gait pattern display. |
| [`dashboard/src/components/FallGuardMobile.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/components/FallGuardMobile.jsx) | **Fall Guard & Emergency SOS** | Armed state indicator, 15-second siren grace countdown modal, `"I'M OK"` cancel button, and one-tap emergency caregiver auto-dialer (`tel:`). |
| [`dashboard/src/components/HealthPage.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/components/HealthPage.jsx) | **Apple Health Mobility Lab** | 7-day activity rings, live synchronized step tracker (1,241 steps), distance in km, active calorie calculation, and clinical report export. |
| [`dashboard/src/components/SettingsPage.jsx`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/src/components/SettingsPage.jsx) | **Biomechanical Profile Editor** | Complete interactive profile editor (Name, Age, Weight, Height, Gender, Shoe Size, Blood Group, live BMI, Stride Length) and editable emergency contacts. |
| [`dashboard/ios/`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/dashboard/ios) | **Native iOS Xcode Project** | Native Xcode workspace (`App.xcworkspace`) compiled and deployed to Akshar's iPhone 13 Pro. |

#### ⌚ Native Apple Watch Application (watchOS 9+ SwiftUI)
| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`StrideSenseWatch/Sources/StrideSenseWatchApp.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/StrideSenseWatchApp.swift) | **watchOS App Entry Point** | `@main` SwiftUI application lifecycle host. |
| [`StrideSenseWatch/Sources/Models/TelemetryData.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Models/TelemetryData.swift) | **Watch Data Model** | Plantar pressures, gait classification enum, online/offline detection attributes, and kinematics state. |
| [`StrideSenseWatch/Sources/Models/PatientProfile.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Models/PatientProfile.swift) | **Patient Profile Model** | Biomechanical profile of Akshar Sakhi, live BMI computation, and estimated stride length. |
| [`StrideSenseWatch/Sources/Services/SupabaseWatchClient.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Services/SupabaseWatchClient.swift) | **Native watchOS Cloud Client** | `URLSession` async/await REST client dedicated to fetching `stridesense_esp32_01` telemetry and dispatching emergency SOS incidents. |
| [`StrideSenseWatch/Sources/Services/HapticManager.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Services/HapticManager.swift) | **Apple Watch Taptic Engine** | Wrist vibration orchestrator triggering `.failure`, `.directionUp`, and `.retry` patterns for urgent fall warnings. |
| [`StrideSenseWatch/Sources/ViewModels/WatchTelemetryViewModel.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/ViewModels/WatchTelemetryViewModel.swift) | **Watch State ViewModel** | 1-second continuous telemetry sync loop, active online/offline state handling, distance/calorie calculations, and fall countdown timer. |
| [`StrideSenseWatch/Sources/Views/HealthStepsWatchView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/HealthStepsWatchView.swift) | **Screen 1: Activity & Steps** | Apple Health-style circular activity ring, daily step counter (1,241), distance, calories, and ESP32 hardware status badge. |
| [`StrideSenseWatch/Sources/Views/PlantarPressureWatchView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/PlantarPressureWatchView.swift) | **Screen 2: Plantar Pressure** | Bilateral insole pods (Heel & Forefoot) with dynamic cyan $\to$ red heatmap gradients when online, and `--` standby when offline. |
| [`StrideSenseWatch/Sources/Views/GaitBiomechanicsWatchView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/GaitBiomechanicsWatchView.swift) | **Screen 3: Gait Biomechanics** | Cadence SPM gauge, TinyML gait classification pill, symmetry score, and 62%/38% stance/swing duty cycle bar. |
| [`StrideSenseWatch/Sources/Views/FallGuardWatchView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/FallGuardWatchView.swift) | **Screen 4: Fall Guard Shield** | Dual-trigger state monitor, full-screen red emergency modal with 15s countdown and `"I'M OK"` button, and manual SOS trigger. |
| [`StrideSenseWatch/Sources/Views/MotionWatchView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/MotionWatchView.swift) | **Screen 5: 6-DOF IMU Motion** | Acceleration G-force shock bar ($1.0g$ baseline $\to$ impact spike), Pitch & Roll attitude angles in degrees. |
| [`StrideSenseWatch/Sources/Views/SettingsWatchView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/SettingsWatchView.swift) | **Screen 6: Settings & Profile** | Akshar Sakhi profile card (BMI 22.8, Shoe Size US 9.5), ESP32 hardware status, and manual sync button. |
| [`StrideSenseWatch/Sources/Views/MainWatchTabView.swift`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/Sources/Views/MainWatchTabView.swift) | **Swipeable Root Container** | Horizontal paging tab view hosting all 6 watchOS cards and emergency modal overlay. |
| [`StrideSenseWatch/project.yml`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/project.yml) | **XcodeGen Watch Spec** | Declarative specification with `WKApplication: true`, `WKWatchOnly: true`, and team configuration. |
| [`StrideSenseWatch/StrideSenseWatch.xcodeproj`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/StrideSenseWatch/StrideSenseWatch.xcodeproj) | **watchOS Xcode Project** | Native watchOS project compiled and deployed to Akshar's Apple Watch Series 6. |

#### 📄 Master Documentation & Architecture
| File Path | Module / Description | Technical Role & Contributions |
|---|---|---|
| [`README.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/README.md) | **Master Documentation** | End-to-end IoT system architecture, hardware BOM, circuit diagrams, TinyML benchmarks, and testing protocol. |
| [`docs/MOBILE_APP_GUIDE.md`](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/docs/MOBILE_APP_GUIDE.md) | **Mobile Application Guide** | Architecture of mobile UI components, Realtime WebSocket stream handling, and Capacitor native compilation. |

---

## ⚖️ Contribution Equality Verification

| Team Member | Assigned IoT Architectural Layer | Total Dedicated Code/Doc Files | Primary Engineering Deliverable | Percentage Share |
|---|---|:---:|---|:---:|
| **Nishanth S Gowda** | **Layer 1: Perception & Physical Sensing** | 8 Files | Bilateral Insole 4x FSR Matrix, MPU-6050 Fast I2C, Voltage Dividers, Circuit Schematics & Fabrication | **25.0%** |
| **Siddhartha Ladda** | **Layer 2: Edge Computing & Embedded Actuation** | 9 Files | ESP32 C++ FreeRTOS 50 Hz Engine, Dual-Trigger Fall State Machine, Haptic Motor Driver, GPIO34 Tare Calibration | **25.0%** |
| **Diya Bhat** | **Layer 3: Edge AI & TinyML Intelligence** | 13 Files | 24-Feature Kinematic Extractor, 98.97% Accurate Decision Forest, `<0.3 µs` C Header Transpiler (`tinyml_infer.h`) | **25.0%** |
| **Akshar Sakhi** | **Layer 4: IoT Network, Cloud & Application** | 22 Files | Supabase PostgreSQL WebSockets, React 19 + Capacitor iOS/Android Mobile App, Native Apple Watch App (watchOS) | **25.0%** |
| **TOTAL** | **End-to-End Cyber-Physical IoT System** | **52 Files** | **Fully Integrated Clinical Smart Insole IoT Platform** | **100.0%** |
