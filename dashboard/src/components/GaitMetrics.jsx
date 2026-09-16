import React from 'react';
import { Footprints, Activity, Scale, Clock, Award } from 'lucide-react';

export default function GaitMetrics({
  steps = 3842,
  cadence = 108,
  symmetry = 96.4,
  activity = 'Walking'
}) {
  const stepGoal = 10000;
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));

  // Biomechanical stance / swing estimates
  const stancePct = activity === 'Running' ? 42 : (activity === 'Walking' ? 62 : 0);
  const swingPct = activity === 'Running' ? 58 : (activity === 'Walking' ? 38 : 0);

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-wide">Gait & Mobility Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Continuous kinematic and kinetic stride telemetry</p>
        </div>
        <span className="badge badge-emerald text-xs flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          Optimal Gait
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
        {/* Metric 1: Step Counter */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Daily Steps</span>
            <Footprints className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {steps.toLocaleString()}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${stepPct}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">{stepPct}% of 10,000 goal</span>
        </div>

        {/* Metric 2: Cadence */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Cadence</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {cadence} <span className="text-xs font-normal text-slate-400">SPM</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              {cadence > 140 ? 'High Tempo' : (cadence > 90 ? 'Brisk Walk' : 'Stationary')}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Steps per minute</span>
        </div>

        {/* Metric 3: Bilateral Symmetry */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Symmetry Index</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tracking-tight">
              {symmetry.toFixed(1)}<span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Medial / Lateral Balance</div>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1">Normal Range (&gt;90%)</span>
        </div>

        {/* Metric 4: Stride Cycle Duration */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Stride Cycle</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {cadence > 0 ? (60 / (cadence / 2)).toFixed(2) : '0.00'} <span className="text-xs font-normal text-slate-400">s</span>
            </div>
            <div className="text-[11px] text-purple-300 mt-1">Full GCT Period</div>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Heel-to-Heel strike</span>
        </div>
      </div>

      {/* Stance vs. Swing Phase Duty Cycle Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Gait Phase Duty Cycle:</span>
          <span className="font-mono">
            <span className="text-cyan-400 font-semibold">{stancePct}%</span> Stance / <span className="text-purple-400 font-semibold">{swingPct}%</span> Swing
          </span>
        </div>
        <div className="w-full bg-slate-800/90 rounded-full h-2.5 flex overflow-hidden">
          <div
            className="bg-cyan-500 h-full transition-all duration-300"
            style={{ width: `${stancePct}%` }}
            title="Stance Phase (Foot in ground contact)"
          />
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${swingPct}%` }}
            title="Swing Phase (Foot airborne in flight)"
          />
        </div>
      </div>
    </div>
  );
}
