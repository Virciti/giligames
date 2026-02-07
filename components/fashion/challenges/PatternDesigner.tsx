'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatternElement } from '@/content/patterns';
import { getPatternsUpToTier } from '@/content/patterns';

const TOTAL_QUESTIONS = 5;

interface PatternDesignerProps {
  tier: number;
  onAnswer: (correct: boolean, itemId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

function ShapeIcon({ shape, color, size = 28 }: { shape: string; color: string; size?: number }) {
  const s = size;
  const half = s / 2;

  switch (shape) {
    case 'circle':
      return <circle cx={half} cy={half} r={half - 2} fill={color} />;
    case 'square':
      return <rect x={2} y={2} width={s - 4} height={s - 4} rx={2} fill={color} />;
    case 'triangle':
      return <polygon points={`${half},2 ${s - 2},${s - 2} 2,${s - 2}`} fill={color} />;
    case 'star': {
      const r = half - 2;
      const inner = r * 0.4;
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const oA = (i * 72 - 90) * (Math.PI / 180);
        const iA = (i * 72 + 36 - 90) * (Math.PI / 180);
        pts.push(`${half + r * Math.cos(oA)},${half + r * Math.sin(oA)}`);
        pts.push(`${half + inner * Math.cos(iA)},${half + inner * Math.sin(iA)}`);
      }
      return <polygon points={pts.join(' ')} fill={color} />;
    }
    case 'diamond':
      return <polygon points={`${half},2 ${s - 2},${half} ${half},${s - 2} 2,${half}`} fill={color} />;
    case 'heart':
      return (
        <path
          d={`M${half},${s - 4} C${half - 8},${half - 2} 2,${half - 6} 2,${half / 2 + 2} C2,4 ${half - 2},2 ${half},${half / 2 + 4} C${half + 2},2 ${s - 2},4 ${s - 2},${half / 2 + 2} C${s - 2},${half - 6} ${half + 8},${half - 2} ${half},${s - 4}Z`}
          fill={color}
        />
      );
    default:
      return <circle cx={half} cy={half} r={half - 2} fill={color} />;
  }
}

function PatternElementDisplay({ element, hidden }: { element: PatternElement; hidden: boolean }) {
  return (
    <svg width={40} height={40} viewBox="0 0 28 28">
      {hidden ? (
        <rect x={2} y={2} width={24} height={24} rx={4} fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1} strokeDasharray="4 2" />
      ) : (
        <ShapeIcon shape={element.shape} color={element.color} />
      )}
    </svg>
  );
}

export function PatternDesigner({ tier, onAnswer, onComplete, onBack }: PatternDesignerProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<PatternElement | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(() => {
    const pool = getPatternsUpToTier(Math.min(tier + 1, 5));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS);
  }, [tier]);

  const current = questions[questionIndex];

  const options = useMemo(() => {
    if (!current) return [];
    const answer = current.sequence[current.hiddenIndex];
    const all = [answer, ...current.wrongOptions];
    return all.sort(() => Math.random() - 0.5);
  }, [current]);

  const handleSelect = useCallback(
    (option: PatternElement) => {
      if (showResult || !current) return;
      setSelectedOption(option);
      setShowResult(true);

      const answer = current.sequence[current.hiddenIndex];
      const correct = option.shape === answer.shape && option.color === answer.color;
      onAnswer(correct, current.id);

      setTimeout(() => {
        if (questionIndex + 1 >= TOTAL_QUESTIONS) {
          onComplete();
        } else {
          setQuestionIndex((i) => i + 1);
          setSelectedOption(null);
          setShowResult(false);
        }
      }, 1500);
    },
    [current, showResult, questionIndex, onAnswer, onComplete]
  );

  if (!current) return null;

  const answer = current.sequence[current.hiddenIndex];

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/70 hover:text-white text-sm">
          ← Back
        </button>
        <span className="text-white font-bold">🔶 Pattern Designer</span>
        <span className="text-white/70 text-sm">
          {questionIndex + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < questionIndex ? 'bg-green-400' : i === questionIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center"
        >
          <p className="text-white/70 text-sm mb-4">Complete the pattern!</p>

          {/* Pattern sequence */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8 bg-white/10 rounded-2xl p-4">
            {current.sequence.map((el, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <PatternElementDisplay
                  element={showResult && i === current.hiddenIndex ? answer : el}
                  hidden={!showResult && i === current.hiddenIndex}
                />
              </motion.div>
            ))}
          </div>

          <p className="text-white/70 text-sm mb-4">What goes in the empty spot?</p>

          <div className="grid grid-cols-4 gap-3">
            {options.map((opt, i) => {
              let ring = '';
              if (showResult && opt.shape === answer.shape && opt.color === answer.color) {
                ring = 'ring-2 ring-green-400';
              } else if (
                showResult &&
                selectedOption &&
                opt.shape === selectedOption.shape &&
                opt.color === selectedOption.color &&
                !(opt.shape === answer.shape && opt.color === answer.color)
              ) {
                ring = 'ring-2 ring-red-400';
              }

              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt)}
                  disabled={showResult}
                  className={`bg-white/20 hover:bg-white/30 rounded-xl p-3 flex items-center justify-center transition-colors ${ring}`}
                >
                  <svg width={40} height={40} viewBox="0 0 28 28">
                    <ShapeIcon shape={opt.shape} color={opt.color} />
                  </svg>
                </motion.button>
              );
            })}
          </div>

          {showResult && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 font-bold ${
                selectedOption?.shape === answer.shape && selectedOption?.color === answer.color
                  ? 'text-green-300'
                  : 'text-white/70'
              }`}
            >
              {selectedOption?.shape === answer.shape && selectedOption?.color === answer.color
                ? 'Pattern complete!'
                : 'Look at the pattern again!'}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
