'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import {
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardEntry {
  profileId: Id<'profiles'>;
  displayName: string;
  cardsThisWeek: number;
  rank: number;
}

interface MemberWeeklyStats {
  profileId: Id<'profiles'>;
  displayName: string;
  cardsThisWeek: number;
}

// ============================================================================
// SKELETON
// ============================================================================

export function FamilyLeaderboardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// RANK BADGE
// ============================================================================

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md">
        <TrophyIcon className="h-4 w-4 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-md">
        <span className="text-sm font-bold text-white">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-md">
        <span className="text-sm font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
      <span className="text-sm font-medium text-gray-500">{rank}</span>
    </div>
  );
}

// ============================================================================
// LEADERBOARD ROW
// ============================================================================

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentLeader: boolean;
}

function LeaderboardRow({ entry, isCurrentLeader }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
        isCurrentLeader
          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 ring-2 ring-amber-200'
          : 'bg-gray-50 hover:bg-gray-100'
      )}
    >
      <RankBadge rank={entry.rank} />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate font-semibold',
            isCurrentLeader ? 'text-amber-800' : 'text-gray-800'
          )}
        >
          {entry.displayName}
        </div>
        {isCurrentLeader && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <FireIcon className="h-3 w-3" />
            <span>This week&apos;s leader!</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end">
        <div
          className={cn(
            'text-lg font-bold',
            isCurrentLeader ? 'text-amber-700' : 'text-gray-700'
          )}
        >
          {entry.cardsThisWeek}
        </div>
        <div className="text-xs text-gray-400">cards</div>
      </div>
    </div>
  );
}

// ============================================================================
// MEMBER STATS COLLECTOR
// ============================================================================

interface MemberStatsCollectorProps {
  profileId: Id<'profiles'>;
  displayName: string;
  onStats: (stats: MemberWeeklyStats) => void;
}

function MemberStatsCollector({ profileId, displayName, onStats }: MemberStatsCollectorProps) {
  // Get activity logs for the past week
  const activity = useQuery(api.activityLogs.getRecentActivity, {
    profileId,
    limit: 100, // Get enough to cover a week
  });

  useEffect(() => {
    if (activity !== undefined) {
      // Calculate cards added this week
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const cardsThisWeek = activity.filter(
        (a) => a.action === 'card_added' && a._creationTime >= oneWeekAgo
      ).length;

      onStats({ profileId, displayName, cardsThisWeek });
    }
  }, [activity, profileId, displayName, onStats]);

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface FamilyLeaderboardProps {
  familyId: Id<'families'>;
  className?: string;
  variant?: 'compact' | 'full';
}

export function FamilyLeaderboard({
  familyId,
  className,
  variant = 'full',
}: FamilyLeaderboardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [memberStats, setMemberStats] = useState<Map<string, MemberWeeklyStats>>(new Map());

  // Fetch family profiles
  const profiles = useQuery(api.profiles.getProfilesByFamily, { familyId });

  // Stable callback for stats updates
  const handleMemberStats = useCallback((stats: MemberWeeklyStats) => {
    setMemberStats((prev) => {
      const existing = prev.get(stats.profileId);
      if (existing && existing.cardsThisWeek === stats.cardsThisWeek) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(stats.profileId, stats);
      return newMap;
    });
  }, []);

  // Loading state
  if (profiles === undefined) {
    return <FamilyLeaderboardSkeleton />;
  }

  // Need at least 2 profiles for a leaderboard
  if (profiles.length < 2) {
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
        <FamilyLeaderboardSkeleton />
      </>
    );
  }

  // Build and sort leaderboard entries
  const entries: LeaderboardEntry[] = profiles
    .map((profile) => {
      const stats = memberStats.get(profile._id);
      return {
        profileId: profile._id,
        displayName: profile.displayName,
        cardsThisWeek: stats?.cardsThisWeek ?? 0,
        rank: 0,
      };
    })
    .sort((a, b) => b.cardsThisWeek - a.cardsThisWeek);

  // Assign ranks (handling ties)
  let currentRank = 1;
  entries.forEach((entry, index) => {
    if (index > 0 && entry.cardsThisWeek < entries[index - 1].cardsThisWeek) {
      currentRank = index + 1;
    }
    entry.rank = currentRank;
  });

  const totalCardsThisWeek = entries.reduce((sum, e) => sum + e.cardsThisWeek, 0);
  const hasActivity = totalCardsThisWeek > 0;

  // Compact variant for kid dashboard
  if (variant === 'compact') {
    const topEntry = entries[0];
    return (
      <div
        className={cn(
          'rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-4 shadow-sm',
          className
        )}
      >
        {collectors}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
            <TrophyIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Family Leaderboard</h3>
            <p className="text-xs text-gray-500">This week&apos;s collection race</p>
          </div>
        </div>

        {hasActivity ? (
          <div className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <FireIcon className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-gray-700">{topEntry.displayName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-amber-600">{topEntry.cardsThisWeek}</span>
              <span className="text-xs text-gray-400">cards</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/60 px-4 py-3 text-center text-sm text-gray-500">
            No cards collected yet this week!
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm sm:p-6', className)}>
      {collectors}
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
          <TrophyIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">Family Leaderboard</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <CalendarIcon className="h-3 w-3" />
            <span>Cards collected this week</span>
          </div>
        </div>
        {hasActivity && (
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1">
            <ChartBarIcon className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{totalCardsThisWeek} total</span>
          </div>
        )}
      </div>

      {/* Toggle for leaderboard */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-3 flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
      >
        <span className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-amber-500" />
          {hasActivity ? 'View rankings' : 'Start collecting to compete!'}
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {/* Leaderboard entries */}
      {isExpanded && (
        <div className="space-y-2">
          {hasActivity ? (
            entries.map((entry) => (
              <LeaderboardRow
                key={entry.profileId}
                entry={entry}
                isCurrentLeader={entry.rank === 1}
              />
            ))
          ) : (
            <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-1 font-medium text-gray-600">No activity this week</p>
              <p className="text-sm text-gray-400">
                Add cards to your collection to start competing!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Encouragement message */}
      {hasActivity && isExpanded && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-3 text-center">
          <p className="text-sm text-indigo-600">
            <SparklesIcon className="mb-0.5 mr-1 inline h-4 w-4" />
            Keep collecting! Leaderboard resets every Monday.
          </p>
        </div>
      )}
    </div>
  );
}
