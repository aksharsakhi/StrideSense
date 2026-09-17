import React, { useState } from 'react';
import {
  Battery, Wifi, WifiOff, Cpu, Sliders, CheckCircle2, Signal, ChevronRight,
  User, Bell, Moon, Smartphone, Info, ExternalLink, Shield, Radio, Palette,
  HardDrive, Zap, Heart, FileText
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export default function SettingsPage({
  batteryPct = 88,
  batteryVoltage = 3.96,
  isCloudConnected = false,
  isSimulated = true,
  onToggleSource = () => {},
  useSimulator = true
}) {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const batteryColor = batteryPct > 60 ? 'text-emerald-400' : (batteryPct > 20 ? 'text-amber-400' : 'text-rose-400');
  const batteryBg = batteryPct > 60 ? 'from-emerald-500 to-cyan-400' : (batteryPct > 20 ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-red-400');
  const hoursLeft = Math.max(0, ((batteryPct / 100) * 8.5)).toFixed(1);

  const SettingRow = ({ icon: Icon, iconColor, label, subtitle, right, onClick, last }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3.5 px-1 text-left active-press ${
        !last ? 'border-b border-white/[0.04]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-medium text-white block">{label}</span>
          {subtitle && <span className="text-[10px] text-slate-500">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {right}
      </div>
    </button>
  );

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={(e) => { e.stopPropagation(); nativeBridge.impactLight(); onChange(!value); }}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
        value ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
    </button>
  );

  return (
    <div className="flex flex-col gap-4 animate-fade-in stagger-children">

      {/* Header */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl font-bold font-display text-white">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Device, preferences & system info</p>
      </div>

      {/* ─── DEVICE STATUS CARD ─── */}
      <div className="glass-panel p-5 animate-fade-in-scale">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white">StrideSense Smart Insole</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">ESP32 DevKit V1 • insole_left_01</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="badge badge-emerald text-[8px] py-0.5 px-1.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Connected
              </span>
              <span className="text-[10px] text-slate-500 font-mono">FW v1.4.2</span>
            </div>
          </div>
        </div>

        {/* Battery bar */}
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <Battery className={`w-4 h-4 ${batteryColor}`} />
              <span className="text-sm font-mono font-bold text-white">{batteryPct}%</span>
            </div>
            <span className="text-[10px] text-slate-500">{batteryVoltage.toFixed(2)}V • ~{hoursLeft} hrs remaining</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${batteryBg} h-full rounded-full transition-all duration-500`}
              style={{ width: `${batteryPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── DATA SOURCE ─── */}
      <div className="glass-panel px-4 animate-fade-in-scale">
        <SettingRow
          icon={useSimulator ? Signal : Wifi}
          iconColor={useSimulator ? 'bg-cyan-500/15 text-cyan-400' : 'bg-emerald-500/15 text-emerald-400'}
          label="Data Source"
          subtitle={useSimulator ? 'In-app simulator active' : 'Supabase Realtime CDC'}
          right={
            <button
              onClick={(e) => { e.stopPropagation(); nativeBridge.impactMedium(); onToggleSource(); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                useSimulator
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {useSimulator ? 'SIMULATOR' : 'LIVE'}
            </button>
          }
          last
        />
      </div>

      {/* ─── PREFERENCES SECTION ─── */}
      <div className="animate-fade-in-scale">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-1.5 block">Preferences</span>
        <div className="glass-panel px-4">
          <SettingRow
            icon={Heart}
            iconColor="bg-rose-500/15 text-rose-400"
            label="Haptic Feedback"
            subtitle="Vibration on interactions"
            right={<Toggle value={hapticEnabled} onChange={setHapticEnabled} />}
          />
          <SettingRow
            icon={Bell}
            iconColor="bg-amber-500/15 text-amber-400"
            label="Fall Notifications"
            subtitle="Emergency alert push"
            right={<Toggle value={notifications} onChange={setNotifications} />}
          />
          <SettingRow
            icon={Shield}
            iconColor="bg-emerald-500/15 text-emerald-400"
            label="Fall Guard Sensitivity"
            subtitle="Dual-trigger threshold"
            right={<span className="text-[11px] text-emerald-400 font-semibold mr-1">Normal</span>}
            last
          />
        </div>
      </div>

      {/* ─── HARDWARE SPECS ─── */}
      <div className="animate-fade-in-scale">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-1.5 block">Hardware & System</span>
        <div className="glass-panel px-4">
          {[
            { icon: HardDrive, color: 'bg-slate-500/15 text-slate-400', label: 'Microcontroller', val: 'ESP32 240 MHz' },
            { icon: Zap, color: 'bg-cyan-500/15 text-cyan-400', label: 'TinyML Latency', val: '< 0.27 µs' },
            { icon: Cpu, color: 'bg-violet-500/15 text-violet-400', label: 'Sampling Rate', val: '50 Hz (20ms)' },
            { icon: Sliders, color: 'bg-amber-500/15 text-amber-400', label: 'Calibration', val: 'Zero-Tare OK' },
            { icon: Smartphone, color: 'bg-cyan-500/15 text-cyan-400', label: 'App Framework', val: 'Capacitor 6' },
          ].map((row, i, arr) => (
            <SettingRow
              key={i}
              icon={row.icon}
              iconColor={row.color}
              label={row.label}
              right={<span className="text-[11px] font-mono text-slate-300">{row.val}</span>}
              last={i === arr.length - 1}
            />
          ))}
        </div>
      </div>

      {/* ─── ABOUT ─── */}
      <div className="animate-fade-in-scale">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-1.5 block">About</span>
        <div className="glass-panel px-4">
          <SettingRow
            icon={Info}
            iconColor="bg-slate-500/15 text-slate-400"
            label="StrideSense"
            subtitle="AI-Powered Smart Insole v1.0"
            right={<span className="text-[10px] text-slate-600">Build 2026.09</span>}
          />
          <SettingRow
            icon={FileText}
            iconColor="bg-slate-500/15 text-slate-400"
            label="ML Model"
            subtitle="RandomForest 8-tree • 98.97% accuracy"
            right={<span className="text-[10px] text-emerald-400">Verified</span>}
            last
          />
        </div>
      </div>

      {/* Bottom padding for nav */}
      <div className="h-4" />
    </div>
  );
}
