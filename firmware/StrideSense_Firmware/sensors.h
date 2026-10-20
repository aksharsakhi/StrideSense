/**
 * StrideSense - Sensor Driver Header
 * Handles MPU6050 (I2C) and 2x Square FSR (ADC) acquisition and scaling.
 */

#ifndef STRIDESENSE_SENSORS_H
#define STRIDESENSE_SENSORS_H

#include <Arduino.h>
#include <stdint.h>
#include "config.h"

struct SensorSample {
    uint16_t p1; // Left Calcaneus Heel (FSR L1, GPIO 36)
    uint16_t p2; // Left Metatarsal Forefoot Ball (FSR L2, GPIO 39)
    uint16_t p3; // Right Calcaneus Heel (FSR R1, GPIO 34)
    uint16_t p4; // Right Metatarsal Forefoot Ball (FSR R2, GPIO 35)
    uint16_t p5; // Left Forefoot medial mapped
    uint16_t p6; // Right Forefoot medial mapped

    uint16_t raw_r_heel;     // Raw ADC reading for Right Heel (GPIO 34: ~1700-1950 untouched, >2100 pressed)
    bool     r_heel_pressed; // Dedicated pressure-detection status for Right Heel (GPIO 34)

    float ax;    // Accel X (g)
    float ay;    // Accel Y (g)
    float az;    // Accel Z (g)

    float gx;    // Gyro X (deg/s)
    float gy;    // Gyro Y (deg/s)
    float gz;    // Gyro Z (deg/s)

    float pitch; // Estimated pitch (deg)
    float roll;  // Estimated roll (deg)

    unsigned long timestamp_ms;
};

class SensorsManager {
public:
    SensorsManager();
    bool begin();
    bool readSample(SensorSample &sample);
    void calibrateZeroBaseline(int samples = 50);
    float readBatteryVoltage();
    int getBatteryPercentage();
    bool isMPUConnected() const { return mpu_connected; }

    // Dedicated Right Heel (GPIO 34) Accessors
    uint16_t getRightHeelRawADC() const { return last_raw_r_heel; }
    bool isRightHeelPressed() const { return last_r_heel_pressed; }
    uint16_t getRightHeelThreshold() const { return r_heel_threshold; }
    uint16_t getRightHeelBaseline() const { return fsr_baseline[2]; }
    void setRightHeelThreshold(uint16_t thresh) { r_heel_threshold = thresh; }

private:
    void initMPU6050();
    void readMPU6050(float &ax, float &ay, float &az, float &gx, float &gy, float &gz);
    uint16_t readAveragedADC(uint8_t pin, uint8_t count = 4);

    float ax_offset;
    float ay_offset;
    float az_offset;
    float gx_offset;
    float gy_offset;
    float gz_offset;

    uint16_t fsr_baseline[4];
    uint16_t r_heel_threshold;
    uint16_t last_raw_r_heel;
    bool last_r_heel_pressed;

    uint8_t mpu_i2c_addr;
    bool mpu_connected;
};

extern SensorsManager Sensors;

#endif // STRIDESENSE_SENSORS_H
