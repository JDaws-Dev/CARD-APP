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

// Card data fetched from database with pricing info
interface FetchedCardData {
  id: string;
  name: string;
  setName: string;
  setId: string;
  number: string;
  rarity?: string;
  imageSmall: string;
  imageLarge: string;
  availableVariants: CardVariant[];
  variantPrices: Record<CardVariant, number | null>;
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

type FlowState = 'loading' | 'confirm' | 'search' | 'adding' | 'success' | 'error';

interface SearchResult extends PokemonCard {
  // Extended with any additional fields we might need
}

// All possible variant options with labels
const ALL_VARIANT_OPTIONS: { value: CardVariant; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'holofoil', label: 'Holofoil' },
  { value: 'reverseHolofoil', label: 'Reverse Holo' },
  { value: '1stEditionHolofoil', label: '1st Ed. Holo' },
  { value: '1stEditionNormal', label: '1st Edition' },
];

// Format price for display
function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '';
  return `$${price.toFixed(2)}`;
}

export function SnapToAddFlow({
  scanResult,
  capturedImage,
  onScanAnother,
  onClose,
  className,
}: SnapToAddFlowProps) {
  const { profileId } = useCurrentProfile();
  const addCard = useMutation(api.collections.addCard);

  // Start in loading state if we have a suggestedCardId to fetch
  const [flowState, setFlowState] = useState<FlowState>(
    scanResult.identified && scanResult.suggestedCardId ? 'loading' : 'confirm'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>('normal');
  const [addedCard, setAddedCard] = useState<{ name: string; setName: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetched card data from database (ensures "what you see is what you add")
  const [fetchedCard, setFetchedCard] = useState<FetchedCardData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Initialize search query from scan result
  useEffect(() => {
    if (scanResult.cardName) {
      setSearchQuery(scanResult.cardName);
    }
  }, [scanResult.cardName]);

  // Fetch actual card data when we have a suggestedCardId
  useEffect(() => {
    async function fetchCardData() {
      if (!scanResult.suggestedCardId || !scanResult.identified) {
        setFlowState('confirm');
        return;
      }

      try {
        // Fetch card data from our API
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardIds: [scanResult.suggestedCardId] }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch card data');
        }

        const data = await response.json();
        const card = data.data?.[0];

        if (!card) {
          // Card not found in database - fall back to AI info
          setFetchError('Card not found in database');
          setFlowState('confirm');
          return;
        }

        // Extract variant prices from tcgplayer data
        const prices = card.tcgplayer?.prices || {};
        const variantPrices: Record<CardVariant, number | null> = {
          normal: prices.normal?.market ?? null,
          holofoil: prices.holofoil?.market ?? null,
          reverseHolofoil: prices.reverseHolofoil?.market ?? null,
          '1stEditionHolofoil': prices['1stEditionHolofoil']?.market ?? null,
          '1stEditionNormal': prices['1stEditionNormal']?.market ?? null,
        };

        // Determine available variants (those with prices or explicitly listed)
        const availableVariants: CardVariant[] = [];
        // Check price keys first
        for (const [variant, price] of Object.entries(variantPrices)) {
          if (price !== null) {
            availableVariants.push(variant as CardVariant);
          }
        }
        // If no variants found from prices, default to normal
        if (availableVariants.length === 0) {
          availableVariants.push('normal');
        }

        const fetchedCardData: FetchedCardData = {
          id: card.id,
          name: card.name,
          setName: card.set?.name || scanResult.setName || 'Unknown Set',
          setId: card.set?.id || '',
          number: card.number || scanResult.cardNumber || '',
          rarity: card.rarity,
          imageSmall: card.images?.small || '',
          imageLarge: card.images?.large || '',
          availableVariants,
          variantPrices,
        };

        setFetchedCard(fetchedCardData);

        // Auto-select variant based on AI detection or first available
        let detectedVariant: CardVariant = 'normal';
        if (scanResult.specialFeatures) {
          const features = scanResult.specialFeatures.map((f) => f.toLowerCase());
          if (features.some((f) => f.includes('reverse holo')) && availableVariants.includes('reverseHolofoil')) {
            detectedVariant = 'reverseHolofoil';
          } else if (features.some((f) => f.includes('holo')) && availableVariants.includes('holofoil')) {
            detectedVariant = 'holofoil';
          } else if (scanResult.edition?.toLowerCase().includes('1st')) {
            if (availableVariants.includes('1stEditionHolofoil')) {
              detectedVariant = '1stEditionHolofoil';
            } else if (availableVariants.includes('1stEditionNormal')) {
              detectedVariant = '1stEditionNormal';
            }
          }
        }
        // Ensure selected variant is available
        if (!availableVariants.includes(detectedVariant)) {
          detectedVariant = availableVariants[0];
        }
        setSelectedVariant(detectedVariant);

        setFlowState('confirm');
      } catch (err) {
        console.error('Error fetching card data:', err);
        setFetchError('Could not verify card details');
        setFlowState('confirm');
      }
    }

    if (flowState === 'loading') {
      fetchCardData();
    }
  }, [scanResult, flowState]);

  // Detect variant from scan result (fallback when no fetched card)
  useEffect(() => {
    if (fetchedCard) return; // Skip if we have fetched card data

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
  }, [scanResult.specialFeatures, scanResult.edition, fetchedCard]);

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
    // Use fetched card data if available (ensures "what you see is what you add")
    const cardId = fetchedCard?.id || scanResult.suggestedCardId;
    const cardName = fetchedCard?.name || scanResult.cardName;
    const setName = fetchedCard?.setName || scanResult.setName;

    if (!cardId) {
      // No card ID - go to search
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
        cardId,
        cardName,
        setName: setName ?? undefined,
        variant: selectedVariant,
        quantity: 1,
      });

      setAddedCard({
        name: cardName || 'Card',
        setName: setName || 'Unknown Set',
      });
      setFlowState('success');
    } catch (err) {
      console.error('Error adding card:', err);
      setErrorMessage('Failed to add card. Please try again.');
      setFlowState('error');
    }
  }, [fetchedCard, scanResult, profileId, addCard, selectedVariant]);

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
      case 'loading':
        return renderLoadingState();
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

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <SparklesIcon className="h-16 w-16 animate-pulse text-kid-primary" />
        <div className="absolute inset-0 animate-spin">
          <ArrowPathIcon className="h-16 w-16 text-kid-primary/30" />
        </div>
      </div>
      <p className="mt-4 text-lg font-medium text-gray-900">Verifying card...</p>
      <p className="mt-1 text-sm text-gray-500">Finding the best match in our database</p>
    </div>
  );

  const renderConfirmState = () => {
    // Use fetched card data if available, otherwise fall back to scan result
    const cardName = fetchedCard?.name || scanResult.cardName;
    const setName = fetchedCard?.setName || scanResult.setName;
    const cardNumber = fetchedCard?.number || scanResult.cardNumber;
    const rarity = fetchedCard?.rarity || scanResult.rarity;
    const cardImage = fetchedCard?.imageSmall;

    // Get available variants - prefer fetched card data
    const availableVariants = fetchedCard?.availableVariants || ALL_VARIANT_OPTIONS.map(o => o.value);
    const variantOptions = ALL_VARIANT_OPTIONS.filter(opt => availableVariants.includes(opt.value));

    // Get current price based on selected variant
    const currentPrice = fetchedCard?.variantPrices[selectedVariant] ?? null;

    return (
      <div className="space-y-4">
        {/* AI Result Display */}
        <div className="rounded-xl bg-white p-4 shadow-sm">
          {scanResult.identified ? (
            <div className="space-y-4">
              {/* Card Info Header with Image */}
              <div className="flex items-start gap-4">
                {/* Card Image (from database) */}
                {cardImage && (
                  <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
                    <CardImage
                      src={cardImage}
                      alt={cardName || 'Card'}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                {!cardImage && (
                  <div className="flex h-24 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-kid-primary/10">
                    <SparklesIcon className="h-8 w-8 text-kid-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">
                    {fetchedCard ? 'Match found!' : 'I found this card!'}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{cardName}</h3>
                  {setName && (
                    <p className="text-sm text-gray-600 truncate">{setName}</p>
                  )}
                  {cardNumber && (
                    <p className="text-xs text-gray-500">#{cardNumber}</p>
                  )}
                </div>
                {scanResult.confidence && (
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                      getConfidenceColor(scanResult.confidence)
                    )}
                  >
                    {scanResult.confidence}
                  </span>
                )}
              </div>

              {/* Rarity and features */}
              {(rarity || scanResult.specialFeatures?.length) && (
                <div className="flex flex-wrap gap-2">
                  {rarity && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      {rarity}
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

              {/* Variant Selection with Prices */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Version
                  {currentPrice !== null && (
                    <span className="ml-2 text-kid-success font-semibold">
                      {formatPrice(currentPrice)}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {variantOptions.map((option) => {
                    const price = fetchedCard?.variantPrices[option.value] ?? null;
                    const isSelected = selectedVariant === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedVariant(option.value)}
                        className={cn(
                          'flex flex-col items-center rounded-lg px-3 py-2 text-sm font-medium transition border-2',
                          isSelected
                            ? 'bg-kid-primary text-white border-kid-primary'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-kid-primary/50 hover:bg-gray-100'
                        )}
                      >
                        <span>{option.label}</span>
                        {price !== null && (
                          <span className={cn(
                            'text-xs mt-0.5',
                            isSelected ? 'text-white/80' : 'text-green-600'
                          )}>
                            {formatPrice(price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fetch error warning */}
              {fetchError && !fetchedCard && (
                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-sm text-orange-700">
                    Note: Could not verify card details. Using AI identification.
                  </p>
                </div>
              )}

              {/* Confirmation Prompt */}
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="mb-4 text-sm font-medium text-gray-700">
                  {fetchedCard ? 'Add this card to your collection?' : 'Is this your card?'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmSuggested}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-success py-3 font-semibold text-white shadow-lg transition hover:bg-kid-success/90"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {currentPrice !== null ? `Add (${formatPrice(currentPrice)})` : 'Yes, add it!'}
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
  };

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
            {ALL_VARIANT_OPTIONS.map((option) => (
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
            {ALL_VARIANT_OPTIONS.find((v) => v.value === selectedVariant)?.label || 'Normal'}
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
