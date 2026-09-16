import React from 'react';
import { Battery, Wifi, Cpu, Sliders, CheckCircle2 } from 'lucide-react';

export default function DeviceStatus({
  batteryPct = 88,
  batteryVoltage = 3.96,
  isCloudConnected = false,
  isSimulated = true
}) {
  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-wide">Hardware & Device Status</h2>
          <p className="text-xs text-slate-400 mt-0.5">ESP32 DevKit V1 smart insole telemetry link</p>
        </div>
        <span className="badge badge-emerald text-xs flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Online & Healthy
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
        {/* Battery Monitor */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Battery</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {batteryPct}<span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{batteryVoltage.toFixed(2)} V</span>
            <span className="text-emerald-400 font-medium">~7.5 hrs left</span>
          </div>
        </div>

        {/* Network / Connectivity */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Connection</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            {isSimulated ? (
              <span className="text-cyan-400 font-mono text-lg">SIMULATOR</span>
            ) : (
              <span className="text-emerald-400 font-mono text-lg">Wi-Fi LIVE</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isSimulated ? 'In-Memory Stream' : '-58 dBm (Strong)'}
          </div>
        </div>

        {/* Processor / Sampling */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Sampling Rate</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            50 <span className="text-xs font-normal text-slate-400">Hz</span>
          </div>
          <div className="text-[11px] text-purple-300 mt-1">20ms cycle time</div>
        </div>

        {/* Insole Calibration */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Calibration</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">
            Calibrated
          </div>
          <div className="text-[11px] text-amber-300 mt-1">Tare Zero-Force: OK</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap justify-between items-center text-xs text-slate-400">
        <div>Device ID: <span className="font-mono text-slate-200">ESP32-STRIDE-01</span></div>
        <div>Firmware: <span className="font-mono text-cyan-400">v1.4.2-TinyML</span></div>
      </div>
    </div>
  );
}
