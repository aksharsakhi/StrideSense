import React, { useState } from 'react';
import {
  Battery, Wifi, Cpu, Sliders, CheckCircle2, Signal,
  Bell, HardDrive, Zap, Heart, FileText, Info,
  Sun, Moon, Monitor, Palette, Sparkles, Shield
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export default function SettingsPage({
  batteryPct = 88,
  batteryVoltage = 3.96,
  isCloudConnected = false,
  isSimulated = true,
  onToggleSource = () => {},
  useSimulator = true,
  theme = 'system',
  onThemeChange = () => {}
}) {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const batteryColor = batteryPct > 60
    ? 'text-emerald-500 dark:text-emerald-400'
    : (batteryPct > 20 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400');
  const batteryBg = batteryPct > 60
    ? 'from-emerald-500 to-cyan-400'
    : (batteryPct > 20 ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-red-400');
  const hoursLeft = Math.max(0, ((batteryPct / 100) * 8.5)).toFixed(1);

  const SettingRow = ({ icon: Icon, iconColor, label, subtitle, right, onClick, last }) => (
    <div
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3.5 px-1 text-left ${
        onClick ? 'cursor-pointer active-press' : ''
      } ${!last ? 'border-b border-slate-200/70 dark:border-white/[0.04]' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white block">{label}</span>
          {subtitle && <span className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {right}
      </div>
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        nativeBridge.impactLight();
        onChange(!value);
      }}
      className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
        value ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
    </button>
  );

  const handleThemeSelect = (newTheme) => {
    nativeBridge.impactMedium();
    onThemeChange(newTheme);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children">

      {/* Header */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Device, preferences & system specifications</p>
      </div>

      {/* Responsive 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ─── LEFT COLUMN ─── */}
        <div className="flex flex-col gap-5">

          {/* Device Status Card */}
          <div className="glass-panel p-5 animate-fade-in-scale">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">StrideSense Smart Insole</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ESP32 DevKit V1 • insole_left_01</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge badge-emerald text-[9px]">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">FW v1.4.2</span>
                </div>
              </div>
            </div>

            {/* Battery bar */}
            <div className="mt-5 pt-3.5 border-t border-slate-200/70 dark:border-white/[0.04]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <Battery className={`w-4 h-4 ${batteryColor}`} />
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{batteryPct}%</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {batteryVoltage.toFixed(2)}V • ~{hoursLeft} hrs remaining
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${batteryBg} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${batteryPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Appearance & Theme Selector */}
          <div className="glass-panel p-5 animate-fade-in-scale">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance & Theme</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize visual mode and contrast</p>
              </div>
            </div>

            {/* 3-Way Segmented Controller */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300/50 dark:border-white/[0.05]">
              {[
                { id: 'system', label: 'System', icon: Monitor },
                { id: 'light',  label: 'Light',  icon: Sun },
                { id: 'dark',   label: 'Dark',   icon: Moon },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleThemeSelect(id)}
                    className={`py-2 px-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-150 active-press ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-white/[0.08]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
              {theme === 'system'
                ? 'Adapts automatically to your device system preference'
                : theme === 'light'
                ? 'Crisp Apple Health / Cupertino high-contrast light styling'
                : 'Ultra-sleek cyber-biomedical neon dark glassmorphism'}
            </p>
          </div>

          {/* Data Source */}
          <div className="glass-panel px-4 animate-fade-in-scale">
            <SettingRow
              icon={useSimulator ? Signal : Wifi}
              iconColor={useSimulator ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}
              label="Data Source"
              subtitle={useSimulator ? 'In-app biomechanics simulator active' : 'Supabase Realtime CDC telemetry stream'}
              right={
                <button
                  onClick={(e) => { e.stopPropagation(); nativeBridge.impactMedium(); onToggleSource(); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active-press ${
                    useSimulator
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {useSimulator ? 'SIMULATOR' : 'LIVE CLOUD'}
                </button>
              }
              last
            />
          </div>

          {/* Preferences Section */}
          <div className="animate-fade-in-scale">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 mb-1.5 block">
              Preferences
            </span>
            <div className="glass-panel px-4">
              <SettingRow
                icon={Heart}
                iconColor="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                label="Haptic Feedback"
                subtitle="Tactile vibration on interactions"
                right={<Toggle value={hapticEnabled} onChange={setHapticEnabled} />}
              />
              <SettingRow
                icon={Bell}
                iconColor="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                label="Fall Notifications"
                subtitle="Emergency alert push & siren dispatch"
                right={<Toggle value={notifications} onChange={setNotifications} />}
              />
              <SettingRow
                icon={Shield}
                iconColor="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                label="Fall Guard Sensitivity"
                subtitle="Dual-trigger threshold (0.6g / 2.8g)"
                right={<span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mr-1">Normal</span>}
                last
              />
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="flex flex-col gap-5">

          {/* Hardware Specs */}
          <div className="animate-fade-in-scale">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 mb-1.5 block">
              Hardware & System
            </span>
            <div className="glass-panel px-4">
              {[
                { icon: HardDrive, color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400', label: 'Microcontroller', val: 'ESP32 Dual-Core 240 MHz' },
                { icon: Zap, color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', label: 'TinyML Latency', val: '< 0.27 µs' },
                { icon: Cpu, color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', label: 'Sampling Rate', val: '50 Hz (20ms cycle)' },
                { icon: Sliders, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', label: 'Calibration', val: 'Zero-Tare Baseline OK' },
                { icon: Sparkles, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', label: 'Mobile Native Core', val: 'Capacitor 6 (iOS/Android)' }
              ].map((row, i, arr) => (
                <SettingRow
                  key={i}
                  icon={row.icon}
                  iconColor={row.color}
                  label={row.label}
                  right={<span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{row.val}</span>}
                  last={i === arr.length - 1}
                />
              ))}
            </div>
          </div>

          {/* About & Clinical Intelligence */}
          <div className="animate-fade-in-scale">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 mb-1.5 block">
              About StrideSense
            </span>
            <div className="glass-panel px-4">
              <SettingRow
                icon={Info}
                iconColor="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                label="StrideSense Core"
                subtitle="AI-Powered Smart Insole Biomechanics"
                right={<span className="text-xs font-mono text-slate-500">v1.4.2</span>}
              />
              <SettingRow
                icon={FileText}
                iconColor="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                label="TinyML Model Engine"
                subtitle="RandomForest 8-tree • 98.97% validation accuracy"
                right={<span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Validated</span>}
                last
              />
            </div>
          </div>

        </div>

      </div>

      <div className="h-4" />
    </div>
  );
}
