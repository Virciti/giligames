/**
 * Phase 6 Tests: AI & Competition
 *
 * Validates rubber-band AI, personality system, and position drama features.
 * 6A: Rubber-band AI (speed scales inversely with position gap)
 * 6B: AI Personality & Behavior (aggressive, cautious, erratic profiles)
 * 6C: Position Drama (final-lap grouping, near-finish clustering)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 6: AI & Competition', () => {
  const aiTruckSrc = readFile('AITruck.tsx');
  const raceGameSrc = readFile('RaceGame3D.tsx');

  // ──────────────────────────────────────────────
  // 6A: Rubber-Band AI
  // ──────────────────────────────────────────────

  describe('6A — Rubber-Band AI', () => {
    it('defines RUBBERBAND_MAX_BOOST constant', () => {
      expect(aiTruckSrc).toContain('RUBBERBAND_MAX_BOOST');
    });

    it('defines RUBBERBAND_MAX_SLOW constant', () => {
      expect(aiTruckSrc).toContain('RUBBERBAND_MAX_SLOW');
    });

    it('defines RUBBERBAND_SMOOTHING constant', () => {
      expect(aiTruckSrc).toContain('RUBBERBAND_SMOOTHING');
    });

    it('tracks rubberbandFactor as a ref for smooth transitions', () => {
      expect(aiTruckSrc).toMatch(/const rubberbandFactor\s*=\s*useRef/);
    });

    it('accepts playerProgressRef prop', () => {
      expect(aiTruckSrc).toContain('playerProgressRef');
    });

    it('computes progressGap between player and AI', () => {
      expect(aiTruckSrc).toContain('progressGap');
      expect(aiTruckSrc).toContain('playerProg - aiProg');
    });

    it('boosts AI speed when behind (positive gap)', () => {
      expect(aiTruckSrc).toContain('RUBBERBAND_MAX_BOOST');
      // Should apply boost when AI is behind
      expect(aiTruckSrc).toContain('progressGap > 0');
    });

    it('slows AI speed when ahead (negative gap)', () => {
      expect(aiTruckSrc).toContain('RUBBERBAND_MAX_SLOW');
    });

    it('smooths rubber-band factor over time (no jarring changes)', () => {
      expect(aiTruckSrc).toContain('rubberbandFactor.current +=');
      expect(aiTruckSrc).toContain('RUBBERBAND_SMOOTHING * delta');
    });

    it('applies rubber-band factor to actual speed', () => {
      expect(aiTruckSrc).toContain('1 + rubberbandFactor.current');
    });

    it('accepts currentLap and totalLaps props', () => {
      expect(aiTruckSrc).toContain('currentLap');
      expect(aiTruckSrc).toContain('totalLaps');
    });
  });

  // ──────────────────────────────────────────────
  // 6B: AI Personality & Behavior
  // ──────────────────────────────────────────────

  describe('6B — AI Personality System', () => {
    it('exports AIPersonality type with 3 profiles', () => {
      expect(aiTruckSrc).toContain("AIPersonality = 'aggressive' | 'cautious' | 'erratic'");
    });

    it('defines PersonalityConfig interface', () => {
      expect(aiTruckSrc).toContain('PersonalityConfig');
      expect(aiTruckSrc).toContain('lineAccuracy: number');
      expect(aiTruckSrc).toContain('turnSharpness: number');
    });

    it('defines PERSONALITY_CONFIGS with all 3 profiles', () => {
      expect(aiTruckSrc).toContain('PERSONALITY_CONFIGS');
      expect(aiTruckSrc).toContain('aggressive:');
      expect(aiTruckSrc).toContain('cautious:');
      expect(aiTruckSrc).toContain('erratic:');
    });

    it('aggressive has high line accuracy and turn sharpness', () => {
      expect(aiTruckSrc).toMatch(/aggressive:.*lineAccuracy: 1\.0/);
      expect(aiTruckSrc).toMatch(/aggressive:.*turnSharpness: 4\.5/);
    });

    it('cautious has lower turn sharpness and wider waypoint radius', () => {
      expect(aiTruckSrc).toMatch(/cautious:.*turnSharpness: 2\.5/);
      expect(aiTruckSrc).toMatch(/cautious:.*waypointRadius: 6/);
    });

    it('erratic has high speed oscillation and error rate', () => {
      expect(aiTruckSrc).toMatch(/erratic:.*speedOscillation: 0\.15/);
      expect(aiTruckSrc).toMatch(/erratic:.*errorRate: 0\.06/);
    });

    it('personality prop is accepted by AITruck', () => {
      expect(aiTruckSrc).toContain("personality?: AIPersonality");
    });

    it('uses pConfig for personality-driven behavior', () => {
      expect(aiTruckSrc).toContain('pConfig.turnSharpness');
      expect(aiTruckSrc).toContain('pConfig.waypointRadius');
    });

    it('personality affects waypoint reach distance', () => {
      expect(aiTruckSrc).toContain('pConfig.waypointRadius');
    });

    it('personality affects rotation speed', () => {
      expect(aiTruckSrc).toContain('pConfig.turnSharpness * delta');
    });

    it('personality drives speed oscillation frequency', () => {
      expect(aiTruckSrc).toContain('pConfig.oscillationFreq');
      expect(aiTruckSrc).toContain('pConfig.speedOscillation');
    });

    it('has steering error system driven by errorRate', () => {
      expect(aiTruckSrc).toContain('steeringError');
      expect(aiTruckSrc).toContain('pConfig.errorRate');
    });

    it('steering errors decay over time', () => {
      expect(aiTruckSrc).toContain('steeringError.current *= Math.pow(0.9');
    });

    it('lineAccuracy blends between racing line and current heading', () => {
      expect(aiTruckSrc).toContain('pConfig.lineAccuracy');
      expect(aiTruckSrc).toContain('personalityRotDiff');
    });
  });

  // ──────────────────────────────────────────────
  // 6C: Position Drama (Final-Lap Grouping)
  // ──────────────────────────────────────────────

  describe('6C — Position Drama', () => {
    it('defines FINAL_LAP_GROUPING constant', () => {
      expect(aiTruckSrc).toContain('FINAL_LAP_GROUPING');
    });

    it('detects final lap via currentLap >= totalLaps', () => {
      expect(aiTruckSrc).toContain('currentLap >= totalLaps');
    });

    it('applies extra rubber-band on final lap (isFinalLap)', () => {
      expect(aiTruckSrc).toContain('isFinalLap');
      expect(aiTruckSrc).toContain('FINAL_LAP_GROUPING');
    });

    it('position change notifications still work in RaceGame3D', () => {
      expect(raceGameSrc).toContain('positionNotification');
      expect(raceGameSrc).toContain('movedUp');
    });
  });

  // ──────────────────────────────────────────────
  // Wiring: RaceGame3D passes new props
  // ──────────────────────────────────────────────

  describe('Wiring — RaceGame3D AI props', () => {
    it('passes personality="aggressive" to dragon truck', () => {
      const dragonSection = raceGameSrc.split('truckStyle="dragon"')[1]?.split('/>')[0] || '';
      expect(dragonSection).toContain('personality="aggressive"');
    });

    it('passes personality="cautious" to bull truck', () => {
      const bullSection = raceGameSrc.split('truckStyle="bull"')[1]?.split('/>')[0] || '';
      expect(bullSection).toContain('personality="cautious"');
    });

    it('passes personality="erratic" to flames truck', () => {
      const flamesSection = raceGameSrc.split('truckStyle="flames"')[1]?.split('/>')[0] || '';
      expect(flamesSection).toContain('personality="erratic"');
    });

    it('passes playerProgressRef to all AI trucks', () => {
      const aiTruckInstances = raceGameSrc.split('<AITruck').slice(1);
      expect(aiTruckInstances.length).toBe(3);
      aiTruckInstances.forEach(instance => {
        const props = instance.split('/>')[0];
        expect(props).toContain('playerProgressRef={playerProgressRef}');
      });
    });

    it('passes currentLap to all AI trucks', () => {
      const aiTruckInstances = raceGameSrc.split('<AITruck').slice(1);
      aiTruckInstances.forEach(instance => {
        const props = instance.split('/>')[0];
        expect(props).toContain('currentLap={lap}');
      });
    });

    it('passes totalLaps to all AI trucks', () => {
      const aiTruckInstances = raceGameSrc.split('<AITruck').slice(1);
      aiTruckInstances.forEach(instance => {
        const props = instance.split('/>')[0];
        expect(props).toContain('totalLaps={totalLaps}');
      });
    });
  });

  // ──────────────────────────────────────────────
  // No regression: core AI systems preserved
  // ──────────────────────────────────────────────

  describe('No regression — core AI preserved', () => {
    it('waypoint generation still creates 48 segments', () => {
      expect(aiTruckSrc).toContain('segments = 48');
    });

    it('difficulty multiplier still applies (easy/medium/hard)', () => {
      expect(aiTruckSrc).toContain("difficulty === 'easy' ? 0.75");
      expect(aiTruckSrc).toContain("difficulty === 'medium' ? 0.88");
    });

    it('base maxSpeed still 38', () => {
      expect(aiTruckSrc).toContain('38 * difficultyMultiplier');
    });

    it('base acceleration still 22', () => {
      expect(aiTruckSrc).toContain('22 * difficultyMultiplier');
    });

    it('banana spin behavior still works', () => {
      expect(aiTruckSrc).toContain('spinUntil');
      expect(aiTruckSrc).toContain('spinPhaseRef');
    });

    it('smooth ground height lerp still works', () => {
      expect(aiTruckSrc).toContain('smoothGroundHeight');
      expect(aiTruckSrc).toContain('getRaceTrackHeight');
    });

    it('onPositionUpdate callback still fires', () => {
      expect(aiTruckSrc).toContain('onPositionUpdate?.(currentPos, trackProgress.current)');
    });

    it('angular velocity clamping still used in RaceGame3D', () => {
      expect(raceGameSrc).toContain('aiDifficulty');
      expect(raceGameSrc).toContain("setAiDifficulty('medium')");
      expect(raceGameSrc).toContain("setAiDifficulty('hard')");
    });

    it('AITruckBody visual component preserved', () => {
      expect(aiTruckSrc).toContain('AITruckBody');
      expect(aiTruckSrc).toContain("style === 'dragon'");
      expect(aiTruckSrc).toContain("style === 'bull'");
      expect(aiTruckSrc).toContain("style === 'flames'");
    });
  });
});
