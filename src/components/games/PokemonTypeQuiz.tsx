'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
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
  FireIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface PokemonChallenge {
  id: string;
  imageUrl: string;
  pokemonName: string;
  correctType: string;
  secondaryType?: string;
  hints: string[];
  explanation: string;
}

interface GameState {
  phase: 'intro' | 'playing' | 'feedback' | 'results';
  currentRound: number;
  totalRounds: number;
  score: number;
  xpEarned: number;
  currentChallenge: PokemonChallenge | null;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  roundResults: { challenge: PokemonChallenge; selected: string; isCorrect: boolean }[];
}

// ============================================================================
// POKEMON TYPES
// ============================================================================

const POKEMON_TYPES = [
  { value: 'Fire', color: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
  { value: 'Water', color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50' },
  { value: 'Grass', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50' },
  { value: 'Electric', color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50' },
  { value: 'Psychic', color: 'from-pink-400 to-purple-500', bg: 'bg-pink-50' },
  { value: 'Fighting', color: 'from-red-500 to-orange-600', bg: 'bg-red-50' },
  { value: 'Darkness', color: 'from-gray-600 to-gray-800', bg: 'bg-gray-100' },
  { value: 'Metal', color: 'from-gray-400 to-slate-500', bg: 'bg-slate-50' },
  { value: 'Dragon', color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50' },
  { value: 'Colorless', color: 'from-gray-300 to-gray-400', bg: 'bg-gray-50' },
] as const;

type PokemonType = (typeof POKEMON_TYPES)[number]['value'];

// ============================================================================
// MOCK CHALLENGES - Cards from Pokemon TCG API
// ============================================================================

const MOCK_CHALLENGES: PokemonChallenge[] = [
  {
    id: '1',
    imageUrl: 'https://images.pokemontcg.io/swsh1/25.png',
    pokemonName: 'Cinderace',
    correctType: 'Fire',
    hints: ['This Pokemon evolves from Scorbunny', 'It has a flame on its feet'],
    explanation: 'Cinderace is a Fire-type Pokemon! It uses its powerful legs to kick flaming soccer balls at opponents.',
  },
  {
    id: '2',
    imageUrl: 'https://images.pokemontcg.io/swsh1/56.png',
    pokemonName: 'Lapras',
    correctType: 'Water',
    hints: ['Known as the Transport Pokemon', 'Lives in the ocean'],
    explanation: 'Lapras is a Water-type Pokemon! Its gentle nature makes it perfect for carrying people across the sea.',
  },
  {
    id: '3',
    imageUrl: 'https://images.pokemontcg.io/swsh1/11.png',
    pokemonName: 'Rillaboom',
    correctType: 'Grass',
    hints: ['Plays a drum made from a tree stump', 'Final evolution of Grookey'],
    explanation: 'Rillaboom is a Grass-type Pokemon! It uses its drum to control the roots of its tree and attack.',
  },
  {
    id: '4',
    imageUrl: 'https://images.pokemontcg.io/swsh1/67.png',
    pokemonName: 'Boltund',
    correctType: 'Electric',
    hints: ['Evolves from Yamper', 'Can run at incredible speeds'],
    explanation: 'Boltund is an Electric-type Pokemon! It generates electricity by running and stores it in its legs.',
  },
  {
    id: '5',
    imageUrl: 'https://images.pokemontcg.io/swsh1/83.png',
    pokemonName: 'Hatterene',
    correctType: 'Psychic',
    hints: ['Known as the Silent Pokemon', 'Has a witch-like appearance'],
    explanation: 'Hatterene is a Psychic-type Pokemon! It can sense emotions and attacks anything that emits hostility.',
  },
  {
    id: '6',
    imageUrl: 'https://images.pokemontcg.io/swsh1/99.png',
    pokemonName: 'Machamp',
    correctType: 'Fighting',
    hints: ['Has four powerful arms', 'Master of all martial arts'],
    explanation: 'Machamp is a Fighting-type Pokemon! With four arms, it can throw 500 punches per second.',
  },
  {
    id: '7',
    imageUrl: 'https://images.pokemontcg.io/swsh1/117.png',
    pokemonName: 'Grimmsnarl',
    correctType: 'Darkness',
    hints: ['Uses its hair like muscles', 'Has a mischievous nature'],
    explanation: 'Grimmsnarl is a Darkness-type Pokemon! It wraps its body in hair that it can control like extra limbs.',
  },
  {
    id: '8',
    imageUrl: 'https://images.pokemontcg.io/swsh1/128.png',
    pokemonName: 'Copperajah',
    correctType: 'Metal',
    hints: ['Based on an elephant', 'Its body is made of oxidized copper'],
    explanation: 'Copperajah is a Metal-type Pokemon! Its green color comes from oxidized copper like the Statue of Liberty.',
  },
  {
    id: '9',
    imageUrl: 'https://images.pokemontcg.io/swsh1/138.png',
    pokemonName: 'Duraludon',
    correctType: 'Dragon',
    hints: ['Looks like a skyscraper', 'Lives in caves and mountains'],
    explanation: 'Duraludon is a Dragon-type Pokemon! Its body is made of light but sturdy metal alloy.',
  },
  {
    id: '10',
    imageUrl: 'https://images.pokemontcg.io/swsh1/150.png',
    pokemonName: 'Indeedee',
    correctType: 'Colorless',
    hints: ['Works as a butler Pokemon', 'Has psychic powers but normal typing on this card'],
    explanation: 'This Indeedee card is Colorless type! In the TCG, some Pokemon have different types than in the video games.',
  },
  {
    id: '11',
    imageUrl: 'https://images.pokemontcg.io/swsh1/2.png',
    pokemonName: 'Celebi V',
    correctType: 'Grass',
    hints: ['A mythical Pokemon', 'Guardian of the forest'],
    explanation: 'Celebi V is a Grass-type Pokemon! This time-traveling Pokemon protects forests across time.',
  },
  {
    id: '12',
    imageUrl: 'https://images.pokemontcg.io/swsh1/41.png',
    pokemonName: 'Inteleon',
    correctType: 'Water',
    hints: ['Evolves from Sobble', 'A secret agent Pokemon'],
    explanation: 'Inteleon is a Water-type Pokemon! It uses water hidden in its fingers like a sniper.',
  },
];

// ============================================================================
// XP CALCULATIONS
// ============================================================================

const XP_PER_CORRECT = 20;
const XP_BONUS_PERFECT = 50;

// ============================================================================
// TYPE BUTTON COMPONENT
// ============================================================================

interface TypeButtonProps {
  type: (typeof POKEMON_TYPES)[number];
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
  isCorrect: boolean | null;
  correctAnswer: string | null;
}

function TypeButton({
  type,
  onClick,
  disabled,
  selected,
  isCorrect,
  correctAnswer,
}: TypeButtonProps) {
  const isCorrectAnswer = correctAnswer === type.value;

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
      return 'ring-2 ring-offset-2 ring-orange-400';
    }
    return 'hover:scale-105 hover:shadow-md';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border-2 border-gray-200 p-3 transition-all',
        getButtonStyles(),
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br',
          type.color
        )}
      >
        <FireIcon className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-semibold text-gray-700">{type.value}</span>
      {isCorrect !== null && isCorrectAnswer && (
        <CheckIcon className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
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
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
        <FireIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-800">Pokemon Type Quiz</h2>
      <p className="mb-6 max-w-md text-gray-600">
        Test your knowledge of Pokemon types! Look at the card and guess what type it is.
        Learn the energy types used in the Pokemon TCG!
      </p>

      <div className="mb-8 rounded-xl bg-orange-50 p-4">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-semibold text-orange-700">
          <LightBulbIcon className="h-5 w-5" />
          Quick Tips
        </h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-400" />
            <span>Look at the energy symbol in the top right of the card</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>The card color often matches the Pokemon type</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
            <span>Attack costs show what energy type the Pokemon uses</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        <PlayIcon className="h-5 w-5" />
        Start Quiz
      </button>
    </div>
  );
}

// ============================================================================
// PLAYING SCREEN
// ============================================================================

interface PlayingScreenProps {
  state: GameState;
  onAnswer: (type: string) => void;
  onContinue: () => void;
  typeOptions: (typeof POKEMON_TYPES)[number][];
}

function PlayingScreen({ state, onAnswer, onContinue, typeOptions }: PlayingScreenProps) {
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
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
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
            alt="Pokemon card"
            width={220}
            height={308}
            className="h-auto w-[220px]"
            priority
          />
          {!showingFeedback && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-center font-medium text-white">What type is this Pokemon?</p>
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

      {/* Type Options - 2 columns, 4 options */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {typeOptions.map((type) => (
          <TypeButton
            key={type.value}
            type={type}
            onClick={() => onAnswer(type.value)}
            disabled={showingFeedback}
            selected={selectedAnswer === type.value}
            isCorrect={isCorrect}
            correctAnswer={showingFeedback ? currentChallenge.correctType : null}
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
                  Not quite! It&apos;s {currentChallenge.correctType} type
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          {currentRound < totalRounds ? (
            <>
              Next Pokemon
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
    if (percentage >= 80) return { text: 'Type Expert!', icon: StarIcon, color: 'text-orange-500' };
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
                ? 'from-orange-400 to-red-500'
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
        <div className="rounded-xl bg-orange-50 p-4">
          <div className="text-2xl font-bold text-orange-600">{score}</div>
          <div className="text-sm text-orange-700">Points</div>
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
              <span className="text-gray-600">{result.challenge.pokemonName}</span>
              <span
                className={cn(
                  'font-medium',
                  result.isCorrect ? 'text-green-600' : 'text-red-600'
                )}
              >
                {result.isCorrect ? 'Correct' : result.challenge.correctType}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
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

interface PokemonTypeQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PokemonTypeQuiz({ isOpen, onClose }: PokemonTypeQuizProps) {
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

  // Generate 4 type options for each round (correct + 3 wrong)
  const getTypeOptions = useCallback((correctType: string) => {
    const correct = POKEMON_TYPES.find((t) => t.value === correctType)!;
    const others = POKEMON_TYPES.filter((t) => t.value !== correctType);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correct, ...shuffledOthers].sort(() => Math.random() - 0.5);
    return options;
  }, []);

  const [currentTypeOptions, setCurrentTypeOptions] = useState<(typeof POKEMON_TYPES)[number][]>([]);

  const startGame = useCallback(() => {
    const firstChallenge = challenges[0];
    setCurrentTypeOptions(getTypeOptions(firstChallenge.correctType));
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
  }, [challenges, getTypeOptions]);

  const handleAnswer = useCallback(
    (type: string) => {
      const isCorrect = type === state.currentChallenge?.correctType;
      const xp = isCorrect ? XP_PER_CORRECT : 0;

      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        selectedAnswer: type,
        isCorrect,
        score: prev.score + (isCorrect ? 100 : 0),
        xpEarned: prev.xpEarned + xp,
        roundResults: [
          ...prev.roundResults,
          { challenge: prev.currentChallenge!, selected: type, isCorrect },
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
      setCurrentTypeOptions(getTypeOptions(nextChallenge.correctType));
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentRound: nextRound,
        currentChallenge: nextChallenge,
        selectedAnswer: null,
        isCorrect: null,
      }));
    }
  }, [state.currentRound, state.totalRounds, state.roundResults, state.isCorrect, challenges, getTypeOptions]);

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
            typeOptions={currentTypeOptions}
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

interface PokemonTypeQuizButtonProps {
  onClick: () => void;
  className?: string;
}

export function PokemonTypeQuizButton({ onClick, className }: PokemonTypeQuizButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <FireIcon className="h-5 w-5" aria-hidden="true" />
      Play Quiz
    </button>
  );
}
