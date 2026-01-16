'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  SparklesIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid';
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { getRarityInfo } from '@/lib/rarityExplainer';

// Rarity categories with their display config
export const RARITY_CATEGORIES = [
  {
    id: 'common',
    label: 'Common',
    shortLabel: 'C',
    matches: ['Common'],
    gradient: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: null,
  },
  {
    id: 'uncommon',
    label: 'Uncommon',
    shortLabel: 'U',
    matches: ['Uncommon'],
    gradient: 'from-green-400 to-emerald-500',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: null,
  },
  {
    id: 'rare',
    label: 'Rare',
    shortLabel: 'R',
    matches: ['Rare', 'Rare Holo'],
    gradient: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: StarIcon,
  },
  {
    id: 'ultra-rare',
    label: 'Ultra Rare',
    shortLabel: 'UR',
    matches: [
      'Rare Ultra',
      'Rare Holo EX',
      'Rare Holo GX',
      'Rare Holo V',
      'Rare Holo VMAX',
      'Rare Holo VSTAR',
      'Rare BREAK',
      'Rare Prime',
      'Rare ACE',
      'Double Rare',
      'Ultra Rare',
    ],
    gradient: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: SparklesIcon,
  },
  {
    id: 'secret-rare',
    label: 'Secret Rare',
    shortLabel: 'SR',
    matches: [
      'Rare Secret',
      'Rare Rainbow',
      'Rare Shining',
      'Rare Shiny',
      'Rare Shiny GX',
      'LEGEND',
      'Amazing Rare',
      'Illustration Rare',
      'Special Illustration Rare',
      'Hyper Rare',
      'Trainer Gallery Rare Holo',
    ],
    gradient: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: FireIcon,
  },
  {
    id: 'promo',
    label: 'Promo',
    shortLabel: 'P',
    matches: ['Promo', 'Classic Collection'],
    gradient: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    icon: BoltIcon,
  },
] as const;

export type RarityCategoryId = (typeof RARITY_CATEGORIES)[number]['id'];

// Helper function to get the category for a given rarity string
export function getRarityCategory(rarity: string | undefined): RarityCategoryId | null {
  if (!rarity) return null;

  for (const category of RARITY_CATEGORIES) {
    if (category.matches.some((match) => rarity.includes(match) || match.includes(rarity))) {
      return category.id;
    }
  }
  return null;
}

interface RarityFilterProps {
  selectedRarity: RarityCategoryId | null;
  onRarityChange: (rarity: RarityCategoryId | null) => void;
  rarityCounts?: Map<RarityCategoryId, number>;
  /** Whether to show the help panel for rarity explanations */
  showHelp?: boolean;
}

/**
 * Individual rarity button with hover tooltip
 */
function RarityButton({
  category,
  count,
  isSelected,
  onClick,
}: {
  category: (typeof RARITY_CATEGORIES)[number];
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const Icon = category.icon;
  const rarityInfo = getRarityInfo(category.id);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 400); // Slightly longer delay to not interfere with clicking
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="group relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={count === 0 && !isSelected}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
          isSelected
            ? `bg-gradient-to-r ${category.gradient} text-white shadow-md`
            : count > 0
              ? `${category.bgColor} ${category.textColor} hover:shadow-sm`
              : 'cursor-not-allowed bg-gray-50 text-gray-300'
        )}
        aria-pressed={isSelected}
        aria-label={`Filter by ${category.label}${count > 0 ? `, ${count} cards` : ''}`}
        aria-describedby={showTooltip ? `rarity-tip-${category.id}` : undefined}
      >
        {Icon && (
          <Icon className={cn('h-4 w-4', isSelected ? 'text-white' : '')} aria-hidden="true" />
        )}
        <span>{category.label}</span>
        {count > 0 && (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-xs',
              isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-gray-600'
            )}
          >
            {count}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && rarityInfo && (
        <div
          id={`rarity-tip-${category.id}`}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <StarIcon
              className={cn('h-4 w-4', category.textColor.replace('text-', 'text-'))}
              aria-hidden="true"
            />
            <span className={cn('text-sm font-semibold', category.textColor)}>
              {rarityInfo.name}
            </span>
          </div>
          <p className="mb-2 text-xs leading-relaxed text-gray-600">{rarityInfo.description}</p>
          <div className="flex items-start gap-1.5 rounded bg-gray-50 p-1.5">
            <SparklesIcon
              className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <span className="text-[10px] text-gray-500">{rarityInfo.pullRate}</span>
          </div>
          {/* Arrow */}
          <div
            className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-gray-200 bg-white"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Rarity help panel showing all rarity explanations
 */
function RarityHelpPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4"
      role="region"
      aria-label="Rarity guide"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-700">
          <LightBulbIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Understanding Card Rarities
        </h4>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close rarity guide"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {RARITY_CATEGORIES.map((category) => {
          const rarityInfo = getRarityInfo(category.id);
          const Icon = category.icon;

          if (!rarityInfo) return null;

          return (
            <div
              key={category.id}
              className="rounded-lg border border-white/50 bg-white/60 p-2.5 shadow-sm"
            >
              <div className="mb-1 flex items-center gap-1.5">
                {Icon ? (
                  <Icon className={cn('h-4 w-4', category.textColor)} aria-hidden="true" />
                ) : (
                  <div
                    className={cn('h-4 w-4 rounded-full', category.bgColor)}
                    aria-hidden="true"
                  />
                )}
                <span className={cn('text-xs font-semibold', category.textColor)}>
                  {rarityInfo.name}
                </span>
              </div>
              <p className="mb-1.5 text-[11px] leading-relaxed text-gray-600">
                {rarityInfo.description}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <SparklesIcon className="h-3 w-3 text-amber-400" aria-hidden="true" />
                {rarityInfo.pullRate}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/80 p-2">
        <InformationCircleIcon
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500"
          aria-hidden="true"
        />
        <p className="text-[11px] text-gray-600">
          <span className="font-medium">Pro tip:</span> Hover over any rarity button to see a quick
          explanation. Keep your rare cards in sleeves to protect them!
        </p>
      </div>
    </div>
  );
}

export function RarityFilter({
  selectedRarity,
  onRarityChange,
  rarityCounts,
  showHelp = true,
}: RarityFilterProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Filter by Rarity</h3>
          {showHelp && (
            <button
              onClick={() => setHelpOpen(!helpOpen)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition',
                helpOpen
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
              )}
              aria-expanded={helpOpen}
              aria-label={helpOpen ? 'Close rarity guide' : 'What do these mean?'}
            >
              <QuestionMarkCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">
                {helpOpen ? 'Close guide' : 'What do these mean?'}
              </span>
            </button>
          )}
        </div>
        {selectedRarity && (
          <button
            onClick={() => onRarityChange(null)}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
            aria-label="Clear rarity filter"
          >
            <XMarkIcon className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Rarity filter options">
        {RARITY_CATEGORIES.map((category) => {
          const count = rarityCounts?.get(category.id) ?? 0;
          const isSelected = selectedRarity === category.id;

          return (
            <RarityButton
              key={category.id}
              category={category}
              count={count}
              isSelected={isSelected}
              onClick={() => onRarityChange(isSelected ? null : category.id)}
            />
          );
        })}
      </div>

      {/* Help Panel */}
      {helpOpen && <RarityHelpPanel onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
