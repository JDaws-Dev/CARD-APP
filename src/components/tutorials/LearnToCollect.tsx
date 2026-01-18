'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  getAllTutorialCategories,
  getAllTutorialGuides,
  getTutorialGuide,
  getDifficultyInfo,
  type TutorialGuide,
  type TutorialCategory,
} from '@/lib/tutorialContent';
import { getStepExamples, guideHasExamples } from '@/lib/tutorialExamples';
import { TutorialExampleCards } from './TutorialExampleCards';
import { AIQuiz } from '../ai/AIQuiz';
import {
  BookOpenIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  RectangleStackIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  CheckIcon,
  ArrowLeftIcon,
  PhotoIcon,
} from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

// ============================================================================
// ICON MAPPING
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RocketLaunchIcon,
  RectangleStackIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
};

function getCategoryIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return CATEGORY_ICONS[iconName] || BookOpenIcon;
}

// ============================================================================
// PROGRESS STORAGE (localStorage)
// ============================================================================

const STORAGE_KEY = 'carddex-tutorial-progress';

interface TutorialProgress {
  completedGuides: string[];
  currentGuide: string | null;
  currentStep: number;
}

function loadProgress(): TutorialProgress {
  if (typeof window === 'undefined') {
    return { completedGuides: [], currentGuide: null, currentStep: 0 };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { completedGuides: [], currentGuide: null, currentStep: 0 };
}

function saveProgress(progress: TutorialProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

export function LearnToCollectSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-200" />
        <div className="mx-auto h-8 w-64 rounded bg-gray-200" />
        <div className="mx-auto h-4 w-96 rounded bg-gray-200" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-4 w-full rounded-full bg-gray-200" />

      {/* Category cards skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// GUIDE CARD COMPONENT
// ============================================================================

interface GuideCardProps {
  guide: TutorialGuide;
  isCompleted: boolean;
  onSelect: (guideId: string) => void;
}

function GuideCard({ guide, isCompleted, onSelect }: GuideCardProps) {
  const difficultyInfo = getDifficultyInfo(guide.difficulty);
  const hasExamples = guideHasExamples(guide.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(guide.id)}
      className={cn(
        'group relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        isCompleted
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
      aria-label={`${guide.title}${isCompleted ? ' - Completed' : ''}${hasExamples ? ' - Includes card examples' : ''}`}
    >
      {/* Completed badge */}
      {isCompleted && (
        <div className="absolute -right-2 -top-2 rounded-full bg-emerald-500 p-1.5 shadow-md">
          <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
      )}

      {/* Gradient header accent */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r',
          guide.gradientFrom,
          guide.gradientTo
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-kid-primary">
          {guide.title}
        </h3>
        <p className="line-clamp-2 text-sm text-gray-600">{guide.shortDescription}</p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
              difficultyInfo.bgClass,
              difficultyInfo.colorClass
            )}
          >
            <StarIcon className="h-3 w-3" aria-hidden="true" />
            {difficultyInfo.label}
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500">
            <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {guide.estimatedTime}
          </span>
          {hasExamples && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-600">
              <PhotoIcon className="h-3 w-3" aria-hidden="true" />
              Cards
            </span>
          )}
        </div>

        {/* Steps count */}
        <p className="text-xs text-gray-400">
          {guide.steps.length} step{guide.steps.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Arrow indicator */}
      <ArrowRightIcon
        className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-kid-primary"
        aria-hidden="true"
      />
    </button>
  );
}

// ============================================================================
// CATEGORY SECTION COMPONENT
// ============================================================================

interface CategorySectionProps {
  category: TutorialCategory;
  guides: TutorialGuide[];
  completedGuides: string[];
  onSelectGuide: (guideId: string) => void;
}

function CategorySection({
  category,
  guides,
  completedGuides,
  onSelectGuide,
}: CategorySectionProps) {
  const CategoryIcon = getCategoryIcon(category.iconName);
  const completedCount = guides.filter((g) => completedGuides.includes(g.id)).length;

  return (
    <section className="space-y-4">
      {/* Category header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-kid-secondary">
          <CategoryIcon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
          <p className="text-sm text-gray-500">
            {category.description} ({completedCount}/{guides.length} completed)
          </p>
        </div>
      </div>

      {/* Guides grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            isCompleted={completedGuides.includes(guide.id)}
            onSelect={onSelectGuide}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// GUIDE VIEWER COMPONENT (Interactive step-by-step)
// ============================================================================

interface GuideViewerProps {
  guide: TutorialGuide;
  initialStep?: number;
  onComplete: () => void;
  onBack: () => void;
}

function GuideViewer({ guide, initialStep = 0, onComplete, onBack }: GuideViewerProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const totalSteps = guide.steps.length;
  const step = guide.steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(step.id));

    if (isLastStep) {
      // Show celebration, then complete
      setShowCelebration(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [step.id, isLastStep, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, onBack]);

  // Celebration overlay
  if (showCelebration) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-kid-primary/90 to-kid-secondary/90 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial completed celebration"
      >
        <div className="animate-in fade-in zoom-in space-y-6 text-center duration-500">
          {/* Celebration icon */}
          <div className="relative mx-auto">
            <div className="h-24 w-24 animate-pulse rounded-full bg-white/20 p-4">
              <SparklesIcon className="h-full w-full text-white" />
            </div>
            {/* Decorative stars */}
            <StarIcon
              className="absolute -left-4 -top-2 h-6 w-6 animate-bounce text-yellow-300"
              style={{ animationDelay: '0ms' }}
            />
            <StarIcon
              className="absolute -right-3 top-1 h-5 w-5 animate-bounce text-yellow-200"
              style={{ animationDelay: '150ms' }}
            />
            <StarIcon
              className="absolute -bottom-1 -left-2 h-4 w-4 animate-bounce text-yellow-400"
              style={{ animationDelay: '300ms' }}
            />
          </div>

          <h2 className="text-3xl font-bold text-white">Guide Complete!</h2>
          <p className="text-lg text-white/90">You finished &quot;{guide.title}&quot;</p>
          <p className="text-white/70">Great job, collector!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          aria-label="Back to tutorial list"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to Tutorials
        </button>
        <span className="text-sm text-gray-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Guide title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{guide.title}</h1>
        <p className="mt-2 text-gray-600">{guide.fullDescription}</p>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div
          className="h-2 w-full rounded-full bg-gray-200"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="absolute -top-1 left-0 right-0 flex justify-between">
          {guide.steps.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(index)}
              className={cn(
                'h-4 w-4 rounded-full border-2 transition-all',
                index <= currentStep
                  ? 'border-kid-primary bg-kid-primary'
                  : 'border-gray-300 bg-white',
                completedSteps.has(s.id) && 'border-emerald-500 bg-emerald-500',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
              )}
              aria-label={`Go to step ${index + 1}: ${s.title}`}
              aria-current={index === currentStep ? 'step' : undefined}
            />
          ))}
        </div>
      </div>

      {/* Current step content */}
      <div
        className={cn(
          'rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all',
          'animate-in fade-in slide-in-from-right-4 duration-300'
        )}
        key={step.id}
      >
        {/* Step number and title */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white',
              guide.gradientFrom,
              guide.gradientTo
            )}
          >
            {currentStep + 1}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
        </div>

        {/* Description */}
        <p className="mb-6 leading-relaxed text-gray-700">{step.description}</p>

        {/* Step-specific example cards */}
        {(() => {
          const stepExamples = getStepExamples(guide.id, step.id);
          if (stepExamples) {
            return (
              <div className="mb-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-4">
                <TutorialExampleCards
                  exampleSet={stepExamples}
                  variant="carousel"
                  showNote={true}
                />
              </div>
            );
          }
          return null;
        })()}

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

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            currentStep === 0
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
          aria-label="Previous step"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            'hover:-translate-y-0.5 hover:shadow-lg',
            isLastStep
              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
              : 'bg-gradient-to-r from-kid-primary to-kid-secondary'
          )}
          aria-label={isLastStep ? 'Complete guide' : 'Next step'}
        >
          {isLastStep ? (
            <>
              Complete
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            </>
          ) : (
            <>
              Next
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <p className="text-center text-xs text-gray-400">
        Use arrow keys to navigate, Enter to continue, Escape to go back
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearnToCollect() {
  const [progress, setProgress] = useState<TutorialProgress>(loadProgress);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const categories = getAllTutorialCategories();
  const allGuides = getAllTutorialGuides();

  // Calculate overall progress
  const totalGuides = allGuides.length;
  const completedCount = progress.completedGuides.length;
  const overallProgress = totalGuides > 0 ? (completedCount / totalGuides) * 100 : 0;

  // Handle guide selection
  const handleSelectGuide = useCallback((guideId: string) => {
    setActiveGuide(guideId);
  }, []);

  // Handle guide completion
  const handleCompleteGuide = useCallback(() => {
    if (!activeGuide) return;

    setProgress((prev) => {
      const newProgress = {
        ...prev,
        completedGuides: prev.completedGuides.includes(activeGuide)
          ? prev.completedGuides
          : [...prev.completedGuides, activeGuide],
        currentGuide: null,
        currentStep: 0,
      };
      saveProgress(newProgress);
      return newProgress;
    });

    setActiveGuide(null);
  }, [activeGuide]);

  // Handle going back to list
  const handleBackToList = useCallback(() => {
    setActiveGuide(null);
  }, []);

  // If viewing a guide, show the guide viewer
  if (activeGuide) {
    const guide = getTutorialGuide(activeGuide);
    if (guide) {
      return (
        <GuideViewer guide={guide} onComplete={handleCompleteGuide} onBack={handleBackToList} />
      );
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-kid-secondary">
          <BookOpenIcon className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Learn to Collect</h1>
        <p className="mx-auto max-w-2xl text-gray-600">
          Interactive guides to help you become a card collecting pro! Learn organization, binder
          setup, and card care tips.
        </p>
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
            <span className="font-semibold text-gray-900">Your Progress</span>
          </div>
          <span className="text-sm font-medium text-indigo-600">
            {completedCount} of {totalGuides} guides completed
          </span>
        </div>
        <div
          className="h-3 w-full rounded-full bg-gray-200"
          role="progressbar"
          aria-valuenow={overallProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall tutorial progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {completedCount === totalGuides && totalGuides > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
            Amazing! You&apos;ve completed all tutorials!
          </p>
        )}
      </div>

      {/* AI Quiz Section */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
              <SparklesIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Test Your Knowledge</h2>
              <p className="text-sm text-gray-600">
                AI-powered quiz about your card collection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsQuizOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <SparklesIcon className="h-5 w-5" aria-hidden="true" />
            Quiz Me!
          </button>
        </div>
      </div>

      {/* Category sections */}
      {categories.map((category) => {
        const categoryGuides = category.guides
          .map((id) => getTutorialGuide(id))
          .filter((g): g is TutorialGuide => g !== null);

        if (categoryGuides.length === 0) return null;

        return (
          <CategorySection
            key={category.id}
            category={category}
            guides={categoryGuides}
            completedGuides={progress.completedGuides}
            onSelectGuide={handleSelectGuide}
          />
        );
      })}

      {/* Fun facts section */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h2 className="font-bold text-gray-900">Did You Know?</h2>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <StarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden="true" />
            Trading cards have been collected for over 100 years!
          </li>
          <li className="flex items-start gap-2">
            <StarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden="true" />
            Card condition matters - mint cards are worth more than played ones.
          </li>
          <li className="flex items-start gap-2">
            <StarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden="true" />
            Rare chase cards can be worth hundreds or even thousands of dollars!
          </li>
        </ul>
      </div>

      {/* AI Quiz Modal */}
      <AIQuiz isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </div>
  );
}
