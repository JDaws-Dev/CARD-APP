'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import {
  FlagIcon,
  UserGroupIcon,
  TrophyIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface FamilyMemberProgress {
  profileId: Id<'profiles'>;
  displayName: string;
  cardsCount: number;
  contribution: number;
}

interface MemberStatsData {
  profileId: Id<'profiles'>;
  displayName: string;
  totalCards: number;
}

// ============================================================================
// FAMILY GOAL SKELETON
// ============================================================================

export function FamilyCollectionGoalSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="mb-2 h-4 w-full rounded-full" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

// ============================================================================
// PROGRESS BAR SEGMENT
// ============================================================================

interface ProgressSegmentProps {
  percentage: number;
  color: string;
  isFirst: boolean;
  isLast: boolean;
}

function ProgressSegment({ percentage, color, isFirst, isLast }: ProgressSegmentProps) {
  if (percentage <= 0) return null;

  return (
    <div
      className={cn(
        'h-full transition-all duration-500',
        color,
        isFirst && 'rounded-l-full',
        isLast && 'rounded-r-full'
      )}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  );
}

// ============================================================================
// MEMBER CONTRIBUTION ROW
// ============================================================================

interface MemberRowProps {
  member: FamilyMemberProgress;
  color: string;
  totalCards: number;
}

function MemberRow({ member, color, totalCards }: MemberRowProps) {
  const percentage = totalCards > 0 ? (member.cardsCount / totalCards) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
      <div className={cn('h-3 w-3 rounded-full', color)} />
      <span className="flex-1 text-sm font-medium text-gray-700">{member.displayName}</span>
      <span className="text-sm text-gray-500">{member.cardsCount} cards</span>
      <span className="min-w-[48px] text-right text-xs text-gray-400">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

// ============================================================================
// MEMBER STATS COLLECTOR - Uses useEffect to report stats
// ============================================================================

interface MemberStatsCollectorProps {
  profileId: Id<'profiles'>;
  displayName: string;
  onStats: (stats: MemberStatsData) => void;
}

function MemberStatsCollector({ profileId, displayName, onStats }: MemberStatsCollectorProps) {
  const stats = useQuery(api.collections.getCollectionStats, { profileId });

  useEffect(() => {
    if (stats !== undefined) {
      onStats({ profileId, displayName, totalCards: stats.totalCards });
    }
  }, [stats, profileId, displayName, onStats]);

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface FamilyCollectionGoalProps {
  familyId: Id<'families'>;
  goalTarget?: number;
  className?: string;
  variant?: 'compact' | 'full';
}

const MEMBER_COLORS = [
  'bg-indigo-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
];

export function FamilyCollectionGoal({
  familyId,
  goalTarget = 500,
  className,
  variant = 'full',
}: FamilyCollectionGoalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [memberStats, setMemberStats] = useState<Map<string, MemberStatsData>>(new Map());

  // Fetch family profiles
  const profiles = useQuery(api.profiles.getProfilesByFamily, { familyId });

  // Stable callback for stats updates
  const handleMemberStats = useCallback((stats: MemberStatsData) => {
    setMemberStats((prev) => {
      // Only update if value changed
      const existing = prev.get(stats.profileId);
      if (existing && existing.totalCards === stats.totalCards) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(stats.profileId, stats);
      return newMap;
    });
  }, []);

  // Loading state
  if (profiles === undefined) {
    return <FamilyCollectionGoalSkeleton />;
  }

  // No profiles yet
  if (profiles.length === 0) {
    return null;
  }

  // Check if all stats are loaded
  const allStatsLoaded = profiles.every((p) => memberStats.has(p._id));

  // Render collectors for profiles without stats
  const collectors = profiles
    .filter((p) => !memberStats.has(p._id))
    .map((profile) => (
      <MemberStatsCollector
        key={profile._id}
        profileId={profile._id}
        displayName={profile.displayName}
        onStats={handleMemberStats}
      />
    ));

  // Show skeleton while loading
  if (!allStatsLoaded) {
    return (
      <>
        {collectors}
        <FamilyCollectionGoalSkeleton />
      </>
    );
  }

  // Calculate combined progress
  const memberProgress: FamilyMemberProgress[] = profiles.map((profile) => {
    const stats = memberStats.get(profile._id);
    return {
      profileId: profile._id,
      displayName: profile.displayName,
      cardsCount: stats?.totalCards ?? 0,
      contribution: 0,
    };
  });

  const totalFamilyCards = memberProgress.reduce((sum, m) => sum + m.cardsCount, 0);

  // Update contributions
  memberProgress.forEach((m) => {
    m.contribution = totalFamilyCards > 0 ? (m.cardsCount / totalFamilyCards) * 100 : 0;
  });

  // Sort by cards count descending
  memberProgress.sort((a, b) => b.cardsCount - a.cardsCount);

  const progressPercentage = Math.min((totalFamilyCards / goalTarget) * 100, 100);
  const isGoalComplete = totalFamilyCards >= goalTarget;

  // Compact variant for kid dashboard
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 shadow-sm',
          className
        )}
      >
        {collectors}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md">
            <UserGroupIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Family Goal</h3>
            <p className="text-xs text-gray-500">
              {totalFamilyCards} / {goalTarget} cards
            </p>
          </div>
          {isGoalComplete && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
              <TrophyIcon className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Combined progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="flex h-full">
            {memberProgress.map((member, index) => {
              const memberPercentOfGoal = (member.cardsCount / goalTarget) * 100;
              const isFirst = index === 0;
              const isLast = index === memberProgress.length - 1 || progressPercentage >= 100;
              return (
                <ProgressSegment
                  key={member.profileId}
                  percentage={memberPercentOfGoal}
                  color={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                  isFirst={isFirst}
                  isLast={isLast}
                />
              );
            })}
          </div>
        </div>

        {/* Progress text */}
        <p className="mt-2 text-center text-sm text-gray-600">
          {isGoalComplete ? (
            <span className="flex items-center justify-center gap-1 font-semibold text-amber-600">
              <SparklesIcon className="h-4 w-4" />
              Goal Complete!
            </span>
          ) : (
            <span>{goalTarget - totalFamilyCards} cards to go!</span>
          )}
        </p>
      </div>
    );
  }

  // Full variant for parent dashboard
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm sm:p-6', className)}>
      {collectors}
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md">
          <FlagIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">Family Collection Goal</h3>
          <p className="text-sm text-gray-500">Work together to reach {goalTarget} cards!</p>
        </div>
        {isGoalComplete && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <TrophyIcon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Progress stats */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-gray-800">{totalFamilyCards}</span>
          <span className="ml-1 text-lg text-gray-400">/ {goalTarget}</span>
        </div>
        <span className="text-lg font-semibold text-indigo-600">
          {progressPercentage.toFixed(0)}%
        </span>
      </div>

      {/* Combined progress bar */}
      <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="flex h-full">
          {memberProgress.map((member, index) => {
            const memberPercentOfGoal = (member.cardsCount / goalTarget) * 100;
            const isFirst = index === 0;
            const isLast = index === memberProgress.length - 1 || progressPercentage >= 100;
            return (
              <ProgressSegment
                key={member.profileId}
                percentage={memberPercentOfGoal}
                color={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                isFirst={isFirst}
                isLast={isLast}
              />
            );
          })}
        </div>
      </div>

      {/* Celebration message */}
      {isGoalComplete && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <SparklesIcon className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-amber-700">
              Amazing! Your family reached the goal!
            </span>
            <SparklesIcon className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      )}

      {/* Member breakdown toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
      >
        <span className="flex items-center gap-2">
          <UserGroupIcon className="h-4 w-4" />
          {memberProgress.length} family member{memberProgress.length !== 1 ? 's' : ''} contributing
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {/* Expanded member list */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {memberProgress.map((member, index) => (
            <MemberRow
              key={member.profileId}
              member={member}
              color={MEMBER_COLORS[index % MEMBER_COLORS.length]}
              totalCards={totalFamilyCards}
            />
          ))}
        </div>
      )}
    </div>
  );
}
