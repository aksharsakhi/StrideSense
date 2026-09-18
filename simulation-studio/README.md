# StrideSense 3D Biomechanical Simulation Studio

An isolated, high-fidelity 3D Digital Twin and kinematic emulation workstation for **StrideSense**.

> **Note on IoT Hardware Integrity**: This simulation environment is built solely for algorithmic verification, stress testing, and visual demonstrations while physical hardware components are en route. The production firmware in `firmware/` and the mobile/web application in `dashboard/` remain completely separate and uncompromised.

---

## Key Features

1. **Standalone & Decoupled Architecture**:
   - Runs independently on **Port 5174** (`http://localhost:5174`).
   - Zero added dependencies or modifications to the production `dashboard/` app (which runs on Port 5173).
   - Real C++ IoT code in `firmware/` is preserved 100% for physical ESP32 flashing.

2. **3D Anatomical Insole & Ghost Foot Skeletal Viewport**:
   - Rendered using WebGL and Three.js at 60 FPS.
   - Dynamic FSR sensor pads that illuminate with contact heatmaps (from dark cyan to glowing lime and red shock collision).
   - Real-time kinematic attitude tracking (Pitch, Roll eversion/inversion, and vertical ground clearance).
   - Interactive orbit controls (drag to rotate, scroll to zoom, top/side/perspective camera presets).

3. **50 Hz Kinematic Gait Physics Engine**:
   - **Normal Walk**: 108 SPM heel-strike to forefoot push-off stride cycle.
   - **Sprint Run**: 165 SPM high-impact forefoot dynamic load with elevated G-forces.
   - **Over-Pronation Anomaly**: Medial arch collapse and -16° inward eversion tilt.
   - **Trip & Fall Emergency**: 3-stage fall state machine:
     1. Freefall drop (`< 0.6g`)
     2. Violent floor collision shock (`> 3.8g` impact spike)
     3. Post-fall immobile tilt (`> 50°`) triggering a 15-second grace period with audio/visual countdown and hardware SOS cancel button.

4. **Bit-Exact On-Device TinyML Inference**:
   - In-browser evaluation of the exact 24 extracted temporal/spatial features.
   - Runs the identical 8 Random Forest decision trees from `firmware/StrideSense_Firmware/model_data.h`.
   - Real-time voting pill breakdown, confidence scores, and dynamic cadence estimation.

5. **Live Supabase Cloud Telemetry Bridge**:
   - Optional toggle to broadcast simulated sensor packets directly to Supabase (`public.telemetry`) at 1 Hz, matching the real ESP32 REST payload format.

6. **Virtual Hardware (Wokwi)**:
   - Includes `firmware/diagram.json` and `firmware/wokwi.toml` for hardware-in-the-loop emulation in VS Code / Wokwi.

---

## Quick Start

```bash
# Navigate to the studio directory
cd simulation-studio

# Start the dev server on port 5174
npm run dev

# Or build the optimized production bundle
npm run build
npm run preview
```

Open your browser at: **[http://localhost:5174](http://localhost:5174)**
