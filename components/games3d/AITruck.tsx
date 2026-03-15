'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { getRaceTrackHeight } from './Track3D';

// Import the visual components from MonsterTruck
const BODY_WIDTH = 2.4;
const BODY_HEIGHT = 1.2;
const BODY_LENGTH = 4.0;
const WHEEL_RADIUS = 1.2;
const SUSPENSION_HEIGHT = 1.0;

// ── AI PERSONALITY SYSTEM ──
export type AIPersonality = 'aggressive' | 'cautious' | 'erratic';

interface PersonalityConfig {
  lineAccuracy: number;     // How tightly AI follows racing line (0–1)
  turnSharpness: number;    // Rotation speed multiplier
  speedOscillation: number; // Amplitude of speed wobble (0–0.2)
  oscillationFreq: number;  // Speed wobble frequency
  errorRate: number;        // Chance per second of a small "mistake" steering offset
  waypointRadius: number;   // Distance at which AI considers waypoint reached
}

const PERSONALITY_CONFIGS: Record<AIPersonality, PersonalityConfig> = {
  aggressive: { lineAccuracy: 1.0, turnSharpness: 4.5, speedOscillation: 0.05, oscillationFreq: 1.5, errorRate: 0.02, waypointRadius: 4 },
  cautious:   { lineAccuracy: 0.85, turnSharpness: 2.5, speedOscillation: 0.08, oscillationFreq: 1.0, errorRate: 0.005, waypointRadius: 6 },
  erratic:    { lineAccuracy: 0.9, turnSharpness: 3.5, speedOscillation: 0.15, oscillationFreq: 3.0, errorRate: 0.06, waypointRadius: 5 },
};

// ── RUBBER-BAND AI SYSTEM ──
// When AI is far behind, it speeds up; when far ahead, it slows down
const RUBBERBAND_MAX_BOOST = 0.15;   // Max +15% speed when behind
const RUBBERBAND_MAX_SLOW = 0.10;    // Max −10% speed when ahead
const RUBBERBAND_SMOOTHING = 2.0;    // Seconds to reach full rubber-band effect
// Final lap: all racers cluster together for dramatic finish
const FINAL_LAP_GROUPING = 0.08;     // Extra rubber-band strength on final lap

interface AITruckProps {
  startPosition: [number, number, number];
  color: string;
  truckStyle?: 'flames' | 'shark' | 'classic' | 'dragon' | 'stars' | 'bull';
  difficulty?: 'easy' | 'medium' | 'hard';
  personality?: AIPersonality;
  trackLength?: number;
  trackWidth?: number;
  isRacing?: boolean;
  onPositionUpdate?: (pos: THREE.Vector3, progress: number) => void;
  spinUntil?: number; // performance.now()/1000 timestamp - truck spins until this time
  speedMultiplier?: number; // User speed level multiplier (1-10 slider)
  /** Player's track progress ref (0–1) for rubber-band AI */
  playerProgressRef?: React.RefObject<number>;
  /** Current lap number (1-based) */
  currentLap?: number;
  /** Total laps in the race */
  totalLaps?: number;
}

// Generate waypoints matching the kid-friendly winding track from Track3D
function generateWaypoints(trackLength: number, trackWidth: number) {
  const points: THREE.Vector3[] = [];
  const segments = 48;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Match the kid-friendly winding track formula from Track3D
    let x = Math.cos(angle) * trackLength * 1.3;
    let z = Math.sin(angle) * trackWidth;
    x += Math.sin(angle * 2) * 25;
    z += Math.sin(angle * 3) * 15;
    points.push(new THREE.Vector3(x, WHEEL_RADIUS + 0.5, z));
  }

  return points;
}

// Simple AI truck body (simplified version without full detail for performance)
function AITruckBody({ color, style }: { color: string; style: string }) {
  const themeColors: Record<string, string> = {
    '#228B22': '#8B0000',
    '#FF4500': '#FFD700',
    '#32CD32': '#FF6600',
    '#9B59B6': '#FFD700',
  };
  const secondaryColor = themeColors[color] || '#FFD700';

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[BODY_WIDTH, BODY_HEIGHT, BODY_LENGTH]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Cab */}
      <mesh position={[0, 0.8, 0.5]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.9, 0.6, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.7, 1.3]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[BODY_WIDTH * 0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#1a3a5c" transparent opacity={0.7} />
      </mesh>

      {/* Wheels */}
      {[
        [-1.3, -0.5, 1.4], [1.3, -0.5, 1.4],
        [-1.3, -0.5, -1.1], [1.3, -0.5, -1.1]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.8, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}

      {/* Theme decorations based on style */}
      {style === 'dragon' && (
        <group>
          {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 1.3, 0.7]} rotation={[0.5, x * 0.5, 0]} castShadow>
              <coneGeometry args={[0.12, 0.6, 6]} />
              <meshStandardMaterial color="#8B0000" />
            </mesh>
          ))}
        </group>
      )}

      {style === 'bull' && (
        <group>
          {[-1, 1].map((side, i) => (
            <mesh key={i} position={[side * 0.7, 1.1, 0.6]} rotation={[0, 0, side * 0.8]} castShadow>
              <coneGeometry args={[0.08, 0.6, 8]} />
              <meshStandardMaterial color="#F5DEB3" />
            </mesh>
          ))}
        </group>
      )}

      {style === 'flames' && (
        <group>
          {[-1, 1].map((side, i) => (
            <group key={i} position={[side * 1.22, 0.3, 0.3]}>
              {[0, 0.4, 0.8].map((z, j) => (
                <mesh key={j} position={[0, 0, z - 0.4]} rotation={[0, side * Math.PI / 2, 0]}>
                  <coneGeometry args={[0.06, 0.25, 4]} />
                  <meshStandardMaterial color={j % 2 === 0 ? "#FF4500" : "#FFD700"} emissive={j % 2 === 0 ? "#FF2200" : "#FF8800"} emissiveIntensity={0.3} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* Racing stripe */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.02, BODY_LENGTH * 0.9]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.5} />
      </mesh>
    </group>
  );
}

export function AITruck({
  startPosition,
  color,
  truckStyle = 'classic',
  difficulty = 'medium',
  personality = 'cautious',
  trackLength = 100,
  trackWidth = 60,
  isRacing = false,
  onPositionUpdate,
  spinUntil = 0,
  speedMultiplier: userSpeedMultiplier = 1,
  playerProgressRef,
  currentLap = 1,
  totalLaps = 3,
}: AITruckProps) {
  const chassisRef = useRef<RapierRigidBody>(null);
  const currentWaypoint = useRef(0);
  const currentSpeed = useRef(0);
  const currentRotation = useRef(0);
  const trackProgress = useRef(0);
  const spinPhaseRef = useRef(0);
  const smoothGroundHeight = useRef(WHEEL_RADIUS + 0.5);
  // Rubber-band smoothing — avoids sudden speed jumps
  const rubberbandFactor = useRef(0);
  // Personality error — random steering offset that decays
  const steeringError = useRef(0);

  const pConfig = PERSONALITY_CONFIGS[personality];

  // AI difficulty settings - fast enough to race competitively
  const difficultyMultiplier = difficulty === 'easy' ? 0.75 : difficulty === 'medium' ? 0.88 : 1.0;
  const maxSpeed = 38 * difficultyMultiplier * userSpeedMultiplier;
  const acceleration = 22 * difficultyMultiplier * userSpeedMultiplier;

  // Generate track waypoints
  const waypoints = useMemo(
    () => generateWaypoints(trackLength, trackWidth),
    [trackLength, trackWidth]
  );

  // Find starting waypoint closest to start position
  useMemo(() => {
    let closestDist = Infinity;
    let closestIdx = 0;

    waypoints.forEach((wp, i) => {
      const dist = Math.sqrt(
        Math.pow(wp.x - startPosition[0], 2) +
        Math.pow(wp.z - startPosition[2], 2)
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    currentWaypoint.current = closestIdx;
  }, [waypoints, startPosition]);

  useFrame((state, delta) => {
    if (!chassisRef.current || !isRacing) return;

    const chassis = chassisRef.current;
    const pos = chassis.translation();
    const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Banana spin behavior - truck spins in circles when hit
    const nowSec = performance.now() / 1000;
    if (spinUntil > 0 && nowSec < spinUntil) {
      // Spin rapidly in place
      spinPhaseRef.current += 8 * delta;
      currentSpeed.current *= 0.9; // Slow down quickly

      chassis.setTranslation({ x: pos.x, y: getRaceTrackHeight(pos.x, pos.z) + WHEEL_RADIUS + 0.5, z: pos.z }, true);
      chassis.setRotation(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, spinPhaseRef.current, 0)),
        true
      );
      chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
      chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);

      onPositionUpdate?.(currentPos, trackProgress.current);
      return;
    }

    // Get current target waypoint
    const targetWp = waypoints[currentWaypoint.current];

    // Calculate direction to waypoint
    const direction = new THREE.Vector3(
      targetWp.x - pos.x,
      0,
      targetWp.z - pos.z
    );
    const distanceToWaypoint = direction.length();
    direction.normalize();

    // Check if we've reached the waypoint (personality-dependent radius)
    if (distanceToWaypoint < pConfig.waypointRadius) {
      currentWaypoint.current = (currentWaypoint.current + 1) % waypoints.length;
      trackProgress.current = currentWaypoint.current / waypoints.length;
    }

    // Calculate desired rotation
    const targetRotation = Math.atan2(direction.x, direction.z);

    // Smooth rotation towards target — personality controls turn sharpness
    let rotationDiff = targetRotation - currentRotation.current;
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

    // Personality error: random steering mistakes (scaled by errorRate)
    if (Math.random() < pConfig.errorRate * delta * 60) {
      steeringError.current = (Math.random() - 0.5) * 0.3;
    }
    steeringError.current *= Math.pow(0.9, delta * 60); // Decay error quickly
    const personalityRotDiff = rotationDiff * pConfig.lineAccuracy + steeringError.current;

    currentRotation.current += personalityRotDiff * pConfig.turnSharpness * delta;

    // Accelerate towards max speed
    currentSpeed.current = Math.min(maxSpeed, currentSpeed.current + acceleration * delta);

    // ── RUBBER-BAND AI ──
    // Compare AI progress to player progress and adjust speed
    let rubberbandTarget = 0;
    if (playerProgressRef) {
      const playerProg = (playerProgressRef.current ?? 0);
      const aiProg = trackProgress.current;
      const progressGap = playerProg - aiProg; // positive = AI behind player

      if (progressGap > 0) {
        // AI is behind — boost speed (up to RUBBERBAND_MAX_BOOST)
        rubberbandTarget = Math.min(progressGap * 2, RUBBERBAND_MAX_BOOST);
      } else {
        // AI is ahead — slow down (up to RUBBERBAND_MAX_SLOW)
        rubberbandTarget = Math.max(progressGap * 2, -RUBBERBAND_MAX_SLOW);
      }

      // Final lap grouping — stronger rubber-band to create drama
      const isFinalLap = currentLap >= totalLaps;
      if (isFinalLap) {
        rubberbandTarget += Math.sign(progressGap) * FINAL_LAP_GROUPING;
      }
    }
    // Smooth the rubber-band factor to avoid jarring speed changes
    rubberbandFactor.current += (rubberbandTarget - rubberbandFactor.current) * Math.min(1, RUBBERBAND_SMOOTHING * delta);

    // Personality-driven speed oscillation (replaces old hardcoded ±10%)
    const speedVariation = 1.0 + Math.sin(state.clock.elapsedTime * pConfig.oscillationFreq + startPosition[0]) * pConfig.speedOscillation;
    const actualSpeed = currentSpeed.current * speedVariation * (1 + rubberbandFactor.current);

    // Calculate movement
    const moveX = Math.sin(currentRotation.current) * actualSpeed * delta;
    const moveZ = Math.cos(currentRotation.current) * actualSpeed * delta;

    const newX = pos.x + moveX;
    const newZ = pos.z + moveZ;

    // Smooth ground height lerp — prevents AI truck vertical jitter
    const targetY = getRaceTrackHeight(newX, newZ) + WHEEL_RADIUS + 0.5;
    smoothGroundHeight.current = THREE.MathUtils.lerp(
      smoothGroundHeight.current,
      targetY,
      Math.min(1, 4 * delta)
    );

    // Apply position
    chassis.setTranslation({ x: newX, y: smoothGroundHeight.current, z: newZ }, true);
    chassis.setRotation(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, currentRotation.current, 0)),
      true
    );

    chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Report position
    onPositionUpdate?.(currentPos, trackProgress.current);
  });

  return (
    <RigidBody
      ref={chassisRef}
      position={startPosition}
      colliders={false}
      type="kinematicPosition"
      gravityScale={0}
    >
      <CuboidCollider
        args={[BODY_WIDTH / 2, BODY_HEIGHT / 2, BODY_LENGTH / 2]}
        position={[0, SUSPENSION_HEIGHT + BODY_HEIGHT / 2, 0]}
      />

      <group position={[0, SUSPENSION_HEIGHT + BODY_HEIGHT / 2, 0]}>
        <AITruckBody color={color} style={truckStyle} />
      </group>
    </RigidBody>
  );
}

export default AITruck;
