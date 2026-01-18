'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SET_SYMBOL_DATA, type SetSymbolData } from '@/lib/miniGamesConfig';
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
  PuzzlePieceIcon,
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
  currentChallenge: SetSymbolData | null;
  options: string[];
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  roundResults: { challenge: SetSymbolData; selected: string; isCorrect: boolean }[];
}

// ============================================================================
// XP CALCULATIONS
// ============================================================================

const XP_PER_CORRECT = 20;
const XP_BONUS_PERFECT = 50;

// ============================================================================
// OPTION BUTTON COMPONENT
// ============================================================================

interface OptionButtonProps {
  option: string;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
  isCorrect: boolean | null;
  correctAnswer: string | null;
}

function OptionButton({
  option,
  onClick,
  disabled,
  selected,
  isCorrect,
  correctAnswer,
}: OptionButtonProps) {
  const isCorrectAnswer = correctAnswer === option;

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
      return `ring-2 ring-offset-2 ring-blue-400`;
    }
    return 'hover:scale-[1.02] hover:shadow-md hover:border-blue-300';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all',
        getButtonStyles(),
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span className="font-medium text-gray-700">{option}</span>
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
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
        <PuzzlePieceIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-800">Set Symbol Matching</h2>
      <p className="mb-6 max-w-md text-gray-600">
        Can you match Pokemon TCG set symbols to their set names? Learn to recognize symbols from
        popular sets!
      </p>

      <div className="mb-8 rounded-xl bg-blue-50 p-4">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-semibold text-blue-700">
          <LightBulbIcon className="h-5 w-5" />
          How to Play
        </h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>Look at the set symbol shown</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>Choose the correct set name from four options</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>Use hints if you need help!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>Earn XP for each correct answer</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
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
  onAnswer: (setName: string) => void;
  onContinue: () => void;
}

function PlayingScreen({ state, onAnswer, onContinue }: PlayingScreenProps) {
  const { currentChallenge, currentRound, totalRounds, selectedAnswer, isCorrect, score, options } =
    state;
  const [showHint, setShowHint] = useState(false);

  if (!currentChallenge) return null;

  const showingFeedback = state.phase === 'feedback';

  return (
    <div className="px-4 py-6">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Round</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
            {currentRound} / {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-gray-700">{score} pts</span>
        </div>
      </div>

      {/* Set Symbol Display */}
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
          <Image
            src={currentChallenge.symbolUrl}
            alt="Set symbol"
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
            priority
          />
        </div>
        <p className="text-center font-medium text-gray-700">
          {showingFeedback ? currentChallenge.setName : 'Which set is this symbol from?'}
        </p>
        {showingFeedback && (
          <p className="text-sm text-gray-500">Released in {currentChallenge.releaseYear}</p>
        )}
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
          <p className="flex items-start gap-2 text-sm text-amber-700">
            <LightBulbIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {currentChallenge.hint}
          </p>
        </div>
      )}

      {/* Options */}
      <div className="mb-6 grid grid-cols-1 gap-3">
        {options.map((option) => (
          <OptionButton
            key={option}
            option={option}
            onClick={() => onAnswer(option)}
            disabled={showingFeedback}
            selected={selectedAnswer === option}
            isCorrect={isCorrect}
            correctAnswer={showingFeedback ? currentChallenge.setName : null}
          />
        ))}
      </div>

      {/* Feedback */}
      {showingFeedback && (
        <div className={cn('mb-6 rounded-xl p-4', isCorrect ? 'bg-green-50' : 'bg-red-50')}>
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
                  Not quite! It was {currentChallenge.setName}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">{currentChallenge.hint}</p>
        </div>
      )}

      {/* Continue Button */}
      {showingFeedback && (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          {currentRound < totalRounds ? (
            <>
              Next Symbol
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
    if (percentage === 100)
      return { text: 'Perfect Score!', icon: TrophyIcon, color: 'text-amber-500' };
    if (percentage >= 80)
      return { text: 'Set Expert!', icon: StarIcon, color: 'text-blue-500' };
    if (percentage >= 60)
      return { text: 'Great Job!', icon: SparklesIcon, color: 'text-cyan-500' };
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
                ? 'from-blue-400 to-cyan-500'
                : percentage >= 60
                  ? 'from-cyan-400 to-teal-500'
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
        <div className="rounded-xl bg-blue-50 p-4">
          <div className="text-2xl font-bold text-blue-600">{score}</div>
          <div className="text-sm text-blue-700">Points</div>
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
              <span className="text-gray-600">{result.challenge.setName}</span>
              <span
                className={cn('font-medium', result.isCorrect ? 'text-green-600' : 'text-red-600')}
              >
                {result.isCorrect ? 'Correct' : 'Incorrect'}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Play Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER: Generate wrong options
// ============================================================================

function generateOptions(correctSet: SetSymbolData, allSets: SetSymbolData[]): string[] {
  const options = [correctSet.setName];
  const otherSets = allSets.filter((s) => s.id !== correctSet.id);

  // Shuffle and pick 3 wrong answers
  const shuffled = [...otherSets].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3 && i < shuffled.length; i++) {
    options.push(shuffled[i].setName);
  }

  // Shuffle the options so correct answer isn't always first
  return options.sort(() => Math.random() - 0.5);
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

interface SetSymbolMatchingGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetSymbolMatchingGame({ isOpen, onClose }: SetSymbolMatchingGameProps) {
  const [state, setState] = useState<GameState>({
    phase: 'intro',
    currentRound: 0,
    totalRounds: 5,
    score: 0,
    xpEarned: 0,
    currentChallenge: null,
    options: [],
    selectedAnswer: null,
    isCorrect: null,
    roundResults: [],
  });

  // Shuffle and pick challenges
  const challenges = useMemo(() => {
    const shuffled = [...SET_SYMBOL_DATA].sort(() => Math.random() - 0.5);
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
      options: generateOptions(firstChallenge, SET_SYMBOL_DATA),
      selectedAnswer: null,
      isCorrect: null,
      roundResults: [],
    }));
  }, [challenges]);

  const handleAnswer = useCallback(
    (setName: string) => {
      const isCorrect = setName === state.currentChallenge?.setName;
      const xp = isCorrect ? XP_PER_CORRECT : 0;

      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        selectedAnswer: setName,
        isCorrect,
        score: prev.score + (isCorrect ? 100 : 0),
        xpEarned: prev.xpEarned + xp,
        roundResults: [
          ...prev.roundResults,
          { challenge: prev.currentChallenge!, selected: setName, isCorrect },
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
        options: generateOptions(nextChallenge, SET_SYMBOL_DATA),
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

interface SetSymbolMatchingButtonProps {
  onClick: () => void;
  className?: string;
}

export function SetSymbolMatchingButton({ onClick, className }: SetSymbolMatchingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <PuzzlePieceIcon className="h-5 w-5" aria-hidden="true" />
      Play Game
    </button>
  );
}
