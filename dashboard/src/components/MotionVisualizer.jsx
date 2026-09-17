import React from 'react';
import { Compass, Move3d, Gauge } from 'lucide-react';

export default function MotionVisualizer({ imu = {} }) {
  const ax = imu.ax || 0;
  const ay = imu.ay || 0;
  const az = imu.az || 1.0;
  const gx = imu.gx || 0;
  const gy = imu.gy || 0;
  const gz = imu.gz || 0;
  const pitch = imu.pitch || 0;
  const roll = imu.roll || 0;
  const svmA = imu.svmA || 1.0;

  const isFreeFall = svmA < 0.6;
  const isHighImpact = svmA > 2.8;

  const gBarColor = isHighImpact
    ? 'from-rose-500 to-red-500'
    : (isFreeFall ? 'from-amber-400 to-amber-500' : 'from-cyan-500 to-emerald-400');
  const gTextColor = isHighImpact
    ? 'text-rose-600 dark:text-rose-400'
    : (isFreeFall ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400');

  return (
    <div className="glass-panel p-5 sm:p-6 animate-fade-in-scale flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-wide">
              IMU Kinematics
            </h2>
            <span className="badge badge-cyan text-[9px]">MPU-6050</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            6-DOF spatial acceleration & gyroscopic orientation
          </p>
        </div>
        <span className="badge badge-emerald text-[9px] flex items-center gap-1">
          <Compass className="w-3 h-3" />
          ±8g / ±1000°/s
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attitude Sphere */}
        <div className="metric-card flex flex-col items-center justify-center relative">
          <span className="absolute top-3 left-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Move3d className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Foot Attitude
          </span>

          <div className="relative w-[130px] h-[130px] rounded-full border-2 border-slate-300 dark:border-slate-700/60 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center my-4 overflow-hidden shadow-inner">
            {/* Grid lines */}
            <div className="absolute w-full h-[1px] bg-slate-300 dark:bg-slate-700/40" />
            <div className="absolute w-[1px] h-full bg-slate-300 dark:bg-slate-700/40" />

            {/* Horizon line */}
            <div
              className="absolute w-[150px] h-[2.5px] rounded-full transition-transform duration-100 ease-out"
              style={{
                transform: `rotate(${roll}deg) translateY(${pitch * 0.7}px)`,
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
                boxShadow: '0 0 12px var(--accent-cyan-glow)'
              }}
            />

            {/* Center dot */}
            <div className="w-3 h-3 rounded-full border border-white bg-cyan-500 z-10 shadow-glow-cyan" />

            {/* Cardinal labels */}
            <span className="absolute top-1.5 text-[8px] font-mono text-slate-400 dark:text-slate-600 font-bold">0°</span>
            <span className="absolute bottom-1.5 text-[8px] font-mono text-slate-400 dark:text-slate-600 font-bold">180°</span>
            <span className="absolute left-2 text-[8px] font-mono text-slate-400 dark:text-slate-600 font-bold">L</span>
            <span className="absolute right-2 text-[8px] font-mono text-slate-400 dark:text-slate-600 font-bold">R</span>
          </div>

          <div className="flex justify-around w-full text-xs font-mono pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            <div className="text-center">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-bold">Pitch</span>
              <span className="text-slate-900 dark:text-white font-bold text-sm">{pitch > 0 ? `+${pitch}` : pitch}°</span>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            <div className="text-center">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-bold">Roll</span>
              <span className="text-slate-900 dark:text-white font-bold text-sm">{roll > 0 ? `+${roll}` : roll}°</span>
            </div>
          </div>
        </div>

        {/* G-Force Meter */}
        <div className="metric-card flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-amber-500" />
              Impact Shock (SVM)
            </span>
            <span className={`font-mono text-base font-bold ${gTextColor}`}>
              {svmA.toFixed(2)}<span className="text-slate-400 font-normal text-xs ml-0.5">g</span>
            </span>
          </div>

          {/* G-Force bar */}
          <div className="my-4">
            <div className="relative w-full bg-slate-200 dark:bg-slate-800/70 rounded-full h-3.5 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${gBarColor} h-full rounded-full transition-all duration-150`}
                style={{ width: `${Math.min(100, (svmA / 4.5) * 100)}%` }}
              />
              <div className="absolute top-0 bottom-0 left-[13.3%] w-0.5 bg-amber-400/80" />
              <div className="absolute top-0 bottom-0 left-[62.2%] w-0.5 bg-rose-500/80" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5">
              <span>0g</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">0.6g</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">2.8g</span>
              <span>4.5g</span>
            </div>
          </div>

          {/* Triaxial raw values */}
          <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-3 border-t border-slate-200/60 dark:border-white/[0.05] text-center">
            {[
              { label: 'Ax', val: ax },
              { label: 'Ay', val: ay },
              { label: 'Az', val: az }
            ].map((axis) => (
              <div key={axis.label} className="bg-slate-100/70 dark:bg-slate-900/40 p-1 rounded-lg">
                <span className="text-slate-400 dark:text-slate-500 block text-[9px] font-bold">{axis.label}</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{axis.val.toFixed(2)}g</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gyroscope Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.05] flex flex-wrap justify-between items-center text-xs font-mono text-slate-500 dark:text-slate-400 gap-2">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Angular Velocity:</span>
        <div className="flex gap-3">
          {[
            { label: 'Gx', val: gx },
            { label: 'Gy', val: gy },
            { label: 'Gz', val: gz }
          ].map((g) => (
            <span key={g.label}>
              {g.label}: <span className="text-slate-800 dark:text-slate-200 font-semibold">{g.val > 0 ? `+${g.val}` : g.val}°/s</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
