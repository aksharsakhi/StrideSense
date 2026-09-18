import React from 'react';
import { Battery, Wifi, Cpu, Sliders, CheckCircle2 } from 'lucide-react';

export default function DeviceStatus({
  batteryPct = 88,
  batteryVoltage = 3.96,
  isCloudConnected = false
}) {
  const batteryColor = batteryPct > 60
    ? 'text-emerald-500 dark:text-emerald-400'
    : (batteryPct > 20 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400');
  const batteryBg = batteryPct > 60
    ? 'from-emerald-500 to-cyan-400'
    : (batteryPct > 20 ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-red-400');
  const hoursLeft = Math.max(0, ((batteryPct / 100) * 8.5)).toFixed(1);

  return (
    <div className="glass-panel p-5 animate-fade-in-scale">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white tracking-wide">Device Status</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">ESP32 smart insole telemetry link</p>
        </div>
        <span className="badge badge-emerald text-[10px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Healthy
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 stagger-children">
        {/* Battery */}
        <div className="metric-card animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Battery</span>
            <Battery className={`w-4 h-4 ${batteryColor}`} />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            {batteryPct}<span className="text-xs font-normal text-slate-400 ml-0.5">%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${batteryBg} h-full rounded-full transition-all duration-500`}
              style={{ width: `${batteryPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
            <span>{batteryVoltage.toFixed(2)} V</span>
            <span className={batteryColor}>~{hoursLeft} hrs</span>
          </div>
        </div>

        {/* Network / Backend */}
        <div className="metric-card animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Backend</span>
            <Wifi className={`w-4 h-4 ${isCloudConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-none">
            {isCloudConnected ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="live-dot" />
                SUPABASE
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-mono">OFFLINE</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
            {isCloudConnected ? 'sgooptohhldguitvhbrl (CDC)' : 'Waiting for connection...'}
          </div>
        </div>

        {/* Sampling Rate */}
        <div className="metric-card animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sampling</span>
            <Cpu className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            50<span className="text-xs font-normal text-slate-400 ml-1">Hz</span>
          </div>
          <div className="text-[10px] text-violet-600 dark:text-violet-300 mt-1.5">20ms cycle • 6-DOF</div>
        </div>

        {/* Calibration */}
        <div className="metric-card animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Calibration</span>
            <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-base font-bold text-slate-900 dark:text-white">Calibrated</span>
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-300 mt-1.5">Zero-tare baseline: OK</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.05] flex flex-wrap justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
        <div>Device: <span className="font-mono text-slate-700 dark:text-slate-300">insole_left_01</span></div>
        <div>FW: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">v1.4.2-TinyML</span></div>
      </div>
    </div>
  );
}
