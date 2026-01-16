'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Standard Pokemon card back image
const POKEMON_CARD_BACK_URL = 'https://images.pokemontcg.io/cardback.png';

interface FlippableCardProps {
  frontImage: string;
  cardName: string;
  className?: string;
  children?: React.ReactNode;
  /** Callback when card is flipped (true = showing back) */
  onFlip?: (isFlipped: boolean) => void;
  /** Controlled flip state */
  isFlipped?: boolean;
  /** Disable flip interaction */
  disableFlip?: boolean;
}

export function FlippableCard({
  frontImage,
  cardName,
  className,
  children,
  onFlip,
  isFlipped: controlledIsFlipped,
  disableFlip = false,
}: FlippableCardProps) {
  const [internalIsFlipped, setInternalIsFlipped] = useState(false);

  // Support both controlled and uncontrolled modes
  const isFlipped = controlledIsFlipped ?? internalIsFlipped;

  const handleFlip = useCallback(() => {
    if (disableFlip) return;

    const newFlipped = !isFlipped;
    setInternalIsFlipped(newFlipped);
    onFlip?.(newFlipped);
  }, [isFlipped, onFlip, disableFlip]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip]
  );

  return (
    <div
      className={cn('flip-card-container', className)}
      style={{ perspective: '1000px' }}
    >
      <div
        role="button"
        tabIndex={disableFlip ? -1 : 0}
        aria-label={`${cardName}, press F or tap to flip card. Currently showing ${isFlipped ? 'back' : 'front'}`}
        className={cn(
          'flip-card-inner relative h-full w-full transition-transform duration-500',
          isFlipped && 'flip-card-flipped'
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
      >
        {/* Front of card */}
        <div
          className="flip-card-front absolute inset-0 rounded-lg"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            <Image
              src={frontImage}
              alt={cardName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain"
            />
            {/* Overlay children (badges, buttons, etc.) */}
            {children}
          </div>
        </div>

        {/* Back of card */}
        <div
          className="flip-card-back absolute inset-0 rounded-lg"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
            <Image
              src={POKEMON_CARD_BACK_URL}
              alt="Pokemon card back"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain"
            />
            {/* Flip hint */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
              <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
                Tap to flip back
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Standalone card flip modal for detailed viewing
interface CardFlipModalProps {
  frontImage: string;
  cardName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CardFlipModal({ frontImage, cardName, isOpen, onClose }: CardFlipModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${cardName} card viewer`}
    >
      <div
        className="relative h-[80vh] max-h-[600px] w-full max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <FlippableCard
          frontImage={frontImage}
          cardName={cardName}
          isFlipped={isFlipped}
          onFlip={setIsFlipped}
          className="h-full w-full"
        />

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-sm text-white/70">
            Tap card or press <kbd className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs">F</kbd> to flip
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100"
          aria-label="Close card viewer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
