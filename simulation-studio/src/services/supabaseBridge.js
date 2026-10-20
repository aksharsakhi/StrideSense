/**
 * Supabase Bridge for Simulated Telemetry Broadcast
 * Enables live transmission of simulated hardware packets to the StrideSense cloud backend.
 */

const DEFAULT_SUPABASE_HOST = "https://sgooptohhldguitvhbrl.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI";
const DEFAULT_ENDPOINT = "/rest/v1/telemetry";

export class SupabaseBridge {
  constructor() {
    this.enabled = true;
    this.host = DEFAULT_SUPABASE_HOST;
    this.apiKey = DEFAULT_SUPABASE_KEY;
    this.endpoint = DEFAULT_ENDPOINT;
    this.deviceIdLeft = "insole_left_02";
    this.deviceIdRight = "insole_right_02";
    this.lastBroadcast = 0;
    this.broadcastIntervalMs = 1000; // 1 Hz matching ESP32 firmware CLOUD_TELEMETRY_MS
    this.status = "idle"; // 'idle' | 'broadcasting' | 'paused' | 'success' | 'error'
    this.lastError = null;
    this.packetsSent = 0;
    this.isLeader = true;
    this.initLeaderElection();
  }

  initLeaderElection() {
    this.isLeader = true;
    if (typeof navigator !== 'undefined' && navigator.locks) {
      navigator.locks.request('stridesense_sim_leader', () => {
        this.isLeader = true;
        return new Promise(() => {}); // Hold lock
      }).catch(() => {
        this.isLeader = true;
      });
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (!this.enabled) {
      this.status = "disabled";
      this.sendOfflineNotification();
    }
  }

  async sendOfflineNotification() {
    if (!this.isLeader) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "apikey": this.apiKey,
        "Authorization": `Bearer ${this.apiKey}`,
        "Prefer": "return=minimal"
      };
      const offlinePayload = (devId) => ({
        device_id: devId,
        activity: 'Offline',
        confidence: 0,
        steps: 0,
        cadence: 0,
        symmetry: 100,
        fall_alert: false,
        fall_emergency: false,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        pitch: 0, roll: 0, svm_a: 1.0
      });
      await Promise.all([
        fetch(`${this.host}${this.endpoint}`, { method: "POST", headers, body: JSON.stringify(offlinePayload(this.deviceIdLeft)) }),
        fetch(`${this.host}${this.endpoint}`, { method: "POST", headers, body: JSON.stringify(offlinePayload(this.deviceIdRight)) })
      ]);
      this.status = "paused";
    } catch (e) {}
  }

  async sendTelemetry(sample, inference, stats = {}, isRunning = true) {
    if (!this.enabled) {
      this.status = "disabled";
      return;
    }

    if (!isRunning) {
      this.status = "paused";
      return;
    }

    if (!this.isLeader) return;

    const now = Date.now();
    if (now - this.lastBroadcast < this.broadcastIntervalMs) {
      return; // Rate limit 1Hz
    }
    this.lastBroadcast = now;

    const leftData = sample.left || sample;
    const rightData = sample.right || sample;

    const leftForefoot = Math.round(leftData.p2 || leftData.p5 || 0);
    const rightForefoot = Math.round(rightData.p2 || rightData.p5 || 0);

    const payloadLeft = {
      device_id: this.deviceIdLeft,
      activity: inference.activityName || "Walking",
      confidence: parseFloat((inference.confidence || 0.95).toFixed(2)),
      steps: stats.steps || 0,
      cadence: parseFloat((stats.cadence || 108.0).toFixed(1)),
      symmetry: parseFloat((stats.symmetry || sample.bilateral?.symmetryIndex || 98.2).toFixed(1)),
      fall_alert: Boolean(stats.fallAlert),
      p1: Math.round(leftData.p1 || 0),
      p2: leftForefoot,
      p3: 0,
      p4: 0,
      p5: leftForefoot,
      p6: 0,
      pitch: parseFloat((leftData.pitch || 0).toFixed(1)),
      roll: parseFloat((leftData.roll || 0).toFixed(1)),
      svm_a: parseFloat((Math.sqrt(
        (leftData.ax || 0) ** 2 + (leftData.ay || 0) ** 2 + (leftData.az || 1) ** 2
      ) || 1.0).toFixed(2))
    };

    const payloadRight = {
      device_id: this.deviceIdRight,
      activity: inference.activityName || "Walking",
      confidence: parseFloat((inference.confidence || 0.95).toFixed(2)),
      steps: stats.steps || 0,
      cadence: parseFloat((stats.cadence || 108.0).toFixed(1)),
      symmetry: parseFloat((stats.symmetry || sample.bilateral?.symmetryIndex || 98.2).toFixed(1)),
      fall_alert: Boolean(stats.fallAlert),
      p1: Math.round(rightData.p1 || 0),
      p2: rightForefoot,
      p3: 0,
      p4: 0,
      p5: rightForefoot,
      p6: 0,
      pitch: parseFloat((rightData.pitch || 0).toFixed(1)),
      roll: parseFloat((rightData.roll || 0).toFixed(1)),
      svm_a: parseFloat((Math.sqrt(
        (rightData.ax || 0) ** 2 + (rightData.ay || 0) ** 2 + (rightData.az || 1) ** 2
      ) || 1.0).toFixed(2))
    };

    try {
      this.status = "broadcasting";
      const headers = {
        "Content-Type": "application/json",
        "apikey": this.apiKey,
        "Authorization": `Bearer ${this.apiKey}`,
        "Prefer": "return=minimal"
      };

      const [resLeft, resRight] = await Promise.all([
        fetch(`${this.host}${this.endpoint}`, { method: "POST", headers, body: JSON.stringify(payloadLeft) }),
        fetch(`${this.host}${this.endpoint}`, { method: "POST", headers, body: JSON.stringify(payloadRight) })
      ]);

      if (resLeft.ok && resRight.ok) {
        this.status = "success";
        this.packetsSent += 2;
        this.lastError = null;
      } else {
        this.status = "error";
        this.lastError = `HTTP L:${resLeft.status} R:${resRight.status}`;
      }
    } catch (err) {
      this.status = "error";
      this.lastError = err.message || "Network Error";
    }
  }
}
