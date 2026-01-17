'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PhotoIcon } from '@heroicons/react/24/outline';

/**
 * Path to the fallback placeholder image for failed card image loads.
 * This SVG is included inline as a data URL to avoid external dependencies.
 */
const PLACEHOLDER_DATA_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 350" fill="none">
  <defs>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f3f4f6"/>
      <stop offset="100%" style="stop-color:#e5e7eb"/>
    </linearGradient>
  </defs>
  <rect width="250" height="350" rx="12" fill="url(#cardGradient)"/>
  <rect x="15" y="15" width="220" height="320" rx="8" fill="#d1d5db" opacity="0.5"/>
  <path d="M125 140 L145 180 L190 180 L155 205 L170 250 L125 220 L80 250 L95 205 L60 180 L105 180 Z" fill="#9ca3af" opacity="0.6"/>
  <text x="125" y="300" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#6b7280">Card not available</text>
</svg>
`)}`;

interface CardImageProps {
  /** The source URL of the card image */
  src: string;
  /** Alt text for the image (usually the card name) */
  alt: string;
  /** Whether to use fill mode (parent must have relative positioning) */
  fill?: boolean;
  /** Width in pixels (required if not using fill) */
  width?: number;
  /** Height in pixels (required if not using fill) */
  height?: number;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to load the image with priority */
  priority?: boolean;
  /** Custom fallback image URL (defaults to built-in placeholder) */
  fallbackSrc?: string;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Whether to allow dragging the image */
  draggable?: boolean;
}

/**
 * CardImage - A reusable card image component with built-in error handling.
 *
 * Wraps Next.js Image component with:
 * - Automatic fallback to placeholder on error
 * - Loading state with subtle skeleton
 * - Consistent styling across the app
 *
 * @example
 * // Fill mode (parent needs relative positioning)
 * <div className="relative aspect-[2.5/3.5]">
 *   <CardImage src={card.images.small} alt={card.name} fill />
 * </div>
 *
 * @example
 * // Fixed size mode
 * <CardImage src={card.images.small} alt={card.name} width={250} height={350} />
 */
export function CardImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw',
  className,
  priority = false,
  fallbackSrc = PLACEHOLDER_DATA_URL,
  onError,
  onLoad,
  draggable = false,
}: CardImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      onError?.();
    }
  }, [hasError, fallbackSrc, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    if (!hasError) {
      onLoad?.();
    }
  }, [hasError, onLoad]);

  // Common image props
  const imageProps = {
    src: imageSrc,
    alt: hasError ? `${alt} (image unavailable)` : alt,
    className: cn(
      'object-contain transition-opacity duration-200',
      isLoading && 'opacity-0',
      !isLoading && 'opacity-100',
      className
    ),
    onError: handleError,
    onLoadingComplete: handleLoad,
    draggable,
    priority,
  };

  return (
    <>
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200',
            'animate-pulse'
          )}
          aria-hidden="true"
        >
          <PhotoIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}

      {fill ? (
        <Image
          src={imageProps.src}
          alt={imageProps.alt}
          className={imageProps.className}
          onError={imageProps.onError}
          onLoadingComplete={imageProps.onLoadingComplete}
          draggable={imageProps.draggable}
          priority={imageProps.priority}
          fill
          sizes={sizes}
        />
      ) : (
        <Image
          src={imageProps.src}
          alt={imageProps.alt}
          className={imageProps.className}
          onError={imageProps.onError}
          onLoadingComplete={imageProps.onLoadingComplete}
          draggable={imageProps.draggable}
          priority={imageProps.priority}
          width={width ?? 250}
          height={height ?? 350}
          sizes={sizes}
        />
      )}
    </>
  );
}

/**
 * Path to the card back image for Pokemon cards.
 * Used by FlippableCard and other components that show card backs.
 */
export const CARD_BACK_URL = 'https://images.pokemontcg.io/cardback.png';

/**
 * CardBack - A card back image with error handling.
 * Used for flip animations and placeholder backgrounds.
 */
interface CardBackProps {
  /** Whether to use fill mode */
  fill?: boolean;
  /** Width in pixels (required if not using fill) */
  width?: number;
  /** Height in pixels (required if not using fill) */
  height?: number;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Additional CSS classes */
  className?: string;
}

export function CardBack({
  fill = false,
  width,
  height,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw',
  className,
}: CardBackProps) {
  return (
    <CardImage
      src={CARD_BACK_URL}
      alt="Card back"
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
    />
  );
}
