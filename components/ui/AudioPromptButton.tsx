'use client';

import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

interface AudioPromptButtonProps {
  onClick: () => void;
  size?: 'md' | 'lg';
  label?: string;
  disabled?: boolean;
}

const sizeConfig = {
  md: {
    button: 'w-16 h-16',
    icon: 'w-8 h-8',
    label: 'text-sm',
  },
  lg: {
    button: 'w-20 h-20',
    icon: 'w-10 h-10',
    label: 'text-base',
  },
};

export function AudioPromptButton({
  onClick,
  size = 'md',
  label,
  disabled = false,
}: AudioPromptButtonProps) {
  const config = sizeConfig[size];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={`
        ${config.button}
        relative flex items-center justify-center
        bg-brand-orange text-white rounded-full
        shadow-lg shadow-brand-orange/30
        focus:outline-none focus:ring-4 focus:ring-brand-orange/50
        transition-colors
        ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:bg-brand-orange/90 cursor-pointer'}
      `}
      aria-label={label || 'Play audio'}
      aria-disabled={disabled}
    >
      {/* Pulse animation ring when disabled (audio playing) */}
      {disabled && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full bg-brand-orange"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-brand-orange"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Speaker icon with animation */}
      <motion.div
        animate={
          disabled
            ? {
                scale: [1, 1.1, 1],
              }
            : {}
        }
        transition={{
          duration: 0.5,
          repeat: disabled ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <Volume2 className={config.icon} strokeWidth={2.5} />
      </motion.div>

      {/* Sound waves animation when playing */}
      {disabled && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute w-1 bg-white rounded-full"
              style={{
                right: i * 4,
                height: 8 + i * 4,
                top: '50%',
                translateY: '-50%',
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scaleY: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}

// Optional: A wrapper that includes a label
export function AudioPromptButtonWithLabel({
  onClick,
  size = 'md',
  label = 'Listen',
  disabled = false,
}: AudioPromptButtonProps) {
  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <AudioPromptButton
        onClick={onClick}
        size={size}
        label={label}
        disabled={disabled}
      />
      <span
        className={`${config.label} font-bold text-white drop-shadow`}
      >
        {label}
      </span>
    </div>
  );
}
