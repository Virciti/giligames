'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FollowCameraProps {
  target: THREE.Vector3;
  targetRotation: THREE.Euler;
  offset?: THREE.Vector3;
  lookAhead?: number;
  smoothness?: number;
}

export function FollowCamera({
  target,
  targetRotation,
  offset = new THREE.Vector3(0, 4, -8),
  lookAhead = 10,
  smoothness = 0.08,
}: FollowCameraProps) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);

  useFrame(() => {
    if (!target) return;

    const rotationY = targetRotation?.y || 0;

    // Calculate camera position: behind and above the vehicle
    // Rotate the offset by the vehicle's rotation
    const behindX = Math.sin(rotationY) * offset.z + Math.cos(rotationY) * offset.x;
    const behindZ = Math.cos(rotationY) * offset.z - Math.sin(rotationY) * offset.x;

    const idealPosition = new THREE.Vector3(
      target.x + behindX,
      target.y + offset.y,
      target.z + behindZ
    );

    // Look at point: ahead of the vehicle
    const aheadX = Math.sin(rotationY) * lookAhead;
    const aheadZ = Math.cos(rotationY) * lookAhead;

    const idealLookAt = new THREE.Vector3(
      target.x + aheadX,
      target.y + 1,
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

    // Smooth interpolation for camera position
    currentPosition.current.lerp(idealPosition, smoothness);
    currentLookAt.current.lerp(idealLookAt, smoothness);

    // Apply to camera
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

export default FollowCamera;
