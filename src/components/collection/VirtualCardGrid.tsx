'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { CardImage } from '@/components/ui/CardImage';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import { isPromoCard, getPromoSetLabel, type PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  HeartIcon,
  StarIcon as StarIconOutline,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  TrophyIcon,
  StarIcon as StarIconSolid,
  CurrencyDollarIcon,
  SparklesIcon,
  CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/solid';
import { MapIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CardGridSkeleton, StatsBarSkeleton } from '@/components/ui/Skeleton';
import {
  VariantBadgeGroup,
  VARIANT_CONFIG,
  type CardVariant,
} from '@/components/ui/VariantBadge';
import { IconLegend } from './IconLegend';
import { useLevelUp } from '@/components/gamification/LevelSystem';
import { useKidMode } from '@/components/providers/KidModeProvider';
import { useSetCompletionTracker } from '@/components/gamification/SetCompletionCelebration';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';

// Get available variants from a card's tcgplayer prices
function getAvailableVariants(card: PokemonCard): CardVariant[] {
  const prices = card.tcgplayer?.prices;
  if (!prices) return ['normal']; // Default to normal if no price data

  const variants: CardVariant[] = [];
  if (prices.normal) variants.push('normal');
  if (prices.holofoil) variants.push('holofoil');
  if (prices.reverseHolofoil) variants.push('reverseHolofoil');

  // If no variants found, default to normal
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

// Card Added Celebration Animation Component
function CardAddedCelebration({
  card,
  onAnimationEnd,
}: {
  card: PokemonCard;
  onAnimationEnd: () => void;
}) {
  // Handle click anywhere to dismiss
  const handleClick = useCallback(() => {
    onAnimationEnd();
  }, [onAnimationEnd]);

  // Handle escape key to dismiss
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onAnimationEnd();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onAnimationEnd]);

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50"
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} added to collection. Click to dismiss.`}
    >
      <div className="animate-just-pulled-pop relative">
        {/* Enlarged card image using imageLarge */}
        <div className="relative h-[420px] w-[300px] overflow-hidden rounded-xl shadow-2xl ring-4 ring-kid-success sm:h-[560px] sm:w-[400px]">
          <CardImage
            src={card.images.large || card.images.small}
            alt={card.name}
            fill
            className="object-contain"
          />
        </div>
        <div className="absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-kid-success text-white shadow-lg">
          <CheckIcon className="h-7 w-7" strokeWidth={3} />
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-kid-success px-5 py-2 text-base font-bold text-white shadow-lg">
          Added!
        </div>
        <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-white/80">
          Tap anywhere to close
        </p>
      </div>
    </div>
  );
}

// Card Close-Up Modal Component for detailed viewing
function CardCloseUpModal({
  card,
  onClose,
}: {
  card: PokemonCard;
  onClose: () => void;
}) {
  // Handle click anywhere to dismiss
  const handleClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key to dismiss
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/70"
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} close-up view. Click to dismiss.`}
    >
      <div className="relative">
        {/* Enlarged card image using imageLarge */}
        <div className="relative h-[420px] w-[300px] overflow-hidden rounded-xl shadow-2xl sm:h-[560px] sm:w-[400px]">
          <CardImage
            src={card.images.large || card.images.small}
            alt={card.name}
            fill
            className="object-contain"
            priority
          />
        </div>
        {/* Close hint */}
        <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-white/80">
          Tap anywhere to close
        </p>
      </div>
    </div>
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
          const config = VARIANT_CONFIG[variant];
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

// Threshold for enabling virtual scrolling (cards)
const VIRTUAL_SCROLL_THRESHOLD = 50;

// Estimated card dimensions for row calculation
const CARD_DIMENSIONS = {
  BASE_HEIGHT: 300, // Approximate height of a card item including padding and variant badges
  GAP: 32, // Grid gap in pixels (gap-8 = 2rem = 32px at md+ breakpoint)
};

// Helper to calculate columns based on viewport width (to match Tailwind responsive breakpoints)
function getColumnCount(viewportWidth: number, simplifiedLayout: boolean): number {
  if (simplifiedLayout) {
    if (viewportWidth >= 768) return 4; // md
    if (viewportWidth >= 640) return 3; // sm
    return 2;
  }
  // Standard card-grid breakpoints - must match Tailwind responsive classes
  if (viewportWidth >= 1280) return 6; // xl
  if (viewportWidth >= 1024) return 5; // lg
  if (viewportWidth >= 768) return 4; // md
  if (viewportWidth >= 640) return 3; // sm
  return 2;
}

interface VirtualCardGridProps {
  cards: PokemonCard[];
  setId: string;
  setName?: string;
}

export function VirtualCardGrid({ cards, setId, setName }: VirtualCardGridProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { showXPGain } = useLevelUp();
  const { features } = useKidMode();
  const { primaryGame } = useGameSelector();
  const parentRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  // State for variant selector popup
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(
    null
  );

  // State for card added celebration animation
  const [celebrationCard, setCelebrationCard] = useState<PokemonCard | null>(null);

  // State for card close-up modal
  const [closeUpCard, setCloseUpCard] = useState<PokemonCard | null>(null);

  // Convex queries and mutations
  const collection = useQuery(
    api.collections.getCollectionBySet,
    profileId ? { profileId: profileId as Id<'profiles'>, setId } : 'skip'
  );
  const wishlist = useQuery(
    api.wishlist.getWishlist,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
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

  // Track viewport width for responsive column calculation (must match Tailwind breakpoints)
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    // Set initial width
    setViewportWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate column count based on viewport width (to match Tailwind responsive breakpoints)
  const columnCount = useMemo(
    () => (viewportWidth > 0 ? getColumnCount(viewportWidth, features.simplifiedLayout) : 2),
    [viewportWidth, features.simplifiedLayout]
  );

  // Calculate overscan based on viewport - use more rows on mobile for smoother scrolling on slower devices
  const isMobile = viewportWidth > 0 && viewportWidth < 640;
  const overscanCount = isMobile ? 5 : 3;

  // Organize cards into rows
  const rows = useMemo(() => {
    const result: PokemonCard[][] = [];
    for (let i = 0; i < cards.length; i += columnCount) {
      result.push(cards.slice(i, i + columnCount));
    }
    return result;
  }, [cards, columnCount]);

  // Determine if we should use virtual scrolling
  const useVirtualScrolling = cards.length >= VIRTUAL_SCROLL_THRESHOLD;

  // Virtual row height calculation
  const estimateRowHeight = useCallback(() => {
    return CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;
  }, []);

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: overscanCount, // Render extra rows above and below viewport (5 on mobile, 3 on desktop)
  });

  // Build a map of owned cards for quick lookup
  const { ownedCards, ownedVariantsMap } = useMemo(() => {
    const cardsMap = new Map<string, number>();
    const variants = new Map<string, Map<CardVariant, number>>();

    if (collection) {
      collection.forEach((card) => {
        const variant = (card.variant ?? 'normal') as CardVariant;
        const currentTotal = cardsMap.get(card.cardId) ?? 0;
        cardsMap.set(card.cardId, currentTotal + card.quantity);

        if (!variants.has(card.cardId)) {
          variants.set(card.cardId, new Map());
        }
        const variantMap = variants.get(card.cardId)!;
        const currentVariantQty = variantMap.get(variant) ?? 0;
        variantMap.set(variant, currentVariantQty + card.quantity);
      });
    }

    return { ownedCards: cardsMap, ownedVariantsMap: variants };
  }, [collection]);

  // Build a map of wishlisted card IDs
  const wishlistedCards = useMemo(() => {
    const map = new Map<string, boolean>();
    if (wishlist) {
      wishlist.forEach((item) => {
        map.set(item.cardId, item.isPriority ?? false);
      });
    }
    return map;
  }, [wishlist]);

  // Build a Set of newly added card IDs
  const newlyAddedCardIds = useMemo(() => {
    const set = new Set<string>();
    if (newlyAddedCardsData?.cards) {
      newlyAddedCardsData.cards.forEach((card) => {
        set.add(card.cardId);
      });
    }
    return set;
  }, [newlyAddedCardsData]);

  // Card click handler
  const handleCardClick = useCallback(
    (card: PokemonCard, event: React.MouseEvent) => {
      if (!profileId) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const availableVariants = getAvailableVariants(card);
      const isNewCard = !ownedCards.has(card.id);

      // In simplified mode (young kids), skip variant selector entirely
      if (!features.showVariantSelector) {
        if (isNewCard) {
          addCard({
            profileId: profileId as Id<'profiles'>,
            cardId: card.id,
            cardName: card.name,
            setName,
            variant: availableVariants[0],
          });
          setCelebrationCard(card);
          showXPGain(2, 'New card!');
        } else {
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
        setCelebrationCard(card);
        showXPGain(2, 'New card!');
        return;
      }

      // Show variant selector
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        setSelectorPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
      } else {
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
      if (isNewCard) {
        // Find the card for celebration animation
        const cardForCelebration = cards.find((c) => c.id === cardId);
        if (cardForCelebration) {
          setCelebrationCard(cardForCelebration);
        }
        showXPGain(2, 'New card!');
      }
    },
    [profileId, addCard, setName, ownedCards, showXPGain, cards]
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

  const handleToggleWishlist = async (card: PokemonCard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    if (wishlistedCards.has(card.id)) {
      await removeFromWishlist({
        profileId: profileId as Id<'profiles'>,
        cardId: card.id,
      });
    } else {
      await addToWishlist({
        profileId: profileId as Id<'profiles'>,
        cardId: card.id,
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

  // Track set completion and check set completion achievements
  useSetCompletionTracker({
    profileId,
    setId,
    setName: setName ?? 'Set',
    totalCardsInSet: totalCount,
    ownedCount,
  });

  // Loading state
  if (profileLoading || collection === undefined) {
    return (
      <div>
        <StatsBarSkeleton />
        <CardGridSkeleton count={cards.length > 0 ? Math.min(cards.length, 20) : 20} />
      </div>
    );
  }

  // Card item renderer
  const renderCard = (card: PokemonCard) => {
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
        data-card-id={card.id}
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
            loading="lazy"
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

          {/* Wishlist Heart Button */}
          <button
            className={cn(
              'absolute bottom-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1',
              isWishlisted ? 'right-9' : 'right-1',
              isWishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-gray-400 opacity-0 hover:bg-white hover:text-rose-500 group-hover:opacity-100'
            )}
            onClick={(e) => handleToggleWishlist(card, e)}
            aria-label={
              isWishlisted ? `Remove ${card.name} from wishlist` : `Add ${card.name} to wishlist`
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

          {/* Magnifying Glass Button for close-up view */}
          <button
            className="absolute bottom-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-400 opacity-0 shadow-md transition-all hover:bg-white hover:text-kid-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setCloseUpCard(card);
            }}
            aria-label={`View ${card.name} close-up`}
            title="View close-up"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" aria-hidden={true} />
          </button>
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
              className={cn('text-gray-500', features.largerTouchTargets ? 'text-sm' : 'text-xs')}
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

        {/* Variant Indicator Badges - Show all available variants, colored if owned, grayed if not */}
        {features.showVariantSelector && (
          <VariantBadgeGroup
            availableVariants={getAvailableVariants(card)}
            ownedVariants={ownedVariantsMap.get(card.id) ?? new Map()}
            className="mt-1"
            onBadgeClick={(variant, isOwned) => {
              if (!profileId) return;

              if (!isOwned) {
                // Gray badge clicked - add this variant directly
                const isNewCard = !ownedCards.has(card.id);
                handleAddVariant(card.id, card.name, variant);
                if (isNewCard) {
                  setCelebrationCard(card);
                }
              } else {
                // Lit badge clicked - open variant selector for view/manage
                const isMobile = window.innerWidth < 640;
                const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
                const rect = cardElement?.getBoundingClientRect();

                if (isMobile || !rect) {
                  setSelectorPosition({
                    top: window.innerHeight / 2,
                    left: window.innerWidth / 2,
                  });
                } else {
                  setSelectorPosition({
                    top: rect.top + rect.height / 2,
                    left: rect.left + rect.width / 2,
                  });
                }
                setSelectedCard(card);
              }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Collection Progress Bar */}
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Collection Progress</span>
          <span className="text-lg font-bold text-kid-primary">
            {ownedCount} / {totalCount} cards
          </span>
        </div>
        <div className="progress-bar mt-2">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        {ownedCount === 0 && (
          <p className="mt-2 text-center text-sm text-gray-500">
            Start tapping cards below to add them to your collection!
          </p>
        )}
      </div>

      {/* Stats Bar */}
      <div className="mb-4 rounded-xl bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Stats */}
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-kid-primary sm:text-2xl">{ownedCount}</div>
              <div className="text-xs text-gray-500">Owned</div>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="text-center">
              <div className="text-xl font-bold text-gray-400 sm:text-2xl">
                {totalCount - ownedCount}
              </div>
              <div className="text-xs text-gray-500">Needed</div>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="text-center">
              <div className="text-xl font-bold text-kid-secondary sm:text-2xl">
                {progressPercent}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>

          {/* Progress and Priority */}
          <div className="flex w-full flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-3 sm:w-auto sm:justify-end sm:gap-4 sm:border-0 sm:pt-0">
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
                    <GlobeAltIcon className="h-5 w-5" />
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

            {/* Icon Help Legend */}
            <IconLegend />
          </div>
        </div>
      </div>

      {/* Virtual Scroll Indicator */}
      {useVirtualScrolling && (
        <div className="mb-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <BoltIcon className="h-3 w-3" aria-hidden="true" />
          <span>Optimized scrolling for {cards.length} cards</span>
        </div>
      )}

      {/* Card Grid Container */}
      <div
        ref={parentRef}
        className={cn(
          'relative w-full min-w-0',
          useVirtualScrolling && 'h-[600px] overflow-auto rounded-xl'
        )}
        role="grid"
        aria-label={`Card collection grid with ${cards.length} cards`}
      >
        {useVirtualScrolling ? (
          // Virtual scrolling mode
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  role="row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    'grid gap-5 px-1 sm:gap-6 md:gap-8',
                    features.simplifiedLayout
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  )}
                >
                  {row.map((card) => renderCard(card))}
                </div>
              );
            })}
          </div>
        ) : (
          // Standard grid mode (no virtualization for small collections)
          <div
            className={cn(
              features.simplifiedLayout
                ? 'grid grid-cols-2 gap-5 px-1 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 md:gap-8'
                : 'card-grid'
            )}
          >
            {cards.map((card) => renderCard(card))}
          </div>
        )}
      </div>

      {/* Variant Selector Popup */}
      {selectedCard && selectorPosition && (
        <>
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

      {/* Card Added Celebration Animation */}
      {celebrationCard && (
        <CardAddedCelebration
          card={celebrationCard}
          onAnimationEnd={() => setCelebrationCard(null)}
        />
      )}

      {/* Card Close-Up Modal */}
      {closeUpCard && (
        <CardCloseUpModal
          card={closeUpCard}
          onClose={() => setCloseUpCard(null)}
        />
      )}
    </div>
  );
}

// Export helper function for use in other components
export { VIRTUAL_SCROLL_THRESHOLD };
