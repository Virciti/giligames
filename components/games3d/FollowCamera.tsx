'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_OFFSET = new THREE.Vector3(0, 5, -10);

interface FollowCameraProps {
  target: THREE.Vector3;
  targetRotation: THREE.Euler;
  offset?: THREE.Vector3;
  lookAhead?: number;
  smoothness?: number;
  /** Increment to trigger a camera shake (collision, slip, etc.) */
  shakeTrigger?: number;
  /** Shake intensity in world units (default 0.4) */
  shakeIntensity?: number;
}

export function FollowCamera({
  target,
  targetRotation,
  offset = DEFAULT_OFFSET,
  lookAhead = 12,
  smoothness = 0.08,
  shakeTrigger = 0,
  shakeIntensity = 0.4,
}: FollowCameraProps) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);
  // Reusable vectors to avoid per-frame allocations
  const _idealPos = useRef(new THREE.Vector3());
  const _idealLook = useRef(new THREE.Vector3());

  // Camera shake state
  const shakeTimeLeft = useRef(0);
  const lastShakeTrigger = useRef(0);

  useFrame((_, delta) => {
    if (!target) return;

    const rotationY = targetRotation?.y || 0;

    // Calculate camera position: behind and above the vehicle
    // Rotate the offset by the vehicle's rotation
    const behindX = Math.sin(rotationY) * offset.z + Math.cos(rotationY) * offset.x;
    const behindZ = Math.cos(rotationY) * offset.z - Math.sin(rotationY) * offset.x;

    const idealPosition = _idealPos.current.set(
      target.x + behindX,
      target.y + offset.y,
      target.z + behindZ
    );

    // Look at point: ahead of the vehicle
    const aheadX = Math.sin(rotationY) * lookAhead;
    const aheadZ = Math.cos(rotationY) * lookAhead;

    const idealLookAt = _idealLook.current.set(
      target.x + aheadX,
      target.y + 1.5,
      target.z + aheadZ
    );

    // On first frame, snap to position immediately
    if (!isInitialized.current) {
      currentPosition.current.copy(idealPosition);
      currentLookAt.current.copy(idealLookAt);
      camera.position.copy(idealPosition);
      camera.lookAt(idealLookAt);
      isInitialized.current = true;
      return;
    }

    // Frame-rate independent smooth follow using delta time
    // At 60fps this gives ~0.55 blend per frame — tight racing-game tracking
    const posSmooth = 1 - Math.pow(0.001, delta);
    const lookSmooth = 1 - Math.pow(0.0005, delta);

    currentPosition.current.lerp(idealPosition, posSmooth);
    currentLookAt.current.lerp(idealLookAt, lookSmooth);

    // Apply to camera
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);

    // Camera shake — triggered by collisions/slips
    if (shakeTrigger !== lastShakeTrigger.current && shakeTrigger > 0) {
      lastShakeTrigger.current = shakeTrigger;
      shakeTimeLeft.current = 0.3; // 300ms shake duration
    }

    if (shakeTimeLeft.current > 0) {
      shakeTimeLeft.current -= delta;
      const decay = shakeTimeLeft.current / 0.3; // 1 → 0 over duration
      const magnitude = shakeIntensity * decay;
      camera.position.x += (Math.random() - 0.5) * 2 * magnitude;
      camera.position.y += (Math.random() - 0.5) * 2 * magnitude * 0.6;
      camera.position.z += (Math.random() - 0.5) * 2 * magnitude;
    }
  });

  return null;
}

export default FollowCamera;
