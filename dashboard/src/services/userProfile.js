/**
 * StrideSense - Patient & User Profile Service
 * Manages persistent user / patient biographical and biomechanical profile data
 * (Name, Age, Weight, Height, Gender, Shoe Size, BMI, Stride Length).
 */

const STORAGE_KEY_PROFILE = 'stridesense_user_profile';

const DEFAULT_PROFILE = {
  name: 'Akshar Sakhi',
  age: 21,
  gender: 'Male',
  weightKg: 68,
  heightCm: 175,
  shoeSize: 'EU 43 / US 10',
  bloodGroup: 'O+',
  clinicalId: 'SS-PAT-2026-08',
  medicalNotes: 'Active ambulatory monitoring • Post-rehab kinematic baseline'
};

class UserProfileService {
  constructor() {
    this.profile = this.loadProfile();
    this.listeners = new Set();
  }

  loadProfile() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_PROFILE, ...parsed };
        }
      }
    } catch (e) {
      console.warn('[UserProfile] Failed to load profile from localStorage:', e);
    }
    return { ...DEFAULT_PROFILE };
  }

  getProfile() {
    const p = { ...this.profile };
    const hM = (Number(p.heightCm) || 175) / 100;
    const wKg = Number(p.weightKg) || 68;
    const bmiVal = parseFloat((wKg / (hM * hM)).toFixed(1));

    let bmiCategory = 'Normal';
    let bmiColor = 'text-emerald-500';
    if (bmiVal < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-amber-500';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-amber-500';
    } else if (bmiVal >= 30) {
      bmiCategory = 'Obese';
      bmiColor = 'text-rose-500';
    }

    const estimatedStrideCm = Math.round((Number(p.heightCm) || 175) * 0.415);

    return {
      ...p,
      bmi: bmiVal,
      bmiCategory,
      bmiColor,
      estimatedStrideCm
    };
  }

  saveProfile(updates) {
    this.profile = {
      ...this.profile,
      ...updates,
      age: updates.age !== undefined ? Number(updates.age) : this.profile.age,
      weightKg: updates.weightKg !== undefined ? Number(updates.weightKg) : this.profile.weightKg,
      heightCm: updates.heightCm !== undefined ? Number(updates.heightCm) : this.profile.heightCm
    };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('[UserProfile] Failed to save profile to localStorage:', e);
    }

    this.notifyListeners();
    return this.getProfile();
  }

  getFirstName() {
    const fullName = this.profile.name || 'User';
    return fullName.trim().split(/\s+/)[0] || 'User';
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const prof = this.getProfile();
    this.listeners.forEach((fn) => {
      try {
        fn(prof);
      } catch (e) {
        console.error('[UserProfile] Listener error:', e);
      }
    });
  }
}

export const userProfileService = new UserProfileService();
