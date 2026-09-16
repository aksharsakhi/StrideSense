/**
 * StrideSense - TinyML Real-time Feature Extraction and Inference Implementation
 */

#include "tinyml_infer.h"
#include <math.h>

TinyMLInferenceEngine TinyML;

TinyMLInferenceEngine::TinyMLInferenceEngine() {
    for (int i = 0; i < STRIDESENSE_NUM_FEATURES; i++) {
        feature_buffer[i] = 0.0f;
    }
}

void TinyMLInferenceEngine::extractFeatures(const CircularWindowBuffer &window) {
    int N = window.count();
    if (N == 0) return;

    float sum_ax = 0, sum_ay = 0, sum_az = 0;
    float sum_gx = 0, sum_gy = 0, sum_gz = 0;
    float sum_svm_acc = 0, max_svm_acc = 0;
    float sum_svm_gyro = 0, max_svm_gyro = 0;
    float sum_force = 0, max_force = 0;
    float sum_heel = 0, sum_forefoot = 0;
    float sum_medial = 0, sum_lateral = 0;

    for (int i = 0; i < N; i++) {
        SensorSample s = window.get(i);

        sum_ax += s.ax;
        sum_ay += s.ay;
        sum_az += s.az;

        sum_gx += s.gx;
        sum_gy += s.gy;
        sum_gz += s.gz;

        float svm_a = sqrtf(s.ax * s.ax + s.ay * s.ay + s.az * s.az);
        sum_svm_acc += svm_a;
        if (svm_a > max_svm_acc) max_svm_acc = svm_a;

        float svm_g = sqrtf(s.gx * s.gx + s.gy * s.gy + s.gz * s.gz);
        sum_svm_gyro += svm_g;
        if (svm_g > max_svm_gyro) max_svm_gyro = svm_g;

        float f_tot = (float)(s.p1 + s.p2 + s.p3 + s.p4 + s.p5 + s.p6);
        sum_force += f_tot;
        if (f_tot > max_force) max_force = f_tot;

        float h = (float)s.p1;
        float ff = (float)(s.p4 + s.p5 + s.p6);
        float med = (float)(s.p3 + s.p5);
        float lat = (float)(s.p2 + s.p4);

        sum_heel += h;
        sum_forefoot += ff;
        sum_medial += med;
        sum_lateral += lat;
    }

    float mean_ax = sum_ax / N;
    float mean_ay = sum_ay / N;
    float mean_az = sum_az / N;
    float mean_gx = sum_gx / N;
    float mean_gy = sum_gy / N;
    float mean_gz = sum_gz / N;
    float mean_svm_acc = sum_svm_acc / N;
    float mean_svm_gyro = sum_svm_gyro / N;
    float mean_force = sum_force / N;
    float mean_heel = sum_heel / N;
    float mean_forefoot = sum_forefoot / N;
    float mean_medial = sum_medial / N;
    float mean_lateral = sum_lateral / N;

    // Compute standard deviations
    float var_ax = 0, var_ay = 0, var_az = 0;
    float var_gx = 0, var_gy = 0, var_gz = 0;
    float var_svm_acc = 0, var_force = 0;

    for (int i = 0; i < N; i++) {
        SensorSample s = window.get(i);
        var_ax += (s.ax - mean_ax) * (s.ax - mean_ax);
        var_ay += (s.ay - mean_ay) * (s.ay - mean_ay);
        var_az += (s.az - mean_az) * (s.az - mean_az);

        var_gx += (s.gx - mean_gx) * (s.gx - mean_gx);
        var_gy += (s.gy - mean_gy) * (s.gy - mean_gy);
        var_gz += (s.gz - mean_gz) * (s.gz - mean_gz);

        float svm_a = sqrtf(s.ax * s.ax + s.ay * s.ay + s.az * s.az);
        var_svm_acc += (svm_a - mean_svm_acc) * (svm_a - mean_svm_acc);

        float f_tot = (float)(s.p1 + s.p2 + s.p3 + s.p4 + s.p5 + s.p6);
        var_force += (f_tot - mean_force) * (f_tot - mean_force);
    }

    // Populate feature array
    feature_buffer[0]  = mean_ax;
    feature_buffer[1]  = sqrtf(var_ax / N);
    feature_buffer[2]  = mean_ay;
    feature_buffer[3]  = sqrtf(var_ay / N);
    feature_buffer[4]  = mean_az;
    feature_buffer[5]  = sqrtf(var_az / N);

    feature_buffer[6]  = mean_gx;
    feature_buffer[7]  = sqrtf(var_gx / N);
    feature_buffer[8]  = mean_gy;
    feature_buffer[9]  = sqrtf(var_gy / N);
    feature_buffer[10] = mean_gz;
    feature_buffer[11] = sqrtf(var_gz / N);

    feature_buffer[12] = mean_svm_acc;
    feature_buffer[13] = max_svm_acc;
    feature_buffer[14] = sqrtf(var_svm_acc / N);

    feature_buffer[15] = mean_svm_gyro;
    feature_buffer[16] = max_svm_gyro;

    feature_buffer[17] = mean_force;
    feature_buffer[18] = sqrtf(var_force / N);
    feature_buffer[19] = max_force;

    feature_buffer[20] = mean_heel / (mean_forefoot + 1.0f);
    feature_buffer[21] = mean_medial / (mean_lateral + 1.0f);
    feature_buffer[22] = mean_heel;
    feature_buffer[23] = mean_forefoot;
}

InferenceResult TinyMLInferenceEngine::runInference(const CircularWindowBuffer &window) {
    InferenceResult res;
    unsigned long start_us = micros();

    extractFeatures(window);

    res.activity = predict_activity(feature_buffer, &res.confidence);
    res.activity_name = ACTIVITY_NAMES[res.activity];
    res.inference_time_us = micros() - start_us;

    res.heel_forefoot_ratio = feature_buffer[20];
    res.medial_lateral_ratio = feature_buffer[21];
    res.total_force_avg = feature_buffer[17];

    // Estimate cadence based on activity & force dynamic frequency
    if (res.activity == ACTIVITY_WALKING) {
        res.cadence_spm = 104.0f + (feature_buffer[18] / 20.0f);
        if (res.cadence_spm > 130.0f) res.cadence_spm = 130.0f;
    } else if (res.activity == ACTIVITY_RUNNING) {
        res.cadence_spm = 158.0f + (feature_buffer[18] / 15.0f);
        if (res.cadence_spm > 195.0f) res.cadence_spm = 195.0f;
    } else {
        res.cadence_spm = 0.0f;
    }

    return res;
}
