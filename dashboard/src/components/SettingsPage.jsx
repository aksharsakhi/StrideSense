import React, { useState, useEffect } from 'react';
import {
  Battery, Wifi, Cpu, Sliders, CheckCircle2,
  Bell, HardDrive, Zap, Heart, FileText, Info,
  Sun, Moon, Monitor, Palette, Sparkles, Shield,
  PhoneCall, MessageSquare, Plus, Trash2, Edit3,
  Star, Smartphone, Check, X, AlertTriangle, Send,
  ChevronRight, User
} from 'lucide-react';
import { nativeBridge } from '../services/native.js';
import { emergencyContactsService } from '../services/emergencyContacts.js';
import { userProfileService } from '../services/userProfile.js';
import SystemDetailView from './SystemDetailView.jsx';

function SettingsPageComponent({
  batteryPct = 88,
  batteryVoltage = 3.96,
  isCloudConnected = false,
  selectedDeviceId = 'stridesense_esp32_01',
  onOpenDeviceSelector = () => {},
  theme = 'system',
  onThemeChange = () => {}
}) {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Patient / User Profile State
  const [profile, setProfile] = useState(() => userProfileService.getProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile.name,
    age: profile.age,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    gender: profile.gender,
    shoeSize: profile.shoeSize,
    bloodGroup: profile.bloodGroup
  });

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
  const [activeDetail, setActiveDetail] = useState(null);

  useEffect(() => {
    const unsubProfile = userProfileService.subscribe((updatedProfile) => {
      setProfile(updatedProfile);
    });
    const unsubEmergency = emergencyContactsService.subscribe((updatedContacts, updatedSettings) => {
      setContacts(updatedContacts);
      setEmergencySettings(updatedSettings);
    });
    return () => {
      unsubProfile();
      unsubEmergency();
    };
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
      className={`w-full flex items-center justify-between py-3.5 px-1.5 text-left rounded-xl transition-colors ${
        onClick ? 'cursor-pointer active-press touch-manipulation select-none hover:bg-slate-100/60 dark:hover:bg-white/[0.03]' : ''
      } ${!last ? 'border-b border-slate-200/70 dark:border-white/[0.04]' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className={`p-2 rounded-xl ${iconColor} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">{label}</span>
          {subtitle && <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {right}
        {onClick && <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />}
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

  // Patient / User Profile handlers
  const handleOpenEditProfile = () => {
    nativeBridge.impactLight();
    setProfileForm({
      name: profile.name,
      age: profile.age,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      gender: profile.gender,
      shoeSize: profile.shoeSize,
      bloodGroup: profile.bloodGroup
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;
    nativeBridge.impactMedium();
    nativeBridge.notificationSuccess();
    userProfileService.saveProfile(profileForm);
    setIsProfileModalOpen(false);
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

  if (activeDetail) {
    return (
      <SystemDetailView
        detailKey={activeDetail}
        onBack={() => {
          nativeBridge.impactLight();
          setActiveDetail(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in stagger-children pb-12">

      {/* Header */}
      <div className="animate-fade-in-scale">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Patient profile, emergency SOS & device hardware</p>
      </div>

      {/* ─── PATIENT & USER BIOMECHANICAL PROFILE (TOP SECTION) ─── */}
      <div className="glass-panel p-5 sm:p-6 animate-fade-in-scale border-cyan-500/30">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-base font-display text-cyan-600 dark:text-cyan-400">
                {profile.name?.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'US'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                  {profile.name}
                </h2>
                <span className="badge badge-cyan text-[9px] font-mono">
                  {profile.clinicalId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {profile.gender} • {profile.age} yrs • Blood Group: {profile.bloodGroup}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenEditProfile}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active-press transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Biomechanical Metrics Grid: Age, Weight, Height, BMI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.05]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</span>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
              {profile.age} <span className="text-xs font-normal text-slate-400">yrs</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.05]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weight</span>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
              {profile.weightKg} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.05]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Height</span>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5">
              {profile.heightCm} <span className="text-xs font-normal text-slate-400">cm</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.05]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Body Mass Index</span>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1.5">
              <span>{profile.bmi}</span>
              <span className={`text-[10px] font-sans font-bold ${profile.bmiColor}`}>
                ({profile.bmiCategory})
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Info Chips */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/[0.04] flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span>Estimated Stride: <strong className="text-slate-900 dark:text-white font-mono">{profile.estimatedStrideCm} cm</strong></span>
            <span>•</span>
            <span>Insole Fit: <strong className="text-slate-900 dark:text-white">{profile.shoeSize}</strong></span>
          </div>
          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
            Active Biomechanical Patient Data
          </span>
        </div>
      </div>

      {/* ─── EMERGENCY CONTACTS & SOS DISPATCH ─── */}
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
              onClick={() => openEditModal(contact)}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer active-press hover:border-cyan-500/40 ${
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

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(contact);
                    }}
                    title="Edit Contact"
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/25 active-press flex items-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteContact(contact.id);
                    }}
                    title="Delete Contact"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 active-press transition-colors"
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

      {/* Edit Patient & User Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] rounded-3xl p-5 sm:p-6 shadow-2xl animate-fade-in-scale my-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/70 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Patient & User Profile
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Biomechanical attributes for gait & clinical reporting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name / Patient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Akshar Sakhi"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Age & Gender in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Age (years)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="21"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    className="w-full text-sm font-mono py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Gender
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Weight & Height in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min="20"
                    max="300"
                    placeholder="68"
                    value={profileForm.weightKg}
                    onChange={(e) => setProfileForm({ ...profileForm, weightKg: e.target.value })}
                    className="w-full text-sm font-mono py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min="50"
                    max="250"
                    placeholder="175"
                    value={profileForm.heightCm}
                    onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })}
                    className="w-full text-sm font-mono py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Shoe Size & Blood Group */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Insole / Shoe Size
                  </label>
                  <input
                    type="text"
                    placeholder="EU 43 / US 10"
                    value={profileForm.shoeSize}
                    onChange={(e) => setProfileForm({ ...profileForm, shoeSize: e.target.value })}
                    className="w-full text-sm py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    placeholder="O+"
                    value={profileForm.bloodGroup}
                    onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                    className="w-full text-sm font-mono py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Live Biomechanical Computed Card */}
              {(() => {
                const hM = (parseFloat(profileForm.heightCm) || 0) / 100;
                const wKg = parseFloat(profileForm.weightKg) || 0;
                const liveBmi = hM > 0 && wKg > 0 ? (wKg / (hM * hM)).toFixed(1) : '--';
                const liveStride = (parseFloat(profileForm.heightCm) || 0) > 0
                  ? Math.round((parseFloat(profileForm.heightCm) || 0) * 0.415)
                  : '--';
                let bmiCat = 'Normal';
                let bmiColor = 'text-emerald-500';
                const bmiVal = parseFloat(liveBmi);
                if (!isNaN(bmiVal)) {
                  if (bmiVal < 18.5) { bmiCat = 'Underweight'; bmiColor = 'text-amber-500'; }
                  else if (bmiVal < 25) { bmiCat = 'Normal Weight'; bmiColor = 'text-emerald-500'; }
                  else if (bmiVal < 30) { bmiCat = 'Overweight'; bmiColor = 'text-amber-500'; }
                  else { bmiCat = 'Obese'; bmiColor = 'text-rose-500'; }
                }

                return (
                  <div className="p-3 rounded-xl bg-cyan-500/[0.08] border border-cyan-500/20 text-xs">
                    <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block mb-1">
                      Computed Biomechanical Parameters (Live)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div>
                        Calculated BMI: <strong className="font-mono text-slate-900 dark:text-white">{liveBmi}</strong>{' '}
                        <span className={`font-semibold ${bmiColor}`}>({bmiCat})</span>
                      </div>
                      <div>
                        Est. Stride Length: <strong className="font-mono text-slate-900 dark:text-white">{liveStride} cm</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Profile
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  selectedDeviceId === 'insole_left_02'
                    ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30'
                    : 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30'
                }`}>
                  <Cpu className={`w-6 h-6 ${
                    selectedDeviceId === 'insole_left_02'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-cyan-600 dark:text-cyan-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {selectedDeviceId === 'stridesense_esp32_01' || selectedDeviceId === 'bilateral_hw'
                      ? 'StrideSense Unified Hardware (1x ESP32, 4x FSR)'
                      : (selectedDeviceId === 'bilateral_sim'
                          ? 'Bilateral 3D Simulation (Studio)'
                          : (selectedDeviceId.includes('02') ? '3D Virtual Simulation Insole' : 'ESP32 Physical Insole'))}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                    {selectedDeviceId === 'stridesense_esp32_01' || selectedDeviceId === 'bilateral_hw'
                      ? 'Single ESP32 MCU • 4x FSR Bilateral • 1x MPU6050'
                      : (selectedDeviceId.startsWith('bilateral')
                          ? 'Dual Foot Setup • Left + Right Sync'
                          : `Single Insole • ${selectedDeviceId}`)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`badge text-[9px] ${
                      isCloudConnected ? 'badge-emerald' : 'badge-amber'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {isCloudConnected ? 'Active Sync' : 'Standby / Offline'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {selectedDeviceId.includes('sim') || selectedDeviceId.includes('02') ? 'v1.4.2-VirtualSim' : 'v1.5.0-Unified-TinyML'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  nativeBridge.impactLight();
                  onOpenDeviceSelector();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/15 active-press transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Switch</span>
              </button>
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
                onClick={() => {
                  nativeBridge.impactLight();
                  setActiveDetail('fall_guard');
                }}
                last
              />
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="flex flex-col gap-5">

          {/* Hardware Specs */}
          <div className="animate-fade-in-scale">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                Hardware & System
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Tap to view details</span>
            </div>
            <div className="glass-panel px-4">
              {[
                { id: 'microcontroller', icon: HardDrive, color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400', label: 'Microcontroller', val: '1x ESP32 Dual-Core (4x FSR + 1x IMU)' },
                { id: 'tinyml', icon: Zap, color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', label: 'TinyML Latency', val: '< 0.38 ms On-Chip' },
                { id: 'sampling', icon: Cpu, color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', label: 'Sampling Rate', val: '50 Hz (20ms cycle)' },
                { id: 'calibration', icon: Sliders, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', label: 'Calibration', val: 'Zero-Tare Baseline OK' },
                { id: 'mobile_native', icon: Sparkles, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', label: 'Mobile Native Core', val: 'Capacitor 8 (iOS)' }
              ].map((row, i, arr) => (
                <SettingRow
                  key={row.id}
                  icon={row.icon}
                  iconColor={row.color}
                  label={row.label}
                  right={<span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{row.val}</span>}
                  onClick={() => {
                    nativeBridge.impactLight();
                    setActiveDetail(row.id);
                  }}
                  last={i === arr.length - 1}
                />
              ))}
            </div>
          </div>

          {/* About & Clinical Intelligence */}
          <div className="animate-fade-in-scale">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                About StrideSense
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Tap to view details</span>
            </div>
            <div className="glass-panel px-4">
              <SettingRow
                icon={Info}
                iconColor="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                label="StrideSense Core"
                subtitle="AI-Powered Smart Insole Biomechanics"
                right={<span className="text-xs font-mono text-slate-500">v1.4.2</span>}
                onClick={() => {
                  nativeBridge.impactLight();
                  setActiveDetail('core');
                }}
              />
              <SettingRow
                icon={FileText}
                iconColor="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                label="TinyML Model Engine"
                subtitle="Neural Net 3-layer • 98.97% validation accuracy"
                right={<span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Validated</span>}
                onClick={() => {
                  nativeBridge.impactLight();
                  setActiveDetail('tinyml');
                }}
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
