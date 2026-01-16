'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  GiftIcon,
  SparklesIcon,
  CheckCircleIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDailyStamps } from '@/components/providers/DailyStampProvider';
import {
  getToday,
  formatStampProgress,
  getEncouragementMessage,
  getStampColorClass,
  formatTotalStamps,
  formatTotalRewards,
  STAMPS_REQUIRED,
} from '@/lib/dailyStamps';

// ============================================================================
// SKELETON
// ============================================================================

export function DailyStampCollectionSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Stamp grid */}
      <div className="mb-4 grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Progress */}
      <Skeleton className="mb-2 h-2 w-full rounded-full" />
      <Skeleton className="mx-auto h-5 w-48" />
    </div>
  );
}

// ============================================================================
// STAMP CELL
// ============================================================================

interface StampCellProps {
  date: string;
  dayName: string;
  collected: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  onCollect?: () => void;
}

function StampCell({
  dayName,
  collected,
  isToday,
  isPast,
  isFuture,
  onCollect,
}: StampCellProps) {
  const canClick = isToday && !collected && onCollect;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {dayName}
      </span>
      <button
        type="button"
        onClick={canClick ? onCollect : undefined}
        disabled={!canClick}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl transition-all sm:h-12 sm:w-12',
          collected && [
            'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50',
            'dark:from-amber-500 dark:to-orange-600 dark:shadow-amber-500/30',
          ],
          isToday &&
            !collected && [
              'cursor-pointer bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600',
              'border-2 border-dashed border-emerald-400 hover:from-emerald-200 hover:to-teal-200',
              'dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-400',
              'dark:border-emerald-500 dark:hover:from-emerald-800/50 dark:hover:to-teal-800/50',
              'animate-pulse',
            ],
          isPast &&
            !collected && [
              'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500',
            ],
          isFuture &&
            !collected && [
              'border border-gray-200 bg-gray-50 text-gray-400',
              'dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-500',
            ]
        )}
        aria-label={
          collected
            ? `${dayName}: Stamp collected`
            : isToday
              ? `${dayName}: Collect today's stamp`
              : isPast
                ? `${dayName}: Missed`
                : `${dayName}: Future`
        }
        aria-pressed={collected}
      >
        {collected ? (
          <StarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : isToday ? (
          <BoltIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <span className="text-xs opacity-50">•</span>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// REWARD CLAIM MODAL
// ============================================================================

interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  xpBonus: number;
}

function RewardClaimModal({ isOpen, onClose, xpBonus }: RewardClaimModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-title"
    >
      <div
        className={cn(
          'relative max-w-sm rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 p-1',
          isAnimating && 'animate-bounce'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-white p-6 text-center dark:bg-slate-800">
          {/* Sparkle decorations */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <SparklesIcon className="h-8 w-8 text-amber-400" />
          </div>

          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-4 shadow-lg shadow-amber-200/50">
              <GiftIcon className="h-12 w-12 text-white" />
            </div>
          </div>

          <h3
            id="reward-title"
            className="mb-2 text-xl font-bold text-gray-900 dark:text-white"
          >
            Weekly Reward Earned!
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            You collected {STAMPS_REQUIRED} stamps this week!
          </p>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2 text-white shadow-md">
            <BoltIcon className="h-5 w-5" />
            <span className="font-bold">+{xpBonus} XP</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'mt-2 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3',
              'font-semibold text-white shadow-lg transition-all hover:shadow-xl',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2'
            )}
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DailyStampCollection() {
  const {
    state,
    weeklyProgress,
    canCollectToday,
    canClaim,
    collectTodayStamp,
    claimReward,
    milestoneProgress,
    weeklyReward,
    isLoading,
  } = useDailyStamps();

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [justCollected, setJustCollected] = useState(false);

  const today = getToday();

  const handleCollectStamp = () => {
    const success = collectTodayStamp();
    if (success) {
      setJustCollected(true);
      setTimeout(() => setJustCollected(false), 1000);
    }
  };

  const handleClaimReward = () => {
    const success = claimReward();
    if (success) {
      setShowRewardModal(true);
    }
  };

  if (isLoading) {
    return <DailyStampCollectionSkeleton />;
  }

  const progressPercentage = Math.round(
    (weeklyProgress.collectedCount / weeklyProgress.targetCount) * 100
  );

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Stamps
          </h3>
        </div>

        {/* Claim button or collected indicator */}
        {canClaim ? (
          <button
            type="button"
            onClick={handleClaimReward}
            className={cn(
              'flex items-center gap-1 rounded-lg px-3 py-1.5',
              'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md',
              'transition-all hover:shadow-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
              'animate-pulse'
            )}
            aria-label="Claim weekly reward"
          >
            <GiftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Claim Reward!</span>
          </button>
        ) : weeklyProgress.rewardEarned ? (
          <div className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Claimed!</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <StarIcon className="h-4 w-4 text-amber-400" />
            <span className="text-sm">
              {weeklyProgress.collectedCount}/{weeklyProgress.targetCount}
            </span>
          </div>
        )}
      </div>

      {/* Stamp grid */}
      <div className="mb-4 grid grid-cols-7 gap-1 sm:gap-2">
        {weeklyProgress.stamps.map((stamp) => (
          <StampCell
            key={stamp.date}
            date={stamp.date}
            dayName={stamp.dayName}
            collected={stamp.collected}
            isToday={stamp.date === today}
            isPast={stamp.date < today}
            isFuture={stamp.date > today}
            onCollect={canCollectToday ? handleCollectStamp : undefined}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              weeklyProgress.rewardEarned
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-amber-400 to-orange-500',
              justCollected && 'animate-pulse'
            )}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={weeklyProgress.collectedCount}
            aria-valuemin={0}
            aria-valuemax={weeklyProgress.targetCount}
            aria-label="Stamp collection progress"
          />
        </div>
      </div>

      {/* Progress text */}
      <p className="text-center text-sm text-gray-600 dark:text-gray-300">
        {formatStampProgress(weeklyProgress)}
      </p>

      {/* Encouragement */}
      {!weeklyProgress.rewardEarned && (
        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
          {getEncouragementMessage(weeklyProgress)}
        </p>
      )}

      {/* Stats row */}
      <div className="mt-4 flex justify-center gap-4 border-t border-gray-100 pt-4 dark:border-slate-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <StarIcon className="h-4 w-4" />
            <span className="text-lg font-bold">{state.totalStampsCollected}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Total Stamps</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-500">
            <GiftIcon className="h-4 w-4" />
            <span className="text-lg font-bold">{state.totalRewardsEarned}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Weekly Rewards
          </span>
        </div>
      </div>

      {/* Milestone progress */}
      {milestoneProgress.milestone && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-3 dark:from-indigo-900/30 dark:to-purple-900/30">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              Next: {milestoneProgress.milestone.name}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">
              {milestoneProgress.current}/{milestoneProgress.target}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
              style={{ width: `${milestoneProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Info tip */}
      <div className="mt-4 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
        <p className="text-center text-xs text-blue-600 dark:text-blue-300">
          <FireIcon className="mb-0.5 mr-1 inline h-3 w-3" />
          Collect {STAMPS_REQUIRED} stamps in a week &mdash; any days count!
        </p>
      </div>

      {/* Reward modal */}
      <RewardClaimModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        xpBonus={weeklyReward.xpBonus}
      />
    </div>
  );
}
