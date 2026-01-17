'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { CardImage } from '@/components/ui/CardImage';
import type { Id } from '../../../convex/_generated/dataModel';
import type { PokemonCard } from '@/lib/pokemon-tcg';

type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

interface CardScanResult {
  identified: boolean;
  cardName?: string;
  setName?: string | null;
  setCode?: string | null;
  cardNumber?: string;
  cardType?: string;
  rarity?: string | null;
  specialFeatures?: string[];
  edition?: string | null;
  inkColor?: string;
  confidence?: 'high' | 'medium' | 'low';
  funFact?: string;
  suggestedCardId?: string | null;
  error?: string;
}

interface SnapToAddFlowProps {
  /** The AI scan result to display */
  scanResult: CardScanResult;
  /** The captured image (for display) */
  capturedImage?: string;
  /** Called when user wants to scan another card */
  onScanAnother: () => void;
  /** Called when the flow is closed */
  onClose: () => void;
  /** Additional className for the container */
  className?: string;
}

type FlowState = 'confirm' | 'search' | 'adding' | 'success' | 'error';

interface SearchResult extends PokemonCard {
  // Extended with any additional fields we might need
}

const VARIANT_OPTIONS: { value: CardVariant; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'holofoil', label: 'Holofoil' },
  { value: 'reverseHolofoil', label: 'Reverse Holo' },
  { value: '1stEditionHolofoil', label: '1st Ed. Holo' },
  { value: '1stEditionNormal', label: '1st Edition' },
];

export function SnapToAddFlow({
  scanResult,
  capturedImage,
  onScanAnother,
  onClose,
  className,
}: SnapToAddFlowProps) {
  const { profileId } = useCurrentProfile();
  const addCard = useMutation(api.collections.addCard);

  const [flowState, setFlowState] = useState<FlowState>('confirm');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>('normal');
  const [addedCard, setAddedCard] = useState<{ name: string; setName: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize search query from scan result
  useEffect(() => {
    if (scanResult.cardName) {
      setSearchQuery(scanResult.cardName);
    }
  }, [scanResult.cardName]);

  // Detect variant from scan result
  useEffect(() => {
    if (scanResult.specialFeatures) {
      const features = scanResult.specialFeatures.map((f) => f.toLowerCase());
      if (features.some((f) => f.includes('reverse holo'))) {
        setSelectedVariant('reverseHolofoil');
      } else if (features.some((f) => f.includes('holo'))) {
        setSelectedVariant('holofoil');
      } else if (scanResult.edition?.toLowerCase().includes('1st')) {
        setSelectedVariant('1stEditionNormal');
      }
    }
  }, [scanResult.specialFeatures, scanResult.edition]);

  // Search for cards
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.cards || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Auto-search when entering search mode with a query
  useEffect(() => {
    if (flowState === 'search' && searchQuery.trim()) {
      handleSearch();
    }
  }, [flowState, searchQuery, handleSearch]);

  // Add card to collection
  const handleAddCard = useCallback(
    async (card: SearchResult) => {
      if (!profileId) {
        setErrorMessage('Please select a profile first');
        setFlowState('error');
        return;
      }

      setFlowState('adding');
      try {
        await addCard({
          profileId: profileId as Id<'profiles'>,
          cardId: card.id,
          cardName: card.name,
          setName: card.set.name,
          variant: selectedVariant,
          quantity: 1,
        });

        setAddedCard({ name: card.name, setName: card.set.name });
        setFlowState('success');
      } catch (err) {
        console.error('Error adding card:', err);
        setErrorMessage('Failed to add card. Please try again.');
        setFlowState('error');
      }
    },
    [profileId, addCard, selectedVariant]
  );

  // Handle confirming the AI-suggested card
  const handleConfirmSuggested = useCallback(async () => {
    if (!scanResult.suggestedCardId) {
      // No suggested card ID - go to search
      setFlowState('search');
      return;
    }

    if (!profileId) {
      setErrorMessage('Please select a profile first');
      setFlowState('error');
      return;
    }

    setFlowState('adding');
    try {
      await addCard({
        profileId: profileId as Id<'profiles'>,
        cardId: scanResult.suggestedCardId,
        cardName: scanResult.cardName,
        setName: scanResult.setName ?? undefined,
        variant: selectedVariant,
        quantity: 1,
      });

      setAddedCard({
        name: scanResult.cardName || 'Card',
        setName: scanResult.setName || 'Unknown Set',
      });
      setFlowState('success');
    } catch (err) {
      console.error('Error adding card:', err);
      setErrorMessage('Failed to add card. Please try again.');
      setFlowState('error');
    }
  }, [scanResult, profileId, addCard, selectedVariant]);

  // Confidence badge color
  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render different states
  const renderContent = () => {
    switch (flowState) {
      case 'confirm':
        return renderConfirmState();
      case 'search':
        return renderSearchState();
      case 'adding':
        return renderAddingState();
      case 'success':
        return renderSuccessState();
      case 'error':
        return renderErrorState();
      default:
        return null;
    }
  };

  const renderConfirmState = () => (
    <div className="space-y-4">
      {/* AI Result Display */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        {scanResult.identified ? (
          <div className="space-y-4">
            {/* Card Info Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kid-primary/10">
                <SparklesIcon className="h-5 w-5 text-kid-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">I found this card!</p>
                <h3 className="text-lg font-bold text-gray-900">{scanResult.cardName}</h3>
                {scanResult.setName && (
                  <p className="text-sm text-gray-600">{scanResult.setName}</p>
                )}
                {scanResult.cardNumber && (
                  <p className="text-xs text-gray-500">#{scanResult.cardNumber}</p>
                )}
              </div>
              {scanResult.confidence && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    getConfidenceColor(scanResult.confidence)
                  )}
                >
                  {scanResult.confidence}
                </span>
              )}
            </div>

            {/* Rarity and features */}
            {(scanResult.rarity || scanResult.specialFeatures?.length) && (
              <div className="flex flex-wrap gap-2">
                {scanResult.rarity && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                    {scanResult.rarity}
                  </span>
                )}
                {scanResult.specialFeatures?.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}

            {/* Fun Fact */}
            {scanResult.funFact && (
              <div className="rounded-lg bg-yellow-50 p-3">
                <p className="flex items-start gap-2 text-sm text-yellow-800">
                  <SparklesIcon className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                  {scanResult.funFact}
                </p>
              </div>
            )}

            {/* Variant Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Card Version</label>
              <div className="flex flex-wrap gap-2">
                {VARIANT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVariant(option.value)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition',
                      selectedVariant === option.value
                        ? 'bg-kid-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirmation Prompt */}
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="mb-4 text-sm font-medium text-gray-700">Is this your card?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmSuggested}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-success py-3 font-semibold text-white shadow-lg transition hover:bg-kid-success/90"
                >
                  <CheckIcon className="h-5 w-5" />
                  Yes, add it!
                </button>
                <button
                  onClick={() => setFlowState('search')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  No, search
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Not identified - show error and search option
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <ExclamationCircleIcon className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Could not identify card</h3>
              <p className="mt-1 text-sm text-gray-600">
                {scanResult.error || "Don't worry! You can search for it manually."}
              </p>
            </div>
            <button
              onClick={() => setFlowState('search')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Search for card
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderSearchState = () => (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Search for your card
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter card name..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/90 disabled:opacity-50"
          >
            {isSearching ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Variant Selection */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-gray-700">Card Version</label>
          <div className="flex flex-wrap gap-2">
            {VARIANT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedVariant(option.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition',
                  selectedVariant === option.value
                    ? 'bg-kid-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-gray-600">
            Found {searchResults.length} card{searchResults.length !== 1 ? 's' : ''}
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {searchResults.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition',
                  selectedCard?.id === card.id
                    ? 'border-kid-primary bg-kid-primary/5'
                    : 'border-gray-200 hover:border-kid-primary/50 hover:bg-gray-50'
                )}
              >
                <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                  <CardImage
                    src={card.images.small}
                    alt={card.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">{card.name}</p>
                  <p className="truncate text-sm text-gray-500">{card.set.name}</p>
                  <p className="text-xs text-gray-400">#{card.number}</p>
                </div>
                {selectedCard?.id === card.id && (
                  <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-kid-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Add Selected Card Button */}
          {selectedCard && (
            <button
              onClick={() => handleAddCard(selectedCard)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kid-success py-3 font-semibold text-white shadow-lg transition hover:bg-kid-success/90"
            >
              <PlusIcon className="h-5 w-5" />
              Add {selectedCard.name}
            </button>
          )}
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-gray-500">No cards found. Try a different search.</p>
        </div>
      )}

      {/* Back Button */}
      {scanResult.identified && (
        <button
          onClick={() => setFlowState('confirm')}
          className="w-full rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
        >
          Back to AI result
        </button>
      )}
    </div>
  );

  const renderAddingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <SparklesIcon className="h-16 w-16 animate-pulse text-kid-primary" />
        <div className="absolute inset-0 animate-spin">
          <ArrowPathIcon className="h-16 w-16 text-kid-primary/30" />
        </div>
      </div>
      <p className="mt-4 text-lg font-medium text-gray-900">Adding to collection...</p>
    </div>
  );

  const renderSuccessState = () => (
    <div className="rounded-xl bg-white p-6 text-center shadow-sm">
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-kid-success/10">
          <CheckCircleIcon className="h-12 w-12 text-kid-success" />
        </div>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">Card Added!</h3>
      {addedCard && (
        <div className="mb-4">
          <p className="font-medium text-gray-800">{addedCard.name}</p>
          <p className="text-sm text-gray-500">{addedCard.setName}</p>
          <span className="mt-2 inline-block rounded-full bg-kid-primary/10 px-3 py-1 text-sm font-medium text-kid-primary">
            {VARIANT_OPTIONS.find((v) => v.value === selectedVariant)?.label || 'Normal'}
          </span>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onScanAnother}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
        >
          <SparklesIcon className="h-5 w-5" />
          Scan Another
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

  const renderErrorState = () => (
    <div className="rounded-xl bg-white p-6 text-center shadow-sm">
      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
        </div>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">Oops!</h3>
      <p className="mb-4 text-gray-600">{errorMessage || 'Something went wrong.'}</p>
      <div className="flex gap-3">
        <button
          onClick={() => setFlowState('confirm')}
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

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">
            {flowState === 'success' ? 'Added!' : 'Add to Collection'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Captured Image Preview (if available) */}
      {capturedImage && flowState !== 'success' && (
        <div className="relative aspect-[4/3] w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedImage}
            alt="Captured card"
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-4">{renderContent()}</div>
    </div>
  );
}
