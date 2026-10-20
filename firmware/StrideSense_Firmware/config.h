/**
 * StrideSense - Hardware & Firmware Configuration
 * Pin definitions, operational thresholds, and network settings for ESP32.
 */

#ifndef STRIDESENSE_CONFIG_H
#define STRIDESENSE_CONFIG_H

#include <Arduino.h>

// ==========================================
// 1. HARDWARE SELECTION & PIN CONFIGURATION
// ==========================================

// Hardware Mode: Standard 2x Square FSR Kit (Heel + Forefoot)
#define FSR_SENSOR_COUNT      2

// FSR Pressure Sensors (ESP32 ADC1 channels - 100% safe with Wi-Fi active)
#define PIN_FSR_S1_HEEL       36  // GPIO 36 (ADC1_CH0: SENSOR_VP - Calcaneus / Heel)
#define PIN_FSR_S2_FOREFOOT   39  // GPIO 39 (ADC1_CH3: SENSOR_VN - Metatarsal / Forefoot Ball)
// Alternate ADC1 pins (auto-sensed by firmware if wired to D34 / D35)
#define PIN_FSR_S1_ALT        34  // GPIO 34 (ADC1_CH6)
#define PIN_FSR_S2_ALT        35  // GPIO 35 (ADC1_CH7)

// MPU-6050 IMU (Hardware Native I2C Bus on ESP32)
#define PIN_I2C_SDA           21  // ESP32 SDA -> GPIO 21
#define PIN_I2C_SCL           22  // ESP32 SCL -> GPIO 22
#define MPU6050_I2C_ADDR      0x68

// Indicators & Actuators (Single LED Setup: Uses Onboard Blue LED on GPIO 2)
#define PIN_STATUS_LED        2   // Single Multi-Status LED (Onboard ESP32 LED / 1x External LED)
#define PIN_HAPTIC_MOTOR      12  // Coin Vibration Motor driver (via NPN Transistor)
#define PIN_SOS_BUTTON        14  // Emergency / Fall Cancel Button (Active LOW with internal pullup)

// Battery Monitoring (Optional 100k/100k voltage divider on ADC1 channel)
#define PIN_BATTERY_ADC       34  // GPIO 34 (ADC1_CH6 - Safe with Wi-Fi)

// ==========================================
// 2. TIMING & SAMPLING CONSTANTS
// ==========================================
#define SAMPLING_FREQ_HZ      50
#define SAMPLING_PERIOD_MS    (1000 / SAMPLING_FREQ_HZ) // 20 ms
#define WINDOW_SIZE           50                        // 1.0 second window
#define STEP_SIZE             25                        // 50% overlap (0.5s inference)
#define CLOUD_TELEMETRY_MS    1000                      // 1 Hz cloud update

// ==========================================
// 3. FALL DETECTION THRESHOLDS
// ==========================================
#define FALL_FREE_FALL_G      0.60f  // Under 0.6g indicates airborne free-fall
#define FALL_IMPACT_G         2.80f  // Above 2.8g indicates impact collision
#define FALL_ORIENTATION_TILT 50.0f  // Significant post-impact angle shift (deg)
#define FALL_CANCEL_WINDOW_MS 15000  // 15 seconds to cancel accidental fall alert

// ==========================================
// 4. BILATERAL ROLE & CLOUD CONFIGURATION
// ==========================================
#define INSOLE_SIDE_LEFT      0
#define INSOLE_SIDE_RIGHT     1

// >>> SELECT INSOLE ROLE FOR THIS PHYSICAL ESP32 BOARD <<<
// Flash Left Foot ESP32:  Set to INSOLE_SIDE_LEFT
// Flash Right Foot ESP32: Set to INSOLE_SIDE_RIGHT
#ifndef INSOLE_SIDE
#define INSOLE_SIDE           INSOLE_SIDE_LEFT
#endif

#if (INSOLE_SIDE == INSOLE_SIDE_LEFT)
  #define DEVICE_ID           "insole_left_01"
  #define INSOLE_SIDE_NAME    "LEFT INSOLE"
#else
  #define DEVICE_ID           "insole_right_01"
  #define INSOLE_SIDE_NAME    "RIGHT INSOLE"
#endif

#define WIFI_SSID             "LADDA"
#define WIFI_PASSWORD         "ladda5555"

// Active Cloud Backend: 1 = Supabase (Recommended), 0 = Firebase
#define BACKEND_USE_SUPABASE  1

// Supabase Configuration (PostgreSQL PostgREST & WebSockets CDC)
#define SUPABASE_HOST         "https://sgooptohhldguitvhbrl.supabase.co"
#define SUPABASE_PUBLISHABLE_KEY "sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI"
#define SUPABASE_ENDPOINT     "/rest/v1/telemetry"

// Firebase Configuration (Optional Fallback)
#define FIREBASE_HOST         "https://stridesense-iot-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH_KEY     "YOUR_FIREBASE_DATABASE_SECRET"

#endif // STRIDESENSE_CONFIG_H
