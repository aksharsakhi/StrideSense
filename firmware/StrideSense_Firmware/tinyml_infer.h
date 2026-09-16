/**
 * StrideSense - TinyML Real-time Feature Extraction and Inference Header
 */

#ifndef STRIDESENSE_TINYML_INFER_H
#define STRIDESENSE_TINYML_INFER_H

#include "filter.h"
#include "model_data.h"

struct InferenceResult {
    ActivityClass activity;
    float confidence;
    const char* activity_name;
    unsigned long inference_time_us;

    // Gait Analytics
    float cadence_spm;
    float heel_forefoot_ratio;
    float medial_lateral_ratio;
    float total_force_avg;
};

class TinyMLInferenceEngine {
public:
    TinyMLInferenceEngine();
    InferenceResult runInference(const CircularWindowBuffer &window);

private:
    float feature_buffer[STRIDESENSE_NUM_FEATURES];
    void extractFeatures(const CircularWindowBuffer &window);
};

extern TinyMLInferenceEngine TinyML;

#endif // STRIDESENSE_TINYML_INFER_H
