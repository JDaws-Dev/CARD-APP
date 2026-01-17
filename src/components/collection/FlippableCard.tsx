'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

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

// Zoomable card modal with pinch-to-zoom and pan functionality
interface ZoomableCardModalProps {
  frontImage: string;
  cardName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ZoomableCardModal({ frontImage, cardName, isOpen, onClose }: ZoomableCardModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsFlipped(false);
    }
  }, [isOpen]);

  // Handle keyboard zoom controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale((s) => Math.min(s + 0.5, MAX_SCALE));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setScale((s) => Math.max(s - 0.5, MIN_SCALE));
      } else if (e.key === '0') {
        e.preventDefault();
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      lastPinchDistanceRef.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan start (only when zoomed in)
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale]);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
        // Pinch zoom
        e.preventDefault();
        const distance = getTouchDistance(e.touches[0], e.touches[1]);
        const delta = distance - lastPinchDistanceRef.current;
        const scaleChange = delta * 0.01;

        setScale((s) => Math.min(Math.max(s + scaleChange, MIN_SCALE), MAX_SCALE));
        lastPinchDistanceRef.current = distance;
      } else if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
        // Pan (only when zoomed in)
        const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
        const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

        setPosition((pos) => ({
          x: pos.x + deltaX,
          y: pos.y + deltaY,
        }));

        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [scale]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    lastPinchDistanceRef.current = null;
    lastTouchRef.current = null;

    // Reset position if scale is back to 1
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setScale((s) => {
      const newScale = Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // Handle mouse drag for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          posX: position.x,
          posY: position.y,
        };
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;

        setPosition({
          x: dragStartRef.current.posX + deltaX,
          y: dragStartRef.current.posY + deltaY,
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Zoom control buttons
  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.5, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, MIN_SCALE);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handle card tap for flip when not zoomed
  const handleCardClick = useCallback(() => {
    if (scale === 1 && !isDragging) {
      setIsFlipped((f) => !f);
    }
  }, [scale, isDragging]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`${cardName} card viewer with zoom`}
    >
      {/* Card container */}
      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none', cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
      >
        <div
          className="relative h-[70vh] max-h-[550px] w-full max-w-[380px] transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onClick={handleCardClick}
        >
          {/* Card with flip capability */}
          <div
            className="h-full w-full"
            style={{
              perspective: '1000px',
            }}
          >
            <div
              className="relative h-full w-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <Image
                  src={frontImage}
                  alt={cardName}
                  fill
                  sizes="(max-width: 640px) 90vw, 380px"
                  className="rounded-lg object-contain"
                  priority
                  draggable={false}
                />
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <Image
                  src={POKEMON_CARD_BACK_URL}
                  alt="Pokemon card back"
                  fill
                  sizes="(max-width: 640px) 90vw, 380px"
                  className="rounded-lg object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
        <button
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          aria-label="Zoom out"
        >
          <MagnifyingGlassMinusIcon className="h-6 w-6" />
        </button>

        <div className="min-w-[60px] text-center text-sm font-medium text-white">
          {Math.round(scale * 100)}%
        </div>

        <button
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          aria-label="Zoom in"
        >
          <MagnifyingGlassPlusIcon className="h-6 w-6" />
        </button>

        <div className="mx-1 h-6 w-px bg-white/30" />

        <button
          onClick={handleResetZoom}
          disabled={scale === 1 && position.x === 0 && position.y === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          aria-label="Reset zoom"
        >
          <ArrowsPointingOutIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-white/60">
          {scale === 1 ? (
            <>Pinch or scroll to zoom • Tap to flip</>
          ) : (
            <>Drag to pan • Pinch or scroll to adjust</>
          )}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Close card viewer"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Keyboard shortcuts hint */}
      <div className="absolute left-4 top-4 hidden text-xs text-white/40 sm:block">
        <kbd className="rounded bg-white/10 px-1.5 py-0.5">+</kbd>
        <kbd className="ml-1 rounded bg-white/10 px-1.5 py-0.5">-</kbd>
        <span className="ml-1">zoom</span>
        <span className="mx-2">•</span>
        <kbd className="rounded bg-white/10 px-1.5 py-0.5">0</kbd>
        <span className="ml-1">reset</span>
        <span className="mx-2">•</span>
        <kbd className="rounded bg-white/10 px-1.5 py-0.5">Esc</kbd>
        <span className="ml-1">close</span>
      </div>
    </div>
  );
}
