'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { ScannerButton } from '@/components/ai/ScannerButton';
import { SetDetailClient } from '@/components/collection/SetDetailClient';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { GAMES } from '@/lib/gameSelector';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

interface SetDetailPageProps {
  params: { setId: string };
}

export default function SetDetailPage({ params }: SetDetailPageProps) {
  const searchParams = useSearchParams();
  const gameSlug = (searchParams.get('game') || 'pokemon') as GameSlug;
  const game = GAMES.find((g) => g.id === gameSlug);

  // Get sets for this game to find the current set
  const sets = useQuery(api.dataPopulation.getSetsByGame, { gameSlug });

  // Get cards for this set
  const cards = useQuery(api.dataPopulation.getCachedCardsInSet, {
    gameSlug,
    setId: params.setId,
  });

  // Debug logging
  console.log('[SetDetailPage] Query params:', { gameSlug, setId: params.setId });
  console.log('[SetDetailPage] cards result:', cards?.length ?? 'undefined', 'cards');
  console.log('[SetDetailPage] sets result:', sets?.length ?? 'undefined', 'sets');

  const currentSet = sets?.find((s) => s.setId === params.setId);
  const isLoading = sets === undefined || cards === undefined;

  // Transform cards to match the expected format
  const transformedCards = cards?.map((card) => {
    // Build prices object using stored availableVariants
    let prices: Record<string, { market: number }> | undefined;
    if (card.priceMarket !== undefined) {
      // Use the first available variant as the key, or fallback to 'normal'
      const variantKey = card.availableVariants?.[0] || 'normal';
      prices = { [variantKey]: { market: card.priceMarket } };
    }

    return {
      id: card.cardId,
      name: card.name,
      supertype: card.supertype,
      subtypes: card.subtypes,
      types: card.types,
      number: card.number,
      rarity: card.rarity,
      images: {
        small: card.imageSmall,
        large: card.imageLarge,
      },
      tcgplayer: card.tcgPlayerUrl
        ? {
            url: card.tcgPlayerUrl,
            prices,
          }
        : undefined,
      set: {
        id: card.setId,
        name: currentSet?.name || card.setId,
      },
      // Include availableVariants for downstream components that may need it
      availableVariants: card.availableVariants,
    };
  }) || [];

  // Transform set to match expected format
  const transformedSet = currentSet
    ? {
        id: currentSet.setId,
        name: currentSet.name,
        series: currentSet.series,
        printedTotal: currentSet.totalCards,
        total: currentSet.totalCards,
        releaseDate: currentSet.releaseDate,
        updatedAt: currentSet.releaseDate,
        images: {
          symbol: currentSet.symbolUrl || '',
          logo: currentSet.logoUrl || '',
        },
      }
    : null;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8 dark:from-slate-900 dark:to-slate-800">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="mb-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Skeleton className="h-16 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-6 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 md:gap-8 lg:grid-cols-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2.5/3.5] rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!currentSet || !transformedSet) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8 dark:from-slate-900 dark:to-slate-800">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl bg-white p-8 text-center shadow-md dark:bg-slate-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Set Not Found</h1>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Could not find set &quot;{params.setId}&quot; for {game?.name || gameSlug}.
            </p>
            <Link
              href={`/sets?game=${gameSlug}`}
              className="mt-4 inline-flex items-center gap-2 text-kid-primary hover:underline"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to {game?.name || 'Sets'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: `${game?.name || 'Browse'} Sets`, href: `/sets?game=${gameSlug}` },
            { label: currentSet.name },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Set Logo - skip for Yu-Gi-Oh! packaging images */}
            {transformedSet.images?.logo && gameSlug !== 'yugioh' ? (
              <Image
                src={transformedSet.images.logo}
                alt={currentSet.name}
                width={200}
                height={80}
                className="h-auto max-h-16 w-auto"
              />
            ) : (
              <div
                className={cn(
                  'flex h-16 w-32 items-center justify-center rounded-lg text-2xl font-bold text-white bg-gradient-to-br',
                  game?.gradientFrom || 'from-indigo-500',
                  game?.gradientTo || 'to-purple-500'
                )}
              >
                {currentSet.name.charAt(0)}
              </div>
            )}

            <div className="text-center sm:text-left">
              <h1
                className={cn(
                  'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  game?.gradientFrom || 'from-indigo-500',
                  game?.gradientTo || 'to-purple-500'
                )}
              >
                {currentSet.name}
              </h1>
              <p className="text-gray-500 dark:text-slate-400">{currentSet.series}</p>
            </div>

            {/* Set Symbol */}
            {transformedSet.images?.symbol && (
              <Image
                src={transformedSet.images.symbol}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10"
              />
            )}

            {/* Scanner Button */}
            <div className="sm:ml-auto">
              <ScannerButton variant="primary" label="Scan Card" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                Collection Progress
              </span>
              <span
                className={cn(
                  'text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  game?.gradientFrom || 'from-indigo-500',
                  game?.gradientTo || 'to-purple-500'
                )}
              >
                0 / {transformedCards.length || currentSet.totalCards} cards
              </span>
            </div>
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: '0%' }} />
            </div>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400">
              Start tapping cards below to add them to your collection!
            </p>
          </div>
        </div>

        {/* Empty state if no cards */}
        {transformedCards.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-md dark:bg-slate-800">
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
              No cards loaded for this set yet
            </p>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Card data for this set may still be loading. Check back soon!
            </p>
          </div>
        ) : (
          /* Card Grid with Rarity Filter */
          <SetDetailClient set={transformedSet} cards={transformedCards} />
        )}
      </div>
    </main>
  );
}
