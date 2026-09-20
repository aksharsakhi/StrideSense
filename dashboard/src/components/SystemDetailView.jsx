import React from 'react';
import {
  ArrowLeft, Cpu, HardDrive, Zap, Sliders, Sparkles,
  Shield, Info, FileText, CheckCircle2, Layers,
  Database, Activity, Clock, Award, Terminal, AlertTriangle
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export const SYSTEM_DETAILS = {
  microcontroller: {
    id: 'microcontroller',
    category: 'Hardware & Embedded',
    title: 'ESP32 Dual-Core Microcontroller',
    badge: 'Master MCU',
    badgeColor: 'badge-cyan',
    icon: HardDrive,
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    summary: 'The central embedded computing brain of the StrideSense smart insole, executing 50 Hz sensor sampling, on-chip AI inference, and cloud telemetry.',
    sections: [
      {
        title: 'Processor Architecture & Speed',
        text: 'The ESP32-D0WD-V3 features an Xtensa 32-bit Dual-Core LX6 processor running at 240 MHz. It has 520 KB of on-chip SRAM and 4 MB of SPI Flash memory. Core 0 is dedicated to high-speed sensor reading (50 Hz) and TinyML inference, while Core 1 handles non-blocking Wi-Fi communication without starving real-time tasks.'
      },
      {
        title: 'Hardware Pinout Configuration',
        type: 'pins',
        items: [
          { pin: 'GPIO 26 & 27', desc: 'Hardware I2C Bus (SDA / SCL) running at 400 kHz Fast-Mode for MPU-6050 6-DOF IMU' },
          { pin: 'GPIO 34 (ADC1_CH6)', desc: '12-bit Analog input for Calcaneus (Heel) Square FSR Pressure Sensor' },
          { pin: 'GPIO 35 (ADC1_CH7)', desc: '12-bit Analog input for Metatarsal (Forefoot Ball) Square FSR Pressure Sensor' },
          { pin: 'GPIO 14', desc: 'Emergency SOS / Fall Cancel button (Active LOW with internal pull-up)' },
          { pin: 'GPIO 18 / 19 / 25', desc: 'Status Indicator LEDs for Wi-Fi, Cloud Sync, and Emergency Alert' }
        ]
      },
      {
        title: 'Why ESP32 was Chosen for Insole Tracking',
        text: 'Unlike standard microcontrollers, the ESP32 provides built-in ADC1 channels that operate continuously even when Wi-Fi is transmitting. It also incorporates hardware Non-Volatile Storage (NVS Flash) to preserve accumulated steps across battery reboots, and deep sleep modes for all-day wearable battery life.'
      }
    ]
  },

  tinyml: {
    id: 'tinyml',
    category: 'Artificial Intelligence & TinyML',
    title: 'TinyML Edge AI Gait Engine',
    badge: '< 0.38 ms On-Chip',
    badgeColor: 'badge-emerald',
    icon: Zap,
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    summary: 'An Artificial Intelligence model running 100% on the ESP32 insole chip. Classifies human walking, running, sitting, and standing with zero internet reliance.',
    sections: [
      {
        title: '1. What is TinyML & Why Edge AI?',
        text: 'TinyML allows neural networks and machine learning models to run directly on microcontrollers with tiny memory footprints. StrideSense does NOT send raw sensor data to the cloud for AI analysis. Instead, the model runs directly inside the shoe insole. This provides instant classification, zero latency, total privacy, and works even when completely offline.'
      },
      {
        title: '2. Data Collected & Feature Extraction',
        text: 'Every 500 milliseconds, our feature extraction pipeline processes a circular sliding window of 50 samples (1.0 second of motion at 50 Hz). From this window, it calculates 14 biomechanical features:',
        list: [
          '3-Axis Acceleration: Mean, variance, and peak-to-peak shock amplitude for X, Y, and Z axes.',
          'Signal Vector Magnitude (SVM): Net orientation-invariant acceleration (SVM = √(ax² + ay² + az²)).',
          'Angular Gyroscopic Magnitude: Rotational velocity magnitude during swing and stance phases.',
          'Biomechanical Pressure Distribution: Dynamic ratio between Heel (Calcaneus) and Forefoot (Metatarsal) strike.',
          'Cadence: Instantaneous steps per minute calculated from heel-strike impact frequency.'
        ]
      },
      {
        title: '3. Model Training & Optimization',
        text: 'The model was trained in Python using PyTorch and Scikit-Learn on over 5,000 gait activity windows. We tested Random Forest (8 trees) and a 3-layer Multilayer Perceptron (14 inputs → 32 hidden ReLU → 16 hidden ReLU → 4 Softmax outputs). The model achieved 98.97% cross-validation accuracy on test datasets.'
      },
      {
        title: '4. Pure C++ Export & Execution',
        text: 'The trained neural network was exported as static C++ weight matrices in model_neural_tinyml.h. By avoiding heavy runtimes like TensorFlow Lite Micro, the forward-pass math runs in pure C++ using optimized matrix loops. It executes on the ESP32 in only 365 microseconds (<0.4 ms) and takes zero dynamic heap memory!'
      }
    ]
  },

  sampling: {
    id: 'sampling',
    category: 'Signal Processing',
    title: '50 Hz Real-Time Sampling Engine',
    badge: '20ms Period',
    badgeColor: 'badge-violet',
    icon: Cpu,
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    summary: 'High-frequency deterministic sensor sampling designed specifically around the biomechanics of human movement.',
    sections: [
      {
        title: 'Why 50 Hz (20ms) is Scientifically Optimal',
        text: 'Normal human walking cadence ranges between 1.5 to 2.5 steps per second (90 - 150 SPM). However, the sudden impact of a heel strike or an accidental fall produces rapid shockwave transients up to 15-20 Hz. According to the Nyquist-Shannon Sampling Theorem, a sampling frequency must be at least 2× the highest frequency component (2 × 20 Hz = 40 Hz). 50 Hz ensures zero aliasing and captures every micro-phase of foot contact.'
      },
      {
        title: 'Edge vs Cloud Architecture: 98% Power Saving',
        text: 'While the ESP32 samples sensors locally at 50 Hz, it only transmits aggregated health summaries to the cloud at 1 Hz (once per second). Transmitting 50 network calls/second would drain the wearable battery in 45 minutes. By running TinyML on the edge, we reduce Wi-Fi radio transmissions by 98%, extending battery life to 8+ hours.'
      }
    ]
  },

  calibration: {
    id: 'calibration',
    category: 'Biomedical Sensing',
    title: 'Zero-Tare Sensor Calibration',
    badge: 'Auto Baseline OK',
    badgeColor: 'badge-amber',
    icon: Sliders,
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    summary: 'Automated baseline calibration algorithm that nulls sensor tolerances and offsets across varying foot arches and shoe types.',
    sections: [
      {
        title: 'How Zero-Tare Calibration Operates',
        text: 'During device startup in setup(), the firmware calls Sensors.calibrateZeroBaseline(40). Over 800 milliseconds, it records 40 resting samples from both FSR pressure sensors and the MPU-6050 gyroscope/accelerometer.'
      },
      {
        title: 'Eliminating Manufacturing Drift',
        text: 'Force Sensitive Resistors have natural manufacturing tolerances and residual resting pressure from shoe insoles. By computing the stationary baseline average and subtracting it from all live samples, the system guarantees that 0 steps read exactly 0 kPa, preventing ghost steps and drift.'
      },
      {
        title: 'Flash NVS Persistence',
        text: 'Calibration offsets are stored in Flash memory (Preferences.h). Once calibrated, your insole remembers its baseline even if you turn the power off or swap the battery.'
      }
    ]
  },

  mobile_native: {
    id: 'mobile_native',
    category: 'Application Runtime',
    title: 'Capacitor 8 Mobile Native Core',
    badge: 'iOS Native Bridge',
    badgeColor: 'badge-emerald',
    icon: Sparkles,
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    summary: 'Native bridge layer connecting the React web frontend to iOS hardware APIs, Apple Haptic engine, and local emergency notifications.',
    sections: [
      {
        title: 'Hybrid Native Architecture',
        text: 'StrideSense is built with a dual architecture: React + Vite for high-performance responsive UI rendering, packaged into native iOS via Capacitor 8. This provides 60 FPS fluid rendering alongside full access to native iOS capabilities.'
      },
      {
        title: 'Integrated Native Capabilities',
        list: [
          'Haptic Feedback Engine: Uses the iPhone Taptic Engine to provide subtle tactile clicks on button presses and distinct vibration bursts during fall alerts.',
          'Local Emergency Dispatch: Triggers local push notifications with high-priority audio sirens when an unconfirmed fall event occurs.',
          'Supabase Realtime WebSockets: Subscribes to database change data capture (CDC) for sub-50ms synchronization with the physical insole.',
          'Direct Phone Auto-Call: Supports direct tel: URI routing to immediately initiate voice calls to your designated primary emergency contact.'
        ]
      }
    ]
  },

  fall_guard: {
    id: 'fall_guard',
    category: 'Emergency Safety',
    title: 'Dual-Trigger Fall Guard Engine',
    badge: 'Dual-Trigger (0.6g / 2.8g)',
    badgeColor: 'badge-rose',
    icon: Shield,
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    summary: 'A 3-phase temporal kinematic engine running on the ESP32 that distinguishes true dangerous falls from normal athletic movements.',
    sections: [
      {
        title: 'The 3-Phase Fall Detection State Machine',
        list: [
          'Phase 1: Free-Fall Detection: When a person slips or loses balance, they enter a weightless state. The Signal Vector Magnitude (SVM) drops below 0.60g.',
          'Phase 2: Collision Impact: Within 100ms - 800ms of free-fall, the body collides with the floor, creating an abrupt acceleration shock exceeding 2.80g.',
          'Phase 3: Post-Impact Orientation Change: After impact, the algorithm checks if foot/body tilt shifted by >45 degrees and remained stationary for 1.5 seconds.'
        ]
      },
      {
        title: '15-Second False Alarm Grace Period',
        text: 'If all three phases match, the insole activates a pulsing red LED and vibration motor, and sends a potential fall flag to the mobile app. A 15-second countdown timer starts with an audible siren. If the user tripped but is fine, they can press the physical button on GPIO 14 or tap "I am OK" in the app to cancel the dispatch.'
      },
      {
        title: 'Emergency Auto-Dispatch',
        text: 'If the 15-second window expires without cancellation, the system enters EMERGENCY_DISPATCHED mode. It writes the incident to Flash memory, broadcasts SMS alerts with location/telemetry to designated emergency contacts, and triggers a direct call to the primary caregiver.'
      }
    ]
  },

  core: {
    id: 'core',
    category: 'System Architecture',
    title: 'StrideSense Biomedical Core',
    badge: 'v1.4.2 Production',
    badgeColor: 'badge-cyan',
    icon: Info,
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    summary: 'The comprehensive biomedical platform integrating insole hardware, edge machine learning, cloud databases, and clinical health dashboards.',
    sections: [
      {
        title: 'End-to-End System Flow',
        text: 'StrideSense bridges physical human biomechanics with modern cloud analytics across 5 integrated tiers:',
        list: [
          'Tier 1: Smart Footbed: Flexible insole embedded with dual 12-bit square FSRs and a 6-DOF IMU.',
          'Tier 2: Edge Firmware: Deterministic 50 Hz loop on ESP32 running custom bare-metal I2C and ADC drivers.',
          'Tier 3: Edge TinyML AI: Real-time neural network classifier executing in <0.4ms without external dependencies.',
          'Tier 4: Cloud Pipeline: Non-blocking TLS/HTTPS telemetry to Supabase with real-time WebSocket replication.',
          'Tier 5: Clinical Application: Cross-platform dashboard featuring 3D pressure maps, gait symmetry, and health logs.'
        ]
      },
      {
        title: 'Multi-Device Isolation',
        text: 'The architecture natively supports multi-device pairing. It isolates telemetry from the physical hardware (device_id: insole_left_01) from the laptop 3D Simulation Studio (device_id: insole_left_02), allowing simultaneous testing, benchmarking, and real-world deployment.'
      }
    ]
  }
};

export default function SystemDetailView({ detailKey, onBack }) {
  const detail = SYSTEM_DETAILS[detailKey] || SYSTEM_DETAILS.microcontroller;
  const Icon = detail.icon;

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => {
            nativeBridge.impactLight();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-bold transition-all active-press touch-manipulation shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          StrideSense Docs
        </span>
      </div>

      {/* Hero Card */}
      <div className="glass-panel p-5 sm:p-6 border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.04] to-transparent">
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl ${detail.iconBg} flex-shrink-0 shadow-sm`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                {detail.category}
              </span>
              <span className={`badge ${detail.badgeColor} text-[10px] font-mono px-2 py-0.5`}>
                {detail.badge}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white leading-tight">
              {detail.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {detail.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Content Sections */}
      <div className="flex flex-col gap-4">
        {detail.sections.map((sec, idx) => (
          <div key={idx} className="glass-panel p-5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              {sec.title}
            </h3>

            {sec.text && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {sec.text}
              </p>
            )}

            {/* List items if present */}
            {sec.list && (
              <ul className="mt-3 space-y-2">
                {sec.list.map((item, lIdx) => (
                  <li key={lIdx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Pinout items if present */}
            {sec.items && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {sec.items.map((pinItem, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400">
                      {pinItem.pin}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 sm:text-right">
                      {pinItem.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Back Button */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={() => {
            nativeBridge.impactLight();
            onBack();
          }}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active-press transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Settings</span>
        </button>
      </div>
    </div>
  );
}
