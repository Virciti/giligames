'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Track3DProps {
  trackType?: 'oval' | 'circuit' | 'stadium' | 'kidFriendly';
  length?: number;
  width?: number;
}

// Generate track waypoints for an oval
function generateOvalTrack(length: number, width: number) {
  const points: THREE.Vector3[] = [];
  const segments = 64;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * length;
    const z = Math.sin(angle) * width;
    points.push(new THREE.Vector3(x, 0, z));
  }

  return points;
}

// Generate a fun winding track for kids - longer with gentle curves
function generateKidFriendlyTrack(length: number, width: number) {
  const points: THREE.Vector3[] = [];
  const segments = 96;

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2;

    // Base oval shape but stretched longer
    let x = Math.cos(angle) * length * 1.3;
    let z = Math.sin(angle) * width;

    // Add gentle S-curves to make it more interesting
    // These create slight variations without sharp turns
    x += Math.sin(angle * 2) * 25; // Gentle wave in X
    z += Math.sin(angle * 3) * 15; // Smaller wave in Z

    points.push(new THREE.Vector3(x, 0, z));
  }

  return points;
}

// Road surface component
function RoadSurface({ points, roadWidth = 15 }: { points: THREE.Vector3[]; roadWidth?: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const curve = new THREE.CatmullRomCurve3(points, true);
    const tubeGeometry = new THREE.TubeGeometry(curve, 256, roadWidth / 2, 8, true);

    // Create a flat road by projecting onto a plane
    const roadGeometry = new THREE.PlaneGeometry(1, 1, 256, 1);
    const positions = [];
    const uvs = [];

    for (let i = 0; i <= 256; i++) {
      const t = i / 256;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left edge
      positions.push(
        point.x - normal.x * roadWidth / 2,
        0.01,
        point.z - normal.z * roadWidth / 2
      );
      uvs.push(0, t * 20);

      // Right edge
      positions.push(
        point.x + normal.x * roadWidth / 2,
        0.01,
        point.z + normal.z * roadWidth / 2
      );
      uvs.push(1, t * 20);
    }

    const indices = [];
    for (let i = 0; i < 256; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = i * 2 + 2;
      const d = i * 2 + 3;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [points, roadWidth]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#333333"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// Road markings (center line and edges)
function RoadMarkings({ points, roadWidth = 15 }: { points: THREE.Vector3[]; roadWidth?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true), [points]);

  const centerLineGeometry = useMemo(() => {
    const positions: number[] = [];

    for (let i = 0; i <= 512; i++) {
      const t = i / 512;
      const point = curve.getPointAt(t);

      // Dashed line pattern
      const dashLength = 0.02;
      const isDash = Math.floor(t / dashLength) % 2 === 0;

      if (isDash) {
        positions.push(point.x, 0.02, point.z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [curve]);

  const edgeLines = useMemo(() => {
    const leftPositions: number[] = [];
    const rightPositions: number[] = [];

    for (let i = 0; i <= 256; i++) {
      const t = i / 256;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      leftPositions.push(
        point.x - normal.x * (roadWidth / 2 - 0.5),
        0.02,
        point.z - normal.z * (roadWidth / 2 - 0.5)
      );

      rightPositions.push(
        point.x + normal.x * (roadWidth / 2 - 0.5),
        0.02,
        point.z + normal.z * (roadWidth / 2 - 0.5)
      );
    }

    const leftGeo = new THREE.BufferGeometry();
    leftGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftPositions, 3));

    const rightGeo = new THREE.BufferGeometry();
    rightGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightPositions, 3));

    const whiteMaterial = new THREE.LineBasicMaterial({ color: '#FFFFFF' });

    return {
      left: new THREE.Line(leftGeo, whiteMaterial),
      right: new THREE.Line(rightGeo, whiteMaterial),
    };
  }, [curve, roadWidth]);

  return (
    <group>
      {/* Center dashed line */}
      <points geometry={centerLineGeometry}>
        <pointsMaterial color="#FFFF00" size={0.3} />
      </points>

      {/* Edge lines */}
      <primitive object={edgeLines.left} />
      <primitive object={edgeLines.right} />
    </group>
  );
}

// Start/Finish line
function StartFinishLine({ position, rotation, width }: {
  position: [number, number, number];
  rotation: number;
  width: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, 2]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Checkered pattern */}
      {Array.from({ length: 8 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => (
          <mesh
            key={`${i}-${j}`}
            position={[(i - 3.5) * (width / 8), 0.03, (j - 1.5) * 0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[width / 8 - 0.05, 0.45]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#000000' : '#FFFFFF'} />
          </mesh>
        ))
      )}
    </group>
  );
}

// Barrier/wall
function Barrier({ points, offset, height = 1.5 }: {
  points: THREE.Vector3[];
  offset: number;
  height?: number;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true), [points]);

  const barrierPositions = useMemo(() => {
    const positions: Array<{ position: THREE.Vector3; rotation: number }> = [];

    for (let i = 0; i < 64; i++) {
      const t = i / 64;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const rotation = Math.atan2(tangent.x, tangent.z);

      positions.push({
        position: new THREE.Vector3(
          point.x + normal.x * offset,
          height / 2,
          point.z + normal.z * offset
        ),
        rotation,
      });
    }

    return positions;
  }, [curve, offset, height]);

  return (
    <group>
      {barrierPositions.map((bp, i) => (
        <RigidBody key={i} type="fixed" position={[bp.position.x, bp.position.y, bp.position.z]}>
          <mesh rotation={[0, bp.rotation, 0]} castShadow>
            <boxGeometry args={[1, height, 4]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#FF0000' : '#FFFFFF'}
              roughness={0.7}
            />
          </mesh>
          <CuboidCollider args={[0.5, height / 2, 2]} />
        </RigidBody>
      ))}
    </group>
  );
}

// Ground/terrain with dirt arena center
function Terrain({ size = 500, arenaWidth = 80, arenaLength = 120 }: { size?: number; arenaWidth?: number; arenaLength?: number }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Outer grass area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[size, size, 64, 64]} />
        <meshStandardMaterial
          color="#3d6b47"
          roughness={0.95}
        />
      </mesh>

      {/* Monster Jam dirt arena center - brown/tan dirt surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.02, 0]}>
        <planeGeometry args={[arenaLength, arenaWidth]} />
        <meshStandardMaterial
          color="#8B6914"
          roughness={1.0}
        />
      </mesh>

      {/* Dirt mounds/jumps in the arena */}
      <mesh position={[30, 1.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[8, 3, 8]} />
        <meshStandardMaterial color="#7B5D0A" roughness={1.0} />
      </mesh>
      <mesh position={[-30, 1.2, 15]} castShadow receiveShadow>
        <coneGeometry args={[6, 2.5, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={1.0} />
      </mesh>
      <mesh position={[-20, 1, -20]} castShadow receiveShadow>
        <coneGeometry args={[5, 2, 8]} />
        <meshStandardMaterial color="#7B5D0A" roughness={1.0} />
      </mesh>

      {/* Crushed car obstacles */}
      <group position={[15, 0.3, -25]}>
        <mesh castShadow>
          <boxGeometry args={[4, 0.6, 2]} />
          <meshStandardMaterial color="#8B0000" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>
      <group position={[-10, 0.3, 25]}>
        <mesh castShadow>
          <boxGeometry args={[4, 0.5, 2]} />
          <meshStandardMaterial color="#1a1a80" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      <CuboidCollider args={[size / 2, 0.1, size / 2]} position={[0, -0.1, 0]} />
    </RigidBody>
  );
}

// Crowd of spectators (instanced for performance)
function Crowd({ position, count = 200, width = 28, depth = 6 }: {
  position: [number, number, number];
  count?: number;
  width?: number;
  depth?: number;
}) {
  const colors = ['#FF0000', '#0000FF', '#FFFF00', '#00FF00', '#FF00FF', '#FFFFFF', '#FFA500'];

  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (Math.random() - 0.5) * width;
        const z = (Math.random() - 0.5) * depth;
        const y = Math.random() * 0.3;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const scale = 0.4 + Math.random() * 0.2;

        return (
          <group key={i} position={[x, y, z]} scale={scale}>
            {/* Head */}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.2, 6, 6]} />
              <meshStandardMaterial color="#FFDBAC" roughness={0.8} />
            </mesh>
            {/* Body (shirt) */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 0.5, 6]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Billboard/signage
function Billboard({ position, rotation = 0, text = "MONSTER JAM", color = "#FF0000" }: {
  position: [number, number, number];
  rotation?: number;
  text?: string;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Billboard frame */}
      <mesh castShadow>
        <boxGeometry args={[12, 4, 0.3]} />
        <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Billboard face */}
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[11.5, 3.5, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Support poles */}
      {[-4, 4].map((x, i) => (
        <mesh key={i} position={[x, -4, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 6, 8]} />
          <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Stadium lights
function StadiumLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Light pole */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.5, 25, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Light array */}
      <group position={[0, 13, 0]}>
        {[-1.5, 0, 1.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[1, 0.5, 0.8]} />
            <meshStandardMaterial
              color="#FFFFEE"
              emissive="#FFFFAA"
              emissiveIntensity={1}
            />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 12, 0]} color="#FFFFF0" intensity={2} distance={80} />
    </group>
  );
}

// Grandstands with crowd
function Grandstand({ position, rotation, length = 60 }: {
  position: [number, number, number];
  rotation: number;
  length?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main structure - concrete base */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 8, 12]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>

      {/* Roof/canopy */}
      <mesh position={[0, 12, -3]} castShadow>
        <boxGeometry args={[length + 4, 0.5, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Roof supports */}
      {[-length/2 + 5, -length/4, 0, length/4, length/2 - 5].map((x, i) => (
        <mesh key={i} position={[x, 8, -6]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
          <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Tiered seating rows */}
      {Array.from({ length: 6 }).map((_, row) => (
        <group key={row}>
          {/* Seat bench */}
          <mesh position={[0, row * 1.2 + 1.5, row * 1.5 - 3]}>
            <boxGeometry args={[length - 2, 0.3, 1.2]} />
            <meshStandardMaterial color={row % 2 === 0 ? '#1a5f9e' : '#9e1a1a'} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Crowd in the stands */}
      {Array.from({ length: 6 }).map((_, row) => (
        <Crowd
          key={row}
          position={[0, row * 1.2 + 2.2, row * 1.5 - 3]}
          count={Math.floor(length * 2)}
          width={length - 4}
          depth={1}
        />
      ))}

      {/* Railing at front */}
      <mesh position={[0, 1.5, -5.5]}>
        <boxGeometry args={[length, 0.8, 0.1]} />
        <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function Track3D({
  trackType = 'oval',
  length = 100,
  width = 60,
}: Track3DProps) {
  // Use kid-friendly winding track with wider road
  const trackPoints = useMemo(
    () => generateKidFriendlyTrack(length, width),
    [length, width]
  );

  // MUCH wider road for kids - easier to stay on track
  const roadWidth = 28;

  return (
    <group>
      {/* Terrain/Ground */}
      <Terrain size={500} />

      {/* Road surface */}
      <RoadSurface points={trackPoints} roadWidth={roadWidth} />

      {/* Road markings */}
      <RoadMarkings points={trackPoints} roadWidth={roadWidth} />

      {/* Start/Finish line */}
      <StartFinishLine
        position={[length, 0, 0]}
        rotation={Math.PI / 2}
        width={roadWidth}
      />

      {/* Inner barrier */}
      <Barrier points={trackPoints} offset={-(roadWidth / 2 + 2)} height={1.2} />

      {/* Outer barrier */}
      <Barrier points={trackPoints} offset={roadWidth / 2 + 2} height={1.2} />

      {/* Grandstands on all sides of the arena */}
      <Grandstand position={[0, 0, -width - 25]} rotation={0} length={80} />
      <Grandstand position={[0, 0, width + 25]} rotation={Math.PI} length={80} />
      <Grandstand position={[-length - 25, 0, 0]} rotation={Math.PI / 2} length={50} />
      <Grandstand position={[length + 25, 0, 0]} rotation={-Math.PI / 2} length={50} />

      {/* Stadium billboards - Monster Jam style */}
      <Billboard position={[0, 8, -width - 10]} rotation={0} text="MONSTER JAM" color="#FF0000" />
      <Billboard position={[0, 8, width + 10]} rotation={Math.PI} text="MONSTER JAM" color="#0066FF" />
      <Billboard position={[-length - 10, 8, 0]} rotation={Math.PI / 2} text="GiiGames" color="#FFD700" />
      <Billboard position={[length + 10, 8, 0]} rotation={-Math.PI / 2} text="RACING" color="#00CC00" />

      {/* Stadium corner lights */}
      <StadiumLight position={[-length - 15, 0, -width - 15]} />
      <StadiumLight position={[length + 15, 0, -width - 15]} />
      <StadiumLight position={[-length - 15, 0, width + 15]} />
      <StadiumLight position={[length + 15, 0, width + 15]} />

      {/* Additional track-side lights */}
      <StadiumLight position={[0, 0, -width - 18]} />
      <StadiumLight position={[0, 0, width + 18]} />

      {/* Start/Finish gantry */}
      <group position={[length - 5, 0, 0]}>
        {/* Support poles */}
        <mesh position={[0, 5, -roadWidth / 2 - 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 10, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 5, roadWidth / 2 + 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 10, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Overhead beam */}
        <mesh position={[0, 10.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, roadWidth + 6, 8]} />
          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Checkered banner */}
        <mesh position={[0, 9, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.2, 1.5, roadWidth + 4]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* Inner arena decorations - tires stacked */}
      {[
        { x: 40, z: 20 }, { x: -40, z: -20 }, { x: 50, z: -15 }, { x: -50, z: 15 }
      ].map((pos, i) => (
        <group key={i} position={[pos.x, 0, pos.z]}>
          {[0, 0.4, 0.8].map((y, j) => (
            <mesh key={j} position={[0, y + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.6, 0.25, 8, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default Track3D;
