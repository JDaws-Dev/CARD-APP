'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { CardImage } from '@/components/ui/CardImage';
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

interface TradeLoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

export function TradeLoggingModal({ isOpen, onClose, onSuccess }: TradeLoggingModalProps) {
  const { profileId } = useCurrentProfile();
  const { primaryGame } = useGameSelector();
  const logTrade = useMutation(api.trades.logTrade);

  // Collection data for "cards to give" selection
  const collection = useQuery(
    api.collections.getCollection,
    profileId ? { profileId: profileId as Id<'profiles'>, gameSlug: primaryGame.id } : 'skip'
  );

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

  // Summary for success state
  const [tradeSummary, setTradeSummary] = useState<{
    cardsGivenCount: number;
    cardsReceivedCount: number;
  } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFlowState('form');
      setCardsGiven([]);
      setCardsReceived([]);
      setTradingPartner('');
      setErrorMessage(null);
      setSelectionMode(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedVariant('normal');
      setTradeSummary(null);
    }
  }, [isOpen]);

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

  // Search for cards
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10&game=${primaryGame.id}`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.cards || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, primaryGame.id]);

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

  // Get collection cards grouped by card ID for selection
  const collectionCardsMap = new Map<
    string,
    { cardId: string; variants: Map<string, number>; totalQuantity: number }
  >();

  if (collection) {
    for (const card of collection) {
      const existing = collectionCardsMap.get(card.cardId);
      const variant = card.variant ?? 'normal';
      if (existing) {
        existing.variants.set(variant, (existing.variants.get(variant) ?? 0) + card.quantity);
        existing.totalQuantity += card.quantity;
      } else {
        collectionCardsMap.set(card.cardId, {
          cardId: card.cardId,
          variants: new Map([[variant, card.quantity]]),
          totalQuantity: card.quantity,
        });
      }
    }
  }

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

  // Render collection cards for "give" selection
  const renderCollectionSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Select from Your Collection</h3>
        <button
          onClick={() => {
            setSelectionMode(null);
            setSearchQuery('');
            setSearchResults([]);
          }}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Done
        </button>
      </div>

      {collection === undefined ? (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-kid-primary" />
        </div>
      ) : collection.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-6 text-center">
          <p className="text-gray-500">No cards in your collection yet.</p>
        </div>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {Array.from(collectionCardsMap.values()).map((cardGroup) => {
            const variants = Array.from(cardGroup.variants.entries());
            return variants.map(([variant, quantity]) => {
              const available = getAvailableQuantity(cardGroup.cardId, variant as CardVariant);
              const isDisabled = available <= 0;

              return (
                <button
                  key={`${cardGroup.cardId}-${variant}`}
                  onClick={() => {
                    if (isDisabled) return;
                    handleAddCardToGive({
                      cardId: cardGroup.cardId,
                      cardName: cardGroup.cardId.split('-').slice(1).join('-'),
                      setName: cardGroup.cardId.split('-')[0],
                      imageSmall: '',
                      quantity: 1,
                      variant: variant as CardVariant,
                      maxQuantity: quantity,
                    });
                  }}
                  disabled={isDisabled}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
                    isDisabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                      : 'border-gray-200 hover:border-kid-primary hover:bg-kid-primary/5'
                  )}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cardGroup.cardId}</p>
                    <p className="text-sm text-gray-500">
                      {VARIANT_OPTIONS.find((v) => v.value === variant)?.label ?? variant} - {available} available
                    </p>
                  </div>
                  {!isDisabled && <PlusIcon className="h-5 w-5 text-kid-primary" />}
                </button>
              );
            });
          })}
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
          }}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Done
        </button>
      </div>

      {/* Search input */}
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
          disabled={isSearching || !searchQuery.trim()}
          className="rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/90 disabled:opacity-50"
        >
          {isSearching ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Search'}
        </button>
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

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {searchResults.map((card) => (
            <button
              key={card.id}
              onClick={() => handleAddCardToReceive(card)}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-2 text-left transition hover:border-kid-primary hover:bg-kid-primary/5"
            >
              <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded">
                <CardImage
                  src={card.images.small}
                  alt={card.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{card.name}</p>
                <p className="truncate text-xs text-gray-500">{card.set.name} #{card.number}</p>
              </div>
              <PlusIcon className="h-5 w-5 flex-shrink-0 text-kid-primary" />
            </button>
          ))}
        </div>
      )}

      {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
        <p className="text-center text-sm text-gray-500">No cards found.</p>
      )}
    </div>
  );

  // Render card list
  const renderCardList = (cards: TradeCard[], listType: 'give' | 'receive') => (
    <div className="space-y-2">
      {cards.map((card) => (
        <div
          key={`${card.cardId}-${card.variant}`}
          className="flex items-center gap-2 rounded-lg bg-gray-50 p-2"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{card.cardName || card.cardId}</p>
            <p className="text-xs text-gray-500">
              {VARIANT_OPTIONS.find((v) => v.value === card.variant)?.shortLabel ?? card.variant}
            </p>
          </div>
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

  // Render success state
  const renderSuccessState = () => (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-kid-success/10">
          <CheckCircleIcon className="h-12 w-12 text-kid-success" />
        </div>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">Trade Logged!</h3>
      {tradeSummary && (
        <div className="mb-4">
          <p className="text-gray-600">
            {tradeSummary.cardsGivenCount > 0 && (
              <span className="text-red-600">{tradeSummary.cardsGivenCount} cards given</span>
            )}
            {tradeSummary.cardsGivenCount > 0 && tradeSummary.cardsReceivedCount > 0 && (
              <span className="text-gray-400"> | </span>
            )}
            {tradeSummary.cardsReceivedCount > 0 && (
              <span className="text-green-600">{tradeSummary.cardsReceivedCount} cards received</span>
            )}
          </p>
          {tradingPartner && (
            <p className="mt-1 text-sm text-gray-500">Traded with {tradingPartner}</p>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setFlowState('form');
            setCardsGiven([]);
            setCardsReceived([]);
            setTradingPartner('');
            setTradeSummary(null);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
        >
          <ArrowsRightLeftIcon className="h-5 w-5" />
          Log Another Trade
        </button>
        <button
          onClick={onClose}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
        >
          Done
        </button>
      </div>
    </div>
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
