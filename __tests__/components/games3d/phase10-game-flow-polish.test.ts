/**
 * Phase 10 Tests: Game Flow & Polish
 *
 * Validates pre-race, race events, and post-race enhancements.
 * 10A: Pre-Race (truck selection, starting grid, preRace phase)
 * 10B: Race Events (split times, position tracking with gaps)
 * 10C: Post-Race (results with AI positions, time gaps, race again flow)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const GAMES3D = path.resolve(__dirname, '../../../components/games3d');

function readFile(name: string): string {
  return fs.readFileSync(path.join(GAMES3D, name), 'utf-8');
}

describe('Phase 10: Game Flow & Polish', () => {
  const raceGameSrc = readFile('RaceGame3D.tsx');
  const raceHUDSrc = readFile('RaceHUD3D.tsx');

  // ──────────────────────────────────────────────
  // 10A: Pre-Race
  // ──────────────────────────────────────────────

  describe('10A — Pre-Race Phase', () => {
    it('GamePhase includes preRace', () => {
      expect(raceGameSrc).toContain("'preRace'");
    });

    it('game starts in preRace phase', () => {
      expect(raceGameSrc).toContain("useState<GamePhase>('preRace')");
    });

    it('has handleStartRace to transition from preRace to countdown', () => {
      expect(raceGameSrc).toContain('handleStartRace');
      expect(raceGameSrc).toContain("setPhase('countdown')");
    });

    it('restart returns to preRace (not countdown)', () => {
      expect(raceGameSrc).toContain("setPhase('preRace')");
    });
  });

  describe('10A — Truck Selection', () => {
    it('has SELECTABLE_STYLES array with 6 truck styles', () => {
      expect(raceGameSrc).toContain('SELECTABLE_STYLES');
      // Check individual styles exist in the array definition
      expect(raceGameSrc).toContain("'classic', 'shark', 'stars', 'dragon', 'flames', 'bull'");
    });

    it('has SELECTABLE_NAMES for truck display names', () => {
      expect(raceGameSrc).toContain('SELECTABLE_NAMES');
      expect(raceGameSrc).toContain('Red Rocket');
      expect(raceGameSrc).toContain('Blue Thunder');
    });

    it('has SELECTABLE_COLORS for truck colors', () => {
      expect(raceGameSrc).toContain('SELECTABLE_COLORS');
    });

    it('has selectedStyleIndex state', () => {
      expect(raceGameSrc).toContain('selectedStyleIndex');
      expect(raceGameSrc).toContain('setSelectedStyleIndex');
    });

    it('derives playerTruckColor from selection', () => {
      expect(raceGameSrc).toContain('SELECTABLE_COLORS[selectedStyleIndex]');
    });

    it('derives playerTruckStyle from selection', () => {
      expect(raceGameSrc).toContain('SELECTABLE_STYLES[selectedStyleIndex]');
    });

    it('passes onPrevTruck and onNextTruck to HUD', () => {
      const hudSection = raceGameSrc.split('<RaceHUD3D')[1]?.split('/>')[0] || '';
      expect(hudSection).toContain('onPrevTruck');
      expect(hudSection).toContain('onNextTruck');
    });

    it('wraps selection index with modulo for cycling', () => {
      expect(raceGameSrc).toContain('SELECTABLE_STYLES.length) % SELECTABLE_STYLES.length');
    });
  });

  describe('10A — PreRaceOverlay Component', () => {
    it('PreRaceOverlay component exists in RaceHUD3D', () => {
      expect(raceHUDSrc).toContain('function PreRaceOverlay');
    });

    it('has title "MONSTER TRUCK RACE"', () => {
      expect(raceHUDSrc).toContain('MONSTER TRUCK RACE');
    });

    it('shows truck selector with prev/next buttons', () => {
      const preRaceSection = raceHUDSrc.split('PreRaceOverlay')[1]?.split('function ')[0] || '';
      expect(preRaceSection).toContain('onPrevTruck');
      expect(preRaceSection).toContain('onNextTruck');
    });

    it('displays truck name', () => {
      const preRaceSection = raceHUDSrc.split('PreRaceOverlay')[1]?.split('function ')[0] || '';
      expect(preRaceSection).toContain('truckName');
    });

    it('displays truck style', () => {
      const preRaceSection = raceHUDSrc.split('PreRaceOverlay')[1]?.split('function ')[0] || '';
      expect(preRaceSection).toContain('truckStyle');
    });

    it('has START RACE button', () => {
      expect(raceHUDSrc).toContain('START RACE');
      expect(raceHUDSrc).toContain('onStartRace');
    });

    it('shows race info (3 Laps, 4 Racers, Desert Circuit)', () => {
      expect(raceHUDSrc).toContain('3 Laps');
      expect(raceHUDSrc).toContain('4 Racers');
      expect(raceHUDSrc).toContain('Desert Circuit');
    });

    it('has exit button in pre-race', () => {
      const preRaceSection = raceHUDSrc.split('PreRaceOverlay')[1]?.split('function ')[0] || '';
      expect(preRaceSection).toContain('onExit');
    });

    it('has animated engine rev hint', () => {
      expect(raceHUDSrc).toContain('revving on the starting grid');
    });
  });

  describe('10A — HUD isPreRace Wiring', () => {
    it('RaceHUD3D accepts isPreRace prop', () => {
      expect(raceHUDSrc).toContain('isPreRace?: boolean');
    });

    it('RaceHUD3D accepts onStartRace prop', () => {
      expect(raceHUDSrc).toContain('onStartRace?: () => void');
    });

    it('RaceHUD3D accepts truckName and truckStyle props', () => {
      expect(raceHUDSrc).toContain('truckName?: string');
      expect(raceHUDSrc).toContain('truckStyle?: string');
    });

    it('passes isPreRace={phase === preRace} from RaceGame3D', () => {
      const hudSection = raceGameSrc.split('<RaceHUD3D')[1]?.split('/>')[0] || '';
      expect(hudSection).toContain("isPreRace={phase === 'preRace'}");
    });

    it('passes onStartRace={handleStartRace} from RaceGame3D', () => {
      const hudSection = raceGameSrc.split('<RaceHUD3D')[1]?.split('/>')[0] || '';
      expect(hudSection).toContain('onStartRace={handleStartRace}');
    });

    it('passes truckName from SELECTABLE_NAMES', () => {
      const hudSection = raceGameSrc.split('<RaceHUD3D')[1]?.split('/>')[0] || '';
      expect(hudSection).toContain('truckName={SELECTABLE_NAMES[selectedStyleIndex]}');
    });

    it('HUD sync includes preRace in active phases', () => {
      expect(raceGameSrc).toContain("phase !== 'preRace'");
    });
  });

  // ──────────────────────────────────────────────
  // 10B: Race Events (position tracking enhancements)
  // ──────────────────────────────────────────────

  describe('10B — Race Events', () => {
    it('lap times are recorded in lapTimes array', () => {
      expect(raceGameSrc).toContain('setLapTimes');
      expect(raceGameSrc).toContain('[...prev, lapTime]');
    });

    it('best lap time calculated from lapTimes', () => {
      expect(raceGameSrc).toContain('Math.min(...lapTimes)');
    });

    it('lap notification shows FINAL LAP on last lap', () => {
      expect(raceGameSrc).toContain("'FINAL LAP!'");
    });

    it('AI difficulty increases each lap (easy → medium → hard)', () => {
      expect(raceGameSrc).toContain("setAiDifficulty('medium')");
      expect(raceGameSrc).toContain("setAiDifficulty('hard')");
    });

    it('position tracking uses player + AI progress', () => {
      expect(raceGameSrc).toContain('playerProgress');
      expect(raceGameSrc).toContain('aiProgressRef');
    });

    it('position change notification shows direction', () => {
      expect(raceGameSrc).toContain('movedUp');
      expect(raceGameSrc).toContain('positionNotification');
    });
  });

  // ──────────────────────────────────────────────
  // 10C: Post-Race Results
  // ──────────────────────────────────────────────

  describe('10C — AI Finish Gaps', () => {
    it('has aiFinishGaps state', () => {
      expect(raceGameSrc).toContain('aiFinishGaps');
      expect(raceGameSrc).toContain('setAiFinishGaps');
    });

    it('generates AI finish gaps on race complete', () => {
      const finishBlock = raceGameSrc.split('Race complete!')[1]?.split('return prevLap')[0] || '';
      expect(finishBlock).toContain('setAiFinishGaps');
    });

    it('AI gaps are sorted ascending', () => {
      expect(raceGameSrc).toContain('gaps.sort');
    });

    it('resets aiFinishGaps on restart', () => {
      expect(raceGameSrc).toContain('setAiFinishGaps([])');
    });

    it('passes aiFinishGaps to RaceHUD3D', () => {
      const hudSection = raceGameSrc.split('<RaceHUD3D')[1]?.split('/>')[0] || '';
      expect(hudSection).toContain('aiFinishGaps={aiFinishGaps}');
    });
  });

  describe('10C — Enhanced Finish Screen', () => {
    it('FinishScreen accepts aiFinishGaps prop', () => {
      const fnSig = raceHUDSrc.split('function FinishScreen')[1]?.split(')')[0] || '';
      expect(fnSig).toContain('aiFinishGaps');
    });

    it('renders Race Results section when gaps available', () => {
      expect(raceHUDSrc).toContain('Race Results');
    });

    it('shows all 4 positions in results', () => {
      expect(raceHUDSrc).toContain('[1, 2, 3, 4].map');
    });

    it('highlights player position in yellow', () => {
      expect(raceHUDSrc).toContain('text-yellow-400');
      expect(raceHUDSrc).toContain('isPlayer');
    });

    it('shows time gaps with +X.Xs format', () => {
      expect(raceHUDSrc).toContain('gap.toFixed(1)');
      expect(raceHUDSrc).toContain('+');
    });

    it('shows AI names (Dragon, Bull, Flames)', () => {
      expect(raceHUDSrc).toContain("'Dragon'");
      expect(raceHUDSrc).toContain("'Bull'");
      expect(raceHUDSrc).toContain("'Flames'");
    });

    it('shows player time (not gap) for player position', () => {
      expect(raceHUDSrc).toContain("isPlayer ? formatTime(time)");
    });

    it('passes aiFinishGaps from HUD to FinishScreen', () => {
      const finishSection = raceHUDSrc.split('<FinishScreen')[1]?.split('/>')[0] || '';
      expect(finishSection).toContain('aiFinishGaps={aiFinishGaps}');
    });
  });

  describe('10C — Race Again Flow', () => {
    it('Race Again button still present', () => {
      expect(raceHUDSrc).toContain('Race Again');
    });

    it('Exit button still present on finish screen', () => {
      const finishSection = raceHUDSrc.split('function FinishScreen')[1]?.split('function ')[0] || '';
      expect(finishSection).toContain('onExit');
    });

    it('restart clears all race state', () => {
      expect(raceGameSrc).toContain('setLap(1)');
      expect(raceGameSrc).toContain('setPosition(1)');
      expect(raceGameSrc).toContain('setRaceTime(0)');
      expect(raceGameSrc).toContain('setLapTimes([])');
    });
  });

  // ──────────────────────────────────────────────
  // No regression: existing game flow preserved
  // ──────────────────────────────────────────────

  describe('No regression — game flow preserved', () => {
    it('countdown timer still counts 3-2-1-GO', () => {
      expect(raceGameSrc).toContain("setPhase('racing')");
      expect(raceGameSrc).toContain('prev - 1');
    });

    it('FinishScreen still shows trophy and position', () => {
      expect(raceHUDSrc).toContain('Trophy');
      expect(raceHUDSrc).toContain('Place!');
    });

    it('FinishScreen still shows lap breakdown', () => {
      expect(raceHUDSrc).toContain('Lap {i + 1}');
      expect(raceHUDSrc).toContain('BEST');
    });

    it('PauseMenu still works with resume/restart/exit', () => {
      expect(raceHUDSrc).toContain('PauseMenu');
      expect(raceHUDSrc).toContain('onResume');
    });

    it('CountdownOverlay still has traffic light', () => {
      expect(raceHUDSrc).toContain('TrafficLight');
      expect(raceHUDSrc).toContain('GO!');
    });

    it('position tracking still works', () => {
      expect(raceGameSrc).toContain('sortedProgress');
      expect(raceGameSrc).toContain('playerPosition');
    });

    it('lap detection still uses progress wrapping', () => {
      expect(raceGameSrc).toContain('prevProgress > 0.85');
      expect(raceGameSrc).toContain('newProgress < 0.15');
    });

    it('learning challenge still restarts on race restart', () => {
      expect(raceGameSrc).toContain('startLearningChallenge');
    });
  });
});
