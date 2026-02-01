'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Truck } from 'lucide-react';
import { trucks, isTruckUnlocked, type Truck as TruckType } from '@/content/trucks';
import { usePlayerStore } from '@/lib/stores/player-store';

interface TruckCarouselProps {
  onSelect?: (truckId: string) => void;
}

const CARD_WIDTH = 120;
const CARD_GAP = 16;

export function TruckCarousel({ onSelect }: TruckCarouselProps) {
  const selectedTruck = usePlayerStore((s) => s.selectedTruck);
  const totalStars = usePlayerStore((s) => s.totalStars);
  const selectTruck = usePlayerStore((s) => s.selectTruck);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = trucks.findIndex((t) => t.id === selectedTruck);
    return idx >= 0 ? idx : 0;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const handlePrev = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    animateToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(trucks.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    animateToIndex(newIndex);
  };

  const animateToIndex = (index: number) => {
    const targetX = -index * (CARD_WIDTH + CARD_GAP);
    animate(x, targetX, { type: 'spring', stiffness: 300, damping: 30 });
  };

  const handleSelectTruck = (truck: TruckType) => {
    if (!isTruckUnlocked(truck, totalStars)) return;
    selectTruck(truck.id);
    onSelect?.(truck.id);
  };

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/30 transition-colors"
        aria-label="Previous truck"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={handleNext}
        disabled={currentIndex === trucks.length - 1}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/30 transition-colors"
        aria-label="Next truck"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="overflow-hidden mx-12 py-4"
      >
        <motion.div
          style={{ x }}
          className="flex gap-4"
        >
          {trucks.map((truck, index) => {
            const isUnlocked = isTruckUnlocked(truck, totalStars);
            const isSelected = selectedTruck === truck.id;

            return (
              <motion.button
                key={truck.id}
                onClick={() => handleSelectTruck(truck)}
                disabled={!isUnlocked}
                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                className={`
                  flex-shrink-0 w-[120px] h-[140px]
                  rounded-2xl p-3
                  flex flex-col items-center justify-center
                  transition-all relative
                  ${isSelected
                    ? 'ring-4 ring-white shadow-lg shadow-white/30'
                    : isUnlocked
                      ? 'hover:ring-2 hover:ring-white/50'
                      : 'opacity-60'}
                `}
                style={{
                  backgroundColor: isUnlocked ? truck.color : '#666',
                }}
              >
                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center">
                    <Lock className="w-8 h-8 text-white mb-1" />
                    <span className="text-xs text-white font-bold">
                      {truck.unlockRequirement.value} ⭐
                    </span>
                  </div>
                )}

                {/* Truck icon */}
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                  <Truck className="w-10 h-10 text-white" />
                </div>

                {/* Name */}
                <span className="text-xs font-bold text-white text-center line-clamp-1">
                  {truck.name}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-2">
        {trucks.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              animateToIndex(index);
            }}
            className={`
              w-2 h-2 rounded-full transition-all
              ${currentIndex === index ? 'bg-white w-4' : 'bg-white/40'}
            `}
            aria-label={`Go to truck ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default TruckCarousel;
