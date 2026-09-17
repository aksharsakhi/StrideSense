import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, Bell, ChevronRight, Clock, Zap, CircleAlert } from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export default function FallGuardMobile({
  onTriggerFall = () => {},
  isFallActive = false
}) {
  const [guardActive, setGuardActive] = useState(true);

  const contacts = [
    { name: 'Dr. Rajesh Sharma', role: 'Primary Physician', phone: '+91 98765 43210', initials: 'RS' },
    { name: 'Priya Sakhi', role: 'Emergency Contact', phone: '+91 98111 22334', initials: 'PS' },
    { name: 'Emergency Services', role: 'Ambulance 108', phone: '108', initials: '108' }
  ];

  const handleTestFall = () => {
    nativeBridge.impactHeavy();
    onTriggerFall();
  };

  const toggleGuard = () => {
    nativeBridge.impactLight();
    setGuardActive(!guardActive);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children">

      {/* Header */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">Fall Guard Shield</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time kinematic impact protection & auto-dispatch</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ─── LEFT COLUMN: Hero & Action Buttons ─── */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* Safety Status Hero */}
          <div
            className={`glass-panel p-6 relative overflow-hidden transition-all duration-300 animate-fade-in-scale ${
              guardActive ? 'border-emerald-500/30' : 'border-slate-300 dark:border-slate-800'
            }`}
          >
            {/* Ambient glow */}
            <div
              className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none animate-breathe ${
                guardActive ? 'bg-emerald-500/15' : 'bg-slate-500/10'
              }`}
            />

            <div className="relative flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${guardActive ? 'badge-emerald' : 'badge-amber'} text-[10px]`}>
                    {guardActive ? 'GUARD ACTIVE' : 'GUARD PAUSED'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Dual-Trigger AI</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                  Continuous Fall Protection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Active 50 Hz kinematic impact shock monitoring and post-impact posture recovery verification.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={toggleGuard}
                className={`w-13 h-7 rounded-full p-0.5 transition-colors duration-150 flex items-center flex-shrink-0 touch-manipulation select-none active-press ${
                  guardActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Threshold Specs */}
            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-200/70 dark:border-white/[0.05] text-center">
              {[
                { label: 'Free-Fall', value: '< 0.60 g', icon: CircleAlert, color: 'text-cyan-600 dark:text-cyan-400' },
                { label: 'Impact Peak', value: '> 2.80 g', icon: Zap, color: 'text-rose-600 dark:text-rose-400' },
                { label: 'Grace Period', value: '15 Seconds', icon: Clock, color: 'text-amber-600 dark:text-amber-400' }
              ].map((spec) => (
                <div key={spec.label} className="bg-slate-100/60 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/50 dark:border-white/[0.03]">
                  <spec.icon className={`w-4 h-4 ${spec.color} mx-auto mb-1`} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{spec.label}</span>
                  <span className={`font-mono font-bold text-xs ${spec.color} block mt-0.5`}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={handleTestFall}
              className="glass-panel p-4 flex items-center justify-between border-rose-500/30 hover:border-rose-500/50 active-press touch-manipulation select-none transition-all bg-rose-500/[0.06] text-left animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Simulate Fall Test</div>
                  <div className="text-[11px] text-rose-600/80 dark:text-rose-300/80">15s siren & alert modal</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500" />
            </button>

            <a
              href="tel:108"
              className="glass-panel p-4 flex items-center justify-between hover:border-cyan-500/40 active-press transition-all text-left animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Emergency SOS</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Direct 108 dispatch call</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Emergency Contacts ─── */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-5 animate-fade-in-scale h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Emergency Contacts
                </h3>
                <span className="badge badge-emerald text-[9px]">Auto-Notified</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {contacts.map((c, i) => (
                  <div
                    key={i}
                    className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.05] rounded-2xl p-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">{c.initials}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.role} • {c.phone}</div>
                      </div>
                    </div>
                    <a
                      href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={() => nativeBridge.impactMedium()}
                      className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors active-press"
                      title={`Call ${c.name}`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 text-center">
              GPS telemetry coordinates & heart-rate baseline are automatically attached to dispatch SMS.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
