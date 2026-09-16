import React from 'react';
import { Footprints, Flame, UserCheck, Armchair, AlertOctagon, Cpu, Zap } from 'lucide-react';

const ACTIVITY_CONFIG = {
  Walking: {
    icon: Footprints,
    color: '#00e5ff',
    badgeClass: 'badge-cyan',
    desc: 'Periodic Heel-to-Toe Stride Cycle (1.8 Hz)',
    glow: 'rgba(0, 229, 255, 0.4)'
  },
  Running: {
    icon: Flame,
    color: '#f59e0b',
    badgeClass: 'badge-amber',
    desc: 'High-Impact Aerobic Propulsion (2.7 Hz)',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  Standing: {
    icon: UserCheck,
    color: '#10b981',
    badgeClass: 'badge-emerald',
    desc: 'Static Postural Equilibrium Sway',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  Sitting: {
    icon: Armchair,
    color: '#8b5cf6',
    badgeClass: 'badge-cyan',
    desc: 'Non-Weight-Bearing Resting Position',
    glow: 'rgba(139, 92, 246, 0.4)'
  },
  Fall: {
    icon: AlertOctagon,
    color: '#f43f5e',
    badgeClass: 'badge-rose',
    desc: 'CRITICAL: High-G Kinematic Impact Shock!',
    glow: 'rgba(244, 63, 94, 0.8)'
  }
};

export default function ActivityCard({ activity = 'Walking', confidence = 0.98 }) {
  const conf = ACTIVITY_CONFIG[activity] || ACTIVITY_CONFIG['Walking'];
  const IconComponent = conf.icon;
  const confPct = Math.round(confidence * 100);

  return (
    <div
      className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between"
      style={{
        borderColor: activity === 'Fall' ? 'rgba(244, 63, 94, 0.6)' : undefined,
        boxShadow: activity === 'Fall' ? '0 0 35px rgba(244, 63, 94, 0.35)' : undefined
      }}
    >
      {/* Background ambient radial glow */}
      <div
        className="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{ backgroundColor: conf.glow }}
      />

      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Activity</span>
          <h3 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1 flex items-center gap-3">
            {activity}
            <span className={`badge ${conf.badgeClass}`}>
              <Zap className="w-3 h-3" />
              {confPct}% Conf.
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{conf.desc}</p>
        </div>

        {/* Dynamic Activity Icon */}
        <div
          className="p-3.5 rounded-2xl border transition-all duration-300"
          style={{
            backgroundColor: `${conf.color}15`,
            borderColor: `${conf.color}40`,
            boxShadow: `0 0 20px ${conf.glow}`
          }}
        >
          <IconComponent className="w-7 h-7" style={{ color: conf.color }} />
        </div>
      </div>

      {/* Edge AI / TinyML Telemetry Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-slate-500 block">Classifier</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            RandomForest
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Inference Time</span>
          <span className="font-mono font-semibold text-cyan-400 block mt-0.5">&lt; 0.38 ms</span>
        </div>
        <div>
          <span className="text-slate-500 block">Deployment</span>
          <span className="font-semibold text-emerald-400 block mt-0.5">ESP32 Native</span>
        </div>
      </div>
    </div>
  );
}
