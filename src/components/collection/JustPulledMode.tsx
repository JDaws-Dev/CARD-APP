'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { CardImage } from '@/components/ui/CardImage';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  XMarkIcon,
  SparklesIcon,
  CheckIcon,
  BoltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

// Get the default variant from a card's tcgplayer prices
function getDefaultVariant(card: PokemonCard): 'normal' | 'holofoil' | 'reverseHolofoil' {
  const prices = card.tcgplayer?.prices;
  if (!prices) return 'normal';

  // Prefer holofoil > reverseHolofoil > normal for Just Pulled (since pack pulls are often holos)
  if (prices.holofoil) return 'holofoil';
  if (prices.reverseHolofoil) return 'reverseHolofoil';
  return 'normal';
}

// Recently added card animation component
function AddedCard({ card, onAnimationEnd }: { card: PokemonCard; onAnimationEnd: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onAnimationEnd, 1500);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="animate-just-pulled-pop relative">
        <div className="relative h-64 w-44 overflow-hidden rounded-xl shadow-2xl ring-4 ring-kid-success">
          <CardImage src={card.images.small} alt={card.name} fill className="object-contain" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-kid-success text-white shadow-lg">
          <CheckIcon className="h-6 w-6" strokeWidth={3} />
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-kid-success px-4 py-1 text-sm font-bold text-white shadow-lg">
          Added!
        </div>
      </div>
    </div>
  );
}

// Stats counter component
function PullStats({ totalPulled, sessionCards }: { totalPulled: number; sessionCards: string[] }) {
  const uniqueCards = new Set(sessionCards).size;

  return (
    <div className="flex items-center gap-4 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <BoltIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
        <span className="font-bold text-white">{totalPulled}</span>
        <span className="text-sm text-gray-300">pulled</span>
      </div>
      <div className="h-4 w-px bg-white/30" />
      <div className="flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-cyan-400" aria-hidden="true" />
        <span className="font-bold text-white">{uniqueCards}</span>
        <span className="text-sm text-gray-300">unique</span>
      </div>
    </div>
  );
}

interface JustPulledModeProps {
  cards: PokemonCard[];
  setId: string;
  setName: string;
  onClose: () => void;
}

export function JustPulledMode({ cards, setId, setName, onClose }: JustPulledModeProps) {
  const { profileId } = useCurrentProfile();
  const [sessionCards, setSessionCards] = useState<string[]>([]);
  const [lastAddedCard, setLastAddedCard] = useState<PokemonCard | null>(null);
  const [showTip, setShowTip] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const collection = useQuery(
    api.collections.getCollectionBySet,
    profileId ? { profileId: profileId as Id<'profiles'>, setId } : 'skip'
  );
  const addCard = useMutation(api.collections.addCard);

  // Build a map of owned cards for quick lookup
  const ownedCards = useMemo(() => {
    const map = new Map<string, number>();
    if (collection) {
      collection.forEach((card) => {
        const currentQty = map.get(card.cardId) ?? 0;
        map.set(card.cardId, currentQty + card.quantity);
      });
    }
    return map;
  }, [collection]);

  // Count cards added this session
  const sessionCount = useMemo(() => {
    const counts = new Map<string, number>();
    sessionCards.forEach((cardId) => {
      counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
    });
    return counts;
  }, [sessionCards]);

  // Handle card tap - add card immediately without confirmation
  const handleCardTap = useCallback(
    async (card: PokemonCard) => {
      if (!profileId) return;

      const variant = getDefaultVariant(card);

      // Add to session tracking
      setSessionCards((prev) => [...prev, card.id]);

      // Show animation
      setLastAddedCard(card);

      // Add to collection
      try {
        await addCard({
          profileId: profileId as Id<'profiles'>,
          cardId: card.id,
          cardName: card.name,
          setName,
          variant,
        });
      } catch (error) {
        // Remove from session if add fails
        setSessionCards((prev) => prev.filter((id) => id !== card.id));
        console.error('Failed to add card:', error);
      }
    },
    [profileId, addCard, setName]
  );

  // Clear animation
  const handleAnimationEnd = useCallback(() => {
    setLastAddedCard(null);
  }, []);

  // Handle escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Dismiss tip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Reset session
  const handleReset = useCallback(() => {
    setSessionCards([]);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 overflow-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-black/40 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5">
            <BoltIcon className="h-5 w-5 text-white" aria-hidden="true" />
            <span className="text-sm font-bold text-white">Just Pulled</span>
          </div>
          <span className="hidden text-sm text-white/70 sm:block">{setName}</span>
        </div>

        <div className="flex items-center gap-3">
          <PullStats totalPulled={sessionCards.length} sessionCards={sessionCards} />
          {sessionCards.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Reset session counter"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Close Just Pulled mode"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tip Banner */}
      {showTip && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <InformationCircleIcon
              className="h-5 w-5 flex-shrink-0 text-cyan-400"
              aria-hidden="true"
            />
            <p className="text-sm text-white/90">
              <span className="font-semibold">Tap cards</span> to add them to your collection. Each
              tap adds one copy!
            </p>
          </div>
          <button
            onClick={() => setShowTip(false)}
            className="flex-shrink-0 text-white/50 hover:text-white"
            aria-label="Dismiss tip"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Card Grid - Larger cards for easy tapping */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {cards.map((card) => {
            const ownedQty = ownedCards.get(card.id) ?? 0;
            const sessionQty = sessionCount.get(card.id) ?? 0;
            const totalQty = ownedQty;
            const isOwned = totalQty > 0;

            return (
              <button
                key={card.id}
                onClick={() => handleCardTap(card)}
                className={cn(
                  'group relative aspect-[2.5/3.5] overflow-hidden rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95',
                  isOwned
                    ? 'shadow-lg shadow-kid-success/20 ring-2 ring-kid-success'
                    : 'opacity-80 hover:opacity-100 hover:shadow-lg'
                )}
                aria-label={`Add ${card.name} to collection${isOwned ? `, currently have ${totalQty}` : ''}`}
              >
                <CardImage
                  src={card.images.small}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 12.5vw"
                  className="object-contain"
                />

                {/* Owned indicator */}
                {isOwned && (
                  <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-success text-white shadow-md">
                    <CheckIcon className="h-4 w-4" strokeWidth={3} />
                  </div>
                )}

                {/* Quantity badge */}
                {totalQty > 0 && (
                  <div className="absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary px-1.5 text-xs font-bold text-white shadow-md">
                    x{totalQty}
                  </div>
                )}

                {/* Session add indicator - shows how many added this session */}
                {sessionQty > 0 && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                    <BoltIcon className="h-3 w-3" aria-hidden="true" />+{sessionQty}
                  </div>
                )}

                {/* Tap hint overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <SparklesIcon className="h-6 w-6 text-kid-primary" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Added Card Animation */}
      {lastAddedCard && <AddedCard card={lastAddedCard} onAnimationEnd={handleAnimationEnd} />}
    </div>
  );
}
