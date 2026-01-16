'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import { FireIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// Streak tier thresholds for visual styling
const STREAK_TIERS = [
  { min: 1, max: 2, color: 'from-orange-400 to-amber-500', glow: 'shadow-orange-400/50' },
  { min: 3, max: 6, color: 'from-orange-500 to-red-500', glow: 'shadow-red-400/50' },
  { min: 7, max: 13, color: 'from-red-500 to-pink-500', glow: 'shadow-pink-400/50' },
  { min: 14, max: 29, color: 'from-pink-500 to-purple-500', glow: 'shadow-purple-400/50' },
  { min: 30, max: Infinity, color: 'from-purple-500 to-indigo-500', glow: 'shadow-indigo-400/50' },
];

function getStreakTier(streak: number) {
  return STREAK_TIERS.find((tier) => streak >= tier.min && streak <= tier.max) || STREAK_TIERS[0];
}

// Skeleton for loading state
function StreakCounterSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
      <div className="h-4 w-4 rounded-full bg-gray-200" />
      <div className="h-4 w-8 rounded bg-gray-200" />
    </div>
  );
}

interface StreakCounterProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function StreakCounter({ variant = 'compact', className }: StreakCounterProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const streakProgress = useQuery(
    api.achievements.getStreakProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Loading state
  if (profileLoading || streakProgress === undefined) {
    return <StreakCounterSkeleton />;
  }

  const { currentStreak, isActiveToday, nextBadge } = streakProgress;

  // No streak to display
  if (currentStreak === 0 && !isActiveToday) {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 transition-all hover:bg-gray-200',
          className
        )}
        role="status"
        aria-label="No active streak. Add a card to start your streak!"
      >
        <FireIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span className="text-xs font-medium text-gray-500">Start streak</span>

        {/* Tooltip on hover */}
        <div className="pointer-events-none absolute -bottom-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Add a card today to start!
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
        </div>
      </div>
    );
  }

  const tier = getStreakTier(currentStreak);
  const isHotStreak = currentStreak >= 7;
  const isOnFire = currentStreak >= 14;

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r p-4 shadow-lg transition-transform hover:scale-[1.02]',
          tier.color,
          className
        )}
        role="status"
        aria-label={`${currentStreak} day streak${isActiveToday ? ', active today' : ''}`}
      >
        {/* Fire icon with glow */}
        <div
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20',
            isOnFire && 'animate-pulse'
          )}
        >
          <FireIcon className="h-7 w-7 text-white drop-shadow-lg" aria-hidden="true" />
          {isHotStreak && (
            <SparklesIcon
              className="animate-sparkle absolute -right-1 -top-1 h-4 w-4 text-yellow-300"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Streak info */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white drop-shadow">{currentStreak}</span>
          <span className="text-xs font-medium text-white/80">
            day streak{currentStreak !== 1 ? 's' : ''}!
          </span>
        </div>

        {/* Active today indicator */}
        {isActiveToday && (
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-400 shadow-lg">
            <BoltIcon className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </div>
        )}

        {/* Next badge progress */}
        {nextBadge && (
          <div className="ml-auto text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-white/60">
              Next badge
            </div>
            <div className="text-sm font-semibold text-white">{nextBadge.name}</div>
            <div className="text-xs text-white/80">
              {nextBadge.daysNeeded} day{nextBadge.daysNeeded !== 1 ? 's' : ''} to go
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact variant (for header)
  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all',
        'bg-gradient-to-r shadow-md hover:shadow-lg',
        tier.color,
        tier.glow,
        isOnFire && 'animate-streak-glow',
        className
      )}
      role="status"
      aria-label={`${currentStreak} day streak${isActiveToday ? ', active today' : ''}`}
    >
      {/* Fire icon */}
      <div className="relative">
        <FireIcon
          className={cn('h-4 w-4 text-white drop-shadow', isHotStreak && 'animate-streak-flame')}
          aria-hidden="true"
        />
        {isOnFire && (
          <SparklesIcon
            className="animate-sparkle absolute -right-1 -top-1 h-2.5 w-2.5 text-yellow-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Streak count */}
      <span className="text-sm font-bold text-white drop-shadow">{currentStreak}</span>

      {/* Active today dot */}
      {isActiveToday && (
        <div
          className="h-2 w-2 rounded-full bg-green-400 shadow-sm shadow-green-500/50"
          aria-label="Active today"
        />
      )}

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -bottom-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-center text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        <div className="font-semibold">
          {currentStreak} day streak{currentStreak !== 1 ? '!' : '!'}
        </div>
        {nextBadge && (
          <div className="mt-1 text-gray-300">
            {nextBadge.daysNeeded} more for {nextBadge.name}
          </div>
        )}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
      </div>
    </div>
  );
}
