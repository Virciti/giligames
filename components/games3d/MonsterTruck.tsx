'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { DustTrail, ExhaustSmoke, BoostFlame, DriftSparks } from './particles';
import { getTerrainHeight, isOnBridge, isInTunnel, isInMudPit, getJumpSurfaceType } from './JumpArena';
import { getRaceTrackHeight, getRaceSurfaceType } from './Track3D';

// Cybertruck dimensions - bigger tires, longer body
const BODY_WIDTH = 2.6;
const BODY_HEIGHT = 1.4;
const BODY_LENGTH = 5.0;
const WHEEL_RADIUS = 1.6;
const WHEEL_WIDTH = 1.2;
const SUSPENSION_HEIGHT = 1.2;
const AXLE_WIDTH = 3.4;

// ARCADE PHYSICS - fast race car feel, still easy to control
const MAX_SPEED = 45; // Race car speed!
const ACCELERATION = 25; // Punchy acceleration
const BRAKE_FORCE = 30;
const TURN_SPEED = 2.2; // Responsive steering at speed
const FRICTION = 0.98; // Coasts further at high speed
const TURN_SPEED_REDUCTION = 0.35; // Slight reduction at top speed
const GRAVITY = 25; // Arcade gravity — aligned closer to Scene3D Physics (20) but snappier for gameplay
const JUMP_MODE_SPEED = 32; // Fast in jump mode too
const AUTO_STRAIGHTEN = 0.25; // Helps truck go straight when not steering

// WEIGHT & INERTIA — momentum-based vehicle feel
const STEERING_INERTIA = 6.0; // How quickly yaw velocity responds to input (higher = snappier)
const LATERAL_GRIP = 0.85; // Lateral tire grip (0 = ice, 1 = perfect grip) — controls slide amount
const LATERAL_DECAY = 0.92; // How fast lateral velocity bleeds per frame (frame-rate normalized)
const SUSPENSION_STIFFNESS = 35; // Spring constant for suspension bounce (units/s²)
const SUSPENSION_DAMPING = 8; // Damping factor for suspension oscillation
const LANDING_BOUNCE_FACTOR = 0.3; // How much downward velocity converts to bounce (0 = no bounce, 1 = full)
const BODY_LEAN_FACTOR = 0.06; // How much the body leans into turns (radians per unit of lateral force)
const BODY_PITCH_FACTOR = 0.02; // Forward/back pitch under acceleration/braking

// DRIFT / POWER-SLIDE SYSTEM — Mario Kart inspired
const DRIFT_MIN_SPEED = 15; // Minimum speed to initiate a drift
const DRIFT_CHARGE_RATE = 1.0; // Seconds per drift level (1→2→3)
const DRIFT_MINI_TURBO_SPEEDS = [8, 14, 22]; // Speed boost per level (blue/orange/purple)
const DRIFT_MINI_TURBO_DURATION = [0.6, 1.0, 1.6]; // Boost duration per level
const DRIFT_LATERAL_GRIP = 0.6; // Reduced grip while drifting (0 = ice, 1 = full grip)
const DRIFT_TURN_BOOST = 1.6; // Steering multiplier while drifting (tighter turns)
const DRIFT_COUNTER_STEER_BONUS = 1.5; // Charge rate bonus for counter-steering

interface MonsterTruckProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  truckStyle?: 'flames' | 'shark' | 'classic' | 'dragon' | 'stars';
  onPositionUpdate?: (position: THREE.Vector3, rotation: THREE.Euler, speed: number) => void;
  onDriftUpdate?: (isDrifting: boolean, driftLevel: number) => void;
  inputState?: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    brake: boolean;
    boost: boolean;
    drift: boolean;
  };
  isPlayer?: boolean;
  gameMode?: 'race' | 'jump';
  speedMultiplier?: number;
  spinUntil?: number;
}

// Cybertruck wheel with aggressive off-road treads and pentagonal aero covers
function MonsterWheel({
  position,
  steering = false,
  steerAngle = 0,
  spinRotation = 0,
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
      {/* Main tire - black rubber with realistic sheen */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.92} />
      </mesh>

      {/* Outer sidewall ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[WHEEL_RADIUS * 0.85, 0.18, 8, 32]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.85} />
      </mesh>

      {/* Inner sidewall ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[WHEEL_RADIUS * 0.6, 0.1, 8, 32]} />
        <meshStandardMaterial color="#222" roughness={0.85} />
      </mesh>

      {/* Raised sidewall lettering blocks */}
      {[0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2].map((ang, i) => (
        <mesh
          key={`letter-${i}`}
          position={[
            -WHEEL_WIDTH / 2 - 0.02,
            Math.sin(ang) * WHEEL_RADIUS * 0.85,
            Math.cos(ang) * WHEEL_RADIUS * 0.85,
          ]}
          rotation={[ang, 0, Math.PI / 2]}
        >
          <boxGeometry args={[0.04, 0.07, 0.18]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
      ))}

      {/* Deep aggressive tread blocks - 20 for bigger tires */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        return (
          <group key={i}>
            <mesh
              position={[
                0,
                Math.sin(angle) * WHEEL_RADIUS * 0.95,
                Math.cos(angle) * WHEEL_RADIUS * 0.95,
              ]}
              rotation={[angle, 0, Math.PI / 2]}
              castShadow
            >
              <boxGeometry args={[WHEEL_WIDTH * 0.9, 0.25, 0.4]} />
              <meshStandardMaterial color="#080808" roughness={1} />
            </mesh>
            <mesh
              position={[
                0,
                Math.sin(angle + 0.08) * WHEEL_RADIUS * 0.88,
                Math.cos(angle + 0.08) * WHEEL_RADIUS * 0.88,
              ]}
              rotation={[angle + 0.08, 0, Math.PI / 2]}
            >
              <boxGeometry args={[WHEEL_WIDTH * 0.7, 0.15, 0.25]} />
              <meshStandardMaterial color="#0a0a0a" roughness={1} />
            </mesh>
          </group>
        );
      })}

      {/* Pentagonal aero wheel cover - left side */}
      <group position={[-WHEEL_WIDTH / 2 - 0.02, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WHEEL_RADIUS * 0.55, WHEEL_RADIUS * 0.55, 0.08, 5]} />
          <meshStandardMaterial color="#555" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.12, 5]} />
          <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
        </mesh>
        {[...Array(5)].map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={`spoke-l-${i}`} position={[-0.03, Math.sin(a) * WHEEL_RADIUS * 0.3, Math.cos(a) * WHEEL_RADIUS * 0.3]} rotation={[a, 0, Math.PI / 2]}>
              <boxGeometry args={[0.06, 0.1, WHEEL_RADIUS * 0.45]} />
              <meshStandardMaterial color="#666" metalness={0.85} roughness={0.2} />
            </mesh>
          );
        })}
        {[...Array(5)].map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={`lug-l-${i}`} position={[-0.08, Math.sin(a) * 0.35, Math.cos(a) * 0.35]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 5]} />
              <meshStandardMaterial color="#777" metalness={0.95} roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* Pentagonal aero wheel cover - right side */}
      <group position={[WHEEL_WIDTH / 2 + 0.02, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WHEEL_RADIUS * 0.55, WHEEL_RADIUS * 0.55, 0.08, 5]} />
          <meshStandardMaterial color="#555" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.12, 5]} />
          <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
        </mesh>
        {[...Array(5)].map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={`spoke-r-${i}`} position={[0.03, Math.sin(a) * WHEEL_RADIUS * 0.3, Math.cos(a) * WHEEL_RADIUS * 0.3]} rotation={[a, 0, Math.PI / 2]}>
              <boxGeometry args={[0.06, 0.1, WHEEL_RADIUS * 0.45]} />
              <meshStandardMaterial color="#666" metalness={0.85} roughness={0.2} />
            </mesh>
          );
        })}
        {[...Array(5)].map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={`lug-r-${i}`} position={[0.08, Math.sin(a) * 0.35, Math.cos(a) * 0.35]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 5]} />
              <meshStandardMaterial color="#777" metalness={0.95} roughness={0.1} />
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

// Ultra-realistic Cybertruck body with angular stainless steel panels
function TruckBody({
  color = '#C8CDD0',
}: {
  color?: string;
  secondaryColor?: string;
  style?: string;
}) {
  // Build Cybertruck angular body geometry and side window shapes
  const { bodyGeometry, windowShape } = useMemo(() => {
    // Side profile of Cybertruck (z=forward, y=up)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(2.5, -0.3);     // nose bottom
    bodyShape.lineTo(2.5, 0.1);      // nose top
    bodyShape.lineTo(1.2, 0.35);     // hood surface
    bodyShape.lineTo(0.2, 1.3);      // windshield top
    bodyShape.lineTo(-0.3, 1.3);     // roof flat section
    bodyShape.lineTo(-2.5, 0.7);     // bed slopes down to tail
    bodyShape.lineTo(-2.5, -0.3);    // tailgate bottom
    bodyShape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      steps: 1,
      depth: BODY_WIDTH,
      bevelEnabled: false,
    });
    bodyGeo.translate(0, 0, -BODY_WIDTH / 2);
    bodyGeo.computeVertexNormals();

    // Side window shape (sail pillar - no B-pillar)
    const winShape = new THREE.Shape();
    winShape.moveTo(1.15, 0.45);
    winShape.lineTo(0.25, 1.2);
    winShape.lineTo(-0.25, 1.2);
    winShape.lineTo(-1.8, 0.65);
    winShape.lineTo(-1.8, 0.45);
    winShape.closePath();

    return { bodyGeometry: bodyGeo, windowShape: winShape };
  }, []);

  // Procedural brushed metal roughness map
  const brushedMetalMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#707070';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 2) {
      const brightness = 96 + Math.random() * 64;
      ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
      ctx.fillRect(0, y, 512, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);

  return (
    <group>
      {/* === CYBERTRUCK MAIN BODY SHELL (extruded angular profile) === */}
      <mesh geometry={bodyGeometry} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#C8CDD0"
          metalness={0.95}
          roughness={0.28}
          roughnessMap={brushedMetalMap}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
          envMapIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === BLACK LOWER BODY CLADDING (visible in reference photos) === */}
      {[-1, 1].map((side, i) => (
        <mesh key={`lower-${i}`} position={[side * (BODY_WIDTH / 2 - 0.05), -0.15, -0.2]} castShadow>
          <boxGeometry args={[0.12, 0.35, 4.6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, -0.15, 2.35]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.9, 0.35, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.15, -2.35]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.9, 0.35, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* === SIDE BODY CREASE LINES (signature fold) === */}
      {[-1, 1].map((side, i) => (
        <mesh key={`crease-${i}`} position={[side * (BODY_WIDTH / 2 + 0.005), 0.05, -0.2]}>
          <boxGeometry args={[0.015, 0.025, 4.5]} />
          <meshStandardMaterial color="#B0B5B8" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

      {/* === WINDSHIELD - steep angular rake (dark tinted armor glass) === */}
      <mesh position={[0, 0.825, 0.7]} rotation={[0.76, 0, 0]}>
        <planeGeometry args={[BODY_WIDTH * 0.88, 1.38]} />
        <meshPhysicalMaterial
          color="#0a0a0a"
          metalness={0.0}
          roughness={0.05}
          transparent
          opacity={0.75}
          depthWrite={false}
          envMapIntensity={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* === GLASS ROOF PANEL (near-black tint) === */}
      <mesh position={[0, 1.31, -0.05]}>
        <boxGeometry args={[BODY_WIDTH * 0.85, 0.02, 0.55]} />
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.05}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* === SIDE WINDOWS (sail pillar design - no B-pillar) === */}
      {[-1, 1].map((side, i) => (
        <mesh
          key={`window-${i}`}
          position={[side * (BODY_WIDTH * 0.501), 0, 0]}
          rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <shapeGeometry args={[windowShape]} />
          <meshStandardMaterial
            color="#0a0a0a"
            roughness={0.05}
            transparent
            opacity={0.65}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* === TRAPEZOIDAL WHEEL ARCH CUTOUTS (prominent black recesses) === */}
      {[-1, 1].map((side, i) => (
        <mesh key={`fwa-${i}`} position={[side * (BODY_WIDTH / 2 + 0.01), -0.15, 1.7]}>
          <boxGeometry args={[0.06, 0.8, 1.2]} />
          <meshStandardMaterial color="#111" roughness={0.95} />
        </mesh>
      ))}
      {[-1, 1].map((side, i) => (
        <mesh key={`rwa-${i}`} position={[side * (BODY_WIDTH / 2 + 0.01), -0.15, -1.4]}>
          <boxGeometry args={[0.06, 0.8, 1.3]} />
          <meshStandardMaterial color="#111" roughness={0.95} />
        </mesh>
      ))}

      {/* === FRONT LED LIGHT BAR (full-width) === */}
      <group position={[0, 0.05, 2.51]}>
        <mesh>
          <boxGeometry args={[BODY_WIDTH * 0.92, 0.07, 0.03]} />
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[BODY_WIDTH * 0.88, 0.04, 0.01]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={5.0}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#FFFAF0" intensity={3} distance={30} position={[0, 0, 0.1]} />
      </group>

      {/* === REAR LED TAILLIGHT BAR (full-width red strip - key visual) === */}
      <group position={[0, 0.55, -2.51]}>
        <mesh>
          <boxGeometry args={[BODY_WIDTH * 0.92, 0.06, 0.03]} />
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[BODY_WIDTH * 0.88, 0.04, 0.01]} />
          <meshStandardMaterial
            color="#FF1111"
            emissive="#FF0000"
            emissiveIntensity={4.0}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#FF2200" intensity={1.5} distance={15} position={[0, 0, -0.1]} />
      </group>

      {/* === REAR TAILGATE PANEL (stainless steel) === */}
      <mesh position={[0, 0.2, -2.51]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.95, 0.95, 0.04]} />
        <meshPhysicalMaterial
          color="#C8CDD0"
          metalness={0.95}
          roughness={0.28}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* === FRONT FLAT FASCIA PANEL (no grille - electric) === */}
      <mesh position={[0, -0.1, 2.51]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.95, 0.35, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* === LOWER CHASSIS SKID PLATE === */}
      <mesh position={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[BODY_WIDTH * 0.85, 0.1, BODY_LENGTH * 0.95]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* === BED VAULT INTERIOR FLOOR === */}
      <mesh position={[0, 0.0, -1.5]}>
        <boxGeometry args={[BODY_WIDTH * 0.8, 0.05, 2.0]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>

      {/* === SHOCK ABSORBERS (visible suspension) === */}
      {[
        { x: -1.3, z: 1.7 }, { x: 1.3, z: 1.7 },
        { x: -1.3, z: -1.4 }, { x: 1.3, z: -1.4 }
      ].map((pos, i) => (
        <group key={`shock-${i}`} position={[pos.x, -0.4, pos.z]}>
          <mesh rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 1.0, 8]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.7, 8]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} wireframe />
          </mesh>
        </group>
      ))}

      {/* === A-ARM SUSPENSION LINKS === */}
      {[
        { x: -1.0, z: 1.7, angle: 0.3 }, { x: 1.0, z: 1.7, angle: -0.3 },
        { x: -1.0, z: -1.4, angle: 0.3 }, { x: 1.0, z: -1.4, angle: -0.3 }
      ].map((arm, i) => (
        <mesh key={`arm-${i}`} position={[arm.x, -0.55, arm.z]} rotation={[0, arm.angle, 0]}>
          <boxGeometry args={[0.8, 0.08, 0.12]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* LED accent color indicators using player color */}
      {[-1, 1].map((side, i) => (
        <mesh key={`accent-${i}`} position={[side * (BODY_WIDTH / 2 + 0.01), 0.05, 2.3]}>
          <boxGeometry args={[0.02, 0.04, 0.3]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function MonsterTruck({
  position = [0, 3, 0],
  rotation = [0, 0, 0],
  color = '#FF6B6B',
  truckStyle = 'classic',
  onPositionUpdate,
  onDriftUpdate,
  inputState,
  isPlayer = false,
  gameMode = 'race',
  speedMultiplier = 1,
  spinUntil = 0,
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
  const smoothGroundHeight = useRef(position[1]); // Smoothed terrain height to prevent jitter

  // DRIFT STATE — power-slide state machine
  // States: 'none' → 'drifting' → 'mini-turbo' (on release)
  const driftState = useRef<'none' | 'drifting' | 'mini-turbo'>('none');
  const driftDirection = useRef(0); // -1 = left, +1 = right (locked at drift start)
  const driftCharge = useRef(0); // 0 → 3 seconds of drift time
  const driftLevel = useRef(0); // 0 = none, 1 = blue, 2 = orange, 3 = purple
  const miniTurboTimer = useRef(0); // Remaining mini-turbo boost time
  const miniTurboSpeed = useRef(0); // Speed bonus from mini-turbo

  // WEIGHT & INERTIA STATE — momentum-based physics
  const yawVelocity = useRef(0); // Current rotational velocity (rad/s) — smoothed steering
  const lateralVelocity = useRef(0); // Sideways slide velocity (positive = sliding right)
  const suspensionOffset = useRef(0); // Current suspension compression (-1 to 1)
  const suspensionVelocity = useRef(0); // Suspension spring velocity
  const wasAirborne = useRef(false); // Track landing for bounce trigger
  const bodyLean = useRef(0); // Current body roll angle (smoothed)
  const bodyPitch = useRef(0); // Current body pitch angle (smoothed)

  // Surface-dependent friction state
  const surfaceDustColor = useRef('#C4A070'); // Current dust color from surface type
  const surfaceSpeedFriction = useRef(1.0); // Current speed friction from surface
  const surfaceLateralGrip = useRef(1.0); // Current lateral grip from surface

  // Boost pad activation — timed speed burst when driving over boost pads
  const boostPadTimer = useRef(0); // Remaining boost pad effect time
  const BOOST_PAD_SPEED_MULT = 1.5; // 1.5x speed on boost pad
  const BOOST_PAD_DURATION = 1.5; // Seconds of boost effect

  // Track position for particle effects (refs to avoid re-renders in useFrame)
  const truckPosRef = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const throttleRef = useRef(0);
  // Reusable objects to avoid per-frame allocations
  const _tmpQuat = useRef(new THREE.Quaternion());
  const _tmpEuler = useRef(new THREE.Euler());
  const _tmpVec = useRef(new THREE.Vector3());

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
    drift: false,
  };

  useFrame((state, delta) => {
    if (!chassisRef.current) return;

    const chassis = chassisRef.current;
    const pos = chassis.translation();

    // Use slower speed in jump mode, scale by user's speed level
    const effectiveMaxSpeed = (gameMode === 'jump' ? JUMP_MODE_SPEED : MAX_SPEED) * speedMultiplier;
    const effectiveAcceleration = ACCELERATION * speedMultiplier;

    // SPIN/SLIP — banana hit overrides normal controls
    const isSpinning = spinUntil > 0 && performance.now() / 1000 < spinUntil;

    // ARCADE PHYSICS
    if (isSpinning) {
      // Rapid uncontrolled spin + heavy speed loss
      currentSpeed.current *= Math.pow(0.92, delta * 60); // Bleed speed fast (frame-rate independent)
      currentRotation.current += 8 * delta; // Fast spin (~1.3 rev/s)
    } else if (input.forward) {
      const boost = input.boost ? 1.4 : 1;
      currentSpeed.current = Math.min(effectiveMaxSpeed * boost, currentSpeed.current + effectiveAcceleration * delta);
    } else if (input.backward) {
      currentSpeed.current = Math.max(-effectiveMaxSpeed * 0.4, currentSpeed.current - effectiveAcceleration * delta);
    } else if (input.brake) {
      if (currentSpeed.current > 0) {
        currentSpeed.current = Math.max(0, currentSpeed.current - BRAKE_FORCE * delta);
      } else {
        currentSpeed.current = Math.min(0, currentSpeed.current + BRAKE_FORCE * delta);
      }
    } else {
      currentSpeed.current *= Math.pow(FRICTION, delta * 60); // Frame-rate independent coasting
      if (Math.abs(currentSpeed.current) < 0.1) currentSpeed.current = 0;
    }

    // Steering — momentum-based with inertia (weight & feel)
    // Instead of instant direction changes, yaw velocity builds up and decays
    const speedFactor = Math.abs(currentSpeed.current) / MAX_SPEED;
    const turnMultiplier = 1 - (speedFactor * TURN_SPEED_REDUCTION);
    const effectiveTurnSpeed = TURN_SPEED * turnMultiplier;

    const isSteering = input.left || input.right;

    if (!isSpinning && Math.abs(currentSpeed.current) > 0.5) {
      // Compute target yaw velocity from input
      let targetYawVelocity = 0;
      if (input.left) targetYawVelocity += effectiveTurnSpeed * Math.sign(currentSpeed.current);
      if (input.right) targetYawVelocity -= effectiveTurnSpeed * Math.sign(currentSpeed.current);

      // Smooth yaw velocity toward target (steering inertia)
      // Higher STEERING_INERTIA = faster response, lower = more sluggish/weighty
      const inertiaFactor = 1 - Math.pow(0.01, STEERING_INERTIA * delta);
      yawVelocity.current += (targetYawVelocity - yawVelocity.current) * inertiaFactor;

      // AUTO-STRAIGHTENING for kids when not actively steering
      if (!isSteering && gameMode === 'race') {
        steerAngle.current *= (1 - AUTO_STRAIGHTEN * delta * 2);
        // Also decay yaw velocity when not steering (self-centering)
        yawVelocity.current *= Math.pow(0.05, delta);
      }
    } else if (!isSpinning) {
      // At very low speed, rapidly decay yaw velocity
      yawVelocity.current *= Math.pow(0.01, delta);
    }

    // Apply yaw velocity to rotation
    currentRotation.current += yawVelocity.current * delta;

    // ── LATERAL GRIP MODEL ──
    // When turning at speed, the truck builds lateral (sideways) velocity
    // This creates a natural slide feel — the faster you turn, the more you slide
    const lateralForce = yawVelocity.current * Math.abs(currentSpeed.current) * (1 - LATERAL_GRIP);
    lateralVelocity.current += lateralForce * delta;
    // Tire grip pulls lateral velocity back toward zero
    lateralVelocity.current *= Math.pow(LATERAL_DECAY, delta * 60);
    // Clamp to prevent extreme slides
    lateralVelocity.current = Math.max(-15, Math.min(15, lateralVelocity.current));

    // Visual steering angle
    const targetSteer = (input.left ? 0.4 : 0) - (input.right ? 0.4 : 0);
    steerAngle.current = THREE.MathUtils.lerp(steerAngle.current, targetSteer, 5 * delta);

    // ── BODY LEAN & PITCH ──
    // Lean into turns (roll) and pitch under acceleration/braking
    const targetLean = -yawVelocity.current * speedFactor * BODY_LEAN_FACTOR * 15;
    bodyLean.current = THREE.MathUtils.lerp(bodyLean.current, targetLean, Math.min(1, 8 * delta));

    const accelInput = input.forward ? 1 : (input.brake ? -1 : (input.backward ? -0.5 : 0));
    const targetPitch = -accelInput * BODY_PITCH_FACTOR * 8;
    bodyPitch.current = THREE.MathUtils.lerp(bodyPitch.current, targetPitch, Math.min(1, 6 * delta));

    // ── DRIFT / POWER-SLIDE STATE MACHINE ──
    // Trigger: hold drift button + steering at speed > DRIFT_MIN_SPEED
    // Charge: holding drift builds charge through 3 levels (blue → orange → purple)
    // Release: releasing drift grants a mini-turbo speed burst proportional to charge
    const canDrift = Math.abs(currentSpeed.current) > DRIFT_MIN_SPEED && !isSpinning && !isAirborne.current;
    const wantsDrift = input.drift && isSteering && canDrift;

    if (driftState.current === 'none') {
      if (wantsDrift) {
        // Initiate drift — lock direction at the moment drift starts
        driftState.current = 'drifting';
        driftDirection.current = input.left ? -1 : 1;
        driftCharge.current = 0;
        driftLevel.current = 1; // Start at blue
      }
    } else if (driftState.current === 'drifting') {
      if (!input.drift || Math.abs(currentSpeed.current) < DRIFT_MIN_SPEED * 0.5 || isSpinning) {
        // Release drift → trigger mini-turbo if charged
        const level = driftLevel.current;
        if (level > 0) {
          driftState.current = 'mini-turbo';
          miniTurboTimer.current = DRIFT_MINI_TURBO_DURATION[level - 1];
          miniTurboSpeed.current = DRIFT_MINI_TURBO_SPEEDS[level - 1];
        } else {
          driftState.current = 'none';
        }
        driftCharge.current = 0;
        driftLevel.current = 0;
        onDriftUpdate?.(false, 0);
      } else {
        // Continue drifting — accumulate charge
        // Counter-steering (steering opposite to drift direction) charges faster
        const isCounterSteering =
          (driftDirection.current < 0 && input.right) ||
          (driftDirection.current > 0 && input.left);
        const chargeMultiplier = isCounterSteering ? DRIFT_COUNTER_STEER_BONUS : 1.0;
        driftCharge.current += delta * chargeMultiplier;

        // Level up based on accumulated charge time
        const prevLevel = driftLevel.current;
        if (driftCharge.current >= DRIFT_CHARGE_RATE * 2) {
          driftLevel.current = 3; // Purple
        } else if (driftCharge.current >= DRIFT_CHARGE_RATE) {
          driftLevel.current = 2; // Orange
        } else {
          driftLevel.current = 1; // Blue
        }

        // Apply drift physics: enhanced turning + reduced grip
        const driftTurnBoost = DRIFT_TURN_BOOST;
        const driftTurnAmount = effectiveTurnSpeed * driftTurnBoost * delta * Math.sign(currentSpeed.current);
        // Drift auto-steers in the locked direction, with extra turn from input
        currentRotation.current += driftDirection.current * driftTurnAmount * 0.4;

        // Notify parent of drift level changes
        if (driftLevel.current !== prevLevel || prevLevel === 0) {
          onDriftUpdate?.(true, driftLevel.current);
        }
      }
    }

    // Mini-turbo boost application (after drift release)
    if (driftState.current === 'mini-turbo') {
      miniTurboTimer.current -= delta;
      if (miniTurboTimer.current <= 0) {
        driftState.current = 'none';
        miniTurboSpeed.current = 0;
      } else {
        // Apply mini-turbo: add speed bonus on top of normal max
        const turboBoost = miniTurboSpeed.current * (miniTurboTimer.current > 0.3 ? 1 : miniTurboTimer.current / 0.3);
        currentSpeed.current = Math.min(
          effectiveMaxSpeed + miniTurboSpeed.current,
          currentSpeed.current + turboBoost * delta * 20
        );
      }
    }

    // Wheel spin based on speed (radians per second)
    const wheelCircumference = 2 * Math.PI * WHEEL_RADIUS;
    const rotationsPerSecond = currentSpeed.current / wheelCircumference;
    wheelSpin.current += rotationsPerSecond * 2 * Math.PI * delta;

    // Track throttle for exhaust particles
    throttleRef.current = input.forward ? (input.boost ? 1 : 0.6) : 0;

    // Movement — forward velocity + lateral slide from inertia
    const isDrifting = driftState.current === 'drifting';
    // Forward movement along truck heading
    const moveX = Math.sin(currentRotation.current) * currentSpeed.current * delta;
    const moveZ = Math.cos(currentRotation.current) * currentSpeed.current * delta;
    // Lateral slide perpendicular to heading (from grip model)
    const lateralX = Math.cos(currentRotation.current) * lateralVelocity.current * delta;
    const lateralZ = -Math.sin(currentRotation.current) * lateralVelocity.current * delta;

    const newX = pos.x + moveX + lateralX;
    const newZ = pos.z + moveZ + lateralZ;

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

    // JUMP MODE - Keep within expanded open world bounds (smooth push-back)
    if (gameMode === 'jump') {
      const arenaHalfWidth = 210;
      const arenaHalfLength = 200;

      // Smooth push-back instead of hard clamp — prevents camera jitter
      const overX = Math.abs(finalX) - arenaHalfWidth;
      if (overX > 0) {
        const pushBack = Math.min(overX / 10, 0.5); // Gradual push, max 50%
        finalX = finalX + (Math.sign(finalX) * -arenaHalfWidth - finalX) * pushBack;
        currentSpeed.current *= Math.pow(0.3, delta * 60);
      }
      const overZ = Math.abs(finalZ) - arenaHalfLength;
      if (overZ > 0) {
        const pushBack = Math.min(overZ / 10, 0.5);
        finalZ = finalZ + (Math.sign(finalZ) * -arenaHalfLength - finalZ) * pushBack;
        currentSpeed.current *= Math.pow(0.3, delta * 60);
      }

      // Surface-dependent friction (jump mode) — replaces old hardcoded mud pit check
      const jumpSurface = getJumpSurfaceType(finalX, finalZ);
      surfaceSpeedFriction.current = jumpSurface.speedFriction;
      surfaceLateralGrip.current = jumpSurface.lateralGrip;
      surfaceDustColor.current = jumpSurface.dustColor;
      if (jumpSurface.speedFriction < 1.0) {
        currentSpeed.current *= Math.pow(jumpSurface.speedFriction, delta * 60);
      }
      // Surface lateral grip reduces slide control
      lateralVelocity.current *= Math.pow(jumpSurface.lateralGrip, delta * 60);
    }

    // Surface-dependent friction (race mode)
    if (gameMode === 'race') {
      const raceSurface = getRaceSurfaceType(finalX, finalZ);
      surfaceSpeedFriction.current = raceSurface.speedFriction;
      surfaceLateralGrip.current = raceSurface.lateralGrip;
      surfaceDustColor.current = raceSurface.dustColor;
      if (raceSurface.speedFriction < 1.0) {
        currentSpeed.current *= Math.pow(raceSurface.speedFriction, delta * 60);
      }
      // Lateral grip modifier from surface
      lateralVelocity.current *= Math.pow(raceSurface.lateralGrip, delta * 60);

      // Boost pad activation — trigger timed speed burst
      if (raceSurface.type === 'boost-pad' && boostPadTimer.current <= 0) {
        boostPadTimer.current = BOOST_PAD_DURATION;
      }

      // Oil slick — add lateral slide impulse for kid-friendly spin feel
      if (raceSurface.type === 'oil-slick') {
        lateralVelocity.current += (Math.random() - 0.5) * 2 * delta;
      }
    }

    // Boost pad speed application (works across both modes, timer counts down)
    if (boostPadTimer.current > 0) {
      boostPadTimer.current -= delta;
      const boostFade = boostPadTimer.current > 0.3 ? 1 : boostPadTimer.current / 0.3;
      const boostSpeed = effectiveMaxSpeed * BOOST_PAD_SPEED_MULT;
      currentSpeed.current = Math.min(boostSpeed, currentSpeed.current + boostSpeed * boostFade * delta * 8);
    }

    // Keep within overall arena bounds (both modes) — smooth radial push-back
    const maxArenaDistance = gameMode === 'jump' ? 280 : 220;
    const distFromOrigin = Math.sqrt(finalX * finalX + finalZ * finalZ);
    if (distFromOrigin > maxArenaDistance) {
      const overDist = distFromOrigin - maxArenaDistance;
      const pushBack = Math.min(overDist / 15, 0.5); // Gradual radial push
      const angle = Math.atan2(finalZ, finalX);
      const targetX = Math.cos(angle) * maxArenaDistance;
      const targetZ = Math.sin(angle) * maxArenaDistance;
      finalX = finalX + (targetX - finalX) * pushBack;
      finalZ = finalZ + (targetZ - finalZ) * pushBack;
      currentSpeed.current *= Math.pow(0.2, delta * 60);
    }

    // Calculate ground height (for ramps in jump mode)
    let groundHeight = WHEEL_RADIUS + 0.5; // Default ground level

    if (gameMode === 'jump') {
      // Get terrain height from shared terrain function
      const terrainH = getTerrainHeight(finalX, finalZ);
      groundHeight = WHEEL_RADIUS + 0.5 + Math.max(0, terrainH);

      // Check if on a bridge
      const bridgeCheck = isOnBridge(finalX, finalZ);
      if (bridgeCheck.onBridge) {
        groundHeight = Math.max(groundHeight, WHEEL_RADIUS + 0.5 + bridgeCheck.height);
      }

      // Tunnel - keep at ground level inside (floor is flat)
      const tunnelCheck = isInTunnel(finalX, finalZ);
      if (tunnelCheck.inTunnel) {
        groundHeight = WHEEL_RADIUS + 0.5;
      }

      // Check if on any ramp - cone-shaped ramps spread across the world
      const ramps = [
        { x: 0, z: -30, radius: 12, height: 6 },
        { x: 0, z: 50, radius: 12, height: 6 },
        { x: -60, z: -80, radius: 12, height: 6 },
        { x: 80, z: -60, radius: 9, height: 4.5 },
        { x: -40, z: 60, radius: 9, height: 4.5 },
        { x: 100, z: 40, radius: 9, height: 4.5 },
        { x: -120, z: -120, radius: 9, height: 4.5 },
        { x: 130, z: 120, radius: 6, height: 3 },
        { x: -150, z: 80, radius: 6, height: 3 },
        { x: 40, z: -140, radius: 6, height: 3 },
        { x: -100, z: 150, radius: 6, height: 3 },
        { x: 160, z: -80, radius: 6, height: 3 },
      ];

      for (const ramp of ramps) {
        const dx = finalX - ramp.x;
        const dz = finalZ - ramp.z;
        const distToRamp = Math.sqrt(dx * dx + dz * dz);

        if (distToRamp < ramp.radius) {
          const normalizedDist = distToRamp / ramp.radius;
          const rampHeight = ramp.height * (1 - normalizedDist);
          groundHeight = Math.max(groundHeight, WHEEL_RADIUS + 0.5 + rampHeight);
        }
      }

      // Smooth the ground height to prevent jitter from terrain noise
      // Use gentle lerp (4/s) — fast enough to track terrain, slow enough to prevent camera jitter
      const lerpSpeed = 4;
      smoothGroundHeight.current = THREE.MathUtils.lerp(
        smoothGroundHeight.current,
        groundHeight,
        Math.min(1, lerpSpeed * delta)
      );
      const smoothGround = smoothGroundHeight.current;

      // Apply gravity and vertical physics
      if (currentY.current > smoothGround + 0.1) {
        isAirborne.current = true;
        verticalVelocity.current -= GRAVITY * delta;
        currentY.current += verticalVelocity.current * delta;

        if (currentY.current < smoothGround) {
          // Landing! Trigger suspension bounce
          const impactVelocity = Math.abs(verticalVelocity.current);
          suspensionVelocity.current = -impactVelocity * LANDING_BOUNCE_FACTOR;
          currentY.current = smoothGround;
          verticalVelocity.current = 0;
          isAirborne.current = false;
        }
      } else {
        isAirborne.current = false;

        if (smoothGround > currentY.current + 0.5) {
          // Only launch off ramps, not tiny terrain bumps
          const upwardBoost = Math.abs(currentSpeed.current) * 0.5;
          verticalVelocity.current = upwardBoost;
        }

        currentY.current = smoothGround;
        verticalVelocity.current = Math.max(0, verticalVelocity.current);
      }
    } else {
      // Race mode - follow track elevation with vertical physics
      const trackH = getRaceTrackHeight(finalX, finalZ);
      groundHeight = WHEEL_RADIUS + 0.5 + trackH;

      smoothGroundHeight.current = THREE.MathUtils.lerp(
        smoothGroundHeight.current,
        groundHeight,
        Math.min(1, 4 * delta)
      );
      const smoothGround = smoothGroundHeight.current;

      if (currentY.current > smoothGround + 0.15) {
        // Airborne - apply gravity
        isAirborne.current = true;
        verticalVelocity.current -= GRAVITY * delta;
        currentY.current += verticalVelocity.current * delta;
        if (currentY.current <= smoothGround) {
          // Landing! Trigger suspension bounce
          const impactVelocity = Math.abs(verticalVelocity.current);
          suspensionVelocity.current = -impactVelocity * LANDING_BOUNCE_FACTOR;
          currentY.current = smoothGround;
          verticalVelocity.current = 0;
          isAirborne.current = false;
        }
      } else {
        isAirborne.current = false;
        currentY.current = smoothGround;
        verticalVelocity.current = 0;
      }
    }

    // ── SUSPENSION SPRING SIMULATION ──
    // Simple spring-damper: compresses on landing, oscillates, then settles
    // suspensionOffset represents visual displacement only (doesn't affect physics position)
    const springForce = -SUSPENSION_STIFFNESS * suspensionOffset.current;
    const dampingForce = -SUSPENSION_DAMPING * suspensionVelocity.current;
    suspensionVelocity.current += (springForce + dampingForce) * delta;
    suspensionOffset.current += suspensionVelocity.current * delta;
    // Clamp to reasonable range
    suspensionOffset.current = Math.max(-0.6, Math.min(0.6, suspensionOffset.current));
    // Kill tiny oscillations
    if (Math.abs(suspensionOffset.current) < 0.005 && Math.abs(suspensionVelocity.current) < 0.01) {
      suspensionOffset.current = 0;
      suspensionVelocity.current = 0;
    }

    // Track airborne state for next frame landing detection
    wasAirborne.current = isAirborne.current;

    // Apply position — add suspension offset for visual bounce
    const finalY = currentY.current + suspensionOffset.current;
    chassis.setTranslation({ x: finalX, y: finalY, z: finalZ }, true);
    // Apply rotation with body lean (roll) and pitch for weight feel
    chassis.setRotation(
      _tmpQuat.current.setFromEuler(
        _tmpEuler.current.set(bodyPitch.current, currentRotation.current, bodyLean.current)
      ),
      true
    );

    chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Update position for particles
    truckPosRef.current.set(finalX, finalY, finalZ);

    if (onPositionUpdate) {
      onPositionUpdate(
        _tmpVec.current.set(finalX, finalY, finalZ),
        _tmpEuler.current.set(0, currentRotation.current, 0),
        Math.abs(currentSpeed.current)
      );
    }
  });

  const wheelPositions: Array<{ pos: [number, number, number]; steering: boolean }> = [
    { pos: [-AXLE_WIDTH / 2, 0, BODY_LENGTH / 2 - 0.8], steering: true },
    { pos: [AXLE_WIDTH / 2, 0, BODY_LENGTH / 2 - 0.8], steering: true },
    { pos: [-AXLE_WIDTH / 2, 0, -BODY_LENGTH / 2 + 1.1], steering: false },
    { pos: [AXLE_WIDTH / 2, 0, -BODY_LENGTH / 2 + 1.1], steering: false },
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
          {/* Dust trail from rear wheels — color changes per surface */}
          <DustTrail
            positionRef={truckPosRef}
            speed={currentSpeed.current}
            isActive={Math.abs(currentSpeed.current) > 2}
            color={surfaceDustColor.current}
          />

          {/* Electric energy sparks from wheel arches */}
          <ExhaustSmoke
            pipePositionRef={truckPosRef}
            truckRotation={currentRotation.current}
            throttleRef={throttleRef}
            speed={Math.abs(currentSpeed.current)}
            isActive={true}
          />

          {/* Electric boost energy when boosting */}
          <BoostFlame
            positionRef={truckPosRef}
            rotation={currentRotation.current}
            isActive={input.boost || driftState.current === 'mini-turbo'}
            intensity={driftState.current === 'mini-turbo' ? 2.0 : 1.5}
            speed={Math.abs(currentSpeed.current)}
          />

          {/* Drift sparks from rear wheels during power-slide */}
          <DriftSparks
            positionRef={truckPosRef}
            rotation={currentRotation.current}
            driftLevel={driftLevel.current}
            isActive={driftState.current === 'drifting'}
            speed={Math.abs(currentSpeed.current)}
          />
        </>
      )}
    </RigidBody>
  );
}

export default MonsterTruck;
