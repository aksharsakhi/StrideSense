import React, { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle, BellRing, PhoneCall, CheckCircle,
  Volume2, VolumeX, MessageSquare, ShieldAlert
} from 'lucide-react';
import { notificationService } from '../services/notifications.js';
import { emergencyContactsService } from '../services/emergencyContacts.js';
import { nativeBridge } from '../services/native.js';

export default function FallAlertModal({
  isOpen = false,
  onCancel = () => {},
  initialSeconds = 15
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [primaryContact, setPrimaryContact] = useState(() => emergencyContactsService.getPrimaryContact());
  const [secondaryContacts, setSecondaryContacts] = useState(() => emergencyContactsService.getSecondaryContacts());
  const [dispatchResult, setDispatchResult] = useState(null);

  const audioContextRef = useRef(null);
  const beepIntervalRef = useRef(null);
  const hasDispatchedRef = useRef(false);

  useEffect(() => {
    setPrimaryContact(emergencyContactsService.getPrimaryContact());
    setSecondaryContacts(emergencyContactsService.getSecondaryContacts());
  }, [isOpen]);

  // Play synthesized emergency buzzer using Web Audio API
  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  const executeDispatch = () => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;

    // Trigger phone call to main contact and SMS to secondary contacts
    const result = emergencyContactsService.dispatchEmergency({
      reason: 'Automated 15s Fall Shock Grace Expiry'
    });
    setDispatchResult(result);

    // Fire native local notification and emergency haptic pattern
    notificationService.notifyEmergencyDispatched();
    nativeBridge.triggerEmergencyVibration();
  };

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(initialSeconds);
      hasDispatchedRef.current = false;
      setDispatchResult(null);
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
      return;
    }

    setSecondsLeft(initialSeconds);
    hasDispatchedRef.current = false;

    if (soundEnabled) {
      playBeep();
      beepIntervalRef.current = setInterval(() => {
        playBeep();
      }, 1000);
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    };
  }, [isOpen, soundEnabled, initialSeconds]);

  if (!isOpen) return null;

  const isDispatched = secondsLeft === 0;

  const handleManualDispatch = () => {
    nativeBridge.impactHeavy();
    setSecondsLeft(0);
    executeDispatch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden transition-colors"
        style={{ boxShadow: '0 0 50px rgba(244, 63, 94, 0.5)' }}
      >
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          title={soundEnabled ? 'Mute Alert' : 'Enable Alert Siren'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Pulsing Alert Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mb-4 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
          {isDispatched ? 'EMERGENCY DISPATCHED' : 'POTENTIAL FALL DETECTED!'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xs mx-auto">
          {isDispatched
            ? `Emergency protocol initiated. Auto-calling primary contact and broadcasting SMS.`
            : 'Kinematic shock impact recorded. Please confirm if you are alright before timer expires.'}
        </p>

        {/* Countdown Ring or Dispatched State */}
        {!isDispatched ? (
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="42"
                  className="stroke-slate-200 dark:stroke-white/10"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50" cy="50" r="42"
                  stroke="#f43f5e"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={264}
                  strokeDashoffset={264 * (1 - secondsLeft / initialSeconds)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{secondsLeft}</span>
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Secs</span>
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Auto-calling <span className="font-bold text-rose-600 dark:text-rose-400">{primaryContact?.name || 'Emergency Contact'}</span> in {secondsLeft}s
            </span>
          </div>
        ) : (
          <div className="my-5 flex flex-col gap-2.5 animate-fade-in">
            {/* Primary Contact Direct Call Card */}
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 rounded-xl bg-rose-500 text-white">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Auto-Calling Main Contact
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {primaryContact?.name || 'Emergency Contact'}
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                    {primaryContact?.phone || '108'}
                  </div>
                </div>
              </div>

              <a
                href={`tel:${primaryContact?.phone?.replace(/[^0-9+]/g, '') || '108'}`}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/30 active-press"
              >
                Redial
              </a>
            </div>

            {/* Secondary SMS Broadcast Card */}
            {secondaryContacts.length > 0 && (
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between text-left text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>SMS Broadcast to <strong>{secondaryContacts.length}</strong> contacts</span>
                </div>
                <span className="badge badge-emerald text-[9px]">Dispatched</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            I'M OK - CANCEL ALERT
          </button>

          {!isDispatched && (
            <button
              type="button"
              onClick={handleManualDispatch}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline py-1 transition-colors flex items-center justify-center gap-1 font-semibold"
            >
              <BellRing className="w-3.5 h-3.5" />
              Call Main Contact Immediately (Need Help Now)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
