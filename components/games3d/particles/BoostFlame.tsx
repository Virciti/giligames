'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoostFlameProps {
  positionRef: React.RefObject<THREE.Vector3>;
  rotation: number;
  isActive: boolean;
  intensity?: number;
}

const PARTICLE_COUNT = 50;
const PARTICLE_LIFETIME = 0.4;

export function BoostFlame({
  positionRef,
  rotation,
  isActive,
  intensity = 1
}: BoostFlameProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    colors: Float32Array;
  } | null>(null);

  useMemo(() => {
    particlesRef.current = {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      velocities: new Float32Array(PARTICLE_COUNT * 3),
      lifetimes: new Float32Array(PARTICLE_COUNT),
      colors: new Float32Array(PARTICLE_COUNT * 3),
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.lifetimes[i] = -1;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!meshRef.current || !particlesRef.current) return;

    const { positions, velocities, lifetimes, colors } = particlesRef.current;

    // Spawn rate based on intensity
    const spawnRate = isActive ? intensity * 30 : 0;
    let spawned = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        // Apply velocity
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;

        // Slow down
        velocities[i3] *= 0.95;
        velocities[i3 + 1] *= 0.95;
        velocities[i3 + 2] *= 0.95;

        // Scale based on lifetime
        const lifeRatio = lifetimes[i] / PARTICLE_LIFETIME;
        const scale = lifeRatio * 0.5 * intensity;

        // Color gradient from white/yellow to orange to red
        if (lifeRatio > 0.7) {
          color.setHSL(0.15, 1, 0.9); // Yellow-white
        } else if (lifeRatio > 0.4) {
          color.setHSL(0.08, 1, 0.6); // Orange
        } else {
          color.setHSL(0.02, 1, 0.5); // Red
        }

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, color);
      }
      else if (isActive && spawned < spawnRate * delta * 10) {
        spawned++;
        lifetimes[i] = PARTICLE_LIFETIME * (0.7 + Math.random() * 0.3);

        // Spawn at exhaust pipe positions (left and right)
        const side = i % 2 === 0 ? -1 : 1;
        const backOffset = -2.2; // Behind the truck

        // Calculate world position based on truck rotation
        const pos = positionRef.current;
        const spawnX = pos.x + Math.sin(rotation) * backOffset + Math.cos(rotation) * side * 0.8;
        const spawnZ = pos.z + Math.cos(rotation) * backOffset - Math.sin(rotation) * side * 0.8;

        positions[i3] = spawnX + (Math.random() - 0.5) * 0.3;
        positions[i3 + 1] = pos.y + 0.5 + Math.random() * 0.2;
        positions[i3 + 2] = spawnZ + (Math.random() - 0.5) * 0.3;

        // Velocity - shoot backward from truck
        const speed = 8 + Math.random() * 4;
        velocities[i3] = -Math.sin(rotation) * speed + (Math.random() - 0.5) * 2;
        velocities[i3 + 1] = Math.random() * 2;
        velocities[i3 + 2] = -Math.cos(rotation) * speed + (Math.random() - 0.5) * 2;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(0.3);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      else {
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
      <sphereGeometry args={[0.5, 6, 6]} />
      <meshStandardMaterial
        color="#FFAA00"
        emissive="#FF6600"
        emissiveIntensity={2}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default BoostFlame;
