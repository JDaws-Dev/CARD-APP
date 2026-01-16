/**
 * Rarity Explainer - Educational content for understanding card rarities
 * Provides kid-friendly explanations and examples for each rarity tier
 */

export interface RarityInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  examples: string[];
  pullRate: string; // Kid-friendly description of how often you find these
  collectorTip: string; // Helpful collecting advice
}

/**
 * Comprehensive rarity information for educational tooltips
 */
export const RARITY_EXPLAINERS: RarityInfo[] = [
  {
    id: 'common',
    name: 'Common',
    shortName: 'C',
    description: 'The most frequently found cards in packs. Great for building your collection!',
    examples: ['Basic Pokémon', 'Trainer Items', 'Energy cards'],
    pullRate: 'Found in almost every pack',
    collectorTip: 'Common cards are perfect for trading with friends!',
  },
  {
    id: 'uncommon',
    name: 'Uncommon',
    shortName: 'U',
    description:
      'A step up from common cards. These are a bit harder to find but still appear regularly.',
    examples: ['Stage 1 Pokémon', 'Supporter cards', 'Special Items'],
    pullRate: 'Usually 2-3 per pack',
    collectorTip: 'Watch for uncommon cards with useful abilities!',
  },
  {
    id: 'rare',
    name: 'Rare',
    shortName: 'R',
    description:
      'Special cards with a star symbol. Holofoil rare cards have a shiny, sparkly look!',
    examples: ['Holographic cards', 'Stage 2 Pokémon', 'Powerful Trainers'],
    pullRate: 'About 1 per pack (regular) or 1 in 3 packs (holo)',
    collectorTip: 'Keep your rare holos in sleeves to protect them!',
  },
  {
    id: 'ultra-rare',
    name: 'Ultra Rare',
    shortName: 'UR',
    description: 'Powerful and beautiful cards featuring special Pokémon like EX, GX, V, and VMAX!',
    examples: ['Pokémon EX/GX', 'Pokémon V/VMAX', 'Full Art cards'],
    pullRate: 'About 1 in every 5-8 packs',
    collectorTip: 'Ultra rares are often valuable - consider double sleeving!',
  },
  {
    id: 'secret-rare',
    name: 'Secret Rare',
    shortName: 'SR',
    description:
      'The rarest cards in a set! Numbered higher than the set size with stunning artwork.',
    examples: ['Gold cards', 'Rainbow rare', 'Alt Art', 'Special Illustration'],
    pullRate: 'Very rare - about 1 in 20+ packs',
    collectorTip: 'Secret rares are highly collectible and often worth the most!',
  },
  {
    id: 'promo',
    name: 'Promo',
    shortName: 'P',
    description:
      "Special cards given away at events, in boxes, or with products. Can't be found in regular packs!",
    examples: ['Event exclusives', 'Box toppers', 'Build & Battle promos'],
    pullRate: 'Only from special products or events',
    collectorTip: 'Promo cards are great conversation starters for your collection!',
  },
];

/**
 * Get rarity info by ID
 */
export function getRarityInfo(rarityId: string): RarityInfo | null {
  return RARITY_EXPLAINERS.find((r) => r.id === rarityId) || null;
}

/**
 * Get rarity info by display name or raw rarity string from the API
 */
export function getRarityInfoByName(rarityName: string): RarityInfo | null {
  if (!rarityName) return null;

  const normalizedName = rarityName.toLowerCase();

  // Direct name match
  const directMatch = RARITY_EXPLAINERS.find(
    (r) => r.name.toLowerCase() === normalizedName || r.shortName.toLowerCase() === normalizedName
  );
  if (directMatch) return directMatch;

  // Match based on keywords for API rarity strings
  if (normalizedName.includes('common') && !normalizedName.includes('uncommon')) {
    return getRarityInfo('common');
  }
  if (normalizedName.includes('uncommon')) {
    return getRarityInfo('uncommon');
  }
  if (
    normalizedName.includes('ultra') ||
    normalizedName.includes(' ex') ||
    normalizedName.includes(' gx') ||
    normalizedName.includes(' v') ||
    normalizedName.includes('vmax') ||
    normalizedName.includes('vstar') ||
    normalizedName.includes('double rare')
  ) {
    return getRarityInfo('ultra-rare');
  }
  if (
    normalizedName.includes('secret') ||
    normalizedName.includes('rainbow') ||
    normalizedName.includes('shiny') ||
    normalizedName.includes('shining') ||
    normalizedName.includes('illustration') ||
    normalizedName.includes('hyper') ||
    normalizedName.includes('amazing') ||
    normalizedName.includes('legend')
  ) {
    return getRarityInfo('secret-rare');
  }
  if (normalizedName.includes('promo') || normalizedName.includes('classic collection')) {
    return getRarityInfo('promo');
  }
  if (normalizedName.includes('rare')) {
    return getRarityInfo('rare');
  }

  return null;
}

/**
 * Get all rarity explainers
 */
export function getAllRarityInfo(): RarityInfo[] {
  return RARITY_EXPLAINERS;
}
