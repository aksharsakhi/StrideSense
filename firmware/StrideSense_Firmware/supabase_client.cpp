/**
 * StrideSense - Supabase PostgREST Client Implementation for ESP32
 */

#include "supabase_client.h"

SupabaseClient Supabase;

SupabaseClient::SupabaseClient() : last_wifi_check(0), was_connected(false) {}

void SupabaseClient::begin() {
    pinMode(PIN_LED_GREEN, OUTPUT);
    pinMode(PIN_LED_BLUE, OUTPUT);

    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);

    Serial.println(F("\n[Wi-Fi] Scanning nearby 2.4 GHz wireless networks..."));
    int n = WiFi.scanNetworks();
    if (n == 0) {
        Serial.println(F("[Wi-Fi] No networks found."));
    } else {
        Serial.printf("[Wi-Fi] Found %d networks:\n", n);
        for (int i = 0; i < n; ++i) {
            Serial.printf("  [%d] %-20s (RSSI: %d dBm)\n",
                i + 1,
                WiFi.SSID(i).c_str(),
                WiFi.RSSI(i)
            );
        }
    }

    Serial.printf("\n[Supabase] Connecting to Wi-Fi SSID: '%s' ...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    secureClient.setInsecure(); // Non-blocking TLS for IoT without bundling certificates
}

void SupabaseClient::updateNetwork() {
    unsigned long now = millis();
    if (now - last_wifi_check >= 3000) {
        last_wifi_check = now;
        wl_status_t status = WiFi.status();
        if (status == WL_CONNECTED) {
            if (!was_connected) {
                was_connected = true;
                Serial.printf("\n==========================================\n");
                Serial.printf(" [✓] ESP32 Wi-Fi CONNECTED!\n");
                Serial.printf(" IP Address: %s\n", WiFi.localIP().toString().c_str());
                Serial.printf(" Signal:     %d dBm\n", WiFi.RSSI());
                Serial.printf("==========================================\n\n");
            }
            digitalWrite(PIN_LED_GREEN, HIGH);
        } else {
            digitalWrite(PIN_LED_GREEN, LOW);
            const char* statusStr = "UNKNOWN";
            switch (status) {
                case WL_NO_SHIELD: statusStr = "WL_NO_SHIELD"; break;
                case WL_IDLE_STATUS: statusStr = "WL_IDLE_STATUS (Connecting...)"; break;
                case WL_NO_SSID_AVAIL: statusStr = "WL_NO_SSID_AVAIL (SSID 'LADDA' Not Found - Check 2.4GHz band!)"; break;
                case WL_SCAN_COMPLETED: statusStr = "WL_SCAN_COMPLETED"; break;
                case WL_CONNECT_FAILED: statusStr = "WL_CONNECT_FAILED (Wrong Password?)"; break;
                case WL_CONNECTION_LOST: statusStr = "WL_CONNECTION_LOST"; break;
                case WL_DISCONNECTED: statusStr = "WL_DISCONNECTED (In progress...)"; break;
                default: break;
            }
            if (!was_connected) {
                Serial.printf("[Wi-Fi Status] %s\n", statusStr);
            } else {
                was_connected = false;
                Serial.println(F("[Supabase] Wi-Fi connection lost. Reconnecting..."));
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
    if (httpCode >= 200 && httpCode < 300) {
        Serial.printf("[Supabase] Telemetry sent successfully (HTTP %d)\n", httpCode);
    } else {
        Serial.printf("[Supabase] Telemetry upload failed: HTTP %d\n", httpCode);
    }
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
