/**
 * StrideSense - Filter and Sliding Window Implementation
 */

#include "filter.h"

CircularWindowBuffer SensorWindow;

CircularWindowBuffer::CircularWindowBuffer() : head(0), total_samples(0) {}

void CircularWindowBuffer::push(const SensorSample &sample) {
    buffer[head] = sample;
    head = (head + 1) % WINDOW_SIZE;
    if (total_samples < WINDOW_SIZE) {
        total_samples++;
    }
}

bool CircularWindowBuffer::isFull() const {
    return total_samples >= WINDOW_SIZE;
}

int CircularWindowBuffer::count() const {
    return total_samples;
}

SensorSample CircularWindowBuffer::get(int index) const {
    if (total_samples < WINDOW_SIZE) {
        return buffer[index % total_samples];
    }
    // Oldest sample is at 'head', newest sample is at '(head - 1 + WINDOW_SIZE) % WINDOW_SIZE'
    int actual_idx = (head + index) % WINDOW_SIZE;
    return buffer[actual_idx];
}

void CircularWindowBuffer::clear() {
    head = 0;
    total_samples = 0;
}
