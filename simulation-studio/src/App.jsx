import React, { useState, useEffect, useRef } from 'react';
import { PhysicsEngine } from './services/physicsEngine';
import { extractFeatures, runTinyMLInference } from './services/tinyMLEval';
import { SupabaseBridge } from './services/supabaseBridge';
import Viewport3D from './components/Viewport3D';
import ScenarioDirector from './components/ScenarioDirector';
import TelemetryGauges from './components/TelemetryGauges';
import { Zap, Activity, ShieldCheck, Cpu, Terminal, ExternalLink } from 'lucide-react';

export default function App() {
  const engineRef = useRef(null);
  const bridgeRef = useRef(null);

  // Core state
  const [currentSample, setCurrentSample] = useState(null);
  const [currentInference, setCurrentInference] = useState(null);
  const [scenario, setScenario] = useState('walking');
  const [fallState, setFallState] = useState('idle');
  const [alertCountdown, setAlertCountdown] = useState(15);
  const [showFootModel, setShowFootModel] = useState(true);

  // Manual overrides
  const [manualMode, setManualMode] = useState(false);
  const [manualSensors, setManualSensors] = useState({
    heel: 1200,
    forefoot: 1500,
    pitch: 0,
    roll: 0,
    svmAcc: 1.0
  });

  // Supabase cloud live sync (enabled by default)
  const [supabaseEnabled, setSupabaseEnabled] = useState(true);

  // Accumulated metrics
  const [stats, setStats] = useState({
    steps: 1420,
    cadence: 108.0,
    symmetry: 97.4,
    fallAlert: false
  });

  // Previous phase for step counting
  const prevPhaseRef = useRef('');

  // Initialize engine and bridge
  useEffect(() => {
    const engine = new PhysicsEngine();
    const bridge = new SupabaseBridge();
    engineRef.current = engine;
    bridgeRef.current = bridge;

    // 50 Hz Kinematic Loop (20 ms interval)
    const interval = setInterval(() => {
      // Sync manual settings
      engine.manualOverride = manualMode;
      engine.manualSensors = manualSensors;

      // Advance physics step
      const sample = engine.step();
      setCurrentSample(sample);
      setFallState(engine.fallState);
      setAlertCountdown(engine.alertCountdown);

      // Feature extraction from sliding window buffer
      const features = extractFeatures(engine.windowBuffer);
      const inference = runTinyMLInference(features);
      setCurrentInference(inference);

      // Detect step count transitions (Heel Strike phase entry)
      if (sample.phase === 'Heel Strike' && prevPhaseRef.current !== 'Heel Strike') {
        setStats(prev => ({
          ...prev,
          steps: prev.steps + 1
        }));
      }
      prevPhaseRef.current = sample.phase;

      // Dynamic cadence & symmetry
      let currentCadence = 0;
      if (inference.activityName === 'Walking') currentCadence = 108;
      else if (inference.activityName === 'Running') currentCadence = 166;

      let currentSymmetry = 98.2;
      if (engine.scenario === 'pronation') currentSymmetry = 78.5; // Significant asymmetry

      setStats(prev => ({
        ...prev,
        cadence: currentCadence,
        symmetry: currentSymmetry,
        fallAlert: engine.fallState !== 'idle'
      }));

      // Broadcast to cloud if enabled
      bridge.setEnabled(supabaseEnabled);
      bridge.sendTelemetry(sample, inference, {
        steps: stats.steps,
        cadence: currentCadence,
        symmetry: currentSymmetry,
        fallAlert: engine.fallState !== 'idle'
      });
    }, 20);

    return () => clearInterval(interval);
  }, [manualMode, manualSensors, supabaseEnabled]);

  const handleSelectScenario = (scId) => {
    setScenario(scId);
    if (engineRef.current) {
      engineRef.current.setScenario(scId);
    }
  };

  const handleCancelFall = () => {
    if (engineRef.current) {
      engineRef.current.cancelFall();
      setScenario('standing');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Top Cybernetic Navigation Bar */}
      <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-glow-cyan flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-display tracking-tight text-white">
                  StrideSense <span className="text-cyan-400 font-mono text-sm">3D SIMULATION STUDIO</span>
                </h1>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded font-semibold">
                  PORT 5174 • STANDALONE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Hardware-Accurate Biomechanical Digital Twin • ESP32 TinyML & Fall-Detection Emulation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Real IoT Preservation Badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Target: <strong className="text-emerald-400">ESP32 DevKit V1</strong></span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Firmware Ready for Flash</span>
            </div>

            {/* Dashboard Separation Notice */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span>Production App:</span>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold underline underline-offset-2"
              >
                Port 5173 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: 3D Viewport & Scenario Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* 3D Viewport */}
          <div className="h-[480px] w-full">
            <Viewport3D
              sample={currentSample}
              showFootModel={showFootModel}
            />
          </div>

          {/* Scenario Director */}
          <ScenarioDirector
            currentScenario={scenario}
            onSelectScenario={handleSelectScenario}
            fallState={fallState}
            alertCountdown={alertCountdown}
            onCancelFall={handleCancelFall}
            manualMode={manualMode}
            setManualMode={setManualMode}
            manualSensors={manualSensors}
            setManualSensors={setManualSensors}
            showFootModel={showFootModel}
            setShowFootModel={setShowFootModel}
          />
        </div>

        {/* Right Column: Telemetry, Decision Trees & Cloud (5 Cols) */}
        <div className="lg:col-span-5">
          <TelemetryGauges
            sample={currentSample}
            inference={currentInference}
            supabaseBridge={bridgeRef.current}
            supabaseEnabled={supabaseEnabled}
            setSupabaseEnabled={setSupabaseEnabled}
            stats={stats}
          />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 px-6 py-2.5 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between max-w-[1600px] w-full mx-auto">
        <div>
          StrideSense Biomechanical Digital Twin • Zero changes to production dashboard codebase
        </div>
        <div className="flex gap-4 text-[11px]">
          <span>Sampling: 50 Hz</span>
          <span>Window: 25 Samples (0.5s)</span>
          <span>ML Accuracy: 100% Tree Match</span>
        </div>
      </footer>
    </div>
  );
}
