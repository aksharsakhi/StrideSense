import React, { useState } from 'react';
import { Gauge, Sparkles, SlidersHorizontal, Check } from 'lucide-react';

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
  const [hardwareMode, setHardwareMode] = useState('2_FSR'); // '2_FSR' (Matching Order) or '6_FSR'

  const p1 = sensors.p1 || 0; // Heel FSR (Ordered)
  const p2 = sensors.p2 || 0;
  const p3 = sensors.p3 || 0;
  const p4 = sensors.p4 || 0;
  const p5 = sensors.p5 || (sensors.p4 ? Math.round((sensors.p4 + sensors.p5)/2) : 0); // Forefoot FSR (Ordered)
  const p6 = sensors.p6 || 0;

  // Normalize 12-bit ADC (0 - 4095)
  const nHeel = Math.min(1.0, p1 / 3800);
  const nForefoot = Math.min(1.0, (p5 || p4) / 3800);

  const n1 = nHeel;
  const n2 = Math.min(1.0, p2 / 2800);
  const n3 = Math.min(1.0, p3 / 2400);
  const n4 = Math.min(1.0, p4 / 3600);
  const n5 = nForefoot;
  const n6 = Math.min(1.0, p6 / 3200);

  const totalForce = p1 + (p5 || p4);
  const estNewtons = Math.round((totalForce / 8000) * 700);

  // 2 Square FSRs (Matching Exact User Order)
  const dualFsrNodes = [
    { id: 'FSR 2', name: 'Square Forefoot FSR', role: 'Midstance Loading & Propulsion', raw: (p5 || p4), norm: nForefoot, x: 65, y: 95, w: 70, h: 65, rx: 12 },
    { id: 'FSR 1', name: 'Square Heel FSR', role: 'Initial Contact & Heel Strike Shock', raw: p1, norm: nHeel, x: 65, y: 275, w: 70, h: 65, rx: 12 }
  ];

  // Full 6 FSR Nodes
  const fullSensorNodes = [
    { id: 'S6', name: 'Hallux (Big Toe)', raw: p6, norm: n6, cx: 125, cy: 55, r: 24 },
    { id: 'S5', name: 'Forefoot Medial', raw: p5, norm: n5, cx: 128, cy: 130, r: 28 },
    { id: 'S4', name: 'Forefoot Lateral', raw: p4, norm: n4, cx: 72, cy: 145, r: 26 },
    { id: 'S3', name: 'Midfoot Medial', raw: p3, norm: n3, cx: 132, cy: 235, r: 22 },
    { id: 'S2', name: 'Midfoot Lateral', raw: p2, norm: n2, cx: 68, cy: 235, r: 23 },
    { id: 'S1', name: 'Calcaneus (Heel)', raw: p1, norm: n1, cx: 100, cy: 335, r: 34 }
  ];

  return (
    <div className="glass-panel p-5 sm:p-6 flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-wide">Plantar Pressure Map</h2>
            <span className="badge badge-cyan text-[10px] sm:text-xs">
              {hardwareMode === '2_FSR' ? '2x Square FSR (Hardware Match)' : '6x FSR Array'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {hardwareMode === '2_FSR'
              ? 'Configured for your 2x Square FSR sensors (Heel + Forefoot)'
              : 'Multi-point interpolated anatomical force mesh'}
          </p>
        </div>

        {/* Hardware Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setHardwareMode('2_FSR')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                hardwareMode === '2_FSR' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              2-FSR (Ordered)
            </button>
            <button
              onClick={() => setHardwareMode('6_FSR')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                hardwareMode === '6_FSR' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              6-FSR
            </button>
          </div>

          <div className="text-right pl-2 border-l border-slate-800">
            <div className="text-[10px] text-slate-400">Total Force</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-cyan-400">
              {estNewtons} <span className="text-xs text-slate-400">N</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualizer */}
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
                <stop offset="100%" stopColor="#080c14" />
              </linearGradient>

              {/* Dynamic Gradients */}
              <radialGradient id="grad-heel" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getPressureColor(nHeel)} stopOpacity="0.95" />
                <stop offset="60%" stopColor={getPressureColor(nHeel)} stopOpacity="0.65" />
                <stop offset="100%" stopColor={getPressureColor(nHeel)} stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-forefoot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={getPressureColor(nForefoot)} stopOpacity="0.95" />
                <stop offset="60%" stopColor={getPressureColor(nForefoot)} stopOpacity="0.65" />
                <stop offset="100%" stopColor={getPressureColor(nForefoot)} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Insole Contour */}
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
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2.5"
            />

            {/* Insole Internal Arch Guide */}
            <path
              d="M 100,35 C 130,55 145,100 135,180 C 125,240 128,300 100,370"
              fill="none"
              stroke="rgba(0, 229, 255, 0.15)"
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />

            {/* Mode 1: 2x Square FSR Sensors (Matching Hardware Ordered) */}
            {hardwareMode === '2_FSR' ? (
              <>
                {dualFsrNodes.map((s) => (
                  <g key={s.id} className="transition-all duration-150">
                    {/* Glowing Aura */}
                    <rect
                      x={s.x - 10}
                      y={s.y - 10}
                      width={s.w + 20}
                      height={s.h + 20}
                      rx={s.rx + 6}
                      fill={getPressureColor(s.norm)}
                      opacity={s.norm > 0.05 ? 0.35 : 0.08}
                      style={{ filter: 'blur(8px)' }}
                    />
                    {/* Physical Square FSR Body */}
                    <rect
                      x={s.x}
                      y={s.y}
                      width={s.w}
                      height={s.h}
                      rx={s.rx}
                      fill={getPressureColor(s.norm)}
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeOpacity="0.6"
                      style={{
                        boxShadow: getGlowStyle(s.norm),
                        transition: 'all 0.15s ease-out'
                      }}
                    />
                    {/* Label */}
                    <text
                      x={s.x + s.w / 2}
                      y={s.y + s.h / 2 - 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      className="select-none pointer-events-none"
                    >
                      {s.id}
                    </text>
                    <text
                      x={s.x + s.w / 2}
                      y={s.y + s.h / 2 + 12}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="600"
                      opacity="0.85"
                      fontFamily="Inter, sans-serif"
                      className="select-none pointer-events-none"
                    >
                      {Math.round(s.norm * 100)}%
                    </text>
                  </g>
                ))}
              </>
            ) : (
              /* Mode 2: 6x FSR Sensor Hotspots */
              <>
                {fullSensorNodes.map((s) => (
                  <g key={s.id} className="transition-all duration-150">
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={s.r * (1 + s.norm * 0.3)}
                      fill={getPressureColor(s.norm)}
                      style={{ filter: 'blur(5px)', opacity: s.norm > 0.05 ? 0.8 : 0.2 }}
                    />
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={s.r * 0.75}
                      fill={getPressureColor(s.norm)}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeOpacity="0.5"
                    />
                    <text
                      x={s.cx}
                      y={s.cy + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      className="select-none pointer-events-none"
                    >
                      {s.id}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>

        {/* Real-Time Force Meters */}
        <div className="md:col-span-6 flex flex-col gap-3">
          {hardwareMode === '2_FSR' ? (
            dualFsrNodes.map((s) => (
              <div key={s.id} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPressureColor(s.norm) }}></span>
                      {s.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{s.role}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-white font-bold text-sm">{s.raw}</span>
                    <span className="text-slate-500"> / 4095</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mt-1">
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
            ))
          ) : (
            fullSensorNodes.map((s) => (
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
                <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.round(s.norm * 100)}%`,
                      backgroundColor: getPressureColor(s.norm)
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Force Intensity:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800"></span> <span>Zero</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 ml-2"></span> <span>Low</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 ml-2"></span> <span>Medium</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 ml-2"></span> <span>High</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 ml-2"></span> <span>Impact Peak</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 mt-1 sm:mt-0">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Calibrated Dynamic Range: 0 - 3.3V (10kΩ Divider)</span>
        </div>
      </div>
    </div>
  );
}
