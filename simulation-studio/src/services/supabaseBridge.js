/**
 * Supabase Bridge for Simulated Telemetry Broadcast
 * Enables live transmission of simulated hardware packets to the StrideSense cloud backend.
 */

const DEFAULT_SUPABASE_HOST = "https://sgooptohhldguitvhbrl.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI";
const DEFAULT_ENDPOINT = "/rest/v1/telemetry";

export class SupabaseBridge {
  constructor() {
    this.enabled = false;
    this.host = DEFAULT_SUPABASE_HOST;
    this.apiKey = DEFAULT_SUPABASE_KEY;
    this.endpoint = DEFAULT_ENDPOINT;
    this.deviceId = "stridesense_sim_insole";
    this.lastBroadcast = 0;
    this.broadcastIntervalMs = 1000; // 1 Hz matching ESP32 firmware CLOUD_TELEMETRY_MS
    this.status = "idle"; // 'idle' | 'broadcasting' | 'success' | 'error'
    this.lastError = null;
    this.packetsSent = 0;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  async sendTelemetry(sample, inference, stats = {}) {
    if (!this.enabled) return;

    const now = Date.now();
    if (now - this.lastBroadcast < this.broadcastIntervalMs) {
      return; // Rate limit 1Hz
    }
    this.lastBroadcast = now;

    const payload = {
      device_id: this.deviceId,
      activity: inference.activityName || "Walking",
      confidence: parseFloat((inference.confidence || 0.9).toFixed(2)),
      steps: stats.steps || 0,
      cadence: parseFloat((stats.cadence || 105.0).toFixed(1)),
      symmetry: parseFloat((stats.symmetry || 98.0).toFixed(1)),
      fall_alert: inference.activityName === "Fall" || stats.fallAlert === true,
      p1: Math.round(sample.p1 || 0),
      p2: Math.round(sample.p2 || 0),
      p3: Math.round(sample.p3 || 0),
      p4: Math.round(sample.p4 || 0),
      p5: Math.round(sample.p5 || 0),
      p6: Math.round(sample.p6 || 0),
      pitch: parseFloat((sample.pitch || 0).toFixed(1)),
      roll: parseFloat((sample.roll || 0).toFixed(1)),
      svm_a: parseFloat((Math.sqrt(sample.ax*sample.ax + sample.ay*sample.ay + sample.az*sample.az) || 1.0).toFixed(2))
    };

    try {
      this.status = "broadcasting";
      const res = await fetch(`${this.host}${this.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": this.apiKey,
          "Authorization": `Bearer ${this.apiKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        this.status = "success";
        this.packetsSent++;
        this.lastError = null;
      } else {
        this.status = "error";
        this.lastError = `HTTP ${res.status}: ${res.statusText}`;
      }
    } catch (err) {
      this.status = "error";
      this.lastError = err.message || "Network Error";
    }
  }
}
