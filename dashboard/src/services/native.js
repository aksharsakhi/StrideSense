/**
 * StrideSense - Native Capacitor Mobile Bridge
 * Provides haptic feedback, status bar customization, and mobile lifecycle helpers.
 * Gracefully falls back to web APIs when running in standard browsers.
 */

class NativeMobileBridge {
  constructor() {
    this.isNative = false;
    this.haptics = null;
    this.statusBar = null;
    this.init();
  }

  async init() {
    try {
      // Dynamic import to prevent bundler failures if Capacitor is optional
      const core = await import('@capacitor/core');
      this.isNative = core.Capacitor.isNativePlatform();

      if (this.isNative) {
        const hapticsModule = await import('@capacitor/haptics');
        this.haptics = hapticsModule.Haptics;

        const statusBarModule = await import('@capacitor/status-bar');
        this.statusBar = statusBarModule.StatusBar;

        // Initial status bar config (defaults to dark or current theme)
        if (this.statusBar) {
          const isDark = document.documentElement.classList.contains('dark');
          await this.setTheme(isDark ? 'dark' : 'light');
        }
      }
    } catch (e) {
      this.isNative = false;
    }
  }

  async setTheme(theme = 'dark') {
    if (this.statusBar) {
      try {
        if (theme === 'dark') {
          await this.statusBar.setStyle({ style: 'DARK' });
          await this.statusBar.setBackgroundColor({ color: '#080c14' });
        } else {
          await this.statusBar.setStyle({ style: 'LIGHT' });
          await this.statusBar.setBackgroundColor({ color: '#f8fafc' });
        }
      } catch (e) {
        // StatusBar not supported on platform
      }
    }
  }

  async impactLight() {
    if (this.haptics) {
      try {
        await this.haptics.impact({ style: 'LIGHT' });
        return;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  async impactMedium() {
    if (this.haptics) {
      try {
        await this.haptics.impact({ style: 'MEDIUM' });
        return;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  async impactHeavy() {
    if (this.haptics) {
      try {
        await this.haptics.impact({ style: 'HEAVY' });
        return;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  }

  async triggerEmergencyVibration() {
    if (this.haptics) {
      try {
        await this.haptics.vibrate({ duration: 1500 });
        return;
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 600]);
    }
  }
}

export const nativeBridge = new NativeMobileBridge();
