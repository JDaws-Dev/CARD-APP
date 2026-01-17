'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  POKEMON_RARITIES,
  getRarityDisplayName,
  getRarityColor,
  type RarityTier,
} from '@/lib/rarity';
import {
  SparklesIcon,
  TrophyIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlayIcon,
  StarIcon,
  LightBulbIcon,
  CheckIcon,
  ChevronRightIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface CardChallenge {
  id: string;
  imageUrl: string;
  cardName: string;
  correctRarity: string;
  hints: string[];
  explanation: string;
}

interface GameState {
  phase: 'intro' | 'playing' | 'feedback' | 'results';
  currentRound: number;
  totalRounds: number;
  score: number;
  xpEarned: number;
  currentChallenge: CardChallenge | null;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  roundResults: { challenge: CardChallenge; selected: string; isCorrect: boolean }[];
}

// ============================================================================
// RARITY OPTIONS FOR GAME
// ============================================================================

// Simplified rarity options for the game (grouped into learnable categories)
const GAME_RARITIES = [
  { value: 'Common', label: 'Common', tier: 'common' as RarityTier },
  { value: 'Uncommon', label: 'Uncommon', tier: 'uncommon' as RarityTier },
  { value: 'Rare', label: 'Rare', tier: 'rare' as RarityTier },
  { value: 'Rare Holo', label: 'Rare Holo', tier: 'rare' as RarityTier },
  { value: 'Ultra Rare', label: 'Ultra Rare', tier: 'ultra_rare' as RarityTier },
  { value: 'Secret Rare', label: 'Secret Rare', tier: 'secret' as RarityTier },
] as const;

const RARITY_GRADIENTS: Record<string, { from: string; to: string; bg: string }> = {
  Common: { from: 'from-gray-400', to: 'to-gray-500', bg: 'bg-gray-50' },
  Uncommon: { from: 'from-emerald-400', to: 'to-green-500', bg: 'bg-emerald-50' },
  Rare: { from: 'from-blue-400', to: 'to-blue-500', bg: 'bg-blue-50' },
  'Rare Holo': { from: 'from-indigo-400', to: 'to-purple-500', bg: 'bg-indigo-50' },
  'Ultra Rare': { from: 'from-pink-400', to: 'to-rose-500', bg: 'bg-pink-50' },
  'Secret Rare': { from: 'from-amber-400', to: 'to-orange-500', bg: 'bg-amber-50' },
};

// ============================================================================
// MOCK CHALLENGES - Real images from Pokemon TCG API
// ============================================================================

const MOCK_CHALLENGES: CardChallenge[] = [
  {
    id: '1',
    imageUrl: 'https://images.pokemontcg.io/swsh1/1.png',
    cardName: 'Celebi V',
    correctRarity: 'Ultra Rare',
    hints: ['Look at the card style', 'V cards are special!'],
    explanation:
      'V cards like Celebi V are Ultra Rare! They have the big "V" in the name and special artwork.',
  },
  {
    id: '2',
    imageUrl: 'https://images.pokemontcg.io/swsh1/6.png',
    cardName: 'Caterpie',
    correctRarity: 'Common',
    hints: ['Basic Pokemon', 'Simple border design'],
    explanation:
      'Basic Pokemon like Caterpie with simple artwork and no special effects are usually Common.',
  },
  {
    id: '3',
    imageUrl: 'https://images.pokemontcg.io/swsh1/25.png',
    cardName: 'Cinderace',
    correctRarity: 'Rare Holo',
    hints: ['Stage 2 evolution', 'Notice the shiny effect'],
    explanation: 'Cinderace is a Rare Holo - a rare card with a holographic shine on the artwork!',
  },
  {
    id: '4',
    imageUrl: 'https://images.pokemontcg.io/swsh1/50.png',
    cardName: 'Galarian Sirfetchd',
    correctRarity: 'Rare',
    hints: ['Stage 1 evolution', 'No holographic effect'],
    explanation:
      "This is a Rare card - not common, but doesn't have the holographic shine of a Rare Holo.",
  },
  {
    id: '5',
    imageUrl: 'https://images.pokemontcg.io/swsh1/56.png',
    cardName: 'Lapras',
    correctRarity: 'Uncommon',
    hints: ['Basic Pokemon', 'Slightly better than common'],
    explanation:
      'Lapras here is Uncommon - more valuable than Common but not quite Rare. Look for the diamond symbol!',
  },
  {
    id: '6',
    imageUrl: 'https://images.pokemontcg.io/swsh1/136.png',
    cardName: 'Zacian V',
    correctRarity: 'Ultra Rare',
    hints: ['Legendary Pokemon V', 'Full art style'],
    explanation: 'Zacian V is an Ultra Rare! V Pokemon are always special and valuable.',
  },
  {
    id: '7',
    imageUrl: 'https://images.pokemontcg.io/swsh1/192.png',
    cardName: 'Marnie',
    correctRarity: 'Secret Rare',
    hints: ['Full art trainer', 'Special alternate art'],
    explanation:
      'Full art trainer cards with special artwork like this Marnie are Secret Rare - the rarest!',
  },
  {
    id: '8',
    imageUrl: 'https://images.pokemontcg.io/swsh1/95.png',
    cardName: 'Snorlax',
    correctRarity: 'Rare Holo',
    hints: ['Popular Pokemon', 'Holographic shine'],
    explanation:
      "Snorlax with holographic artwork is a Rare Holo - you can tell by the sparkle when you tilt it!",
  },
];

// ============================================================================
// XP CALCULATIONS
// ============================================================================

const XP_PER_CORRECT = 20;
const XP_BONUS_PERFECT = 50;
const XP_BONUS_STREAK = 10;

// ============================================================================
// RARITY BUTTON COMPONENT
// ============================================================================

interface RarityButtonProps {
  rarity: (typeof GAME_RARITIES)[number];
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
  isCorrect: boolean | null;
  correctAnswer: string | null;
}

function RarityButton({
  rarity,
  onClick,
  disabled,
  selected,
  isCorrect,
  correctAnswer,
}: RarityButtonProps) {
  const gradient = RARITY_GRADIENTS[rarity.value] || RARITY_GRADIENTS['Common'];
  const isCorrectAnswer = correctAnswer === rarity.value;

  const getButtonStyles = () => {
    if (isCorrect !== null) {
      if (selected && isCorrect) {
        return 'ring-4 ring-green-400 bg-green-100 border-green-400';
      }
      if (selected && !isCorrect) {
        return 'ring-4 ring-red-400 bg-red-100 border-red-400';
      }
      if (isCorrectAnswer) {
        return 'ring-4 ring-green-400 bg-green-100 border-green-400';
      }
    }
    if (selected) {
      return `ring-2 ring-offset-2 ring-purple-400`;
    }
    return 'hover:scale-105 hover:shadow-md';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border-2 border-gray-200 p-4 transition-all',
        getButtonStyles(),
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br',
          gradient.from,
          gradient.to
        )}
      >
        <SparklesIcon className="h-5 w-5 text-white" />
      </div>
      <span className="font-semibold text-gray-700">{rarity.label}</span>
      {isCorrect !== null && isCorrectAnswer && (
        <CheckIcon className="absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 text-green-500" />
      )}
    </button>
  );
}

// ============================================================================
// INTRO SCREEN
// ============================================================================

interface IntroScreenProps {
  onStart: () => void;
}

function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
        <QuestionMarkCircleIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-800">Rarity Guessing Game</h2>
      <p className="mb-6 max-w-md text-gray-600">
        Can you guess the rarity of Pokemon cards just by looking at them? Learn to spot the
        difference between Common, Rare, and Ultra Rare cards!
      </p>

      <div className="mb-8 rounded-xl bg-purple-50 p-4">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-semibold text-purple-700">
          <LightBulbIcon className="h-5 w-5" />
          Tips to Remember
        </h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
            <span>
              <strong>Common/Uncommon:</strong> Basic artwork, no special effects
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>
              <strong>Rare/Rare Holo:</strong> Better Pokemon, holos have shine
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-pink-400" />
            <span>
              <strong>Ultra Rare:</strong> V, VMAX, ex cards with special art
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <span>
              <strong>Secret Rare:</strong> Full art, rainbow, or gold cards
            </span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        <PlayIcon className="h-5 w-5" />
        Start Game
      </button>
    </div>
  );
}

// ============================================================================
// PLAYING SCREEN
// ============================================================================

interface PlayingScreenProps {
  state: GameState;
  onAnswer: (rarity: string) => void;
  onContinue: () => void;
}

function PlayingScreen({ state, onAnswer, onContinue }: PlayingScreenProps) {
  const { currentChallenge, currentRound, totalRounds, selectedAnswer, isCorrect, score } = state;
  const [showHint, setShowHint] = useState(false);

  if (!currentChallenge) return null;

  const showingFeedback = state.phase === 'feedback';

  return (
    <div className="px-4 py-6">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Round</span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
            {currentRound} / {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-gray-700">{score} pts</span>
        </div>
      </div>

      {/* Card Image */}
      <div className="mb-6 flex justify-center">
        <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg">
          <Image
            src={currentChallenge.imageUrl}
            alt="Mystery card"
            width={245}
            height={342}
            className="h-auto w-[245px]"
            priority
          />
          {!showingFeedback && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-center font-medium text-white">What rarity is this card?</p>
            </div>
          )}
        </div>
      </div>

      {/* Hint Button */}
      {!showingFeedback && (
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <LightBulbIcon className="h-4 w-4" />
            {showHint ? 'Hide Hint' : 'Need a Hint?'}
          </button>
        </div>
      )}

      {/* Hint Display */}
      {showHint && !showingFeedback && (
        <div className="mb-4 rounded-xl bg-amber-50 p-4">
          <ul className="space-y-1 text-sm text-amber-700">
            {currentChallenge.hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2">
                <LightBulbIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rarity Options */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {GAME_RARITIES.map((rarity) => (
          <RarityButton
            key={rarity.value}
            rarity={rarity}
            onClick={() => onAnswer(rarity.value)}
            disabled={showingFeedback}
            selected={selectedAnswer === rarity.value}
            isCorrect={isCorrect}
            correctAnswer={showingFeedback ? currentChallenge.correctRarity : null}
          />
        ))}
      </div>

      {/* Feedback */}
      {showingFeedback && (
        <div
          className={cn(
            'mb-6 rounded-xl p-4',
            isCorrect ? 'bg-green-50' : 'bg-red-50'
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckIcon className="h-6 w-6 text-green-500" />
                <span className="font-bold text-green-700">Correct! +{XP_PER_CORRECT} XP</span>
              </>
            ) : (
              <>
                <XMarkIcon className="h-6 w-6 text-red-500" />
                <span className="font-bold text-red-700">
                  Not quite! It was {currentChallenge.correctRarity}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">{currentChallenge.explanation}</p>
        </div>
      )}

      {/* Continue Button */}
      {showingFeedback && (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          {currentRound < totalRounds ? (
            <>
              Next Card
              <ChevronRightIcon className="h-5 w-5" />
            </>
          ) : (
            <>
              See Results
              <TrophyIcon className="h-5 w-5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// RESULTS SCREEN
// ============================================================================

interface ResultsScreenProps {
  state: GameState;
  onPlayAgain: () => void;
  onClose: () => void;
}

function ResultsScreen({ state, onPlayAgain, onClose }: ResultsScreenProps) {
  const { score, totalRounds, xpEarned, roundResults } = state;
  const correctCount = roundResults.filter((r) => r.isCorrect).length;
  const percentage = Math.round((correctCount / totalRounds) * 100);

  const getMessage = () => {
    if (percentage === 100) return { text: 'Perfect Score!', icon: TrophyIcon, color: 'text-amber-500' };
    if (percentage >= 80) return { text: 'Rarity Expert!', icon: StarIcon, color: 'text-purple-500' };
    if (percentage >= 60) return { text: 'Great Job!', icon: SparklesIcon, color: 'text-blue-500' };
    return { text: 'Keep Practicing!', icon: BoltIcon, color: 'text-green-500' };
  };

  const message = getMessage();
  const MessageIcon = message.icon;

  return (
    <div className="px-4 py-8 text-center">
      <div className="mb-6 flex justify-center">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            percentage === 100
              ? 'from-amber-400 to-orange-500'
              : percentage >= 80
                ? 'from-purple-400 to-pink-500'
                : percentage >= 60
                  ? 'from-blue-400 to-cyan-500'
                  : 'from-green-400 to-emerald-500'
          )}
        >
          <MessageIcon className="h-10 w-10 text-white" />
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-800">{message.text}</h2>
      <p className="mb-6 text-gray-600">
        You got {correctCount} out of {totalRounds} correct!
      </p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-purple-50 p-4">
          <div className="text-2xl font-bold text-purple-600">{score}</div>
          <div className="text-sm text-purple-700">Points</div>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <div className="text-2xl font-bold text-amber-600">+{xpEarned}</div>
          <div className="text-sm text-amber-700">XP Earned</div>
        </div>
      </div>

      {/* Round Summary */}
      <div className="mb-6 rounded-xl bg-gray-50 p-4">
        <h3 className="mb-3 font-semibold text-gray-700">Round Summary</h3>
        <div className="space-y-2">
          {roundResults.map((result, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white p-2 text-sm"
            >
              <span className="text-gray-600">{result.challenge.cardName}</span>
              <span
                className={cn(
                  'font-medium',
                  result.isCorrect ? 'text-green-600' : 'text-red-600'
                )}
              >
                {result.isCorrect ? 'Correct' : result.challenge.correctRarity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Play Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

interface RarityGuessingGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RarityGuessingGame({ isOpen, onClose }: RarityGuessingGameProps) {
  const [state, setState] = useState<GameState>({
    phase: 'intro',
    currentRound: 0,
    totalRounds: 5,
    score: 0,
    xpEarned: 0,
    currentChallenge: null,
    selectedAnswer: null,
    isCorrect: null,
    roundResults: [],
  });

  // Shuffle and pick challenges
  const challenges = useMemo(() => {
    const shuffled = [...MOCK_CHALLENGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, state.totalRounds);
  }, [state.totalRounds]);

  const startGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      currentRound: 1,
      score: 0,
      xpEarned: 0,
      currentChallenge: challenges[0],
      selectedAnswer: null,
      isCorrect: null,
      roundResults: [],
    }));
  }, [challenges]);

  const handleAnswer = useCallback(
    (rarity: string) => {
      const isCorrect = rarity === state.currentChallenge?.correctRarity;
      const xp = isCorrect ? XP_PER_CORRECT : 0;

      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        selectedAnswer: rarity,
        isCorrect,
        score: prev.score + (isCorrect ? 100 : 0),
        xpEarned: prev.xpEarned + xp,
        roundResults: [
          ...prev.roundResults,
          { challenge: prev.currentChallenge!, selected: rarity, isCorrect },
        ],
      }));
    },
    [state.currentChallenge]
  );

  const handleContinue = useCallback(() => {
    if (state.currentRound >= state.totalRounds) {
      // Check for perfect game bonus
      const allCorrect = state.roundResults.every((r) => r.isCorrect) && state.isCorrect;
      setState((prev) => ({
        ...prev,
        phase: 'results',
        xpEarned: allCorrect ? prev.xpEarned + XP_BONUS_PERFECT : prev.xpEarned,
      }));
    } else {
      const nextRound = state.currentRound + 1;
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentRound: nextRound,
        currentChallenge: challenges[nextRound - 1],
        selectedAnswer: null,
        isCorrect: null,
      }));
    }
  }, [state.currentRound, state.totalRounds, state.roundResults, state.isCorrect, challenges]);

  const handlePlayAgain = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'intro',
    }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close game"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {state.phase === 'intro' && <IntroScreen onStart={startGame} />}
        {(state.phase === 'playing' || state.phase === 'feedback') && (
          <PlayingScreen state={state} onAnswer={handleAnswer} onContinue={handleContinue} />
        )}
        {state.phase === 'results' && (
          <ResultsScreen state={state} onPlayAgain={handlePlayAgain} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON TO OPEN GAME
// ============================================================================

interface RarityGuessingButtonProps {
  onClick: () => void;
  className?: string;
}

export function RarityGuessingButton({ onClick, className }: RarityGuessingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
      Play Game
    </button>
  );
}
