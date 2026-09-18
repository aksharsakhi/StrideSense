/**
 * StrideSense Kinematic & Biomechanical Physics Engine
 * Generates 50 Hz realistic time-series sensor samples and 3D foot poses.
 */

export class PhysicsEngine {
  constructor() {
    this.scenario = 'walking'; // 'standing' | 'walking' | 'running' | 'pronation' | 'fall' | 'sitting'
    this.time = 0; // seconds
    this.sampleRate = 50; // 50 Hz (20ms per tick)
    this.windowBuffer = [];
    this.windowSize = 25; // 0.5s window buffer (50Hz * 0.5s = 25 samples)

    // Fall state machine
    this.fallState = 'idle'; // 'idle' | 'freefall' | 'impact' | 'settled' | 'alert_pending' | 'dispatched'
    this.fallTimer = 0;
    this.alertCountdown = 15; // 15 seconds grace period
    this.alertTimer = 0;

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

  setScenario(scenario) {
    this.scenario = scenario;
    if (scenario === 'fall') {
      this.triggerFall();
    } else {
      this.fallState = 'idle';
      this.fallTimer = 0;
      this.alertCountdown = 15;
    }
  }

  triggerFall() {
    this.scenario = 'fall';
    this.fallState = 'freefall';
    this.fallTimer = 0;
    this.alertCountdown = 15;
  }

  cancelFall() {
    this.fallState = 'idle';
    this.scenario = 'standing';
    this.fallTimer = 0;
    this.alertCountdown = 15;
  }

  step() {
    const dt = 1 / this.sampleRate;
    this.time += dt;

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

    // Add noise for realistic sensor physics
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

  generateStandingSample() {
    // Both feet planted, static 1.0g downwards
    const noise = () => Math.floor((Math.random() - 0.5) * 40);
    return {
      ax: 0.02,
      ay: 0.01,
      az: 0.99,
      gx: 0.1,
      gy: 0.2,
      gz: 0.1,
      p1: Math.max(0, 950 + noise()), // Heel
      p2: Math.max(0, 420 + noise()), // Lateral mid
      p3: Math.max(0, 380 + noise()), // Medial mid
      p4: Math.max(0, 620 + noise()), // Metatarsal 5
      p5: Math.max(0, 680 + noise()), // Metatarsal 1
      p6: Math.max(0, 510 + noise()), // Hallux / Big toe
      pitch: 0,
      roll: 0,
      lift: 0,
      phase: 'Stance'
    };
  }

  generateSittingSample() {
    // Foot gently resting on floor or dangling, minimal pressure
    const noise = () => Math.floor((Math.random() - 0.5) * 15);
    return {
      ax: 0.05,
      ay: -0.15,
      az: 0.98,
      gx: 0.05,
      gy: 0.05,
      gz: 0.05,
      p1: Math.max(0, 80 + noise()),
      p2: Math.max(0, 30 + noise()),
      p3: Math.max(0, 20 + noise()),
      p4: Math.max(0, 50 + noise()),
      p5: Math.max(0, 60 + noise()),
      p6: Math.max(0, 40 + noise()),
      pitch: -5,
      roll: 2,
      lift: 0,
      phase: 'Sitting'
    };
  }

  generateWalkingSample() {
    // Walking cadence ~ 108 steps/min (stride cycle ~ 1.1s)
    const cycleDuration = 1.1;
    const phaseT = (this.time % cycleDuration) / cycleDuration;

    let p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
    let pitch = 0, roll = 0, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Swing Phase';

    if (phaseT < 0.20) {
      // Heel Strike
      phaseName = 'Heel Strike';
      const k = phaseT / 0.20;
      p1 = Math.round(980 * Math.sin(k * Math.PI));
      p2 = Math.round(180 * Math.sin(k * Math.PI));
      p3 = Math.round(150 * Math.sin(k * Math.PI));
      pitch = -16 * (1 - k);
      roll = 2;
      ax = 0.02 + 0.3 * Math.sin(k * Math.PI);
      ay = -0.55 * Math.sin(k * Math.PI);
      az = 1.45;
      gx = 18 * Math.sin(k * Math.PI);
      gy = -120 * (1 - k);
      gz = 25 * Math.sin(k * Math.PI);
    } else if (phaseT < 0.50) {
      // Midstance
      phaseName = 'Midstance';
      const k = (phaseT - 0.20) / 0.30;
      p1 = Math.round(480 * (1 - k));
      p2 = Math.round(350 * Math.sin(k * Math.PI));
      p3 = Math.round(380 * Math.sin(k * Math.PI));
      p4 = Math.round(650 * Math.sin(k * Math.PI));
      p5 = Math.round(850 * Math.sin(k * Math.PI));
      p6 = Math.round(500 * Math.sin(k * Math.PI));
      pitch = 2;
      roll = 1;
      ax = 0.0;
      ay = 0.15;
      az = 1.02;
      gx = 8; gy = 25; gz = 12;
    } else if (phaseT < 0.65) {
      // Forefoot Push-off
      phaseName = 'Push-off';
      const k = (phaseT - 0.50) / 0.15;
      p1 = 0; p2 = 0; p3 = 0;
      p4 = Math.round(1200 * Math.sin(k * Math.PI));
      p5 = Math.round(1850 * Math.sin(k * Math.PI));
      p6 = Math.round(1400 * Math.sin(k * Math.PI));
      pitch = 22 * k;
      roll = -2;
      ax = -0.35 * k;
      ay = 0.75 * Math.sin(k * Math.PI);
      az = 1.55;
      gx = -25 * k;
      gy = 185 * Math.sin(k * Math.PI);
      gz = 40 * Math.sin(k * Math.PI);
    } else {
      // Swing Phase
      phaseName = 'Swing Phase';
      const k = (phaseT - 0.65) / 0.35;
      p1 = 0; p2 = 0; p3 = 0; p4 = 0; p5 = 0; p6 = 0;
      lift = Math.sin(k * Math.PI) * 0.12;
      pitch = Math.sin(k * Math.PI) * -14;
      roll = 0;
      ax = Math.sin(k * Math.PI * 2) * 0.35;
      ay = Math.cos(k * Math.PI) * 0.75;
      az = 0.95 + Math.sin(k * Math.PI) * 0.45;
      gx = Math.sin(k * Math.PI * 2) * 35;
      gy = Math.sin(k * Math.PI * 2) * 185;
      gz = Math.sin(k * Math.PI) * 42;
    }

    return { ax, ay, az, gx, gy, gz, p1, p2, p3, p4, p5, p6, pitch, roll, lift, phase: phaseName };
  }

  generateRunningSample() {
    // Running cadence ~ 165 steps/min (stride cycle ~ 0.72s)
    const cycleDuration = 0.72;
    const phaseT = (this.time % cycleDuration) / cycleDuration;

    let p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
    let pitch = 0, roll = 0, lift = 0;
    let ax = 0, ay = 0, az = 1.0;
    let gx = 0, gy = 0, gz = 0;
    let phaseName = 'Swing';

    if (phaseT < 0.38) {
      phaseName = 'High-Impact Stance';
      const k = phaseT / 0.38;
      p1 = Math.round(350 * Math.sin(k * Math.PI * 0.5));
      p2 = Math.round(800 * Math.sin(k * Math.PI));
      p3 = Math.round(900 * Math.sin(k * Math.PI));
      p4 = Math.round(2100 * Math.sin(k * Math.PI));
      p5 = Math.round(2800 * Math.sin(k * Math.PI));
      p6 = Math.round(2400 * Math.sin(k * Math.PI));
      pitch = 18 * (k - 0.4);
      roll = -3;
      ax = Math.sin(k * Math.PI) * 1.4;
      ay = -1.8 * Math.cos(k * Math.PI);
      az = 3.2 * Math.sin(k * Math.PI);
      gx = 85 * Math.sin(k * Math.PI);
      gy = 310 * Math.sin(k * Math.PI);
      gz = 110 * Math.sin(k * Math.PI);
    } else {
      phaseName = 'Aerial Flight';
      const k = (phaseT - 0.38) / 0.62;
      lift = Math.sin(k * Math.PI) * 0.28;
      pitch = -24 * Math.sin(k * Math.PI);
      roll = -4;
      ax = Math.sin(k * Math.PI * 2) * 1.4;
      ay = Math.cos(k * Math.PI) * 2.0;
      az = 0.25 + Math.sin(k * Math.PI) * 0.4;
      gx = Math.sin(k * Math.PI * 2) * 95;
      gy = Math.sin(k * Math.PI * 2) * 290;
      gz = Math.sin(k * Math.PI * 2) * 95;
    }

    return { ax, ay, az, gx, gy, gz, p1, p2, p3, p4, p5, p6, pitch, roll, lift, phase: phaseName };
  }

  generatePronationSample() {
    // Normal stride cadence but medial arch collapses inward (Overpronation: roll inward -15°)
    const normal = this.generateWalkingSample();
    // Heavy bias on Medial Arch (P3) and First Metatarsal (P5)
    const p3_boost = Math.round(normal.p3 * 2.2 + 650);
    const p5_boost = Math.round(normal.p5 * 1.8 + 750);
    const p2_reduction = Math.round(normal.p2 * 0.35); // lateral unloaded

    return {
      ...normal,
      p2: p2_reduction,
      p3: Math.min(3800, p3_boost),
      p5: Math.min(4000, p5_boost),
      roll: -16, // Severe inward eversion
      phase: normal.phase + ' (Over-Pronation)'
    };
  }

  generateFallSample(dt) {
    this.fallTimer += dt;

    if (this.fallState === 'freefall') {
      // Phase 1: Sudden slip / trip & drop (< 0.5g)
      const ax = 0.1;
      const ay = 0.8 * Math.sin(this.fallTimer * 10);
      const az = 0.25; // Microgravity drop!
      const pitch = -35 * (this.fallTimer / 0.35);
      const roll = 15 * (this.fallTimer / 0.35);

      if (this.fallTimer > 0.35) {
        this.fallState = 'impact';
        this.fallTimer = 0;
      }
      return {
        ax, ay, az,
        gx: 120, gy: -220, gz: 80,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        pitch, roll, lift: 0.1,
        phase: 'STAGE 1: Freefall Loss of Balance (<0.5g)'
      };
    } else if (this.fallState === 'impact') {
      // Phase 2: Violent Ground Collision (> 3.5g impact shock & severe force spike)
      const ax = 3.8;
      const ay = 4.5;
      const az = 5.6; // High collision G (SVM > 7.0g)
      const pitch = -62;
      const roll = 48;

      if (this.fallTimer > 0.3) {
        this.fallState = 'alert_pending';
        this.fallTimer = 0;
        this.alertCountdown = 15;
      }
      return {
        ax, ay, az,
        gx: 380, gy: 490, gz: 320,
        p1: 4095, p2: 3800, p3: 2500, p4: 3900, p5: 4095, p6: 3500, // Total force > 20,000
        pitch, roll, lift: 0,
        phase: 'STAGE 2: Violent Floor Impact (>7.0g Shock)'
      };
    } else if (this.fallState === 'alert_pending') {
      // Phase 3: Subject is motionless on ground, tilted severely (> 45° roll/pitch)
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
        gx: 0.2, gy: 0.1, gz: 0.1, // Motionless silence
        p1: 150, p2: 80, p3: 40, p4: 110, p5: 60, p6: 30,
        pitch: -65,
        roll: 52,
        lift: 0,
        phase: `STAGE 3: Immobile Tilt - SOS Countdown (${this.alertCountdown}s)`
      };
    } else {
      // Dispatched emergency
      return {
        ax: 0.72,
        ay: -0.15,
        az: 0.65,
        gx: 0.1, gy: 0.1, gz: 0.1,
        p1: 150, p2: 80, p3: 40, p4: 110, p5: 60, p6: 30,
        pitch: -65,
        roll: 52,
        lift: 0,
        phase: 'STAGE 4: EMERGENCY DISPATCHED TO CAREGIVER'
      };
    }
  }

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
      p2: Math.round(s.forefoot * 0.4),
      p3: Math.round(s.forefoot * 0.45),
      p4: Math.round(s.forefoot * 0.7),
      p5: Math.round(s.forefoot * 0.85),
      p6: Math.round(s.forefoot * 0.6),
      pitch: s.pitch,
      roll: s.roll,
      lift: 0,
      phase: 'Manual Testing'
    };
  }
}
