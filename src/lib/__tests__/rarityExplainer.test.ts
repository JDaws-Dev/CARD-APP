import { describe, it, expect, test } from 'vitest';
import {
  // Constants
  RARITY_EXPLAINERS,
  // Types
  type RarityInfo,
  type RarityTooltipData,
  type RarityDistributionItem,
  type RarityStats,
  // Core lookup functions
  getRarityInfo,
  getRarityInfoByName,
  getAllRarityInfo,
  getRarityBySortOrder,
  // Keyword matching
  matchRarityByKeywords,
  // Validation functions
  isValidRarityId,
  getValidRarityIds,
  getRarityShortNames,
  // Comparison & sorting functions
  compareRarities,
  getRaritySortValue,
  isRarerThan,
  isMoreCommonThan,
  sortRaritiesCommonFirst,
  sortRaritiesRareFirst,
  // Tooltip & display functions
  getRarityTooltipData,
  getRarityDisplayLabel,
  getRarityShortLabel,
  getRarityIcon,
  getRarityColorClass,
  getRaritySymbol,
  // Distribution & statistics functions
  calculateRarityDistribution,
  getRarityStats,
  getRarePercentage,
  // Educational content helpers
  getRarityExplanation,
  getRarityFunFacts,
  getCollectingAdvice,
  isChaseRarity,
  getRarityTier,
} from '../rarityExplainer';

// ============================================================================
// RARITY_EXPLAINERS CONSTANT TESTS
// ============================================================================

describe('RARITY_EXPLAINERS constant', () => {
  test('has exactly 6 rarity tiers', () => {
    expect(RARITY_EXPLAINERS).toHaveLength(6);
  });

  test('has correct IDs: common, uncommon, rare, ultra-rare, secret-rare, promo', () => {
    const ids = RARITY_EXPLAINERS.map((r) => r.id);
    expect(ids).toEqual(['common', 'uncommon', 'rare', 'ultra-rare', 'secret-rare', 'promo']);
  });

  test('has unique IDs', () => {
    const ids = RARITY_EXPLAINERS.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('has unique sort orders', () => {
    const sortOrders = RARITY_EXPLAINERS.map((r) => r.sortOrder);
    const uniqueOrders = new Set(sortOrders);
    expect(uniqueOrders.size).toBe(sortOrders.length);
  });

  test('sort orders are in ascending order (1-6)', () => {
    const sortOrders = RARITY_EXPLAINERS.map((r) => r.sortOrder);
    expect(sortOrders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('all rarities have required properties', () => {
    for (const rarity of RARITY_EXPLAINERS) {
      expect(rarity).toHaveProperty('id');
      expect(rarity).toHaveProperty('name');
      expect(rarity).toHaveProperty('shortName');
      expect(rarity).toHaveProperty('symbol');
      expect(rarity).toHaveProperty('description');
      expect(rarity).toHaveProperty('examples');
      expect(rarity).toHaveProperty('pullRate');
      expect(rarity).toHaveProperty('collectorTip');
      expect(rarity).toHaveProperty('sortOrder');
      expect(rarity).toHaveProperty('colorClass');
      expect(rarity).toHaveProperty('icon');
      expect(rarity).toHaveProperty('apiMatches');
    }
  });

  test('all rarities have non-empty examples array', () => {
    for (const rarity of RARITY_EXPLAINERS) {
      expect(rarity.examples.length).toBeGreaterThan(0);
    }
  });

  test('all rarities have non-empty apiMatches array', () => {
    for (const rarity of RARITY_EXPLAINERS) {
      expect(rarity.apiMatches.length).toBeGreaterThan(0);
    }
  });

  test('short names are correct', () => {
    const shortNames = RARITY_EXPLAINERS.map((r) => r.shortName);
    expect(shortNames).toEqual(['C', 'U', 'R', 'UR', 'SR', 'P']);
  });

  test('descriptions are kid-friendly (no jargon)', () => {
    for (const rarity of RARITY_EXPLAINERS) {
      expect(rarity.description).not.toMatch(/\$\d+/);
      expect(rarity.description).not.toMatch(/market|value|invest/i);
    }
  });
});

// ============================================================================
// CORE LOOKUP FUNCTIONS
// ============================================================================

describe('getRarityInfo', () => {
  test('returns rarity for valid ID', () => {
    const common = getRarityInfo('common');
    expect(common).not.toBeNull();
    expect(common?.name).toBe('Common');
  });

  test('returns null for invalid ID', () => {
    expect(getRarityInfo('invalid')).toBeNull();
    expect(getRarityInfo('')).toBeNull();
  });

  test('returns correct rarity for all valid IDs', () => {
    expect(getRarityInfo('common')?.name).toBe('Common');
    expect(getRarityInfo('uncommon')?.name).toBe('Uncommon');
    expect(getRarityInfo('rare')?.name).toBe('Rare');
    expect(getRarityInfo('ultra-rare')?.name).toBe('Ultra Rare');
    expect(getRarityInfo('secret-rare')?.name).toBe('Secret Rare');
    expect(getRarityInfo('promo')?.name).toBe('Promo');
  });

  test('returns correct short names', () => {
    expect(getRarityInfo('common')?.shortName).toBe('C');
    expect(getRarityInfo('uncommon')?.shortName).toBe('U');
    expect(getRarityInfo('rare')?.shortName).toBe('R');
    expect(getRarityInfo('ultra-rare')?.shortName).toBe('UR');
    expect(getRarityInfo('secret-rare')?.shortName).toBe('SR');
    expect(getRarityInfo('promo')?.shortName).toBe('P');
  });
});

describe('getRarityInfoByName', () => {
  test('returns null for empty string', () => {
    expect(getRarityInfoByName('')).toBeNull();
  });

  test('matches by display name (case insensitive)', () => {
    expect(getRarityInfoByName('Common')?.id).toBe('common');
    expect(getRarityInfoByName('COMMON')?.id).toBe('common');
    expect(getRarityInfoByName('common')?.id).toBe('common');
    expect(getRarityInfoByName('Ultra Rare')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('ULTRA RARE')?.id).toBe('ultra-rare');
  });

  test('matches by short name (case insensitive)', () => {
    expect(getRarityInfoByName('C')?.id).toBe('common');
    expect(getRarityInfoByName('c')?.id).toBe('common');
    expect(getRarityInfoByName('UR')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('sr')?.id).toBe('secret-rare');
  });

  test('matches by exact apiMatches', () => {
    expect(getRarityInfoByName('rare holo')?.id).toBe('rare');
    expect(getRarityInfoByName('rare ultra')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('rare secret')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('double rare')?.id).toBe('ultra-rare');
  });

  test('matches ultra rare keywords', () => {
    expect(getRarityInfoByName('rare holo vmax')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('rare vstar')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('pokemon ex')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('rare gx')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('Rare Holo EX')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('Rare Holo V')?.id).toBe('ultra-rare');
  });

  test('matches secret rare keywords', () => {
    expect(getRarityInfoByName('rare rainbow')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('hyper rare')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('amazing rare')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('illustration rare')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('special art rare')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Rare Shining')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Rare Shiny')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('LEGEND')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Special Illustration Rare')?.id).toBe('secret-rare');
  });

  test('matches promo keywords', () => {
    expect(getRarityInfoByName('promo')?.id).toBe('promo');
    expect(getRarityInfoByName('classic collection')?.id).toBe('promo');
  });

  test('matches Rare Holo to rare category', () => {
    expect(getRarityInfoByName('Rare Holo')?.id).toBe('rare');
  });

  test('prioritizes uncommon over common when string contains both', () => {
    expect(getRarityInfoByName('Uncommon')?.id).toBe('uncommon');
  });

  test('returns null for unknown rarity', () => {
    expect(getRarityInfoByName('xyz')).toBeNull();
    expect(getRarityInfoByName('unknown_rarity')).toBeNull();
    expect(getRarityInfoByName('invalid rarity')).toBeNull();
  });
});

describe('getAllRarityInfo', () => {
  test('returns all 6 rarities', () => {
    const all = getAllRarityInfo();
    expect(all).toHaveLength(6);
  });

  test('returns same array as RARITY_EXPLAINERS', () => {
    const all = getAllRarityInfo();
    expect(all).toBe(RARITY_EXPLAINERS);
  });
});

describe('getRarityBySortOrder', () => {
  test('returns correct rarity for each sort order', () => {
    expect(getRarityBySortOrder(1)?.id).toBe('common');
    expect(getRarityBySortOrder(2)?.id).toBe('uncommon');
    expect(getRarityBySortOrder(3)?.id).toBe('rare');
    expect(getRarityBySortOrder(4)?.id).toBe('ultra-rare');
    expect(getRarityBySortOrder(5)?.id).toBe('secret-rare');
    expect(getRarityBySortOrder(6)?.id).toBe('promo');
  });

  test('returns null for invalid sort order', () => {
    expect(getRarityBySortOrder(0)).toBeNull();
    expect(getRarityBySortOrder(7)).toBeNull();
    expect(getRarityBySortOrder(-1)).toBeNull();
  });
});

// ============================================================================
// KEYWORD MATCHING
// ============================================================================

describe('matchRarityByKeywords', () => {
  test('returns null for empty string', () => {
    expect(matchRarityByKeywords('')).toBeNull();
  });

  test('matches common keywords', () => {
    expect(matchRarityByKeywords('common')?.id).toBe('common');
    expect(matchRarityByKeywords('basic common card')?.id).toBe('common');
  });

  test('does not match "uncommon" as common', () => {
    expect(matchRarityByKeywords('uncommon')?.id).toBe('uncommon');
  });

  test('matches uncommon keywords', () => {
    expect(matchRarityByKeywords('uncommon')?.id).toBe('uncommon');
    expect(matchRarityByKeywords('stage 1 uncommon')?.id).toBe('uncommon');
  });

  test('matches rare keywords', () => {
    expect(matchRarityByKeywords('rare')?.id).toBe('rare');
    expect(matchRarityByKeywords('holo rare')?.id).toBe('rare');
  });

  test('matches secret rare before ultra rare (priority)', () => {
    expect(matchRarityByKeywords('secret rare')?.id).toBe('secret-rare');
    expect(matchRarityByKeywords('rainbow')?.id).toBe('secret-rare');
    expect(matchRarityByKeywords('hyper rare')?.id).toBe('secret-rare');
  });

  test('matches ultra rare keywords', () => {
    expect(matchRarityByKeywords('ultra rare')?.id).toBe('ultra-rare');
    expect(matchRarityByKeywords('rare vmax')?.id).toBe('ultra-rare');
    expect(matchRarityByKeywords('vstar')?.id).toBe('ultra-rare');
    expect(matchRarityByKeywords('double rare')?.id).toBe('ultra-rare');
  });

  test('matches promo keywords', () => {
    expect(matchRarityByKeywords('promo card')?.id).toBe('promo');
    expect(matchRarityByKeywords('classic collection')?.id).toBe('promo');
  });
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

describe('isValidRarityId', () => {
  test('returns true for all valid IDs', () => {
    expect(isValidRarityId('common')).toBe(true);
    expect(isValidRarityId('uncommon')).toBe(true);
    expect(isValidRarityId('rare')).toBe(true);
    expect(isValidRarityId('ultra-rare')).toBe(true);
    expect(isValidRarityId('secret-rare')).toBe(true);
    expect(isValidRarityId('promo')).toBe(true);
  });

  test('returns false for invalid IDs', () => {
    expect(isValidRarityId('')).toBe(false);
    expect(isValidRarityId('invalid')).toBe(false);
    expect(isValidRarityId('COMMON')).toBe(false); // case sensitive
  });
});

describe('getValidRarityIds', () => {
  test('returns all 6 valid IDs', () => {
    const ids = getValidRarityIds();
    expect(ids).toHaveLength(6);
    expect(ids).toContain('common');
    expect(ids).toContain('promo');
  });
});

describe('getRarityShortNames', () => {
  test('returns all short names', () => {
    const names = getRarityShortNames();
    expect(names).toEqual(['C', 'U', 'R', 'UR', 'SR', 'P']);
  });
});

// ============================================================================
// COMPARISON & SORTING FUNCTIONS
// ============================================================================

describe('compareRarities', () => {
  test('returns negative when first is more common', () => {
    expect(compareRarities('common', 'rare')).toBeLessThan(0);
    expect(compareRarities('uncommon', 'ultra-rare')).toBeLessThan(0);
  });

  test('returns positive when first is rarer', () => {
    expect(compareRarities('rare', 'common')).toBeGreaterThan(0);
    expect(compareRarities('secret-rare', 'uncommon')).toBeGreaterThan(0);
  });

  test('returns 0 when equal', () => {
    expect(compareRarities('common', 'common')).toBe(0);
    expect(compareRarities('rare', 'rare')).toBe(0);
  });

  test('handles null values', () => {
    expect(compareRarities(null, 'common')).toBeLessThan(0);
    expect(compareRarities('common', null)).toBeGreaterThan(0);
    expect(compareRarities(null, null)).toBe(0);
  });
});

describe('getRaritySortValue', () => {
  test('returns correct sort values', () => {
    expect(getRaritySortValue('common')).toBe(1);
    expect(getRaritySortValue('uncommon')).toBe(2);
    expect(getRaritySortValue('rare')).toBe(3);
    expect(getRaritySortValue('ultra-rare')).toBe(4);
    expect(getRaritySortValue('secret-rare')).toBe(5);
    expect(getRaritySortValue('promo')).toBe(6);
  });

  test('returns 0 for null/undefined/unknown', () => {
    expect(getRaritySortValue(null)).toBe(0);
    expect(getRaritySortValue(undefined)).toBe(0);
    expect(getRaritySortValue('unknown')).toBe(0);
  });
});

describe('isRarerThan', () => {
  test('returns true when first is rarer', () => {
    expect(isRarerThan('rare', 'common')).toBe(true);
    expect(isRarerThan('secret-rare', 'rare')).toBe(true);
  });

  test('returns false when first is more common or equal', () => {
    expect(isRarerThan('common', 'rare')).toBe(false);
    expect(isRarerThan('rare', 'rare')).toBe(false);
  });
});

describe('isMoreCommonThan', () => {
  test('returns true when first is more common', () => {
    expect(isMoreCommonThan('common', 'rare')).toBe(true);
    expect(isMoreCommonThan('uncommon', 'ultra-rare')).toBe(true);
  });

  test('returns false when first is rarer or equal', () => {
    expect(isMoreCommonThan('rare', 'common')).toBe(false);
    expect(isMoreCommonThan('rare', 'rare')).toBe(false);
  });
});

describe('sortRaritiesCommonFirst', () => {
  test('sorts from common to rare', () => {
    const rarities = ['rare', 'common', 'secret-rare', 'uncommon'];
    const sorted = sortRaritiesCommonFirst(rarities);
    expect(sorted).toEqual(['common', 'uncommon', 'rare', 'secret-rare']);
  });

  test('does not mutate original array', () => {
    const original = ['rare', 'common'];
    sortRaritiesCommonFirst(original);
    expect(original).toEqual(['rare', 'common']);
  });
});

describe('sortRaritiesRareFirst', () => {
  test('sorts from rare to common', () => {
    const rarities = ['common', 'rare', 'uncommon', 'secret-rare'];
    const sorted = sortRaritiesRareFirst(rarities);
    expect(sorted).toEqual(['secret-rare', 'rare', 'uncommon', 'common']);
  });

  test('does not mutate original array', () => {
    const original = ['common', 'rare'];
    sortRaritiesRareFirst(original);
    expect(original).toEqual(['common', 'rare']);
  });
});

// ============================================================================
// TOOLTIP & DISPLAY FUNCTIONS
// ============================================================================

describe('getRarityTooltipData', () => {
  test('returns unknown tooltip for null/undefined', () => {
    const tooltip = getRarityTooltipData(null);
    expect(tooltip.title).toBe('Unknown Rarity');
    expect(tooltip.description).toContain('not available');
  });

  test('returns special tooltip for unknown rarity string', () => {
    const tooltip = getRarityTooltipData('xyz_unknown');
    expect(tooltip.title).toBe('xyz_unknown');
    expect(tooltip.tip).toContain('online');
  });

  test('returns proper tooltip for known rarity', () => {
    const tooltip = getRarityTooltipData('common');
    expect(tooltip.title).toContain('Common');
    expect(tooltip.description).toBeTruthy();
    expect(tooltip.tip).toBeTruthy();
    expect(tooltip.pullRate).toBeTruthy();
    expect(tooltip.examples).toBeDefined();
  });
});

describe('getRarityDisplayLabel', () => {
  test('returns "Unknown" for null/undefined', () => {
    expect(getRarityDisplayLabel(null)).toBe('Unknown');
    expect(getRarityDisplayLabel(undefined)).toBe('Unknown');
  });

  test('returns icon + name for known rarity', () => {
    const label = getRarityDisplayLabel('common');
    expect(label).toContain('Common');
    expect(label).toContain('⚫');
  });

  test('returns original string for unknown rarity', () => {
    expect(getRarityDisplayLabel('xyz')).toBe('xyz');
  });
});

describe('getRarityShortLabel', () => {
  test('returns "?" for null/undefined', () => {
    expect(getRarityShortLabel(null)).toBe('?');
    expect(getRarityShortLabel(undefined)).toBe('?');
  });

  test('returns short name for known rarity', () => {
    expect(getRarityShortLabel('common')).toBe('C');
    expect(getRarityShortLabel('ultra-rare')).toBe('UR');
  });

  test('returns "?" for unknown rarity', () => {
    expect(getRarityShortLabel('xyz')).toBe('?');
  });
});

describe('getRarityIcon', () => {
  test('returns ❓ for null/undefined', () => {
    expect(getRarityIcon(null)).toBe('❓');
    expect(getRarityIcon(undefined)).toBe('❓');
  });

  test('returns correct icon for known rarities', () => {
    expect(getRarityIcon('common')).toBe('⚫');
    expect(getRarityIcon('uncommon')).toBe('💎');
    expect(getRarityIcon('rare')).toBe('⭐');
    expect(getRarityIcon('ultra-rare')).toBe('🌟');
    expect(getRarityIcon('secret-rare')).toBe('🏆');
    expect(getRarityIcon('promo')).toBe('🎁');
  });
});

describe('getRarityColorClass', () => {
  test('returns default color for null/undefined', () => {
    expect(getRarityColorClass(null)).toBe('text-gray-400');
    expect(getRarityColorClass(undefined)).toBe('text-gray-400');
  });

  test('returns correct color class for known rarities', () => {
    expect(getRarityColorClass('common')).toBe('text-gray-500');
    expect(getRarityColorClass('uncommon')).toBe('text-green-600');
    expect(getRarityColorClass('rare')).toBe('text-yellow-500');
    expect(getRarityColorClass('ultra-rare')).toBe('text-purple-500');
    expect(getRarityColorClass('secret-rare')).toBe('text-orange-500');
    expect(getRarityColorClass('promo')).toBe('text-blue-500');
  });
});

describe('getRaritySymbol', () => {
  test('returns "?" for null/undefined', () => {
    expect(getRaritySymbol(null)).toBe('?');
    expect(getRaritySymbol(undefined)).toBe('?');
  });

  test('returns correct symbols', () => {
    expect(getRaritySymbol('common')).toBe('●');
    expect(getRaritySymbol('uncommon')).toBe('◆');
    expect(getRaritySymbol('rare')).toBe('★');
    expect(getRaritySymbol('ultra-rare')).toBe('★★');
    expect(getRaritySymbol('secret-rare')).toBe('★★★');
    expect(getRaritySymbol('promo')).toBe('PROMO');
  });
});

// ============================================================================
// DISTRIBUTION & STATISTICS FUNCTIONS
// ============================================================================

describe('calculateRarityDistribution', () => {
  test('handles empty array', () => {
    const result = calculateRarityDistribution([]);
    expect(result.distribution).toHaveLength(0);
    expect(result.unknown).toHaveLength(0);
    expect(result.totalCards).toBe(0);
  });

  test('handles null/undefined values', () => {
    const result = calculateRarityDistribution([null, undefined, 'common']);
    expect(result.distribution).toHaveLength(1);
    expect(result.totalCards).toBe(1);
  });

  test('calculates distribution correctly', () => {
    const rarities = ['common', 'common', 'common', 'rare', 'rare'];
    const result = calculateRarityDistribution(rarities);

    expect(result.totalCards).toBe(5);
    expect(result.distribution).toHaveLength(2);

    const commonItem = result.distribution.find((d) => d.rarity.id === 'common');
    expect(commonItem?.count).toBe(3);
    expect(commonItem?.percentage).toBe(60);

    const rareItem = result.distribution.find((d) => d.rarity.id === 'rare');
    expect(rareItem?.count).toBe(2);
    expect(rareItem?.percentage).toBe(40);
  });

  test('tracks unknown rarities', () => {
    const rarities = ['common', 'xyz_unknown', 'abc_unknown'];
    const result = calculateRarityDistribution(rarities);

    expect(result.unknown).toHaveLength(2);
    expect(result.unknown).toContain('xyz_unknown');
    expect(result.totalCards).toBe(3);
  });
});

describe('getRarityStats', () => {
  test('handles empty array', () => {
    const stats = getRarityStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.mostCommonRarity).toBeNull();
    expect(stats.rarestCard).toBeNull();
    expect(stats.averageRarity).toBe(0);
  });

  test('calculates stats correctly', () => {
    const rarities = ['common', 'common', 'common', 'rare', 'secret-rare'];
    const stats = getRarityStats(rarities);

    expect(stats.totalCards).toBe(5);
    expect(stats.mostCommonRarity?.id).toBe('common');
    expect(stats.rarestCard?.id).toBe('secret-rare');
    expect(stats.averageRarity).toBeGreaterThan(0);
  });

  test('finds correct rarest card', () => {
    const rarities = ['common', 'uncommon', 'rare'];
    const stats = getRarityStats(rarities);
    expect(stats.rarestCard?.id).toBe('rare');
  });
});

describe('getRarePercentage', () => {
  test('returns 0 for empty array', () => {
    expect(getRarePercentage([])).toBe(0);
  });

  test('returns 0 when no rare cards', () => {
    expect(getRarePercentage(['common', 'common', 'uncommon'])).toBe(0);
  });

  test('returns correct percentage', () => {
    // 2 rare and above out of 4 = 50%
    const rarities = ['common', 'common', 'rare', 'secret-rare'];
    expect(getRarePercentage(rarities)).toBe(50);
  });

  test('counts ultra rare and above as rare+', () => {
    const rarities = ['common', 'ultra-rare'];
    expect(getRarePercentage(rarities)).toBe(50);
  });
});

// ============================================================================
// EDUCATIONAL CONTENT HELPERS
// ============================================================================

describe('getRarityExplanation', () => {
  test('returns non-empty explanation', () => {
    const explanation = getRarityExplanation();
    expect(explanation.length).toBeGreaterThan(0);
  });

  test('mentions all rarity tiers', () => {
    const explanation = getRarityExplanation();
    expect(explanation).toContain('Common');
    expect(explanation).toContain('Uncommon');
    expect(explanation).toContain('Rare');
    expect(explanation).toContain('Ultra Rare');
    expect(explanation).toContain('Secret Rare');
    expect(explanation).toContain('PROMO');
  });
});

describe('getRarityFunFacts', () => {
  test('returns facts for all valid IDs', () => {
    expect(getRarityFunFacts('common').length).toBeGreaterThan(0);
    expect(getRarityFunFacts('uncommon').length).toBeGreaterThan(0);
    expect(getRarityFunFacts('rare').length).toBeGreaterThan(0);
    expect(getRarityFunFacts('ultra-rare').length).toBeGreaterThan(0);
    expect(getRarityFunFacts('secret-rare').length).toBeGreaterThan(0);
    expect(getRarityFunFacts('promo').length).toBeGreaterThan(0);
  });

  test('returns default fact for unknown ID', () => {
    const facts = getRarityFunFacts('unknown');
    expect(facts).toHaveLength(1);
    expect(facts[0]).toContain('special');
  });
});

describe('getCollectingAdvice', () => {
  test('returns advice for all valid IDs', () => {
    expect(getCollectingAdvice('common').length).toBeGreaterThan(0);
    expect(getCollectingAdvice('uncommon').length).toBeGreaterThan(0);
    expect(getCollectingAdvice('rare').length).toBeGreaterThan(0);
    expect(getCollectingAdvice('ultra-rare').length).toBeGreaterThan(0);
    expect(getCollectingAdvice('secret-rare').length).toBeGreaterThan(0);
    expect(getCollectingAdvice('promo').length).toBeGreaterThan(0);
  });

  test('returns default advice for unknown ID', () => {
    const advice = getCollectingAdvice('unknown');
    expect(advice).toContain('organized');
  });

  test('higher rarities mention protection', () => {
    const rare = getCollectingAdvice('rare');
    const ultraRare = getCollectingAdvice('ultra-rare');

    expect(rare).toContain('sleeves');
    expect(ultraRare).toContain('sleeving');
  });
});

describe('isChaseRarity', () => {
  test('returns false for null/undefined', () => {
    expect(isChaseRarity(null)).toBe(false);
    expect(isChaseRarity(undefined)).toBe(false);
  });

  test('returns false for common/uncommon/rare', () => {
    expect(isChaseRarity('common')).toBe(false);
    expect(isChaseRarity('uncommon')).toBe(false);
    expect(isChaseRarity('rare')).toBe(false);
  });

  test('returns true for ultra-rare and above', () => {
    expect(isChaseRarity('ultra-rare')).toBe(true);
    expect(isChaseRarity('secret-rare')).toBe(true);
    expect(isChaseRarity('promo')).toBe(true);
  });
});

describe('getRarityTier', () => {
  test('returns "Unknown" for null/undefined', () => {
    expect(getRarityTier(null)).toBe('Unknown');
    expect(getRarityTier(undefined)).toBe('Unknown');
  });

  test('returns correct tier name', () => {
    expect(getRarityTier('common')).toBe('Common');
    expect(getRarityTier('ultra-rare')).toBe('Ultra Rare');
    expect(getRarityTier('secret-rare')).toBe('Secret Rare');
  });

  test('returns "Unknown" for unrecognized rarity', () => {
    expect(getRarityTier('xyz')).toBe('Unknown');
  });
});

// ============================================================================
// RARITY INFO STRUCTURE TESTS
// ============================================================================

describe('RarityInfo structure', () => {
  test('common rarity has appropriate info', () => {
    const common = getRarityInfo('common');
    expect(common).not.toBeNull();
    expect(common!.name).toBe('Common');
    expect(common!.description).toContain('frequently found');
    expect(common!.pullRate).toContain('every pack');
  });

  test('uncommon rarity has appropriate info', () => {
    const uncommon = getRarityInfo('uncommon');
    expect(uncommon).not.toBeNull();
    expect(uncommon!.name).toBe('Uncommon');
    expect(uncommon!.description).toContain('step up');
  });

  test('rare rarity has appropriate info', () => {
    const rare = getRarityInfo('rare');
    expect(rare).not.toBeNull();
    expect(rare!.name).toBe('Rare');
    expect(rare!.description).toContain('star symbol');
    expect(rare!.examples).toContain('Holographic cards');
  });

  test('ultra-rare rarity has appropriate info', () => {
    const ultraRare = getRarityInfo('ultra-rare');
    expect(ultraRare).not.toBeNull();
    expect(ultraRare!.name).toBe('Ultra Rare');
    expect(ultraRare!.description).toContain('EX');
    expect(ultraRare!.description).toContain('GX');
    expect(ultraRare!.description).toContain('V');
  });

  test('secret-rare rarity has appropriate info', () => {
    const secretRare = getRarityInfo('secret-rare');
    expect(secretRare).not.toBeNull();
    expect(secretRare!.name).toBe('Secret Rare');
    expect(secretRare!.description).toContain('rarest');
    expect(secretRare!.description.toLowerCase()).toContain('numbered higher');
  });

  test('promo rarity has appropriate info', () => {
    const promo = getRarityInfo('promo');
    expect(promo).not.toBeNull();
    expect(promo!.name).toBe('Promo');
    expect(promo!.description).toContain('events');
    expect(promo!.description).toContain('regular packs');
  });
});

describe('collector tips', () => {
  test('all rarities have helpful collector tips', () => {
    for (const rarity of RARITY_EXPLAINERS) {
      expect(rarity.collectorTip.length).toBeGreaterThan(10);
      // Tips should be positive/helpful
      expect(rarity.collectorTip).not.toMatch(/don't|never|bad/i);
    }
  });
});

describe('examples array', () => {
  test('each rarity has relevant examples', () => {
    const common = getRarityInfo('common');
    expect(common!.examples).toContain('Basic Pokémon');

    const rare = getRarityInfo('rare');
    expect(rare!.examples).toContain('Holographic cards');

    const ultraRare = getRarityInfo('ultra-rare');
    expect(ultraRare!.examples).toContain('Pokémon EX/GX');

    const secretRare = getRarityInfo('secret-rare');
    expect(secretRare!.examples).toContain('Gold cards');

    const promo = getRarityInfo('promo');
    expect(promo!.examples).toContain('Event exclusives');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: API Rarity String Matching', () => {
  test('matches real Pokemon TCG API rarity strings', () => {
    // Common variants
    expect(getRarityInfoByName('Common')?.id).toBe('common');

    // Uncommon variants
    expect(getRarityInfoByName('Uncommon')?.id).toBe('uncommon');

    // Rare variants from API
    expect(getRarityInfoByName('Rare')?.id).toBe('rare');
    expect(getRarityInfoByName('Rare Holo')?.id).toBe('rare');

    // Ultra Rare variants
    expect(getRarityInfoByName('Rare Ultra')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('Rare Holo VMAX')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('Rare Holo VSTAR')?.id).toBe('ultra-rare');
    expect(getRarityInfoByName('Double Rare')?.id).toBe('ultra-rare');

    // Secret Rare variants
    expect(getRarityInfoByName('Rare Secret')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Rare Rainbow')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Illustration Rare')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Special Art Rare')?.id).toBe('secret-rare');
    expect(getRarityInfoByName('Hyper Rare')?.id).toBe('secret-rare');

    // Promo
    expect(getRarityInfoByName('Promo')?.id).toBe('promo');
  });
});

describe('Integration: Collection Rarity Analysis', () => {
  test('analyzes a typical kid collection', () => {
    // Typical distribution: lots of commons, some uncommons, few rares
    const collection = [
      'common',
      'common',
      'common',
      'common',
      'common',
      'common',
      'common',
      'uncommon',
      'uncommon',
      'uncommon',
      'rare',
      'rare',
      'ultra-rare',
    ];

    const stats = getRarityStats(collection);

    expect(stats.totalCards).toBe(13);
    expect(stats.mostCommonRarity?.id).toBe('common');
    expect(stats.rarestCard?.id).toBe('ultra-rare');

    // Chase percentage should be low (only 1 ultra-rare in 13)
    const chaseCount = collection.filter((r) => isChaseRarity(r)).length;
    expect(chaseCount).toBe(1);
  });
});

describe('Integration: Tooltip Display', () => {
  test('generates complete tooltip for display', () => {
    const rarityString = 'Rare Holo VMAX';
    const info = getRarityInfoByName(rarityString);
    const tooltip = getRarityTooltipData(rarityString);
    const icon = getRarityIcon(rarityString);
    const colorClass = getRarityColorClass(rarityString);

    expect(info?.id).toBe('ultra-rare');
    expect(tooltip.title).toContain('Ultra Rare');
    expect(icon).toBe('🌟');
    expect(colorClass).toBe('text-purple-500');
  });
});

describe('Integration: Sorting Cards by Rarity', () => {
  test('sorts cards rare first for "show me your best cards"', () => {
    const cardRarities = ['common', 'secret-rare', 'uncommon', 'ultra-rare', 'rare'];
    const sorted = sortRaritiesRareFirst(cardRarities);

    expect(sorted[0]).toBe('secret-rare');
    expect(sorted[1]).toBe('ultra-rare');
    expect(sorted[sorted.length - 1]).toBe('common');
  });

  test('sorts cards common first for "complete set tracking"', () => {
    const cardRarities = ['secret-rare', 'common', 'ultra-rare', 'uncommon'];
    const sorted = sortRaritiesCommonFirst(cardRarities);

    expect(sorted[0]).toBe('common');
    expect(sorted[sorted.length - 1]).toBe('secret-rare');
  });
});

describe('Integration: Educational Content Display', () => {
  test('provides all content needed for rarity education page', () => {
    // Get explanation
    const explanation = getRarityExplanation();
    expect(explanation.length).toBeGreaterThan(100);

    // Get all rarities with their content
    const allRarities = getAllRarityInfo();
    for (const rarity of allRarities) {
      // Facts for learning
      const facts = getRarityFunFacts(rarity.id);
      expect(facts.length).toBeGreaterThan(0);

      // Advice for collecting
      const advice = getCollectingAdvice(rarity.id);
      expect(advice.length).toBeGreaterThan(0);

      // Display elements
      expect(rarity.icon.length).toBeGreaterThan(0);
      expect(rarity.colorClass.length).toBeGreaterThan(0);
      expect(rarity.symbol.length).toBeGreaterThan(0);
    }
  });
});
