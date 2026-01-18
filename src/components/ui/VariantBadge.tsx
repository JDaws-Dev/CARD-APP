'use client';

import { SparklesIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// Variant type definition - matches Pokemon TCG API price keys
export type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

// All possible variants in display order
export const ALL_VARIANTS: CardVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  '1stEditionNormal',
  '1stEditionHolofoil',
];

// Variant display configuration
export const VARIANT_CONFIG: Record<
  CardVariant,
  {
    label: string;
    shortLabel: string;
    gradient: string;
    bgOwned: string;
    bgUnowned: string;
    textOwned: string;
    textUnowned: string;
    icon?: React.ComponentType<{ className?: string }>;
  }
> = {
  normal: {
    label: 'Normal',
    shortLabel: 'N',
    gradient: 'from-gray-400 to-gray-500',
    bgOwned: 'bg-gradient-to-r from-gray-400 to-gray-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
  },
  holofoil: {
    label: 'Holofoil',
    shortLabel: 'H',
    gradient: 'from-purple-400 to-indigo-500',
    bgOwned: 'bg-gradient-to-r from-purple-400 to-indigo-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  reverseHolofoil: {
    label: 'Reverse Holo',
    shortLabel: 'R',
    gradient: 'from-cyan-400 to-blue-500',
    bgOwned: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  '1stEditionNormal': {
    label: '1st Edition',
    shortLabel: '1N',
    gradient: 'from-amber-400 to-orange-500',
    bgOwned: 'bg-gradient-to-r from-amber-400 to-orange-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
  },
  '1stEditionHolofoil': {
    label: '1st Ed. Holo',
    shortLabel: '1H',
    gradient: 'from-amber-400 to-yellow-500',
    bgOwned: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
};

interface VariantBadgeProps {
  variant: CardVariant;
  isOwned: boolean;
  quantity?: number;
  showQuantity?: boolean;
  className?: string;
}

/**
 * VariantBadge - Displays a variant badge (N/H/R/1N/1H) with owned/unowned styling.
 * Owned variants show with colored gradients, unowned show in gray.
 */
export function VariantBadge({
  variant,
  isOwned,
  quantity = 0,
  showQuantity = true,
  className,
}: VariantBadgeProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium transition-all',
        isOwned ? config.bgOwned : config.bgUnowned,
        isOwned ? config.textOwned : config.textUnowned,
        className
      )}
      title={isOwned ? `${config.label} x${quantity}` : `${config.label} - Not owned`}
    >
      {config.shortLabel}
      {showQuantity && isOwned && quantity > 1 && (
        <span className="text-white/80">x{quantity}</span>
      )}
    </span>
  );
}

interface VariantBadgeGroupProps {
  availableVariants: CardVariant[];
  ownedVariants: Map<CardVariant, number>;
  className?: string;
  showQuantity?: boolean;
}

/**
 * VariantBadgeGroup - Displays a row of variant badges for a card.
 * Shows all available variants with owned/unowned styling.
 */
export function VariantBadgeGroup({
  availableVariants,
  ownedVariants,
  className,
  showQuantity = true,
}: VariantBadgeGroupProps) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {availableVariants.map((variant) => {
        const qty = ownedVariants.get(variant) ?? 0;
        const isOwned = qty > 0;

        return (
          <VariantBadge
            key={variant}
            variant={variant}
            isOwned={isOwned}
            quantity={qty}
            showQuantity={showQuantity}
          />
        );
      })}
    </div>
  );
}
