'use client';

import { SparklesIcon, StarIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// Pokemon variant type definition - matches Pokemon TCG API price keys
export type PokemonVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

// Yu-Gi-Oh variant type definition - based on rarity
export type YugiohVariant =
  | 'common'
  | 'rare'
  | 'super_rare'
  | 'ultra_rare'
  | 'secret_rare'
  | 'ultimate_rare'
  | 'ghost_rare'
  | 'starlight_rare'
  | 'collector\'s_rare'
  | 'prismatic_secret_rare'
  | 'quarter_century_secret_rare';

// One Piece variant type definition - based on rarity and parallel art
export type OnePieceVariant =
  | 'leader' // L - Leader cards
  | 'common' // C - Common
  | 'uncommon' // UC - Uncommon
  | 'rare' // R - Rare
  | 'super_rare' // SR - Super Rare
  | 'secret_rare' // SEC - Secret Rare
  | 'special' // SP - Special
  | 'promo' // P - Promo
  | 'parallel'; // Parallel/alternate art version

// Combined variant type for backwards compatibility
export type CardVariant = PokemonVariant | YugiohVariant | OnePieceVariant | string;

// All possible Pokemon variants in display order
export const ALL_POKEMON_VARIANTS: PokemonVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  '1stEditionNormal',
  '1stEditionHolofoil',
];

// All possible Yu-Gi-Oh variants in display order (by rarity tier)
export const ALL_YUGIOH_VARIANTS: YugiohVariant[] = [
  'common',
  'rare',
  'super_rare',
  'ultra_rare',
  'secret_rare',
  'ultimate_rare',
  'ghost_rare',
  'starlight_rare',
  'collector\'s_rare',
  'prismatic_secret_rare',
  'quarter_century_secret_rare',
];

// All possible One Piece variants in display order (by rarity tier)
export const ALL_ONEPIECE_VARIANTS: OnePieceVariant[] = [
  'leader',
  'common',
  'uncommon',
  'rare',
  'super_rare',
  'secret_rare',
  'special',
  'promo',
  'parallel',
];

// Legacy export for backwards compatibility
export const ALL_VARIANTS: CardVariant[] = ALL_POKEMON_VARIANTS;

// Variant display configuration type
interface VariantDisplayConfig {
  label: string;
  shortLabel: string;
  gradient: string;
  bgOwned: string;
  bgUnowned: string;
  textOwned: string;
  textUnowned: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Pokemon variant display configuration
export const POKEMON_VARIANT_CONFIG: Record<PokemonVariant, VariantDisplayConfig> = {
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

// Yu-Gi-Oh variant display configuration
export const YUGIOH_VARIANT_CONFIG: Record<YugiohVariant, VariantDisplayConfig> = {
  common: {
    label: 'Common',
    shortLabel: 'C',
    gradient: 'from-gray-400 to-gray-500',
    bgOwned: 'bg-gradient-to-r from-gray-400 to-gray-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
  },
  rare: {
    label: 'Rare',
    shortLabel: 'R',
    gradient: 'from-blue-400 to-blue-600',
    bgOwned: 'bg-gradient-to-r from-blue-400 to-blue-600',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: StarIcon,
  },
  super_rare: {
    label: 'Super Rare',
    shortLabel: 'SR',
    gradient: 'from-cyan-400 to-blue-500',
    bgOwned: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  ultra_rare: {
    label: 'Ultra Rare',
    shortLabel: 'UR',
    gradient: 'from-yellow-400 to-amber-500',
    bgOwned: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  secret_rare: {
    label: 'Secret Rare',
    shortLabel: 'ScR',
    gradient: 'from-purple-400 to-pink-500',
    bgOwned: 'bg-gradient-to-r from-purple-400 to-pink-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  ultimate_rare: {
    label: 'Ultimate Rare',
    shortLabel: 'UtR',
    gradient: 'from-indigo-400 to-purple-600',
    bgOwned: 'bg-gradient-to-r from-indigo-400 to-purple-600',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  ghost_rare: {
    label: 'Ghost Rare',
    shortLabel: 'GR',
    gradient: 'from-slate-300 to-gray-400',
    bgOwned: 'bg-gradient-to-r from-slate-300 to-gray-400',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-gray-800',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  starlight_rare: {
    label: 'Starlight Rare',
    shortLabel: 'StR',
    gradient: 'from-rose-300 to-pink-400',
    bgOwned: 'bg-gradient-to-r from-rose-300 to-pink-400',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  'collector\'s_rare': {
    label: "Collector's Rare",
    shortLabel: 'CR',
    gradient: 'from-emerald-400 to-teal-500',
    bgOwned: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  prismatic_secret_rare: {
    label: 'Prismatic Secret',
    shortLabel: 'PScR',
    gradient: 'from-violet-400 to-fuchsia-500',
    bgOwned: 'bg-gradient-to-r from-violet-400 to-fuchsia-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  quarter_century_secret_rare: {
    label: 'Quarter Century',
    shortLabel: 'QCR',
    gradient: 'from-amber-300 to-yellow-400',
    bgOwned: 'bg-gradient-to-r from-amber-300 to-yellow-400',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-amber-900',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
};

// One Piece variant display configuration
export const ONEPIECE_VARIANT_CONFIG: Record<OnePieceVariant, VariantDisplayConfig> = {
  leader: {
    label: 'Leader',
    shortLabel: 'L',
    gradient: 'from-red-500 to-orange-500',
    bgOwned: 'bg-gradient-to-r from-red-500 to-orange-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: StarIcon,
  },
  common: {
    label: 'Common',
    shortLabel: 'C',
    gradient: 'from-gray-400 to-gray-500',
    bgOwned: 'bg-gradient-to-r from-gray-400 to-gray-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
  },
  uncommon: {
    label: 'Uncommon',
    shortLabel: 'UC',
    gradient: 'from-green-400 to-emerald-500',
    bgOwned: 'bg-gradient-to-r from-green-400 to-emerald-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
  },
  rare: {
    label: 'Rare',
    shortLabel: 'R',
    gradient: 'from-blue-400 to-blue-600',
    bgOwned: 'bg-gradient-to-r from-blue-400 to-blue-600',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: StarIcon,
  },
  super_rare: {
    label: 'Super Rare',
    shortLabel: 'SR',
    gradient: 'from-purple-400 to-indigo-500',
    bgOwned: 'bg-gradient-to-r from-purple-400 to-indigo-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  secret_rare: {
    label: 'Secret Rare',
    shortLabel: 'SEC',
    gradient: 'from-pink-400 to-rose-500',
    bgOwned: 'bg-gradient-to-r from-pink-400 to-rose-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  special: {
    label: 'Special',
    shortLabel: 'SP',
    gradient: 'from-amber-400 to-yellow-500',
    bgOwned: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
  promo: {
    label: 'Promo',
    shortLabel: 'P',
    gradient: 'from-cyan-400 to-teal-500',
    bgOwned: 'bg-gradient-to-r from-cyan-400 to-teal-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: StarIcon,
  },
  parallel: {
    label: 'Parallel',
    shortLabel: 'PAR',
    gradient: 'from-violet-400 to-fuchsia-500',
    bgOwned: 'bg-gradient-to-r from-violet-400 to-fuchsia-500',
    bgUnowned: 'bg-gray-200',
    textOwned: 'text-white',
    textUnowned: 'text-gray-400',
    icon: SparklesIcon,
  },
};

// Default config for unknown variants
const DEFAULT_VARIANT_CONFIG: VariantDisplayConfig = {
  label: 'Unknown',
  shortLabel: '?',
  gradient: 'from-gray-400 to-gray-500',
  bgOwned: 'bg-gradient-to-r from-gray-400 to-gray-500',
  bgUnowned: 'bg-gray-200',
  textOwned: 'text-white',
  textUnowned: 'text-gray-400',
};

// Helper to get variant config for any variant string
export function getVariantConfig(variant: string): VariantDisplayConfig {
  // Check Pokemon variants first
  if (variant in POKEMON_VARIANT_CONFIG) {
    return POKEMON_VARIANT_CONFIG[variant as PokemonVariant];
  }
  // Check Yu-Gi-Oh variants
  if (variant in YUGIOH_VARIANT_CONFIG) {
    return YUGIOH_VARIANT_CONFIG[variant as YugiohVariant];
  }
  // Check One Piece variants
  if (variant in ONEPIECE_VARIANT_CONFIG) {
    return ONEPIECE_VARIANT_CONFIG[variant as OnePieceVariant];
  }
  // Handle alt art variants (Yu-Gi-Oh)
  if (variant.startsWith('alt_art_')) {
    const artNum = variant.replace('alt_art_', '');
    return {
      ...DEFAULT_VARIANT_CONFIG,
      label: `Alt Art ${artNum}`,
      shortLabel: `A${artNum}`,
      gradient: 'from-teal-400 to-emerald-500',
      bgOwned: 'bg-gradient-to-r from-teal-400 to-emerald-500',
    };
  }
  // Handle parallel variants (One Piece)
  if (variant.startsWith('parallel_')) {
    const parallelNum = variant.replace('parallel_', '');
    return {
      ...ONEPIECE_VARIANT_CONFIG.parallel,
      label: `Parallel ${parallelNum}`,
      shortLabel: `P${parallelNum}`,
    };
  }
  // Return default with formatted label for unknown variants
  const formattedLabel = variant
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    ...DEFAULT_VARIANT_CONFIG,
    label: formattedLabel,
    shortLabel: formattedLabel.substring(0, 3).toUpperCase(),
  };
}

// Legacy export for backwards compatibility (Pokemon only)
export const VARIANT_CONFIG = POKEMON_VARIANT_CONFIG as Record<string, VariantDisplayConfig>;

interface VariantBadgeProps {
  variant: CardVariant;
  isOwned: boolean;
  quantity?: number;
  showQuantity?: boolean;
  className?: string;
  onClick?: (variant: CardVariant, isOwned: boolean) => void;
}

/**
 * VariantBadge - Displays a variant badge with owned/unowned styling.
 * Supports Pokemon variants (N/H/R/1N/1H) and Yu-Gi-Oh variants (C/R/SR/UR/ScR etc.).
 * Owned variants show with colored gradients, unowned show in gray.
 */
export function VariantBadge({
  variant,
  isOwned,
  quantity = 0,
  showQuantity = true,
  className,
  onClick,
}: VariantBadgeProps) {
  const config = getVariantConfig(variant);
  const isClickable = !!onClick;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(variant, isOwned);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium transition-all',
        isOwned ? config.bgOwned : config.bgUnowned,
        isOwned ? config.textOwned : config.textUnowned,
        isClickable && 'cursor-pointer hover:scale-110 hover:shadow-md active:scale-95',
        !isClickable && 'cursor-default',
        className
      )}
      title={isOwned ? `${config.label} x${quantity} - Click to manage` : `${config.label} - Click to add`}
    >
      {config.shortLabel}
      {showQuantity && isOwned && quantity > 1 && (
        <span className="text-white/80">x{quantity}</span>
      )}
    </button>
  );
}

interface VariantBadgeGroupProps {
  availableVariants: CardVariant[];
  ownedVariants: Map<CardVariant, number>;
  className?: string;
  showQuantity?: boolean;
  onBadgeClick?: (variant: CardVariant, isOwned: boolean) => void;
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
  onBadgeClick,
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
            onClick={onBadgeClick}
          />
        );
      })}
    </div>
  );
}
