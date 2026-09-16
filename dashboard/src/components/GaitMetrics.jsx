import React from 'react';
import { Footprints, Activity, Scale, Clock, Award, Target, TrendingUp } from 'lucide-react';

export default function GaitMetrics({
  steps = 3842,
  cadence = 108,
  symmetry = 96.4,
  activity = 'Walking'
}) {
  const stepGoal = 10000;
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
  const stancePct = activity === 'Running' ? 42 : (activity === 'Walking' ? 62 : 0);
  const swingPct = activity === 'Running' ? 58 : (activity === 'Walking' ? 38 : 0);

  // SVG ring for step progress
  const ringR = 38;
  const ringC = 2 * Math.PI * ringR;
  const ringOff = ringC * (1 - stepPct / 100);

  const METRICS = [
    {
      label: 'Daily Steps',
      value: steps.toLocaleString(),
      sub: `${stepPct}% of 10k goal`,
      icon: Footprints,
      iconColor: 'text-cyan-400',
      valueColor: 'text-white',
      accent: '#00e5ff',
      hasRing: true
    },
    {
      label: 'Cadence',
      value: `${cadence}`,
      unit: 'SPM',
      sub: cadence > 140 ? 'High Tempo' : (cadence > 90 ? 'Brisk Walk' : 'Stationary'),
      icon: Activity,
      iconColor: 'text-emerald-400',
      valueColor: 'text-white',
      accent: '#10b981'
    },
    {
      label: 'Symmetry',
      value: symmetry.toFixed(1),
      unit: '%',
      sub: symmetry > 90 ? 'Balanced' : 'Review Gait',
      icon: Scale,
      iconColor: 'text-amber-400',
      valueColor: symmetry > 90 ? 'text-amber-300' : 'text-rose-400',
      accent: '#f59e0b'
    },
    {
      label: 'Stride Cycle',
      value: cadence > 0 ? (60 / (cadence / 2)).toFixed(2) : '0.00',
      unit: 's',
      sub: 'Full GCT Period',
      icon: Clock,
      iconColor: 'text-violet-400',
      valueColor: 'text-white',
      accent: '#a78bfa'
    }
  ];

  return (
    <div className="glass-panel p-5 animate-fade-in-scale">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold font-display text-white tracking-wide">Gait Analytics</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Continuous kinematic stride telemetry</p>
        </div>
        <span className="badge badge-emerald text-[10px] flex items-center gap-1">
          <Award className="w-3 h-3" />
          Optimal
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        {METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="metric-card flex flex-col justify-between animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.iconColor}`} />
              </div>

              {m.hasRing ? (
                <div className="flex items-center gap-3">
                  {/* Mini ring */}
                  <div className="relative w-[52px] h-[52px] flex-shrink-0">
                    <svg width="52" height="52" className="transform -rotate-90">
                      <circle cx="26" cy="26" r="20" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                      <circle
                        cx="26" cy="26" r="20"
                        stroke={m.accent}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={2 * Math.PI * 20 * (1 - stepPct / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                        style={{ filter: `drop-shadow(0 0 4px ${m.accent}40)` }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-400">
                      {stepPct}%
                    </span>
                  </div>
                  <div>
                    <div className={`text-2xl font-mono font-bold ${m.valueColor} tracking-tight leading-none`}>
                      {m.value}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">{m.sub}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`text-2xl font-mono font-bold ${m.valueColor} tracking-tight leading-none`}>
                    {m.value}
                    {m.unit && <span className="text-xs font-normal text-slate-500 ml-1">{m.unit}</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">{m.sub}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stance vs. Swing Phase Bar */}
      <div className="mt-4 pt-3 border-t border-white/[0.05]">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
          <span className="font-semibold">Gait Phase Duty Cycle</span>
          <span className="font-mono">
            <span className="text-cyan-400 font-bold">{stancePct}%</span> Stance
            <span className="mx-1 text-slate-600">/</span>
            <span className="text-violet-400 font-bold">{swingPct}%</span> Swing
          </span>
        </div>
        <div className="w-full bg-slate-800/70 rounded-full h-2 flex overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-l-full transition-all duration-500"
            style={{ width: `${stancePct}%` }}
          />
          <div
            className="bg-gradient-to-r from-violet-500 to-violet-400 h-full rounded-r-full transition-all duration-500"
            style={{ width: `${swingPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
