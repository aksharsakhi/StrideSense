/**
 * StrideSense Standalone Telemetry Simulator (Node.js Daemon) - Bilateral Edition
 * Broadcasts hardware-accurate simulated insole telemetry to Supabase for BOTH feet:
 *  - Left Foot: 'insole_left_02'
 *  - Right Foot: 'insole_right_02'
 */

import { PhysicsEngine } from './src/services/physicsEngine.js';
import { extractFeatures, runTinyMLInference } from './src/services/tinyMLEval.js';

const SUPABASE_HOST = "https://sgooptohhldguitvhbrl.supabase.co";
const SUPABASE_KEY = "sb_publishable_XOwUeGn_OBNf0XoAMNmT9g_3M91ATSI";
const ENDPOINT = "/rest/v1/telemetry";

const DEVICE_LEFT = "insole_left_02";
const DEVICE_RIGHT = "insole_right_02";

const engine = new PhysicsEngine();
let stepsLeft = 0;
let stepsRight = 0;
let prevPhaseLeft = '';
let prevPhaseRight = '';
let lastBroadcast = 0;

console.log('🚀 StrideSense Bilateral Simulation Daemon Starting...');
console.log(`📡 Target Devices: Left [${DEVICE_LEFT}] & Right [${DEVICE_RIGHT}]`);
console.log(`🌐 Supabase Host: ${SUPABASE_HOST}`);
console.log(`⏱️ Loop: 50 Hz Kinematics | 1 Hz Bilateral Cloud Telemetry\n`);

setInterval(async () => {
  const sample = engine.step();
  const features = extractFeatures(engine.windowBuffer);
  const inference = runTinyMLInference(features, engine.fallState);

  // Bilateral step detection
  const isContactPhase = (phase) => Boolean(
    phase && (
      phase.includes('Strike') ||
      phase.includes('Contact') ||
      phase.includes('Impact') ||
      phase.includes('Touchdown')
    )
  );

  const isStrikeLeft = isContactPhase(sample.left?.phase);
  const wasStrikeLeft = isContactPhase(prevPhaseLeft);
  if (isStrikeLeft && !wasStrikeLeft && engine.isRunning) {
    stepsLeft += 1;
  }
  prevPhaseLeft = sample.left?.phase || '';

  const isStrikeRight = isContactPhase(sample.right?.phase);
  const wasStrikeRight = isContactPhase(prevPhaseRight);
  if (isStrikeRight && !wasStrikeRight && engine.isRunning) {
    stepsRight += 1;
  }
  prevPhaseRight = sample.right?.phase || '';

  const now = Date.now();
  if (now - lastBroadcast >= 1000) {
    lastBroadcast = now;
    const totalSteps = stepsLeft + stepsRight;

    let dynamicCadence = 108.0;
    if (engine.scenario === 'running') dynamicCadence = 165.0;
    else if (engine.scenario === 'elderly_shuffle') dynamicCadence = 70.0;
    else if (engine.scenario === 'post_op_limp') dynamicCadence = 84.0;
    else if (engine.scenario === 'stumble') dynamicCadence = 92.0;
    else if (engine.scenario === 'pronation') dynamicCadence = 104.0;
    else if (['standing', 'sitting', 'fall'].includes(engine.scenario)) dynamicCadence = 0.0;

    // Build Left Foot Payload
    const isFallActive = ['freefall', 'impact', 'alert_pending', 'dispatched'].includes(engine.fallState);
    const isFallEmergency = engine.fallState === 'dispatched';
    const leftForefoot = Math.round(sample.left?.p2 || 0);
    const payloadLeft = {
      device_id: DEVICE_LEFT,
      activity: isFallActive ? 'Fall' : (inference.activityName || "Walking"),
      confidence: parseFloat((inference.confidence || 0.95).toFixed(2)),
      steps: totalSteps,
      cadence: dynamicCadence,
      symmetry: parseFloat((sample.bilateral?.symmetryIndex || 98.2).toFixed(1)),
      fall_alert: isFallActive,
      fall_emergency: isFallEmergency,
      p1: Math.round(sample.left?.p1 || 0),
      p2: leftForefoot,
      p3: 0,
      p4: 0,
      p5: leftForefoot,
      p6: 0,
      pitch: parseFloat((sample.left?.pitch || 0).toFixed(1)),
      roll: parseFloat((sample.left?.roll || 0).toFixed(1)),
      svm_a: parseFloat((Math.sqrt(
        (sample.left?.ax || 0) ** 2 + (sample.left?.ay || 0) ** 2 + (sample.left?.az || 1) ** 2
      ) || 1.0).toFixed(2))
    };

    // Build Right Foot Payload
    const rightForefoot = Math.round(sample.right?.p2 || 0);
    const payloadRight = {
      device_id: DEVICE_RIGHT,
      activity: isFallActive ? 'Fall' : (inference.activityName || "Walking"),
      confidence: parseFloat((inference.confidence || 0.95).toFixed(2)),
      steps: totalSteps,
      cadence: dynamicCadence,
      symmetry: parseFloat((sample.bilateral?.symmetryIndex || 98.2).toFixed(1)),
      fall_alert: isFallActive,
      fall_emergency: isFallEmergency,
      p1: Math.round(sample.right?.p1 || 0),
      p2: rightForefoot,
      p3: 0,
      p4: 0,
      p5: rightForefoot,
      p6: 0,
      pitch: parseFloat((sample.right?.pitch || 0).toFixed(1)),
      roll: parseFloat((sample.right?.roll || 0).toFixed(1)),
      svm_a: parseFloat((Math.sqrt(
        (sample.right?.ax || 0) ** 2 + (sample.right?.ay || 0) ** 2 + (sample.right?.az || 1) ** 2
      ) || 1.0).toFixed(2))
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal"
      };

      // Broadcast both feet concurrently
      await Promise.all([
        fetch(`${SUPABASE_HOST}${ENDPOINT}`, { method: "POST", headers, body: JSON.stringify(payloadLeft) }),
        fetch(`${SUPABASE_HOST}${ENDPOINT}`, { method: "POST", headers, body: JSON.stringify(payloadRight) })
      ]);

      console.log(`[${new Date().toLocaleTimeString()}] ✅ Bilateral Sent | Steps: ${totalSteps} | L[H:${payloadLeft.p1}, F:${payloadLeft.p2}] R[H:${payloadRight.p1}, F:${payloadRight.p2}] | Sym: ${sample.bilateral?.symmetryIndex}%`);
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Network error:`, err.message);
    }
  }
}, 20);
