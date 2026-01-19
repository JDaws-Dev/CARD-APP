'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { CardImage } from '@/components/ui/CardImage';
import { TradeCelebration } from '@/components/trades/TradeCelebration';
import type { Id } from '../../../convex/_generated/dataModel';

type CardVariant = 'normal' | 'holofoil' | 'reverseHolofoil' | '1stEditionHolofoil' | '1stEditionNormal';

interface TradeCard {
  cardId: string;
  cardName: string;
  setName: string;
  imageSmall: string;
  quantity: number;
  variant: CardVariant;
  maxQuantity?: number; // For cards being given (from collection)
}

interface PrefilledCard {
  cardId: string;
  cardName: string;
  setName: string;
  imageSmall: string;
  variant: string; // Accepts any variant string (will be cast to CardVariant internally)
  maxQuantity?: number;
}

interface TradeLoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-fill "Cards I Gave" with this card (e.g., from CardDetailModal "Trade Away") */
  prefilledGiveCard?: PrefilledCard;
}

type FlowState = 'form' | 'submitting' | 'success' | 'error';
type SelectionMode = 'give' | 'receive';

const VARIANT_OPTIONS: { value: CardVariant; label: string; shortLabel: string }[] = [
  { value: 'normal', label: 'Normal', shortLabel: 'Norm' },
  { value: 'holofoil', label: 'Holofoil', shortLabel: 'Holo' },
  { value: 'reverseHolofoil', label: 'Reverse Holo', shortLabel: 'Rev' },
  { value: '1stEditionHolofoil', label: '1st Ed. Holo', shortLabel: '1st H' },
  { value: '1stEditionNormal', label: '1st Edition', shortLabel: '1st' },
];

interface SearchResult {
  id: string;
  name: string;
  set: { name: string };
  number: string;
  images: { small: string; large: string };
}

export function TradeLoggingModal({ isOpen, onClose, onSuccess, prefilledGiveCard }: TradeLoggingModalProps) {
  const { profileId } = useCurrentProfile();
  const { primaryGame } = useGameSelector();
  const logTrade = useMutation(api.trades.logTrade);

  // Collection data for "cards to give" selection (enriched with card details)
  const collectionData = useQuery(
    api.collections.getCollectionWithDetails,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
  const collection = collectionData?.cards;

  // Form state
  const [flowState, setFlowState] = useState<FlowState>('form');
  const [cardsGiven, setCardsGiven] = useState<TradeCard[]>([]);
  const [cardsReceived, setCardsReceived] = useState<TradeCard[]>([]);
  const [tradingPartner, setTradingPartner] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search state
  const [selectionMode, setSelectionMode] = useState<SelectionMode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>('normal');

  // Filter state for collection selector (Cards I Gave)
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [collectionSetFilter, setCollectionSetFilter] = useState('');

  // Filter state for search selector (Cards I Received)
  const [receiveSetFilter, setReceiveSetFilter] = useState('');

  // Available sets for filters
  const [availableSets, setAvailableSets] = useState<{ id: string; name: string }[]>([]);

  // Summary for success state
  const [tradeSummary, setTradeSummary] = useState<{
    cardsGivenCount: number;
    cardsReceivedCount: number;
  } | null>(null);

  // Card info for celebration animation (need to preserve across state changes)
  const [celebrationCards, setCelebrationCards] = useState<{
    given: { imageSmall: string; cardName: string }[];
    received: { imageSmall: string; cardName: string }[];
    partner?: string;
  } | null>(null);

  // Fetch available sets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/sets?game=${primaryGame.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setAvailableSets(data.data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          }
        })
        .catch(console.error);
    }
  }, [isOpen, primaryGame.id]);

  // Reset state when modal opens (and pre-fill if provided)
  useEffect(() => {
    if (isOpen) {
      setFlowState('form');
      setCardsReceived([]);
      setTradingPartner('');
      setErrorMessage(null);
      setSelectionMode(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedVariant('normal');
      setTradeSummary(null);
      setCelebrationCards(null);
      setCollectionSearchQuery('');
      setCollectionSetFilter('');
      setReceiveSetFilter('');

      // Pre-fill the "Cards I Gave" if a prefilled card was provided
      if (prefilledGiveCard) {
        setCardsGiven([
          {
            cardId: prefilledGiveCard.cardId,
            cardName: prefilledGiveCard.cardName,
            setName: prefilledGiveCard.setName,
            imageSmall: prefilledGiveCard.imageSmall,
            quantity: 1,
            variant: (prefilledGiveCard.variant as CardVariant) || 'normal',
            maxQuantity: prefilledGiveCard.maxQuantity,
          },
        ]);
      } else {
        setCardsGiven([]);
      }
    }
  }, [isOpen, prefilledGiveCard]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && flowState !== 'submitting') {
        if (selectionMode) {
          setSelectionMode(null);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, flowState, selectionMode, onClose]);

  // Search for cards (uses filter API when set is selected, search API otherwise)
  const handleSearch = useCallback(async () => {
    // At least one of searchQuery or receiveSetFilter must be provided
    if (!searchQuery.trim() && !receiveSetFilter) return;

    setIsSearching(true);
    try {
      let response: Response;

      if (receiveSetFilter || searchQuery.trim()) {
        // Use filter API which supports setId + name combination
        const params = new URLSearchParams({ game: primaryGame.id, limit: '20' });
        if (receiveSetFilter) params.set('setId', receiveSetFilter);
        if (searchQuery.trim()) params.set('name', searchQuery.trim());

        response = await fetch(`/api/filter?${params}`);
        if (!response.ok) throw new Error('Filter failed');
        const data = await response.json();
        // Transform filter API response to match search API format
        const cards = (data.data || []).map((card: { id: string; name: string; set: { id: string; name: string }; number: string; images: { small: string; large: string } }) => ({
          id: card.id,
          name: card.name,
          set: { name: card.set.name || card.set.id },
          number: card.number,
          images: card.images,
        }));
        setSearchResults(cards);
      } else {
        // Fallback to search API
        response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=20&game=${primaryGame.id}`
        );
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setSearchResults(data.cards || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, receiveSetFilter, primaryGame.id]);

  // Add card to give list (from collection)
  const handleAddCardToGive = useCallback(
    (card: TradeCard) => {
      const existing = cardsGiven.find(
        (c) => c.cardId === card.cardId && c.variant === card.variant
      );
      if (existing) {
        // Don't exceed max quantity
        if (existing.maxQuantity && existing.quantity >= existing.maxQuantity) {
          return;
        }
        setCardsGiven((prev) =>
          prev.map((c) =>
            c.cardId === card.cardId && c.variant === card.variant
              ? { ...c, quantity: c.quantity + 1 }
              : c
          )
        );
      } else {
        setCardsGiven((prev) => [...prev, { ...card, quantity: 1 }]);
      }
    },
    [cardsGiven]
  );

  // Add card to receive list (from search)
  const handleAddCardToReceive = useCallback(
    (searchResult: SearchResult) => {
      const newCard: TradeCard = {
        cardId: searchResult.id,
        cardName: searchResult.name,
        setName: searchResult.set.name,
        imageSmall: searchResult.images.small,
        quantity: 1,
        variant: selectedVariant,
      };

      const existing = cardsReceived.find(
        (c) => c.cardId === newCard.cardId && c.variant === newCard.variant
      );
      if (existing) {
        setCardsReceived((prev) =>
          prev.map((c) =>
            c.cardId === newCard.cardId && c.variant === newCard.variant
              ? { ...c, quantity: c.quantity + 1 }
              : c
          )
        );
      } else {
        setCardsReceived((prev) => [...prev, newCard]);
      }

      // Clear search after adding
      setSearchQuery('');
      setSearchResults([]);
    },
    [selectedVariant, cardsReceived]
  );

  // Update quantity for a card
  const handleUpdateQuantity = useCallback(
    (list: 'give' | 'receive', cardId: string, variant: CardVariant, delta: number) => {
      const setList = list === 'give' ? setCardsGiven : setCardsReceived;
      const cards = list === 'give' ? cardsGiven : cardsReceived;

      const card = cards.find((c) => c.cardId === cardId && c.variant === variant);
      if (!card) return;

      const newQuantity = card.quantity + delta;

      // Check max quantity for give list
      if (list === 'give' && card.maxQuantity && newQuantity > card.maxQuantity) {
        return;
      }

      if (newQuantity <= 0) {
        setList((prev) => prev.filter((c) => !(c.cardId === cardId && c.variant === variant)));
      } else {
        setList((prev) =>
          prev.map((c) =>
            c.cardId === cardId && c.variant === variant ? { ...c, quantity: newQuantity } : c
          )
        );
      }
    },
    [cardsGiven, cardsReceived]
  );

  // Remove card from list
  const handleRemoveCard = useCallback((list: 'give' | 'receive', cardId: string, variant: CardVariant) => {
    const setList = list === 'give' ? setCardsGiven : setCardsReceived;
    setList((prev) => prev.filter((c) => !(c.cardId === cardId && c.variant === variant)));
  }, []);

  // Submit trade
  const handleSubmit = useCallback(async () => {
    if (!profileId) {
      setErrorMessage('Please select a profile first');
      setFlowState('error');
      return;
    }

    if (cardsGiven.length === 0 && cardsReceived.length === 0) {
      setErrorMessage('Please add at least one card to the trade');
      return;
    }

    setFlowState('submitting');
    setErrorMessage(null);

    // Save card info for celebration animation before submitting
    setCelebrationCards({
      given: cardsGiven.map((c) => ({ imageSmall: c.imageSmall, cardName: c.cardName })),
      received: cardsReceived.map((c) => ({ imageSmall: c.imageSmall, cardName: c.cardName })),
      partner: tradingPartner.trim() || undefined,
    });

    try {
      const result = await logTrade({
        profileId: profileId as Id<'profiles'>,
        cardsGiven: cardsGiven.map((c) => ({
          cardId: c.cardId,
          quantity: c.quantity,
          variant: c.variant,
          cardName: c.cardName,
          setName: c.setName,
        })),
        cardsReceived: cardsReceived.map((c) => ({
          cardId: c.cardId,
          quantity: c.quantity,
          variant: c.variant,
          cardName: c.cardName,
          setName: c.setName,
        })),
        tradingPartner: tradingPartner.trim() || undefined,
      });

      setTradeSummary(result.summary);
      setFlowState('success');
      onSuccess?.();
    } catch (err) {
      console.error('Error logging trade:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to log trade. Please try again.');
      setFlowState('error');
    }
  }, [profileId, cardsGiven, cardsReceived, tradingPartner, logTrade, onSuccess]);

  // Get collection cards grouped by card ID for selection (with enriched data)
  const collectionCardsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        cardId: string;
        name: string;
        imageSmall: string;
        setId: string;
        variants: Map<string, number>;
        totalQuantity: number;
      }
    >();

    if (collection) {
      for (const card of collection) {
        const existing = map.get(card.cardId);
        const variant = card.variant ?? 'normal';
        if (existing) {
          existing.variants.set(variant, (existing.variants.get(variant) ?? 0) + card.quantity);
          existing.totalQuantity += card.quantity;
        } else {
          map.set(card.cardId, {
            cardId: card.cardId,
            name: card.name ?? card.cardId,
            imageSmall: card.imageSmall ?? '',
            setId: card.setId ?? card.cardId.split('-')[0],
            variants: new Map([[variant, card.quantity]]),
            totalQuantity: card.quantity,
          });
        }
      }
    }

    return map;
  }, [collection]);

  // Get unique sets from collection for filter dropdown
  const collectionSets = useMemo(() => {
    const sets = new Set<string>();
    collectionCardsMap.forEach((card) => {
      if (card.setId) sets.add(card.setId);
    });
    return Array.from(sets).sort();
  }, [collectionCardsMap]);

  // Filtered collection cards based on search and set filter
  const filteredCollectionCards = useMemo(() => {
    const cards = Array.from(collectionCardsMap.values());

    return cards.filter((card) => {
      // Filter by set
      if (collectionSetFilter && card.setId !== collectionSetFilter) {
        return false;
      }
      // Filter by name search
      if (collectionSearchQuery.trim()) {
        const query = collectionSearchQuery.toLowerCase().trim();
        if (!card.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [collectionCardsMap, collectionSetFilter, collectionSearchQuery]);

  // Calculate available quantity for a card (excluding already selected)
  const getAvailableQuantity = useCallback(
    (cardId: string, variant: CardVariant) => {
      const collectionCard = collectionCardsMap.get(cardId);
      if (!collectionCard) return 0;

      const totalInCollection = collectionCard.variants.get(variant) ?? 0;
      const alreadySelected = cardsGiven.find((c) => c.cardId === cardId && c.variant === variant);
      const selectedQuantity = alreadySelected?.quantity ?? 0;

      return totalInCollection - selectedQuantity;
    },
    [collectionCardsMap, cardsGiven]
  );

  if (!isOpen) return null;

  // Render collection cards for "give" selection - visual grid with images
  const renderCollectionSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Select from Your Collection</h3>
        <button
          onClick={() => {
            setSelectionMode(null);
            setSearchQuery('');
            setSearchResults([]);
            setCollectionSearchQuery('');
            setCollectionSetFilter('');
          }}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Done
        </button>
      </div>

      {/* Search and filter controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={collectionSearchQuery}
            onChange={(e) => setCollectionSearchQuery(e.target.value)}
            placeholder="Search by card name..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
          />
        </div>
        <select
          value={collectionSetFilter}
          onChange={(e) => setCollectionSetFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
        >
          <option value="">All Sets</option>
          {collectionSets.map((setId) => (
            <option key={setId} value={setId}>
              {availableSets.find((s) => s.id === setId)?.name || setId}
            </option>
          ))}
        </select>
      </div>

      {collection === undefined ? (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-kid-primary" />
        </div>
      ) : collection.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No cards in your collection yet.</p>
        </div>
      ) : filteredCollectionCards.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No cards match your search.</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {filteredCollectionCards.map((cardGroup) => {
              const variants = Array.from(cardGroup.variants.entries());
              return variants.map(([variant, quantity]) => {
                const available = getAvailableQuantity(cardGroup.cardId, variant as CardVariant);
                const isDisabled = available <= 0;
                const isSelected = cardsGiven.some(
                  (c) => c.cardId === cardGroup.cardId && c.variant === variant
                );

                return (
                  <button
                    key={`${cardGroup.cardId}-${variant}`}
                    onClick={() => {
                      if (isDisabled) return;
                      handleAddCardToGive({
                        cardId: cardGroup.cardId,
                        cardName: cardGroup.name,
                        setName: cardGroup.setId,
                        imageSmall: cardGroup.imageSmall,
                        quantity: 1,
                        variant: variant as CardVariant,
                        maxQuantity: quantity,
                      });
                    }}
                    disabled={isDisabled}
                    className={cn(
                      'group relative flex flex-col items-center rounded-lg border p-2 text-center transition',
                      isDisabled
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                        : isSelected
                          ? 'border-kid-primary bg-kid-primary/10 ring-2 ring-kid-primary'
                          : 'border-gray-200 hover:border-kid-primary hover:bg-kid-primary/5'
                    )}
                  >
                    {/* Card Image */}
                    <div className="relative mb-1 h-20 w-14 overflow-hidden rounded">
                      {cardGroup.imageSmall ? (
                        <CardImage
                          src={cardGroup.imageSmall}
                          alt={cardGroup.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-400">
                          No img
                        </div>
                      )}
                      {/* Selected checkmark overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-kid-primary/30">
                          <CheckIcon className="h-6 w-6 text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    {/* Card Name */}
                    <p className="line-clamp-2 text-xs font-medium leading-tight text-gray-900">
                      {cardGroup.name}
                    </p>

                    {/* Variant & Availability */}
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {VARIANT_OPTIONS.find((v) => v.value === variant)?.shortLabel ?? variant}
                      {' · '}
                      {available} left
                    </p>

                    {/* Add indicator */}
                    {!isDisabled && !isSelected && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kid-primary text-white opacity-0 transition group-hover:opacity-100">
                        <PlusIcon className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              });
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Render search for "receive" selection
  const renderSearchSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Search for Cards to Receive</h3>
        <button
          onClick={() => {
            setSelectionMode(null);
            setSearchQuery('');
            setSearchResults([]);
            setReceiveSetFilter('');
          }}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Done
        </button>
      </div>

      {/* Search input and set filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter card name..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
            autoFocus
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || (!searchQuery.trim() && !receiveSetFilter)}
          className="rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/90 disabled:opacity-50"
        >
          {isSearching ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Set filter dropdown */}
      <div>
        <select
          value={receiveSetFilter}
          onChange={(e) => setReceiveSetFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
        >
          <option value="">All Sets</option>
          {availableSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
            </option>
          ))}
        </select>
      </div>

      {/* Variant selector */}
      <div className="flex flex-wrap gap-2">
        {VARIANT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedVariant(option.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              selectedVariant === option.value
                ? 'bg-kid-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {option.shortLabel}
          </button>
        ))}
      </div>

      {/* Search results - visual grid matching collection selector style */}
      {searchResults.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {searchResults.map((card) => {
              const isSelected = cardsReceived.some(
                (c) => c.cardId === card.id && c.variant === selectedVariant
              );

              return (
                <button
                  key={card.id}
                  onClick={() => handleAddCardToReceive(card)}
                  className={cn(
                    'group relative flex flex-col items-center rounded-lg border p-2 text-center transition',
                    isSelected
                      ? 'border-kid-primary bg-kid-primary/10 ring-2 ring-kid-primary'
                      : 'border-gray-200 hover:border-kid-primary hover:bg-kid-primary/5'
                  )}
                >
                  {/* Card Image */}
                  <div className="relative mb-1 h-20 w-14 overflow-hidden rounded">
                    <CardImage
                      src={card.images.small}
                      alt={card.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    {/* Selected checkmark overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-kid-primary/30">
                        <CheckIcon className="h-6 w-6 text-white drop-shadow" />
                      </div>
                    )}
                  </div>

                  {/* Card Name */}
                  <p className="line-clamp-2 text-xs font-medium leading-tight text-gray-900">
                    {card.name}
                  </p>

                  {/* Set Info */}
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    {card.set.name} #{card.number}
                  </p>

                  {/* Add indicator */}
                  {!isSelected && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kid-primary text-white opacity-0 transition group-hover:opacity-100">
                      <PlusIcon className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
        <p className="text-center text-sm text-gray-500">No cards found.</p>
      )}
    </div>
  );

  // Render card list with images
  const renderCardList = (cards: TradeCard[], listType: 'give' | 'receive') => (
    <div className="space-y-2">
      {cards.map((card) => (
        <div
          key={`${card.cardId}-${card.variant}`}
          className="flex items-center gap-3 rounded-lg bg-gray-50 p-2"
        >
          {/* Card Image */}
          <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded">
            {card.imageSmall ? (
              <CardImage
                src={card.imageSmall}
                alt={card.cardName || card.cardId}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-[8px] text-gray-400">
                No img
              </div>
            )}
          </div>

          {/* Card Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{card.cardName || card.cardId}</p>
            <p className="text-xs text-gray-500">
              {card.setName && <span className="mr-1">{card.setName}</span>}
              {VARIANT_OPTIONS.find((v) => v.value === card.variant)?.shortLabel ?? card.variant}
            </p>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleUpdateQuantity(listType, card.cardId, card.variant, -1)}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{card.quantity}</span>
            <button
              onClick={() => handleUpdateQuantity(listType, card.cardId, card.variant, 1)}
              disabled={listType === 'give' && card.maxQuantity !== undefined && card.quantity >= card.maxQuantity}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRemoveCard(listType, card.cardId, card.variant)}
              className="ml-1 rounded-full p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Render form state
  const renderFormState = () => (
    <div className="space-y-6">
      {/* Selection mode view */}
      {selectionMode === 'give' && renderCollectionSelector()}
      {selectionMode === 'receive' && renderSearchSelector()}

      {/* Main form view */}
      {!selectionMode && (
        <>
          {/* Cards Given Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  -
                </span>
                Cards I Gave Away
              </h3>
              <button
                onClick={() => setSelectionMode('give')}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                <PlusIcon className="mr-1 inline h-4 w-4" />
                Add
              </button>
            </div>
            {cardsGiven.length > 0 ? (
              renderCardList(cardsGiven, 'give')
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">No cards selected yet</p>
              </div>
            )}
          </div>

          {/* Arrow divider */}
          <div className="flex justify-center">
            <ArrowsRightLeftIcon className="h-6 w-6 text-gray-400" />
          </div>

          {/* Cards Received Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                  +
                </span>
                Cards I Received
              </h3>
              <button
                onClick={() => setSelectionMode('receive')}
                className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 transition hover:bg-green-100"
              >
                <PlusIcon className="mr-1 inline h-4 w-4" />
                Add
              </button>
            </div>
            {cardsReceived.length > 0 ? (
              renderCardList(cardsReceived, 'receive')
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                <p className="text-sm text-gray-500">No cards selected yet</p>
              </div>
            )}
          </div>

          {/* Trading Partner */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <UserIcon className="h-4 w-4" />
              Trading Partner (optional)
            </label>
            <input
              type="text"
              value={tradingPartner}
              onChange={(e) => setTradingPartner(e.target.value)}
              placeholder="e.g., brother, friend at school, kid at park"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
              maxLength={50}
            />
          </div>

          {/* Error message */}
          {errorMessage && flowState === 'form' && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</div>
          )}

          {/* Summary */}
          {(cardsGiven.length > 0 || cardsReceived.length > 0) && (
            <div className="rounded-lg bg-gray-50 p-3 text-center text-sm">
              <span className="text-red-600">
                {cardsGiven.reduce((sum, c) => sum + c.quantity, 0)} cards out
              </span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-green-600">
                {cardsReceived.reduce((sum, c) => sum + c.quantity, 0)} cards in
              </span>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={cardsGiven.length === 0 && cardsReceived.length === 0}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition',
              cardsGiven.length === 0 && cardsReceived.length === 0
                ? 'cursor-not-allowed bg-gray-300'
                : 'bg-gradient-to-r from-kid-primary to-purple-500 hover:from-kid-primary/90 hover:to-purple-500/90'
            )}
          >
            Log Trade
          </button>
        </>
      )}
    </div>
  );

  // Render submitting state
  const renderSubmittingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <ArrowsRightLeftIcon className="h-16 w-16 animate-pulse text-kid-primary" />
      </div>
      <p className="mt-4 text-lg font-medium text-gray-900">Logging trade...</p>
    </div>
  );

  // Render success state with celebration animation
  const renderSuccessState = () => (
    <TradeCelebration
      cardsGivenCount={tradeSummary?.cardsGivenCount ?? 0}
      cardsReceivedCount={tradeSummary?.cardsReceivedCount ?? 0}
      cardsGiven={celebrationCards?.given ?? []}
      cardsReceived={celebrationCards?.received ?? []}
      tradingPartner={celebrationCards?.partner}
      onContinue={onClose}
      onLogAnother={() => {
        setFlowState('form');
        setCardsGiven([]);
        setCardsReceived([]);
        setTradingPartner('');
        setTradeSummary(null);
        setCelebrationCards(null);
      }}
    />
  );

  // Render error state
  const renderErrorState = () => (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
        </div>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">Oops!</h3>
      <p className="mb-4 text-gray-600">{errorMessage || 'Something went wrong.'}</p>
      <div className="flex gap-3">
        <button
          onClick={() => setFlowState('form')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Try Again
        </button>
        <button
          onClick={onClose}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Render content based on state
  const renderContent = () => {
    switch (flowState) {
      case 'form':
        return renderFormState();
      case 'submitting':
        return renderSubmittingState();
      case 'success':
        return renderSuccessState();
      case 'error':
        return renderErrorState();
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && flowState !== 'submitting') {
          if (selectionMode) {
            setSelectionMode(null);
            setSearchQuery('');
            setSearchResults([]);
          } else {
            onClose();
          }
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-6 w-6 text-kid-primary" />
            <h2 id="trade-modal-title" className="text-lg font-bold text-gray-800">
              {flowState === 'success' ? 'Trade Logged!' : 'Log a Trade'}
            </h2>
          </div>
          {flowState !== 'submitting' && (
            <button
              onClick={() => {
                if (selectionMode) {
                  setSelectionMode(null);
                  setSearchQuery('');
                  setSearchResults([]);
                } else {
                  onClose();
                }
              }}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
