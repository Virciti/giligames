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

// AAA-quality cinematic lighting system
function CinematicLighting({ quality }: { quality: string }) {
  // Shadow map size based on quality
  const shadowMapSize = quality === 'ultra' ? 4096 : quality === 'high' ? 2048 : 1024;

  return (
    <>
      {/* Key Light - Main sun, warm golden hour color */}
      <directionalLight
        castShadow
        position={[80, 120, 60]}
        intensity={2.0}
        color="#FFF8F0"
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

      {/* Secondary Key - Stadium flood light effect */}
      <directionalLight
        castShadow={quality !== 'low'}
        position={[-50, 80, -30]}
        intensity={0.8}
        color="#FFFAF5"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Fill Light - Cool blue to balance shadows */}
      <directionalLight
        position={[-60, 40, -40]}
        intensity={0.5}
        color="#B4D4E7"
      />

      {/* Rim/Back Light - Creates edge highlights on trucks */}
      <directionalLight
        position={[0, 30, -100]}
        intensity={0.7}
        color="#FFE4C4"
      />

      {/* Ground bounce light */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={0.15}
        color="#8B7355"
      />

      {/* Ambient - Soft overall illumination */}
      <ambientLight intensity={0.4} color="#E8ECFF" />

      {/* Hemisphere - Sky/ground color blend */}
      <hemisphereLight
        color="#87CEEB"
        groundColor="#5A4A31"
        intensity={0.6}
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
        gl.setClearColor('#87CEEB');
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
          sunPosition={[100, 50, 80]}
          inclination={0.55}
          azimuth={0.25}
          turbidity={6}
          rayleigh={0.4}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
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

      {/* Atmospheric fog - gives depth */}
      <fog attach="fog" args={['#C5D8E8', 100, 500]} />

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
