/**
 * Phase 8 Tests: Visual Juice & Audio
 *
 * Validates audio overhaul, screen effects, and RaceGame3D wiring.
 * 8A: Particle Polish (confetti, fireworks — future; brake smoke detection)
 * 8B: Screen Effects (hit flash white vignette on collision)
 * 8C: Audio Overhaul (RaceSFX new props, engine volume, tire screech, item pickup, crowd cheer)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 8: Visual Juice & Audio', () => {
  const raceSFXSrc = readFile('RaceSFX.tsx');
  const raceGameSrc = readFile('RaceGame3D.tsx');

  // ──────────────────────────────────────────────
  // 8C: Audio Overhaul — RaceSFX Component
  // ──────────────────────────────────────────────

  describe('8C — RaceSFX New Props', () => {
    it('accepts isDrifting prop', () => {
      expect(raceSFXSrc).toContain('isDrifting?: boolean');
    });

    it('accepts isBraking prop', () => {
      expect(raceSFXSrc).toContain('isBraking?: boolean');
    });

    it('accepts surfaceType prop', () => {
      expect(raceSFXSrc).toContain('surfaceType?: string');
    });

    it('accepts isFinalLap prop', () => {
      expect(raceSFXSrc).toContain('isFinalLap?: boolean');
    });

    it('accepts itemPickupTrigger prop', () => {
      expect(raceSFXSrc).toContain('itemPickupTrigger?: number');
    });

    it('accepts crowdCheerTrigger prop', () => {
      expect(raceSFXSrc).toContain('crowdCheerTrigger?: number');
    });
  });

  describe('8C — Engine Volume Boost', () => {
    it('engine volume range starts at 0.15 (up from 0.04)', () => {
      expect(raceSFXSrc).toContain('0.15 + normSpeed * 0.15');
    });

    it('engine uses sawtooth waveform', () => {
      const engineSection = raceSFXSrc.split('Engine hum')[1]?.split('Boost whine')[0] || '';
      expect(engineSection).toContain("osc.type = 'sawtooth'");
    });

    it('engine has low-pass filter for muffled tone', () => {
      const engineSection = raceSFXSrc.split('Engine hum')[1]?.split('Boost whine')[0] || '';
      expect(engineSection).toContain("filter.type = 'lowpass'");
    });
  });

  describe('8C — Final Lap Tempo Boost', () => {
    it('uses isFinalLap to boost engine tempo', () => {
      expect(raceSFXSrc).toContain('isFinalLap ? 1.15 : 1.0');
    });

    it('applies tempo multiplier to engine frequency', () => {
      expect(raceSFXSrc).toContain('tempoMult');
    });
  });

  describe('8C — Tire Screech Synthesis', () => {
    it('has screechOscRef and screechGainRef', () => {
      expect(raceSFXSrc).toContain('screechOscRef');
      expect(raceSFXSrc).toContain('screechGainRef');
    });

    it('activates screech on drift or braking above speed 10', () => {
      expect(raceSFXSrc).toContain('isDrifting || isBraking');
      expect(raceSFXSrc).toContain('speed > 10');
    });

    it('uses sawtooth oscillator for screech', () => {
      const screechSection = raceSFXSrc.split('Tire screech')[1]?.split('One-shot')[0] || '';
      expect(screechSection).toContain("osc.type = 'sawtooth'");
    });

    it('uses bandpass filter for tire screech character', () => {
      const screechSection = raceSFXSrc.split('Tire screech')[1]?.split('One-shot')[0] || '';
      expect(screechSection).toContain("filter.type = 'bandpass'");
    });

    it('surface-dependent screech pitch (dirt=800, oil=600, road=1200)', () => {
      expect(raceSFXSrc).toContain("surfaceType === 'dirt' ? 800");
      expect(raceSFXSrc).toContain("surfaceType === 'oil-slick' ? 600");
    });

    it('drift screech is louder than braking screech', () => {
      expect(raceSFXSrc).toContain('isDrifting ? 0.08 : 0.05');
    });
  });

  describe('8C — Item Pickup Jingle', () => {
    it('has item pickup one-shot effect', () => {
      expect(raceSFXSrc).toContain('item pickup jingle');
    });

    it('uses ascending A5-C#6-E6 triad', () => {
      expect(raceSFXSrc).toContain('880, 1109, 1319');
    });

    it('fires on itemPickupTrigger change', () => {
      expect(raceSFXSrc).toContain('itemPickupTrigger');
      const effectSection = raceSFXSrc.split('item pickup')[1]?.split('useEffect')[0] || '';
      expect(effectSection).toContain('itemPickupTrigger');
    });
  });

  describe('8C — Crowd Cheer', () => {
    it('has crowd cheer one-shot effect', () => {
      expect(raceSFXSrc).toContain('crowd cheer');
    });

    it('uses multiple detuned sawtooth oscillators', () => {
      const cheerSection = raceSFXSrc.split('crowd cheer')[1]?.split('Cleanup')[0] || '';
      expect(cheerSection).toContain("osc.type = 'sawtooth'");
      expect(cheerSection).toContain('Math.random()');
    });

    it('fires on crowdCheerTrigger change', () => {
      expect(raceSFXSrc).toContain('crowdCheerTrigger');
    });
  });

  describe('8C — Audio Cleanup', () => {
    it('stops screech oscillator on unmount', () => {
      const cleanupSection = raceSFXSrc.split('Cleanup on unmount')[1] || '';
      expect(cleanupSection).toContain('screechOscRef.current?.stop()');
    });

    it('stops engine oscillator on unmount', () => {
      const cleanupSection = raceSFXSrc.split('Cleanup on unmount')[1] || '';
      expect(cleanupSection).toContain('engineOscRef.current?.stop()');
    });

    it('stops boost oscillator on unmount', () => {
      const cleanupSection = raceSFXSrc.split('Cleanup on unmount')[1] || '';
      expect(cleanupSection).toContain('boostOscRef.current?.stop()');
    });

    it('closes AudioContext on unmount', () => {
      const cleanupSection = raceSFXSrc.split('Cleanup on unmount')[1] || '';
      expect(cleanupSection).toContain('ctxRef.current?.close()');
    });
  });

  // ──────────────────────────────────────────────
  // 8B: Screen Effects — Hit Flash
  // ──────────────────────────────────────────────

  describe('8B — Hit Flash Screen Effect', () => {
    it('has hitFlash state in RaceGame3D', () => {
      expect(raceGameSrc).toContain('hitFlash');
      expect(raceGameSrc).toContain('setHitFlash');
    });

    it('hitFlash activates on truck collision', () => {
      // hitFlash should be set in the same block as collision detection
      const collisionBlock = raceGameSrc.split('TRUCK-TRUCK COLLISION')[1]?.split('return')[0] || '';
      expect(collisionBlock).toContain('setHitFlash(true)');
    });

    it('hitFlash clears after 500ms with collision slowdown', () => {
      expect(raceGameSrc).toContain('setHitFlash(false)');
    });

    it('renders white vignette overlay when hitFlash is true', () => {
      expect(raceGameSrc).toContain('Hit flash white vignette');
      expect(raceGameSrc).toContain('radial-gradient');
      expect(raceGameSrc).toContain('rgba(255,255,255,0.6)');
    });

    it('hit flash overlay is pointer-events-none', () => {
      const flashSection = raceGameSrc.split('hitFlash &&')[1]?.split('/>')[0] || '';
      expect(flashSection).toContain('pointer-events-none');
    });

    it('hitFlash resets on game restart', () => {
      expect(raceGameSrc).toContain('setHitFlash(false)');
    });
  });

  // ──────────────────────────────────────────────
  // Wiring: RaceGame3D → RaceSFX new props
  // ──────────────────────────────────────────────

  describe('Wiring — RaceGame3D passes new RaceSFX props', () => {
    it('imports getRaceSurfaceType from Track3D', () => {
      expect(raceGameSrc).toContain("getRaceSurfaceType } from './Track3D'");
    });

    it('has sfxItemPickup state trigger', () => {
      expect(raceGameSrc).toContain('sfxItemPickup');
      expect(raceGameSrc).toContain('setSfxItemPickup');
    });

    it('has sfxCrowdCheer state trigger', () => {
      expect(raceGameSrc).toContain('sfxCrowdCheer');
      expect(raceGameSrc).toContain('setSfxCrowdCheer');
    });

    it('has hudSurfaceType state', () => {
      expect(raceGameSrc).toContain('hudSurfaceType');
      expect(raceGameSrc).toContain('setHudSurfaceType');
    });

    it('derives surfaceType from truck position in HUD sync', () => {
      const hudSync = raceGameSrc.split('Phase 8C: Derive surface type')[0] || '';
      expect(raceGameSrc).toContain('getRaceSurfaceType(truckPositionRef');
      expect(raceGameSrc).toContain('setHudSurfaceType(surface.type)');
    });

    it('passes isDrifting={hudDriftLevel > 0} to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('isDrifting={hudDriftLevel > 0}');
    });

    it('passes isBraking={inputState.brake} to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('isBraking={inputState.brake}');
    });

    it('passes surfaceType={hudSurfaceType} to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('surfaceType={hudSurfaceType}');
    });

    it('passes isFinalLap={lap >= totalLaps} to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('isFinalLap={lap >= totalLaps}');
    });

    it('passes itemPickupTrigger to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('itemPickupTrigger={sfxItemPickup}');
    });

    it('passes crowdCheerTrigger to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('crowdCheerTrigger={sfxCrowdCheer}');
    });

    it('fires sfxItemPickup on item collection', () => {
      const collectSection = raceGameSrc.split('handleItemCollect')[1]?.split('}, [')[0] || '';
      expect(collectSection).toContain('setSfxItemPickup');
    });

    it('fires sfxCrowdCheer on race finish', () => {
      const finishSection = raceGameSrc.split('Race complete!')[1]?.split('return')[0] || '';
      expect(finishSection).toContain('setSfxCrowdCheer');
    });

    it('resets new SFX triggers on restart', () => {
      expect(raceGameSrc).toContain('setSfxItemPickup(0)');
      expect(raceGameSrc).toContain('setSfxCrowdCheer(0)');
    });
  });

  // ──────────────────────────────────────────────
  // No regression: existing audio preserved
  // ──────────────────────────────────────────────

  describe('No regression — existing audio preserved', () => {
    it('engine oscillator still creates on isRacing', () => {
      expect(raceSFXSrc).toContain('Engine hum');
      expect(raceSFXSrc).toContain("osc.type = 'sawtooth'");
    });

    it('boost whine still layers higher pitch', () => {
      expect(raceSFXSrc).toContain('Boost whine');
      expect(raceSFXSrc).toContain('boostOscRef');
    });

    it('collision thud still fires on collisionTrigger', () => {
      expect(raceSFXSrc).toContain('collision thud');
      expect(raceSFXSrc).toContain('collisionTrigger');
    });

    it('banana slip descending whistle still works', () => {
      expect(raceSFXSrc).toContain('banana slip');
      expect(raceSFXSrc).toContain('slipTrigger');
    });

    it('lap complete arpeggio (C5, E5, G5) still fires', () => {
      expect(raceSFXSrc).toContain('523, 659, 784');
    });

    it('race finish fanfare (C5 E5 G5 C6) still fires', () => {
      expect(raceSFXSrc).toContain('523, 659, 784, 1047');
    });

    it('countdown beeps still work (440 Hz normal, 880 Hz GO)', () => {
      expect(raceSFXSrc).toContain('isGo ? 880 : 440');
    });

    it('existing collisionTrigger still passed to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('collisionTrigger={sfxCollision}');
    });

    it('existing slipTrigger still passed to RaceSFX', () => {
      const sfxSection = raceGameSrc.split('<RaceSFX')[1]?.split('/>')[0] || '';
      expect(sfxSection).toContain('slipTrigger={sfxSlip}');
    });

    it('camera shake trigger still works', () => {
      expect(raceGameSrc).toContain('shakeTrigger={sfxCollision + sfxSlip}');
    });
  });
});
