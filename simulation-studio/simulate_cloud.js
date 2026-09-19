/**
 * StrideSense Standalone Telemetry Simulator (Node.js Daemon)
 * Broadcasts hardware-accurate simulated insole telemetry to Supabase under device_id: 'insole_left_02'.
 */

import { PhysicsEngine } from './src/services/physicsEngine.js';
import { extractFeatures, runTinyMLInference } from './src/services/tinyMLEval.js';

const SUPABASE_HOST = "https://sgooptohhldguitvhbrl.supabase.co";
const SUPABASE_KEY = "sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI";
const ENDPOINT = "/rest/v1/telemetry";
const DEVICE_ID = "insole_left_02";

const engine = new PhysicsEngine();
let steps = 0;
let prevPhase = '';
let lastBroadcast = 0;

console.log('🚀 StrideSense Simulation Daemon Starting...');
console.log(`📡 Target Device: ${DEVICE_ID}`);
console.log(`🌐 Supabase Host: ${SUPABASE_HOST}`);
console.log(`⏱️ Loop: 50 Hz Kinematics | 1 Hz Cloud Telemetry\n`);

setInterval(async () => {
  const sample = engine.step();
  const features = extractFeatures(engine.windowBuffer);
  const inference = runTinyMLInference(features, engine.fallState);

  // Step detection
  const isStrike = sample.phase && sample.phase.includes('Strike');
  const wasStrike = prevPhase && prevPhase.includes('Strike');
  if (isStrike && !wasStrike && engine.isRunning) {
    steps += 1;
  }
  prevPhase = sample.phase || '';

  const now = Date.now();
  if (now - lastBroadcast >= 1000) {
    lastBroadcast = now;
    const forefootVal = Math.round(sample.p2 || sample.p5 || 0);
    const payload = {
      device_id: DEVICE_ID,
      activity: inference.activityName || "Walking",
      confidence: parseFloat((inference.confidence || 0.9).toFixed(2)),
      steps: steps,
      cadence: 108.0,
      symmetry: 98.2,
      fall_alert: false,
      p1: Math.round(sample.p1 || 0),
      p2: forefootVal,
      p3: 0,
      p4: 0,
      p5: forefootVal,
      p6: 0,
      pitch: parseFloat((sample.pitch || 0).toFixed(1)),
      roll: parseFloat((sample.roll || 0).toFixed(1)),
      svm_a: parseFloat((Math.sqrt(sample.ax * sample.ax + sample.ay * sample.ay + sample.az * sample.az) || 1.0).toFixed(2))
    };

    try {
      const res = await fetch(`${SUPABASE_HOST}${ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Sent | Steps: ${steps} | Act: ${payload.activity} (${(payload.confidence * 100).toFixed(0)}%) | Heel: ${payload.p1} | Forefoot: ${payload.p2} | Pitch: ${payload.pitch}°`);
      } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Network error:`, err.message);
    }
  }
}, 20);
