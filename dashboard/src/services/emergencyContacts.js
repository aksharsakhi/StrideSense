/**
 * StrideSense - Emergency Contacts & Automated Dispatch Service
 * Manages persistent emergency contact list, designated primary contact,
 * SIM preferences, and automated emergency call/SMS dispatch on fall detection.
 */

const STORAGE_KEY_CONTACTS = 'stridesense_emergency_contacts';
const STORAGE_KEY_SETTINGS = 'stridesense_emergency_settings';

const DEFAULT_CONTACTS = [
  {
    id: 'contact-1',
    name: 'Priya Sakhi',
    role: 'Primary Family Contact',
    phone: '+919811122334',
    isPrimary: true,
    notifySms: true,
    notifyCall: true,
    initials: 'PS'
  },
  {
    id: 'contact-2',
    name: 'Dr. Rajesh Sharma',
    role: 'Physician / Cardiologist',
    phone: '+919876543210',
    isPrimary: false,
    notifySms: true,
    notifyCall: false,
    initials: 'RS'
  },
  {
    id: 'contact-3',
    name: 'Ambulance Emergency',
    role: 'Emergency Services 108',
    phone: '108',
    isPrimary: false,
    notifySms: false,
    notifyCall: false,
    initials: '108'
  }
];

const DEFAULT_SETTINGS = {
  autoCallPrimary: true,
  autoSmsOthers: true,
  preferredSim: 'default', // 'default', 'sim1', 'sim2'
  preferredSimLabel: 'Primary SIM (Default Voice Line)',
  graceSeconds: 15,
  emergencyMessage: '🚨 EMERGENCY ALERT from StrideSense: A severe kinematic fall was detected for user. Immediate assistance or check-in required! Insole GPS telemetry attached.'
};

class EmergencyContactsService {
  constructor() {
    this.contacts = this.loadContacts();
    this.settings = this.loadSettings();
    this.listeners = new Set();
  }

  loadContacts() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CONTACTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[EmergencyContacts] Failed to load contacts from localStorage:', e);
    }
    return DEFAULT_CONTACTS;
  }

  saveContacts(contacts) {
    this.contacts = contacts;
    try {
      localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    } catch (e) {
      console.warn('[EmergencyContacts] Failed to save contacts:', e);
    }
    this.notifyListeners();
  }

  loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('[EmergencyContacts] Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('[EmergencyContacts] Failed to save settings:', e);
    }
    this.notifyListeners();
  }

  getContacts() {
    return [...this.contacts];
  }

  getPrimaryContact() {
    return this.contacts.find((c) => c.isPrimary) || this.contacts[0] || null;
  }

  getSecondaryContacts() {
    const primary = this.getPrimaryContact();
    return this.contacts.filter((c) => !primary || c.id !== primary.id);
  }

  getSettings() {
    return { ...this.settings };
  }

  generateInitials(name) {
    if (!name) return 'SOS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  addContact(contact) {
    const newContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: contact.name.trim(),
      role: contact.role?.trim() || 'Emergency Contact',
      phone: contact.phone.trim(),
      isPrimary: Boolean(contact.isPrimary),
      notifySms: contact.notifySms !== false,
      notifyCall: Boolean(contact.isPrimary),
      initials: this.generateInitials(contact.name)
    };

    let updatedList;
    if (newContact.isPrimary) {
      // Unset previous primary contact
      updatedList = this.contacts.map((c) => ({ ...c, isPrimary: false }));
      updatedList.unshift(newContact);
    } else {
      updatedList = [...this.contacts, newContact];
    }

    this.saveContacts(updatedList);
    return newContact;
  }

  updateContact(id, updates) {
    let updatedList = this.contacts.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        if (updates.name) updated.initials = this.generateInitials(updates.name);
        return updated;
      }
      return c;
    });

    if (updates.isPrimary) {
      updatedList = updatedList.map((c) => ({
        ...c,
        isPrimary: c.id === id,
        notifyCall: c.id === id ? true : c.notifyCall
      }));
    }

    this.saveContacts(updatedList);
  }

  deleteContact(id) {
    let updatedList = this.contacts.filter((c) => c.id !== id);
    // If the deleted contact was primary and others exist, make the first one primary
    if (updatedList.length > 0 && !updatedList.some((c) => c.isPrimary)) {
      updatedList[0].isPrimary = true;
    }
    this.saveContacts(updatedList);
  }

  setPrimaryContact(id) {
    const updatedList = this.contacts.map((c) => ({
      ...c,
      isPrimary: c.id === id,
      notifyCall: c.id === id
    }));
    this.saveContacts(updatedList);
  }

  /**
   * Execute immediate emergency automated dispatch:
   * 1. Direct phone call to Primary Contact
   * 2. Emergency SMS broadcast to all other secondary contacts
   */
  dispatchEmergency({ reason = 'Fall Detected', telemetry = null } = {}) {
    const primary = this.getPrimaryContact();
    const secondaries = this.getSecondaryContacts();
    const settings = this.getSettings();

    const results = {
      called: null,
      smsSent: [],
      timestamp: new Date().toISOString()
    };

    // 1. Direct Emergency Phone Call to Main Contact
    if (settings.autoCallPrimary && primary && primary.phone) {
      const cleanPhone = primary.phone.replace(/[^0-9+]/g, '');
      results.called = { name: primary.name, phone: cleanPhone };
      console.log(`[EmergencyDispatch] Automatically dialing main contact: ${primary.name} (${cleanPhone})`);

      // Native telephone link trigger
      const callUrl = `tel:${cleanPhone}`;
      if (typeof window !== 'undefined') {
        // Open dialer directly
        window.location.href = callUrl;
      }
    }

    // 2. Broadcast SMS to other contacts
    if (settings.autoSmsOthers && secondaries.length > 0) {
      const smsNumbers = secondaries
        .filter((c) => c.notifySms && c.phone)
        .map((c) => c.phone.replace(/[^0-9+]/g, ''));

      if (smsNumbers.length > 0) {
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const bodyText = `${settings.emergencyMessage}\nTime: ${timeStr}\nStatus: ${reason}\nPrimary Called: ${primary?.name || 'Caregiver'}`;
        const encodedBody = encodeURIComponent(bodyText);

        // Standard iOS/Android multi-number SMS URI format
        // iOS: sms:123,456&body=... | Android: sms:123;456?body=...
        const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator = isIOS ? '&' : '?';
        const numbersString = smsNumbers.join(isIOS ? ',' : ';');
        const smsUrl = `sms:${numbersString}${separator}body=${encodedBody}`;

        results.smsSent = smsNumbers;
        console.log(`[EmergencyDispatch] Dispatching emergency SMS to ${smsNumbers.length} contacts:`, smsNumbers);

        // Trigger SMS intent after a short deferral so phone dialer takes precedence
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const link = document.createElement('a');
            link.href = smsUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }, 1200);
      }
    }

    return results;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((fn) => fn(this.getContacts(), this.getSettings()));
  }
}

export const emergencyContactsService = new EmergencyContactsService();
