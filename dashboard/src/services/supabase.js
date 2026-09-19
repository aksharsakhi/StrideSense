/**
 * StrideSense - Supabase Real-Time & Analytics Service
 * Connects to Supabase PostgreSQL via WebSockets Realtime CDC and PostgREST.
 * Supports multi-device switching (Hardware ESP32 vs Virtual Simulation Studio).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sgooptohhldguitvhbrl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_DEVICE = 'stridesense_selected_device';
const INITIAL_DEVICE_ID =
  (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_DEVICE)) ||
  import.meta.env.VITE_DEVICE_ID ||
  'insole_left_01';

const FALLBACK_DEVICES = [
  {
    id: 'insole_left_01',
    name: 'Real ESP32 Smart Insole (Hardware)',
    battery_pct: 90,
    battery_voltage: 4.02,
    firmware_version: 'v1.4.2-TinyML',
    badge: 'HARDWARE'
  },
  {
    id: 'insole_left_02',
    name: '3D Simulation Insole (Studio)',
    battery_pct: 100,
    battery_voltage: 4.20,
    firmware_version: 'v1.4.2-VirtualSim',
    badge: 'SIMULATION'
  }
];

class SupabaseService {
  constructor() {
    this.client = null;
    this.channel = null;
    this.listeners = new Set();
    this.deviceListeners = new Set();
    this.isConnected = false;
    this.deviceId = INITIAL_DEVICE_ID;

    this.init();
  }

  init() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('PASTE_YOUR')) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (err) {
        console.warn('[Supabase] Initialization error:', err);
      }
    }
  }

  isConfigured() {
    return Boolean(this.client);
  }

  getDeviceId() {
    return this.deviceId;
  }

  getEmptyTelemetryForDevice(id = this.deviceId) {
    return {
      timestamp: Date.now(),
      activity: 'Standing',
      confidence: 1.0,
      steps: id === 'insole_left_01' ? 3 : 0,
      cadence: 0,
      symmetry: 100,
      fallAlert: false,
      fallEmergency: false,
      batteryPct: id === 'insole_left_02' ? 100 : 88,
      batteryVoltage: id === 'insole_left_02' ? 4.20 : 3.96,
      sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 },
      imu: { ax: 0, ay: 0, az: 1.0, gx: 0, gy: 0, gz: 0, pitch: 0, roll: 0, svmA: 1.0 }
    };
  }

  /**
   * Switches the active device (e.g. insole_left_01 <-> insole_left_02)
   */
  async setDeviceId(id) {
    if (!id || this.deviceId === id) return;
    this.deviceId = id;
    try {
      localStorage.setItem(STORAGE_KEY_DEVICE, id);
    } catch (e) {}

    // Immediately emit default telemetry for new device to prevent state bleeding
    this.notify(this.getEmptyTelemetryForDevice(id));

    // Notify device listeners
    this.deviceListeners.forEach((fn) => fn(id));

    // Immediately fetch latest telemetry for the newly selected device
    const latest = await this.fetchLatestTelemetry();
    if (latest) {
      this.notify(latest);
    }
  }

  /**
   * Fetches latest step count recorded today for the active device
   */
  async fetchTodaySteps(deviceId = this.deviceId) {
    if (!this.client) return 0;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await this.client
        .from('telemetry')
        .select('steps')
        .eq('device_id', deviceId)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return 0;
      return data[0].steps || 0;
    } catch (e) {
      return 0;
    }
  }

  onDeviceChange(fn) {
    this.deviceListeners.add(fn);
    return () => this.deviceListeners.delete(fn);
  }

  subscribeTelemetry(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(data) {
    this.listeners.forEach((fn) => fn(data));
  }

  /**
   * Fetches available devices from Supabase public.devices
   */
  async fetchAvailableDevices() {
    if (!this.client) return FALLBACK_DEVICES;

    try {
      const { data, error } = await this.client
        .from('devices')
        .select('*')
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) {
        return FALLBACK_DEVICES;
      }

      return data.map((d) => ({
        ...d,
        badge: d.id === 'insole_left_01' ? 'HARDWARE' : 'SIMULATION'
      }));
    } catch (e) {
      return FALLBACK_DEVICES;
    }
  }

  /**
   * Subscribes to real-time telemetry changes via Supabase WebSockets
   */
  connectRealtime() {
    if (!this.client) {
      this.init();
      if (!this.client) {
        console.warn('[Supabase] Missing VITE_SUPABASE_ANON_KEY in dashboard/.env');
        return;
      }
    }

    // Subscribe to new rows inserted into public.telemetry
    this.channel = this.client
      .channel('stridesense-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry'
        },
        (payload) => {
          this.isConnected = true;
          const row = payload.new;
          // Filter to strictly receive data for the currently selected device
          if (!this.deviceId || row.device_id === this.deviceId) {
            this.notify(this.normalizeRow(row));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.isConnected = false;
        }
      });
  }

  disconnectRealtime() {
    if (this.channel && this.client) {
      this.client.removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
  }

  /**
   * Fetches latest telemetry row for the active device
   */
  async fetchLatestTelemetry() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('telemetry')
        .select('*')
        .eq('device_id', this.deviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return this.normalizeRow(data);
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetches historical gait records for analytics for the active device
   */
  async fetchGaitHistory(limit = 100) {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('telemetry')
        .select('created_at, activity, cadence, steps, symmetry, svm_a')
        .eq('device_id', this.deviceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Inserts a telemetry record
   */
  async insertTelemetry(sample) {
    if (!this.client) return false;
    try {
      const { error } = await this.client.from('telemetry').insert({
        device_id: this.deviceId,
        activity: sample.activity,
        confidence: sample.confidence,
        steps: sample.steps,
        cadence: sample.cadence,
        symmetry: sample.symmetry,
        fall_alert: sample.fallAlert || false,
        p1: sample.sensors.p1,
        p2: sample.sensors.p2,
        p3: sample.sensors.p3,
        p4: sample.sensors.p4,
        p5: sample.sensors.p5,
        p6: sample.sensors.p6,
        pitch: sample.imu.pitch,
        roll: sample.imu.roll,
        svm_a: sample.imu.svmA
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  normalizeRow(row) {
    return {
      timestamp: new Date(row.created_at).getTime(),
      activity: row.activity,
      confidence: Number(row.confidence) || 0.95,
      steps: row.steps || 0,
      cadence: Number(row.cadence) || 0,
      symmetry: Number(row.symmetry) || 100,
      fallAlert: Boolean(row.fall_alert),
      fallEmergency: false,
      batteryPct: row.device_id === 'insole_left_02' ? 100 : 88,
      batteryVoltage: row.device_id === 'insole_left_02' ? 4.20 : 3.96,
      sensors: {
        p1: row.p1 || 0,
        p2: row.p2 || 0,
        p3: row.p3 || 0,
        p4: row.p4 || 0,
        p5: row.p5 || 0,
        p6: row.p6 || 0
      },
      imu: {
        pitch: Number(row.pitch) || 0,
        roll: Number(row.roll) || 0,
        ax: 0, ay: 0, az: 1.0,
        gx: 0, gy: 0, gz: 0,
        svmA: Number(row.svm_a) || 1.0
      }
    };
  }
}

export const supabaseService = new SupabaseService();
