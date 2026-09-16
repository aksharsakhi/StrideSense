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
  Battery,
  ShieldAlert,
  Sliders,
  Flame,
  UserCheck,
  Armchair
} from 'lucide-react';

import FootHeatmap from './components/FootHeatmap.jsx';
import ActivityCard from './components/ActivityCard.jsx';
import GaitMetrics from './components/GaitMetrics.jsx';
import MotionVisualizer from './components/MotionVisualizer.jsx';
import FallAlertModal from './components/FallAlertModal.jsx';
import DeviceStatus from './components/DeviceStatus.jsx';
import HistoricalTrends from './components/HistoricalTrends.jsx';
import FallGuardMobile from './components/FallGuardMobile.jsx';

import { simulator } from './services/simulator.js';
import { firebaseService } from './services/firebase.js';
import { nativeBridge } from './services/native.js';

export default function App() {
  // Mobile & Desktop Navigation Tabs: 'heatmap', 'gait', 'motion', 'safety', 'settings'
  const [activeTab, setActiveTab] = useState('heatmap');
  const [useSimulator, setUseSimulator] = useState(true);
  const [simMode, setSimMode] = useState('WALKING');
  const [telemetry, setTelemetry] = useState(() => simulator.generateSample());
  const [fallModalOpen, setFallModalOpen] = useState(false);

  // Initialize Native Bridge (Capacitor status bar & haptics)
  useEffect(() => {
    nativeBridge.init();
  }, []);

  // Subscribe to telemetry stream
  useEffect(() => {
    let unsubscribe;

    if (useSimulator) {
      simulator.start(40);
      unsubscribe = simulator.subscribe((data) => {
        setTelemetry(data);
        if (data.fallAlert && !fallModalOpen) {
          nativeBridge.triggerEmergencyVibration();
          setFallModalOpen(true);
        }
      });
    } else {
      firebaseService.connect();
      unsubscribe = firebaseService.subscribe((data) => {
        setTelemetry(data);
        if (data.fallAlert && !fallModalOpen) {
          nativeBridge.triggerEmergencyVibration();
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

  const handleTabChange = (tab) => {
    nativeBridge.impactLight();
    setActiveTab(tab);
  };

  const handleSimModeChange = (mode) => {
    nativeBridge.impactMedium();
    setSimMode(mode);
    simulator.setMode(mode);
    if (mode === 'FALL') {
      nativeBridge.triggerEmergencyVibration();
      setFallModalOpen(true);
    }
  };

  const handleCancelFall = () => {
    nativeBridge.impactMedium();
    setFallModalOpen(false);
    simulator.cancelFall();
    setSimMode('STANDING');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* High-Priority Emergency Fall Modal */}
      <FallAlertModal
        isOpen={fallModalOpen}
        onCancel={handleCancelFall}
        initialSeconds={15}
      />

      {/* Top Mobile & Desktop App Header (Safe-Area Insets for iOS & Android) */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 mobile-header-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Telemetry Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Footprints className="w-4.5 h-4.5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold font-display tracking-tight text-white">
                  Stride<span className="text-cyan-400">Sense</span>
                </span>
                <span className="badge badge-cyan text-[9px] py-0.5 px-2">MOBILE AI</span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Smart Insole Biomechanics & Fall Shield</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
            {[
              { id: 'heatmap', label: 'Heatmap' },
              { id: 'gait', label: 'Gait Analytics' },
              { id: 'motion', label: 'IMU Motion' },
              { id: 'safety', label: 'Fall Guard' },
              { id: 'settings', label: 'Device & Specs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Status Badges & SOS */}
          <div className="flex items-center gap-2">
            {/* Battery Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white font-bold">{telemetry.batteryPct}%</span>
            </div>

            {/* Mode Switcher */}
            <button
              onClick={() => {
                nativeBridge.impactLight();
                setUseSimulator(!useSimulator);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1 transition-all ${
                useSimulator
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              }`}
              title="Toggle Hardware Link vs In-App Simulator"
            >
              <Radio className="w-3 h-3" />
              <span>{useSimulator ? 'SIM' : 'Wi-Fi'}</span>
            </button>

            {/* Instant Panic / Fall Test */}
            <button
              onClick={() => handleSimModeChange('FALL')}
              className="p-1.5 sm:px-3 sm:py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center gap-1 active-press"
              title="Simulate Fall"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">SOS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulator Action Ribbon */}
      {useSimulator && (
        <div className="bg-slate-900/40 border-b border-slate-800/60 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] whitespace-nowrap">
              <Play className="w-3 h-3 text-cyan-400" />
              Activity:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { mode: 'STANDING', icon: UserCheck, label: 'Stand' },
                { mode: 'WALKING', icon: Footprints, label: 'Walk' },
                { mode: 'RUNNING', icon: Flame, label: 'Run' },
                { mode: 'SITTING', icon: Armchair, label: 'Sit' },
                { mode: 'FALL', icon: AlertTriangle, label: 'Fall' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleSimModeChange(mode)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1 active-press transition-all whitespace-nowrap ${
                    simMode === mode
                      ? (mode === 'FALL' ? 'bg-rose-500 text-white shadow-glow-rose' : 'bg-cyan-400 text-black shadow-glow-cyan')
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5">
        {activeTab === 'heatmap' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Top Activity Summary */}
            <ActivityCard
              activity={telemetry.activity}
              confidence={telemetry.confidence}
            />
            {/* Plantar Pressure Heatmap */}
            <FootHeatmap sensors={telemetry.sensors} />
          </div>
        )}

        {activeTab === 'gait' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <GaitMetrics
              steps={telemetry.steps}
              cadence={telemetry.cadence}
              symmetry={telemetry.symmetry}
              activity={telemetry.activity}
            />
            <HistoricalTrends />
          </div>
        )}

        {activeTab === 'motion' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <MotionVisualizer imu={telemetry.imu} />
            <ActivityCard
              activity={telemetry.activity}
              confidence={telemetry.confidence}
            />
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="animate-fade-in">
            <FallGuardMobile
              onTriggerFall={() => handleSimModeChange('FALL')}
              isFallActive={telemetry.fallAlert}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <DeviceStatus
              batteryPct={telemetry.batteryPct}
              batteryVoltage={telemetry.batteryVoltage}
              isCloudConnected={!useSimulator}
              isSimulated={useSimulator}
            />

            {/* Mobile Architecture Specs */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Mobile & Embedded Stack
              </h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Framework</span>
                  <span className="font-mono text-cyan-400 font-semibold">Capacitor 6 + React 19</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Target Platforms</span>
                  <span className="font-mono text-white font-semibold">Android (APK) / iOS (IPA) / Web</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Haptics Engine</span>
                  <span className="font-mono text-emerald-400 font-semibold">@capacitor/haptics</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Microcontroller</span>
                  <span className="font-mono text-white font-semibold">ESP32 240 MHz Tensilica</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Edge TinyML Latency</span>
                  <span className="font-mono text-cyan-400 font-semibold">&lt; 0.27 us (Zero-heap C)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Native Mobile Bottom Navigation Bar (iOS & Android) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-around text-[10px] mobile-bottom-safe shadow-2xl">
        {[
          { id: 'heatmap', label: 'Heatmap', icon: Footprints },
          { id: 'gait', label: 'Gait', icon: Activity },
          { id: 'motion', label: 'Motion', icon: Compass },
          { id: 'safety', label: 'Fall Guard', icon: ShieldAlert },
          { id: 'settings', label: 'Settings', icon: Sliders }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all active-press ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-all ${
                  isActive ? 'bg-cyan-500/20 text-cyan-400 shadow-glow-cyan' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
