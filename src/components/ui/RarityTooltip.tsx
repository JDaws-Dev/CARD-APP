'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getRarityInfo, getRarityInfoByName, type RarityInfo } from '@/lib/rarityExplainer';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import {
  InformationCircleIcon,
  StarIcon,
  SparklesIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid';

interface RarityTooltipProps {
  /** Rarity ID (e.g., 'common', 'rare', 'ultra-rare') or raw rarity string from API */
  rarity: string;
  /** The content to wrap with the tooltip trigger */
  children: React.ReactNode;
  /** Position of the tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional classes for the wrapper */
  className?: string;
  /** Whether to show the tooltip (can be controlled externally) */
  disabled?: boolean;
}

// Gradient colors for each rarity tier
const RARITY_GRADIENTS: Record<string, string> = {
  common: 'from-gray-100 to-gray-200',
  uncommon: 'from-emerald-50 to-green-100',
  rare: 'from-blue-50 to-indigo-100',
  'ultra-rare': 'from-purple-50 to-violet-100',
  'secret-rare': 'from-amber-50 to-yellow-100',
  promo: 'from-rose-50 to-pink-100',
};

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: 'border-gray-300',
  uncommon: 'border-emerald-300',
  rare: 'border-blue-300',
  'ultra-rare': 'border-purple-300',
  'secret-rare': 'border-amber-300',
  promo: 'border-rose-300',
};

const RARITY_TEXT_COLORS: Record<string, string> = {
  common: 'text-gray-700',
  uncommon: 'text-emerald-700',
  rare: 'text-blue-700',
  'ultra-rare': 'text-purple-700',
  'secret-rare': 'text-amber-700',
  promo: 'text-rose-700',
};

const RARITY_ICON_COLORS: Record<string, string> = {
  common: 'text-gray-500',
  uncommon: 'text-emerald-500',
  rare: 'text-blue-500',
  'ultra-rare': 'text-purple-500',
  'secret-rare': 'text-amber-500',
  promo: 'text-rose-500',
};

/**
 * RarityTooltip - Educational tooltip explaining card rarities
 * Shows on hover (desktop) or tap (mobile) with kid-friendly explanations
 */
export function RarityTooltip({
  rarity,
  children,
  position = 'top',
  className,
  disabled = false,
}: RarityTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the current game for game-specific rarity info
  const { primaryGame } = useGameSelector();
  const gameId = primaryGame.id;

  // Get rarity info - try by ID first, then by name, using current game context
  const rarityInfo: RarityInfo | null = getRarityInfo(rarity, gameId) || getRarityInfoByName(rarity, gameId);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tooltip when clicking outside (mobile)
  useEffect(() => {
    if (!isVisible || !isMobile) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, isMobile]);

  // Handle hover (desktop)
  const handleMouseEnter = useCallback(() => {
    if (disabled || isMobile || !rarityInfo) return;
    // Small delay to prevent accidental triggers
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  }, [disabled, isMobile, rarityInfo]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Handle tap (mobile)
  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || !isMobile || !rarityInfo) return;
      e.preventDefault();
      e.stopPropagation();
      setIsVisible((prev) => !prev);
    },
    [disabled, isMobile, rarityInfo]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // If no rarity info available, just render children
  if (!rarityInfo) {
    return <>{children}</>;
  }

  const gradient = RARITY_GRADIENTS[rarityInfo.id] || RARITY_GRADIENTS.common;
  const borderColor = RARITY_BORDER_COLORS[rarityInfo.id] || RARITY_BORDER_COLORS.common;
  const textColor = RARITY_TEXT_COLORS[rarityInfo.id] || RARITY_TEXT_COLORS.common;
  const iconColor = RARITY_ICON_COLORS[rarityInfo.id] || RARITY_ICON_COLORS.common;

  // Position classes for the tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow position classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-describedby={isVisible ? `rarity-tooltip-${rarityInfo.id}` : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsVisible((prev) => !prev);
        }
        if (e.key === 'Escape') {
          setIsVisible(false);
        }
      }}
    >
      {children}

      {/* Info icon indicator */}
      <InformationCircleIcon
        className={cn('ml-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-60 transition-opacity', iconColor)}
        aria-hidden="true"
      />

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={`rarity-tooltip-${rarityInfo.id}`}
          role="tooltip"
          className={cn(
            'absolute z-50 w-64 rounded-xl border bg-gradient-to-br p-3 shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            positionClasses[position],
            gradient,
            borderColor
          )}
        >
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <StarIcon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
            <h4 className={cn('text-sm font-bold', textColor)}>{rarityInfo.name}</h4>
          </div>

          {/* Description */}
          <p className="mb-2 text-xs leading-relaxed text-gray-600">{rarityInfo.description}</p>

          {/* Pull Rate */}
          <div className="mb-2 flex items-start gap-1.5">
            <SparklesIcon
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p className="text-xs text-gray-500">
              <span className="font-medium">How often:</span> {rarityInfo.pullRate}
            </p>
          </div>

          {/* Collector Tip */}
          <div className="flex items-start gap-1.5 rounded-lg bg-white/50 p-2">
            <LightBulbIcon
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-500"
              aria-hidden="true"
            />
            <p className="text-xs text-gray-600">
              <span className="font-medium">Tip:</span> {rarityInfo.collectorTip}
            </p>
          </div>

          {/* Arrow */}
          <div className={cn('absolute border-4', arrowClasses[position])} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Rarity Badge with built-in tooltip
 * Use this for displaying rarity with educational tooltips in any context
 */
interface RarityBadgeProps {
  rarity: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RarityBadge({
  rarity,
  showTooltip = true,
  size = 'md',
  className,
}: RarityBadgeProps) {
  // Get the current game for game-specific rarity info
  const { primaryGame } = useGameSelector();
  const gameId = primaryGame.id;
  const rarityInfo = getRarityInfo(rarity, gameId) || getRarityInfoByName(rarity, gameId);

  if (!rarityInfo) {
    // Fallback for unknown rarities
    return (
      <span
        className={cn(
          'inline-block rounded-full bg-gray-100 font-medium text-gray-600',
          size === 'sm' && 'px-2 py-0.5 text-[10px]',
          size === 'md' && 'px-2.5 py-1 text-xs',
          size === 'lg' && 'px-3 py-1.5 text-sm',
          className
        )}
      >
        {rarity}
      </span>
    );
  }

  const bgColor = {
    common: 'bg-gray-100 text-gray-700',
    uncommon: 'bg-emerald-100 text-emerald-700',
    rare: 'bg-blue-100 text-blue-700',
    'ultra-rare': 'bg-purple-100 text-purple-700',
    'secret-rare': 'bg-amber-100 text-amber-700',
    promo: 'bg-rose-100 text-rose-700',
  }[rarityInfo.id];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        bgColor,
        size === 'sm' && 'px-2 py-0.5 text-[10px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
        className
      )}
    >
      {rarityInfo.name}
    </span>
  );

  if (showTooltip) {
    return <RarityTooltip rarity={rarity}>{badge}</RarityTooltip>;
  }

  return badge;
}

export type { RarityInfo };
