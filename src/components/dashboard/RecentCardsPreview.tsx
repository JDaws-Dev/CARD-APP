'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { CardImage } from '@/components/ui/CardImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// TYPES
// ============================================================================

interface RecentCardsPreviewProps {
  /** Maximum number of cards to show */
  limit?: number;
  /** Additional CSS classes */
  className?: string;
  /** Game slug for filtering */
  gameSlug?: string;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function RecentCardsPreviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0">
            <Skeleton className="h-[140px] w-[100px] rounded-lg" />
            <Skeleton className="mt-2 h-3 w-[80px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CARD ITEM COMPONENT
// ============================================================================

interface CardItemProps {
  cardId: string;
  name: string;
  imageSmall: string;
  rarity?: string;
  addedAt: number;
}

function CardItem({ cardId, name, imageSmall, rarity, addedAt }: CardItemProps) {
  // Format the time ago
  const timeAgo = formatTimeAgo(addedAt);

  return (
    <Link
      href={`/search?q=${encodeURIComponent(name)}`}
      className="group flex-shrink-0 transition-transform hover:scale-105"
      title={`${name}${rarity ? ` (${rarity})` : ''}`}
    >
      <div className="relative aspect-[5/7] w-[100px] overflow-hidden rounded-lg bg-gray-100 shadow-md ring-2 ring-transparent transition-all group-hover:shadow-lg group-hover:ring-indigo-300">
        {imageSmall ? (
          <CardImage
            src={imageSmall}
            alt={name}
            fill
            sizes="100px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <SparklesIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {/* Rarity indicator */}
        {rarity && (
          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {rarity}
          </div>
        )}
      </div>
      <div className="mt-1.5 max-w-[100px]">
        <p className="truncate text-xs font-medium text-gray-700 group-hover:text-gray-900">
          {name}
        </p>
        <p className="text-[10px] text-gray-400">{timeAgo}</p>
      </div>
    </Link>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * RecentCardsPreview - Shows recently added cards with images
 *
 * Displays a horizontally scrollable list of the most recently added cards
 * to the collection. Each card is clickable and links to search.
 */
export function RecentCardsPreview({
  limit = 10,
  className,
}: RecentCardsPreviewProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const recentCards = useQuery(
    api.collections.getNewlyAddedCards,
    profileId
      ? { profileId: profileId as Id<'profiles'>, days: 30, limit }
      : 'skip'
  );

  // Handle scroll buttons
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Loading state
  if (profileLoading || recentCards === undefined) {
    return <RecentCardsPreviewSkeleton className={className} />;
  }

  // No cards state
  if (!recentCards.cards || recentCards.cards.length === 0) {
    return (
      <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
        <div className="mb-3 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-800">Recently Added</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full bg-indigo-50 p-3">
            <SparklesIcon className="h-8 w-8 text-indigo-300" />
          </div>
          <p className="text-sm text-gray-500">No cards added yet</p>
          <Link
            href="/sets"
            className="mt-2 text-sm font-medium text-indigo-500 hover:text-indigo-600"
          >
            Browse sets to add cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-2xl bg-white p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-800">Recently Added</h3>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
            {recentCards.summary.totalAdditions}
          </span>
        </div>
        <Link
          href="/collection"
          className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600"
        >
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Scrollable cards container */}
      <div className="relative">
        {/* Scroll buttons - only show if there are enough cards */}
        {recentCards.cards.length > 4 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            </button>
          </>
        )}

        {/* Cards scroll container */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recentCards.cards.map((card, index) => (
            <CardItem
              key={`${card.cardId}-${card.addedAt}-${index}`}
              cardId={card.cardId}
              name={card.name}
              imageSmall={card.imageSmall}
              rarity={card.rarity}
              addedAt={card.addedAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
