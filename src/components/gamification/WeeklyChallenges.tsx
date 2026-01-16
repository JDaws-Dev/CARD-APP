'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrophyIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
  BoltIcon,
  FireIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  type ActiveChallenge,
  type WeeklyChallengeState,
  loadChallengeState,
  saveChallengeState,
  refreshChallengesIfNeeded,
  processCompletedChallenges,
  getChallengeProgressPercent,
  formatChallengeProgress,
  getChallengeEncouragement,
  getDaysRemainingInWeek,
  getWeekEnd,
  CHALLENGES_PER_WEEK,
  DEFAULT_CHALLENGE_STATE,
} from '@/lib/weeklyChallenges';

// ============================================================================
// SKELETON
// ============================================================================

export function WeeklyChallengesSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {[...Array(CHALLENGES_PER_WEEK)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-gray-50 p-4 dark:bg-slate-700/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="mb-1 h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 flex justify-center gap-4 border-t border-gray-100 pt-4 dark:border-slate-700">
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-12 w-24" />
      </div>
    </div>
  );
}

// ============================================================================
// CHALLENGE CARD
// ============================================================================

interface ChallengeCardProps {
  challenge: ActiveChallenge;
  onClaim?: () => void;
  canClaim?: boolean;
}

function ChallengeCard({ challenge, onClaim, canClaim }: ChallengeCardProps) {
  const { definition, progress, completed } = challenge;
  const percent = getChallengeProgressPercent(challenge);
  const Icon = definition.icon;

  return (
    <div
      className={cn(
        'rounded-xl p-4 transition-all',
        completed
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30'
          : `bg-gradient-to-r ${definition.bgGradient} dark:from-slate-700/50 dark:to-slate-700/30`
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
              completed
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                : `bg-gradient-to-br ${definition.gradient}`
            )}
          >
            {completed ? (
              <CheckCircleIcon className="h-5 w-5 text-white" />
            ) : (
              <Icon className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h4
              className={cn(
                'font-semibold',
                completed
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-800 dark:text-white'
              )}
            >
              {definition.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {definition.description}
            </p>
          </div>
        </div>

        {/* Status / Reward */}
        <div className="flex-shrink-0">
          {completed && canClaim ? (
            <button
              type="button"
              onClick={onClaim}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1.5',
                'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md',
                'text-sm font-medium transition-all hover:shadow-lg',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                'animate-pulse'
              )}
              aria-label={`Claim ${definition.xpReward} XP reward`}
            >
              <GiftIcon className="h-4 w-4" />
              <span>+{definition.xpReward} XP</span>
            </button>
          ) : completed ? (
            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Done</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-600 dark:bg-slate-600/50 dark:text-gray-300">
              <BoltIcon className="h-4 w-4 text-amber-500" />
              <span>+{definition.xpReward}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span
            className={cn(
              completed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {formatChallengeProgress(challenge)}
          </span>
          <span
            className={cn(
              'font-medium',
              completed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-300'
            )}
          >
            {getChallengeEncouragement(challenge)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/50 dark:bg-slate-600/50">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              completed
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : `bg-gradient-to-r ${definition.gradient}`
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={definition.target}
            aria-label={`${definition.name} progress`}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REWARD MODAL
// ============================================================================

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: ActiveChallenge | null;
}

function RewardModal({ isOpen, onClose, challenge }: RewardModalProps) {
  if (!isOpen || !challenge) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-title"
    >
      <div
        className="relative max-w-sm animate-bounce rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl bg-white p-6 text-center dark:bg-slate-800">
          {/* Sparkle decorations */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <SparklesIcon className="h-8 w-8 text-amber-400" />
          </div>

          <div className="mb-4 flex justify-center">
            <div
              className={cn(
                'rounded-full p-4 shadow-lg',
                `bg-gradient-to-br ${challenge.definition.gradient}`
              )}
            >
              <TrophyIcon className="h-12 w-12 text-white" />
            </div>
          </div>

          <h3
            id="reward-title"
            className="mb-2 text-xl font-bold text-gray-900 dark:text-white"
          >
            Challenge Complete!
          </h3>
          <p className="mb-2 font-semibold text-gray-700 dark:text-gray-200">
            {challenge.definition.name}
          </p>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {challenge.definition.description}
          </p>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2 text-white shadow-md">
            <BoltIcon className="h-5 w-5" />
            <span className="font-bold">+{challenge.definition.xpReward} XP</span>
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

export function WeeklyChallenges() {
  const [state, setState] = useState<WeeklyChallengeState>(DEFAULT_CHALLENGE_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedThisSession, setClaimedThisSession] = useState<Set<string>>(
    new Set()
  );
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimingChallenge, setClaimingChallenge] =
    useState<ActiveChallenge | null>(null);

  // Load state on mount
  useEffect(() => {
    const loaded = loadChallengeState();
    const refreshed = refreshChallengesIfNeeded(loaded);
    const processed = processCompletedChallenges(refreshed);

    if (processed !== loaded) {
      saveChallengeState(processed);
    }

    setState(processed);
    setIsLoading(false);
  }, []);

  // Calculate stats
  const daysRemaining = useMemo(() => getDaysRemainingInWeek(), []);
  const weekEnd = useMemo(() => getWeekEnd(), []);
  const completedCount = useMemo(
    () => state.activeChallenges.filter((c) => c.completed).length,
    [state.activeChallenges]
  );
  const totalPossibleXp = useMemo(
    () =>
      state.activeChallenges.reduce((sum, c) => sum + c.definition.xpReward, 0),
    [state.activeChallenges]
  );
  const earnedXp = useMemo(
    () =>
      state.activeChallenges
        .filter((c) => c.completed)
        .reduce((sum, c) => sum + c.definition.xpReward, 0),
    [state.activeChallenges]
  );

  // Check if challenge can be claimed (not yet processed)
  const canClaimChallenge = useCallback(
    (challenge: ActiveChallenge): boolean => {
      if (!challenge.completed) return false;
      if (claimedThisSession.has(challenge.definition.id)) return false;

      const weekCompleted = state.completedByWeek[state.currentWeekStart] || [];
      return !weekCompleted.includes(challenge.definition.id);
    },
    [state.completedByWeek, state.currentWeekStart, claimedThisSession]
  );

  // Handle claiming a challenge reward
  const handleClaimReward = useCallback((challenge: ActiveChallenge) => {
    setClaimingChallenge(challenge);
    setShowRewardModal(true);
    setClaimedThisSession((prev) => new Set([...prev, challenge.definition.id]));

    // Update state
    setState((prev) => {
      const updated = processCompletedChallenges(prev);
      saveChallengeState(updated);
      return updated;
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRewardModal(false);
    setClaimingChallenge(null);
  }, []);

  if (isLoading) {
    return <WeeklyChallengesSkeleton />;
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weekly Challenges
          </h3>
        </div>

        {/* Time remaining */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 dark:bg-slate-700 dark:text-gray-300">
          <ClockIcon className="h-4 w-4" />
          <span>
            {daysRemaining === 0
              ? 'Ends today!'
              : daysRemaining === 1
                ? '1 day left'
                : `${daysRemaining} days left`}
          </span>
        </div>
      </div>

      {/* Progress summary */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
            <FireIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {completedCount}/{CHALLENGES_PER_WEEK} Complete
            </span>
            {completedCount === CHALLENGES_PER_WEEK && (
              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                All done!
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
          <BoltIcon className="h-4 w-4" />
          <span>
            {earnedXp}/{totalPossibleXp} XP
          </span>
        </div>
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {state.activeChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.definition.id}
            challenge={challenge}
            canClaim={canClaimChallenge(challenge)}
            onClaim={() => handleClaimReward(challenge)}
          />
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-4 flex justify-center gap-4 border-t border-gray-100 pt-4 dark:border-slate-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <TrophyIcon className="h-4 w-4" />
            <span className="text-lg font-bold">{state.totalCompleted}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            All-Time
          </span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-500">
            <BoltIcon className="h-4 w-4" />
            <span className="text-lg font-bold">{state.totalXpEarned}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Total XP
          </span>
        </div>
      </div>

      {/* Info tip */}
      <div className="mt-4 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
        <p className="text-center text-xs text-blue-600 dark:text-blue-300">
          <SparklesIcon className="mb-0.5 mr-1 inline h-3 w-3" />
          New challenges every week! Complete them to earn bonus XP.
        </p>
      </div>

      {/* Reward modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={handleCloseModal}
        challenge={claimingChallenge}
      />
    </div>
  );
}
