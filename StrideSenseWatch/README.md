# ⌚ StrideSense — Apple Watch Application (watchOS)

> **Native Standalone Apple Watch Companion App for Real-Time Plantar Pressure Monitoring, Gait Biomechanics, and Wrist Haptic Fall Detection**

---

## 🌟 Overview & Architecture

The **StrideSense Apple Watch App** is an independent, native watchOS application built in pure **SwiftUI** for Apple Watch (watchOS 9.0+ / Series 6, 7, 8, 9, 10, SE & Ultra). 

It is housed entirely in this dedicated `StrideSenseWatch/` directory, ensuring **zero interference or modification to existing web, mobile, firmware, or dataset codebases**.

### Key Architectural Capabilities:
1. **Zero-Latency Plantar Pressure Map**:
   - Visualizes bilateral foot load distribution in real-time.
   - Dynamic podiatric color interpolation: Cyan (touch) $\to$ Emerald (moderate) $\to$ Amber (firm) $\to$ Coral Red (peak strike).
   - Real-time Left/Right load balance ratio (e.g., `L 51% | R 49%`).
2. **Gait Biomechanics & Cadence Lab**:
   - Live Cadence in Steps Per Minute (SPM).
   - Stance vs. Swing duty cycle bar ($62\%$ Stance $\cdot$ $38\%$ Swing).
   - Embedded TinyML Gait Classifier pill (`NORMAL GAIT`, `OVERPRONATION`, `SUPINATION`, `ASYMMETRIC LIMP`).
3. **Fall Guard Wrist Shield with Haptic Alarm**:
   - Armed edge state monitoring (Free-Fall $<0.6g$ + Impact $>2.8g$).
   - Multi-stage urgent wrist vibration sequence via Apple Watch Taptic Engine (`WKInterfaceDevice.current().play`).
   - 15-second emergency grace period countdown with instant `"I'M OK — CANCEL"` button.
   - Automated cloud incident dispatch to Supabase PostgreSQL (`public.fall_incidents`).
4. **6-DOF IMU Kinematics**:
   - Real-time Pitch & Roll foot attitude horizon.
   - Dynamic G-Force shock bar ($1.0g$ baseline $\to$ impact alert).
5. **Dual-Mode Operation**:
   - **Live Cloud Sync**: Queries Supabase PostgREST telemetry stream via `URLSession` over Wi-Fi / LTE / iPhone bridge.
   - **Autonomous 20 Hz Biomechanical Demo Mode**: Simulates realistic heel-strike-to-toe-off gait patterns, cadence variations, and interactive fall triggers on wrist without requiring physical hardware insoles.

---

## 📱 Watch Screens (Horizontal Paging Navigation)

Swipe horizontally across 5 high-contrast OLED-optimized cards:

| Card | Screen Title | Primary Metrics & Controls |
|:---:|---|---|
| **1** | **Plantar Pressure** | Bilateral Heel & Forefoot pressure pods, Contact state, Balance % split |
| **2** | **Gait Biomechanics** | Cadence SPM, Symmetry %, Stance/Swing duty cycle, TinyML pattern badge |
| **3** | **Fall Guard Shield** | Dual-trigger sensor status, Simulate Fall button, 15s Countdown, SOS button |
| **4** | **IMU Motion** | Pitch & Roll angles, Acceleration shock bar ($g$), I2C sensor status |
| **5** | **Settings & Profile** | Akshar Sakhi Profile (BMI, Shoe Size), Cloud vs Demo toggle, Battery & Voltage |

---

## 🛠️ Project Structure

```
StrideSenseWatch/
├── StrideSenseWatch.xcodeproj/   # Xcode Project (Generated via XcodeGen)
├── project.yml                   # Declarative XcodeGen Project Specification
├── Resources/
│   ├── Info.plist                # watchOS App Bundle Configuration
│   └── Assets.xcassets/          # AppIcon (1024x1024) and Cyan Accent Color
└── Sources/
    ├── StrideSenseWatchApp.swift # @main SwiftUI Entry Point
    ├── Models/
    │   ├── TelemetryData.swift   # Biomechanical & Pressure Data Models
    │   └── PatientProfile.swift  # Patient Biomechanical Profile (Akshar Sakhi)
    ├── Services/
    │   ├── HapticManager.swift   # watchOS Taptic Engine Feedback Orchestrator
    │   └── SupabaseWatchClient.swift # PostgREST Telemetry & Fall Incident API
    ├── ViewModels/
    │   └── WatchTelemetryViewModel.swift # Observable State, Polling & Biomechanical Engine
    └── Views/
        ├── MainWatchTabView.swift          # Swipeable 5-Card Root Container
        ├── PlantarPressureWatchView.swift  # Bilateral Foot Load Visualizer
        ├── GaitBiomechanicsWatchView.swift # Cadence, Duty Cycle & Gait Badge
        ├── FallGuardWatchView.swift        # Armed Fall Monitor & 15s Countdown
        ├── MotionWatchView.swift           # IMU Pitch/Roll & G-Force Bar
        └── SettingsWatchView.swift         # Profile, Cloud Sync & Mode Toggles
```

---

## 🚀 How to Run & Deploy to Akshar's Apple Watch

### Option 1: Open in Xcode (Recommended)
1. In your terminal, run:
   ```bash
   open StrideSenseWatch/StrideSenseWatch.xcodeproj
   ```
2. In Xcode's top destination toolbar, select:
   **`StrideSenseWatch > Akshar’s Apple Watch`** (or Apple Watch Simulator).
3. Ensure your Development Team (`96799QVDJ7`) is selected under **Signing & Capabilities**.
4. Press **`Cmd + R`** (or click the **Play** button).
5. Xcode will compile, sign, and install **StrideSense** onto your Apple Watch.

### Option 2: Build via Command Line
To re-build or verify the watchOS binary at any time:
```bash
cd StrideSenseWatch
xcodebuild -project StrideSenseWatch.xcodeproj \
           -scheme StrideSenseWatch \
           -destination "generic/platform=watchOS" \
           CODE_SIGNING_ALLOWED=NO build
```
*(Build artifact is generated under `DerivedData/.../Debug-watchos/StrideSenseWatch.app`)*.
