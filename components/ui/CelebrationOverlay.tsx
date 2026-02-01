'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, PartyPopper, Sparkles } from 'lucide-react';

interface CelebrationOverlayProps {
  type: 'stars' | 'confetti' | 'fireworks';
  duration?: number;
  onComplete?: () => void;
}

// Particle type for canvas animations
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'star' | 'triangle';
}

// Colors from the brand palette
const CELEBRATION_COLORS = [
  '#FF6B6B', // brand-red
  '#4ECDC4', // brand-blue
  '#FFE66D', // brand-yellow
  '#7BC74D', // brand-green
  '#9B5DE5', // brand-purple
  '#FF9F43', // brand-orange
];

// Hook to check for reduced motion preference
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check initial value during SSR-safe initialization
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export function CelebrationOverlay({
  type,
  duration = 3000,
  onComplete,
}: CelebrationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Create particles based on celebration type
  const createParticles = useCallback((type: string, width: number, height: number): Particle[] => {
    const particles: Particle[] = [];
    const count = type === 'fireworks' ? 100 : type === 'confetti' ? 80 : 60;

    for (let i = 0; i < count; i++) {
      const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];

      if (type === 'fireworks') {
        // Fireworks burst from multiple points
        const burstX = width * (0.2 + Math.random() * 0.6);
        const burstY = height * (0.2 + Math.random() * 0.4);
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 3 + Math.random() * 5;

        particles.push({
          x: burstX,
          y: burstY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 4,
          color,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          life: 1,
          maxLife: 1,
          shape: 'circle',
        });
      } else if (type === 'confetti') {
        // Confetti falls from top
        particles.push({
          x: Math.random() * width,
          y: -20 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 3,
          vy: 2 + Math.random() * 3,
          size: 8 + Math.random() * 8,
          color,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          life: 1,
          maxLife: 1,
          shape: Math.random() > 0.5 ? 'square' : 'triangle',
        });
      } else {
        // Stars radiate from center
        const angle = (Math.PI * 2 * i) / count;
        const speed = 1 + Math.random() * 3;

        particles.push({
          x: width / 2,
          y: height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 10 + Math.random() * 15,
          color,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          life: 1,
          maxLife: 1,
          shape: 'star',
        });
      }
    }

    return particles;
  }, []);

  // Draw a star shape
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number
  ) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.restore();
  };

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize particles
    particlesRef.current = createParticles(type, canvas.width, canvas.height);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Apply gravity for confetti and fireworks
        if (type === 'confetti') {
          p.vy += 0.05;
          p.vx *= 0.99;
        } else if (type === 'fireworks') {
          p.vy += 0.08;
          p.life -= 0.015;
        } else {
          // Stars fade out
          p.life -= 0.01;
        }

        // Remove dead particles
        if (p.life <= 0) return false;
        if (type === 'confetti' && p.y > canvas.height + 20) return false;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'triangle') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        return true;
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [type, prefersReducedMotion, createParticles]);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Reduced motion: show simple fade with icon
  if (prefersReducedMotion) {
    const IconComponent =
      type === 'stars' ? Star : type === 'confetti' ? PartyPopper : Sparkles;

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="flex flex-col items-center gap-4 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
            >
              <IconComponent className="w-20 h-20 text-brand-yellow" />
              <p className="text-2xl font-bold text-gray-900">Great job!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] pointer-events-none"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
