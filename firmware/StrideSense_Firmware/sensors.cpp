/**
 * StrideSense - Sensor Driver Implementation
 * Configures ESP32 ADC, Wire I2C, MPU6050 registers, and reads all channels.
 */

#include "sensors.h"
#include <Wire.h>
#include <math.h>

SensorsManager Sensors;

SensorsManager::SensorsManager()
    : ax_offset(0), ay_offset(0), az_offset(0),
      gx_offset(0), gy_offset(0), gz_offset(0),
      r_heel_threshold(FSR_R_HEEL_DEFAULT_THRESHOLD),
      last_raw_r_heel(0),
      last_r_heel_pressed(false),
      mpu_i2c_addr(MPU6050_I2C_ADDR),
      mpu_connected(false) {
    for (int i = 0; i < 4; i++) {
        fsr_baseline[i] = 0;
    }
    fsr_baseline[2] = 1900; // Expected untouched baseline for Right Heel (GPIO 34)
}

bool SensorsManager::begin() {
    // Configure all 4 FSR ADC pins on ESP32 ADC1 (safe with active Wi-Fi)
    pinMode(PIN_FSR_L_HEEL, INPUT);      // GPIO 36 (Left Heel)
    pinMode(PIN_FSR_L_FOREFOOT, INPUT);  // GPIO 39 (Left Forefoot)
    pinMode(PIN_FSR_R_HEEL, INPUT);      // GPIO 34 (Right Heel)
    pinMode(PIN_FSR_R_FOREFOOT, INPUT);  // GPIO 35 (Right Forefoot)
    pinMode(PIN_BATTERY_ADC, INPUT);     // GPIO 33 (Battery)

    // Set 12-bit ADC resolution (0 - 4095) with full 0-3.3V attenuation (ADC_11db)
    analogReadResolution(12);
    analogSetPinAttenuation(PIN_FSR_L_HEEL, ADC_11db);
    analogSetPinAttenuation(PIN_FSR_L_FOREFOOT, ADC_11db);
    analogSetPinAttenuation(PIN_FSR_R_HEEL, ADC_11db);
    analogSetPinAttenuation(PIN_FSR_R_FOREFOOT, ADC_11db);
    analogSetPinAttenuation(PIN_BATTERY_ADC, ADC_11db);

    // Initialize Hardware I2C for MPU-6050 (GPIO 21 = SDA, GPIO 22 = SCL)
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000); // 400 kHz Fast-Mode I2C

    // Probe primary MPU-6050 address 0x68 (AD0 connected to GND)
    Wire.beginTransmission(0x68);
    Wire.write(0x75); // WHO_AM_I register
    if (Wire.endTransmission() == 0) {
        mpu_i2c_addr = 0x68;
        mpu_connected = true;
        Serial.println(F("[Sensors] [✓] MPU-6050 detected at I2C address 0x68."));
    } else {
        // Probe secondary address 0x69 (AD0 pulled to 3.3V or floating)
        Wire.beginTransmission(0x69);
        Wire.write(0x75);
        if (Wire.endTransmission() == 0) {
            mpu_i2c_addr = 0x69;
            mpu_connected = true;
            Serial.println(F("[Sensors] [✓] MPU-6050 detected at alternate I2C address 0x69."));
        } else {
            mpu_connected = false;
            Serial.println(F("[Sensors] [❌ WARNING] MPU-6050 NOT detected on I2C bus (checked 0x68 & 0x69)!"));
            Serial.println(F("[Sensors] [❌ CHECK] Verify SDA -> G21, SCL -> G22, VCC -> 3V3, GND -> GND."));
            return false;
        }
    }

    initMPU6050();
    Serial.println(F("[Sensors] MPU-6050 and 4x Bilateral FSR ADC channels initialized successfully."));
    return true;
}

void SensorsManager::initMPU6050() {
    // 1. Wake up MPU6050 (clear SLEEP bit in PWR_MGMT_1)
    Wire.beginTransmission(mpu_i2c_addr);
    Wire.write(0x6B); // PWR_MGMT_1
    Wire.write(0x00); // Internal 8MHz oscillator
    Wire.endTransmission();

    // 2. Configure Accelerometer Full-Scale Range (±8g)
    Wire.beginTransmission(mpu_i2c_addr);
    Wire.write(0x1C); // ACCEL_CONFIG
    Wire.write(0x10); // ±8g range (4096 LSB/g)
    Wire.endTransmission();

    // 3. Configure Gyroscope Full-Scale Range (±1000 deg/s)
    Wire.beginTransmission(mpu_i2c_addr);
    Wire.write(0x1B); // GYRO_CONFIG
    Wire.write(0x10); // ±1000 deg/s (32.8 LSB/(deg/s))
    Wire.endTransmission();

    // 4. Low-pass filter (DLPF_CFG = 2 -> ~44 Hz bandwidth)
    Wire.beginTransmission(mpu_i2c_addr);
    Wire.write(0x1A); // CONFIG
    Wire.write(0x02);
    Wire.endTransmission();
}

uint16_t SensorsManager::readAveragedADC(uint8_t pin, uint8_t count) {
    uint32_t sum = 0;
    for (uint8_t i = 0; i < count; i++) {
        sum += analogRead(pin);
    }
    return (uint16_t)(sum / count);
}

void SensorsManager::readMPU6050(float &ax, float &ay, float &az, float &gx, float &gy, float &gz) {
    if (!mpu_connected) {
        ax = ay = gx = gy = gz = 0.0f;
        az = 1.0f;
        return;
    }

    Wire.beginTransmission(mpu_i2c_addr);
    Wire.write(0x3B); // ACCEL_XOUT_H
    Wire.endTransmission(false);
    Wire.requestFrom((uint8_t)mpu_i2c_addr, (uint8_t)14, (uint8_t)true);

    if (Wire.available() >= 14) {
        int16_t raw_ax = (Wire.read() << 8) | Wire.read();
        int16_t raw_ay = (Wire.read() << 8) | Wire.read();
        int16_t raw_az = (Wire.read() << 8) | Wire.read();
        Wire.read(); Wire.read(); // Skip temperature
        int16_t raw_gx = (Wire.read() << 8) | Wire.read();
        int16_t raw_gy = (Wire.read() << 8) | Wire.read();
        int16_t raw_gz = (Wire.read() << 8) | Wire.read();

        // Convert to g (±8g scale: 4096.0 LSB/g)
        ax = ((float)raw_ax / 4096.0f) - ax_offset;
        ay = ((float)raw_ay / 4096.0f) - ay_offset;
        az = ((float)raw_az / 4096.0f) - az_offset;

        // Convert to deg/s (±1000 deg/s scale: 32.8 LSB/(deg/s))
        gx = ((float)raw_gx / 32.8f) - gx_offset;
        gy = ((float)raw_gy / 32.8f) - gy_offset;
        gz = ((float)raw_gz / 32.8f) - gz_offset;
    } else {
        ax = ay = gx = gy = gz = 0.0f;
        az = 1.0f;
    }
}

bool SensorsManager::readSample(SensorSample &sample) {
    sample.timestamp_ms = millis();

    // Read all 4 FSR ADC channels (Left & Right legs)
    uint16_t raw_l_heel     = readAveragedADC(PIN_FSR_L_HEEL);
    uint16_t raw_l_forefoot = readAveragedADC(PIN_FSR_L_FOREFOOT);
    uint16_t raw_r_heel     = readAveragedADC(PIN_FSR_R_HEEL);
    uint16_t raw_r_forefoot = readAveragedADC(PIN_FSR_R_FOREFOOT);

    last_raw_r_heel = raw_r_heel;

    // Standard 3 FSRs (Left Heel, Left Forefoot, Right Forefoot) - untouched baseline sits near 0
    sample.p1 = (raw_l_heel > fsr_baseline[0]) ? (raw_l_heel - fsr_baseline[0]) : 0;
    sample.p2 = (raw_l_forefoot > fsr_baseline[1]) ? (raw_l_forefoot - fsr_baseline[1]) : 0;
    sample.p4 = (raw_r_forefoot > fsr_baseline[3]) ? (raw_r_forefoot - fsr_baseline[3]) : 0;
    sample.p5 = sample.p2; // Map Left forefoot reading to zone 5
    sample.p6 = sample.p4; // Map Right forefoot reading to zone 6

    // Dedicated Right Heel (GPIO 34) Threshold & Pressure Detection Logic:
    // Untouched ADC reading is ~1700 - 1950.
    // When pressed, ADC reading increases to >= r_heel_threshold (validated >= 2100).
    bool r_pressed = (raw_r_heel >= r_heel_threshold);
    last_r_heel_pressed = r_pressed;

    sample.raw_r_heel = raw_r_heel;
    sample.r_heel_pressed = r_pressed;

    // Net pressure p3 for Right Heel:
    // If pressed, compute active pressure above baseline; if untouched, set to 0.
    if (r_pressed) {
        sample.p3 = (raw_r_heel > fsr_baseline[2]) ? (raw_r_heel - fsr_baseline[2]) : (raw_r_heel - 1900);
    } else {
        sample.p3 = 0; // Untouched resting baseline -> 0 pressure
    }

    // Read MPU6050
    readMPU6050(sample.ax, sample.ay, sample.az, sample.gx, sample.gy, sample.gz);

    // Calculate orientation angles (pitch and roll in degrees)
    sample.pitch = atan2f(-sample.ax, sqrtf(sample.ay * sample.ay + sample.az * sample.az)) * (180.0f / M_PI);
    sample.roll  = atan2f(sample.ay, sample.az) * (180.0f / M_PI);

    return true;
}

void SensorsManager::calibrateZeroBaseline(int samples) {
    Serial.println(F("[Sensors] Calibrating zero-force baseline and IMU bias for 4-FSR bilateral setup..."));
    long p_sums[4] = {0, 0, 0, 0};
    float ax_sum = 0, ay_sum = 0, az_sum = 0;
    float gx_sum = 0, gy_sum = 0, gz_sum = 0;

    for (int i = 0; i < samples; i++) {
        p_sums[0] += analogRead(PIN_FSR_L_HEEL);
        p_sums[1] += analogRead(PIN_FSR_L_FOREFOOT);
        p_sums[2] += analogRead(PIN_FSR_R_HEEL);
        p_sums[3] += analogRead(PIN_FSR_R_FOREFOOT);

        float a_x, a_y, a_z, g_x, g_y, g_z;
        readMPU6050(a_x, a_y, a_z, g_x, g_y, g_z);
        ax_sum += a_x;
        ay_sum += a_y;
        az_sum += (a_z - 1.0f); // Compensate 1g gravity on Z
        gx_sum += g_x;
        gy_sum += g_y;
        gz_sum += g_z;
        delay(15);
    }

    for (int i = 0; i < 4; i++) {
        uint16_t avg = (uint16_t)(p_sums[i] / samples);
        if (i == 2) {
            // Right Heel FSR (GPIO 34): Untouched resting reading is ~1700 - 1950 ADC.
            // Determine dynamic threshold based on actual calibrated sensor reading.
            if (avg >= 1500 && avg <= FSR_R_HEEL_MAX_UNTOUCHED) {
                fsr_baseline[2] = avg;
                uint16_t calc_thresh = avg + FSR_R_HEEL_DELTA_THRESHOLD;
                r_heel_threshold = (calc_thresh > FSR_R_HEEL_DEFAULT_THRESHOLD) ? calc_thresh : FSR_R_HEEL_DEFAULT_THRESHOLD;
            } else {
                // If touched or outside typical resting range at boot, use validated defaults
                fsr_baseline[2] = 1900;
                r_heel_threshold = FSR_R_HEEL_DEFAULT_THRESHOLD;
            }
        } else {
            // Standard FSRs (L_Heel, L_Forefoot, R_Forefoot) sit near 0; cap baseline to 100 max
            fsr_baseline[i] = (avg > 100) ? 100 : avg;
        }
    }

    ax_offset = ax_sum / samples;
    ay_offset = ay_sum / samples;
    az_offset = az_sum / samples;
    gx_offset = gx_sum / samples;
    gy_offset = gy_sum / samples;
    gz_offset = gz_sum / samples;

    Serial.printf("[Sensors] Calibration complete. FSR Baselines: L_Heel=%u, L_Forefoot=%u, R_Heel=%u (Dynamic Thresh: %u), R_Forefoot=%u\n",
                  fsr_baseline[0], fsr_baseline[1], fsr_baseline[2], r_heel_threshold, fsr_baseline[3]);
}

float SensorsManager::readBatteryVoltage() {
    uint16_t raw = analogRead(PIN_BATTERY_ADC);
    // Standard 2:1 resistor divider (100k / 100k) from 3.7V LiPo to ESP32 ADC
    float v_adc = (raw / 4095.0f) * 3.3f;
    return v_adc * 2.0f; // Battery actual voltage
}

int SensorsManager::getBatteryPercentage() {
    float voltage = readBatteryVoltage();
    if (voltage >= 4.20f) return 100;
    if (voltage <= 3.30f) return 0;
    // Linear approximation between 3.3V (0%) and 4.2V (100%)
    return (int)(((voltage - 3.30f) / 0.90f) * 100.0f);
}
