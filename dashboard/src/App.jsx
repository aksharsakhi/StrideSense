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
  Sun,
  Moon,
  Monitor,
  Brain
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
  { id: 'motion',   label: 'Motion',   icon: Brain },
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
  cyan:    { active: 'bg-cyan-500 text-white dark:text-black shadow-glow-cyan',  idle: 'bg-slate-200/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700/80' },
  emerald: { active: 'bg-emerald-500 text-white dark:text-black shadow-glow-emerald', idle: 'bg-slate-200/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700/80' },
  amber:   { active: 'bg-amber-500 text-white dark:text-black',                  idle: 'bg-slate-200/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700/80' },
  purple:  { active: 'bg-violet-500 text-white',                                idle: 'bg-slate-200/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700/80' },
  rose:    { active: 'bg-rose-500 text-white shadow-glow-rose',                 idle: 'bg-slate-200/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700/80' }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [useSimulator, setUseSimulator] = useState(true);
  const [simMode, setSimMode] = useState('WALKING');
  const [telemetry, setTelemetry] = useState(() => simulator.generateSample());
  const [fallModalOpen, setFallModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('stridesense_theme') || 'system');

  /* ─── Theme Sync Effect ───────────────── */
  useEffect(() => {
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      const meta = document.getElementById('meta-theme-color');
      if (meta) meta.setAttribute('content', isDark ? '#060a12' : '#ffffff');
      nativeBridge.setTheme(isDark ? 'dark' : 'light');
    };

    applyTheme();
    try {
      localStorage.setItem('stridesense_theme', theme);
    } catch (e) {}

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const mqlListener = () => {
      if (theme === 'system') applyTheme();
    };
    mql.addEventListener('change', mqlListener);
    return () => mql.removeEventListener('change', mqlListener);
  }, [theme]);

  /* ─── Init Native Bridge ──────────────── */
  useEffect(() => {
    nativeBridge.init();
  }, []);

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

  const cycleTheme = useCallback(() => {
    nativeBridge.impactLight();
    setTheme((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
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
    home: null,
    pressure: 'Pressure Map',
    gait: 'Gait Analytics',
    motion: 'IMU Kinematics',
    safety: 'Fall Guard',
    settings: null
  };
  const pageTitle = PAGE_TITLES[activeTab];

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-white transition-colors duration-200">

      {/* ═══ FALL EMERGENCY MODAL ═══ */}
      <FallAlertModal isOpen={fallModalOpen} onCancel={cancelFall} initialSeconds={15} />

      {/* ═══ TOP HEADER BAR ═══ */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.05] px-4 sm:px-6 lg:px-8 mobile-header-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">

          {/* Brand or Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2.5 active-press text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 p-[2px] shadow-md shadow-cyan-500/15">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[9px] flex items-center justify-center">
                  <Footprints className="w-[15px] h-[15px] text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              <span className="text-[16px] font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
                Stride<span className="gradient-text">Sense</span>
              </span>
            </button>

            {pageTitle && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{pageTitle}</span>
              </div>
            )}
          </div>

          {/* Center Navigation Tabs for Desktop/Tablet (md+) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300/40 dark:border-white/[0.06] p-1 rounded-2xl">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-white/[0.08]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.3 : 1.8} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">

            {/* Quick Theme Toggle */}
            <button
              onClick={cycleTheme}
              title={`Theme: ${theme} (Click to toggle)`}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 active-press transition-all flex items-center gap-1 text-xs"
            >
              {theme === 'system' ? (
                <Monitor className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              ) : theme === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden xl:inline text-[10px] uppercase font-bold tracking-wider opacity-80">
                {theme}
              </span>
            </button>

            {/* Battery Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] px-2.5 py-1 rounded-xl">
              <Battery className={`w-3.5 h-3.5 ${telemetry.batteryPct > 20 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-white">{telemetry.batteryPct}%</span>
            </div>

            {/* Data Source Badge */}
            <button
              onClick={() => { nativeBridge.impactLight(); setUseSimulator(!useSimulator); }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition-all active-press ${
                useSimulator
                  ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-600 dark:text-cyan-400'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {useSimulator ? <Radio className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span className="font-mono">{useSimulator ? 'SIM' : 'LIVE'}</span>
            </button>

            {/* SOS Trigger */}
            <button
              onClick={() => changeSimMode('FALL')}
              title="Simulate Fall Emergency"
              className="p-2 rounded-xl bg-rose-500/12 hover:bg-rose-500/20 border border-rose-500/25 text-rose-600 dark:text-rose-400 active-press"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ SIMULATOR CONTROLS BAR (Visible when simulator active & not on home/settings) ═══ */}
      {useSimulator && activeTab !== 'home' && activeTab !== 'settings' && (
        <div className="bg-slate-100/90 dark:bg-slate-900/40 border-b border-slate-200/70 dark:border-white/[0.04] px-4 sm:px-6 lg:px-8 py-2 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap mr-1">
              <CircleDot className="w-3 h-3 text-cyan-500" />
              Simulate:
            </span>
            {SIM_MODES.map(({ mode, icon: Icon, label, color }) => {
              const isActive = simMode === mode;
              const style = isActive ? COLOR_MAP[color].active : COLOR_MAP[color].idle;
              return (
                <button
                  key={mode}
                  onClick={() => changeSimMode(mode)}
                  className={`px-3 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 active-press transition-all whitespace-nowrap ${style}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT (Adaptive Grid Container) ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-8">

        {activeTab === 'home' && (
          <HomePage
            telemetry={telemetry}
            onNavigate={navigate}
          />
        )}

        {activeTab === 'pressure' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 animate-fade-in stagger-children">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <ActivityCard activity={telemetry.activity} confidence={telemetry.confidence} />
              <MotionVisualizer imu={telemetry.imu} />
            </div>
            <div className="lg:col-span-8">
              <FootHeatmap sensors={telemetry.sensors} />
            </div>
          </div>
        )}

        {activeTab === 'gait' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 animate-fade-in stagger-children">
            <div className="lg:col-span-5">
              <GaitMetrics
                steps={telemetry.steps}
                cadence={telemetry.cadence}
                symmetry={telemetry.symmetry}
                activity={telemetry.activity}
              />
            </div>
            <div className="lg:col-span-7">
              <HistoricalTrends />
            </div>
          </div>
        )}

        {activeTab === 'motion' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 animate-fade-in stagger-children">
            <div className="lg:col-span-7">
              <MotionVisualizer imu={telemetry.imu} />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4">
              <ActivityCard activity={telemetry.activity} confidence={telemetry.confidence} />
              <GaitMetrics
                steps={telemetry.steps}
                cadence={telemetry.cadence}
                symmetry={telemetry.symmetry}
                activity={telemetry.activity}
              />
            </div>
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
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </main>

      {/* ═══ MOBILE FLOATING FROSTED BOTTOM NAVIGATION BAR (< md) ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/93 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/[0.06] mobile-bottom-safe transition-colors">
        <div className="flex items-stretch justify-around px-1 py-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 active-press transition-all duration-150 ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-500'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 dark:bg-cyan-500/12 shadow-glow-cyan'
                    : ''
                }`}>
                  <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.4 : 1.6} />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 shadow-glow-cyan mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
