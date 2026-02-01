'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExhaustSmokeProps {
  leftPipePosition: THREE.Vector3;
  rightPipePosition: THREE.Vector3;
  truckRotation: number;
  throttle: number; // 0-1, how much gas is being applied
  isActive: boolean;
}

const PARTICLE_COUNT = 30;
const PARTICLE_LIFETIME = 2.0;

export function ExhaustSmoke({
  leftPipePosition,
  rightPipePosition,
  truckRotation,
  throttle,
  isActive
}: ExhaustSmokeProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    scales: Float32Array;
    opacities: Float32Array;
  }>();

  useMemo(() => {
    particlesRef.current = {
      positions: new Float32Array(PARTICLE_COUNT * 3),
      velocities: new Float32Array(PARTICLE_COUNT * 3),
      lifetimes: new Float32Array(PARTICLE_COUNT),
      scales: new Float32Array(PARTICLE_COUNT),
      opacities: new Float32Array(PARTICLE_COUNT),
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlesRef.current.lifetimes[i] = -1;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current || !particlesRef.current) return;

    const { positions, velocities, lifetimes, scales } = particlesRef.current;
    const intensity = isActive ? 0.3 + throttle * 0.7 : 0.1;
    const spawnRate = intensity * 8;
    let spawned = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        // Apply velocity
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;

        // Rise and spread
        velocities[i3 + 1] += 1.5 * delta;
        velocities[i3] *= 0.97;
        velocities[i3 + 2] *= 0.97;

        // Scale grows over time
        const lifeRatio = 1 - lifetimes[i] / PARTICLE_LIFETIME;
        scales[i] = 0.15 + lifeRatio * 0.4;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scales[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      else if (spawned < spawnRate * delta * 10 && isActive) {
        spawned++;
        lifetimes[i] = PARTICLE_LIFETIME * (0.6 + Math.random() * 0.4);

        // Alternate between left and right pipe
        const useLeftPipe = i % 2 === 0;
        const pipePos = useLeftPipe ? leftPipePosition : rightPipePosition;

        // Calculate world position based on truck rotation
        const offsetX = Math.sin(truckRotation) * -1.15 * (useLeftPipe ? 1 : -1);
        const offsetZ = Math.cos(truckRotation) * -1.15 * (useLeftPipe ? 1 : -1);

        positions[i3] = pipePos.x + offsetX + (Math.random() - 0.5) * 0.1;
        positions[i3 + 1] = pipePos.y + 1.5 + Math.random() * 0.2;
        positions[i3 + 2] = pipePos.z + offsetZ + (Math.random() - 0.5) * 0.1;

        // Velocity - upward with some randomness
        velocities[i3] = (Math.random() - 0.5) * 0.5;
        velocities[i3 + 1] = 1.5 + Math.random() * 1;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;

        scales[i] = 0.15;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scales[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
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
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshStandardMaterial
        color="#333333"
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default ExhaustSmoke;
