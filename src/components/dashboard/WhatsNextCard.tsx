'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RocketLaunchIcon,
  Square3Stack3DIcon,
  BookOpenIcon,
  XMarkIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface WhatsNextCardProps {
  /** Number of total cards in collection */
  totalCards: number;
  /** Number of sets started */
  setsStarted: number;
  /** Optional className for styling */
  className?: string;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Square3Stack3DIcon;
  gradient: string;
  iconGradient: string;
  /** Function to determine if step is completed */
  isComplete: (props: { totalCards: number; setsStarted: number }) => boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'carddex-whats-next-dismissed';

const NEXT_STEPS: NextStep[] = [
  {
    id: 'browse-sets',
    title: 'Browse Sets',
    description: 'Find cards from your favorite sets and add them to your collection',
    href: '/sets',
    icon: Square3Stack3DIcon,
    gradient: 'from-emerald-50 to-teal-50',
    iconGradient: 'from-emerald-400 to-teal-500',
    isComplete: ({ setsStarted }) => setsStarted >= 1,
  },
  {
    id: 'learn-collecting',
    title: 'Learn to Collect',
    description: 'Tips on card care, understanding rarities, and more',
    href: '/learn',
    icon: BookOpenIcon,
    gradient: 'from-cyan-50 to-sky-50',
    iconGradient: 'from-cyan-400 to-sky-500',
    // This step is never "complete" - learning is always available
    isComplete: () => false,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    return dismissed === 'true';
  } catch {
    return false;
  }
}

function setDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // localStorage might not be available
  }
}

// ============================================================================
// NEXT STEP ITEM COMPONENT
// ============================================================================

interface NextStepItemProps {
  step: NextStep;
  isStepComplete: boolean;
}

function NextStepItem({ step, isStepComplete }: NextStepItemProps) {
  const Icon = step.icon;

  return (
    <Link
      href={step.href}
      className={cn(
        'group relative flex items-center gap-4 rounded-xl p-3 transition-all hover:scale-[1.02]',
        isStepComplete
          ? 'bg-gradient-to-r from-gray-50 to-slate-50 opacity-75'
          : `bg-gradient-to-r ${step.gradient}`
      )}
      aria-label={`${step.title}${isStepComplete ? ' (completed)' : ''}`}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg shadow-sm',
          isStepComplete ? 'bg-gray-200' : `bg-gradient-to-br ${step.iconGradient}`
        )}
        aria-hidden="true"
      >
        {isStepComplete ? (
          <CheckCircleIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <Icon className="h-5 w-5 text-white" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4
          className={cn(
            'text-sm font-semibold',
            isStepComplete ? 'text-gray-500' : 'text-gray-800 group-hover:text-gray-900'
          )}
        >
          {step.title}
          {isStepComplete && <span className="ml-2 text-xs font-normal text-gray-400">(Done)</span>}
        </h4>
        <p className={cn('text-xs', isStepComplete ? 'text-gray-400' : 'text-gray-500')}>
          {step.description}
        </p>
      </div>
      <ArrowRightIcon
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1',
          isStepComplete ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
        )}
        aria-hidden="true"
      />
    </Link>
  );
}

// ============================================================================
// WHATS NEXT CARD SKELETON
// ============================================================================

export function WhatsNextCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl bg-gray-50 p-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
            <div className="flex-1">
              <div className="mb-1 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * WhatsNextCard - Guides new users to their next steps after onboarding
 *
 * Shows suggested actions for users who are just getting started:
 * - Browse Sets to find and add cards
 * - Learn to Collect for tips and guides
 *
 * Can be dismissed and the preference is saved to localStorage.
 * Only shows when user has fewer than 10 cards.
 */
export function WhatsNextCard({ totalCards, setsStarted, className }: WhatsNextCardProps) {
  const [dismissed, setDismissedState] = useState(true); // Start as dismissed to prevent flash
  const [isHydrated, setIsHydrated] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setIsHydrated(true);
    setDismissedState(isDismissed());
  }, []);

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed();
    setDismissedState(true);
  };

  // Don't show if dismissed or if user has enough cards (threshold: 10 cards)
  if (!isHydrated || dismissed || totalCards >= 10) {
    return null;
  }

  // Calculate completion status for each step
  const stepsWithStatus = NEXT_STEPS.map((step) => ({
    step,
    isComplete: step.isComplete({ totalCards, setsStarted }),
  }));

  const completedCount = stepsWithStatus.filter((s) => s.isComplete).length;
  const allComplete = completedCount === NEXT_STEPS.length;

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm', className)}
      role="region"
      aria-label="Getting started guide"
    >
      {/* Background decoration */}
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-50"
        aria-hidden="true"
      />
      <SparklesIcon className="absolute right-2 top-2 h-8 w-8 text-indigo-200" aria-hidden="true" />

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RocketLaunchIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-800">What&apos;s Next?</h3>
          {completedCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {completedCount}/{NEXT_STEPS.length}
            </span>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          aria-label="Dismiss getting started guide"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Subtitle */}
      <p className="relative mb-4 text-sm text-gray-500">
        {allComplete
          ? "You're off to a great start! Keep exploring:"
          : "Here's how to get started with your collection:"}
      </p>

      {/* Steps */}
      <div className="relative space-y-2">
        {stepsWithStatus.map(({ step, isComplete }) => (
          <NextStepItem key={step.id} step={step} isStepComplete={isComplete} />
        ))}
      </div>

      {/* Encouragement for new collectors */}
      {totalCards === 0 && (
        <div className="relative mt-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-3">
          <p className="text-center text-xs text-amber-700">
            Add your first card to start earning badges and tracking your progress!
          </p>
        </div>
      )}
    </div>
  );
}
