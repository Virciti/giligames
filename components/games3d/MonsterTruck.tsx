'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { DustTrail, ExhaustSmoke, BoostFlame } from './particles';

// Monster truck dimensions - realistic proportions
const BODY_WIDTH = 2.4;
const BODY_HEIGHT = 1.2;
const BODY_LENGTH = 4.0;
const WHEEL_RADIUS = 1.2;
const WHEEL_WIDTH = 1.0;
const SUSPENSION_HEIGHT = 1.0;
const AXLE_WIDTH = 3.0;

// ARCADE PHYSICS - designed for kids ages 5-8, super easy to control
const MAX_SPEED = 20; // Comfortable speed for kids
const ACCELERATION = 12;
const BRAKE_FORCE = 20;
const TURN_SPEED = 1.8; // Gentler turning
const FRICTION = 0.97; // Coasts further - less punishing
const TURN_SPEED_REDUCTION = 0.4; // Less speed-dependent turning
const GRAVITY = 30;
const JUMP_MODE_SPEED = 16; // Good speed for jump mode
const AUTO_STRAIGHTEN = 0.3; // Helps truck go straight when not steering

interface MonsterTruckProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  truckStyle?: 'flames' | 'shark' | 'classic' | 'dragon' | 'stars';
  onPositionUpdate?: (position: THREE.Vector3, rotation: THREE.Euler, speed: number) => void;
  inputState?: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    brake: boolean;
    boost: boolean;
  };
  isPlayer?: boolean;
  gameMode?: 'race' | 'jump';
}

// Realistic monster truck wheel with deep treads and spin animation
function MonsterWheel({
  position,
  steering = false,
  steerAngle = 0,
  spinRotation = 0,
  rimColor = '#C0C0C0'
}: {
  position: [number, number, number];
  steering?: boolean;
  steerAngle?: number;
  spinRotation?: number;
  rimColor?: string;
}) {
  return (
    <group position={position} rotation={[0, steering ? steerAngle : 0, 0]}>
      {/* Spinning wheel group */}
      <group rotation={[spinRotation, 0, 0]}>
      {/* Main tire - black rubber */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>

      {/* Tire sidewall with raised lettering effect */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[WHEEL_RADIUS * 0.85, 0.15, 8, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* Inner sidewall ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[WHEEL_RADIUS * 0.6, 0.08, 8, 32]} />
        <meshStandardMaterial color="#222" roughness={0.85} />
      </mesh>

      {/* Deep aggressive tread blocks */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return (
          <group key={i}>
            {/* Main tread block */}
            <mesh
              position={[
                0,
                Math.sin(angle) * WHEEL_RADIUS * 0.95,
                Math.cos(angle) * WHEEL_RADIUS * 0.95,
              ]}
              rotation={[angle, 0, Math.PI / 2]}
              castShadow
            >
              <boxGeometry args={[WHEEL_WIDTH * 0.9, 0.2, 0.35]} />
              <meshStandardMaterial color="#111" roughness={1} />
            </mesh>
            {/* Secondary tread */}
            <mesh
              position={[
                0,
                Math.sin(angle + 0.1) * WHEEL_RADIUS * 0.88,
                Math.cos(angle + 0.1) * WHEEL_RADIUS * 0.88,
              ]}
              rotation={[angle + 0.1, 0, Math.PI / 2]}
            >
              <boxGeometry args={[WHEEL_WIDTH * 0.7, 0.12, 0.2]} />
              <meshStandardMaterial color="#0a0a0a" roughness={1} />
            </mesh>
          </group>
        );
      })}

      {/* Chrome/alloy rim - left side */}
      <group position={[-WHEEL_WIDTH / 2 - 0.02, 0, 0]}>
        {/* Rim face */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WHEEL_RADIUS * 0.5, WHEEL_RADIUS * 0.55, 0.15, 24]} />
          <meshStandardMaterial color={rimColor} metalness={0.95} roughness={0.05} />
        </mesh>
        {/* Center hub */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Lug nuts */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                -0.08,
                Math.sin(angle) * 0.35,
                Math.cos(angle) * 0.35,
              ]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
              <meshStandardMaterial color="#888" metalness={0.95} roughness={0.1} />
            </mesh>
          );
        })}
        {/* Rim spokes */}
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                -0.02,
                Math.sin(angle) * WHEEL_RADIUS * 0.3,
                Math.cos(angle) * WHEEL_RADIUS * 0.3,
              ]}
              rotation={[angle, 0, Math.PI / 2]}
            >
              <boxGeometry args={[0.08, 0.12, WHEEL_RADIUS * 0.4]} />
              <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* Chrome/alloy rim - right side */}
      <group position={[WHEEL_WIDTH / 2 + 0.02, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WHEEL_RADIUS * 0.5, WHEEL_RADIUS * 0.55, 0.15, 24]} />
          <meshStandardMaterial color={rimColor} metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                0.08,
                Math.sin(angle) * 0.35,
                Math.cos(angle) * 0.35,
              ]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
              <meshStandardMaterial color="#888" metalness={0.95} roughness={0.1} />
            </mesh>
          );
        })}
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                0.02,
                Math.sin(angle) * WHEEL_RADIUS * 0.3,
                Math.cos(angle) * WHEEL_RADIUS * 0.3,
              ]}
              rotation={[angle, 0, Math.PI / 2]}
            >
              <boxGeometry args={[0.08, 0.12, WHEEL_RADIUS * 0.4]} />
              <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}
      </group>
      {/* Close spinning wheel group */}
      </group>
    </group>
  );
}

// Monster Jam themed decorations
function ThemeDecorations({ style }: { style: string }) {
  switch (style) {
    case 'shark':
      // MEGALODON style - shark theme
      return (
        <group>
          {/* Dorsal fin on roof */}
          <mesh position={[0, 1.3, 0.2]} rotation={[0.2, 0, 0]} castShadow>
            <coneGeometry args={[0.4, 1.2, 4]} />
            <meshStandardMaterial color="#1E90FF" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Side fins */}
          {[-1, 1].map((side, i) => (
            <mesh key={i} position={[side * 1.3, 0.3, -0.5]} rotation={[0, side * 0.5, side * 0.8]}>
              <coneGeometry args={[0.25, 0.8, 4]} />
              <meshStandardMaterial color="#1E90FF" metalness={0.3} roughness={0.5} />
            </mesh>
          ))}
          {/* Tail fin */}
          <mesh position={[0, 0.6, -2.3]} rotation={[-0.3, 0, 0]} castShadow>
            <coneGeometry args={[0.5, 0.8, 4]} />
            <meshStandardMaterial color="#1E90FF" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Shark teeth on grille */}
          {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
            <mesh key={i} position={[x, -0.15, 2.1]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, 0.2, 4]} />
              <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.3} />
            </mesh>
          ))}
          {/* Shark eyes */}
          {[-0.8, 0.8].map((x, i) => (
            <group key={i} position={[x, 0.4, 1.9]}>
              <mesh>
                <sphereGeometry args={[0.15, 12, 12]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'dragon':
      // DRAGON style - fire breathing dragon
      return (
        <group>
          {/* Dragon horns */}
          {[-0.4, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 1.2, 0.8]} rotation={[0.5, x * 0.5, 0]} castShadow>
              <coneGeometry args={[0.12, 0.8, 6]} />
              <meshStandardMaterial color="#8B0000" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
          {/* Spine ridges down the back */}
          {[0.6, 0.2, -0.2, -0.6, -1.0, -1.4].map((z, i) => (
            <mesh key={i} position={[0, 1.0 - i * 0.05, z]} rotation={[0.2, 0, 0]} castShadow>
              <coneGeometry args={[0.08, 0.25 - i * 0.02, 4]} />
              <meshStandardMaterial color="#8B0000" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
          {/* Dragon nostrils with smoke effect */}
          {[-0.3, 0.3].map((x, i) => (
            <mesh key={i} position={[x, 0.2, 2.1]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          {/* Dragon eyes - glowing */}
          {[-0.7, 0.7].map((x, i) => (
            <group key={i} position={[x, 0.45, 1.95]}>
              <mesh>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial
                  color="#FF4500"
                  emissive="#FF2200"
                  emissiveIntensity={0.8}
                />
              </mesh>
              <mesh position={[0, 0, 0.08]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#000000" />
              </mesh>
            </group>
          ))}
          {/* Dragon tail */}
          <mesh position={[0, 0.3, -2.4]} rotation={[-0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.3, 1.0, 6]} />
            <meshStandardMaterial color="#228B22" metalness={0.3} roughness={0.5} />
          </mesh>
        </group>
      );

    case 'bull':
      // EL TORO LOCO style - bull theme
      return (
        <group>
          {/* Bull horns - large curved */}
          {[-1, 1].map((side, i) => (
            <group key={i}>
              <mesh position={[side * 0.5, 1.1, 0.7]} rotation={[0, 0, side * 0.6]} castShadow>
                <cylinderGeometry args={[0.1, 0.06, 0.8, 8]} />
                <meshStandardMaterial color="#F5DEB3" metalness={0.2} roughness={0.6} />
              </mesh>
              <mesh position={[side * 0.9, 1.2, 0.7]} rotation={[0.2, 0, side * 1.2]} castShadow>
                <coneGeometry args={[0.08, 0.4, 8]} />
                <meshStandardMaterial color="#FFFAF0" metalness={0.1} roughness={0.4} />
              </mesh>
            </group>
          ))}
          {/* Bull nose ring */}
          <mesh position={[0, -0.1, 2.15]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.03, 8, 16]} />
            <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Angry bull eyes */}
          {[-0.7, 0.7].map((x, i) => (
            <group key={i} position={[x, 0.35, 1.95]}>
              <mesh>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshStandardMaterial color="#FF0000" emissive="#880000" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#000000" />
              </mesh>
            </group>
          ))}
          {/* Bull ears */}
          {[-1, 1].map((side, i) => (
            <mesh key={i} position={[side * 1.1, 0.7, 0.9]} rotation={[0, side * 0.3, side * 0.5]}>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshStandardMaterial color="#FF4500" metalness={0.2} roughness={0.6} />
            </mesh>
          ))}
        </group>
      );

    case 'flames':
      // GRAVE DIGGER style - flames and skulls
      return (
        <group>
          {/* Flame decals on sides - multiple flame shapes */}
          {[-1, 1].map((side, i) => (
            <group key={i} position={[side * 1.22, 0.3, 0.5]}>
              {/* Base flames */}
              {[0, 0.3, 0.6, 0.9, 1.2].map((z, j) => (
                <mesh key={j} position={[0, Math.sin(j * 0.8) * 0.15, z - 0.6]} rotation={[0, side * Math.PI / 2, 0]}>
                  <coneGeometry args={[0.08, 0.3 + Math.random() * 0.2, 4]} />
                  <meshStandardMaterial
                    color={j % 2 === 0 ? "#FF4500" : "#FFD700"}
                    emissive={j % 2 === 0 ? "#FF2200" : "#FF8800"}
                    emissiveIntensity={0.4}
                  />
                </mesh>
              ))}
            </group>
          ))}
          {/* Hood flames */}
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 0.35, 1.6]} rotation={[-0.3, 0, 0]}>
              <coneGeometry args={[0.1, 0.4, 4]} />
              <meshStandardMaterial
                color="#FF6600"
                emissive="#FF4400"
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
          {/* Skull emblem on hood */}
          <group position={[0, 0.3, 1.8]}>
            <mesh>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial color="#F5F5DC" metalness={0.1} roughness={0.7} />
            </mesh>
            {/* Eye sockets */}
            {[-0.08, 0.08].map((x, i) => (
              <mesh key={i} position={[x, 0.03, 0.15]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#000000" />
              </mesh>
            ))}
          </group>
        </group>
      );

    case 'stars':
      // PATRIOTIC style - stars and stripes
      return (
        <group>
          {/* Stars on roof */}
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={i} position={[x, 1.0, 0.5 + i * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 5]} />
              <meshStandardMaterial
                color="#FFD700"
                emissive="#FFAA00"
                emissiveIntensity={0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
          {/* Red stripes */}
          {[0.1, 0.35].map((y, i) => (
            <mesh key={i} position={[1.21, y, 0.3]}>
              <boxGeometry args={[0.02, 0.12, 1.8]} />
              <meshStandardMaterial color="#B22234" metalness={0.3} roughness={0.5} />
            </mesh>
          ))}
          {[0.1, 0.35].map((y, i) => (
            <mesh key={i} position={[-1.21, y, 0.3]}>
              <boxGeometry args={[0.02, 0.12, 1.8]} />
              <meshStandardMaterial color="#B22234" metalness={0.3} roughness={0.5} />
            </mesh>
          ))}
          {/* Eagle emblem on hood */}
          <mesh position={[0, 0.35, 1.7]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.5, 0.02, 0.3]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}

// Realistic truck body with details
function TruckBody({
  color = '#FF6B6B',
  secondaryColor = '#FFD700',
  style = 'classic'
}: {
  color?: string;
  secondaryColor?: string;
  style?: string;
}) {
  return (
    <group>
      {/* === MAIN CHASSIS === */}
      {/* Lower frame rails */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, -0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.15, BODY_LENGTH * 1.1]} />
          <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Cross members */}
      {[-1.2, 0, 1.2].map((z, i) => (
        <mesh key={i} position={[0, -0.4, z]} castShadow>
          <boxGeometry args={[1.8, 0.12, 0.15]} />
          <meshStandardMaterial color="#333" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}

      {/* === TRUCK CAB === */}
      {/* Main cab body - rounded front */}
      <mesh position={[0, 0.3, 0.6]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.95, BODY_HEIGHT * 0.8, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Cab roof */}
      <mesh position={[0, 0.85, 0.5]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.9, 0.15, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Hood - sloped */}
      <mesh position={[0, 0.15, 1.6]} rotation={[-0.15, 0, 0]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.9, 0.2, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
      </mesh>

      {/* Grille */}
      <mesh position={[0, 0.05, 2.0]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.85, 0.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Grille chrome bars */}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((y, i) => (
        <mesh key={i} position={[0, y, 2.05]}>
          <boxGeometry args={[BODY_WIDTH * 0.8, 0.04, 0.02]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.05} />
        </mesh>
      ))}

      {/* === WINDSHIELD & WINDOWS === */}
      {/* Windshield - angled */}
      <mesh position={[0, 0.55, 1.35]} rotation={[0.6, 0, 0]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.8, 0.6, 0.05]} />
        <meshStandardMaterial
          color="#1a3a5c"
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Side windows */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * BODY_WIDTH * 0.48, 0.55, 0.6]}>
          <boxGeometry args={[0.05, 0.45, 1.0]} />
          <meshStandardMaterial
            color="#1a3a5c"
            metalness={0.1}
            roughness={0.05}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Rear window */}
      <mesh position={[0, 0.55, -0.25]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[BODY_WIDTH * 0.75, 0.4, 0.05]} />
        <meshStandardMaterial
          color="#1a3a5c"
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* === TRUCK BED === */}
      {/* Bed floor */}
      <mesh position={[0, -0.15, -1.2]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.9, 0.15, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Bed sides */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * BODY_WIDTH * 0.45, 0.15, -1.2]} castShadow>
          <boxGeometry args={[0.1, 0.5, 1.6]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* Tailgate */}
      <mesh position={[0, 0.1, -2.0]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.85, 0.45, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>

      {/* === ROLL CAGE === */}
      {/* Main roll bars */}
      {[-1, 1].map((side, i) => (
        <group key={i}>
          {/* A-pillar */}
          <mesh position={[side * 0.95, 0.5, 1.25]} rotation={[0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* B-pillar */}
          <mesh position={[side * 0.95, 0.55, 0.0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Side bar */}
          <mesh position={[side * 0.98, 0.9, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.3, 8]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Roof cross bar */}
      <mesh position={[0, 0.95, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.9, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* === FENDER FLARES === */}
      {[
        { x: -1.1, z: 1.4 }, { x: 1.1, z: 1.4 },
        { x: -1.1, z: -1.0 }, { x: 1.1, z: -1.0 }
      ].map((pos, i) => (
        <mesh key={i} position={[pos.x, -0.2, pos.z]} castShadow>
          <boxGeometry args={[0.35, 0.3, 0.9]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* === BUMPERS === */}
      {/* Front bumper - chrome */}
      <mesh position={[0, -0.2, 2.1]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 1.1, 0.3, 0.2]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, -0.2, -2.1]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 1.05, 0.25, 0.15]} />
        <meshStandardMaterial color="#666" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* === HEADLIGHTS === */}
      {[-0.7, 0.7].map((x, i) => (
        <group key={i} position={[x, 0.15, 2.05]}>
          {/* Housing */}
          <mesh>
            <boxGeometry args={[0.35, 0.25, 0.08]} />
            <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Lens */}
          <mesh position={[0, 0, 0.05]}>
            <circleGeometry args={[0.1, 16]} />
            <meshStandardMaterial
              color="#FFFFEE"
              emissive="#FFFFAA"
              emissiveIntensity={0.8}
            />
          </mesh>
          {/* Reflector */}
          <pointLight color="#FFFFEE" intensity={0.5} distance={15} position={[0, 0, 0.1]} />
        </group>
      ))}

      {/* === TAILLIGHTS === */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, 0.1, -2.12]}>
          <mesh rotation={[0, Math.PI, 0]}>
            <boxGeometry args={[0.25, 0.2, 0.05]} />
            <meshStandardMaterial
              color="#FF2222"
              emissive="#FF0000"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* === EXHAUST STACKS === */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * 1.15, 0.4, -0.5]}>
          {/* Pipe */}
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.08, 1.2, 12]} />
            <meshStandardMaterial color="#444" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Chrome tip */}
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.12, 0.1, 0.15, 12]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.05} />
          </mesh>
        </group>
      ))}

      {/* === HOOD SCOOP === */}
      <mesh position={[0, 0.35, 1.3]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.4]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.48, 1.35]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.25]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* === RACING STRIPE === */}
      <mesh position={[0, 0.25, 0.8]}>
        <boxGeometry args={[0.4, 0.02, 2.5]} />
        <meshStandardMaterial color={secondaryColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* === SIDE DECALS/STRIPES === */}
      {[-1, 1].map((side, i) => (
        <mesh key={i} position={[side * 1.2, 0.25, 0.3]}>
          <boxGeometry args={[0.02, 0.2, 1.5]} />
          <meshStandardMaterial color={secondaryColor} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* === ROOF LIGHTS === */}
      {[-0.5, -0.25, 0, 0.25, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 1.0, 0.8]}>
          <boxGeometry args={[0.12, 0.08, 0.15]} />
          <meshStandardMaterial
            color="#FFFF99"
            emissive="#FFFF00"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* === SHOCK ABSORBERS (visible suspension) === */}
      {[
        { x: -1.2, z: 1.4 }, { x: 1.2, z: 1.4 },
        { x: -1.2, z: -1.0 }, { x: 1.2, z: -1.0 }
      ].map((pos, i) => (
        <group key={i} position={[pos.x, -0.4, pos.z]}>
          {/* Shock body */}
          <mesh rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 0.8, 8]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Spring coil effect */}
          <mesh rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.6, 8]} />
            <meshStandardMaterial color="#FF4444" metalness={0.6} roughness={0.3} wireframe />
          </mesh>
        </group>
      ))}

      {/* === A-ARM SUSPENSION LINKS === */}
      {[
        { x: -0.8, z: 1.4, angle: 0.3 }, { x: 0.8, z: 1.4, angle: -0.3 },
        { x: -0.8, z: -1.0, angle: 0.3 }, { x: 0.8, z: -1.0, angle: -0.3 }
      ].map((arm, i) => (
        <mesh key={i} position={[arm.x, -0.55, arm.z]} rotation={[0, arm.angle, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.12]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Monster Jam themed decorations */}
      <ThemeDecorations style={style} />
    </group>
  );
}

export function MonsterTruck({
  position = [0, 3, 0],
  rotation = [0, 0, 0],
  color = '#FF6B6B',
  truckStyle = 'classic',
  onPositionUpdate,
  inputState,
  isPlayer = false,
  gameMode = 'race',
}: MonsterTruckProps) {
  const chassisRef = useRef<RapierRigidBody>(null);
  const steerAngle = useRef(0);
  const currentSpeed = useRef(0);
  const currentRotation = useRef(rotation[1]);
  const wheelSpin = useRef(0);

  // Vertical physics for jump mode
  const verticalVelocity = useRef(0);
  const currentY = useRef(position[1]);
  const isAirborne = useRef(false);

  // Track position for particle effects
  const [truckPos, setTruckPos] = useState(new THREE.Vector3(position[0], position[1], position[2]));
  const [throttle, setThrottle] = useState(0);

  // Theme-appropriate secondary colors for Monster Jam trucks
  const secondaryColors: Record<string, string> = {
    '#FF6B6B': '#FFD700',     // Classic red/gold
    '#4ECDC4': '#FF6B6B',     // Teal/red
    '#7BC74D': '#FFFFFF',     // Green/white
    '#9B5DE5': '#FFD700',     // Purple/gold
    '#FF9F43': '#000000',     // Orange/black
    '#1E90FF': '#00BFFF',     // Shark blue/light blue (Megalodon)
    '#228B22': '#8B0000',     // Dragon green/dark red
    '#FF4500': '#FFD700',     // Bull orange-red/gold (El Toro Loco)
    '#32CD32': '#FF6600',     // Lime green/orange (Grave Digger style)
  };
  const secondaryColor = secondaryColors[color] || '#FFFFFF';

  const input = inputState || {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    boost: false,
  };

  useFrame((state, delta) => {
    if (!chassisRef.current) return;

    const chassis = chassisRef.current;
    const pos = chassis.translation();

    // Use slower speed in jump mode
    const effectiveMaxSpeed = gameMode === 'jump' ? JUMP_MODE_SPEED : MAX_SPEED;

    // ARCADE PHYSICS
    if (input.forward) {
      const boost = input.boost ? 1.4 : 1;
      currentSpeed.current = Math.min(effectiveMaxSpeed * boost, currentSpeed.current + ACCELERATION * delta);
    } else if (input.backward) {
      currentSpeed.current = Math.max(-effectiveMaxSpeed * 0.4, currentSpeed.current - ACCELERATION * delta);
    } else if (input.brake) {
      if (currentSpeed.current > 0) {
        currentSpeed.current = Math.max(0, currentSpeed.current - BRAKE_FORCE * delta);
      } else {
        currentSpeed.current = Math.min(0, currentSpeed.current + BRAKE_FORCE * delta);
      }
    } else {
      currentSpeed.current *= FRICTION;
      if (Math.abs(currentSpeed.current) < 0.1) currentSpeed.current = 0;
    }

    // Steering - kid-friendly with auto-straightening assist
    const speedFactor = Math.abs(currentSpeed.current) / MAX_SPEED;
    const turnMultiplier = 1 - (speedFactor * TURN_SPEED_REDUCTION);
    const effectiveTurnSpeed = TURN_SPEED * turnMultiplier;

    const isSteering = input.left || input.right;

    if (Math.abs(currentSpeed.current) > 0.5) {
      if (input.left) {
        currentRotation.current += effectiveTurnSpeed * delta * Math.sign(currentSpeed.current);
      }
      if (input.right) {
        currentRotation.current -= effectiveTurnSpeed * delta * Math.sign(currentSpeed.current);
      }

      // AUTO-STRAIGHTENING for kids when not actively steering
      // Helps the truck naturally go straighter, reducing frustration
      if (!isSteering && gameMode === 'race') {
        // Gently guide toward the track direction
        // This mimics "training wheels" - the truck wants to go straight
        steerAngle.current *= (1 - AUTO_STRAIGHTEN * delta * 2);
      }
    }

    // Visual steering angle
    const targetSteer = (input.left ? 0.4 : 0) - (input.right ? 0.4 : 0);
    steerAngle.current = THREE.MathUtils.lerp(steerAngle.current, targetSteer, 5 * delta);

    // Wheel spin based on speed (radians per second)
    const wheelCircumference = 2 * Math.PI * WHEEL_RADIUS;
    const rotationsPerSecond = currentSpeed.current / wheelCircumference;
    wheelSpin.current += rotationsPerSecond * 2 * Math.PI * delta;

    // Track throttle for exhaust particles
    setThrottle(input.forward ? (input.boost ? 1 : 0.6) : 0);

    // Movement
    const moveX = Math.sin(currentRotation.current) * currentSpeed.current * delta;
    const moveZ = Math.cos(currentRotation.current) * currentSpeed.current * delta;

    const newX = pos.x + moveX;
    const newZ = pos.z + moveZ;

    let finalX = newX;
    let finalZ = newZ;

    // KID-FRIENDLY track boundaries (only in RACE mode)
    // Uses gentle guidance like bumper bowling - no harsh stops!
    if (gameMode === 'race') {
      // Match the kid-friendly winding track from Track3D
      const trackLength = 120;
      const trackWidth = 70;
      const trackRoadWidth = 28; // Wide road for kids

      // Calculate position on the winding track
      // The track has S-curves added to the base oval
      const baseAngle = Math.atan2(newZ / trackWidth, newX / (trackLength * 1.3));

      // Account for the S-curve offsets in the track
      const waveCorrectionX = Math.sin(baseAngle * 2) * 25;
      const waveCorrectionZ = Math.sin(baseAngle * 3) * 15;

      const trackCenterX = Math.cos(baseAngle) * trackLength * 1.3 + waveCorrectionX;
      const trackCenterZ = Math.sin(baseAngle) * trackWidth + waveCorrectionZ;

      const distFromTrackCenter = Math.sqrt(
        Math.pow(newX - trackCenterX, 2) + Math.pow(newZ - trackCenterZ, 2)
      );

      // VERY generous boundary for kids - lots of wiggle room
      const maxDistFromTrack = trackRoadWidth / 2 + 8; // Extra grace for kids

      if (distFromTrackCenter > maxDistFromTrack) {
        // GENTLE GUIDANCE - like bumper bowling!
        // Instead of stopping, gently push back toward track center
        const overDistance = distFromTrackCenter - maxDistFromTrack;
        const pushStrength = Math.min(overDistance / 15, 0.4); // Very gentle push

        // Smoothly blend toward the boundary
        const targetX = trackCenterX + (newX - trackCenterX) * (maxDistFromTrack / distFromTrackCenter);
        const targetZ = trackCenterZ + (newZ - trackCenterZ) * (maxDistFromTrack / distFromTrackCenter);

        // Gentle interpolation - doesn't jerk the truck
        finalX = newX + (targetX - newX) * pushStrength;
        finalZ = newZ + (targetZ - newZ) * pushStrength;

        // MINIMAL speed loss - kids don't get frustrated
        currentSpeed.current *= 0.95; // Only 5% speed loss, barely noticeable
      }
    }

    // JUMP MODE - Keep within rectangular arena bounds
    if (gameMode === 'jump') {
      const arenaHalfWidth = 50;
      const arenaHalfLength = 45;

      // Clamp to arena bounds
      if (Math.abs(finalX) > arenaHalfWidth) {
        finalX = Math.sign(finalX) * arenaHalfWidth;
        currentSpeed.current *= 0.3;
      }
      if (Math.abs(finalZ) > arenaHalfLength) {
        finalZ = Math.sign(finalZ) * arenaHalfLength;
        currentSpeed.current *= 0.3;
      }
    }

    // Keep within overall arena bounds (both modes)
    const maxArenaDistance = 140;
    const distFromOrigin = Math.sqrt(finalX * finalX + finalZ * finalZ);
    if (distFromOrigin > maxArenaDistance) {
      const angle = Math.atan2(finalZ, finalX);
      finalX = Math.cos(angle) * maxArenaDistance;
      finalZ = Math.sin(angle) * maxArenaDistance;
      currentSpeed.current *= 0.2;
    }

    // Calculate ground height (for ramps in jump mode)
    let groundHeight = WHEEL_RADIUS + 0.5; // Default ground level

    if (gameMode === 'jump') {
      // Check if on any ramp - cone-shaped ramps
      const ramps = [
        // Main center ramps
        { x: 0, z: -25, radius: 12, height: 6 },
        { x: 0, z: 25, radius: 12, height: 6 },
        // Left diagonal ramps
        { x: -30, z: -12, radius: 9, height: 4.5 },
        { x: -14, z: 18, radius: 9, height: 4.5 },
        // Right diagonal ramps
        { x: 30, z: -12, radius: 9, height: 4.5 },
        { x: 14, z: 18, radius: 9, height: 4.5 },
        // Corner ramps
        { x: -38, z: -35, radius: 6, height: 3 },
        { x: 38, z: -35, radius: 6, height: 3 },
        { x: -38, z: 35, radius: 6, height: 3 },
        { x: 38, z: 35, radius: 6, height: 3 },
      ];

      for (const ramp of ramps) {
        const dx = finalX - ramp.x;
        const dz = finalZ - ramp.z;
        const distToRamp = Math.sqrt(dx * dx + dz * dz);

        if (distToRamp < ramp.radius) {
          // On the cone ramp - height decreases linearly from center to edge
          const normalizedDist = distToRamp / ramp.radius;
          const rampHeight = ramp.height * (1 - normalizedDist);
          groundHeight = Math.max(groundHeight, WHEEL_RADIUS + 0.5 + rampHeight);
        }
      }

      // Apply gravity and vertical physics
      if (currentY.current > groundHeight + 0.1) {
        // Airborne - apply gravity
        isAirborne.current = true;
        verticalVelocity.current -= GRAVITY * delta;
        currentY.current += verticalVelocity.current * delta;

        // Don't go below ground
        if (currentY.current < groundHeight) {
          currentY.current = groundHeight;
          verticalVelocity.current = 0;
          isAirborne.current = false;
        }
      } else {
        // On ground - follow terrain
        isAirborne.current = false;

        // If ground is higher than current position, we're driving UP the ramp
        if (groundHeight > currentY.current) {
          // Moving up ramp - add upward velocity based on speed and slope
          const slopeUp = groundHeight - currentY.current;
          const upwardBoost = Math.abs(currentSpeed.current) * 0.5;
          verticalVelocity.current = upwardBoost;
        }

        currentY.current = groundHeight;
        verticalVelocity.current = Math.max(0, verticalVelocity.current);
      }
    } else {
      // Race mode - stay at ground level
      currentY.current = groundHeight;
    }

    // Apply position
    const finalY = gameMode === 'jump' ? currentY.current : WHEEL_RADIUS + 0.5;
    chassis.setTranslation({ x: finalX, y: finalY, z: finalZ }, true);
    chassis.setRotation(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, currentRotation.current, 0)),
      true
    );

    chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Update position for particles
    setTruckPos(new THREE.Vector3(finalX, finalY, finalZ));

    if (onPositionUpdate) {
      onPositionUpdate(
        new THREE.Vector3(finalX, finalY, finalZ),
        new THREE.Euler(0, currentRotation.current, 0),
        Math.abs(currentSpeed.current)
      );
    }
  });

  const wheelPositions: Array<{ pos: [number, number, number]; steering: boolean }> = [
    { pos: [-AXLE_WIDTH / 2, 0, BODY_LENGTH / 2 - 0.6], steering: true },
    { pos: [AXLE_WIDTH / 2, 0, BODY_LENGTH / 2 - 0.6], steering: true },
    { pos: [-AXLE_WIDTH / 2, 0, -BODY_LENGTH / 2 + 0.9], steering: false },
    { pos: [AXLE_WIDTH / 2, 0, -BODY_LENGTH / 2 + 0.9], steering: false },
  ];

  return (
    <RigidBody
      ref={chassisRef}
      position={position}
      rotation={rotation}
      colliders={false}
      type="kinematicPosition"
      gravityScale={0}
    >
      <CuboidCollider
        args={[BODY_WIDTH / 2, BODY_HEIGHT / 2, BODY_LENGTH / 2]}
        position={[0, SUSPENSION_HEIGHT + BODY_HEIGHT / 2, 0]}
      />

      <group position={[0, SUSPENSION_HEIGHT + BODY_HEIGHT / 2, 0]}>
        <TruckBody color={color} secondaryColor={secondaryColor} style={truckStyle} />

        {wheelPositions.map((wp, i) => (
          <MonsterWheel
            key={i}
            position={[wp.pos[0], -SUSPENSION_HEIGHT - BODY_HEIGHT / 2 + WHEEL_RADIUS, wp.pos[2]]}
            steering={wp.steering}
            steerAngle={steerAngle.current}
            spinRotation={wheelSpin.current}
            rimColor={secondaryColor}
          />
        ))}
      </group>

      {/* Particle Effects - only for player truck */}
      {isPlayer && (
        <>
          {/* Dust trail from rear wheels */}
          <DustTrail
            position={truckPos}
            speed={currentSpeed.current}
            isActive={Math.abs(currentSpeed.current) > 2}
            color="#8B7355"
          />

          {/* Exhaust smoke */}
          <ExhaustSmoke
            leftPipePosition={truckPos}
            rightPipePosition={truckPos}
            truckRotation={currentRotation.current}
            throttle={throttle}
            isActive={true}
          />

          {/* Mario Kart style boost flames when boosting */}
          <BoostFlame
            position={truckPos}
            rotation={currentRotation.current}
            isActive={input.boost}
            intensity={1.5}
          />
        </>
      )}
    </RigidBody>
  );
}

export default MonsterTruck;
