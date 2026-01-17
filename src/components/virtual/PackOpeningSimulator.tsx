'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/components/providers/ReducedMotionProvider';
import {
  SparklesIcon,
  XMarkIcon,
  GiftIcon,
  ArrowPathIcon,
  StarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';
import { LockClosedIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { usePackEffects } from '@/components/providers/PackEffectsProvider';

// Pack states
type PackState = 'sealed' | 'opening' | 'revealing' | 'revealed';

// Card reveal data
interface RevealedCard {
  cardId: string;
  name: string;
  imageSmall: string;
  rarity?: string;
  isRare: boolean;
  revealed: boolean;
}

// Rarity tiers for visual effects
const RARE_RARITIES = [
  'Rare Holo',
  'Rare Holo EX',
  'Rare Holo GX',
  'Rare Holo V',
  'Rare Holo VMAX',
  'Rare Holo VSTAR',
  'Rare Ultra',
  'Rare Secret',
  'Rare Rainbow',
  'Rare Shiny',
  'Amazing Rare',
  'Illustration Rare',
  'Special Art Rare',
  'Ultra Rare',
  'Secret Rare',
  'Hyper Rare',
  'Shiny Rare',
  'ACE SPEC Rare',
  'Double Rare',
  'Art Rare',
  'Super Rare',
];

// Pack opening constants
const CARDS_PER_PACK = 10;
const FREE_PACKS_PER_DAY = 2;
const PACK_RESET_HOUR = 0; // Midnight

// ============================================================================
// HELPER HOOKS
// ============================================================================

function usePacksRemaining() {
  const [packsUsed, setPacksUsed] = useState(0);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('packOpeningData');
    if (stored) {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();

      // Reset if it's a new day
      if (data.lastResetDate !== today) {
        setPacksUsed(0);
        setLastResetDate(today);
        localStorage.setItem(
          'packOpeningData',
          JSON.stringify({ packsUsed: 0, lastResetDate: today })
        );
      } else {
        setPacksUsed(data.packsUsed);
        setLastResetDate(data.lastResetDate);
      }
    } else {
      const today = new Date().toDateString();
      setLastResetDate(today);
      localStorage.setItem('packOpeningData', JSON.stringify({ packsUsed: 0, lastResetDate: today }));
    }
  }, []);

  const consumePack = useCallback(() => {
    const newCount = packsUsed + 1;
    setPacksUsed(newCount);
    const today = new Date().toDateString();
    localStorage.setItem('packOpeningData', JSON.stringify({ packsUsed: newCount, lastResetDate: today }));
  }, [packsUsed]);

  return {
    packsRemaining: Math.max(0, FREE_PACKS_PER_DAY - packsUsed),
    consumePack,
  };
}

// ============================================================================
// PACK VISUAL COMPONENT
// ============================================================================

interface SealedPackProps {
  onClick: () => void;
  disabled: boolean;
  packsRemaining: number;
}

function SealedPack({ onClick, disabled, packsRemaining }: SealedPackProps) {
  const { isReduced: prefersReducedMotion } = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'group relative h-72 w-48 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kid-primary/50 focus-visible:ring-offset-2',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:scale-105 active:scale-95'
        )}
        aria-label={disabled ? 'No packs remaining today' : 'Open a virtual pack'}
      >
        {/* Pack wrapper */}
        <div
          className={cn(
            'relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-2xl',
            !disabled && !prefersReducedMotion && 'animate-pulse'
          )}
        >
          {/* Holographic shimmer effect */}
          {!disabled && !prefersReducedMotion && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: 'shimmer 2s infinite',
                transform: 'translateX(-100%)',
              }}
            />
          )}

          {/* Pack design */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <GiftIcon className="h-12 w-12 text-white" />
            </div>
            <span className="text-center text-lg font-bold text-white drop-shadow-lg">
              Virtual Pack
            </span>
            <span className="mt-1 text-sm text-white/80">Tap to open!</span>
          </div>

          {/* Corner sparkles */}
          {!disabled && (
            <>
              <SparklesIcon className="absolute left-2 top-2 h-6 w-6 text-yellow-300/80" />
              <SparklesIcon className="absolute bottom-2 right-2 h-6 w-6 text-yellow-300/80" />
            </>
          )}

          {/* Lock overlay when disabled */}
          {disabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <LockClosedIcon className="h-12 w-12 text-white/80" />
              <span className="mt-2 text-sm font-medium text-white/80">Come back tomorrow!</span>
            </div>
          )}
        </div>
      </button>

      {/* Packs remaining indicator */}
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
        <GiftIcon className="h-5 w-5 text-amber-400" />
        <span className="text-sm font-medium text-white">
          {packsRemaining} {packsRemaining === 1 ? 'pack' : 'packs'} remaining today
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// CARD REVEAL COMPONENT
// ============================================================================

interface CardRevealProps {
  card: RevealedCard;
  index: number;
  onReveal: () => void;
  autoReveal?: boolean;
  onCardRevealEffect?: (isRare: boolean) => void;
}

function CardReveal({ card, index, onReveal, autoReveal, onCardRevealEffect }: CardRevealProps) {
  const { isReduced: prefersReducedMotion } = useReducedMotion();
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (autoReveal && !card.revealed) {
      const timer = setTimeout(() => {
        setIsFlipping(true);
        onCardRevealEffect?.(card.isRare);
        setTimeout(onReveal, prefersReducedMotion ? 0 : 300);
      }, index * (prefersReducedMotion ? 100 : 200));
      return () => clearTimeout(timer);
    }
  }, [autoReveal, card.revealed, index, onReveal, prefersReducedMotion, onCardRevealEffect, card.isRare]);

  const handleClick = () => {
    if (!card.revealed) {
      setIsFlipping(true);
      onCardRevealEffect?.(card.isRare);
      setTimeout(onReveal, prefersReducedMotion ? 0 : 300);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={card.revealed}
      className={cn(
        'group relative aspect-[2.5/3.5] w-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary/50',
        card.revealed ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'
      )}
      style={{
        perspective: '1000px',
        animationDelay: `${index * 50}ms`,
      }}
      aria-label={card.revealed ? card.name : 'Tap to reveal card'}
    >
      <div
        className={cn(
          'relative h-full w-full transition-transform duration-300',
          !prefersReducedMotion && (isFlipping || card.revealed) && 'rotate-y-180'
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: !prefersReducedMotion && (isFlipping || card.revealed) ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Card back */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg',
            card.revealed && 'hidden'
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="rounded-full bg-white/20 p-3">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Card front */}
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-xl shadow-lg',
            !card.revealed && 'hidden',
            card.isRare && 'ring-2 ring-amber-400 shadow-amber-400/50 shadow-xl'
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {card.imageSmall ? (
            <Image
              src={card.imageSmall}
              alt={card.name}
              fill
              sizes="(max-width: 640px) 25vw, 15vw"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200">
              <span className="text-xs text-gray-500">{card.name}</span>
            </div>
          )}

          {/* Rare card glow effect */}
          {card.isRare && !prefersReducedMotion && (
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-t from-amber-400/20 to-transparent" />
          )}

          {/* Rarity badge */}
          {card.isRare && (
            <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 shadow-md">
              <StarIcon className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN PACK OPENING SIMULATOR
// ============================================================================

interface PackOpeningSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PackOpeningSimulator({ isOpen, onClose }: PackOpeningSimulatorProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { isReduced: prefersReducedMotion } = useReducedMotion();
  const { packsRemaining, consumePack } = usePacksRemaining();
  const {
    soundEnabled,
    hapticsEnabled,
    toggleSound,
    toggleHaptics,
    onPackOpen,
    onCardReveal,
    onPackComplete,
  } = usePackEffects();

  const [packState, setPackState] = useState<PackState>('sealed');
  const [revealedCards, setRevealedCards] = useState<RevealedCard[]>([]);
  const [autoReveal, setAutoReveal] = useState(false);

  // Get random cards from user's collected sets
  const randomCards = useQuery(
    api.collections.getRandomCards,
    profileId && packState === 'opening'
      ? { profileId: profileId as Id<'profiles'>, count: CARDS_PER_PACK, allowDuplicates: true }
      : 'skip'
  );

  // Process cards when they arrive
  useEffect(() => {
    if (randomCards && randomCards.length > 0 && packState === 'opening') {
      const cards: RevealedCard[] = randomCards.map((card) => ({
        cardId: card.cardId,
        name: card.name,
        imageSmall: card.imageSmall,
        rarity: card.rarity,
        isRare: card.rarity ? RARE_RARITIES.includes(card.rarity) : false,
        revealed: false,
      }));

      // Sort so rare cards appear toward the end (like real packs)
      cards.sort((a, b) => {
        if (a.isRare && !b.isRare) return 1;
        if (!a.isRare && b.isRare) return -1;
        return 0;
      });

      setRevealedCards(cards);
      setPackState('revealing');
    }
  }, [randomCards, packState]);

  // Handle pack open
  const handleOpenPack = useCallback(() => {
    if (packsRemaining <= 0) return;
    consumePack();
    onPackOpen();
    setPackState('opening');
    setAutoReveal(false);
  }, [packsRemaining, consumePack, onPackOpen]);

  // Handle card reveal
  const handleRevealCard = useCallback((index: number) => {
    setRevealedCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, revealed: true } : card))
    );
  }, []);

  // Check if all cards revealed
  const allRevealed = useMemo(
    () => revealedCards.length > 0 && revealedCards.every((card) => card.revealed),
    [revealedCards]
  );

  // Update state when all revealed
  useEffect(() => {
    if (allRevealed && packState === 'revealing') {
      setPackState('revealed');
      onPackComplete();
    }
  }, [allRevealed, packState, onPackComplete]);

  // Handle reveal all
  const handleRevealAll = useCallback(() => {
    setAutoReveal(true);
  }, []);

  // Handle open another pack
  const handleOpenAnother = useCallback(() => {
    setPackState('sealed');
    setRevealedCards([]);
    setAutoReveal(false);
  }, []);

  // Close modal
  const handleClose = useCallback(() => {
    setPackState('sealed');
    setRevealedCards([]);
    setAutoReveal(false);
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleClose]);

  // Count rare cards
  const rareCount = useMemo(
    () => revealedCards.filter((card) => card.isRare && card.revealed).length,
    [revealedCards]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-black/40 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5">
            <GiftIcon className="h-5 w-5 text-white" />
            <span className="text-sm font-bold text-white">Virtual Pack Opening</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              soundEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/10 text-white/50 hover:bg-white/15'
            )}
            aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? (
              <SpeakerWaveIcon className="h-5 w-5" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5" />
            )}
          </button>
          {/* Haptics toggle */}
          <button
            onClick={toggleHaptics}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              hapticsEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/10 text-white/50 hover:bg-white/15'
            )}
            aria-label={hapticsEnabled ? 'Disable vibration' : 'Enable vibration'}
            aria-pressed={hapticsEnabled}
          >
            <DevicePhoneMobileIcon className={cn('h-5 w-5', hapticsEnabled && 'animate-pulse')} />
          </button>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Close pack opening"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-full w-full flex-col items-center justify-center px-4 pt-16 pb-4">
        {/* Loading state */}
        {(profileLoading || packState === 'opening') && (
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                'h-16 w-16 rounded-full border-4 border-white/20 border-t-white',
                !prefersReducedMotion && 'animate-spin'
              )}
            />
            <span className="text-white/80">
              {profileLoading ? 'Loading...' : 'Opening pack...'}
            </span>
          </div>
        )}

        {/* Sealed pack state */}
        {!profileLoading && packState === 'sealed' && (
          <SealedPack
            onClick={handleOpenPack}
            disabled={packsRemaining <= 0}
            packsRemaining={packsRemaining}
          />
        )}

        {/* Revealing/revealed state */}
        {(packState === 'revealing' || packState === 'revealed') && (
          <div className="flex w-full max-w-4xl flex-col items-center gap-6 overflow-auto">
            {/* Card grid */}
            <div className="grid w-full grid-cols-5 gap-2 sm:gap-3">
              {revealedCards.map((card, index) => (
                <CardReveal
                  key={`${card.cardId}-${index}`}
                  card={card}
                  index={index}
                  onReveal={() => handleRevealCard(index)}
                  autoReveal={autoReveal}
                  onCardRevealEffect={onCardReveal}
                />
              ))}
            </div>

            {/* Summary and actions */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Rare count */}
              {allRevealed && rareCount > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 backdrop-blur-sm">
                  <StarIcon className="h-5 w-5 text-amber-400" />
                  <span className="font-semibold text-amber-300">
                    {rareCount} rare {rareCount === 1 ? 'card' : 'cards'}!
                  </span>
                </div>
              )}

              {/* Reveal all button */}
              {!allRevealed && !autoReveal && (
                <button
                  onClick={handleRevealAll}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Reveal All
                </button>
              )}

              {/* Open another button */}
              {allRevealed && packsRemaining > 0 && (
                <button
                  onClick={handleOpenAnother}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Open Another Pack
                </button>
              )}

              {/* No packs remaining */}
              {allRevealed && packsRemaining <= 0 && (
                <div className="text-center text-white/60">
                  <p>You&apos;ve used all your packs for today!</p>
                  <p className="text-sm">Come back tomorrow for 2 more free packs.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty collection message */}
        {!profileLoading && packState === 'revealing' && randomCards && randomCards.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-white/10 p-6">
              <GiftIcon className="h-12 w-12 text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white">No cards in your collection yet!</h3>
            <p className="max-w-sm text-white/60">
              Add some cards to your collection first, then come back to open virtual packs from
              your sets.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 rounded-full bg-kid-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-kid-primary/80"
            >
              Start Collecting
            </button>
          </div>
        )}
      </div>

      {/* CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PACK OPENING BUTTON FOR DASHBOARD
// ============================================================================

interface PackOpeningButtonProps {
  onClick: () => void;
  className?: string;
}

export function PackOpeningButton({ onClick, className }: PackOpeningButtonProps) {
  const { packsRemaining } = usePacksRemaining();
  const { isReduced: prefersReducedMotion } = useReducedMotion();

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary/50 focus-visible:ring-offset-2 active:scale-95',
        className
      )}
      aria-label={`Open virtual pack. ${packsRemaining} packs remaining today.`}
    >
      {/* Shimmer effect */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl"
          style={{ opacity: 0.3 }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
            style={{
              animation: 'shimmer 2s infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>
      )}

      <GiftIcon className="relative h-6 w-6" />
      <span className="relative">Open Pack</span>

      {/* Badge showing remaining packs */}
      {packsRemaining > 0 && (
        <span className="relative ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-2 text-sm font-bold">
          {packsRemaining}
        </span>
      )}
    </button>
  );
}
