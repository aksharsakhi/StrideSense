import React from 'react';
import { Cpu, Monitor, CheckCircle2, X, Battery, Wifi, Radio, Footprints, Layers } from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export default function DeviceSelectorModal({
  isOpen = false,
  onClose = () => {},
  availableDevices = [],
  selectedDeviceId = 'bilateral_sim',
  onSelectDevice = () => {}
}) {
  if (!isOpen) return null;

  const handleSelect = (deviceId) => {
    nativeBridge.impactMedium();
    onSelectDevice(deviceId);
    onClose();
  };

  const bilateralPairs = availableDevices.filter((d) => d.id?.startsWith('bilateral') || d.id?.includes('stridesense_esp32') || d.type === 'pair');
  const singleNodes = availableDevices.filter((d) => !d.id?.startsWith('bilateral') && !d.id?.includes('stridesense_esp32') && d.type !== 'pair');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl animate-fade-in-scale my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Select Telemetry Setup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bilateral Dual-Foot Pairs & Insole Nodes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex flex-col gap-4 flex-1">
          {/* Section 1: Bilateral Pairs (Recommended) */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Footprints className="w-4 h-4 text-cyan-500" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Full Bilateral Setups (Both Legs)
              </span>
              <span className="badge badge-cyan text-[9px] ml-auto">RECOMMENDED</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {bilateralPairs.map((dev) => {
                const isSelected = dev.id === selectedDeviceId;
                const isHardware = dev.id === 'bilateral_hw' || dev.id === 'stridesense_esp32_01' || dev.id?.includes('esp32');
                const Icon = isHardware ? Cpu : Monitor;

                return (
                  <div
                    key={dev.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(dev.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left active-press ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/[0.12] to-emerald-500/[0.12] border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          isHardware
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {dev.name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                            {dev.id === 'stridesense_esp32_01' ? 'Single ESP32 (4x FSR: Left + Right)' : `${dev.leftId} + ${dev.rightId}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`badge text-[9px] font-bold ${
                          isHardware ? 'badge-emerald' : 'badge-violet'
                        }`}>
                          {dev.badge}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-cyan-500 fill-current" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono">
                          <Battery className="w-3.5 h-3.5 text-emerald-500" />
                          {dev.battery_pct || 90}% ({dev.battery_voltage || 4.0}V)
                        </span>
                        <span className="font-mono">
                          {dev.firmware_version || 'v1.4.2'}
                        </span>
                      </div>
                      <span className={`font-semibold ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                        {isSelected ? '● Streaming Bilateral' : 'Tap to Activate Pair'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Individual Insole Nodes */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Individual Insole Nodes (1 Leg)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {singleNodes.map((dev) => {
                const isSelected = dev.id === selectedDeviceId;
                const isHardware = dev.id?.includes('01');
                const isLeft = dev.id?.includes('left');

                return (
                  <div
                    key={dev.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(dev.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left active-press ${
                      isSelected
                        ? 'bg-cyan-500/[0.1] border-cyan-500/60 shadow-sm'
                        : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {isLeft ? 'Left Foot' : 'Right Foot'} ({isHardware ? 'Hardware' : 'Virtual'})
                        </span>
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                          {dev.id}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-500 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/40 dark:border-white/[0.03]">
                      <span>{isHardware ? 'ESP32 Device' : 'Simulation'}</span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {isSelected ? 'Active' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-slate-200/70 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400 text-center flex-shrink-0">
          Bilateral pairs synchronize Left and Right foot telemetry in real time with 180° antiphase kinematics.
        </div>
      </div>
    </div>
  );
}
