'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CardImage } from '@/components/ui/CardImage';
import { api } from '../../../../convex/_generated/api';
import { HeartIcon, StarIcon, GiftIcon, LinkIcon, CheckIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { getGameInfo, type GameId } from '@/lib/gameSelector';
import { getCardPurchaseUrlWithAffiliate } from '@/lib/affiliateLinks';

interface WishlistItem {
  _id: string;
  cardId: string;
  isPriority: boolean;
  gameSlug?: string;
}

interface WishlistData {
  profileName: string;
  wishlist: WishlistItem[];
}

/**
 * Skeleton loader for wishlist cards
 */
function WishlistCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="mx-auto h-4 w-3/4" />
        <Skeleton className="mx-auto h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for the entire wishlist page
 */
function WishlistPageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-8 w-64" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>

        {/* Stats skeleton */}
        <div className="mx-auto mb-8 flex max-w-md justify-center gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-2 h-10 w-12" />
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <WishlistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * Empty state when wishlist has no cards
 */
function EmptyWishlist({ profileName }: { profileName: string }) {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <HeartIconOutline className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-800">No items yet</h2>
      <p className="text-gray-500">{profileName}&apos;s wishlist is empty. Check back later!</p>
    </div>
  );
}

/**
 * Expired or invalid link state
 */
function InvalidLink() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-pink-50 p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
          <LinkIcon className="h-10 w-10 text-rose-500" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-800">Link expired or invalid</h1>
        <p className="mb-6 text-gray-500">
          This wishlist link may have expired or doesn&apos;t exist. Ask for a new link!
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
        >
          Go to CardDex
        </Link>
      </div>
    </main>
  );
}

/**
 * Wishlist card component with card image fetched from API
 */
function WishlistCard({ item, cardData, showGame }: { item: WishlistItem; cardData?: PokemonCard; showGame?: boolean }) {
  if (!cardData) {
    return <WishlistCardSkeleton />;
  }

  // Get game info for display if showing multi-game wishlist
  const gameInfo = showGame && item.gameSlug ? getGameInfo(item.gameSlug as GameId) : null;

  // Get purchase URL with affiliate tracking
  const purchaseUrl = getCardPurchaseUrlWithAffiliate(cardData, item.gameSlug).affiliateUrl;

  return (
    <div
      className={cn(
        'relative rounded-xl bg-white p-3 shadow-sm transition-all',
        item.isPriority && 'ring-2 ring-amber-400 ring-offset-2'
      )}
    >
      {/* Priority Star Badge */}
      {item.isPriority && (
        <div className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-md">
          <StarIcon className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
        <CardImage
          src={cardData.images.small}
          alt={cardData.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />
      </div>

      {/* Card Info */}
      <div className="mt-3 text-center">
        <p className="truncate text-sm font-medium text-gray-800">{cardData.name}</p>
        <p className="text-xs text-gray-500">{cardData.set.name}</p>
        {gameInfo && (
          <p className="mt-1 text-xs font-medium text-gray-400">{gameInfo.shortName}</p>
        )}
      </div>

      {/* Buy Button */}
      <div className="mt-3 flex justify-center">
        <a
          href={purchaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
          aria-label={`Buy ${cardData.name} on TCGPlayer`}
        >
          <ShoppingCartIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Buy
        </a>
      </div>
    </div>
  );
}

/**
 * Copy link button with feedback
 */
function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
        copied ? 'bg-kid-success text-white' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
      )}
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <LinkIcon className="h-4 w-4" />
          Copy Link
        </>
      )}
    </button>
  );
}

/**
 * Public wishlist view page
 * Shows a read-only, shareable view of someone's wishlist
 */
export default function PublicWishlistPage() {
  const params = useParams();
  const token = params.token as string;

  // Fetch wishlist data by share token
  const wishlistData = useQuery(api.wishlist.getWishlistByToken, { shareToken: token });

  // State for fetched card data
  const [cardData, setCardData] = useState<Map<string, PokemonCard>>(new Map());
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Determine if this is a multi-game wishlist (show game labels on cards)
  // This must be called before any early returns to follow React hooks rules
  const uniqueGames = useMemo(() => {
    if (!wishlistData?.wishlist) return new Set<string>();
    const games = new Set<string>();
    wishlistData.wishlist.forEach((item: WishlistItem) => {
      if (item.gameSlug) games.add(item.gameSlug);
    });
    return games;
  }, [wishlistData?.wishlist]);
  const isMultiGame = uniqueGames.size > 1;

  // Fetch card details from API when wishlist loads
  useEffect(() => {
    if (!wishlistData?.wishlist?.length) return;

    const fetchCardData = async () => {
      setIsLoadingCards(true);
      try {
        const cardIds = wishlistData.wishlist.map((item) => item.cardId);
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardIds }),
        });

        if (response.ok) {
          const result = await response.json();
          // API returns { data: [...cards...], ... } structure
          const cards: PokemonCard[] = result.data || [];
          const cardMap = new Map<string, PokemonCard>();
          cards.forEach((card) => cardMap.set(card.id, card));
          setCardData(cardMap);
        }
      } catch (err) {
        console.error('Failed to fetch card data:', err);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchCardData();
  }, [wishlistData]);

  // Loading state
  if (wishlistData === undefined) {
    return <WishlistPageSkeleton />;
  }

  // Invalid or expired link
  if (wishlistData === null) {
    return <InvalidLink />;
  }

  const { profileName, wishlist } = wishlistData as WishlistData;

  // Sort wishlist: priority items first, then by card ID
  const sortedWishlist = [...wishlist].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.cardId.localeCompare(b.cardId);
  });

  const priorityCount = wishlist.filter((item) => item.isPriority).length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg">
            <GiftIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">{profileName}&apos;s Wishlist</h1>
          <p className="mb-4 text-gray-500">Help make their collection complete!</p>
          <CopyLinkButton />
        </div>

        {/* Stats */}
        <div className="mx-auto mb-8 flex max-w-md justify-center gap-8 rounded-xl bg-white p-4 shadow-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <HeartIcon className="h-5 w-5 text-rose-500" />
              <span className="text-2xl font-bold text-gray-800">{wishlist.length}</span>
            </div>
            <p className="text-sm text-gray-500">Wanted Cards</p>
          </div>
          {priorityCount > 0 && (
            <>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <StarIcon className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl font-bold text-gray-800">{priorityCount}</span>
                </div>
                <p className="text-sm text-gray-500">Most Wanted</p>
              </div>
            </>
          )}
        </div>

        {/* Wishlist Grid */}
        {wishlist.length === 0 ? (
          <EmptyWishlist profileName={profileName} />
        ) : (
          <>
            {/* Priority Section */}
            {priorityCount > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <StarIcon className="h-5 w-5 text-amber-400" />
                  Most Wanted
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {sortedWishlist
                    .filter((item) => item.isPriority)
                    .map((item) => (
                      <WishlistCard
                        key={item._id}
                        item={item}
                        cardData={cardData.get(item.cardId)}
                        showGame={isMultiGame}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Items Section */}
            {wishlist.length > priorityCount && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <HeartIcon className="h-5 w-5 text-rose-500" />
                  {priorityCount > 0 ? 'Also Wanted' : 'Wishlist'}
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {sortedWishlist
                    .filter((item) => !item.isPriority)
                    .map((item) => (
                      <WishlistCard
                        key={item._id}
                        item={item}
                        cardData={isLoadingCards ? undefined : cardData.get(item.cardId)}
                        showGame={isMultiGame}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Purchase Disclaimer */}
        <div className="mx-auto mt-8 max-w-lg rounded-lg bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            Buy links connect to TCGPlayer, a third-party marketplace. Prices and availability may vary.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="mb-2 text-sm text-gray-400">Shared via</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold text-kid-primary hover:underline"
          >
            CardDex
          </Link>
        </div>
      </div>
    </main>
  );
}
