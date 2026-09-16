/**
 * StrideSense - Supabase PostgREST Client Header for ESP32
 */

#ifndef STRIDESENSE_SUPABASE_CLIENT_H
#define STRIDESENSE_SUPABASE_CLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "config.h"

struct SupabaseTelemetryPayload {
    const char* activity;
    float confidence;
    uint32_t step_count;
    float cadence_spm;
    float symmetry_index;
    bool fall_alert;

    // Pressure distribution
    uint16_t p1, p2, p3, p4, p5, p6;
    float pitch, roll, svm_a;
};

class SupabaseClient {
public:
    SupabaseClient();
    void begin();
    void updateNetwork();
    bool isConnected() const;
    bool sendTelemetry(const SupabaseTelemetryPayload &payload);
    bool logFallIncident(float impact_g, const char* status);

private:
    unsigned long last_wifi_check;
    WiFiClientSecure secureClient;
};

extern SupabaseClient Supabase;

#endif // STRIDESENSE_SUPABASE_CLIENT_H
