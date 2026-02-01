'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SparksProps {
  onSparkRequest?: (callback: (position: THREE.Vector3, direction: THREE.Vector3) => void) => void;
}

const PARTICLE_COUNT = 100;
const PARTICLE_LIFETIME = 0.5;

export function Sparks({ onSparkRequest }: SparksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
  }>();

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

  // Expose spark emission function
  const emitSparks = useCallback((position: THREE.Vector3, direction: THREE.Vector3) => {
    if (!particlesRef.current) return;

    const { positions, velocities, lifetimes } = particlesRef.current;
    const sparkCount = 15 + Math.floor(Math.random() * 10);
    let emitted = 0;

    for (let i = 0; i < PARTICLE_COUNT && emitted < sparkCount; i++) {
      if (lifetimes[i] <= 0) {
        const i3 = i * 3;
        lifetimes[i] = PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);

        positions[i3] = position.x + (Math.random() - 0.5) * 0.5;
        positions[i3 + 1] = position.y + Math.random() * 0.3;
        positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.5;

        // Velocity based on direction with spread
        const speed = 8 + Math.random() * 12;
        velocities[i3] = direction.x * speed + (Math.random() - 0.5) * 8;
        velocities[i3 + 1] = Math.abs(direction.y) * speed + Math.random() * 6 + 2;
        velocities[i3 + 2] = direction.z * speed + (Math.random() - 0.5) * 8;

        emitted++;
      }
    }
  }, []);

  // Register the callback if provided
  useMemo(() => {
    if (onSparkRequest) {
      onSparkRequest(emitSparks);
    }
  }, [onSparkRequest, emitSparks]);

  useFrame((state, delta) => {
    if (!meshRef.current || !particlesRef.current) return;

    const { positions, velocities, lifetimes } = particlesRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        // Apply velocity with gravity
        positions[i3] += velocities[i3] * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += velocities[i3 + 2] * delta;

        // Gravity
        velocities[i3 + 1] -= 25 * delta;

        // Air drag
        velocities[i3] *= 0.98;
        velocities[i3 + 2] *= 0.98;

        // Bounce off ground
        if (positions[i3 + 1] < 0.1) {
          positions[i3 + 1] = 0.1;
          velocities[i3 + 1] *= -0.3;
          velocities[i3] *= 0.7;
          velocities[i3 + 2] *= 0.7;
        }

        // Scale based on lifetime
        const scale = (lifetimes[i] / PARTICLE_LIFETIME) * 0.08;

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.setScalar(scale);
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
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[0.5, 4, 4]} />
      <meshStandardMaterial
        color="#FFAA00"
        emissive="#FF6600"
        emissiveIntensity={2}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
}

export default Sparks;
