'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getAllConditionGrades, type ConditionInfo } from '@/lib/conditionGuide';
import {
  SparklesIcon,
  HandThumbUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  TrophyIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlayIcon,
  StarIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CheckIcon,
  ChevronRightIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface CardChallenge {
  id: string;
  imageUrl: string;
  correctCondition: string;
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
// ICON MAPPING
// ============================================================================

const CONDITION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  nm: SparklesIcon,
  lp: HandThumbUpIcon,
  mp: CheckCircleIcon,
  hp: ExclamationTriangleIcon,
  dmg: XCircleIcon,
};

const CONDITION_GRADIENTS: Record<string, { from: string; to: string; bg: string }> = {
  nm: { from: 'from-emerald-500', to: 'to-green-500', bg: 'bg-emerald-50' },
  lp: { from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-50' },
  mp: { from: 'from-amber-500', to: 'to-yellow-500', bg: 'bg-amber-50' },
  hp: { from: 'from-orange-500', to: 'to-red-500', bg: 'bg-orange-50' },
  dmg: { from: 'from-red-500', to: 'to-rose-600', bg: 'bg-red-50' },
};

// ============================================================================
// MOCK CHALLENGES - Real images would come from API
// ============================================================================

const MOCK_CHALLENGES: CardChallenge[] = [
  {
    id: '1',
    imageUrl: 'https://images.pokemontcg.io/swsh1/1.png',
    correctCondition: 'nm',
    hints: ['Look at the corners carefully', 'Check the edges for whitening'],
    explanation:
      'This card has sharp corners, no whitening on edges, and a clean surface - classic Near Mint!',
  },
  {
    id: '2',
    imageUrl: 'https://images.pokemontcg.io/swsh1/25.png',
    correctCondition: 'lp',
    hints: ['Notice the corner condition', 'Is there any slight wear?'],
    explanation:
      'This card shows tiny edge wear that is barely visible - typical Lightly Played condition.',
  },
  {
    id: '3',
    imageUrl: 'https://images.pokemontcg.io/swsh1/50.png',
    correctCondition: 'mp',
    hints: ['Check the edges', 'Look at the surface'],
    explanation:
      'Visible edge whitening and minor scratches on the surface make this Moderately Played.',
  },
  {
    id: '4',
    imageUrl: 'https://images.pokemontcg.io/swsh1/75.png',
    correctCondition: 'hp',
    hints: ['Are there any creases?', 'Check the corners closely'],
    explanation:
      'Heavy corner wear and visible creasing indicate this card is Heavily Played.',
  },
  {
    id: '5',
    imageUrl: 'https://images.pokemontcg.io/swsh1/100.png',
    correctCondition: 'nm',
    hints: ['Fresh from the pack look?', 'Any damage at all?'],
    explanation:
      'Perfect corners, pristine edges, flawless surface - this card is Near Mint!',
  },
  {
    id: '6',
    imageUrl: 'https://images.pokemontcg.io/swsh1/136.png',
    correctCondition: 'lp',
    hints: ['Inspect the holo surface', 'Barely noticeable wear'],
    explanation:
      'Light surface scratches only visible under direct light - Lightly Played grade.',
  },
  {
    id: '7',
    imageUrl: 'https://images.pokemontcg.io/swsh1/150.png',
    correctCondition: 'mp',
    hints: ['Multiple signs of play', 'Check all edges'],
    explanation:
      'Edge wear on all sides with noticeable scratches - Moderately Played is accurate.',
  },
  {
    id: '8',
    imageUrl: 'https://images.pokemontcg.io/swsh1/175.png',
    correctCondition: 'nm',
    hints: ['Pack fresh quality', 'Examine every detail'],
    explanation:
      'No flaws whatsoever - sharp corners, clean edges, perfect surface. Near Mint!',
  },
];

// ============================================================================
// XP CALCULATIONS
// ============================================================================

const XP_PER_CORRECT = 25;
const XP_BONUS_PERFECT = 50;
const XP_BONUS_STREAK = 10;

// ============================================================================
// CONDITION BUTTON COMPONENT
// ============================================================================

interface ConditionButtonProps {
  condition: ConditionInfo;
  isSelected: boolean;
  isCorrect: boolean | null;
  isDisabled: boolean;
  onClick: () => void;
}

function ConditionButton({
  condition,
  isSelected,
  isCorrect,
  isDisabled,
  onClick,
}: ConditionButtonProps) {
  const Icon = CONDITION_ICONS[condition.id] || CheckCircleIcon;
  const colors = CONDITION_GRADIENTS[condition.id] || CONDITION_GRADIENTS.mp;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        isDisabled && 'cursor-not-allowed opacity-60',
        !isDisabled && 'hover:-translate-y-0.5 hover:shadow-md',
        isSelected && isCorrect === true && 'border-emerald-500 bg-emerald-50',
        isSelected && isCorrect === false && 'border-red-500 bg-red-50',
        isSelected && isCorrect === null && 'border-kid-primary bg-kid-primary/5',
        !isSelected && 'border-gray-200 bg-white'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br',
          colors.from,
          colors.to
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900">{condition.shortName}</p>
        <p className="text-xs text-gray-500">{condition.name}</p>
      </div>
      {isSelected && isCorrect === true && (
        <CheckIcon className="h-6 w-6 text-emerald-500" />
      )}
      {isSelected && isCorrect === false && (
        <XMarkIcon className="h-6 w-6 text-red-500" />
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
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
        <AcademicCapIcon className="h-10 w-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Grade Like a Pro</h2>
        <p className="mt-2 text-gray-600">
          Test your card grading skills! Look at each card and guess its condition.
        </p>
      </div>

      <div className="mx-auto max-w-sm space-y-3 text-left">
        <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-3">
          <BoltIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
          <p className="text-sm text-gray-700">
            Earn <strong>{XP_PER_CORRECT} XP</strong> for each correct answer
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
          <StarIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <p className="text-sm text-gray-700">
            Get a perfect score for <strong>{XP_BONUS_PERFECT} bonus XP</strong>
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3">
          <LightBulbIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
          <p className="text-sm text-gray-700">
            Use hints to help you learn what to look for
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-md transition-all',
          'bg-gradient-to-r from-purple-500 to-indigo-500',
          'hover:-translate-y-0.5 hover:shadow-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2'
        )}
      >
        <PlayIcon className="h-5 w-5" />
        Start Game
      </button>
    </div>
  );
}

// ============================================================================
// GAME SCREEN
// ============================================================================

interface GameScreenProps {
  gameState: GameState;
  conditions: readonly ConditionInfo[];
  onSelectAnswer: (conditionId: string) => void;
  onSubmitAnswer: () => void;
  showHint: boolean;
  onToggleHint: () => void;
}

function GameScreen({
  gameState,
  conditions,
  onSelectAnswer,
  onSubmitAnswer,
  showHint,
  onToggleHint,
}: GameScreenProps) {
  const { currentRound, totalRounds, score, currentChallenge, selectedAnswer } = gameState;

  if (!currentChallenge) return null;

  // Filter to only show grading conditions (NM, LP, MP, HP - not DMG for the game)
  const gameConditions = conditions.filter((c) => c.id !== 'dmg');

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            Round {currentRound}/{totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-gray-900">{score} pts</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
          style={{ width: `${((currentRound - 1) / totalRounds) * 100}%` }}
        />
      </div>

      {/* Card Image */}
      <div className="relative mx-auto w-full max-w-xs">
        <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-xl bg-gray-100 shadow-lg">
          <Image
            src={currentChallenge.imageUrl}
            alt="Card to grade"
            fill
            className="object-contain"
            sizes="(max-width: 320px) 100vw, 320px"
            unoptimized
          />
        </div>
      </div>

      {/* Hint Section */}
      <div className="text-center">
        <button
          type="button"
          onClick={onToggleHint}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <LightBulbIcon className="h-4 w-4" />
          {showHint ? 'Hide hint' : 'Need a hint?'}
        </button>
        {showHint && (
          <div className="mt-2 rounded-xl bg-amber-50 p-3">
            <p className="text-sm text-amber-800">{currentChallenge.hints[0]}</p>
          </div>
        )}
      </div>

      {/* Condition Options */}
      <div className="space-y-2">
        <p className="text-center font-medium text-gray-700">
          What condition is this card?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {gameConditions.map((condition) => (
            <ConditionButton
              key={condition.id}
              condition={condition}
              isSelected={selectedAnswer === condition.id}
              isCorrect={null}
              isDisabled={false}
              onClick={() => onSelectAnswer(condition.id)}
            />
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmitAnswer}
        disabled={!selectedAnswer}
        className={cn(
          'w-full rounded-xl py-3 font-semibold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
          selectedAnswer
            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:-translate-y-0.5 hover:shadow-md'
            : 'bg-gray-200 text-gray-400'
        )}
      >
        Submit Answer
      </button>
    </div>
  );
}

// ============================================================================
// FEEDBACK SCREEN
// ============================================================================

interface FeedbackScreenProps {
  gameState: GameState;
  conditions: readonly ConditionInfo[];
  onNextRound: () => void;
}

function FeedbackScreen({ gameState, conditions, onNextRound }: FeedbackScreenProps) {
  const { currentChallenge, selectedAnswer, isCorrect, currentRound, totalRounds } =
    gameState;

  if (!currentChallenge) return null;

  const correctCondition = conditions.find((c) => c.id === currentChallenge.correctCondition);
  const selectedCondition = conditions.find((c) => c.id === selectedAnswer);
  const CorrectIcon = CONDITION_ICONS[currentChallenge.correctCondition] || CheckCircleIcon;
  const correctColors =
    CONDITION_GRADIENTS[currentChallenge.correctCondition] || CONDITION_GRADIENTS.mp;

  return (
    <div className="space-y-4 text-center">
      {/* Result Icon */}
      <div
        className={cn(
          'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
          isCorrect
            ? 'bg-gradient-to-br from-emerald-400 to-green-500'
            : 'bg-gradient-to-br from-red-400 to-rose-500'
        )}
      >
        {isCorrect ? (
          <CheckIcon className="h-8 w-8 text-white" />
        ) : (
          <XMarkIcon className="h-8 w-8 text-white" />
        )}
      </div>

      <div>
        <h3 className={cn('text-xl font-bold', isCorrect ? 'text-emerald-600' : 'text-red-600')}>
          {isCorrect ? 'Correct!' : 'Not quite!'}
        </h3>
        {isCorrect && (
          <p className="text-sm text-gray-600">+{XP_PER_CORRECT} XP earned!</p>
        )}
      </div>

      {/* Correct Answer Display */}
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
        <p className="mb-2 text-sm text-gray-600">The correct answer is:</p>
        <div className="inline-flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br',
              correctColors.from,
              correctColors.to
            )}
          >
            <CorrectIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">
            {correctCondition?.shortName} - {correctCondition?.name}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-xl bg-indigo-50 p-4 text-left">
        <div className="mb-2 flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold text-indigo-900">Why?</span>
        </div>
        <p className="text-sm text-gray-700">{currentChallenge.explanation}</p>
      </div>

      {/* Your Answer (if wrong) */}
      {!isCorrect && selectedCondition && (
        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-sm text-gray-600">
            You selected:{' '}
            <strong>
              {selectedCondition.shortName} - {selectedCondition.name}
            </strong>
          </p>
        </div>
      )}

      {/* Next Button */}
      <button
        type="button"
        onClick={onNextRound}
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all',
          'bg-gradient-to-r from-purple-500 to-indigo-500',
          'hover:-translate-y-0.5 hover:shadow-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2'
        )}
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
    </div>
  );
}

// ============================================================================
// RESULTS SCREEN
// ============================================================================

interface ResultsScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onClose: () => void;
}

function ResultsScreen({ gameState, onPlayAgain, onClose }: ResultsScreenProps) {
  const { score, totalRounds, xpEarned, roundResults } = gameState;
  const correctCount = roundResults.filter((r) => r.isCorrect).length;
  const isPerfect = correctCount === totalRounds;
  const percentage = Math.round((correctCount / totalRounds) * 100);

  let message: string;
  let messageColor: string;
  if (percentage === 100) {
    message = 'Perfect Score! You are a grading master!';
    messageColor = 'text-emerald-600';
  } else if (percentage >= 75) {
    message = 'Great job! You really know your conditions!';
    messageColor = 'text-blue-600';
  } else if (percentage >= 50) {
    message = 'Good effort! Keep practicing to improve!';
    messageColor = 'text-amber-600';
  } else {
    message = "Keep learning! You'll get better with practice!";
    messageColor = 'text-purple-600';
  }

  return (
    <div className="space-y-6 text-center">
      {/* Trophy Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
        <TrophyIcon className="h-10 w-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Game Complete!</h2>
        <p className={cn('mt-1 font-medium', messageColor)}>{message}</p>
      </div>

      {/* Score Display */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="mb-4 text-5xl font-bold text-gray-900">{correctCount}/{totalRounds}</div>
        <p className="text-gray-600">Correct Answers</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <p className="text-lg font-bold text-purple-600">{score}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <p className="text-lg font-bold text-emerald-600">+{xpEarned}</p>
            <p className="text-xs text-gray-500">XP Earned</p>
          </div>
        </div>
        {isPerfect && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
            <SparklesIcon className="h-4 w-4" />
            Perfect Score Bonus: +{XP_BONUS_PERFECT} XP!
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 transition-all',
            'hover:bg-gray-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2'
          )}
        >
          Done
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className={cn(
            'flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all',
            'bg-gradient-to-r from-purple-500 to-indigo-500',
            'hover:-translate-y-0.5 hover:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2'
          )}
        >
          <ArrowPathIcon className="mr-2 inline-block h-5 w-5" />
          Play Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface GradeLikeAProGameProps {
  isOpen: boolean;
  onClose: () => void;
  onXPEarned?: (xp: number) => void;
}

export function GradeLikeAProGame({ isOpen, onClose, onXPEarned }: GradeLikeAProGameProps) {
  const conditions = getAllConditionGrades();
  const [showHint, setShowHint] = useState(false);

  const ROUNDS_PER_GAME = 5;

  const [gameState, setGameState] = useState<GameState>({
    phase: 'intro',
    currentRound: 1,
    totalRounds: ROUNDS_PER_GAME,
    score: 0,
    xpEarned: 0,
    currentChallenge: null,
    selectedAnswer: null,
    isCorrect: null,
    roundResults: [],
  });

  // Shuffle and select challenges
  const challenges = useMemo(() => {
    const shuffled = [...MOCK_CHALLENGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, ROUNDS_PER_GAME);
  }, []);

  // Reset game state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGameState({
        phase: 'intro',
        currentRound: 1,
        totalRounds: ROUNDS_PER_GAME,
        score: 0,
        xpEarned: 0,
        currentChallenge: null,
        selectedAnswer: null,
        isCorrect: null,
        roundResults: [],
      });
      setShowHint(false);
    }
  }, [isOpen]);

  const handleStartGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: 'playing',
      currentChallenge: challenges[0],
    }));
  }, [challenges]);

  const handleSelectAnswer = useCallback((conditionId: string) => {
    setGameState((prev) => ({
      ...prev,
      selectedAnswer: conditionId,
    }));
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    const { currentChallenge, selectedAnswer, score, roundResults } = gameState;
    if (!currentChallenge || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentChallenge.correctCondition;
    const pointsEarned = isCorrect ? 100 : 0;
    const xpForRound = isCorrect ? XP_PER_CORRECT : 0;

    setGameState((prev) => ({
      ...prev,
      phase: 'feedback',
      isCorrect,
      score: score + pointsEarned,
      xpEarned: prev.xpEarned + xpForRound,
      roundResults: [
        ...roundResults,
        { challenge: currentChallenge, selected: selectedAnswer, isCorrect },
      ],
    }));
    setShowHint(false);
  }, [gameState]);

  const handleNextRound = useCallback(() => {
    const { currentRound, totalRounds, xpEarned, roundResults } = gameState;

    if (currentRound >= totalRounds) {
      // Calculate final XP with bonuses
      const correctCount = roundResults.filter((r) => r.isCorrect).length + (gameState.isCorrect ? 1 : 0);
      const isPerfect = correctCount === totalRounds;
      const finalXP = xpEarned + (isPerfect ? XP_BONUS_PERFECT : 0);

      setGameState((prev) => ({
        ...prev,
        phase: 'results',
        xpEarned: finalXP,
      }));

      // Notify parent of XP earned
      if (onXPEarned) {
        onXPEarned(finalXP);
      }
    } else {
      setGameState((prev) => ({
        ...prev,
        phase: 'playing',
        currentRound: currentRound + 1,
        currentChallenge: challenges[currentRound],
        selectedAnswer: null,
        isCorrect: null,
      }));
    }
  }, [gameState, challenges, onXPEarned]);

  const handlePlayAgain = useCallback(() => {
    setGameState({
      phase: 'intro',
      currentRound: 1,
      totalRounds: ROUNDS_PER_GAME,
      score: 0,
      xpEarned: 0,
      currentChallenge: null,
      selectedAnswer: null,
      isCorrect: null,
      roundResults: [],
    });
    setShowHint(false);
  }, []);

  const handleToggleHint = useCallback(() => {
    setShowHint((prev) => !prev);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Grade Like a Pro Game"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-3 top-3 z-10 rounded-full p-2 text-gray-400 transition-colors',
            'hover:bg-gray-100 hover:text-gray-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400'
          )}
          aria-label="Close game"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="max-h-[85vh] overflow-y-auto p-6">
          {gameState.phase === 'intro' && <IntroScreen onStart={handleStartGame} />}

          {gameState.phase === 'playing' && (
            <GameScreen
              gameState={gameState}
              conditions={conditions}
              onSelectAnswer={handleSelectAnswer}
              onSubmitAnswer={handleSubmitAnswer}
              showHint={showHint}
              onToggleHint={handleToggleHint}
            />
          )}

          {gameState.phase === 'feedback' && (
            <FeedbackScreen
              gameState={gameState}
              conditions={conditions}
              onNextRound={handleNextRound}
            />
          )}

          {gameState.phase === 'results' && (
            <ResultsScreen
              gameState={gameState}
              onPlayAgain={handlePlayAgain}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON TO LAUNCH GAME
// ============================================================================

interface GradeLikeAProButtonProps {
  onClick: () => void;
  className?: string;
}

export function GradeLikeAProButton({ onClick, className }: GradeLikeAProButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-all',
        'bg-gradient-to-r from-purple-500 to-indigo-500',
        'hover:-translate-y-0.5 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <AcademicCapIcon className="h-5 w-5" />
      Grade Like a Pro
    </button>
  );
}
