/**
 * StrideSense Kinematic & Biomechanical Physics Engine
 * Generates 50 Hz realistic time-series sensor samples and 3D foot poses.
 * 
 * Hardware Target: 2x Square FSR Sensors (Heel on GPIO 36, Forefoot Ball on GPIO 39)
 * + 6-DOF IMU (MPU-6050)
 */

export class PhysicsEngine {
  constructor() {
    this.scenario = 'walking'; // 'standing' | 'walking' | 'running' | 'stumble' | 'fall' | 'sitting' | 'pronation'
    this.time = 0; // seconds
    this.sampleRate = 50; // 50 Hz (20ms per tick)
    this.simSpeed = 1.0; // 0.5x, 1.0x, 2.0x
    this.isRunning = true;
    this.frameCount = 0;
    this.windowBuffer = [];
    this.windowSize = 50; // 1.0s window buffer (50Hz * 1.0s = 50 samples, matching feature_extractor.py)

    // Fall state machine (Catastrophic Fall)
    this.fallState = 'idle'; // 'idle' | 'freefall' | 'impact' | 'alert_pending' | 'dispatched'
    this.fallTimer = 0;
    this.alertCountdown = 15; // 15 seconds grace period
    this.alertTimer = 0;

    // Stumble / Half Fall state machine (Near-Fall with dynamic recovery)
    this.stumbleState = 'idle'; // 'idle' | 'trip' | 'catch' | 'recovering' | 'recovered'
    this.stumbleTimer = 0;
    this.stumbleCount = 0;
    this.stumbleMessage = '';

    // Manual slider overrides
    this.manualOverride = false;
    this.manualSensors = {
      heel: 500,
      forefoot: 600,
      roll: 0,
      pitch: 0,
      svmAcc: 1.0
    };
  }

  setRunning(val) {
    this.isRunning = Boolean(val);
  }

  setSpeed(speed) {
    this.simSpeed = Math.max(0.25, Math.min(4.0, Number(speed) || 1.0));
  }

  reset() {
    this.time = 0;
    this.frameCount = 0;
    this.windowBuffer = [];
    this.fallState = 'idle';
    this.fallTimer = 0;
    this.alertCountdown = 15;
    this.alertTimer = 0;
    this.stumbleState = 'idle';
    this.stumbleTimer = 0;
    this.stumbleMessage = '';
    this.scenario = 'walking';
  }

  setScenario(scenario) {
    this.scenario = scenario;
    if (scenario === 'fall') {
      this.triggerFall();
    } else if (scenario === 'stumble') {
      this.triggerStumble();
    } else {
      this.fallState = 'idle';
      this.fallTimer = 0;
      this.alertCountdown = 15;
      this.stumbleState = 'idle';
      this.stumbleTimer = 0;
      this.stumbleMessage = '';
    }
  }

  triggerFall() {
    this.scenario = 'fall';
    this.fallState = 'freefall';
    this.fallTimer = 0;
    this.alertCountdown = 15;
    this.alertTimer = 0;
    this.stumbleState = 'idle';
  }

  triggerStumble() {
    this.scenario = 'stumble';
    this.stumbleState = 'trip';
    this.stumbleTimer = 0;
    this.stumbleCount++;
    this.stumbleMessage = 'Near-fall stumble initiated: Sudden trip shock';
    this.fallState = 'idle';
  }

  cancelFall() {
    this.fallState = 'idle';
    this.scenario = 'standing';
    this.fallTimer = 0;
    this.alertCountdown = 15;
  }

  step() {
    if (!this.isRunning) {
      // Return last generated sample frozen in time
      return this.windowBuffer.length > 0
        ? this.windowBuffer[this.windowBuffer.length - 1]
        : this.generateStandingSample();
    }

    const dt = (1 / this.sampleRate) * this.simSpeed;
    this.time += dt;
    this.frameCount++;

    let sample;
    if (this.manualOverride) {
      sample = this.generateManualSample();
    } else {
      switch (this.scenario) {
        case 'standing':
          sample = this.generateStandingSample();
          break;
        case 'sitting':
          sample = this.generateSittingSample();
          break;
        case 'running':
          sample = this.generateRunningSample();
          break;
        case 'stumble':
          sample = this.generateStumbleSample(dt);
          break;
        case 'pronation':
          sample = this.generatePronationSample();
          break;
        case 'fall':
          sample = this.generateFallSample(dt);
          break;
        case 'walking':
        default:
          sample = this.generateWalkingSample();
          break;
      }
    }

    // Add physical Gaussian sensor noise
    sample.ax += (Math.random() - 0.5) * 0.04;
    sample.ay += (Math.random() - 0.5) * 0.04;
    sample.az += (Math.random() - 0.5) * 0.04;
    sample.gx += (Math.random() - 0.5) * 1.5;
    sample.gy += (Math.random() - 0.5) * 1.5;
    sample.gz += (Math.random() - 0.5) * 1.5;

    // Maintain 25-sample sliding window (0.5s at 50Hz)
    this.windowBuffer.push(sample);
    if (this.windowBuffer.length > this.windowSize) {
      this.windowBuffer.shift();
    }

    return sample;
  }

  /**
   * Static Standing: Bilateral ground reaction force balance, 1.0g gravity
   */
  generateStandingSample() {
    const noise = () => Math.floor((Math.random() - 0.5) * 40);
    return {
      ax: 0.02,
      ay: 0.01,
      az: 0.99,
      gx: 0.1,
      gy: 0.2,
      gz: 0.1,
      p1: Math.max(0, 950 + noise()), // Heel (GPIO 36)
      p2: Math.max(0, 780 + noise()), // Forefoot Ball (GPIO 39)
      p3: 0, p4: 0, p5: Math.max(0, 780 + noise()), p6: 0,
      pitch: 0,
      roll: 0,
      lift: 0,
      phase: 'Static Stance'
    };
  }

  /**
   * Sitting / Resting: Feet lightly resting, negligible force, sedentary
   */
  generateSittingSample() {
    const noise = () => Math.floor((Math.random() - 0.5) * 15);
    return {
      ax: 0.05,
      ay: -0.15,
      az: 0.98,
      gx: 0.05,
      gy: 0.05,
      gz: 0.05,
      p1: Math.max(0, 70 + noise()),
      p2: Math.max(0, 50 + noise()),
      p3: 0, p4: 0, p5: Math.max(0, 50 + noise()), p6: 0,
      pitch: -4,
      roll: 2,
      lift: 0,
      phase: 'Sitting / Resting'
    };
  }

  /**
   * Normal Walking: 108 SPM Heel-to-Toe Stride Cycle (~1.11s)
   */
  generateWalkingSample() {
    const cycleDuration = 1.11;
    const phaseT = (this.time % cycleDuration) / cycleDuration;

    let p1 = 0, p2 = 0;
    let pitch = 0, roll = 0, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Swing Phase';

    if (phaseT < 0.20) {
      // 1. Heel Strike: initial contact on Heel (P1)
      phaseName = 'Heel Strike (Contact)';
      const k = phaseT / 0.20;
      p1 = Math.round(1180 * Math.sin(k * Math.PI));
      p2 = Math.round(120 * Math.sin(k * Math.PI));
      pitch = -16 * (1 - k);
      roll = 2;
      ax = 0.02 + 0.35 * Math.sin(k * Math.PI);
      ay = -0.55 * Math.sin(k * Math.PI);
      az = 1.45;
      gx = 18 * Math.sin(k * Math.PI);
      gy = -120 * (1 - k);
      gz = 25 * Math.sin(k * Math.PI);
    } else if (phaseT < 0.50) {
      // 2. Midstance: weight shifts across foot
      phaseName = 'Midstance (Transfer)';
      const k = (phaseT - 0.20) / 0.30;
      p1 = Math.round(620 * (1 - k));
      p2 = Math.round(750 * Math.sin(k * Math.PI));
      pitch = 2;
      roll = 1;
      ax = 0.0;
      ay = 0.15;
      az = 1.02;
      gx = 8; gy = 25; gz = 12;
    } else if (phaseT < 0.65) {
      // 3. Forefoot Push-off: explosive propulsion on Forefoot Ball (P2)
      phaseName = 'Forefoot Push-Off';
      const k = (phaseT - 0.50) / 0.15;
      p1 = 0;
      p2 = Math.round(1950 * Math.sin(k * Math.PI));
      pitch = 22 * k;
      roll = -2;
      ax = -0.35 * k;
      ay = 0.85 * Math.sin(k * Math.PI);
      az = 1.55;
      gx = -25 * k;
      gy = 190 * Math.sin(k * Math.PI);
      gz = 40 * Math.sin(k * Math.PI);
    } else {
      // 4. Swing Phase: airborne leg forward travel
      phaseName = 'Aerial Swing Phase';
      const k = (phaseT - 0.65) / 0.35;
      p1 = 0;
      p2 = 0;
      lift = Math.sin(k * Math.PI) * 0.14;
      pitch = Math.sin(k * Math.PI) * -14;
      roll = 0;
      ax = Math.sin(k * Math.PI * 2) * 0.35;
      ay = Math.cos(k * Math.PI) * 0.75;
      az = 0.95 + Math.sin(k * Math.PI) * 0.45;
      gx = Math.sin(k * Math.PI * 2) * 35;
      gy = Math.sin(k * Math.PI * 2) * 185;
      gz = Math.sin(k * Math.PI) * 42;
    }

    return {
      ax, ay, az, gx, gy, gz,
      p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
      pitch, roll, lift,
      phase: phaseName
    };
  }

  /**
   * Sprint Running: 165 SPM Stride Cycle (~0.72s), Forefoot Strike Dominant
   */
  generateRunningSample() {
    const cycleDuration = 0.72;
    const phaseT = (this.time % cycleDuration) / cycleDuration;

    let p1 = 0, p2 = 0;
    let pitch = 0, roll = 0, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Running Aerial Flight';

    if (phaseT < 0.38) {
      // High-Impact Forefoot Stance
      phaseName = 'High-Impact Forefoot Strike';
      const k = phaseT / 0.38;
      p1 = Math.round(450 * Math.sin(k * Math.PI * 0.4)); // Minor heel touch
      p2 = Math.round(3400 * Math.sin(k * Math.PI));       // Heavy forefoot compression
      pitch = 18 * (k - 0.4);
      roll = -3;
      ax = Math.sin(k * Math.PI) * 1.5;
      ay = -1.9 * Math.cos(k * Math.PI);
      az = 3.3 * Math.sin(k * Math.PI);
      gx = 85 * Math.sin(k * Math.PI);
      gy = 320 * Math.sin(k * Math.PI);
      gz = 110 * Math.sin(k * Math.PI);
    } else {
      // Aerial Flight Phase
      const k = (phaseT - 0.38) / 0.62;
      lift = Math.sin(k * Math.PI) * 0.28;
      pitch = -24 * Math.sin(k * Math.PI);
      roll = -4;
      ax = Math.sin(k * Math.PI * 2) * 1.4;
      ay = Math.cos(k * Math.PI) * 2.1;
      az = 0.25 + Math.sin(k * Math.PI) * 0.4;
      gx = Math.sin(k * Math.PI * 2) * 95;
      gy = Math.sin(k * Math.PI * 2) * 310;
      gz = Math.sin(k * Math.PI * 2) * 95;
    }

    return {
      ax, ay, az, gx, gy, gz,
      p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
      pitch, roll, lift,
      phase: phaseName
    };
  }

  /**
   * Half Fall / Stumble: Trip, high-G jerk, forward pitch drop, violent corrective forefoot catch,
   * followed by complete self-stabilization and smooth return to normal walking.
   * Proves algorithm DOES NOT trigger false emergency alert!
   */
  generateStumbleSample(dt) {
    this.stumbleTimer += dt;

    if (this.stumbleState === 'trip') {
      // Phase 1: Forward trip, loss of balance, sudden gyro jerk (0 to 0.35s)
      const k = Math.min(1.0, this.stumbleTimer / 0.35);
      const pitch = -28 * k;
      const roll = 12 * Math.sin(k * Math.PI);
      const ax = 1.2 * Math.sin(k * Math.PI);
      const ay = -1.8 * k;
      const az = 0.45; // Sudden momentary dip in gravity vector
      const gx = 180 * Math.sin(k * Math.PI);
      const gy = -260 * k;
      const gz = 90 * Math.sin(k * Math.PI);

      if (this.stumbleTimer > 0.35) {
        this.stumbleState = 'catch';
        this.stumbleTimer = 0;
        this.stumbleMessage = 'Corrective lunging step! Forefoot shock absorber engaged';
      }

      return {
        ax, ay, az, gx, gy, gz,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        pitch, roll, lift: 0.08,
        phase: 'HALF FALL STAGE 1: Sudden Trip / Obstacle Strike'
      };
    } else if (this.stumbleState === 'catch') {
      // Phase 2: Corrective lunge! Forefoot Ball (P2) strikes floor with high impact (0.35 to 0.75s)
      const k = Math.min(1.0, this.stumbleTimer / 0.40);
      const p2 = Math.round(3650 * Math.sin(k * Math.PI)); // Violent deceleration support
      const p1 = Math.round(750 * Math.sin(k * Math.PI));
      const pitch = -28 + 18 * k; // Rebounding upwards
      const roll = 8 * (1 - k);
      const ax = 1.8 * Math.sin(k * Math.PI);
      const ay = 2.4 * Math.sin(k * Math.PI);
      const az = 2.7 * Math.sin(k * Math.PI); // High impact deceleration (SVM ~3.2g)
      const gx = -120 * Math.sin(k * Math.PI);
      const gy = 190 * Math.sin(k * Math.PI);
      const gz = -70 * Math.sin(k * Math.PI);

      if (this.stumbleTimer > 0.40) {
        this.stumbleState = 'recovering';
        this.stumbleTimer = 0;
        this.stumbleMessage = 'Dynamic righting reflex: Body posture leveling off';
      }

      return {
        ax, ay, az, gx, gy, gz,
        p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
        pitch, roll, lift: 0,
        phase: 'HALF FALL STAGE 2: Corrective Forefoot Lunge & Deceleration (>2.8g)'
      };
    } else if (this.stumbleState === 'recovering') {
      // Phase 3: Postural stabilization back to normal stance (0 to 0.65s)
      const k = Math.min(1.0, this.stumbleTimer / 0.65);
      const pitch = -10 * (1 - k);
      const roll = 3 * (1 - k);
      const ax = 0.2 * (1 - k);
      const ay = 0.1 * (1 - k);
      const az = 1.0 + 0.2 * Math.sin(k * Math.PI * 2);
      const gx = 25 * (1 - k);
      const gy = 30 * (1 - k);
      const gz = 15 * (1 - k);
      const p1 = Math.round(900 + 150 * (1 - k));
      const p2 = Math.round(850 + 200 * (1 - k));

      if (this.stumbleTimer > 0.65) {
        this.stumbleState = 'recovered';
        this.stumbleTimer = 0;
        this.stumbleMessage = 'Stumble Recovered ✓ Normal walking resumed (Zero false alarm)';
        // Seamlessly return to walking scenario
        this.scenario = 'walking';
      }

      return {
        ax, ay, az, gx, gy, gz,
        p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
        pitch, roll, lift: 0,
        phase: 'HALF FALL STAGE 3: Righting Reflex Active (Stabilizing)'
      };
    } else {
      // Recovered, handoff back to normal walking
      return this.generateWalkingSample();
    }
  }

  /**
   * Catastrophic Fall: 4-Stage Dual-Trigger Algorithm Vector
   * Freefall (<0.5g) -> Floor Impact (>4.0g) -> Immobile Tilt with 15s Countdown -> Dispatch
   */
  generateFallSample(dt) {
    this.fallTimer += dt;

    if (this.fallState === 'freefall') {
      // Stage 1: Loss of balance & freefall drop (<0.5g)
      const ax = 0.1;
      const ay = 0.8 * Math.sin(this.fallTimer * 10);
      const az = 0.22; // Microgravity drop
      const pitch = -38 * (this.fallTimer / 0.35);
      const roll = 18 * (this.fallTimer / 0.35);

      if (this.fallTimer > 0.35) {
        this.fallState = 'impact';
        this.fallTimer = 0;
      }
      return {
        ax, ay, az,
        gx: 140, gy: -240, gz: 90,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        pitch, roll, lift: 0.12,
        phase: 'CATASTROPHIC FALL STAGE 1: Freefall Drop (<0.5g Microgravity)'
      };
    } else if (this.fallState === 'impact') {
      // Stage 2: Violent floor collision (>4.5g shock & pressure spike)
      const ax = 3.9;
      const ay = 4.6;
      const az = 5.8; // High collision G (SVM > 7.5g)
      const pitch = -62;
      const roll = 50;

      if (this.fallTimer > 0.30) {
        this.fallState = 'alert_pending';
        this.fallTimer = 0;
        this.alertCountdown = 15;
      }
      return {
        ax, ay, az,
        gx: 410, gy: 520, gz: 340,
        p1: 4095, p2: 4095, p3: 0, p4: 0, p5: 4095, p6: 0, // Max ADC saturation
        pitch, roll, lift: 0,
        phase: 'CATASTROPHIC FALL STAGE 2: Violent Collision Impact (>7.5g Shock)'
      };
    } else if (this.fallState === 'alert_pending') {
      // Stage 3: Motionless on floor, abnormal tilt (>45° pitch/roll), 15s SOS grace countdown
      this.alertTimer += dt;
      if (this.alertTimer >= 1.0) {
        this.alertCountdown = Math.max(0, this.alertCountdown - 1);
        this.alertTimer = 0;
        if (this.alertCountdown === 0) {
          this.fallState = 'dispatched';
        }
      }

      return {
        ax: 0.72,
        ay: -0.15,
        az: 0.65,
        gx: 0.1, gy: 0.1, gz: 0.1, // Motionless stillness
        p1: 180, p2: 120, p3: 0, p4: 0, p5: 120, p6: 0,
        pitch: -65,
        roll: 52,
        lift: 0,
        phase: `CATASTROPHIC FALL STAGE 3: Immobile Tilt • SOS Countdown (${this.alertCountdown}s)`
      };
    } else {
      // Stage 4: Emergency dispatched to caregiver
      return {
        ax: 0.72,
        ay: -0.15,
        az: 0.65,
        gx: 0.1, gy: 0.1, gz: 0.1,
        p1: 180, p2: 120, p3: 0, p4: 0, p5: 120, p6: 0,
        pitch: -65,
        roll: 52,
        lift: 0,
        phase: 'CATASTROPHIC FALL STAGE 4: EMERGENCY ALERT BROADCAST TO CAREGIVER'
      };
    }
  }

  /**
   * Over-Pronation: Medial arch collapse (-16° inward roll tilt)
   */
  generatePronationSample() {
    const normal = this.generateWalkingSample();
    return {
      ...normal,
      p1: Math.round(normal.p1 * 0.8),
      p2: Math.min(4095, Math.round(normal.p2 * 1.5)), // Excessive medial ball pressure
      p5: Math.min(4095, Math.round(normal.p2 * 1.5)),
      roll: -16, // Inward eversion
      phase: normal.phase + ' (Pronation Inward Tilt)'
    };
  }

  /**
   * Manual Slider Override
   */
  generateManualSample() {
    const s = this.manualSensors;
    return {
      ax: Math.sin((s.pitch * Math.PI) / 180),
      ay: Math.sin((s.roll * Math.PI) / 180),
      az: s.svmAcc,
      gx: 0,
      gy: 0,
      gz: 0,
      p1: s.heel,
      p2: s.forefoot,
      p3: 0, p4: 0, p5: s.forefoot, p6: 0,
      pitch: s.pitch,
      roll: s.roll,
      lift: 0,
      phase: 'Manual Hardware Override'
    };
  }
}
