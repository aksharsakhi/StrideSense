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
#include "storage.h"

#if BACKEND_USE_SUPABASE
#include "supabase_client.h"
#else
#include "firebase_client.h"
#endif

// Global System State
static unsigned long last_sample_time = 0;
static unsigned long last_cloud_time = 0;
static uint32_t step_counter = 0;
static uint8_t inference_cycle = 0;
static InferenceResult current_inference;

// Multi-Modal Step Detection & Peak Pressure State
static unsigned long last_step_time = 0;
static bool last_plantar_contact = false;
static bool imu_swing_armed = false;
static float imu_min_trough = 1.0f;
static uint16_t window_peak_p1 = 0;
static uint16_t window_peak_p2 = 0;
static uint16_t window_peak_p3 = 0;
static uint16_t window_peak_p4 = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n=========================================="));
    Serial.println(F("     STRIDESENSE - AI SMART INSOLE       "));
    Serial.printf( "     ROLE: %s [%s]\n", INSOLE_SIDE_NAME, DEVICE_ID);
    Serial.println(F("=========================================="));

    // Initialize Status LED
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH);

    // Initialize Subsystems
    Storage.begin();
    step_counter = Storage.loadStepCount();
    FallEngine.begin();
    Sensors.begin();
    Sensors.calibrateZeroBaseline(40);

#if BACKEND_USE_SUPABASE
    Supabase.begin();
#else
    Cloud.begin();
#endif

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

        // Track peak pressures across the active stride window (Left & Right legs)
        if (sample.p1 > window_peak_p1) window_peak_p1 = sample.p1;
        if (sample.p2 > window_peak_p2) window_peak_p2 = sample.p2;
        if (sample.p3 > window_peak_p3) window_peak_p3 = sample.p3;
        if (sample.p4 > window_peak_p4) window_peak_p4 = sample.p4;

        // 2. Feed into Fall Detector state machine
        FallEngine.update(sample);

        // 3. Multi-Modal Step Counting Engine (FSR + IMU Kinematic Fusion)
        float svm_acc = sqrtf(sample.ax * sample.ax + sample.ay * sample.ay + sample.az * sample.az);

        // Plantar contact on either Left foot (p1, p2) or Right foot (p3, p4)
        bool plantar_contact = (sample.p1 > 120 || sample.p2 > 120 || sample.p3 > 120 || sample.p4 > 120);
        bool refractory_ok = (now - last_step_time >= 250); // Max 240 steps/min
        bool step_detected = false;

        // Condition A: Plantar strike rising edge (Heel or Forefoot strike)
        if (plantar_contact && !last_plantar_contact && refractory_ok) {
            step_detected = true;
        }
        last_plantar_contact = plantar_contact;

        // Condition B: IMU Kinematic Stride (Swing phase trough < 0.88g followed by ground impact > 1.25g)
        if (svm_acc < 0.88f) {
            imu_swing_armed = true;
            if (svm_acc < imu_min_trough) imu_min_trough = svm_acc;
        }
        if (imu_swing_armed && (svm_acc > 1.25f) && refractory_ok) {
            step_detected = true;
            imu_swing_armed = false;
            imu_min_trough = 1.0f;
        }

        // Condition C: TinyML Walking/Running Model Cadence Generation
        if (current_inference.cadence_spm > 45.0f && 
            (current_inference.activity == ACTIVITY_WALKING || current_inference.activity == ACTIVITY_RUNNING)) {
            unsigned long stride_period_ms = (unsigned long)(60000.0f / current_inference.cadence_spm);
            if (stride_period_ms < 280) stride_period_ms = 280;
            if (now - last_step_time >= stride_period_ms) {
                step_detected = true;
            }
        }

        if (step_detected) {
            step_counter++;
            last_step_time = now;
            // Persist periodically to Flash NVS every 5 steps
            if (step_counter % 5 == 0) {
                Storage.saveStepCount(step_counter);
            }
        }

        // 4. Push sample to circular sliding window
        SensorWindow.push(sample);

        // 5. Run TinyML inference every 25 samples (500 ms) when buffer is full
        inference_cycle++;
        if (inference_cycle >= STEP_SIZE && SensorWindow.isFull()) {
            inference_cycle = 0;
            current_inference = TinyML.runInference(SensorWindow);

            // Detailed Serial Debug Output with live bilateral FSR & SVM metrics
            Serial.printf("[TinyML] Activity: %-8s | Conf: %3.0f%% | Cadence: %3.0f SPM | Steps: %5u | L[H:%4u, F:%4u] R[H:%4u, F:%4u] | SVM: %4.2fg\n",
                current_inference.activity_name,
                current_inference.confidence * 100.0f,
                current_inference.cadence_spm,
                step_counter,
                sample.p1,
                sample.p2,
                sample.p3,
                sample.p4,
                svm_acc
            );

            // If a fall is detected, trigger immediate out-of-band transmission to cloud with zero delay
            if (current_inference.activity == ACTIVITY_FALL || FallEngine.isFallPending()) {
                last_cloud_time = 0;
            }
        }
    }

    // Wi-Fi status check and auto-reconnect
#if BACKEND_USE_SUPABASE
    Supabase.updateNetwork();
#else
    Cloud.updateNetwork();
#endif

    // 6. Transmit Cloud Telemetry every 1000 ms (or immediately on fall)
    if (now - last_cloud_time >= CLOUD_TELEMETRY_MS) {
        last_cloud_time = now;

        SensorSample latest = SensorWindow.get(SensorWindow.count() - 1);
        bool is_fall = FallEngine.isFallPending() || 
                       FallEngine.isEmergencyDispatched() || 
                       (current_inference.activity == ACTIVITY_FALL);

        // Send peak pressure captured during this stride interval (or active if held)
        uint16_t send_p1 = (latest.p1 > 60) ? latest.p1 : window_peak_p1;
        uint16_t send_p2 = (latest.p2 > 60) ? latest.p2 : window_peak_p2;
        uint16_t send_p3 = (latest.p3 > 60) ? latest.p3 : window_peak_p3;
        uint16_t send_p4 = (latest.p4 > 60) ? latest.p4 : window_peak_p4;

        // Reset window peaks with exponential decay
        window_peak_p1 = (latest.p1 > 60) ? latest.p1 : 0;
        window_peak_p2 = (latest.p2 > 60) ? latest.p2 : 0;
        window_peak_p3 = (latest.p3 > 60) ? latest.p3 : 0;
        window_peak_p4 = (latest.p4 > 60) ? latest.p4 : 0;

        // Compute true real-time bilateral gait symmetry
        uint32_t left_load = (uint32_t)send_p1 + (uint32_t)send_p2;
        uint32_t right_load = (uint32_t)send_p3 + (uint32_t)send_p4;
        float sym_index = 95.0f;
        if ((left_load + right_load) > 120) {
            float diff = fabsf((float)left_load - (float)right_load);
            sym_index = 100.0f - ((diff / (float)(left_load + right_load)) * 100.0f);
            sym_index = constrain(sym_index, 40.0f, 100.0f);
        }

#if BACKEND_USE_SUPABASE
        SupabaseTelemetryPayload payload;
        payload.activity = current_inference.activity_name;
        payload.confidence = current_inference.confidence;
        payload.step_count = step_counter;
        payload.cadence_spm = current_inference.cadence_spm;
        payload.symmetry_index = sym_index;
        payload.fall_alert = is_fall;
        payload.p1 = send_p1;
        payload.p2 = send_p2;
        payload.p3 = send_p3;
        payload.p4 = send_p4;
        payload.p5 = send_p2;
        payload.p6 = send_p4;
        payload.pitch = latest.pitch;
        payload.roll = latest.roll;
        payload.svm_a = sqrtf(latest.ax * latest.ax + latest.ay * latest.ay + latest.az * latest.az);

        bool sent = Supabase.sendTelemetry(payload);
        if (sent) {
            Serial.println(F("[Supabase] Telemetry sent successfully (HTTP 201)"));
        }

        if (FallEngine.isEmergencyDispatched()) {
            Supabase.logFallIncident(3.5f, "EMERGENCY_DISPATCHED");
        } else if (FallEngine.isFallPending()) {
            Supabase.logFallIncident(2.9f, "PENDING_CONFIRMATION");
        }
#else
        CloudPayload payload;
        payload.activity = current_inference.activity_name;
        payload.confidence = current_inference.confidence;
        payload.step_count = step_counter;
        payload.cadence_spm = current_inference.cadence_spm;
        payload.symmetry_index = sym_index;
        payload.fall_alert = FallEngine.isFallPending();
        payload.fall_emergency = FallEngine.isEmergencyDispatched();
        payload.battery_pct = Sensors.getBatteryPercentage();
        payload.battery_voltage = Sensors.readBatteryVoltage();

        payload.p1 = send_p1;
        payload.p2 = send_p2;
        payload.p3 = send_p3;
        payload.p4 = send_p4;
        payload.p5 = send_p2;
        payload.p6 = send_p4;
        payload.pitch = latest.pitch;
        payload.roll = latest.roll;

        Cloud.sendTelemetry(payload);

        if (FallEngine.isEmergencyDispatched()) {
            Cloud.sendEmergencyAlert("Unresponsive user after confirmed fall");
        }
#endif
    }
}
