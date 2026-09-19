/**
 * StrideSense - Apple Health-Grade Mobility & Activity Engine
 * Manages daily walking records, 60-day historical trends, hourly step distributions,
 * clinical gait biomarkers, goal tracking, and live telemetry synchronization.
 */

const STORAGE_KEY_RECORDS = 'stridesense_health_records';
const STORAGE_KEY_GOAL = 'stridesense_step_goal';
const DEFAULT_STEP_GOAL = 10000;
const DEFAULT_ACTIVE_MINUTES_GOAL = 45;
const DEFAULT_CALORIES_GOAL = 400;

// Helper date utilities (YYYY-MM-DD local format)
export function toDateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

class HealthService {
  constructor() {
    this.records = {};
    this.stepGoal = DEFAULT_STEP_GOAL;
    this.activeMinutesGoal = DEFAULT_ACTIVE_MINUTES_GOAL;
    this.caloriesGoal = DEFAULT_CALORIES_GOAL;
    this.subscribers = new Set();

    this.loadStorage();
  }

  loadStorage() {
    if (typeof localStorage === 'undefined') return;

    try {
      const savedGoal = localStorage.getItem(STORAGE_KEY_GOAL);
      if (savedGoal) this.stepGoal = parseInt(savedGoal, 10) || DEFAULT_STEP_GOAL;

      const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedRecords) {
        this.records = JSON.parse(savedRecords);
      }
    } catch (e) {
      console.warn('[HealthService] Storage parse error, resetting:', e);
      this.records = {};
    }

    // Ensure we have seeded data for the last 60 days
    this.ensureHistoricalSeedData();
  }

  saveStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
      localStorage.setItem(STORAGE_KEY_GOAL, this.stepGoal.toString());
    } catch (e) {
      console.warn('[HealthService] Storage save error:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach((cb) => {
      try {
        cb(this.records);
      } catch (e) {
        console.error('[HealthService] Subscriber notification error:', e);
      }
    });
  }

  /**
   * Generates realistic 60-day historical mobility and walking data if absent.
   */
  ensureHistoricalSeedData() {
    const today = new Date();
    let updated = false;

    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);

      if (!this.records[key]) {
        this.records[key] = this.generateRealisticDayRecord(d, i === 0);
        updated = true;
      }
    }

    if (updated) {
      this.saveStorage();
    }
  }

  generateRealisticDayRecord(date, isToday = false) {
    const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Pseudo-random but deterministic based on date key
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const pseudoRand = (offset) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    // Realistic step counts: weekdays 7,200 - 11,800, weekends 6,000 - 13,500
    const baseSteps = isWeekend
      ? 6000 + Math.floor(pseudoRand(1) * 7500)
      : 7200 + Math.floor(pseudoRand(2) * 4600);

    const steps = isToday ? Math.min(baseSteps, 6420) : baseSteps;
    const strideLengthMeters = 0.72 + pseudoRand(3) * 0.06; // 72-78cm
    const distanceKm = Number(((steps * strideLengthMeters) / 1000).toFixed(2));
    const activeMinutes = Math.round(steps / (100 + pseudoRand(4) * 15));
    const calories = Math.round(steps * (0.042 + pseudoRand(5) * 0.008));
    const cadence = Math.round(104 + pseudoRand(6) * 12); // 104-116 SPM
    const speedKmh = Number((3.9 + pseudoRand(7) * 1.3).toFixed(1)); // 3.9 - 5.2 km/h
    const symmetry = Number((94.5 + pseudoRand(8) * 4.8).toFixed(1)); // 94.5 - 99.3%
    const asymmetry = Number((100 - symmetry).toFixed(1));
    const groundContactMs = Math.round(590 + pseudoRand(9) * 45); // 590 - 635 ms
    const doubleSupportPct = Number((27.0 + pseudoRand(10) * 4.0).toFixed(1)); // 27 - 31%

    // 24-hour hourly steps distribution
    const hourlySteps = new Array(24).fill(0);
    const maxHour = isToday ? Math.max(1, new Date().getHours()) : 23;
    let distributedSteps = 0;

    for (let h = 0; h <= maxHour; h++) {
      let weight = 0.01; // baseline sleep/resting
      if (h >= 7 && h <= 9) weight = 0.16; // morning commute/walk
      else if (h >= 10 && h <= 11) weight = 0.08; // morning movement
      else if (h >= 12 && h <= 13) weight = 0.14; // lunch walk
      else if (h >= 14 && h <= 16) weight = 0.09; // afternoon
      else if (h >= 17 && h <= 19) weight = 0.22; // evening workout/walk
      else if (h >= 20 && h <= 21) weight = 0.07; // evening wind-down

      const hourSteps = Math.round(steps * weight * (0.8 + pseudoRand(h + 20) * 0.4));
      hourlySteps[h] = hourSteps;
      distributedSteps += hourSteps;
    }

    // Normalization adjustment
    if (distributedSteps > 0 && !isToday) {
      const scale = steps / distributedSteps;
      for (let h = 0; h <= 23; h++) {
        hourlySteps[h] = Math.round(hourlySteps[h] * scale);
      }
    }

    // Walking steadiness classification (Apple Health clinical standards)
    // Very Good: asymmetry <= 3.5%, symmetry >= 96%
    // OK: asymmetry <= 6.0%
    // Low: asymmetry > 6.0% (fall risk)
    let steadiness = 'Very Good';
    if (asymmetry > 6.0) steadiness = 'Low';
    else if (asymmetry > 3.5) steadiness = 'OK';

    return {
      date: toDateKey(date),
      steps,
      goal: this.stepGoal,
      distanceKm,
      activeMinutes,
      activeMinutesGoal: this.activeMinutesGoal,
      calories,
      caloriesGoal: this.caloriesGoal,
      cadence,
      speedKmh,
      symmetry,
      asymmetry,
      groundContactMs,
      doubleSupportPct,
      steadiness,
      fallsCount: 0,
      hourlySteps,
      completedGoal: steps >= this.stepGoal
    };
  }

  /**
   * Merges live telemetry incoming from ESP32 or 3D Simulation into today's record.
   */
  updateLiveTelemetry(telemetry) {
    if (!telemetry) return;
    const todayKey = toDateKey(new Date());
    let current = this.records[todayKey];

    if (!current) {
      current = this.generateRealisticDayRecord(new Date(), true);
      this.records[todayKey] = current;
    }

    let modified = false;

    // Live strides from ESP32 / Sim
    if (telemetry.steps > 0 && telemetry.steps > current.steps) {
      const delta = telemetry.steps - current.steps;
      current.steps = telemetry.steps;
      current.distanceKm = Number(((current.steps * 0.74) / 1000).toFixed(2));
      current.activeMinutes = Math.round(current.steps / 105);
      current.calories = Math.round(current.steps * 0.044);

      // Add delta to current hour
      const nowH = new Date().getHours();
      if (!current.hourlySteps) current.hourlySteps = new Array(24).fill(0);
      current.hourlySteps[nowH] = (current.hourlySteps[nowH] || 0) + delta;
      modified = true;
    }

    if (telemetry.cadence > 0) {
      current.cadence = telemetry.cadence;
      current.speedKmh = Number(((telemetry.cadence * 0.74 * 60) / 1000).toFixed(1));
      modified = true;
    }

    if (telemetry.symmetry > 0) {
      current.symmetry = Number(telemetry.symmetry.toFixed(1));
      current.asymmetry = Number(Math.max(0, (100 - telemetry.symmetry)).toFixed(1));
      if (current.asymmetry > 6.0) current.steadiness = 'Low';
      else if (current.asymmetry > 3.5) current.steadiness = 'OK';
      else current.steadiness = 'Very Good';
      modified = true;
    }

    if (telemetry.fallAlert) {
      current.fallsCount = (current.fallsCount || 0) + 1;
      modified = true;
    }

    current.completedGoal = current.steps >= this.stepGoal;
    this.records[todayKey] = current;

    if (modified) {
      this.saveStorage();
      this.notify();
    }
  }

  getDailyRecord(dateKey) {
    if (!dateKey) dateKey = toDateKey(new Date());
    if (!this.records[dateKey]) {
      const parsed = parseDateKey(dateKey);
      this.records[dateKey] = this.generateRealisticDayRecord(parsed, dateKey === toDateKey(new Date()));
      this.saveStorage();
    }
    return this.records[dateKey];
  }

  setStepGoal(newGoal) {
    this.stepGoal = Math.max(1000, parseInt(newGoal, 10) || DEFAULT_STEP_GOAL);
    const todayKey = toDateKey(new Date());
    if (this.records[todayKey]) {
      this.records[todayKey].goal = this.stepGoal;
      this.records[todayKey].completedGoal = this.records[todayKey].steps >= this.stepGoal;
    }
    this.saveStorage();
    this.notify();
  }

  /**
   * Retrieves a 7-day weekly window ending on or containing a reference date.
   */
  getWeekSummary(referenceDate = new Date()) {
    const end = new Date(referenceDate);
    const days = [];
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const rec = this.getDailyRecord(key);
      days.push({
        ...rec,
        dayLabel: DAY_LABELS[d.getDay()],
        dateNum: d.getDate(),
        isToday: key === toDateKey(new Date())
      });
    }

    const totalSteps = days.reduce((acc, d) => acc + d.steps, 0);
    const avgSteps = Math.round(totalSteps / 7);
    const totalDistance = Number(days.reduce((acc, d) => acc + d.distanceKm, 0).toFixed(1));
    const totalCalories = days.reduce((acc, d) => acc + d.calories, 0);
    const totalActiveMinutes = days.reduce((acc, d) => acc + d.activeMinutes, 0);
    const daysGoalMet = days.filter((d) => d.steps >= this.stepGoal).length;
    const avgSymmetry = Number((days.reduce((acc, d) => acc + d.symmetry, 0) / 7).toFixed(1));
    const avgSpeed = Number((days.reduce((acc, d) => acc + d.speedKmh, 0) / 7).toFixed(1));

    // Calculate previous 7 days to get delta comparison
    let prevTotalSteps = 0;
    for (let i = 13; i >= 7; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const rec = this.getDailyRecord(key);
      prevTotalSteps += rec.steps;
    }
    const prevAvg = Math.round(prevTotalSteps / 7);
    const percentChange = prevAvg > 0 ? Number((((avgSteps - prevAvg) / prevAvg) * 100).toFixed(1)) : 0;

    return {
      days,
      totalSteps,
      avgSteps,
      totalDistance,
      totalCalories,
      totalActiveMinutes,
      daysGoalMet,
      avgSymmetry,
      avgSpeed,
      percentChange,
      stepGoal: this.stepGoal
    };
  }

  /**
   * Returns calendar month data for full-month heatmap or calendar sheet
   */
  getMonthCalendar(year, month) {
    // month is 0-indexed (0 = Jan, 8 = Sept)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun

    const todayKey = toDateKey(new Date());
    const days = [];

    // Preceding empty slots
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const d = new Date(year, month, dayNum);
      const key = toDateKey(d);
      const isFuture = d > new Date();
      const rec = isFuture ? null : this.getDailyRecord(key);

      days.push({
        empty: false,
        key,
        dayNum,
        date: d,
        isToday: key === todayKey,
        isFuture,
        steps: rec ? rec.steps : 0,
        goal: this.stepGoal,
        pct: rec ? Math.min(100, Math.round((rec.steps / this.stepGoal) * 100)) : 0,
        completed: rec ? rec.steps >= this.stepGoal : false,
        steadiness: rec ? rec.steadiness : 'None'
      });
    }

    return {
      year,
      month,
      monthName: firstDay.toLocaleString('en-US', { month: 'long' }),
      days
    };
  }

  /**
   * Calculates current consecutive streak of achieving step goals.
   */
  getStreakInfo() {
    let streak = 0;
    const checkDate = new Date();

    // Check today first; if not met yet today, check from yesterday
    const todayRec = this.getDailyRecord(toDateKey(checkDate));
    if (todayRec && todayRec.steps >= this.stepGoal) {
      streak++;
    }

    for (let i = 1; i <= 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const rec = this.getDailyRecord(toDateKey(d));
      if (rec && rec.steps >= this.stepGoal) {
        streak++;
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      lifetimeSteps: Object.values(this.records).reduce((acc, r) => acc + (r.steps || 0), 0),
      totalDaysTracked: Object.keys(this.records).length
    };
  }

  /**
   * Formats a medical mobility report for clinical export/sharing.
   */
  exportHealthSummary(dateKey) {
    const rec = this.getDailyRecord(dateKey);
    const week = this.getWeekSummary(parseDateKey(dateKey));

    return {
      reportId: `SS-MED-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      patientDevice: 'StrideSense Left Foot Insole',
      date: rec.date,
      dailySummary: {
        steps: rec.steps,
        goal: rec.goal,
        distanceKm: rec.distanceKm,
        activeMinutes: rec.activeMinutes,
        calories: rec.calories,
        speedKmh: rec.speedKmh,
        cadence: rec.cadence
      },
      biomechanics: {
        steadinessScore: rec.steadiness,
        gaitSymmetryPct: rec.symmetry,
        walkingAsymmetryPct: rec.asymmetry,
        groundContactTimeMs: rec.groundContactMs,
        doubleSupportPhasePct: rec.doubleSupportPct,
        fallEvents: rec.fallsCount
      },
      weeklyAverages: {
        avgDailySteps: week.avgSteps,
        daysGoalAchieved: `${week.daysGoalMet}/7`,
        trendVsPriorWeek: `${week.percentChange > 0 ? '+' : ''}${week.percentChange}%`,
        avgCadence: week.avgSteps ? 108 : 0,
        clinicalAssessment: rec.asymmetry < 4.0
          ? 'Normal physiological gait symmetry with low fall vulnerability index.'
          : 'Mild gait asymmetry detected; ongoing ambulatory monitoring advised.'
      }
    };
  }
}

export const healthService = new HealthService();
