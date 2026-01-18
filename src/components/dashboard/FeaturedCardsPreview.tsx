'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ArrowPathIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface FeaturedCardsPreviewProps {
  /** Number of featured cards to show */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Game slug for filtering */
  gameSlug?: string;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function FeaturedCardsPreviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex justify-center gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0">
            <Skeleton className="h-[175px] w-[125px] rounded-lg" />
            <Skeleton className="mt-2 h-4 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FEATURED CARD COMPONENT
// ============================================================================

interface FeaturedCardProps {
  cardId: string;
  name: string;
  imageSmall: string;
  imageLarge: string;
  rarity?: string;
  types: string[];
  isHighlighted?: boolean;
}

function FeaturedCard({
  cardId,
  name,
  imageSmall,
  imageLarge,
  rarity,
  types,
  isHighlighted = false,
}: FeaturedCardProps) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(name)}`}
      className="group flex-shrink-0 transition-transform hover:scale-105 active:scale-100"
      title={`${name}${rarity ? ` - ${rarity}` : ''}`}
    >
      {/* Responsive card sizes - smaller on mobile to fit 3 cards */}
      <div
        className={cn(
          'relative aspect-[5/7] w-[90px] overflow-hidden rounded-xl shadow-lg transition-all sm:w-[110px] md:w-[125px]',
          isHighlighted
            ? 'ring-4 ring-amber-300 ring-offset-2'
            : 'ring-2 ring-transparent group-hover:ring-indigo-300'
        )}
      >
        {imageLarge || imageSmall ? (
          <CardImage
            src={imageLarge || imageSmall}
            alt={name}
            fill
            sizes="(max-width: 640px) 90px, (max-width: 768px) 110px, 125px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
            <SparklesIcon className="h-8 w-8 text-indigo-300 sm:h-10 sm:w-10" />
          </div>
        )}
        {/* Highlight badge for center card */}
        {isHighlighted && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 shadow-md">
            <StarIconSolid className="h-3 w-3 text-white" />
          </div>
        )}
        {/* Rarity badge */}
        {rarity && (
          <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {rarity}
          </div>
        )}
      </div>
      {/* Minimal text - just card name */}
      <div className="mt-2 max-w-[90px] text-center sm:max-w-[110px] md:max-w-[125px]">
        <p className="truncate text-xs font-medium text-gray-700 group-hover:text-gray-900 sm:text-sm">
          {name}
        </p>
        {/* Hide type on smallest screens */}
        {types && types.length > 0 && (
          <p className="hidden text-[10px] text-gray-400 sm:block">{types.slice(0, 2).join(' · ')}</p>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * FeaturedCardsPreview - Shows randomly selected featured cards from the collection
 *
 * Displays a spotlight section with random cards from the user's collection.
 * Includes a refresh button to show different cards. The center card is
 * highlighted as the "featured" card.
 */
export function FeaturedCardsPreview({
  count = 3,
  className,
  gameSlug,
}: FeaturedCardsPreviewProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const randomCards = useQuery(
    api.collections.getRandomCards,
    profileId
      ? {
          profileId: profileId as Id<'profiles'>,
          count,
          gameSlug: gameSlug as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana' | undefined,
        }
      : 'skip'
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    // Reset refreshing state after a brief delay for visual feedback
    setTimeout(() => setIsRefreshing(false), 300);
  }, []);

  // Loading state
  if (profileLoading || randomCards === undefined) {
    return <FeaturedCardsPreviewSkeleton className={className} />;
  }

  // No cards state
  if (!randomCards || randomCards.length === 0) {
    return (
      <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
        <div className="mb-3 flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800">Collection Spotlight</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 rounded-full bg-amber-50 p-3">
            <SparklesIcon className="h-8 w-8 text-amber-300" />
          </div>
          <p className="text-sm text-gray-500">Your collection is empty</p>
          <Link
            href="/sets"
            className="mt-2 text-sm font-medium text-amber-500 hover:text-amber-600"
          >
            Start adding cards
          </Link>
        </div>
      </div>
    );
  }

  // Determine center index for highlighting
  const centerIndex = Math.floor(randomCards.length / 2);

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm', className)}>
      {/* Decorative background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30"
        aria-hidden="true"
      />
      <SparklesIcon
        className="absolute -right-4 -top-4 h-20 w-20 rotate-12 text-amber-100"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800">Collection Spotlight</h3>
        </div>
        {/* Larger touch target for refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-all hover:bg-amber-200 active:scale-95 disabled:opacity-50"
          aria-label="Show different cards"
        >
          <ArrowPathIcon
            className={cn('h-5 w-5', isRefreshing && 'animate-spin')}
          />
        </button>
      </div>

      {/* Featured cards - responsive gap */}
      <div className="relative flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
        {randomCards.map((card, index) => (
          <FeaturedCard
            key={`${card.cardId}-${refreshKey}-${index}`}
            cardId={card.cardId}
            name={card.name}
            imageSmall={card.imageSmall}
            imageLarge={card.imageLarge}
            rarity={card.rarity}
            types={card.types}
            isHighlighted={index === centerIndex}
          />
        ))}
      </div>

      {/* Footer link - larger touch target */}
      <div className="relative mt-4 text-center">
        <Link
          href="/collection"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200"
        >
          View your collection
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
