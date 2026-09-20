#include "storage.h"

StorageManager Storage;

StorageManager::StorageManager() : cached_steps(0), fall_count(0) {}

bool StorageManager::begin() {
    // Open NVS Flash namespace "stridesense" in read/write mode
    if (!prefs.begin("stridesense", false)) {
        Serial.println(F("[Storage] ERROR: Failed to initialize Flash NVS storage!"));
        return false;
    }

    cached_steps = prefs.getUInt("steps", 0);
    fall_count = prefs.getUInt("fall_count", 0);

    Serial.println(F("[Storage] Flash NVS Local Database Initialized successfully."));
    Serial.printf("[Storage] Restored Persistent Data -> Lifetime Steps: %u | Recorded Falls: %u\n", cached_steps, fall_count);
    return true;
}

uint32_t StorageManager::loadStepCount() {
    return cached_steps;
}

void StorageManager::saveStepCount(uint32_t steps) {
    if (steps != cached_steps) {
        cached_steps = steps;
        prefs.putUInt("steps", cached_steps);
    }
}

void StorageManager::logFallEvent(unsigned long timestamp, float impact_g, const char* activity) {
    fall_count++;
    prefs.putUInt("fall_count", fall_count);

    // Store latest fall event metadata in flash
    prefs.putULong("last_fall_time", timestamp);
    prefs.putFloat("last_fall_g", impact_g);
    prefs.putString("last_fall_act", activity);

    Serial.printf("[Storage] Fall incident logged to Flash memory! Total incidents: %u (Impact: %.2fg)\n", fall_count, impact_g);
}

uint32_t StorageManager::getFallCount() {
    return fall_count;
}

void StorageManager::printStorageSummary() {
    Serial.println(F("\n--- [Flash NVS Database Summary] ---"));
    Serial.printf("  Namespace:        'stridesense'\n");
    Serial.printf("  Persistent Steps: %u\n", prefs.getUInt("steps", 0));
    Serial.printf("  Total Falls:      %u\n", prefs.getUInt("fall_count", 0));
    Serial.printf("  Last Fall Impact: %.2f g\n", prefs.getFloat("last_fall_g", 0.0f));
    Serial.println(F("------------------------------------\n"));
}
