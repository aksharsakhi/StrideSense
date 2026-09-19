import React, { useState, useEffect } from 'react';
import {
  Battery, Wifi, Cpu, Sliders, CheckCircle2,
  Bell, HardDrive, Zap, Heart, FileText, Info,
  Sun, Moon, Monitor, Palette, Sparkles, Shield,
  PhoneCall, MessageSquare, Plus, Trash2, Edit3,
  Star, Smartphone, Check, X, AlertTriangle, Send
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';
import { emergencyContactsService } from '../services/emergencyContacts.js';

function SettingsPageComponent({
  batteryPct = 88,
  batteryVoltage = 3.96,
  isCloudConnected = false,
  theme = 'system',
  onThemeChange = () => {}
}) {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Emergency Contacts & Settings State
  const [contacts, setContacts] = useState(() => emergencyContactsService.getContacts());
  const [emergencySettings, setEmergencySettings] = useState(() => emergencyContactsService.getSettings());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
    isPrimary: false,
    notifySms: true
  });
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    const unsub = emergencyContactsService.subscribe((updatedContacts, updatedSettings) => {
      setContacts(updatedContacts);
      setEmergencySettings(updatedSettings);
    });
    return unsub;
  }, []);

  const batteryColor = batteryPct > 60
    ? 'text-emerald-500 dark:text-emerald-400'
    : (batteryPct > 20 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400');
  const batteryBg = batteryPct > 60
    ? 'from-emerald-500 to-cyan-400'
    : (batteryPct > 20 ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-red-400');
  const hoursLeft = Math.max(0, ((batteryPct / 100) * 8.5)).toFixed(1);

  const SettingRow = ({ icon: Icon, iconColor, label, subtitle, right, onClick, last }) => (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3.5 px-1 text-left ${
        onClick ? 'cursor-pointer active-press touch-manipulation select-none' : ''
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
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        nativeBridge.impactLight();
        onChange(!value);
      }}
      className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-150 flex items-center touch-manipulation select-none active-press ${
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

  // Emergency contact modal handlers
  const openAddModal = () => {
    nativeBridge.impactLight();
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      role: 'Family Member',
      isPrimary: contacts.length === 0,
      notifySms: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    nativeBridge.impactLight();
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      role: contact.role,
      isPrimary: contact.isPrimary,
      notifySms: contact.notifySms
    });
    setIsModalOpen(true);
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    nativeBridge.impactMedium();
    if (editingContact) {
      emergencyContactsService.updateContact(editingContact.id, formData);
    } else {
      emergencyContactsService.addContact(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteContact = (id) => {
    nativeBridge.impactHeavy();
    emergencyContactsService.deleteContact(id);
  };

  const handleSetPrimary = (id) => {
    nativeBridge.impactMedium();
    emergencyContactsService.setPrimaryContact(id);
  };

  const handleUpdateSetting = (key, val) => {
    emergencyContactsService.saveSettings({ [key]: val });
  };

  const handleTestDispatch = () => {
    nativeBridge.impactHeavy();
    setTestStatus('Initiating test emergency dispatch...');
    const result = emergencyContactsService.dispatchEmergency({
      reason: 'TEST DRILL - User verification from Settings'
    });

    setTimeout(() => {
      setTestStatus(
        result.called
          ? `✓ Triggered direct call to ${result.called.name} (${result.called.phone})`
          : '✓ Tested dispatch logic'
      );
      setTimeout(() => setTestStatus(null), 4000);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children pb-12">

      {/* Header */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Emergency SOS, device hardware & system preferences</p>
      </div>

      {/* ─── EMERGENCY CONTACTS & SOS DISPATCH (NEW TOP SECTION) ─── */}
      <div className="glass-panel p-5 sm:p-6 animate-fade-in-scale border-rose-500/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Emergency Contacts & Auto-Dispatch
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Designated Main Caller, Multi-Contact SMS Broadcast & SIM Routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestDispatch}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-1.5 active-press transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Dispatch</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active-press transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Test status banner */}
        {testStatus && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{testStatus}</span>
          </div>
        )}

        {/* Contacts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                contact.isPrimary
                  ? 'bg-rose-500/[0.06] dark:bg-rose-500/[0.08] border-rose-500/40 shadow-sm'
                  : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/[0.05]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    contact.isPrimary
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {contact.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {contact.name}
                      </span>
                      {contact.isPrimary && (
                        <span className="badge badge-rose text-[9px] px-1.5 py-0.5 font-extrabold tracking-wide flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          MAIN CALLER
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {contact.role}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 block mt-0.5">
                      {contact.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(contact)}
                    title="Edit Contact"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(contact.id)}
                    title="Delete Contact"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 ${contact.isPrimary ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}`}>
                    <PhoneCall className="w-3 h-3" />
                    {contact.isPrimary ? 'Immediate Call' : 'Secondary'}
                  </span>
                  {contact.notifySms && (
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <MessageSquare className="w-3 h-3" />
                      SMS
                    </span>
                  )}
                </div>

                {!contact.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(contact.id)}
                    className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                  >
                    Set as Main Caller
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dispatch Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/70 dark:border-white/[0.05]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Auto-Call Main Contact
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dials phone immediately when 15s fall grace timer expires
                </span>
              </div>
              <Toggle
                value={emergencySettings.autoCallPrimary}
                onChange={(val) => handleUpdateSetting('autoCallPrimary', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Broadcast Emergency SMS to Others
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sends GPS coords & fall status to all secondary contacts
                </span>
              </div>
              <Toggle
                value={emergencySettings.autoSmsOthers}
                onChange={(val) => handleUpdateSetting('autoSmsOthers', val)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Preferred SIM Routing */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Cellular SIM Routing Preference
                </span>
              </div>
              <select
                value={emergencySettings.preferredSim}
                onChange={(e) => {
                  const val = e.target.value;
                  const label = e.target.options[e.target.selectedIndex].text;
                  emergencyContactsService.saveSettings({ preferredSim: val, preferredSimLabel: label });
                }}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="default">System Default Line (Recommended)</option>
                <option value="sim1">Primary SIM 1 (Physical SIM)</option>
                <option value="sim2">Secondary SIM 2 (eSIM)</option>
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                💡 iOS routes all automated emergency calls via your <strong>Default Voice Line</strong> set in iPhone <em>Settings ➔ Cellular ➔ Default Voice Line</em>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ADD / EDIT CONTACT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl animate-fade-in-scale">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sakhi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Phone Number (with Country Code)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98111 22334"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm font-mono py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Relationship / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spouse / Doctor / Son / Neighbor"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    ★ Set as Main Emergency Caller (Direct auto-call on Fall)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifySms}
                    onChange={(e) => setFormData({ ...formData, notifySms: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Receive automated SMS alert with telemetry
                  </span>
                </label>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    type="button"
                    onClick={() => handleThemeSelect(id)}
                    className={`py-2 px-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-100 active-press touch-manipulation select-none ${
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

          {/* Cloud Connection Status */}
          <div className="glass-panel px-4 animate-fade-in-scale">
            <SettingRow
              icon={Wifi}
              iconColor={isCloudConnected ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}
              label="Data Source"
              subtitle="Supabase Realtime CDC telemetry stream"
              right={
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    isCloudConnected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isCloudConnected ? 'LIVE CLOUD' : 'OFFLINE'}
                </span>
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
                { icon: Sparkles, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', label: 'Mobile Native Core', val: 'Capacitor 8 (iOS)' }
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

export default React.memo(SettingsPageComponent);
