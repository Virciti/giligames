'use client';

import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { Color } from 'three';

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
        <Vignette
          offset={0.25}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
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
        <Vignette
          offset={0.25}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={quality === 'low' ? 0 : 4}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette
        offset={0.25}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

export default PostProcessing;
