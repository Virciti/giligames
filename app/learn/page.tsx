'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Lock, Truck } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player-store';

// Import all 16 learning games
import {
  NumberCrush,
  CountTheTrucks,
  NumberOrder,
  Compare,
  LetterFind,
  AlphabetRoad,
  MatchUp,
  LetterSounds,
  AdditionArena,
  SubtractionStadium,
  MathMatch,
  NumberBonds,
  WordBuilder,
  RhymeRace,
  SightWords,
  PictureMatch,
} from '@/components/education';

type GameId =
  | 'number-crush'
  | 'count-trucks'
  | 'number-order'
  | 'compare'
  | 'letter-find'
  | 'alphabet-road'
  | 'match-up'
  | 'letter-sounds'
  | 'addition-arena'
  | 'subtraction-stadium'
  | 'math-match'
  | 'number-bonds'
  | 'word-builder'
  | 'rhyme-race'
  | 'sight-words'
  | 'picture-match';

interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  unlockStars: number;
  component: React.ComponentType<{ onBack: () => void; difficulty?: number }>;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  textColor: string;
  games: GameInfo[];
}

const categories: Category[] = [
  {
    id: 'numbers',
    name: 'Numbers',
    icon: '🔢',
    color: 'from-brand-red to-red-700',
    textColor: 'text-white',
    games: [
      {
        id: 'number-crush',
        name: 'Number Crush',
        description: 'Find the target number',
        unlockStars: 0,
        component: NumberCrush,
      },
      {
        id: 'count-trucks',
        name: 'Count the Trucks',
        description: 'Count and select',
        unlockStars: 0,
        component: CountTheTrucks,
      },
      {
        id: 'number-order',
        name: 'Number Order',
        description: 'Arrange in sequence',
        unlockStars: 5,
        component: NumberOrder,
      },
      {
        id: 'compare',
        name: 'Compare',
        description: 'Which has more?',
        unlockStars: 10,
        component: Compare,
      },
    ],
  },
  {
    id: 'letters',
    name: 'Letters',
    icon: '🔤',
    color: 'from-brand-blue to-cyan-700',
    textColor: 'text-white',
    games: [
      {
        id: 'letter-find',
        name: 'Letter Find',
        description: 'Find the letter',
        unlockStars: 0,
        component: LetterFind,
      },
      {
        id: 'alphabet-road',
        name: 'Alphabet Road',
        description: 'Tap A-B-C in order',
        unlockStars: 5,
        component: AlphabetRoad,
      },
      {
        id: 'match-up',
        name: 'Match Up',
        description: 'Upper to lower',
        unlockStars: 10,
        component: MatchUp,
      },
      {
        id: 'letter-sounds',
        name: 'Letter Sounds',
        description: 'Phoneme recognition',
        unlockStars: 15,
        component: LetterSounds,
      },
    ],
  },
  {
    id: 'math',
    name: 'Math',
    icon: '➕',
    color: 'from-brand-yellow to-amber-600',
    textColor: 'text-gray-900',
    games: [
      {
        id: 'addition-arena',
        name: 'Addition Arena',
        description: 'Add numbers together',
        unlockStars: 15,
        component: AdditionArena,
      },
      {
        id: 'subtraction-stadium',
        name: 'Subtraction Stadium',
        description: 'Take away numbers',
        unlockStars: 20,
        component: SubtractionStadium,
      },
      {
        id: 'math-match',
        name: 'Math Match',
        description: 'Match equations',
        unlockStars: 25,
        component: MathMatch,
      },
      {
        id: 'number-bonds',
        name: 'Number Bonds',
        description: 'Find pairs to 10',
        unlockStars: 30,
        component: NumberBonds,
      },
    ],
  },
  {
    id: 'words',
    name: 'Words',
    icon: '📖',
    color: 'from-brand-purple to-purple-800',
    textColor: 'text-white',
    games: [
      {
        id: 'picture-match',
        name: 'Picture Match',
        description: 'Match words to pictures',
        unlockStars: 0,
        component: PictureMatch,
      },
      {
        id: 'sight-words',
        name: 'Sight Words',
        description: 'Learn common words',
        unlockStars: 10,
        component: SightWords,
      },
      {
        id: 'word-builder',
        name: 'Word Builder',
        description: 'Spell words',
        unlockStars: 20,
        component: WordBuilder,
      },
      {
        id: 'rhyme-race',
        name: 'Rhyme Race',
        description: 'Find rhyming words',
        unlockStars: 25,
        component: RhymeRace,
      },
    ],
  },
];

export default function LearnPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const totalStars = usePlayerStore((s) => s.totalStars);

  const handleBack = () => {
    setActiveGame(null);
  };

  // Find the active game component
  const getActiveGameComponent = () => {
    for (const category of categories) {
      const game = category.games.find((g) => g.id === activeGame);
      if (game) {
        const GameComponent = game.component;
        return <GameComponent onBack={handleBack} difficulty={1} />;
      }
    }
    return null;
  };

  const isGameUnlocked = (unlockStars: number) => totalStars >= unlockStars;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {activeGame ? (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen"
          >
            {getActiveGameComponent()}
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto px-4 py-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/"
                className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                aria-label="Back to garage"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>

              <div className="text-center">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  Learning Zone
                </h1>
                <p className="text-white/80 text-sm">Choose a game to play!</p>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold text-white">{totalStars}</span>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category, categoryIndex) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className={`bg-gradient-to-br ${category.color} rounded-3xl p-5 shadow-xl`}
                >
                  <h2
                    className={`text-2xl font-bold ${category.textColor} mb-4 flex items-center gap-2`}
                  >
                    <span className="text-3xl">{category.icon}</span>
                    {category.name}
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    {category.games.map((game, gameIndex) => {
                      const unlocked = isGameUnlocked(game.unlockStars);

                      return (
                        <motion.button
                          key={game.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: categoryIndex * 0.1 + gameIndex * 0.05 }}
                          onClick={() => unlocked && setActiveGame(game.id)}
                          disabled={!unlocked}
                          className={`
                            relative p-4 rounded-xl text-left transition-all
                            ${
                              unlocked
                                ? 'bg-white/25 hover:bg-white/35 hover:scale-105 cursor-pointer'
                                : 'bg-black/20 cursor-not-allowed'
                            }
                          `}
                        >
                          {!unlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl">
                              <Lock className="w-6 h-6 text-white/80 mb-1" />
                              <span className="text-xs text-white/80 font-bold flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {game.unlockStars}
                              </span>
                            </div>
                          )}

                          <div className={unlocked ? '' : 'opacity-40'}>
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className={`w-4 h-4 ${category.textColor}`} />
                              <span
                                className={`font-bold text-sm ${category.textColor}`}
                              >
                                {game.name}
                              </span>
                            </div>
                            <p
                              className={`text-xs ${
                                category.textColor === 'text-white'
                                  ? 'text-white/70'
                                  : 'text-gray-700'
                              }`}
                            >
                              {game.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4"
            >
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {categories.reduce(
                      (acc, cat) =>
                        acc + cat.games.filter((g) => isGameUnlocked(g.unlockStars)).length,
                      0
                    )}
                  </p>
                  <p className="text-white/60 text-sm">Games Unlocked</p>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-2xl font-bold text-white">16</p>
                  <p className="text-white/60 text-sm">Total Games</p>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{totalStars}</p>
                  <p className="text-white/60 text-sm">Stars Earned</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
