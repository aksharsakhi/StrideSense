import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  HeartPulse,
  Footprints,
  Activity,
  ShieldAlert,
  Settings,
  Battery,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Monitor,
  Brain,
  Cpu,
  ChevronDown,
  Award,
  ExternalLink
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
import WalkingProfileAnalysis from './components/WalkingProfileAnalysis.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

import { supabaseService } from './services/supabase.js';
import { healthService } from './services/healthService.js';
import { nativeBridge } from './services/native.js';
import { notificationService } from './services/notifications.js';

/* ─── NAV TABS ───────────────────────────────────────── */
const TABS = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'profile',  label: 'Profile',  icon: Award },
  { id: 'pressure', label: 'Pressure', icon: Footprints },
  { id: 'health',   label: 'Health',   icon: HeartPulse },
  { id: 'motion',   label: 'Motion',   icon: Brain },
  { id: 'safety',   label: 'Guard',    icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings }
];

/* ─── MEMOIZED TOP HEADER ────────────────────────────── */
const TopHeader = React.memo(function TopHeader({
  activeTab,
  pageTitle,
  theme,
  telemetry = {},
  isConnected,
  selectedDeviceId,
  onOpenDeviceSelector,
  onNavigate,
  onCycleTheme
}) {
  const isHardware = selectedDeviceId === 'stridesense_esp32_01' || selectedDeviceId?.includes('hw') || selectedDeviceId?.includes('esp32') || selectedDeviceId?.includes('01');
  const isBilateral = selectedDeviceId === 'stridesense_esp32_01' || selectedDeviceId?.startsWith('bilateral');
  const leftBattery = telemetry.left?.batteryPct ?? telemetry.batteryPct ?? 95;
  const rightBattery = telemetry.right?.batteryPct ?? telemetry.batteryPct ?? 95;
  const overallBattery = telemetry.batteryPct ?? 95;

  const getDeviceBadge = () => {
    if (selectedDeviceId === 'stridesense_esp32_01' || selectedDeviceId === 'bilateral_hw') return '1x ESP32';
    if (selectedDeviceId === 'bilateral_sim') return '3D SIM';
    if (selectedDeviceId === 'insole_left_02') return 'SIM L';
    if (selectedDeviceId === 'insole_right_02') return 'SIM R';
    return isHardware ? '1x ESP32' : '3D SIM';
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-14">
      {/* Brand or Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 active-press touch-manipulation select-none text-left"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 p-[2px] shadow-md shadow-cyan-500/15 flex-shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[9px] flex items-center justify-center">
              <Footprints className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px] text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <span className="text-sm sm:text-base font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
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
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Direct Link to 3D Virtual Studio */}
        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"
          title="Open 3D Virtual Simulation Studio (Port 5174)"
          className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-[11px] font-bold text-violet-600 dark:text-violet-400 active-press transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          <span>3D Studio</span>
        </a>

        {/* Device Switcher Button */}
        <button
          type="button"
          onClick={onOpenDeviceSelector}
          title="Switch Active Insole Device"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] hover:border-cyan-500/40 text-xs font-semibold text-slate-800 dark:text-white active-press touch-manipulation select-none transition-all shadow-sm"
        >
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold">
            {getDeviceBadge()}
          </span>
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
        </button>

        {/* Battery Pill */}
        <div
          title={isHardware ? `1x ESP32 Battery: ${overallBattery}% (${(telemetry.batteryVoltage ?? 4.08).toFixed(2)}V)` : `Virtual Insole Battery: L:${leftBattery}% R:${rightBattery}%`}
          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] px-2 py-1 rounded-xl"
        >
          <Battery className={`w-3.5 h-3.5 ${overallBattery > 20 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
          <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-white tabular-nums">
            {overallBattery}%
          </span>
        </div>

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={onCycleTheme}
          title={`Theme: ${theme}`}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 active-press touch-manipulation select-none transition-all flex items-center justify-center text-xs"
        >
          {theme === 'system' ? (
            <Monitor className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          ) : theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-cyan-400" />
          )}
        </button>

        {/* Settings & Profile Button */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          title="Patient Profile & Settings"
          className={`p-1.5 sm:p-2 rounded-xl border transition-all active-press flex items-center justify-center ${
            activeTab === 'settings'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 shadow-glow-cyan'
              : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Live Cloud Status Badge (Visible on Desktop md+) */}
        <div
          className={`hidden md:flex px-2.5 py-1 rounded-xl text-[10px] font-bold border items-center gap-1.5 ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono tracking-tight">{isHardware ? 'LIVE ESP32' : 'LIVE SIM'}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-500" />
              <span className="font-mono tracking-tight">STANDBY</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

/* ─── MEMOIZED MOBILE BOTTOM NAVIGATION BAR ─────────── */
const MOBILE_TABS = [
  { id: 'home',     label: 'Home',     icon: Home },
  { id: 'pressure', label: 'Pressure', icon: Footprints },
  { id: 'profile',  label: 'Gait Lab', icon: Award },
  { id: 'health',   label: 'Mobility', icon: HeartPulse },
  { id: 'safety',   label: 'Guard',    icon: ShieldAlert },
];

const MobileBottomNav = React.memo(function MobileBottomNav({ activeTab, onNavigate }) {
  return (
    <nav className="md:hidden mobile-bottom-nav mobile-bottom-safe">
      <div className="flex items-stretch justify-around px-2 py-1.5">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 active-press touch-manipulation select-none transition-all duration-150 ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/15 dark:bg-cyan-500/20 shadow-glow-cyan transform -translate-y-0.5'
                  : ''
              }`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.7} />
              </div>
              <span className={`text-[10px] font-bold leading-none tracking-tight truncate max-w-full px-0.5 ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 shadow-glow-cyan" />
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
  activity: 'Offline',
  confidence: 0,
  steps: 0,
  cadence: 0,
  symmetry: 100,
  fallAlert: false,
  fallEmergency: false,
  batteryPct: 95,
  batteryVoltage: 4.10,
  isOnline: false,
  sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, left: { p1: 0, p2: 0 }, right: { p1: 0, p2: 0 } },
  left: { isOnline: false, side: 'left', sensors: { p1: 0, p2: 0 }, imu: { pitch: 0, roll: 0, svmA: 1.0 } },
  right: { isOnline: false, side: 'right', sensors: { p1: 0, p2: 0 }, imu: { pitch: 0, roll: 0, svmA: 1.0 } },
  bilateral: { leftForce: 0, rightForce: 0, totalForce: 0, estNewtons: 0, estLeftNewtons: 0, estRightNewtons: 0, leftPct: 50, rightPct: 50, symmetry: 100, cop: { x: 0, y: 0 } },
  imu: { ax: 0, ay: 0, az: 1.0, gx: 0, gy: 0, gz: 0, pitch: 0, roll: 0, svmA: 1.0 }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [telemetry, setTelemetry] = useState(EMPTY_TELEMETRY);
  const [fallModalOpen, setFallModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('stridesense_theme') || 'system');

  const lastPacketTimeRef = useRef(0);
  // Use refs for fall alert state so the subscriber closure always sees the current value
  const fallModalOpenRef = useRef(false);
  const lastFallAlertTimeRef = useRef(0); // Dedup: prevent re-firing during the same fall event (1 Hz packets)

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

  /* ─── Heartbeat Monitor: Detect Offline Device ───────── */
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const lastTime = lastPacketTimeRef.current;
      // If hardware or simulation device hasn't sent a packet in > 4.5 seconds, transition to Offline
      if (lastTime > 0 && (now - lastTime) > 4500) {
        setIsDeviceOnline(false);
        setIsConnected(false);
        lastPacketTimeRef.current = 0;
        setTelemetry((prev) => ({
          ...prev,
          isOnline: false,
          activity: 'Offline',
          confidence: 0,
          cadence: 0,
          fallAlert: false,
          fallEmergency: false,
          sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, left: { p1: 0, p2: 0 }, right: { p1: 0, p2: 0 } },
          left: { ...(prev.left || {}), isOnline: false, sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 } },
          right: { ...(prev.right || {}), isOnline: false, sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 } },
          bilateral: { ...(prev.bilateral || {}), leftForce: 0, rightForce: 0, totalForce: 0, estNewtons: 0, estLeftNewtons: 0, estRightNewtons: 0, leftPct: 50, rightPct: 50, cop: { x: 0, y: 0 } }
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
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

    const unsub = supabaseService.subscribeTelemetry((data) => {
      const isOnline = Boolean(data && data.isOnline);
      if (isOnline) {
        lastPacketTimeRef.current = Date.now();
        setIsDeviceOnline(true);
        setIsConnected(true);
        healthService.updateLiveTelemetry(data, selectedDeviceId);
      } else {
        lastPacketTimeRef.current = 0;
        // Fall no longer active — reset dedup so next fall re-arms alert
        lastFallAlertTimeRef.current = 0;
        setIsDeviceOnline(false);
        setIsConnected(false);
      }
      setTelemetry(data);

      // Check if fall detected by either TinyML or Fall Guard Engine
      const isFall = Boolean(data.fallAlert) ||
        Boolean(data.fallEmergency) ||
        (data.activity && String(data.activity).toLowerCase() === 'fall');

      const now = Date.now();
      // Fire alert if:
      //  1. A fall is detected and we are online
      //  2. The modal is not already showing (ref-based, no stale closure)
      //  3. At least 15s has passed since last fall alert fire (covers same multi-packet fall event)
      if (isFall && isOnline && !fallModalOpenRef.current && (now - lastFallAlertTimeRef.current > 15000)) {
        console.log('[FallGuard] 🚨 Triggering fall alert modal & notification:', data);
        lastFallAlertTimeRef.current = now;
        fallModalOpenRef.current = true;
        nativeBridge.triggerEmergencyVibration();
        notificationService.notifyFallDetected(data);
        setFallModalOpen(true);
      }

      // Reset dedup after fall clears (no fallAlert and not emergency)
      if (!isFall && lastFallAlertTimeRef.current > 0 && (now - lastFallAlertTimeRef.current > 20000)) {
        lastFallAlertTimeRef.current = 0;
      }
    });

    // Load latest telemetry for active device
    supabaseService.fetchLatestTelemetry().then((latest) => {
      if (latest && latest.isOnline) {
        lastPacketTimeRef.current = Date.now();
        setIsDeviceOnline(true);
        setIsConnected(true);
        setTelemetry(latest);
        healthService.updateLiveTelemetry(latest, selectedDeviceId);
      } else {
        lastPacketTimeRef.current = 0;
        setIsDeviceOnline(false);
        setIsConnected(false);
        const emptyState = supabaseService.getEmptyTelemetryForDevice(selectedDeviceId);
        if (latest) {
          const packetDate = new Date(latest.timestamp || 0);
          const isFromToday = packetDate.toDateString() === new Date().toDateString();
          if (isFromToday) {
            emptyState.steps = latest.steps || 0;
            healthService.updateLiveTelemetry(latest, selectedDeviceId);
          } else {
            emptyState.steps = 0;
          }
          emptyState.timestamp = latest.timestamp || Date.now();
        }
        setTelemetry(emptyState);
      }
    });

    return () => {
      unsub();
      supabaseService.disconnectRealtime();
      setIsDeviceOnline(false);
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
    fallModalOpenRef.current = false;
    setFallModalOpen(false);
    // After cancel, allow re-alerting for the next independent fall event (reset dedup)
    lastFallAlertTimeRef.current = 0;
  }, []);

  const triggerTestFall = useCallback(() => {
    console.log('[FallGuard] Manual test fall alert triggered');
    nativeBridge.triggerEmergencyVibration();
    notificationService.notifyFallDetected({
      imu: { svmA: 3.82 },
      timestamp: Date.now()
    });
    setFallModalOpen(true);
  }, []);

  const handleSelectDevice = useCallback((newId) => {
    setSelectedDeviceId(newId);
    supabaseService.setDeviceId(newId);
    healthService.setDeviceId(newId);
    lastPacketTimeRef.current = 0;
    setIsDeviceOnline(false);
    setIsConnected(false);
    setTelemetry(supabaseService.getEmptyTelemetryForDevice(newId));
  }, []);

  /* ─── Page title ──────────────────────── */
  const PAGE_TITLES = {
    home: null,
    profile: 'Walking Profile & Pattern Lab',
    health: 'Mobility & Health',
    pressure: 'Bilateral Pressure Map',
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
      <header className="mobile-top-header mobile-header-safe overflow-x-hidden">
        <TopHeader
          activeTab={activeTab}
          pageTitle={pageTitle}
          theme={theme}
          telemetry={telemetry}
          isConnected={isDeviceOnline}
          selectedDeviceId={selectedDeviceId}
          onOpenDeviceSelector={() => setIsDeviceModalOpen(true)}
          onNavigate={navigate}
          onCycleTheme={cycleTheme}
        />
      </header>

      {/* ═══ MAIN CONTENT (Adaptive Grid Container) ═══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(env(safe-area-inset-top,12px)+68px)] md:pt-20 pb-[calc(env(safe-area-inset-bottom,16px)+88px)] md:pb-8">
        <ErrorBoundary key={activeTab} onGoHome={() => navigate('home')}>
          {activeTab === 'home' && (
            <HomePage
              telemetry={telemetry}
              deviceId={selectedDeviceId}
              isOnline={isDeviceOnline}
              onSwitchDevice={() => setIsDeviceModalOpen(true)}
              onNavigate={navigate}
            />
          )}

          {activeTab === 'profile' && (
            <WalkingProfileAnalysis
              telemetry={telemetry}
              onNavigate={navigate}
            />
          )}

          {activeTab === 'pressure' && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 animate-fade-in stagger-children">
              <div className="lg:col-span-4 flex flex-col gap-4">
                <ActivityCard activity={telemetry.activity} confidence={telemetry.confidence} />
                <MotionVisualizer imu={telemetry.imu} deviceId={selectedDeviceId} />
              </div>
              <div className="lg:col-span-8">
                <FootHeatmap
                  sensors={telemetry.sensors}
                  bilateral={telemetry.bilateral}
                  telemetry={telemetry}
                />
              </div>
            </div>
          )}

          {(activeTab === 'health' || activeTab === 'gait') && (
            <HealthPage
              telemetry={telemetry}
              deviceId={selectedDeviceId}
              onNavigate={navigate}
            />
          )}

          {activeTab === 'motion' && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 animate-fade-in stagger-children">
              <div className="lg:col-span-7">
                <MotionVisualizer imu={telemetry.imu} deviceId={selectedDeviceId} />
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
                onTriggerTestFall={triggerTestFall}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              batteryPct={telemetry.batteryPct}
              batteryVoltage={telemetry.batteryVoltage}
              isCloudConnected={isDeviceOnline}
              selectedDeviceId={selectedDeviceId}
              onOpenDeviceSelector={() => setIsDeviceModalOpen(true)}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* ═══ MOBILE FLOATING FROSTED BOTTOM NAVIGATION BAR (< md) ═══ */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={navigate}
      />

    </div>
  );
}
