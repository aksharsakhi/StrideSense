import React from 'react';
import {
  Footprints, Zap, Activity, Timer, TrendingUp, ChevronRight,
  ShieldCheck, Cpu, Battery, Wifi, Brain, Heart
} from 'lucide-react';

export default function HomePage({ telemetry, onNavigate }) {
  const { activity, confidence, steps, cadence, symmetry, batteryPct, sensors, imu } = telemetry;
  const confPct = Math.round(confidence * 100);
  const stepGoal = 10000;
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));

  // Step ring
  const ringR = 44;
  const ringC = 2 * Math.PI * ringR;
  const ringOff = ringC * (1 - stepPct / 100);

  // Total pressure (sum of active sensors)
  const totalForce = sensors.p1 + sensors.p2 + (sensors.p3 || 0) + (sensors.p4 || 0) + (sensors.p5 || 0) + (sensors.p6 || 0);
  const forceLevel = totalForce > 6000 ? 'High' : (totalForce > 2000 ? 'Normal' : 'Low');

  const ACTIVITY_COLORS = {
    Walking: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    Running: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
    Standing: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    Sitting: { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-400' },
    Fall: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' }
  };
  const actColor = ACTIVITY_COLORS[activity] || ACTIVITY_COLORS.Walking;

  return (
    <div className="flex flex-col gap-4 animate-fade-in stagger-children">

      {/* ─── GREETING & LIVE STATUS ─── */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl font-bold font-display text-white">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Real-time insole biomechanics overview</p>
      </div>

      {/* ─── ACTIVITY HERO CARD ─── */}
      <div
        className={`glass-panel p-5 relative overflow-hidden cursor-pointer active-press animate-fade-in-scale ${
          activity === 'Fall' ? 'border-rose-500/50' : ''
        }`}
        onClick={() => onNavigate('pressure')}
        style={{ boxShadow: activity === 'Fall' ? '0 0 40px rgba(244,63,94,0.25)' : undefined }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none animate-breathe"
          style={{ backgroundColor: activity === 'Fall' ? 'rgba(244,63,94,0.2)' : 'rgba(0,229,255,0.12)' }}
        />

        <div className="relative flex items-center gap-4">
          {/* Step Ring */}
          <div className="relative w-[100px] h-[100px] flex-shrink-0">
            <svg width="100" height="100" className="transform -rotate-90">
              <circle cx="50" cy="50" r={ringR} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
              <circle
                cx="50" cy="50" r={ringR}
                stroke="#00e5ff"
                strokeWidth="6"
                fill="none"
                strokeDasharray={ringC}
                strokeDashoffset={ringOff}
                strokeLinecap="round"
                className="transition-all duration-700"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.3))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-bold text-white leading-none">{steps.toLocaleString()}</span>
              <span className="text-[8px] text-slate-500 font-semibold uppercase mt-0.5">Steps</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${actColor.bg} ${actColor.border} ${actColor.text} border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${actColor.dot}`} />
                {activity}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{confPct}% conf.</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-semibold block">Cadence</span>
                <span className="text-sm font-mono font-bold text-white">{cadence} <span className="text-[9px] text-slate-500 font-normal">SPM</span></span>
              </div>
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-semibold block">Symmetry</span>
                <span className="text-sm font-mono font-bold text-amber-300">{symmetry.toFixed(1)}<span className="text-[9px] text-slate-500 font-normal">%</span></span>
              </div>
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-semibold block">Goal</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{stepPct}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-semibold block">Force</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{forceLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTION CARDS ROW ─── */}
      <div className="grid grid-cols-2 gap-3 stagger-children">

        {/* Pressure Map Card */}
        <button
          onClick={() => onNavigate('pressure')}
          className="metric-card text-left active-press animate-fade-in group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:shadow-glow-cyan transition-all">
              <Footprints className="w-5 h-5 text-cyan-400" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white">Pressure Map</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Plantar heatmap visualization</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-mono text-cyan-400 font-bold">Heel: {sensors.p1}</span>
            <span className="text-slate-700">•</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">Fore: {sensors.p2}</span>
          </div>
        </button>

        {/* Gait Analytics Card */}
        <button
          onClick={() => onNavigate('gait')}
          className="metric-card text-left active-press animate-fade-in group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:shadow-glow-emerald transition-all">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white">Gait Analytics</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Stride telemetry & trends</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-semibold">{cadence > 90 ? 'Active' : 'Resting'} Phase</span>
          </div>
        </button>

        {/* IMU Motion Card */}
        <button
          onClick={() => onNavigate('motion')}
          className="metric-card text-left active-press animate-fade-in group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 transition-all">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white">IMU Motion</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">6-DOF kinematics & impact</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-mono text-violet-400 font-bold">SVM: {imu.svmA}g</span>
            <span className="text-slate-700">•</span>
            <span className="text-[10px] font-mono text-slate-400">P: {imu.pitch}°</span>
          </div>
        </button>

        {/* Fall Guard Card */}
        <button
          onClick={() => onNavigate('safety')}
          className="metric-card text-left active-press animate-fade-in group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 transition-all">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white">Fall Guard</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Dual-trigger safety shield</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span className="text-[10px] text-emerald-400 font-semibold">Active & Monitoring</span>
          </div>
        </button>

      </div>

      {/* ─── DEVICE STATUS STRIP ─── */}
      <div className="glass-panel p-4 flex items-center justify-between animate-fade-in-scale cursor-pointer active-press" onClick={() => onNavigate('settings')}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-white/[0.06]">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">ESP32 Smart Insole</h4>
            <p className="text-[10px] text-slate-500">v1.4.2-TinyML • insole_left_01</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Battery className={`w-3.5 h-3.5 ${batteryPct > 20 ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-[11px] font-mono font-bold text-white">{batteryPct}%</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </div>
      </div>

    </div>
  );
}
