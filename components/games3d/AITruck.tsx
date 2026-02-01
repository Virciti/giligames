'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// Import the visual components from MonsterTruck
const BODY_WIDTH = 2.4;
const BODY_HEIGHT = 1.2;
const BODY_LENGTH = 4.0;
const WHEEL_RADIUS = 1.2;
const SUSPENSION_HEIGHT = 1.0;

interface AITruckProps {
  startPosition: [number, number, number];
  color: string;
  truckStyle?: 'flames' | 'shark' | 'classic' | 'dragon' | 'stars' | 'bull';
  difficulty?: 'easy' | 'medium' | 'hard';
  trackLength?: number;
  trackWidth?: number;
  isRacing?: boolean;
  onPositionUpdate?: (pos: THREE.Vector3, progress: number) => void;
}

// Generate waypoints for oval track
function generateWaypoints(trackLength: number, trackWidth: number) {
  const points: THREE.Vector3[] = [];
  const segments = 32;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * trackLength;
    const z = Math.sin(angle) * trackWidth;
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
  trackLength = 100,
  trackWidth = 60,
  isRacing = false,
  onPositionUpdate,
}: AITruckProps) {
  const chassisRef = useRef<RapierRigidBody>(null);
  const currentWaypoint = useRef(0);
  const currentSpeed = useRef(0);
  const currentRotation = useRef(0);
  const trackProgress = useRef(0);

  // AI difficulty settings
  const speedMultiplier = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 0.85 : 1.0;
  const maxSpeed = 18 * speedMultiplier;
  const acceleration = 10 * speedMultiplier;

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

    // Check if we've reached the waypoint
    if (distanceToWaypoint < 5) {
      currentWaypoint.current = (currentWaypoint.current + 1) % waypoints.length;
      trackProgress.current = currentWaypoint.current / waypoints.length;
    }

    // Calculate desired rotation
    const targetRotation = Math.atan2(direction.x, direction.z);

    // Smooth rotation towards target
    let rotationDiff = targetRotation - currentRotation.current;
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

    currentRotation.current += rotationDiff * 3 * delta;

    // Accelerate towards max speed
    currentSpeed.current = Math.min(maxSpeed, currentSpeed.current + acceleration * delta);

    // Add some randomness to make racing more interesting
    const speedVariation = 0.9 + Math.sin(state.clock.elapsedTime * 2 + startPosition[0]) * 0.1;
    const actualSpeed = currentSpeed.current * speedVariation;

    // Calculate movement
    const moveX = Math.sin(currentRotation.current) * actualSpeed * delta;
    const moveZ = Math.cos(currentRotation.current) * actualSpeed * delta;

    const newX = pos.x + moveX;
    const newZ = pos.z + moveZ;

    // Apply position
    chassis.setTranslation({ x: newX, y: WHEEL_RADIUS + 0.5, z: newZ }, true);
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
