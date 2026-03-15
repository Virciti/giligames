'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DriftSparksProps {
  positionRef: React.RefObject<THREE.Vector3>;
  rotation: number;
  /** 0 = no drift, 1 = blue sparks, 2 = orange sparks, 3 = purple sparks (max charge) */
  driftLevel: number;
  isActive: boolean;
  speed: number;
}

const PARTICLE_COUNT = 80;
const PARTICLE_LIFETIME = 0.5;

// Drift spark color progression (like Mario Kart)
// Level 1: Blue sparks — just started drifting
// Level 2: Orange sparks — mid charge
// Level 3: Purple sparks — max charge, biggest mini-turbo
const DRIFT_COLORS: [number, number, number][] = [
  [0.58, 1.0, 0.8],   // Level 1: Blue (HSL)
  [0.08, 1.0, 0.6],   // Level 2: Orange
  [0.78, 1.0, 0.7],   // Level 3: Purple
];

export function DriftSparks({
  positionRef,
  rotation,
  driftLevel,
  isActive,
  speed: vehicleSpeed,
}: DriftSparksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
  } | null>(null);

  useMemo(() => {
    particlesRef.current = {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      velocities: new Float32Array(PARTICLE_COUNT * 3),
      lifetimes: new Float32Array(PARTICLE_COUNT),
    };
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.lifetimes[i] = -1;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !particlesRef.current) return;

    const { positions, velocities, lifetimes } = particlesRef.current;
    const clampedLevel = Math.max(0, Math.min(3, driftLevel));

    // Spawn rate scales with drift level — higher charge = more sparks
    const spawnRate = isActive && clampedLevel > 0 ? clampedLevel * 20 : 0;
    let spawned = 0;

    // Pick color based on drift charge level
    const [h, s, l] = clampedLevel > 0
      ? DRIFT_COLORS[clampedLevel - 1]
      : DRIFT_COLORS[0];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        // Apply velocity
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;

        // Gravity pull and air drag
        velocities[i3 + 1] -= 12 * delta; // Light gravity
        velocities[i3] *= 0.97;
        velocities[i3 + 2] *= 0.97;

        const lifeRatio = lifetimes[i] / PARTICLE_LIFETIME;

        // Flicker effect — sparks shimmer between bright and base color
        const flicker = Math.random() > 0.7 ? 0.3 : 0;
        color.setHSL(h, s, l + flicker);

        // Scale: start small, peak at 60% life, then fade
        const scale = lifeRatio > 0.6
          ? (1 - lifeRatio) / 0.4 * 0.35
          : lifeRatio / 0.6 * 0.35;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scale * (0.8 + clampedLevel * 0.2));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, color);
      } else if (spawned < spawnRate * delta * 10) {
        spawned++;
        lifetimes[i] = PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);

        // Spawn at rear wheel positions (left and right)
        const side = i % 2 === 0 ? -1 : 1;
        const rearOffset = -2.0;
        const sideOffset = 1.4;

        const pos = positionRef.current;
        const spawnX = pos.x
          + Math.sin(rotation) * rearOffset
          + Math.cos(rotation) * side * sideOffset;
        const spawnZ = pos.z
          + Math.cos(rotation) * rearOffset
          - Math.sin(rotation) * side * sideOffset;

        positions[i3] = spawnX + (Math.random() - 0.5) * 0.4;
        positions[i3 + 1] = pos.y - 0.5 + Math.random() * 0.3;
        positions[i3 + 2] = spawnZ + (Math.random() - 0.5) * 0.4;

        // Sparks fly outward and slightly upward from rear wheels
        const speedScale = 0.5 + Math.min(vehicleSpeed, 45) * 0.02;
        const sparkSpeed = (4 + Math.random() * 6) * speedScale;
        // Fly outward from truck center + backward
        velocities[i3] = (Math.cos(rotation) * side * sparkSpeed * 0.6)
          + (-Math.sin(rotation) * sparkSpeed * 0.4)
          + (Math.random() - 0.5) * 3;
        velocities[i3 + 1] = 1 + Math.random() * 3; // Pop upward
        velocities[i3 + 2] = (-Math.sin(rotation) * side * sparkSpeed * 0.6)
          + (-Math.cos(rotation) * sparkSpeed * 0.4)
          + (Math.random() - 0.5) * 3;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(0.15);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[0.4, 4, 4]} />
      <meshStandardMaterial
        color="#4488FF"
        emissive="#4488FF"
        emissiveIntensity={3}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default DriftSparks;
