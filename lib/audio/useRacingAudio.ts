import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/stores/game-store';
import { RacingAudio } from './racing-audio';

/**
 * Hook that provides racing audio controls.
 * Respects the game store's soundEnabled setting.
 * Lazily creates AudioContext on first user interaction.
 */
export function useRacingAudio() {
  const audioRef = useRef<RacingAudio | null>(null);
  const soundEnabled = useGameStore((s) => s.soundEnabled);

  // Get or create the audio instance
  const getAudio = useCallback((): RacingAudio => {
    if (!audioRef.current) {
      audioRef.current = new RacingAudio();
    }
    return audioRef.current;
  }, []);

  // Sync soundEnabled setting
  useEffect(() => {
    getAudio().setSfxEnabled(soundEnabled);
  }, [soundEnabled, getAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.destroy();
      audioRef.current = null;
    };
  }, []);

  const startEngine = useCallback(() => getAudio().startEngine(), [getAudio]);
  const stopEngine = useCallback(() => getAudio().stopEngine(), [getAudio]);
  const updateEngine = useCallback((speedNorm: number) => getAudio().updateEngine(speedNorm), [getAudio]);
  const playCoinCollect = useCallback(() => getAudio().playCoinCollect(), [getAudio]);
  const playItemCollect = useCallback(() => getAudio().playItemCollect(), [getAudio]);
  const playBoost = useCallback(() => getAudio().playBoost(), [getAudio]);
  const playCountdownBeep = useCallback((isGo: boolean) => getAudio().playCountdownBeep(isGo), [getAudio]);
  const playLapComplete = useCallback(() => getAudio().playLapComplete(), [getAudio]);
  const playRaceFinish = useCallback(() => getAudio().playRaceFinish(), [getAudio]);
  const playBananaHit = useCallback(() => getAudio().playBananaHit(), [getAudio]);
  const playShield = useCallback(() => getAudio().playShield(), [getAudio]);
  const playLightning = useCallback(() => getAudio().playLightning(), [getAudio]);

  return {
    startEngine,
    stopEngine,
    updateEngine,
    playCoinCollect,
    playItemCollect,
    playBoost,
    playCountdownBeep,
    playLapComplete,
    playRaceFinish,
    playBananaHit,
    playShield,
    playLightning,
  };
}
