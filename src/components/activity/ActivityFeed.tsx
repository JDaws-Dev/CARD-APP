'use client';

import { useQuery } from 'convex/react';
import { memo, useEffect, useRef } from 'react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  PlusCircleIcon,
  MinusCircleIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCelebration } from '@/components/ui/CelebrationAnimation';
import { useLiveRegion } from '@/components/accessibility/LiveRegion';
import { generateActivityAriaLabel } from '@/lib/screenReaderUtils';
import { cn } from '@/lib/utils';

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
    achievementKey?: string;
    achievementType?: string;
    variantsRemoved?: number;
  };
}

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Skeleton loader for activity feed
 * Memoized to prevent unnecessary re-renders when parent component updates
 */
export const ActivityFeedSkeleton = memo(function ActivityFeedSkeleton({
  count = 5,
}: {
  count?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
          <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Format a timestamp into a relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}

/**
 * Get display info for an action type
 */
function getActionDisplay(action: ActivityLog['action']) {
  switch (action) {
    case 'card_added':
      return {
        icon: PlusCircleIcon,
        bgColor: 'bg-kid-success/10',
        iconColor: 'text-kid-success',
        label: 'Added card',
      };
    case 'card_removed':
      return {
        icon: MinusCircleIcon,
        bgColor: 'bg-orange-100',
        iconColor: 'text-orange-500',
        label: 'Removed card',
      };
    case 'achievement_earned':
      return {
        icon: TrophyIcon,
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-500',
        label: 'Earned achievement',
      };
    default:
      return {
        icon: ClockIcon,
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-500',
        label: 'Activity',
      };
  }
}

/**
 * Format the activity description based on action type and metadata
 */
function formatActivityDescription(log: ActivityLog): { main: string; sub?: string } {
  const { action, metadata } = log;

  switch (action) {
    case 'card_added': {
      const cardName = metadata?.cardName ?? metadata?.cardId ?? 'a card';
      const setName = metadata?.setName;
      const variant = metadata?.variant;
      const quantity = metadata?.quantity ?? 1;

      let desc = `Added ${cardName}`;
      if (variant && variant !== 'normal') {
        desc += ` (${variant})`;
      }
      if (quantity > 1) {
        desc += ` x${quantity}`;
      }
      return { main: desc, sub: setName };
    }
    case 'card_removed': {
      const cardName = metadata?.cardName ?? metadata?.cardId ?? 'a card';
      const setName = metadata?.setName;
      const variantsRemoved = metadata?.variantsRemoved;

      let desc = `Removed ${cardName}`;
      if (variantsRemoved && variantsRemoved > 1) {
        desc += ` (${variantsRemoved} variants)`;
      }
      return { main: desc, sub: setName };
    }
    case 'achievement_earned': {
      const achievementKey = metadata?.achievementKey ?? 'an achievement';
      return { main: `Earned "${achievementKey}"` };
    }
    default:
      return { main: 'Activity logged' };
  }
}

/**
 * Single activity item component
 * Memoized to prevent unnecessary re-renders when parent component updates
 */
const ActivityItem = memo(function ActivityItem({ log }: { log: ActivityLog }) {
  const actionDisplay = getActionDisplay(log.action);
  const Icon = actionDisplay.icon;
  const description = formatActivityDescription(log);
  const isAchievement = log.action === 'achievement_earned';
  const relativeTime = formatRelativeTime(log._creationTime);

  // Generate accessible label for screen readers
  const ariaLabel = generateActivityAriaLabel({
    actionType: log.action,
    cardName: log.metadata?.cardName,
    setName: log.metadata?.setName,
    achievementName: log.metadata?.achievementKey,
    quantity: log.metadata?.quantity,
    timestamp: relativeTime,
  });

  return (
    <article
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors',
        isAchievement
          ? 'relative overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100'
          : 'bg-gray-50 hover:bg-gray-100'
      )}
      aria-label={ariaLabel}
    >
      {/* Achievement shimmer effect */}
      {isAchievement && (
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          actionDisplay.bgColor,
          isAchievement && 'animate-glow-pulse'
        )}
        aria-hidden="true"
      >
        <Icon className={cn('h-4 w-4', actionDisplay.iconColor)} aria-hidden="true" />
      </div>
      <div className="relative min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            isAchievement ? 'text-amber-800' : 'text-gray-800'
          )}
        >
          {description.main}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {description.sub && <span className="truncate text-kid-primary">{description.sub}</span>}
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" aria-hidden="true" />
            <time dateTime={new Date(log._creationTime).toISOString()}>{relativeTime}</time>
          </span>
        </div>
      </div>
    </article>
  );
});

/**
 * Get badge type based on achievement type from metadata
 */
function getBadgeType(achievementType?: string): 'gold' | 'silver' | 'bronze' | 'special' {
  switch (achievementType) {
    case 'set_complete':
    case 'milestone_100':
      return 'gold';
    case 'milestone_50':
    case 'type_specialist':
      return 'silver';
    case 'milestone_25':
    case 'first_card':
      return 'bronze';
    case 'speed_collector':
    case 'rare_hunter':
      return 'special';
    default:
      return 'gold';
  }
}

/**
 * Activity feed component showing recent collection activity
 * Memoized to prevent unnecessary re-renders when parent component updates
 */
export const ActivityFeed = memo(function ActivityFeed({
  limit = 10,
  showHeader = true,
  className,
}: ActivityFeedProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { celebrate } = useCelebration();
  const { announce } = useLiveRegion();
  const seenAchievementsRef = useRef<Set<string>>(new Set());
  const seenActivityRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const activity = useQuery(
    api.activityLogs.getRecentActivityWithNames,
    profileId ? { profileId: profileId as Id<'profiles'>, limit } : 'skip'
  );

  // Check for new achievements and trigger celebration
  useEffect(() => {
    if (!activity || activity.length === 0) return;

    // On initial load, just record all existing activities without announcing
    if (isInitialLoadRef.current) {
      (activity as ActivityLog[]).forEach((log) => {
        seenActivityRef.current.add(log._id);
        if (log.action === 'achievement_earned') {
          seenAchievementsRef.current.add(log._id);
        }
      });
      isInitialLoadRef.current = false;
      return;
    }

    // Check for new activities and announce them
    const newActivities = (activity as ActivityLog[]).filter(
      (log) => !seenActivityRef.current.has(log._id)
    );

    if (newActivities.length > 0) {
      // Announce the most recent new activity
      const latestActivity = newActivities[0];
      const description = formatActivityDescription(latestActivity);
      const announcementText =
        latestActivity.action === 'achievement_earned'
          ? `Achievement earned: ${latestActivity.metadata?.achievementKey ?? 'new badge'}`
          : description.main;

      announce(
        announcementText,
        latestActivity.action === 'achievement_earned' ? 'assertive' : 'polite'
      );

      // Mark all new activities as seen
      newActivities.forEach((log) => {
        seenActivityRef.current.add(log._id);
      });
    }

    // Check for new achievement events
    const achievementLogs = (activity as ActivityLog[]).filter(
      (log) => log.action === 'achievement_earned' && !seenAchievementsRef.current.has(log._id)
    );

    if (achievementLogs.length > 0) {
      // Get the most recent new achievement
      const latestAchievement = achievementLogs[0];
      const achievementKey = latestAchievement.metadata?.achievementKey ?? 'Achievement';
      const achievementType = latestAchievement.metadata?.achievementType;

      // Trigger celebration
      celebrate({
        name: achievementKey,
        description: 'You earned a new badge!',
        type: getBadgeType(achievementType),
        icon: 'trophy',
      });

      // Mark all new achievements as seen
      achievementLogs.forEach((log) => {
        seenAchievementsRef.current.add(log._id);
      });
    }
  }, [activity, celebrate, announce]);

  // Loading state
  if (profileLoading || activity === undefined) {
    return (
      <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-kid-primary" />
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          </div>
        )}
        <ActivityFeedSkeleton count={Math.min(limit, 5)} />
      </div>
    );
  }

  // Empty state
  if (activity.length === 0) {
    return (
      <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-kid-primary" />
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          </div>
        )}
        <div className="py-8 text-center">
          <ClockIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No activity yet</p>
          <p className="text-xs text-gray-400">Add some cards to see your activity here!</p>
        </div>
      </div>
    );
  }

  const activityCount = (activity as ActivityLog[]).length;

  return (
    <section
      className={cn('rounded-xl bg-white p-4 shadow-sm', className)}
      aria-label={`Recent activity feed, ${activityCount} ${activityCount === 1 ? 'item' : 'items'}`}
    >
      {showHeader && (
        <div className="mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
          <h3 className="font-semibold text-gray-800" id="activity-feed-heading">
            Recent Activity
          </h3>
        </div>
      )}
      <div
        className="space-y-2"
        role="feed"
        aria-labelledby={showHeader ? 'activity-feed-heading' : undefined}
        aria-label={!showHeader ? 'Recent collection activity' : undefined}
        aria-busy={false}
      >
        {(activity as ActivityLog[]).map((log, index) => (
          <div key={log._id} aria-setsize={activityCount} aria-posinset={index + 1}>
            <ActivityItem log={log} />
          </div>
        ))}
      </div>
    </section>
  );
});
