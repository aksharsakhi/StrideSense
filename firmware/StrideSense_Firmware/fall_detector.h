/**
 * StrideSense - Dual-Trigger Fall Detector Header
 * Combines high-speed physical kinematic heuristics with TinyML anomaly verification.
 */

#ifndef STRIDESENSE_FALL_DETECTOR_H
#define STRIDESENSE_FALL_DETECTOR_H

#include <Arduino.h>
#include "sensors.h"
#include "config.h"

enum FallState {
    FALL_IDLE,
    FALL_FREEFALL_DETECTED,
    FALL_IMPACT_DETECTED,
    FALL_CONFIRMATION_PENDING,
    FALL_EMERGENCY_DISPATCHED
};

class FallDetector {
public:
    FallDetector();
    void begin();
    void update(const SensorSample &sample);
    void cancelAlert();
    bool isFallPending() const;
    bool isEmergencyDispatched() const;
    int getRemainingCancelSeconds() const;
    FallState getState() const;

private:
    FallState current_state;
    unsigned long freefall_timestamp;
    unsigned long impact_timestamp;
    unsigned long alert_start_timestamp;

    float pre_fall_pitch;
    float pre_fall_roll;

    void triggerHapticFeedback();
};

extern FallDetector FallEngine;

#endif // STRIDESENSE_FALL_DETECTOR_H
