'use client';

import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CardImage } from '@/components/ui/CardImage';
import { api } from '../../../convex/_generated/api';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import {
  HeartIcon,
  StarIcon,
  LinkIcon,
  CheckIcon,
  TrashIcon,
  GiftIcon,
  ShareIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/solid';
import { BackLink } from '@/components/ui/BackLink';
import {
  HeartIcon as HeartIconOutline,
  StarIcon as StarIconOutline,
} from '@heroicons/react/24/outline';
import type { Id } from '../../../convex/_generated/dataModel';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExportWishlistButton } from '@/components/wishlist/ExportWishlist';
import {
  BudgetAlternatives,
  BudgetAlternativesBadge,
} from '@/components/financial/BudgetAlternatives';
import { IsItWorthItButton } from '@/components/financial/IsItWorthIt';
import { cn } from '@/lib/utils';
import { getCardPurchaseUrlWithAffiliate } from '@/lib/affiliateLinks';

interface WishlistItem {
  _id: Id<'wishlistCards'>;
  cardId: string;
  isPriority: boolean;
}

/**
 * Get the best available market price from a card's TCGPlayer prices
 */
function getCardMarketPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  return prices.normal?.market ?? prices.holofoil?.market ?? prices.reverseHolofoil?.market ?? null;
}

/**
 * Format price as currency string
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}k`;
  }
  if (price >= 100) {
    return `$${Math.round(price)}`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate the total estimated value of all wishlist cards
 */
function calculateWishlistTotal(cardData: Map<string, PokemonCard>): number {
  let total = 0;
  cardData.forEach((card) => {
    const price = getCardMarketPrice(card);
    if (price) {
      total += price;
    }
  });
  return total;
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
      <div className="mt-3 flex justify-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
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
        <div className="mb-8">
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats skeleton */}
        <div className="mx-auto mb-8 flex max-w-md justify-center gap-8 rounded-xl bg-white p-4 shadow-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-2 h-10 w-12" />
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Share link skeleton */}
        <div className="mx-auto mb-8 max-w-lg rounded-xl bg-white p-4 shadow-sm">
          <Skeleton className="mx-auto mb-2 h-5 w-32" />
          <Skeleton className="mx-auto h-10 w-full rounded-full" />
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
function EmptyWishlist() {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
        <HeartIconOutline className="h-10 w-10 text-rose-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-800">Your wishlist is empty</h2>
      <p className="mb-6 text-gray-500">
        Add cards you want by clicking the heart icon on any card while browsing sets.
      </p>
      <Link
        href="/sets"
        className="inline-flex items-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
      >
        Browse Sets
      </Link>
    </div>
  );
}

/**
 * Share link generator component
 */
function ShareLinkSection({ profileId }: { profileId: Id<'profiles'> }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const createShareLink = useMutation(api.wishlist.createShareLink);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const token = await createShareLink({ profileId, expiresInDays: 30 });
      const url = `${window.location.origin}/wishlist/${token}`;
      setShareUrl(url);
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="mx-auto mb-8 max-w-lg">
      <div className="rounded-xl bg-gradient-to-r from-rose-100 to-pink-100 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-center gap-2 text-rose-700">
          <ShareIcon className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">Share Your Wishlist</span>
        </div>

        {!shareUrl ? (
          <button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-semibold text-white transition hover:from-rose-600 hover:to-pink-600 disabled:opacity-50"
            aria-label="Generate shareable wishlist link"
          >
            <LinkIcon className="h-5 w-5" aria-hidden="true" />
            {isGenerating ? 'Generating...' : 'Generate Share Link'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 truncate bg-transparent text-sm text-gray-600 focus:outline-none"
                aria-label="Shareable wishlist link"
              />
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition',
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-rose-600">
              Link expires in 30 days. Share with family and friends!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Wishlist card component with management actions
 */
function WishlistCard({
  item,
  cardData,
  profileId,
  priorityCount,
  maxPriority,
  onShowAlternatives,
  gameSlug,
}: {
  item: WishlistItem;
  cardData?: PokemonCard;
  profileId: Id<'profiles'>;
  priorityCount: number;
  maxPriority: number;
  onShowAlternatives?: (card: PokemonCard) => void;
  gameSlug?: string;
}) {
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist);
  const togglePriority = useMutation(api.wishlist.togglePriority);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isTogglingPriority, setIsTogglingPriority] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeFromWishlist({ profileId, cardId: item.cardId });
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleTogglePriority = async () => {
    setIsTogglingPriority(true);
    try {
      await togglePriority({ profileId, cardId: item.cardId });
    } catch (err) {
      console.error('Failed to toggle priority:', err);
    } finally {
      setIsTogglingPriority(false);
    }
  };

  const canAddPriority = item.isPriority || priorityCount < maxPriority;

  if (!cardData) {
    return <WishlistCardSkeleton />;
  }

  // Get price for showing budget alternatives badge
  const price =
    cardData.tcgplayer?.prices?.normal?.market ??
    cardData.tcgplayer?.prices?.holofoil?.market ??
    cardData.tcgplayer?.prices?.reverseHolofoil?.market ??
    null;
  const showBudgetBadge = price !== null && price >= 5;

  return (
    <div
      className={cn(
        'relative rounded-xl bg-white p-3 shadow-sm transition-all',
        item.isPriority && 'ring-2 ring-amber-400 ring-offset-2'
      )}
    >
      {/* Priority Star Badge */}
      {item.isPriority && (
        <div className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-md">
          <StarIcon className="h-5 w-5 text-white" aria-hidden="true" />
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
        <p className="truncate text-xs text-gray-500">{cardData.set.name}</p>
      </div>

      {/* Financial Tools */}
      {showBudgetBadge && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {onShowAlternatives && (
            <BudgetAlternativesBadge card={cardData} onClick={() => onShowAlternatives(cardData)} />
          )}
          <IsItWorthItButton cardPrice={price} cardName={cardData.name} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 flex justify-center gap-2">
        <button
          onClick={handleTogglePriority}
          disabled={isTogglingPriority || (!item.isPriority && !canAddPriority)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full transition',
            item.isPriority
              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
              : canAddPriority
                ? 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500'
                : 'cursor-not-allowed bg-gray-50 text-gray-300'
          )}
          aria-label={item.isPriority ? 'Remove from most wanted' : 'Add to most wanted'}
          title={
            !canAddPriority && !item.isPriority
              ? `Max ${maxPriority} priority items`
              : item.isPriority
                ? 'Remove from most wanted'
                : 'Add to most wanted'
          }
        >
          {item.isPriority ? (
            <StarIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <StarIconOutline className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <a
          href={getCardPurchaseUrlWithAffiliate(cardData, gameSlug).affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition hover:bg-emerald-100 hover:text-emerald-600"
          aria-label="Buy on TCGPlayer"
          title="Buy on TCGPlayer"
        >
          <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
        </a>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition hover:bg-rose-100 hover:text-rose-500"
          aria-label="Remove from wishlist"
        >
          <TrashIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * My Wishlist page
 * Dedicated page to view all wishlisted cards, generate share link, manage priorities
 */
export default function MyWishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { primaryGame, isLoading: gameLoading } = useGameSelector();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch wishlist data filtered by primary game
  const wishlist = useQuery(
    api.wishlist.getWishlistByGame,
    profileId && !gameLoading
      ? { profileId: profileId as Id<'profiles'>, gameSlug: primaryGame.id as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana' }
      : 'skip'
  );

  const priorityData = useQuery(
    api.wishlist.getPriorityCount,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Mutations
  const addToWishlist = useMutation(api.wishlist.addToWishlist);

  // State for fetched card data
  const [cardData, setCardData] = useState<Map<string, PokemonCard>>(new Map());
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // State for budget alternatives modal
  const [alternativesCard, setAlternativesCard] = useState<PokemonCard | null>(null);

  // Fetch card details from API when wishlist loads
  useEffect(() => {
    if (!wishlist?.length) {
      setIsLoadingCards(false);
      return;
    }

    const fetchCardData = async () => {
      setIsLoadingCards(true);
      try {
        const cardIds = wishlist.map((item) => item.cardId);
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
  }, [wishlist]);

  // Build set of wishlisted card IDs for the alternatives component
  const wishlistedCardIds = useMemo(() => {
    const ids = new Set<string>();
    wishlist?.forEach((item) => ids.add(item.cardId));
    return ids;
  }, [wishlist]);

  // Handle adding alternative to wishlist
  const handleAddAlternativeToWishlist = useCallback(
    async (cardId: string) => {
      if (!profileId) return;
      try {
        await addToWishlist({ profileId: profileId as Id<'profiles'>, cardId });
      } catch (err) {
        console.error('Failed to add to wishlist:', err);
      }
    },
    [profileId, addToWishlist]
  );

  // Show loading while checking auth or if redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-pink-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-rose-400 border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (profileLoading || gameLoading || wishlist === undefined || priorityData === undefined) {
    return <WishlistPageSkeleton />;
  }

  // Sort wishlist: priority items first, then by card ID
  const sortedWishlist = [...(wishlist || [])].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.cardId.localeCompare(b.cardId);
  });

  const priorityCount = wishlist?.filter((item) => item.isPriority).length || 0;
  const totalCount = wishlist?.length || 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <BackLink href="/collection" withMargin>
            Back to Collection
          </BackLink>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg sm:h-16 sm:w-16">
                <GiftIcon className="h-7 w-7 text-white sm:h-8 sm:w-8" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">My {primaryGame.shortName} Wishlist</h1>
                <p className="text-sm text-gray-500 sm:text-base">
                  {primaryGame.shortName} cards you want to add to your collection
                </p>
              </div>
            </div>
            {totalCount > 0 && (
              <ExportWishlistButton
                wishlist={
                  wishlist?.map((item) => ({
                    cardId: item.cardId,
                    isPriority: item.isPriority,
                  })) || []
                }
                priorityCount={priorityCount}
                profileName="My Wishlist"
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mb-8 flex max-w-2xl flex-wrap justify-center gap-4 rounded-xl bg-white p-4 shadow-sm sm:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <HeartIcon className="h-5 w-5 text-rose-500" aria-hidden="true" />
              <span className="text-2xl font-bold text-gray-800">{totalCount}</span>
            </div>
            <p className="text-xs text-gray-500 sm:text-sm">Wanted Cards</p>
          </div>
          <div className="hidden w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <StarIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <span className="text-2xl font-bold text-gray-800">
                {priorityCount}/{priorityData?.max || 5}
              </span>
            </div>
            <p className="text-xs text-gray-500 sm:text-sm">Most Wanted</p>
          </div>
          <div className="hidden w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <CurrencyDollarIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span className="text-2xl font-bold text-gray-800">
                {isLoadingCards ? (
                  <span className="inline-block h-6 w-12 animate-pulse rounded bg-gray-200" />
                ) : (
                  formatPrice(calculateWishlistTotal(cardData))
                )}
              </span>
            </div>
            <p className="text-xs text-gray-500 sm:text-sm">Est. Total Value</p>
          </div>
          <div className="hidden w-px bg-gray-200 sm:block" aria-hidden="true" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <SparklesIcon className="h-5 w-5 text-purple-500" aria-hidden="true" />
              <span className="text-2xl font-bold text-gray-800">
                {priorityData?.remaining || 0}
              </span>
            </div>
            <p className="text-xs text-gray-500 sm:text-sm">Stars Left</p>
          </div>
        </div>

        {/* Share Link Section */}
        {profileId && totalCount > 0 && (
          <ShareLinkSection profileId={profileId as Id<'profiles'>} />
        )}

        {/* Wishlist Grid */}
        {totalCount === 0 ? (
          <EmptyWishlist />
        ) : (
          <>
            {/* Priority Section */}
            {priorityCount > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <StarIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  Most Wanted
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {sortedWishlist
                    .filter((item) => item.isPriority)
                    .map((item) => (
                      <WishlistCard
                        key={item._id}
                        item={item}
                        cardData={isLoadingCards ? undefined : cardData.get(item.cardId)}
                        profileId={profileId as Id<'profiles'>}
                        priorityCount={priorityCount}
                        maxPriority={priorityData?.max || 5}
                        onShowAlternatives={setAlternativesCard}
                        gameSlug={primaryGame.id}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Items Section */}
            {totalCount > priorityCount && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <HeartIcon className="h-5 w-5 text-rose-500" aria-hidden="true" />
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
                        profileId={profileId as Id<'profiles'>}
                        priorityCount={priorityCount}
                        maxPriority={priorityData?.max || 5}
                        onShowAlternatives={setAlternativesCard}
                        gameSlug={primaryGame.id}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Budget Alternatives Modal */}
        {alternativesCard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setAlternativesCard(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <BudgetAlternatives
                card={alternativesCard}
                onAddToWishlist={handleAddAlternativeToWishlist}
                wishlistedCardIds={wishlistedCardIds}
              />
              <button
                onClick={() => setAlternativesCard(null)}
                className="mt-3 w-full rounded-full bg-white/90 py-3 text-sm font-medium text-gray-600 transition hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
