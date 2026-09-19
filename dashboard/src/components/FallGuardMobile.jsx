import React, { useState, useEffect } from 'react';
import {
  PhoneCall, AlertTriangle, Bell, ChevronRight, Clock,
  Zap, CircleAlert, Plus, Star, MessageSquare, X, Shield, Smartphone
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';
import { emergencyContactsService } from '../services/emergencyContacts.js';

export default function FallGuardMobile({
  isFallActive = false
}) {
  const [guardActive, setGuardActive] = useState(true);
  const [contacts, setContacts] = useState(() => emergencyContactsService.getContacts());
  const [settings, setSettings] = useState(() => emergencyContactsService.getSettings());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
    isPrimary: false,
    notifySms: true
  });

  useEffect(() => {
    const unsub = emergencyContactsService.subscribe((updatedContacts, updatedSettings) => {
      setContacts(updatedContacts);
      setSettings(updatedSettings);
    });
    return unsub;
  }, []);

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  const toggleGuard = () => {
    nativeBridge.impactLight();
    setGuardActive(!guardActive);
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    nativeBridge.impactMedium();
    emergencyContactsService.addContact(formData);
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', role: '', isPrimary: false, notifySms: true });
  };

  const triggerManualSOS = () => {
    nativeBridge.impactHeavy();
    emergencyContactsService.dispatchEmergency({
      reason: 'Manual SOS Triggered from Fall Guard Shield'
    });
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children pb-10">

      {/* Header */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">Fall Guard Shield</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time kinematic impact protection & automated call dispatch</p>
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
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">50Hz TinyML Shock Guard</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                  Continuous Fall Protection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Active 50 Hz kinematic impact shock monitoring and automated emergency dispatch.
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

          {/* Primary Call Dispatch Hero Button */}
          {primaryContact && (
            <button
              type="button"
              onClick={triggerManualSOS}
              className="glass-panel p-4 flex items-center justify-between border-rose-500/30 hover:border-rose-500/60 bg-rose-500/[0.06] dark:bg-rose-500/[0.08] active-press transition-all text-left animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                  <PhoneCall className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Emergency SOS Call</span>
                    <span className="badge badge-rose text-[9px] px-1.5 py-0.5">MAIN CONTACT</span>
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                    Calls {primaryContact.name} ({primaryContact.phone}) + Broadcasts SMS
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-400" />
            </button>
          )}

          {/* Routing Specs Bar */}
          <div className="glass-panel p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Cellular Line:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{settings.preferredSimLabel || 'Default Line'}</span>
            </div>
            <span className="badge badge-emerald text-[10px]">Ready</span>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Emergency Contacts ─── */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-5 animate-fade-in-scale h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Emergency Contacts ({contacts.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    nativeBridge.impactLight();
                    setIsModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className={`border rounded-2xl p-3 flex items-center justify-between transition-all ${
                      c.isPrimary
                        ? 'bg-rose-500/[0.08] border-rose-500/40'
                        : 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        c.isPrimary ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {c.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</span>
                          {c.isPrimary && (
                            <Star className="w-3 h-3 text-rose-500 fill-current" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.role} • <span className="font-mono text-cyan-600 dark:text-cyan-400 font-medium">{c.phone}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={() => nativeBridge.impactMedium()}
                      className={`p-2 rounded-xl transition-colors active-press ${
                        c.isPrimary
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                      title={`Call ${c.name}`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Auto-dialer triggers directly on uncancelled fall alerts.
            </div>
          </div>
        </div>

      </div>

      {/* Quick Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl animate-fade-in-scale">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Add Emergency Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm font-mono py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Role / Relationship
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary Physician"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    ★ Set as Main Contact (Direct Call on Emergency)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifySms}
                    onChange={(e) => setFormData({ ...formData, notifySms: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Send emergency SMS alert
                  </span>
                </label>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
