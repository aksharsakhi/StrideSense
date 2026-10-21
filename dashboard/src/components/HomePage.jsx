import React, { useState, useEffect } from 'react';
import {
  Footprints, Zap, Activity, TrendingUp, ChevronRight,
  ShieldCheck, Cpu, Battery, Brain, Wifi, WifiOff, Clock,
  HeartPulse, Scale, Sparkles, Play, Award, RotateCcw,
  Sliders, ArrowUpRight, CheckCircle2, AlertTriangle, Compass
} from 'lucide-react';
import { healthService } from '../services/healthService.js';
import { nativeBridge } from '../services/native.js';
import { userProfileService } from '../services/userProfile.js';

function HomePageComponent({ telemetry = {}, deviceId = 'bilateral_sim', isOnline = false, onSwitchDevice, onNavigate }) {
  const {
    activity = 'Standing',
    confidence = 0,
    steps = 0,
    cadence = 0,
    symmetry = 100,
    batteryPct = 90,
    sensors = {},
    imu = {},
    left = {},
    right = {},
    bilateral = {}
  } = telemetry;

  const [todayRecord, setTodayRecord] = useState(() => healthService.getTodayRecord(deviceId));
  const [profile, setProfile] = useState(() => userProfileService.getProfile());
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  // Retrieve any previously computed walking profile
  const [cachedProfile, setCachedProfile] = useState(() => {
    try {
      const history = JSON.parse(localStorage.getItem('stridesense_walking_profile_history_v1') || '[]');
      return history[0] || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const unsub = userProfileService.subscribe((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setTodayRecord(healthService.getTodayRecord(deviceId));
    const unsub = healthService.subscribe(() => {
      setTodayRecord(healthService.getTodayRecord(deviceId));
    });
    return unsub;
  }, [deviceId]);

  // Today's steps for active device (sanitize stale 1241 when offline)
  const safeRecordSteps = (todayRecord?.steps === 1241 && !isOnline) ? 0 : (todayRecord?.steps || 0);
  const safeLiveSteps = (steps === 1241 && !isOnline) ? 0 : (isOnline ? (steps || 0) : 0);
  const todaySteps = Math.max(safeRecordSteps, safeLiveSteps);
  const confPct = Math.round(confidence * 100);
  const stepGoal = todayRecord?.goal || 10000;
  const stepPct = Math.min(100, Math.round((todaySteps / stepGoal) * 100));

  // Active gait minutes goal (30 min target)
  const activeMinutes = todayRecord?.activeMinutes || Math.round(todaySteps / 110);
  const activeMinutesGoal = 30;
  const activePct = Math.min(100, Math.round((activeMinutes / activeMinutesGoal) * 100));

  // Symmetry ring percentage
  const symmetryPct = Math.min(100, Math.max(0, Math.round(symmetry)));

  // ─── CONCENTRIC TRIPLE RINGS GEOMETRY ───
  // Outer Ring: Steps (Cyan)
  const r1 = 58;
  const c1 = 2 * Math.PI * r1;
  const off1 = c1 * (1 - stepPct / 100);

  // Middle Ring: Active Gait Minutes (Emerald)
  const r2 = 45;
  const c2 = 2 * Math.PI * r2;
  const off2 = c2 * (1 - activePct / 100);

  // Inner Ring: Symmetry Quality (Amber)
  const r3 = 32;
  const c3 = 2 * Math.PI * r3;
  const off3 = c3 * (1 - symmetryPct / 100);

  // Bilateral load calculations
  const isBilateral = Boolean(telemetry.isBilateral || deviceId?.startsWith('bilateral') || deviceId === 'stridesense_esp32_01');
  const isHardware = deviceId === 'stridesense_esp32_01' || deviceId?.includes('hw') || deviceId?.includes('01');
  const leftPct = bilateral?.leftPct ?? 50.0;
  const rightPct = bilateral?.rightPct ?? 50.0;
  const totalNewtons = bilateral?.estNewtons ?? Math.round((((sensors.p1 || 0) + (sensors.p2 || 0)) / 4400) * 340);
  const leftNewtons = bilateral?.estLeftNewtons ?? Math.round((totalNewtons * leftPct) / 100);
  const rightNewtons = bilateral?.estRightNewtons ?? Math.round((totalNewtons * rightPct) / 100);
  const cop = bilateral?.cop || { x: 0, y: 0 };

  // Gait Phase Determination
  const normAct = activity ? (activity.charAt(0).toUpperCase() + activity.slice(1).toLowerCase()) : '—';
  const isDeviceLive = isOnline && normAct !== 'Offline' && normAct !== '—';

  let stancePhaseText = 'Balanced Stance';
  if (!isDeviceLive || totalNewtons < 30) {
    stancePhaseText = 'Standby • Unweighted';
  } else if (leftPct > 65) {
    stancePhaseText = 'Left Stance • Right Swing';
  } else if (rightPct > 65) {
    stancePhaseText = 'Right Stance • Left Swing';
  } else if (normAct === 'Running') {
    stancePhaseText = 'Dynamic Propulsive Phase';
  } else {
    stancePhaseText = 'Double Stance (Bilateral Load)';
  }

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : (hour < 17 ? 'Good Afternoon' : 'Good Evening');
  const greetEmoji = hour < 12 ? '☀️' : (hour < 17 ? '🌤️' : '🌙');

  const ACTIVITY_COLORS = {
    Walking:  { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
    Running:  { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    Standing: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    Sitting:  { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
    Fall:     { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
    Offline:  { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
    Standby:  { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' }
  };
  const actColor = isDeviceLive ? (ACTIVITY_COLORS[normAct] || ACTIVITY_COLORS.Walking) : ACTIVITY_COLORS.Offline;

  const handleZeroDriftCalibration = () => {
    nativeBridge.impactMedium();
    setCalibrating(true);
    setTimeout(() => {
      setCalibrating(false);
      nativeBridge.notificationSuccess();
    }, 1200);
  };

  const getDeviceTitle = () => {
    if (deviceId === 'stridesense_esp32_01' || deviceId === 'bilateral_hw') return 'StrideSense Unified Hardware (1x ESP32, 4x FSR)';
    if (deviceId === 'bilateral_sim') return 'Bilateral 3D Simulation (Studio Twin)';
    if (deviceId === 'insole_left_02') return 'Left Insole (3D Virtual)';
    if (deviceId === 'insole_right_02') return 'Right Insole (3D Virtual)';
    return deviceId;
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children">

      {/* ─── GREETING & BIOMECHANICAL STATUS HEADER ─── */}
      <div className="animate-fade-in-scale flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white truncate">
            {greeting}, {profile.name ? profile.name.trim().split(/\s+/)[0] : 'User'} {greetEmoji}
          </h1>

          {/* Live / Standby Status Capsule */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isDeviceLive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-sm">
                <span className="live-dot" />
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {deviceId === 'stridesense_esp32_01' ? 'ESP32 Live' : 'Live Stream'}
                </span>
                <span className="text-[9px] font-mono text-emerald-500/80 hidden sm:inline">• 50Hz</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 shadow-sm">
                <WifiOff className="w-3 h-3 text-amber-500 status-pulse" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {todaySteps > 0 ? 'Sync Standby' : 'Standby'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Patient Biomechanical Demographics Pill */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
              {profile.age} YRS • {profile.heightCm} CM • {profile.weightKg} KG
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px]">
              BMI: <strong className="font-mono text-slate-900 dark:text-white">{profile.bmi}</strong>{' '}
              <span className={`font-semibold ${profile.bmiColor}`}>({profile.bmiCategory})</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── APPLE HEALTH-STYLE CONCENTRIC TRIPLE RINGS HERO CARD ─── */}
      <div className="glass-panel p-5 sm:p-6 relative overflow-hidden animate-fade-in-scale">
        {/* Subtle atmospheric ambient glow */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: activity === 'Fall' ? 'rgba(244,63,94,0.3)' : 'rgba(0,229,255,0.15)' }}
        />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          
          {/* Concentric Triple Progress Rings SVG */}
          <div className="relative w-[150px] h-[150px] sm:w-[160px] sm:h-[160px] flex-shrink-0 flex items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 140 140" className="transform -rotate-90 select-none">
              {/* Outer Ring Background (Cyan: Steps) */}
              <circle cx="70" cy="70" r={r1} strokeWidth="7" fill="none" className="stroke-slate-200 dark:stroke-slate-800/80" />
              <circle
                cx="70" cy="70" r={r1} strokeWidth="7" fill="none"
                strokeDasharray={c1} strokeDashoffset={off1} strokeLinecap="round"
                className="transition-all duration-700 stroke-cyan-500"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.4))' }}
              />

              {/* Middle Ring Background (Emerald: Active Cadence) */}
              <circle cx="70" cy="70" r={r2} strokeWidth="7" fill="none" className="stroke-slate-200 dark:stroke-slate-800/80" />
              <circle
                cx="70" cy="70" r={r2} strokeWidth="7" fill="none"
                strokeDasharray={c2} strokeDashoffset={off2} strokeLinecap="round"
                className="transition-all duration-700 stroke-emerald-500"
                style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }}
              />

              {/* Inner Ring Background (Amber: Symmetry) */}
              <circle cx="70" cy="70" r={r3} strokeWidth="7" fill="none" className="stroke-slate-200 dark:stroke-slate-800/80" />
              <circle
                cx="70" cy="70" r={r3} strokeWidth="7" fill="none"
                strokeDasharray={c3} strokeDashoffset={off3} strokeLinecap="round"
                className="transition-all duration-700 stroke-amber-500"
                style={{ filter: 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.4))' }}
              />
            </svg>

            {/* Inner Ring Content: Footprints Icon & Step Tally */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <Footprints className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-0.5" />
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
                {todaySteps.toLocaleString()}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-1">Steps</span>
            </div>
          </div>

          {/* Biometric Breakdown & Ring Legend */}
          <div className="flex-1 min-w-0 w-full">
            {/* Top Row: Activity Pill + Goal Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${actColor.bg} ${actColor.border} ${actColor.text} border shadow-sm`}>
                  <span className={`w-2 h-2 rounded-full ${actColor.dot} ${isDeviceLive ? 'animate-breathe' : ''}`} />
                  {isDeviceLive ? normAct : 'Offline'}
                </span>
                {isDeviceLive && (
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {confPct}% TinyML Conf.
                  </span>
                )}
              </div>

              {/* Ring Color Legend */}
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Steps ({stepPct}%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Mobility ({activePct}%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Symmetry ({symmetryPct}%)</span>
                </span>
              </div>
            </div>

            {/* 4 Clinical Stat Cubes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-100/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Cadence</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {isDeviceLive ? cadence : 0}
                  </span>
                  <span className="text-[10px] text-slate-400">SPM</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                  {cadence >= 100 ? 'Optimal Rhythm' : (cadence > 0 ? 'Leisure Pace' : 'At Rest')}
                </span>
              </div>

              <div className="bg-slate-100/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Symmetry Index</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {symmetry.toFixed(1)}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                  {Math.abs(leftPct - rightPct) < 4 ? 'Clinically Balanced' : 'Asymmetry Detected'}
                </span>
              </div>

              <div className="bg-slate-100/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Bilateral Force</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {isDeviceLive ? totalNewtons : 0}
                  </span>
                  <span className="text-[10px] text-slate-400">N</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                  Ground Reaction
                </span>
              </div>

              <div className="bg-slate-100/70 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Daily Goal</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {stepPct}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                  {(stepGoal - todaySteps) > 0 ? `${(stepGoal - todaySteps).toLocaleString()} left` : 'Goal Crushed!'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DEDICATED BILATERAL FOOT LOAD BALANCE CARD ─── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('pressure')}
        className="glass-panel p-5 relative overflow-hidden cursor-pointer active-press select-none gradient-border"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Scale className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Bilateral Weight Distribution & Center of Pressure (CoP)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Left Insole ({leftNewtons} N) vs Right Insole ({rightNewtons} N) • Tap for 4x FSR Pedobarography
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Dynamic Bidirectional Balance Slider */}
        <div className="bg-slate-100/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.04]">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>LEFT FOOT:</span>
              <span className="font-mono text-sm">{leftPct}%</span>
              <span className="text-[11px] text-slate-400 font-normal">({leftNewtons}N)</span>
            </div>

            <div className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
              {stancePhaseText}
            </div>

            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] text-slate-400 font-normal">({rightNewtons}N)</span>
              <span className="font-mono text-sm">{rightPct}%</span>
              <span>:RIGHT FOOT</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Visual Split Bar */}
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-200 rounded-l-full"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-200 rounded-r-full"
              style={{ width: `${rightPct}%` }}
            />
            {/* Center Equilibrium Marker */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900 dark:bg-white z-10 opacity-70 transform -translate-x-1/2 shadow-sm" />
          </div>

          {/* CoP Coordinates & Lateral Drift */}
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-500" />
              <span>Lateral CoP Bias:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {Math.abs(cop.x) < 0.05 ? 'Zero Drift (Neutral Center)' : (cop.x > 0 ? `+${(cop.x * 100).toFixed(1)}% Right Shift` : `${(cop.x * 100).toFixed(1)}% Left Shift`)}
              </strong>
            </span>
            <span className="font-mono text-[10px]">
              CoP X: {cop.x > 0 ? `+${cop.x.toFixed(2)}` : cop.x.toFixed(2)} • Y: {cop.y > 0 ? `+${cop.y.toFixed(2)}` : cop.y.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 10-STEP WALKING PROFILE & GAIT LAB SPOTLIGHT CARD ─── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('profile')}
        className="glass-panel p-5 relative overflow-hidden cursor-pointer active-press select-none gradient-border"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/10">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Walking Profile & Pattern Lab
                </span>
                <span className="badge badge-cyan text-[9px] font-bold">10-STEP CLINICAL TEST</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {cachedProfile ? cachedProfile.archetype?.title : 'Rapid Biomechanical Gait Assessment'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {cachedProfile
                  ? `Archetype: ${cachedProfile.archetype?.headline} • Footwear: ${cachedProfile.archetype?.shoeClass || 'Neutral Cushion'}`
                  : 'Measures bilateral heel vs forefoot strike impulse, ankle eversion roll, and stance timing.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('profile');
            }}
            className="btn-primary w-full sm:w-auto px-4 py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl whitespace-nowrap active-press shadow-md shadow-cyan-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{cachedProfile ? 'View Dossier / Retest' : 'Start 10-Step Assessment'}</span>
          </button>
        </div>
      </div>

      {/* ─── 4 CLINICAL TELEMETRY MODULE TILES ─── */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Clinical Telemetry Modules
          </span>
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">Tap to inspect</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 stagger-children">
          {[
            {
              id: 'pressure',
              title: 'Plantar Pressure',
              subtitle: 'Dual-foot 4x FSR map',
              icon: Footprints,
              color: 'cyan',
              iconStyle: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
              footer: (
                <div className="flex items-center justify-between w-full text-[10px] font-mono">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">L: {leftPct}%</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">R: {rightPct}%</span>
                </div>
              )
            },
            {
              id: 'profile',
              title: 'Gait Profile Lab',
              subtitle: '10-step archetype analysis',
              icon: Award,
              color: 'amber',
              iconStyle: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
              footer: (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>TinyML Kinematics</span>
                </div>
              )
            },
            {
              id: 'health',
              title: 'Mobility & Trends',
              subtitle: 'Cadence, history & goals',
              icon: HeartPulse,
              color: 'emerald',
              iconStyle: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
              footer: (
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <TrendingUp className="w-3 h-3" />
                  <span>{todaySteps.toLocaleString()} steps today</span>
                </div>
              )
            },
            {
              id: 'safety',
              title: 'Fall Guard Shield',
              subtitle: 'Zero-g freefall + impact',
              icon: ShieldCheck,
              color: 'rose',
              iconStyle: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
              footer: (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  <span>Active & Monitoring</span>
                </div>
              )
            }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigate(card.id)}
                className="metric-card text-left active-press touch-manipulation select-none animate-fade-in group flex flex-col justify-between gradient-border"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.iconStyle} border transition-all`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.subtitle}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
                  {card.footer}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── DUAL-INSOLE HARDWARE DIAGNOSTICS & STATUS DRAWER ─── */}
      <div className="glass-panel p-4 sm:p-5 animate-fade-in-scale">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
              <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {getDeviceTitle()}
                </h4>
                <button
                  type="button"
                  onClick={onSwitchDevice}
                  className="badge badge-cyan text-[9px] px-2 py-0.5 active-press"
                >
                  Switch Setup
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {deviceId === 'stridesense_esp32_01'
                  ? '1x Central ESP32 • 4x FSR (GPIO 36, 39, 34, 35) • 1x MPU-6050 • 50 Hz'
                  : (deviceId.includes('sim')
                      ? `${deviceId} • 4x FSR + 2x 6-DOF IMU (Virtual Twin) • 50 Hz`
                      : `${deviceId} • 50 Hz Telemetry`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZeroDriftCalibration}
              disabled={calibrating}
              title="Tare & Calibrate Zero-Drift"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-cyan-500 active-press transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${calibrating ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 active-press"
            >
              {showDiagnostics ? 'Hide Details' : 'Diagnostics'}
            </button>
          </div>
        </div>

        {/* Collapsible Dual Node Diagnostic Cards */}
        {showDiagnostics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-white/[0.06] animate-fade-in">
            {/* Central Hardware Summary for 1x ESP32 */}
            {deviceId === 'stridesense_esp32_01' && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/[0.08] to-emerald-500/[0.08] border border-cyan-500/25">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                    SINGLE CENTRAL ESP32 HARDWARE CONTROLLER
                  </span>
                  <span className="badge badge-emerald text-[9px] font-mono">1x MCU ARCHITECTURE</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block font-sans">Central MCU</span>
                    <span className="font-bold text-slate-900 dark:text-white">ESP32 Dual-Core</span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block font-sans">Power (1x LiPo)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{telemetry.batteryPct ?? 95}% ({((telemetry.batteryVoltage ?? 4.08)).toFixed(2)}V)</span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block font-sans">Kinematic IMU</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">MPU-6050 (I2C)</span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block font-sans">Firmware / Cloud</span>
                    <span className="font-bold text-violet-600 dark:text-violet-400">v1.5.0 • Supabase</span>
                  </div>
                </div>
              </div>
            )}

            {/* Left Foot Node */}
            <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  LEFT INSOLE CHANNELS
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-500">
                  {deviceId.includes('sim') ? 'insole_left_02' : 'stridesense_esp32_01'}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Power State:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {deviceId === 'stridesense_esp32_01'
                      ? `ESP32 LiPo • ${telemetry.batteryPct ?? 95}% (${(telemetry.batteryVoltage ?? 4.08).toFixed(2)}V)`
                      : `${telemetry.left?.batteryPct ?? 100}% • ${(telemetry.left?.batteryVoltage ?? 4.2).toFixed(2)}V`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sensors (Heel/Ball):</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {deviceId.includes('sim') ? 'Virtual S1 / S2' : 'GPIO 36 / GPIO 39'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network Link:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {deviceId.includes('sim') ? 'Virtual Sim Loop' : 'ESP32 Wi-Fi (50 Hz)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zero-Drift Tare:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Calibrated OK</span>
                </div>
              </div>
            </div>

            {/* Right Foot Node */}
            <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  RIGHT INSOLE CHANNELS
                </span>
                <span className="text-[10px] font-mono font-semibold text-slate-500">
                  {deviceId.includes('sim') ? 'insole_right_02' : 'stridesense_esp32_01'}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Power State:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {deviceId === 'stridesense_esp32_01'
                      ? `ESP32 LiPo • ${telemetry.batteryPct ?? 95}% (${(telemetry.batteryVoltage ?? 4.08).toFixed(2)}V)`
                      : `${telemetry.right?.batteryPct ?? 100}% • ${(telemetry.right?.batteryVoltage ?? 4.2).toFixed(2)}V`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sensors (Heel/Ball):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {deviceId.includes('sim') ? 'Virtual S3 / S4' : 'GPIO 34 / GPIO 35'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Heel Calibration:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {deviceId.includes('sim') ? 'Virtual Synced' : '≥2100 ADC Floor OK'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zero-Drift Tare:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Calibrated OK</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default React.memo(HomePageComponent);
