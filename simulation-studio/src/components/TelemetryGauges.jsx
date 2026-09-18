import React from 'react';
import { Cpu, Activity, Gauge, Wifi, CheckCircle2, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { ACTIVITY_COLORS } from '../services/tinyMLEval';

export default function TelemetryGauges({
  sample,
  inference,
  supabaseBridge,
  supabaseEnabled,
  setSupabaseEnabled,
  stats
}) {
  const svmAcc = Math.sqrt(
    (sample?.ax || 0) * (sample?.ax || 0) +
    (sample?.ay || 0) * (sample?.ay || 0) +
    (sample?.az || 0) * (sample?.az || 0)
  );

  const svmGyro = Math.sqrt(
    (sample?.gx || 0) * (sample?.gx || 0) +
    (sample?.gy || 0) * (sample?.gy || 0) +
    (sample?.gz || 0) * (sample?.gz || 0)
  );

  const sensors = [
    { id: 'p1', name: 'FSR 1: Heel Calcaneus (GPIO 36)', val: sample?.p1 || 0, role: 'Heel Strike Shock' },
    { id: 'p2', name: 'FSR 2: Forefoot Ball (GPIO 39)', val: sample?.p2 || sample?.p5 || 0, role: 'Propulsion & Metatarsal' },
  ];

  const activityColor = ACTIVITY_COLORS[inference?.activityName] || '#06b6d4';

  return (
    <div className="flex flex-col space-y-4">
      {/* TinyML Model Prediction Box */}
      <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono">
              ON-DEVICE TINYML INFERENCE (ESP32)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            8-Tree Ensemble • 0.27 µs
          </span>
        </div>

        {/* Prediction Hero */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div
            className="p-3 rounded-xl border flex flex-col justify-center"
            style={{
              borderColor: `${activityColor}40`,
              backgroundColor: `${activityColor}15`
            }}
          >
            <span className="text-[10px] font-mono text-slate-400 uppercase">Classified Gait State</span>
            <span
              className="text-lg font-bold font-display tracking-wide mt-0.5"
              style={{ color: activityColor }}
            >
              {inference?.activityName || 'Analyzing...'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Ensemble Confidence</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold font-mono text-cyan-400">
                {((inference?.confidence || 0) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({inference?.votes?.[inference?.activity] || 0}/8 trees)
              </span>
            </div>
          </div>
        </div>

        {/* 8-Tree Voting Breakdown */}
        <div className="space-y-1 font-mono text-[10px]">
          <div className="text-slate-400 flex justify-between">
            <span>Decision Trees (0-7):</span>
            <span className="text-slate-500">Unanimous Consensus</span>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {(inference?.treeResults || [0,0,0,0,0,0,0,0]).map((classIdx, idx) => (
              <div
                key={idx}
                className="py-1 rounded text-center border font-semibold"
                style={{
                  backgroundColor: `${ACTIVITY_COLORS[['Standing','Walking','Running','Sitting','Fall'][classIdx]]}20`,
                  borderColor: `${ACTIVITY_COLORS[['Standing','Walking','Running','Sitting','Fall'][classIdx]]}50`,
                  color: ACTIVITY_COLORS[['Standing','Walking','Running','Sitting','Fall'][classIdx]]
                }}
                title={`Tree ${idx}: ${['Standing','Walking','Running','Sitting','Fall'][classIdx]}`}
              >
                T{idx}
              </div>
            ))}
          </div>
        </div>

        {/* Cadence & Symmetry Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">CADENCE</span>
            <span className="text-xs font-bold text-emerald-400">{stats.cadence} SPM</span>
          </div>
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">SYMMETRY</span>
            <span className="text-xs font-bold text-cyan-400">{stats.symmetry}%</span>
          </div>
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block">TOTAL STEPS</span>
            <span className="text-xs font-bold text-purple-400">{stats.steps}</span>
          </div>
        </div>
      </div>

      {/* FSR Pressure Sensor Channels */}
      <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono">
              FSR PRESSURE SENSORS (12-BIT ADC)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            2x Square Kit (GPIO 36 & 39)
          </span>
        </div>

        <div className="space-y-3 font-mono">
          {sensors.map((s) => {
            const percent = Math.min(100, Math.round((s.val / 4095) * 100));
            const newtons = Math.round((s.val / 4095) * 420); // ~0-420N calibration
            return (
              <div key={s.id} className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-start text-xs mb-1">
                  <div>
                    <span className="text-slate-200 text-[11px] font-semibold block">{s.name}</span>
                    <span className="text-[10px] text-slate-500">{s.role}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] mr-2">{newtons} N</span>
                    <span className={`font-bold text-xs ${s.val > 3000 ? 'text-red-400' : 'text-cyan-400'}`}>
                      {s.val}
                    </span>
                    <span className="text-[10px] text-slate-500"> / 4095</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full transition-all duration-75 ${
                      s.val > 3000
                        ? 'bg-gradient-to-r from-red-500 to-amber-500'
                        : s.val > 1500
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6-DOF IMU Kinematics & Shock Level */}
      <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono">
              MPU-6050 6-DOF KINEMATICS
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
            SVM: {svmAcc.toFixed(2)} g
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">ACCELERATION (g)</span>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Ax:</span>
                <span className="text-slate-200">{(sample?.ax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ay:</span>
                <span className="text-slate-200">{(sample?.ay || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Az:</span>
                <span className="text-slate-200">{(sample?.az || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">GYROSCOPE (°/s)</span>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Gx:</span>
                <span className="text-slate-200">{(sample?.gx || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gy:</span>
                <span className="text-slate-200">{(sample?.gy || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gz:</span>
                <span className="text-slate-200">{(sample?.gz || 0).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Live Telemetry Bridge Card */}
      <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono">
              SUPABASE CLOUD BRIDGE
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                supabaseEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="text-[10px] font-mono text-slate-400">
              {supabaseEnabled ? 'BROADCASTING (1 Hz)' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-[11px] font-mono text-slate-400">
            <div>Device: <span className="text-slate-200">{supabaseBridge?.deviceId}</span></div>
            <div>Sent Packets: <span className="text-cyan-400">{supabaseBridge?.packetsSent || 0}</span></div>
          </div>
          <button
            onClick={() => setSupabaseEnabled(!supabaseEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shadow-md ${
              supabaseEnabled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {supabaseEnabled ? 'Disable Sync' : 'Enable Live Sync'}
          </button>
        </div>

        {supabaseBridge?.lastError && (
          <div className="mt-2 text-[10px] font-mono text-red-400 bg-red-950/40 p-1.5 rounded border border-red-900">
            Error: {supabaseBridge.lastError}
          </div>
        )}
      </div>
    </div>
  );
}
