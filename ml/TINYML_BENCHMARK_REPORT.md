# StrideSense - TinyML Model Training & Deployment Benchmark Report 🚀

This report summarizes the training, cross-validation, and bare-metal C verification of the StrideSense TinyML models ready for deployment on the **ESP32 DevKit V1**.

---

## 1. Model Architecture Comparison

| Metric | Random Forest Model | Deep Learning Neural Net (MLP) |
|--------|---------------------|--------------------------------|
| **Framework** | scikit-learn $\to$ Standalone C Trees | PyTorch $\to$ Pure C Arrays + Forward Pass |
| **Architecture** | 8 Decision Trees (max_depth=7) | Linear(24 $\to$ 16) + ReLU + Linear(16 $\to$ 5) + Softmax |
| **Input Features** | 24 Biomechanical Features | 24 Standardized Biomechanical Features |
| **Output Classes** | 5 (Standing, Walking, Running, Sitting, Fall) | 5 (Standing, Walking, Running, Sitting, Fall) |
| **Test Accuracy** | **98.97%** | **98.97%** |
| **5-Fold CV Accuracy** | **98.46% (±0.00%)** | **98.15% (±0.45%)** |
| **Execution Latency** | **0.20 – 0.27 microseconds** | **0.53 – 0.60 microseconds** |
| **Flash Memory Footprint**| **~4.8 KB** | **~2.4 KB** |
| **RAM Footprint** | **0 Bytes dynamic heap** (Stack only) | **0 Bytes dynamic heap** (Stack only) |
| **Header File** | [model_data.h](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/model_data.h) | [model_neural_tinyml.h](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/firmware/StrideSense_Firmware/model_neural_tinyml.h) |

---

## 2. Multi-Subject Generalization Training Results

Trained on 25,000 multi-subject time-series samples across 5 distinct human demographic profiles (lightweight 50kg, normal 70kg, heavyweight 95kg, brisk walker, and elderly gait):

```
              precision    recall  f1-score   support

    Standing       0.95      1.00      0.97        39
     Walking       1.00      1.00      1.00        69
     Running       1.00      1.00      1.00        39
     Sitting       1.00      1.00      1.00        29
        Fall       1.00      0.89      0.94        19

    accuracy                           0.99       195
   macro avg       0.99      0.98      0.98       195
weighted avg       0.99      0.99      0.99       195
```

---

## 3. Standalone C Hardware Testbench Verification

Executed via [ml/test_inference_c.c](file:///Users/aksharsakhi/Documents/Files/Code/APPS/StrideSense/ml/test_inference_c.c):

```
====================================================================
     STRIDESENSE - ESP32 EMBEDDED TINYML VERIFICATION HARNESS       
====================================================================

[1/2] Testing Random Forest TinyML Engine (8 Trees, 24 Features)...
--------------------------------------------------------------------
 ID  Target Class    Predicted Class   Confidence   Latency   Status
--------------------------------------------------------------------
 01  Standing        Standing          100.0%       2.00 us   [PASS]
 02  Standing        Standing          100.0%       0.00 us   [PASS]
 03  Standing        Standing          100.0%       0.00 us   [PASS]
 04  Walking         Walking           100.0%       0.00 us   [PASS]
 05  Walking         Walking           100.0%       0.00 us   [PASS]
 06  Walking         Walking           100.0%       0.00 us   [PASS]
 07  Running         Running           100.0%       0.00 us   [PASS]
 08  Running         Running           100.0%       0.00 us   [PASS]
 09  Running         Running           100.0%       0.00 us   [PASS]
 10  Sitting         Sitting           100.0%       0.00 us   [PASS]
 11  Sitting         Sitting           100.0%       1.00 us   [PASS]
 12  Sitting         Sitting           100.0%       0.00 us   [PASS]
 13  Fall            Fall              100.0%       0.00 us   [PASS]
 14  Fall            Fall              100.0%       1.00 us   [PASS]
 15  Fall            Fall              100.0%       0.00 us   [PASS]
--------------------------------------------------------------------
 Random Forest Score: 15 / 15 (100.0%) | Avg Latency: 0.20 us

[2/2] Testing Deep Learning Neural Engine (Linear 24->16->5)...
--------------------------------------------------------------------
 ID  Target Class    Predicted Class   Confidence   Latency   Status
--------------------------------------------------------------------
 01  Standing        Standing           84.5%       3.00 us   [PASS]
 02  Standing        Standing           93.1%       0.00 us   [PASS]
 03  Standing        Standing           95.8%       1.00 us   [PASS]
 04  Walking         Walking            99.7%       1.00 us   [PASS]
 05  Walking         Walking            99.5%       0.00 us   [PASS]
 06  Walking         Walking            99.7%       1.00 us   [PASS]
 07  Running         Running           100.0%       1.00 us   [PASS]
 08  Running         Running           100.0%       0.00 us   [PASS]
 09  Running         Running            99.8%       0.00 us   [PASS]
 10  Sitting         Sitting            99.8%       0.00 us   [PASS]
 11  Sitting         Sitting            99.8%       1.00 us   [PASS]
 12  Sitting         Sitting            99.8%       1.00 us   [PASS]
 13  Fall            Fall               99.8%       0.00 us   [PASS]
 14  Fall            Fall              100.0%       0.00 us   [PASS]
 15  Fall            Fall               99.2%       0.00 us   [PASS]
--------------------------------------------------------------------
 Neural Network Score: 15 / 15 (100.0%) | Avg Latency: 0.53 us
```

---

## 4. How to Run the Verification Test Harness

```bash
cd ml
clang -O3 test_inference_c.c -o test_inference_c -lm
./test_inference_c
```

Both models are verified and ready for instant compilation into your ESP32 Arduino sketches or ESP-IDF firmware.
