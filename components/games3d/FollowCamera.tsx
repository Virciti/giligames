'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_OFFSET = new THREE.Vector3(0, 5, -10);

/** Maximum camera angular velocity in radians/second — prevents whip-pan on sharp turns */
const MAX_ANGULAR_VELOCITY = 2.5;

// SPEED FEEL — FOV zoom at high speed
const BASE_FOV = 60;
const MAX_FOV = 75;
const FOV_SPEED_THRESHOLD = 0.3; // Start FOV increase at 30% max speed
// Speed-dependent micro-shake for terrain rumble
const SPEED_SHAKE_MAX = 0.08; // Maximum terrain rumble intensity
const SPEED_SHAKE_THRESHOLD = 0.5; // Start terrain rumble at 50% max speed

interface FollowCameraProps {
  /** Ref to the truck's live position — read directly each frame, no React re-renders */
  targetRef: React.RefObject<THREE.Vector3>;
  /** Ref to the truck's live rotation */
  targetRotationRef: React.RefObject<THREE.Euler>;
  /** Ref to the truck's current speed (0–60+) for velocity-based prediction */
  speedRef?: React.RefObject<number>;
  offset?: THREE.Vector3;
  lookAhead?: number;
  /** Base smoothing factor — higher = snappier camera (0.01–0.2) */
  smoothness?: number;
  /** Increment to trigger a camera shake (collision, slip, etc.) */
  shakeTrigger?: number;
  /** Shake intensity in world units (default 0.2) */
  shakeIntensity?: number;
}

export function FollowCamera({
  targetRef,
  targetRotationRef,
  speedRef,
  offset = DEFAULT_OFFSET,
  lookAhead = 12,
  smoothness = 0.08,
  shakeTrigger = 0,
  shakeIntensity = 0.2,
}: FollowCameraProps) {
  const { camera } = useThree();
  const currentPosition = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);
  // Reusable vectors to avoid per-frame allocations
  const _idealPos = useRef(new THREE.Vector3());
  const _idealLook = useRef(new THREE.Vector3());

  // Camera velocity dampening — track previous position to limit acceleration
  const cameraVelocity = useRef(new THREE.Vector3());
  const prevCameraPos = useRef(new THREE.Vector3());

  // Angular velocity clamping — track previous rotation to limit turn rate
  const prevTargetRotationY = useRef(0);
  const smoothedRotationY = useRef(0);

  // Camera shake state
  const shakeTimeLeft = useRef(0);
  const lastShakeTrigger = useRef(0);

  // Speed feel — dynamic FOV
  const currentFov = useRef(BASE_FOV);

  useFrame((_, delta) => {
    const target = targetRef.current;
    if (!target) return;

    const rawRotationY = targetRotationRef.current?.y || 0;

    // ── Angular velocity clamping ──
    // Limit how fast the camera's tracked rotation can change per frame
    // This prevents whip-pan when the truck turns sharply
    if (!isInitialized.current) {
      smoothedRotationY.current = rawRotationY;
      prevTargetRotationY.current = rawRotationY;
    }

    // Calculate shortest angular difference (handles wrap-around)
    let angleDiff = rawRotationY - smoothedRotationY.current;
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxAngleStep = MAX_ANGULAR_VELOCITY * delta;
    const clampedDiff = Math.max(-maxAngleStep, Math.min(maxAngleStep, angleDiff));
    smoothedRotationY.current += clampedDiff;
    prevTargetRotationY.current = rawRotationY;

    const rotationY = smoothedRotationY.current;

    // ── Speed-dependent look-ahead and offset ──
    const speed = speedRef?.current ?? 0;
    const speedFactor = Math.min(speed / 60, 1); // 0 at rest, 1 at max speed

    // Dynamic look-ahead: look further ahead at higher speeds
    const dynamicLookAhead = lookAhead * (0.5 + speedFactor * 0.8);

    // Speed-dependent offset: pull camera back at high speed for better visibility
    const speedPullBack = speedFactor * 4; // up to 4 extra units behind at max speed
    const dynamicOffsetZ = offset.z - speedPullBack;

    // Calculate camera position: behind and above the vehicle
    // Rotate the offset by the vehicle's rotation
    const behindX = Math.sin(rotationY) * dynamicOffsetZ + Math.cos(rotationY) * offset.x;
    const behindZ = Math.cos(rotationY) * dynamicOffsetZ - Math.sin(rotationY) * offset.x;

    const idealPosition = _idealPos.current.set(
      target.x + behindX,
      target.y + offset.y,
      target.z + behindZ
    );

    // Look at point: ahead of the vehicle (velocity-scaled)
    const aheadX = Math.sin(rotationY) * dynamicLookAhead;
    const aheadZ = Math.cos(rotationY) * dynamicLookAhead;

    const idealLookAt = _idealLook.current.set(
      target.x + aheadX,
      target.y + 1.5,
      target.z + aheadZ
    );

    // On first frame, snap to position immediately
    if (!isInitialized.current) {
      currentPosition.current.copy(idealPosition);
      currentLookAt.current.copy(idealLookAt);
      prevCameraPos.current.copy(idealPosition);
      cameraVelocity.current.set(0, 0, 0);
      camera.position.copy(idealPosition);
      camera.lookAt(idealLookAt);
      isInitialized.current = true;
      return;
    }

    // ── Frame-rate independent smooth follow with velocity dampening ──
    // The smoothness prop controls the base for exponential decay
    // Higher smoothness = snappier follow, lower = more cinematic lag
    const posSmooth = 1 - Math.pow(smoothness, delta);
    const lookSmooth = 1 - Math.pow(smoothness * 0.5, delta);

    // Compute what the new position would be from pure lerp
    const lerpedX = currentPosition.current.x + (idealPosition.x - currentPosition.current.x) * posSmooth;
    const lerpedY = currentPosition.current.y + (idealPosition.y - currentPosition.current.y) * posSmooth;
    const lerpedZ = currentPosition.current.z + (idealPosition.z - currentPosition.current.z) * posSmooth;

    // Velocity dampening: limit camera acceleration to prevent overshoot
    // Compute intended velocity this frame
    const intendedVelX = (lerpedX - prevCameraPos.current.x) / delta;
    const intendedVelY = (lerpedY - prevCameraPos.current.y) / delta;
    const intendedVelZ = (lerpedZ - prevCameraPos.current.z) / delta;

    // Smooth camera velocity toward intended velocity (dampening factor)
    const velDamp = 1 - Math.pow(0.001, delta); // ~6 frames to reach full velocity
    cameraVelocity.current.x += (intendedVelX - cameraVelocity.current.x) * velDamp;
    cameraVelocity.current.y += (intendedVelY - cameraVelocity.current.y) * velDamp;
    cameraVelocity.current.z += (intendedVelZ - cameraVelocity.current.z) * velDamp;

    // Apply dampened velocity
    currentPosition.current.x = prevCameraPos.current.x + cameraVelocity.current.x * delta;
    currentPosition.current.y = prevCameraPos.current.y + cameraVelocity.current.y * delta;
    currentPosition.current.z = prevCameraPos.current.z + cameraVelocity.current.z * delta;

    // Store for next frame
    prevCameraPos.current.copy(currentPosition.current);

    // LookAt uses standard lerp (no velocity dampening needed — angular clamping handles it)
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

    // ── SPEED FEEL: Dynamic FOV ──
    // FOV widens at high speed for a sense of velocity (60° → 75°)
    const fovSpeedFactor = Math.max(0, (speedFactor - FOV_SPEED_THRESHOLD) / (1 - FOV_SPEED_THRESHOLD));
    const targetFov = BASE_FOV + (MAX_FOV - BASE_FOV) * fovSpeedFactor;
    currentFov.current = THREE.MathUtils.lerp(currentFov.current, targetFov, Math.min(1, 4 * delta));
    (camera as THREE.PerspectiveCamera).fov = currentFov.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // ── SPEED FEEL: Terrain rumble micro-shake ──
    // Subtle vibration when driving fast — adds weight feel without collision shake
    if (speedFactor > SPEED_SHAKE_THRESHOLD && shakeTimeLeft.current <= 0) {
      const rumbleIntensity = SPEED_SHAKE_MAX * ((speedFactor - SPEED_SHAKE_THRESHOLD) / (1 - SPEED_SHAKE_THRESHOLD));
      camera.position.x += (Math.random() - 0.5) * 2 * rumbleIntensity;
      camera.position.y += (Math.random() - 0.5) * 2 * rumbleIntensity * 0.4;
    }
  });

  return null;
}

export default FollowCamera;
