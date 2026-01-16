'use client';

import { useQuery } from 'convex/react';
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
import { cn } from '@/lib/utils';

interface ActivityLog {
  _id: Id<'activityLogs'>;
  _creationTime: number;
  profileId: Id<'profiles'>;
  action: 'card_added' | 'card_removed' | 'achievement_earned';
  metadata?: {
    cardId?: string;
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
 */
export function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
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
}

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
function formatActivityDescription(log: ActivityLog): string {
  const { action, metadata } = log;

  switch (action) {
    case 'card_added': {
      const cardId = metadata?.cardId ?? 'a card';
      const variant = metadata?.variant;
      const quantity = metadata?.quantity ?? 1;

      let desc = `Added ${cardId}`;
      if (variant && variant !== 'normal') {
        desc += ` (${variant})`;
      }
      if (quantity > 1) {
        desc += ` x${quantity}`;
      }
      return desc;
    }
    case 'card_removed': {
      const cardId = metadata?.cardId ?? 'a card';
      const variantsRemoved = metadata?.variantsRemoved;

      let desc = `Removed ${cardId}`;
      if (variantsRemoved && variantsRemoved > 1) {
        desc += ` (${variantsRemoved} variants)`;
      }
      return desc;
    }
    case 'achievement_earned': {
      const achievementKey = metadata?.achievementKey ?? 'an achievement';
      return `Earned "${achievementKey}"`;
    }
    default:
      return 'Activity logged';
  }
}

/**
 * Single activity item component
 */
function ActivityItem({ log }: { log: ActivityLog }) {
  const actionDisplay = getActionDisplay(log.action);
  const Icon = actionDisplay.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          actionDisplay.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', actionDisplay.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {formatActivityDescription(log)}
        </p>
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <ClockIcon className="h-3 w-3" />
          {formatRelativeTime(log._creationTime)}
        </p>
      </div>
    </div>
  );
}

/**
 * Activity feed component showing recent collection activity
 */
export function ActivityFeed({ limit = 10, showHeader = true, className }: ActivityFeedProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const activity = useQuery(
    api.activityLogs.getRecentActivity,
    profileId ? { profileId: profileId as Id<'profiles'>, limit } : 'skip'
  );

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

  return (
    <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
      {showHeader && (
        <div className="mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-kid-primary" />
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        </div>
      )}
      <div className="space-y-2">
        {(activity as ActivityLog[]).map((log) => (
          <ActivityItem key={log._id} log={log} />
        ))}
      </div>
    </div>
  );
}
