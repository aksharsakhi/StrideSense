/**
 * StrideSense - Sensor Driver Implementation
 * Configures ESP32 ADC, Wire I2C, MPU6050 registers, and reads all channels.
 */

#include "sensors.h"
#include <math.h>

SensorsManager Sensors;

SensorsManager::SensorsManager()
    : ax_offset(0), ay_offset(0), az_offset(0),
      gx_offset(0), gy_offset(0), gz_offset(0) {
    for (int i = 0; i < 6; i++) {
        fsr_baseline[i] = 0;
    }
}

bool SensorsManager::begin() {
    // Configure FSR ADC pins as inputs
    pinMode(PIN_FSR_S1_HEEL, INPUT);
    pinMode(PIN_FSR_S2_FOREFOOT, INPUT);
#if FSR_SENSOR_COUNT >= 6
    pinMode(PIN_FSR_S3_MID_MED, INPUT);
    pinMode(PIN_FSR_S4_FORE_LAT, INPUT);
    pinMode(PIN_FSR_S5_FORE_MED, INPUT);
    pinMode(PIN_FSR_S6_TOE, INPUT);
#endif
    pinMode(PIN_BATTERY_ADC, INPUT);

    // Set 12-bit ADC resolution (0 - 4095)
    analogReadResolution(12);

    // Initialize I2C for MPU-6050
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000); // 400 kHz Fast-Mode I2C

    // Verify MPU-6050 connection
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x75); // WHO_AM_I register
    if (Wire.endTransmission() != 0) {
        Serial.println(F("[Sensors] WARNING: MPU-6050 not detected on I2C bus! Check wiring."));
        return false;
    }

    initMPU6050();
    Serial.println(F("[Sensors] MPU-6050 and ADC initialized successfully."));
    return true;
}

void SensorsManager::initMPU6050() {
    // 1. Wake up MPU6050 (clear SLEEP bit in PWR_MGMT_1)
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x6B); // PWR_MGMT_1
    Wire.write(0x00); // Internal 8MHz oscillator
    Wire.endTransmission();

    // 2. Configure Accelerometer Full-Scale Range (±8g)
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x1C); // ACCEL_CONFIG
    Wire.write(0x10); // ±8g range (4096 LSB/g)
    Wire.endTransmission();

    // 3. Configure Gyroscope Full-Scale Range (±1000 deg/s)
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x1B); // GYRO_CONFIG
    Wire.write(0x10); // ±1000 deg/s (32.8 LSB/(deg/s))
    Wire.endTransmission();

    // 4. Low-pass filter (DLPF_CFG = 2 -> ~44 Hz bandwidth)
    Wire.beginTransmission(MPU6050_I2C_ADDR);
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
    Wire.beginTransmission(MPU6050_I2C_ADDR);
    Wire.write(0x3B); // ACCEL_XOUT_H
    Wire.endTransmission(false);
    Wire.requestFrom((uint8_t)MPU6050_I2C_ADDR, (uint8_t)14, (uint8_t)true);

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

    // Read FSR ADC values with multi-sample smoothing
    sample.p1 = readAveragedADC(PIN_FSR_S1_HEEL);
    sample.p2 = readAveragedADC(PIN_FSR_S2_FOREFOOT);
#if FSR_SENSOR_COUNT == 2
    // 2-Square-FSR kit mode: Heel and Forefoot/Ball
    sample.p3 = 0;
    sample.p4 = 0;
    sample.p5 = sample.p2; // Map forefoot reading to metatarsal zone for TinyML feature balance
    sample.p6 = 0;
#else
    sample.p3 = readAveragedADC(PIN_FSR_S3_MID_MED);
    sample.p4 = readAveragedADC(PIN_FSR_S4_FORE_LAT);
    sample.p5 = readAveragedADC(PIN_FSR_S5_FORE_MED);
    sample.p6 = readAveragedADC(PIN_FSR_S6_TOE);
#endif

    // Apply baseline subtraction (zero-tare)
    sample.p1 = (sample.p1 > fsr_baseline[0]) ? (sample.p1 - fsr_baseline[0]) : 0;
    sample.p2 = (sample.p2 > fsr_baseline[1]) ? (sample.p2 - fsr_baseline[1]) : 0;
    sample.p3 = (sample.p3 > fsr_baseline[2]) ? (sample.p3 - fsr_baseline[2]) : 0;
    sample.p4 = (sample.p4 > fsr_baseline[3]) ? (sample.p4 - fsr_baseline[3]) : 0;
    sample.p5 = (sample.p5 > fsr_baseline[4]) ? (sample.p5 - fsr_baseline[4]) : 0;
    sample.p6 = (sample.p6 > fsr_baseline[5]) ? (sample.p6 - fsr_baseline[5]) : 0;

    // Read MPU6050
    readMPU6050(sample.ax, sample.ay, sample.az, sample.gx, sample.gy, sample.gz);

    // Calculate orientation angles (pitch and roll in degrees)
    sample.pitch = atan2f(-sample.ax, sqrtf(sample.ay * sample.ay + sample.az * sample.az)) * (180.0f / M_PI);
    sample.roll  = atan2f(sample.ay, sample.az) * (180.0f / M_PI);

    return true;
}

void SensorsManager::calibrateZeroBaseline(int samples) {
    Serial.println(F("[Sensors] Calibrating zero-force baseline and IMU bias..."));
    long p_sums[6] = {0};
    float ax_sum = 0, ay_sum = 0, az_sum = 0;
    float gx_sum = 0, gy_sum = 0, gz_sum = 0;

    for (int i = 0; i < samples; i++) {
        p_sums[0] += analogRead(PIN_FSR_S1_HEEL);
        p_sums[1] += analogRead(PIN_FSR_S2_FOREFOOT);
#if FSR_SENSOR_COUNT >= 6
        p_sums[2] += analogRead(PIN_FSR_S3_MID_MED);
        p_sums[3] += analogRead(PIN_FSR_S4_FORE_LAT);
        p_sums[4] += analogRead(PIN_FSR_S5_FORE_MED);
        p_sums[5] += analogRead(PIN_FSR_S6_TOE);
#endif

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

    for (int i = 0; i < 6; i++) {
        fsr_baseline[i] = (uint16_t)(p_sums[i] / samples);
    }

    ax_offset = ax_sum / samples;
    ay_offset = ay_sum / samples;
    az_offset = az_sum / samples;
    gx_offset = gx_sum / samples;
    gy_offset = gy_sum / samples;
    gz_offset = gz_sum / samples;

    Serial.println(F("[Sensors] Calibration complete."));
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
