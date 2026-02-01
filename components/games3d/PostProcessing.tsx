'use client';

import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

interface PostProcessingProps {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export function PostProcessing({ quality = 'high' }: PostProcessingProps) {
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
      bloomIntensity: 0.3,
      ssaoRadius: 0,
    },
    high: {
      bloom: true,
      ssao: true,
      bloomIntensity: 0.4,
      ssaoRadius: 0.4,
    },
    ultra: {
      bloom: true,
      ssao: true,
      bloomIntensity: 0.5,
      ssaoRadius: 0.5,
    },
  };

  const config = settings[quality];

  return (
    <EffectComposer multisampling={quality === 'low' ? 0 : 4}>
      {/* Bloom - makes lights glow beautifully */}
      {config.bloom && (
        <Bloom
          intensity={config.bloomIntensity}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      )}

      {/* SSAO - adds depth and realism with ambient shadows */}
      {config.ssao && (
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={12}
          radius={config.ssaoRadius}
          intensity={5}
          luminanceInfluence={0.4}
          color="#000000"
        />
      )}

      {/* Tone Mapping - cinematic color grading */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      {/* Vignette - darkens edges for cinematic feel */}
      <Vignette
        offset={0.3}
        darkness={0.4}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export default PostProcessing;
