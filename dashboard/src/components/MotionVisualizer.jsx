import React from 'react';
import { Compass, Move3d, ShieldAlert } from 'lucide-react';

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

  // Threshold flags
  const isFreeFall = svmA < 0.6;
  const isHighImpact = svmA > 2.8;

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-white tracking-wide">Kinematics & IMU</h2>
            <span className="badge badge-cyan text-xs">MPU-6050</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">6-DOF spatial acceleration & gyroscopic orientation</p>
        </div>
        <span className="badge badge-emerald text-xs flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" />
          ±8g / ±1000°/s
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        {/* Foot Pitch & Roll Horizon Sphere */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 absolute top-3 left-3 flex items-center gap-1">
            <Move3d className="w-3.5 h-3.5 text-cyan-400" />
            Foot Attitude
          </span>

          <div className="relative w-32 h-32 rounded-full border-2 border-slate-700/80 bg-slate-950 flex items-center justify-center my-3 overflow-hidden shadow-inner">
            {/* Pitch / Roll Animated Horizon Line */}
            <div
              className="absolute w-44 h-0.5 bg-cyan-400/80 transition-transform duration-100 ease-out"
              style={{
                transform: `rotate(${roll}deg) translateY(${pitch * 0.8}px)`,
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.8)'
              }}
            />
            {/* Center crosshair */}
            <div className="w-2.5 h-2.5 rounded-full border border-white/60 bg-cyan-400/40 z-10" />
            <div className="absolute top-1 text-[9px] font-mono text-slate-500">0°</div>
            <div className="absolute bottom-1 text-[9px] font-mono text-slate-500">180°</div>
          </div>

          <div className="flex justify-around w-full text-xs font-mono mt-1">
            <div className="text-center">
              <span className="text-slate-500 block text-[10px]">Pitch</span>
              <span className="text-white font-bold">{pitch > 0 ? `+${pitch}` : pitch}°</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block text-[10px]">Roll</span>
              <span className="text-white font-bold">{roll > 0 ? `+${roll}` : roll}°</span>
            </div>
          </div>
        </div>

        {/* Signal Vector Magnitude & G-Force Meter */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Impact Shock (SVM)
            </span>
            <span className="font-mono text-xs text-slate-400">
              <span className={`font-bold ${isHighImpact ? 'text-rose-400' : (isFreeFall ? 'text-amber-400' : 'text-cyan-400')}`}>
                {svmA.toFixed(2)}
              </span> g
            </span>
          </div>

          {/* G-Force Level Bar with threshold marks */}
          <div className="my-3">
            <div className="relative w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  isHighImpact ? 'bg-rose-500 shadow-glow-rose' : (isFreeFall ? 'bg-amber-400' : 'bg-cyan-500')
                }`}
                style={{ width: `${Math.min(100, (svmA / 4.5) * 100)}%` }}
              />
              {/* Threshold Indicators */}
              <div className="absolute top-0 bottom-0 left-[13%] w-0.5 bg-amber-400/70" title="Free fall (<0.6g)" />
              <div className="absolute top-0 bottom-0 left-[62%] w-0.5 bg-rose-500/70" title="Impact Shock (>2.8g)" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0g</span>
              <span className="text-amber-400">0.6g (Free-fall)</span>
              <span className="text-rose-400">2.8g (Impact)</span>
              <span>4.5g</span>
            </div>
          </div>

          {/* Triaxial Raw Values */}
          <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-2 border-t border-slate-800/80 text-center">
            <div>
              <span className="text-slate-500 block text-[9px]">Ax</span>
              <span className="text-slate-300">{ax.toFixed(2)}g</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Ay</span>
              <span className="text-slate-300">{ay.toFixed(2)}g</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Az</span>
              <span className="text-slate-300">{az.toFixed(2)}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gyroscope Rates Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Angular Velocity:</span>
        <div className="flex gap-4">
          <span>Gx: <span className="text-slate-200">{gx > 0 ? `+${gx}` : gx}°/s</span></span>
          <span>Gy: <span className="text-slate-200">{gy > 0 ? `+${gy}` : gy}°/s</span></span>
          <span>Gz: <span className="text-slate-200">{gz > 0 ? `+${gz}` : gz}°/s</span></span>
        </div>
      </div>
    </div>
  );
}
