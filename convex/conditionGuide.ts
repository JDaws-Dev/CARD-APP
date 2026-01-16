import { v } from 'convex/values';
import { query } from './_generated/server';

// ============================================================================
// CONDITION GUIDE DEFINITIONS
// ============================================================================

/**
 * Card condition definitions for Pokemon TCG cards.
 * Used for educational tooltips, grading guidance, and trading help.
 *
 * Condition grades follow standard TCG conventions:
 * - NM (Near Mint): Best condition for non-graded cards
 * - LP (Lightly Played): Minor wear, still excellent
 * - MP (Moderately Played): Noticeable wear, good for play
 * - HP (Heavily Played): Significant wear
 * - DMG (Damaged): Major damage, often not suitable for trading
 */

export interface ConditionDefinition {
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

/**
 * Complete condition definitions with all necessary data for educational tooltips.
 * Sorted from best condition (1) to worst (5).
 */
export const CONDITION_DEFINITIONS: readonly ConditionDefinition[] = [
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
// QUERIES
// ============================================================================

/**
 * Get all condition definitions.
 * Returns the complete list of condition grades with all educational content.
 */
export const getAllConditionDefinitions = query({
  args: {},
  handler: async () => {
    return {
      definitions: CONDITION_DEFINITIONS,
      count: CONDITION_DEFINITIONS.length,
    };
  },
});

/**
 * Get a single condition definition by ID.
 * Returns null if the condition ID is not found.
 */
export const getConditionById = query({
  args: { conditionId: v.string() },
  handler: async (ctx, args) => {
    const condition = CONDITION_DEFINITIONS.find((c) => c.id === args.conditionId);
    return condition ?? null;
  },
});

/**
 * Get a condition definition by short name (NM, LP, MP, HP, DMG).
 */
export const getConditionByShortName = query({
  args: { shortName: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.shortName.toUpperCase().trim();
    const condition = CONDITION_DEFINITIONS.find((c) => c.shortName === normalized);
    return condition ?? null;
  },
});

/**
 * Get tooltip data for a card condition.
 * Returns formatted data ready for display in a tooltip component.
 */
export const getConditionTooltip = query({
  args: { conditionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.conditionId) {
      return {
        found: false,
        condition: null,
        tooltip: {
          title: 'Unknown Condition',
          description: "This card's condition is not specified.",
          tip: '',
        },
      };
    }

    const normalized = args.conditionId.toLowerCase().trim();
    let condition: ConditionDefinition | null = null;

    // Try exact match on id first
    condition = CONDITION_DEFINITIONS.find((c) => c.id === normalized) ?? null;

    // Try short name if no match
    if (!condition) {
      const upperNormalized = args.conditionId.toUpperCase().trim();
      condition = CONDITION_DEFINITIONS.find((c) => c.shortName === upperNormalized) ?? null;
    }

    if (!condition) {
      return {
        found: false,
        condition: null,
        tooltip: {
          title: args.conditionId,
          description: "This is a condition grade we don't recognize.",
          tip: 'Ask a parent or check online for more information.',
        },
      };
    }

    return {
      found: true,
      condition,
      tooltip: {
        title: `${condition.icon} ${condition.name} (${condition.shortName})`,
        description: condition.description,
        tip: condition.collectorTip,
        whatToLookFor: condition.whatToLookFor,
        valueImpact: condition.valueImpact,
        damageExamples: condition.damageExamples,
      },
    };
  },
});

/**
 * Get condition comparison data for trade evaluation.
 * Helps kids understand if a trade is fair based on condition.
 */
export const getConditionComparison = query({
  args: {
    conditionA: v.string(),
    conditionB: v.string(),
  },
  handler: async (ctx, args) => {
    const condA = CONDITION_DEFINITIONS.find(
      (c) => c.id === args.conditionA.toLowerCase() || c.shortName === args.conditionA.toUpperCase()
    );
    const condB = CONDITION_DEFINITIONS.find(
      (c) => c.id === args.conditionB.toLowerCase() || c.shortName === args.conditionB.toUpperCase()
    );

    if (!condA || !condB) {
      return {
        found: false,
        conditionA: condA ?? null,
        conditionB: condB ?? null,
        comparison: null,
      };
    }

    const valueDifference = condA.approximateValuePercent - condB.approximateValuePercent;
    let comparisonMessage: string;

    if (valueDifference === 0) {
      comparisonMessage = `Both cards are in ${condA.name} condition - they're about equal in quality!`;
    } else if (valueDifference > 0) {
      comparisonMessage = `A ${condA.name} card is in better condition than a ${condB.name} card. The ${condA.shortName} card is worth more!`;
    } else {
      comparisonMessage = `A ${condB.name} card is in better condition than a ${condA.name} card. The ${condB.shortName} card is worth more!`;
    }

    return {
      found: true,
      conditionA: condA,
      conditionB: condB,
      comparison: {
        message: comparisonMessage,
        valueDifferencePercent: Math.abs(valueDifference),
        betterCondition: valueDifference >= 0 ? condA : condB,
        worseCondition: valueDifference >= 0 ? condB : condA,
        bothTradeAcceptable: condA.tradeAcceptable && condB.tradeAcceptable,
      },
    };
  },
});

/**
 * Get grading checklist for a specific condition.
 * Returns a checklist to help kids grade their own cards.
 */
export const getGradingChecklist = query({
  args: { targetCondition: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // If a specific condition is requested, return checklist for that condition
    if (args.targetCondition) {
      const condition = CONDITION_DEFINITIONS.find(
        (c) =>
          c.id === args.targetCondition?.toLowerCase() ||
          c.shortName === args.targetCondition?.toUpperCase()
      );

      if (!condition) {
        return {
          found: false,
          condition: null,
          checklist: null,
        };
      }

      return {
        found: true,
        condition,
        checklist: {
          title: `Is your card ${condition.name} (${condition.shortName})?`,
          checkItems: condition.whatToLookFor,
          icon: condition.icon,
          tip: condition.collectorTip,
        },
      };
    }

    // Return full grading guide for all conditions
    const fullChecklist = CONDITION_DEFINITIONS.map((c) => ({
      condition: c.name,
      shortName: c.shortName,
      icon: c.icon,
      checkItems: c.whatToLookFor,
      tip: c.collectorTip,
    }));

    return {
      found: true,
      condition: null,
      checklist: {
        title: 'Card Grading Guide',
        conditions: fullChecklist,
        instructions:
          'Look at your card carefully under good lighting. Start from Near Mint and work down until you find the condition that matches your card.',
      },
    };
  },
});

/**
 * Get all tradeworthy conditions.
 * Returns conditions that are generally acceptable for trading.
 */
export const getTradeworthyConditions = query({
  args: {},
  handler: async () => {
    const tradeable = CONDITION_DEFINITIONS.filter((c) => c.tradeAcceptable);
    return {
      conditions: tradeable,
      count: tradeable.length,
      advice:
        'Cards in NM, LP, or MP condition are usually good for trading. Always be honest about your card condition when trading with friends!',
    };
  },
});

/**
 * Get condition sort value for ordering cards.
 * Lower values = better condition (for sorting best condition first).
 */
export const getConditionSortValue = query({
  args: { conditionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const conditionId = args.conditionId;
    if (!conditionId) {
      return 999; // Unknown condition sorts last
    }

    const condition = CONDITION_DEFINITIONS.find(
      (c) => c.id === conditionId.toLowerCase() || c.shortName === conditionId.toUpperCase()
    );

    return condition?.sortOrder ?? 999;
  },
});
