'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Variant types - matching the VARIANT_CONFIG in CollectionView
export const VARIANT_CATEGORIES = [
  {
    id: 'normal',
    label: 'Normal',
    shortLabel: 'N',
    gradient: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: null,
    description: 'Standard non-holographic card',
  },
  {
    id: 'holofoil',
    label: 'Holofoil',
    shortLabel: 'H',
    gradient: 'from-purple-400 to-indigo-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: SparklesIcon,
    description: 'Holographic foil on the card artwork',
  },
  {
    id: 'reverseHolofoil',
    label: 'Reverse Holo',
    shortLabel: 'R',
    gradient: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    icon: SparklesIcon,
    description: 'Holographic foil on the card frame instead of artwork',
  },
  {
    id: '1stEditionHolofoil',
    label: '1st Ed. Holo',
    shortLabel: '1H',
    gradient: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: SparklesIcon,
    description: 'First edition print with holographic artwork',
  },
  {
    id: '1stEditionNormal',
    label: '1st Edition',
    shortLabel: '1N',
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: null,
    description: 'First edition print without holographic effect',
  },
] as const;

export type VariantCategoryId = (typeof VARIANT_CATEGORIES)[number]['id'];

interface VariantFilterProps {
  selectedVariant: VariantCategoryId | null;
  onVariantChange: (variant: VariantCategoryId | null) => void;
  variantCounts?: Map<VariantCategoryId, number>;
}

/**
 * Individual variant button with hover tooltip
 */
function VariantButton({
  category,
  count,
  isSelected,
  onClick,
}: {
  category: (typeof VARIANT_CATEGORIES)[number];
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = category.icon;

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 400);
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
        aria-describedby={showTooltip ? `variant-tip-${category.id}` : undefined}
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
      {showTooltip && (
        <div
          id={`variant-tip-${category.id}`}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            {Icon ? (
              <Icon className={cn('h-4 w-4', category.textColor)} aria-hidden="true" />
            ) : (
              <div className={cn('h-4 w-4 rounded-full', category.bgColor)} aria-hidden="true" />
            )}
            <span className={cn('text-sm font-semibold', category.textColor)}>
              {category.label}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-gray-600">{category.description}</p>
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

export function VariantFilter({
  selectedVariant,
  onVariantChange,
  variantCounts,
}: VariantFilterProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Filter by Variant</h3>
        {selectedVariant && (
          <button
            onClick={() => onVariantChange(null)}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
            aria-label="Clear variant filter"
          >
            <XMarkIcon className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Variant filter options">
        {VARIANT_CATEGORIES.map((category) => {
          const count = variantCounts?.get(category.id) ?? 0;
          const isSelected = selectedVariant === category.id;

          return (
            <VariantButton
              key={category.id}
              category={category}
              count={count}
              isSelected={isSelected}
              onClick={() => onVariantChange(isSelected ? null : category.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
