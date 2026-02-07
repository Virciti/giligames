'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface JumpArenaProps {
  isActive: boolean;
  truckPosition?: THREE.Vector3;
}

// Car types for variety
type CarType = 'sedan' | 'suv' | 'pickup' | 'sports' | 'minivan' | 'hatchback';

// Deterministic pseudo-random for stable render output (avoids flickering from Math.random in render)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface CarState {
  id: string;
  position: [number, number, number];
  rotation: number;
  color: string;
  type: CarType;
  damage: number; // 0 = pristine, 1 = fully crushed
}

interface TreeState {
  id: string;
  position: [number, number, number];
  rotation: number;
  type: 'pine' | 'oak' | 'birch' | 'dead';
  scale: number;
  fallen: boolean;
  fallAngle: number;
  fallDirection: number;
}

// =============================================
// TERRAIN HEIGHT FUNCTION - shared with MonsterTruck.tsx
// =============================================
export function getTerrainHeight(x: number, z: number): number {
  // Rolling hills using layered sine waves
  let height = 0;
  height += Math.sin(x * 0.015) * Math.cos(z * 0.012) * 3.5;
  height += Math.sin(x * 0.035 + 1.3) * Math.cos(z * 0.028 + 0.7) * 1.8;
  height += Math.sin(x * 0.06 + 2.5) * Math.cos(z * 0.055 + 1.4) * 0.8;

  // River valley - carved channel running through the map
  const riverDist = Math.abs(z - Math.sin(x * 0.02) * 30 - 10);
  if (riverDist < 12) {
    const riverDepth = (1 - riverDist / 12) * 4;
    height -= riverDepth;
  }

  // Flatten areas for mud pits
  const mudPits = [
    { x: -80, z: -60, r: 20 },
    { x: 60, z: 80, r: 18 },
    { x: -50, z: 100, r: 15 },
    { x: 120, z: -40, r: 16 },
  ];
  for (const pit of mudPits) {
    const dx = x - pit.x;
    const dz = z - pit.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < pit.r) {
      const factor = 1 - dist / pit.r;
      height = height * (1 - factor) + (-1.2) * factor; // Sink down slightly
    }
  }

  // Flatten areas for roads
  const mainRoadDist = Math.abs(x);
  if (mainRoadDist < 8) {
    const roadFlatten = Math.max(0, 1 - mainRoadDist / 8);
    height *= (1 - roadFlatten * 0.8);
  }
  const crossRoadDist = Math.abs(z);
  if (crossRoadDist < 8) {
    const roadFlatten = Math.max(0, 1 - crossRoadDist / 8);
    height *= (1 - roadFlatten * 0.8);
  }

  return height;
}

// Check if position is on a bridge (includes approach/departure ramps)
export function isOnBridge(x: number, z: number): { onBridge: boolean; height: number } {
  const bridges = [
    { x: 0, z: 10, length: 30, width: 10, height: 8, rotation: 0, rampLength: 18 },        // Main road bridge over river
    { x: -90, z: -20, length: 25, width: 8, height: 7, rotation: 0.3, rampLength: 15 },   // Side bridge
    { x: 80, z: 25, length: 22, width: 8, height: 6.5, rotation: -0.2, rampLength: 14 },   // East bridge
  ];

  for (const bridge of bridges) {
    const cos = Math.cos(-bridge.rotation);
    const sin = Math.sin(-bridge.rotation);
    const localX = (x - bridge.x) * cos - (z - bridge.z) * sin;
    const localZ = (x - bridge.x) * sin + (z - bridge.z) * cos;

    const halfW = bridge.width / 2;
    const halfL = bridge.length / 2;
    const rampL = bridge.rampLength;

    if (Math.abs(localX) < halfW) {
      // On the main deck
      if (Math.abs(localZ) < halfL) {
        return { onBridge: true, height: bridge.height };
      }
      // On the approach ramp (front)
      if (localZ >= halfL && localZ < halfL + rampL) {
        const t = 1 - (localZ - halfL) / rampL; // 1 at deck edge, 0 at bottom
        return { onBridge: true, height: bridge.height * t };
      }
      // On the departure ramp (back)
      if (localZ <= -halfL && localZ > -halfL - rampL) {
        const t = 1 - (-localZ - halfL) / rampL;
        return { onBridge: true, height: bridge.height * t };
      }
    }
  }
  return { onBridge: false, height: 0 };
}

// Check if position is in a tunnel
export function isInTunnel(x: number, z: number): { inTunnel: boolean; height: number } {
  const tunnels = [
    { x: -140, z: 0, length: 35, width: 10, height: 6, rotation: Math.PI / 4 },
    { x: 100, z: -100, length: 30, width: 10, height: 5, rotation: -Math.PI / 6 },
  ];

  for (const tunnel of tunnels) {
    const cos = Math.cos(-tunnel.rotation);
    const sin = Math.sin(-tunnel.rotation);
    const localX = (x - tunnel.x) * cos - (z - tunnel.z) * sin;
    const localZ = (x - tunnel.x) * sin + (z - tunnel.z) * cos;

    if (Math.abs(localX) < tunnel.width / 2 && Math.abs(localZ) < tunnel.length / 2) {
      return { inTunnel: true, height: 0 };
    }
  }
  return { inTunnel: false, height: 0 };
}

// Check if in a mud pit
export function isInMudPit(x: number, z: number): boolean {
  const mudPits = [
    { x: -80, z: -60, r: 18 },
    { x: 60, z: 80, r: 16 },
    { x: -50, z: 100, r: 13 },
    { x: 120, z: -40, r: 14 },
  ];
  for (const pit of mudPits) {
    const dx = x - pit.x;
    const dz = z - pit.z;
    if (Math.sqrt(dx * dx + dz * dz) < pit.r) return true;
  }
  return false;
}

// =============================================
// REALISTIC TERRAIN GROUND
// =============================================
function TerrainGround() {
  const geometry = useMemo(() => {
    const res = 200;
    const geo = new THREE.PlaneGeometry(500, 500, res, res);
    const positions = geo.attributes.position;

    // Add vertex colors for arid desert/savanna terrain
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const h = getTerrainHeight(x, y);
      positions.setZ(i, h);

      // Desert color variation based on height and position
      const variation = Math.sin(x * 0.08) * Math.cos(y * 0.06) * 0.04;
      const noise2 = Math.sin(x * 0.03 + 1.7) * Math.cos(y * 0.04 + 0.9) * 0.03;
      const riverDist = Math.abs(y - Math.sin(x * 0.02) * 30 - 10);
      const nearRiver = riverDist < 20 ? Math.pow(1 - riverDist / 20, 2) : 0;

      // Base: sandy desert (warm tan/brown)
      let r = 0.58 + variation + h * 0.015 + noise2;
      let g = 0.42 + variation * 0.8 + h * 0.01 + noise2 * 0.7;
      let b = 0.28 + variation * 0.3 + noise2 * 0.4;

      // Near river: oasis green blend
      if (nearRiver > 0) {
        r = r * (1 - nearRiver * 0.5) + 0.25 * nearRiver * 0.5;
        g = g * (1 - nearRiver * 0.5) + 0.45 * nearRiver * 0.5;
        b = b * (1 - nearRiver * 0.5) + 0.2 * nearRiver * 0.5;
      }

      // Higher elevations: rockier/lighter
      if (h > 2) {
        const rockBlend = Math.min(1, (h - 2) * 0.15);
        r = r * (1 - rockBlend) + 0.55 * rockBlend;
        g = g * (1 - rockBlend) + 0.48 * rockBlend;
        b = b * (1 - rockBlend) + 0.38 * rockBlend;
      }

      colors[i * 3] = Math.max(0.15, Math.min(0.75, r));
      colors[i * 3 + 1] = Math.max(0.12, Math.min(0.6, g));
      colors[i * 3 + 2] = Math.max(0.08, Math.min(0.5, b));
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
}

// =============================================
// RIVER with water effect
// =============================================
function River() {
  // River follows z = sin(x * 0.02) * 30 + 10
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let x = -250; x <= 250; x += 5) {
      const z = Math.sin(x * 0.02) * 30 + 10;
      pts.push([x, -0.8, z]);
    }
    return pts;
  }, []);

  return (
    <group>
      {points.map((pt, i) => {
        if (i >= points.length - 1) return null;
        const next = points[i + 1];
        const midX = (pt[0] + next[0]) / 2;
        const midZ = (pt[2] + next[2]) / 2;
        const angle = Math.atan2(next[2] - pt[2], next[0] - pt[0]);
        const dist = Math.sqrt((next[0] - pt[0]) ** 2 + (next[2] - pt[2]) ** 2);
        return (
          <mesh key={i} position={[midX, -0.5, midZ]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
            <planeGeometry args={[dist + 1, 18]} />
            <meshStandardMaterial
              color="#2A8B8B"
              transparent
              opacity={0.7}
              roughness={0.08}
              metalness={0.35}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// =============================================
// BRIDGES - tall with approach/departure ramps
// =============================================
function Bridge({ position, rotation = 0, length = 30, width = 10, rampLength = 18 }: {
  position: [number, number, number];
  rotation?: number;
  length?: number;
  width?: number;
  rampLength?: number;
}) {
  const bridgeHeight = position[1];
  const rampAngle = Math.atan2(bridgeHeight, rampLength);
  const rampHyp = Math.sqrt(rampLength * rampLength + bridgeHeight * bridgeHeight);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* ===== MAIN DECK ===== */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.6, length]} />
        <meshStandardMaterial color="#8B7040" roughness={0.85} />
      </mesh>

      {/* Deck planks */}
      {Array.from({ length: Math.floor(length / 1.2) }).map((_, i) => (
        <mesh key={`p-${i}`} position={[0, 0.31, -length / 2 + 0.6 + i * 1.2]} receiveShadow>
          <boxGeometry args={[width - 0.6, 0.03, 0.9]} />
          <meshStandardMaterial color="#A08860" roughness={0.95} />
        </mesh>
      ))}

      {/* Asphalt road surface on deck */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 2, length - 1]} />
        <meshStandardMaterial color="#444" roughness={0.9} />
      </mesh>

      {/* ===== APPROACH RAMP (front, +Z) ===== */}
      <group position={[0, -bridgeHeight / 2, length / 2 + rampLength / 2]}>
        <mesh rotation={[rampAngle, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, 0.5, rampHyp]} />
          <meshStandardMaterial color="#8B7040" roughness={0.85} />
        </mesh>
        {/* Ramp surface */}
        <mesh rotation={[rampAngle, 0, 0]} position={[0, 0.26, 0]}>
          <boxGeometry args={[width - 0.4, 0.04, rampHyp - 0.5]} />
          <meshStandardMaterial color="#555" roughness={0.9} />
        </mesh>
      </group>

      {/* ===== DEPARTURE RAMP (back, -Z) ===== */}
      <group position={[0, -bridgeHeight / 2, -length / 2 - rampLength / 2]}>
        <mesh rotation={[-rampAngle, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, 0.5, rampHyp]} />
          <meshStandardMaterial color="#8B7040" roughness={0.85} />
        </mesh>
        <mesh rotation={[-rampAngle, 0, 0]} position={[0, 0.26, 0]}>
          <boxGeometry args={[width - 0.4, 0.04, rampHyp - 0.5]} />
          <meshStandardMaterial color="#555" roughness={0.9} />
        </mesh>
      </group>

      {/* ===== GUARD RAILS along deck + ramps ===== */}
      {[-width / 2 + 0.25, width / 2 - 0.25].map((x, i) => (
        <group key={`rail-${i}`}>
          {/* Deck rail posts */}
          {Array.from({ length: Math.floor(length / 3.5) }).map((_, j) => (
            <mesh key={`dp-${j}`} position={[x, 0.85, -length / 2 + 1.75 + j * 3.5]} castShadow>
              <boxGeometry args={[0.15, 1.5, 0.15]} />
              <meshStandardMaterial color="#777" roughness={0.6} metalness={0.4} />
            </mesh>
          ))}
          {/* Top rail - steel */}
          <mesh position={[x, 1.4, 0]}>
            <boxGeometry args={[0.08, 0.12, length]} />
            <meshStandardMaterial color="#999" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Mid rail */}
          <mesh position={[x, 0.8, 0]}>
            <boxGeometry args={[0.06, 0.08, length]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ===== STRUCTURAL SUPPORT PILLARS ===== */}
      {[-length / 3, 0, length / 3].map((z, i) => (
        <group key={`pil-${i}`}>
          {/* Concrete piers */}
          {[-width / 3, width / 3].map((x, j) => (
            <group key={`pier-${j}`}>
              {/* Main pier column */}
              <mesh position={[x, -bridgeHeight / 2, z]} castShadow>
                <boxGeometry args={[1.2, bridgeHeight, 1.2]} />
                <meshStandardMaterial color="#888" roughness={0.8} />
              </mesh>
              {/* Pier cap */}
              <mesh position={[x, -0.5, z]} castShadow>
                <boxGeometry args={[1.6, 0.4, 1.6]} />
                <meshStandardMaterial color="#999" roughness={0.7} />
              </mesh>
              {/* Pier base/footing */}
              <mesh position={[x, -bridgeHeight + 0.2, z]}>
                <boxGeometry args={[1.8, 0.4, 1.8]} />
                <meshStandardMaterial color="#777" roughness={0.9} />
              </mesh>
            </group>
          ))}
          {/* Cross-bracing steel beam */}
          <mesh position={[0, -bridgeHeight * 0.4, z]}>
            <boxGeometry args={[width * 0.55, 0.3, 0.3]} />
            <meshStandardMaterial color="#666" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Diagonal braces */}
          {[-1, 1].map((side, k) => (
            <mesh key={`brace-${k}`} position={[side * width * 0.18, -bridgeHeight * 0.5, z]} rotation={[0, 0, side * 0.4]}>
              <boxGeometry args={[0.15, bridgeHeight * 0.6, 0.15]} />
              <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ===== STEEL I-BEAM GIRDERS under deck ===== */}
      {[-width / 3, 0, width / 3].map((x, i) => (
        <mesh key={`girder-${i}`} position={[x, -0.45, 0]}>
          <boxGeometry args={[0.3, 0.6, length + 2]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ===== ROAD MARKINGS on deck ===== */}
      <mesh position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, length - 2]} />
        <meshStandardMaterial color="#cccc44" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
  );
}

// =============================================
// TUNNELS - Climbable mountain with realistic tunnel through base
// =============================================

// Animated LED light node for tunnel interior
function TunnelLEDStrip({ position, count, spacing, color = '#00ff88' }: {
  position: [number, number, number];
  count: number;
  spacing: number;
  color?: string;
}) {
  const lightsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightsRef.current) return;
    const children = lightsRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      if (mesh.material && 'emissiveIntensity' in mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        // Chase pattern - lights flash in sequence
        const phase = (timeRef.current * 3 + i * 0.4) % (count * 0.4);
        const brightness = phase < 1 ? (1 - phase) * 1.5 : 0.15;
        mat.emissiveIntensity = brightness;
      }
    }
  });

  return (
    <group ref={lightsRef} position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0, -count * spacing / 2 + i * spacing]}>
          <boxGeometry args={[0.15, 0.08, 0.3]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Tunnel({ position, rotation = 0, length = 30 }: {
  position: [number, number, number];
  rotation?: number;
  length?: number;
}) {
  const width = 10;
  const archHeight = 7;
  const mountainHeight = 25;
  const mountainRadius = length * 0.9;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* ===== DESERT MOUNTAIN ===== */}
      {/* Main peak - red/brown sandstone */}
      <mesh position={[0, mountainHeight * 0.4, 0]} castShadow>
        <coneGeometry args={[mountainRadius, mountainHeight, 32]} />
        <meshStandardMaterial color="#8B6B4A" roughness={0.95} />
      </mesh>
      {/* Rocky upper section - lighter sandstone */}
      <mesh position={[2, mountainHeight * 0.55, -3]} castShadow>
        <coneGeometry args={[mountainRadius * 0.5, mountainHeight * 0.6, 24]} />
        <meshStandardMaterial color="#A07850" roughness={0.95} />
      </mesh>
      {/* Secondary peak - darker desert rock */}
      <mesh position={[-4, mountainHeight * 0.35, 4]} castShadow>
        <coneGeometry args={[mountainRadius * 0.6, mountainHeight * 0.5, 24]} />
        <meshStandardMaterial color="#7A5C3E" roughness={0.95} />
      </mesh>
      {/* Rocky outcrops */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = mountainRadius * (0.5 + Math.sin(i * 3.1) * 0.2);
        return (
          <mesh key={`rock-${i}`} position={[Math.cos(angle) * dist, 2 + Math.sin(i * 2.7) * 2, Math.sin(angle) * dist]} castShadow>
            <dodecahedronGeometry args={[2 + Math.sin(i * 1.9) * 1, 0]} />
            <meshStandardMaterial color={`hsl(25, ${20 + i * 3}%, ${38 + i * 4}%)`} roughness={0.95} />
          </mesh>
        );
      })}
      {/* Sun-bleached rock cap */}
      <mesh position={[0, mountainHeight * 0.82, 0]}>
        <coneGeometry args={[mountainRadius * 0.2, mountainHeight * 0.12, 24]} />
        <meshStandardMaterial color="#D4B896" roughness={0.85} />
      </mesh>

      {/* ===== TUNNEL ENTRANCE - FRONT ===== */}
      <group position={[0, 0, length / 2]}>
        {/* Stone archway */}
        {[-width / 2 - 0.5, width / 2 + 0.5].map((x, i) => (
          <group key={`pillar-${i}`}>
            {/* Main pillar */}
            <mesh position={[x, archHeight / 2, 0]} castShadow>
              <boxGeometry args={[2, archHeight, 3]} />
              <meshStandardMaterial color="#8B7B6B" roughness={0.9} />
            </mesh>
            {/* Stone texture blocks */}
            {Array.from({ length: 4 }).map((_, j) => (
              <mesh key={j} position={[x + (i === 0 ? 0.5 : -0.5), 1 + j * 1.6, 0.5]}>
                <boxGeometry args={[0.8, 0.6, 0.3]} />
                <meshStandardMaterial color={j % 2 === 0 ? "#7a7a7a" : "#5a5a5a"} roughness={0.95} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Arch top - curved stone header */}
        <mesh position={[0, archHeight + 0.5, 0]} castShadow>
          <boxGeometry args={[width + 5, 2, 3]} />
          <meshStandardMaterial color="#7A6A5A" roughness={0.9} />
        </mesh>
        {/* Keystone */}
        <mesh position={[0, archHeight + 1.3, 1]}>
          <boxGeometry args={[2, 1.5, 0.6]} />
          <meshStandardMaterial color="#888" roughness={0.8} />
        </mesh>
        {/* Entrance warning stripes */}
        {[-width / 2 - 1.2, width / 2 + 1.2].map((x, i) => (
          <group key={`warn-${i}`}>
            {Array.from({ length: 3 }).map((_, j) => (
              <mesh key={j} position={[x, 0.5 + j * 0.6, 1.6]}>
                <boxGeometry args={[0.4, 0.25, 0.05]} />
                <meshStandardMaterial color={j % 2 === 0 ? "#FFD700" : "#111"} emissive={j % 2 === 0 ? "#FFD700" : "#000"} emissiveIntensity={j % 2 === 0 ? 0.3 : 0} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ===== TUNNEL ENTRANCE - BACK ===== */}
      <group position={[0, 0, -length / 2]}>
        {[-width / 2 - 0.5, width / 2 + 0.5].map((x, i) => (
          <group key={`bpillar-${i}`}>
            <mesh position={[x, archHeight / 2, 0]} castShadow>
              <boxGeometry args={[2, archHeight, 3]} />
              <meshStandardMaterial color="#8B7B6B" roughness={0.9} />
            </mesh>
            {Array.from({ length: 4 }).map((_, j) => (
              <mesh key={j} position={[x + (i === 0 ? 0.5 : -0.5), 1 + j * 1.6, -0.5]}>
                <boxGeometry args={[0.8, 0.6, 0.3]} />
                <meshStandardMaterial color={j % 2 === 0 ? "#7a7a7a" : "#5a5a5a"} roughness={0.95} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, archHeight + 0.5, 0]} castShadow>
          <boxGeometry args={[width + 5, 2, 3]} />
          <meshStandardMaterial color="#7A6A5A" roughness={0.9} />
        </mesh>
      </group>

      {/* ===== TUNNEL INTERIOR ===== */}
      {/* Floor - paved road */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.85} />
      </mesh>
      {/* Road lane markings */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, length - 4]} />
        <meshStandardMaterial color="#cccc44" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>

      {/* Concrete walls */}
      {[-width / 2, width / 2].map((x, i) => (
        <group key={`wall-${i}`}>
          {/* Lower wall - darker concrete */}
          <mesh position={[x, 1.5, 0]}>
            <boxGeometry args={[0.8, 3, length]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
          </mesh>
          {/* Upper wall */}
          <mesh position={[x, archHeight / 2 + 1.5, 0]}>
            <boxGeometry args={[0.6, archHeight - 3, length]} />
            <meshStandardMaterial color="#555" roughness={0.85} />
          </mesh>
          {/* Wall base curb */}
          <mesh position={[x + (i === 0 ? 0.3 : -0.3), 0.15, 0]}>
            <boxGeometry args={[0.3, 0.3, length]} />
            <meshStandardMaterial color="#666" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Arched ceiling */}
      <mesh position={[0, archHeight, 0]}>
        <boxGeometry args={[width + 1, 0.8, length]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.95} />
      </mesh>

      {/* ===== LED STRIP LIGHTS (animated chase pattern) ===== */}
      {/* Left wall LED strip - green */}
      <TunnelLEDStrip
        position={[-width / 2 + 0.5, archHeight - 1, 0]}
        count={Math.floor(length / 2)}
        spacing={2}
        color="#00ff88"
      />
      {/* Right wall LED strip - blue */}
      <TunnelLEDStrip
        position={[width / 2 - 0.5, archHeight - 1, 0]}
        count={Math.floor(length / 2)}
        spacing={2}
        color="#4488ff"
      />
      {/* Ceiling center strip - white */}
      <TunnelLEDStrip
        position={[0, archHeight - 0.3, 0]}
        count={Math.floor(length / 1.5)}
        spacing={1.5}
        color="#ffffff"
      />

      {/* Overhead fluorescent light fixtures */}
      {Array.from({ length: Math.floor(length / 6) }).map((_, i) => (
        <group key={`fixture-${i}`} position={[0, archHeight - 0.5, -length / 2 + 3 + i * 6]}>
          {/* Housing */}
          <mesh>
            <boxGeometry args={[3, 0.12, 0.5]} />
            <meshStandardMaterial color="#ddd" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Light tube */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[2.5, 0.06, 0.15]} />
            <meshStandardMaterial color="#ffffee" emissive="#ffffcc" emissiveIntensity={0.8} />
          </mesh>
          <pointLight color="#ffffdd" intensity={0.6} distance={8} position={[0, -0.3, 0]} />
        </group>
      ))}

      {/* Emergency exit signs */}
      {[-length / 3, length / 3].map((z, i) => (
        <mesh key={`exit-${i}`} position={[width / 2 - 0.8, archHeight - 1.5, z]}>
          <boxGeometry args={[0.05, 0.4, 0.8]} />
          <meshStandardMaterial color="#00aa00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Ventilation fans on ceiling */}
      {[-length / 4, length / 4].map((z, i) => (
        <mesh key={`vent-${i}`} position={[0, archHeight - 0.2, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.15, 16]} />
          <meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================
// MUD PITS - realistic mud bogging with splash particles
// =============================================

// Animated mud splash particles
function MudSplashParticles({ pitWorldPosition, radius, truckPosition }: {
  pitWorldPosition: [number, number, number];
  radius: number;
  truckPosition?: THREE.Vector3;
}) {
  const splashRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; maxLife: number }[]>([]);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!splashRef.current || !truckPosition) return;

    // Calculate truck position relative to pit center (local space of parent MudPit group)
    const dx = truckPosition.x - pitWorldPosition[0];
    const dz = truckPosition.z - pitWorldPosition[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const inPit = dist < radius;

    // Spawn new splash particles when truck is in mud
    if (inPit && particlesRef.current.length < 40) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: dx + (Math.random() - 0.5) * 3,
          y: 0.5,
          z: dz + (Math.random() - 0.5) * 3,
          vx: Math.cos(angle) * speed,
          vy: 3 + Math.random() * 6,
          vz: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.8,
        });
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.life += delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= 15 * delta; // gravity
      return p.life < p.maxLife && p.y > -0.5;
    });

    // Update mesh positions
    const children = splashRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      if (i < particlesRef.current.length) {
        const p = particlesRef.current[i];
        mesh.position.set(p.x, p.y, p.z);
        mesh.visible = true;
        const progress = p.life / p.maxLife;
        mesh.scale.setScalar(1 - progress * 0.7);
      } else {
        mesh.visible = false;
      }
    }
  });

  return (
    <group ref={splashRef}>
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.25, 6, 5]} />
          <meshStandardMaterial color="#4a3018" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Bubbling mud animation
function BubblingMud({ radius }: { radius: number }) {
  const bubblesRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!bubblesRef.current) return;
    const children = bubblesRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      const phase = (timeRef.current * 0.5 + i * 1.7) % 3;
      if (phase < 1) {
        mesh.visible = true;
        mesh.scale.setScalar(phase * 1.5);
        mesh.position.y = -0.1 + phase * 0.3;
      } else {
        mesh.visible = false;
      }
    }
  });

  return (
    <group ref={bubblesRef}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = radius * (0.2 + Math.sin(i * 3.1) * 0.3);
        return (
          <mesh key={i} position={[Math.cos(angle) * dist, 0, Math.sin(angle) * dist]} visible={false}>
            <sphereGeometry args={[0.4, 8, 6]} />
            <meshStandardMaterial color="#3a2510" transparent opacity={0.5} roughness={0.4} metalness={0.2} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function MudPit({ position, radius, truckPosition }: {
  position: [number, number, number];
  radius: number;
  truckPosition?: THREE.Vector3;
}) {
  return (
    <group position={position}>
      {/* Outer mud ring - transition from grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <circleGeometry args={[radius + 3, 36]} />
        <meshStandardMaterial color="#7A6A48" roughness={1.0} />
      </mesh>

      {/* Main mud surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <circleGeometry args={[radius, 36]} />
        <meshStandardMaterial color="#4a3520" roughness={0.85} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>

      {/* Wet mud ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <circleGeometry args={[radius * 0.8, 32]} />
        <meshStandardMaterial color="#3a2510" roughness={0.5} metalness={0.2} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>

      {/* Deep mud center - glossy wet look */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <circleGeometry args={[radius * 0.5, 28]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.2} metalness={0.35} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>

      {/* Standing water puddles in mud */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2 + 0.5;
        const dist = radius * (0.25 + Math.sin(i * 2.3) * 0.2);
        return (
          <mesh key={`puddle-${i}`} rotation={[-Math.PI / 2, 0, 0]}
            position={[Math.cos(angle) * dist, -0.12, Math.sin(angle) * dist]}>
            <circleGeometry args={[1.5 + Math.sin(i * 3.7) * 0.8, 16]} />
            <meshStandardMaterial color="#3a2a15" roughness={0.05} metalness={0.4} transparent opacity={0.7} depthWrite={false} />
          </mesh>
        );
      })}

      {/* Bubbling mud animation */}
      <BubblingMud radius={radius} />

      {/* Mud splatter sprays around edges - looks like mud was flung out */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = radius * (0.88 + Math.sin(i * 3.7) * 0.12);
        const splatterSize = 1 + Math.sin(i * 2.1) * 0.6;
        return (
          <group key={`splat-${i}`}>
            <mesh
              position={[Math.cos(angle) * dist, -0.12, Math.sin(angle) * dist]}
              rotation={[-Math.PI / 2, 0, angle]}
              receiveShadow
            >
              <circleGeometry args={[splatterSize, 16]} />
              <meshStandardMaterial color="#5a4028" roughness={0.9} />
            </mesh>
            {/* Raised splatter drops */}
            {i % 3 === 0 && (
              <mesh position={[Math.cos(angle) * (dist + splatterSize * 0.7), 0.05, Math.sin(angle) * (dist + splatterSize * 0.7)]}>
                <sphereGeometry args={[0.2, 4, 3]} />
                <meshStandardMaterial color="#4a3520" roughness={0.7} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Deep tire ruts through mud */}
      {[-3, -1, 1, 3].map((offset, i) => (
        <group key={`rut-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0.2 * (i - 1.5)]} position={[offset, -0.15, 0]} receiveShadow>
            <planeGeometry args={[1.2, radius * 1.8]} />
            <meshStandardMaterial color="#2a1808" roughness={0.5} metalness={0.1} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
          </mesh>
          {/* Rut edges - pushed up mud */}
          {[-0.7, 0.7].map((side, j) => (
            <mesh key={j} rotation={[-Math.PI / 2, 0, 0.2 * (i - 1.5)]} position={[offset + side, -0.08, 0]}>
              <planeGeometry args={[0.3, radius * 1.5]} />
              <meshStandardMaterial color="#5a4020" roughness={0.85} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Mud mound berms around edge */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const moundRadius = 2 + Math.sin(i * 1.3) * 0.8;
        return (
          <group key={`berm-${i}`}>
            <mesh position={[Math.cos(angle) * (radius + 1.5), moundRadius * 0.25, Math.sin(angle) * (radius + 1.5)]} castShadow>
              <sphereGeometry args={[moundRadius, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#8B7040" roughness={0.95} />
            </mesh>
            {/* Mud drip on berm */}
            {i % 2 === 0 && (
              <mesh position={[
                Math.cos(angle) * (radius + 0.5),
                0.1,
                Math.sin(angle) * (radius + 0.5)
              ]}>
                <sphereGeometry args={[0.4, 4, 3]} />
                <meshStandardMaterial color="#4a3518" roughness={0.6} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Mud splash particles (animated when truck is nearby) */}
      <MudSplashParticles pitWorldPosition={position} radius={radius} truckPosition={truckPosition} />

      {/* Warning sign near pit */}
      <group position={[radius + 3, 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.4, 6]} />
          <meshStandardMaterial color="#666" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1, 1, 0.05]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.15} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================
// TREES - Pine, Oak, Birch, Dead
// =============================================
function PineTree({ scale = 1, fallen = false, fallAngle = 0, fallDirection = 0 }: {
  scale?: number;
  fallen?: boolean;
  fallAngle?: number;
  fallDirection?: number;
}) {
  const trunkHeight = 6 * scale;
  const trunkRadius = 0.3 * scale;
  const tiltX = fallen ? Math.sin(fallDirection) * fallAngle : 0;
  const tiltZ = fallen ? Math.cos(fallDirection) * fallAngle : 0;

  return (
    <group rotation={[tiltX, 0, tiltZ]}>
      {/* Trunk - desert sun-bleached */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkRadius * 0.7, trunkRadius, trunkHeight, 8]} />
        <meshStandardMaterial color="#7A5530" roughness={0.9} />
      </mesh>

      {/* Foliage layers - dusty desert green */}
      {[0.55, 0.7, 0.85].map((h, i) => (
        <mesh key={i} position={[0, trunkHeight * h + i * 1.2 * scale, 0]} castShadow>
          <coneGeometry args={[(3.5 - i * 0.8) * scale, (4 - i * 0.8) * scale, 12]} />
          <meshStandardMaterial color={`hsl(${95 + i * 10}, 35%, ${25 + i * 5}%)`} roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function OakTree({ scale = 1, fallen = false, fallAngle = 0, fallDirection = 0 }: {
  scale?: number;
  fallen?: boolean;
  fallAngle?: number;
  fallDirection?: number;
}) {
  const trunkHeight = 5 * scale;
  const tiltX = fallen ? Math.sin(fallDirection) * fallAngle : 0;
  const tiltZ = fallen ? Math.cos(fallDirection) * fallAngle : 0;

  return (
    <group rotation={[tiltX, 0, tiltZ]}>
      {/* Trunk - desert weathered */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.25 * scale, 0.45 * scale, trunkHeight, 8]} />
        <meshStandardMaterial color="#8B6040" roughness={0.9} />
      </mesh>

      {/* Canopy - dusty olive green */}
      <mesh position={[0, trunkHeight + 1.5 * scale, 0]} castShadow>
        <sphereGeometry args={[3.5 * scale, 14, 10]} />
        <meshStandardMaterial color="#4A6A30" roughness={0.85} />
      </mesh>

      {/* Secondary canopy clusters */}
      {[[-1.5, 0.5], [1.2, 0.3], [0, 1.2], [-0.5, -0.8]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx * scale, trunkHeight + (1 + i * 0.3) * scale, dz * scale]} castShadow>
          <sphereGeometry args={[(2 + Math.sin(i) * 0.5) * scale, 12, 8]} />
          <meshStandardMaterial color={`hsl(${85 + i * 8}, 35%, ${24 + i * 3}%)`} roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function BirchTree({ scale = 1, fallen = false, fallAngle = 0, fallDirection = 0 }: {
  scale?: number;
  fallen?: boolean;
  fallAngle?: number;
  fallDirection?: number;
}) {
  const trunkHeight = 7 * scale;
  const tiltX = fallen ? Math.sin(fallDirection) * fallAngle : 0;
  const tiltZ = fallen ? Math.cos(fallDirection) * fallAngle : 0;

  return (
    <group rotation={[tiltX, 0, tiltZ]}>
      {/* White birch trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2 * scale, 0.3 * scale, trunkHeight, 8]} />
        <meshStandardMaterial color="#E8DCC8" roughness={0.7} />
      </mesh>

      {/* Bark marks */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0.25 * scale, 1 + i * 1.2 * scale, 0]} rotation={[0, i * 0.4, 0]}>
          <boxGeometry args={[0.15 * scale, 0.3, 0.05]} />
          <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
      ))}

      {/* Canopy - dusty sage green/gold (desert birch) */}
      <mesh position={[0, trunkHeight + scale, 0]} castShadow>
        <sphereGeometry args={[2.5 * scale, 12, 8]} />
        <meshStandardMaterial color="#8BA060" roughness={0.85} />
      </mesh>
      <mesh position={[1 * scale, trunkHeight + 0.5 * scale, 0.5 * scale]} castShadow>
        <sphereGeometry args={[1.8 * scale, 12, 8]} />
        <meshStandardMaterial color="#A0B070" roughness={0.85} />
      </mesh>
    </group>
  );
}

function DeadTree({ scale = 1, fallen = false, fallAngle = 0, fallDirection = 0 }: {
  scale?: number;
  fallen?: boolean;
  fallAngle?: number;
  fallDirection?: number;
}) {
  const trunkHeight = 5 * scale;
  const tiltX = fallen ? Math.sin(fallDirection) * fallAngle : 0;
  const tiltZ = fallen ? Math.cos(fallDirection) * fallAngle : 0;

  return (
    <group rotation={[tiltX, 0, tiltZ]}>
      {/* Dead trunk - sun-bleached desert wood */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15 * scale, 0.35 * scale, trunkHeight, 6]} />
        <meshStandardMaterial color="#9A8A70" roughness={0.95} />
      </mesh>

      {/* Dead branches */}
      {[
        { y: 0.6, angle: 0.8, length: 2 },
        { y: 0.75, angle: -0.6, length: 1.5 },
        { y: 0.85, angle: 0.5, length: 1.2 },
      ].map((branch, i) => (
        <mesh key={i}
          position={[Math.sin(i * 2) * 0.5 * scale, trunkHeight * branch.y, Math.cos(i * 2) * 0.5 * scale]}
          rotation={[branch.angle, i * 1.2, 0.3]}
          castShadow
        >
          <cylinderGeometry args={[0.04 * scale, 0.08 * scale, branch.length * scale, 5]} />
          <meshStandardMaterial color="#8A7A60" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function TreeComponent({ state }: { state: TreeState }) {
  const TreeMap = { pine: PineTree, oak: OakTree, birch: BirchTree, dead: DeadTree };
  const Tree = TreeMap[state.type];
  return (
    <group position={state.position} rotation={[0, state.rotation, 0]}>
      <Tree scale={state.scale} fallen={state.fallen} fallAngle={state.fallAngle} fallDirection={state.fallDirection} />
    </group>
  );
}

// =============================================
// ROADS - paved roads through the world
// =============================================
function Roads() {
  return (
    <group>
      {/* Main north-south road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <planeGeometry args={[14, 500]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>
      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <planeGeometry args={[0.3, 500]} />
        <meshStandardMaterial color="#cccc44" roughness={0.7} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* Edge lines */}
      {[-6.5, 6.5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.12, 0]}>
          <planeGeometry args={[0.25, 500]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      ))}

      {/* Main east-west road */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.08, 0]} receiveShadow>
        <planeGeometry args={[14, 500]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.12, 0]}>
        <planeGeometry args={[0.3, 500]} />
        <meshStandardMaterial color="#cccc44" roughness={0.7} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>

      {/* Dirt road to mud pit area */}
      <mesh rotation={[-Math.PI / 2, 0, 0.6]} position={[-40, 0.06, -30]} receiveShadow>
        <planeGeometry args={[8, 80]} />
        <meshStandardMaterial color="#A08860" roughness={0.95} />
      </mesh>

      {/* Another dirt road */}
      <mesh rotation={[-Math.PI / 2, 0, -0.3]} position={[60, 0.06, 50]} receiveShadow>
        <planeGeometry args={[7, 70]} />
        <meshStandardMaterial color="#A08860" roughness={0.95} />
      </mesh>
    </group>
  );
}

// =============================================
// ROCKS & BOULDERS scattered across landscape
// =============================================
function Rocks() {
  const rocks = useMemo(() => {
    const r: { pos: [number, number, number]; scale: number; rot: number }[] = [];
    // Seed-based deterministic positions
    for (let i = 0; i < 60; i++) {
      const angle = i * 2.39996; // golden angle
      const dist = 30 + i * 3.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const h = getTerrainHeight(x, z);
      r.push({
        pos: [x, h + 0.3, z],
        scale: 0.5 + (Math.sin(i * 7.3) * 0.5 + 0.5) * 1.5,
        rot: i * 1.7,
      });
    }
    return r;
  }, []);

  return (
    <group>
      {rocks.map((rock, i) => (
        <mesh key={i} position={rock.pos} rotation={[rock.rot * 0.3, rock.rot, 0]} castShadow>
          <dodecahedronGeometry args={[rock.scale, 0]} />
          <meshStandardMaterial color={`hsl(25, ${15 + (i % 5) * 5}%, ${42 + (i % 4) * 6}%)`} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================
// DESERT SCRUB & DRY GRASS
// =============================================
function GrassPatches() {
  const patches = useMemo(() => {
    const p: { pos: [number, number, number]; scale: number; rot: number; nearRiver: boolean }[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = i * 1.618 * Math.PI * 2;
      const dist = 20 + i * 2.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const h = getTerrainHeight(x, z);
      if (h > -0.5) {
        const riverZ = Math.sin(x * 0.02) * 30 + 10;
        const isNearRiver = Math.abs(z - riverZ) < 20;
        p.push({ pos: [x, h + 0.2, z], scale: 0.8 + Math.sin(i * 3.7) * 0.4, rot: i * 2.3, nearRiver: isNearRiver });
      }
    }
    return p;
  }, []);

  return (
    <group>
      {patches.map((patch, i) => (
        <group key={i} position={patch.pos} rotation={[0, patch.rot, 0]}>
          {/* Desert scrub blades - golden/brown, green near river */}
          {Array.from({ length: 4 }).map((_, j) => (
            <mesh key={j}
              position={[(j - 1.5) * 0.35, 0.3 * patch.scale, (j % 2) * 0.2]}
              rotation={[0.15 * Math.sin(j), 0, 0.2 * Math.cos(j * 2)]}
            >
              <boxGeometry args={[0.06, 0.6 * patch.scale, 0.02]} />
              <meshStandardMaterial
                color={patch.nearRiver
                  ? `hsl(${80 + j * 15}, 40%, ${30 + j * 4}%)`
                  : `hsl(${38 + j * 8}, ${25 + j * 5}%, ${40 + j * 5}%)`
                }
                roughness={0.9}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// =============================================
// EXISTING COMPONENTS (Preserved)
// =============================================

// Realistic Sedan
function RealisticSedan({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const roofCrush = crush * 0.6;
  const bodyDent = crush * 0.3;

  return (
    <group>
      <mesh position={[0, 0.45 - bodyDent * 0.2, 0]} castShadow>
        <boxGeometry args={[1.9, 0.5 - bodyDent * 0.15, 4.8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.55 - bodyDent * 0.3, 1.8]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[1.85, 0.08, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.52 - bodyDent * 0.25, -1.9]} rotation={[0.05, 0, 0]}>
        <boxGeometry args={[1.8, 0.08, 1.1]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.95 - roofCrush * 0.5, -0.1]} scale={[1, 1 - roofCrush * 0.7, 1]} castShadow>
        <boxGeometry args={[1.75, 0.55, 2.4]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.35} />
      </mesh>
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.8 - roofCrush * 0.3, 0.9]} rotation={[0.5, 0, x > 0 ? -0.15 : 0.15]}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      <mesh position={[0, 0.85 - roofCrush * 0.35, 1.05]} rotation={[0.45, 0, 0]}>
        <planeGeometry args={[1.65, 0.65 * (1 - crush * 0.3)]} />
        <meshStandardMaterial color={crush > 0.3 ? "#87CEEB" : "#B8D4E8"} transparent opacity={crush > 0.5 ? 0.3 : 0.85} depthWrite={false} side={THREE.DoubleSide} metalness={0.1} roughness={crush > 0.3 ? 0.8 : 0.1} />
      </mesh>
      <mesh position={[0, 0.85 - roofCrush * 0.35, -1.15]} rotation={[-0.4, 0, 0]}>
        <planeGeometry args={[1.55, 0.5 * (1 - crush * 0.3)]} />
        <meshStandardMaterial color={crush > 0.3 ? "#87CEEB" : "#B8D4E8"} transparent opacity={crush > 0.5 ? 0.25 : 0.8} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {[-0.88, 0.88].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.85 - roofCrush * 0.3, 0.3]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.9, 0.4 * (1 - crush * 0.4)]} />
            <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.2 : 0.75} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[x, 0.85 - roofCrush * 0.3, -0.5]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.38 * (1 - crush * 0.4)]} />
            <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.2 : 0.75} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {[-0.65, 0.65].map((x, i) => (
        <group key={i} position={[x, 0.45, 2.41]}>
          <mesh><boxGeometry args={[0.45, 0.18, 0.05]} /><meshStandardMaterial color="#E8E8E8" metalness={0.3} roughness={0.2} /></mesh>
          <mesh position={[0, 0, 0.03]}><circleGeometry args={[0.07, 16]} /><meshStandardMaterial color="#FFFFEE" emissive="#FFFF88" emissiveIntensity={0.4} /></mesh>
        </group>
      ))}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.5, -2.41]}><boxGeometry args={[0.35, 0.15, 0.05]} /><meshStandardMaterial color="#CC0000" emissive="#FF0000" emissiveIntensity={0.3} /></mesh>
      ))}
      <mesh position={[0, 0.35, 2.41]}><boxGeometry args={[1.2, 0.25, 0.05]} /><meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 0.38, 2.42]}><boxGeometry args={[1.0, 0.03, 0.02]} /><meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.1} /></mesh>
      <mesh position={[0, 0.2, 2.45]}><boxGeometry args={[1.95, 0.2, 0.12]} /><meshStandardMaterial color={crush > 0.2 ? "#333" : color} metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 0.22, -2.42]}><boxGeometry args={[1.9, 0.18, 0.1]} /><meshStandardMaterial color={crush > 0.2 ? "#333" : color} metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 0.28, -2.43]}><boxGeometry args={[0.35, 0.12, 0.02]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
      {[-1.0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0.75 - roofCrush * 0.2, 0.85]}>
          <mesh><boxGeometry args={[0.12, 0.08, 0.15]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[x > 0 ? 0.03 : -0.03, 0, 0]}><planeGeometry args={[0.08, 0.06]} /><meshStandardMaterial color="#88AACC" metalness={0.9} roughness={0.1} /></mesh>
        </group>
      ))}
      {[-0.96, 0.96].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.55, 0.4]}><boxGeometry args={[0.02, 0.04, 0.12]} /><meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} /></mesh>
          <mesh position={[x, 0.55, -0.45]}><boxGeometry args={[0.02, 0.04, 0.12]} /><meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} /></mesh>
        </group>
      ))}
      {([[-0.85, 0.32, 1.45], [0.85, 0.32, 1.45], [-0.85, 0.32, -1.35], [0.85, 0.32, -1.35]] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.32, 0.32, 0.22, 24]} /><meshStandardMaterial color="#1a1a1a" roughness={0.9} /></mesh>
          <mesh position={[pos[0] > 0 ? 0.12 : -0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, 0.03, 16]} /><meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.1} /></mesh>
        </group>
      ))}
      {crush > 0.3 && Array.from({ length: Math.floor(crush * 15) }).map((_, i) => (
        <mesh key={i} position={[(seededRandom(i * 3) - 0.5) * 2, 0.1 + seededRandom(i * 3 + 1) * 0.3, (seededRandom(i * 3 + 2) - 0.5) * 3]} rotation={[seededRandom(i * 5) * Math.PI, seededRandom(i * 5 + 1) * Math.PI, seededRandom(i * 5 + 2) * Math.PI]}>
          <boxGeometry args={[0.05, 0.05, 0.01]} /><meshStandardMaterial color="#88CCEE" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Realistic SUV
function RealisticSUV({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const roofCrush = crush * 0.5;
  return (
    <group>
      <mesh position={[0, 0.55 - crush * 0.15, 0]} castShadow><boxGeometry args={[2.0, 0.7, 4.9]} /><meshStandardMaterial color={color} metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[0, 0.75 - crush * 0.2, 1.85]} rotation={[-0.05, 0, 0]}><boxGeometry args={[1.95, 0.08, 1.3]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 1.25 - roofCrush * 0.6, -0.3]} scale={[1, 1 - roofCrush * 0.6, 1]} castShadow><boxGeometry args={[1.9, 0.65, 2.8]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 1.15 - roofCrush * 0.4, 1.0]} rotation={[0.35, 0, 0]}><planeGeometry args={[1.75, 0.75 * (1 - crush * 0.3)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.3 : 0.8} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.15 - roofCrush * 0.4, -1.65]} rotation={[-0.25, 0, 0]}><planeGeometry args={[1.7, 0.6 * (1 - crush * 0.3)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.25 : 0.75} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {[-0.96, 0.96].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.1 - roofCrush * 0.35, 0.2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.0, 0.5 * (1 - crush * 0.35)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.2 : 0.7} depthWrite={false} side={THREE.DoubleSide} /></mesh>
          <mesh position={[x, 1.1 - roofCrush * 0.35, -0.9]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.9, 0.5 * (1 - crush * 0.35)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.2 : 0.7} depthWrite={false} side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
      {[-0.7, 0.7].map((x, i) => (<mesh key={i} position={[x, 0.6, 2.46]}><boxGeometry args={[0.5, 0.22, 0.05]} /><meshStandardMaterial color="#E0E0E0" emissive="#FFFFAA" emissiveIntensity={0.3} /></mesh>))}
      <mesh position={[0, 0.45, 2.46]}><boxGeometry args={[1.3, 0.35, 0.05]} /><meshStandardMaterial color="#222222" metalness={0.7} roughness={0.4} /></mesh>
      <mesh position={[0, 0.22, 2.5]}><boxGeometry args={[2.05, 0.25, 0.15]} /><meshStandardMaterial color="#333333" roughness={0.8} /></mesh>
      <mesh position={[0, 0.25, -2.46]}><boxGeometry args={[2.0, 0.22, 0.12]} /><meshStandardMaterial color="#333333" roughness={0.8} /></mesh>
      {[-0.75, 0.75].map((x, i) => (<mesh key={i} position={[x, 0.7, -2.46]}><boxGeometry args={[0.4, 0.25, 0.05]} /><meshStandardMaterial color="#CC0000" emissive="#FF0000" emissiveIntensity={0.35} /></mesh>))}
      {[-0.85, 0.85].map((x, i) => (<mesh key={i} position={[x, 1.55 - roofCrush * 0.5, -0.3]}><boxGeometry args={[0.06, 0.08, 2.5]} /><meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} /></mesh>))}
      {([[-0.9, 0.38, 1.5], [0.9, 0.38, 1.5], [-0.9, 0.38, -1.4], [0.9, 0.38, -1.4]] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.38, 0.38, 0.26, 24]} /><meshStandardMaterial color="#1a1a1a" roughness={0.92} /></mesh>
          <mesh position={[pos[0] > 0 ? 0.14 : -0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.24, 0.24, 0.03, 16]} /><meshStandardMaterial color="#A0A0A0" metalness={0.9} roughness={0.15} /></mesh>
        </group>
      ))}
      {crush > 0.25 && Array.from({ length: Math.floor(crush * 12) }).map((_, i) => (
        <mesh key={i} position={[(seededRandom(i * 3 + 100) - 0.5) * 2.2, 0.15 + seededRandom(i * 3 + 101) * 0.4, (seededRandom(i * 3 + 102) - 0.5) * 3.5]} rotation={[seededRandom(i * 5 + 100) * Math.PI, seededRandom(i * 5 + 101) * Math.PI, 0]}><boxGeometry args={[0.06, 0.06, 0.015]} /><meshStandardMaterial color="#99CCDD" transparent opacity={0.5} depthWrite={false} /></mesh>
      ))}
    </group>
  );
}

// Realistic Pickup Truck
function RealisticPickup({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const cabCrush = crush * 0.55;
  return (
    <group>
      <mesh position={[0, 0.6 - crush * 0.1, 1.2]} castShadow><boxGeometry args={[2.1, 0.65, 2.2]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 1.15 - cabCrush * 0.5, 1.0]} scale={[1, 1 - cabCrush * 0.6, 1]} castShadow><boxGeometry args={[2.0, 0.5, 1.8]} /><meshStandardMaterial color={color} metalness={0.55} roughness={0.45} /></mesh>
      <mesh position={[0, 0.5, -1.3]} castShadow><boxGeometry args={[2.05, 0.5, 2.6]} /><meshStandardMaterial color={color} metalness={0.55} roughness={0.45} /></mesh>
      <mesh position={[0, 0.55, -1.3]}><boxGeometry args={[1.85, 0.45, 2.4]} /><meshStandardMaterial color="#2a2a2a" roughness={0.95} /></mesh>
      {[-0.95, 0.95].map((x, i) => (<mesh key={i} position={[x, 0.8, -1.3]}><boxGeometry args={[0.12, 0.1, 2.5]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.4} /></mesh>))}
      <mesh position={[0, 0.55, -2.55]}><boxGeometry args={[1.9, 0.5, 0.08]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 0.72, 2.1]} rotation={[-0.06, 0, 0]}><boxGeometry args={[2.0, 0.1, 0.9]} /><meshStandardMaterial color={color} metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 1.05 - cabCrush * 0.35, 1.85]} rotation={[0.4, 0, 0]}><planeGeometry args={[1.85, 0.7 * (1 - crush * 0.35)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.3 : 0.8} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.0 - cabCrush * 0.3, 0.12]}><planeGeometry args={[1.75, 0.45 * (1 - crush * 0.35)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.25 : 0.75} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {[-1.01, 1.01].map((x, i) => (<mesh key={i} position={[x, 1.0 - cabCrush * 0.3, 1.0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.2, 0.45 * (1 - crush * 0.3)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.3 ? 0.2 : 0.7} depthWrite={false} side={THREE.DoubleSide} /></mesh>))}
      {[-0.75, 0.75].map((x, i) => (<mesh key={i} position={[x, 0.55, 2.56]}><boxGeometry args={[0.45, 0.2, 0.05]} /><meshStandardMaterial color="#E8E8E8" emissive="#FFFFAA" emissiveIntensity={0.35} /></mesh>))}
      <mesh position={[0, 0.42, 2.56]}><boxGeometry args={[1.4, 0.35, 0.06]} /><meshStandardMaterial color="#1a1a1a" metalness={0.75} roughness={0.35} /></mesh>
      {[-0.3, 0, 0.3].map((y, i) => (<mesh key={i} position={[0, 0.35 + y * 0.25, 2.57]}><boxGeometry args={[1.2, 0.04, 0.02]} /><meshStandardMaterial color="#C8C8C8" metalness={0.95} roughness={0.1} /></mesh>))}
      <mesh position={[0, 0.22, 2.6]}><boxGeometry args={[2.15, 0.22, 0.15]} /><meshStandardMaterial color="#A0A0A0" metalness={0.9} roughness={0.15} /></mesh>
      <mesh position={[0, 0.25, -2.6]}><boxGeometry args={[2.1, 0.2, 0.12]} /><meshStandardMaterial color="#808080" metalness={0.85} roughness={0.2} /></mesh>
      {[-0.8, 0.8].map((x, i) => (<mesh key={i} position={[x, 0.6, -2.56]}><boxGeometry args={[0.35, 0.25, 0.05]} /><meshStandardMaterial color="#CC0000" emissive="#FF0000" emissiveIntensity={0.4} /></mesh>))}
      {([[-0.95, 0.4, 1.6], [0.95, 0.4, 1.6], [-0.95, 0.4, -1.5], [0.95, 0.4, -1.5]] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.4, 0.4, 0.28, 24]} /><meshStandardMaterial color="#1a1a1a" roughness={0.93} /></mesh>
          <mesh position={[pos[0] > 0 ? 0.15 : -0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.25, 0.25, 0.04, 16]} /><meshStandardMaterial color="#B0B0B0" metalness={0.92} roughness={0.12} /></mesh>
        </group>
      ))}
      {crush > 0.3 && Array.from({ length: Math.floor(crush * 10) }).map((_, i) => (
        <mesh key={i} position={[(seededRandom(i * 3 + 200) - 0.5) * 2.3, 0.1 + seededRandom(i * 3 + 201) * 0.35, (seededRandom(i * 3 + 202) - 0.5) * 4]} rotation={[seededRandom(i * 5 + 200) * Math.PI, seededRandom(i * 5 + 201) * Math.PI, 0]}><boxGeometry args={[0.055, 0.055, 0.012]} /><meshStandardMaterial color="#99CCDD" transparent opacity={0.55} depthWrite={false} /></mesh>
      ))}
    </group>
  );
}

// Sports Car
function RealisticSportsCar({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const roofCrush = crush * 0.65;
  return (
    <group>
      <mesh position={[0, 0.35 - crush * 0.1, 0]} castShadow><boxGeometry args={[1.95, 0.4, 4.6]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, 0.45 - crush * 0.15, 1.5]} rotation={[-0.05, 0, 0]}><boxGeometry args={[1.9, 0.08, 1.8]} /><meshStandardMaterial color={color} metalness={0.85} roughness={0.15} /></mesh>
      <mesh position={[0, 0.52 - crush * 0.15, 1.3]}><boxGeometry args={[0.4, 0.1, 0.6]} /><meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} /></mesh>
      <mesh position={[0, 0.7 - roofCrush * 0.4, -0.4]} scale={[1, 1 - roofCrush * 0.65, 1]} castShadow><boxGeometry args={[1.8, 0.45, 1.8]} /><meshStandardMaterial color={color} metalness={0.75} roughness={0.25} /></mesh>
      <mesh position={[0, 0.42 - crush * 0.12, -1.8]}><boxGeometry args={[1.85, 0.3, 1.2]} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, 0.6 - crush * 0.2, -2.2]}><boxGeometry args={[1.7, 0.06, 0.25]} /><meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} /></mesh>
      <mesh position={[0, 0.52 - crush * 0.18, -2.15]}><boxGeometry args={[0.08, 0.15, 0.15]} /><meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} /></mesh>
      <mesh position={[0, 0.65 - roofCrush * 0.3, 0.55]} rotation={[0.55, 0, 0]}><planeGeometry args={[1.7, 0.55 * (1 - crush * 0.35)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.3 : 0.85} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.62 - roofCrush * 0.3, -1.2]} rotation={[-0.5, 0, 0]}><planeGeometry args={[1.6, 0.4 * (1 - crush * 0.35)]} /><meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.25 : 0.8} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {[-0.7, 0.7].map((x, i) => (<mesh key={i} position={[x, 0.35, 2.31]} rotation={[0, 0, x > 0 ? -0.1 : 0.1]}><boxGeometry args={[0.5, 0.12, 0.05]} /><meshStandardMaterial color="#E0E0E0" emissive="#FFFFFF" emissiveIntensity={0.45} /></mesh>))}
      <mesh position={[0, 0.4, -2.31]}><boxGeometry args={[1.6, 0.08, 0.05]} /><meshStandardMaterial color="#AA0000" emissive="#FF0000" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0, 0.12, 2.35]}><boxGeometry args={[2.0, 0.06, 0.2]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      {[-0.98, 0.98].map((x, i) => (<mesh key={i} position={[x, 0.15, 0]}><boxGeometry args={[0.06, 0.12, 3.8]} /><meshStandardMaterial color="#1a1a1a" /></mesh>))}
      {([[-0.88, 0.3, 1.4], [0.88, 0.3, 1.4], [-0.88, 0.3, -1.3], [0.88, 0.3, -1.3]] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.24, 24]} /><meshStandardMaterial color="#1a1a1a" roughness={0.88} /></mesh>
          <mesh position={[pos[0] > 0 ? 0.13 : -0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.03, 5]} /><meshStandardMaterial color="#2a2a2a" metalness={0.95} roughness={0.1} /></mesh>
        </group>
      ))}
      {crush > 0.35 && Array.from({ length: Math.floor(crush * 14) }).map((_, i) => (
        <mesh key={i} position={[(seededRandom(i * 3 + 300) - 0.5) * 2, 0.08 + seededRandom(i * 3 + 301) * 0.25, (seededRandom(i * 3 + 302) - 0.5) * 3.5]} rotation={[seededRandom(i * 5 + 300) * Math.PI, seededRandom(i * 5 + 301) * Math.PI, 0]}><boxGeometry args={[0.045, 0.045, 0.01]} /><meshStandardMaterial color="#88CCEE" transparent opacity={0.55} depthWrite={false} /></mesh>
      ))}
    </group>
  );
}

// Wrapper component for cars with damage state
function CrushableCar({ state }: { state: CarState; onCrush: (id: string, damage: number) => void }) {
  const CarComponent = {
    sedan: RealisticSedan,
    suv: RealisticSUV,
    pickup: RealisticPickup,
    sports: RealisticSportsCar,
    minivan: RealisticSedan,
    hatchback: RealisticSedan,
  }[state.type];

  return (
    <group position={state.position} rotation={[0, state.rotation, 0]}>
      <CarComponent color={state.color} damage={state.damage} />
    </group>
  );
}

// Dirt ramp
function DirtRamp({ position, rotation = 0, size = 'medium' }: {
  position: [number, number, number];
  rotation?: number;
  size?: 'small' | 'medium' | 'large';
}) {
  const scales = { small: { radius: 6, height: 3 }, medium: { radius: 9, height: 4.5 }, large: { radius: 12, height: 6 } };
  const { radius, height } = scales[size];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main dirt mound - layered for realistic strata look */}
      <mesh castShadow receiveShadow position={[0, height * 0.35, 0]}>
        <coneGeometry args={[radius, height * 0.7, 24]} />
        <meshStandardMaterial color="#9B7A2A" roughness={0.98} />
      </mesh>
      {/* Upper steeper section */}
      <mesh castShadow position={[0, height * 0.6, 0]}>
        <coneGeometry args={[radius * 0.65, height * 0.55, 20]} />
        <meshStandardMaterial color="#7a5a10" roughness={0.95} />
      </mesh>
      {/* Top cap - packed dirt */}
      <mesh position={[0, height * 0.8, 0]} castShadow>
        <coneGeometry args={[radius * 0.3, height * 0.25, 16]} />
        <meshStandardMaterial color="#6B4D0A" roughness={1.0} />
      </mesh>
      {/* Flattened top for launching */}
      <mesh position={[0, height - 0.1, 0]}>
        <cylinderGeometry args={[radius * 0.2, radius * 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#5a4008" roughness={1.0} />
      </mesh>

      {/* Dirt strata layers visible on sides */}
      {[0.2, 0.4, 0.55, 0.7].map((h, i) => (
        <mesh key={`strata-${i}`} position={[0, height * h, 0]}>
          <torusGeometry args={[radius * (1 - h * 0.7), 0.12, 4, 24]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#6a4a08' : '#9a7520'} roughness={1.0} />
        </mesh>
      ))}

      {/* Base erosion - scattered dirt at the bottom */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const dist = radius * (0.9 + Math.sin(i * 4.3) * 0.2);
        return (
          <mesh key={`erode-${i}`} position={[Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist]} castShadow>
            <sphereGeometry args={[0.6 + Math.sin(i * 2.1) * 0.3, 6, 4]} />
            <meshStandardMaterial color="#7a6020" roughness={1.0} />
          </mesh>
        );
      })}

      {/* Tire ruts going up the ramp */}
      {[-1.2, 1.2].map((offset, i) => (
        <group key={`rut-${i}`}>
          {Array.from({ length: 5 }).map((_, j) => {
            const t = j / 5;
            const rutDist = radius * (1 - t * 0.8);
            return (
              <mesh key={j} position={[offset, height * t * 0.6 + 0.1, rutDist * 0.7]} rotation={[-0.5 - t * 0.3, 0, 0]}>
                <boxGeometry args={[0.5, 0.08, 1.2]} />
                <meshStandardMaterial color="#5a4008" roughness={1.0} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Loose dirt/gravel patches around base */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + 0.3;
        const dist = radius + 1.5 + Math.sin(i * 3.7) * 1.5;
        return (
          <mesh key={`gravel-${i}`} position={[Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist]} rotation={[-Math.PI / 2, 0, angle]}>
            <circleGeometry args={[1.5 + Math.sin(i * 2) * 0.5, 8]} />
            <meshStandardMaterial color="#8a7030" roughness={1.0} transparent opacity={0.7} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// Tire stack
function TireStack({ position, height = 4 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: height }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.5 + 0.25, 0]} rotation={[Math.PI / 2, 0, i * 0.2]}>
          <torusGeometry args={[0.8, 0.35, 8, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.98} />
        </mesh>
      ))}
    </group>
  );
}

// Arena barrier (now used as world edge barriers)
function ArenaBarrier({ position, length, rotation = 0 }: {
  position: [number, number, number];
  length: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[length, 3, 2]} />
        <meshStandardMaterial color="#8B8070" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[length, 0.4, 2.1]} />
        <meshStandardMaterial color="#E07020" roughness={0.7} />
      </mesh>
    </group>
  );
}

// =============================================
// BUILDINGS - basic structures scattered around
// =============================================
function Building({ position, width = 8, height = 10, depth = 8, color = '#888' }: {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
}) {
  // Deterministic seed from position for variety
  const seed = Math.abs(position[0] * 7 + position[2] * 13);
  const hasBalcony = seed % 3 === 0;
  const hasPatio = seed % 4 === 0;
  const wallTrim = seed % 2 === 0;
  const numFloors = Math.max(1, Math.floor(height / 3.2));
  const winsPerFloor = Math.max(1, Math.floor(width / 3));

  return (
    <group position={position}>
      {/* Foundation / base - slightly wider, dark */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.6, 0.5, depth + 0.6]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>

      {/* Main structure - adobe stucco */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Decorative horizontal trim band at top */}
      <mesh position={[0, height - 0.3, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.35, depth + 0.2]} />
        <meshStandardMaterial color="#A0845A" roughness={0.8} />
      </mesh>

      {/* Flat roof with parapet (southwest style) */}
      <mesh position={[0, height + 0.15, 0]} castShadow>
        <boxGeometry args={[width + 0.4, 0.3, depth + 0.4]} />
        <meshStandardMaterial color="#7A6548" roughness={0.9} />
      </mesh>
      {/* Parapet walls (low wall on roof edges) */}
      {[
        [0, height + 0.6, depth / 2 + 0.15, width + 0.4, 0.6, 0.3],
        [0, height + 0.6, -depth / 2 - 0.15, width + 0.4, 0.6, 0.3],
        [width / 2 + 0.15, height + 0.6, 0, 0.3, 0.6, depth],
        [-width / 2 - 0.15, height + 0.6, 0, 0.3, 0.6, depth],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`par-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}

      {/* Windows - both sides + front, with frames and sills */}
      {[-1, 1].map((side, sIdx) =>
        Array.from({ length: numFloors }).map((_, floor) =>
          Array.from({ length: winsPerFloor }).map((_, win) => {
            const wx = side * (width / 2 + 0.02);
            const wy = 1.8 + floor * 3.2;
            const wz = ((win + 0.5) / winsPerFloor - 0.5) * (depth - 2);
            const lit = seededRandom(sIdx * 100 + floor * 10 + win) > 0.4;
            return (
              <group key={`w-${sIdx}-${floor}-${win}`} position={[wx, wy, wz]} rotation={[0, Math.PI / 2, 0]}>
                {/* Window frame - slightly inset into wall */}
                <mesh position={[0, 0, -0.03]}>
                  <boxGeometry args={[1.4, 1.8, 0.12]} />
                  <meshStandardMaterial color="#5A4838" roughness={0.9} />
                </mesh>
                {/* Glass pane */}
                <mesh position={[0, 0, 0.02]}>
                  <planeGeometry args={[1.1, 1.5]} />
                  <meshPhysicalMaterial
                    color={lit ? '#6a8aaa' : '#3a5a7a'}
                    transparent
                    opacity={0.7}
                    metalness={0.4}
                    roughness={0.05}
                    emissive={lit ? '#445566' : '#1a2a3a'}
                    emissiveIntensity={lit ? 0.3 : 0.05}
                    depthWrite={false}
                  />
                </mesh>
                {/* Window sill */}
                <mesh position={[0, -0.9, 0.06]}>
                  <boxGeometry args={[1.5, 0.12, 0.25]} />
                  <meshStandardMaterial color="#8A7A6A" roughness={0.85} />
                </mesh>
                {/* Cross divider (paned window) */}
                <mesh position={[0, 0, 0.03]}>
                  <boxGeometry args={[0.06, 1.5, 0.04]} />
                  <meshStandardMaterial color="#5A4838" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0, 0.03]}>
                  <boxGeometry args={[1.1, 0.06, 0.04]} />
                  <meshStandardMaterial color="#5A4838" roughness={0.8} />
                </mesh>
              </group>
            );
          })
        )
      )}

      {/* Front windows */}
      {Array.from({ length: numFloors }).map((_, floor) =>
        Array.from({ length: Math.max(1, Math.floor(width / 3.5)) }).map((_, win) => {
          const wy = 1.8 + floor * 3.2;
          const winCount = Math.max(1, Math.floor(width / 3.5));
          const wx = ((win + 0.5) / winCount - 0.5) * (width - 2.5);
          const lit = seededRandom(200 + floor * 10 + win) > 0.5;
          return (
            <group key={`fw-${floor}-${win}`} position={[wx, wy, depth / 2 + 0.02]}>
              {/* Frame */}
              <mesh position={[0, 0, -0.03]}>
                <boxGeometry args={[1.4, 1.8, 0.12]} />
                <meshStandardMaterial color="#5A4838" roughness={0.9} />
              </mesh>
              {/* Glass */}
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[1.1, 1.5]} />
                <meshPhysicalMaterial
                  color={lit ? '#6a8aaa' : '#3a5a7a'}
                  transparent opacity={0.7} metalness={0.4} roughness={0.05}
                  emissive={lit ? '#445566' : '#1a2a3a'}
                  emissiveIntensity={lit ? 0.3 : 0.05}
                  depthWrite={false}
                />
              </mesh>
              {/* Sill */}
              <mesh position={[0, -0.9, 0.06]}>
                <boxGeometry args={[1.5, 0.12, 0.25]} />
                <meshStandardMaterial color="#8A7A6A" roughness={0.85} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Door with archway (Southwest style) */}
      <group position={[0, 0, depth / 2 + 0.02]}>
        {/* Door recess */}
        <mesh position={[0, 1.6, -0.1]}>
          <boxGeometry args={[2.2, 3.2, 0.25]} />
          <meshStandardMaterial color="#6A5A4A" roughness={0.9} />
        </mesh>
        {/* Door panel */}
        <mesh position={[0, 1.5, 0.01]}>
          <planeGeometry args={[1.8, 2.8]} />
          <meshStandardMaterial color="#5A3E28" roughness={0.85} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.6, 1.5, 0.06]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#B8860B" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Archway above door */}
        <mesh position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.15, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#7A6548" roughness={0.8} />
        </mesh>
      </group>

      {/* Optional balcony on second floor */}
      {hasBalcony && numFloors >= 2 && (
        <group position={[0, 3.2 + 3.2, depth / 2]}>
          {/* Balcony floor */}
          <mesh position={[0, 0, 0.8]} castShadow>
            <boxGeometry args={[3, 0.15, 1.6]} />
            <meshStandardMaterial color="#8A7A6A" roughness={0.85} />
          </mesh>
          {/* Railing posts */}
          {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
            <mesh key={`rail-${i}`} position={[x, 0.5, 1.5]}>
              <boxGeometry args={[0.08, 1, 0.08]} />
              <meshStandardMaterial color="#6A5540" roughness={0.8} />
            </mesh>
          ))}
          {/* Railing top */}
          <mesh position={[0, 1, 1.5]}>
            <boxGeometry args={[3, 0.1, 0.12]} />
            <meshStandardMaterial color="#6A5540" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Optional ground-level patio cover with posts */}
      {hasPatio && (
        <group position={[0, 0, depth / 2 + 1.5]}>
          {/* Patio roof */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[width * 0.7, 0.12, 2.5]} />
            <meshStandardMaterial color="#7A6040" roughness={0.9} />
          </mesh>
          {/* Support posts (vigas) */}
          {[-(width * 0.3), width * 0.3].map((x, i) => (
            <mesh key={`post-${i}`} position={[x, 1.6, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 3.2, 6]} />
              <meshStandardMaterial color="#7A6040" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* Wall trim / decorative band (if applicable) */}
      {wallTrim && (
        <mesh position={[0, height * 0.55, 0]}>
          <boxGeometry args={[width + 0.15, 0.2, depth + 0.15]} />
          <meshStandardMaterial color="#9A8A6A" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}

// =============================================
// POWER LINES along roads
// =============================================
function PowerLines() {
  const poles: [number, number, number][] = [];
  for (let z = -200; z <= 200; z += 40) {
    poles.push([18, 0, z]);
  }

  return (
    <group>
      {poles.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Pole */}
          <mesh position={[0, 5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 10, 6]} />
            <meshStandardMaterial color="#8B7050" roughness={0.9} />
          </mesh>
          {/* Cross arm */}
          <mesh position={[0, 9.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 4, 4]} />
            <meshStandardMaterial color="#8B7050" roughness={0.9} />
          </mesh>
          {/* Insulators */}
          {[-1.5, 0, 1.5].map((x, j) => (
            <mesh key={j} position={[x, 9.8, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 0.3, 6]} />
              <meshStandardMaterial color="#4a7a7a" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Wires between poles */}
      {poles.slice(0, -1).map((pos, i) => {
        const next = poles[i + 1];
        return [-1.5, 0, 1.5].map((offset, j) => (
          <mesh key={`${i}-${j}`} position={[(pos[0] + next[0]) / 2 + offset, 9.5, (pos[2] + next[2]) / 2]}>
            <boxGeometry args={[0.02, 0.02, 40]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        ));
      })}
    </group>
  );
}

// =============================================
// GENERATE TREES
// =============================================
function generateTrees(): TreeState[] {
  const trees: TreeState[] = [];
  // Desert tree distribution: more dead trees, sparse oaks near river, hardy pines
  const desertTypes: TreeState['type'][] = ['dead', 'pine', 'dead', 'oak', 'dead', 'dead', 'pine', 'birch'];

  // Sparser desert clusters + oasis trees near river
  const clusters = [
    { cx: -120, cz: -80, count: 12, radius: 40 },   // Southwest sparse
    { cx: 130, cz: 70, count: 10, radius: 35 },     // Northeast sparse
    { cx: -60, cz: 140, count: 8, radius: 30 },     // North sparse
    { cx: 150, cz: -120, count: 7, radius: 25 },    // Southeast sparse
    { cx: -160, cz: 50, count: 8, radius: 30 },     // West sparse
    { cx: 50, cz: -150, count: 6, radius: 25 },     // South cluster
  ];

  let id = 0;
  for (const cluster of clusters) {
    for (let i = 0; i < cluster.count; i++) {
      const angle = (i / cluster.count) * Math.PI * 2 + Math.sin(i * 7.3) * 0.5;
      const dist = (0.2 + Math.sin(i * 3.7) * 0.5 + 0.5) * cluster.radius;
      const x = cluster.cx + Math.cos(angle) * dist;
      const z = cluster.cz + Math.sin(angle) * dist;

      // Don't place trees on roads
      if (Math.abs(x) < 10 || Math.abs(z) < 10) continue;
      // Don't place in river
      const riverZ = Math.sin(x * 0.02) * 30 + 10;
      if (Math.abs(z - riverZ) < 15) continue;

      const h = getTerrainHeight(x, z);
      // Near river = more green trees (oasis), far = more dead
      const riverZ2 = Math.sin(x * 0.02) * 30 + 10;
      const riverDist2 = Math.abs(z - riverZ2);
      const isOasis = riverDist2 < 25;
      const oasisTypes: TreeState['type'][] = ['oak', 'birch', 'pine', 'oak'];
      trees.push({
        id: `tree-${id++}`,
        position: [x, h, z],
        rotation: i * 2.39996,
        type: isOasis ? oasisTypes[i % oasisTypes.length] : desertTypes[i % desertTypes.length],
        scale: 0.7 + Math.sin(i * 5.3) * 0.3 + 0.3,
        fallen: false,
        fallAngle: 0,
        fallDirection: 0,
      });
    }
  }

  // Scattered individual trees along roads
  for (let i = 0; i < 30; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const along = -180 + i * 12;
    const perpOffset = (22 + Math.sin(i * 4.1) * 8) * side;
    const isAlongX = i % 4 < 2;
    const x = isAlongX ? along : perpOffset;
    const z = isAlongX ? perpOffset : along;

    // Skip roads & river
    if (Math.abs(x) < 10 && Math.abs(z) < 200) continue;
    if (Math.abs(z) < 10 && Math.abs(x) < 200) continue;
    const riverZ = Math.sin(x * 0.02) * 30 + 10;
    if (Math.abs(z - riverZ) < 15) continue;

    const h = getTerrainHeight(x, z);
    trees.push({
      id: `tree-${id++}`,
      position: [x, h, z],
      rotation: i * 1.7,
      type: desertTypes[(i * 3) % desertTypes.length],
      scale: 0.8 + Math.sin(i * 2.7) * 0.4,
      fallen: false,
      fallAngle: 0,
      fallDirection: 0,
    });
  }

  return trees;
}

// =============================================
// INITIAL CARS - spread across the larger world
// =============================================
// Helper to place cars at terrain height
function carAt(id: string, x: number, z: number, rotation: number, color: string, type: CarType): CarState {
  const h = Math.max(0, getTerrainHeight(x, z));
  return { id, position: [x, h, z], rotation, color, type, damage: 0 };
}

const initialCars: CarState[] = [
  // Parking lot near center
  carAt('c1', -8, 30, Math.PI / 2, '#8B0000', 'sedan'),
  carAt('c2', -4, 30, Math.PI / 2, '#00008B', 'suv'),
  carAt('c3', 0, 30, Math.PI / 2, '#C0C0C0', 'pickup'),
  carAt('c4', 4, 30, Math.PI / 2, '#DAA520', 'sports'),
  carAt('c5', 8, 30, Math.PI / 2, '#4B0082', 'sedan'),
  // Traffic on east-west road
  carAt('c6', -60, -3, 0, '#FF4500', 'suv'),
  carAt('c7', -40, 3, Math.PI, '#2F4F4F', 'pickup'),
  carAt('c8', 50, -3, 0, '#8B4513', 'sedan'),
  carAt('c9', 80, 3, Math.PI, '#DC143C', 'sports'),
  // Cars along north-south road
  carAt('c10', 3, -60, Math.PI / 2, '#4169E1', 'sedan'),
  carAt('c11', -3, -90, -Math.PI / 2, '#228B22', 'suv'),
  carAt('c12', 3, 70, Math.PI / 2, '#CD853F', 'pickup'),
  carAt('c13', -3, 110, -Math.PI / 2, '#708090', 'sedan'),
  // Near buildings
  carAt('c14', -100, 40, 0.3, '#B22222', 'sports'),
  carAt('c15', 100, -80, -0.2, '#483D8B', 'suv'),
  // Near mud pits
  carAt('c16', -70, -50, 0.8, '#556B2F', 'pickup'),
  carAt('c17', 50, 70, -0.5, '#800000', 'sedan'),
  // Random parked cars in world
  carAt('c18', -140, -30, 1.2, '#C0C0C0', 'sedan'),
  carAt('c19', 140, 50, -0.8, '#191970', 'suv'),
  carAt('c20', 30, -130, 0.4, '#8B0000', 'sports'),
];

// =============================================
// MAIN JUMP ARENA COMPONENT
// =============================================
export function JumpArena({ isActive, truckPosition }: JumpArenaProps) {
  const [cars, setCars] = useState<CarState[]>(initialCars);
  const [trees, setTrees] = useState<TreeState[]>(() => generateTrees());

  // Check for truck collision with cars
  useEffect(() => {
    if (!truckPosition || !isActive) return;

    setCars(prevCars => prevCars.map(car => {
      const dx = truckPosition.x - car.position[0];
      const dz = truckPosition.z - car.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 3.5 && truckPosition.y > 1.5) {
        const newDamage = Math.min(1, car.damage + 0.15);
        if (newDamage !== car.damage) return { ...car, damage: newDamage };
      } else if (dist < 2.5 && truckPosition.y < 3) {
        const newDamage = Math.min(1, car.damage + 0.08);
        if (newDamage !== car.damage) return { ...car, damage: newDamage };
      }
      return car;
    }));
  }, [truckPosition, isActive]);

  // Check for truck collision with trees
  useEffect(() => {
    if (!truckPosition || !isActive) return;

    setTrees(prevTrees => prevTrees.map(tree => {
      if (tree.fallen) return tree;
      const dx = truckPosition.x - tree.position[0];
      const dz = truckPosition.z - tree.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 3) {
        // Knock the tree over!
        const fallDir = Math.atan2(dx, dz);
        return {
          ...tree,
          fallen: true,
          fallAngle: Math.PI / 2.2,
          fallDirection: fallDir,
        };
      }
      return tree;
    }));
  }, [truckPosition, isActive]);

  const handleCrush = useCallback((id: string, damage: number) => {
    setCars(prev => prev.map(car =>
      car.id === id ? { ...car, damage: Math.min(1, car.damage + damage) } : car
    ));
  }, []);

  if (!isActive) return null;

  return (
    <group>
      {/* Terrain with rolling hills */}
      <TerrainGround />

      {/* River */}
      <River />

      {/* Roads */}
      <Roads />

      {/* Bridges over the river - tall with approach ramps */}
      <Bridge position={[0, 8, 10]} rotation={0} length={30} width={10} rampLength={18} />
      <Bridge position={[-90, 7, -20]} rotation={0.3} length={25} width={8} rampLength={15} />
      <Bridge position={[80, 6.5, 25]} rotation={-0.2} length={22} width={8} rampLength={14} />

      {/* Tunnels through hillsides */}
      <Tunnel position={[-140, 0, 0]} rotation={Math.PI / 4} length={35} />
      <Tunnel position={[100, 0, -100]} rotation={-Math.PI / 6} length={30} />

      {/* Mud Pits - realistic with splash particles */}
      <MudPit position={[-80, 0, -60]} radius={18} truckPosition={truckPosition} />
      <MudPit position={[60, 0, 80]} radius={16} truckPosition={truckPosition} />
      <MudPit position={[-50, 0, 100]} radius={13} truckPosition={truckPosition} />
      <MudPit position={[120, 0, -40]} radius={14} truckPosition={truckPosition} />

      {/* Ramps - spread across the expanded world */}
      <DirtRamp position={[0, 0, -30]} size="large" />
      <DirtRamp position={[0, 0, 50]} size="large" />
      <DirtRamp position={[-60, 0, -80]} size="large" />
      <DirtRamp position={[80, 0, -60]} size="medium" rotation={0.4} />
      <DirtRamp position={[-40, 0, 60]} size="medium" rotation={0.4} />
      <DirtRamp position={[100, 0, 40]} size="medium" rotation={-0.4} />
      <DirtRamp position={[-120, 0, -120]} size="medium" />
      <DirtRamp position={[130, 0, 120]} size="small" />
      <DirtRamp position={[-150, 0, 80]} size="small" />
      <DirtRamp position={[40, 0, -140]} size="small" />
      <DirtRamp position={[-100, 0, 150]} size="small" />
      <DirtRamp position={[160, 0, -80]} size="small" />

      {/* Trees */}
      {trees.map(tree => (
        <TreeComponent key={tree.id} state={tree} />
      ))}

      {/* Rocks & Boulders */}
      <Rocks />

      {/* Grass patches */}
      <GrassPatches />

      {/* Desert buildings - adobe/southwest style */}
      <Building position={[-100, 0, 30]} width={10} height={8} depth={12} color="#C4956A" />
      <Building position={[-115, 0, 30]} width={8} height={12} depth={8} color="#B8845A" />
      <Building position={[-100, 0, 50]} width={14} height={6} depth={10} color="#D4A574" />
      <Building position={[110, 0, -70]} width={10} height={10} depth={10} color="#C09060" />
      <Building position={[125, 0, -70]} width={6} height={8} depth={8} color="#B8A080" />
      <Building position={[110, 0, -85]} width={12} height={5} depth={8} color="#D0B090" />

      {/* Power lines along main road */}
      <PowerLines />

      {/* Crushable cars */}
      {cars.map(car => (
        <CrushableCar key={car.id} state={car} onCrush={handleCrush} />
      ))}

      {/* Tire stacks - at key locations */}
      <TireStack position={[-25, 0, -25]} height={5} />
      <TireStack position={[25, 0, -25]} height={5} />
      <TireStack position={[-25, 0, 50]} height={4} />
      <TireStack position={[25, 0, 50]} height={4} />
      <TireStack position={[-80, 0, -80]} height={6} />
      <TireStack position={[80, 0, 80]} height={6} />

      {/* World edge barriers - much larger now */}
      <ArenaBarrier position={[0, 1.5, -210]} length={440} />
      <ArenaBarrier position={[0, 1.5, 210]} length={440} />
      <ArenaBarrier position={[-220, 1.5, 0]} length={420} rotation={Math.PI / 2} />
      <ArenaBarrier position={[220, 1.5, 0]} length={420} rotation={Math.PI / 2} />
    </group>
  );
}

export default JumpArena;
