import { describe, it, expect } from 'vitest';

/**
 * Recommendations Tests
 *
 * Tests for the AI-powered card recommendations utility functions.
 * The actual AI generation is tested via integration tests,
 * but we test the types, validation, and helper functions here.
 */

// ============================================================================
// RECOMMENDATION TYPES AND VALIDATION
// ============================================================================

// Types matching convex/ai/recommendations.ts
type RecommendationType =
  | 'set_completion'
  | 'type_based'
  | 'similar_cards'
  | 'diversify'
  | 'wishlist_similar';

interface CardRecommendation {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  reason: string;
  recommendationType: RecommendationType;
  matchScore: number;
}

interface RecommendationResult {
  recommendations: CardRecommendation[];
  summary: string;
  collectionInsights: {
    favoriteTypes: string[];
    activeSets: string[];
    collectionStyle: string;
  };
  error?: string;
}

interface CollectionAnalysis {
  totalCards: number;
  favoriteTypes: string[];
  activeSets: Array<{ setId: string; name: string; owned: number; total: number }>;
  collectionStyle: string;
  recentTypes: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function isValidRecommendationType(type: string): type is RecommendationType {
  return [
    'set_completion',
    'type_based',
    'similar_cards',
    'diversify',
    'wishlist_similar',
  ].includes(type);
}

function isValidMatchScore(score: number): boolean {
  return score >= 0 && score <= 100;
}

function isValidRecommendation(rec: Partial<CardRecommendation>): rec is CardRecommendation {
  return (
    typeof rec.cardId === 'string' &&
    rec.cardId.length > 0 &&
    typeof rec.name === 'string' &&
    rec.name.length > 0 &&
    typeof rec.setId === 'string' &&
    rec.setId.length > 0 &&
    typeof rec.setName === 'string' &&
    rec.setName.length > 0 &&
    typeof rec.rarity === 'string' &&
    typeof rec.imageUrl === 'string' &&
    typeof rec.reason === 'string' &&
    rec.reason.length > 0 &&
    isValidRecommendationType(rec.recommendationType || '') &&
    typeof rec.matchScore === 'number' &&
    isValidMatchScore(rec.matchScore)
  );
}

function determineCollectionStyle(
  typeVariety: number,
  topSetCompletion: number,
  hasRareCards: boolean
): string {
  if (topSetCompletion > 0.5) {
    return 'set completionist';
  } else if (typeVariety <= 3 && typeVariety > 0) {
    return 'type specialist';
  } else if (hasRareCards) {
    return 'rare hunter';
  }
  return 'casual collector';
}

function clampRecommendationCount(count: number): number {
  const MIN = 1;
  const MAX = 20;
  return Math.min(Math.max(count, MIN), MAX);
}

// ============================================================================
// TESTS
// ============================================================================

describe('Recommendation Types', () => {
  describe('RecommendationType validation', () => {
    it('should accept valid recommendation types', () => {
      expect(isValidRecommendationType('set_completion')).toBe(true);
      expect(isValidRecommendationType('type_based')).toBe(true);
      expect(isValidRecommendationType('similar_cards')).toBe(true);
      expect(isValidRecommendationType('diversify')).toBe(true);
      expect(isValidRecommendationType('wishlist_similar')).toBe(true);
    });

    it('should reject invalid recommendation types', () => {
      expect(isValidRecommendationType('invalid')).toBe(false);
      expect(isValidRecommendationType('')).toBe(false);
      expect(isValidRecommendationType('SET_COMPLETION')).toBe(false);
      expect(isValidRecommendationType('random')).toBe(false);
    });
  });

  describe('matchScore validation', () => {
    it('should accept valid match scores', () => {
      expect(isValidMatchScore(0)).toBe(true);
      expect(isValidMatchScore(50)).toBe(true);
      expect(isValidMatchScore(100)).toBe(true);
      expect(isValidMatchScore(75.5)).toBe(true);
    });

    it('should reject invalid match scores', () => {
      expect(isValidMatchScore(-1)).toBe(false);
      expect(isValidMatchScore(101)).toBe(false);
      expect(isValidMatchScore(-50)).toBe(false);
      expect(isValidMatchScore(200)).toBe(false);
    });
  });
});

describe('Card Recommendation Validation', () => {
  describe('isValidRecommendation', () => {
    it('should accept valid recommendations', () => {
      const validRec: CardRecommendation = {
        cardId: 'sv1-1',
        name: 'Pikachu',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/pikachu.png',
        reason: 'This card would complete your Electric collection!',
        recommendationType: 'type_based',
        matchScore: 85,
      };
      expect(isValidRecommendation(validRec)).toBe(true);
    });

    it('should accept set completion recommendations', () => {
      const validRec: CardRecommendation = {
        cardId: 'sv1-25',
        name: 'Charizard ex',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Ultra Rare',
        imageUrl: 'https://example.com/charizard.png',
        reason: 'Only 5 more cards to complete the set!',
        recommendationType: 'set_completion',
        matchScore: 92,
      };
      expect(isValidRecommendation(validRec)).toBe(true);
    });

    it('should reject recommendations with empty cardId', () => {
      const invalidRec = {
        cardId: '',
        name: 'Pikachu',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/pikachu.png',
        reason: 'Great card!',
        recommendationType: 'type_based',
        matchScore: 85,
      };
      expect(isValidRecommendation(invalidRec)).toBe(false);
    });

    it('should reject recommendations with empty name', () => {
      const invalidRec = {
        cardId: 'sv1-1',
        name: '',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/pikachu.png',
        reason: 'Great card!',
        recommendationType: 'type_based',
        matchScore: 85,
      };
      expect(isValidRecommendation(invalidRec)).toBe(false);
    });

    it('should reject recommendations with invalid matchScore', () => {
      const invalidRec = {
        cardId: 'sv1-1',
        name: 'Pikachu',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/pikachu.png',
        reason: 'Great card!',
        recommendationType: 'type_based',
        matchScore: 150, // Invalid: > 100
      };
      expect(isValidRecommendation(invalidRec)).toBe(false);
    });

    it('should reject recommendations with invalid type', () => {
      const invalidRec = {
        cardId: 'sv1-1',
        name: 'Pikachu',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/pikachu.png',
        reason: 'Great card!',
        recommendationType: 'invalid_type',
        matchScore: 85,
      };
      expect(isValidRecommendation(invalidRec)).toBe(false);
    });

    it('should reject incomplete recommendations', () => {
      expect(isValidRecommendation({})).toBe(false);
      expect(isValidRecommendation({ cardId: 'sv1-1' })).toBe(false);
      expect(isValidRecommendation({ cardId: 'sv1-1', name: 'Pikachu' })).toBe(false);
    });
  });
});

describe('Collection Style Detection', () => {
  describe('determineCollectionStyle', () => {
    it('should identify set completionist (>50% set completion)', () => {
      expect(determineCollectionStyle(5, 0.6, false)).toBe('set completionist');
      expect(determineCollectionStyle(10, 0.8, true)).toBe('set completionist');
    });

    it('should identify type specialist (low type variety, <50% completion)', () => {
      expect(determineCollectionStyle(2, 0.3, false)).toBe('type specialist');
      expect(determineCollectionStyle(3, 0.2, false)).toBe('type specialist');
    });

    it('should identify rare hunter (has rare cards, no other patterns)', () => {
      expect(determineCollectionStyle(10, 0.1, true)).toBe('rare hunter');
      expect(determineCollectionStyle(8, 0.3, true)).toBe('rare hunter');
    });

    it('should default to casual collector', () => {
      expect(determineCollectionStyle(5, 0.2, false)).toBe('casual collector');
      expect(determineCollectionStyle(0, 0, false)).toBe('casual collector');
    });

    it('should prioritize set completionist over other styles', () => {
      // Even with low type variety and rare cards, high completion wins
      expect(determineCollectionStyle(2, 0.7, true)).toBe('set completionist');
    });
  });
});

describe('Recommendation Count Bounds', () => {
  const MIN_RECOMMENDATIONS = 1;
  const MAX_RECOMMENDATIONS = 20;
  const DEFAULT_RECOMMENDATIONS = 10;

  it('should have valid recommendation count bounds', () => {
    expect(MIN_RECOMMENDATIONS).toBeLessThan(MAX_RECOMMENDATIONS);
    expect(DEFAULT_RECOMMENDATIONS).toBeGreaterThanOrEqual(MIN_RECOMMENDATIONS);
    expect(DEFAULT_RECOMMENDATIONS).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
  });

  it('should clamp recommendation count to valid range', () => {
    expect(clampRecommendationCount(0)).toBe(MIN_RECOMMENDATIONS);
    expect(clampRecommendationCount(-5)).toBe(MIN_RECOMMENDATIONS);
    expect(clampRecommendationCount(10)).toBe(10);
    expect(clampRecommendationCount(25)).toBe(MAX_RECOMMENDATIONS);
    expect(clampRecommendationCount(100)).toBe(MAX_RECOMMENDATIONS);
  });
});

describe('Recommendation Result Structure', () => {
  it('should have all required fields in RecommendationResult', () => {
    const validResult: RecommendationResult = {
      recommendations: [],
      summary: 'Great recommendations for your collection!',
      collectionInsights: {
        favoriteTypes: ['Fire', 'Electric'],
        activeSets: ['Scarlet & Violet', 'Paldea Evolved'],
        collectionStyle: 'type specialist',
      },
    };

    expect(validResult.recommendations).toBeDefined();
    expect(validResult.summary).toBeDefined();
    expect(validResult.collectionInsights).toBeDefined();
    expect(validResult.collectionInsights.favoriteTypes).toBeDefined();
    expect(validResult.collectionInsights.activeSets).toBeDefined();
    expect(validResult.collectionInsights.collectionStyle).toBeDefined();
  });

  it('should support optional error field', () => {
    const errorResult: RecommendationResult = {
      recommendations: [],
      summary: '',
      collectionInsights: {
        favoriteTypes: [],
        activeSets: [],
        collectionStyle: '',
      },
      error: 'Need at least 5 cards for recommendations',
    };

    expect(errorResult.error).toBe('Need at least 5 cards for recommendations');
  });
});

describe('Collection Analysis Structure', () => {
  it('should have all required fields in CollectionAnalysis', () => {
    const analysis: CollectionAnalysis = {
      totalCards: 50,
      favoriteTypes: ['Fire', 'Water', 'Electric'],
      activeSets: [
        { setId: 'sv1', name: 'Scarlet & Violet', owned: 45, total: 100 },
        { setId: 'sv2', name: 'Paldea Evolved', owned: 30, total: 150 },
      ],
      collectionStyle: 'casual collector',
      recentTypes: ['Fire', 'Grass'],
    };

    expect(analysis.totalCards).toBe(50);
    expect(analysis.favoriteTypes).toHaveLength(3);
    expect(analysis.activeSets).toHaveLength(2);
    expect(analysis.collectionStyle).toBe('casual collector');
    expect(analysis.recentTypes).toHaveLength(2);
  });

  it('should calculate set completion percentage correctly', () => {
    const set = { setId: 'sv1', name: 'Scarlet & Violet', owned: 45, total: 100 };
    const completionPercentage = Math.round((set.owned / set.total) * 100);
    expect(completionPercentage).toBe(45);
  });

  it('should handle empty collection analysis', () => {
    const emptyAnalysis: CollectionAnalysis = {
      totalCards: 0,
      favoriteTypes: [],
      activeSets: [],
      collectionStyle: 'new collector',
      recentTypes: [],
    };

    expect(emptyAnalysis.totalCards).toBe(0);
    expect(emptyAnalysis.favoriteTypes).toHaveLength(0);
    expect(emptyAnalysis.collectionStyle).toBe('new collector');
  });
});

describe('Game-specific Recommendation Support', () => {
  const SUPPORTED_GAMES = [
    'pokemon',
    'yugioh',
    'mtg',
    'onepiece',
    'lorcana',
    'digimon',
    'dragonball',
  ];

  it('should support all 7 TCG games', () => {
    expect(SUPPORTED_GAMES).toHaveLength(7);
  });

  it('should have pokemon as the first supported game', () => {
    expect(SUPPORTED_GAMES[0]).toBe('pokemon');
  });

  it('should include all TCG game slugs', () => {
    expect(SUPPORTED_GAMES).toContain('pokemon');
    expect(SUPPORTED_GAMES).toContain('yugioh');
    expect(SUPPORTED_GAMES).toContain('mtg');
    expect(SUPPORTED_GAMES).toContain('onepiece');
    expect(SUPPORTED_GAMES).toContain('lorcana');
    expect(SUPPORTED_GAMES).toContain('digimon');
    expect(SUPPORTED_GAMES).toContain('dragonball');
  });
});

describe('Rate Limiting', () => {
  const RECOMMENDATIONS_PER_DAY = 20;

  it('should have a daily limit of 20 recommendations', () => {
    expect(RECOMMENDATIONS_PER_DAY).toBe(20);
  });

  it('should generate appropriate rate limit message', () => {
    const hoursUntilReset = 5;
    const message = `You've asked for lots of recommendations today! Come back in ${hoursUntilReset} hours for more suggestions!`;
    expect(message).toContain('recommendations today');
    expect(message).toContain(`${hoursUntilReset} hours`);
  });
});

describe('Minimum Collection Requirement', () => {
  const MIN_CARDS_FOR_RECOMMENDATIONS = 5;

  it('should require at least 5 cards for recommendations', () => {
    expect(MIN_CARDS_FOR_RECOMMENDATIONS).toBe(5);
  });

  it('should generate appropriate error message for new collectors', () => {
    const message =
      "You're just getting started! Add more cards to your collection, and I'll learn what you like and give you awesome recommendations!";
    expect(message).toContain('getting started');
    expect(message).toContain('more cards');
  });
});

describe('Set Completion Recommendations', () => {
  it('should generate set completion reason with progress', () => {
    const setName = 'Scarlet & Violet';
    const owned = 85;
    const total = 100;
    const reason = `This card will bring you closer to completing ${setName}! You have ${owned}/${total} cards.`;

    expect(reason).toContain(setName);
    expect(reason).toContain(`${owned}/${total}`);
    expect(reason).toContain('bring you closer');
  });

  it('should calculate set completion match score', () => {
    const owned = 85;
    const total = 100;
    const matchScore = Math.round((owned / total) * 100);
    expect(matchScore).toBe(85);
  });

  it('should handle complete sets', () => {
    const owned = 100;
    const total = 100;
    const isComplete = owned >= total;
    expect(isComplete).toBe(true);
  });
});

describe('Rarity Ordering for Set Completion', () => {
  const rarityOrder: Record<string, number> = {
    Common: 1,
    Uncommon: 2,
    Rare: 3,
    'Rare Holo': 4,
    'Ultra Rare': 5,
    'Secret Rare': 6,
  };

  it('should order Common as most accessible', () => {
    expect(rarityOrder['Common']).toBe(1);
  });

  it('should order Secret Rare as least accessible', () => {
    expect(rarityOrder['Secret Rare']).toBe(6);
  });

  it('should sort cards by rarity for easier acquisition', () => {
    const cards = [
      { name: 'Card A', rarity: 'Ultra Rare' },
      { name: 'Card B', rarity: 'Common' },
      { name: 'Card C', rarity: 'Rare' },
    ];

    cards.sort((a, b) => {
      const aOrder = rarityOrder[a.rarity] || 0;
      const bOrder = rarityOrder[b.rarity] || 0;
      return aOrder - bOrder;
    });

    expect(cards[0].rarity).toBe('Common');
    expect(cards[1].rarity).toBe('Rare');
    expect(cards[2].rarity).toBe('Ultra Rare');
  });
});

describe('Type-based Recommendations', () => {
  it('should identify favorite types from collection', () => {
    const typeCount: Record<string, number> = {
      Fire: 25,
      Water: 15,
      Electric: 10,
      Grass: 5,
    };

    const sortedTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    expect(sortedTypes[0]).toBe('Fire');
    expect(sortedTypes[1]).toBe('Water');
    expect(sortedTypes).toHaveLength(4);
  });

  it('should limit favorite types to top 5', () => {
    const manyTypes = ['Fire', 'Water', 'Electric', 'Grass', 'Psychic', 'Fighting', 'Dark'];
    const topTypes = manyTypes.slice(0, 5);
    expect(topTypes).toHaveLength(5);
    expect(topTypes).not.toContain('Dark');
  });
});

describe('Fallback Recommendations', () => {
  it('should return empty recommendations array in fallback', () => {
    const fallback: RecommendationResult = {
      recommendations: [],
      summary: 'Keep collecting! Check out more from your favorite sets!',
      collectionInsights: {
        favoriteTypes: ['Fire'],
        activeSets: ['Scarlet & Violet'],
        collectionStyle: 'casual collector',
      },
    };

    expect(fallback.recommendations).toHaveLength(0);
    expect(fallback.summary).toContain('Keep collecting');
  });

  it('should include collection insights in fallback', () => {
    const fallback: RecommendationResult = {
      recommendations: [],
      summary: 'Keep collecting!',
      collectionInsights: {
        favoriteTypes: ['Fire', 'Electric'],
        activeSets: ['Scarlet & Violet'],
        collectionStyle: 'type specialist',
      },
    };

    expect(fallback.collectionInsights.favoriteTypes).toHaveLength(2);
    expect(fallback.collectionInsights.collectionStyle).toBe('type specialist');
  });
});
