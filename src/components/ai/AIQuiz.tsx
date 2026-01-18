'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  SparklesIcon,
  TrophyIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlayIcon,
  StarIcon,
  ClockIcon,
  CheckIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid';
import type { Id } from '../../../convex/_generated/dataModel';

// ============================================================================
// TYPES
// ============================================================================

type QuestionType = 'multiple_choice' | 'true_false' | 'image_based';

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  cardId?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
}

interface QuizResult {
  questions: QuizQuestion[];
  quizId: string;
  title: string;
  description: string;
  totalXp: number;
  error?: string;
}

interface AnswerRecord {
  questionId: string;
  selectedAnswerIndex: number;
  correct: boolean;
  xpEarned: number;
}

type GamePhase = 'intro' | 'loading' | 'playing' | 'feedback' | 'results';

interface GameState {
  phase: GamePhase;
  quiz: QuizResult | null;
  currentQuestionIndex: number;
  selectedAnswerIndex: number | null;
  isCorrect: boolean | null;
  score: number;
  xpEarned: number;
  answers: AnswerRecord[];
  timeRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUESTION_TIME = 30; // seconds per question

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'from-green-400 to-emerald-500', xpMultiplier: 1 },
  medium: { label: 'Medium', color: 'from-yellow-400 to-orange-500', xpMultiplier: 1.5 },
  hard: { label: 'Hard', color: 'from-red-400 to-rose-500', xpMultiplier: 2 },
} as const;

// ============================================================================
// INTRO SCREEN
// ============================================================================

interface IntroScreenProps {
  onStart: (difficulty: 'easy' | 'medium' | 'hard') => void;
  remainingQuizzes: number | null;
}

function IntroScreen({ onStart, remainingQuizzes }: IntroScreenProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
        <AcademicCapIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-800">Collection Quiz</h2>
      <p className="mb-6 max-w-md text-gray-600">
        Test your knowledge about your card collection! Questions are personalized based on the cards you own.
      </p>

      {/* Difficulty Selection */}
      <div className="mb-6 w-full max-w-sm">
        <p className="mb-3 text-sm font-medium text-gray-500">Choose Difficulty</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDifficulty(key)}
              className={cn(
                'rounded-xl border-2 p-3 transition-all',
                selectedDifficulty === key
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500 ring-offset-2'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              )}
            >
              <div className={cn('mx-auto mb-1 h-3 w-12 rounded-full bg-gradient-to-r', config.color)} />
              <span className="text-sm font-medium text-gray-700">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="mb-6 rounded-xl bg-purple-50 p-4">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-semibold text-purple-700">
          <LightBulbIcon className="h-5 w-5" />
          How It Works
        </h3>
        <ul className="space-y-2 text-left text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
            <span>Answer 5 questions about your collection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
            <span>You have 30 seconds per question</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
            <span>Earn XP for correct answers!</span>
          </li>
        </ul>
      </div>

      {/* Remaining Quizzes */}
      {remainingQuizzes !== null && (
        <p className="mb-4 text-sm text-gray-500">
          <SparklesIcon className="mr-1 inline h-4 w-4 text-purple-500" />
          {remainingQuizzes} {remainingQuizzes === 1 ? 'quiz' : 'quizzes'} remaining today
        </p>
      )}

      <button
        type="button"
        onClick={() => onStart(selectedDifficulty)}
        disabled={remainingQuizzes === 0}
        className={cn(
          'flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-white shadow-lg transition-all',
          remainingQuizzes === 0
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:-translate-y-0.5 hover:shadow-xl'
        )}
      >
        <PlayIcon className="h-5 w-5" />
        {remainingQuizzes === 0 ? 'No Quizzes Left' : 'Start Quiz'}
      </button>
    </div>
  );
}

// ============================================================================
// LOADING SCREEN
// ============================================================================

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
        <SparklesIcon className="h-10 w-10 animate-spin text-white" />
      </div>
      <h2 className="mb-3 text-xl font-bold text-gray-800">Generating Your Quiz...</h2>
      <p className="max-w-sm text-gray-600">
        Our AI is creating personalized questions based on your collection!
      </p>
    </div>
  );
}

// ============================================================================
// TIMER COMPONENT
// ============================================================================

interface TimerProps {
  timeRemaining: number;
  maxTime: number;
}

function Timer({ timeRemaining, maxTime }: TimerProps) {
  const percentage = (timeRemaining / maxTime) * 100;
  const isLow = timeRemaining <= 10;

  return (
    <div className="flex items-center gap-2">
      <ClockIcon className={cn('h-5 w-5', isLow ? 'text-red-500' : 'text-gray-400')} />
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isLow ? 'bg-red-500' : 'bg-purple-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-sm font-medium', isLow ? 'text-red-500' : 'text-gray-600')}>
        {timeRemaining}s
      </span>
    </div>
  );
}

// ============================================================================
// QUESTION SCREEN
// ============================================================================

interface QuestionScreenProps {
  state: GameState;
  onAnswer: (index: number) => void;
  onContinue: () => void;
}

function QuestionScreen({ state, onAnswer, onContinue }: QuestionScreenProps) {
  const { quiz, currentQuestionIndex, selectedAnswerIndex, isCorrect, score, timeRemaining } = state;

  if (!quiz || quiz.questions.length === 0) return null;

  const question = quiz.questions[currentQuestionIndex];
  const showingFeedback = state.phase === 'feedback';
  const totalQuestions = quiz.questions.length;

  return (
    <div className="px-4 py-6">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Question</span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {!showingFeedback && (
            <Timer timeRemaining={timeRemaining} maxTime={QUESTION_TIME} />
          )}
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-gray-700">{score}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all"
          style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Card Image (for image-based questions) */}
      {question.imageUrl && (
        <div className="mb-6 flex justify-center">
          <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg">
            <Image
              src={question.imageUrl}
              alt="Card image"
              width={180}
              height={252}
              className="h-auto w-[180px]"
              priority
            />
          </div>
        </div>
      )}

      {/* Question */}
      <div className="mb-6 rounded-xl bg-gray-50 p-4">
        <p className="text-center text-lg font-medium text-gray-800">{question.question}</p>
      </div>

      {/* Answer Options */}
      <div className="mb-6 space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswerIndex === index;
          const isCorrectAnswer = index === question.correctAnswerIndex;

          let buttonStyle = 'border-gray-200 hover:border-purple-300 hover:bg-purple-50';

          if (showingFeedback) {
            if (isCorrectAnswer) {
              buttonStyle = 'border-green-400 bg-green-50 ring-2 ring-green-400';
            } else if (isSelected && !isCorrect) {
              buttonStyle = 'border-red-400 bg-red-50 ring-2 ring-red-400';
            } else {
              buttonStyle = 'border-gray-200 opacity-50';
            }
          } else if (isSelected) {
            buttonStyle = 'border-purple-500 bg-purple-50 ring-2 ring-purple-500';
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => !showingFeedback && onAnswer(index)}
              disabled={showingFeedback}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                buttonStyle,
                showingFeedback && 'cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  showingFeedback && isCorrectAnswer
                    ? 'bg-green-500 text-white'
                    : showingFeedback && isSelected && !isCorrect
                      ? 'bg-red-500 text-white'
                      : isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 font-medium text-gray-700">{option}</span>
              {showingFeedback && isCorrectAnswer && (
                <CheckIcon className="h-6 w-6 text-green-500" />
              )}
              {showingFeedback && isSelected && !isCorrect && (
                <XMarkIcon className="h-6 w-6 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showingFeedback && (
        <div
          className={cn('mb-6 rounded-xl p-4', isCorrect ? 'bg-green-50' : 'bg-red-50')}
        >
          <div className="mb-2 flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckIcon className="h-6 w-6 text-green-500" />
                <span className="font-bold text-green-700">Correct! +{question.xpReward} XP</span>
              </>
            ) : (
              <>
                <XMarkIcon className="h-6 w-6 text-red-500" />
                <span className="font-bold text-red-700">Not quite!</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">{question.explanation}</p>
        </div>
      )}

      {/* Continue Button */}
      {showingFeedback && (
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          {currentQuestionIndex < totalQuestions - 1 ? (
            <>
              Next Question
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
  const { quiz, score, xpEarned, answers } = state;

  if (!quiz) return null;

  const totalQuestions = quiz.questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const getMessage = () => {
    if (percentage === 100) return { text: 'Perfect Score!', icon: TrophyIcon, color: 'from-amber-400 to-orange-500' };
    if (percentage >= 80) return { text: 'Excellent!', icon: StarIcon, color: 'from-purple-400 to-indigo-500' };
    if (percentage >= 60) return { text: 'Great Job!', icon: SparklesIcon, color: 'from-blue-400 to-cyan-500' };
    return { text: 'Keep Learning!', icon: AcademicCapIcon, color: 'from-green-400 to-emerald-500' };
  };

  const message = getMessage();
  const MessageIcon = message.icon;

  return (
    <div className="px-4 py-8 text-center">
      <div className="mb-6 flex justify-center">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            message.color
          )}
        >
          <MessageIcon className="h-10 w-10 text-white" />
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-800">{message.text}</h2>
      <p className="mb-2 text-lg font-medium text-gray-700">{quiz.title}</p>
      <p className="mb-6 text-gray-600">
        You got {correctCount} out of {totalQuestions} correct!
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

      {/* Question Summary */}
      <div className="mb-6 rounded-xl bg-gray-50 p-4">
        <h3 className="mb-3 font-semibold text-gray-700">Question Summary</h3>
        <div className="space-y-2">
          {quiz.questions.map((question, i) => {
            const answer = answers[i];
            const isCorrect = answer?.correct ?? false;
            return (
              <div
                key={question.id}
                className="flex items-center justify-between rounded-lg bg-white p-2 text-sm"
              >
                <span className="text-gray-600 line-clamp-1 flex-1 text-left">
                  Q{i + 1}: {question.question.slice(0, 40)}...
                </span>
                <span className={cn('font-medium', isCorrect ? 'text-green-600' : 'text-red-600')}>
                  {isCorrect ? 'Correct' : 'Wrong'}
                </span>
              </div>
            );
          })}
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Play Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR SCREEN
// ============================================================================

interface ErrorScreenProps {
  error: string;
  onClose: () => void;
}

function ErrorScreen({ error, onClose }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg">
        <XMarkIcon className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-3 text-xl font-bold text-gray-800">Oops!</h2>
      <p className="mb-6 max-w-sm text-gray-600">{error}</p>
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
      >
        Go Back
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AIQuizProps {
  isOpen: boolean;
  onClose: () => void;
  gameSlug?: GameSlug;
}

export function AIQuiz({ isOpen, onClose, gameSlug = 'pokemon' }: AIQuizProps) {
  const { profileId, family } = useCurrentProfile();
  const generateQuiz = useAction(api.ai.quizGenerator.generateQuiz);
  const submitResults = useAction(api.ai.quizGenerator.submitQuizResults);
  const getRemaining = useAction(api.ai.quizGenerator.getRemainingQuizzes);

  const [state, setState] = useState<GameState>({
    phase: 'intro',
    quiz: null,
    currentQuestionIndex: 0,
    selectedAnswerIndex: null,
    isCorrect: null,
    score: 0,
    xpEarned: 0,
    answers: [],
    timeRemaining: QUESTION_TIME,
    difficulty: 'easy',
  });

  const [remainingQuizzes, setRemainingQuizzes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch remaining quizzes on mount
  useEffect(() => {
    if (profileId && isOpen) {
      getRemaining({ profileId: profileId as Id<'profiles'> })
        .then((result) => setRemainingQuizzes(result.remaining))
        .catch(console.error);
    }
  }, [profileId, isOpen, getRemaining]);

  const handleTimeUp = useCallback(() => {
    if (!state.quiz) return;
    const question = state.quiz.questions[state.currentQuestionIndex];

    // Record as wrong answer
    const answer: AnswerRecord = {
      questionId: question.id,
      selectedAnswerIndex: -1,
      correct: false,
      xpEarned: 0,
    };

    setState((prev) => ({
      ...prev,
      phase: 'feedback',
      selectedAnswerIndex: -1,
      isCorrect: false,
      answers: [...prev.answers, answer],
    }));
  }, [state.quiz, state.currentQuestionIndex]);

  // Timer effect
  useEffect(() => {
    if (state.phase === 'playing' && state.timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
      }, 1000);
    } else if (state.phase === 'playing' && state.timeRemaining === 0) {
      // Time's up - auto-submit wrong answer
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.phase, state.timeRemaining, handleTimeUp]);

  const startQuiz = useCallback(
    async (difficulty: 'easy' | 'medium' | 'hard') => {
      if (!profileId || !family?.id) return;

      setState((prev) => ({
        ...prev,
        phase: 'loading',
        difficulty,
      }));
      setError(null);

      try {
        const result = await generateQuiz({
          profileId: profileId as Id<'profiles'>,
          familyId: family.id as Id<'families'>,
          questionCount: 5,
          difficulty,
          gameSlug,
        });

        if (result.error) {
          setError(result.error);
          setState((prev) => ({ ...prev, phase: 'intro' }));
          return;
        }

        setState((prev) => ({
          ...prev,
          phase: 'playing',
          quiz: result,
          currentQuestionIndex: 0,
          selectedAnswerIndex: null,
          isCorrect: null,
          score: 0,
          xpEarned: 0,
          answers: [],
          timeRemaining: QUESTION_TIME,
        }));
      } catch (err) {
        console.error('Failed to generate quiz:', err);
        setError('Failed to generate quiz. Please try again!');
        setState((prev) => ({ ...prev, phase: 'intro' }));
      }
    },
    [profileId, family?.id, generateQuiz, gameSlug]
  );

  const handleAnswer = useCallback(
    (index: number) => {
      if (!state.quiz || state.phase !== 'playing') return;

      const question = state.quiz.questions[state.currentQuestionIndex];
      const isCorrect = index === question.correctAnswerIndex;
      const xpEarned = isCorrect ? question.xpReward : 0;

      const answer: AnswerRecord = {
        questionId: question.id,
        selectedAnswerIndex: index,
        correct: isCorrect,
        xpEarned,
      };

      setState((prev) => ({
        ...prev,
        phase: 'feedback',
        selectedAnswerIndex: index,
        isCorrect,
        score: prev.score + (isCorrect ? 100 : 0),
        xpEarned: prev.xpEarned + xpEarned,
        answers: [...prev.answers, answer],
      }));
    },
    [state.quiz, state.phase, state.currentQuestionIndex]
  );

  const handleContinue = useCallback(async () => {
    if (!state.quiz) return;

    const totalQuestions = state.quiz.questions.length;

    if (state.currentQuestionIndex >= totalQuestions - 1) {
      // Quiz complete - submit results
      if (profileId) {
        try {
          await submitResults({
            profileId: profileId as Id<'profiles'>,
            quizId: state.quiz.quizId,
            answers: state.answers,
          });
        } catch (err) {
          console.error('Failed to submit results:', err);
        }
      }

      setState((prev) => ({
        ...prev,
        phase: 'results',
      }));
    } else {
      // Next question
      setState((prev) => ({
        ...prev,
        phase: 'playing',
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswerIndex: null,
        isCorrect: null,
        timeRemaining: QUESTION_TIME,
      }));
    }
  }, [state.quiz, state.currentQuestionIndex, state.answers, profileId, submitResults]);

  const handlePlayAgain = useCallback(() => {
    setState({
      phase: 'intro',
      quiz: null,
      currentQuestionIndex: 0,
      selectedAnswerIndex: null,
      isCorrect: null,
      score: 0,
      xpEarned: 0,
      answers: [],
      timeRemaining: QUESTION_TIME,
      difficulty: 'easy',
    });
    setError(null);

    // Refresh remaining quizzes
    if (profileId) {
      getRemaining({ profileId: profileId as Id<'profiles'> })
        .then((result) => setRemainingQuizzes(result.remaining))
        .catch(console.error);
    }
  }, [profileId, getRemaining]);

  const handleClose = useCallback(() => {
    // Clear timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Reset state
    setState({
      phase: 'intro',
      quiz: null,
      currentQuestionIndex: 0,
      selectedAnswerIndex: null,
      isCorrect: null,
      score: 0,
      xpEarned: 0,
      answers: [],
      timeRemaining: QUESTION_TIME,
      difficulty: 'easy',
    });
    setError(null);

    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close quiz"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {error && state.phase === 'intro' && <ErrorScreen error={error} onClose={() => setError(null)} />}
        {!error && state.phase === 'intro' && (
          <IntroScreen onStart={startQuiz} remainingQuizzes={remainingQuizzes} />
        )}
        {state.phase === 'loading' && <LoadingScreen />}
        {(state.phase === 'playing' || state.phase === 'feedback') && (
          <QuestionScreen state={state} onAnswer={handleAnswer} onContinue={handleContinue} />
        )}
        {state.phase === 'results' && (
          <ResultsScreen state={state} onPlayAgain={handlePlayAgain} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON TO OPEN QUIZ
// ============================================================================

interface AIQuizButtonProps {
  onClick: () => void;
  className?: string;
}

export function AIQuizButton({ onClick, className }: AIQuizButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        className
      )}
    >
      <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
      Play Quiz
    </button>
  );
}
