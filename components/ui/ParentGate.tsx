'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calculator, Timer, X } from 'lucide-react';

interface ParentGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Simple math problems for parent verification
const MATH_PROBLEMS = [
  { question: '7 + 3 = ?', answer: 10 },
  { question: '8 + 4 = ?', answer: 12 },
  { question: '6 + 5 = ?', answer: 11 },
  { question: '9 + 2 = ?', answer: 11 },
];

type BypassMethod = 'hold' | 'math' | null;

export function ParentGate({ onSuccess, onCancel }: ParentGateProps) {
  const [selectedMethod, setSelectedMethod] = useState<BypassMethod>(null);

  // Hold button state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Math challenge state - use ref to track problem index to avoid impure render
  const problemIndexRef = useRef<number>(0);
  const [mathProblemIndex, setMathProblemIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  // Initialize random problem index on mount
  useEffect(() => {
    problemIndexRef.current = Math.floor(Math.random() * MATH_PROBLEMS.length);
    setMathProblemIndex(problemIndexRef.current);
  }, []);

  const mathProblem = MATH_PROBLEMS[mathProblemIndex];

  // Function to pick a new random problem
  const pickNewProblem = useCallback(() => {
    const newIndex = Math.floor(Math.random() * MATH_PROBLEMS.length);
    problemIndexRef.current = newIndex;
    setMathProblemIndex(newIndex);
  }, []);

  // Hold button logic - 3 second hold
  const HOLD_DURATION = 3000; // 3 seconds
  const UPDATE_INTERVAL = 50; // Update every 50ms

  const startHolding = useCallback(() => {
    setIsHolding(true);
    setHoldProgress(0);

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const newProgress = prev + (UPDATE_INTERVAL / HOLD_DURATION) * 100;
        if (newProgress >= 100) {
          if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
          }
          onSuccess();
          return 100;
        }
        return newProgress;
      });
    }, UPDATE_INTERVAL);
  }, [onSuccess]);

  const stopHolding = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  // Handle math answer submission
  const handleMathSubmit = () => {
    const numAnswer = parseInt(mathAnswer, 10);
    if (numAnswer === mathProblem.answer) {
      onSuccess();
    } else {
      setMathError(true);
      setMathAnswer('');
      // Pick a new random problem
      pickNewProblem();
      setTimeout(() => setMathError(false), 1000);
    }
  };

  const remainingSeconds = Math.ceil((100 - holdProgress) / (100 / 3));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-brand-purple p-6 text-white">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-bold">Parents Only</h2>
              <p className="text-white/80 text-sm">
                This area is for grown-ups
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Cancel"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          {selectedMethod === null && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-6">
                Choose how to verify you are a parent:
              </p>

              {/* Method 1: Hold Button */}
              <button
                onClick={() => setSelectedMethod('hold')}
                className="w-full p-4 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-2xl flex items-center gap-4 transition-colors"
              >
                <div className="w-14 h-14 bg-brand-blue rounded-xl flex items-center justify-center">
                  <Timer className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">
                    Hold for 3 seconds
                  </div>
                  <div className="text-sm text-gray-600">
                    Press and hold a button
                  </div>
                </div>
              </button>

              {/* Method 2: Math Problem */}
              <button
                onClick={() => setSelectedMethod('math')}
                className="w-full p-4 bg-brand-green/10 hover:bg-brand-green/20 rounded-2xl flex items-center gap-4 transition-colors"
              >
                <div className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">
                    Solve a math problem
                  </div>
                  <div className="text-sm text-gray-600">
                    Answer a simple addition
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Hold Button Method */}
          {selectedMethod === 'hold' && (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Press and hold the button below for 3 seconds:
              </p>

              <motion.button
                onMouseDown={startHolding}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={startHolding}
                onTouchEnd={stopHolding}
                className="relative w-40 h-40 mx-auto rounded-full bg-brand-blue text-white font-bold text-xl overflow-hidden shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                {/* Progress overlay */}
                <motion.div
                  className="absolute inset-0 bg-brand-green"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: holdProgress / 100 }}
                  style={{ transformOrigin: 'bottom' }}
                />

                {/* Button content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <Timer className="w-12 h-12 mb-2" />
                  <span>
                    {isHolding ? `${remainingSeconds}s` : 'HOLD'}
                  </span>
                </div>
              </motion.button>

              <button
                onClick={() => setSelectedMethod(null)}
                className="mt-6 text-gray-500 hover:text-gray-700 underline"
              >
                Try another method
              </button>
            </div>
          )}

          {/* Math Problem Method */}
          {selectedMethod === 'math' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Solve this math problem:</p>

              <motion.div
                animate={mathError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`text-4xl font-bold mb-6 p-4 rounded-2xl ${
                  mathError ? 'bg-brand-red/20 text-brand-red' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {mathProblem.question}
              </motion.div>

              <div className="flex gap-2 justify-center mb-6">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMathSubmit()}
                  className="w-24 h-16 text-3xl text-center font-bold border-4 border-gray-200 rounded-2xl focus:border-brand-blue focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleMathSubmit}
                  disabled={!mathAnswer}
                  className="h-16 px-6 bg-brand-green text-white font-bold text-xl rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-green/90 transition-colors"
                >
                  Check
                </button>
              </div>

              {mathError && (
                <p className="text-brand-red font-medium mb-4">
                  Try again with the new problem!
                </p>
              )}

              <button
                onClick={() => setSelectedMethod(null)}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Try another method
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
