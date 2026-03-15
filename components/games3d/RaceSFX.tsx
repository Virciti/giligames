'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Procedural racing sound effects using Web Audio API.
 * No audio files required — all sounds synthesized in real-time.
 */

interface RaceSFXProps {
  /** Current vehicle speed (0–60+) */
  speed: number;
  /** Is the engine running (racing phase) */
  isRacing: boolean;
  /** Is boost currently active */
  isBoosting: boolean;
  /** Is player currently drifting (for tire screech) */
  isDrifting?: boolean;
  /** Is player braking hard (for tire screech) */
  isBraking?: boolean;
  /** Current surface type for surface-dependent audio */
  surfaceType?: string;
  /** Is this the final lap (tempo increase) */
  isFinalLap?: boolean;
  /** Fires a one-shot collision sound */
  collisionTrigger: number;
  /** Fires a one-shot banana-slip sound */
  slipTrigger: number;
  /** Fires a one-shot lap-complete sound */
  lapTrigger: number;
  /** Fires a one-shot race-finish fanfare */
  finishTrigger: number;
  /** Fires a one-shot item pickup jingle */
  itemPickupTrigger?: number;
  /** Fires a one-shot crowd cheer */
  crowdCheerTrigger?: number;
  /** Countdown beep (3, 2, 1, 0=GO) */
  countdownBeep: number | null;
}

// Clamp helper
function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

export function RaceSFX({
  speed,
  isRacing,
  isBoosting,
  isDrifting = false,
  isBraking = false,
  surfaceType = 'road',
  isFinalLap = false,
  collisionTrigger,
  slipTrigger,
  lapTrigger,
  finishTrigger,
  itemPickupTrigger = 0,
  crowdCheerTrigger = 0,
  countdownBeep,
}: RaceSFXProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const boostGainRef = useRef<GainNode | null>(null);
  const boostOscRef = useRef<OscillatorNode | null>(null);
  const screechGainRef = useRef<GainNode | null>(null);
  const screechOscRef = useRef<OscillatorNode | null>(null);
  const startedRef = useRef(false);

  // Lazily create AudioContext on first user interaction
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // --- Engine hum (continuous oscillator whose frequency tracks speed) ---
  useEffect(() => {
    if (!isRacing) {
      // Stop engine sound
      if (engineOscRef.current) {
        engineGainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.1);
      }
      startedRef.current = false;
      return;
    }

    const ctx = getCtx();
    if (!ctx) return;

    if (!startedRef.current) {
      // Create engine oscillator chain: osc → gain → destination
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 60;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      // Low-pass filter for a muffled engine tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      engineOscRef.current = osc;
      engineGainRef.current = gain;
      startedRef.current = true;
    }

    // Update engine pitch and volume based on speed
    const now = ctxRef.current?.currentTime ?? 0;
    const normSpeed = clamp(speed / 60, 0, 1);
    // Final lap tempo boost — engine runs 15% higher pitch for urgency
    const tempoMult = isFinalLap ? 1.15 : 1.0;
    const freq = (55 + normSpeed * 120) * tempoMult; // 55 Hz idle → 175 Hz at max speed
    // PHASE 8C: Boosted engine volume range (0.15–0.30) for more presence
    const vol = 0.15 + normSpeed * 0.15;

    engineOscRef.current?.frequency.setTargetAtTime(freq, now, 0.15);
    engineGainRef.current?.gain.setTargetAtTime(vol, now, 0.15);
  }, [isRacing, speed, isFinalLap, getCtx]);

  // --- Boost whine (higher-pitch oscillator layered on top) ---
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;

    if (isBoosting && isRacing) {
      if (!boostOscRef.current) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 300;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        boostOscRef.current = osc;
        boostGainRef.current = gain;
      }
      const now = ctx.currentTime;
      boostOscRef.current.frequency.setTargetAtTime(300 + clamp(speed / 60, 0, 1) * 200, now, 0.1);
      boostGainRef.current?.gain.setTargetAtTime(0.06, now, 0.05);
    } else if (boostGainRef.current) {
      boostGainRef.current.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.1);
    }
  }, [isBoosting, isRacing, speed, getCtx]);

  // --- One-shot: collision thud ---
  useEffect(() => {
    if (collisionTrigger === 0) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 80;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.3);
  }, [collisionTrigger, getCtx]);

  // --- One-shot: banana slip (descending whistle) ---
  useEffect(() => {
    if (slipTrigger === 0) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.1;

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.55);
  }, [slipTrigger, getCtx]);

  // --- One-shot: lap complete (ascending ding) ---
  useEffect(() => {
    if (lapTrigger === 0) return;
    const ctx = getCtx();
    if (!ctx) return;

    const notes = [523, 659, 784]; // C5, E5, G5 arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0.1;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
      osc.stop(ctx.currentTime + i * 0.1 + 0.35);
    });
  }, [lapTrigger, getCtx]);

  // --- One-shot: race finish fanfare ---
  useEffect(() => {
    if (finishTrigger === 0) return;
    const ctx = getCtx();
    if (!ctx) return;

    const melody = [523, 659, 784, 1047]; // C5 E5 G5 C6
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      gain.gain.setTargetAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4, 0.1);
      osc.stop(ctx.currentTime + i * 0.15 + 0.6);
    });
  }, [finishTrigger, getCtx]);

  // --- Countdown beeps ---
  useEffect(() => {
    if (countdownBeep === null) return;
    const ctx = getCtx();
    if (!ctx) return;

    const isGo = countdownBeep === 0;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = isGo ? 880 : 440; // higher pitch for GO

    const gain = ctx.createGain();
    gain.gain.value = isGo ? 0.12 : 0.08;

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    const duration = isGo ? 0.3 : 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration + 0.05);
  }, [countdownBeep, getCtx]);

  // --- Tire screech (continuous, activated during drift or hard braking) ---
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;

    const shouldScreech = isRacing && (isDrifting || isBraking) && speed > 10;

    if (shouldScreech) {
      if (!screechOscRef.current) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 1200;

        // Band-pass filter for tire screech character
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 5;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        screechOscRef.current = osc;
        screechGainRef.current = gain;
      }
      const now = ctx.currentTime;
      // Surface-dependent screech pitch: dirt is lower/muffled, road is sharper
      const surfacePitch = surfaceType === 'dirt' ? 800 : surfaceType === 'oil-slick' ? 600 : 1200;
      const screechVol = isDrifting ? 0.08 : 0.05; // Drift is louder than braking
      screechOscRef.current.frequency.setTargetAtTime(surfacePitch + Math.random() * 200, now, 0.05);
      screechGainRef.current?.gain.setTargetAtTime(screechVol, now, 0.03);
    } else if (screechGainRef.current) {
      screechGainRef.current.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.08);
    }
  }, [isDrifting, isBraking, isRacing, speed, surfaceType, getCtx]);

  // --- One-shot: item pickup jingle (ascending sparkle) ---
  useEffect(() => {
    if (itemPickupTrigger === 0) return;
    const ctx = getCtx();
    if (!ctx) return;

    const notes = [880, 1109, 1319]; // A5, C#6, E6 — bright major triad
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0.1;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  }, [itemPickupTrigger, getCtx]);

  // --- One-shot: crowd cheer (noise burst with envelope) ---
  useEffect(() => {
    if (crowdCheerTrigger === 0) return;
    const ctx = getCtx();
    if (!ctx) return;

    // Create noise-based crowd roar using multiple detuned oscillators
    const freqs = [200, 280, 350, 420];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq + Math.random() * 30;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 300;
      filter.Q.value = 1;

      const gain = ctx.createGain();
      gain.gain.value = 0.04;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      gain.gain.setTargetAtTime(0.06, ctx.currentTime, 0.1);
      gain.gain.setTargetAtTime(0.001, ctx.currentTime + 0.8, 0.3);
      osc.stop(ctx.currentTime + 1.5);
    });
  }, [crowdCheerTrigger, getCtx]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineOscRef.current?.stop();
      boostOscRef.current?.stop();
      screechOscRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  return null; // Audio-only component, no DOM output
}

export default RaceSFX;
