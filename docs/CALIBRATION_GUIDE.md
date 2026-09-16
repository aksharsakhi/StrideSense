# StrideSense - Calibration & Operational Protocol 🧭

Because human anatomy, body weight, shoe types, and walking styles vary significantly, calibration ensures optimal accuracy for both activity classification and fall detection.

---

## 1. Calibration Stages

```
   [Stage 1: Tare / Zero-Force]
   Shoe lifted off ground, zero body weight applied
               │
               ▼
   [Stage 2: Static Standing Baseline]
   User stands upright naturally for 5 seconds
               │
               ▼
   [Stage 3: Dynamic Walking Verification]
   User takes 10 normal paces to verify heel-to-toe rolling
               │
               ▼
   [System Ready: Continuous Monitoring Active]
```

---

## 2. Step-by-Step Instructions

### Stage 1: Zero-Force Tare (Automated upon Boot)
1. Turn on the insole power switch while the shoe is unweighted (held in hands or foot suspended).
2. The firmware automatically acquires 40 samples at boot time:
   - Measures residual offset for each FSR ($S_1 \dots S_6$).
   - Calculates gyroscope drift offsets for $G_x, G_y, G_z$.
   - Verifies accelerometer vertical orientation ($A_z \approx 1.0g$).
3. The Status LED blinks rapidly, then turns solid green once zero-tare is complete.

### Stage 2: Standing Calibration
1. Put on the shoe and stand normally on a flat, even surface with weight distributed equally on both feet.
2. The system checks:
   - Heel-to-forefoot ratio: $\approx 50\% - 60\%$ heel vs $40\% - 50\%$ metatarsals.
   - Medial-to-lateral balance: $\approx 1.0 \pm 0.15$.
3. This sets the personal bodyweight reference baseline.

### Stage 3: Dynamic Walking Test
1. Walk forward naturally at normal pace for 10 steps.
2. Verify via the web dashboard:
   - Cadence reads between 95 and 120 SPM.
   - The foot heatmap shows a rolling pressure wave: Heel ($S_1$) peaks first, followed by midfoot ($S_2, S_3$), metatarsals ($S_4, S_5$), and big toe ($S_6$).
   - Activity badge reflects **Walking** with $>90\%$ confidence.

---

## 3. Fall Detection Safety Test

> [!TIP]
> Perform fall detection tests **only under controlled conditions** onto a gym mat or soft mattress:
> 1. With the insole powered, perform a controlled forward or lateral tilt onto a soft surface.
> 2. Observe the insole: the haptic motor will pulse and the dashboard will display the red emergency modal.
> 3. Press the physical button on GPIO 14 (or tap **"I'm OK - Cancel Alert"** on the dashboard) within 15 seconds.
> 4. The alert will clear without notifying external emergency contacts.
