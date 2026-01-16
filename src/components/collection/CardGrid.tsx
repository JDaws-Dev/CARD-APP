'use client';

import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import { HeartIcon, StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  TrophyIcon,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { MapIcon, CompassIcon } from '@heroicons/react/24/outline';

// Custom card icon for loading state
function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="44" height="60" rx="4" className="fill-current" />
      <rect x="8" y="10" width="32" height="6" rx="2" className="fill-white/40" />
      <rect x="8" y="20" width="24" height="4" rx="1" className="fill-white/30" />
      <circle cx="24" cy="40" r="10" className="fill-white/20" />
    </svg>
  );
}

// Crown icon for Set Champion
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.5 19h19v3h-19v-3zM22.07 7.63l-3.07 7.37h-14l-3.07-7.37 4.07 2.37 6-6 6 6 4.07-2.37z" />
    </svg>
  );
}

interface CardGridProps {
  cards: PokemonCard[];
  setId: string;
}

export function CardGrid({ cards, setId }: CardGridProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Convex queries and mutations
  const collection = useQuery(
    api.collections.getCollectionBySet,
    profileId ? { profileId: profileId as Id<'profiles'>, setId } : 'skip'
  );
  const wishlist = useQuery(
    api.wishlist.getWishlist,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
  const addCard = useMutation(api.collections.addCard);
  const removeCard = useMutation(api.collections.removeCard);
  const updateQuantity = useMutation(api.collections.updateQuantity);
  const addToWishlist = useMutation(api.wishlist.addToWishlist);
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist);
  const togglePriority = useMutation(api.wishlist.togglePriority);
  const priorityCount = useQuery(
    api.wishlist.getPriorityCount,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Build a map of owned cards for quick lookup
  const ownedCards = new Map<string, number>();
  if (collection) {
    collection.forEach((card) => {
      ownedCards.set(card.cardId, card.quantity);
    });
  }

  // Build a map of wishlisted card IDs to their priority status for quick lookup
  const wishlistedCards = new Map<string, boolean>();
  if (wishlist) {
    wishlist.forEach((item) => {
      wishlistedCards.set(item.cardId, item.isPriority ?? false);
    });
  }

  const handleToggleCard = async (cardId: string) => {
    if (!profileId) return;

    if (ownedCards.has(cardId)) {
      await removeCard({ profileId: profileId as Id<'profiles'>, cardId });
    } else {
      await addCard({ profileId: profileId as Id<'profiles'>, cardId });
    }
  };

  const handleToggleWishlist = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    if (wishlistedCards.has(cardId)) {
      await removeFromWishlist({ profileId: profileId as Id<'profiles'>, cardId });
    } else {
      await addToWishlist({ profileId: profileId as Id<'profiles'>, cardId });
    }
  };

  const handleTogglePriority = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    await togglePriority({ profileId: profileId as Id<'profiles'>, cardId });
  };

  const handleUpdateQuantity = async (cardId: string, delta: number) => {
    if (!profileId) return;

    const current = ownedCards.get(cardId) || 0;
    const newQty = Math.max(0, current + delta);

    if (newQty === 0) {
      await removeCard({ profileId: profileId as Id<'profiles'>, cardId });
    } else {
      await updateQuantity({
        profileId: profileId as Id<'profiles'>,
        cardId,
        quantity: newQty,
      });
    }
  };

  const ownedCount = ownedCards.size;
  const totalCount = cards.length;
  const progressPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  // Loading state
  if (profileLoading || collection === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <CardIcon className="h-12 w-12 animate-bounce text-kid-primary" />
          </div>
          <p className="text-gray-500">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-kid-primary">{ownedCount}</div>
            <div className="text-xs text-gray-500">Owned</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{totalCount - ownedCount}</div>
            <div className="text-xs text-gray-500">Needed</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-kid-secondary">{progressPercent}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Priority Stars Indicator */}
          {priorityCount && priorityCount.count > 0 && (
            <div className="flex items-center gap-1.5" title="Priority wishlist items">
              <div className="flex items-center">
                {Array.from({ length: priorityCount.max }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < priorityCount.count ? 'text-amber-400' : 'text-gray-200'
                    )}
                  >
                    {i < priorityCount.count ? (
                      <StarIconSolid className="h-4 w-4" />
                    ) : (
                      <StarIconOutline className="h-4 w-4" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">Priority</span>
            </div>
          )}

          {/* Progress indicator */}
          {progressPercent >= 25 && (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
                {progressPercent >= 100 ? (
                  <CrownIcon className="h-5 w-5" />
                ) : progressPercent >= 75 ? (
                  <TrophyIcon className="h-5 w-5" />
                ) : progressPercent >= 50 ? (
                  <MapIcon className="h-5 w-5" />
                ) : (
                  <CompassIcon className="h-5 w-5" />
                )}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {progressPercent >= 100
                  ? 'Set Champion!'
                  : progressPercent >= 75
                    ? 'Set Master'
                    : progressPercent >= 50
                      ? 'Set Adventurer'
                      : 'Set Explorer'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Grid */}
      <div className="card-grid">
        {cards.map((card) => {
          const isOwned = ownedCards.has(card.id);
          const quantity = ownedCards.get(card.id) || 0;
          const isWishlisted = wishlistedCards.has(card.id);
          const isPriority = wishlistedCards.get(card.id) ?? false;
          const canAddPriority = (priorityCount?.remaining ?? 0) > 0;

          return (
            <div
              key={card.id}
              className={cn(
                'group relative cursor-pointer rounded-xl bg-white p-2 shadow-sm transition-all',
                isOwned
                  ? 'ring-2 ring-kid-success ring-offset-2'
                  : 'opacity-60 hover:opacity-100 hover:shadow-md'
              )}
              onClick={() => handleToggleCard(card.id)}
            >
              {/* Card Image */}
              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
                <Image
                  src={card.images.small}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-contain"
                />

                {/* Owned Checkmark */}
                {isOwned && (
                  <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-success text-white shadow-md">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Quantity Badge */}
                {quantity > 1 && (
                  <div className="absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow-md">
                    x{quantity}
                  </div>
                )}

                {/* Wishlist Heart Button */}
                <button
                  className={cn(
                    'absolute bottom-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all',
                    isWishlisted ? 'right-9' : 'right-1',
                    isWishlisted
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/90 text-gray-400 opacity-0 hover:bg-white hover:text-rose-500 group-hover:opacity-100'
                  )}
                  onClick={(e) => handleToggleWishlist(card.id, e)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-4 w-4" />
                  ) : (
                    <HeartIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Priority Star Button - Only show when wishlisted */}
                {isWishlisted && (
                  <button
                    className={cn(
                      'absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all',
                      isPriority
                        ? 'bg-amber-400 text-white'
                        : canAddPriority
                          ? 'bg-white/90 text-gray-400 hover:bg-amber-100 hover:text-amber-500'
                          : 'cursor-not-allowed bg-gray-100 text-gray-300'
                    )}
                    onClick={(e) => handleTogglePriority(card.id, e)}
                    disabled={!isPriority && !canAddPriority}
                    aria-label={isPriority ? 'Remove from priority' : 'Mark as priority'}
                    title={
                      isPriority
                        ? 'Remove from priority'
                        : canAddPriority
                          ? 'Mark as priority'
                          : `Max ${priorityCount?.max ?? 5} priority items`
                    }
                  >
                    {isPriority ? (
                      <StarIconSolid className="h-4 w-4" />
                    ) : (
                      <StarIconOutline className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Card Info */}
              <div className="mt-2 text-center">
                <p className="truncate text-xs font-medium text-gray-800">{card.name}</p>
                <p className="text-xs text-gray-400">#{card.number}</p>
              </div>

              {/* Quantity Controls - Show on hover when owned */}
              {isOwned && (
                <div
                  className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-2 py-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    onClick={() => handleUpdateQuantity(card.id, -1)}
                  >
                    −
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-medium">{quantity}</span>
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-kid-primary text-white hover:bg-kid-primary/90"
                    onClick={() => handleUpdateQuantity(card.id, 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
