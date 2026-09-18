import React from 'react';
import { Play, Flame, AlertTriangle, ShieldAlert, XCircle, Sliders, Armchair, UserCheck } from 'lucide-react';

export default function ScenarioDirector({
  currentScenario,
  onSelectScenario,
  fallState,
  alertCountdown,
  onCancelFall,
  manualMode,
  setManualMode,
  manualSensors,
  setManualSensors,
  showFootModel,
  setShowFootModel
}) {
  const scenarios = [
    {
      id: 'walking',
      name: 'Normal Walk',
      desc: '108 SPM Heel-to-Toe Stride',
      icon: Play,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30'
    },
    {
      id: 'running',
      name: 'Sprint Run',
      desc: '165 SPM Dynamic Forefoot Load',
      icon: Flame,
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/20 hover:bg-purple-900/30'
    },
    {
      id: 'pronation',
      name: 'Over-Pronation',
      desc: 'Medial Arch Collapse & -16° Roll',
      icon: AlertTriangle,
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20 hover:bg-amber-900/30'
    },
    {
      id: 'standing',
      name: 'Static Stand',
      desc: 'Bilateral Weight Balance (1.0g)',
      icon: UserCheck,
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30'
    },
    {
      id: 'sitting',
      name: 'Resting / Sitting',
      desc: 'Low Ground Reaction Force',
      icon: Armchair,
      color: 'border-slate-600/40 text-slate-300 bg-slate-900/40 hover:bg-slate-800/50'
    },
  ];

  return (
    <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            KINEMATIC SCENARIO DIRECTOR
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated Biomechanical Gait Test Vectors</p>
        </div>

        {/* 2-FSR Hardware Badge */}
        <div className="flex items-center space-x-1 bg-slate-950/90 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse mr-1" />
          <span>2x Square FSR Kit</span>
        </div>
      </div>

      {/* Fall Emergency Banner (if active) */}
      {fallState !== 'idle' && (
        <div className="bg-red-950/50 border-2 border-red-500 rounded-xl p-4 animate-pulse shadow-glow-danger flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-red-200 font-mono">
                {fallState === 'freefall' && 'FREE-FALL DROP DETECTED (<0.6g)'}
                {fallState === 'impact' && 'VIOLENT GROUND COLLISION IMPACT (>3.8g)'}
                {fallState === 'alert_pending' && `POST-FALL IMMOBILE TILT • CANCEL IN ${alertCountdown}s`}
                {fallState === 'dispatched' && 'FALL CONFIRMED: EMERGENCY DISPATCHED'}
              </div>
              <div className="text-xs text-red-300/80 mt-0.5">
                Dual-Trigger Algorithm running in ESP32 emulation
              </div>
            </div>
          </div>
          <button
            onClick={onCancelFall}
            className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs px-3.5 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95"
          >
            <XCircle className="w-4 h-4" />
            <span>PRESS SOS BUTTON</span>
          </button>
        </div>
      )}

      {/* Scenario Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = !manualMode && currentScenario === sc.id && fallState === 'idle';
          return (
            <button
              key={sc.id}
              onClick={() => {
                setManualMode(false);
                onSelectScenario(sc.id);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-glow-cyan'
                  : sc.color
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className="w-4 h-4" />
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <div className="font-semibold text-xs text-slate-100">{sc.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sc.desc}</div>
            </button>
          );
        })}

        {/* Fall Scenario Trigger Button */}
        <button
          onClick={() => {
            setManualMode(false);
            onSelectScenario('fall');
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            fallState !== 'idle'
              ? 'border-red-500 bg-red-950/60 shadow-glow-danger'
              : 'border-red-500/30 text-red-400 bg-red-950/20 hover:bg-red-900/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            {fallState !== 'idle' && (
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
            )}
          </div>
          <div className="font-semibold text-xs text-red-200">Trip & Fall</div>
          <div className="text-[10px] text-red-300/70 mt-0.5 leading-tight">Drop, Impact & Rest Tilt</div>
        </button>
      </div>

      {/* Manual Controls Toggle */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => setManualMode(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Enable Manual Hardware Slider Overrides</span>
          </label>
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showFootModel}
              onChange={(e) => setShowFootModel(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Show Ghost Foot Bones</span>
          </label>
        </div>

        {manualMode && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Heel FSR</span>
                <span className="text-cyan-400">{manualSensors.heel}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4095"
                value={manualSensors.heel}
                onChange={(e) => setManualSensors({ ...manualSensors, heel: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Forefoot FSR</span>
                <span className="text-cyan-400">{manualSensors.forefoot}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4095"
                value={manualSensors.forefoot}
                onChange={(e) => setManualSensors({ ...manualSensors, forefoot: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Pitch Tilt</span>
                <span className="text-cyan-400">{manualSensors.pitch}°</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={manualSensors.pitch}
                onChange={(e) => setManualSensors({ ...manualSensors, pitch: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Roll (Eversion)</span>
                <span className="text-cyan-400">{manualSensors.roll}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={manualSensors.roll}
                onChange={(e) => setManualSensors({ ...manualSensors, roll: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
