/**
 * StrideSense - Supabase Real-Time & Analytics Service
 * Connects to Supabase PostgreSQL via WebSockets Realtime CDC and PostgREST.
 * Supports multi-device switching (Hardware ESP32 vs Virtual Simulation Studio).
 */

import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://sgooptohhldguitvhbrl.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI';

const STORAGE_KEY_DEVICE = 'stridesense_selected_device';
const INITIAL_DEVICE_ID =
  (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_DEVICE)) ||
  env.VITE_DEVICE_ID ||
  'bilateral_sim';

export const FALLBACK_DEVICES = [
  {
    id: 'stridesense_esp32_01',
    name: 'StrideSense Unified Hardware (1x ESP32, 4x FSR)',
    type: 'pair',
    side: 'bilateral',
    leftId: 'stridesense_esp32_01',
    rightId: 'stridesense_esp32_01',
    battery_pct: 95,
    battery_voltage: 4.08,
    firmware_version: 'v1.5.0-Unified-TinyML',
    badge: 'UNIFIED HW'
  },
  {
    id: 'bilateral_sim',
    name: 'Bilateral 3D Simulation (Studio)',
    type: 'pair',
    leftId: 'insole_left_02',
    rightId: 'insole_right_02',
    battery_pct: 100,
    battery_voltage: 4.20,
    firmware_version: 'v1.4.2-VirtualSim',
    badge: 'BILATERAL SIM'
  },
  {
    id: 'insole_left_02',
    name: 'Left Insole (3D Virtual)',
    type: 'single',
    side: 'left',
    battery_pct: 100,
    battery_voltage: 4.20,
    firmware_version: 'v1.4.2-VirtualSim',
    badge: 'SIM LEFT'
  },
  {
    id: 'insole_right_02',
    name: 'Right Insole (3D Virtual)',
    type: 'single',
    side: 'right',
    battery_pct: 100,
    battery_voltage: 4.20,
    firmware_version: 'v1.4.2-VirtualSim',
    badge: 'SIM RIGHT'
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

    // Cache state for bilateral nodes
    this.cachedLeft = this.getEmptyFootTelemetry('left', 'stridesense_esp32_01');
    this.cachedRight = this.getEmptyFootTelemetry('right', 'stridesense_esp32_01');

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

  isBilateralMode() {
    return this.deviceId === 'stridesense_esp32_01' || 
           this.deviceId === 'bilateral_hw' || 
           this.deviceId === 'bilateral_sim';
  }

  getPairedDeviceIds(id = this.deviceId) {
    if (id === 'stridesense_esp32_01' || id === 'bilateral_hw') {
      return { leftId: 'stridesense_esp32_01', rightId: 'stridesense_esp32_01' };
    }
    if (id === 'bilateral_sim') {
      return { leftId: 'insole_left_02', rightId: 'insole_right_02' };
    }
    if (id.includes('right')) {
      return { leftId: null, rightId: id };
    }
    return { leftId: id, rightId: null };
  }

  getEmptyFootTelemetry(side = 'left', id = '') {
    const isSim = id.includes('02') || this.deviceId === 'bilateral_sim';
    return {
      deviceId: id,
      side,
      timestamp: Date.now(),
      activity: 'Offline',
      confidence: 0,
      steps: 0,
      cadence: 0,
      symmetry: 100,
      fallAlert: false,
      fallEmergency: false,
      isOnline: false,
      batteryPct: isSim ? 100 : 88,
      batteryVoltage: isSim ? 4.20 : 3.96,
      sensors: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 },
      imu: { ax: 0, ay: 0, az: 1.0, gx: 0, gy: 0, gz: 0, pitch: 0, roll: 0, svmA: 1.0 }
    };
  }

  getEmptyTelemetryForDevice(id = this.deviceId) {
    const { leftId, rightId } = this.getPairedDeviceIds(id);
    const left = this.getEmptyFootTelemetry('left', leftId || id);
    const right = this.getEmptyFootTelemetry('right', rightId || id);

    return this.combineBilateralTelemetry(left, right);
  }

  combineBilateralTelemetry(left, right) {
    const isBilateral = this.isBilateralMode();
    const isOnline = Boolean(left.isOnline || right.isOnline);

    const leftForce = isOnline ? ((left.sensors?.p1 || 0) + (left.sensors?.p2 || 0)) : 0;
    const rightForce = isOnline ? ((right.sensors?.p1 || 0) + (right.sensors?.p2 || 0)) : 0;
    const totalForce = leftForce + rightForce;

    let leftPct = 50.0;
    let rightPct = 50.0;
    if (totalForce > 0) {
      leftPct = parseFloat(((leftForce / totalForce) * 100).toFixed(1));
      rightPct = parseFloat(((rightForce / totalForce) * 100).toFixed(1));
    }

    // True multi-stride clinical gait symmetry computed by the sensor fusion / simulation engine
    const gaitSymmetry = (isOnline && left.isOnline && typeof left.symmetry === 'number' && left.symmetry > 0)
      ? left.symmetry
      : ((isOnline && right.isOnline && typeof right.symmetry === 'number' && right.symmetry > 0)
        ? right.symmetry
        : 100.0);

    const instantaneousImbalance = totalForce > 0
      ? Math.max(0, parseFloat((100 - Math.abs(leftPct - rightPct) * 2).toFixed(1)))
      : 100.0;

    // Center of pressure (-1.0 Left to +1.0 Right, Y is Heel -1 to Forefoot +1)
    const copX = totalForce > 0 ? (rightForce - leftForce) / totalForce : 0;
    const foreTotal = isOnline ? ((left.sensors?.p2 || 0) + (right.sensors?.p2 || 0)) : 0;
    const heelTotal = isOnline ? ((left.sensors?.p1 || 0) + (right.sensors?.p1 || 0)) : 0;
    const copY = totalForce > 0 ? (foreTotal - heelTotal) / totalForce : 0;

    const estNewtons = Math.round((totalForce / 4400) * 680);
    const estLeftNewtons = Math.round((leftForce / 4400) * 680);
    const estRightNewtons = Math.round((rightForce / 4400) * 680);

    const activeFoot = right.isOnline && !left.isOnline ? right : left;

    return {
      timestamp: Math.max(left.timestamp || 0, right.timestamp || 0) || Date.now(),
      deviceId: this.deviceId,
      isBilateral,
      isOnline,
      activity: isOnline ? (left.isOnline && left.activity !== 'Offline' ? left.activity : (right.activity || 'Standing')) : 'Offline',
      confidence: isOnline ? Math.max(left.confidence || 0, right.confidence || 0) : 0,
      steps: Math.max(left.steps || 0, right.steps || 0),
      cadence: isOnline ? Math.max(left.cadence || 0, right.cadence || 0) : 0,
      symmetry: gaitSymmetry,
      fallAlert: isOnline && Boolean(left.fallAlert || right.fallAlert),
      fallEmergency: isOnline && Boolean(left.fallEmergency || right.fallEmergency),
      batteryPct: Math.round(((left.batteryPct || 90) + (right.batteryPct || 90)) / 2),
      batteryVoltage: parseFloat((((left.batteryVoltage || 4.0) + (right.batteryVoltage || 4.0)) / 2).toFixed(2)),
      // Sub-objects for dual insole visualizers
      left: { ...left },
      right: { ...right },
      bilateral: {
        leftForce,
        rightForce,
        totalForce,
        estNewtons,
        estLeftNewtons,
        estRightNewtons,
        leftPct,
        rightPct,
        symmetry: gaitSymmetry,
        instantaneousImbalance,
        cop: { x: parseFloat(copX.toFixed(2)), y: parseFloat(copY.toFixed(2)) }
      },
      // Backward compatible single-insole sensors/imu references
      sensors: {
        p1: isOnline ? (left.sensors?.p1 || 0) : 0,
        p2: isOnline ? (left.sensors?.p2 || 0) : 0,
        p3: isOnline ? (right.sensors?.p1 || 0) : 0,
        p4: isOnline ? (right.sensors?.p2 || 0) : 0,
        p5: isOnline ? (left.sensors?.p2 || 0) : 0,
        p6: isOnline ? (right.sensors?.p2 || 0) : 0,
        left: isOnline ? (left.sensors || { p1: 0, p2: 0 }) : { p1: 0, p2: 0 },
        right: isOnline ? (right.sensors || { p1: 0, p2: 0 }) : { p1: 0, p2: 0 }
      },
      imu: {
        pitch: activeFoot.imu?.pitch || 0,
        roll: activeFoot.imu?.roll || 0,
        ax: activeFoot.imu?.ax || 0,
        ay: activeFoot.imu?.ay || 0,
        az: activeFoot.imu?.az || 1.0,
        gx: activeFoot.imu?.gx || 0,
        gy: activeFoot.imu?.gy || 0,
        gz: activeFoot.imu?.gz || 0,
        svmA: activeFoot.imu?.svmA || 1.0,
        left: left.imu,
        right: right.imu
      }
    };
  }

  /**
   * Switches the active device or bilateral pair
   */
  async setDeviceId(id) {
    if (!id || this.deviceId === id) return;
    this.deviceId = id;
    try {
      localStorage.setItem(STORAGE_KEY_DEVICE, id);
    } catch (e) {}

    // Reset cached foot states
    const { leftId, rightId } = this.getPairedDeviceIds(id);
    this.cachedLeft = this.getEmptyFootTelemetry('left', leftId || id);
    this.cachedRight = this.getEmptyFootTelemetry('right', rightId || id);

    // Immediately emit default telemetry for new device to prevent state bleeding
    this.notify(this.getEmptyTelemetryForDevice(id));

    // Notify device listeners
    this.deviceListeners.forEach((fn) => fn(id));

    // Reconnect realtime channel to listen to the new device(s)
    this.disconnectRealtime();
    this.connectRealtime();

    // Immediately fetch latest telemetry for the newly selected device(s)
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
   * Fetches available devices from Supabase public.devices including bilateral pairs
   */
  async fetchAvailableDevices() {
    if (this.client) {
      try {
        const { data, error } = await this.client.from('devices').select('*');
        if (!error && data && data.length > 0) {
          return data.map((d) => {
            const isUnified = d.id === 'stridesense_esp32_01' || d.id === 'bilateral_hw';
            const isSim = d.id.includes('02') || d.id.includes('sim');
            return {
              id: d.id,
              name: d.name || (isUnified ? 'StrideSense Unified Hardware' : d.id),
              type: isUnified ? 'pair' : 'single',
              side: isUnified ? 'bilateral' : (d.id.includes('right') ? 'right' : 'left'),
              leftId: isUnified ? d.id : (d.id.includes('left') ? d.id : null),
              rightId: isUnified ? d.id : (d.id.includes('right') ? d.id : null),
              battery_pct: d.battery_pct ?? (isSim ? 100 : 95),
              battery_voltage: d.battery_voltage ?? (isSim ? 4.20 : 4.08),
              firmware_version: d.firmware_version || 'v1.5.0-Unified-TinyML',
              badge: isUnified ? 'UNIFIED HW' : (isSim ? 'SIM' : 'HW')
            };
          });
        }
      } catch (e) {
        console.warn('[Supabase] Using fallback devices list:', e);
      }
    }
    return FALLBACK_DEVICES;
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

    const { leftId, rightId } = this.getPairedDeviceIds(this.deviceId);

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

          // Unified Single ESP32 Hardware Kit (Carries both Left & Right FSRs in 1 packet)
          if (row.device_id === 'stridesense_esp32_01' || 
             (this.deviceId === 'stridesense_esp32_01' && row.device_id === 'stridesense_esp32_01')) {
            const leftRow = {
              ...row,
              device_id: 'stridesense_esp32_01',
              p1: row.p1 || 0,
              p2: row.p2 || 0,
              p5: row.p5 || row.p2 || 0
            };
            const rightRow = {
              ...row,
              device_id: 'stridesense_esp32_01',
              p1: row.p3 || 0,
              p2: row.p4 || 0,
              p5: row.p6 || row.p4 || 0
            };
            this.cachedLeft = this.normalizeSingleFootRow(leftRow, 'left', true);
            this.cachedRight = this.normalizeSingleFootRow(rightRow, 'right', true);
            this.notify(this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight));
            return;
          }

          if (this.isBilateralMode()) {
            if (row.device_id === leftId) {
              this.cachedLeft = this.normalizeSingleFootRow(row, 'left', true);
              if (row.p3 !== undefined || row.p4 !== undefined) {
                const rightRow = {
                  ...row,
                  device_id: rightId || 'stridesense_esp32_01',
                  p1: row.p3 || 0,
                  p2: row.p4 || 0,
                  p5: row.p6 || row.p4 || 0
                };
                this.cachedRight = this.normalizeSingleFootRow(rightRow, 'right', true);
              }
              this.notify(this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight));
            } else if (row.device_id === rightId) {
              this.cachedRight = this.normalizeSingleFootRow(row, 'right', true);
              this.notify(this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight));
            }
          } else {
            // Single insole mode
            if (!this.deviceId || row.device_id === this.deviceId) {
              const isRight = row.device_id?.includes('right');
              const single = this.normalizeSingleFootRow(row, isRight ? 'right' : 'left', true);
              if (isRight) {
                this.cachedRight = single;
              } else {
                this.cachedLeft = single;
                if (row.p3 !== undefined || row.p4 !== undefined) {
                  const rightRow = {
                    ...row,
                    device_id: 'stridesense_esp32_01',
                    p1: row.p3 || 0,
                    p2: row.p4 || 0,
                    p5: row.p6 || row.p4 || 0
                  };
                  this.cachedRight = this.normalizeSingleFootRow(rightRow, 'right', true);
                }
              }
              this.notify(this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight));
            }
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
   * Fetches latest telemetry row(s) for the active device or bilateral pair
   */
  async fetchLatestTelemetry() {
    if (!this.client) return null;
    try {
      const { leftId, rightId } = this.getPairedDeviceIds(this.deviceId);

      // Handle Unified Single ESP32 Hardware Kit
      if (this.deviceId === 'stridesense_esp32_01' || leftId === 'stridesense_esp32_01') {
        const { data, error } = await this.client
          .from('telemetry')
          .select('*')
          .eq('device_id', 'stridesense_esp32_01')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const lRow = data[0];
          const leftRow = {
            ...lRow,
            device_id: 'stridesense_esp32_01',
            p1: lRow.p1 || 0,
            p2: lRow.p2 || 0,
            p5: lRow.p5 || lRow.p2 || 0
          };
          const rightRow = {
            ...lRow,
            device_id: 'stridesense_esp32_01',
            p1: lRow.p3 || 0,
            p2: lRow.p4 || 0,
            p5: lRow.p6 || lRow.p4 || 0
          };
          this.cachedLeft = this.normalizeSingleFootRow(leftRow, 'left');
          this.cachedRight = this.normalizeSingleFootRow(rightRow, 'right');
          return this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight);
        }
      }

      if (this.isBilateralMode()) {
        const [resLeft, resRight] = await Promise.all([
          this.client
            .from('telemetry')
            .select('*')
            .eq('device_id', leftId)
            .order('created_at', { ascending: false })
            .limit(1),
          this.client
            .from('telemetry')
            .select('*')
            .eq('device_id', rightId)
            .order('created_at', { ascending: false })
            .limit(1)
        ]);

        if (resLeft.data && resLeft.data.length > 0) {
          const lRow = resLeft.data[0];
          this.cachedLeft = this.normalizeSingleFootRow(lRow, 'left');
          if (lRow.p3 > 0 || lRow.p4 > 0) {
            const rRow = {
              ...lRow,
              device_id: rightId || 'stridesense_esp32_01',
              p1: lRow.p3 || 0,
              p2: lRow.p4 || 0,
              p5: lRow.p6 || lRow.p4 || 0
            };
            this.cachedRight = this.normalizeSingleFootRow(rRow, 'right');
          }
        }
        if (resRight.data && resRight.data.length > 0) {
          this.cachedRight = this.normalizeSingleFootRow(resRight.data[0], 'right');
        }

        return this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight);
      }

      // Single device
      const targetId = leftId || rightId || this.deviceId;
      const { data, error } = await this.client
        .from('telemetry')
        .select('*')
        .eq('device_id', targetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      const isRight = targetId.includes('right');
      const single = this.normalizeSingleFootRow(data, isRight ? 'right' : 'left');
      if (isRight) {
        this.cachedRight = single;
      } else {
        this.cachedLeft = single;
        if (data.p3 !== undefined || data.p4 !== undefined) {
          const rRow = {
            ...data,
            device_id: 'stridesense_esp32_01',
            p1: data.p3 || 0,
            p2: data.p4 || 0,
            p5: data.p6 || data.p4 || 0
          };
          this.cachedRight = this.normalizeSingleFootRow(rRow, 'right');
        }
      }
      return this.combineBilateralTelemetry(this.cachedLeft, this.cachedRight);
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
      const { leftId } = this.getPairedDeviceIds(this.deviceId);
      const target = leftId || this.deviceId;
      const { data, error } = await this.client
        .from('telemetry')
        .select('created_at, activity, cadence, steps, symmetry, svm_a')
        .eq('device_id', target)
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

  normalizeSingleFootRow(row, side = 'left', forceFresh = false) {
    const rowTime = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    const ageMs = Math.abs(Date.now() - rowTime);
    // 5 second freshness window ensures stopped simulation or unplugged hardware is detected promptly
    const isFresh = forceFresh || (ageMs < 5000);
    const isOnline = isFresh && row.activity !== 'Offline';

    const isFall = Boolean(row.fall_alert) ||
      Boolean(row.fall_emergency) ||
      (row.activity && String(row.activity).toLowerCase() === 'fall');

    const isSim = row.device_id?.includes('02');

    return {
      deviceId: row.device_id,
      side,
      timestamp: rowTime,
      isOnline,
      activity: isOnline ? (row.activity || 'Standing') : 'Offline',
      confidence: isOnline ? (Number(row.confidence) || 0.95) : 0,
      steps: Number(row.steps) || 0,
      cadence: isOnline ? (Number(row.cadence) || 0) : 0,
      symmetry: Number(row.symmetry) || 100,
      fallAlert: isOnline && isFall,
      fallEmergency: isOnline && Boolean(row.fall_emergency),
      batteryPct: isSim ? 100 : 88,
      batteryVoltage: isSim ? 4.20 : 3.96,
      sensors: isFresh ? {
        p1: Number(row.p1) || 0,
        p2: Number(row.p2) || 0,
        p3: Number(row.p3) || 0,
        p4: Number(row.p4) || 0,
        p5: Number(row.p5) || Number(row.p2) || 0,
        p6: Number(row.p6) || 0
      } : {
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0
      },
      imu: isFresh ? {
        pitch: Number(row.pitch) || 0,
        roll: Number(row.roll) || 0,
        ax: 0, ay: 0, az: 1.0,
        gx: 0, gy: 0, gz: 0,
        svmA: Number(row.svm_a) || 1.0
      } : {
        pitch: 0,
        roll: 0,
        ax: 0, ay: 0, az: 1.0,
        gx: 0, gy: 0, gz: 0,
        svmA: 1.0
      }
    };
  }

  normalizeRow(row, forceFresh = false) {
    const side = row.device_id?.includes('right') ? 'right' : 'left';
    return this.normalizeSingleFootRow(row, side, forceFresh);
  }
}

export const supabaseService = new SupabaseService();
