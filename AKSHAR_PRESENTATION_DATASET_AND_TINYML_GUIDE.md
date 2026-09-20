# STRIDESENSE: AI SMART INSOLE
## EXPLANATION & PRESENTATION MASTER GUIDE: DATASETS, EDGE ANALYTICS & TINYML PRE-PROCESSING

| Metadata | Details |
|---|---|
| **Presenter** | **Akshar** |
| **Team** | Team 4 (Diya, Nishanth, Akshar, Ladda) |
| **Presentation Focus** | Datasets, Edge Analytics, TinyML Pre-processing & Fall Detection |
| **Target Marks** | **11.25 Marks** (Rubric 3: Edge Analytics [5M] + Individual Technical Defense [6.25M]) |
| **Firmware Files** | `tinyml_infer.cpp`, `fall_detector.cpp`, `filter.cpp`, `filter.h` |
| **Dataset & ML Scripts**| `datasets/gait_synthesizer.py`, `ml/train_model.py`, `ml/feature_extractor.py` |

---

## 1. The Datasets: Origins, Public Baselines & Custom Synthesizer

### The Exact Answer to Give Professors / Evaluators
> *"We adopted a **Hybrid Strategy**: We referenced four international clinical benchmark datasets (Nature Scientific Data Smart-Insole, PhysioNet gaitpdb, SisFall, and UCI-HAR) to study biomechanical force curves and fall kinematics. Then, because commercial datasets use 16–32 pressure nodes that do not match our shoe's 6-FSR hardware geometry, we engineered an in-tree **Biomechanical Gait Synthesizer** (`datasets/gait_synthesizer.py`). This generated our **25,000-sample Master Dataset** across 5 demographic profiles, which we cross-validated against real readings from our physical ESP32 prototype."*

### 1.1 The Four Clinical Benchmark References We Studied
1. **The Smart-Insole Dataset (Nature Scientific Data / BMI-HMU)**:
   - 29 subjects (young adults, elderly, and Parkinson's patients) walking with Moticon sensor insoles at 100 Hz.
   - Contained 16 pressure sensors per insole + 3D accelerometer + 3D gyroscope.
   - **How we used it**: Provided the clinical baseline for heel-to-toe force transfer timing and bilateral gait symmetry.
2. **PhysioNet Gait in Parkinson's Disease Database (`gaitpdb`)**:
   - 166 subjects (93 patients, 73 controls) using 8 vertical Ground Reaction Force (vGRF) sensors under each foot at 100 Hz.
   - **How we used it**: Calibrated our stance-phase timing curves and force-decay thresholds.
3. **SisFall: A Fall and Movement Dataset (Sensors 2017)**:
   - 38 participants performing 34 activities: 19 Activities of Daily Living (ADLs) and 15 Fall types (slip, trip, lateral, backward, fainting).
   - **How we used it**: Provided the mathematical thresholds for free-fall ($< 0.6g$) and ground impact collision ($> 3.5g$).
4. **UCI Human Activity Recognition (HAR)**:
   - 30 volunteers wearing 6-DOF IMUs at 50 Hz performing walking, upstairs, downstairs, sitting, and standing.
   - **How we used it**: Provided baseline angular velocity statistics for standard human locomotion.

### 1.2 Why Commercial Datasets Were Inadequate for Direct Training
- **Sensor Geometry Mismatch**: Commercial insoles like Moticon use 16 to 32 small sensor cells. StrideSense uses **6 anatomically targeted FSR sensors** (S1 Calcaneus, S2 Lateral Midfoot, S3 Medial Arch, S4 4th/5th Metatarsal, S5 1st Metatarsal ball, S6 Hallux big toe) + 1 arch-mounted MPU-6050 IMU. Training on a 32-sensor matrix would make it impossible to deploy bare-metal inference on our 6-FSR hardware.
- **Safety Constraints in Geriatric Fall Modeling**: You cannot ask human volunteers—especially elderly test subjects—to suffer 200 real, violent falls onto a concrete floor to train a model. A physics-grounded mathematical synthesizer allows safe, high-fidelity modeling of diverse body weights, cadences, and fall angles.

### 1.3 Our Master Dataset: Biomechanical Gait Synthesizer
Built in `datasets/gait_synthesizer.py` and saved to `datasets/stridesense_master_dataset.csv`:

| Parameter | Specification | Engineering & Biomechanical Significance |
|---|---|---|
| **Total Samples** | **25,000 synchronized records** | 500 seconds (8.3 minutes) of continuous multi-channel locomotion. |
| **Sampling Rate** | **50 Hz (dt = 20 ms)** | Exactly matches the ESP32 firmware non-blocking sensor loop clock. |
| **Synchronized Channels** | **12 Channels** ($P_1..P_6$, $A_x, A_y, A_z$, $G_x, G_y, G_z$) | 6 calibrated plantar FSRs (0-4095 ADC) + 6-DOF IMU kinematics. |
| **Demographic Profiles** | **5 Distinct Profiles** (50kg to 95kg) | Normal, Lightweight (50kg), Heavyweight (95kg), Brisk Walker, Elderly Gait. |
| **Activity Classes** | **5 Classes** (Standing, Walking, Running, Sitting, Fall) | Stratified distribution: Walk (35%), Stand (20%), Run (20%), Sit (15%), Fall (10%). |

---

## 2. Edge Analytics & TinyML Pre-Processing Pipeline

Wearable health insoles cannot stream raw 50 Hz waveforms across the internet due to battery drain, RF dropouts, and network latency. StrideSense performs **100% of feature extraction, model inference, and fall detection locally on the ESP32 in real time**.

### 2.1 The 4-Stage On-Device Architecture
```
[Raw Sensors @ 50 Hz] 
       │ (6x FSRs + 6-DOF MPU-6050)
       ▼
[Stage 1: Ring Buffer Windowing] ──> Circular buffer of 50 samples (1.0 sec window, 500 ms stride)
       │
       ▼
[Stage 2: Feature Extraction]   ──> Computes 24 Biomechanical Features (Statistical, Kinematic, Plantar)
       │
       ▼
[Stage 3: TinyML Inference]     ──> Pure C Bare-Metal Neural Net / Random Forest (0.2 - 0.5 µs latency)
       │
       ▼
[Stage 4: Edge Analytics Engine] ──> Dual-Trigger Fall Guard + Cadence + Pronation Ratio + Step Counter
```

### 2.2 Stage 1: Windowing & Filtering (`filter.cpp`, `filter.h`)
- **Sampling Frequency**: **50 Hz** ($20\text{ ms}$ interval maintained by `if (now - last_sample_time >= SAMPLING_PERIOD_MS)`).
- **Window Size ($N = 50$ samples)**: Represents exactly **1.0 second** of temporal movement, long enough to capture at least one complete heel-strike-to-toe-off stride cycle.
- **Stride / Step Size (25 samples = 500 ms)**: **50% window overlap**. TinyML inference evaluates twice every second, ensuring seamless state tracking without missing rapid dynamic transitions.
- **Static Circular Ring Buffer**: All memory is pre-allocated at compile time (`SensorSample buffer[50]`). **Zero dynamic heap allocation** (`0 bytes malloc`) prevents memory fragmentation and eliminates MCU crash risks.

### 2.3 Stage 2: The 24-Dimensional Feature Extraction Matrix
In `tinyml_infer.cpp`, `extractFeatures()` transforms the 50 raw samples into a 24-dimensional vector:

| Index Range | Feature Category & Formula | Biomechanical Purpose & Clinical Meaning |
|:---:|---|---|
| **0 to 5** | **Linear Kinematics**: Mean & Std of $A_x, A_y, A_z$ | Tracks foot inclination, gravitational tilt vector, and forward acceleration intensity. |
| **6 to 11** | **Angular Kinematics**: Mean & Std of $G_x, G_y, G_z$ | Measures leg swing angular velocity ($G_y$), foot roll stability ($G_x$), and pivot rotation ($G_z$). |
| **12 to 14** | **Accel Signal Vector Magnitude**: Mean, Max, Std of $\sqrt{A_x^2 + A_y^2 + A_z^2}$ | Measures 3D shock energy. Max SVM detects ground impact ($> 3.5g$); low SVM detects free-fall ($< 0.6g$). |
| **15 to 16** | **Gyro Signal Vector Magnitude**: Mean, Max of $\sqrt{G_x^2 + G_y^2 + G_z^2}$ | Quantifies overall rotational agility. Distinguishes controlled turning from sudden uncontrolled stumbling. |
| **17 to 19** | **Total Plantar Force**: Mean, Std, Max of $\sum_{i=1}^6 P_i$ | Differentiates foot contact states: completely unloaded ($< 200$) = Sitting; fully loaded ($> 2000$) = Walking/Running. |
| **20** | **Plantar Stance Ratio**: $\frac{P_{heel}}{P_{forefoot} + 1.0}$ | Identifies gait cycle phases: high ratio ($> 2.0$) = Heel Strike; low ratio ($< 0.4$) = Terminal Propulsion (Toe-off). |
| **21** | **Medial / Lateral Balance**: $\frac{P_{medial}}{P_{lateral} + 1.0}$ | Monitors foot pronation vs supination. Crucial for diabetic ulcer prevention and gait correction. |
| **22 to 23** | **Isolated Force Concentrations**: Mean Heel ($P_1$) & Mean Forefoot ($P_4+P_5+P_6$) | Provides absolute weight loading across the calcaneus vs the metatarsal propulsion zone. |

### 2.4 Stage 3: Bare-Metal C TinyML Inference (`model_data.h` & `model_neural_tinyml.h`)

> **Why Bare-Metal C Instead of TensorFlow Lite Micro (TFLM)?**  
> TFLM requires ~150 KB of flash for runtime interpreters, operator kernels, and tensor arena allocations. By translating our scikit-learn decision trees and PyTorch MLP weights into pure C headers with static arrays, we achieved **0.2 microsecond latency**, **zero dynamic heap allocation**, and reduced flash footprint to **under 5 KB**!

#### Model Benchmark Comparison (`ml/TINYML_BENCHMARK_REPORT.md`):

| Metric / Benchmark | Random Forest Model (Primary) | Deep Learning MLP Neural Network |
|---|---|---|
| **Model Architecture** | **8 Decision Trees** (max_depth = 7) | **Linear(24 $\to$ 16) + ReLU + Linear(16 $\to$ 5) + Softmax** |
| **Test Accuracy** | **98.97%** | **98.97%** |
| **5-Fold Cross Validation**| **98.46% (±0.00%)** | **98.15% (±0.45%)** |
| **Execution Latency** | **0.20 – 0.27 microseconds** | **0.53 – 0.60 microseconds** |
| **Flash Memory Footprint**| **~4.8 KB** | **~2.4 KB** |
| **Dynamic Heap RAM** | **0 Bytes (Stack Only)** | **0 Bytes (Stack Only)** |

*MCU CPU Budget Comparison*: Our sensor sampling period is $20\text{ ms}$ ($20,000\text{ \mu s}$). Our model runs in **under 1 microsecond**, consuming less than **0.005% of the CPU budget**, leaving the rest of the ESP32 free for Wi-Fi and sensor polling!

### 2.5 Stage 4: Dual-Trigger Fall Guard State Machine (`fall_detector.cpp`)
- **Phase 1: Free-Fall Drop**: Triggered when $SVM_{acc} < 0.6g$ for $\ge 160\text{ ms}$ (loss of gravitational support).
- **Phase 2: Impact Collision Shock**: Triggered when $SVM_{acc} > 3.5g$ within 800 ms of free fall.
- **Phase 3: Post-Impact Posture & Stillness**: Settle period of 1.5 seconds. Confirms fall if pitch/roll tilt shifted by $> 45^\circ$ AND gyroscope angular velocity is quiet ($< 35^\circ/s$, lying motionless on the floor).
- **Phase 4: 15-Second Grace Window**: Hardware haptic motor pulses + Red LED flashes. The user has 15 seconds to press the physical SOS / Cancel button on **GPIO 14**. If uncancelled, emergency telemetry is dispatched to cloud/caregivers and saved to Flash NVS storage.

---

## 3. Verbatim 2-Minute Presentation Script (Read Aloud)

> *"Good morning, esteemed evaluators. My name is Akshar, and I am presenting the **Edge Analytics, TinyML Pre-Processing, and Fall Detection Pipeline** for StrideSense.*
>
> *In wearable health systems, transmitting raw 50 Hz waveforms across the internet drains battery within hours and fails whenever Wi-Fi disconnects. To solve this, StrideSense performs 100% of its feature extraction and machine learning directly on the ESP32 in real time.*
>
> *For our data foundation, we utilized a dual strategy: We referenced four clinical benchmarks—such as the Nature Scientific Data Smart-Insole dataset and the SisFall database—to extract ground-truth ground reaction forces and fall kinematics. Because our hardware uses a custom 12-channel configuration of 6 plantar FSRs and a 6-DOF IMU, we developed a multi-subject biomechanical synthesizer in Python. This generated 25,000 synchronized samples across 5 demographic profiles, including lightweight, heavyweight, and elderly walking styles.*
>
> *On the ESP32, our processing operates in four stages:*
> *First, incoming sensor streams are ingested at 50 Hz into a static circular window buffer of 50 samples, providing a 1.0-second temporal window with a 500-millisecond stride.*
>
> *Second, our engine computes a 24-dimensional feature vector in real time. This captures 3D kinematic variance, Signal Vector Magnitude for collision shock, total plantar load, and clinical ratios like the Heel-to-Forefoot propulsion ratio and Medial-to-Lateral pronation balance.*
>
> *Third, for inference, instead of heavy runtimes like TensorFlow Lite, we compiled our trained Random Forest and Deep Learning MLP models directly into pure C static headers. Both achieve 98.97% test accuracy, require zero dynamic heap memory, and execute in under 1 microsecond on the ESP32's 240 MHz Tensilica core.*
>
> *Finally, this feeds our Dual-Trigger Fall Guard state machine, which detects free-fall drops below 0.6g, impact shocks above 3.5g, and post-fall immobility, supported by a 15-second haptic cancellation window.*
>
> *This pipeline is currently running live on the physical hardware before you. Thank you, and I am glad to answer any questions."*

---

## 4. Technical Viva Defense: 8 Likely Examiner Questions & Answers

### Q1: Why did you use synthetic data instead of just walking around in the shoe?
**Answer**: *"We used real prototype hardware to calibrate ADC sensor baselines and zero-offsets. However, training a generalized machine learning model requires thousands of samples across diverse body weights (50 kg to 95 kg), walking cadences, and dangerous edge-cases like violent slip-and-fall events. Asking human subjects—especially elderly individuals—to perform 200 real falls onto hard floors is hazardous. Our physics synthesizer accurately modeled these dynamics based on published clinical data from Nature and SisFall."*

### Q2: Why did you choose 24 features? Which features have the highest importance?
**Answer**: *"The 24 features capture the complete tri-axial kinematics and plantar kinetics without redundant computation. The most influential features are:*
1. *`svm_acc_max`: Instantly isolates ground impact collision during falls or running.*
2. *`force_total_mean`: Reliably distinguishes sitting (unloaded foot) from standing and walking.*
3. *`heel_forefoot_ratio`: Tracks stance progression from initial heel-strike to toe-off.*
4. *`gyro_y_std`: Measures the rhythmic pitch swing of the lower leg during locomotion."*

### Q3: Why did you avoid TensorFlow Lite Micro?
**Answer**: *"TensorFlow Lite Micro introduces roughly 150 KB of flash overhead and requires dynamic tensor arena memory management. By compiling our trained scikit-learn trees and PyTorch weights into bare-metal C headers (`model_data.h`), we achieved 0.2 microsecond execution latency, required 0 bytes of dynamic heap memory, and completely eliminated MCU memory fragmentation."*

### Q4: How do you prevent false fall alarms when someone jumps or sits down quickly?
**Answer**: *"Through our 3-stage validation logic in `fall_detector.cpp`: Jumping produces high impact, but it is NOT preceded by a prolonged free-fall phase ($< 0.6g$), nor is it followed by post-impact stillness and a $> 45^\circ$ tilt change. Sitting down exhibits controlled angular velocity, not an uncontrolled collapse. Furthermore, our 15-second haptic grace period allows the user to cancel accidental triggers via GPIO 14 before any alert is sent."*

### Q5: What is the CPU execution budget of your TinyML model on the ESP32?
**Answer**: *"Our sensor sampling interval is 20 ms (20,000 microseconds). Our Random Forest model executes in 0.20 microseconds, consuming less than 0.005% of the available CPU time on the 240 MHz Tensilica core. This leaves 99.99% of the CPU free for Wi-Fi transmission, calibration, and sensor polling."*

### Q6: How does the ESP32 compute cadence in real time?
**Answer**: *"Cadence is derived from cyclic force variance of total plantar force combined with heel-strike peak detection. For walking, it maps to 104–130 steps per minute; for running, it scales to 158–195 steps per minute."*

### Q7: How do you handle sensor drift and ADC noise?
**Answer**: *"In `sensors.cpp`, we run a software tare zero-calibration routine at boot (`tareSensorBaseline()`) that subtracts resting baseline ADC noise from each FSR channel. In addition, our 50-sample sliding window acts as a moving average low-pass filter to reject high-frequency electronic noise."*

### Q8: How does the ESP32 know the user is lying motionless after a fall?
**Answer**: *"The fall state machine waits for a 1.5-second settle period after impact shock, then checks the gyroscope magnitude $\sqrt{G_x^2 + G_y^2 + G_z^2}$. If angular velocity is below 35 deg/s and the orientation tilt changed by more than 45 degrees, the user is confirmed to be motionless on the ground."*

---

## 5. Live Hardware Demonstration Choreography (Akshar's Turn)

During your presentation segment, perform this 30-second live demonstration on the ESP32 hardware to secure full practical marks:

1. **Step 1 (Show Serial Monitor & Real-Time Inference)**: Point to the Serial Monitor showing: `[TinyML] Activity: Walking | Conf: 100% | Latency: 0 us`. Highlight that latency is under 1 microsecond.
2. **Step 2 (Demonstrate Heel-Strike vs Toe-Off)**: Press the Calcaneus FSR (GPIO 34). Show that the step count increments and the Heel-to-Forefoot ratio jumps above 2.0.
3. **Step 3 (Trigger Simulated Fall Alert)**: Quickly drop and tilt the board horizontally onto the desk. Show that the Red LED flashes and the haptic motor vibrates, entering the 15-second grace window.
4. **Step 4 (Cancel Alert via Hardware SOS Button)**: Press the tactile switch on GPIO 14. Show that the alarm cancels immediately (`[FallEngine] Fall alert successfully CANCELLED by user`). Explain that this prevents false emergency dispatches.
