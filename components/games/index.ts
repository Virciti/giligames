/**
 * Game Components for GiiGames
 *
 * Canvas-based game components with React wrappers,
 * touch controls, HUD overlays, and game state management.
 */

// Stadium Game Components
export { StadiumCanvas } from './StadiumCanvas';
export type { StadiumCanvasProps, StadiumSceneCallbacks } from './StadiumCanvas';

export { StadiumControls } from './StadiumControls';
export type { StadiumControlsProps } from './StadiumControls';

export { StadiumHUD } from './StadiumHUD';
export type { StadiumHUDProps, ChallengeObjective } from './StadiumHUD';

export { StadiumGame } from './StadiumGame';
export type { StadiumGameProps } from './StadiumGame';

// Race Game Components
export { RaceCanvas } from './RaceCanvas';
export { RaceControls } from './RaceControls';
export { RaceHUD } from './RaceHUD';
export { TrophyCeremony } from './TrophyCeremony';
export { RaceGame } from './RaceGame';
