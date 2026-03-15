/**
 * Procedural audio engine for the racing game using Web Audio API.
 * Generates all sounds synthetically — no audio files required.
 */

export class RacingAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineRunning = false;

  // Settings
  private sfxEnabled = true;

  /** Lazily create AudioContext (must happen after user gesture) */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // keep overall volume kid-friendly
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private get master(): GainNode {
    this.ensureContext();
    return this.masterGain!;
  }

  // ── Settings ────────────────────────────────────────────

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (!enabled) this.stopEngine();
  }

  // ── Engine sound ────────────────────────────────────────

  startEngine(): void {
    if (this.engineRunning || !this.sfxEnabled) return;
    const ctx = this.ensureContext();

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.15;
    this.engineGain.connect(this.master);

    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 60;
    this.engineOsc.connect(this.engineGain);
    this.engineOsc.start();

    this.engineRunning = true;
  }

  /** Update engine pitch/volume based on speed (0–1 normalized) */
  updateEngine(speedNorm: number): void {
    if (!this.engineRunning || !this.engineOsc || !this.engineGain) return;
    // Idle ~60Hz, full speed ~220Hz
    this.engineOsc.frequency.value = 60 + speedNorm * 160;
    // Louder when moving
    this.engineGain.gain.value = 0.08 + speedNorm * 0.14;
  }

  stopEngine(): void {
    if (!this.engineRunning) return;
    try {
      this.engineOsc?.stop();
    } catch { /* already stopped */ }
    this.engineOsc?.disconnect();
    this.engineGain?.disconnect();
    this.engineOsc = null;
    this.engineGain = null;
    this.engineRunning = false;
  }

  // ── One-shot SFX ────────────────────────────────────────

  /** Short ascending chirp for coin collection */
  playCoinCollect(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Two-note jingle for item box pickup */
  playItemCollect(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Note 1
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.value = 523; // C5
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(g1).connect(this.master);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Note 2 (higher)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.value = 784; // G5
    g2.gain.setValueAtTime(0.2, now + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(g2).connect(this.master);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.25);
  }

  /** Swoosh/sweep for boost activation */
  playBoost(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** Countdown beep (high pitch for GO) */
  playCountdownBeep(isGo: boolean): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = isGo ? 880 : 440;
    const duration = isGo ? 0.3 : 0.15;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration);
  }

  /** Ascending scale for lap completion */
  playLapComplete(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /** Victory fanfare for race finish */
  playRaceFinish(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Triumphant ascending arpeggio
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 E5 G5 C6 E6 G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 3 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  /** Banana throw / hit sound */
  playBananaHit(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Descending slide (comic "slip")
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Rising shimmer for shield activation */
  playShield(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Shimmering dual-tone
    [523, 784].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain).connect(this.master);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /** Crackling zap for lightning strike */
  playLightning(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // High-pitched zap descending rapidly
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.3);

    // Second crackle
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1500, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.35);
    g2.gain.setValueAtTime(0.12, now + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(g2).connect(this.master);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  }

  // ── Lifecycle ───────────────────────────────────────────

  destroy(): void {
    this.stopEngine();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
  }
}
