/**
 * Card Condition Guide - Educational content and utilities for understanding card conditions
 * Provides kid-friendly explanations, grading guidance, and trading help.
 *
 * This module contains pure utility functions that complement the Convex queries
 * in convex/conditionGuide.ts. Use these functions for client-side operations.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ConditionInfo {
  /** Unique identifier for the condition (nm, lp, mp, hp, dmg) */
  id: string;
  /** Full display name */
  name: string;
  /** Short abbreviation */
  shortName: string;
  /** Kid-friendly description of this condition */
  description: string;
  /** What to look for when grading this condition */
  whatToLookFor: string[];
  /** How this condition affects value (kid-friendly) */
  valueImpact: string;
  /** Helpful advice for young collectors */
  collectorTip: string;
  /** Sort order for condition grading (lower = better condition) */
  sortOrder: number;
  /** CSS color class for UI display */
  colorClass: string;
  /** Emoji icon for UI */
  icon: string;
  /** Approximate value percentage compared to NM (for educational purposes) */
  approximateValuePercent: number;
  /** Whether this condition is acceptable for trading (general guidance) */
  tradeAcceptable: boolean;
  /** Example damage types for this condition */
  damageExamples: string[];
}

export interface ConditionTooltipData {
  title: string;
  description: string;
  tip: string;
  whatToLookFor?: string[];
  valueImpact?: string;
  damageExamples?: string[];
}

export interface ConditionComparisonResult {
  conditionA: ConditionInfo;
  conditionB: ConditionInfo;
  valueDifferencePercent: number;
  betterCondition: ConditionInfo;
  worseCondition: ConditionInfo;
  comparisonMessage: string;
  bothTradeAcceptable: boolean;
}

export interface GradingChecklistItem {
  condition: ConditionInfo;
  checkItems: string[];
  passesCheck: boolean;
}

export interface ConditionStats {
  totalCards: number;
  distribution: { condition: ConditionInfo; count: number; percentage: number }[];
  averageCondition: ConditionInfo | null;
  bestCondition: ConditionInfo | null;
  worstCondition: ConditionInfo | null;
}

// ============================================================================
// CONDITION DEFINITIONS CONSTANT
// ============================================================================

/**
 * Comprehensive condition information for educational tooltips.
 * Sorted from best condition (sortOrder 1) to worst (sortOrder 5).
 */
export const CONDITION_GRADES: readonly ConditionInfo[] = [
  {
    id: 'nm',
    name: 'Near Mint',
    shortName: 'NM',
    description:
      'Almost perfect! This card looks like it just came out of a pack. The best condition for ungraded cards.',
    whatToLookFor: [
      'No visible scratches or scuffs',
      'Corners are sharp and not bent',
      'No whitening on edges',
      'Surface is clean and smooth',
      'Card is flat with no bends or warps',
    ],
    valueImpact: 'Near Mint cards are worth the most! Collectors love them.',
    collectorTip: 'Use sleeves and toploaders to keep your best cards in Near Mint condition!',
    sortOrder: 1,
    colorClass: 'text-green-500',
    icon: '✨',
    approximateValuePercent: 100,
    tradeAcceptable: true,
    damageExamples: ['None - the card looks perfect!'],
  },
  {
    id: 'lp',
    name: 'Lightly Played',
    shortName: 'LP',
    description:
      "Very good condition with only tiny signs of wear. You'd need to look closely to notice anything.",
    whatToLookFor: [
      'Tiny scratches visible only up close',
      'Very slight corner wear',
      'Minor edge whitening (barely visible)',
      'Surface has minimal marks',
      'Card is mostly flat',
    ],
    valueImpact: 'Worth a bit less than Near Mint, but still very valuable for collectors.',
    collectorTip:
      'LP cards are great for binders and casual collecting. Protect them to prevent more wear!',
    sortOrder: 2,
    colorClass: 'text-blue-500',
    icon: '👍',
    approximateValuePercent: 80,
    tradeAcceptable: true,
    damageExamples: [
      'Light scratching on the holo',
      'Tiny edge wear',
      'Very minor corner softness',
    ],
  },
  {
    id: 'mp',
    name: 'Moderately Played',
    shortName: 'MP',
    description:
      "Noticeable wear but the card is still in good shape. Perfect for playing with or if you're not worried about condition.",
    whatToLookFor: [
      'Visible scratches on surface',
      'Noticeable corner and edge wear',
      'Some whitening on edges',
      'Minor creases possible',
      'Light scuffing on surface',
    ],
    valueImpact: 'Worth less than LP, but can still be a good deal for rare cards!',
    collectorTip:
      'MP cards are perfect for building decks to play with. You can still enjoy the card!',
    sortOrder: 3,
    colorClass: 'text-yellow-500',
    icon: '👌',
    approximateValuePercent: 50,
    tradeAcceptable: true,
    damageExamples: [
      'Multiple scratches',
      'Visible edge whitening',
      'Corners are worn down',
      'Light creasing',
    ],
  },
  {
    id: 'hp',
    name: 'Heavily Played',
    shortName: 'HP',
    description:
      'This card has been well-loved! It has significant wear but is still recognizable and playable.',
    whatToLookFor: [
      'Heavy scratching',
      'Major corner damage',
      'Significant edge wear',
      'Visible creases or bends',
      'Surface damage like peeling',
    ],
    valueImpact:
      'Worth much less, but can be a budget-friendly way to get rare cards for your collection.',
    collectorTip: 'HP cards can be good for playing if you just want to use the card in a deck!',
    sortOrder: 4,
    colorClass: 'text-orange-500',
    icon: '⚠️',
    approximateValuePercent: 25,
    tradeAcceptable: false,
    damageExamples: [
      'Deep scratches',
      'Bent or creased cards',
      'Major whitening',
      'Corners folded or torn',
      'Water damage spots',
    ],
  },
  {
    id: 'dmg',
    name: 'Damaged',
    shortName: 'DMG',
    description:
      'This card has major damage. It might have tears, water damage, or other serious issues.',
    whatToLookFor: [
      'Tears or rips',
      'Water damage',
      'Missing pieces',
      'Severe bends or folds',
      'Writing or stickers on the card',
    ],
    valueImpact:
      'Usually worth very little, but sometimes still fun to keep for your personal collection!',
    collectorTip:
      'Damaged cards can still bring back great memories! Keep them in a special binder.',
    sortOrder: 5,
    colorClass: 'text-red-500',
    icon: '❌',
    approximateValuePercent: 10,
    tradeAcceptable: false,
    damageExamples: [
      'Ripped or torn cards',
      'Severe water damage',
      'Cards written on with pen/marker',
      'Missing corners',
      'Stickers stuck on the card',
    ],
  },
] as const;

// ============================================================================
// CORE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get condition info by ID.
 */
export function getConditionInfo(conditionId: string): ConditionInfo | null {
  return CONDITION_GRADES.find((c) => c.id === conditionId) ?? null;
}

/**
 * Get condition info by short name (NM, LP, MP, HP, DMG).
 */
export function getConditionByShortName(shortName: string): ConditionInfo | null {
  if (!shortName) return null;
  const normalized = shortName.toUpperCase().trim();
  return CONDITION_GRADES.find((c) => c.shortName === normalized) ?? null;
}

/**
 * Get condition info by name or short name (case insensitive).
 */
export function getConditionByNameOrShortName(input: string): ConditionInfo | null {
  if (!input) return null;
  const normalized = input.toLowerCase().trim();

  // Try ID match first
  const idMatch = CONDITION_GRADES.find((c) => c.id === normalized);
  if (idMatch) return idMatch;

  // Try name match
  const nameMatch = CONDITION_GRADES.find((c) => c.name.toLowerCase() === normalized);
  if (nameMatch) return nameMatch;

  // Try short name match
  const shortNameMatch = CONDITION_GRADES.find((c) => c.shortName.toLowerCase() === normalized);
  if (shortNameMatch) return shortNameMatch;

  return null;
}

/**
 * Get all condition grades.
 */
export function getAllConditionGrades(): readonly ConditionInfo[] {
  return CONDITION_GRADES;
}

/**
 * Get condition by sort order.
 */
export function getConditionBySortOrder(sortOrder: number): ConditionInfo | null {
  return CONDITION_GRADES.find((c) => c.sortOrder === sortOrder) ?? null;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a condition ID is valid.
 */
export function isValidConditionId(conditionId: string): boolean {
  return CONDITION_GRADES.some((c) => c.id === conditionId);
}

/**
 * Check if a short name is valid.
 */
export function isValidConditionShortName(shortName: string): boolean {
  if (!shortName) return false;
  const normalized = shortName.toUpperCase().trim();
  return CONDITION_GRADES.some((c) => c.shortName === normalized);
}

/**
 * Get all valid condition IDs.
 */
export function getValidConditionIds(): string[] {
  return CONDITION_GRADES.map((c) => c.id);
}

/**
 * Get all valid short names.
 */
export function getValidConditionShortNames(): string[] {
  return CONDITION_GRADES.map((c) => c.shortName);
}

// ============================================================================
// COMPARISON & SORTING FUNCTIONS
// ============================================================================

/**
 * Compare two conditions by their sort order.
 * Returns negative if a is better, positive if a is worse, 0 if equal.
 */
export function compareConditions(conditionA: string | null, conditionB: string | null): number {
  const infoA = conditionA ? getConditionByNameOrShortName(conditionA) : null;
  const infoB = conditionB ? getConditionByNameOrShortName(conditionB) : null;

  const orderA = infoA?.sortOrder ?? 999;
  const orderB = infoB?.sortOrder ?? 999;

  return orderA - orderB;
}

/**
 * Get the sort value for a condition string.
 * Lower values = better condition.
 */
export function getConditionSortValue(conditionString: string | null | undefined): number {
  if (!conditionString) return 999;
  const info = getConditionByNameOrShortName(conditionString);
  return info?.sortOrder ?? 999;
}

/**
 * Check if conditionA is better than conditionB.
 */
export function isBetterConditionThan(
  conditionA: string | null,
  conditionB: string | null
): boolean {
  return compareConditions(conditionA, conditionB) < 0;
}

/**
 * Check if conditionA is worse than conditionB.
 */
export function isWorseConditionThan(
  conditionA: string | null,
  conditionB: string | null
): boolean {
  return compareConditions(conditionA, conditionB) > 0;
}

/**
 * Sort an array of condition strings from best to worst.
 */
export function sortConditionsBestFirst(conditions: string[]): string[] {
  return [...conditions].sort(compareConditions);
}

/**
 * Sort an array of condition strings from worst to best.
 */
export function sortConditionsWorstFirst(conditions: string[]): string[] {
  return [...conditions].sort((a, b) => compareConditions(b, a));
}

// ============================================================================
// TOOLTIP & DISPLAY FUNCTIONS
// ============================================================================

/**
 * Get tooltip data for a condition string.
 */
export function getConditionTooltipData(
  conditionString: string | null | undefined
): ConditionTooltipData {
  if (!conditionString) {
    return {
      title: 'Unknown Condition',
      description: "This card's condition is not specified.",
      tip: '',
    };
  }

  const info = getConditionByNameOrShortName(conditionString);

  if (!info) {
    return {
      title: conditionString,
      description: "This is a condition grade we don't recognize.",
      tip: 'Ask a parent or check online for more information.',
    };
  }

  return {
    title: `${info.icon} ${info.name} (${info.shortName})`,
    description: info.description,
    tip: info.collectorTip,
    whatToLookFor: info.whatToLookFor,
    valueImpact: info.valueImpact,
    damageExamples: info.damageExamples,
  };
}

/**
 * Get the display label for a condition.
 */
export function getConditionDisplayLabel(conditionString: string | null | undefined): string {
  if (!conditionString) return 'Unknown';
  const info = getConditionByNameOrShortName(conditionString);
  return info ? `${info.icon} ${info.name}` : conditionString;
}

/**
 * Get the short display label for a condition.
 */
export function getConditionShortLabel(conditionString: string | null | undefined): string {
  if (!conditionString) return '?';
  const info = getConditionByNameOrShortName(conditionString);
  return info?.shortName ?? '?';
}

/**
 * Get the icon for a condition.
 */
export function getConditionIcon(conditionString: string | null | undefined): string {
  if (!conditionString) return '❓';
  const info = getConditionByNameOrShortName(conditionString);
  return info?.icon ?? '❓';
}

/**
 * Get the CSS color class for a condition.
 */
export function getConditionColorClass(conditionString: string | null | undefined): string {
  if (!conditionString) return 'text-gray-400';
  const info = getConditionByNameOrShortName(conditionString);
  return info?.colorClass ?? 'text-gray-400';
}

// ============================================================================
// CONDITION COMPARISON FUNCTIONS
// ============================================================================

/**
 * Compare two conditions and get detailed comparison info.
 */
export function compareConditionsDetailed(
  conditionA: string,
  conditionB: string
): ConditionComparisonResult | null {
  const infoA = getConditionByNameOrShortName(conditionA);
  const infoB = getConditionByNameOrShortName(conditionB);

  if (!infoA || !infoB) {
    return null;
  }

  const valueDifference = infoA.approximateValuePercent - infoB.approximateValuePercent;
  let comparisonMessage: string;

  if (valueDifference === 0) {
    comparisonMessage = `Both cards are in ${infoA.name} condition - they're about equal in quality!`;
  } else if (valueDifference > 0) {
    comparisonMessage = `A ${infoA.name} card is in better condition than a ${infoB.name} card. The ${infoA.shortName} card is worth more!`;
  } else {
    comparisonMessage = `A ${infoB.name} card is in better condition than a ${infoA.name} card. The ${infoB.shortName} card is worth more!`;
  }

  return {
    conditionA: infoA,
    conditionB: infoB,
    valueDifferencePercent: Math.abs(valueDifference),
    betterCondition: valueDifference >= 0 ? infoA : infoB,
    worseCondition: valueDifference >= 0 ? infoB : infoA,
    comparisonMessage,
    bothTradeAcceptable: infoA.tradeAcceptable && infoB.tradeAcceptable,
  };
}

/**
 * Calculate approximate value percentage for a condition.
 */
export function getApproximateValuePercent(conditionString: string | null | undefined): number {
  if (!conditionString) return 0;
  const info = getConditionByNameOrShortName(conditionString);
  return info?.approximateValuePercent ?? 0;
}

/**
 * Check if a condition is acceptable for trading.
 */
export function isTradeAcceptable(conditionString: string | null | undefined): boolean {
  if (!conditionString) return false;
  const info = getConditionByNameOrShortName(conditionString);
  return info?.tradeAcceptable ?? false;
}

/**
 * Get all trade-acceptable conditions.
 */
export function getTradeAcceptableConditions(): ConditionInfo[] {
  return CONDITION_GRADES.filter((c) => c.tradeAcceptable);
}

/**
 * Get all non-trade-acceptable conditions.
 */
export function getNonTradeAcceptableConditions(): ConditionInfo[] {
  return CONDITION_GRADES.filter((c) => !c.tradeAcceptable);
}

// ============================================================================
// GRADING HELPER FUNCTIONS
// ============================================================================

/**
 * Get grading guidance message based on condition.
 */
export function getGradingGuidance(conditionId: string): string {
  const condition = getConditionInfo(conditionId);
  if (!condition) {
    return 'Look at your card carefully under good lighting to determine its condition.';
  }

  switch (conditionId) {
    case 'nm':
      return "Check every corner and edge - if there's ANY wear, it's probably LP instead.";
    case 'lp':
      return 'Look for tiny imperfections like light edge wear or barely visible scratches.';
    case 'mp':
      return "If wear is visible from arm's length, it's likely MP or worse.";
    case 'hp':
      return "If there are creases, heavy scratches, or damage visible immediately, it's HP.";
    case 'dmg':
      return 'Cards with tears, water damage, or writing on them are considered Damaged.';
    default:
      return 'Examine your card under good lighting to assess its condition.';
  }
}

/**
 * Get the next better condition (if any).
 */
export function getNextBetterCondition(conditionString: string): ConditionInfo | null {
  const current = getConditionByNameOrShortName(conditionString);
  if (!current || current.sortOrder <= 1) return null;
  return getConditionBySortOrder(current.sortOrder - 1);
}

/**
 * Get the next worse condition (if any).
 */
export function getNextWorseCondition(conditionString: string): ConditionInfo | null {
  const current = getConditionByNameOrShortName(conditionString);
  if (!current || current.sortOrder >= 5) return null;
  return getConditionBySortOrder(current.sortOrder + 1);
}

/**
 * Get condition grade from a damage description.
 * Returns the likely condition based on described damage.
 */
export function estimateConditionFromDamage(damageDescription: string): ConditionInfo | null {
  if (!damageDescription) return null;

  const normalized = damageDescription.toLowerCase();

  // Check for Damaged indicators
  if (
    normalized.includes('tear') ||
    normalized.includes('rip') ||
    normalized.includes('water damage') ||
    normalized.includes('missing') ||
    normalized.includes('writing') ||
    normalized.includes('marker') ||
    normalized.includes('pen') ||
    normalized.includes('sticker')
  ) {
    return getConditionInfo('dmg');
  }

  // Check for Heavily Played indicators
  if (
    normalized.includes('heavy scratch') ||
    normalized.includes('deep scratch') ||
    normalized.includes('crease') ||
    normalized.includes('bend') ||
    normalized.includes('bent') ||
    normalized.includes('folded') ||
    normalized.includes('major')
  ) {
    return getConditionInfo('hp');
  }

  // Check for Lightly Played indicators (check BEFORE MP since words like "slight" should win)
  if (
    normalized.includes('tiny') ||
    normalized.includes('minor') ||
    normalized.includes('slight') ||
    normalized.includes('light') ||
    normalized.includes('small')
  ) {
    return getConditionInfo('lp');
  }

  // Check for Moderately Played indicators
  if (
    normalized.includes('multiple scratch') ||
    normalized.includes('visible') ||
    normalized.includes('noticeable') ||
    normalized.includes('whitening') ||
    normalized.includes('edge wear') ||
    normalized.includes('worn')
  ) {
    return getConditionInfo('mp');
  }

  // Check for Near Mint indicators
  if (
    normalized.includes('perfect') ||
    normalized.includes('mint') ||
    normalized.includes('no damage') ||
    normalized.includes('pack fresh')
  ) {
    return getConditionInfo('nm');
  }

  // Default to MP if we can't determine
  return null;
}

// ============================================================================
// STATISTICS & DISTRIBUTION FUNCTIONS
// ============================================================================

/**
 * Calculate condition distribution from an array of condition strings.
 */
export function calculateConditionDistribution(conditionStrings: (string | null | undefined)[]): {
  distribution: { condition: ConditionInfo; count: number; percentage: number }[];
  unknown: string[];
  totalCards: number;
} {
  const counts: Record<string, number> = {};
  const unknown: string[] = [];

  for (const condStr of conditionStrings) {
    if (!condStr) continue;

    const info = getConditionByNameOrShortName(condStr);
    if (info) {
      counts[info.id] = (counts[info.id] ?? 0) + 1;
    } else {
      unknown.push(condStr);
    }
  }

  const totalKnown = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const distribution = CONDITION_GRADES.filter((c) => (counts[c.id] ?? 0) > 0).map((c) => ({
    condition: c,
    count: counts[c.id] ?? 0,
    percentage: totalKnown > 0 ? Math.round(((counts[c.id] ?? 0) / totalKnown) * 100) : 0,
  }));

  return {
    distribution,
    unknown,
    totalCards: totalKnown + unknown.length,
  };
}

/**
 * Get comprehensive condition statistics for a collection.
 */
export function getConditionStats(conditionStrings: (string | null | undefined)[]): ConditionStats {
  const { distribution, totalCards } = calculateConditionDistribution(conditionStrings);

  // Find best condition in collection (lowest sortOrder with count > 0)
  const bestItem = distribution.length > 0 ? distribution[0] : null;

  // Find worst condition in collection (highest sortOrder with count > 0)
  const worstItem = distribution.length > 0 ? distribution[distribution.length - 1] : null;

  // Calculate average condition (weighted by count)
  let totalWeight = 0;
  let totalSortOrder = 0;
  for (const item of distribution) {
    totalWeight += item.count;
    totalSortOrder += item.condition.sortOrder * item.count;
  }

  let averageCondition: ConditionInfo | null = null;
  if (totalWeight > 0) {
    const avgSortOrder = Math.round(totalSortOrder / totalWeight);
    averageCondition = getConditionBySortOrder(avgSortOrder);
  }

  return {
    totalCards,
    distribution,
    averageCondition,
    bestCondition: bestItem?.condition ?? null,
    worstCondition: worstItem?.condition ?? null,
  };
}

/**
 * Get the percentage of trade-acceptable cards in a collection.
 */
export function getTradeablePercentage(conditionStrings: (string | null | undefined)[]): number {
  const { distribution, totalCards } = calculateConditionDistribution(conditionStrings);
  if (totalCards === 0) return 0;

  const tradeable = distribution
    .filter((item) => item.condition.tradeAcceptable)
    .reduce((sum, item) => sum + item.count, 0);

  return Math.round((tradeable / totalCards) * 100);
}

// ============================================================================
// EDUCATIONAL CONTENT HELPERS
// ============================================================================

/**
 * Get a kid-friendly explanation of condition grading.
 */
export function getConditionExplanation(): string {
  return `Card condition tells you how much wear a card has:
• ✨ NM (Near Mint) - Like new, perfect condition
• 👍 LP (Lightly Played) - Tiny wear, barely noticeable
• 👌 MP (Moderately Played) - Noticeable wear, still good
• ⚠️ HP (Heavily Played) - Lots of wear
• ❌ DMG (Damaged) - Major damage like tears or water damage`;
}

/**
 * Get fun facts about card conditions.
 */
export function getConditionFunFacts(conditionId: string): string[] {
  const facts: Record<string, string[]> = {
    nm: [
      'Near Mint cards are the gold standard for collectors!',
      'Professional graders look at NM cards under magnification.',
      'Keeping cards NM requires proper storage from day one.',
    ],
    lp: [
      'Most cards from played decks end up as LP over time.',
      'LP cards are still great for serious collections!',
      'Penny sleeves help prevent cards from becoming LP.',
    ],
    mp: [
      'MP cards are perfect for playing in casual decks.',
      'Many vintage cards are naturally MP after decades.',
      'You can find rare cards more affordably in MP condition!',
    ],
    hp: [
      'HP cards tell a story of being played and loved!',
      "Competitive players often use HP cards they don't need to protect.",
      'Some HP cards can still be worth money if they are rare enough!',
    ],
    dmg: [
      'Damaged cards from your childhood are still special memories!',
      "Some players keep their first-ever cards even if they're damaged.",
      'Damaged cards can be great for art projects or custom crafts!',
    ],
  };

  return facts[conditionId] ?? ['Every card has its own story!'];
}

/**
 * Get card care advice to maintain or improve condition.
 */
export function getCardCareAdvice(conditionId: string): string {
  const advice: Record<string, string> = {
    nm: 'Store in penny sleeves inside toploaders or magnetic holders. Keep away from sunlight and humidity.',
    lp: 'Put in sleeves immediately to prevent more wear. Consider a binder with side-loading pages.',
    mp: 'These are perfect for deck use! Double-sleeve if using in tournaments.',
    hp: 'Keep in a sleeve to prevent further damage. Great for casual play!',
    dmg: 'Store separately so they don\'t damage other cards. Consider a "memory" binder.',
  };

  return advice[conditionId] ?? 'Store all cards in a cool, dry place away from direct sunlight.';
}

/**
 * Check if a card condition is considered "collectible" (NM or LP).
 */
export function isCollectibleCondition(conditionString: string | null | undefined): boolean {
  if (!conditionString) return false;
  const info = getConditionByNameOrShortName(conditionString);
  return info !== null && info.sortOrder <= 2;
}

/**
 * Check if a card condition is considered "playable" (usable in decks).
 */
export function isPlayableCondition(conditionString: string | null | undefined): boolean {
  if (!conditionString) return false;
  const info = getConditionByNameOrShortName(conditionString);
  // All conditions except DMG are technically playable
  return info !== null && info.sortOrder <= 4;
}

/**
 * Get the condition tier name for grouping.
 */
export function getConditionTier(conditionString: string | null | undefined): string {
  if (!conditionString) return 'Unknown';
  const info = getConditionByNameOrShortName(conditionString);
  return info?.name ?? 'Unknown';
}

/**
 * Format condition for display with icon.
 */
export function formatConditionWithIcon(conditionString: string | null | undefined): string {
  if (!conditionString) return '❓ Unknown';
  const info = getConditionByNameOrShortName(conditionString);
  if (!info) return `❓ ${conditionString}`;
  return `${info.icon} ${info.shortName}`;
}
