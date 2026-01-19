'use client';

import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import { MagnifyingGlassIcon, MinusIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';
import { CardImage } from '@/components/ui/CardImage';
import { useCollectionToast } from '@/components/providers/CollectionToastProvider';

interface SearchResultsProps {
  cards: PokemonCard[];
  isLoading?: boolean;
}

export function SearchResults({ cards, isLoading }: SearchResultsProps) {
  const { profileId } = useCurrentProfile();
  const { showCollectionToast } = useCollectionToast();

  const collection = useQuery(
    api.collections.getCollection,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
  const addCard = useMutation(api.collections.addCard);
  const removeCard = useMutation(api.collections.removeCard);
  const updateQuantity = useMutation(api.collections.updateQuantity);

  // Build a map of owned cards for quick lookup
  const ownedCards = new Map<string, number>();
  if (collection) {
    collection.forEach((card) => {
      ownedCards.set(card.cardId, card.quantity);
    });
  }

  const handleToggleCard = async (cardId: string, cardName: string) => {
    if (!profileId) return;

    if (ownedCards.has(cardId)) {
      await removeCard({ profileId: profileId as Id<'profiles'>, cardId });
    } else {
      await addCard({ profileId: profileId as Id<'profiles'>, cardId });
      showCollectionToast(cardName, 1);
    }
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

  if (isLoading) {
    return <SearchResultsSkeleton count={10} />;
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <MagnifyingGlassIcon className="h-16 w-16 text-gray-300" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">No cards found</h2>
        <p className="text-gray-500">Try a different search term or check your spelling.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-sm text-gray-500">
        Found {cards.length} card{cards.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {cards.map((card) => {
          const isOwned = ownedCards.has(card.id);
          const quantity = ownedCards.get(card.id) || 0;

          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              aria-label={`${card.name} from ${card.set.name}, ${isOwned ? `owned ${quantity} copies` : 'not owned'}. Click to ${isOwned ? 'remove from' : 'add to'} collection`}
              className={cn(
                'group relative cursor-pointer rounded-xl bg-white p-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                isOwned
                  ? 'ring-2 ring-kid-success ring-offset-2'
                  : 'opacity-80 hover:opacity-100 hover:shadow-md'
              )}
              onClick={() => handleToggleCard(card.id, card.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleCard(card.id, card.name);
                }
              }}
            >
              {/* Card Image */}
              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
                <CardImage
                  src={card.images.small}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                />

                {/* Owned Checkmark */}
                {isOwned && (
                  <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-success text-white shadow-md">
                    <CheckIcon className="h-4 w-4" strokeWidth={3} />
                  </div>
                )}

                {/* Quantity Badge */}
                {quantity > 1 && (
                  <div className="absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow-md">
                    x{quantity}
                  </div>
                )}
              </div>

              {/* Card Info */}
              <div className="mt-2 text-center">
                <p className="truncate text-xs font-medium text-gray-800">{card.name}</p>
                <Link
                  href={`/sets/${card.set.id}`}
                  className="text-xs text-gray-400 hover:text-kid-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {card.set.name}
                </Link>
              </div>

              {/* Quantity Controls - Show on hover when owned */}
              {isOwned && (
                <div
                  className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-2 py-1 opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  role="group"
                  aria-label={`Quantity controls for ${card.name}`}
                >
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
                    onClick={() => handleUpdateQuantity(card.id, -1)}
                    aria-label={`Remove one copy of ${card.name}`}
                  >
                    <MinusIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span
                    className="min-w-[1.5rem] text-center text-sm font-medium"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {quantity}
                  </span>
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-kid-primary text-white hover:bg-kid-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
                    onClick={() => handleUpdateQuantity(card.id, 1)}
                    aria-label={`Add one more copy of ${card.name}`}
                  >
                    <PlusIcon className="h-4 w-4" aria-hidden="true" />
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
