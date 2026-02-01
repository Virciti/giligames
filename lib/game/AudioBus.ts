/**
 * AudioBus - Sound effects and music manager with preloading
 */

import type { AudioChannel, AudioConfig, SoundEffect } from './types';

const DEFAULT_CONFIG: AudioConfig = {
  masterVolume: 1.0,
  musicVolume: 0.7,
  sfxVolume: 1.0,
  voiceVolume: 1.0,
  musicEnabled: true,
  sfxEnabled: true,
  voiceEnabled: true,
};

interface LoadedSound {
  audio: HTMLAudioElement;
  effect: SoundEffect;
}

export class AudioBus {
  private config: AudioConfig;
  private sounds: Map<string, LoadedSound> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicId: string | null = null;
  private currentVoice: HTMLAudioElement | null = null;
  private preloadPromises: Map<string, Promise<void>> = new Map();

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a sound effect (does not load it yet)
   */
  register(effect: SoundEffect): void {
    if (this.sounds.has(effect.id)) return;

    const audio = new Audio();
    audio.src = effect.path;
    audio.loop = effect.loop ?? false;
    audio.volume = this.calculateVolume(effect);

    this.sounds.set(effect.id, { audio, effect });
  }

  /**
   * Preload a sound (returns promise that resolves when loaded)
   */
  preload(id: string): Promise<void> {
    const sound = this.sounds.get(id);
    if (!sound) {
      return Promise.reject(new Error(`Sound not registered: ${id}`));
    }

    // Return existing promise if already loading
    const existing = this.preloadPromises.get(id);
    if (existing) return existing;

    const promise = new Promise<void>((resolve, reject) => {
      const audio = sound.audio;

      if (audio.readyState >= 3) {
        // Already loaded
        resolve();
        return;
      }

      const onCanPlay = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        reject(new Error(`Failed to load sound: ${id}`));
      };

      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('error', onError);
      audio.load();
    });

    this.preloadPromises.set(id, promise);
    return promise;
  }

  /**
   * Preload multiple sounds in parallel
   */
  preloadAll(ids: string[]): Promise<void[]> {
    return Promise.all(ids.map((id) => this.preload(id)));
  }

  /**
   * Play a sound effect
   */
  play(id: string): HTMLAudioElement | null {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return null;
    }

    // Check if channel is enabled
    if (!this.isChannelEnabled(sound.effect.channel)) {
      return null;
    }

    // For SFX, clone the audio to allow overlapping
    if (sound.effect.channel === 'sfx') {
      const clone = sound.audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.calculateVolume(sound.effect);
      clone.play().catch(() => {
        // Ignore autoplay errors
      });
      return clone;
    }

    // For music and voice, use the original
    sound.audio.currentTime = 0;
    sound.audio.volume = this.calculateVolume(sound.effect);
    sound.audio.play().catch(() => {
      // Ignore autoplay errors
    });

    return sound.audio;
  }

  /**
   * Play music (stops any currently playing music)
   */
  playMusic(id: string): void {
    if (this.currentMusicId === id && this.currentMusic && !this.currentMusic.paused) {
      return; // Already playing this track
    }

    this.stopMusic();

    const sound = this.sounds.get(id);
    if (!sound || sound.effect.channel !== 'music') {
      console.warn(`Music not found or wrong channel: ${id}`);
      return;
    }

    if (!this.config.musicEnabled) return;

    this.currentMusic = sound.audio;
    this.currentMusicId = id;
    this.currentMusic.loop = true;
    this.currentMusic.volume = this.calculateVolume(sound.effect);
    this.currentMusic.play().catch(() => {
      // Ignore autoplay errors
    });
  }

  /**
   * Stop currently playing music
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicId = null;
    }
  }

  /**
   * Pause music
   */
  pauseMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
    }
  }

  /**
   * Resume music
   */
  resumeMusic(): void {
    if (this.currentMusic && this.config.musicEnabled) {
      this.currentMusic.play().catch(() => {});
    }
  }

  /**
   * Play a voice prompt (stops any currently playing voice)
   */
  playVoice(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopVoice();

      const sound = this.sounds.get(id);
      if (!sound || sound.effect.channel !== 'voice') {
        reject(new Error(`Voice not found or wrong channel: ${id}`));
        return;
      }

      if (!this.config.voiceEnabled) {
        resolve();
        return;
      }

      // Optionally duck music while voice plays
      if (this.currentMusic) {
        this.currentMusic.volume = this.config.masterVolume * this.config.musicVolume * 0.3;
      }

      this.currentVoice = sound.audio;
      this.currentVoice.currentTime = 0;
      this.currentVoice.volume = this.calculateVolume(sound.effect);

      const onEnded = () => {
        sound.audio.removeEventListener('ended', onEnded);
        sound.audio.removeEventListener('error', onError);
        this.currentVoice = null;

        // Restore music volume
        if (this.currentMusic) {
          this.currentMusic.volume = this.config.masterVolume * this.config.musicVolume;
        }

        resolve();
      };

      const onError = () => {
        sound.audio.removeEventListener('ended', onEnded);
        sound.audio.removeEventListener('error', onError);
        this.currentVoice = null;
        reject(new Error(`Failed to play voice: ${id}`));
      };

      sound.audio.addEventListener('ended', onEnded);
      sound.audio.addEventListener('error', onError);

      sound.audio.play().catch(reject);
    });
  }

  /**
   * Stop currently playing voice
   */
  stopVoice(): void {
    if (this.currentVoice) {
      this.currentVoice.pause();
      this.currentVoice.currentTime = 0;
      this.currentVoice = null;

      // Restore music volume
      if (this.currentMusic) {
        this.currentMusic.volume = this.config.masterVolume * this.config.musicVolume;
      }
    }
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.stopMusic();
    this.stopVoice();
  }

  /**
   * Update audio configuration
   */
  setConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };

    // Update volume on currently playing audio
    if (this.currentMusic) {
      const sound = this.sounds.get(this.currentMusicId!);
      if (sound) {
        this.currentMusic.volume = this.calculateVolume(sound.effect);
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<AudioConfig> {
    return { ...this.config };
  }

  /**
   * Check if a channel is currently enabled
   */
  isChannelEnabled(channel: AudioChannel): boolean {
    switch (channel) {
      case 'music':
        return this.config.musicEnabled;
      case 'sfx':
        return this.config.sfxEnabled;
      case 'voice':
        return this.config.voiceEnabled;
    }
  }

  /**
   * Calculate volume for a sound effect
   */
  private calculateVolume(effect: SoundEffect): number {
    const effectVolume = effect.volume ?? 1.0;
    let channelVolume = 1.0;

    switch (effect.channel) {
      case 'music':
        channelVolume = this.config.musicVolume;
        break;
      case 'sfx':
        channelVolume = this.config.sfxVolume;
        break;
      case 'voice':
        channelVolume = this.config.voiceVolume;
        break;
    }

    return this.config.masterVolume * channelVolume * effectVolume;
  }

  /**
   * Cleanup and release all resources
   */
  destroy(): void {
    this.stopAll();
    this.sounds.clear();
    this.preloadPromises.clear();
  }
}

// Singleton instance for global access
let audioBusInstance: AudioBus | null = null;

/**
 * Get or create the global AudioBus instance
 */
export function getAudioBus(config?: Partial<AudioConfig>): AudioBus {
  if (!audioBusInstance) {
    audioBusInstance = new AudioBus(config);
  } else if (config) {
    audioBusInstance.setConfig(config);
  }
  return audioBusInstance;
}

/**
 * Create a new AudioBus instance (not the singleton)
 */
export function createAudioBus(config?: Partial<AudioConfig>): AudioBus {
  return new AudioBus(config);
}
