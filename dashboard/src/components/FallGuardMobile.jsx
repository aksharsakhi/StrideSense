import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, PhoneCall, AlertTriangle, UserPlus, Bell, Clock, ChevronRight } from 'lucide-react';
import { nativeBridge } from '../services/native.js';

export default function FallGuardMobile({
  onTriggerFall = () => {},
  isFallActive = false
}) {
  const [guardActive, setGuardActive] = useState(true);
  const [sensitivity, setSensitivity] = useState('NORMAL'); // 'LOW', 'NORMAL', 'HIGH'

  const contacts = [
    { name: 'Dr. Rajesh Sharma', role: 'Primary Physician', phone: '+91 98765 43210' },
    { name: 'Priya Sakhi', role: 'Emergency Contact', phone: '+91 98111 22334' },
    { name: 'Emergency Medical Services', role: 'Ambulance 108', phone: '108' }
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
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Safety Status Hero Card */}
      <div
        className={`glass-panel p-6 relative overflow-hidden transition-all duration-300 ${
          guardActive ? 'border-emerald-500/40 shadow-glow-emerald' : 'border-slate-800'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className={`badge ${guardActive ? 'badge-emerald' : 'badge-amber'} text-[11px]`}>
                {guardActive ? 'GUARD ACTIVE' : 'GUARD PAUSED'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Dual-Trigger AI</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white mt-2">
              Fall Protection Guard
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Continuous 50 Hz kinematic shock & post-impact posture monitoring.
            </p>
          </div>

          <button
            onClick={toggleGuard}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${
              guardActive ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
            title="Toggle Fall Guard"
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Protection Specs */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-800/80 text-center text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Free-Fall Trigger</span>
            <span className="font-mono font-bold text-cyan-400 mt-0.5 block">&lt; 0.60 g</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Impact Shock</span>
            <span className="font-mono font-bold text-rose-400 mt-0.5 block">&gt; 2.80 g</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Cancel Grace</span>
            <span className="font-mono font-bold text-amber-300 mt-0.5 block">15 Seconds</span>
          </div>
        </div>
      </div>

      {/* Manual Emergency SOS & Test Fall Trigger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleTestFall}
          className="glass-panel p-4 flex items-center justify-between border-rose-500/40 hover:border-rose-500 active-press transition-all bg-rose-500/10 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Simulate Fall Test</div>
              <div className="text-[11px] text-rose-300">Triggers 15s countdown & buzzer</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>

        <a
          href="tel:108"
          className="glass-panel p-4 flex items-center justify-between border-slate-800 hover:border-cyan-500/40 active-press transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Quick Emergency SOS</div>
              <div className="text-[11px] text-slate-400">Immediate telephone dispatch</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </a>
      </div>

      {/* Emergency Contacts List */}
      <div className="glass-panel p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Designated Responders
          </h3>
          <span className="text-[11px] text-slate-400">Auto-notified on fall</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {contacts.map((c, i) => (
            <div
              key={i}
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">{c.name}</div>
                <div className="text-[11px] text-slate-400">{c.role} • {c.phone}</div>
              </div>

              <a
                href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                onClick={() => nativeBridge.impactMedium()}
                className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                title="Call Contact"
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
