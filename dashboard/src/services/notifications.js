/**
 * StrideSense - Notification Service
 * Provides immediate push notifications for fall detection alerts.
 * Uses Capacitor LocalNotifications on native (iOS/Android),
 * falls back to Web Notification API in browsers.
 */

class NotificationService {
  constructor() {
    this.localNotifications = null;
    this.isNative = false;
    this.hasWebPermission = false;
    this.lastFallNotificationTime = 0;
    this.COOLDOWN_MS = 10000; // 10s cooldown between fall notifications
  }

  async init() {
    try {
      // Try Capacitor native notifications first
      const core = await import('@capacitor/core');
      this.isNative = core.Capacitor.isNativePlatform();

      if (this.isNative) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        this.localNotifications = LocalNotifications;

        // Request permission on native
        const permResult = await this.localNotifications.requestPermissions();
        if (permResult.display !== 'granted') {
          console.warn('[Notifications] Native permission not granted');
        }

        // Create notification channel for Android
        try {
          await this.localNotifications.createChannel({
            id: 'fall-alerts',
            name: 'Fall Detection Alerts',
            description: 'Critical fall detection emergency notifications',
            importance: 5, // MAX importance
            visibility: 1, // PUBLIC
            vibration: true,
            lights: true,
            lightColor: '#f43f5e',
            sound: 'default'
          });
        } catch (e) {
          // createChannel only needed on Android
        }

        // Listen for notification actions (tap to open app)
        this.localNotifications.addListener(
          'localNotificationActionPerformed',
          (notification) => {
            console.log('[Notifications] User tapped fall alert:', notification);
          }
        );

        console.log('[Notifications] Capacitor LocalNotifications initialized');
        return;
      }
    } catch (e) {
      // Capacitor not available, fall through to Web API
    }

    // Web Notification API fallback
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.hasWebPermission = permission === 'granted';
        console.log(`[Notifications] Web Notification permission: ${permission}`);
      } catch (e) {
        console.warn('[Notifications] Web permission request failed:', e);
      }
    }
  }

  /**
   * Fire an immediate fall detection notification.
   * Debounced by COOLDOWN_MS to prevent notification spam.
   */
  async notifyFallDetected(telemetryData = {}) {
    const now = Date.now();
    if (now - this.lastFallNotificationTime < this.COOLDOWN_MS) {
      return; // Still within cooldown window
    }
    this.lastFallNotificationTime = now;

    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const title = '🚨 FALL DETECTED!';
    const body = `StrideSense detected a potential fall at ${timestamp}. ` +
      `Impact SVM: ${telemetryData.imu?.svmA?.toFixed(2) || '—'}g. ` +
      `Emergency contacts will be notified if not dismissed within 15 seconds.`;

    if (this.isNative && this.localNotifications) {
      await this._fireNativeNotification(title, body);
    } else if (this.hasWebPermission) {
      this._fireWebNotification(title, body);
    }
  }

  /**
   * Notify that a fall emergency has been dispatched (timer expired).
   */
  async notifyEmergencyDispatched() {
    const now = Date.now();
    this.lastFallNotificationTime = now;

    const title = '🆘 EMERGENCY DISPATCHED';
    const body = 'Fall alert timer expired. Emergency contacts and services ' +
      'have been notified with GPS coordinates. Help is on the way.';

    if (this.isNative && this.localNotifications) {
      await this._fireNativeNotification(title, body, 'emergency-dispatch');
    } else if (this.hasWebPermission) {
      this._fireWebNotification(title, body);
    }
  }

  /**
   * Capacitor LocalNotification — fires immediately, works even when app is backgrounded
   */
  async _fireNativeNotification(title, body, actionId = 'fall-alert') {
    try {
      await this.localNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 2147483647),
            title,
            body,
            channelId: 'fall-alerts',
            largeBody: body,
            summaryText: 'StrideSense Fall Guard',
            schedule: { at: new Date(Date.now() + 100) }, // Near-immediate
            sound: 'default',
            actionTypeId: actionId,
            extra: {
              type: 'fall_alert',
              timestamp: Date.now()
            }
          }
        ]
      });
    } catch (e) {
      console.error('[Notifications] Native notification failed:', e);
    }
  }

  /**
   * Web Notification API fallback for browser testing
   */
  _fireWebNotification(title, body) {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'stridesense-fall-alert',
        renotify: true,
        requireInteraction: true,
        vibrate: [400, 200, 400, 200, 600]
      });

      // Auto-close after 30 seconds
      setTimeout(() => notification.close(), 30000);
    } catch (e) {
      console.error('[Notifications] Web notification failed:', e);
    }
  }
}

export const notificationService = new NotificationService();
