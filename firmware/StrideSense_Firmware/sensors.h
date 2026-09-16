/**
 * StrideSense - Sensor Driver Header
 * Handles MPU6050 (I2C) and 6x FSR (ADC) acquisition and scaling.
 */

#ifndef STRIDESENSE_SENSORS_H
#define STRIDESENSE_SENSORS_H

#include <Arduino.h>
#include <Wire.h>
#include "config.h"

struct SensorSample {
    uint16_t p1; // Heel
    uint16_t p2; // Midfoot Lateral
    uint16_t p3; // Midfoot Medial
    uint16_t p4; // Forefoot Lateral
    uint16_t p5; // Forefoot Medial
    uint16_t p6; // Big Toe

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

    uint16_t fsr_baseline[6];
};

extern SensorsManager Sensors;

#endif // STRIDESENSE_SENSORS_H
