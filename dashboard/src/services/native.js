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

  impactLight() {
    queueMicrotask(() => {
      if (this.haptics) {
        try {
          this.haptics.impact({ style: 'LIGHT' }).catch(() => {});
          return;
        } catch (e) {}
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(12);
        }
      } catch (e) {}
    });
  }

  impactMedium() {
    queueMicrotask(() => {
      if (this.haptics) {
        try {
          this.haptics.impact({ style: 'MEDIUM' }).catch(() => {});
          return;
        } catch (e) {}
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(25);
        }
      } catch (e) {}
    });
  }

  impactHeavy() {
    queueMicrotask(() => {
      if (this.haptics) {
        try {
          this.haptics.impact({ style: 'HEAVY' }).catch(() => {});
          return;
        } catch (e) {}
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 40, 40]);
        }
      } catch (e) {}
    });
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
