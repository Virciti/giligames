/**
 * Adaptive quality detection for 3D rendering.
 *
 * Detects device capability and returns a quality preset.
 * Factors: device pixel ratio, GPU renderer string, hardware concurrency, device memory.
 */

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

/** Particle count multipliers per quality level */
export const PARTICLE_SCALE: Record<QualityPreset, number> = {
  low: 0.3,
  medium: 0.6,
  high: 1.0,
  ultra: 1.0,
};

let cachedPreset: QualityPreset | null = null;

/**
 * Detect device quality preset. Result is cached after first call.
 * Safe to call during SSR (returns 'medium').
 */
export function detectQualityPreset(): QualityPreset {
  if (cachedPreset) return cachedPreset;
  if (typeof window === 'undefined') return 'medium';

  let score = 0;

  // DPR — high-DPR devices are usually capable but need more GPU power
  const dpr = window.devicePixelRatio ?? 1;
  if (dpr <= 1) score -= 1; // Low-res display, likely low-end
  else if (dpr >= 2) score += 1;

  // Hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  else score -= 1;

  // Device memory (Chrome/Edge only)
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory !== undefined) {
    if (nav.deviceMemory >= 8) score += 2;
    else if (nav.deviceMemory >= 4) score += 1;
    else score -= 1;
  }

  // GPU renderer string via WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
        const lower = renderer.toLowerCase();

        // Known high-end GPUs
        if (/rtx|radeon rx 7|m[1-4] (pro|max|ultra)|apple gpu/i.test(lower)) {
          score += 2;
        }
        // Known mid-range
        else if (/gtx|radeon rx [56]|apple|intel iris/i.test(lower)) {
          score += 1;
        }
        // Known low-end / software
        else if (/swiftshader|llvmpipe|mesa|intel hd [4-6]/i.test(lower)) {
          score -= 2;
        }
      }
    }
  } catch {
    // WebGL not available — assume low-end
    score -= 2;
  }

  // Mobile detection — smaller viewport likely means mobile
  if (window.innerWidth < 768) {
    score -= 1;
  }

  // Map score to preset
  let preset: QualityPreset;
  if (score >= 5) preset = 'ultra';
  else if (score >= 2) preset = 'high';
  else if (score >= 0) preset = 'medium';
  else preset = 'low';

  cachedPreset = preset;
  return preset;
}

/**
 * Scale a base particle count by the current quality level.
 */
export function scaledParticleCount(base: number, quality: QualityPreset): number {
  return Math.max(4, Math.round(base * PARTICLE_SCALE[quality]));
}
