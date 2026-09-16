/**
 * StrideSense - Wi-Fi & Firebase Cloud Client Header
 */

#ifndef STRIDESENSE_FIREBASE_CLIENT_H
#define STRIDESENSE_FIREBASE_CLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "config.h"
#include "tinyml_infer.h"
#include "fall_detector.h"

struct CloudPayload {
    const char* activity;
    float confidence;
    uint32_t step_count;
    float cadence_spm;
    float symmetry_index;
    bool fall_alert;
    bool fall_emergency;
    int battery_pct;
    float battery_voltage;

    // Pressure distribution snapshot
    uint16_t p1, p2, p3, p4, p5, p6;
    float pitch, roll;
};

class FirebaseCloudClient {
public:
    FirebaseCloudClient();
    void begin();
    void updateNetwork();
    bool isConnected() const;
    bool sendTelemetry(const CloudPayload &payload);
    bool sendEmergencyAlert(const char* reason);

private:
    unsigned long last_wifi_check;
    WiFiClientSecure secureClient;
};

extern FirebaseCloudClient Cloud;

#endif // STRIDESENSE_FIREBASE_CLIENT_H
