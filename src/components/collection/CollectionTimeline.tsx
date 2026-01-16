'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  CalendarDaysIcon,
  SparklesIcon,
  CakeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface ActivityLog {
  _id: Id<'activityLogs'>;
  _creationTime: number;
  profileId: Id<'profiles'>;
  action: 'card_added' | 'card_removed' | 'achievement_earned';
  metadata?: {
    cardId?: string;
    cardName?: string;
    setName?: string;
    variant?: string;
    quantity?: number;
  };
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  year: number;
  cards: ActivityLog[];
  isAnniversary?: boolean;
  anniversaryYears?: number;
}

/**
 * Format month label from a date
 */
function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get month key for grouping (YYYY-MM)
 */
function getMonthKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format relative date for card items
 */
function formatCardDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if this month is a collection anniversary
 */
function isCollectionAnniversary(
  monthKey: string,
  firstCardTimestamp: number | null
): { isAnniversary: boolean; years: number } {
  if (!firstCardTimestamp) return { isAnniversary: false, years: 0 };

  const firstDate = new Date(firstCardTimestamp);
  const firstMonth = firstDate.getMonth() + 1;
  const firstYear = firstDate.getFullYear();

  const [currentYear, currentMonth] = monthKey.split('-').map(Number);

  if (currentMonth === firstMonth && currentYear > firstYear) {
    return { isAnniversary: true, years: currentYear - firstYear };
  }

  return { isAnniversary: false, years: 0 };
}

/**
 * Skeleton loader for timeline
 */
export function CollectionTimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="rounded-lg bg-gray-50 p-3">
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single month section component
 */
function MonthSection({
  group,
  isExpanded,
  onToggle,
}: {
  group: MonthGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const displayedCards = isExpanded ? group.cards : group.cards.slice(0, 8);
  const hasMore = group.cards.length > 8;

  return (
    <div
      className={cn(
        'rounded-xl bg-white p-4 shadow-sm transition-all',
        group.isAnniversary && 'ring-2 ring-amber-400 ring-offset-2'
      )}
    >
      {/* Month Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              group.isAnniversary
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-gradient-to-br from-indigo-400 to-purple-500'
            )}
          >
            {group.isAnniversary ? (
              <CakeIcon className="h-5 w-5 text-white" />
            ) : (
              <CalendarDaysIcon className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{group.monthLabel}</h3>
            {group.isAnniversary && (
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <SparklesIcon className="h-4 w-4" />
                <span>
                  {group.anniversaryYears} year{group.anniversaryYears !== 1 ? 's' : ''} of
                  collecting!
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
            {group.cards.length} card{group.cards.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {displayedCards.map((card) => (
          <div
            key={card._id}
            className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-3 transition-colors hover:from-indigo-50 hover:to-purple-50"
          >
            <p className="truncate text-sm font-medium text-gray-800">
              {card.metadata?.cardName ?? card.metadata?.cardId ?? 'Unknown Card'}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span className="truncate">{card.metadata?.setName ?? 'Unknown Set'}</span>
              <span className="flex-shrink-0">{formatCardDate(card._creationTime)}</span>
            </div>
            {card.metadata?.variant && card.metadata.variant !== 'normal' && (
              <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                {card.metadata.variant}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={onToggle}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4" />
              Show all {group.cards.length} cards
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Collection Timeline component showing cards grouped by month
 */
export function CollectionTimeline() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Fetch all card additions (using a large limit for timeline)
  const activity = useQuery(
    api.activityLogs.getRecentActivityWithNames,
    profileId ? { profileId: profileId as Id<'profiles'>, limit: 1000 } : 'skip'
  );

  // Get first card timestamp for anniversary calculation
  const activityStats = useQuery(
    api.activityLogs.getActivityStats,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Group cards by month
  const monthGroups = useMemo(() => {
    if (!activity) return [];

    // Filter to only card_added events
    const cardAdditions = (activity as ActivityLog[]).filter((log) => log.action === 'card_added');

    // Group by month
    const groups = new Map<string, ActivityLog[]>();
    for (const log of cardAdditions) {
      const monthKey = getMonthKey(log._creationTime);
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(log);
    }

    // Convert to array and add month labels
    const firstCardTimestamp = activityStats?.firstActivity ?? null;
    const result: MonthGroup[] = [];

    for (const [monthKey, cards] of groups) {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const anniversary = isCollectionAnniversary(monthKey, firstCardTimestamp);

      result.push({
        monthKey,
        monthLabel: formatMonthLabel(date),
        year,
        cards: cards.sort((a, b) => b._creationTime - a._creationTime),
        isAnniversary: anniversary.isAnniversary,
        anniversaryYears: anniversary.years,
      });
    }

    // Sort by month key (newest first)
    return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [activity, activityStats?.firstActivity]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  // Loading state
  if (profileLoading || activity === undefined || activityStats === undefined) {
    return <CollectionTimelineSkeleton />;
  }

  // Empty state
  if (monthGroups.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <CalendarDaysIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-xl font-bold text-gray-800">No collection history yet</h2>
        <p className="text-gray-500">
          Add some cards to your collection to see your timeline appear here!
        </p>
      </div>
    );
  }

  // Calculate stats
  const totalCards = monthGroups.reduce((sum, g) => sum + g.cards.length, 0);
  const oldestMonth = monthGroups[monthGroups.length - 1]?.monthLabel ?? '';

  return (
    <div className="space-y-6">
      {/* Timeline Header Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-indigo-600">{totalCards}</div>
          <div className="text-sm text-gray-500">Cards Added</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{monthGroups.length}</div>
          <div className="text-sm text-gray-500">Months Active</div>
        </div>
        <div className="hidden rounded-xl bg-white p-4 shadow-sm sm:block">
          <div className="truncate text-lg font-bold text-pink-600">{oldestMonth}</div>
          <div className="text-sm text-gray-500">Started Collecting</div>
        </div>
      </div>

      {/* Month Sections */}
      {monthGroups.map((group) => (
        <MonthSection
          key={group.monthKey}
          group={group}
          isExpanded={expandedMonths.has(group.monthKey)}
          onToggle={() => toggleMonth(group.monthKey)}
        />
      ))}
    </div>
  );
}
