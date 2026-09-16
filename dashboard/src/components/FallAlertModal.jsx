import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, BellRing, PhoneCall, CheckCircle, Volume2, VolumeX } from 'lucide-react';

export default function FallAlertModal({
  isOpen = false,
  onCancel = () => {},
  initialSeconds = 15
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef(null);
  const beepIntervalRef = useRef(null);

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
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz High siren
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio not permitted or unsupported
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(initialSeconds);
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
      return;
    }

    setSecondsLeft(initialSeconds);

    if (soundEnabled) {
      playBeep();
      beepIntervalRef.current = setInterval(() => {
        playBeep();
      }, 1000);
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-slate-900/95 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden"
        style={{ boxShadow: '0 0 50px rgba(244, 63, 94, 0.6)' }}
      >
        {/* Top Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
          title={soundEnabled ? 'Mute Alert' : 'Enable Alert Siren'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Pulsing Alert Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mb-5 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
          {isDispatched ? 'EMERGENCY DISPATCHED' : 'POTENTIAL FALL DETECTED!'}
        </h2>

        <p className="text-sm text-slate-300 mt-2 max-w-xs mx-auto">
          {isDispatched
            ? 'Caregiver and emergency response notified with GPS telemetry coordinates.'
            : 'Kinematic impact shock and posture change recorded. Please confirm if you are alright.'}
        </p>

        {/* Countdown Ring or Dispatched State */}
        {!isDispatched ? (
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="42"
                  stroke="rgba(255, 255, 255, 0.1)"
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
                <span className="text-3xl font-mono font-bold text-white">{secondsLeft}</span>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Secs</span>
              </div>
            </div>
            <span className="text-xs text-slate-400 mt-2">Emergency auto-dispatch timer</span>
          </div>
        ) : (
          <div className="my-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-center gap-3">
            <PhoneCall className="w-5 h-5 text-rose-400 animate-pulse" />
            <div className="text-left text-xs">
              <div className="text-white font-bold">Calling Emergency Contact</div>
              <div className="text-rose-300">Dr. Rajesh Sharma (+91-98765-43210)</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={onCancel}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            I'M OK - CANCEL ALERT
          </button>

          {!isDispatched && (
            <button
              onClick={() => setSecondsLeft(0)}
              className="text-xs text-rose-400 hover:text-rose-300 py-1 transition-colors flex items-center justify-center gap-1"
            >
              <BellRing className="w-3.5 h-3.5" />
              Dispatch Immediately (Need Help)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
