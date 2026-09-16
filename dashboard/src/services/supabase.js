/**
 * StrideSense - Supabase Real-Time & Analytics Service
 * Connects to Supabase PostgreSQL via WebSockets Realtime CDC and PostgREST.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sgooptohhldguitvhbrl.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'insole_left_01';

class SupabaseService {
  constructor() {
    this.client = null;
    this.channel = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.deviceId = DEFAULT_DEVICE_ID;

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

  subscribeTelemetry(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(data) {
    this.listeners.forEach((fn) => fn(data));
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
   * Fetches latest telemetry row to populate initial state
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
   * Fetches historical gait records for analytics
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
   * Inserts a telemetry record (e.g. from simulator or test script)
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
      batteryPct: 88,
      batteryVoltage: 3.96,
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
