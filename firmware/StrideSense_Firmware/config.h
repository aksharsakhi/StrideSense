/**
 * StrideSense - Hardware & Firmware Configuration
 * Pin definitions, operational thresholds, and network settings for ESP32.
 */

#ifndef STRIDESENSE_CONFIG_H
#define STRIDESENSE_CONFIG_H

#include <Arduino.h>

// ==========================================
// 1. PIN CONFIGURATION (ESP32 DevKit V1)
// ==========================================

// FSR Pressure Sensors (ESP32 ADC1 channels - safe with Wi-Fi active)
#define PIN_FSR_S1_HEEL       36  // VP (Sensor 1: Calcaneus / Heel)
#define PIN_FSR_S2_MID_LAT    39  // VN (Sensor 2: Midfoot Lateral)
#define PIN_FSR_S3_MID_MED    34  // GPIO 34 (Sensor 3: Midfoot Medial)
#define PIN_FSR_S4_FORE_LAT   35  // GPIO 35 (Sensor 4: 4th-5th Metatarsal)
#define PIN_FSR_S5_FORE_MED   32  // GPIO 32 (Sensor 5: 1st Metatarsal / Ball)
#define PIN_FSR_S6_TOE        33  // GPIO 33 (Sensor 6: Hallux / Big Toe)

// MPU-6050 IMU (I2C)
#define PIN_I2C_SDA           21  // ESP32 default SDA
#define PIN_I2C_SCL           22  // ESP32 default SCL
#define MPU6050_I2C_ADDR      0x68

// Indicators & Actuators
#define PIN_STATUS_LED        2   // Onboard Blue LED
#define PIN_LED_RED           25  // Fall / Alert Indicator
#define PIN_LED_GREEN         26  // Wi-Fi / Active Status Indicator
#define PIN_LED_BLUE          27  // Cloud Sync Indicator
#define PIN_HAPTIC_MOTOR      12  // Vibration Motor / Buzzer output
#define PIN_SOS_BUTTON        14  // Emergency / Fall Cancel Button (Active LOW)

// Battery Monitoring
#define PIN_BATTERY_ADC       4   // Battery voltage divider

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
// 4. WI-FI & FIREBASE CONFIGURATION
// ==========================================
#define WIFI_SSID             "YOUR_WIFI_SSID"
#define WIFI_PASSWORD         "YOUR_WIFI_PASSWORD"
#define FIREBASE_HOST         "https://stridesense-iot-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH_KEY     "YOUR_FIREBASE_DATABASE_SECRET"
#define DEVICE_ID             "insole_left_01"

#endif // STRIDESENSE_CONFIG_H
