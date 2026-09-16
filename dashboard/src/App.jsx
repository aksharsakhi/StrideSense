import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Footprints,
  Compass,
  AlertTriangle,
  Radio,
  Cpu,
  Zap,
  Play,
  HeartPulse,
  Battery,
  ShieldAlert,
  Sliders,
  Flame,
  UserCheck,
  Armchair,
  Wifi,
  WifiOff,
  CircleDot
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
import { supabaseService } from './services/supabase.js';
import { nativeBridge } from './services/native.js';

const TABS = [
  { id: 'heatmap', label: 'Pressure', icon: Footprints },
  { id: 'gait', label: 'Gait', icon: Activity },
  { id: 'motion', label: 'Motion', icon: Compass },
  { id: 'safety', label: 'Guard', icon: ShieldAlert },
  { id: 'settings', label: 'Device', icon: Sliders }
];

const SIM_MODES = [
  { mode: 'STANDING', icon: UserCheck, label: 'Stand', color: 'emerald' },
  { mode: 'WALKING', icon: Footprints, label: 'Walk', color: 'cyan' },
  { mode: 'RUNNING', icon: Flame, label: 'Run', color: 'amber' },
  { mode: 'SITTING', icon: Armchair, label: 'Sit', color: 'purple' },
  { mode: 'FALL', icon: AlertTriangle, label: 'Fall', color: 'rose' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('heatmap');
  const [useSimulator, setUseSimulator] = useState(true);
  const [simMode, setSimMode] = useState('WALKING');
  const [telemetry, setTelemetry] = useState(() => simulator.generateSample());
  const [fallModalOpen, setFallModalOpen] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(() => supabaseService.isConfigured());

  useEffect(() => {
    nativeBridge.init();
    setSupabaseReady(supabaseService.isConfigured());
  }, []);

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
      if (supabaseService.isConfigured()) {
        supabaseService.connectRealtime();
        unsubscribe = supabaseService.subscribeTelemetry((data) => {
          setTelemetry(data);
          if (data.fallAlert && !fallModalOpen) {
            nativeBridge.triggerEmergencyVibration();
            setFallModalOpen(true);
          }
        });
        supabaseService.fetchLatestTelemetry().then((latest) => {
          if (latest) setTelemetry(latest);
        });
      } else {
        setUseSimulator(true);
      }
    }
    return () => {
      if (unsubscribe) unsubscribe();
      if (useSimulator) simulator.stop();
      else supabaseService.disconnectRealtime();
    };
  }, [useSimulator]);

  const handleTabChange = useCallback((tab) => {
    nativeBridge.impactLight();
    setActiveTab(tab);
  }, []);

  const handleSimModeChange = useCallback((mode) => {
    nativeBridge.impactMedium();
    setSimMode(mode);
    simulator.setMode(mode);
    if (mode === 'FALL') {
      nativeBridge.triggerEmergencyVibration();
      setFallModalOpen(true);
    }
  }, []);

  const handleCancelFall = useCallback(() => {
    nativeBridge.impactMedium();
    setFallModalOpen(false);
    simulator.cancelFall();
    setSimMode('STANDING');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-white">
      {/* ─── FALL EMERGENCY MODAL ─── */}
      <FallAlertModal
        isOpen={fallModalOpen}
        onCancel={handleCancelFall}
        initialSeconds={15}
      />

      {/* ─── TOP HEADER BAR ─── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.06] px-4 lg:px-8 py-2.5 mobile-header-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Footprints className="w-[18px] h-[18px] text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-extrabold font-display tracking-tight text-white">
                  Stride<span className="gradient-text">Sense</span>
                </span>
                <span className="badge badge-cyan text-[8px] py-0.5 px-1.5 hidden sm:inline-flex">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block -mt-0.5">Smart Insole Biomechanics</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5 bg-slate-900/80 border border-white/[0.06] p-1 rounded-2xl">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Battery */}
            <div className="flex items-center gap-1.5 bg-slate-900/70 border border-white/[0.06] px-2.5 py-1.5 rounded-xl text-xs font-mono">
              <Battery className={`w-3.5 h-3.5 ${telemetry.batteryPct > 20 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-white font-bold text-[11px]">{telemetry.batteryPct}%</span>
            </div>

            {/* Data Source Toggle */}
            <button
              onClick={() => { nativeBridge.impactLight(); setUseSimulator(!useSimulator); }}
              className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition-all duration-200 ${
                useSimulator
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {useSimulator ? <Radio className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span>{useSimulator ? 'SIM' : 'LIVE'}</span>
            </button>

            {/* SOS Button */}
            <button
              onClick={() => handleSimModeChange('FALL')}
              className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 active-press transition-all"
              title="Simulate Fall"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── SIMULATOR ACTIVITY SWITCHER ─── */}
      {useSimulator && (
        <div className="bg-slate-900/30 border-b border-white/[0.04] px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 flex items-center gap-1 text-[10px] whitespace-nowrap mr-1">
              <CircleDot className="w-3 h-3 text-cyan-400" />
              Mode:
            </span>
            {SIM_MODES.map(({ mode, icon: Icon, label, color }) => {
              const isActive = simMode === mode;
              const colorMap = {
                cyan: { active: 'bg-cyan-500 text-black shadow-glow-cyan', idle: 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80' },
                emerald: { active: 'bg-emerald-500 text-black shadow-glow-emerald', idle: 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80' },
                amber: { active: 'bg-amber-500 text-black', idle: 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80' },
                purple: { active: 'bg-violet-500 text-white', idle: 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80' },
                rose: { active: 'bg-rose-500 text-white shadow-glow-rose', idle: 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80' }
              };
              const style = isActive ? colorMap[color].active : colorMap[color].idle;
              return (
                <button
                  key={mode}
                  onClick={() => handleSimModeChange(mode)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 active-press transition-all whitespace-nowrap ${style}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-4 pb-24 md:pb-6">
        {activeTab === 'heatmap' && (
          <div className="flex flex-col gap-4 animate-fade-in stagger-children">
            <ActivityCard activity={telemetry.activity} confidence={telemetry.confidence} />
            <FootHeatmap sensors={telemetry.sensors} />
          </div>
        )}

        {activeTab === 'gait' && (
          <div className="flex flex-col gap-4 animate-fade-in stagger-children">
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
          <div className="flex flex-col gap-4 animate-fade-in stagger-children">
            <MotionVisualizer imu={telemetry.imu} />
            <ActivityCard activity={telemetry.activity} confidence={telemetry.confidence} />
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
          <div className="flex flex-col gap-4 animate-fade-in stagger-children">
            <DeviceStatus
              batteryPct={telemetry.batteryPct}
              batteryVoltage={telemetry.batteryVoltage}
              isCloudConnected={!useSimulator}
              isSimulated={useSimulator}
            />

            {/* Tech Stack Specs */}
            <div className="glass-panel p-5 animate-fade-in-scale">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                System Architecture
              </h3>
              <div className="space-y-0">
                {[
                  { label: 'Framework', value: 'Capacitor 6 + React 19', color: 'text-cyan-400' },
                  { label: 'Platforms', value: 'iOS / Android / Web PWA', color: 'text-white' },
                  { label: 'Haptics', value: '@capacitor/haptics', color: 'text-emerald-400' },
                  { label: 'MCU', value: 'ESP32 Tensilica 240 MHz', color: 'text-white' },
                  { label: 'Edge ML Latency', value: '< 0.27 µs (Zero-heap C)', color: 'text-cyan-400' },
                  { label: 'Cloud Backend', value: 'Supabase PostgreSQL + CDC', color: 'text-emerald-400' }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-2.5 border-b border-white/[0.04] last:border-0 text-xs">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-mono font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── BOTTOM NAVIGATION BAR (Mobile) ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/92 backdrop-blur-2xl border-t border-white/[0.06] mobile-bottom-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-200 active-press ${
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-cyan-500/15 shadow-glow-cyan' : ''
                }`}>
                  <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[9px] font-semibold tracking-tight ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                {isActive && <div className="nav-active-dot mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
