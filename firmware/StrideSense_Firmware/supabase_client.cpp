/**
 * StrideSense - Supabase PostgREST Client Implementation for ESP32
 */

#include "supabase_client.h"

SupabaseClient Supabase;

SupabaseClient::SupabaseClient() : last_wifi_check(0), was_connected(false), last_http_code(0) {
    strncpy(last_error_msg, "INIT", sizeof(last_error_msg));
}

void SupabaseClient::begin() {
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);

    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);

    Serial.printf("\n[Wi-Fi] Connecting to Wi-Fi SSID: '%s' ...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void SupabaseClient::updateNetwork() {
    unsigned long now = millis();
    wl_status_t status = WiFi.status();

    if (status == WL_CONNECTED) {
        if (!was_connected) {
            was_connected = true;
            Serial.printf("\n=======================================================\n");
            Serial.printf(" [✓] ESP32 Wi-Fi CONNECTED!\n");
            Serial.printf(" IP Address: %s\n", WiFi.localIP().toString().c_str());
            Serial.printf(" Signal:     %d dBm\n", WiFi.RSSI());
            Serial.printf("=======================================================\n\n");
        }
        digitalWrite(PIN_STATUS_LED, HIGH);
        last_wifi_check = now;
    } else {
        digitalWrite(PIN_STATUS_LED, LOW);
        was_connected = false;

        // Allow 12 seconds for auto-reconnect before triggering reconnect
        if (now - last_wifi_check >= 12000) {
            last_wifi_check = now;
            Serial.printf("[Wi-Fi] Status: NOT CONNECTED (Retrying '%s')...\n", WIFI_SSID);
            WiFi.reconnect();
        }
    }
}

bool SupabaseClient::isConnected() const {
    return WiFi.status() == WL_CONNECTED;
}

bool SupabaseClient::sendTelemetry(const SupabaseTelemetryPayload &payload) {
    if (WiFi.status() != WL_CONNECTED) {
        last_http_code = -4; // Not connected
        return false;
    }

    // Check & resolve DNS with automatic 8.8.8.8 fallback
    const char* supabase_domain = "sgooptohhldguitvhbrl.supabase.co";
    IPAddress resolvedIP;
    if (!WiFi.hostByName(supabase_domain, resolvedIP)) {
        // Fallback to Google DNS 8.8.8.8 & Cloudflare 1.1.1.1
        WiFi.config(WiFi.localIP(), WiFi.gatewayIP(), WiFi.subnetMask(), IPAddress(8, 8, 8, 8), IPAddress(1, 1, 1, 1));
        delay(50);
        if (!WiFi.hostByName(supabase_domain, resolvedIP)) {
            last_http_code = -1;
            snprintf(last_error_msg, sizeof(last_error_msg), "DNS FAILED for %s", supabase_domain);
            return false;
        }
    }

    WiFiClientSecure client;
    client.setInsecure(); // Non-blocking TLS without bundling massive root CAs
    client.setHandshakeTimeout(10); // 10 seconds handshake timeout
    client.setTimeout(10000); // 10000 ms socket timeout

    HTTPClient http;
    http.setReuse(false); // Ensure clean teardown to prevent socket leak on Cloudflare
    http.setTimeout(10000);
    http.setConnectTimeout(10000);

    String url = String(SUPABASE_HOST) + String(SUPABASE_ENDPOINT);
    if (!http.begin(client, url)) {
        last_http_code = -1;
        snprintf(last_error_msg, sizeof(last_error_msg), "http.begin failed");
        return false;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Prefer", "return=minimal");
    http.addHeader("Connection", "close");

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
    last_http_code = httpCode;

    if (httpCode >= 200 && httpCode < 300) {
        snprintf(last_error_msg, sizeof(last_error_msg), "OK");
        // Heartbeat LED flash on successful upload
        digitalWrite(PIN_STATUS_LED, LOW);
        delay(25);
        digitalWrite(PIN_STATUS_LED, HIGH);
    } else if (httpCode < 0) {
        snprintf(last_error_msg, sizeof(last_error_msg), "No Internet on Wi-Fi AP (Check Hotspot Mobile Data)");
    } else {
        snprintf(last_error_msg, sizeof(last_error_msg), "HTTP_%d", httpCode);
    }

    http.end();
    client.stop();

    return (httpCode >= 200 && httpCode < 300);
}

bool SupabaseClient::logFallIncident(float impact_g, const char* status) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    WiFiClientSecure client;
    client.setInsecure();
    client.setTimeout(8000);

    HTTPClient http;
    http.setReuse(false);
    http.setTimeout(8000);
    http.setConnectTimeout(8000);

    String url = String(SUPABASE_HOST) + "/rest/v1/fall_incidents";
    if (!http.begin(client, url)) return false;

    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("Prefer", "return=minimal");
    http.addHeader("Connection", "close");

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
    client.stop();

    return (httpCode >= 200 && httpCode < 300);
}
