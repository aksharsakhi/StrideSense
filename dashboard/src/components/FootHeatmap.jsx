import React from 'react';
import { Gauge, Sparkles } from 'lucide-react';

/**
 * Returns dynamic color based on normalized pressure (0.0 to 1.0)
 */
function getPressureColor(val) {
  if (val < 0.05) return 'rgba(30, 41, 59, 0.4)'; // Idle / Translucent
  if (val < 0.25) return 'rgba(0, 229, 255, 0.85)'; // Cyan
  if (val < 0.55) return 'rgba(16, 185, 129, 0.9)'; // Emerald
  if (val < 0.80) return 'rgba(245, 158, 11, 0.95)'; // Amber
  return 'rgba(244, 63, 94, 1.0)'; // Crimson (High impact)
}

function getGlowStyle(val) {
  if (val < 0.1) return 'none';
  if (val < 0.35) return '0 0 15px rgba(0, 229, 255, 0.5)';
  if (val < 0.70) return '0 0 20px rgba(245, 158, 11, 0.7)';
  return '0 0 25px rgba(244, 63, 94, 0.9)';
}

export default function FootHeatmap({ sensors = {} }) {
  const p1 = sensors.p1 || 0;
  const p2 = sensors.p2 || 0;
  const p3 = sensors.p3 || 0;
  const p4 = sensors.p4 || 0;
  const p5 = sensors.p5 || 0;
  const p6 = sensors.p6 || 0;

  // Normalize 12-bit ADC (0 - 4095) to 0.0 - 1.0
  const n1 = Math.min(1.0, p1 / 3800);
  const n2 = Math.min(1.0, p2 / 2800);
  const n3 = Math.min(1.0, p3 / 2400);
  const n4 = Math.min(1.0, p4 / 3600);
  const n5 = Math.min(1.0, p5 / 3800);
  const n6 = Math.min(1.0, p6 / 3200);

  const totalForce = p1 + p2 + p3 + p4 + p5 + p6;
  // Approximate Newtons for a 70kg adult (peak stance ~ 750 N)
  const estNewtons = Math.round((totalForce / 16000) * 750);

  const sensorNodes = [
    { id: 'S6', name: 'Hallux (Big Toe)', raw: p6, norm: n6, cx: 125, cy: 55, r: 24 },
    { id: 'S5', name: 'Forefoot Medial (Ball)', raw: p5, norm: n5, cx: 128, cy: 130, r: 28 },
    { id: 'S4', name: 'Forefoot Lateral (4-5th)', raw: p4, norm: n4, cx: 72, cy: 145, r: 26 },
    { id: 'S3', name: 'Midfoot Medial Arch', raw: p3, norm: n3, cx: 132, cy: 235, r: 22 },
    { id: 'S2', name: 'Midfoot Lateral', raw: p2, norm: n2, cx: 68, cy: 235, r: 23 },
    { id: 'S1', name: 'Calcaneus (Heel)', raw: p1, norm: n1, cx: 100, cy: 335, r: 34 }
  ];

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-white tracking-wide">Plantar Pressure</h2>
            <span className="badge badge-cyan text-xs">6x FSR Array</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time dynamic anatomical foot force mapping</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Est. Total Force</div>
          <div className="text-xl font-mono font-bold text-cyan-400">{estNewtons} <span className="text-xs text-slate-400">N</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
        {/* Anatomical Insole SVG */}
        <div className="md:col-span-6 flex justify-center relative py-2">
          <svg
            viewBox="0 0 200 420"
            className="w-48 sm:w-56 h-auto drop-shadow-2xl select-none"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0, 229, 255, 0.15))' }}
          >
            <defs>
              <linearGradient id="insoleOutline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>

              {/* Dynamic Radial Gradients for Hotspots */}
              {sensorNodes.map((s) => (
                <radialGradient key={`grad-${s.id}`} id={`glow-${s.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={getPressureColor(s.norm)} stopOpacity="0.95" />
                  <stop offset="60%" stopColor={getPressureColor(s.norm)} stopOpacity="0.65" />
                  <stop offset="100%" stopColor={getPressureColor(s.norm)} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Insole Chassis Contour */}
            <path
              d="M 98,15 
                 C 145,15 165,45 165,95 
                 C 165,145 158,185 145,225 
                 C 138,255 138,285 142,320 
                 C 146,355 135,395 100,395 
                 C 65,395 54,355 58,320 
                 C 62,285 62,255 55,225 
                 C 42,185 35,145 35,95 
                 C 35,45 55,15 98,15 Z"
              fill="url(#insoleOutline)"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="2.5"
            />

            {/* Inner Foot Arch Contour Grid Lines */}
            <path
              d="M 100,35 C 130,55 145,100 135,180 C 125,240 128,300 100,370"
              fill="none"
              stroke="rgba(0, 229, 255, 0.1)"
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />

            {/* Heatmap Sensor Hotspots */}
            {sensorNodes.map((s) => (
              <g key={s.id} className="transition-all duration-150">
                {/* Outer Glow Halo */}
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={s.r * (1 + s.norm * 0.4)}
                  fill={`url(#glow-${s.id})`}
                  style={{
                    filter: 'blur(4px)',
                    opacity: s.norm > 0.05 ? 0.9 : 0.2
                  }}
                />

                {/* Core Sensor Electrode */}
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={s.r * 0.75}
                  fill={getPressureColor(s.norm)}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  style={{
                    boxShadow: getGlowStyle(s.norm),
                    transition: 'all 0.15s ease-out'
                  }}
                />

                {/* Sensor ID Text */}
                <text
                  x={s.cx}
                  y={s.cy + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, monospace"
                  className="pointer-events-none select-none"
                >
                  {s.id}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Real-time FSR Sensor Meters */}
        <div className="md:col-span-6 flex flex-col gap-2.5">
          {sensorNodes.map((s) => (
            <div key={s.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 px-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPressureColor(s.norm) }}></span>
                  {s.id}: {s.name}
                </span>
                <span className="font-mono text-slate-400">
                  <span className="text-white font-bold">{s.raw}</span> / 4095
                </span>
              </div>
              {/* Progress Track */}
              <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.round(s.norm * 100)}%`,
                    backgroundColor: getPressureColor(s.norm),
                    boxShadow: getGlowStyle(s.norm)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800"></span> <span>Zero</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 ml-2"></span> <span>Low</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 ml-2"></span> <span>Moderate</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 ml-2"></span> <span>High</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 ml-2"></span> <span>Peak Strike</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Biomechanical Sampling: 50 Hz</span>
        </div>
      </div>
    </div>
  );
}
