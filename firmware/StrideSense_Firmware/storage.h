#ifndef STRIDESENSE_STORAGE_H
#define STRIDESENSE_STORAGE_H

#include <Arduino.h>
#include <Preferences.h>

class StorageManager {
public:
    StorageManager();
    bool begin();
    
    // Step count persistence across reboots
    uint32_t loadStepCount();
    void saveStepCount(uint32_t steps);

    // Fall incident logging in Flash memory
    void logFallEvent(unsigned long timestamp, float impact_g, const char* activity);
    uint32_t getFallCount();
    void printStorageSummary();

private:
    Preferences prefs;
    uint32_t cached_steps;
    uint32_t fall_count;
};

extern StorageManager Storage;

#endif
