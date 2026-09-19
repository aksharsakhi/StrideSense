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

// FSR Pressure Sensors (ESP32 ADC1 channels - safe with Wi-Fi active)
#define PIN_FSR_S1_HEEL       36  // VP / SENSOR_VP (FSR 1: Calcaneus / Heel)
#define PIN_FSR_S2_FOREFOOT   39  // VN / SENSOR_VN (FSR 2: Metatarsal / Forefoot Ball)

// MPU-6050 IMU (I2C Bus)
#define PIN_I2C_SDA           21  // ESP32 default SDA
#define PIN_I2C_SCL           22  // ESP32 default SCL
#define MPU6050_I2C_ADDR      0x68

// Indicators & Actuators
#define PIN_STATUS_LED        2   // Onboard Blue LED
#define PIN_LED_RED           25  // Fall / Alert Indicator LED
#define PIN_LED_GREEN         26  // Wi-Fi / Active Status Indicator LED
#define PIN_LED_BLUE          27  // Cloud Sync Indicator LED
#define PIN_HAPTIC_MOTOR      12  // Coin Vibration Motor driver (via NPN Transistor)
#define PIN_SOS_BUTTON        14  // Emergency / Fall Cancel Button (Active LOW)

// Battery Monitoring (Optional 100k/100k voltage divider)
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
// 4. WI-FI & CLOUD BACKEND CONFIGURATION
// ==========================================
#define WIFI_SSID             "LADDA"
#define WIFI_PASSWORD         "ladda5555"
#define DEVICE_ID             "insole_left_01"

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
