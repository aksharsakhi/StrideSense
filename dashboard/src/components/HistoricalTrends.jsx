import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, FileDown, Loader2, CloudOff } from 'lucide-react';
import { supabaseService } from '../services/supabase.js';

export default function HistoricalTrends() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  async function loadHistoricalData() {
    setLoading(true);
    try {
      const history = await supabaseService.fetchGaitHistory(500);

      if (history.length > 0) {
        // Group by day for weekly step chart
        const dayMap = {};
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          dayMap[key] = { day: DAY_NAMES[d.getDay()], steps: 0, goal: 10000, date: key };
        }

        // Aggregate steps by day
        history.forEach((row) => {
          const dateKey = new Date(row.created_at).toISOString().split('T')[0];
          if (dayMap[dateKey]) {
            dayMap[dateKey].steps = Math.max(dayMap[dateKey].steps, row.steps || 0);
          }
        });

        setWeeklyData(Object.values(dayMap));

        // Extract fall incidents
        const falls = history
          .filter((r) => r.activity === 'Fall')
          .slice(0, 3)
          .map((r, i) => ({
            id: `INC-${new Date(r.created_at).getTime()}`,
            time: new Date(r.created_at).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }),
            type: 'Fall Detected',
            impactG: `${(r.svm_a || 0).toFixed(2)}g`,
            status: 'Fall Guard Triggered',
            outcome: 'Recorded',
            safe: true
          }));
        setIncidents(falls);
      } else {
        // Use placeholder data if no cloud data yet
        setWeeklyData([
          { day: 'Mon', steps: 0, goal: 10000 },
          { day: 'Tue', steps: 0, goal: 10000 },
          { day: 'Wed', steps: 0, goal: 10000 },
          { day: 'Thu', steps: 0, goal: 10000 },
          { day: 'Fri', steps: 0, goal: 10000 },
          { day: 'Sat', steps: 0, goal: 10000 },
          { day: 'Sun', steps: 0, goal: 10000 }
        ]);
      }
    } catch (e) {
      console.warn('[HistoricalTrends] Failed to load:', e);
    }
    setLoading(false);
  }

  const maxSteps = Math.max(14000, ...weeklyData.map((d) => d.steps));
  const totalSteps = weeklyData.reduce((s, d) => s + d.steps, 0);
  const avgSteps = weeklyData.length > 0 ? Math.round(totalSteps / weeklyData.length) : 0;
  const daysGoalMet = weeklyData.filter((d) => d.steps >= d.goal).length;
  const peakDay = weeklyData.reduce((best, d) => (d.steps > best.steps ? d : best), { steps: 0, day: '—' });
  const hasData = totalSteps > 0;

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
        {hasData && (
          <span className="badge badge-cyan text-xs flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Weekly Avg: {avgSteps.toLocaleString()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs font-medium">Loading telemetry history…</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto">
          {/* Weekly Steps Bar Chart */}
          <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Daily Step Compliance</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                {daysGoalMet} / 7 Met
              </span>
            </div>

            {hasData ? (
              <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1">
                {weeklyData.map((item) => {
                  const heightPct = Math.max(2, Math.round((item.steps / maxSteps) * 100));
                  const reachedGoal = item.steps >= item.goal;
                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.steps > 0 ? `${(item.steps / 1000).toFixed(1)}k` : '—'}
                      </span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-lg relative flex items-end h-full">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            reachedGoal
                              ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
                              : item.steps > 0
                              ? 'bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'
                              : 'bg-slate-300/50 dark:bg-slate-700/50'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-36 text-slate-400 dark:text-slate-600">
                <div className="text-center">
                  <CloudOff className="w-8 h-8 mx-auto mb-2 empty-pulse" />
                  <span className="text-xs font-medium">No step data yet</span>
                </div>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 mt-2">
              <span>Goal: 10,000 steps</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                {hasData ? `Peak: ${(peakDay.steps / 1000).toFixed(1)}k (${peakDay.day})` : 'Awaiting data'}
              </span>
            </div>
          </div>

          {/* Fall Incident History */}
          <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Recent Incident Logs</span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">Total: {incidents.length}</span>
            </div>

            {incidents.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-3 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{inc.type}</span>
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded tabular-nums">
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
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-600">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
                  <span className="text-xs font-medium">No fall incidents recorded</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">All clear ✓</span>
                </div>
              </div>
            )}

            <div className="text-right mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80">
              <button className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-semibold flex items-center gap-1 ml-auto active-press touch-manipulation">
                <FileDown className="w-3.5 h-3.5" />
                Export Biomechanical Audit (PDF) →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
