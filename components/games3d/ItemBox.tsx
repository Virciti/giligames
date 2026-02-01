'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type PowerUpType = 'boost' | 'shield' | 'star' | 'mushroom' | 'lightning';

interface ItemBoxProps {
  position: [number, number, number];
  onCollect?: (powerUp: PowerUpType) => void;
  respawnTime?: number;
}

const POWER_UPS: PowerUpType[] = ['boost', 'mushroom', 'star', 'shield', 'lightning'];

export function ItemBox({ position, onCollect, respawnTime = 5 }: ItemBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isCollected) {
      setRespawnTimer((prev) => {
        if (prev >= respawnTime) {
          setIsCollected(false);
          return 0;
        }
        return prev + delta;
      });
      return;
    }

    // Rotate and bob
    meshRef.current.rotation.y += delta * 2;
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3;
  });

  const handleCollision = () => {
    if (isCollected) return;

    setIsCollected(true);
    const randomPowerUp = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
    onCollect?.(randomPowerUp);
  };

  if (isCollected) return null;

  return (
    <group position={position}>
      {/* Main box */}
      <mesh ref={meshRef} onClick={handleCollision}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FF8C00"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Question mark symbol - front and back */}
      <mesh position={[0, position[1] - position[1], 0.76]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Glow effect */}
      <pointLight color="#FFD700" intensity={1} distance={5} />
    </group>
  );
}

// Collectible coin/star
interface CollectibleProps {
  position: [number, number, number];
  type?: 'coin' | 'star';
  onCollect?: () => void;
}

export function Collectible({ position, type = 'coin', onCollect }: CollectibleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isCollected, setIsCollected] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current || isCollected) return;

    meshRef.current.rotation.y += delta * 3;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
  });

  if (isCollected) return null;

  const color = type === 'coin' ? '#FFD700' : '#FFE4B5';
  const emissive = type === 'coin' ? '#FFA500' : '#FFFF00';

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        {type === 'coin' ? (
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
        ) : (
          <octahedronGeometry args={[0.5]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight color={color} intensity={0.5} distance={3} />
    </group>
  );
}

// Boost pad on the track
interface BoostPadProps {
  position: [number, number, number];
  rotation?: number;
  onEnter?: () => void;
}

export function BoostPad({ position, rotation = 0, onEnter }: BoostPadProps) {
  const arrowsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!arrowsRef.current) return;

    // Animate arrows
    const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.5;
    arrowsRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const offset = (state.clock.elapsedTime * 3 + i * 0.5) % 2;
        child.position.z = -1.5 + offset;
        (child.material as THREE.MeshStandardMaterial).opacity = 1 - offset / 2;
      }
    });
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF0000"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Arrow indicators */}
      <group ref={arrowsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.1, -1.5 + i * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.4, 0.8, 3]} />
            <meshStandardMaterial
              color="#FFFF00"
              emissive="#FFAA00"
              emissiveIntensity={0.8}
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Glow */}
      <pointLight color="#FF4500" intensity={1} distance={8} position={[0, 1, 0]} />
    </group>
  );
}

export default ItemBox;
