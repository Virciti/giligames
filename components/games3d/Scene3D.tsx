'use client';

import { Canvas } from '@react-three/fiber';
import { Sky, Environment, ContactShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Suspense, useState, ReactNode } from 'react';
import { PostProcessing } from './PostProcessing';

interface Scene3DProps {
  children: ReactNode;
  showSky?: boolean;
  debug?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  enablePostProcessing?: boolean;
}

function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#4ECDC4" wireframe />
    </mesh>
  );
}

// Desert sunset cinematic lighting system
function CinematicLighting({ quality }: { quality: string }) {
  const shadowMapSize = quality === 'ultra' ? 4096 : quality === 'high' ? 2048 : 1024;

  return (
    <>
      {/* Key Light - Low desert sun, warm golden hour */}
      <directionalLight
        castShadow
        position={[100, 40, 80]}
        intensity={2.2}
        color="#FFD4A0"
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.00005}
        shadow-normalBias={0.02}
      />

      {/* Secondary Key - Warm sunset bounce */}
      <directionalLight
        castShadow={quality !== 'low'}
        position={[-50, 60, -30]}
        intensity={0.6}
        color="#FFE0B2"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Fill Light - Warm sky bounce instead of cool blue */}
      <directionalLight
        position={[-60, 40, -40]}
        intensity={0.4}
        color="#FFDAB9"
      />

      {/* Rim/Back Light - Strong golden edge highlights */}
      <directionalLight
        position={[0, 30, -100]}
        intensity={0.8}
        color="#FFB870"
      />

      {/* Ground bounce - warm desert sand reflection */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={0.25}
        color="#D4A06A"
      />

      {/* Ambient - Warm desert illumination */}
      <ambientLight intensity={0.5} color="#FFE8D0" />

      {/* Hemisphere - Warm sky to desert sand */}
      <hemisphereLight
        color="#FFC89E"
        groundColor="#C4956A"
        intensity={0.7}
      />
    </>
  );
}

export function Scene3D({
  children,
  showSky = true,
  debug = false,
  quality = 'high',
  enablePostProcessing = true,
}: Scene3DProps) {
  const [dpr] = useState(quality === 'low' ? 1 : quality === 'medium' ? 1.5 : 2);

  return (
    <Canvas
      shadows="soft"
      dpr={dpr}
      camera={{ position: [88, 7, 0], fov: 60, near: 0.1, far: 2000 }}
      gl={{
        antialias: quality !== 'low',
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        alpha: false,
      }}
      style={{ background: '#1a1a2e' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#E8C49A');
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = 2; // PCFSoftShadowMap
      }}
    >
      {/* Cinematic Lighting System */}
      <CinematicLighting quality={quality} />

      {/* Sky with realistic sun position */}
      {showSky && (
        <Sky
          distance={450000}
          sunPosition={[150, 25, 100]}
          inclination={0.48}
          azimuth={0.2}
          turbidity={10}
          rayleigh={0.8}
          mieCoefficient={0.01}
          mieDirectionalG={0.95}
        />
      )}

      {/* High-quality environment map for chrome/metallic reflections */}
      <Environment
        preset="sunset"
        background={false}
        environmentIntensity={1.2}
      />

      {/* Contact shadows for grounded feel */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={200}
        blur={2}
        far={50}
        resolution={512}
        color="#000000"
      />

      {/* Desert atmospheric haze */}
      <fog attach="fog" args={['#D4A874', 80, 450]} />

      {/* Physics World */}
      <Suspense fallback={<LoadingFallback />}>
        <Physics gravity={[0, -20, 0]} debug={debug}>
          {children}
        </Physics>
      </Suspense>

      {/* Post-Processing Effects */}
      {enablePostProcessing && <PostProcessing quality={quality} />}
    </Canvas>
  );
}

export default Scene3D;
