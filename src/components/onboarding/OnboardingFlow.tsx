'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  type OnboardingStepId,
  type OnboardingProgress,
  ONBOARDING_STEPS,
  TOTAL_STEPS,
  createInitialProgress,
  completeStep,
  goToStep,
  getProgressPercentage,
  isFirstStep,
  isLastContentStep,
  isCompletionStep,
  getStepById,
  saveOnboardingProgress,
  loadOnboardingProgress,
  markOnboardingComplete,
  setProfileName,
  setProfileType,
  getWelcomeMessage,
  getFirstCardsStats,
} from '@/lib/onboardingFlow';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { GameSelectorOnboarding } from './GameSelectorOnboarding';
import type { SelectedGames } from '@/lib/gameSelector';
import {
  RocketLaunchIcon,
  Square3Stack3DIcon,
  UserCircleIcon,
  SparklesIcon,
  TrophyIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  CheckCircleIcon,
  LightBulbIcon,
  StarIcon,
  HeartIcon,
  FireIcon,
  GiftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// ICON MAPPING
// ============================================================================

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RocketLaunchIcon,
  Square3Stack3DIcon,
  UserCircleIcon,
  SparklesIcon,
  TrophyIcon,
};

function getStepIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return STEP_ICONS[iconName] ?? SparklesIcon;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function OnboardingFlowSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Progress bar skeleton */}
        <div className="mb-8 space-y-3">
          <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-2 w-full animate-pulse rounded-full bg-gray-200" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-6 rounded-3xl bg-white p-8 shadow-lg">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-gray-200" />
            <div className="mx-auto h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto h-4 w-80 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4 pt-6">
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
          </div>
          <div className="flex justify-center pt-4">
            <div className="h-14 w-48 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS DOTS COMPONENT
// ============================================================================

interface ProgressDotsProps {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  onStepClick?: (stepId: OnboardingStepId) => void;
}

function ProgressDots({ currentStep, completedSteps, onStepClick }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="navigation"
      aria-label="Onboarding progress"
    >
      {ONBOARDING_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.includes(step.id);
        const canNavigate = isCompleted && onStepClick;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => canNavigate && onStepClick(step.id)}
            disabled={!canNavigate}
            className={cn(
              'relative flex h-3 w-3 items-center justify-center rounded-full transition-all',
              isActive && 'ring-2 ring-offset-2',
              isActive && step.gradientFrom.replace('from-', 'ring-'),
              isCompleted
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-500'
                : isActive
                  ? cn('bg-gradient-to-br', step.gradientFrom, step.gradientTo)
                  : 'bg-gray-300',
              canNavigate && 'cursor-pointer hover:scale-125',
              !canNavigate && 'cursor-default'
            )}
            aria-label={`Step ${index + 1}: ${step.title}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            {isCompleted && <CheckIcon className="h-2 w-2 text-white" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// WELCOME STEP COMPONENT
// ============================================================================

interface WelcomeStepProps {
  onContinue: () => void;
}

function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="space-y-8 text-center">
      {/* Icon */}
      <div className="relative mx-auto">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
          <RocketLaunchIcon className="h-12 w-12 text-white" aria-hidden="true" />
        </div>
        {/* Decorative elements */}
        <SparklesIcon
          className="absolute -right-2 -top-1 h-6 w-6 animate-bounce text-yellow-400"
          style={{ animationDelay: '0ms' }}
          aria-hidden="true"
        />
        <StarIcon
          className="absolute -left-1 top-2 h-5 w-5 animate-bounce text-amber-400"
          style={{ animationDelay: '150ms' }}
          aria-hidden="true"
        />
        <HeartIcon
          className="absolute -bottom-1 right-0 h-4 w-4 animate-bounce text-pink-400"
          style={{ animationDelay: '300ms' }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Welcome to CardDex!</h1>
        <p className="text-lg text-gray-600">The fun way to track your trading card collection</p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <TrophyIcon className="mx-auto mb-2 h-8 w-8 text-amber-500" aria-hidden="true" />
          <p className="text-sm font-medium text-amber-800">Earn Badges</p>
          <p className="text-xs text-amber-600">Collect achievements</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-4">
          <HeartIcon className="mx-auto mb-2 h-8 w-8 text-rose-500" aria-hidden="true" />
          <p className="text-sm font-medium text-rose-800">Wishlists</p>
          <p className="text-xs text-rose-600">Track cards you want</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
          <GiftIcon className="mx-auto mb-2 h-8 w-8 text-emerald-500" aria-hidden="true" />
          <p className="text-sm font-medium text-emerald-800">Share</p>
          <p className="text-xs text-emerald-600">With family & friends</p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all',
          'hover:-translate-y-0.5 hover:shadow-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
        )}
      >
        Let&apos;s Get Started
        <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <p className="text-xs text-gray-400">Takes less than a minute to set up</p>
    </div>
  );
}

// ============================================================================
// PROFILE STEP COMPONENT
// ============================================================================

interface ProfileStepProps {
  profileName: string;
  profileType: 'parent' | 'child';
  onNameChange: (name: string) => void;
  onTypeChange: (type: 'parent' | 'child') => void;
  onContinue: () => void;
  onBack: () => void;
}

function ProfileStep({
  profileName,
  profileType,
  onNameChange,
  onTypeChange,
  onContinue,
  onBack,
}: ProfileStepProps) {
  const isValid = profileName.trim().length >= 1 && profileName.trim().length <= 50;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
          <UserCircleIcon className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Create your profile</h2>
        <p className="text-gray-600">Tell us a bit about yourself</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name input */}
        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-gray-700">
            What should we call you?
          </label>
          <input
            id="profile-name"
            type="text"
            value={profileName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name or nickname"
            maxLength={50}
            className={cn(
              'w-full rounded-xl border-2 px-4 py-3 text-lg transition-colors',
              'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
              profileName.trim().length > 0 && !isValid
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white'
            )}
            aria-describedby="name-hint"
          />
          <p id="name-hint" className="mt-1 text-xs text-gray-500">
            1-50 characters
          </p>
        </div>

        {/* Profile type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Are you a parent or a collector?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onTypeChange('child')}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                profileType === 'child'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
              aria-pressed={profileType === 'child'}
            >
              <SparklesIcon
                className={cn(
                  'mb-2 h-6 w-6',
                  profileType === 'child' ? 'text-emerald-600' : 'text-gray-400'
                )}
                aria-hidden="true"
              />
              <p
                className={cn(
                  'font-semibold',
                  profileType === 'child' ? 'text-emerald-800' : 'text-gray-700'
                )}
              >
                Collector
              </p>
              <p className="text-xs text-gray-500">I&apos;m building my collection</p>
            </button>
            <button
              type="button"
              onClick={() => onTypeChange('parent')}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                profileType === 'parent'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
              aria-pressed={profileType === 'parent'}
            >
              <HeartIcon
                className={cn(
                  'mb-2 h-6 w-6',
                  profileType === 'parent' ? 'text-emerald-600' : 'text-gray-400'
                )}
                aria-hidden="true"
              />
              <p
                className={cn(
                  'font-semibold',
                  profileType === 'parent' ? 'text-emerald-800' : 'text-gray-700'
                )}
              >
                Parent
              </p>
              <p className="text-xs text-gray-500">Managing family collections</p>
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <LightBulbIcon
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p className="text-sm text-amber-700">{getWelcomeMessage(profileType)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600',
            'transition-colors hover:bg-gray-100 hover:text-gray-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
          )}
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            isValid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:-translate-y-0.5 hover:shadow-lg'
              : 'cursor-not-allowed bg-gray-300'
          )}
        >
          Continue
          <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FIRST CARDS STEP COMPONENT
// ============================================================================

interface FirstCardsStepProps {
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  primaryGameName?: string;
}

function FirstCardsStep({ onContinue, onSkip, onBack, primaryGameName }: FirstCardsStepProps) {
  const stats = getFirstCardsStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
          <SparklesIcon className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Add your first cards!</h2>
        <p className="text-gray-600">
          {primaryGameName
            ? `Browse ${primaryGameName} sets and tap cards to add them`
            : 'Browse sets and tap cards to add them to your collection'}
        </p>
      </div>

      {/* Stats preview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-700">{stats.sets}</p>
          <p className="text-xs font-medium text-indigo-600">Sets</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{stats.cards}</p>
          <p className="text-xs font-medium text-emerald-600">Cards</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.badges}</p>
          <p className="text-xs font-medium text-amber-600">Badges</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-800">How to add cards:</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
              1
            </span>
            <span>Find a set you own cards from</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
              2
            </span>
            <span>Tap any card to add it to your collection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
              3
            </span>
            <span>Watch your collection grow!</span>
          </li>
        </ol>
      </div>

      {/* Tip */}
      <div className="rounded-xl border border-pink-200 bg-pink-50 p-3">
        <div className="flex items-start gap-2">
          <LightBulbIcon
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-pink-500"
            aria-hidden="true"
          />
          <p className="text-sm text-pink-700">
            Use &quot;Just Pulled&quot; mode for quick adding when opening packs!
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600',
            'transition-colors hover:bg-gray-100 hover:text-gray-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500'
          )}
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-gray-500',
              'transition-colors hover:bg-gray-100 hover:text-gray-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500'
            )}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-semibold text-white shadow-md transition-all',
              'hover:-translate-y-0.5 hover:shadow-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2'
            )}
          >
            Browse Sets
            <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETION STEP COMPONENT
// ============================================================================

interface CompletionStepProps {
  profileName?: string;
  onGoToCollection: () => void;
  onGoToSets: () => void;
}

function CompletionStep({ profileName, onGoToCollection, onGoToSets }: CompletionStepProps) {
  return (
    <div className="space-y-8 text-center">
      {/* Celebration icon */}
      <div className="relative mx-auto">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
          <TrophyIcon className="h-12 w-12 text-white" aria-hidden="true" />
        </div>
        {/* Decorative sparkles */}
        <SparklesIcon
          className="absolute -right-3 -top-2 h-7 w-7 animate-bounce text-yellow-400"
          style={{ animationDelay: '0ms' }}
          aria-hidden="true"
        />
        <StarIcon
          className="absolute -left-2 top-0 h-6 w-6 animate-bounce text-amber-400"
          style={{ animationDelay: '100ms' }}
          aria-hidden="true"
        />
        <FireIcon
          className="absolute -bottom-1 -right-1 h-5 w-5 animate-bounce text-orange-400"
          style={{ animationDelay: '200ms' }}
          aria-hidden="true"
        />
        <CheckCircleIcon
          className="absolute -bottom-2 left-0 h-6 w-6 animate-bounce text-emerald-400"
          style={{ animationDelay: '150ms' }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">You&apos;re all set!</h2>
        <p className="text-lg text-gray-600">
          {profileName ? `Welcome to CardDex, ${profileName}!` : 'Welcome to CardDex!'}
        </p>
        <p className="text-gray-500">Your collection journey begins now</p>
      </div>

      {/* What's next */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 p-6">
        <h3 className="mb-4 font-semibold text-amber-800">What&apos;s next?</h3>
        <ul className="space-y-2 text-left text-sm text-amber-700">
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Browse sets and add your cards
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Complete sets to earn badges
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Build your wishlist for cards you want
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Track your daily streak for rewards
          </li>
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onGoToCollection}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all',
            'hover:-translate-y-0.5 hover:shadow-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
          )}
        >
          View My Collection
          <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onGoToSets}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-white px-6 py-3 font-semibold text-amber-700 transition-all',
            'hover:bg-amber-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
          )}
        >
          Browse Sets
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ONBOARDING FLOW COMPONENT
// ============================================================================

interface OnboardingFlowProps {
  /** Callback when onboarding is completed */
  onComplete?: () => void;
  /** Initial step to start from (for resuming) */
  initialStep?: OnboardingStepId;
}

export function OnboardingFlow({ onComplete, initialStep }: OnboardingFlowProps) {
  const router = useRouter();
  const {
    setSelectedGames,
    completeOnboarding: completeGameOnboarding,
    primaryGame,
  } = useGameSelector();

  // Load saved progress or create new
  const [progress, setProgress] = useState<OnboardingProgress>(() => {
    const saved = loadOnboardingProgress();
    if (saved && !saved.isComplete) {
      return saved;
    }
    const initial = createInitialProgress();
    if (initialStep) {
      return goToStep(initial, initialStep);
    }
    return initial;
  });

  const [profileName, setProfileNameState] = useState(progress.profileName ?? '');
  const [profileType, setProfileTypeState] = useState<'parent' | 'child'>(
    progress.profileType ?? 'child'
  );

  // Save progress on changes
  useEffect(() => {
    saveOnboardingProgress(progress);
  }, [progress]);

  // Handle step completion
  const handleCompleteStep = useCallback(
    (stepId: OnboardingStepId) => {
      setProgress((prev) => {
        let updated = prev;
        // Save profile info if on profile step
        if (stepId === 'profile') {
          updated = setProfileName(updated, profileName);
          updated = setProfileType(updated, profileType);
        }
        return completeStep(updated, stepId);
      });
    },
    [profileName, profileType]
  );

  // Handle back navigation
  const handleBack = useCallback((stepId: OnboardingStepId) => {
    const currentStep = getStepById(stepId);
    if (!currentStep || currentStep.number <= 1) return;
    setProgress((prev) => goToStep(prev, ONBOARDING_STEPS[currentStep.number - 2].id));
  }, []);

  // Handle game selection completion
  const handleGameSelectionComplete = useCallback(
    (games: SelectedGames) => {
      setSelectedGames(games);
      completeGameOnboarding();
      handleCompleteStep('games');
    },
    [setSelectedGames, completeGameOnboarding, handleCompleteStep]
  );

  // Handle final completion
  const handleFinalComplete = useCallback(() => {
    markOnboardingComplete();
    completeGameOnboarding();
    onComplete?.();
  }, [completeGameOnboarding, onComplete]);

  // Navigation callbacks
  const handleGoToCollection = useCallback(() => {
    handleFinalComplete();
    router.push('/collection');
  }, [handleFinalComplete, router]);

  const handleGoToSets = useCallback(() => {
    handleFinalComplete();
    router.push('/sets');
  }, [handleFinalComplete, router]);

  // Handle first cards step
  const handleFirstCardsComplete = useCallback(() => {
    handleCompleteStep('first-cards');
  }, [handleCompleteStep]);

  const handleFirstCardsSkip = useCallback(() => {
    handleCompleteStep('first-cards');
  }, [handleCompleteStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !isFirstStep(progress.currentStep) &&
        !isCompletionStep(progress.currentStep)
      ) {
        handleBack(progress.currentStep);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress.currentStep, handleBack]);

  // Get current step info
  const currentStep = getStepById(progress.currentStep);
  const progressPercent = getProgressPercentage(progress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Progress indicator (hidden on welcome and complete) */}
        {!isFirstStep(progress.currentStep) &&
          !isCompletionStep(progress.currentStep) &&
          currentStep && (
            <div className="mb-8 space-y-3">
              <div className="text-center">
                <span className="text-sm font-medium text-gray-500">
                  Step {currentStep.number} of {TOTAL_STEPS}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Onboarding progress"
                />
              </div>
              <ProgressDots
                currentStep={progress.currentStep}
                completedSteps={progress.completedSteps}
                onStepClick={(stepId) => setProgress((prev) => goToStep(prev, stepId))}
              />
            </div>
          )}

        {/* Main content card */}
        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          {/* Welcome Step */}
          {progress.currentStep === 'welcome' && (
            <WelcomeStep onContinue={() => handleCompleteStep('welcome')} />
          )}

          {/* Games Step */}
          {progress.currentStep === 'games' && (
            <GameSelectorOnboarding
              onComplete={handleGameSelectionComplete}
              onBack={() => handleBack('games')}
              showBackButton={true}
            />
          )}

          {/* Profile Step */}
          {progress.currentStep === 'profile' && (
            <ProfileStep
              profileName={profileName}
              profileType={profileType}
              onNameChange={setProfileNameState}
              onTypeChange={setProfileTypeState}
              onContinue={() => handleCompleteStep('profile')}
              onBack={() => handleBack('profile')}
            />
          )}

          {/* First Cards Step */}
          {progress.currentStep === 'first-cards' && (
            <FirstCardsStep
              onContinue={handleFirstCardsComplete}
              onSkip={handleFirstCardsSkip}
              onBack={() => handleBack('first-cards')}
              primaryGameName={primaryGame?.shortName}
            />
          )}

          {/* Completion Step */}
          {progress.currentStep === 'complete' && (
            <CompletionStep
              profileName={progress.profileName}
              onGoToCollection={handleGoToCollection}
              onGoToSets={handleGoToSets}
            />
          )}
        </div>

        {/* Keyboard hint (for non-terminal steps) */}
        {!isFirstStep(progress.currentStep) && !isCompletionStep(progress.currentStep) && (
          <p className="mt-4 text-center text-xs text-gray-400">Press Escape to go back</p>
        )}
      </div>
    </div>
  );
}
