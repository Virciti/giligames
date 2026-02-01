'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

export type BrandColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'orange';
export type ButtonSize = 'md' | 'lg' | 'xl';

export interface BigButtonProps {
  children: ReactNode;
  color?: BrandColor;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  sound?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const colorClasses: Record<BrandColor, string> = {
  red: 'bg-brand-red hover:bg-brand-red/90 focus:ring-brand-red/50',
  blue: 'bg-brand-blue hover:bg-brand-blue/90 focus:ring-brand-blue/50',
  yellow: 'bg-brand-yellow hover:bg-brand-yellow/90 focus:ring-brand-yellow/50 text-gray-800',
  green: 'bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/50',
  purple: 'bg-brand-purple hover:bg-brand-purple/90 focus:ring-brand-purple/50',
  orange: 'bg-brand-orange hover:bg-brand-orange/90 focus:ring-brand-orange/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-12 px-6 py-3 text-lg',
  lg: 'min-h-16 px-8 py-4 text-xl',
  xl: 'min-h-20 px-10 py-5 text-2xl',
};

export const BigButton = forwardRef<HTMLButtonElement, BigButtonProps>(
  (
    {
      children,
      color = 'blue',
      size = 'lg',
      sound,
      disabled,
      onClick,
      className = '',
      type = 'button',
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();

    const handleClick = () => {
      if (disabled) return;

      if (sound && typeof window !== 'undefined') {
        // Play sound effect if provided
        const audio = new Audio(sound);
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      onClick?.();
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={handleClick}
        disabled={disabled}
        whileTap={shouldReduceMotion || disabled ? undefined : { scale: 0.95 }}
        whileHover={shouldReduceMotion || disabled ? undefined : { scale: 1.02 }}
        transition={
          shouldReduceMotion
            ? undefined
            : {
                type: 'spring' as const,
                stiffness: 400,
                damping: 17,
              }
        }
        className={`
          ${colorClasses[color]}
          ${sizeClasses[size]}
          rounded-2xl
          font-bold
          text-white
          shadow-lg
          focus:outline-none
          focus:ring-4
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:transform-none
          transition-colors
          duration-200
          select-none
          touch-manipulation
          ${className}
        `.trim()}
        aria-disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </motion.button>
    );
  }
);

BigButton.displayName = 'BigButton';

export default BigButton;
