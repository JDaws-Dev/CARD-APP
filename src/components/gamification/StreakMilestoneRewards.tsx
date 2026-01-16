'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  LockClosedIcon,
  CheckCircleIcon,
  GiftIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  STREAK_MILESTONES,
  TIER_CONFIG,
  getStreakMilestoneProgress,
  formatMilestoneDays,
  getMilestoneEncouragement,
  type StreakMilestone,
} from '@/lib/streakMilestones';
import { getItemById } from '@/lib/avatarItems';

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function StreakMilestoneRewardsSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Progress bar */}
      <Skeleton className="mb-6 h-3 w-full rounded-full" />

      {/* Milestone cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border-2 border-gray-100 p-3 sm:p-4">
            <Skeleton className="mx-auto mb-2 h-10 w-10 rounded-full sm:h-12 sm:w-12" />
            <Skeleton className="mx-auto mb-1 h-4 w-12" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MILESTONE CARD COMPONENT
// ============================================================================

interface MilestoneCardProps {
  milestone: StreakMilestone;
  isAchieved: boolean;
  currentStreak: number;
}

function MilestoneCard({ milestone, isAchieved, currentStreak }: MilestoneCardProps) {
  const Icon = milestone.icon;
  const tierConfig = TIER_CONFIG[milestone.tier];
  const progress = isAchieved ? 100 : Math.min(100, (currentStreak / milestone.days) * 100);

  // Get unlocked item names for tooltip
  const unlockedItems = milestone.unlockedItemIds
    .map((id) => getItemById(id))
    .filter(Boolean)
    .map((item) => item!.name);

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center rounded-xl border-2 p-3 transition-all sm:p-4',
        isAchieved
          ? `border-transparent bg-gradient-to-br ${milestone.gradient} text-white shadow-lg`
          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
      )}
      role="listitem"
      aria-label={`${milestone.name}: ${isAchieved ? 'Achieved' : `${Math.round(progress)}% progress`}`}
    >
      {/* Icon container */}
      <div
        className={cn(
          'mb-2 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12',
          isAchieved ? 'bg-white/20' : 'bg-white shadow-sm'
        )}
      >
        {isAchieved ? (
          <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden="true" />
        ) : (
          <LockClosedIcon className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" aria-hidden="true" />
        )}
      </div>

      {/* Days label */}
      <div
        className={cn(
          'text-sm font-bold sm:text-base',
          isAchieved ? 'text-white' : 'text-gray-600'
        )}
      >
        {formatMilestoneDays(milestone.days)}
      </div>

      {/* Milestone name */}
      <div
        className={cn(
          'mt-0.5 text-center text-[10px] font-medium sm:text-xs',
          isAchieved ? 'text-white/80' : 'text-gray-500'
        )}
      >
        {milestone.name}
      </div>

      {/* Tier badge */}
      <div
        className={cn(
          'mt-2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:text-[10px]',
          isAchieved ? 'bg-white/20 text-white' : tierConfig.bgColor,
          isAchieved ? '' : tierConfig.textColor
        )}
      >
        {tierConfig.label}
      </div>

      {/* Progress indicator for non-achieved */}
      {!isAchieved && progress > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r', milestone.gradient)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Achievement checkmark */}
      {isAchieved && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow sm:h-6 sm:w-6">
          <CheckCircleIcon className="h-3 w-3 text-white sm:h-4 sm:w-4" aria-hidden="true" />
        </div>
      )}

      {/* Hover tooltip showing rewards */}
      <div className="pointer-events-none absolute -bottom-20 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        <div className="mb-1 font-semibold">{milestone.title}</div>
        {unlockedItems.length > 0 && (
          <div className="flex items-center gap-1 text-gray-300">
            <GiftIcon className="h-3 w-3" />
            {unlockedItems.slice(0, 2).join(', ')}
            {unlockedItems.length > 2 && ` +${unlockedItems.length - 2} more`}
          </div>
        )}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
      </div>
    </div>
  );
}

// ============================================================================
// REWARDS PREVIEW COMPONENT
// ============================================================================

interface RewardsPreviewProps {
  milestone: StreakMilestone | null;
}

function RewardsPreview({ milestone }: RewardsPreviewProps) {
  if (!milestone) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-emerald-600">
          <TrophyIcon className="h-5 w-5" />
          <span className="font-semibold">All Milestones Achieved!</span>
        </div>
        <p className="text-sm text-gray-600">
          You have unlocked all streak milestone rewards. Legendary!
        </p>
      </div>
    );
  }

  const unlockedItems = milestone.unlockedItemIds.map((id) => getItemById(id)).filter(Boolean);

  return (
    <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-orange-600">
        <GiftIcon className="h-5 w-5" />
        <span className="font-semibold">Next Rewards: {milestone.name}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {unlockedItems.map((item) => {
          if (!item) return null;
          const ItemIcon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
            >
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br',
                  item.gradient
                )}
              >
                <ItemIcon className="h-3 w-3 text-white" />
              </div>
              {item.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface StreakMilestoneRewardsProps {
  showRewardsPreview?: boolean;
  className?: string;
}

export function StreakMilestoneRewards({
  showRewardsPreview = true,
  className,
}: StreakMilestoneRewardsProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const streakProgress = useQuery(
    api.achievements.getStreakProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Calculate milestone progress
  const milestoneProgress = useMemo(() => {
    if (!streakProgress) return null;
    return getStreakMilestoneProgress(streakProgress.currentStreak);
  }, [streakProgress]);

  // Loading state
  if (profileLoading || streakProgress === undefined || !milestoneProgress) {
    return <StreakMilestoneRewardsSkeleton />;
  }

  const { currentStreak, achievedMilestones, nextMilestone, progressPercentage } =
    milestoneProgress;

  const achievedSet = new Set(achievedMilestones.map((m) => m.days));
  const encouragement = getMilestoneEncouragement(currentStreak);

  // Calculate overall progress across all milestones
  const maxMilestone = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const overallProgress = Math.min(100, (currentStreak / maxMilestone.days) * 100);

  return (
    <div
      className={cn('rounded-2xl bg-white p-4 shadow-sm sm:p-6', className)}
      role="region"
      aria-label="Streak milestone rewards"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-500">
            <StarIcon className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 sm:text-lg">
              Streak Milestone Rewards
            </h3>
            <p className="text-xs text-gray-500">
              {achievedMilestones.length} of {STREAK_MILESTONES.length} milestones unlocked
            </p>
          </div>
        </div>

        {/* Current streak display */}
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-3 py-1.5 text-sm font-bold text-white shadow">
          <FireIcon className="h-4 w-4" aria-hidden="true" />
          {currentStreak} day{currentStreak !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Encouragement message */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2">
        <SparklesIcon className="h-4 w-4 text-orange-500" aria-hidden="true" />
        <span className="text-sm font-medium text-gray-700">{encouragement}</span>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Progress to all milestones</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(overallProgress)}% progress to all milestones`}
          />
        </div>

        {/* Milestone markers on progress bar */}
        <div className="relative mt-1 h-2">
          {STREAK_MILESTONES.map((milestone) => {
            const position = (milestone.days / maxMilestone.days) * 100;
            const isAchieved = achievedSet.has(milestone.days);
            return (
              <div
                key={milestone.days}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isAchieved ? `bg-gradient-to-br ${milestone.gradient}` : 'bg-gray-300'
                  )}
                  title={`${milestone.days} days - ${milestone.name}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone cards grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4"
        role="list"
        aria-label="Streak milestones"
      >
        {STREAK_MILESTONES.map((milestone) => (
          <MilestoneCard
            key={milestone.days}
            milestone={milestone}
            isAchieved={achievedSet.has(milestone.days)}
            currentStreak={currentStreak}
          />
        ))}
      </div>

      {/* Rewards preview */}
      {showRewardsPreview && (
        <div className="mt-6">
          <RewardsPreview milestone={nextMilestone} />
        </div>
      )}
    </div>
  );
}
