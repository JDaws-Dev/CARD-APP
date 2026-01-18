'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  getSetStructureOnboarding,
  getAllSetTypes,
  getAllCollectionGoals,
  getDifficultyDisplayInfo,
  markSetIntroComplete,
  type SetStructureStep,
  type SetTypeInfo,
  type CollectionGoalInfo,
} from '@/lib/setStructureContent';
import {
  RectangleStackIcon,
  MagnifyingGlassIcon,
  HashtagIcon,
  Squares2X2Icon,
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  Square3Stack3DIcon,
  SparklesIcon,
  StarIcon,
  CheckCircleIcon,
  HeartIcon,
  FireIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  BookOpenIcon,
  LightBulbIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// ICON MAPPING
// ============================================================================

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RectangleStackIcon,
  MagnifyingGlassIcon,
  HashtagIcon,
  Squares2X2Icon,
  TrophyIcon,
  ChartBarIcon,
  CubeIcon,
  Square3Stack3DIcon,
  SparklesIcon,
  StarIcon,
  CheckCircleIcon,
  HeartIcon,
  FireIcon,
};

function getStepIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return STEP_ICONS[iconName] || RectangleStackIcon;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function SetStructureIntroSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-200" />
        <div className="mx-auto h-8 w-64 rounded bg-gray-200" />
        <div className="mx-auto h-4 w-96 rounded bg-gray-200" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-3 w-full rounded-full bg-gray-200" />

      {/* Content area skeleton */}
      <div className="h-64 rounded-2xl bg-gray-200" />

      {/* Navigation buttons skeleton */}
      <div className="flex justify-between">
        <div className="h-12 w-28 rounded-xl bg-gray-200" />
        <div className="h-12 w-28 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

// ============================================================================
// STEP CARD COMPONENT
// ============================================================================

interface StepCardProps {
  step: SetStructureStep;
  stepNumber: number;
  totalSteps: number;
  gradientFrom: string;
  gradientTo: string;
}

function StepCard({ step, stepNumber, totalSteps, gradientFrom, gradientTo }: StepCardProps) {
  const IconComponent = getStepIcon(step.iconName);

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm',
        'animate-in fade-in slide-in-from-right-4 duration-300'
      )}
    >
      {/* Step header */}
      <div className="mb-5 flex items-center gap-4">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
            gradientFrom,
            gradientTo
          )}
        >
          <IconComponent className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">
            Step {stepNumber} of {totalSteps}
          </p>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{step.title}</h2>
        </div>
      </div>

      {/* Description */}
      <p className="mb-6 leading-relaxed text-gray-700">{step.description}</p>

      {/* Summary badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
        <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
        {step.summary}
      </div>

      {/* Tip box */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <LightBulbIcon
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-amber-800">Pro Tip</p>
            <p className="text-sm text-amber-700">{step.tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SET TYPES SECTION COMPONENT
// ============================================================================

interface SetTypesSectionProps {
  setTypes: readonly SetTypeInfo[];
}

function SetTypesSection({ setTypes }: SetTypesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Types of Card Sets</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {setTypes.map((setType) => {
          const IconComponent = getStepIcon(setType.iconName);
          return (
            <div
              key={setType.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br',
                    setType.gradientFrom,
                    setType.gradientTo
                  )}
                >
                  <IconComponent className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h4 className="font-bold text-gray-900">{setType.name}</h4>
              </div>
              <p className="mb-3 text-sm text-gray-600">{setType.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                  {setType.cardCountRange}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                  {setType.releaseFrequency}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// COLLECTION GOALS SECTION COMPONENT
// ============================================================================

interface CollectionGoalsSectionProps {
  goals: readonly CollectionGoalInfo[];
}

function CollectionGoalsSection({ goals }: CollectionGoalsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Collection Goals to Try</h3>
      <div className="grid gap-3">
        {goals.map((goal) => {
          const IconComponent = getStepIcon(goal.iconName);
          const difficultyInfo = getDifficultyDisplayInfo(goal.difficulty);
          return (
            <div
              key={goal.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-kid-secondary">
                  <IconComponent className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{goal.name}</h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        difficultyInfo.bgClass,
                        difficultyInfo.colorClass
                      )}
                    >
                      {difficultyInfo.label}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">{goal.description}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Tip:</span> {goal.advice}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETION CELEBRATION COMPONENT
// ============================================================================

interface CompletionCelebrationProps {
  onClose: () => void;
}

function CompletionCelebration({ onClose }: CompletionCelebrationProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-500/90 to-purple-500/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Set structure intro completed"
    >
      <div className="mx-4 max-w-md space-y-6 text-center">
        {/* Celebration icon */}
        <div className="relative mx-auto">
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/20 p-4">
            <TrophyIcon className="h-full w-full text-white" />
          </div>
          {/* Decorative stars */}
          <StarIcon
            className="absolute -left-4 -top-2 h-6 w-6 animate-bounce text-yellow-300"
            style={{ animationDelay: '0ms' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -right-3 top-1 h-5 w-5 animate-bounce text-yellow-200"
            style={{ animationDelay: '150ms' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -bottom-1 -left-2 h-4 w-4 animate-bounce text-yellow-400"
            style={{ animationDelay: '300ms' }}
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -right-2 bottom-0 h-5 w-5 animate-bounce text-cyan-300"
            style={{ animationDelay: '200ms' }}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">You Did It!</h2>
          <p className="text-lg text-white/90">Now you know how card sets work!</p>
          <p className="text-white/70">Time to start building your collection!</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600 shadow-lg transition-all',
            'hover:-translate-y-0.5 hover:bg-white hover:shadow-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-500'
          )}
        >
          Start Collecting
          <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - MODAL VERSION
// ============================================================================

interface SetStructureIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function SetStructureIntroModal({
  isOpen,
  onClose,
  onComplete,
}: SetStructureIntroModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const onboarding = getSetStructureOnboarding();
  const setTypes = getAllSetTypes();
  const collectionGoals = getAllCollectionGoals();

  const totalSteps = onboarding.steps.length;
  const step = onboarding.steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setShowExtras(false);
      setShowCelebration(false);
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Show extras or celebration
      if (!showExtras) {
        setShowExtras(true);
      } else {
        markSetIntroComplete();
        setShowCelebration(true);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, showExtras]);

  const handlePrevious = useCallback(() => {
    if (showExtras) {
      setShowExtras(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, showExtras]);

  const handleComplete = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
    onClose();
  }, [onClose, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCelebration) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          handleComplete();
        }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCelebration, handleNext, handlePrevious, handleComplete, onClose]);

  if (!isOpen) return null;

  if (showCelebration) {
    return <CompletionCelebration onClose={handleComplete} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={onboarding.title}
    >
      <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gray-50 p-6 shadow-2xl sm:p-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary'
          )}
          aria-label="Close intro"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div
              className={cn(
                'mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br',
                onboarding.gradientFrom,
                onboarding.gradientTo
              )}
            >
              <BookOpenIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{onboarding.title}</h1>
            {!showExtras && <p className="text-gray-600">{onboarding.fullDescription}</p>}
          </div>

          {/* Progress bar - only show during steps */}
          {!showExtras && (
            <div className="relative">
              <div
                className="h-2 w-full rounded-full bg-gray-200"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
              >
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                    onboarding.gradientFrom,
                    onboarding.gradientTo
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Step dots */}
              <div className="absolute -top-0.5 left-0 right-0 flex justify-between">
                {onboarding.steps.map((s, index) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      'h-3 w-3 rounded-full border-2 transition-all',
                      index <= currentStep
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300 bg-white',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
                    )}
                    aria-label={`Go to step ${index + 1}: ${s.title}`}
                    aria-current={index === currentStep ? 'step' : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Content area */}
          {showExtras ? (
            <div className="space-y-6">
              <SetTypesSection setTypes={setTypes} />
              <CollectionGoalsSection goals={collectionGoals} />
            </div>
          ) : (
            <StepCard
              key={step.id}
              step={step}
              stepNumber={currentStep + 1}
              totalSteps={totalSteps}
              gradientFrom={onboarding.gradientFrom}
              gradientTo={onboarding.gradientTo}
            />
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0 && !showExtras}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                currentStep === 0 && !showExtras
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
              aria-label="Previous step"
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                'hover:-translate-y-0.5 hover:shadow-lg',
                showExtras
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                  : 'bg-gradient-to-r from-kid-primary to-kid-secondary'
              )}
              aria-label={
                showExtras ? 'Complete intro' : isLastStep ? 'See more info' : 'Next step'
              }
            >
              {showExtras ? (
                <>
                  Complete
                  <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                </>
              ) : isLastStep ? (
                <>
                  Learn More
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-gray-400">
            Use arrow keys to navigate, Enter to continue, Escape to close
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - INLINE VERSION
// ============================================================================

interface SetStructureIntroProps {
  onComplete?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function SetStructureIntro({
  onComplete,
  onBack,
  showBackButton = true,
}: SetStructureIntroProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const onboarding = getSetStructureOnboarding();
  const setTypes = getAllSetTypes();
  const collectionGoals = getAllCollectionGoals();

  const totalSteps = onboarding.steps.length;
  const step = onboarding.steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      if (!showExtras) {
        setShowExtras(true);
      } else {
        markSetIntroComplete();
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          onComplete?.();
        }, 2500);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, showExtras, onComplete]);

  const handlePrevious = useCallback(() => {
    if (showExtras) {
      setShowExtras(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, showExtras]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCelebration) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape' && onBack) {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCelebration, handleNext, handlePrevious, onBack]);

  if (showCelebration) {
    return (
      <div className="space-y-6 text-center">
        <div className="relative mx-auto">
          <div
            className={cn(
              'mx-auto h-20 w-20 animate-pulse rounded-full bg-gradient-to-br p-4',
              onboarding.gradientFrom,
              onboarding.gradientTo
            )}
          >
            <TrophyIcon className="h-full w-full text-white" />
          </div>
          <SparklesIcon
            className="absolute -right-2 -top-1 h-6 w-6 animate-bounce text-yellow-400"
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -left-1 top-2 h-5 w-5 animate-bounce text-amber-400"
            style={{ animationDelay: '100ms' }}
            aria-hidden="true"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You Did It!</h2>
        <p className="text-gray-600">Now you know how card sets work!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header with optional back button */}
      <div className="flex items-center justify-between">
        {showBackButton && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600',
              'transition-colors hover:bg-gray-100 hover:text-gray-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
            )}
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        ) : (
          <div />
        )}
        {!showExtras && (
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {totalSteps}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="space-y-3 text-center">
        <div
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br',
            onboarding.gradientFrom,
            onboarding.gradientTo
          )}
        >
          <BookOpenIcon className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{onboarding.title}</h1>
        {!showExtras && <p className="text-gray-600">{onboarding.fullDescription}</p>}
      </div>

      {/* Progress bar - only during steps */}
      {!showExtras && (
        <div className="relative">
          <div
            className="h-2 w-full rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
          >
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                onboarding.gradientFrom,
                onboarding.gradientTo
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="absolute -top-0.5 left-0 right-0 flex justify-between">
            {onboarding.steps.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'h-3 w-3 rounded-full border-2 transition-all',
                  index <= currentStep
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-300 bg-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
                )}
                aria-label={`Go to step ${index + 1}: ${s.title}`}
                aria-current={index === currentStep ? 'step' : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {showExtras ? (
        <div className="space-y-6">
          <SetTypesSection setTypes={setTypes} />
          <CollectionGoalsSection goals={collectionGoals} />
        </div>
      ) : (
        <StepCard
          key={step.id}
          step={step}
          stepNumber={currentStep + 1}
          totalSteps={totalSteps}
          gradientFrom={onboarding.gradientFrom}
          gradientTo={onboarding.gradientTo}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0 && !showExtras}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            currentStep === 0 && !showExtras
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
          aria-label="Previous"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            'hover:-translate-y-0.5 hover:shadow-lg',
            showExtras
              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
              : 'bg-gradient-to-r from-kid-primary to-kid-secondary'
          )}
          aria-label={showExtras ? 'Complete' : isLastStep ? 'See more' : 'Next'}
        >
          {showExtras ? (
            <>
              Complete
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            </>
          ) : isLastStep ? (
            <>
              Learn More
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </>
          ) : (
            <>
              Next
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-gray-400">
        Use arrow keys to navigate, Enter to continue
      </p>
    </div>
  );
}
