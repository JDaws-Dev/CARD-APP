'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import { CollectionGroupSkeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorBoundary';

interface CollectionCard {
  _id: string;
  cardId: string;
  quantity: number;
}

interface CollectionViewProps {
  collection: CollectionCard[];
}

interface CardWithQuantity extends PokemonCard {
  quantity: number;
}

interface SetGroup {
  setId: string;
  setName: string;
  cards: CardWithQuantity[];
}

export function CollectionView({ collection }: CollectionViewProps) {
  const [cardData, setCardData] = useState<Map<string, PokemonCard>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch card data from Pokemon TCG API
  const fetchCards = useCallback(async () => {
    if (collection.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const cardIds = collection.map((c) => c.cardId);

      // Fetch cards from API
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch card data');
      }

      const cards: PokemonCard[] = await response.json();

      // Build a map for quick lookup
      const cardMap = new Map<string, PokemonCard>();
      cards.forEach((card) => cardMap.set(card.id, card));
      setCardData(cardMap);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError("We couldn't load your card images. This might be a network issue.");
    } finally {
      setIsLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  // Group cards by set
  const setGroups: SetGroup[] = [];
  const setMap = new Map<string, SetGroup>();

  collection.forEach((item) => {
    const card = cardData.get(item.cardId);
    if (card) {
      const setId = card.set.id;
      const setName = card.set.name;

      if (!setMap.has(setId)) {
        setMap.set(setId, {
          setId,
          setName,
          cards: [],
        });
      }

      setMap.get(setId)!.cards.push({
        ...card,
        quantity: item.quantity,
      });
    }
  });

  // Convert map to array and sort by set name
  setMap.forEach((group) => {
    // Sort cards within set by number
    group.cards.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
    setGroups.push(group);
  });

  // Sort sets alphabetically
  setGroups.sort((a, b) => a.setName.localeCompare(b.setName));

  if (isLoading) {
    // Show skeleton for estimated number of groups based on collection size
    const estimatedGroups = Math.min(Math.ceil(collection.length / 5), 3);
    return (
      <div className="space-y-8">
        {Array.from({ length: Math.max(estimatedGroups, 1) }).map((_, i) => (
          <CollectionGroupSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorFallback title="Couldn't load cards" message={error} onReset={handleRetry} />;
  }

  return (
    <div className="space-y-8">
      {setGroups.map((group) => (
        <div key={group.setId} className="rounded-xl bg-white p-6 shadow-sm">
          {/* Set Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Link
                href={`/sets/${group.setId}`}
                className="text-xl font-bold text-gray-800 hover:text-kid-primary"
              >
                {group.setName}
              </Link>
              <p className="text-sm text-gray-500">
                {group.cards.length} unique card{group.cards.length !== 1 ? 's' : ''} (
                {group.cards.reduce((sum, c) => sum + c.quantity, 0)} total)
              </p>
            </div>
            <Link
              href={`/sets/${group.setId}`}
              className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
            >
              View Set →
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {group.cards.map((card) => (
              <div
                key={card.id}
                className="group relative rounded-lg bg-gray-50 p-1.5 transition hover:shadow-md"
              >
                {/* Card Image */}
                <div className="relative aspect-[2.5/3.5] overflow-hidden rounded">
                  <Image
                    src={card.images.small}
                    alt={card.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 12vw"
                    className="object-contain"
                  />

                  {/* Quantity Badge */}
                  {card.quantity > 1 && (
                    <div className="absolute left-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow">
                      x{card.quantity}
                    </div>
                  )}
                </div>

                {/* Card Name */}
                <p className="mt-1 truncate text-center text-xs font-medium text-gray-700">
                  {card.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
