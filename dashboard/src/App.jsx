import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  HeartPulse,
  Footprints,
  Activity,
  ShieldAlert,
  Settings,
  Battery,
  Wifi,
  Sun,
  Moon,
  Monitor,
  Brain,
  Cpu,
  ChevronDown
} from 'lucide-react';

import HomePage from './components/HomePage.jsx';
import HealthPage from './components/HealthPage.jsx';
import FootHeatmap from './components/FootHeatmap.jsx';
import ActivityCard from './components/ActivityCard.jsx';
import GaitMetrics from './components/GaitMetrics.jsx';
import MotionVisualizer from './components/MotionVisualizer.jsx';
import FallAlertModal from './components/FallAlertModal.jsx';
import HistoricalTrends from './components/HistoricalTrends.jsx';
import FallGuardMobile from './components/FallGuardMobile.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import DeviceSelectorModal from './components/DeviceSelectorModal.jsx';

import { supabaseService } from './services/supabase.js';
import { healthService } from './services/healthService.js';
import { nativeBridge } from './services/native.js';
import { notificationService } from './services/notifications.js';

/* ─── NAV TABS ───────────────────────────────────────── */
const TABS = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'health',   label: 'Health',   icon: HeartPulse },
  { id: 'pressure', label: 'Pressure', icon: Footprints },
  { id: 'motion',   label: 'Motion',   icon: Brain },
  { id: 'safety',   label: 'Guard',    icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings }
];

/* ─── MEMOIZED TOP HEADER ────────────────────────────── */
const TopHeader = React.memo(function TopHeader({
  activeTab,
  pageTitle,
  theme,
  batteryPct,
  isConnected,
  selectedDeviceId,
  onOpenDeviceSelector,
  onNavigate,
  onCycleTheme
}) {
  const isHardware = selectedDeviceId === 'insole_left_01';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
      {/* Brand or Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 active-press touch-manipulation select-none text-left"
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
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 active-press touch-manipulation select-none transition-all duration-150 ${
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
        {/* Device Switcher Button */}
        <button
          type="button"
          onClick={onOpenDeviceSelector}
          title="Switch Active Insole Device"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] hover:border-cyan-500/40 text-xs font-semibold text-slate-800 dark:text-white active-press touch-manipulation select-none transition-all"
        >
          {isHardware ? (
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          )}
          <span className="font-mono text-[11px] font-bold">
            {isHardware ? 'ESP32 HW' : '3D SIM'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={onCycleTheme}
          title={`Theme: ${theme} (Click to toggle)`}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 active-press touch-manipulation select-none transition-all flex items-center gap-1 text-xs"
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
          <Battery className={`w-3.5 h-3.5 ${batteryPct > 20 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
          <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-white">{batteryPct}%</span>
        </div>

        {/* Live Cloud Status Badge */}
        <div
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span className="font-mono">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>
    </div>
  );
});

/* ─── MEMOIZED MOBILE BOTTOM NAVIGATION BAR ─────────── */
const MobileBottomNav = React.memo(function MobileBottomNav({ activeTab, onNavigate }) {
  return (
    <nav className="md:hidden mobile-bottom-nav mobile-bottom-safe">
      <div className="flex items-stretch justify-around px-1 py-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 active-press touch-manipulation select-none transition-all duration-75 ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-100 ${
                isActive
                  ? 'bg-cyan-500/15 dark:bg-cyan-500/20 shadow-glow-cyan'
                  : ''
              }`}>
                <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.4 : 1.7} />
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
  );
});

/* ─── Default empty telemetry ─── */
const EMPTY_TELEMETRY = {
  timestamp: Date.now(),
  activity: '—',
  confidence: 0,
  steps: 0,
  cadence: 0,
  symmetry: 0,
  fallAlert: false,
  fallEmergency: false,
  batteryPct: 0,
  batteryVoltage: 0,
  sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 },
  imu: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, pitch: 0, roll: 0, svmA: 0 }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [telemetry, setTelemetry] = useState(EMPTY_TELEMETRY);
  const [fallModalOpen, setFallModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('stridesense_theme') || 'system');

  // Device Selection State
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => supabaseService.getDeviceId());
  const [availableDevices, setAvailableDevices] = useState([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  /* ─── Fetch Available Devices ─────────── */
  useEffect(() => {
    supabaseService.fetchAvailableDevices().then((devs) => {
      setAvailableDevices(devs);
    });
  }, []);

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

  /* ─── Init Native Bridge & Notifications ─── */
  useEffect(() => {
    nativeBridge.init();
    notificationService.init();
  }, []);

  /* ─── Supabase Real-Time Telemetry Stream ────────── */
  useEffect(() => {
    if (!supabaseService.isConfigured()) {
      console.warn('[StrideSense] Supabase not configured — check .env');
      return;
    }

    supabaseService.connectRealtime();
    setIsConnected(true);

    const unsub = supabaseService.subscribeTelemetry((data) => {
      setTelemetry(data);
      healthService.updateLiveTelemetry(data);
      setIsConnected(true);
      if (data.fallAlert && !fallModalOpen) {
        nativeBridge.triggerEmergencyVibration();
        notificationService.notifyFallDetected(data);
        setFallModalOpen(true);
      }
    });

    // Load latest telemetry for active device
    supabaseService.fetchLatestTelemetry().then((latest) => {
      if (latest) {
        setTelemetry(latest);
        healthService.updateLiveTelemetry(latest);
      }
    });

    return () => {
      unsub();
      supabaseService.disconnectRealtime();
      setIsConnected(false);
    };
  }, [selectedDeviceId]);

  /* ─── Handlers ────────────────────────── */
  const navigate = useCallback((tab) => {
    nativeBridge.impactLight();
    const target = tab === 'gait' ? 'health' : tab;
    setActiveTab(target);
  }, []);

  const cycleTheme = useCallback(() => {
    nativeBridge.impactLight();
    setTheme((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }, []);

  const cancelFall = useCallback(() => {
    nativeBridge.impactMedium();
    setFallModalOpen(false);
  }, []);

  const handleSelectDevice = useCallback((newId) => {
    setSelectedDeviceId(newId);
    supabaseService.setDeviceId(newId);
  }, []);

  /* ─── Page title ──────────────────────── */
  const PAGE_TITLES = {
    home: null,
    health: 'Mobility & Health',
    pressure: 'Pressure Map',
    gait: 'Mobility & Health',
    motion: 'IMU Kinematics',
    safety: 'Fall Guard',
    settings: null
  };
  const pageTitle = PAGE_TITLES[activeTab];

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-white transition-colors duration-200">

      {/* ═══ DEVICE SELECTION MODAL ═══ */}
      <DeviceSelectorModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        availableDevices={availableDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={handleSelectDevice}
      />

      {/* ═══ FALL EMERGENCY MODAL ═══ */}
      <FallAlertModal isOpen={fallModalOpen} onCancel={cancelFall} initialSeconds={15} />

      {/* ═══ TOP FIXED APP CHROME (Header) ═══ */}
      <header className="mobile-top-header mobile-header-safe">
        <TopHeader
          activeTab={activeTab}
          pageTitle={pageTitle}
          theme={theme}
          batteryPct={telemetry.batteryPct}
          isConnected={isConnected}
          selectedDeviceId={selectedDeviceId}
          onOpenDeviceSelector={() => setIsDeviceModalOpen(true)}
          onNavigate={navigate}
          onCycleTheme={cycleTheme}
        />
      </header>

      {/* ═══ MAIN CONTENT (Adaptive Grid Container) ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(env(safe-area-inset-top,12px)+68px)] md:pt-20 pb-[calc(env(safe-area-inset-bottom,16px)+88px)] md:pb-8">

        {activeTab === 'home' && (
          <HomePage
            telemetry={telemetry}
            deviceId={selectedDeviceId}
            onSwitchDevice={() => setIsDeviceModalOpen(true)}
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

        {(activeTab === 'health' || activeTab === 'gait') && (
          <HealthPage
            telemetry={telemetry}
            onNavigate={navigate}
          />
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
              isFallActive={telemetry.fallAlert}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            batteryPct={telemetry.batteryPct}
            batteryVoltage={telemetry.batteryVoltage}
            isCloudConnected={isConnected}
            selectedDeviceId={selectedDeviceId}
            onOpenDeviceSelector={() => setIsDeviceModalOpen(true)}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </main>

      {/* ═══ MOBILE FLOATING FROSTED BOTTOM NAVIGATION BAR (< md) ═══ */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={navigate}
      />

    </div>
  );
}
