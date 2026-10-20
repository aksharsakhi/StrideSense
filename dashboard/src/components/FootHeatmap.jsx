import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Scale, Activity, ArrowLeftRight, Footprints,
  Compass, Zap, RotateCcw, Eye, Target, Layers, Info
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';

/**
 * Returns dynamic color based on normalized pressure (0.0 to 1.0)
 */
function getPressureColor(val) {
  if (val < 0.05) return 'rgba(148, 163, 184, 0.22)'; // Idle / Translucent
  if (val < 0.25) return '#00e5ff'; // Cyan
  if (val < 0.55) return '#10b981'; // Emerald
  if (val < 0.80) return '#f59e0b'; // Amber
  return '#f43f5e'; // Crimson (High impact)
}

function getGlowStyle(val) {
  if (val < 0.1) return 'none';
  if (val < 0.35) return '0 0 15px rgba(0, 229, 255, 0.45)';
  if (val < 0.70) return '0 0 20px rgba(245, 158, 11, 0.65)';
  return '0 0 25px rgba(244, 63, 94, 0.85)';
}

export default function FootHeatmap({ sensors = {}, bilateral = null, telemetry = {} }) {
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'left' | 'right'
  const [displayMode, setDisplayMode] = useState('live'); // 'live' | 'cop' | 'peaks'

  // Extract Left Foot FSRs
  const leftP1 = sensors?.left?.p1 ?? sensors?.p1 ?? 0; // Left Heel
  const leftP2 = sensors?.left?.p2 ?? sensors?.p2 ?? 0; // Left Forefoot

  // Extract Right Foot FSRs
  const rightP1 = sensors?.right?.p1 ?? sensors?.p3 ?? 0; // Right Heel
  const rightP2 = sensors?.right?.p2 ?? sensors?.p4 ?? 0; // Right Forefoot

  // Peak impact tracking
  const [peaks, setPeaks] = useState({
    leftP1: 0,
    leftP2: 0,
    rightP1: 0,
    rightP2: 0
  });

  useEffect(() => {
    setPeaks((prev) => ({
      leftP1: Math.max(prev.leftP1, leftP1),
      leftP2: Math.max(prev.leftP2, leftP2),
      rightP1: Math.max(prev.rightP1, rightP1),
      rightP2: Math.max(prev.rightP2, rightP2)
    }));
  }, [leftP1, leftP2, rightP1, rightP2]);

  const handleResetPeaks = () => {
    nativeBridge.impactLight();
    setPeaks({
      leftP1: leftP1,
      leftP2: leftP2,
      rightP1: rightP1,
      rightP2: rightP2
    });
  };

  // Determine active values based on mode
  const isPeakMode = displayMode === 'peaks';
  const curLeftP1 = isPeakMode ? peaks.leftP1 : leftP1;
  const curLeftP2 = isPeakMode ? peaks.leftP2 : leftP2;
  const curRightP1 = isPeakMode ? peaks.rightP1 : rightP1;
  const curRightP2 = isPeakMode ? peaks.rightP2 : rightP2;

  // Normalize (0 - 2200 range represents active human stride)
  const nLHeel = Math.min(1.0, curLeftP1 / 2200);
  const nLForefoot = Math.min(1.0, curLeftP2 / 2200);
  const nRHeel = Math.min(1.0, curRightP1 / 2200);
  const nRForefoot = Math.min(1.0, curRightP2 / 2200);

  // Force Calculations
  const leftForceRaw = curLeftP1 + curLeftP2;
  const rightForceRaw = curRightP1 + curRightP2;
  const totalForceRaw = leftForceRaw + rightForceRaw;

  const leftNewtons = Math.round((leftForceRaw / 4400) * 340);
  const rightNewtons = Math.round((rightForceRaw / 4400) * 340);
  const totalNewtons = leftNewtons + rightNewtons;

  // Weight distribution
  let leftPct = 50.0;
  let rightPct = 50.0;
  if (totalForceRaw > 0) {
    leftPct = parseFloat(((leftForceRaw / totalForceRaw) * 100).toFixed(1));
    rightPct = parseFloat(((rightForceRaw / totalForceRaw) * 100).toFixed(1));
  } else if (bilateral?.leftPct) {
    leftPct = bilateral.leftPct;
    rightPct = bilateral.rightPct;
  }

  // Symmetry score
  const symmetry = totalForceRaw > 0
    ? Math.max(0, parseFloat((100 - Math.abs(leftPct - rightPct) * 2).toFixed(1)))
    : (bilateral?.symmetry || 98.4);

  // Center of Pressure (CoP) (-1.0 to +1.0)
  const copX = totalForceRaw > 0 ? (rightForceRaw - leftForceRaw) / totalForceRaw : 0;
  const copY = totalForceRaw > 0 ? ((curLeftP2 + curRightP2) - (curLeftP1 + curRightP1)) / totalForceRaw : 0;

  const isOnline = telemetry?.isOnline ?? (totalForceRaw > 0);

  // Current Dynamic Phase
  let phaseText = 'Double Stance (Balanced)';
  if (!isOnline || totalForceRaw === 0) {
    phaseText = 'Standby • Awaiting Stride';
  } else if (leftForceRaw > 400 && rightForceRaw < 200) {
    phaseText = 'Left Stance • Right Swing';
  } else if (rightForceRaw > 400 && leftForceRaw < 200) {
    phaseText = 'Right Stance • Left Swing';
  } else if (leftForceRaw < 150 && rightForceRaw < 150) {
    phaseText = 'Flight / Minimal Loading';
  }

  // 4 Square FSR Sensors (Unified Single ESP32 Bilateral Setup)
  const allFsrs = [
    {
      id: 'L-FSR 1', side: 'left', name: 'Left Heel FSR',
      raw: isOnline ? curLeftP1 : 0, norm: isOnline ? nLHeel : 0,
      newtons: Math.round((curLeftP1 / 2200) * 170),
      role: 'Left Calcaneus Strike (GPIO 36)'
    },
    {
      id: 'L-FSR 2', side: 'left', name: 'Left Forefoot FSR',
      raw: isOnline ? curLeftP2 : 0, norm: isOnline ? nLForefoot : 0,
      newtons: Math.round((curLeftP2 / 2200) * 170),
      role: 'Left Metatarsal Toe-Off (GPIO 39)'
    },
    {
      id: 'R-FSR 1', side: 'right', name: 'Right Heel FSR',
      raw: isOnline ? curRightP1 : 0, norm: isOnline ? nRHeel : 0,
      newtons: Math.round((curRightP1 / 2200) * 170),
      role: 'Right Calcaneus Strike (GPIO 34, Calibrated)'
    },
    {
      id: 'R-FSR 2', side: 'right', name: 'Right Forefoot FSR',
      raw: isOnline ? curRightP2 : 0, norm: isOnline ? nRForefoot : 0,
      newtons: Math.round((curRightP2 / 2200) * 170),
      role: 'Right Metatarsal Toe-Off (GPIO 35)'
    }
  ];

  // CoP Butterfly curve coordinates
  // Heel coordinate: (100, 305), Forefoot coordinate: (100, 125)
  // Arch mid-stance coordinate: curves slightly medial
  const leftCopMidX = 100 - (nLForefoot > nLHeel ? 12 : 6);
  const leftCopMidY = 215;

  const rightCopMidX = 100 + (nRForefoot > nRHeel ? 12 : 6);
  const rightCopMidY = 215;

  return (
    <div className="glass-panel p-5 sm:p-6 flex flex-col justify-between h-full animate-fade-in stagger-children">
      
      {/* ─── CARD HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Bilateral Pedobarography & Pressure Map
            </h2>
            <span className="badge badge-cyan text-[10px] font-mono">
              1x ESP32 • 4x FSR Bilateral
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calibrated dual-foot load distribution, Center of Pressure (CoP) trajectory, and impact forces
          </p>
        </div>

        {/* Display Mode & View Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Live vs CoP vs Peaks */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-[11px]">
            <button
              type="button"
              onClick={() => {
                nativeBridge.impactLight();
                setDisplayMode('live');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                displayMode === 'live'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Live Force
            </button>
            <button
              type="button"
              onClick={() => {
                nativeBridge.impactLight();
                setDisplayMode('cop');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                displayMode === 'cop'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CoP Butterfly
            </button>
            <button
              type="button"
              onClick={() => {
                nativeBridge.impactLight();
                setDisplayMode('peaks');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                displayMode === 'peaks'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Peak Spikes
            </button>
          </div>

          {/* Reset peaks if in peak mode */}
          {displayMode === 'peaks' && (
            <button
              type="button"
              onClick={handleResetPeaks}
              title="Reset Peak Force Retention"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 active-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* View Filter: Dual Feet vs Left vs Right */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'both'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('left')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'left'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              L
            </button>
            <button
              type="button"
              onClick={() => setViewMode('right')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'right'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              R
            </button>
          </div>
        </div>
      </div>

      {/* ─── BILATERAL BALANCE & COP TELEMETRY STRIP ─── */}
      <div className="bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-3.5 mb-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>LEFT FOOT</span>
            <span className="font-mono text-sm">{leftPct}%</span>
            <span className="text-[10px] text-slate-400 font-normal">({leftNewtons} N)</span>
          </span>

          <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Symmetry: {symmetry}%
          </span>

          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="text-[10px] text-slate-400 font-normal">({rightNewtons} N)</span>
            <span className="font-mono text-sm">{rightPct}%</span>
            <span>RIGHT FOOT</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </span>
        </div>

        {/* Dynamic Bidirectional Balance Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-150 rounded-l-full"
            style={{ width: `${leftPct}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-150 rounded-r-full"
            style={{ width: `${rightPct}%` }}
          />
          {/* Center 50% Marker */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-900 dark:bg-white z-10 opacity-70 transform -translate-x-1/2 shadow-sm" />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>Stance Phase: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{phaseText}</strong></span>
          </span>
          <span className="font-mono">
            CoP Drift: X {copX > 0 ? `+${copX.toFixed(2)}` : copX.toFixed(2)} • Y {copY > 0 ? `+${copY.toFixed(2)}` : copY.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ─── DUAL FOOT ANATOMICAL PEDOBAROGRAPHY VISUALIZER ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-auto">
        
        {/* Anatomical Left & Right Insoles with Native Unflipped Geometry */}
        <div className="md:col-span-7 flex items-center justify-center gap-4 sm:gap-8 py-2">
          
          {/* ══════ LEFT FOOT INSOLE ══════ */}
          {(viewMode === 'both' || viewMode === 'left') && (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Left Insole
              </span>
              <svg
                viewBox="0 0 200 420"
                className="w-36 sm:w-44 h-auto insole-svg-filter select-none"
              >
                {/* Left Insole Contour */}
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

                {/* CoP Butterfly Trajectory Curve (if in CoP mode or active) */}
                {displayMode === 'cop' && (
                  <g className="animate-fade-in">
                    <path
                      d={`M 100,305 Q ${leftCopMidX},${leftCopMidY} 100,125`}
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 4px #00e5ff)' }}
                    />
                    {/* Live CoP position dot */}
                    <circle
                      cx={100 + (copX * 25)}
                      cy={215 - (copY * 80)}
                      r="6"
                      fill="#00e5ff"
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }}
                    />
                  </g>
                )}

                {/* Left Forefoot FSR (L2) */}
                <g className="transition-all duration-150">
                  <rect
                    x={55} y={85} width={70} height={65} rx={12}
                    fill={getPressureColor(nLForefoot)}
                    opacity={nLForefoot > 0.05 ? 0.35 : 0.05}
                    style={{ filter: 'blur(8px)' }}
                  />
                  <rect
                    x={65} y={95} width={70} height={65} rx={12}
                    fill={getPressureColor(nLForefoot)}
                    stroke={nLForefoot > 0.05 ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                    strokeWidth={nLForefoot > 0.05 ? 2 : 1.5}
                    style={{ boxShadow: getGlowStyle(nLForefoot), transition: 'all 0.15s ease-out' }}
                  />
                  <text
                    x={100} y={124} textAnchor="middle" fontSize="11" fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                    className={`select-none pointer-events-none ${nLForefoot > 0.05 ? 'fill-white' : 'fill-slate-700 dark:fill-slate-300'}`}
                  >
                    L-FSR 2
                  </text>
                  <text
                    x={100} y={142} textAnchor="middle" fontSize="10" fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    className={`select-none pointer-events-none ${nLForefoot > 0.05 ? 'fill-white' : 'fill-slate-600 dark:fill-slate-400'}`}
                  >
                    {Math.round(nLForefoot * 100)}%
                  </text>
                </g>

                {/* Left Heel FSR (L1) */}
                <g className="transition-all duration-150">
                  <rect
                    x={55} y={265} width={70} height={65} rx={12}
                    fill={getPressureColor(nLHeel)}
                    opacity={nLHeel > 0.05 ? 0.35 : 0.05}
                    style={{ filter: 'blur(8px)' }}
                  />
                  <rect
                    x={65} y={275} width={70} height={65} rx={12}
                    fill={getPressureColor(nLHeel)}
                    stroke={nLHeel > 0.05 ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                    strokeWidth={nLHeel > 0.05 ? 2 : 1.5}
                    style={{ boxShadow: getGlowStyle(nLHeel), transition: 'all 0.15s ease-out' }}
                  />
                  <text
                    x={100} y={304} textAnchor="middle" fontSize="11" fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                    className={`select-none pointer-events-none ${nLHeel > 0.05 ? 'fill-white' : 'fill-slate-700 dark:fill-slate-300'}`}
                  >
                    L-FSR 1
                  </text>
                  <text
                    x={100} y={322} textAnchor="middle" fontSize="10" fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    className={`select-none pointer-events-none ${nLHeel > 0.05 ? 'fill-white' : 'fill-slate-600 dark:fill-slate-400'}`}
                  >
                    {Math.round(nLHeel * 100)}%
                  </text>
                </g>
              </svg>
            </div>
          )}

          {/* ══════ RIGHT FOOT INSOLE (Native Mirrored Path Geometry, Clean Text) ══════ */}
          {(viewMode === 'both' || viewMode === 'right') && (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Right Insole
              </span>
              <svg
                viewBox="0 0 200 420"
                className="w-36 sm:w-44 h-auto insole-svg-filter select-none"
              >
                {/* Right Insole Contour (Mirrored inside a clean group) */}
                <g transform="translate(200, 0) scale(-1, 1)">
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
                </g>

                {/* CoP Butterfly Trajectory Curve (Right foot) */}
                {displayMode === 'cop' && (
                  <g className="animate-fade-in">
                    <path
                      d={`M 100,305 Q ${rightCopMidX},${rightCopMidY} 100,125`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
                    />
                    {/* Live CoP position dot */}
                    <circle
                      cx={100 + (copX * 25)}
                      cy={215 - (copY * 80)}
                      r="6"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 8px #10b981)' }}
                    />
                  </g>
                )}

                {/* Right Forefoot FSR (R2) - Positioned with crystal clear un-mirrored text */}
                <g className="transition-all duration-150">
                  <rect
                    x={65} y={85} width={70} height={65} rx={12}
                    fill={getPressureColor(nRForefoot)}
                    opacity={nRForefoot > 0.05 ? 0.35 : 0.05}
                    style={{ filter: 'blur(8px)' }}
                  />
                  <rect
                    x={65} y={95} width={70} height={65} rx={12}
                    fill={getPressureColor(nRForefoot)}
                    stroke={nRForefoot > 0.05 ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                    strokeWidth={nRForefoot > 0.05 ? 2 : 1.5}
                    style={{ boxShadow: getGlowStyle(nRForefoot), transition: 'all 0.15s ease-out' }}
                  />
                  <text
                    x={100} y={124} textAnchor="middle" fontSize="11" fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                    className={`select-none pointer-events-none ${nRForefoot > 0.05 ? 'fill-white' : 'fill-slate-700 dark:fill-slate-300'}`}
                  >
                    R-FSR 2
                  </text>
                  <text
                    x={100} y={142} textAnchor="middle" fontSize="10" fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    className={`select-none pointer-events-none ${nRForefoot > 0.05 ? 'fill-white' : 'fill-slate-600 dark:fill-slate-400'}`}
                  >
                    {Math.round(nRForefoot * 100)}%
                  </text>
                </g>

                {/* Right Heel FSR (R1) - Positioned with crystal clear un-mirrored text */}
                <g className="transition-all duration-150">
                  <rect
                    x={65} y={265} width={70} height={65} rx={12}
                    fill={getPressureColor(nRHeel)}
                    opacity={nRHeel > 0.05 ? 0.35 : 0.05}
                    style={{ filter: 'blur(8px)' }}
                  />
                  <rect
                    x={65} y={275} width={70} height={65} rx={12}
                    fill={getPressureColor(nRHeel)}
                    stroke={nRHeel > 0.05 ? '#ffffff' : 'rgba(148, 163, 184, 0.4)'}
                    strokeWidth={nRHeel > 0.05 ? 2 : 1.5}
                    style={{ boxShadow: getGlowStyle(nRHeel), transition: 'all 0.15s ease-out' }}
                  />
                  <text
                    x={100} y={304} textAnchor="middle" fontSize="11" fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                    className={`select-none pointer-events-none ${nRHeel > 0.05 ? 'fill-white' : 'fill-slate-700 dark:fill-slate-300'}`}
                  >
                    R-FSR 1
                  </text>
                  <text
                    x={100} y={322} textAnchor="middle" fontSize="10" fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    className={`select-none pointer-events-none ${nRHeel > 0.05 ? 'fill-white' : 'fill-slate-600 dark:fill-slate-400'}`}
                  >
                    {Math.round(nRHeel * 100)}%
                  </text>
                </g>
              </svg>
            </div>
          )}
        </div>

        {/* ─── 4-CHANNEL FSR TELEMETRY GAUGES ─── */}
        <div className="md:col-span-5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-1 mb-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isPeakMode ? 'Peak Force Retention' : 'Real-Time Plantar Channels'}
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
              Total: {totalNewtons} N
            </span>
          </div>

          {allFsrs.map((s) => (
            <div
              key={s.id}
              className="bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-3 shadow-sm"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPressureColor(s.norm) }} />
                    {s.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{s.role}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-900 dark:text-white font-bold text-sm">{s.raw}</span>
                  <span className="text-slate-400 text-[10px]"> / 4095 ADC</span>
                  <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">{s.newtons} N</div>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
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

      {/* ─── FOOTER & PRESSURE LEGEND ─── */}
      <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Plantar Pressure:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-800" /> <span>0-5%</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 ml-1.5" /> <span>Low</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 ml-1.5" /> <span>Med</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 ml-1.5" /> <span>High</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 ml-1.5" /> <span>Impact Spike</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Single ESP32 Bilateral (GPIO 36, 39, 34, 35) • 10kΩ Voltage Dividers</span>
        </div>
      </div>
    </div>
  );
}
