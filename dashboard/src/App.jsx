import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Footprints,
  Activity,
  ShieldAlert,
  Settings,
  AlertTriangle,
  Radio,
  Wifi,
  Battery,
  CircleDot,
  UserCheck,
  Flame,
  Armchair,
  Play
} from 'lucide-react';

import HomePage from './components/HomePage.jsx';
import FootHeatmap from './components/FootHeatmap.jsx';
import ActivityCard from './components/ActivityCard.jsx';
import GaitMetrics from './components/GaitMetrics.jsx';
import MotionVisualizer from './components/MotionVisualizer.jsx';
import FallAlertModal from './components/FallAlertModal.jsx';
import HistoricalTrends from './components/HistoricalTrends.jsx';
import FallGuardMobile from './components/FallGuardMobile.jsx';
import SettingsPage from './components/SettingsPage.jsx';

import { simulator } from './services/simulator.js';
import { supabaseService } from './services/supabase.js';
import { nativeBridge } from './services/native.js';

/* ─── NAV TABS ───────────────────────────────────────── */
const TABS = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'pressure', label: 'Pressure', icon: Footprints },
  { id: 'gait',     label: 'Gait',     icon: Activity },
  { id: 'safety',   label: 'Guard',    icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings }
];

/* ─── SIM MODES ──────────────────────────────────────── */
const SIM_MODES = [
  { mode: 'STANDING', icon: UserCheck, label: 'Stand',  color: 'emerald' },
  { mode: 'WALKING',  icon: Footprints, label: 'Walk',  color: 'cyan' },
  { mode: 'RUNNING',  icon: Flame,      label: 'Run',   color: 'amber' },
  { mode: 'SITTING',  icon: Armchair,   label: 'Sit',   color: 'purple' },
  { mode: 'FALL',     icon: AlertTriangle, label: 'Fall', color: 'rose' }
];

const COLOR_MAP = {
  cyan:    { active: 'bg-cyan-500 text-black shadow-glow-cyan',  idle: 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80' },
  emerald: { active: 'bg-emerald-500 text-black shadow-glow-emerald', idle: 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80' },
  amber:   { active: 'bg-amber-500 text-black',                  idle: 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80' },
  purple:  { active: 'bg-violet-500 text-white',                 idle: 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80' },
  rose:    { active: 'bg-rose-500 text-white shadow-glow-rose',  idle: 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80' }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [useSimulator, setUseSimulator] = useState(true);
  const [simMode, setSimMode] = useState('WALKING');
  const [telemetry, setTelemetry] = useState(() => simulator.generateSample());
  const [fallModalOpen, setFallModalOpen] = useState(false);

  /* ─── Init ────────────────────────────── */
  useEffect(() => { nativeBridge.init(); }, []);

  /* ─── Telemetry stream ────────────────── */
  useEffect(() => {
    let unsub;
    if (useSimulator) {
      simulator.start(40);
      unsub = simulator.subscribe((data) => {
        setTelemetry(data);
        if (data.fallAlert && !fallModalOpen) {
          nativeBridge.triggerEmergencyVibration();
          setFallModalOpen(true);
        }
      });
    } else {
      if (supabaseService.isConfigured()) {
        supabaseService.connectRealtime();
        unsub = supabaseService.subscribeTelemetry((data) => {
          setTelemetry(data);
          if (data.fallAlert && !fallModalOpen) {
            nativeBridge.triggerEmergencyVibration();
            setFallModalOpen(true);
          }
        });
        supabaseService.fetchLatestTelemetry().then((l) => { if (l) setTelemetry(l); });
      } else {
        setUseSimulator(true);
      }
    }
    return () => {
      if (unsub) unsub();
      if (useSimulator) simulator.stop(); else supabaseService.disconnectRealtime();
    };
  }, [useSimulator]);

  /* ─── Handlers ────────────────────────── */
  const navigate = useCallback((tab) => {
    nativeBridge.impactLight();
    setActiveTab(tab);
  }, []);

  const changeSimMode = useCallback((mode) => {
    nativeBridge.impactMedium();
    setSimMode(mode);
    simulator.setMode(mode);
    if (mode === 'FALL') {
      nativeBridge.triggerEmergencyVibration();
      setFallModalOpen(true);
    }
  }, []);

  const cancelFall = useCallback(() => {
    nativeBridge.impactMedium();
    setFallModalOpen(false);
    simulator.cancelFall();
    setSimMode('STANDING');
  }, []);

  /* ─── Page title ──────────────────────── */
  const PAGE_TITLES = {
    home: null, // HomePage has its own header
    pressure: 'Pressure Map',
    gait: 'Gait Analytics',
    motion: 'IMU Kinematics',
    safety: 'Fall Guard',
    settings: null // SettingsPage has its own header
  };
  const pageTitle = PAGE_TITLES[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-white">

      {/* ═══ FALL EMERGENCY MODAL ═══ */}
      <FallAlertModal isOpen={fallModalOpen} onCancel={cancelFall} initialSeconds={15} />

      {/* ═══ TOP HEADER BAR ═══ */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-b border-white/[0.05] px-4 lg:px-8 mobile-header-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-12">

          {/* Brand or Page Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 p-[2px] shadow-md shadow-cyan-500/15">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Footprints className="w-[15px] h-[15px] text-cyan-400" />
              </div>
            </div>
            {pageTitle ? (
              <span className="text-[15px] font-bold text-white">{pageTitle}</span>
            ) : (
              <div>
                <span className="text-[15px] font-extrabold font-display tracking-tight text-white">
                  Stride<span className="gradient-text">Sense</span>
                </span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Battery */}
            <div className="flex items-center gap-1 bg-slate-900/60 border border-white/[0.05] px-2 py-1 rounded-lg">
              <Battery className={`w-3.5 h-3.5 ${telemetry.batteryPct > 20 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-[10px] font-mono font-bold text-white">{telemetry.batteryPct}%</span>
            </div>

            {/* Source */}
            <button
              onClick={() => { nativeBridge.impactLight(); setUseSimulator(!useSimulator); }}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold border flex items-center gap-1 transition-all ${
                useSimulator ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              }`}
            >
              {useSimulator ? <Radio className="w-2.5 h-2.5" /> : <Wifi className="w-2.5 h-2.5" />}
              {useSimulator ? 'SIM' : 'LIVE'}
            </button>

            {/* SOS */}
            <button
              onClick={() => changeSimMode('FALL')}
              className="p-1.5 rounded-lg bg-rose-500/12 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 active-press"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ SIMULATOR MODE SWITCHER (only visible when simulator active & not on home/settings) ═══ */}
      {useSimulator && activeTab !== 'home' && activeTab !== 'settings' && (
        <div className="bg-slate-900/25 border-b border-white/[0.03] px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[9px] text-slate-600 flex items-center gap-1 whitespace-nowrap mr-1">
              <CircleDot className="w-2.5 h-2.5 text-cyan-500" />
            </span>
            {SIM_MODES.map(({ mode, icon: Icon, label, color }) => {
              const isActive = simMode === mode;
              const style = isActive ? COLOR_MAP[color].active : COLOR_MAP[color].idle;
              return (
                <button
                  key={mode}
                  onClick={() => changeSimMode(mode)}
                  className={`px-2 py-1 rounded-md font-bold text-[9px] flex items-center gap-1 active-press transition-all whitespace-nowrap ${style}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-4 pb-24 md:pb-6">

        {activeTab === 'home' && (
          <HomePage telemetry={telemetry} onNavigate={navigate} />
        )}

        {activeTab === 'pressure' && (
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
              onTriggerFall={() => changeSimMode('FALL')}
              isFallActive={telemetry.fallAlert}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            batteryPct={telemetry.batteryPct}
            batteryVoltage={telemetry.batteryVoltage}
            isCloudConnected={!useSimulator}
            isSimulated={useSimulator}
            useSimulator={useSimulator}
            onToggleSource={() => { nativeBridge.impactLight(); setUseSimulator(!useSimulator); }}
          />
        )}
      </main>

      {/* ═══ BOTTOM NAVIGATION BAR ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/93 backdrop-blur-2xl border-t border-white/[0.06] mobile-bottom-safe">
        <div className="flex items-stretch justify-around px-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 active-press transition-all duration-150 ${
                  isActive ? 'text-cyan-400' : 'text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-cyan-500/12 shadow-glow-cyan' : ''
                }`}>
                  <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.4 : 1.6} />
                </div>
                <span className={`text-[9px] font-semibold leading-none ${
                  isActive ? 'text-cyan-400' : 'text-slate-600'
                }`}>
                  {item.label}
                </span>
                {isActive && <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-glow-cyan mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop tab bar (visible on md+) */}
      <nav className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/[0.06] px-8 py-2">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500/12 text-cyan-400 border border-cyan-500/25 shadow-glow-cyan'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
