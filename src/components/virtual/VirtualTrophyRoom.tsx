'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/components/providers/ReducedMotionProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrophyIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';

// Rarity glow color mapping
const RARITY_GLOW_COLORS: Record<string, string> = {
  'Rare Holo': 'from-yellow-400/60 via-amber-300/40 to-yellow-500/60',
  'Rare Holo EX': 'from-blue-400/60 via-purple-300/40 to-blue-500/60',
  'Rare Holo GX': 'from-purple-400/60 via-pink-300/40 to-purple-500/60',
  'Rare Holo V': 'from-indigo-400/60 via-violet-300/40 to-indigo-500/60',
  'Rare Holo VMAX': 'from-pink-400/60 via-rose-300/40 to-pink-500/60',
  'Rare Holo VSTAR': 'from-amber-400/60 via-yellow-300/40 to-amber-500/60',
  'Rare Ultra': 'from-purple-500/70 via-indigo-400/50 to-purple-600/70',
  'Rare Secret': 'from-yellow-500/70 via-amber-400/50 to-yellow-600/70',
  'Rare Rainbow': 'from-red-400/50 via-yellow-400/50 via-green-400/50 via-blue-400/50 to-purple-400/50',
  'Rare Shiny': 'from-cyan-400/60 via-teal-300/40 to-cyan-500/60',
  'Amazing Rare': 'from-rose-400/60 via-pink-300/40 to-rose-500/60',
  'Illustration Rare': 'from-emerald-400/60 via-teal-300/40 to-emerald-500/60',
  'Special Art Rare': 'from-violet-400/60 via-purple-300/40 to-violet-500/60',
  'Ultra Rare': 'from-fuchsia-400/60 via-pink-300/40 to-fuchsia-500/60',
  'Secret Rare': 'from-yellow-400/70 via-amber-300/50 to-yellow-500/70',
  'Hyper Rare': 'from-sky-400/60 via-blue-300/40 to-sky-500/60',
  default: 'from-gray-400/40 via-gray-300/30 to-gray-400/40',
};

function getGlowColor(rarity?: string): string {
  if (!rarity) return RARITY_GLOW_COLORS.default;
  return RARITY_GLOW_COLORS[rarity] || RARITY_GLOW_COLORS.default;
}

// Trophy shelf slot component
interface TrophySlotProps {
  card: {
    cardId: string;
    name: string;
    imageSmall: string;
    variant: string;
    unitPrice: number;
    totalValue: number;
    rarity?: string;
  };
  rank: number;
  reducedMotion: boolean;
}

function TrophySlot({ card, rank, reducedMotion }: TrophySlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const glowColor = getGlowColor(card.rarity);

  return (
    <div
      className="group relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rank badge */}
      <div
        className={cn(
          'absolute -top-2 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold shadow-md',
          rank === 1 && 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
          rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800',
          rank === 3 && 'bg-gradient-to-br from-orange-400 to-orange-600 text-white',
          rank > 3 && 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
        )}
      >
        {rank}
      </div>

      {/* Card display with glow effect */}
      <div className="relative">
        {/* Animated glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg bg-gradient-to-br blur-md',
            glowColor,
            !reducedMotion && 'animate-pulse',
            isHovered ? 'opacity-100' : 'opacity-60'
          )}
          style={{ transform: 'scale(1.15)' }}
        />

        {/* 3D shelf perspective */}
        <div
          className={cn(
            'relative transform transition-all duration-300',
            !reducedMotion && isHovered && '-translate-y-2 scale-105'
          )}
        >
          {/* Card image */}
          <div className="relative h-32 w-24 overflow-hidden rounded-lg shadow-lg sm:h-40 sm:w-28">
            <Image
              src={card.imageSmall}
              alt={card.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 112px"
            />

            {/* Shimmer overlay for holos */}
            {card.rarity?.toLowerCase().includes('holo') && !reducedMotion && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/0 via-white/30 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </div>

          {/* 3D shelf base */}
          <div className="absolute -bottom-2 left-1/2 h-2 w-20 -translate-x-1/2 rounded-sm bg-gradient-to-b from-amber-800 to-amber-900 shadow-md sm:w-24" />
          <div className="absolute -bottom-1 left-1/2 h-1 w-16 -translate-x-1/2 bg-gradient-to-b from-amber-700 to-amber-800 sm:w-20" />
        </div>
      </div>

      {/* Card info on hover */}
      <div
        className={cn(
          'mt-4 text-center transition-all duration-200',
          isHovered ? 'opacity-100' : 'opacity-70'
        )}
      >
        <p className="max-w-24 truncate text-xs font-semibold text-gray-800 sm:max-w-28 sm:text-sm">
          {card.name}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1">
          <CurrencyDollarIcon className="h-3 w-3 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-600">
            ${card.totalValue.toFixed(2)}
          </span>
        </div>
        {card.rarity && (
          <p className="mt-0.5 truncate text-[10px] text-gray-500">{card.rarity}</p>
        )}
      </div>
    </div>
  );
}

// Skeleton for loading state
function TrophyRoomSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-sm">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Trophy shelf skeleton */}
      <div className="relative rounded-xl bg-gradient-to-b from-amber-100/50 to-amber-200/50 p-6">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-32 w-24 rounded-lg sm:h-40 sm:w-28" />
              <Skeleton className="mt-4 h-4 w-20" />
              <Skeleton className="mt-1 h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyTrophyRoom() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
          <TrophyIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Trophy Room</h3>
          <p className="text-sm text-gray-500">Your most valuable cards</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-amber-100/50 to-amber-200/50 py-12">
        <Square3Stack3DIcon className="mb-4 h-16 w-16 text-amber-300" />
        <h4 className="mb-2 text-lg font-semibold text-gray-700">No treasures yet!</h4>
        <p className="max-w-sm text-center text-sm text-gray-500">
          Add cards with market prices to your collection to see them displayed here in your
          personal trophy room.
        </p>
      </div>
    </div>
  );
}

// Main Trophy Room component
interface VirtualTrophyRoomProps {
  className?: string;
  limit?: number;
}

export function VirtualTrophyRoom({ className, limit = 10 }: VirtualTrophyRoomProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { prefersReducedMotion } = useReducedMotion();

  const valuableCards = useQuery(
    api.collections.getMostValuableCards,
    profileId ? { profileId: profileId as Id<'profiles'>, limit } : 'skip'
  );

  // Loading state
  if (profileLoading || valuableCards === undefined) {
    return <TrophyRoomSkeleton />;
  }

  // Empty state
  if (!valuableCards || valuableCards.length === 0) {
    return <EmptyTrophyRoom />;
  }

  // Calculate total value
  const totalValue = valuableCards.reduce((sum, card) => sum + card.totalValue, 0);

  // Split cards into two rows for display
  const topRow = valuableCards.slice(0, 5);
  const bottomRow = valuableCards.slice(5, 10);

  return (
    <div
      className={cn(
        'rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
            <TrophyIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Trophy Room</h3>
            <p className="text-sm text-gray-500">Your most valuable cards on display</p>
          </div>
        </div>

        {/* Total value badge */}
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm">
          <SparklesIcon className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">Total Value:</span>
          <span className="font-bold text-emerald-600">${totalValue.toFixed(2)}</span>
        </div>
      </div>

      {/* Trophy display shelves */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-amber-100/50 via-amber-150/30 to-amber-200/50 p-4 sm:p-6">
        {/* Decorative wall texture */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-4 top-4 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-transparent blur-2xl" />
          <div className="absolute right-8 top-8 h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-transparent blur-2xl" />
        </div>

        {/* Top row - first 5 cards */}
        <div className="mb-8 grid grid-cols-5 gap-2 sm:gap-4">
          {topRow.map((card, index) => (
            <TrophySlot
              key={card.cardId + card.variant}
              card={card}
              rank={index + 1}
              reducedMotion={prefersReducedMotion}
            />
          ))}
        </div>

        {/* Decorative shelf divider */}
        <div className="relative mb-8">
          <div className="absolute left-1/2 top-0 h-1 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        </div>

        {/* Bottom row - cards 6-10 */}
        {bottomRow.length > 0 && (
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {bottomRow.map((card, index) => (
              <TrophySlot
                key={card.cardId + card.variant}
                card={card}
                rank={index + 6}
                reducedMotion={prefersReducedMotion}
              />
            ))}
            {/* Empty slots if less than 5 cards in bottom row */}
            {Array.from({ length: 5 - bottomRow.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center opacity-30">
                <div className="relative">
                  <div className="flex h-32 w-24 items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-100/50 sm:h-40 sm:w-28">
                    <StarIcon className="h-8 w-8 text-amber-300" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 h-2 w-20 -translate-x-1/2 rounded-sm bg-gradient-to-b from-amber-800/50 to-amber-900/50 sm:w-24" />
                </div>
                <p className="mt-4 text-xs text-amber-400">Empty Slot</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Cards are ranked by market value. Add more valuable cards to fill your trophy room!
      </p>
    </div>
  );
}

export default VirtualTrophyRoom;
