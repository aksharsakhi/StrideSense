/**
 * StrideSense - Firebase Live Telemetry Service
 * Connects to Firebase Realtime Database via REST / EventSource for live hardware streaming.
 */

class FirebaseService {
  constructor() {
    this.databaseUrl = "https://stridesense-iot-default-rtdb.firebaseio.com";
    this.deviceId = "insole_left_01";
    this.eventSource = null;
    this.pollInterval = null;
    this.listeners = new Set();
    this.isConnected = false;
  }

  configure(url, deviceId) {
    if (url) this.databaseUrl = url.replace(/\/$/, '');
    if (deviceId) this.deviceId = deviceId;
  }

  connect() {
    this.disconnect();
    const streamUrl = `${this.databaseUrl}/devices/${this.deviceId}/telemetry.json`;

    // Polling fallback every 500ms
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(streamUrl);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            this.isConnected = true;
            this.notify(this.normalize(data));
          }
        }
      } catch (err) {
        this.isConnected = false;
      }
    }, 500);
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(data) {
    this.listeners.forEach(fn => fn(data));
  }

  normalize(raw) {
    return {
      timestamp: raw.timestamp || Date.now(),
      activity: raw.activity || "Standing",
      confidence: raw.confidence || 0.95,
      steps: raw.steps || 0,
      cadence: raw.cadence || 0,
      symmetry: raw.symmetry || 95.0,
      fallAlert: Boolean(raw.fall_alert),
      fallEmergency: Boolean(raw.fall_emergency),
      batteryPct: raw.battery_pct || 85,
      batteryVoltage: raw.battery_v || 3.9,
      sensors: {
        p1: raw.pressure?.p1 || 0,
        p2: raw.pressure?.p2 || 0,
        p3: raw.pressure?.p3 || 0,
        p4: raw.pressure?.p4 || 0,
        p5: raw.pressure?.p5 || 0,
        p6: raw.pressure?.p6 || 0
      },
      imu: {
        pitch: raw.imu?.pitch || 0,
        roll: raw.imu?.roll || 0,
        ax: 0, ay: 0, az: 1.0,
        gx: 0, gy: 0, gz: 0,
        svmA: 1.0
      }
    };
  }
}

export const firebaseService = new FirebaseService();
