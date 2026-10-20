# StrideSense - Full Bilateral Circuit Diagrams & Hardware Wiring Guide ⚡

This document provides the complete, industry-standard electrical schematics, pinout tables, sensor voltage dividers, power management circuits, and assembly instructions for the **Full Dual-Leg (Bilateral) StrideSense System** (Left Foot ESP32 + Right Foot ESP32).

---

## 1. System Architecture Overview

The StrideSense system consists of two independent wearable insole units operating in synchrony:

```
  LEFT FOOT INSOLE                               RIGHT FOOT INSOLE
┌─────────────────────────────────┐            ┌─────────────────────────────────┐
│  ESP32 DevKit Node #1           │            │  ESP32 DevKit Node #2           │
│  Device ID: "insole_left_01"    │            │  Device ID: "insole_right_01"   │
│  Role: INSOLE_SIDE_LEFT         │            │  Role: INSOLE_SIDE_RIGHT        │
├─────────────────────────────────┤            ├─────────────────────────────────┤
│ • 2x Square FSR Pressure Sensors│            │ • 2x Square FSR Pressure Sensors│
│   - L-FSR 1: Calcaneus Heel     │            │   - R-FSR 1: Calcaneus Heel     │
│   - L-FSR 2: Metatarsal Ball    │            │   - R-FSR 2: Metatarsal Ball    │
│ • 1x MPU-6050 6-DOF IMU (I2C)   │            │ • 1x MPU-6050 6-DOF IMU (I2C)   │
│ • 1x Coin Vibration Motor       │            │ • 1x Coin Vibration Motor       │
│ • 1x SOS Fall Cancel Button     │            │ • 1x SOS Fall Cancel Button     │
│ • 3x Indicator LEDs (R / G / B) │            │ • 3x Indicator LEDs (R / G / B) │
│ • 3.7V LiPo + TP4056 Charger    │            │ • 3.7V LiPo + TP4056 Charger    │
└────────────────┬────────────────┘            └────────────────┬────────────────┘
                 │ Wi-Fi 2.4 GHz                                │ Wi-Fi 2.4 GHz
                 └───────────────────────┬──────────────────────┘
                                         ▼
                            Supabase Real-Time Cloud
                         (Synchronized Antiphase Telemetry)
                                         │
                                         ▼
                         iOS App & 3D Simulation Studio
```

---

## 2. Complete Pinout Specification Table

Both ESP32 boards use the **exact same hardware pinout** for manufacturing modularity. The board's role (Left vs Right) is configured in firmware via `config.h`:
- Left Insole: `#define INSOLE_SIDE INSOLE_SIDE_LEFT` (`insole_left_01`)
- Right Insole: `#define INSOLE_SIDE INSOLE_SIDE_RIGHT` (`insole_right_01`)

| ESP32 Pin | Peripheral / Signal | Component Details | Function & Purpose |
|:---|:---|:---|:---|
| **GPIO 36 / 34** | `PIN_FSR_S1_HEEL` | 10 kΩ pull-down resistor to GND | Calcaneus Heel FSR (ADC1_CH0/CH6 - Safe with Wi-Fi) |
| **GPIO 39 / 35** | `PIN_FSR_S2_FOREFOOT` | 10 kΩ pull-down resistor to GND | Metatarsal Ball FSR (ADC1_CH3/CH7 - Safe with Wi-Fi) |
| **GPIO 21** | `PIN_I2C_SDA` | Hardware default I2C (Internal pull-up) | MPU-6050 I2C Serial Data line |
| **GPIO 22** | `PIN_I2C_SCL` | Hardware default I2C (Internal pull-up) | MPU-6050 I2C Serial Clock line |
| **GPIO 12** | `PIN_HAPTIC_MOTOR` | 2N2222 Transistor + 1N4148 diode | Haptic feedback pulse on fall / step alert |
| **GPIO 14** | `PIN_SOS_BUTTON` | Push button to GND | Emergency SOS / 15s Fall Cancel (Active LOW) |
| **GPIO 2** | `PIN_STATUS_LED` | Internal Blue LED (or 1x External via 330Ω) | Multi-Status: Solid ON = Active; Blip = Sync; Fast Strobe = Fall Alert |
| **GPIO 34 / 33** | `PIN_BATTERY_ADC` | 100 kΩ / 100 kΩ voltage divider | LiPo Battery Voltage Monitor (ADC1 - Safe with Wi-Fi) |
| **3V3** | 3.3V Regulated Output | From onboard AMS1117 LDO | Clean 3.3V VCC rail for sensors & pullups |
| **GND** | System Ground Rail | Common Ground Plane | Common reference for all components |
| **VIN / 5V**| Battery Power Input | From TP4056 `OUT+` (3.7V–4.2V) | Power input to ESP32 onboard regulator |

> [!IMPORTANT]
> **ADC Pin Rule**: Only use **ADC1** pins (GPIO 32, 33, 34, 35, 36, 39) for analog readings on ESP32. **ADC2** (GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27) cannot be used while Wi-Fi is transmitting. Our FSRs are strictly on **GPIO 34 & GPIO 35 (ADC1)**.

---

## 3. Left Insole Circuit Schematic (ESP32 #1)

```
                       LEFT INSOLE CONTROLLER (insole_left_01)
                    =============================================
                                     +---------+
                                     |  ESP32  |
                                     | DEVKIT  |
                        +------------| 3V3     | (Regulated 3.3V Power Rail)
                        |            |         |
                        |      +-----| GND     | (Common Ground Rail)
                        |      |     +---------+
                        |      |
  [ 1. CALCANEUS HEEL FSR ]    |
  3.3V Rail ────────+          |
                    |          |
               ┌────┴────┐     |
               │ L-FSR 1 │     |
               └────┬────┘     |
                    │          |
                    ├──────────┼──────────────► GPIO 34 (ADC1_CH6)
                    │          |
               ┌────┴────┐     |
               │ 10 kΩ   │     |
               └────┬────┘     |
                    |          |
  GND Rail ─────────+──────────+
                        |      |
  [ 2. FOREFOOT METATARSAL FSR ]
  3.3V Rail ────────+          |
                    |          |
               ┌────┴────┐     |
               │ L-FSR 2 │     |
               └────┬────┘     |
                    │          |
                    ├──────────┼──────────────► GPIO 35 (ADC1_CH7)
                    │          |
               ┌────┴────┐     |
               │ 10 kΩ   │     |
               └────┬────┘     |
                    |          |
  GND Rail ─────────+──────────+
                        |      |
  [ 3. MPU-6050 6-DOF IMU ]    |
  3.3V Rail ────────────+      |
  GND Rail ─────────────┼──────+
  SDA ──────────────────┼─────────────────────► GPIO 26 (I2C SDA)
  SCL ──────────────────┼─────────────────────► GPIO 27 (I2C SCL)
  AD0 ──────────────────┴──────+ (GND -> I2C Addr: 0x68)
                        |      |
  [ 4. HAPTIC COIN VIBRATION MOTOR ]
  3.3V Rail ────────+   |      |
                    │   |      |
                 ┌──┴───┴┐     |
                 │ 1N4001│     |
                 │ Diode │     |
                 └──┬───┬┘     |
                    │   │      |
               (M) Coin Motor  |
                    │          |
               Collector       |
                   │           |
  GPIO 12 ──[ 1 kΩ ]──► Base (2N2222 NPN)
                   │           |
                Emitter        |
                   │           |
  GND Rail ────────+───────────+
                        |      |
  [ 5. SOS / CANCEL BUTTON ]   |
  GPIO 14 ───────────[ Button ]┴──────────────► GND (Active LOW with internal PULLUP)
                        |      |
  [ 6. INDICATOR LEDS ] |      |
  GPIO 25 ───[ 220 Ω ]──►| (Red Alert LED) ───► GND
  GPIO 18 ───[ 220 Ω ]──►| (Green Wi-Fi)  ───► GND
  GPIO 19 ───[ 220 Ω ]──►| (Blue Cloud)   ───► GND
                        |      |
  [ 7. BATTERY MONITOR DIVIDER ]
  LiPo (+) ──[ 100 kΩ ]─┬──────┼──────────────► GPIO 4 (ADC)
                        │      |
                    [ 100 kΩ ] |
                        │      |
  GND Rail ─────────────┴──────+
```

---

## 4. Right Insole Circuit Schematic (ESP32 #2)

The right insole features mirrored mechanical placement inside the shoe insole, with the **exact same robust electrical circuit**:

```
                      RIGHT INSOLE CONTROLLER (insole_right_01)
                    =============================================
                                     +---------+
                                     |  ESP32  |
                                     | DEVKIT  |
                        +------------| 3V3     | (Regulated 3.3V Power Rail)
                        |            |         |
                        |      +-----| GND     | (Common Ground Rail)
                        |      |     +---------+
                        |      |
  [ 1. RIGHT CALCANEUS HEEL FSR ]
  3.3V Rail ────────+          |
                    |          |
               ┌────┴────┐     |
               │ R-FSR 1 │     |
               └────┬────┘     |
                    │          |
                    ├──────────┼──────────────► GPIO 34 (ADC1_CH6)
                    │          |
               ┌────┴────┐     |
               │ 10 kΩ   │     |
               └────┬────┘     |
                    |          |
  GND Rail ─────────+──────────+
                        |      |
  [ 2. RIGHT FOREFOOT METATARSAL FSR ]
  3.3V Rail ────────+          |
                    |          |
               ┌────┴────┐     |
               │ R-FSR 2 │     |
               └────┬────┘     |
                    │          |
                    ├──────────┼──────────────► GPIO 35 (ADC1_CH7)
                    │          |
               ┌────┴────┐     |
               │ 10 kΩ   │     |
               └────┬────┘     |
                    |          |
  GND Rail ─────────+──────────+
                        |      |
  [ 3. MPU-6050 6-DOF IMU ]    |
  3.3V Rail ────────────+      |
  GND Rail ─────────────┼──────+
  SDA ──────────────────┼─────────────────────► GPIO 26 (I2C SDA)
  SCL ──────────────────┼─────────────────────► GPIO 27 (I2C SCL)
  AD0 ──────────────────┴──────+ (GND -> I2C Addr: 0x68)
                        |      |
  [ 4. HAPTIC COIN VIBRATION MOTOR ]
  3.3V Rail ────────+   |      |
                    │   |      |
                 ┌──┴───┴┐     |
                 │ 1N4001│     |
                 │ Diode │     |
                 └──┬───┬┘     |
                    │   │      |
               (M) Coin Motor  |
                    │          |
               Collector       |
                   │           |
  GPIO 12 ──[ 1 kΩ ]──► Base (2N2222 NPN)
                   │           |
                Emitter        |
                   │           |
  GND Rail ────────+───────────+
                        |      |
  [ 5. SOS / CANCEL BUTTON ]   |
  GPIO 14 ───────────[ Button ]┴──────────────► GND (Active LOW with internal PULLUP)
                        |      |
  [ 6. INDICATOR LEDS ] |      |
  GPIO 25 ───[ 220 Ω ]──►| (Red Alert LED) ───► GND
  GPIO 18 ───[ 220 Ω ]──►| (Green Wi-Fi)  ───► GND
  GPIO 19 ───[ 220 Ω ]──►| (Blue Cloud)   ───► GND
                        |      |
  [ 7. BATTERY MONITOR DIVIDER ]
  LiPo (+) ──[ 100 kΩ ]─┬──────┼──────────────► GPIO 4 (ADC)
                        │      |
                    [ 100 kΩ ] |
                        │      |
  GND Rail ─────────────┴──────+
```

---

## 5. Sub-Circuit Deep Dives

### A. FSR Voltage Divider Mechanics

Piezoresistive square FSRs decrease electrical resistance exponentially when subjected to mechanical foot pressure:

```
          +3.3V
            │
            ▼
      ┌───────────┐
      │    FSR    │  No Load: R_fsr > 1 MΩ (Open circuit)
      │  Sensor   │  Light Contact: R_fsr ≈ 10 kΩ – 20 kΩ
      └─────┬─────┘  Firm Stance: R_fsr ≈ 1 kΩ – 3 kΩ
            │        Heel Strike Impact: R_fsr < 800 Ω
            ├───────────────► To ESP32 ADC (GPIO 34 or 35)
            │
      ┌─────┴─────┐
      │  10 kΩ    │  R_fixed (1% metal film resistor)
      └─────┬─────┘
            │
            ▼
           GND
```

**Voltage Transfer Function**:
$$V_{ADC} = 3.3\text{V} \times \left( \frac{10\text{k}\Omega}{R_{FSR} + 10\text{k}\Omega} \right)$$

- **Foot in Air (Swing Phase)**: $R_{FSR} > 1\text{M}\Omega \implies V_{ADC} \approx 0.03\text{V} \implies \text{ADC} \approx 30$–$50$ (filtered by baseline calibration to $0$).
- **Midfoot Roll (Stance Phase)**: $R_{FSR} \approx 5\text{k}\Omega \implies V_{ADC} = 3.3 \times \frac{10}{15} = 2.20\text{V} \implies \text{ADC} \approx 2730$.
- **Heel Strike Impact Peak**: $R_{FSR} \approx 1\text{k}\Omega \implies V_{ADC} = 3.3 \times \frac{10}{11} = 3.00\text{V} \implies \text{ADC} \approx 3720$.

---

### B. MPU-6050 6-DOF IMU Interfacing

The MPU-6050 handles spatial acceleration (±8g) and gyroscopic angular velocity (±1000°/s):

```
       ESP32 DEVKIT                         MPU-6050 BREAKOUT
    ┌─────────────────┐                    ┌─────────────────┐
    │             3V3 ├────────────────────┤ VCC             │
    │             GND ├────────────────────┤ GND             │
    │         GPIO 26 ├────────────────────┤ SDA             │
    │         GPIO 27 ├────────────────────┤ SCL             │
    │                 │                    │ AD0 ───┐        │ (Tied to GND
    │                 │                    │        ▼ GND    │  sets addr: 0x68)
    └─────────────────┘                    └─────────────────┘
```
- **I2C Bus Speed**: 400 kHz Fast Mode initialized via `Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000)`.
- **Placement**: Mounted on the upper lateral ankle or insole arch bridge where foot angular acceleration is highest during heel strike.

---

### C. Haptic Vibration Motor Driver Circuit

Direct GPIO drive can draw over 80mA, which exceeds ESP32's 12mA pin limit and damages the silicon. An NPN transistor with a flyback protection diode is required:

```
        +3.3V / VBUS Rail
               │
               ├───┐
               │   ▼
            ┌──┴───┴─┐
            │ 1N4001 │ (Flyback diode suppresses inductive kickback)
            └──┬───┬─┘
               │   ▲
               ├───┘
               │
           ┌───┴───┐
           │ Motor │ (10mm x 2.7mm Coin Vibration Motor)
           └───┬───┘
               │
           Collector
               │
   GPIO 12 ────[ 1 kΩ ]────► Base (2N2222 or BC547)
               │
            Emitter
               │
              GND
```

---

### D. Portable Power & LiPo Charging Sub-System

Each foot contains an autonomous power bank embedded in an ankle sleeve or lateral heel cuff:

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    TP4056 CHARGER MODULE                     │
  │                                                              │
  │ [Type-C / USB] ──► 5V In                                     │
  │                     BAT+ ────► 3.7V LiPo Battery (+)         │
  │                     BAT- ────► 3.7V LiPo Battery (-)         │
  │                                                              │
  │                     OUT+ ────► [SPST Power Switch] ──► VIN   │ (ESP32)
  │                     OUT- ─────────────────────────────► GND  │ (ESP32)
  └──────────────────────────────────────────────────────────────┘
```
- **Battery**: 3.7V Single-Cell Lithium Polymer (500 mAh to 1200 mAh).
- **Run Time**: ~7.5 hours continuous at 50 Hz TinyML execution + 1 Hz Wi-Fi telemetry transmission.
- **Charging**: Recharged via standard Type-C / Micro-USB cable without removing insole.

---

## 6. Physical Insole Sensor Layout

```
         LEFT FOOT INSOLE                       RIGHT FOOT INSOLE
      ┌─────────────────────┐                ┌─────────────────────┐
      │      /\     /\      │                │      /\     /\      │
      │     /  \___/  \     │                │     /  \___/  \     │
      │    │  FOREFOOT │    │                │    │  FOREFOOT │    │
      │    │ [L-FSR 2] │    │                │    │ [R-FSR 2] │    │
      │    │(Metatarsal)│   │                │    │(Metatarsal)│   │
      │     \         /     │                │     \         /     │
      │      \       /      │                │      \       /      │
      │       │     │       │                │       │     │       │
      │       │ARCH │       │                │       │ARCH │       │
      │      /       \      │                │      /       \      │
      │     │  HEEL   │     │                │     │  HEEL   │     │
      │     │ [L-FSR 1]│    │                │     │ [R-FSR 1]│    │
      │     │(Calcaneus)    │                │     │(Calcaneus)    │
      │      \_______/      │                │      \_______/      │
      └─────────────────────┘                └─────────────────────┘
```

---

## 7. Bill of Materials (BOM) for Bilateral Setup

| Component | Specification | Quantity (Both Legs) | Notes / Source |
|:---|:---|:---:|:---|
| **ESP32 DevKit V1** | 30-pin Dual-Core 240MHz, Wi-Fi/BLE | **2** | 1 Left, 1 Right |
| **Square FSR Sensors** | 1.5" x 1.5" (38mm x 38mm) Piezoresistive | **4** | 2 per foot (Heel + Ball) |
| **MPU-6050 Breakout** | 3-axis Accel + 3-axis Gyro (GY-521) | **2** | 1 per foot |
| **LiPo Battery** | 3.7V 800mAh–1200mAh 1S LiPo | **2** | Slim profile for shoe / cuff |
| **TP4056 Charger Module** | Type-C with dual battery protection | **2** | 1 per foot |
| **Coin Vibration Motors** | 1027 3V 10mm Flat Coin Motors | **2** | Haptic alerts |
| **2N2222 NPN Transistors** | TO-92 or SOT-23 NPN | **2** | Motor switching |
| **1N4001 Diodes** | 1A 50V Flyback Diode | **2** | Motor protection |
| **Tactile Push Buttons** | 6mm Momentary Push Button | **2** | SOS / Cancel buttons |
| **3mm / 5mm LEDs** | 2x Red, 2x Green, 2x Blue | **6** | Indicator lights |
| **Resistors** | 10 kΩ (4x), 1 kΩ (2x), 220 Ω (6x), 100 kΩ (4x)| **16** | 1% metal film |
| **Ribbon / Flex Cable** | 4-conductor flexible silicone wire | ~2 meters | Insole-to-MCU routing |
| **Shoe Insoles** | Trim-to-fit EVA athletic insoles | **1 pair** | Base substrate |

---

## 8. Assembly & Wiring Best Practices

1. **Strain Relief**: Solder thin flexible silicone wire (28–30 AWG) directly to the FSR tail pins. Reinforce all solder joints with double-layer heat-shrink tubing to prevent stress fractures during walking flexure.
2. **Moisture Sealing**: Coat all sensor joints and board solder pads with silicone sealant or conformal coating to protect against foot perspiration.
3. **Smooth Arch Routing**: Route ribbon cables along the medial arch curve of the insole where ground pressure is minimal. Never place solder joints directly beneath the heel calcaneus or metatarsal heads.
4. **Antenna Clearance**: Ensure the PCB trace antenna of the ESP32 is pointed upward and not enclosed in metal or conductive carbon fiber so that 2.4 GHz Wi-Fi transmission remains at full range.
