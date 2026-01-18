'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { CardImage } from '@/components/ui/CardImage';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  SparklesIcon,
  BookOpenIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { Id } from '../../../convex/_generated/dataModel';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

interface CardData {
  id: string;
  name: string;
  images: {
    small: string;
    large?: string;
  };
  supertype?: string;
  rarity?: string;
  set?: {
    id: string;
    name: string;
  };
}

interface CardStoryModalProps {
  /** The card to show the story for */
  card: CardData | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** The game slug for story context */
  gameSlug?: GameSlug;
  /** Additional className for the container */
  className?: string;
}

export function CardStoryModal({
  card,
  isOpen,
  onClose,
  gameSlug = 'pokemon',
  className,
}: CardStoryModalProps) {
  const { profileId, family } = useCurrentProfile();
  const getCardStory = useAction(api.ai.storyteller.getCardStory);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [facts, setFacts] = useState<string[]>([]);
  const [didYouKnow, setDidYouKnow] = useState<string | null>(null);

  // Track card ID for resetting state
  const cardId = card?.id;

  // Reset state when card changes
  useEffect(() => {
    if (cardId) {
      setStory(null);
      setFacts([]);
      setDidYouKnow(null);
      setError(null);
    }
  }, [cardId]);

  // Fetch story when modal opens
  useEffect(() => {
    if (!isOpen || !card || !profileId || !family?._id) return;
    if (story) return; // Already have a story

    const fetchStory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCardStory({
          profileId: profileId as Id<'profiles'>,
          familyId: family._id as Id<'families'>,
          cardId: card.id,
          cardName: card.name,
          cardType: card.supertype,
          rarity: card.rarity,
          setName: card.set?.name,
          gameSlug,
        });

        if (result.error) {
          setError(result.error);
        } else {
          setStory(result.story);
          setFacts(result.facts);
          setDidYouKnow(result.didYouKnow);
        }
      } catch (err) {
        console.error('Story fetch error:', err);
        setError('Oops! Could not load the story. Try again!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [isOpen, card, profileId, family?._id, story, getCardStory, gameSlug]);

  // Handle keyboard (Escape to close)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !card) return null;

  const largeImage = card.images.large || card.images.small;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm',
        className
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Story about ${card.name}`}
    >
      {/* Modal content */}
      <div
        className="relative mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-900 to-purple-900 shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Card image section */}
        <div className="relative flex shrink-0 items-center justify-center bg-black/20 p-6 md:w-1/3">
          <div className="relative aspect-[2.5/3.5] w-full max-w-[200px] overflow-hidden rounded-xl shadow-2xl">
            <CardImage
              src={largeImage}
              alt={card.name}
              fill
              sizes="200px"
              priority
            />
          </div>

          {/* Sparkle decoration */}
          <div className="absolute -right-2 -top-2 animate-pulse">
            <SparklesIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        {/* Story content section */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-4 flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">
              The Story of {card.name}
            </h2>
          </div>

          {/* Loading state with skeleton */}
          {isLoading && (
            <div className="space-y-4">
              {/* Skeleton for main story */}
              <div className="rounded-xl bg-white/10 p-4">
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-white/20" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-white/20" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-white/20" />
                  <div className="h-4 w-full animate-pulse rounded bg-white/20" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-white/20" />
                </div>
              </div>

              {/* Skeleton for fun facts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded bg-yellow-400/40" />
                  <div className="h-4 w-20 animate-pulse rounded bg-yellow-400/40" />
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-full animate-pulse rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10" />
                  <div className="h-12 w-full animate-pulse rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10" />
                </div>
              </div>

              {/* Loading message */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <SparklesIcon className="h-5 w-5 animate-spin text-yellow-400" />
                <p className="text-sm text-white/70">Creating your story...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <ExclamationCircleIcon className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-center text-white/80">{error}</p>
              <button
                onClick={() => {
                  setStory(null);
                  setError(null);
                }}
                className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Story content */}
          {story && !isLoading && !error && (
            <div className="space-y-4">
              {/* Main story */}
              <div className="rounded-xl bg-white/10 p-4">
                <p className="whitespace-pre-wrap text-white/90">{story}</p>
              </div>

              {/* Fun facts callout boxes */}
              {facts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-yellow-400">
                    <LightBulbIcon className="h-4 w-4" />
                    Fun Facts
                  </h3>
                  <div className="grid gap-2">
                    {facts.map((fact, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 text-sm text-white/90"
                      >
                        <span className="mr-2 text-yellow-400">✨</span>
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Did you know? section */}
              {didYouKnow && (
                <div className="rounded-xl border-2 border-dashed border-purple-400/50 bg-purple-500/10 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-purple-300">
                    🤔 Did You Know?
                  </h3>
                  <p className="text-white/90">{didYouKnow}</p>
                </div>
              )}
            </div>
          )}

          {/* No profile warning */}
          {!profileId && (
            <div className="flex flex-1 flex-col items-center justify-center py-8">
              <p className="text-center text-white/60">
                Please select a profile to see card stories.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/50">
        Press ESC to close
      </div>
    </div>
  );
}
