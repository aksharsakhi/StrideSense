/**
 * StrideSense - High-Fidelity In-Browser Biomechanical Simulator
 * Generates realistic 50 Hz insole pressure (P1..P6) and 6-DOF IMU dynamics
 * for live dashboard demonstration and testing.
 */

class InsoleSimulator {
  constructor() {
    this.mode = 'WALKING'; // STANDING, WALKING, RUNNING, SITTING, FALL
    this.time = 0;
    this.stepCount = 3842;
    this.fallState = {
      active: false,
      stage: 'NONE', // 'FREEFALL', 'IMPACT', 'REST'
      stageStart: 0,
      cancelled: false
    };
    this.listeners = new Set();
    this.timer = null;

    // Manual slider overrides (optional)
    this.overrides = null;
  }

  setMode(newMode) {
    this.mode = newMode;
    if (newMode === 'FALL') {
      this.triggerFall();
    } else {
      this.fallState = { active: false, stage: 'NONE', stageStart: 0, cancelled: false };
    }
  }

  triggerFall() {
    this.fallState = {
      active: true,
      stage: 'FREEFALL',
      stageStart: Date.now(),
      cancelled: false
    };
  }

  cancelFall() {
    this.fallState = {
      active: false,
      stage: 'NONE',
      stageStart: 0,
      cancelled: true
    };
    this.mode = 'STANDING';
  }

  start(intervalMs = 40) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.time += intervalMs / 1000;
      const telemetry = this.generateSample();
      this.listeners.forEach(fn => fn(telemetry));
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  generateSample() {
    const t = this.time;
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let cadence = 0;
    let confidence = 0.96;
    let activity = this.mode;

    // If a fall event is running
    if (this.fallState.active) {
      const elapsed = Date.now() - this.fallState.stageStart;
      activity = 'Fall';
      confidence = 0.98;

      if (elapsed < 300) {
        // Stage 1: Free fall (< 0.5g)
        this.fallState.stage = 'FREEFALL';
        ax = 0.05 + (Math.random() - 0.5) * 0.05;
        ay = 0.05 + (Math.random() - 0.5) * 0.05;
        az = 0.22 + (Math.random() - 0.5) * 0.05;
        gx = (Math.random() - 0.5) * 20;
        gy = (Math.random() - 0.5) * 20;
        gz = (Math.random() - 0.5) * 20;
        p1 = 30; p2 = 20; p3 = 20; p4 = 25; p5 = 25; p6 = 15;
      } else if (elapsed < 800) {
        // Stage 2: Violent ground impact collision (Shock > 3.5g)
        this.fallState.stage = 'IMPACT';
        ax = 2.1 + (Math.random() - 0.5) * 0.4;
        ay = 1.8 + (Math.random() - 0.5) * 0.4;
        az = 4.3 + (Math.random() - 0.5) * 0.6;
        gx = 280 + (Math.random() - 0.5) * 50;
        gy = 340 + (Math.random() - 0.5) * 60;
        gz = 120 + (Math.random() - 0.5) * 30;
        p1 = 3980; p2 = 3650; p3 = 900; p4 = 3400; p5 = 800; p6 = 200;
      } else {
        // Stage 3: Post-fall rest on ground (immobile, tilt angle altered)
        this.fallState.stage = 'REST';
        ax = 0.88 + (Math.random() - 0.5) * 0.02;
        ay = 0.15 + (Math.random() - 0.5) * 0.02;
        az = 0.22 + (Math.random() - 0.5) * 0.02;
        gx = (Math.random() - 0.5) * 0.5;
        gy = (Math.random() - 0.5) * 0.5;
        gz = (Math.random() - 0.5) * 0.5;
        p1 = 350; p2 = 720; p3 = 110; p4 = 650; p5 = 120; p6 = 50;
      }
    } else if (this.mode === 'STANDING') {
      const sway = 0.04 * Math.sin(2 * Math.PI * 0.3 * t);
      p1 = Math.round(1950 * (0.55 + sway) + (Math.random() - 0.5) * 20);
      p2 = Math.round(620 * (1 + sway) + (Math.random() - 0.5) * 15);
      p3 = Math.round(540 * (1 - sway) + (Math.random() - 0.5) * 15);
      p4 = Math.round(980 * (1 - sway) + (Math.random() - 0.5) * 20);
      p5 = Math.round(1100 * (1 - sway) + (Math.random() - 0.5) * 20);
      p6 = Math.round(450 * (1 - sway) + (Math.random() - 0.5) * 15);

      ax = 0.02 + (Math.random() - 0.5) * 0.02;
      ay = 0.01 + (Math.random() - 0.5) * 0.02;
      az = 1.00 + (Math.random() - 0.5) * 0.03;
      gx = (Math.random() - 0.5) * 1.5;
      gy = (Math.random() - 0.5) * 1.5;
      gz = (Math.random() - 0.5) * 1.0;
      cadence = 0;
      confidence = 0.98;
    } else if (this.mode === 'WALKING') {
      const freq = 0.90; // Stride cycle ~ 1.8 steps/sec
      const cycle = (t * freq) % 1.0;
      cadence = 108;
      confidence = 0.99;

      if (cycle < 0.60) {
        // Heel strike (0.05 - 0.18)
        p1 = Math.max(0, Math.exp(-Math.pow(cycle - 0.10, 2) / 0.003) * 2850);
        // Midstance (0.15 - 0.32)
        p2 = Math.max(0, Math.exp(-Math.pow(cycle - 0.22, 2) / 0.004) * 1350);
        p3 = Math.max(0, Math.exp(-Math.pow(cycle - 0.24, 2) / 0.004) * 1050);
        // Forefoot metatarsals (0.28 - 0.46)
        p4 = Math.max(0, Math.exp(-Math.pow(cycle - 0.38, 2) / 0.005) * 2600);
        p5 = Math.max(0, Math.exp(-Math.pow(cycle - 0.40, 2) / 0.005) * 3150);
        // Big toe propulsion (0.42 - 0.56)
        p6 = Math.max(0, Math.exp(-Math.pow(cycle - 0.50, 2) / 0.003) * 2400);
      } else {
        // Swing phase
        p1 = 15; p2 = 8; p3 = 8; p4 = 10; p5 = 10; p6 = 5;
      }

      // Step count increment on heel strike
      if (cycle > 0.08 && cycle < 0.12) {
        this.stepCount += 1;
      }

      const phase = 2 * Math.PI * freq * t;
      ax = 0.25 * Math.sin(phase) + (Math.random() - 0.5) * 0.05;
      ay = 0.55 * Math.sin(phase + Math.PI / 4) + (Math.random() - 0.5) * 0.05;
      az = 1.0 + 0.65 * Math.sin(2 * phase) + (Math.random() - 0.5) * 0.06;
      gx = 30 * Math.cos(phase);
      gy = 175 * Math.sin(phase);
      gz = 35 * Math.cos(phase + Math.PI / 3);
    } else if (this.mode === 'RUNNING') {
      const freq = 1.35; // Stride cycle ~ 2.7 steps/sec
      const cycle = (t * freq) % 1.0;
      cadence = 162;
      confidence = 0.97;

      if (cycle < 0.40) {
        p1 = Math.max(0, Math.exp(-Math.pow(cycle - 0.08, 2) / 0.0015) * 3600);
        p2 = Math.max(0, Math.exp(-Math.pow(cycle - 0.14, 2) / 0.002) * 2100);
        p3 = Math.max(0, Math.exp(-Math.pow(cycle - 0.16, 2) / 0.002) * 1800);
        p4 = Math.max(0, Math.exp(-Math.pow(cycle - 0.22, 2) / 0.0025) * 3800);
        p5 = Math.max(0, Math.exp(-Math.pow(cycle - 0.24, 2) / 0.0025) * 4050);
        p6 = Math.max(0, Math.exp(-Math.pow(cycle - 0.32, 2) / 0.0018) * 3400);
      } else {
        p1 = 15; p2 = 8; p3 = 8; p4 = 8; p5 = 8; p6 = 5;
      }

      if (cycle > 0.06 && cycle < 0.10) {
        this.stepCount += 1;
      }

      const phase = 2 * Math.PI * freq * t;
      ax = 0.65 * Math.sin(phase) + (Math.random() - 0.5) * 0.1;
      ay = 1.35 * Math.sin(phase + Math.PI / 3) + (Math.random() - 0.5) * 0.1;
      az = 1.0 + 1.85 * Math.sin(2 * phase) + (Math.random() - 0.5) * 0.15;
      gx = 75 * Math.cos(phase);
      gy = 370 * Math.sin(phase);
      gz = 85 * Math.cos(phase + Math.PI / 4);
    } else if (this.mode === 'SITTING') {
      p1 = 120 + (Math.random() - 0.5) * 15;
      p2 = 60 + (Math.random() - 0.5) * 10;
      p3 = 50 + (Math.random() - 0.5) * 10;
      p4 = 90 + (Math.random() - 0.5) * 12;
      p5 = 105 + (Math.random() - 0.5) * 15;
      p6 = 70 + (Math.random() - 0.5) * 10;
      ax = 0.01; ay = 0.01; az = 0.99;
      gx = 0; gy = 0; gz = 0;
      cadence = 0;
      confidence = 0.99;
    }

    // Manual slider overrides if set
    if (this.overrides) {
      if (this.overrides.p1 !== undefined) p1 = this.overrides.p1;
      if (this.overrides.p2 !== undefined) p2 = this.overrides.p2;
      if (this.overrides.p3 !== undefined) p3 = this.overrides.p3;
      if (this.overrides.p4 !== undefined) p4 = this.overrides.p4;
      if (this.overrides.p5 !== undefined) p5 = this.overrides.p5;
      if (this.overrides.p6 !== undefined) p6 = this.overrides.p6;
    }

    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI);
    const roll = Math.atan2(ay, az) * (180 / Math.PI);
    const svmA = Math.sqrt(ax * ax + ay * ay + az * az);

    return {
      timestamp: Date.now(),
      activity,
      confidence,
      steps: this.stepCount,
      cadence,
      symmetry: 96.4,
      fallAlert: this.fallState.active && (this.fallState.stage === 'IMPACT' || this.fallState.stage === 'REST'),
      fallEmergency: false,
      batteryPct: 88,
      batteryVoltage: 3.96,
      sensors: {
        p1: Math.round(p1),
        p2: Math.round(p2),
        p3: Math.round(p3),
        p4: Math.round(p4),
        p5: Math.round(p5),
        p6: Math.round(p6)
      },
      imu: {
        ax: parseFloat(ax.toFixed(3)),
        ay: parseFloat(ay.toFixed(3)),
        az: parseFloat(az.toFixed(3)),
        gx: parseFloat(gx.toFixed(1)),
        gy: parseFloat(gy.toFixed(1)),
        gz: parseFloat(gz.toFixed(1)),
        pitch: parseFloat(pitch.toFixed(1)),
        roll: parseFloat(roll.toFixed(1)),
        svmA: parseFloat(svmA.toFixed(2))
      }
    };
  }
}

export const simulator = new InsoleSimulator();
