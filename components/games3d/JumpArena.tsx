'use client';

import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface JumpArenaProps {
  isActive: boolean;
  truckPosition?: THREE.Vector3;
}

// Car types for variety
type CarType = 'sedan' | 'suv' | 'pickup' | 'sports' | 'minivan' | 'hatchback';

interface CarState {
  id: string;
  position: [number, number, number];
  rotation: number;
  color: string;
  type: CarType;
  damage: number; // 0 = pristine, 1 = fully crushed
}

// Realistic Sedan - like a Toyota Camry or Honda Accord
function RealisticSedan({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const roofCrush = crush * 0.6;
  const bodyDent = crush * 0.3;

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.45 - bodyDent * 0.2, 0]} castShadow>
        <boxGeometry args={[1.9, 0.5 - bodyDent * 0.15, 4.8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Hood - slightly sloped */}
      <mesh position={[0, 0.55 - bodyDent * 0.3, 1.8]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[1.85, 0.08, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Trunk */}
      <mesh position={[0, 0.52 - bodyDent * 0.25, -1.9]} rotation={[0.05, 0, 0]}>
        <boxGeometry args={[1.8, 0.08, 1.1]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Cabin/Roof - gets crushed */}
      <mesh position={[0, 0.95 - roofCrush * 0.5, -0.1]} scale={[1, 1 - roofCrush * 0.7, 1]} castShadow>
        <boxGeometry args={[1.75, 0.55, 2.4]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* A-pillars */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.8 - roofCrush * 0.3, 0.9]} rotation={[0.5, 0, x > 0 ? -0.15 : 0.15]}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}

      {/* Windshield */}
      <mesh position={[0, 0.85 - roofCrush * 0.35, 1.05]} rotation={[0.45, 0, 0]}>
        <planeGeometry args={[1.65, 0.65 * (1 - crush * 0.3)]} />
        <meshStandardMaterial
          color={crush > 0.3 ? "#87CEEB" : "#B8D4E8"}
          transparent
          opacity={crush > 0.5 ? 0.3 : 0.85}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={crush > 0.3 ? 0.8 : 0.1}
        />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.85 - roofCrush * 0.35, -1.15]} rotation={[-0.4, 0, 0]}>
        <planeGeometry args={[1.55, 0.5 * (1 - crush * 0.3)]} />
        <meshStandardMaterial
          color={crush > 0.3 ? "#87CEEB" : "#B8D4E8"}
          transparent
          opacity={crush > 0.5 ? 0.25 : 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Side windows */}
      {[-0.88, 0.88].map((x, i) => (
        <group key={i}>
          {/* Front door window */}
          <mesh position={[x, 0.85 - roofCrush * 0.3, 0.3]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.9, 0.4 * (1 - crush * 0.4)]} />
            <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.2 : 0.75} side={THREE.DoubleSide} />
          </mesh>
          {/* Rear door window */}
          <mesh position={[x, 0.85 - roofCrush * 0.3, -0.5]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.38 * (1 - crush * 0.4)]} />
            <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.2 : 0.75} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      {[-0.65, 0.65].map((x, i) => (
        <group key={i} position={[x, 0.45, 2.41]}>
          <mesh>
            <boxGeometry args={[0.45, 0.18, 0.05]} />
            <meshStandardMaterial color="#E8E8E8" metalness={0.3} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <circleGeometry args={[0.07, 16]} />
            <meshStandardMaterial color="#FFFFEE" emissive="#FFFF88" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Taillights */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.5, -2.41]}>
          <boxGeometry args={[0.35, 0.15, 0.05]} />
          <meshStandardMaterial color="#CC0000" emissive="#FF0000" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Front grille */}
      <mesh position={[0, 0.35, 2.41]}>
        <boxGeometry args={[1.2, 0.25, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Chrome grille accent */}
      <mesh position={[0, 0.38, 2.42]}>
        <boxGeometry args={[1.0, 0.03, 0.02]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.2, 2.45]}>
        <boxGeometry args={[1.95, 0.2, 0.12]} />
        <meshStandardMaterial color={crush > 0.2 ? "#333" : color} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.22, -2.42]}>
        <boxGeometry args={[1.9, 0.18, 0.1]} />
        <meshStandardMaterial color={crush > 0.2 ? "#333" : color} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* License plate */}
      <mesh position={[0, 0.28, -2.43]}>
        <boxGeometry args={[0.35, 0.12, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Side mirrors */}
      {[-1.0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0.75 - roofCrush * 0.2, 0.85]}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 0.15]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[x > 0 ? 0.03 : -0.03, 0, 0]}>
            <planeGeometry args={[0.08, 0.06]} />
            <meshStandardMaterial color="#88AACC" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Door handles */}
      {[-0.96, 0.96].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.55, 0.4]}>
            <boxGeometry args={[0.02, 0.04, 0.12]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[x, 0.55, -0.45]}>
            <boxGeometry args={[0.02, 0.04, 0.12]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Wheels with detailed rims */}
      {[
        [-0.85, 0.32, 1.45], [0.85, 0.32, 1.45],
        [-0.85, 0.32, -1.35], [0.85, 0.32, -1.35]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh position={[pos[0] > 0 ? 0.12 : -0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Wheel well shadow */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.25, 0.2, 0.5]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
        </group>
      ))}

      {/* Damage effects - broken glass particles when crushed */}
      {crush > 0.3 && (
        <group>
          {Array.from({ length: Math.floor(crush * 15) }).map((_, i) => (
            <mesh key={i} position={[
              (Math.random() - 0.5) * 2,
              0.1 + Math.random() * 0.3,
              (Math.random() - 0.5) * 3
            ]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
              <boxGeometry args={[0.05, 0.05, 0.01]} />
              <meshStandardMaterial color="#88CCEE" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// Realistic SUV - like a Ford Explorer or Toyota 4Runner
function RealisticSUV({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const roofCrush = crush * 0.5;

  return (
    <group>
      {/* Main body - taller than sedan */}
      <mesh position={[0, 0.55 - crush * 0.15, 0]} castShadow>
        <boxGeometry args={[2.0, 0.7, 4.9]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Hood */}
      <mesh position={[0, 0.75 - crush * 0.2, 1.85]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[1.95, 0.08, 1.3]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Roof/Cabin */}
      <mesh position={[0, 1.25 - roofCrush * 0.6, -0.3]} scale={[1, 1 - roofCrush * 0.6, 1]} castShadow>
        <boxGeometry args={[1.9, 0.65, 2.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 1.15 - roofCrush * 0.4, 1.0]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[1.75, 0.75 * (1 - crush * 0.3)]} />
        <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.3 : 0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 1.15 - roofCrush * 0.4, -1.65]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[1.7, 0.6 * (1 - crush * 0.3)]} />
        <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.25 : 0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Side windows */}
      {[-0.96, 0.96].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.1 - roofCrush * 0.35, 0.2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.0, 0.5 * (1 - crush * 0.35)]} />
            <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.2 : 0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[x, 1.1 - roofCrush * 0.35, -0.9]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.9, 0.5 * (1 - crush * 0.35)]} />
            <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.2 : 0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 2.46]}>
          <boxGeometry args={[0.5, 0.22, 0.05]} />
          <meshStandardMaterial color="#E0E0E0" emissive="#FFFFAA" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Grille */}
      <mesh position={[0, 0.45, 2.46]}>
        <boxGeometry args={[1.3, 0.35, 0.05]} />
        <meshStandardMaterial color="#222222" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.22, 2.5]}>
        <boxGeometry args={[2.05, 0.25, 0.15]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.25, -2.46]}>
        <boxGeometry args={[2.0, 0.22, 0.12]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>

      {/* Taillights */}
      {[-0.75, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.7, -2.46]}>
          <boxGeometry args={[0.4, 0.25, 0.05]} />
          <meshStandardMaterial color="#CC0000" emissive="#FF0000" emissiveIntensity={0.35} />
        </mesh>
      ))}

      {/* Roof rails */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 1.55 - roofCrush * 0.5, -0.3]}>
          <boxGeometry args={[0.06, 0.08, 2.5]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Wheels - larger for SUV */}
      {[
        [-0.9, 0.38, 1.5], [0.9, 0.38, 1.5],
        [-0.9, 0.38, -1.4], [0.9, 0.38, -1.4]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.26, 24]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.92} />
          </mesh>
          <mesh position={[pos[0] > 0 ? 0.14 : -0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.03, 16]} />
            <meshStandardMaterial color="#A0A0A0" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Damage glass shards */}
      {crush > 0.25 && Array.from({ length: Math.floor(crush * 12) }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 2.2,
          0.15 + Math.random() * 0.4,
          (Math.random() - 0.5) * 3.5
        ]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.015]} />
          <meshStandardMaterial color="#99CCDD" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Realistic Pickup Truck - like a Ford F-150
function RealisticPickup({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const cabCrush = crush * 0.55;

  return (
    <group>
      {/* Cab section */}
      <mesh position={[0, 0.6 - crush * 0.1, 1.2]} castShadow>
        <boxGeometry args={[2.1, 0.65, 2.2]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cab roof */}
      <mesh position={[0, 1.15 - cabCrush * 0.5, 1.0]} scale={[1, 1 - cabCrush * 0.6, 1]} castShadow>
        <boxGeometry args={[2.0, 0.5, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.45} />
      </mesh>

      {/* Truck bed */}
      <mesh position={[0, 0.5, -1.3]} castShadow>
        <boxGeometry args={[2.05, 0.5, 2.6]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.45} />
      </mesh>

      {/* Bed interior */}
      <mesh position={[0, 0.55, -1.3]}>
        <boxGeometry args={[1.85, 0.45, 2.4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>

      {/* Bed rails */}
      {[-0.95, 0.95].map((x, i) => (
        <mesh key={i} position={[x, 0.8, -1.3]}>
          <boxGeometry args={[0.12, 0.1, 2.5]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Tailgate */}
      <mesh position={[0, 0.55, -2.55]}>
        <boxGeometry args={[1.9, 0.5, 0.08]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Hood */}
      <mesh position={[0, 0.72, 2.1]} rotation={[-0.06, 0, 0]}>
        <boxGeometry args={[2.0, 0.1, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 1.05 - cabCrush * 0.35, 1.85]} rotation={[0.4, 0, 0]}>
        <planeGeometry args={[1.85, 0.7 * (1 - crush * 0.35)]} />
        <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.3 : 0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Rear cab window */}
      <mesh position={[0, 1.0 - cabCrush * 0.3, 0.12]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.75, 0.45 * (1 - crush * 0.35)]} />
        <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.35 ? 0.25 : 0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Side windows */}
      {[-1.01, 1.01].map((x, i) => (
        <mesh key={i} position={[x, 1.0 - cabCrush * 0.3, 1.0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.2, 0.45 * (1 - crush * 0.3)]} />
          <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.3 ? 0.2 : 0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Headlights */}
      {[-0.75, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.55, 2.56]}>
          <boxGeometry args={[0.45, 0.2, 0.05]} />
          <meshStandardMaterial color="#E8E8E8" emissive="#FFFFAA" emissiveIntensity={0.35} />
        </mesh>
      ))}

      {/* Grille */}
      <mesh position={[0, 0.42, 2.56]}>
        <boxGeometry args={[1.4, 0.35, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Chrome grille bars */}
      {[-0.3, 0, 0.3].map((y, i) => (
        <mesh key={i} position={[0, 0.35 + y * 0.25, 2.57]}>
          <boxGeometry args={[1.2, 0.04, 0.02]} />
          <meshStandardMaterial color="#C8C8C8" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}

      {/* Front bumper - chrome */}
      <mesh position={[0, 0.22, 2.6]}>
        <boxGeometry args={[2.15, 0.22, 0.15]} />
        <meshStandardMaterial color="#A0A0A0" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.25, -2.6]}>
        <boxGeometry args={[2.1, 0.2, 0.12]} />
        <meshStandardMaterial color="#808080" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Taillights */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.6, -2.56]}>
          <boxGeometry args={[0.35, 0.25, 0.05]} />
          <meshStandardMaterial color="#CC0000" emissive="#FF0000" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* Wheels - larger truck wheels */}
      {[
        [-0.95, 0.4, 1.6], [0.95, 0.4, 1.6],
        [-0.95, 0.4, -1.5], [0.95, 0.4, -1.5]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.28, 24]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.93} />
          </mesh>
          <mesh position={[pos[0] > 0 ? 0.15 : -0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
            <meshStandardMaterial color="#B0B0B0" metalness={0.92} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* Damage debris */}
      {crush > 0.3 && Array.from({ length: Math.floor(crush * 10) }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 2.3,
          0.1 + Math.random() * 0.35,
          (Math.random() - 0.5) * 4
        ]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
          <boxGeometry args={[0.055, 0.055, 0.012]} />
          <meshStandardMaterial color="#99CCDD" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

// Sports Car - like a Mustang or Camaro
function RealisticSportsCar({ color, damage }: { color: string; damage: number }) {
  const crush = Math.min(damage, 1);
  const roofCrush = crush * 0.65;

  return (
    <group>
      {/* Low body */}
      <mesh position={[0, 0.35 - crush * 0.1, 0]} castShadow>
        <boxGeometry args={[1.95, 0.4, 4.6]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Hood - long and low */}
      <mesh position={[0, 0.45 - crush * 0.15, 1.5]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[1.9, 0.08, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Hood scoop */}
      <mesh position={[0, 0.52 - crush * 0.15, 1.3]}>
        <boxGeometry args={[0.4, 0.1, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Cabin - low and sleek */}
      <mesh position={[0, 0.7 - roofCrush * 0.4, -0.4]} scale={[1, 1 - roofCrush * 0.65, 1]} castShadow>
        <boxGeometry args={[1.8, 0.45, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Trunk/rear */}
      <mesh position={[0, 0.42 - crush * 0.12, -1.8]}>
        <boxGeometry args={[1.85, 0.3, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Spoiler */}
      <mesh position={[0, 0.6 - crush * 0.2, -2.2]}>
        <boxGeometry args={[1.7, 0.06, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.52 - crush * 0.18, -2.15]}>
        <boxGeometry args={[0.08, 0.15, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Windshield - more raked */}
      <mesh position={[0, 0.65 - roofCrush * 0.3, 0.55]} rotation={[0.55, 0, 0]}>
        <planeGeometry args={[1.7, 0.55 * (1 - crush * 0.35)]} />
        <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.3 : 0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.62 - roofCrush * 0.3, -1.2]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[1.6, 0.4 * (1 - crush * 0.35)]} />
        <meshStandardMaterial color="#B8D4E8" transparent opacity={crush > 0.4 ? 0.25 : 0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Aggressive headlights */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.35, 2.31]} rotation={[0, 0, x > 0 ? -0.1 : 0.1]}>
          <boxGeometry args={[0.5, 0.12, 0.05]} />
          <meshStandardMaterial color="#E0E0E0" emissive="#FFFFFF" emissiveIntensity={0.45} />
        </mesh>
      ))}

      {/* Taillights - horizontal strip */}
      <mesh position={[0, 0.4, -2.31]}>
        <boxGeometry args={[1.6, 0.08, 0.05]} />
        <meshStandardMaterial color="#AA0000" emissive="#FF0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Front splitter */}
      <mesh position={[0, 0.12, 2.35]}>
        <boxGeometry args={[2.0, 0.06, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Side skirts */}
      {[-0.98, 0.98].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0]}>
          <boxGeometry args={[0.06, 0.12, 3.8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}

      {/* Wheels - performance */}
      {[
        [-0.88, 0.3, 1.4], [0.88, 0.3, 1.4],
        [-0.88, 0.3, -1.3], [0.88, 0.3, -1.3]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.24, 24]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.88} />
          </mesh>
          <mesh position={[pos[0] > 0 ? 0.13 : -0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.03, 5]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Glass shards */}
      {crush > 0.35 && Array.from({ length: Math.floor(crush * 14) }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 2,
          0.08 + Math.random() * 0.25,
          (Math.random() - 0.5) * 3.5
        ]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
          <boxGeometry args={[0.045, 0.045, 0.01]} />
          <meshStandardMaterial color="#88CCEE" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

// Wrapper component for cars with damage state
function CrushableCar({
  state,
  onCrush
}: {
  state: CarState;
  onCrush: (id: string, damage: number) => void;
}) {
  const CarComponent = {
    sedan: RealisticSedan,
    suv: RealisticSUV,
    pickup: RealisticPickup,
    sports: RealisticSportsCar,
    minivan: RealisticSedan, // Use sedan as fallback
    hatchback: RealisticSedan,
  }[state.type];

  return (
    <group position={state.position} rotation={[0, state.rotation, 0]}>
      <CarComponent color={state.color} damage={state.damage} />
    </group>
  );
}

// Dirt ramp
function DirtRamp({
  position,
  rotation = 0,
  size = 'medium',
}: {
  position: [number, number, number];
  rotation?: number;
  size?: 'small' | 'medium' | 'large';
}) {
  const scales = {
    small: { radius: 6, height: 3 },
    medium: { radius: 9, height: 4.5 },
    large: { radius: 12, height: 6 },
  };

  const { radius, height } = scales[size];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <coneGeometry args={[radius, height, 32]} />
        <meshStandardMaterial color="#8B6914" roughness={0.95} />
      </mesh>
      <mesh position={[0, height - 0.2, 0]}>
        <cylinderGeometry args={[1.5, 2, 0.5, 16]} />
        <meshStandardMaterial color="#6B4D0A" roughness={1.0} />
      </mesh>
      {[-radius * 0.3, radius * 0.3].map((x, i) => (
        <mesh key={i} position={[x, height * 0.4, radius * 0.35]} rotation={[-0.7, 0, 0]}>
          <planeGeometry args={[1.5, radius * 0.9]} />
          <meshStandardMaterial color="#5A4009" roughness={1.0} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}
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

// Arena barrier
function ArenaBarrier({ position, length, rotation = 0 }: { position: [number, number, number]; length: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[length, 2, 1.5]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[length, 0.3, 1.6]} />
        <meshStandardMaterial color="#FF6600" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Arena floor
function ArenaFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 110]} />
        <meshStandardMaterial color="#A0822D" roughness={1.0} />
      </mesh>
      {[-20, -10, 0, 10, 20].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[2, 90]} />
          <meshStandardMaterial color="#6B5020" roughness={1.0} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Initial car states
const initialCars: CarState[] = [
  // Main center row
  { id: 'c1', position: [-8, 0, 0], rotation: Math.PI / 2, color: '#8B0000', type: 'sedan', damage: 0 },
  { id: 'c2', position: [-4, 0, 0], rotation: Math.PI / 2, color: '#00008B', type: 'suv', damage: 0 },
  { id: 'c3', position: [0, 0, 0], rotation: Math.PI / 2, color: '#006400', type: 'pickup', damage: 0 },
  { id: 'c4', position: [4, 0, 0], rotation: Math.PI / 2, color: '#DAA520', type: 'sports', damage: 0 },
  { id: 'c5', position: [8, 0, 0], rotation: Math.PI / 2, color: '#4B0082', type: 'sedan', damage: 0 },
  // Left diagonal row
  { id: 'c6', position: [-25, 0, 0], rotation: Math.PI / 2 + 0.4, color: '#FF4500', type: 'suv', damage: 0 },
  { id: 'c7', position: [-21, 0, 3], rotation: Math.PI / 2 + 0.4, color: '#2F4F4F', type: 'pickup', damage: 0 },
  { id: 'c8', position: [-17, 0, 6], rotation: Math.PI / 2 + 0.4, color: '#8B4513', type: 'sedan', damage: 0 },
  // Right diagonal row
  { id: 'c9', position: [25, 0, 0], rotation: Math.PI / 2 - 0.4, color: '#DC143C', type: 'sports', damage: 0 },
  { id: 'c10', position: [21, 0, 3], rotation: Math.PI / 2 - 0.4, color: '#4169E1', type: 'sedan', damage: 0 },
  { id: 'c11', position: [17, 0, 6], rotation: Math.PI / 2 - 0.4, color: '#228B22', type: 'suv', damage: 0 },
  // Scattered cars
  { id: 'c12', position: [-45, 0, 0], rotation: 0.3, color: '#CD853F', type: 'pickup', damage: 0 },
  { id: 'c13', position: [45, 0, 0], rotation: -0.2, color: '#708090', type: 'sedan', damage: 0 },
  { id: 'c14', position: [0, 0, -40], rotation: 0.1, color: '#B22222', type: 'sports', damage: 0 },
  { id: 'c15', position: [0, 0, 40], rotation: -0.1, color: '#483D8B', type: 'suv', damage: 0 },
];

export function JumpArena({ isActive, truckPosition }: JumpArenaProps) {
  const [cars, setCars] = useState<CarState[]>(initialCars);

  // Check for truck collision with cars
  useEffect(() => {
    if (!truckPosition || !isActive) return;

    setCars(prevCars => prevCars.map(car => {
      const dx = truckPosition.x - car.position[0];
      const dz = truckPosition.z - car.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      // If truck is close and above the car, crush it
      if (dist < 3.5 && truckPosition.y > 1.5) {
        const newDamage = Math.min(1, car.damage + 0.15);
        if (newDamage !== car.damage) {
          return { ...car, damage: newDamage };
        }
      }
      // Ground level crushing
      else if (dist < 2.5 && truckPosition.y < 3) {
        const newDamage = Math.min(1, car.damage + 0.08);
        if (newDamage !== car.damage) {
          return { ...car, damage: newDamage };
        }
      }
      return car;
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
      <ArenaFloor />

      {/* Ramps */}
      <DirtRamp position={[0, 0, -25]} size="large" />
      <DirtRamp position={[0, 0, 25]} size="large" />
      <DirtRamp position={[-30, 0, -12]} size="medium" rotation={0.4} />
      <DirtRamp position={[-14, 0, 18]} size="medium" rotation={0.4} />
      <DirtRamp position={[30, 0, -12]} size="medium" rotation={-0.4} />
      <DirtRamp position={[14, 0, 18]} size="medium" rotation={-0.4} />
      <DirtRamp position={[-38, 0, -35]} size="small" />
      <DirtRamp position={[38, 0, -35]} size="small" />
      <DirtRamp position={[-38, 0, 35]} size="small" />
      <DirtRamp position={[38, 0, 35]} size="small" />

      {/* Crushable cars */}
      {cars.map(car => (
        <CrushableCar key={car.id} state={car} onCrush={handleCrush} />
      ))}

      {/* Tire stacks */}
      <TireStack position={[-48, 0, -20]} height={5} />
      <TireStack position={[48, 0, -20]} height={5} />
      <TireStack position={[-48, 0, 20]} height={4} />
      <TireStack position={[48, 0, 20]} height={4} />

      {/* Barriers */}
      <ArenaBarrier position={[0, 1, -52]} length={110} />
      <ArenaBarrier position={[0, 1, 52]} length={110} />
      <ArenaBarrier position={[-57, 1, 0]} length={104} rotation={Math.PI / 2} />
      <ArenaBarrier position={[57, 1, 0]} length={104} rotation={Math.PI / 2} />
    </group>
  );
}

export default JumpArena;
