/**
 * Entity exports for the GiiGames game engine
 */

// Stadium entities
export { TruckEntity, createTruckEntity } from './TruckEntity';
export type { TruckEntityConfig } from './TruckEntity';

export { StarCollectible, createStarCollectible } from './StarCollectible';
export type { StarCollectibleConfig } from './StarCollectible';

export { Obstacle, createObstacle } from './Obstacle';
export type { ObstacleConfig, ObstacleType } from './Obstacle';

export { Platform, createPlatform } from './Platform';
export type { PlatformConfig } from './Platform';

export { Ramp, createRamp } from './Ramp';
export type { RampConfig } from './Ramp';

// Race entities
export { RaceTruck, createRaceTruck } from './RaceTruck';
export type { RaceTruckConfig, RaceTruckState } from './RaceTruck';

export { Track, createTrack } from './Track';
export type { TrackConfig, TrackType } from './Track';

export { BoostPad, createBoostPad, createBoostPads } from './BoostPad';
export type { BoostPadConfig } from './BoostPad';
