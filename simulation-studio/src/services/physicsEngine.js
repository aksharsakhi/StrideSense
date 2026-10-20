/**
 * StrideSense Kinematic & Biomechanical Physics Engine - Bilateral Edition
 * Generates 50 Hz realistic time-series sensor samples and 3D dual-foot poses.
 * 
 * Hardware Target: Bilateral Dual Smart Insoles (Left Foot + Right Foot)
 * Each foot: 2x Square FSR Sensors (Heel on GPIO 34, Forefoot Ball on GPIO 35) + 6-DOF IMU (MPU-6050)
 */

export class PhysicsEngine {
  constructor() {
    this.scenario = 'walking'; // 'standing' | 'walking' | 'running' | 'elderly_shuffle' | 'post_op_limp' | 'stumble' | 'fall' | 'sitting' | 'pronation'
    this.time = 0; // seconds
    this.sampleRate = 50; // 50 Hz (20ms per tick)
    this.simSpeed = 1.0; // 0.5x, 1.0x, 2.0x
    this.isRunning = true;
    this.frameCount = 0;
    this.windowBuffer = [];
    this.windowSize = 50; // 1.0s window buffer (50Hz * 1.0s = 50 samples)

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
        case 'elderly_shuffle':
          sample = this.generateElderlyShufflingSample();
          break;
        case 'post_op_limp':
          sample = this.generatePostOperativeLimpSample();
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

    // Add physical Gaussian sensor noise to Left Foot
    sample.left.ax += (Math.random() - 0.5) * 0.04;
    sample.left.ay += (Math.random() - 0.5) * 0.04;
    sample.left.az += (Math.random() - 0.5) * 0.04;
    sample.left.gx += (Math.random() - 0.5) * 1.5;
    sample.left.gy += (Math.random() - 0.5) * 1.5;
    sample.left.gz += (Math.random() - 0.5) * 1.5;

    // Add physical Gaussian sensor noise to Right Foot
    sample.right.ax += (Math.random() - 0.5) * 0.04;
    sample.right.ay += (Math.random() - 0.5) * 0.04;
    sample.right.az += (Math.random() - 0.5) * 0.04;
    sample.right.gx += (Math.random() - 0.5) * 1.5;
    sample.right.gy += (Math.random() - 0.5) * 1.5;
    sample.right.gz += (Math.random() - 0.5) * 1.5;

    // Mirror to top-level for backwards compatibility
    sample.ax = sample.left.ax;
    sample.ay = sample.left.ay;
    sample.az = sample.left.az;
    sample.gx = sample.left.gx;
    sample.gy = sample.left.gy;
    sample.gz = sample.left.gz;
    sample.p1 = sample.left.p1;
    sample.p2 = sample.left.p2;
    sample.p3 = 0;
    sample.p4 = 0;
    sample.p5 = sample.left.p2;
    sample.p6 = 0;
    sample.pitch = sample.left.pitch;
    sample.roll = sample.left.roll;
    sample.lift = sample.left.lift;
    sample.phase = sample.left.phase;

    // Maintain 50-sample sliding window (1.0s at 50Hz)
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
    const left = {
      ax: 0.02, ay: 0.01, az: 0.99,
      gx: 0.1, gy: 0.2, gz: 0.1,
      p1: Math.max(0, 950 + noise()),
      p2: Math.max(0, 780 + noise()),
      p3: 0, p4: 0, p5: Math.max(0, 780 + noise()), p6: 0,
      pitch: 0, roll: 0, lift: 0,
      phase: 'Static Stance'
    };
    const right = {
      ax: -0.02, ay: 0.01, az: 0.99,
      gx: -0.1, gy: 0.2, gz: -0.1,
      p1: Math.max(0, 930 + noise()),
      p2: Math.max(0, 800 + noise()),
      p3: 0, p4: 0, p5: Math.max(0, 800 + noise()), p6: 0,
      pitch: 0, roll: 0, lift: 0,
      phase: 'Static Stance'
    };

    return {
      left, right,
      bilateral: {
        symmetryIndex: 98.7,
        leftForce: left.p1 + left.p2,
        rightForce: right.p1 + right.p2,
        weightDistribution: { leftPct: 50.5, rightPct: 49.5 }
      }
    };
  }

  /**
   * Sitting / Resting: Feet lightly resting, negligible force, sedentary
   */
  generateSittingSample() {
    const noise = () => Math.floor((Math.random() - 0.5) * 15);
    const left = {
      ax: 0.05, ay: -0.15, az: 0.98,
      gx: 0.05, gy: 0.05, gz: 0.05,
      p1: Math.max(0, 70 + noise()),
      p2: Math.max(0, 50 + noise()),
      p3: 0, p4: 0, p5: Math.max(0, 50 + noise()), p6: 0,
      pitch: -4, roll: 2, lift: 0,
      phase: 'Sitting / Resting'
    };
    const right = {
      ax: -0.05, ay: -0.15, az: 0.98,
      gx: -0.05, gy: 0.05, gz: -0.05,
      p1: Math.max(0, 75 + noise()),
      p2: Math.max(0, 45 + noise()),
      p3: 0, p4: 0, p5: Math.max(0, 45 + noise()), p6: 0,
      pitch: -4, roll: -2, lift: 0,
      phase: 'Sitting / Resting'
    };

    return {
      left, right,
      bilateral: {
        symmetryIndex: 99.2,
        leftForce: left.p1 + left.p2,
        rightForce: right.p1 + right.p2,
        weightDistribution: { leftPct: 50.0, rightPct: 50.0 }
      }
    };
  }

  /**
   * Helper: Calculates single-foot kinematic trajectory given phase (0.0 to 1.0)
   */
  _computeWalkingFoot(phaseT, isRight = false) {
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
      roll = isRight ? -2 : 2;
      ax = 0.02 + 0.35 * Math.sin(k * Math.PI);
      ay = -0.55 * Math.sin(k * Math.PI);
      az = 1.45;
      gx = 18 * Math.sin(k * Math.PI);
      gy = -120 * (1 - k);
      gz = (isRight ? -25 : 25) * Math.sin(k * Math.PI);
    } else if (phaseT < 0.50) {
      // 2. Midstance: weight shifts across foot
      phaseName = 'Midstance (Transfer)';
      const k = (phaseT - 0.20) / 0.30;
      p1 = Math.round(620 * (1 - k));
      p2 = Math.round(750 * Math.sin(k * Math.PI));
      pitch = 2;
      roll = isRight ? -1 : 1;
      ax = 0.0;
      ay = 0.15;
      az = 1.02;
      gx = 8; gy = 25; gz = (isRight ? -12 : 12);
    } else if (phaseT < 0.65) {
      // 3. Forefoot Push-off: propulsion on Forefoot Ball (P2)
      phaseName = 'Forefoot Push-Off';
      const k = (phaseT - 0.50) / 0.15;
      p1 = 0;
      p2 = Math.round(1950 * Math.sin(k * Math.PI));
      pitch = 22 * k;
      roll = isRight ? 2 : -2;
      ax = -0.35 * k;
      ay = 0.85 * Math.sin(k * Math.PI);
      az = 1.55;
      gx = -25 * k;
      gy = 190 * Math.sin(k * Math.PI);
      gz = (isRight ? -40 : 40) * Math.sin(k * Math.PI);
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
      gz = Math.sin(k * Math.PI) * (isRight ? -42 : 42);
    }

    return {
      ax, ay, az, gx, gy, gz,
      p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
      pitch, roll, lift,
      phase: phaseName
    };
  }

  /**
   * Normal Walking: 108 SPM Heel-to-Toe Stride Cycle (~1.11s) with Bilateral Antiphase
   */
  generateWalkingSample() {
    const cycleDuration = 1.11;
    const phaseT_left = (this.time % cycleDuration) / cycleDuration;
    // Right foot is phase-shifted by exactly 50% (antiphase human walking cycle)
    const phaseT_right = ((this.time + cycleDuration * 0.50) % cycleDuration) / cycleDuration;

    const left = this._computeWalkingFoot(phaseT_left, false);
    const right = this._computeWalkingFoot(phaseT_right, true);

    const leftForce = left.p1 + left.p2;
    const rightForce = right.p1 + right.p2;
    const totalForce = Math.max(1, leftForce + rightForce);

    return {
      left,
      right,
      bilateral: {
        symmetryIndex: 97.8,
        leftForce,
        rightForce,
        weightDistribution: {
          leftPct: Number(((leftForce / totalForce) * 100).toFixed(1)),
          rightPct: Number(((rightForce / totalForce) * 100).toFixed(1))
        }
      }
    };
  }

  /**
   * Sprint Running: 165 SPM Stride Cycle (~0.72s) with Bilateral Antiphase
   */
  _computeRunningFoot(phaseT, isRight = false) {
    let p1 = 0, p2 = 0;
    let pitch = 0, roll = 0, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Running Aerial Flight';

    if (phaseT < 0.38) {
      phaseName = 'High-Impact Forefoot Strike';
      const k = phaseT / 0.38;
      p1 = Math.round(450 * Math.sin(k * Math.PI * 0.4));
      p2 = Math.round(3400 * Math.sin(k * Math.PI));
      pitch = 18 * (k - 0.4);
      roll = isRight ? 3 : -3;
      ax = Math.sin(k * Math.PI) * 1.5;
      ay = -1.9 * Math.cos(k * Math.PI);
      az = 3.3 * Math.sin(k * Math.PI);
      gx = 85 * Math.sin(k * Math.PI);
      gy = 320 * Math.sin(k * Math.PI);
      gz = (isRight ? -110 : 110) * Math.sin(k * Math.PI);
    } else {
      const k = (phaseT - 0.38) / 0.62;
      lift = Math.sin(k * Math.PI) * 0.28;
      pitch = -24 * Math.sin(k * Math.PI);
      roll = isRight ? 4 : -4;
      ax = Math.sin(k * Math.PI * 2) * 1.4;
      ay = Math.cos(k * Math.PI) * 2.1;
      az = 0.25 + Math.sin(k * Math.PI) * 0.4;
      gx = Math.sin(k * Math.PI * 2) * 95;
      gy = Math.sin(k * Math.PI * 2) * 310;
      gz = Math.sin(k * Math.PI * 2) * (isRight ? -95 : 95);
    }

    return {
      ax, ay, az, gx, gy, gz,
      p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
      pitch, roll, lift,
      phase: phaseName
    };
  }

  generateRunningSample() {
    const cycleDuration = 0.72;
    const phaseT_left = (this.time % cycleDuration) / cycleDuration;
    const phaseT_right = ((this.time + cycleDuration * 0.50) % cycleDuration) / cycleDuration;

    const left = this._computeRunningFoot(phaseT_left, false);
    const right = this._computeRunningFoot(phaseT_right, true);

    const leftForce = left.p1 + left.p2;
    const rightForce = right.p1 + right.p2;
    const totalForce = Math.max(1, leftForce + rightForce);

    return {
      left,
      right,
      bilateral: {
        symmetryIndex: 98.4,
        leftForce,
        rightForce,
        weightDistribution: {
          leftPct: Number(((leftForce / totalForce) * 100).toFixed(1)),
          rightPct: Number(((rightForce / totalForce) * 100).toFixed(1))
        }
      }
    };
  }

  /**
   * Abnormal Elderly Shuffling Walk:
   * Senescent/cautious gait with low clearance (scraping), flat-foot landing,
   * prolonged double-stance (~74%), reduced push-off force, ~70 SPM cadence, and micro-tremor.
   */
  _computeElderlyFoot(phaseT, isRight = false) {
    let p1 = 0, p2 = 0;
    let pitch = 0, roll = 0, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Elderly Shuffling Swing';

    // Senescent micro-tremor (5-6 Hz physiological/senescent vibration)
    const tremor = Math.sin(this.time * 35) * 2.8;

    if (phaseT < 0.28) {
      // 1. Flat-foot low-impact contact (no distinct heel-strike strike angle)
      phaseName = 'Senescent Flat-Foot Contact';
      const k = phaseT / 0.28;
      p1 = Math.round(720 * Math.sin(k * Math.PI));
      p2 = Math.round(580 * Math.sin(k * Math.PI)); // Forefoot contacts almost simultaneously
      pitch = -5 * (1 - k); // Almost flat landing (only -5° vs normal -16°)
      roll = isRight ? -1.5 : 1.5;
      ax = 0.08 * Math.sin(k * Math.PI);
      ay = -0.22 * Math.sin(k * Math.PI);
      az = 1.15; // Muted vertical strike shock
      gx = 8 * Math.sin(k * Math.PI) + tremor;
      gy = -35 * (1 - k) + tremor;
      gz = (isRight ? -8 : 8) + tremor;
    } else if (phaseT < 0.58) {
      // 2. Prolonged midstance (cautious flat weight bearing)
      phaseName = 'Prolonged Double-Stance Support';
      const k = (phaseT - 0.28) / 0.30;
      p1 = Math.round(520 * (1 - 0.4 * k));
      p2 = Math.round(650 * (0.6 + 0.4 * Math.sin(k * Math.PI)));
      pitch = 0.5;
      roll = isRight ? -0.8 : 0.8;
      ax = 0.01;
      ay = 0.05;
      az = 1.01;
      gx = tremor;
      gy = 8 + tremor;
      gz = (isRight ? -4 : 4) + tremor;
    } else if (phaseT < 0.74) {
      // 3. Attenuated push-off (reduced plantarflexion force)
      phaseName = 'Attenuated Shuffling Push-Off';
      const k = (phaseT - 0.58) / 0.16;
      p1 = Math.round(150 * (1 - k));
      p2 = Math.round(820 * Math.sin(k * Math.PI)); // Muted push-off (<850 ADC vs normal >1900 ADC)
      pitch = 7 * k; // Reduced toe extension
      roll = isRight ? 1.0 : -1.0;
      ax = -0.15 * k;
      ay = 0.28 * Math.sin(k * Math.PI);
      az = 1.18;
      gx = -12 * k + tremor;
      gy = 75 * Math.sin(k * Math.PI) + tremor;
      gz = (isRight ? -15 : 15) * Math.sin(k * Math.PI);
    } else {
      // 4. Low ground-clearance shuffling swing (high trip risk)
      phaseName = 'Low-Clearance Shuffling Swing';
      const k = (phaseT - 0.74) / 0.26;
      p1 = 0;
      p2 = 0;
      lift = Math.sin(k * Math.PI) * 0.035; // Scrapes floor: only 3.5cm lift (normal is 14cm)
      pitch = Math.sin(k * Math.PI) * -4; // Low foot pitch angle
      roll = 0;
      ax = Math.sin(k * Math.PI * 2) * 0.18;
      ay = Math.cos(k * Math.PI) * 0.32;
      az = 0.98 + Math.sin(k * Math.PI) * 0.15;
      gx = Math.sin(k * Math.PI * 2) * 15 + tremor;
      gy = Math.sin(k * Math.PI * 2) * 65 + tremor;
      gz = Math.sin(k * Math.PI) * (isRight ? -14 : 14);
    }

    return {
      ax, ay, az, gx, gy, gz,
      p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
      pitch, roll, lift,
      phase: phaseName
    };
  }

  generateElderlyShufflingSample() {
    const cycleDuration = 1.71; // ~70 SPM slow cautious cadence
    const phaseT_left = (this.time % cycleDuration) / cycleDuration;
    const phaseT_right = ((this.time + cycleDuration * 0.50) % cycleDuration) / cycleDuration;

    const left = this._computeElderlyFoot(phaseT_left, false);
    const right = this._computeElderlyFoot(phaseT_right, true);

    const leftForce = left.p1 + left.p2;
    const rightForce = right.p1 + right.p2;
    const totalForce = Math.max(1, leftForce + rightForce);

    return {
      left,
      right,
      bilateral: {
        symmetryIndex: 94.5,
        leftForce,
        rightForce,
        weightDistribution: {
          leftPct: Number(((leftForce / totalForce) * 100).toFixed(1)),
          rightPct: Number(((rightForce / totalForce) * 100).toFixed(1))
        }
      }
    };
  }

  /**
   * Severe Post-Operative Antalgic Limp (Operated Right Leg):
   * Severe clinical asymmetry:
   *  - Left leg (healthy): bears 78-82% load, prolonged stance (66%), compensatory heel impact.
   *  - Right leg (post-op knee/hip): guarded, antalgic quick touchdown (<32% stance), force <420 ADC.
   *  - Overall: 84 SPM cadence, 54.5% symmetry index, lateral antalgic tilt.
   */
  _computePostOpOperatedFoot(phaseT) {
    let p1 = 0, p2 = 0;
    let pitch = 0, roll = -4.5, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Operated Leg Antalgic Unload (Swing)';

    // Stance is truncated to only 32% of stride cycle due to pain avoidance
    if (phaseT < 0.14) {
      // 1. Guarded, cautious gentle touchdown (avoids heel shock)
      phaseName = 'Operated Leg Guarded Touchdown';
      const k = phaseT / 0.14;
      p1 = Math.round(390 * Math.sin(k * Math.PI));
      p2 = Math.round(340 * Math.sin(k * Math.PI));
      pitch = -4 * (1 - k);
      roll = -4.5;
      ax = 0.05 * Math.sin(k * Math.PI);
      ay = -0.12 * Math.sin(k * Math.PI);
      az = 1.08; // Very low impact acceleration
      gx = 5 * Math.sin(k * Math.PI);
      gy = -20 * (1 - k);
      gz = -6 * Math.sin(k * Math.PI);
    } else if (phaseT < 0.32) {
      // 2. Hurried weight transfer / antalgic lift-off (patient cannot sustain load)
      phaseName = 'Operated Leg Rapid Antalgic Escape';
      const k = (phaseT - 0.14) / 0.18;
      p1 = Math.round(200 * (1 - k));
      p2 = Math.round(410 * Math.sin(k * Math.PI));
      pitch = 6 * k;
      roll = -3.8;
      ax = -0.10 * k;
      ay = 0.15 * Math.sin(k * Math.PI);
      az = 1.05;
      gx = -8 * k;
      gy = 35 * Math.sin(k * Math.PI);
      gz = -8 * Math.sin(k * Math.PI);
    } else {
      // 3. Prolonged non-weight-bearing swing / resting phase (68% of stride)
      phaseName = 'Operated Leg Cautious Flight';
      const k = (phaseT - 0.32) / 0.68;
      p1 = 0;
      p2 = 0;
      lift = Math.sin(k * Math.PI) * 0.08;
      pitch = Math.sin(k * Math.PI) * -6;
      roll = -4.0;
      ax = Math.sin(k * Math.PI * 2) * 0.15;
      ay = Math.cos(k * Math.PI) * 0.28;
      az = 0.96 + Math.sin(k * Math.PI) * 0.18;
      gx = Math.sin(k * Math.PI * 2) * 12;
      gy = Math.sin(k * Math.PI * 2) * 55;
      gz = Math.sin(k * Math.PI) * -12;
    }

    return {
      ax, ay, az, gx, gy, gz,
      p1, p2, p3: 0, p4: 0, p5: p2, p6: 0,
      pitch, roll, lift,
      phase: phaseName
    };
  }

  generatePostOperativeLimpSample() {
    const cycleDuration = 1.42; // ~84 SPM antalgic cadence
    const phaseT_left = (this.time % cycleDuration) / cycleDuration;
    const phaseT_right = ((this.time + cycleDuration * 0.50) % cycleDuration) / cycleDuration;

    // Left is Healthy Unaffected Foot: absorbs heavy compensatory strike
    const leftNormal = this._computeWalkingFoot(phaseT_left, false);
    // Amplify load and tilt toward healthy limb to bear patient's mass
    const left = {
      ...leftNormal,
      p1: Math.min(4095, Math.round(leftNormal.p1 * 1.55)),
      p2: Math.min(4095, Math.round(leftNormal.p2 * 1.40)),
      az: leftNormal.az > 1.2 ? leftNormal.az * 1.25 : leftNormal.az,
      roll: 6.8, // Lateral antalgic compensatory trunk tilt over healthy side
      phase: leftNormal.phase.replace('Heel Strike', 'Healthy Limb Compensatory Impact')
    };
    left.p5 = left.p2;

    // Right is Operated Foot: severely protected and guarded
    const right = this._computePostOpOperatedFoot(phaseT_right);

    const leftForce = left.p1 + left.p2;
    const rightForce = right.p1 + right.p2;
    const totalForce = Math.max(1, leftForce + rightForce);

    return {
      left,
      right,
      bilateral: {
        symmetryIndex: 54.5, // Severe clinical asymmetry biomarker
        leftForce,
        rightForce,
        weightDistribution: {
          leftPct: Number(((leftForce / totalForce) * 100).toFixed(1)),
          rightPct: Number(((rightForce / totalForce) * 100).toFixed(1))
        }
      }
    };
  }

  /**
   * Half Fall / Stumble
   */
  generateStumbleSample(dt) {
    this.stumbleTimer += dt;
    const walk = this.generateWalkingSample();

    if (this.stumbleState === 'trip') {
      const k = Math.min(1.0, this.stumbleTimer / 0.35);
      const pitch = -28 * k;
      const roll = 12 * Math.sin(k * Math.PI);
      const ax = 1.2 * Math.sin(k * Math.PI);
      const ay = -1.8 * k;
      const az = 0.45;
      const gx = 180 * Math.sin(k * Math.PI);
      const gy = -260 * k;
      const gz = 90 * Math.sin(k * Math.PI);

      if (this.stumbleTimer > 0.35) {
        this.stumbleState = 'catch';
        this.stumbleTimer = 0;
        this.stumbleMessage = 'Corrective lunging step! Forefoot shock absorber engaged';
      }

      walk.left = {
        ax, ay, az, gx, gy, gz,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        pitch, roll, lift: 0.08,
        phase: 'HALF FALL STAGE 1: Sudden Trip / Obstacle Strike'
      };
      walk.right.pitch = 5;
      walk.right.p1 = 200;
    } else if (this.stumbleState === 'catch') {
      const k = Math.min(1.0, this.stumbleTimer / 0.40);
      walk.left = {
        ax: -0.4 * (1 - k), ay: 2.1 * Math.sin(k * Math.PI), az: 2.8 * Math.sin(k * Math.PI),
        gx: -40, gy: 310 * Math.sin(k * Math.PI), gz: 80,
        p1: 0, p2: Math.round(3800 * Math.sin(k * Math.PI)),
        p3: 0, p4: 0, p5: Math.round(3800 * Math.sin(k * Math.PI)), p6: 0,
        pitch: 14 * (1 - k), roll: -6 * (1 - k), lift: 0,
        phase: 'HALF FALL STAGE 2: Corrective Stance Catch'
      };
      if (this.stumbleTimer > 0.40) {
        this.stumbleState = 'recovering';
        this.stumbleTimer = 0;
      }
    } else if (this.stumbleState === 'recovering') {
      if (this.stumbleTimer > 0.60) {
        this.stumbleState = 'idle';
        this.scenario = 'walking';
      }
    }

    return walk;
  }

  /**
   * Catastrophic Fall
   */
  generateFallSample(dt) {
    this.fallTimer += dt;
    let left, right;

    if (this.fallState === 'freefall') {
      const ax = 0.05;
      const ay = -0.15;
      const az = 0.28; // <0.5g freefall drop
      const pitch = -38 * (this.fallTimer / 0.35);
      const roll = 18 * (this.fallTimer / 0.35);

      if (this.fallTimer > 0.35) {
        this.fallState = 'impact';
        this.fallTimer = 0;
      }
      left = {
        ax, ay, az, gx: 140, gy: -240, gz: 90,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        pitch, roll, lift: 0.12,
        phase: 'CATASTROPHIC FALL STAGE 1: Freefall Drop (<0.5g Microgravity)'
      };
      right = { ...left, roll: -roll };
    } else if (this.fallState === 'impact') {
      const ax = 3.9, ay = 4.6, az = 5.8;
      const pitch = -62, roll = 50;
      if (this.fallTimer > 0.30) {
        this.fallState = 'alert_pending';
        this.fallTimer = 0;
        this.alertCountdown = 15;
      }
      left = {
        ax, ay, az, gx: 410, gy: 520, gz: 340,
        p1: 4095, p2: 4095, p3: 0, p4: 0, p5: 4095, p6: 0,
        pitch, roll, lift: 0,
        phase: 'CATASTROPHIC FALL STAGE 2: Violent Collision Impact (>7.5g Shock)'
      };
      right = { ...left, roll: -roll };
    } else if (this.fallState === 'alert_pending') {
      this.alertTimer += dt;
      if (this.alertTimer >= 1.0) {
        this.alertCountdown = Math.max(0, this.alertCountdown - 1);
        this.alertTimer = 0;
        if (this.alertCountdown === 0) {
          this.fallState = 'dispatched';
        }
      }
      left = {
        ax: 0.72, ay: -0.15, az: 0.65, gx: 0.1, gy: 0.1, gz: 0.1,
        p1: 180, p2: 120, p3: 0, p4: 0, p5: 120, p6: 0,
        pitch: -65, roll: 52, lift: 0,
        phase: `CATASTROPHIC FALL STAGE 3: Immobile Tilt • SOS Countdown (${this.alertCountdown}s)`
      };
      right = { ...left, roll: -52 };
    } else {
      left = {
        ax: 0.72, ay: -0.15, az: 0.65, gx: 0.1, gy: 0.1, gz: 0.1,
        p1: 180, p2: 120, p3: 0, p4: 0, p5: 120, p6: 0,
        pitch: -65, roll: 52, lift: 0,
        phase: 'CATASTROPHIC FALL STAGE 4: EMERGENCY ALERT BROADCAST TO CAREGIVER'
      };
      right = { ...left, roll: -52 };
    }

    return {
      left,
      right,
      bilateral: {
        symmetryIndex: 50.0,
        leftForce: left.p1 + left.p2,
        rightForce: right.p1 + right.p2,
        weightDistribution: { leftPct: 50.0, rightPct: 50.0 }
      }
    };
  }

  /**
   * Over-Pronation: Right Foot Medial Arch Collapse (-16° inward roll tilt)
   * Left foot remains neutral to demonstrate clinical asymmetry detection!
   */
  generatePronationSample() {
    const normal = this.generateWalkingSample();
    // Invert roll and boost medial ball pressure on Right Foot to simulate unilateral overpronation
    normal.right.roll = 16; // Medial eversion tilt on right foot
    normal.right.p2 = Math.min(4095, Math.round(normal.right.p2 * 1.6));
    normal.right.p5 = normal.right.p2;
    normal.right.phase += ' (Right Foot Overpronation Inward Collapse)';

    normal.bilateral.symmetryIndex = 84.2; // Pronounced asymmetry biomarker!
    return normal;
  }

  /**
   * Manual Slider Override
   */
  generateManualSample() {
    const s = this.manualSensors;
    const foot = {
      ax: Math.sin((s.pitch * Math.PI) / 180),
      ay: Math.sin((s.roll * Math.PI) / 180),
      az: s.svmAcc,
      gx: 0, gy: 0, gz: 0,
      p1: s.heel, p2: s.forefoot, p3: 0, p4: 0, p5: s.forefoot, p6: 0,
      pitch: s.pitch, roll: s.roll, lift: 0,
      phase: 'Manual Hardware Override'
    };
    return {
      left: { ...foot },
      right: { ...foot, roll: -foot.roll },
      bilateral: {
        symmetryIndex: 100.0,
        leftForce: foot.p1 + foot.p2,
        rightForce: foot.p1 + foot.p2,
        weightDistribution: { leftPct: 50.0, rightPct: 50.0 }
      }
    };
  }
}
