/**
 * StrideSense - Dual-Trigger Fall Detector Implementation
 */

#include "fall_detector.h"
#include <math.h>

FallDetector FallEngine;

FallDetector::FallDetector()
    : current_state(FALL_IDLE), freefall_timestamp(0),
      impact_timestamp(0), alert_start_timestamp(0),
      pre_fall_pitch(0), pre_fall_roll(0) {}

void FallDetector::begin() {
    pinMode(PIN_HAPTIC_MOTOR, OUTPUT);
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);

    pinMode(PIN_LED_RED, OUTPUT);
    digitalWrite(PIN_LED_RED, LOW);

    pinMode(PIN_SOS_BUTTON, INPUT_PULLUP);
}

void FallDetector::update(const SensorSample &sample) {
    // Check if user pressed the hardware cancel / SOS button
    if (digitalRead(PIN_SOS_BUTTON) == LOW) {
        if (current_state == FALL_CONFIRMATION_PENDING || current_state == FALL_EMERGENCY_DISPATCHED) {
            cancelAlert();
            return;
        }
    }

    unsigned long now = millis();

    // Signal Vector Magnitude of 3D acceleration: sqrt(ax^2 + ay^2 + az^2)
    float svm_acc = sqrtf(sample.ax * sample.ax + sample.ay * sample.ay + sample.az * sample.az);

    switch (current_state) {
        case FALL_IDLE:
            pre_fall_pitch = sample.pitch;
            pre_fall_roll = sample.roll;

            // Trigger 1: Free-fall drop (< 0.6g)
            if (svm_acc < FALL_FREE_FALL_G) {
                freefall_timestamp = now;
                current_state = FALL_FREEFALL_DETECTED;
            }
            // Or immediate massive collision shock (> 3.5g)
            else if (svm_acc > (FALL_IMPACT_G * 1.25f)) {
                impact_timestamp = now;
                current_state = FALL_IMPACT_DETECTED;
            }
            break;

        case FALL_FREEFALL_DETECTED:
            // Expect impact within 100ms - 800ms of free-fall
            if (now - freefall_timestamp > 800) {
                // Timeout, false alarm (e.g. jumping or fast swing)
                current_state = FALL_IDLE;
            } else if (svm_acc > FALL_IMPACT_G) {
                impact_timestamp = now;
                current_state = FALL_IMPACT_DETECTED;
            }
            break;

        case FALL_IMPACT_DETECTED: {
            // Check post-impact orientation change and settle time (1.5s after impact)
            if (now - impact_timestamp >= 1500) {
                float delta_pitch = fabsf(sample.pitch - pre_fall_pitch);
                float delta_roll = fabsf(sample.roll - pre_fall_roll);

                // If orientation shifted by > 45 degrees or gyroscope is quiet (lying down)
                float gyro_mag = sqrtf(sample.gx * sample.gx + sample.gy * sample.gy + sample.gz * sample.gz);

                if ((delta_pitch > 45.0f || delta_roll > 45.0f) && gyro_mag < 35.0f) {
                    // Confirmed fall -> Enter 15s confirmation grace period
                    current_state = FALL_CONFIRMATION_PENDING;
                    alert_start_timestamp = now;
                    Serial.println(F("[FallEngine] *** POTENTIAL FALL DETECTED! Starting 15s confirmation countdown ***"));
                } else {
                    current_state = FALL_IDLE;
                }
            }
            break;
        }

        case FALL_CONFIRMATION_PENDING: {
            triggerHapticFeedback();

            // Check if 15-second grace period elapsed without user cancellation
            if (now - alert_start_timestamp >= FALL_CANCEL_WINDOW_MS) {
                current_state = FALL_EMERGENCY_DISPATCHED;
                Serial.println(F("[FallEngine] !!! EMERGENCY ALERT DISPATCHED TO CLOUD & CAREGIVER !!!"));
            }
            break;
        }

        case FALL_EMERGENCY_DISPATCHED:
            // Continuous alert
            digitalWrite(PIN_LED_RED, HIGH);
            digitalWrite(PIN_HAPTIC_MOTOR, (now % 400 < 200) ? HIGH : LOW);
            break;
    }
}

void FallDetector::triggerHapticFeedback() {
    // Pulse haptic motor and red LED (200ms ON, 200ms OFF)
    unsigned long now = millis();
    bool pulse = (now % 500 < 250);
    digitalWrite(PIN_HAPTIC_MOTOR, pulse ? HIGH : LOW);
    digitalWrite(PIN_LED_RED, pulse ? HIGH : LOW);
}

void FallDetector::cancelAlert() {
    current_state = FALL_IDLE;
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);
    digitalWrite(PIN_LED_RED, LOW);
    Serial.println(F("[FallEngine] Fall alert successfully CANCELLED by user."));
}

bool FallDetector::isFallPending() const {
    return current_state == FALL_CONFIRMATION_PENDING;
}

bool FallDetector::isEmergencyDispatched() const {
    return current_state == FALL_EMERGENCY_DISPATCHED;
}

int FallDetector::getRemainingCancelSeconds() const {
    if (current_state != FALL_CONFIRMATION_PENDING) return 0;
    unsigned long elapsed = millis() - alert_start_timestamp;
    if (elapsed >= FALL_CANCEL_WINDOW_MS) return 0;
    return (int)((FALL_CANCEL_WINDOW_MS - elapsed) / 1000);
}

FallState FallDetector::getState() const {
    return current_state;
}
