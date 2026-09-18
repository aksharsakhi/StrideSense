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

## 🛠️ Flashing & Upload Instructions

### ⚡ Option A (Recommended): 1-Click Terminal / AI Assistant Flashing
You do **not** need to open Arduino IDE or configure ports manually:

1. **Ask Antigravity**: Plug your ESP32 in via USB and tell the assistant:
   > *"I connected the ESP32, upload the code"*
   The assistant will auto-detect the serial port, compile, and flash the board.
2. **Or run the automated script**:
   ```bash
   ./upload_esp32.sh
   ```
   This script auto-detects `/dev/cu.usbserial-*`, compiles the sketch, and flashes it directly.

---

### 🛠️ Option B: Manual Upload via Arduino IDE
1. Open **Arduino IDE** (`/Applications/Arduino IDE.app`).
2. Open `StrideSense_Firmware/StrideSense_Firmware.ino`.
3. In `StrideSense_Firmware/config.h`, set your `WIFI_SSID` and `WIFI_PASSWORD` (Supabase credentials are pre-configured).
4. Select **Tools ➔ Board ➔ esp32 ➔ ESP32 Dev Module**.
5. Select **Tools ➔ Port** (`/dev/cu.usbserial-...`).
6. Click **Upload** (Arrow icon `➔`).
7. Open **Serial Monitor** at **115200 baud** to view real-time TinyML inference and Supabase streaming.
