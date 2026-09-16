# StrideSense ESP32 Firmware ⚡

This folder contains the complete, modular embedded C++ firmware for the StrideSense smart insole, designed for the **ESP32 DevKit V1**.

---

## 📌 Architecture Highlights

1. **Zero External Dependencies**: Uses built-in `Wire.h`, `WiFi.h`, and `HTTPClient.h`. The TinyML inference engine (`model_data.h`) runs pure C decision trees in `<0.4ms` without requiring TensorFlow Lite Micro bloat.
2. **Dual-Trigger Fall Detection**:
   - High-speed kinematic check ($SVM_a < 0.6g$ free-fall drop followed by $> 2.8g$ ground impact shock).
   - Orientation tilt verification ($> 45^\circ$) and post-impact immobility window.
   - 15-second cancellation grace period via hardware button (GPIO 14) and haptic pulsing before dispatching emergency cloud alarms.
3. **50 Hz Deterministic Loop**: Reads 6 analog FSR sensors (with multi-sample ADC averaging) and the MPU6050 IMU via 400 kHz Fast-Mode I2C.
4. **Firebase Realtime Database Sync**: Pushes live JSON telemetry (activity, steps, cadence, symmetry, battery level, individual sensor forces) to Firebase over Wi-Fi.

---

## 🔌 Hardware Pinout

| Function | ESP32 Pin | Details |
|----------|-----------|---------|
| **S1 (Heel FSR)** | GPIO 36 (VP) | ADC1_CH0 (Safe with Wi-Fi) |
| **S2 (Midfoot Lateral FSR)** | GPIO 39 (VN) | ADC1_CH3 |
| **S3 (Midfoot Medial FSR)** | GPIO 34 | ADC1_CH6 |
| **S4 (Forefoot Lateral FSR)** | GPIO 35 | ADC1_CH7 |
| **S5 (Forefoot Medial FSR)** | GPIO 32 | ADC1_CH4 |
| **S6 (Big Toe FSR)** | GPIO 33 | ADC1_CH5 |
| **MPU6050 SDA** | GPIO 21 | I2C Data Line (4.7kΩ pull-up to 3.3V) |
| **MPU6050 SCL** | GPIO 22 | I2C Clock Line (4.7kΩ pull-up to 3.3V) |
| **SOS / Cancel Button** | GPIO 14 | Active LOW (Internal Pull-Up enabled) |
| **Haptic Motor / Buzzer** | GPIO 12 | Driven via NPN transistor / MOSFET |
| **Alert LED (Red)** | GPIO 25 | Active HIGH |
| **Status LED (Green)** | GPIO 26 | Active HIGH (Wi-Fi connected) |
| **Cloud LED (Blue)** | GPIO 27 | Active HIGH (Pulsed on transmission) |
| **Battery ADC** | GPIO 4 | 2:1 Voltage Divider (100kΩ / 100kΩ) |

---

## 🛠️ Flashing Instructions

1. Install **Arduino IDE** (or VS Code + PlatformIO).
2. Install the **esp32** board package (by Espressif Systems).
3. Select Board: `ESP32 Dev Module`.
4. Open `StrideSense_Firmware/config.h` and configure:
   - `WIFI_SSID`: Your Wi-Fi network name.
   - `WIFI_PASSWORD`: Your Wi-Fi password.
   - `FIREBASE_HOST`: Your Firebase Realtime Database URL.
5. Connect your ESP32 via USB and click **Upload**.
6. Open Serial Monitor at **115200 baud** to view real-time inference telemetry.
