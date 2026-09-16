/**
 * StrideSense - Filter and Sliding Window Header
 * Circular buffer storage and signal filtering for TinyML windowing.
 */

#ifndef STRIDESENSE_FILTER_H
#define STRIDESENSE_FILTER_H

#include "sensors.h"
#include "config.h"

class CircularWindowBuffer {
public:
    CircularWindowBuffer();
    void push(const SensorSample &sample);
    bool isFull() const;
    int count() const;
    SensorSample get(int index) const; // 0 is oldest, WINDOW_SIZE-1 is newest
    void clear();

private:
    SensorSample buffer[WINDOW_SIZE];
    int head;
    int total_samples;
};

extern CircularWindowBuffer SensorWindow;

#endif // STRIDESENSE_FILTER_H
