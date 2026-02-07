'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DustTrailProps {
  positionRef: React.RefObject<THREE.Vector3>;
  speed: number;
  isActive: boolean;
  color?: string;
}

const PARTICLE_COUNT = 50;
const PARTICLE_LIFETIME = 1.5;

export function DustTrail({ positionRef, speed, isActive, color = '#8B7355' }: DustTrailProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    scales: Float32Array;
  } | null>(null);

  // Initialize particle data
  useMemo(() => {
    particlesRef.current = {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      velocities: new Float32Array(PARTICLE_COUNT * 3),
      lifetimes: new Float32Array(PARTICLE_COUNT),
      scales: new Float32Array(PARTICLE_COUNT),
    };

    // Initialize all particles as dead
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.lifetimes[i] = -1;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current || !particlesRef.current) return;

    const { positions, velocities, lifetimes, scales } = particlesRef.current;
    const spawnRate = isActive ? Math.min(speed * 0.5, 15) : 0;
    let spawned = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Update existing particles
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        // Apply velocity with drag
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;

        // Rising and spreading
        velocities[i3 + 1] += 2 * delta; // Rise
        velocities[i3] *= 0.98; // Drag
        velocities[i3 + 2] *= 0.98;

        // Scale grows then shrinks
        const lifeRatio = lifetimes[i] / PARTICLE_LIFETIME;
        scales[i] = lifeRatio < 0.3
          ? (1 - lifeRatio / 0.3) * 0.8
          : (1 - (1 - lifeRatio) / 0.7) * 0.8;

        // Update instance
        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scales[i] * (0.5 + speed * 0.02));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      // Spawn new particles
      else if (spawned < spawnRate * delta * 10 && isActive && speed > 1) {
        spawned++;
        lifetimes[i] = PARTICLE_LIFETIME * (0.7 + Math.random() * 0.3);

        // Spawn at wheel position with random offset
        const pos = positionRef.current;
        positions[i3] = pos.x + (Math.random() - 0.5) * 2;
        positions[i3 + 1] = pos.y + Math.random() * 0.5;
        positions[i3 + 2] = pos.z + (Math.random() - 0.5) * 2;

        // Random velocity - mostly outward and up
        velocities[i3] = (Math.random() - 0.5) * 3;
        velocities[i3 + 1] = Math.random() * 2 + 1;
        velocities[i3 + 2] = (Math.random() - 0.5) * 3;

        scales[i] = 0.3;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scales[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      // Dead particle - hide it
      else if (lifetimes[i] <= 0) {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default DustTrail;
