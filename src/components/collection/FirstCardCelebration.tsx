'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  SparklesIcon,
  StarIcon,
  CalendarDaysIcon,
  HeartIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface FirstCardData {
  cardId: string;
  cardName: string;
  setName?: string;
  addedAt: number;
  imageUrl?: string;
}

/**
 * Format the date when the first card was added
 */
function formatCollectionDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate how long ago the collection started
 */
function getCollectionAge(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Loading skeleton for the first card celebration
 */
export function FirstCardCelebrationSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="mb-1 h-4 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * First Card Celebration component
 * Displays a special permanent badge/display for the user's very first card
 * This is a nostalgia feature that highlights where their collection journey began
 */
export function FirstCardCelebration() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Fetch activity stats to get first activity timestamp
  const activityStats = useQuery(
    api.activityLogs.getActivityStats,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Fetch the oldest card_added activity to get first card details
  const activity = useQuery(
    api.activityLogs.getRecentActivityWithNames,
    profileId ? { profileId: profileId as Id<'profiles'>, limit: 1000 } : 'skip'
  );

  // Loading state
  if (profileLoading || activityStats === undefined || activity === undefined) {
    return <FirstCardCelebrationSkeleton />;
  }

  // Find the first card_added event
  const cardAddedEvents = (activity as Array<{
    _id: Id<'activityLogs'>;
    _creationTime: number;
    action: string;
    metadata?: {
      cardId?: string;
      cardName?: string;
      setName?: string;
    };
  }>).filter(log => log.action === 'card_added');

  // Sort by creation time (oldest first) and get the first one
  const firstCardEvent = cardAddedEvents.sort(
    (a, b) => a._creationTime - b._creationTime
  )[0];

  // No first card found - user hasn't added any cards yet
  if (!firstCardEvent) {
    return null;
  }

  const firstCard: FirstCardData = {
    cardId: firstCardEvent.metadata?.cardId ?? 'unknown',
    cardName: firstCardEvent.metadata?.cardName ?? 'Unknown Card',
    setName: firstCardEvent.metadata?.setName,
    addedAt: firstCardEvent._creationTime,
  };

  const collectionDate = formatCollectionDate(firstCard.addedAt);
  const collectionAge = getCollectionAge(firstCard.addedAt);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 shadow-sm ring-1 ring-amber-200/50"
      role="region"
      aria-label="First card celebration"
    >
      {/* Decorative sparkles */}
      <div className="pointer-events-none absolute -right-4 -top-4 opacity-20">
        <SparklesIcon className="h-24 w-24 text-amber-400" />
      </div>
      <div className="pointer-events-none absolute -bottom-2 -left-2 opacity-10">
        <StarIcon className="h-16 w-16 text-orange-400" />
      </div>

      {/* Badge header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
          <HeartIcon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-amber-700">
          Where It All Began
        </span>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* First card badge icon */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 opacity-30 blur-md" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 shadow-lg">
            <div className="text-center">
              <StarIcon className="mx-auto h-8 w-8 text-white drop-shadow-sm" />
              <span className="text-[10px] font-bold text-white/90">#1</span>
            </div>
          </div>
          {/* Sparkle accent */}
          <SparklesIcon className="absolute -right-1 -top-1 h-5 w-5 text-amber-500" />
        </div>

        {/* Card details */}
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-bold text-gray-800">
            {firstCard.cardName}
          </h3>
          {firstCard.setName && (
            <p className="mb-2 text-sm text-gray-600">{firstCard.setName}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="h-4 w-4 text-amber-500" />
              {collectionDate}
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
              {collectionAge}
            </span>
          </div>
        </div>
      </div>

      {/* Nostalgic message */}
      <div className="mt-4 rounded-lg bg-white/60 p-3">
        <p className="text-center text-sm italic text-gray-600">
          <SparklesIcon className="mr-1 inline h-4 w-4 text-amber-500" />
          Your very first card! This is where your collection journey started.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact version for dashboard or sidebar
 */
export function FirstCardCelebrationCompact() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const activity = useQuery(
    api.activityLogs.getRecentActivityWithNames,
    profileId ? { profileId: profileId as Id<'profiles'>, limit: 1000 } : 'skip'
  );

  if (profileLoading || activity === undefined) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="mb-1 h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  const cardAddedEvents = (activity as Array<{
    _creationTime: number;
    action: string;
    metadata?: { cardName?: string };
  }>).filter(log => log.action === 'card_added');

  const firstCardEvent = cardAddedEvents.sort(
    (a, b) => a._creationTime - b._creationTime
  )[0];

  if (!firstCardEvent) {
    return null;
  }

  const cardName = firstCardEvent.metadata?.cardName ?? 'Unknown Card';
  const collectionAge = getCollectionAge(firstCardEvent._creationTime);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-3 ring-1 ring-amber-200/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
        <StarIcon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">
          {cardName}
        </p>
        <p className="text-xs text-amber-600">First card · {collectionAge}</p>
      </div>
      <HeartIcon className="h-5 w-5 flex-shrink-0 text-amber-400" />
    </div>
  );
}
