# StrideSense - Hardware Circuit & Wiring Guide 🔌

This document provides complete schematics, pinout connections, component specifications, and assembly instructions for building the StrideSense smart insole hardware prototype.

---

## 1. System Block Diagram

```
       +-------------------------------------------------------------+
       |                         FOOT INSOLE                         |
       |                                                             |
       |   [S6: Big Toe]         [S5: Fore-Medial]  [S4: Fore-Lateral]|
       |                                                             |
       |   [S3: Mid-Medial]                         [S2: Mid-Lateral]|
       |                                                             |
       |                         [S1: Heel]                          |
       +------------------------------+------------------------------+
                                      | 6x Analog FSR Lines
                                      |
+-------------------------------------v-------------------------------------+
|                             ESP32 CONTROLLER                              |
|                                                                           |
|   +--------------------+    +------------------+    +-----------------+   |
|   | 6x ADC Channels    |    | I2C Master       |    | GPIO Controls   |   |
|   | (Pins 36,39,34,35, |    | (SDA:21, SCL:22) |    | (LEDs, Buzzer,  |   |
|   |  32, 33)           |    |                  |    |  SOS Button)    |   |
|   +---------^----------+    +--------^---------+    +--------^--------+   |
+-------------|------------------------|-----------------------|------------+
              |                        |                       |
      +-------+--------+       +-------+--------+      +-------+--------+
      | FSR Voltage    |       | MPU-6050       |      | Actuators & UI |
      | Dividers       |       | 6-DOF IMU      |      | - RGB Status   |
      | (10kΩ x6)      |       | (±8g, ±1000°/s)|      | - Haptic Motor |
      +-------^--------+       +-------^--------+      | - SOS Button   |
              |                        |               +----------------+
      +-------+------------------------+-------+
      |  Power Supply: 3.7V Li-Po (500-1200mAh)|
      |  TP4056 USB Charger + 3.3V LDO Reg     |
      +----------------------------------------+
```

---

## 2. Complete Wiring & Pinout Table

| ESP32 GPIO | Peripheral Connected | Circuit Details | Purpose / Function |
|------------|---------------------|-----------------|--------------------|
| **GPIO 36 (VP)** | FSR Sensor 1 (Heel) | 10kΩ pull-down to GND | Reads calcaneus ground impact force |
| **GPIO 39 (VN)** | FSR Sensor 2 (Midfoot Lateral) | 10kΩ pull-down to GND | Reads lateral foot balance during midstance |
| **GPIO 34** | FSR Sensor 3 (Midfoot Medial) | 10kΩ pull-down to GND | Monitors medial arch compression & pronation |
| **GPIO 35** | FSR Sensor 4 (Forefoot Lateral) | 10kΩ pull-down to GND | Reads 4th-5th metatarsal pressure |
| **GPIO 32** | FSR Sensor 5 (Forefoot Medial) | 10kΩ pull-down to GND | Reads 1st metatarsal propulsion force |
| **GPIO 33** | FSR Sensor 6 (Big Toe) | 10kΩ pull-down to GND | Detects terminal stance toe-off timing |
| **GPIO 21** | MPU-6050 SDA | 4.7kΩ pull-up to 3.3V | I2C Serial Data |
| **GPIO 22** | MPU-6050 SCL | 4.7kΩ pull-up to 3.3V | I2C Serial Clock |
| **GPIO 14** | Hardware SOS / Cancel Button | Tactile button to GND (Internal pull-up) | 15s fall cancel & emergency trigger |
| **GPIO 12** | Haptic Vibration Motor | NPN 2N2222 / N-ch MOSFET driver + flyback diode | Haptic feedback for fall confirmation |
| **GPIO 25** | Emergency Alert LED (Red) | 220Ω resistor to GND | Flashes on fall alert |
| **GPIO 26** | Wi-Fi Connected LED (Green)| 220Ω resistor to GND | Solid when Wi-Fi connected |
| **GPIO 27** | Cloud Sync LED (Blue) | 220Ω resistor to GND | Pulses during Firebase sync |
| **GPIO 4**  | Battery Voltage Monitor | 100kΩ / 100kΩ voltage divider | 0–4.2V LiPo mapped to 0–2.1V ADC |
| **3V3**     | Sensor VCC & Pull-ups | Regulated 3.3V rail | Supplies clean power to sensors |
| **GND**     | Common Ground Rail | System ground | Common reference |

---

## 3. FSR Voltage Divider Circuit

Each FSR requires a fixed resistor to form a voltage divider that converts force-dependent resistance into a measurable voltage:

```
         3.3V (VCC)
            │
            ▼
      ┌───────────┐
      │ FSR Sensor│ (Resistance decreases as force increases)
      └─────┬─────┘
            │
            ├───────────────► To ESP32 ADC Pin (e.g., GPIO 36)
            │
      ┌─────┴─────┐
      │  R_fixed  │ (10 kΩ, 1% tolerance)
      └─────┬─────┘
            │
            ▼
         GND (0V)
```

**ADC Voltage Calculation**:
$$V_{out} = 3.3\text{V} \times \frac{R_{fixed}}{R_{FSR} + R_{fixed}}$$

- **No Pressure** ($R_{FSR} > 1\text{ M}\Omega$): $V_{out} \approx 0\text{V} \implies \text{ADC} \approx 0$
- **Moderate Footstep** ($R_{FSR} \approx 5\text{ k}\Omega$): $V_{out} \approx 3.3\text{V} \times \frac{10}{15} = 2.2\text{V} \implies \text{ADC} \approx 2730$
- **Heavy Heel Impact** ($R_{FSR} \approx 1\text{ k}\Omega$): $V_{out} \approx 3.3\text{V} \times \frac{10}{11} = 3.0\text{V} \implies \text{ADC} \approx 3720$

---

## 4. Bill of Materials (BOM) & Approximate Costs

| Item | Component | Qty | Approx Cost (INR) | Purpose |
|------|-----------|-----|-------------------|---------|
| 1 | ESP32 DevKit V1 (30-pin) | 1 | ₹450 | Core microcontroller + Wi-Fi |
| 2 | MPU-6050 6-DOF IMU Module | 1 | ₹150 | Accelerometer + Gyroscope |
| 3 | RP-C18.3-ST / Interlink 402 FSR | 6 | ₹1,200 | Plantar pressure sensors |
| 4 | 3.7V 800mAh Li-Po Battery | 1 | ₹350 | Portable untethered power |
| 5 | TP4056 Li-Po Charger + Protection | 1 | ₹60 | Safe USB-C charging |
| 6 | 10kΩ & 220Ω 1/4W Resistors | 10 | ₹30 | Voltage dividers & LED limits |
| 7 | Miniature Vibration Motor (3V) | 1 | ₹50 | Haptic feedback |
| 8 | 2N2222 NPN Transistor + 1N4148 Diode | 1 | ₹20 | Motor drive switch |
| 9 | Tactile Push Button | 1 | ₹10 | SOS emergency cancellation |
| 10 | Athletic Insole + Ribbon Cable | 1 | ₹300 | Shoe chassis & flexible wiring |
| **Total** | | | **~₹2,620** | **Affordable complete prototype** |
