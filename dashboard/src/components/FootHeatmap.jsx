import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Returns dynamic color based on normalized pressure (0.0 to 1.0)
 */
function getPressureColor(val) {
  if (val < 0.05) return 'rgba(148, 163, 184, 0.25)'; // Idle / Translucent
  if (val < 0.25) return '#00e5ff'; // Cyan
  if (val < 0.55) return '#10b981'; // Emerald
  if (val < 0.80) return '#f59e0b'; // Amber
  return '#f43f5e'; // Crimson (High impact)
}

function getGlowStyle(val) {
  if (val < 0.1) return 'none';
  if (val < 0.35) return '0 0 15px rgba(0, 229, 255, 0.5)';
  if (val < 0.70) return '0 0 20px rgba(245, 158, 11, 0.7)';
  return '0 0 25px rgba(244, 63, 94, 0.9)';
}

export default function FootHeatmap({ sensors = {} }) {
  const [hardwareMode, setHardwareMode] = useState('2_FSR');

  const p1 = sensors.p1 || 0;
  const p2 = sensors.p2 || 0;
  const p3 = sensors.p3 || 0;
  const p4 = sensors.p4 || 0;
  const p5 = sensors.p5 || (sensors.p4 ? Math.round((sensors.p4 + sensors.p5) / 2) : 0);
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

  // 2 Square FSRs (Matching Hardware Ordered)
  const dualFsrNodes = [
    { id: 'FSR 2', name: 'Square Forefoot FSR', role: 'Propulsion & Loading', raw: (p5 || p4), norm: nForefoot, x: 65, y: 95, w: 70, h: 65, rx: 12 },
    { id: 'FSR 1', name: 'Square Heel FSR', role: 'Initial Heel Strike Shock', raw: p1, norm: nHeel, x: 65, y: 275, w: 70, h: 65, rx: 12 }
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-wide">
              Plantar Pressure Map
            </h2>
            <span className="badge badge-cyan text-[10px]">
              {hardwareMode === '2_FSR' ? '2x FSR (Hardware)' : '6x FSR Array'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {hardwareMode === '2_FSR'
              ? 'Configured for dual square FSRs (Heel + Forefoot)'
              : 'Interpolated multi-point anatomical force mesh'}
          </p>
        </div>

        {/* Mode Toggle & Force Display */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/80 dark:bg-slate-900/90 border border-slate-300/60 dark:border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setHardwareMode('2_FSR')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 active-press ${
                hardwareMode === '2_FSR'
                  ? 'bg-cyan-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2-FSR
            </button>
            <button
              onClick={() => setHardwareMode('6_FSR')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 active-press ${
                hardwareMode === '6_FSR'
                  ? 'bg-cyan-500 text-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6-FSR
            </button>
          </div>

          <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Force</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-cyan-600 dark:text-cyan-400 leading-none">
              {estNewtons} <span className="text-xs text-slate-500 font-normal">N</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">

        {/* Anatomical Insole SVG */}
        <div className="md:col-span-6 flex justify-center relative py-2">
          <svg
            viewBox="0 0 200 420"
            className="w-48 sm:w-56 h-auto insole-svg-filter select-none"
          >
            <defs>
              <linearGradient id="insoleOutlineLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>

              <linearGradient id="insoleOutlineDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#080c14" />
              </linearGradient>

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
              className="insole-path transition-all duration-300"
              strokeWidth="2.5"
            />

            {/* Arch Guide */}
            <path
              d="M 100,35 C 130,55 145,100 135,180 C 125,240 128,300 100,370"
              fill="none"
              className="insole-arch-guide"
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />

            {/* Mode 1: 2x Square FSR Sensors */}
            {hardwareMode === '2_FSR' ? (
              <>
                {dualFsrNodes.map((s) => {
                  const isActive = s.norm > 0.05;
                  return (
                    <g key={s.id} className="transition-all duration-150">
                      {/* Aura */}
                      <rect
                        x={s.x - 10}
                        y={s.y - 10}
                        width={s.w + 20}
                        height={s.h + 20}
                        rx={s.rx + 6}
                        fill={getPressureColor(s.norm)}
                        opacity={isActive ? 0.4 : 0.05}
                        style={{ filter: 'blur(8px)' }}
                      />
                      {/* Body */}
                      <rect
                        x={s.x}
                        y={s.y}
                        width={s.w}
                        height={s.h}
                        rx={s.rx}
                        fill={getPressureColor(s.norm)}
                        stroke={isActive ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                        strokeWidth={isActive ? 2 : 1.5}
                        strokeOpacity={isActive ? 0.9 : 0.4}
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
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono, monospace"
                        className={`select-none pointer-events-none ${
                          isActive ? 'fill-white' : 'fill-slate-700 dark:fill-slate-300'
                        }`}
                        style={{ filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' : 'none' }}
                      >
                        {s.id}
                      </text>
                      {/* Percentage */}
                      <text
                        x={s.x + s.w / 2}
                        y={s.y + s.h / 2 + 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="Inter, sans-serif"
                        className={`select-none pointer-events-none ${
                          isActive ? 'fill-white' : 'fill-slate-600 dark:fill-slate-400'
                        }`}
                        style={{ filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' : 'none' }}
                      >
                        {Math.round(s.norm * 100)}%
                      </text>
                    </g>
                  );
                })}
              </>
            ) : (
              /* Mode 2: 6x FSR Sensor Array */
              <>
                {fullSensorNodes.map((s) => {
                  const isActive = s.norm > 0.05;
                  return (
                    <g key={s.id} className="transition-all duration-150">
                      <circle
                        cx={s.cx}
                        cy={s.cy}
                        r={s.r * (1 + s.norm * 0.3)}
                        fill={getPressureColor(s.norm)}
                        style={{ filter: 'blur(5px)', opacity: isActive ? 0.85 : 0.2 }}
                      />
                      <circle
                        cx={s.cx}
                        cy={s.cy}
                        r={s.r * 0.75}
                        fill={getPressureColor(s.norm)}
                        stroke={isActive ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                        strokeWidth={isActive ? 1.5 : 1}
                        strokeOpacity={isActive ? 0.8 : 0.4}
                      />
                      <text
                        x={s.cx}
                        y={s.cy + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono, monospace"
                        className={`select-none pointer-events-none ${
                          isActive ? 'fill-white' : 'fill-slate-700 dark:fill-slate-300'
                        }`}
                        style={{ filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' : 'none' }}
                      >
                        {s.id}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>

        {/* Force Meters */}
        <div className="md:col-span-6 flex flex-col gap-3">
          {hardwareMode === '2_FSR' ? (
            dualFsrNodes.map((s) => (
              <div
                key={s.id}
                className="bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPressureColor(s.norm) }} />
                      {s.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{s.role}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-900 dark:text-white font-bold text-sm">{s.raw}</span>
                    <span className="text-slate-400"> / 4095</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden mt-1">
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
              <div
                key={s.id}
                className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5 px-3"
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPressureColor(s.norm) }} />
                    {s.id}: {s.name}
                  </span>
                  <span className="font-mono text-slate-500">
                    <span className="text-slate-900 dark:text-white font-bold">{s.raw}</span> / 4095
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800/90 rounded-full h-2 overflow-hidden">
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

      {/* Legend & Calibration Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Force:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-800" /> <span>Zero</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 ml-1.5" /> <span>Low</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 ml-1.5" /> <span>Med</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 ml-1.5" /> <span>High</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 ml-1.5" /> <span>Peak</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>ADC Range: 0 - 3.3V (10kΩ Divider)</span>
        </div>
      </div>
    </div>
  );
}
