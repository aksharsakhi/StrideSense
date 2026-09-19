import React from 'react';
import { Cpu, Monitor, CheckCircle2, X, Battery, Wifi, Radio } from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export default function DeviceSelectorModal({
  isOpen = false,
  onClose = () => {},
  availableDevices = [],
  selectedDeviceId = 'insole_left_01',
  onSelectDevice = () => {}
}) {
  if (!isOpen) return null;

  const handleSelect = (deviceId) => {
    nativeBridge.impactMedium();
    onSelectDevice(deviceId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl animate-fade-in-scale">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Select Telemetry Device</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch active IoT stream source</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Devices List */}
        <div className="flex flex-col gap-3 my-4">
          {availableDevices.map((dev) => {
            const isSelected = dev.id === selectedDeviceId;
            const isHardware = dev.id === 'insole_left_01';
            const Icon = isHardware ? Cpu : Monitor;

            return (
              <div
                key={dev.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(dev.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left active-press ${
                  isSelected
                    ? 'bg-cyan-500/[0.08] dark:bg-cyan-500/[0.12] border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isHardware
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {dev.name || (isHardware ? 'Real ESP32 Smart Insole' : '3D Simulation Studio')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                        {dev.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`badge text-[9px] font-bold ${
                      isHardware ? 'badge-emerald' : 'badge-violet'
                    }`}>
                      {isHardware ? 'PHYSICAL HW' : 'VIRTUAL SIM'}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-500 fill-current" />
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
                    {isSelected ? '● Streaming Now' : 'Tap to Connect'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Real ESP32 hardware and laptop simulation stream on separate channels so data is never mixed up.
        </div>
      </div>
    </div>
  );
}
