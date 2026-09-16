import React, { useState, useEffect } from 'react';
import {
  Activity,
  Footprints,
  Compass,
  AlertTriangle,
  Radio,
  Cpu,
  RefreshCw,
  Zap,
  CheckCircle,
  Play,
  RotateCcw,
  Layers,
  HeartPulse,
  Battery
} from 'lucide-react';

import FootHeatmap from './components/FootHeatmap.jsx';
import ActivityCard from './components/ActivityCard.jsx';
import GaitMetrics from './components/GaitMetrics.jsx';
import MotionVisualizer from './components/MotionVisualizer.jsx';
import FallAlertModal from './components/FallAlertModal.jsx';
import DeviceStatus from './components/DeviceStatus.jsx';
import HistoricalTrends from './components/HistoricalTrends.jsx';

import { simulator } from './services/simulator.js';
import { firebaseService } from './services/firebase.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'history', 'device'
  const [useSimulator, setUseSimulator] = useState(true);
  const [simMode, setSimMode] = useState('WALKING');
  const [telemetry, setTelemetry] = useState(() => simulator.generateSample());
  const [fallModalOpen, setFallModalOpen] = useState(false);

  // Subscribe to telemetry stream (Simulator or Firebase)
  useEffect(() => {
    let unsubscribe;

    if (useSimulator) {
      simulator.start(40); // 25 fps UI update matching 50 Hz sensor sampling
      unsubscribe = simulator.subscribe((data) => {
        setTelemetry(data);
        if (data.fallAlert && !fallModalOpen) {
          setFallModalOpen(true);
        }
      });
    } else {
      firebaseService.connect();
      unsubscribe = firebaseService.subscribe((data) => {
        setTelemetry(data);
        if (data.fallAlert && !fallModalOpen) {
          setFallModalOpen(true);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (useSimulator) simulator.stop();
      else firebaseService.disconnect();
    };
  }, [useSimulator]);

  const handleSimModeChange = (mode) => {
    setSimMode(mode);
    simulator.setMode(mode);
    if (mode === 'FALL') {
      setFallModalOpen(true);
    }
  };

  const handleCancelFall = () => {
    setFallModalOpen(false);
    simulator.cancelFall();
    setSimMode('STANDING');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Fall Alert Emergency Modal */}
      <FallAlertModal
        isOpen={fallModalOpen}
        onCancel={handleCancelFall}
        initialSeconds={15}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Footprints className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold font-display tracking-tight text-white">Stride<span className="text-cyan-400">Sense</span></span>
                <span className="badge badge-cyan text-[10px] hidden sm:inline-flex">AI Smart Insole</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Edge TinyML Gait Analysis & Fall Detection</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'live' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Telemetry
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'history' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Historical Trends
            </button>
            <button
              onClick={() => setActiveTab('device')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'device' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hardware & Specs
            </button>
          </nav>

          {/* Right Status Actions */}
          <div className="flex items-center gap-3">
            {/* Stream Mode Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1 text-xs">
              <button
                onClick={() => setUseSimulator(true)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                  useSimulator ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulator</span>
              </button>
              <button
                onClick={() => setUseSimulator(false)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                  !useSimulator ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hardware Wi-Fi</span>
              </button>
            </div>

            {/* Quick Emergency SOS Button */}
            <button
              onClick={() => handleSimModeChange('FALL')}
              className="p-2.5 sm:px-3 sm:py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
              title="Trigger Emergency Fall Test"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="hidden lg:inline">TEST FALL</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulator Quick Action Toolbar */}
      {useSimulator && (
        <div className="bg-slate-900/40 border-b border-slate-800/60 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Biomechanical Simulator Preset:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {['STANDING', 'WALKING', 'RUNNING', 'SITTING', 'FALL'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSimModeChange(mode)}
                  className={`px-3 py-1 rounded-xl font-semibold uppercase tracking-wider text-[11px] transition-all ${
                    simMode === mode
                      ? (mode === 'FALL' ? 'bg-rose-500 text-white shadow-glow-rose' : 'bg-cyan-400 text-black shadow-glow-cyan')
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'live' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Top Row: Activity Card & Gait Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <ActivityCard
                  activity={telemetry.activity}
                  confidence={telemetry.confidence}
                />
              </div>
              <div className="lg:col-span-8">
                <GaitMetrics
                  steps={telemetry.steps}
                  cadence={telemetry.cadence}
                  symmetry={telemetry.symmetry}
                  activity={telemetry.activity}
                />
              </div>
            </div>

            {/* Middle Row: Plantar Heatmap & IMU Kinematics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <FootHeatmap sensors={telemetry.sensors} />
              </div>
              <div className="lg:col-span-5">
                <MotionVisualizer imu={telemetry.imu} />
              </div>
            </div>

            {/* Bottom Row: Hardware Telemetry */}
            <div>
              <DeviceStatus
                batteryPct={telemetry.batteryPct}
                batteryVoltage={telemetry.batteryVoltage}
                isCloudConnected={!useSimulator}
                isSimulated={useSimulator}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <HistoricalTrends />
          </div>
        )}

        {activeTab === 'device' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <DeviceStatus
              batteryPct={telemetry.batteryPct}
              batteryVoltage={telemetry.batteryVoltage}
              isCloudConnected={!useSimulator}
              isSimulated={useSimulator}
            />

            {/* Hardware BOM & Pinout Summary */}
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold font-display text-white mb-4">Prototype Pinout & Circuit Schematic</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Peripheral</th>
                      <th className="py-2.5 px-3">ESP32 Pin</th>
                      <th className="py-2.5 px-3">Protocol</th>
                      <th className="py-2.5 px-3">Biomechanical Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">S1 (Heel FSR)</td>
                      <td className="py-2.5 px-3 text-cyan-400">GPIO 36 (VP)</td>
                      <td className="py-2.5 px-3">ADC1_CH0</td>
                      <td className="py-2.5 px-3">Initial heel strike contact force</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">S2 (Midfoot Lateral)</td>
                      <td className="py-2.5 px-3 text-cyan-400">GPIO 39 (VN)</td>
                      <td className="py-2.5 px-3">ADC1_CH3</td>
                      <td className="py-2.5 px-3">Lateral arch support & roll stability</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">S3 (Midfoot Medial)</td>
                      <td className="py-2.5 px-3 text-cyan-400">GPIO 34</td>
                      <td className="py-2.5 px-3">ADC1_CH6</td>
                      <td className="py-2.5 px-3">Medial longitudinal arch compression</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">S4 (Forefoot Lateral)</td>
                      <td className="py-2.5 px-3 text-cyan-400">GPIO 35</td>
                      <td className="py-2.5 px-3">ADC1_CH7</td>
                      <td className="py-2.5 px-3">4th-5th Metatarsal weight transfer</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">S5 (Forefoot Medial)</td>
                      <td className="py-2.5 px-3 text-cyan-400">GPIO 32</td>
                      <td className="py-2.5 px-3">ADC1_CH4</td>
                      <td className="py-2.5 px-3">1st Metatarsal (Ball) primary propulsion</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">S6 (Hallux / Toe)</td>
                      <td className="py-2.5 px-3 text-cyan-400">GPIO 33</td>
                      <td className="py-2.5 px-3">ADC1_CH5</td>
                      <td className="py-2.5 px-3">Terminal stance toe-off timing</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">MPU-6050 IMU</td>
                      <td className="py-2.5 px-3 text-emerald-400">GPIO 21 (SDA), 22 (SCL)</td>
                      <td className="py-2.5 px-3">I2C (400 kHz)</td>
                      <td className="py-2.5 px-3">3D Linear Accel + 3D Gyroscopic Angular Rate</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">SOS / Cancel Button</td>
                      <td className="py-2.5 px-3 text-amber-400">GPIO 14</td>
                      <td className="py-2.5 px-3">GPIO (Pull-up)</td>
                      <td className="py-2.5 px-3">15s Fall cancel & emergency alert trigger</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Haptic Motor / Buzzer</td>
                      <td className="py-2.5 px-3 text-purple-400">GPIO 12</td>
                      <td className="py-2.5 px-3">GPIO / PWM</td>
                      <td className="py-2.5 px-3">Haptic confirmation pulses on fall anomaly</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (iOS & Android thumb-friendly) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-6 py-2.5 flex items-center justify-around text-xs">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'live' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span>Live</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'history' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('device')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'device' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span>Hardware</span>
        </button>
      </div>
    </div>
  );
}
