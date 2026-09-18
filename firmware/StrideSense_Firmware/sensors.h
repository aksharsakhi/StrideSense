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
    uint16_t p1; // Heel (FSR 1, GPIO 36)
    uint16_t p2; // Forefoot Ball (FSR 2, GPIO 39)
    uint16_t p3; // Reserved / 0
    uint16_t p4; // Reserved / 0
    uint16_t p5; // Forefoot Medial mapped
    uint16_t p6; // Reserved / 0

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

    uint16_t fsr_baseline[2];
};

extern SensorsManager Sensors;

#endif // STRIDESENSE_SENSORS_H
