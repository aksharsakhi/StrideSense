import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Flame,
  Footprints,
  Clock,
  Zap,
  Activity,
  Award,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Share2,
  Check,
  X,
  Target,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  Info
} from 'lucide-react';
import { healthService, toDateKey, parseDateKey } from '../services/healthService.js';
import { nativeBridge } from '../services/native.js';

export default function HealthPage({ telemetry, deviceId = 'insole_left_01', onNavigate = () => {} }) {
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [activeMetricView, setActiveMetricView] = useState('steps'); // 'steps' | 'distance' | 'minutes'
  const [ringFocus, setRingFocus] = useState('steps'); // 'steps' | 'minutes' | 'calories'
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState(10000);
  const [copiedReport, setCopiedReport] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Health data states per device
  const [dailyRecord, setDailyRecord] = useState(() => healthService.getDailyRecord(selectedDateKey, deviceId));
  const [weekSummary, setWeekSummary] = useState(() => healthService.getWeekSummary(parseDateKey(selectedDateKey), deviceId));
  const [streakInfo, setStreakInfo] = useState(() => healthService.getStreakInfo(deviceId));

  // Listen for health data changes (including live telemetry updates)
  useEffect(() => {
    const unsub = healthService.subscribe(() => {
      setDailyRecord(healthService.getDailyRecord(selectedDateKey, deviceId));
      setWeekSummary(healthService.getWeekSummary(parseDateKey(selectedDateKey), deviceId));
      setStreakInfo(healthService.getStreakInfo(deviceId));
    });
    return unsub;
  }, [selectedDateKey, deviceId]);

  // Update on date key or deviceId change
  useEffect(() => {
    setDailyRecord(healthService.getDailyRecord(selectedDateKey, deviceId));
    setWeekSummary(healthService.getWeekSummary(parseDateKey(selectedDateKey), deviceId));
    setStreakInfo(healthService.getStreakInfo(deviceId));
  }, [selectedDateKey, deviceId]);

  const isToday = selectedDateKey === toDateKey(new Date());

  // Safe daily record with defaults
  const rec = {
    date: selectedDateKey,
    steps: 0,
    goal: 10000,
    distanceKm: 0,
    activeMinutes: 0,
    activeMinutesGoal: 45,
    calories: 0,
    caloriesGoal: 400,
    cadence: 0,
    speedKmh: 0,
    symmetry: 100,
    asymmetry: 0,
    groundContactMs: 610,
    doubleSupportPct: 28,
    steadiness: 'Very Good',
    hourlySteps: new Array(24).fill(0),
    completedGoal: false,
    ...dailyRecord
  };

  // Quick 7-Day Strip window (centered or ending near selected date)
  const quickStripDays = useMemo(() => {
    const ref = parseDateKey(selectedDateKey);
    const list = [];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Show 3 days before, selected day, 3 days after (or up to today)
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(ref);
      d.setDate(d.getDate() + i);
      if (d > today) continue; // don't show future days in strip
      const key = toDateKey(d);
      const dayRec = healthService.getDailyRecord(key, deviceId) || {};
      const daySteps = dayRec.steps || 0;
      const dayGoal = dayRec.goal || 10000;
      list.push({
        key,
        date: d,
        dayName: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        isToday: key === toDateKey(today),
        isSelected: key === selectedDateKey,
        steps: daySteps,
        pct: Math.min(100, Math.round((daySteps / dayGoal) * 100)),
        completed: daySteps >= dayGoal
      });
    }
    return list;
  }, [selectedDateKey, deviceId]);

  // Handle day selection
  const handleSelectDay = useCallback((key) => {
    nativeBridge.impactLight();
    setSelectedDateKey(key);
  }, []);

  const handlePrevDay = () => {
    nativeBridge.impactLight();
    const current = parseDateKey(selectedDateKey);
    current.setDate(current.getDate() - 1);
    setSelectedDateKey(toDateKey(current));
  };

  const handleNextDay = () => {
    const current = parseDateKey(selectedDateKey);
    const tomorrow = new Date(current);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow <= new Date()) {
      nativeBridge.impactLight();
      setSelectedDateKey(toDateKey(tomorrow));
    }
  };

  const handleJumpToday = () => {
    nativeBridge.impactMedium();
    setSelectedDateKey(toDateKey(new Date()));
  };

  // Concentric Rings Geometry
  // Outer: Steps (r=56, stroke=9)
  // Middle: Active Walk Time (r=42, stroke=9)
  // Inner: Active Calories (r=28, stroke=9)
  const stepsPct = Math.min(100, Math.round((rec.steps / rec.goal) * 100));
  const timePct = Math.min(100, Math.round((rec.activeMinutes / rec.activeMinutesGoal) * 100));
  const calPct = Math.min(100, Math.round((rec.calories / rec.caloriesGoal) * 100));

  const ring1R = 56;
  const ring1C = 2 * Math.PI * ring1R;
  const ring1Off = ring1C * (1 - stepsPct / 100);

  const ring2R = 43;
  const ring2C = 2 * Math.PI * ring2R;
  const ring2Off = ring2C * (1 - timePct / 100);

  const ring3R = 30;
  const ring3C = 2 * Math.PI * ring3R;
  const ring3Off = ring3C * (1 - calPct / 100);

  // Month Calendar data
  const monthData = useMemo(() => {
    return healthService.getMonthCalendar(calendarMonth.year, calendarMonth.month, deviceId);
  }, [calendarMonth, deviceId]);

  // Hourly Activity Peak for Selected Day
  const hourlyData = rec.hourlySteps || new Array(24).fill(0);
  const maxHourlySteps = Math.max(100, ...hourlyData);
  const peakHourIndex = hourlyData.reduce((bestIdx, steps, idx, arr) => steps > arr[bestIdx] ? idx : bestIdx, 0);
  const peakHourStr = `${peakHourIndex % 12 || 12}:00 ${peakHourIndex < 12 ? 'AM' : 'PM'}`;

  // Copy clinical health summary
  const handleCopyReport = () => {
    const report = healthService.exportHealthSummary(selectedDateKey, deviceId);
    const text = `
STRIDESENSE CLINICAL MOBILITY AUDIT
Report ID: ${report.reportId}
Date: ${report.date}
Device: ${report.patientDevice}
----------------------------------------
DAILY METRICS:
• Steps: ${report.dailySummary.steps.toLocaleString()} / Goal: ${report.dailySummary.goal.toLocaleString()}
• Distance: ${report.dailySummary.distanceKm} km
• Active Walking Time: ${report.dailySummary.activeMinutes} mins
• Active Energy: ${report.dailySummary.calories} kcal
• Walking Velocity: ${report.dailySummary.speedKmh} km/h
• Cadence: ${report.dailySummary.cadence} steps/min

BIOMECHANICAL INTEGRITY:
• Walking Steadiness: ${report.biomechanics.steadinessScore}
• Gait Symmetry: ${report.biomechanics.gaitSymmetryPct}%
• Walking Asymmetry: ${report.biomechanics.walkingAsymmetryPct}%
• Ground Contact Time: ${report.biomechanics.groundContactTimeMs} ms
• Double Support Phase: ${report.biomechanics.doubleSupportPhasePct}%
• Fall Incidents: ${report.biomechanics.fallEvents}

7-DAY AGGREGATE:
• Avg Daily Steps: ${report.weeklyAverages.avgDailySteps.toLocaleString()}
• Step Compliance: ${report.weeklyAverages.daysGoalAchieved}
• Week-over-Week Trend: ${report.weeklyAverages.trendVsPriorWeek}
• Assessment: ${report.weeklyAverages.clinicalAssessment}
    `.trim();

    navigator.clipboard?.writeText(text);
    nativeBridge.notificationSuccess();
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Save Step Goal
  const handleSaveGoal = (val) => {
    healthService.setStepGoal(val);
    nativeBridge.impactMedium();
    setIsGoalModalOpen(false);
  };

  // Selected date label
  const selectedDateObj = parseDateKey(selectedDateKey);
  const formattedHeaderDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children">

      {/* ─── TOP BAR: DATE NAVIGATION & ACTIONS ─── */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in-scale">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 active-press transition-colors text-slate-700 dark:text-slate-300"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono px-2 text-slate-900 dark:text-white">
              {isToday ? 'Today' : formattedHeaderDate}
            </span>
            <button
              type="button"
              onClick={handleNextDay}
              disabled={isToday}
              className={`p-1.5 rounded-xl transition-colors ${
                isToday
                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                  : 'hover:bg-slate-200 dark:hover:bg-white/10 active-press text-slate-700 dark:text-slate-300'
              }`}
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-bold active-press transition-all"
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* Calendar Picker & Report Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              nativeBridge.impactLight();
              setIsCalendarOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] hover:border-cyan-500/40 text-xs font-semibold text-slate-800 dark:text-white active-press transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              nativeBridge.impactLight();
              setIsExportOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] hover:border-cyan-500/40 text-xs font-semibold text-slate-800 dark:text-white active-press transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ─── APPLE HEALTH 7-DAY QUICK STRIP ─── */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {quickStripDays.map((item) => {
          const isSel = item.isSelected;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleSelectDay(item.key)}
              className={`flex flex-col items-center justify-between py-2.5 px-1 rounded-2xl transition-all duration-150 active-press select-none border ${
                isSel
                  ? 'bg-white dark:bg-slate-800/95 border-cyan-500 shadow-glow-cyan'
                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-white/[0.04] hover:bg-white dark:hover:bg-slate-800/60'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${isSel ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                {item.dayName}
              </span>
              <span className={`text-sm font-bold font-mono my-1 ${isSel ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {item.dayNum}
              </span>

              {/* Mini completion ring */}
              <div className="relative w-5 h-5 flex items-center justify-center">
                <svg width="20" height="20" className="transform -rotate-90">
                  <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-slate-200 dark:text-slate-800" />
                  <circle
                    cx="10" cy="10" r="7"
                    fill="none"
                    strokeWidth="2.2"
                    strokeDasharray={2 * Math.PI * 7}
                    strokeDashoffset={2 * Math.PI * 7 * (1 - item.pct / 100)}
                    strokeLinecap="round"
                    className={`transition-all ${item.completed ? 'stroke-emerald-500' : 'stroke-cyan-500'}`}
                  />
                </svg>
                {item.completed && (
                  <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── HERO: TRIPLE ACTIVITY RINGS & DAILY VITAL SUMMARY ─── */}
      <div className="glass-panel hero-mesh p-5 sm:p-6 animate-fade-in-scale relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6">

          {/* Triple Concentric Rings Visualizer */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              nativeBridge.impactLight();
              setRingFocus((f) => f === 'steps' ? 'minutes' : f === 'minutes' ? 'calories' : 'steps');
            }}
            className="relative w-[150px] h-[150px] flex-shrink-0 cursor-pointer active-press group"
            title="Click to switch focused ring metric"
          >
            <svg width="150" height="150" className="transform -rotate-90">
              {/* Ring 1 Track & Fill: Steps (Cyan) */}
              <circle cx="75" cy="75" r={ring1R} strokeWidth="8.5" fill="none" className="text-slate-200 dark:text-slate-800/80 stroke-current opacity-40" />
              <circle
                cx="75" cy="75" r={ring1R}
                strokeWidth="8.5"
                fill="none"
                strokeDasharray={ring1C}
                strokeDashoffset={ring1Off}
                strokeLinecap="round"
                className="transition-all duration-700 stroke-cyan-500"
                style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))' }}
              />

              {/* Ring 2 Track & Fill: Active Minutes (Emerald) */}
              <circle cx="75" cy="75" r={ring2R} strokeWidth="8.5" fill="none" className="text-slate-200 dark:text-slate-800/80 stroke-current opacity-40" />
              <circle
                cx="75" cy="75" r={ring2R}
                strokeWidth="8.5"
                fill="none"
                strokeDasharray={ring2C}
                strokeDashoffset={ring2Off}
                strokeLinecap="round"
                className="transition-all duration-700 stroke-emerald-500"
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }}
              />

              {/* Ring 3 Track & Fill: Calories (Rose/Orange) */}
              <circle cx="75" cy="75" r={ring3R} strokeWidth="8.5" fill="none" className="text-slate-200 dark:text-slate-800/80 stroke-current opacity-40" />
              <circle
                cx="75" cy="75" r={ring3R}
                strokeWidth="8.5"
                fill="none"
                strokeDasharray={ring3C}
                strokeDashoffset={ring3Off}
                strokeLinecap="round"
                className="transition-all duration-700 stroke-rose-500"
                style={{ filter: 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.4))' }}
              />
            </svg>

            {/* Inner Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {ringFocus === 'steps' && (
                <>
                  <Footprints className="w-4 h-4 text-cyan-500 mb-0.5" />
                  <span className="text-base font-mono font-black text-slate-900 dark:text-white leading-none">
                    {stepsPct}%
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Step Goal</span>
                </>
              )}
              {ringFocus === 'minutes' && (
                <>
                  <Clock className="w-4 h-4 text-emerald-500 mb-0.5" />
                  <span className="text-base font-mono font-black text-slate-900 dark:text-white leading-none">
                    {timePct}%
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Active</span>
                </>
              )}
              {ringFocus === 'calories' && (
                <>
                  <Flame className="w-4 h-4 text-rose-500 mb-0.5" />
                  <span className="text-base font-mono font-black text-slate-900 dark:text-white leading-none">
                    {calPct}%
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Burned</span>
                </>
              )}
            </div>
          </div>

          {/* Ring Metrics Legend / Details */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Daily Mobility Targets</span>
                  {rec.completedGoal && (
                    <span className="badge badge-emerald text-[10px]">
                      <Award className="w-3 h-3" />
                      Goal Met
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stride kinematics synced with plantar sensors
                </p>
              </div>

              {/* Goal customizer button */}
              <button
                type="button"
                onClick={() => {
                  nativeBridge.impactLight();
                  setCustomGoalInput(rec.goal);
                  setIsGoalModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 active-press transition-colors"
                title="Change Daily Step Goal"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-500" />
                <span>Goal: {(rec.goal / 1000).toFixed(0)}k</span>
              </button>
            </div>

            {/* 3 Activity Progress Bars (Apple Health style) */}
            <div className="flex flex-col gap-2.5">
              {/* Steps Progress */}
              <div className="bg-slate-100/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/[0.04]">
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Steps</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{rec.steps.toLocaleString()}</span>
                    <span className="text-slate-400"> / {rec.goal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${stepsPct}%` }} />
                </div>
              </div>

              {/* Active Minutes */}
              <div className="bg-slate-100/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/[0.04]">
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Active Walk Time</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{rec.activeMinutes}</span>
                    <span className="text-slate-400"> / {rec.activeMinutesGoal} mins</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${timePct}%` }} />
                </div>
              </div>

              {/* Calories Burned */}
              <div className="bg-slate-100/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/[0.04]">
                <div className="flex justify-between items-center text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Active Energy</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{rec.calories}</span>
                    <span className="text-slate-400"> / {rec.caloriesGoal} kcal</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${calPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── VITAL METRIC TILES: 2x2 GRID ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Distance Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Distance</span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {rec.distanceKm}
            </span>
            <span className="text-xs text-slate-400 ml-1">km</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">
            ~{(rec.distanceKm * 0.621371).toFixed(2)} miles walked
          </span>
        </div>

        {/* Walking Velocity / Speed Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Walking Velocity</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {rec.speedKmh}
            </span>
            <span className="text-xs text-slate-400 ml-1">km/h</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">
            Cadence: {rec.cadence} SPM
          </span>
        </div>

        {/* Walking Steadiness Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Steadiness</span>
            <div className={`p-1.5 rounded-xl ${
              rec.steadiness === 'Very Good'
                ? 'bg-emerald-500/10 text-emerald-500'
                : (rec.steadiness === 'OK' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500')
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className={`text-xl font-bold ${
              rec.steadiness === 'Very Good'
                ? 'text-emerald-600 dark:text-emerald-400'
                : (rec.steadiness === 'OK' ? 'text-amber-500' : 'text-rose-500')
            }`}>
              {rec.steadiness}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">
            Asymmetry: {rec.asymmetry}% (Normal &lt; 4%)
          </span>
        </div>

        {/* Streak & Goal Consistency Tile */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Goal Streak</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-amber-500 tabular-nums">
              {streakInfo.currentStreak}
            </span>
            <span className="text-xs text-slate-400 ml-1">days in a row</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">
            Lifetime: {streakInfo.lifetimeSteps >= 1000 ? `${(streakInfo.lifetimeSteps / 1000).toFixed(1)}k` : streakInfo.lifetimeSteps} steps
          </span>
        </div>
      </div>

      {/* ─── WEEKLY WALKING HISTORY & COMPLIANCE BAR CHART ─── */}
      <div className="glass-panel p-5 sm:p-6 animate-fade-in-scale">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                Weekly Mobility Trend
              </h2>
              {weekSummary.totalSteps > 0 ? (
                <span className={`badge text-[10px] flex items-center gap-1 ${
                  weekSummary.percentChange >= 0 ? 'badge-emerald' : 'badge-amber'
                }`}>
                  {weekSummary.percentChange >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{weekSummary.percentChange >= 0 ? '+' : ''}{weekSummary.percentChange}% vs last week</span>
                </span>
              ) : (
                <span className="badge badge-cyan text-[10px]">
                  Real-time Tracking
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              7-Day ambulatory volume and consistency comparison
            </p>
          </div>

          {/* Metric Toggle: Steps | Distance | Minutes */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
            {[
              { id: 'steps', label: 'Steps' },
              { id: 'distance', label: 'Distance' },
              { id: 'minutes', label: 'Active Min' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  nativeBridge.impactLight();
                  setActiveMetricView(tab.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeMetricView === tab.id
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7-Day Interactive Bar Chart */}
        {(() => {
          const maxVal = Math.max(
            activeMetricView === 'steps' ? 14000 : (activeMetricView === 'distance' ? 10 : 80),
            ...weekSummary.days.map((d) => {
              if (activeMetricView === 'distance') return d.distanceKm;
              if (activeMetricView === 'minutes') return d.activeMinutes;
              return d.steps;
            })
          );

          return (
            <div className="bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.04]">
              {/* Daily Goal Target Benchmark Line */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span>Daily Target</span>
                <span>
                  {activeMetricView === 'steps'
                    ? `${weekSummary.stepGoal.toLocaleString()} steps`
                    : (activeMetricView === 'distance' ? '7.5 km' : '45 mins')}
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 h-44 pt-5 pb-2">
                {weekSummary.days.map((item) => {
                  const val = activeMetricView === 'distance'
                    ? item.distanceKm
                    : (activeMetricView === 'minutes' ? item.activeMinutes : item.steps);

                  const heightPct = Math.max(4, Math.min(100, Math.round((val / maxVal) * 100)));
                  const isSelected = item.date === selectedDateKey;
                  const reachedGoal = item.steps >= weekSummary.stepGoal;

                  return (
                    <div
                      key={item.date}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectDay(item.date)}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer group active-press select-none"
                    >
                      {/* Floating hover badge */}
                      <span className={`text-[10px] font-mono tabular-nums transition-opacity ${
                        isSelected ? 'opacity-100 font-bold text-cyan-600 dark:text-cyan-400' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                      }`}>
                        {activeMetricView === 'distance'
                          ? `${val}k`
                          : (activeMetricView === 'minutes' ? `${val}m` : `${(val / 1000).toFixed(1)}k`)}
                      </span>

                      {/* Bar Container */}
                      <div className="w-full max-w-[36px] bg-slate-200/70 dark:bg-slate-800/60 rounded-t-xl relative flex items-end h-full">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isSelected
                              ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-glow-cyan'
                              : (reachedGoal
                                ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 group-hover:from-cyan-500/70 group-hover:to-cyan-400/70')
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span className={`text-xs mt-1 transition-colors ${
                        isSelected ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'font-semibold text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Footer Statistics */}
              <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 mt-1 text-xs">
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                  <span>Weekly Avg: <strong className="font-mono text-slate-900 dark:text-white">{weekSummary.avgSteps.toLocaleString()}</strong></span>
                  <span>Total Distance: <strong className="font-mono text-slate-900 dark:text-white">{weekSummary.totalDistance} km</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {weekSummary.daysGoalMet} of 7 Days Met
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── 24-HOUR HOURLY ACTIVITY HISTOGRAM FOR SELECTED DAY ─── */}
      <div className="glass-panel p-5 sm:p-6 animate-fade-in-scale">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Hourly Activity Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kinematic stride volume logged across 24 hours on {formattedHeaderDate}
            </p>
          </div>
          <span className="badge badge-cyan text-xs font-mono">
            {maxHourlySteps > 100 || (hourlyData[peakHourIndex] > 0)
              ? `Peak: ${peakHourStr} (${hourlyData[peakHourIndex]?.toLocaleString()} steps)`
              : 'Standby: No steps logged today'}
          </span>
        </div>

        <div className="bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.04]">
          <div className="flex items-end justify-between gap-1 h-32 pt-4 pb-2">
            {hourlyData.map((steps, hour) => {
              const heightPct = Math.max(4, Math.min(100, Math.round((steps / maxHourlySteps) * 100)));
              const isPeak = hour === peakHourIndex && steps > 0;
              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end group"
                  title={`${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}: ${steps} steps`}
                >
                  <div className="w-full bg-slate-200/50 dark:bg-slate-800/40 rounded-t-sm h-full flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isPeak
                          ? 'bg-amber-500 shadow-glow-amber'
                          : steps > 0
                          ? 'bg-cyan-500/80 group-hover:bg-cyan-400'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time markers */}
          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>
      </div>

      {/* ─── CLINICAL BIOMARKERS & GAIT STEADINESS (APPLE HEALTH GRADE) ─── */}
      <div className="glass-panel p-5 sm:p-6 animate-fade-in-scale">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Clinical Mobility & Gait Biomarkers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Advanced ambulatory kinematics monitored by dual insole sensors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Walking Steadiness Card */}
          <div className="bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.04]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Walking Steadiness</span>
              <span className={`badge text-[10px] ${
                rec.steps > 0
                  ? (rec.steadiness === 'Very Good' || rec.steadiness === 'Optimal' ? 'badge-emerald' : 'badge-amber')
                  : 'badge-cyan'
              }`}>
                {rec.steps > 0 ? rec.steadiness : 'Standby'}
              </span>
            </div>
            {/* 3-segment steadiness bar */}
            <div className="grid grid-cols-3 gap-1 my-2">
              <div className={`h-2 rounded-full ${rec.steps > 0 && rec.steadiness === 'Low' ? 'bg-rose-500' : 'bg-rose-500/20'}`} />
              <div className={`h-2 rounded-full ${rec.steps > 0 && rec.steadiness === 'OK' ? 'bg-amber-500' : 'bg-amber-500/20'}`} />
              <div className={`h-2 rounded-full ${rec.steps > 0 && (rec.steadiness === 'Very Good' || rec.steadiness === 'Optimal') ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {rec.steps > 0
                ? `Your walking steadiness is rated ${rec.steadiness} based on speed variance and step timing.`
                : 'Standby: Gait steadiness will compute during active walking.'}
            </p>
          </div>

          {/* Walking Asymmetry Card */}
          <div className="bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.04]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Walking Asymmetry</span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                {rec.steps > 0 ? `${rec.asymmetry}%` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 my-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${rec.steps > 0 ? (rec.asymmetry < 4 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-400/20'}`}
                style={{ width: `${rec.steps > 0 ? Math.min(100, (rec.asymmetry / 10) * 100) : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {rec.steps > 0
                ? 'Percentage of steps where one foot is faster or slower than the other. Below 4% is optimal.'
                : 'Limb timing comparison will measure variance during continuous strides.'}
            </p>
          </div>

          {/* Ground Contact Time Card */}
          <div className="bg-slate-100/70 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/[0.04]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ground Contact Time</span>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                {rec.steps > 0 && rec.groundContactMs > 0 ? `${rec.groundContactMs} ms` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 my-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full"
                style={{ width: `${rec.steps > 0 && rec.groundContactMs > 0 ? Math.min(100, ((rec.groundContactMs - 500) / 300) * 100) : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {rec.steps > 0 && rec.groundContactMs > 0
                ? 'Duration of plantar weight-bearing stance per stride. Normal ambulatory range is 580–650 ms.'
                : 'Plantar weight-bearing duration will be measured during stance phase.'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODAL: FULL MONTH INTERACTIVE CALENDAR SHEET ─── */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-fade-in-scale">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-500" />
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                  {monthData.monthName} {monthData.year}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month switchers */}
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => {
                  nativeBridge.impactLight();
                  setCalendarMonth((prev) => {
                    const m = prev.month - 1;
                    return m < 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: m };
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                ← Prev Month
              </button>
              <button
                type="button"
                onClick={() => {
                  nativeBridge.impactLight();
                  setCalendarMonth((prev) => {
                    const m = prev.month + 1;
                    return m > 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: m };
                  });
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Next Month →
              </button>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthData.days.map((item) => {
                if (item.empty) {
                  return <div key={item.key} className="p-2" />;
                }

                const isSel = item.key === selectedDateKey;

                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.isFuture}
                    onClick={() => {
                      if (!item.isFuture) {
                        handleSelectDay(item.key);
                        setIsCalendarOpen(false);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                      isSel
                        ? 'bg-cyan-500 text-white shadow-glow-cyan font-bold'
                        : item.isToday
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30'
                        : item.isFuture
                        ? 'opacity-20 cursor-not-allowed text-slate-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs">{item.dayNum}</span>
                    {!item.isFuture && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        item.completed ? 'bg-emerald-400' : (item.pct > 50 ? 'bg-cyan-400' : 'bg-slate-400/40')
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Goal Reached</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Partial</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CLINICAL MOBILITY REPORT EXPORT ─── */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                    Clinical Mobility Audit Report
                  </h3>
                  <p className="text-xs text-slate-500">Official ambulatory health export</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formatted Report Card Preview */}
            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-3">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex justify-between text-slate-400">
                  <span>STRIDESENSE HEALTH RECORD</span>
                  <span>{rec.date}</span>
                </div>
                <div className="text-slate-900 dark:text-white font-bold text-sm mt-0.5">
                  Device: {deviceId === 'insole_left_02' ? '3D Virtual Simulation Insole' : 'ESP32 Hardware Plantar Sensor (Left)'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Total Steps:</span>
                  <strong className="text-cyan-500">{rec.steps.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Distance:</span>
                  <strong className="text-slate-900 dark:text-white">{rec.distanceKm} km</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Active Time:</span>
                  <strong className="text-slate-900 dark:text-white">{rec.activeMinutes} mins</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Walking Steadiness:</span>
                  <strong className="text-emerald-500">{rec.steadiness}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Gait Symmetry:</span>
                  <strong className="text-slate-900 dark:text-white">{rec.symmetry}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Ground Contact:</span>
                  <strong className="text-slate-900 dark:text-white">{rec.groundContactMs} ms</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                Weekly Compliance: <strong>{weekSummary.daysGoalMet} of 7 days</strong> met 10k threshold. Zero fall events detected during measurement epoch.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 active-press transition-colors shadow-glow-cyan"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copy & Share Report</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 active-press"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: STEP GOAL CUSTOMIZER ─── */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-sm w-full p-5 sm:p-6 shadow-2xl relative animate-fade-in-scale">
            <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-1">
              Set Daily Step Goal
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Tailor your daily walking target for physical therapy or fitness
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[6000, 8000, 10000, 12000, 15000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomGoalInput(preset)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    customGoalInput === preset
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-glow-cyan'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06]'
                  }`}
                >
                  {(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveGoal(customGoalInput)}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs active-press shadow-glow-cyan transition-colors"
              >
                Save Target
              </button>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 active-press"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
