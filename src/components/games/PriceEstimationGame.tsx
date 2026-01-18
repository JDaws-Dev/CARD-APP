'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PRICE_CHALLENGES, type PriceChallenge } from '@/lib/miniGamesConfig';
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
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface GameState {
  phase: 'intro' | 'playing' | 'feedback' | 'results';
  currentRound: number;
  totalRounds: number;
  score: number;
  xpEarned: number;
  currentChallenge: PriceChallenge | null;
  selectedAnswer: 'higher' | 'lower' | null;
  isCorrect: boolean | null;
  roundResults: { challenge: PriceChallenge; selected: 'higher' | 'lower'; isCorrect: boolean }[];
}

// ============================================================================
// XP CALCULATIONS
// ============================================================================

const XP_PER_CORRECT = 20;
const XP_BONUS_PERFECT = 50;

// ============================================================================
// FORMAT PRICE HELPER
// ============================================================================

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}k`;
  }
  if (price >= 100) {
    return `$${price.toFixed(0)}`;
  }
  return `$${price.toFixed(2)}`;
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
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
        <CurrencyDollarIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-800">Price Estimation Game</h2>
      <p className="mb-6 max-w-md text-gray-600">
        Test your Pokemon card value knowledge! We&apos;ll show you a card and a price - you guess
        if the real value is higher or lower. Learn what makes cards valuable!
      </p>

      <div className="mb-8 rounded-xl bg-emerald-50 p-4">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-semibold text-emerald-700">
          <LightBulbIcon className="h-5 w-5" />
          Value Tips
        </h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
            <span>Popular Pokemon like Charizard and Pikachu are worth more</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-teal-400" />
            <span>Full art and alternate art cards are more valuable</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
            <span>Shiny and rainbow rare cards command premium prices</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        <PlayIcon className="h-5 w-5" />
        Start Game
      </button>
    </div>
  );
}

// ============================================================================
// ANSWER BUTTON COMPONENT
// ============================================================================

interface AnswerButtonProps {
  type: 'higher' | 'lower';
  askPrice: number;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
  isCorrect: boolean | null;
  correctAnswer: 'higher' | 'lower' | null;
}

function AnswerButton({
  type,
  askPrice,
  onClick,
  disabled,
  selected,
  isCorrect,
  correctAnswer,
}: AnswerButtonProps) {
  const isCorrectAnswer = correctAnswer === type;

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
      return 'ring-2 ring-offset-2 ring-emerald-400';
    }
    return 'hover:scale-105 hover:shadow-md';
  };

  const Icon = type === 'higher' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const colorClass = type === 'higher'
    ? 'from-green-500 to-emerald-500'
    : 'from-red-500 to-rose-500';
  const label = type === 'higher'
    ? `More than ${formatPrice(askPrice)}`
    : `Less than ${formatPrice(askPrice)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-2 rounded-xl border-2 border-gray-200 p-4 transition-all',
        getButtonStyles(),
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
          colorClass
        )}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {isCorrect !== null && isCorrectAnswer && (
        <CheckIcon className="absolute right-2 top-2 h-5 w-5 text-green-500" />
      )}
    </button>
  );
}

// ============================================================================
// PLAYING SCREEN
// ============================================================================

interface PlayingScreenProps {
  state: GameState;
  onAnswer: (answer: 'higher' | 'lower') => void;
  onContinue: () => void;
}

function PlayingScreen({ state, onAnswer, onContinue }: PlayingScreenProps) {
  const { currentChallenge, currentRound, totalRounds, selectedAnswer, isCorrect, score } = state;
  const [showHint, setShowHint] = useState(false);

  if (!currentChallenge) return null;

  const showingFeedback = state.phase === 'feedback';
  const correctAnswer: 'higher' | 'lower' =
    currentChallenge.actualPrice > currentChallenge.askPrice ? 'higher' : 'lower';

  return (
    <div className="px-4 py-6">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Round</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
            {currentRound} / {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-gray-700">{score} pts</span>
        </div>
      </div>

      {/* Card Image */}
      <div className="mb-4 flex justify-center">
        <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg">
          <Image
            src={currentChallenge.imageUrl}
            alt={currentChallenge.cardName}
            width={200}
            height={280}
            className="h-auto w-[200px]"
            priority
          />
        </div>
      </div>

      {/* Card Info */}
      <div className="mb-4 text-center">
        <h3 className="font-bold text-gray-800">{currentChallenge.cardName}</h3>
        <p className="text-sm text-gray-500">{currentChallenge.setName}</p>
      </div>

      {/* Ask Price */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-center">
        <p className="mb-1 text-sm font-medium text-gray-600">Is this card worth more or less than...</p>
        <p className="text-3xl font-bold text-emerald-600">{formatPrice(currentChallenge.askPrice)}</p>
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

      {/* Answer Options */}
      <div className="mb-6 flex gap-3">
        <AnswerButton
          type="higher"
          askPrice={currentChallenge.askPrice}
          onClick={() => onAnswer('higher')}
          disabled={showingFeedback}
          selected={selectedAnswer === 'higher'}
          isCorrect={isCorrect}
          correctAnswer={showingFeedback ? correctAnswer : null}
        />
        <AnswerButton
          type="lower"
          askPrice={currentChallenge.askPrice}
          onClick={() => onAnswer('lower')}
          disabled={showingFeedback}
          selected={selectedAnswer === 'lower'}
          isCorrect={isCorrect}
          correctAnswer={showingFeedback ? correctAnswer : null}
        />
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
                  Not quite! It&apos;s worth {formatPrice(currentChallenge.actualPrice)}
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
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
    if (percentage === 100) return { text: 'Price Pro!', icon: TrophyIcon, color: 'text-amber-500' };
    if (percentage >= 80) return { text: 'Value Expert!', icon: StarIcon, color: 'text-emerald-500' };
    if (percentage >= 60) return { text: 'Good Eye!', icon: SparklesIcon, color: 'text-blue-500' };
    return { text: 'Keep Learning!', icon: BoltIcon, color: 'text-teal-500' };
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
                ? 'from-emerald-400 to-teal-500'
                : percentage >= 60
                  ? 'from-blue-400 to-cyan-500'
                  : 'from-teal-400 to-cyan-500'
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
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="text-2xl font-bold text-emerald-600">{score}</div>
          <div className="text-sm text-emerald-700">Points</div>
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
                {result.isCorrect ? 'Correct' : formatPrice(result.challenge.actualPrice)}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
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

interface PriceEstimationGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PriceEstimationGame({ isOpen, onClose }: PriceEstimationGameProps) {
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
    const shuffled = [...PRICE_CHALLENGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, state.totalRounds);
  }, [state.totalRounds]);

  const startGame = useCallback(() => {
    const firstChallenge = challenges[0];
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      currentRound: 1,
      score: 0,
      xpEarned: 0,
      currentChallenge: firstChallenge,
      selectedAnswer: null,
      isCorrect: null,
      roundResults: [],
    }));
  }, [challenges]);

  const handleAnswer = useCallback(
    (answer: 'higher' | 'lower') => {
      const challenge = state.currentChallenge;
      if (!challenge) return;

      const correctAnswer: 'higher' | 'lower' =
        challenge.actualPrice > challenge.askPrice ? 'higher' : 'lower';
      const isCorrect = answer === correctAnswer;
      const xp = isCorrect ? XP_PER_CORRECT : 0;

      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        selectedAnswer: answer,
        isCorrect,
        score: prev.score + (isCorrect ? 100 : 0),
        xpEarned: prev.xpEarned + xp,
        roundResults: [
          ...prev.roundResults,
          { challenge: prev.currentChallenge!, selected: answer, isCorrect },
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
      const nextChallenge = challenges[nextRound - 1];
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentRound: nextRound,
        currentChallenge: nextChallenge,
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
          <PlayingScreen
            state={state}
            onAnswer={handleAnswer}
            onContinue={handleContinue}
          />
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

interface PriceEstimationGameButtonProps {
  onClick: () => void;
  className?: string;
}

export function PriceEstimationGameButton({ onClick, className }: PriceEstimationGameButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <CurrencyDollarIcon className="h-5 w-5" aria-hidden="true" />
      Play Game
    </button>
  );
}
