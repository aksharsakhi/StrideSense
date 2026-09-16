/**
 * StrideSense - AI-Powered Smart Insole Master Firmware
 * Platform: ESP32 DevKit V1
 * Architecture:
 *   1. High-frequency 50 Hz sensor acquisition (6x FSR + MPU6050 6-DOF IMU)
 *   2. Dual-trigger kinematic and biomechanical fall detection engine
 *   3. Real-time edge TinyML inference (<0.4ms) with zero external runtime deps
 *   4. Non-blocking Wi-Fi & Firebase Realtime Database telemetry
 */

#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "filter.h"
#include "fall_detector.h"
#include "tinyml_infer.h"
#include "firebase_client.h"

// Global System State
static unsigned long last_sample_time = 0;
static unsigned long last_cloud_time = 0;
static uint32_t step_counter = 0;
static uint8_t inference_cycle = 0;
static InferenceResult current_inference;
static bool last_heel_strike = false;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n=========================================="));
    Serial.println(F("     STRIDESENSE - AI SMART INSOLE       "));
    Serial.println(F("=========================================="));

    // Initialize Status LED
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH);

    // Initialize Subsystems
    FallEngine.begin();
    Sensors.begin();
    Sensors.calibrateZeroBaseline(40);
    Cloud.begin();

    current_inference.activity = ACTIVITY_STANDING;
    current_inference.confidence = 1.0f;
    current_inference.activity_name = "Standing";
    current_inference.cadence_spm = 0.0f;
    current_inference.heel_forefoot_ratio = 1.0f;
    current_inference.medial_lateral_ratio = 1.0f;

    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println(F("[System] Initialization complete. Starting 50 Hz telemetry loop...\n"));
}

void loop() {
    unsigned long now = millis();

    // Maintain 50 Hz sampling rate (20ms interval)
    if (now - last_sample_time >= SAMPLING_PERIOD_MS) {
        last_sample_time = now;

        // 1. Read all sensors
        SensorSample sample;
        Sensors.readSample(sample);

        // 2. Feed into Fall Detector state machine
        FallEngine.update(sample);

        // 3. Step Counting via Heel-Strike Peak Transition
        bool heel_pressed = (sample.p1 > 1200);
        if (heel_pressed && !last_heel_strike) {
            step_counter++;
        }
        last_heel_strike = heel_pressed;

        // 4. Push sample to circular sliding window
        SensorWindow.push(sample);

        // 5. Run TinyML inference every 25 samples (500 ms) when buffer is full
        inference_cycle++;
        if (inference_cycle >= STEP_SIZE && SensorWindow.isFull()) {
            inference_cycle = 0;
            current_inference = TinyML.runInference(SensorWindow);

            // Serial Debug Output
            Serial.printf("[TinyML] Activity: %-8s | Conf: %3.0f%% | Cadence: %3.0f SPM | Steps: %5u | Latency: %lu us\n",
                current_inference.activity_name,
                current_inference.confidence * 100.0f,
                current_inference.cadence_spm,
                step_counter,
                current_inference.inference_time_us
            );
        }
    }

    // Wi-Fi status check and auto-reconnect
    Cloud.updateNetwork();

    // 6. Transmit Cloud Telemetry every 1000 ms
    if (now - last_cloud_time >= CLOUD_TELEMETRY_MS) {
        last_cloud_time = now;

        SensorSample latest = SensorWindow.get(SensorWindow.count() - 1);

        CloudPayload payload;
        payload.activity = current_inference.activity_name;
        payload.confidence = current_inference.confidence;
        payload.step_count = step_counter;
        payload.cadence_spm = current_inference.cadence_spm;
        // Symmetry index: 100% - deviation between medial and lateral balance
        payload.symmetry_index = constrain(100.0f - (fabsf(1.0f - current_inference.medial_lateral_ratio) * 40.0f), 60.0f, 100.0f);
        payload.fall_alert = FallEngine.isFallPending();
        payload.fall_emergency = FallEngine.isEmergencyDispatched();
        payload.battery_pct = Sensors.getBatteryPercentage();
        payload.battery_voltage = Sensors.readBatteryVoltage();

        payload.p1 = latest.p1;
        payload.p2 = latest.p2;
        payload.p3 = latest.p3;
        payload.p4 = latest.p4;
        payload.p5 = latest.p5;
        payload.p6 = latest.p6;
        payload.pitch = latest.pitch;
        payload.roll = latest.roll;

        Cloud.sendTelemetry(payload);

        if (FallEngine.isEmergencyDispatched()) {
            Cloud.sendEmergencyAlert("Unresponsive user after confirmed fall");
        }
    }
}
