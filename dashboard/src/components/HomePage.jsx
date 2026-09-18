import React from 'react';
import {
  Footprints, Zap, Activity, TrendingUp, ChevronRight,
  ShieldCheck, Cpu, Battery, Brain, Wifi, WifiOff, Clock
} from 'lucide-react';

function HomePageComponent({ telemetry, onNavigate }) {
  const { activity, confidence, steps, cadence, symmetry, batteryPct, sensors, imu } = telemetry;
  const confPct = Math.round(confidence * 100);
  const stepGoal = 10000;
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));

  // Step ring geometry
  const ringR = 44;
  const ringC = 2 * Math.PI * ringR;
  const ringOff = ringC * (1 - stepPct / 100);

  // Total pressure
  const totalForce = sensors.p1 + sensors.p2 + (sensors.p3 || 0) + (sensors.p4 || 0) + (sensors.p5 || 0) + (sensors.p6 || 0);
  const forceLevel = totalForce > 6000 ? 'High' : (totalForce > 2000 ? 'Normal' : 'Low');

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : (hour < 17 ? 'Good Afternoon' : 'Good Evening');
  const greetEmoji = hour < 12 ? '☀️' : (hour < 17 ? '🌤️' : '🌙');

  // Has real data?
  const hasData = steps > 0 || confidence > 0;

  const ACTIVITY_COLORS = {
    Walking:  { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
    Running:  { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    Standing: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    Sitting:  { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
    Fall:     { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' }
  };
  const normAct = activity ? (activity.charAt(0).toUpperCase() + activity.slice(1).toLowerCase()) : '—';
  const actColor = ACTIVITY_COLORS[normAct] || ACTIVITY_COLORS.Walking;

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children">

      {/* ─── GREETING & LIVE STATUS ─── */}
      <div className="animate-fade-in-scale flex flex-wrap justify-between items-end gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
            {greeting} {greetEmoji}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time insole biomechanics overview</p>
        </div>
        <div className="flex items-center gap-2">
          {hasData ? (
            <>
              <span className="live-dot" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live Telemetry</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500 status-pulse" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Awaiting Data…</span>
            </>
          )}
        </div>
      </div>

      {/* ─── ACTIVITY HERO CARD (with mesh gradient) ─── */}
      <div
        role="button"
        tabIndex={0}
        className={`glass-panel hero-mesh p-5 sm:p-6 relative overflow-hidden cursor-pointer active-press touch-manipulation select-none animate-fade-in-scale ${
          activity === 'Fall' ? 'border-rose-500/50 shadow-glow-rose' : ''
        }`}
        onClick={() => onNavigate('pressure')}
      >
        {/* Ambient glow */}
        <div
          className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl pointer-events-none animate-breathe"
          style={{ backgroundColor: activity === 'Fall' ? 'rgba(244,63,94,0.22)' : 'rgba(2,132,199,0.12)' }}
        />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Step Progress Ring */}
          <div className="relative w-[110px] h-[110px] flex-shrink-0">
            <svg width="110" height="110" className="transform -rotate-90">
              <circle
                cx="55" cy="55" r={ringR}
                className="progress-ring-bg"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="55" cy="55" r={ringR}
                strokeWidth="7"
                fill="none"
                strokeDasharray={ringC}
                strokeDashoffset={ringOff}
                strokeLinecap="round"
                className="transition-all duration-700 stroke-cyan-500"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.35))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-white leading-none tabular-nums">
                {steps.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">Steps</span>
            </div>
          </div>

          {/* Info & Biometric Breakdown */}
          <div className="flex-1 min-w-0 w-full text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${actColor.bg} ${actColor.border} ${actColor.text} border`}>
                <span className={`w-2 h-2 rounded-full ${actColor.dot} ${hasData ? 'animate-breathe' : ''}`} />
                {hasData ? activity : 'Waiting…'}
              </span>
              {hasData && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium tabular-nums">
                  {confPct}% confidence
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200/70 dark:border-white/[0.05]">
              {[
                { label: 'Cadence', value: `${cadence}`, unit: 'SPM', color: 'text-slate-900 dark:text-white' },
                { label: 'Symmetry', value: symmetry.toFixed(1), unit: '%', color: 'text-amber-600 dark:text-amber-300' },
                { label: 'Goal', value: `${stepPct}%`, unit: '', color: 'text-cyan-600 dark:text-cyan-400' },
                { label: 'Impact', value: forceLevel, unit: '', color: 'text-emerald-600 dark:text-emerald-400' }
              ].map((metric) => (
                <div key={metric.label} className="bg-slate-100/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/[0.03]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">{metric.label}</span>
                  <span className={`text-base font-mono font-bold ${metric.color} tabular-nums`}>
                    {metric.value}
                    {metric.unit && <span className="text-[10px] text-slate-500 font-normal ml-0.5">{metric.unit}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTION CARDS: 2-col on Mobile, 4-col on Tablet/Desktop ─── */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Telemetry Modules
          </span>
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">Tap to inspect</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 stagger-children">
          {[
            {
              id: 'pressure',
              title: 'Pressure Map',
              subtitle: 'Plantar FSR heatmap',
              icon: Footprints,
              color: 'cyan',
              iconStyle: 'bg-cyan-500/10 border-cyan-500/20',
              hoverGlow: 'group-hover:shadow-glow-cyan',
              footer: (
                <>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">H: {sensors.p1}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">F: {sensors.p2}</span>
                </>
              )
            },
            {
              id: 'gait',
              title: 'Gait Analytics',
              subtitle: 'Stride telemetry & trends',
              icon: Activity,
              color: 'emerald',
              iconStyle: 'bg-emerald-500/10 border-emerald-500/20',
              hoverGlow: 'group-hover:shadow-glow-emerald',
              footer: (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{cadence > 90 ? 'Active' : 'Resting'}</span>
                </>
              )
            },
            {
              id: 'motion',
              title: 'IMU Motion',
              subtitle: '6-DOF spatial kinematics',
              icon: Brain,
              color: 'violet',
              iconStyle: 'bg-violet-500/10 border-violet-500/20',
              hoverGlow: '',
              footer: (
                <>
                  <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold tabular-nums">SVM: {imu.svmA}g</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">{imu.pitch}°</span>
                </>
              )
            },
            {
              id: 'safety',
              title: 'Fall Guard',
              subtitle: 'Dual-trigger safety shield',
              icon: ShieldCheck,
              color: 'emerald',
              iconStyle: 'bg-emerald-500/10 border-emerald-500/20',
              hoverGlow: '',
              footer: (
                <>
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Armed & Safe</span>
                </>
              )
            }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigate(card.id)}
                className={`metric-card text-left active-press touch-manipulation select-none animate-fade-in group flex flex-col justify-between gradient-border`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.iconStyle} border ${card.hoverGlow} transition-all`}>
                      <Icon className={`w-5 h-5 text-${card.color}-600 dark:text-${card.color}-400`} />
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-${card.color}-500 transition-colors`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.subtitle}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
                  {card.footer}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── DEVICE STATUS STRIP ─── */}
      <div
        role="button"
        tabIndex={0}
        className="glass-panel p-4 flex items-center justify-between animate-fade-in-scale cursor-pointer active-press touch-manipulation select-none"
        onClick={() => onNavigate('settings')}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
            <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">ESP32 Smart Insole Active</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">v1.4.2-TinyML • insole_left_01</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Battery className={`w-4 h-4 ${batteryPct > 20 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">{batteryPct}%</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

    </div>
  );
}

export default React.memo(HomePageComponent);
