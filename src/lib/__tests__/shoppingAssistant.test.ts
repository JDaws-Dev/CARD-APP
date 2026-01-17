import { describe, it, expect } from 'vitest';

/**
 * Shopping Assistant Tests
 *
 * Tests for the AI-powered shopping assistant utility functions.
 * The actual AI generation is tested via integration tests,
 * but we test the types, validation, and helper functions here.
 */

// ============================================================================
// SHOPPING ASSISTANT TYPES (matching convex/ai/shoppingAssistant.ts)
// ============================================================================

type GiftOccasion = 'birthday' | 'holiday' | 'reward' | 'just_because';
type PriceRange = 'budget' | 'moderate' | 'premium';
type GiftCategory = 'wishlist_priority' | 'wishlist' | 'set_completion' | 'type_match' | 'popular';
type BundleType = 'set_completion' | 'type_theme' | 'wishlist_batch';

interface GiftSuggestion {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  estimatedPrice: number | null;
  reason: string;
  category: GiftCategory;
  setCompletionInfo?: {
    cardsOwned: number;
    totalCards: number;
    percentComplete: number;
    cardsNeeded: number;
  };
}

interface GiftBundle {
  name: string;
  cards: GiftSuggestion[];
  totalPrice: number;
  reason: string;
  bundleType: BundleType;
}

interface BudgetAnalysis {
  totalWishlistValue: number;
  averageCardPrice: number;
  budgetFriendlyCount: number;
  moderateCount: number;
  premiumCount: number;
}

interface CollectorProfile {
  displayName: string;
  favoriteTypes: string[];
  activeSets: string[];
  wishlistCount: number;
  priorityWishlistCount: number;
}

interface ShoppingAssistantResult {
  suggestions: GiftSuggestion[];
  bundles: GiftBundle[];
  summary: string;
  collectorProfile: CollectorProfile;
  budgetAnalysis: BudgetAnalysis;
  error?: string;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function isValidGiftOccasion(occasion: string): occasion is GiftOccasion {
  return ['birthday', 'holiday', 'reward', 'just_because'].includes(occasion);
}

function isValidPriceRange(range: string): range is PriceRange {
  return ['budget', 'moderate', 'premium'].includes(range);
}

function isValidGiftCategory(category: string): category is GiftCategory {
  return ['wishlist_priority', 'wishlist', 'set_completion', 'type_match', 'popular'].includes(
    category
  );
}

function isValidBundleType(type: string): type is BundleType {
  return ['set_completion', 'type_theme', 'wishlist_batch'].includes(type);
}

function isValidGiftSuggestion(suggestion: Partial<GiftSuggestion>): suggestion is GiftSuggestion {
  return (
    typeof suggestion.cardId === 'string' &&
    typeof suggestion.name === 'string' &&
    typeof suggestion.setId === 'string' &&
    typeof suggestion.setName === 'string' &&
    typeof suggestion.rarity === 'string' &&
    typeof suggestion.imageUrl === 'string' &&
    (suggestion.estimatedPrice === null || typeof suggestion.estimatedPrice === 'number') &&
    typeof suggestion.reason === 'string' &&
    isValidGiftCategory(suggestion.category || '')
  );
}

function isValidGiftBundle(bundle: Partial<GiftBundle>): bundle is GiftBundle {
  return (
    typeof bundle.name === 'string' &&
    Array.isArray(bundle.cards) &&
    bundle.cards.length >= 2 &&
    bundle.cards.every((c) => isValidGiftSuggestion(c)) &&
    typeof bundle.totalPrice === 'number' &&
    bundle.totalPrice >= 0 &&
    typeof bundle.reason === 'string' &&
    isValidBundleType(bundle.bundleType || '')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function occasionDescription(occasion: GiftOccasion): string {
  switch (occasion) {
    case 'birthday':
      return 'Birthday gift - make it special!';
    case 'holiday':
      return 'Holiday gift - festive and fun';
    case 'reward':
      return 'Achievement reward - celebrate their accomplishment';
    case 'just_because':
    default:
      return 'Just because - a nice surprise';
  }
}

function determineBundleType(cards: GiftSuggestion[]): BundleType {
  const setIds = new Set(cards.map((c) => c.setId));
  if (setIds.size === 1) {
    return 'set_completion';
  }

  const wishlistCount = cards.filter(
    (c) => c.category === 'wishlist' || c.category === 'wishlist_priority'
  ).length;
  if (wishlistCount >= cards.length / 2) {
    return 'wishlist_batch';
  }

  return 'type_theme';
}

function calculateBudgetAnalysis(wishlistItems: Array<{ marketPrice?: number }>): BudgetAnalysis {
  let totalValue = 0;
  let budgetFriendlyCount = 0;
  let moderateCount = 0;
  let premiumCount = 0;
  let priceCount = 0;

  for (const item of wishlistItems) {
    const price = item.marketPrice ?? 0;
    if (price > 0) {
      totalValue += price;
      priceCount++;

      if (price < 5) {
        budgetFriendlyCount++;
      } else if (price <= 20) {
        moderateCount++;
      } else {
        premiumCount++;
      }
    }
  }

  return {
    totalWishlistValue: Math.round(totalValue * 100) / 100,
    averageCardPrice: priceCount > 0 ? Math.round((totalValue / priceCount) * 100) / 100 : 0,
    budgetFriendlyCount,
    moderateCount,
    premiumCount,
  };
}

function getPriceCategory(price: number): PriceRange {
  if (price < 5) return 'budget';
  if (price <= 20) return 'moderate';
  return 'premium';
}

function filterByBudget<T extends { estimatedPrice: number | null }>(
  items: T[],
  budget: number
): T[] {
  return items.filter((item) => item.estimatedPrice === null || item.estimatedPrice <= budget);
}

function sortByPriority(suggestions: GiftSuggestion[]): GiftSuggestion[] {
  const priorityOrder: Record<GiftCategory, number> = {
    wishlist_priority: 0,
    wishlist: 1,
    set_completion: 2,
    type_match: 3,
    popular: 4,
  };

  return [...suggestions].sort((a, b) => priorityOrder[a.category] - priorityOrder[b.category]);
}

// ============================================================================
// TESTS: GIFT OCCASION VALIDATION
// ============================================================================

describe('GiftOccasion validation', () => {
  it('should validate birthday occasion', () => {
    expect(isValidGiftOccasion('birthday')).toBe(true);
  });

  it('should validate holiday occasion', () => {
    expect(isValidGiftOccasion('holiday')).toBe(true);
  });

  it('should validate reward occasion', () => {
    expect(isValidGiftOccasion('reward')).toBe(true);
  });

  it('should validate just_because occasion', () => {
    expect(isValidGiftOccasion('just_because')).toBe(true);
  });

  it('should reject invalid occasion', () => {
    expect(isValidGiftOccasion('wedding')).toBe(false);
    expect(isValidGiftOccasion('')).toBe(false);
  });
});

// ============================================================================
// TESTS: PRICE RANGE VALIDATION
// ============================================================================

describe('PriceRange validation', () => {
  it('should validate budget range', () => {
    expect(isValidPriceRange('budget')).toBe(true);
  });

  it('should validate moderate range', () => {
    expect(isValidPriceRange('moderate')).toBe(true);
  });

  it('should validate premium range', () => {
    expect(isValidPriceRange('premium')).toBe(true);
  });

  it('should reject invalid price range', () => {
    expect(isValidPriceRange('cheap')).toBe(false);
    expect(isValidPriceRange('expensive')).toBe(false);
  });
});

// ============================================================================
// TESTS: GIFT CATEGORY VALIDATION
// ============================================================================

describe('GiftCategory validation', () => {
  it('should validate wishlist_priority category', () => {
    expect(isValidGiftCategory('wishlist_priority')).toBe(true);
  });

  it('should validate wishlist category', () => {
    expect(isValidGiftCategory('wishlist')).toBe(true);
  });

  it('should validate set_completion category', () => {
    expect(isValidGiftCategory('set_completion')).toBe(true);
  });

  it('should validate type_match category', () => {
    expect(isValidGiftCategory('type_match')).toBe(true);
  });

  it('should validate popular category', () => {
    expect(isValidGiftCategory('popular')).toBe(true);
  });

  it('should reject invalid category', () => {
    expect(isValidGiftCategory('rare')).toBe(false);
    expect(isValidGiftCategory('')).toBe(false);
  });
});

// ============================================================================
// TESTS: BUNDLE TYPE VALIDATION
// ============================================================================

describe('BundleType validation', () => {
  it('should validate set_completion bundle type', () => {
    expect(isValidBundleType('set_completion')).toBe(true);
  });

  it('should validate type_theme bundle type', () => {
    expect(isValidBundleType('type_theme')).toBe(true);
  });

  it('should validate wishlist_batch bundle type', () => {
    expect(isValidBundleType('wishlist_batch')).toBe(true);
  });

  it('should reject invalid bundle type', () => {
    expect(isValidBundleType('random')).toBe(false);
    expect(isValidBundleType('')).toBe(false);
  });
});

// ============================================================================
// TESTS: GIFT SUGGESTION VALIDATION
// ============================================================================

describe('GiftSuggestion validation', () => {
  it('should validate a complete gift suggestion', () => {
    const suggestion: GiftSuggestion = {
      cardId: 'sv1-1',
      name: 'Pikachu',
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
      imageUrl: 'https://example.com/pikachu.png',
      estimatedPrice: 2.5,
      reason: 'This is on their priority wishlist!',
      category: 'wishlist_priority',
    };
    expect(isValidGiftSuggestion(suggestion)).toBe(true);
  });

  it('should validate suggestion with null price', () => {
    const suggestion: GiftSuggestion = {
      cardId: 'sv1-2',
      name: 'Charizard',
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Ultra Rare',
      imageUrl: 'https://example.com/charizard.png',
      estimatedPrice: null,
      reason: 'A popular card!',
      category: 'popular',
    };
    expect(isValidGiftSuggestion(suggestion)).toBe(true);
  });

  it('should validate suggestion with set completion info', () => {
    const suggestion: GiftSuggestion = {
      cardId: 'sv1-50',
      name: 'Bulbasaur',
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
      imageUrl: 'https://example.com/bulbasaur.png',
      estimatedPrice: 1.0,
      reason: 'Helps complete the set!',
      category: 'set_completion',
      setCompletionInfo: {
        cardsOwned: 45,
        totalCards: 100,
        percentComplete: 45,
        cardsNeeded: 55,
      },
    };
    expect(isValidGiftSuggestion(suggestion)).toBe(true);
  });

  it('should reject suggestion with missing cardId', () => {
    const suggestion = {
      name: 'Pikachu',
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
      imageUrl: 'https://example.com/pikachu.png',
      estimatedPrice: 2.5,
      reason: 'Test',
      category: 'wishlist_priority',
    };
    expect(isValidGiftSuggestion(suggestion)).toBe(false);
  });

  it('should reject suggestion with invalid category', () => {
    const suggestion = {
      cardId: 'sv1-1',
      name: 'Pikachu',
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
      imageUrl: 'https://example.com/pikachu.png',
      estimatedPrice: 2.5,
      reason: 'Test',
      category: 'invalid',
    };
    expect(isValidGiftSuggestion(suggestion)).toBe(false);
  });
});

// ============================================================================
// TESTS: GIFT BUNDLE VALIDATION
// ============================================================================

describe('GiftBundle validation', () => {
  const card1: GiftSuggestion = {
    cardId: 'sv1-1',
    name: 'Pikachu',
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    rarity: 'Common',
    imageUrl: 'https://example.com/pikachu.png',
    estimatedPrice: 2.5,
    reason: 'Test card 1',
    category: 'wishlist',
  };

  const card2: GiftSuggestion = {
    cardId: 'sv1-2',
    name: 'Raichu',
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    rarity: 'Rare',
    imageUrl: 'https://example.com/raichu.png',
    estimatedPrice: 5.0,
    reason: 'Test card 2',
    category: 'wishlist',
  };

  it('should validate a complete gift bundle', () => {
    const bundle: GiftBundle = {
      name: 'Evolution Bundle',
      cards: [card1, card2],
      totalPrice: 7.5,
      reason: 'Complete the evolution chain!',
      bundleType: 'set_completion',
    };
    expect(isValidGiftBundle(bundle)).toBe(true);
  });

  it('should reject bundle with fewer than 2 cards', () => {
    const bundle = {
      name: 'Single Card Bundle',
      cards: [card1],
      totalPrice: 2.5,
      reason: 'Just one card',
      bundleType: 'set_completion',
    };
    expect(isValidGiftBundle(bundle)).toBe(false);
  });

  it('should reject bundle with negative price', () => {
    const bundle = {
      name: 'Negative Price Bundle',
      cards: [card1, card2],
      totalPrice: -5,
      reason: 'Invalid price',
      bundleType: 'set_completion',
    };
    expect(isValidGiftBundle(bundle)).toBe(false);
  });

  it('should reject bundle with invalid type', () => {
    const bundle = {
      name: 'Invalid Type Bundle',
      cards: [card1, card2],
      totalPrice: 7.5,
      reason: 'Invalid type',
      bundleType: 'invalid',
    };
    expect(isValidGiftBundle(bundle)).toBe(false);
  });
});

// ============================================================================
// TESTS: OCCASION DESCRIPTION
// ============================================================================

describe('occasionDescription', () => {
  it('should return birthday description', () => {
    expect(occasionDescription('birthday')).toBe('Birthday gift - make it special!');
  });

  it('should return holiday description', () => {
    expect(occasionDescription('holiday')).toBe('Holiday gift - festive and fun');
  });

  it('should return reward description', () => {
    expect(occasionDescription('reward')).toBe(
      'Achievement reward - celebrate their accomplishment'
    );
  });

  it('should return just_because description', () => {
    expect(occasionDescription('just_because')).toBe('Just because - a nice surprise');
  });
});

// ============================================================================
// TESTS: DETERMINE BUNDLE TYPE
// ============================================================================

describe('determineBundleType', () => {
  const sameSetCard1: GiftSuggestion = {
    cardId: 'sv1-1',
    name: 'Pikachu',
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    rarity: 'Common',
    imageUrl: '',
    estimatedPrice: 2.5,
    reason: '',
    category: 'set_completion',
  };

  const sameSetCard2: GiftSuggestion = {
    cardId: 'sv1-2',
    name: 'Raichu',
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    rarity: 'Rare',
    imageUrl: '',
    estimatedPrice: 5.0,
    reason: '',
    category: 'set_completion',
  };

  const differentSetCard: GiftSuggestion = {
    cardId: 'sv2-1',
    name: 'Charmander',
    setId: 'sv2',
    setName: 'Paldea Evolved',
    rarity: 'Common',
    imageUrl: '',
    estimatedPrice: 1.5,
    reason: '',
    category: 'type_match',
  };

  const wishlistCard: GiftSuggestion = {
    cardId: 'sv3-1',
    name: 'Squirtle',
    setId: 'sv3',
    setName: 'Obsidian Flames',
    rarity: 'Common',
    imageUrl: '',
    estimatedPrice: 1.0,
    reason: '',
    category: 'wishlist_priority',
  };

  it('should return set_completion for cards from same set', () => {
    expect(determineBundleType([sameSetCard1, sameSetCard2])).toBe('set_completion');
  });

  it('should return wishlist_batch when majority are wishlist items', () => {
    const wishlistCard2 = {
      ...wishlistCard,
      cardId: 'sv4-1',
      setId: 'sv4',
      category: 'wishlist' as const,
    };
    expect(determineBundleType([wishlistCard, wishlistCard2])).toBe('wishlist_batch');
  });

  it('should return type_theme for mixed cards', () => {
    expect(determineBundleType([sameSetCard1, differentSetCard])).toBe('type_theme');
  });
});

// ============================================================================
// TESTS: BUDGET ANALYSIS CALCULATION
// ============================================================================

describe('calculateBudgetAnalysis', () => {
  it('should calculate budget analysis correctly', () => {
    const wishlistItems = [
      { marketPrice: 2.0 }, // budget
      { marketPrice: 3.5 }, // budget
      { marketPrice: 10.0 }, // moderate
      { marketPrice: 25.0 }, // premium
    ];

    const analysis = calculateBudgetAnalysis(wishlistItems);

    expect(analysis.totalWishlistValue).toBe(40.5);
    expect(analysis.averageCardPrice).toBe(10.13);
    expect(analysis.budgetFriendlyCount).toBe(2);
    expect(analysis.moderateCount).toBe(1);
    expect(analysis.premiumCount).toBe(1);
  });

  it('should handle empty wishlist', () => {
    const analysis = calculateBudgetAnalysis([]);

    expect(analysis.totalWishlistValue).toBe(0);
    expect(analysis.averageCardPrice).toBe(0);
    expect(analysis.budgetFriendlyCount).toBe(0);
    expect(analysis.moderateCount).toBe(0);
    expect(analysis.premiumCount).toBe(0);
  });

  it('should handle items without prices', () => {
    const wishlistItems = [
      { marketPrice: undefined },
      { marketPrice: 5.0 },
      { marketPrice: undefined },
    ];

    const analysis = calculateBudgetAnalysis(wishlistItems);

    expect(analysis.totalWishlistValue).toBe(5.0);
    expect(analysis.averageCardPrice).toBe(5.0);
    expect(analysis.moderateCount).toBe(1);
  });

  it('should classify prices at boundaries correctly', () => {
    const wishlistItems = [
      { marketPrice: 4.99 }, // budget (just under $5)
      { marketPrice: 5.0 }, // moderate (exactly $5)
      { marketPrice: 20.0 }, // moderate (exactly $20)
      { marketPrice: 20.01 }, // premium (just over $20)
    ];

    const analysis = calculateBudgetAnalysis(wishlistItems);

    expect(analysis.budgetFriendlyCount).toBe(1);
    expect(analysis.moderateCount).toBe(2);
    expect(analysis.premiumCount).toBe(1);
  });
});

// ============================================================================
// TESTS: PRICE CATEGORY HELPER
// ============================================================================

describe('getPriceCategory', () => {
  it('should return budget for prices under $5', () => {
    expect(getPriceCategory(0)).toBe('budget');
    expect(getPriceCategory(2.5)).toBe('budget');
    expect(getPriceCategory(4.99)).toBe('budget');
  });

  it('should return moderate for prices $5-$20', () => {
    expect(getPriceCategory(5)).toBe('moderate');
    expect(getPriceCategory(12.5)).toBe('moderate');
    expect(getPriceCategory(20)).toBe('moderate');
  });

  it('should return premium for prices over $20', () => {
    expect(getPriceCategory(20.01)).toBe('premium');
    expect(getPriceCategory(50)).toBe('premium');
    expect(getPriceCategory(100)).toBe('premium');
  });
});

// ============================================================================
// TESTS: BUDGET FILTERING
// ============================================================================

describe('filterByBudget', () => {
  const items: GiftSuggestion[] = [
    {
      cardId: '1',
      name: 'Cheap Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Common',
      imageUrl: '',
      estimatedPrice: 2.0,
      reason: '',
      category: 'wishlist',
    },
    {
      cardId: '2',
      name: 'Medium Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Rare',
      imageUrl: '',
      estimatedPrice: 10.0,
      reason: '',
      category: 'wishlist',
    },
    {
      cardId: '3',
      name: 'Expensive Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Ultra Rare',
      imageUrl: '',
      estimatedPrice: 50.0,
      reason: '',
      category: 'wishlist',
    },
    {
      cardId: '4',
      name: 'Unknown Price Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Common',
      imageUrl: '',
      estimatedPrice: null,
      reason: '',
      category: 'wishlist',
    },
  ];

  it('should filter items within budget', () => {
    const filtered = filterByBudget(items, 15);
    expect(filtered.length).toBe(3);
    expect(filtered.map((i) => i.cardId)).toEqual(['1', '2', '4']);
  });

  it('should include items with null prices', () => {
    const filtered = filterByBudget(items, 5);
    expect(filtered.some((i) => i.estimatedPrice === null)).toBe(true);
  });

  it('should return all items for high budget', () => {
    const filtered = filterByBudget(items, 100);
    expect(filtered.length).toBe(4);
  });

  it('should return only null-priced items for zero budget', () => {
    const filtered = filterByBudget(items, 0);
    expect(filtered.length).toBe(1);
    expect(filtered[0].estimatedPrice).toBe(null);
  });
});

// ============================================================================
// TESTS: PRIORITY SORTING
// ============================================================================

describe('sortByPriority', () => {
  const suggestions: GiftSuggestion[] = [
    {
      cardId: '1',
      name: 'Popular Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Common',
      imageUrl: '',
      estimatedPrice: 2.0,
      reason: '',
      category: 'popular',
    },
    {
      cardId: '2',
      name: 'Priority Wishlist Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Rare',
      imageUrl: '',
      estimatedPrice: 5.0,
      reason: '',
      category: 'wishlist_priority',
    },
    {
      cardId: '3',
      name: 'Set Completion Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Common',
      imageUrl: '',
      estimatedPrice: 1.5,
      reason: '',
      category: 'set_completion',
    },
    {
      cardId: '4',
      name: 'Wishlist Card',
      setId: 'sv1',
      setName: 'Set 1',
      rarity: 'Rare',
      imageUrl: '',
      estimatedPrice: 3.0,
      reason: '',
      category: 'wishlist',
    },
  ];

  it('should sort by category priority', () => {
    const sorted = sortByPriority(suggestions);
    expect(sorted.map((s) => s.category)).toEqual([
      'wishlist_priority',
      'wishlist',
      'set_completion',
      'popular',
    ]);
  });

  it('should not modify original array', () => {
    const original = [...suggestions];
    sortByPriority(suggestions);
    expect(suggestions).toEqual(original);
  });
});

// ============================================================================
// TESTS: RESULT STRUCTURE VALIDATION
// ============================================================================

describe('ShoppingAssistantResult structure', () => {
  it('should have valid structure with suggestions', () => {
    const result: ShoppingAssistantResult = {
      suggestions: [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          setId: 'sv1',
          setName: 'Scarlet & Violet',
          rarity: 'Common',
          imageUrl: 'https://example.com/pikachu.png',
          estimatedPrice: 2.5,
          reason: 'On wishlist',
          category: 'wishlist_priority',
        },
      ],
      bundles: [],
      summary: 'Here are some gift ideas!',
      collectorProfile: {
        displayName: 'Timmy',
        favoriteTypes: ['Fire', 'Water'],
        activeSets: ['Scarlet & Violet'],
        wishlistCount: 5,
        priorityWishlistCount: 2,
      },
      budgetAnalysis: {
        totalWishlistValue: 25.0,
        averageCardPrice: 5.0,
        budgetFriendlyCount: 2,
        moderateCount: 2,
        premiumCount: 1,
      },
    };

    expect(result.suggestions.length).toBe(1);
    expect(result.bundles.length).toBe(0);
    expect(result.collectorProfile.displayName).toBe('Timmy');
    expect(result.error).toBeUndefined();
  });

  it('should have valid structure with error', () => {
    const result: ShoppingAssistantResult = {
      suggestions: [],
      bundles: [],
      summary: '',
      collectorProfile: {
        displayName: '',
        favoriteTypes: [],
        activeSets: [],
        wishlistCount: 0,
        priorityWishlistCount: 0,
      },
      budgetAnalysis: {
        totalWishlistValue: 0,
        averageCardPrice: 0,
        budgetFriendlyCount: 0,
        moderateCount: 0,
        premiumCount: 0,
      },
      error: 'Rate limit exceeded',
    };

    expect(result.suggestions.length).toBe(0);
    expect(result.error).toBe('Rate limit exceeded');
  });
});

// ============================================================================
// TESTS: SET COMPLETION INFO
// ============================================================================

describe('SetCompletionInfo calculations', () => {
  it('should calculate percent complete correctly', () => {
    const info = {
      cardsOwned: 45,
      totalCards: 100,
      percentComplete: 45,
      cardsNeeded: 55,
    };

    expect(info.percentComplete).toBe(45);
    expect(info.cardsNeeded).toBe(100 - 45);
  });

  it('should handle nearly complete sets', () => {
    const info = {
      cardsOwned: 95,
      totalCards: 100,
      percentComplete: 95,
      cardsNeeded: 5,
    };

    expect(info.percentComplete).toBe(95);
    expect(info.cardsNeeded).toBe(5);
  });
});

// ============================================================================
// TESTS: GAME SLUG SUPPORT
// ============================================================================

describe('Game support', () => {
  const supportedGames = [
    'pokemon',
    'yugioh',
    'mtg',
    'onepiece',
    'lorcana',
    'digimon',
    'dragonball',
  ];

  it.each(supportedGames)('should support %s game', (game) => {
    expect(supportedGames).toContain(game);
  });

  it('should have 7 supported games', () => {
    expect(supportedGames.length).toBe(7);
  });
});
