'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
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
        color="#3A3535"
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}

// Highway-style road markings - multi-lane with yellow center and white lane dividers
function RoadMarkings({ points, roadWidth = 15 }: { points: THREE.Vector3[]; roadWidth?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true), [points]);
  const segments = 512;

  // Helper: generate a line strip mesh at an offset from center
  const generateLineGeometry = useMemo(() => {
    return (offset: number, dashed: boolean) => {
      const positions: number[] = [];
      const uvs: number[] = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        if (dashed) {
          // 3m dash, 3m gap pattern
          const dashCycle = Math.floor(t * segments / 4) % 2;
          if (dashCycle !== 0) continue;
        }

        const x = point.x + normal.x * offset;
        const z = point.z + normal.z * offset;

        // Left edge of stripe
        positions.push(x - normal.x * 0.2, 0.025, z - normal.z * 0.2);
        uvs.push(0, t * 40);
        // Right edge of stripe
        positions.push(x + normal.x * 0.2, 0.025, z + normal.z * 0.2);
        uvs.push(1, t * 40);
      }

      const indices: number[] = [];
      const vertCount = positions.length / 3;
      for (let i = 0; i < vertCount - 2; i += 2) {
        indices.push(i, i + 1, i + 2);
        indices.push(i + 1, i + 3, i + 2);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };
  }, [curve]);

  // Center double yellow line (two parallel yellow lines with small gap)
  const centerLineLeft = useMemo(() => generateLineGeometry(-0.35, false), [generateLineGeometry]);
  const centerLineRight = useMemo(() => generateLineGeometry(0.35, false), [generateLineGeometry]);

  // White dashed lane dividers at 1/3 and 2/3 road width
  const laneLineLeft = useMemo(() => generateLineGeometry(-roadWidth / 3, true), [generateLineGeometry, roadWidth]);
  const laneLineRight = useMemo(() => generateLineGeometry(roadWidth / 3, true), [generateLineGeometry, roadWidth]);

  // Solid white edge lines
  const edgeLineLeft = useMemo(() => generateLineGeometry(-roadWidth / 2 + 0.6, false), [generateLineGeometry, roadWidth]);
  const edgeLineRight = useMemo(() => generateLineGeometry(roadWidth / 2 - 0.6, false), [generateLineGeometry, roadWidth]);

  return (
    <group>
      {/* Double yellow center line */}
      <mesh geometry={centerLineLeft}>
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.1} roughness={0.5} />
      </mesh>
      <mesh geometry={centerLineRight}>
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.1} roughness={0.5} />
      </mesh>

      {/* White dashed lane dividers */}
      <mesh geometry={laneLineLeft}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      <mesh geometry={laneLineRight}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>

      {/* Solid white edge lines */}
      <mesh geometry={edgeLineLeft}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      <mesh geometry={edgeLineRight}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
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

// Highway metal guardrail
function Barrier({ points, offset, height = 1.0 }: {
  points: THREE.Vector3[];
  offset: number;
  height?: number;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true), [points]);

  const barrierPositions = useMemo(() => {
    const positions: Array<{ position: THREE.Vector3; rotation: number }> = [];

    for (let i = 0; i < 96; i++) {
      const t = i / 96;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const rotation = Math.atan2(tangent.x, tangent.z);

      positions.push({
        position: new THREE.Vector3(
          point.x + normal.x * offset,
          0,
          point.z + normal.z * offset
        ),
        rotation,
      });
    }

    return positions;
  }, [curve, offset]);

  return (
    <group>
      {barrierPositions.map((bp, i) => (
        <RigidBody key={i} type="fixed" position={[bp.position.x, bp.position.y, bp.position.z]}>
          <group rotation={[0, bp.rotation, 0]}>
            {/* Metal post */}
            <mesh position={[0, height * 0.5, 0]} castShadow>
              <boxGeometry args={[0.12, height, 0.12]} />
              <meshStandardMaterial color="#8A8A8A" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* W-beam guardrail - top rail */}
            <mesh position={[0, height * 0.75, 0]} castShadow>
              <boxGeometry args={[0.08, 0.22, 4.2]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* W-beam guardrail - corrugation effect */}
            <mesh position={[0, height * 0.75, 0]} castShadow>
              <boxGeometry args={[0.14, 0.18, 4.0]} />
              <meshStandardMaterial color="#A8A8A8" metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
          <CuboidCollider args={[0.15, height / 2, 2]} position={[0, height * 0.5, 0]} />
        </RigidBody>
      ))}
    </group>
  );
}

// Desert terrain with sand, mesas, and cacti
function Terrain({ size = 500 }: { size?: number }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Desert sand ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[size, size, 64, 64]} />
        <meshStandardMaterial
          color="#C4A265"
          roughness={0.95}
        />
      </mesh>

      {/* Lighter sand patches for variation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[60, -0.08, 40]}>
        <circleGeometry args={[30, 16]} />
        <meshStandardMaterial color="#D4B87A" roughness={1.0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[-80, -0.08, -30]}>
        <circleGeometry args={[25, 16]} />
        <meshStandardMaterial color="#CEAF6E" roughness={1.0} />
      </mesh>

      {/* === DESERT MESA / ROCK FORMATIONS === */}
      {/* Large mushroom-shaped mesa (like in the MK8 reference) */}
      <group position={[0, 0, -160]}>
        {/* Base/stem */}
        <mesh position={[0, 18, 0]} castShadow>
          <cylinderGeometry args={[14, 18, 36, 12]} />
          <meshStandardMaterial color="#B87A4B" roughness={0.9} />
        </mesh>
        {/* Wider cap */}
        <mesh position={[0, 38, 0]} castShadow>
          <cylinderGeometry args={[28, 20, 6, 16]} />
          <meshStandardMaterial color="#A06830" roughness={0.85} />
        </mesh>
        {/* Flat top */}
        <mesh position={[0, 42, 0]} castShadow>
          <cylinderGeometry args={[26, 28, 2, 16]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.9} />
        </mesh>
        {/* Layered rock bands */}
        <mesh position={[0, 28, 0]}>
          <cylinderGeometry args={[15.5, 15, 2, 12]} />
          <meshStandardMaterial color="#C98A5A" roughness={0.85} />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <cylinderGeometry args={[17, 18.5, 2, 12]} />
          <meshStandardMaterial color="#9B6B40" roughness={0.9} />
        </mesh>
      </group>

      {/* Second mesa - smaller, off to the side */}
      <group position={[-180, 0, -120]}>
        <mesh position={[0, 12, 0]} castShadow>
          <cylinderGeometry args={[10, 14, 24, 10]} />
          <meshStandardMaterial color="#A07040" roughness={0.9} />
        </mesh>
        <mesh position={[0, 26, 0]} castShadow>
          <cylinderGeometry args={[16, 12, 4, 12]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.85} />
        </mesh>
      </group>

      {/* Distant butte */}
      <group position={[200, 0, -140]}>
        <mesh position={[0, 15, 0]} castShadow>
          <cylinderGeometry args={[8, 12, 30, 8]} />
          <meshStandardMaterial color="#B07848" roughness={0.9} />
        </mesh>
        <mesh position={[0, 31, 0]} castShadow>
          <cylinderGeometry args={[9, 8, 3, 8]} />
          <meshStandardMaterial color="#906038" roughness={0.9} />
        </mesh>
      </group>

      {/* Small rock clusters scattered around */}
      {[
        { x: 80, z: 120, s: 3 }, { x: -100, z: 90, s: 2.5 },
        { x: 150, z: -50, s: 2 }, { x: -60, z: -120, s: 3.5 },
        { x: 120, z: -100, s: 2 }, { x: -150, z: 50, s: 2.5 },
      ].map((rock, i) => (
        <group key={`rock-${i}`} position={[rock.x, 0, rock.z]}>
          <mesh position={[0, rock.s * 0.5, 0]} castShadow>
            <dodecahedronGeometry args={[rock.s, 1]} />
            <meshStandardMaterial color="#A0784C" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* === CACTI === */}
      {[
        { x: 50, z: -100 }, { x: -70, z: 100 }, { x: 130, z: 70 },
        { x: -140, z: -60 }, { x: 90, z: -80 }, { x: -30, z: 130 },
        { x: 170, z: 30 }, { x: -110, z: -110 },
      ].map((pos, i) => (
        <group key={`cactus-${i}`} position={[pos.x, 0, pos.z]}>
          {/* Main trunk */}
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.6, 6, 8]} />
            <meshStandardMaterial color="#2D6B30" roughness={0.8} />
          </mesh>
          {/* Left arm */}
          <mesh position={[-0.8, 3.5, 0]} rotation={[0, 0, 0.8]} castShadow>
            <cylinderGeometry args={[0.35, 0.4, 3, 8]} />
            <meshStandardMaterial color="#2D6B30" roughness={0.8} />
          </mesh>
          {/* Right arm */}
          <mesh position={[0.7, 2.5, 0]} rotation={[0, 0, -0.9]} castShadow>
            <cylinderGeometry args={[0.3, 0.35, 2.5, 8]} />
            <meshStandardMaterial color="#2D6B30" roughness={0.8} />
          </mesh>
        </group>
      ))}

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
      {/* Billboard frame - desert appropriate */}
      <mesh castShadow>
        <boxGeometry args={[12, 4, 0.3]} />
        <meshStandardMaterial color="#3A3025" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Billboard face */}
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[11.5, 3.5, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Support poles - metal */}
      {[-4, 4].map((x, i) => (
        <mesh key={i} position={[x, -4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 6, 8]} />
          <meshStandardMaterial color="#7A7A7A" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Curved highway light pole (like Mario Kart 8 desert highway)
function HighwayLight({ position, side = 1 }: { position: [number, number, number]; side?: number }) {
  return (
    <group position={position}>
      {/* Main pole - tapered */}
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.3, 12, 8]} />
        <meshStandardMaterial color="#7A7A7A" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Curved arm extending over road */}
      <group position={[0, 12, 0]}>
        {/* Horizontal arm */}
        <mesh position={[side * 3, -0.5, 0]} rotation={[0, 0, side * 0.15]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 6.5, 8]} />
          <meshStandardMaterial color="#7A7A7A" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Curved elbow joint */}
        <mesh position={[side * 0.5, -0.2, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#7A7A7A" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Light fixture head */}
        <group position={[side * 5.5, -1, 0]}>
          <mesh rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.3, 0.3, 8]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Light lens */}
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
            <circleGeometry args={[0.5, 12]} />
            <meshStandardMaterial
              color="#FFFFF0"
              emissive="#FFF8E0"
              emissiveIntensity={0.8}
            />
          </mesh>
          <pointLight color="#FFF5E0" intensity={1.5} distance={40} position={[0, -1, 0]} />
        </group>
      </group>
      {/* Base plate */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 8]} />
        <meshStandardMaterial color="#666" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Keep StadiumLight as alias for compatibility
function StadiumLight({ position }: { position: [number, number, number] }) {
  return <HighwayLight position={position} />;
}

// Grandstands with crowd
function Grandstand({ position, rotation, length = 60 }: {
  position: [number, number, number];
  rotation: number;
  length?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main structure - warm concrete/sandstone */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 8, 12]} />
        <meshStandardMaterial color="#B8A088" roughness={0.9} />
      </mesh>

      {/* Roof/canopy - dark warm */}
      <mesh position={[0, 12, -3]} castShadow>
        <boxGeometry args={[length + 4, 0.5, 16]} />
        <meshStandardMaterial color="#5A4A3A" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Roof supports */}
      {[-length/2 + 5, -length/4, 0, length/4, length/2 - 5].map((x, i) => (
        <mesh key={i} position={[x, 8, -6]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
          <meshStandardMaterial color="#7A7A7A" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Tiered seating rows */}
      {Array.from({ length: 6 }).map((_, row) => (
        <group key={row}>
          {/* Seat bench */}
          <mesh position={[0, row * 1.2 + 1.5, row * 1.5 - 3]}>
            <boxGeometry args={[length - 2, 0.3, 1.2]} />
            <meshStandardMaterial color={row % 2 === 0 ? '#C4956A' : '#8B6B4A'} roughness={0.8} />
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

      {/* Railing at front - metal */}
      <mesh position={[0, 1.5, -5.5]}>
        <boxGeometry args={[length, 0.8, 0.1]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
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

      {/* Start/Finish line - positioned at track's easternmost point */}
      <StartFinishLine
        position={[length * 1.3, 0, 0]}
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
      <Grandstand position={[-length * 1.3 - 25, 0, 0]} rotation={Math.PI / 2} length={50} />
      <Grandstand position={[length * 1.3 + 25, 0, 0]} rotation={-Math.PI / 2} length={50} />

      {/* Stadium billboards - Monster Jam style */}
      <Billboard position={[0, 8, -width - 10]} rotation={0} text="MONSTER JAM" color="#FF0000" />
      <Billboard position={[0, 8, width + 10]} rotation={Math.PI} text="MONSTER JAM" color="#0066FF" />
      <Billboard position={[-length * 1.3 - 10, 8, 0]} rotation={Math.PI / 2} text="GiiGames" color="#FFD700" />
      <Billboard position={[length * 1.3 + 10, 8, 0]} rotation={-Math.PI / 2} text="RACING" color="#00CC00" />

      {/* Stadium corner lights */}
      <StadiumLight position={[-length * 1.3 - 15, 0, -width - 15]} />
      <StadiumLight position={[length * 1.3 + 15, 0, -width - 15]} />
      <StadiumLight position={[-length * 1.3 - 15, 0, width + 15]} />
      <StadiumLight position={[length * 1.3 + 15, 0, width + 15]} />

      {/* Additional track-side lights */}
      <StadiumLight position={[0, 0, -width - 18]} />
      <StadiumLight position={[0, 0, width + 18]} />

      {/* Start/Finish gantry */}
      <group position={[length * 1.3 - 5, 0, 0]}>
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

      {/* Highway road signs along the track */}
      {[
        { x: 100, z: 50, rot: 0.8, text: 'SPEED ZONE' },
        { x: -80, z: -40, rot: -1.2, text: 'GIIGAMES HWY' },
        { x: 60, z: -60, rot: 2.0, text: 'DESERT RUN' },
        { x: -100, z: 30, rot: -0.5, text: 'NEXT EXIT' },
      ].map((sign, i) => (
        <group key={`sign-${i}`} position={[sign.x, 0, sign.z]} rotation={[0, sign.rot, 0]}>
          {/* Sign post */}
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 6, 6]} />
            <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Green highway sign */}
          <mesh position={[0, 5.5, 0]} castShadow>
            <boxGeometry args={[4, 2, 0.1]} />
            <meshStandardMaterial color="#006B3C" roughness={0.6} />
          </mesh>
          {/* White border */}
          <mesh position={[0, 5.5, 0.06]}>
            <boxGeometry args={[3.7, 1.7, 0.02]} />
            <meshStandardMaterial color="#006B3C" roughness={0.6} />
          </mesh>
          {/* Reflective strip at top */}
          <mesh position={[0, 6.3, 0.06]}>
            <boxGeometry args={[3.8, 0.12, 0.02]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Highway lights along the track - spaced evenly on both sides */}
      {Array.from({ length: 16 }).map((_, i) => {
        const t = i / 16;
        const angle = t * Math.PI * 2;
        // Match kid-friendly track formula
        let x = Math.cos(angle) * length * 1.3;
        let z = Math.sin(angle) * width;
        x += Math.sin(angle * 2) * 25;
        z += Math.sin(angle * 3) * 15;
        // Offset to outer side of track
        const tangentAngle = Math.atan2(
          Math.cos(angle) * width + Math.cos(angle * 3) * 15 * 3,
          -Math.sin(angle) * length * 1.3 + Math.cos(angle * 2) * 25 * 2
        );
        const outerX = x + Math.cos(tangentAngle + Math.PI / 2) * 20;
        const outerZ = z + Math.sin(tangentAngle + Math.PI / 2) * 20;
        return (
          <HighwayLight
            key={`hwy-light-${i}`}
            position={[outerX, 0, outerZ]}
            side={-1}
          />
        );
      })}
    </group>
  );
}

export default Track3D;
