'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, VignetteEffect } from 'postprocessing';
import { Color } from 'three';

// SPEED FEEL — vignette intensifies at high speed
const BASE_VIGNETTE_DARKNESS = 0.5;
const MAX_SPEED_VIGNETTE_DARKNESS = 0.85;
const VIGNETTE_SPEED_THRESHOLD = 0.6; // Start intensifying at 60% max speed

interface PostProcessingProps {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Speed ref (0–60+) for dynamic vignette intensity at high speed */
  speedRef?: React.RefObject<number>;
}

/** Updates vignette darkness each frame based on speed — tunnel vision effect at high speed */
function SpeedVignette({ speedRef, baseDarkness = BASE_VIGNETTE_DARKNESS }: {
  speedRef?: React.RefObject<number>;
  baseDarkness?: number;
}) {
  const vignetteRef = useRef<VignetteEffect>(null);

  useFrame(() => {
    if (!vignetteRef.current || !speedRef) return;
    const speedFactor = Math.min((speedRef.current ?? 0) / 60, 1);
    const speedContribution = Math.max(0, (speedFactor - VIGNETTE_SPEED_THRESHOLD) / (1 - VIGNETTE_SPEED_THRESHOLD));
    const targetDarkness = baseDarkness + (MAX_SPEED_VIGNETTE_DARKNESS - baseDarkness) * speedContribution;
    // Direct uniform update — no React re-render needed
    vignetteRef.current.uniforms.get('darkness')!.value = targetDarkness;
  });

  return (
    <Vignette
      ref={vignetteRef}
      offset={0.25}
      darkness={baseDarkness}
      blendFunction={BlendFunction.NORMAL}
    />
  );
}

export function PostProcessing({ quality = 'high', speedRef }: PostProcessingProps) {
  // Quality presets
  const settings = {
    low: {
      bloom: false,
      ssao: false,
      bloomIntensity: 0,
      ssaoRadius: 0,
    },
    medium: {
      bloom: true,
      ssao: false,
      bloomIntensity: 0.4,
      ssaoRadius: 0,
    },
    high: {
      bloom: true,
      ssao: true,
      bloomIntensity: 0.5,
      ssaoRadius: 0.4,
    },
    ultra: {
      bloom: true,
      ssao: true,
      bloomIntensity: 0.6,
      ssaoRadius: 0.5,
    },
  };

  const config = settings[quality];

  if (config.bloom && config.ssao) {
    return (
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={config.bloomIntensity}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={12}
          radius={config.ssaoRadius}
          intensity={5}
          luminanceInfluence={0.4}
          color={new Color(0x000000)}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SpeedVignette speedRef={speedRef} />
      </EffectComposer>
    );
  }

  if (config.bloom) {
    return (
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={config.bloomIntensity}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SpeedVignette speedRef={speedRef} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={quality === 'low' ? 0 : 4}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SpeedVignette speedRef={speedRef} />
    </EffectComposer>
  );
}

export default PostProcessing;
