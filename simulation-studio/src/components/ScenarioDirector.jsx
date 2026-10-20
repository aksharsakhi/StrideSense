import React from 'react';
import {
  Play, Pause, RotateCcw, Flame, AlertTriangle, ShieldAlert,
  XCircle, Sliders, Armchair, UserCheck, FastForward, Clock,
  Footprints, ShieldCheck, Zap, Activity, Info, HeartPulse, Bandage
} from 'lucide-react';

export default function ScenarioDirector({
  // Simulation loop controls
  isRunning,
  onToggleRunning,
  simSpeed,
  onChangeSpeed,
  onResetSimulation,
  elapsedTime = 0,
  frameCount = 0,

  // Scenario state
  currentScenario,
  onSelectScenario,
  fallState,
  alertCountdown,
  onCancelFall,
  stumbleState,
  stumbleMessage,

  // Hardware overrides
  manualMode,
  setManualMode,
  manualSensors,
  setManualSensors,
  showFootModel,
  setShowFootModel
}) {
  // ─── 1. WALKING & LOCOMOTION GAIT PATTERNS ───
  const walkingScenarios = [
    {
      id: 'walking',
      name: 'Normal Walking',
      badge: '108 SPM',
      desc: 'Balanced heel-to-toe stride with rhythmic FSR1 & FSR2 transfer',
      specs: 'Cadence: 108 • Peak Accel: ~1.4g • Balanced',
      icon: Footprints,
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30'
    },
    {
      id: 'elderly_shuffle',
      name: 'Elderly Shuffling Walk',
      badge: '70 SPM • Cautious',
      desc: 'Senescent gait: low ground clearance (<3.5cm scraping), flat landing, prolonged stance (74%), & micro-tremor',
      specs: 'Cadence: 70 • Floor Scraping • Flat Strike',
      icon: HeartPulse,
      color: 'border-amber-400/40 text-amber-300 bg-amber-950/20 hover:bg-amber-900/30'
    },
    {
      id: 'post_op_limp',
      name: 'Severe Post-Operative Limp',
      badge: '84 SPM • 54% Sym',
      desc: 'Guarded antalgic gait: operated leg carries 20% load with hurried escape; healthy leg absorbs 80% heavy shock',
      specs: 'Asymmetry: 54.5% • Operated Load: 22%',
      icon: Bandage,
      color: 'border-rose-400/40 text-rose-300 bg-rose-950/20 hover:bg-rose-900/30'
    },
    {
      id: 'running',
      name: 'Sprint Running',
      badge: '165 SPM',
      desc: 'Forefoot-dominant dynamic strike with high vertical flight acceleration',
      specs: 'Cadence: 165 • Peak Accel: ~3.3g • Forefoot FSR2',
      icon: Flame,
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/20 hover:bg-purple-900/30'
    },
    {
      id: 'pronation',
      name: 'Over-Pronation Walk',
      badge: '-16° Inward Roll',
      desc: 'Medial arch inward collapse with abnormal lateral-to-medial force bias on right foot',
      specs: 'Roll: -16° • Asymmetric • Medial Load Bias',
      icon: Activity,
      color: 'border-yellow-500/40 text-yellow-400 bg-yellow-950/20 hover:bg-yellow-900/30'
    },
  ];

  // ─── 2. FALL & HAZARD SIMULATION VECTORS ───
  const fallScenarios = [
    {
      id: 'stumble',
      name: 'Half Fall (Stumble & Catch)',
      badge: 'Near-Fall Catch',
      desc: 'Sudden trip shock & pitch loss, caught by lunging forefoot step with zero false alarm',
      specs: 'Shock: ~2.8g • Corrective Catch • Auto-Recovery',
      icon: AlertTriangle,
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20 hover:bg-amber-900/30',
      isStumble: true
    },
    {
      id: 'fall',
      name: 'Catastrophic Fall (Dual-Trigger)',
      badge: 'Dual-Trigger SOS',
      desc: 'Freefall drop (<0.5g) followed by violent impact (>7g) and motionless tilt',
      specs: 'Drop: <0.5g • Impact: >7.5g • 15s SOS Timer',
      icon: ShieldAlert,
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/20 hover:bg-rose-900/30',
      isFall: true
    },
  ];

  // ─── 3. STATIC POSTURAL BASELINES ───
  const posturalScenarios = [
    {
      id: 'standing',
      name: 'Static Standing',
      badge: '1.0g Gravity',
      desc: 'Bilateral 50/50 ground reaction force balance, zero pitch/roll tilt',
      specs: 'Cadence: 0 • Static 1.0g • Heel+Ball Loaded',
      icon: UserCheck,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30'
    },
    {
      id: 'sitting',
      name: 'Sitting / Resting',
      badge: 'Unloaded',
      desc: 'Minimal ground reaction force (<80 ADC), foot at resting angle',
      specs: 'Cadence: 0 • Force <100 ADC • Sedentary',
      icon: Armchair,
      color: 'border-slate-600/40 text-slate-300 bg-slate-900/40 hover:bg-slate-800/50'
    },
  ];

  // Helper card renderer
  const renderCard = (sc) => {
    const Icon = sc.icon;
    const isCurrent = !manualMode && currentScenario === sc.id && (sc.id !== 'fall' || fallState !== 'idle');

    return (
      <button
        key={sc.id}
        onClick={() => {
          setManualMode(false);
          onSelectScenario(sc.id);
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
          isCurrent
            ? sc.isFall
              ? 'border-rose-500 bg-rose-950/40 shadow-glow-rose ring-1 ring-rose-500/50'
              : sc.isStumble
              ? 'border-amber-500 bg-amber-950/40 shadow-glow-amber ring-1 ring-amber-500/50'
              : 'border-cyan-400 bg-cyan-950/40 shadow-glow-cyan ring-1 ring-cyan-400/50'
            : sc.color
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/60">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-100">{sc.name}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300 whitespace-nowrap">
              {sc.badge}
            </span>
          </div>
          <div className="text-[11px] text-slate-300/90 leading-snug">{sc.desc}</div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 truncate pr-2">{sc.specs}</span>
          <span className={`font-bold shrink-0 transition-colors ${
            isCurrent ? 'text-cyan-300' : 'text-slate-500 group-hover:text-cyan-400'
          }`}>
            {isCurrent ? '● ACTIVE' : '▶ START'}
          </span>
        </div>
      </button>
    );
  };

  // Format elapsed time MM:SS
  const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
  const secs = Math.floor(elapsedTime % 60).toString().padStart(2, '0');

  return (
    <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col space-y-5">
      {/* ─── MASTER SIMULATION CONTROLLER BAR ─── */}
      <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 shadow-lg ${
              isRunning
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 animate-pulse'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-black" />
                <span>PAUSE SIM</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                <span>START SIM</span>
              </>
            )}
          </button>

          <button
            onClick={onResetSimulation}
            title="Reset Simulation Clock & Posture"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs font-semibold border border-slate-700/80 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>RESET</span>
          </button>
        </div>

        {/* Speed Multipliers */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <span className="text-[10px] text-slate-500 px-1.5 uppercase font-bold">Speed:</span>
          {[
            { label: '0.5x', val: 0.5 },
            { label: '1.0x', val: 1.0 },
            { label: '2.0x', val: 2.0 },
          ].map((sp) => (
            <button
              key={sp.val}
              onClick={() => onChangeSpeed(sp.val)}
              className={`px-2 py-1 rounded text-xs transition-all ${
                simSpeed === sp.val
                  ? 'bg-cyan-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Live Engine Telemetry Strip */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-300 tabular-nums">{mins}:{secs}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-3">
            <span>50 Hz</span>
            <span className="text-slate-600">•</span>
            <span className="tabular-nums text-slate-300">{frameCount} frames</span>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
            title={isRunning ? 'Simulation Running' : 'Simulation Paused'}
          />
        </div>
      </div>

      {/* ─── SECTION HEADER ─── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h2 className="text-xs font-bold text-slate-200 tracking-wider flex items-center gap-2 font-mono">
            <Sliders className="w-4 h-4 text-cyan-400" />
            BIOMECHANICAL GAIT PATTERNS & FALL SIMULATION VECTORS
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any pattern to immediately inject realistic kinematics and verify edge algorithm behavior
          </p>
        </div>

        {/* 2-FSR Hardware Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-950/90 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>2-FSR Array (GPIO 36 & 39)</span>
        </div>
      </div>

      {/* ─── CATASTROPHIC FALL EMERGENCY BANNER (If Active) ─── */}
      {fallState !== 'idle' && (
        <div className="bg-rose-950/60 border-2 border-rose-500 rounded-xl p-4 animate-pulse shadow-glow-rose flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-rose-200 font-mono">
                {fallState === 'freefall' && 'STAGE 1: FREE-FALL DROP (<0.5g) DETECTED'}
                {fallState === 'impact' && 'STAGE 2: VIOLENT FLOOR COLLISION IMPACT (>7.5g)'}
                {fallState === 'alert_pending' && `STAGE 3: IMMOBILE TILT • SOS GRACE COUNTDOWN: ${alertCountdown}s`}
                {fallState === 'dispatched' && 'STAGE 4: EMERGENCY ALERT SENT VIA SUPABASE'}
              </div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Dual-Trigger Algorithm: Microgravity Drop + Impact Shock + Tilt Angle Validation
              </div>
            </div>
          </div>
          <button
            onClick={onCancelFall}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs px-4 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <XCircle className="w-4 h-4" />
            <span>PRESS SOS TO CANCEL</span>
          </button>
        </div>
      )}

      {/* ─── STUMBLE / HALF-FALL STATUS TOAST (If Active) ─── */}
      {currentScenario === 'stumble' && stumbleState !== 'idle' && (
        <div className="bg-amber-950/50 border border-amber-500/60 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <div className="text-xs font-bold text-amber-200 font-mono">
                {stumbleState === 'trip' && 'HALF FALL: Sudden Forward Trip & Pitch Drop (<0.5s)'}
                {stumbleState === 'catch' && 'HALF FALL: Dynamic Forefoot Lunge & Shock Absorbed (>2.8g)'}
                {stumbleState === 'recovering' && 'HALF FALL: Postural Righting Reflex Stabilizing Foot'}
                {stumbleState === 'recovered' && 'HALF FALL: Recovered ✓ Zero False Alarm Triggered'}
              </div>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                {stumbleMessage || 'Subject safely caught balance on Forefoot Ball (FSR2)'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-900/60 text-amber-300 border border-amber-700/60 px-2.5 py-1 rounded font-semibold whitespace-nowrap">
            NO DISPATCH (SAFE)
          </span>
        </div>
      )}

      {/* ─── GROUP 1: WALKING & LOCOMOTION GAIT PATTERNS (SEPARATE SECTION) ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Footprints className="w-4 h-4" />
            <span>Walking & Locomotion Gait Patterns</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            5 Scenarios • Normal & Pathological
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {walkingScenarios.map(renderCard)}
        </div>
      </div>

      {/* ─── GROUP 2: FALL & HAZARD SIMULATION VECTORS (SEPARATE SECTION) ─── */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Fall & Emergency Hazard Vectors</span>
          </div>
          <span className="text-[10px] font-mono text-rose-400/80 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
            2 Safety Vectors • Dual-Trigger & Near-Fall Catch
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fallScenarios.map(renderCard)}
        </div>
      </div>

      {/* ─── GROUP 3: POSTURAL & REST STATES (SEPARATE SECTION) ─── */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Postural Baselines & Sedentary States</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Static Gravity & Unloaded Foot
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {posturalScenarios.map(renderCard)}
        </div>
      </div>

      {/* ─── MANUAL HARDWARE OVERRIDES & GHOST BONES ─── */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
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
            <span>Show Ghost Foot Skeletal Bones</span>
          </label>
        </div>

        {manualMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs animate-fade-in">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Heel FSR (GPIO 36)</span>
                <span className="text-cyan-400 font-bold">{manualSensors.heel}</span>
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
                <span>Forefoot FSR (GPIO 39)</span>
                <span className="text-cyan-400 font-bold">{manualSensors.forefoot}</span>
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
                <span>Pitch Tilt Angle</span>
                <span className="text-cyan-400 font-bold">{manualSensors.pitch}°</span>
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
                <span className="text-cyan-400 font-bold">{manualSensors.roll}°</span>
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
