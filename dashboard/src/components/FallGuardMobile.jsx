import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, PhoneCall, AlertTriangle, Bell, ChevronRight, Shield, Clock, Zap, CircleAlert } from 'lucide-react';
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
    <div className="flex flex-col gap-4 animate-fade-in stagger-children">

      {/* ─── SAFETY STATUS HERO ─── */}
      <div
        className={`glass-panel p-5 relative overflow-hidden transition-all duration-300 animate-fade-in-scale ${
          guardActive ? 'border-emerald-500/30' : 'border-slate-800'
        }`}
        style={{ boxShadow: guardActive ? '0 0 30px rgba(16,185,129,0.12)' : undefined }}
      >
        {/* Ambient glow */}
        <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-3xl pointer-events-none animate-breathe ${
          guardActive ? 'bg-emerald-500/10' : 'bg-slate-700/10'
        }`} />

        <div className="relative flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${guardActive ? 'badge-emerald' : 'badge-amber'} text-[9px]`}>
                {guardActive ? 'GUARD ACTIVE' : 'GUARD PAUSED'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Dual-Trigger AI</span>
            </div>
            <h2 className="text-xl font-bold font-display text-white">Fall Protection</h2>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[260px]">
              Continuous 50 Hz kinematic shock & post-impact posture monitoring.
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={toggleGuard}
            className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 flex items-center flex-shrink-0 ${
              guardActive ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-3.5 border-t border-white/[0.05] text-center">
          {[
            { label: 'Free-Fall', value: '< 0.60 g', icon: CircleAlert, color: 'text-cyan-400' },
            { label: 'Impact', value: '> 2.80 g', icon: Zap, color: 'text-rose-400' },
            { label: 'Grace', value: '15 Seconds', icon: Clock, color: 'text-amber-300' }
          ].map((spec) => (
            <div key={spec.label}>
              <spec.icon className={`w-3.5 h-3.5 ${spec.color} mx-auto mb-1`} />
              <span className="text-[9px] text-slate-500 block">{spec.label}</span>
              <span className={`font-mono font-bold text-[11px] ${spec.color} block mt-0.5`}>{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ACTION BUTTONS ─── */}
      <div className="grid grid-cols-1 gap-3 stagger-children">
        <button
          onClick={handleTestFall}
          className="glass-panel p-4 flex items-center justify-between border-rose-500/30 hover:border-rose-500/50 active-press transition-all bg-rose-500/[0.06] text-left animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Simulate Fall Test</div>
              <div className="text-[10px] text-rose-300/80">Triggers 15s countdown & buzzer alert</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400/60 flex-shrink-0" />
        </button>

        <a
          href="tel:108"
          className="glass-panel p-4 flex items-center justify-between hover:border-cyan-500/30 active-press transition-all text-left animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Emergency SOS</div>
              <div className="text-[10px] text-slate-400">Immediate emergency dispatch call</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
        </a>
      </div>

      {/* ─── EMERGENCY CONTACTS ─── */}
      <div className="glass-panel p-4 animate-fade-in-scale">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            Emergency Contacts
          </h3>
          <span className="text-[10px] text-slate-500">Auto-notified</span>
        </div>

        <div className="flex flex-col gap-2">
          {contacts.map((c, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-white/[0.05] rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Avatar circle */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-cyan-400">{c.initials}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[10px] text-slate-500">{c.role}</div>
                </div>
              </div>
              <a
                href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                onClick={() => nativeBridge.impactMedium()}
                className="p-2 rounded-lg bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/25 transition-colors active-press"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
