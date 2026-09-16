/**
 * StrideSense - Wi-Fi & Firebase Cloud Client Implementation
 */

#include "firebase_client.h"

FirebaseCloudClient Cloud;

FirebaseCloudClient::FirebaseCloudClient() : last_wifi_check(0) {}

void FirebaseCloudClient::begin() {
    pinMode(PIN_LED_GREEN, OUTPUT);
    pinMode(PIN_LED_BLUE, OUTPUT);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.printf("[Cloud] Connecting to Wi-Fi SSID: %s\n", WIFI_SSID);

    // Insecure for rapid prototype telemetry push without bundling root certificates
    secureClient.setInsecure();
}

void FirebaseCloudClient::updateNetwork() {
    unsigned long now = millis();
    if (now - last_wifi_check >= 5000) {
        last_wifi_check = now;
        if (WiFi.status() == WL_CONNECTED) {
            digitalWrite(PIN_LED_GREEN, HIGH);
        } else {
            digitalWrite(PIN_LED_GREEN, LOW);
            // Non-blocking reconnect attempt
            WiFi.reconnect();
        }
    }
}

bool FirebaseCloudClient::isConnected() const {
    return WiFi.status() == WL_CONNECTED;
}

bool FirebaseCloudClient::sendTelemetry(const CloudPayload &payload) {
    if (!isConnected()) {
        return false;
    }

    digitalWrite(PIN_LED_BLUE, HIGH);

    HTTPClient http;
    String endpoint = String(FIREBASE_HOST) + "/devices/" + String(DEVICE_ID) + "/telemetry.json";
    if (strlen(FIREBASE_AUTH_KEY) > 0 && strcmp(FIREBASE_AUTH_KEY, "YOUR_FIREBASE_DATABASE_SECRET") != 0) {
        endpoint += "?auth=" + String(FIREBASE_AUTH_KEY);
    }

    http.begin(secureClient, endpoint);
    http.addHeader("Content-Type", "application/json");

    // Construct JSON payload
    char json[512];
    snprintf(json, sizeof(json),
        "{"
        "\"timestamp\":%lu,"
        "\"activity\":\"%s\","
        "\"confidence\":%.2f,"
        "\"steps\":%u,"
        "\"cadence\":%.1f,"
        "\"symmetry\":%.1f,"
        "\"fall_alert\":%s,"
        "\"fall_emergency\":%s,"
        "\"battery_pct\":%d,"
        "\"battery_v\":%.2f,"
        "\"pressure\":{\"p1\":%u,\"p2\":%u,\"p3\":%u,\"p4\":%u,\"p5\":%u,\"p6\":%u},"
        "\"imu\":{\"pitch\":%.1f,\"roll\":%.1f}"
        "}",
        millis(),
        payload.activity,
        payload.confidence,
        payload.step_count,
        payload.cadence_spm,
        payload.symmetry_index,
        payload.fall_alert ? "true" : "false",
        payload.fall_emergency ? "true" : "false",
        payload.battery_pct,
        payload.battery_voltage,
        payload.p1, payload.p2, payload.p3, payload.p4, payload.p5, payload.p6,
        payload.pitch, payload.roll
    );

    int httpCode = http.PUT(json);
    http.end();

    digitalWrite(PIN_LED_BLUE, LOW);
    return (httpCode >= 200 && httpCode < 300);
}

bool FirebaseCloudClient::sendEmergencyAlert(const char* reason) {
    if (!isConnected()) return false;

    HTTPClient http;
    String endpoint = String(FIREBASE_HOST) + "/alerts/" + String(DEVICE_ID) + ".json";
    http.begin(secureClient, endpoint);
    http.addHeader("Content-Type", "application/json");

    char json[256];
    snprintf(json, sizeof(json),
        "{\"timestamp\":%lu,\"event\":\"CRITICAL_FALL\",\"reason\":\"%s\",\"dispatched\":true}",
        millis(), reason
    );

    int httpCode = http.POST(json);
    http.end();
    return (httpCode >= 200 && httpCode < 300);
}
