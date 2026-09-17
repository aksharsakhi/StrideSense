import React from 'react';
import { TrendingUp, CheckCircle, FileDown } from 'lucide-react';

const WEEKLY_STEPS = [
  { day: 'Mon', steps: 8420, goal: 10000 },
  { day: 'Tue', steps: 10250, goal: 10000 },
  { day: 'Wed', steps: 7890, goal: 10000 },
  { day: 'Thu', steps: 11400, goal: 10000 },
  { day: 'Fri', steps: 9650, goal: 10000 },
  { day: 'Sat', steps: 12300, goal: 10000 },
  { day: 'Sun', steps: 6840, goal: 10000 }
];

const INCIDENT_LOGS = [
  {
    id: 'INC-2026-0914',
    time: 'Yesterday, 16:42',
    type: 'Controlled Slip Test',
    impactG: '3.42g',
    status: 'User Cancelled (12s)',
    outcome: 'Resolved Safe',
    safe: true
  },
  {
    id: 'INC-2026-0911',
    time: '3 days ago, 11:15',
    type: 'Abrupt Balance Anomaly',
    impactG: '2.95g',
    status: 'Stumble Recovery',
    outcome: 'Self-Corrected',
    safe: true
  }
];

export default function HistoricalTrends() {
  const maxSteps = 14000;

  return (
    <div className="glass-panel p-5 sm:p-6 flex flex-col justify-between h-full">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-wide">
            Historical Progression & Audit
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            7-Day mobility compliance and fall anomaly verification
          </p>
        </div>
        <span className="badge badge-cyan text-xs flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Weekly Avg: 9,535
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto">
        {/* Weekly Steps Bar Chart */}
        <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Daily Step Compliance</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">5 / 7 Met</span>
          </div>

          <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1">
            {WEEKLY_STEPS.map((item) => {
              const heightPct = Math.round((item.steps / maxSteps) * 100);
              const reachedGoal = item.steps >= item.goal;
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {(item.steps / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-lg relative flex items-end h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        reachedGoal
                          ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{item.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 mt-2">
            <span>Goal: 10,000 steps</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Peak: 12.3k (Sat)</span>
          </div>
        </div>

        {/* Fall Incident History */}
        <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Recent Incident Logs</span>
            <span className="text-xs text-slate-500 font-mono">Total: 2</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {INCIDENT_LOGS.map((inc) => (
              <div
                key={inc.id}
                className="bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-3 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{inc.type}</span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      {inc.impactG}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{inc.time} • {inc.status}</div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{inc.outcome}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80">
            <button className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-semibold flex items-center gap-1 ml-auto">
              <FileDown className="w-3.5 h-3.5" />
              Export Biomechanical Audit (PDF) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
