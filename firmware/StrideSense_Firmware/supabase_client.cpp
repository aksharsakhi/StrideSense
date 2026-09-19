/**
 * StrideSense - Supabase PostgREST Client Implementation for ESP32
 */

#include "supabase_client.h"

SupabaseClient Supabase;

SupabaseClient::SupabaseClient() : last_wifi_check(0), was_connected(false) {}

void SupabaseClient::begin() {
    pinMode(PIN_LED_GREEN, OUTPUT);
    pinMode(PIN_LED_BLUE, OUTPUT);

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.persistent(true);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.printf("[Supabase] Connecting to Wi-Fi SSID: '%s' ...\n", WIFI_SSID);

    secureClient.setInsecure(); // Non-blocking TLS for IoT without bundling certificates
}

void SupabaseClient::updateNetwork() {
    unsigned long now = millis();
    if (now - last_wifi_check >= 10000) {
        last_wifi_check = now;
        if (WiFi.status() == WL_CONNECTED) {
            if (!was_connected) {
                was_connected = true;
                Serial.printf("\n[Supabase] *** Wi-Fi CONNECTED! IP: %s ***\n\n", WiFi.localIP().toString().c_str());
            }
            digitalWrite(PIN_LED_GREEN, HIGH);
        } else {
            digitalWrite(PIN_LED_GREEN, LOW);
            if (was_connected) {
                was_connected = false;
                Serial.println(F("[Supabase] Wi-Fi connection dropped. Reconnecting..."));
                WiFi.reconnect();
            }
        }
    }
}

bool SupabaseClient::isConnected() const {
    return WiFi.status() == WL_CONNECTED;
}

bool SupabaseClient::sendTelemetry(const SupabaseTelemetryPayload &payload) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    HTTPClient http;
    String url = String(SUPABASE_HOST) + String(SUPABASE_ENDPOINT);

    http.begin(secureClient, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Prefer", "return=minimal");

    // Format JSON matching Supabase public.telemetry schema
    char json[512];
    snprintf(json, sizeof(json),
        "{"
        "\"device_id\":\"%s\","
        "\"activity\":\"%s\","
        "\"confidence\":%.2f,"
        "\"steps\":%u,"
        "\"cadence\":%.1f,"
        "\"symmetry\":%.1f,"
        "\"fall_alert\":%s,"
        "\"p1\":%u,\"p2\":%u,\"p3\":%u,\"p4\":%u,\"p5\":%u,\"p6\":%u,"
        "\"pitch\":%.1f,\"roll\":%.1f,\"svm_a\":%.2f"
        "}",
        DEVICE_ID,
        payload.activity,
        payload.confidence,
        payload.step_count,
        payload.cadence_spm,
        payload.symmetry_index,
        payload.fall_alert ? "true" : "false",
        payload.p1, payload.p2, payload.p3, payload.p4, payload.p5, payload.p6,
        payload.pitch, payload.roll, payload.svm_a
    );

    int httpCode = http.POST(json);
    http.end();

    return (httpCode >= 200 && httpCode < 300);
}

bool SupabaseClient::logFallIncident(float impact_g, const char* status) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    HTTPClient http;
    String url = String(SUPABASE_HOST) + "/rest/v1/fall_incidents";

    http.begin(secureClient, url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Prefer", "return=minimal");

    char json[256];
    snprintf(json, sizeof(json),
        "{"
        "\"device_id\":\"%s\","
        "\"impact_g\":%.2f,"
        "\"status\":\"%s\","
        "\"resolved\":false"
        "}",
        DEVICE_ID, impact_g, status
    );

    int httpCode = http.POST(json);
    http.end();

    return (httpCode >= 200 && httpCode < 300);
}
