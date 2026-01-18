'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { CardImage } from '@/components/ui/CardImage';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import { isPromoCard, getPromoSetLabel, type PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  HeartIcon,
  StarIcon as StarIconOutline,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  TrophyIcon,
  StarIcon as StarIconSolid,
  CurrencyDollarIcon,
  CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';
import { MapIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CardGridSkeleton, StatsBarSkeleton } from '@/components/ui/Skeleton';
import { IconLegend } from './IconLegend';
import { useLevelUp } from '@/components/gamification/LevelSystem';
import { useKidMode } from '@/components/providers/KidModeProvider';
import { useSetCompletionTracker } from '@/components/gamification/SetCompletionCelebration';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { CardFlipModal } from './FlippableCard';
import { getVariantConfig, type CardVariant } from '@/components/ui/VariantBadge';

// Get available variants from a card's availableVariants field or tcgplayer prices
// Now supports all game types (Pokemon, Yu-Gi-Oh, etc.)
function getAvailableVariants(card: PokemonCard): CardVariant[] {
  // First check availableVariants field (from cachedCards)
  // This works for all game types - Pokemon stores variant keys, Yu-Gi-Oh stores rarity variants
  if (card.availableVariants && card.availableVariants.length > 0) {
    // Accept all variants - the getVariantConfig function in VariantBadge handles display
    return card.availableVariants as CardVariant[];
  }

  // Fallback to tcgplayer prices (for Pokemon direct API calls)
  const prices = card.tcgplayer?.prices;
  if (!prices) return ['normal'];

  const variants: CardVariant[] = [];
  if (prices.normal) variants.push('normal');
  if (prices.holofoil) variants.push('holofoil');
  if (prices.reverseHolofoil) variants.push('reverseHolofoil');

  return variants.length > 0 ? variants : ['normal'];
}

// Get price for a specific variant
function getVariantPrice(card: PokemonCard, variant: CardVariant): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  switch (variant) {
    case 'normal':
      return prices.normal?.market ?? null;
    case 'holofoil':
      return prices.holofoil?.market ?? null;
    case 'reverseHolofoil':
      return prices.reverseHolofoil?.market ?? null;
    default:
      return null;
  }
}

// Helper function to get the best market price from a card's TCGPlayer prices
function getCardMarketPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  // Return the first available market price, preferring normal > holofoil > reverseHolofoil
  const marketPrice =
    prices.normal?.market ?? prices.holofoil?.market ?? prices.reverseHolofoil?.market ?? null;

  return marketPrice;
}

// Format price as currency string
function formatPrice(price: number): string {
  if (price < 10) {
    return `$${price.toFixed(2)}`;
  } else if (price < 100) {
    return `$${price.toFixed(1)}`;
  } else {
    return `$${Math.round(price)}`;
  }
}

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

// Variant selector popup component
interface VariantSelectorProps {
  card: PokemonCard;
  ownedVariants: Map<CardVariant, number>;
  setName?: string;
  onAddVariant: (cardId: string, cardName: string, variant: CardVariant) => Promise<void>;
  onRemoveVariant: (cardId: string, cardName: string, variant: CardVariant) => Promise<void>;
  onClose: () => void;
  position: { top: number; left: number };
}

function VariantSelector({
  card,
  ownedVariants,
  setName,
  onAddVariant,
  onRemoveVariant,
  onClose,
  position,
}: VariantSelectorProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const availableVariants = getAvailableVariants(card);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const totalOwned = Array.from(ownedVariants.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-labelledby="variant-selector-title"
      aria-modal="true"
      className="fixed z-50 w-64 rounded-xl bg-white p-3 shadow-2xl ring-1 ring-black/5"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 id="variant-selector-title" className="truncate text-sm font-semibold text-gray-800">
            {card.name}
          </h4>
          <p className="text-xs text-gray-500">
            #{card.number} {setName && `· ${setName}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
          aria-label="Close variant selector"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden={true} />
        </button>
      </div>

      {/* Total owned indicator */}
      {totalOwned > 0 && (
        <div
          className="mb-3 flex items-center gap-2 rounded-lg bg-kid-success/10 px-3 py-2"
          aria-live="polite"
        >
          <CheckCircleIcon className="h-4 w-4 text-kid-success" aria-hidden={true} />
          <span className="text-xs font-medium text-kid-success">{totalOwned} total owned</span>
        </div>
      )}

      {/* Variant list */}
      <div className="space-y-2" role="list" aria-label="Available card variants">
        {availableVariants.map((variant) => {
          const config = getVariantConfig(variant);
          const quantity = ownedVariants.get(variant) ?? 0;
          const price = getVariantPrice(card, variant);
          const Icon = config.icon;

          return (
            <div
              key={variant}
              role="listitem"
              className={cn(
                'flex items-center justify-between rounded-lg border-2 p-2 transition-colors',
                quantity > 0 ? 'border-kid-success bg-kid-success/5' : 'border-gray-100 bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white',
                    `${config.gradient}`
                  )}
                  aria-hidden={true}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{config.shortLabel}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{config.label}</p>
                  {price !== null && <p className="text-xs text-gray-600">${price.toFixed(2)}</p>}
                </div>
              </div>

              {/* Quantity controls */}
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label={`${config.label} quantity controls`}
              >
                <button
                  onClick={() => onRemoveVariant(card.id, card.name, variant)}
                  disabled={quantity === 0}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1',
                    quantity > 0
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'cursor-not-allowed bg-gray-50 text-gray-300'
                  )}
                  aria-label={`Remove one ${config.label} copy`}
                  aria-disabled={quantity === 0}
                >
                  <MinusIcon className="h-4 w-4" aria-hidden={true} />
                </button>
                <span
                  className="min-w-[1.5rem] text-center text-sm font-semibold text-gray-800"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {quantity}
                </span>
                <button
                  onClick={() => onAddVariant(card.id, card.name, variant)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-kid-primary text-white transition-colors hover:bg-kid-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
                  aria-label={`Add one ${config.label} copy`}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden={true} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Only 1 variant message */}
      {availableVariants.length === 1 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Only one variant available for this card
        </p>
      )}
    </div>
  );
}

// Sparkle icon component for "NEW" badge
function SparkleStarIcon({
  className,
  style,
  'aria-hidden': ariaHidden,
}: {
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean;
}) {
  return (
    <svg
      className={className}
      style={style}
      aria-hidden={ariaHidden}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
    </svg>
  );
}

interface CardGridProps {
  cards: PokemonCard[];
  setId: string;
  setName?: string;
}

export function CardGrid({ cards, setId, setName }: CardGridProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { showXPGain } = useLevelUp();
  const { features, isKidMode } = useKidMode();
  const { primaryGame } = useGameSelector();

  // State for variant selector popup
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(
    null
  );

  // State for card flip modal
  const [flipCard, setFlipCard] = useState<PokemonCard | null>(null);

  // Convex queries and mutations
  const collection = useQuery(
    api.collections.getCollectionBySet,
    profileId ? { profileId: profileId as Id<'profiles'>, setId } : 'skip'
  );
  const wishlist = useQuery(
    api.wishlist.getWishlist,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
  // Query for newly added cards (last 7 days)
  const newlyAddedCardsData = useQuery(
    api.collections.getNewlyAddedCards,
    profileId ? { profileId: profileId as Id<'profiles'>, days: 7 } : 'skip'
  );
  const addCard = useMutation(api.collections.addCard);
  const removeCard = useMutation(api.collections.removeCard);
  const addToWishlist = useMutation(api.wishlist.addToWishlist);
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist);
  const togglePriority = useMutation(api.wishlist.togglePriority);
  const priorityCount = useQuery(
    api.wishlist.getPriorityCount,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Build a map of owned cards for quick lookup (cardId -> total quantity)
  // Also build a map of owned variants per card (cardId -> Map<variant, quantity>)
  const { ownedCards, ownedVariantsMap } = useMemo(() => {
    const cards = new Map<string, number>();
    const variants = new Map<string, Map<CardVariant, number>>();

    if (collection) {
      collection.forEach((card) => {
        const variant = (card.variant ?? 'normal') as CardVariant;
        const currentTotal = cards.get(card.cardId) ?? 0;
        cards.set(card.cardId, currentTotal + card.quantity);

        // Track per-variant quantities
        if (!variants.has(card.cardId)) {
          variants.set(card.cardId, new Map());
        }
        const variantMap = variants.get(card.cardId)!;
        const currentVariantQty = variantMap.get(variant) ?? 0;
        variantMap.set(variant, currentVariantQty + card.quantity);
      });
    }

    return { ownedCards: cards, ownedVariantsMap: variants };
  }, [collection]);

  // Build a map of wishlisted card IDs to their priority status for quick lookup
  const wishlistedCards = useMemo(() => {
    const map = new Map<string, boolean>();
    if (wishlist) {
      wishlist.forEach((item) => {
        map.set(item.cardId, item.isPriority ?? false);
      });
    }
    return map;
  }, [wishlist]);

  // Build a Set of newly added card IDs (last 7 days) for quick lookup
  const newlyAddedCardIds = useMemo(() => {
    const set = new Set<string>();
    if (newlyAddedCardsData?.cards) {
      newlyAddedCardsData.cards.forEach((card) => {
        set.add(card.cardId);
      });
    }
    return set;
  }, [newlyAddedCardsData]);

  // Open variant selector when clicking on a card
  const handleCardClick = useCallback(
    (card: PokemonCard, event: React.MouseEvent) => {
      if (!profileId) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const availableVariants = getAvailableVariants(card);
      const isNewCard = !ownedCards.has(card.id);

      // In simplified mode (young kids), skip variant selector entirely - just toggle the card
      if (!features.showVariantSelector) {
        if (isNewCard) {
          addCard({
            profileId: profileId as Id<'profiles'>,
            cardId: card.id,
            cardName: card.name,
            setName,
            variant: availableVariants[0],
          });
          showXPGain(2, 'New card!');
        } else {
          // In simplified mode, clicking an owned card removes it
          removeCard({
            profileId: profileId as Id<'profiles'>,
            cardId: card.id,
            cardName: card.name,
            setName,
            variant: availableVariants[0],
          });
        }
        return;
      }

      // If only one variant and card is not owned, add it directly
      if (availableVariants.length === 1 && isNewCard) {
        addCard({
          profileId: profileId as Id<'profiles'>,
          cardId: card.id,
          cardName: card.name,
          setName,
          variant: availableVariants[0],
        });
        // Show XP gain notification for new unique cards
        showXPGain(2, 'New card!');
        return;
      }

      // Show variant selector - centered on mobile, over card on desktop
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        // On mobile, show as centered modal
        setSelectorPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
      } else {
        // On desktop, center on the card
        setSelectorPosition({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2,
        });
      }
      setSelectedCard(card);
    },
    [profileId, ownedCards, addCard, removeCard, setName, showXPGain, features.showVariantSelector]
  );

  // Add variant handler
  const handleAddVariant = useCallback(
    async (cardId: string, cardName: string, variant: CardVariant) => {
      if (!profileId) return;
      const isNewCard = !ownedCards.has(cardId);
      await addCard({
        profileId: profileId as Id<'profiles'>,
        cardId,
        cardName,
        setName,
        variant,
      });
      // Show XP gain notification for new unique cards
      if (isNewCard) {
        showXPGain(2, 'New card!');
      }
    },
    [profileId, addCard, setName, ownedCards, showXPGain]
  );

  // Remove variant handler
  const handleRemoveVariant = useCallback(
    async (cardId: string, cardName: string, variant: CardVariant) => {
      if (!profileId) return;
      const currentQty = ownedVariantsMap.get(cardId)?.get(variant) ?? 0;
      if (currentQty <= 0) return;

      await removeCard({
        profileId: profileId as Id<'profiles'>,
        cardId,
        cardName,
        setName,
        variant,
      });
    },
    [profileId, removeCard, setName, ownedVariantsMap]
  );

  // Close variant selector
  const handleCloseSelector = useCallback(() => {
    setSelectedCard(null);
    setSelectorPosition(null);
  }, []);

  const handleToggleWishlist = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    if (wishlistedCards.has(cardId)) {
      await removeFromWishlist({ profileId: profileId as Id<'profiles'>, cardId });
    } else {
      await addToWishlist({
        profileId: profileId as Id<'profiles'>,
        cardId,
        gameSlug: primaryGame.id as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana',
      });
    }
  };

  const handleTogglePriority = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    await togglePriority({ profileId: profileId as Id<'profiles'>, cardId });
  };

  const ownedCount = ownedCards.size;
  const totalCount = cards.length;
  const progressPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  // Track set completion, trigger celebration at 100%, and check set completion achievements
  useSetCompletionTracker({
    profileId,
    setId,
    setName: setName ?? 'Set',
    totalCardsInSet: totalCount,
    ownedCount,
  });

  // Loading state with skeleton screens
  if (profileLoading || collection === undefined) {
    return (
      <div>
        <StatsBarSkeleton />
        <CardGridSkeleton count={cards.length > 0 ? Math.min(cards.length, 20) : 20} />
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div
        className="mb-4 rounded-xl bg-white p-3 shadow-sm sm:mb-6 sm:p-4"
        role="region"
        aria-label={`Set collection progress: ${ownedCount} of ${totalCount} cards owned, ${progressPercent}% complete`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Stats - Responsive grid on mobile, flex on larger screens */}
          <div
            className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-4"
            role="group"
            aria-label="Collection statistics"
          >
            <div className="text-center" role="group" aria-label={`Owned: ${ownedCount} cards`}>
              <div className="text-xl font-bold text-kid-primary sm:text-2xl" aria-hidden="true">
                {ownedCount}
              </div>
              <div className="text-xs text-gray-500" aria-hidden="true">
                Owned
              </div>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" aria-hidden="true" />
            <div
              className="text-center"
              role="group"
              aria-label={`Needed: ${totalCount - ownedCount} cards`}
            >
              <div className="text-xl font-bold text-gray-400 sm:text-2xl" aria-hidden="true">
                {totalCount - ownedCount}
              </div>
              <div className="text-xs text-gray-500" aria-hidden="true">
                Needed
              </div>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" aria-hidden="true" />
            <div className="text-center" role="group" aria-label={`${progressPercent}% complete`}>
              <div className="text-xl font-bold text-kid-secondary sm:text-2xl" aria-hidden="true">
                {progressPercent}%
              </div>
              <div className="text-xs text-gray-500" aria-hidden="true">
                Complete
              </div>
            </div>
          </div>

          {/* Progress and Priority - Wrap to new row on mobile */}
          <div className="flex w-full flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-3 sm:w-auto sm:justify-end sm:gap-4 sm:border-0 sm:pt-0">
            {/* Priority Stars Indicator */}
            {priorityCount && priorityCount.count > 0 && (
              <div
                className="flex items-center gap-1.5"
                role="status"
                aria-label={`${priorityCount.count} of ${priorityCount.max} priority slots used`}
              >
                <div className="flex items-center" aria-hidden="true">
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
                <span className="text-xs text-gray-500" aria-hidden="true">
                  Priority
                </span>
              </div>
            )}

            {/* Progress indicator */}
            {progressPercent >= 25 && (
              <div
                className="flex items-center gap-2"
                role="status"
                aria-label={`Collection rank: ${progressPercent >= 100 ? 'Set Champion' : progressPercent >= 75 ? 'Set Master' : progressPercent >= 50 ? 'Set Adventurer' : 'Set Explorer'}`}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm"
                  aria-hidden="true"
                >
                  {progressPercent >= 100 ? (
                    <CrownIcon className="h-5 w-5" />
                  ) : progressPercent >= 75 ? (
                    <TrophyIcon className="h-5 w-5" />
                  ) : progressPercent >= 50 ? (
                    <MapIcon className="h-5 w-5" />
                  ) : (
                    <GlobeAltIcon className="h-5 w-5" />
                  )}
                </span>
                <span className="text-sm font-medium text-gray-600" aria-hidden="true">
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

            {/* Icon Help Legend */}
            <IconLegend />
          </div>
        </div>
      </div>

      {/* Card Grid - Use larger grid for simplified mode */}
      <div
        className={cn(
          features.simplifiedLayout
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'
            : 'card-grid'
        )}
      >
        {cards.map((card) => {
          const isOwned = ownedCards.has(card.id);
          const quantity = ownedCards.get(card.id) || 0;
          const isWishlisted = wishlistedCards.has(card.id);
          const isPriority = wishlistedCards.get(card.id) ?? false;
          const canAddPriority = (priorityCount?.remaining ?? 0) > 0;
          const marketPrice = getCardMarketPrice(card);
          const isNewlyAdded = isOwned && newlyAddedCardIds.has(card.id);

          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              aria-label={`${card.name}, ${isOwned ? `owned ${quantity} copies` : 'not owned'}${isNewlyAdded ? ', newly added' : ''}${isWishlisted ? ', on wishlist' : ''}. ${features.simplifiedLayout ? `Tap to ${isOwned ? 'remove' : 'add'}` : `Click to ${isOwned ? 'manage' : 'add to collection'}`}`}
              className={cn(
                'group relative cursor-pointer rounded-xl bg-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                features.largerTouchTargets ? 'p-3' : 'p-2',
                isOwned
                  ? 'ring-2 ring-kid-success ring-offset-2'
                  : 'opacity-60 hover:opacity-100 hover:shadow-md',
                isNewlyAdded && 'animate-new-card-glow'
              )}
              onClick={(e) => handleCardClick(card, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(card, e as unknown as React.MouseEvent);
                }
              }}
            >
              {/* "NEW" Badge for recently added cards */}
              {isNewlyAdded && (
                <div
                  className="new-badge-shimmer absolute -right-1 -top-1 z-10 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-lg"
                  title="Added in the last 7 days"
                >
                  <SparkleStarIcon className="animate-sparkle h-3 w-3" aria-hidden={true} />
                  <span>NEW</span>
                  <SparkleStarIcon
                    className="animate-sparkle h-3 w-3"
                    aria-hidden={true}
                    style={{ animationDelay: '0.5s' }}
                  />
                </div>
              )}

              {/* Card Image */}
              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
                {/* Shimmer overlay for newly added cards */}
                {isNewlyAdded && (
                  <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-lg">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
                  </div>
                )}
                <CardImage
                  src={card.images.small}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-contain"
                  loading="lazy"
                />

                {/* Owned Checkmark */}
                {isOwned && (
                  <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-success text-white shadow-md">
                    <CheckIcon className="h-4 w-4" strokeWidth={3} />
                  </div>
                )}

                {/* Card Flip Button */}
                <button
                  className="absolute bottom-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-500 opacity-0 shadow-md transition-all hover:bg-white hover:text-kid-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipCard(card);
                  }}
                  aria-label={`Flip ${card.name} to see card back`}
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden={true} />
                </button>

                {/* Quantity Badge */}
                {quantity > 1 && (
                  <div className="absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow-md">
                    x{quantity}
                  </div>
                )}

                {/* Wishlist Heart Button */}
                <button
                  className={cn(
                    'absolute bottom-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1',
                    isWishlisted ? 'right-9' : 'right-1',
                    isWishlisted
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/90 text-gray-400 opacity-0 hover:bg-white hover:text-rose-500 group-hover:opacity-100'
                  )}
                  onClick={(e) => handleToggleWishlist(card.id, e)}
                  aria-label={
                    isWishlisted
                      ? `Remove ${card.name} from wishlist`
                      : `Add ${card.name} to wishlist`
                  }
                  aria-pressed={isWishlisted}
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-4 w-4" aria-hidden={true} />
                  ) : (
                    <HeartIcon className="h-4 w-4" aria-hidden={true} />
                  )}
                </button>

                {/* Priority Star Button - Only show when wishlisted */}
                {isWishlisted && (
                  <button
                    className={cn(
                      'absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                      isPriority
                        ? 'bg-amber-400 text-white'
                        : canAddPriority
                          ? 'bg-white/90 text-gray-400 hover:bg-amber-100 hover:text-amber-500'
                          : 'cursor-not-allowed bg-gray-100 text-gray-300'
                    )}
                    onClick={(e) => handleTogglePriority(card.id, e)}
                    disabled={!isPriority && !canAddPriority}
                    aria-label={
                      isPriority
                        ? `Remove ${card.name} from priority wishlist`
                        : `Mark ${card.name} as priority wishlist item`
                    }
                    aria-pressed={isPriority}
                    aria-disabled={!isPriority && !canAddPriority}
                    title={
                      isPriority
                        ? 'Remove from priority'
                        : canAddPriority
                          ? 'Mark as priority'
                          : `Max ${priorityCount?.max ?? 5} priority items`
                    }
                  >
                    {isPriority ? (
                      <StarIconSolid className="h-4 w-4" aria-hidden={true} />
                    ) : (
                      <StarIconOutline className="h-4 w-4" aria-hidden={true} />
                    )}
                  </button>
                )}

                {/* Variant Badges - Show available variants with owned/unowned styling */}
                {features.showVariantSelector && (() => {
                  const availableVariants = getAvailableVariants(card);
                  // Only show if there are multiple variants available
                  if (availableVariants.length <= 1) return null;
                  const cardOwnedVariants = ownedVariantsMap.get(card.id) ?? new Map<CardVariant, number>();

                  return (
                    <div
                      className="absolute bottom-1 left-10 flex items-center gap-0.5 sm:gap-1"
                      role="group"
                      aria-label={`Variant badges for ${card.name}`}
                    >
                      {availableVariants.map((variant) => {
                        const qty = cardOwnedVariants.get(variant) ?? 0;
                        const variantIsOwned = qty > 0;
                        const config = getVariantConfig(variant);

                        return (
                          <span
                            key={variant}
                            className={cn(
                              // Base styles with min touch target for mobile (24px recommended)
                              'inline-flex min-h-5 min-w-5 items-center justify-center rounded px-1 py-0.5 text-[10px] font-bold shadow-sm transition-all sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:text-xs',
                              variantIsOwned
                                ? `bg-gradient-to-r ${config.gradient} text-white`
                                : 'bg-white/80 text-gray-400 ring-1 ring-gray-300'
                            )}
                            title={
                              variantIsOwned
                                ? `${config.label} x${qty} (owned)`
                                : `${config.label} (not owned)`
                            }
                            aria-label={
                              variantIsOwned
                                ? `${config.label}: owned, quantity ${qty}`
                                : `${config.label}: not owned`
                            }
                          >
                            {config.shortLabel}
                            {variantIsOwned && qty > 1 && (
                              <span className="ml-0.5 text-white/80">x{qty}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Card Info */}
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    'truncate font-medium text-gray-800',
                    features.largerTouchTargets ? 'text-sm' : 'text-xs'
                  )}
                >
                  {card.name}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span
                    className={cn(
                      'text-gray-500',
                      features.largerTouchTargets ? 'text-sm' : 'text-xs'
                    )}
                  >
                    #{card.number}
                  </span>
                  {/* Promo badge for promotional cards */}
                  {isPromoCard(card) && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 px-1.5 py-0.5 text-xs font-semibold text-white"
                      title={getPromoSetLabel(card) || 'Promo card'}
                    >
                      <BoltIcon className="h-3 w-3" aria-hidden="true" />
                      <span>Promo</span>
                    </span>
                  )}
                  {/* Only show price if pricing is enabled in kid mode settings */}
                  {features.showPricing && marketPrice !== null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                        marketPrice >= 10
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'
                          : 'bg-emerald-100 text-emerald-700'
                      )}
                      title={`TCGPlayer market price: $${marketPrice.toFixed(2)}`}
                    >
                      <CurrencyDollarIcon className="h-3 w-3" />
                      {formatPrice(marketPrice).replace('$', '')}
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Variant Selector Popup with mobile backdrop */}
      {selectedCard && selectorPosition && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={handleCloseSelector} />
          <VariantSelector
            card={selectedCard}
            ownedVariants={ownedVariantsMap.get(selectedCard.id) ?? new Map()}
            setName={setName}
            onAddVariant={handleAddVariant}
            onRemoveVariant={handleRemoveVariant}
            onClose={handleCloseSelector}
            position={selectorPosition}
          />
        </>
      )}

      {/* Card Flip Modal */}
      {flipCard && (
        <CardFlipModal
          frontImage={flipCard.images.large || flipCard.images.small}
          cardName={flipCard.name}
          isOpen={!!flipCard}
          onClose={() => setFlipCard(null)}
        />
      )}
    </div>
  );
}
