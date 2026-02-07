'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface LearningCoin3DProps {
  position: [number, number, number];
  displayText: string;
  isCorrect: boolean;
  isCollected: boolean;
  phaseOffset: number;
}

function getCoinFontSize(text: string): number {
  if (text.length <= 2) return 0.8;
  if (text.length <= 4) return 0.65;
  if (text.length <= 7) return 0.5;
  return 0.4;
}

export function LearningCoin3D({
  position,
  displayText,
  isCorrect,
  isCollected,
  phaseOffset,
}: LearningCoin3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const collectionProgress = useRef(0);
  const baseY = position[1];

  // Brushed gold roughness map - concentric rings like a real minted coin
  const goldBrushMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    // Base fill
    ctx.fillStyle = 'rgb(50,50,50)';
    ctx.fillRect(0, 0, 512, 512);
    // Concentric radial brush strokes
    for (let r = 0; r < 256; r++) {
      const brightness = 35 + Math.sin(r * 0.8) * 12 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(${brightness},${brightness},${brightness})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Fine radial lines (like real coin minting marks)
    for (let a = 0; a < 360; a += 3) {
      const rad = (a * Math.PI) / 180;
      const brightness = 40 + Math.random() * 15;
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(rad) * 256, 256 + Math.sin(rad) * 256);
      ctx.strokeStyle = `rgba(${brightness},${brightness},${brightness},0.3)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  const fontSize = getCoinFontSize(displayText);
  const glowColor = isCorrect ? '#90EE90' : '#FFD700';
  const beamColor = isCorrect ? '#44ff88' : '#ffcc00';

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isCollected) {
      collectionProgress.current += delta * 2.5;
      const t = Math.min(collectionProgress.current, 1);
      groupRef.current.scale.setScalar(1.5 * (1 + t * 0.5));
      groupRef.current.position.y = baseY + t * 5;
      if (t >= 1) {
        groupRef.current.visible = false;
      }
      return;
    }

    // Reset collection state
    collectionProgress.current = 0;
    groupRef.current.visible = true;
    groupRef.current.scale.setScalar(1.5);

    // Slow spin for readability
    groupRef.current.rotation.y += 0.012;

    // Bob up and down
    groupRef.current.position.y =
      baseY + Math.sin(state.clock.elapsedTime * 1.8 + phaseOffset) * 0.5;

    // Very gentle tilt
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 1.2 + phaseOffset) * 0.06;
  });

  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Vertical light beam - visible from far away */}
      <mesh position={[0, -position[1] / 2, 0]}>
        <cylinderGeometry args={[0.15, 0.5, position[1] + 2, 8]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      {/* Outer glow beam */}
      <mesh position={[0, -position[1] / 2, 0]}>
        <cylinderGeometry args={[0.6, 1.5, position[1] + 2, 8]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>

      {/* Coin group - spins and bobs */}
      <group ref={groupRef}>
        {/* Main coin body - thick disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1.0, 1.0, 0.3, 48]} />
          <meshPhysicalMaterial
            color="#FFD700"
            metalness={0.95}
            roughness={0.12}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            roughnessMap={goldBrushMap}
            envMapIntensity={2.5}
          />
        </mesh>

        {/* Coin edge - beveled rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.0, 0.08, 12, 48]} />
          <meshPhysicalMaterial
            color="#B8860B"
            metalness={0.95}
            roughness={0.2}
            clearcoat={0.6}
          />
        </mesh>

        {/* Front inner rim detail */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.14]}>
          <torusGeometry args={[0.82, 0.03, 8, 48]} />
          <meshStandardMaterial
            color="#DAA520"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>

        {/* Back inner rim detail */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.14]}>
          <torusGeometry args={[0.82, 0.03, 8, 48]} />
          <meshStandardMaterial
            color="#DAA520"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>

        {/* Front face - slightly raised center disc */}
        <mesh position={[0, 0, 0.155]}>
          <circleGeometry args={[0.78, 48]} />
          <meshPhysicalMaterial
            color="#FFDB4D"
            metalness={0.92}
            roughness={0.18}
            clearcoat={0.8}
            roughnessMap={goldBrushMap}
          />
        </mesh>

        {/* Back face - slightly raised center disc */}
        <mesh position={[0, 0, -0.155]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.78, 48]} />
          <meshPhysicalMaterial
            color="#FFDB4D"
            metalness={0.92}
            roughness={0.18}
            clearcoat={0.8}
            roughnessMap={goldBrushMap}
          />
        </mesh>

        {/* Front face text */}
        <Text
          position={[0, 0, 0.16]}
          fontSize={fontSize}
          color="#704214"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#5C3A10"
          maxWidth={1.5}
          textAlign="center"
          fontWeight="bold"
        >
          {displayText}
        </Text>

        {/* Back face text */}
        <Text
          position={[0, 0, -0.16]}
          rotation={[0, Math.PI, 0]}
          fontSize={fontSize}
          color="#704214"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#5C3A10"
          maxWidth={1.5}
          textAlign="center"
          fontWeight="bold"
        >
          {displayText}
        </Text>

        {/* Glow light - brighter, longer range for visibility */}
        <pointLight color={glowColor} intensity={3} distance={15} />
      </group>
    </group>
  );
}
