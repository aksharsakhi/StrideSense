import React from 'react';
import { Footprints, Flame, UserCheck, Armchair, AlertOctagon, Zap, Brain } from 'lucide-react';

const ACTIVITY_CONFIG = {
  Walking: {
    icon: Footprints,
    color: '#0284c7',
    darkColor: '#00e5ff',
    badgeClass: 'badge-cyan',
    desc: 'Periodic heel-to-toe stride cycle detected',
    glow: 'rgba(2, 132, 199, 0.20)',
    darkGlow: 'rgba(0, 229, 255, 0.25)'
  },
  Running: {
    icon: Flame,
    color: '#d97706',
    darkColor: '#f59e0b',
    badgeClass: 'badge-amber',
    desc: 'High-impact aerobic propulsion phase',
    glow: 'rgba(217, 119, 6, 0.20)',
    darkGlow: 'rgba(245, 158, 11, 0.25)'
  },
  Standing: {
    icon: UserCheck,
    color: '#059669',
    darkColor: '#10b981',
    badgeClass: 'badge-emerald',
    desc: 'Static postural equilibrium sway',
    glow: 'rgba(5, 150, 105, 0.20)',
    darkGlow: 'rgba(16, 185, 129, 0.25)'
  },
  Sitting: {
    icon: Armchair,
    color: '#7c3aed',
    darkColor: '#a78bfa',
    badgeClass: 'badge-purple',
    desc: 'Non-weight-bearing resting position',
    glow: 'rgba(124, 58, 237, 0.20)',
    darkGlow: 'rgba(139, 92, 246, 0.25)'
  },
  Fall: {
    icon: AlertOctagon,
    color: '#e11d48',
    darkColor: '#f43f5e',
    badgeClass: 'badge-rose',
    desc: 'CRITICAL: High-G kinematic impact shock!',
    glow: 'rgba(225, 29, 72, 0.35)',
    darkGlow: 'rgba(244, 63, 94, 0.5)'
  }
};

export default function ActivityCard({ activity = 'Walking', confidence = 0.98 }) {
  const conf = ACTIVITY_CONFIG[activity] || ACTIVITY_CONFIG['Walking'];
  const IconComponent = conf.icon;
  const confPct = Math.round(confidence * 100);
  const isFall = activity === 'Fall';

  // SVG ring for confidence visualization
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - confidence);

  return (
    <div
      className={`glass-panel p-5 relative overflow-hidden animate-fade-in-scale ${
        isFall ? 'border-rose-500/50 shadow-glow-rose' : ''
      }`}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none animate-breathe"
        style={{ backgroundColor: conf.glow }}
      />

      <div className="relative flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Current Activity
          </span>

          <h3 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white mt-1 flex items-center gap-2.5 flex-wrap">
            {activity}
            <span className={`badge ${conf.badgeClass} text-[10px]`}>
              <Zap className="w-2.5 h-2.5" />
              {confPct}%
            </span>
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{conf.desc}</p>
        </div>

        {/* Confidence Ring + Icon */}
        <div className="relative flex-shrink-0 ml-3">
          <svg width="68" height="68" className="transform -rotate-90">
            <circle
              cx="34" cy="34" r={ringRadius}
              className="progress-ring-bg"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="34" cy="34" r={ringRadius}
              stroke="var(--accent-cyan)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{ filter: 'drop-shadow(0 0 6px var(--accent-cyan-glow))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Edge AI Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-200/70 dark:border-white/[0.05] grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Classifier</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
            <Brain className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            RandomForest
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Inference</span>
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400 block mt-0.5">&lt; 0.3 µs</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Deployment</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">ESP32 Edge</span>
        </div>
      </div>
    </div>
  );
}
