import { describe, it, expect, test } from 'vitest';
import {
  // Constants
  CONDITION_GRADES,
  // Types
  type ConditionInfo,
  type ConditionTooltipData,
  type ConditionComparisonResult,
  type ConditionStats,
  // Core lookup functions
  getConditionInfo,
  getConditionByShortName,
  getConditionByNameOrShortName,
  getAllConditionGrades,
  getConditionBySortOrder,
  // Validation functions
  isValidConditionId,
  isValidConditionShortName,
  getValidConditionIds,
  getValidConditionShortNames,
  // Comparison & sorting functions
  compareConditions,
  getConditionSortValue,
  isBetterConditionThan,
  isWorseConditionThan,
  sortConditionsBestFirst,
  sortConditionsWorstFirst,
  // Tooltip & display functions
  getConditionTooltipData,
  getConditionDisplayLabel,
  getConditionShortLabel,
  getConditionIcon,
  getConditionColorClass,
  // Condition comparison functions
  compareConditionsDetailed,
  getApproximateValuePercent,
  isTradeAcceptable,
  getTradeAcceptableConditions,
  getNonTradeAcceptableConditions,
  // Grading helper functions
  getGradingGuidance,
  getNextBetterCondition,
  getNextWorseCondition,
  estimateConditionFromDamage,
  // Statistics & distribution functions
  calculateConditionDistribution,
  getConditionStats,
  getTradeablePercentage,
  // Educational content helpers
  getConditionExplanation,
  getConditionFunFacts,
  getCardCareAdvice,
  isCollectibleCondition,
  isPlayableCondition,
  getConditionTier,
  formatConditionWithIcon,
} from '../conditionGuide';

// ============================================================================
// CONDITION_GRADES CONSTANT TESTS
// ============================================================================

describe('CONDITION_GRADES constant', () => {
  test('has exactly 5 condition grades', () => {
    expect(CONDITION_GRADES).toHaveLength(5);
  });

  test('has correct IDs: nm, lp, mp, hp, dmg', () => {
    const ids = CONDITION_GRADES.map((c) => c.id);
    expect(ids).toEqual(['nm', 'lp', 'mp', 'hp', 'dmg']);
  });

  test('has unique IDs', () => {
    const ids = CONDITION_GRADES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('has unique sort orders', () => {
    const sortOrders = CONDITION_GRADES.map((c) => c.sortOrder);
    const uniqueOrders = new Set(sortOrders);
    expect(uniqueOrders.size).toBe(sortOrders.length);
  });

  test('sort orders are in ascending order (1-5)', () => {
    const sortOrders = CONDITION_GRADES.map((c) => c.sortOrder);
    expect(sortOrders).toEqual([1, 2, 3, 4, 5]);
  });

  test('all conditions have required properties', () => {
    for (const condition of CONDITION_GRADES) {
      expect(condition).toHaveProperty('id');
      expect(condition).toHaveProperty('name');
      expect(condition).toHaveProperty('shortName');
      expect(condition).toHaveProperty('description');
      expect(condition).toHaveProperty('whatToLookFor');
      expect(condition).toHaveProperty('valueImpact');
      expect(condition).toHaveProperty('collectorTip');
      expect(condition).toHaveProperty('sortOrder');
      expect(condition).toHaveProperty('colorClass');
      expect(condition).toHaveProperty('icon');
      expect(condition).toHaveProperty('approximateValuePercent');
      expect(condition).toHaveProperty('tradeAcceptable');
      expect(condition).toHaveProperty('damageExamples');
    }
  });

  test('all conditions have non-empty whatToLookFor array', () => {
    for (const condition of CONDITION_GRADES) {
      expect(condition.whatToLookFor.length).toBeGreaterThan(0);
    }
  });

  test('all conditions have non-empty damageExamples array', () => {
    for (const condition of CONDITION_GRADES) {
      expect(condition.damageExamples.length).toBeGreaterThan(0);
    }
  });

  test('short names are correct', () => {
    const shortNames = CONDITION_GRADES.map((c) => c.shortName);
    expect(shortNames).toEqual(['NM', 'LP', 'MP', 'HP', 'DMG']);
  });

  test('descriptions are kid-friendly (no jargon)', () => {
    for (const condition of CONDITION_GRADES) {
      expect(condition.description).not.toMatch(/\$\d+/);
      expect(condition.description).not.toMatch(/PSA|BGS|CGC/i);
    }
  });

  test('value percentages decrease as condition worsens', () => {
    const values = CONDITION_GRADES.map((c) => c.approximateValuePercent);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]);
    }
  });

  test('NM, LP, MP are trade acceptable; HP, DMG are not', () => {
    expect(CONDITION_GRADES.find((c) => c.id === 'nm')?.tradeAcceptable).toBe(true);
    expect(CONDITION_GRADES.find((c) => c.id === 'lp')?.tradeAcceptable).toBe(true);
    expect(CONDITION_GRADES.find((c) => c.id === 'mp')?.tradeAcceptable).toBe(true);
    expect(CONDITION_GRADES.find((c) => c.id === 'hp')?.tradeAcceptable).toBe(false);
    expect(CONDITION_GRADES.find((c) => c.id === 'dmg')?.tradeAcceptable).toBe(false);
  });
});

// ============================================================================
// CORE LOOKUP FUNCTIONS
// ============================================================================

describe('getConditionInfo', () => {
  test('returns condition for valid ID', () => {
    const nm = getConditionInfo('nm');
    expect(nm).not.toBeNull();
    expect(nm?.name).toBe('Near Mint');
  });

  test('returns null for invalid ID', () => {
    expect(getConditionInfo('invalid')).toBeNull();
    expect(getConditionInfo('')).toBeNull();
  });

  test('returns correct condition for all valid IDs', () => {
    expect(getConditionInfo('nm')?.name).toBe('Near Mint');
    expect(getConditionInfo('lp')?.name).toBe('Lightly Played');
    expect(getConditionInfo('mp')?.name).toBe('Moderately Played');
    expect(getConditionInfo('hp')?.name).toBe('Heavily Played');
    expect(getConditionInfo('dmg')?.name).toBe('Damaged');
  });

  test('returns correct short names', () => {
    expect(getConditionInfo('nm')?.shortName).toBe('NM');
    expect(getConditionInfo('lp')?.shortName).toBe('LP');
    expect(getConditionInfo('mp')?.shortName).toBe('MP');
    expect(getConditionInfo('hp')?.shortName).toBe('HP');
    expect(getConditionInfo('dmg')?.shortName).toBe('DMG');
  });
});

describe('getConditionByShortName', () => {
  test('returns null for empty string', () => {
    expect(getConditionByShortName('')).toBeNull();
  });

  test('matches by short name (case insensitive)', () => {
    expect(getConditionByShortName('NM')?.id).toBe('nm');
    expect(getConditionByShortName('nm')?.id).toBe('nm');
    expect(getConditionByShortName('Nm')?.id).toBe('nm');
    expect(getConditionByShortName('LP')?.id).toBe('lp');
    expect(getConditionByShortName('lp')?.id).toBe('lp');
  });

  test('handles whitespace', () => {
    expect(getConditionByShortName(' NM ')?.id).toBe('nm');
    expect(getConditionByShortName('  LP  ')?.id).toBe('lp');
  });

  test('returns null for invalid short names', () => {
    expect(getConditionByShortName('XX')).toBeNull();
    expect(getConditionByShortName('MINT')).toBeNull();
  });
});

describe('getConditionByNameOrShortName', () => {
  test('returns null for empty string', () => {
    expect(getConditionByNameOrShortName('')).toBeNull();
  });

  test('matches by ID', () => {
    expect(getConditionByNameOrShortName('nm')?.name).toBe('Near Mint');
    expect(getConditionByNameOrShortName('lp')?.name).toBe('Lightly Played');
    expect(getConditionByNameOrShortName('dmg')?.name).toBe('Damaged');
  });

  test('matches by display name (case insensitive)', () => {
    expect(getConditionByNameOrShortName('Near Mint')?.id).toBe('nm');
    expect(getConditionByNameOrShortName('near mint')?.id).toBe('nm');
    expect(getConditionByNameOrShortName('NEAR MINT')?.id).toBe('nm');
    expect(getConditionByNameOrShortName('Lightly Played')?.id).toBe('lp');
    expect(getConditionByNameOrShortName('Damaged')?.id).toBe('dmg');
  });

  test('matches by short name (case insensitive)', () => {
    expect(getConditionByNameOrShortName('NM')?.id).toBe('nm');
    expect(getConditionByNameOrShortName('nm')?.id).toBe('nm');
    expect(getConditionByNameOrShortName('LP')?.id).toBe('lp');
    expect(getConditionByNameOrShortName('DMG')?.id).toBe('dmg');
    expect(getConditionByNameOrShortName('dmg')?.id).toBe('dmg');
  });

  test('returns null for invalid input', () => {
    expect(getConditionByNameOrShortName('invalid')).toBeNull();
    expect(getConditionByNameOrShortName('Excellent')).toBeNull();
  });
});

describe('getAllConditionGrades', () => {
  test('returns all 5 conditions', () => {
    const grades = getAllConditionGrades();
    expect(grades).toHaveLength(5);
  });

  test('returns readonly array', () => {
    const grades = getAllConditionGrades();
    expect(grades).toBe(CONDITION_GRADES);
  });
});

describe('getConditionBySortOrder', () => {
  test('returns correct conditions by sort order', () => {
    expect(getConditionBySortOrder(1)?.id).toBe('nm');
    expect(getConditionBySortOrder(2)?.id).toBe('lp');
    expect(getConditionBySortOrder(3)?.id).toBe('mp');
    expect(getConditionBySortOrder(4)?.id).toBe('hp');
    expect(getConditionBySortOrder(5)?.id).toBe('dmg');
  });

  test('returns null for invalid sort orders', () => {
    expect(getConditionBySortOrder(0)).toBeNull();
    expect(getConditionBySortOrder(6)).toBeNull();
    expect(getConditionBySortOrder(-1)).toBeNull();
  });
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

describe('isValidConditionId', () => {
  test('returns true for valid IDs', () => {
    expect(isValidConditionId('nm')).toBe(true);
    expect(isValidConditionId('lp')).toBe(true);
    expect(isValidConditionId('mp')).toBe(true);
    expect(isValidConditionId('hp')).toBe(true);
    expect(isValidConditionId('dmg')).toBe(true);
  });

  test('returns false for invalid IDs', () => {
    expect(isValidConditionId('invalid')).toBe(false);
    expect(isValidConditionId('')).toBe(false);
    expect(isValidConditionId('NM')).toBe(false); // ID must be lowercase
    expect(isValidConditionId('mint')).toBe(false);
  });
});

describe('isValidConditionShortName', () => {
  test('returns true for valid short names', () => {
    expect(isValidConditionShortName('NM')).toBe(true);
    expect(isValidConditionShortName('nm')).toBe(true);
    expect(isValidConditionShortName('LP')).toBe(true);
    expect(isValidConditionShortName('DMG')).toBe(true);
  });

  test('returns false for invalid short names', () => {
    expect(isValidConditionShortName('')).toBe(false);
    expect(isValidConditionShortName('XX')).toBe(false);
    expect(isValidConditionShortName('MINT')).toBe(false);
  });
});

describe('getValidConditionIds', () => {
  test('returns all valid IDs', () => {
    const ids = getValidConditionIds();
    expect(ids).toEqual(['nm', 'lp', 'mp', 'hp', 'dmg']);
  });
});

describe('getValidConditionShortNames', () => {
  test('returns all valid short names', () => {
    const shortNames = getValidConditionShortNames();
    expect(shortNames).toEqual(['NM', 'LP', 'MP', 'HP', 'DMG']);
  });
});

// ============================================================================
// COMPARISON & SORTING FUNCTIONS
// ============================================================================

describe('compareConditions', () => {
  test('returns negative when A is better', () => {
    expect(compareConditions('NM', 'LP')).toBeLessThan(0);
    expect(compareConditions('LP', 'MP')).toBeLessThan(0);
    expect(compareConditions('NM', 'DMG')).toBeLessThan(0);
  });

  test('returns positive when A is worse', () => {
    expect(compareConditions('LP', 'NM')).toBeGreaterThan(0);
    expect(compareConditions('DMG', 'NM')).toBeGreaterThan(0);
    expect(compareConditions('HP', 'LP')).toBeGreaterThan(0);
  });

  test('returns 0 for same condition', () => {
    expect(compareConditions('NM', 'NM')).toBe(0);
    expect(compareConditions('nm', 'Near Mint')).toBe(0);
    expect(compareConditions('LP', 'lp')).toBe(0);
  });

  test('handles null values', () => {
    expect(compareConditions(null, 'NM')).toBeGreaterThan(0);
    expect(compareConditions('NM', null)).toBeLessThan(0);
    expect(compareConditions(null, null)).toBe(0);
  });
});

describe('getConditionSortValue', () => {
  test('returns correct sort values', () => {
    expect(getConditionSortValue('NM')).toBe(1);
    expect(getConditionSortValue('LP')).toBe(2);
    expect(getConditionSortValue('MP')).toBe(3);
    expect(getConditionSortValue('HP')).toBe(4);
    expect(getConditionSortValue('DMG')).toBe(5);
  });

  test('returns 999 for null/undefined', () => {
    expect(getConditionSortValue(null)).toBe(999);
    expect(getConditionSortValue(undefined)).toBe(999);
  });

  test('returns 999 for unknown conditions', () => {
    expect(getConditionSortValue('invalid')).toBe(999);
  });
});

describe('isBetterConditionThan', () => {
  test('returns true when A is better', () => {
    expect(isBetterConditionThan('NM', 'LP')).toBe(true);
    expect(isBetterConditionThan('LP', 'DMG')).toBe(true);
    expect(isBetterConditionThan('MP', 'HP')).toBe(true);
  });

  test('returns false when A is worse or equal', () => {
    expect(isBetterConditionThan('LP', 'NM')).toBe(false);
    expect(isBetterConditionThan('NM', 'NM')).toBe(false);
    expect(isBetterConditionThan('DMG', 'HP')).toBe(false);
  });
});

describe('isWorseConditionThan', () => {
  test('returns true when A is worse', () => {
    expect(isWorseConditionThan('LP', 'NM')).toBe(true);
    expect(isWorseConditionThan('DMG', 'NM')).toBe(true);
    expect(isWorseConditionThan('HP', 'MP')).toBe(true);
  });

  test('returns false when A is better or equal', () => {
    expect(isWorseConditionThan('NM', 'LP')).toBe(false);
    expect(isWorseConditionThan('NM', 'NM')).toBe(false);
    expect(isWorseConditionThan('LP', 'HP')).toBe(false);
  });
});

describe('sortConditionsBestFirst', () => {
  test('sorts conditions from best to worst', () => {
    const conditions = ['DMG', 'NM', 'HP', 'LP', 'MP'];
    const sorted = sortConditionsBestFirst(conditions);
    expect(sorted).toEqual(['NM', 'LP', 'MP', 'HP', 'DMG']);
  });

  test('does not mutate original array', () => {
    const original = ['DMG', 'NM', 'LP'];
    const sorted = sortConditionsBestFirst(original);
    expect(original).toEqual(['DMG', 'NM', 'LP']);
    expect(sorted).not.toBe(original);
  });

  test('handles empty array', () => {
    expect(sortConditionsBestFirst([])).toEqual([]);
  });
});

describe('sortConditionsWorstFirst', () => {
  test('sorts conditions from worst to best', () => {
    const conditions = ['NM', 'DMG', 'LP', 'HP', 'MP'];
    const sorted = sortConditionsWorstFirst(conditions);
    expect(sorted).toEqual(['DMG', 'HP', 'MP', 'LP', 'NM']);
  });

  test('does not mutate original array', () => {
    const original = ['NM', 'DMG', 'LP'];
    const sorted = sortConditionsWorstFirst(original);
    expect(original).toEqual(['NM', 'DMG', 'LP']);
    expect(sorted).not.toBe(original);
  });
});

// ============================================================================
// TOOLTIP & DISPLAY FUNCTIONS
// ============================================================================

describe('getConditionTooltipData', () => {
  test('returns unknown tooltip for null', () => {
    const tooltip = getConditionTooltipData(null);
    expect(tooltip.title).toBe('Unknown Condition');
    expect(tooltip.description).toContain('not specified');
  });

  test('returns unknown tooltip for undefined', () => {
    const tooltip = getConditionTooltipData(undefined);
    expect(tooltip.title).toBe('Unknown Condition');
  });

  test('returns proper tooltip for valid condition', () => {
    const tooltip = getConditionTooltipData('NM');
    expect(tooltip.title).toContain('Near Mint');
    expect(tooltip.title).toContain('✨');
    expect(tooltip.description).toBeTruthy();
    expect(tooltip.tip).toBeTruthy();
    expect(tooltip.whatToLookFor).toBeDefined();
    expect(tooltip.whatToLookFor?.length).toBeGreaterThan(0);
  });

  test('includes damage examples in tooltip', () => {
    const tooltip = getConditionTooltipData('HP');
    expect(tooltip.damageExamples).toBeDefined();
    expect(tooltip.damageExamples?.length).toBeGreaterThan(0);
  });
});

describe('getConditionDisplayLabel', () => {
  test('returns formatted label for valid condition', () => {
    expect(getConditionDisplayLabel('NM')).toBe('✨ Near Mint');
    expect(getConditionDisplayLabel('LP')).toBe('👍 Lightly Played');
    expect(getConditionDisplayLabel('DMG')).toBe('❌ Damaged');
  });

  test('returns Unknown for null/undefined', () => {
    expect(getConditionDisplayLabel(null)).toBe('Unknown');
    expect(getConditionDisplayLabel(undefined)).toBe('Unknown');
  });

  test('returns original string for unknown condition', () => {
    expect(getConditionDisplayLabel('XYZ')).toBe('XYZ');
  });
});

describe('getConditionShortLabel', () => {
  test('returns short name for valid condition', () => {
    expect(getConditionShortLabel('Near Mint')).toBe('NM');
    expect(getConditionShortLabel('nm')).toBe('NM');
    expect(getConditionShortLabel('Damaged')).toBe('DMG');
  });

  test('returns ? for null/undefined', () => {
    expect(getConditionShortLabel(null)).toBe('?');
    expect(getConditionShortLabel(undefined)).toBe('?');
  });

  test('returns ? for unknown condition', () => {
    expect(getConditionShortLabel('invalid')).toBe('?');
  });
});

describe('getConditionIcon', () => {
  test('returns correct icons', () => {
    expect(getConditionIcon('NM')).toBe('✨');
    expect(getConditionIcon('LP')).toBe('👍');
    expect(getConditionIcon('MP')).toBe('👌');
    expect(getConditionIcon('HP')).toBe('⚠️');
    expect(getConditionIcon('DMG')).toBe('❌');
  });

  test('returns ❓ for null/undefined', () => {
    expect(getConditionIcon(null)).toBe('❓');
    expect(getConditionIcon(undefined)).toBe('❓');
  });

  test('returns ❓ for unknown condition', () => {
    expect(getConditionIcon('invalid')).toBe('❓');
  });
});

describe('getConditionColorClass', () => {
  test('returns correct color classes', () => {
    expect(getConditionColorClass('NM')).toBe('text-green-500');
    expect(getConditionColorClass('LP')).toBe('text-blue-500');
    expect(getConditionColorClass('MP')).toBe('text-yellow-500');
    expect(getConditionColorClass('HP')).toBe('text-orange-500');
    expect(getConditionColorClass('DMG')).toBe('text-red-500');
  });

  test('returns gray for null/undefined', () => {
    expect(getConditionColorClass(null)).toBe('text-gray-400');
    expect(getConditionColorClass(undefined)).toBe('text-gray-400');
  });
});

// ============================================================================
// CONDITION COMPARISON FUNCTIONS
// ============================================================================

describe('compareConditionsDetailed', () => {
  test('returns null for invalid conditions', () => {
    expect(compareConditionsDetailed('NM', 'invalid')).toBeNull();
    expect(compareConditionsDetailed('invalid', 'NM')).toBeNull();
  });

  test('returns correct comparison for NM vs LP', () => {
    const result = compareConditionsDetailed('NM', 'LP');
    expect(result).not.toBeNull();
    expect(result!.betterCondition.id).toBe('nm');
    expect(result!.worseCondition.id).toBe('lp');
    expect(result!.valueDifferencePercent).toBe(20); // 100 - 80
    expect(result!.bothTradeAcceptable).toBe(true);
    expect(result!.comparisonMessage).toContain('better condition');
  });

  test('returns correct comparison for same conditions', () => {
    const result = compareConditionsDetailed('NM', 'NM');
    expect(result).not.toBeNull();
    expect(result!.valueDifferencePercent).toBe(0);
    expect(result!.comparisonMessage).toContain('equal');
  });

  test('returns correct comparison for HP vs MP', () => {
    const result = compareConditionsDetailed('HP', 'MP');
    expect(result).not.toBeNull();
    expect(result!.betterCondition.id).toBe('mp');
    expect(result!.worseCondition.id).toBe('hp');
    expect(result!.bothTradeAcceptable).toBe(false);
  });
});

describe('getApproximateValuePercent', () => {
  test('returns correct percentages', () => {
    expect(getApproximateValuePercent('NM')).toBe(100);
    expect(getApproximateValuePercent('LP')).toBe(80);
    expect(getApproximateValuePercent('MP')).toBe(50);
    expect(getApproximateValuePercent('HP')).toBe(25);
    expect(getApproximateValuePercent('DMG')).toBe(10);
  });

  test('returns 0 for null/undefined', () => {
    expect(getApproximateValuePercent(null)).toBe(0);
    expect(getApproximateValuePercent(undefined)).toBe(0);
  });

  test('returns 0 for unknown condition', () => {
    expect(getApproximateValuePercent('invalid')).toBe(0);
  });
});

describe('isTradeAcceptable', () => {
  test('returns true for NM, LP, MP', () => {
    expect(isTradeAcceptable('NM')).toBe(true);
    expect(isTradeAcceptable('LP')).toBe(true);
    expect(isTradeAcceptable('MP')).toBe(true);
  });

  test('returns false for HP, DMG', () => {
    expect(isTradeAcceptable('HP')).toBe(false);
    expect(isTradeAcceptable('DMG')).toBe(false);
  });

  test('returns false for null/undefined/invalid', () => {
    expect(isTradeAcceptable(null)).toBe(false);
    expect(isTradeAcceptable(undefined)).toBe(false);
    expect(isTradeAcceptable('invalid')).toBe(false);
  });
});

describe('getTradeAcceptableConditions', () => {
  test('returns NM, LP, MP', () => {
    const tradeable = getTradeAcceptableConditions();
    const ids = tradeable.map((c) => c.id);
    expect(ids).toEqual(['nm', 'lp', 'mp']);
  });
});

describe('getNonTradeAcceptableConditions', () => {
  test('returns HP, DMG', () => {
    const nonTradeable = getNonTradeAcceptableConditions();
    const ids = nonTradeable.map((c) => c.id);
    expect(ids).toEqual(['hp', 'dmg']);
  });
});

// ============================================================================
// GRADING HELPER FUNCTIONS
// ============================================================================

describe('getGradingGuidance', () => {
  test('returns guidance for all valid conditions', () => {
    expect(getGradingGuidance('nm')).toContain('corner');
    expect(getGradingGuidance('lp')).toContain('imperfections');
    expect(getGradingGuidance('mp')).toContain('visible');
    expect(getGradingGuidance('hp')).toContain('crease');
    expect(getGradingGuidance('dmg')).toContain('tear');
  });

  test('returns default guidance for invalid condition', () => {
    const guidance = getGradingGuidance('invalid');
    expect(guidance).toContain('light');
  });
});

describe('getNextBetterCondition', () => {
  test('returns next better condition', () => {
    expect(getNextBetterCondition('LP')?.id).toBe('nm');
    expect(getNextBetterCondition('MP')?.id).toBe('lp');
    expect(getNextBetterCondition('HP')?.id).toBe('mp');
    expect(getNextBetterCondition('DMG')?.id).toBe('hp');
  });

  test('returns null for NM (best condition)', () => {
    expect(getNextBetterCondition('NM')).toBeNull();
  });

  test('returns null for invalid condition', () => {
    expect(getNextBetterCondition('invalid')).toBeNull();
  });
});

describe('getNextWorseCondition', () => {
  test('returns next worse condition', () => {
    expect(getNextWorseCondition('NM')?.id).toBe('lp');
    expect(getNextWorseCondition('LP')?.id).toBe('mp');
    expect(getNextWorseCondition('MP')?.id).toBe('hp');
    expect(getNextWorseCondition('HP')?.id).toBe('dmg');
  });

  test('returns null for DMG (worst condition)', () => {
    expect(getNextWorseCondition('DMG')).toBeNull();
  });

  test('returns null for invalid condition', () => {
    expect(getNextWorseCondition('invalid')).toBeNull();
  });
});

describe('estimateConditionFromDamage', () => {
  test('detects Damaged indicators', () => {
    expect(estimateConditionFromDamage('has a tear')?.id).toBe('dmg');
    expect(estimateConditionFromDamage('water damage visible')?.id).toBe('dmg');
    expect(estimateConditionFromDamage('missing corner')?.id).toBe('dmg');
    expect(estimateConditionFromDamage('someone wrote on it with pen')?.id).toBe('dmg');
    expect(estimateConditionFromDamage('has stickers on the back')?.id).toBe('dmg');
  });

  test('detects Heavily Played indicators', () => {
    expect(estimateConditionFromDamage('heavy scratching')?.id).toBe('hp');
    expect(estimateConditionFromDamage('deep scratch on surface')?.id).toBe('hp');
    expect(estimateConditionFromDamage('has a crease')?.id).toBe('hp');
    expect(estimateConditionFromDamage('card is bent')?.id).toBe('hp');
    expect(estimateConditionFromDamage('major edge wear')?.id).toBe('hp');
  });

  test('detects Moderately Played indicators', () => {
    expect(estimateConditionFromDamage('multiple scratches')?.id).toBe('mp');
    expect(estimateConditionFromDamage('visible wear')?.id).toBe('mp');
    expect(estimateConditionFromDamage('noticeable edge whitening')?.id).toBe('mp');
    expect(estimateConditionFromDamage('corners are worn down')?.id).toBe('mp');
  });

  test('detects Lightly Played indicators', () => {
    expect(estimateConditionFromDamage('tiny scratch')?.id).toBe('lp');
    expect(estimateConditionFromDamage('minor wear')?.id).toBe('lp');
    expect(estimateConditionFromDamage('slight edge wear')?.id).toBe('lp');
    expect(estimateConditionFromDamage('small mark on back')?.id).toBe('lp');
  });

  test('detects Near Mint indicators', () => {
    expect(estimateConditionFromDamage('perfect condition')?.id).toBe('nm');
    expect(estimateConditionFromDamage('mint')?.id).toBe('nm');
    expect(estimateConditionFromDamage('no damage at all')?.id).toBe('nm');
    expect(estimateConditionFromDamage('pack fresh')?.id).toBe('nm');
  });

  test('returns null for ambiguous descriptions', () => {
    expect(estimateConditionFromDamage('')).toBeNull();
    expect(estimateConditionFromDamage('looks okay')).toBeNull();
    expect(estimateConditionFromDamage('normal card')).toBeNull();
  });
});

// ============================================================================
// STATISTICS & DISTRIBUTION FUNCTIONS
// ============================================================================

describe('calculateConditionDistribution', () => {
  test('calculates distribution correctly', () => {
    const conditions = ['NM', 'NM', 'LP', 'LP', 'LP', 'MP', 'HP'];
    const result = calculateConditionDistribution(conditions);

    expect(result.totalCards).toBe(7);
    expect(result.unknown).toEqual([]);

    const nmItem = result.distribution.find((d) => d.condition.id === 'nm');
    expect(nmItem?.count).toBe(2);
    expect(nmItem?.percentage).toBe(29); // 2/7 ≈ 29%

    const lpItem = result.distribution.find((d) => d.condition.id === 'lp');
    expect(lpItem?.count).toBe(3);
    expect(lpItem?.percentage).toBe(43); // 3/7 ≈ 43%
  });

  test('handles empty array', () => {
    const result = calculateConditionDistribution([]);
    expect(result.totalCards).toBe(0);
    expect(result.distribution).toEqual([]);
  });

  test('handles null/undefined values', () => {
    const conditions = ['NM', null, 'LP', undefined, 'NM'];
    const result = calculateConditionDistribution(conditions);
    expect(result.totalCards).toBe(3); // Only counts valid conditions
  });

  test('tracks unknown conditions', () => {
    const conditions = ['NM', 'UNKNOWN', 'LP', 'WEIRD'];
    const result = calculateConditionDistribution(conditions);
    expect(result.unknown).toEqual(['UNKNOWN', 'WEIRD']);
    expect(result.totalCards).toBe(4);
  });
});

describe('getConditionStats', () => {
  test('calculates comprehensive stats', () => {
    const conditions = ['NM', 'LP', 'LP', 'MP', 'HP', 'DMG'];
    const stats = getConditionStats(conditions);

    expect(stats.totalCards).toBe(6);
    expect(stats.bestCondition?.id).toBe('nm');
    expect(stats.worstCondition?.id).toBe('dmg');
    expect(stats.distribution.length).toBe(5);
  });

  test('returns null values for empty array', () => {
    const stats = getConditionStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.bestCondition).toBeNull();
    expect(stats.worstCondition).toBeNull();
    expect(stats.averageCondition).toBeNull();
  });

  test('calculates average condition', () => {
    // All NM = average sort order 1
    const allNM = getConditionStats(['NM', 'NM', 'NM']);
    expect(allNM.averageCondition?.id).toBe('nm');

    // All DMG = average sort order 5
    const allDMG = getConditionStats(['DMG', 'DMG']);
    expect(allDMG.averageCondition?.id).toBe('dmg');
  });
});

describe('getTradeablePercentage', () => {
  test('calculates percentage correctly', () => {
    // All tradeable
    expect(getTradeablePercentage(['NM', 'LP', 'MP'])).toBe(100);

    // None tradeable
    expect(getTradeablePercentage(['HP', 'DMG'])).toBe(0);

    // Mixed
    expect(getTradeablePercentage(['NM', 'LP', 'HP', 'DMG'])).toBe(50);
  });

  test('returns 0 for empty array', () => {
    expect(getTradeablePercentage([])).toBe(0);
  });
});

// ============================================================================
// EDUCATIONAL CONTENT HELPERS
// ============================================================================

describe('getConditionExplanation', () => {
  test('includes all condition grades', () => {
    const explanation = getConditionExplanation();
    expect(explanation).toContain('NM');
    expect(explanation).toContain('LP');
    expect(explanation).toContain('MP');
    expect(explanation).toContain('HP');
    expect(explanation).toContain('DMG');
  });

  test('is kid-friendly (no jargon)', () => {
    const explanation = getConditionExplanation();
    expect(explanation).not.toMatch(/PSA|BGS|CGC/i);
    expect(explanation).not.toMatch(/\$\d+/);
  });
});

describe('getConditionFunFacts', () => {
  test('returns facts for all conditions', () => {
    expect(getConditionFunFacts('nm').length).toBeGreaterThan(0);
    expect(getConditionFunFacts('lp').length).toBeGreaterThan(0);
    expect(getConditionFunFacts('mp').length).toBeGreaterThan(0);
    expect(getConditionFunFacts('hp').length).toBeGreaterThan(0);
    expect(getConditionFunFacts('dmg').length).toBeGreaterThan(0);
  });

  test('returns default fact for unknown condition', () => {
    const facts = getConditionFunFacts('invalid');
    expect(facts.length).toBe(1);
    expect(facts[0]).toContain('story');
  });
});

describe('getCardCareAdvice', () => {
  test('returns advice for all conditions', () => {
    expect(getCardCareAdvice('nm')).toContain('sleeve');
    expect(getCardCareAdvice('lp')).toContain('sleeve');
    expect(getCardCareAdvice('mp')).toContain('deck');
    expect(getCardCareAdvice('hp')).toContain('sleeve');
    expect(getCardCareAdvice('dmg')).toContain('binder');
  });

  test('returns default advice for unknown condition', () => {
    const advice = getCardCareAdvice('invalid');
    expect(advice).toContain('Store');
  });
});

describe('isCollectibleCondition', () => {
  test('returns true for NM and LP', () => {
    expect(isCollectibleCondition('NM')).toBe(true);
    expect(isCollectibleCondition('LP')).toBe(true);
  });

  test('returns false for MP, HP, DMG', () => {
    expect(isCollectibleCondition('MP')).toBe(false);
    expect(isCollectibleCondition('HP')).toBe(false);
    expect(isCollectibleCondition('DMG')).toBe(false);
  });

  test('returns false for null/undefined', () => {
    expect(isCollectibleCondition(null)).toBe(false);
    expect(isCollectibleCondition(undefined)).toBe(false);
  });
});

describe('isPlayableCondition', () => {
  test('returns true for NM, LP, MP, HP', () => {
    expect(isPlayableCondition('NM')).toBe(true);
    expect(isPlayableCondition('LP')).toBe(true);
    expect(isPlayableCondition('MP')).toBe(true);
    expect(isPlayableCondition('HP')).toBe(true);
  });

  test('returns false for DMG', () => {
    expect(isPlayableCondition('DMG')).toBe(false);
  });

  test('returns false for null/undefined', () => {
    expect(isPlayableCondition(null)).toBe(false);
    expect(isPlayableCondition(undefined)).toBe(false);
  });
});

describe('getConditionTier', () => {
  test('returns correct tier names', () => {
    expect(getConditionTier('NM')).toBe('Near Mint');
    expect(getConditionTier('LP')).toBe('Lightly Played');
    expect(getConditionTier('DMG')).toBe('Damaged');
  });

  test('returns Unknown for null/undefined/invalid', () => {
    expect(getConditionTier(null)).toBe('Unknown');
    expect(getConditionTier(undefined)).toBe('Unknown');
    expect(getConditionTier('invalid')).toBe('Unknown');
  });
});

describe('formatConditionWithIcon', () => {
  test('formats correctly with icon', () => {
    expect(formatConditionWithIcon('NM')).toBe('✨ NM');
    expect(formatConditionWithIcon('LP')).toBe('👍 LP');
    expect(formatConditionWithIcon('DMG')).toBe('❌ DMG');
  });

  test('returns ❓ Unknown for null/undefined', () => {
    expect(formatConditionWithIcon(null)).toBe('❓ Unknown');
    expect(formatConditionWithIcon(undefined)).toBe('❓ Unknown');
  });

  test('returns ❓ with original string for unknown', () => {
    expect(formatConditionWithIcon('XYZ')).toBe('❓ XYZ');
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration: Grading a New Card', () => {
  test('can grade a card from damage description and get full info', () => {
    // User describes their card
    const damageDescription = 'tiny scratch on the holo, otherwise looks great';

    // Estimate condition
    const estimated = estimateConditionFromDamage(damageDescription);
    expect(estimated?.id).toBe('lp');

    // Get full info for display
    const tooltip = getConditionTooltipData(estimated!.id);
    expect(tooltip.title).toContain('Lightly Played');

    // Check if tradeable
    expect(isTradeAcceptable(estimated!.id)).toBe(true);

    // Get care advice
    const advice = getCardCareAdvice(estimated!.id);
    expect(advice).toContain('sleeve');
  });
});

describe('Integration: Comparing Cards for Trade', () => {
  test('can compare two cards and determine trade fairness', () => {
    const myCardCondition = 'NM';
    const theirCardCondition = 'MP';

    const comparison = compareConditionsDetailed(myCardCondition, theirCardCondition);
    expect(comparison).not.toBeNull();

    // My card is better
    expect(comparison!.betterCondition.id).toBe('nm');
    expect(comparison!.valueDifferencePercent).toBe(50); // 100 - 50

    // Both are tradeable but significant value difference
    expect(comparison!.bothTradeAcceptable).toBe(true);
    expect(isBetterConditionThan(myCardCondition, theirCardCondition)).toBe(true);
  });
});

describe('Integration: Collection Condition Analysis', () => {
  test('can analyze collection condition distribution', () => {
    const collectionConditions = ['NM', 'NM', 'NM', 'LP', 'LP', 'MP', 'MP', 'MP', 'HP', 'DMG'];

    const stats = getConditionStats(collectionConditions);
    expect(stats.totalCards).toBe(10);
    expect(stats.bestCondition?.id).toBe('nm');
    expect(stats.worstCondition?.id).toBe('dmg');

    // Check trade percentage
    const tradeablePercent = getTradeablePercentage(collectionConditions);
    expect(tradeablePercent).toBe(80); // 8 out of 10 are NM/LP/MP

    // Check distribution
    const { distribution } = calculateConditionDistribution(collectionConditions);
    const nmCount = distribution.find((d) => d.condition.id === 'nm')?.count;
    expect(nmCount).toBe(3);
  });
});

describe('Integration: Card Progression', () => {
  test('can track card degradation path', () => {
    let currentCondition = 'NM';

    // Card gets slightly worn
    const nextWorse = getNextWorseCondition(currentCondition);
    expect(nextWorse?.id).toBe('lp');
    currentCondition = nextWorse!.id;

    // Check if still collectible
    expect(isCollectibleCondition(currentCondition)).toBe(true);

    // More wear
    const evenWorse = getNextWorseCondition(currentCondition);
    expect(evenWorse?.id).toBe('mp');
    currentCondition = evenWorse!.id;

    // Check if still playable but not collectible
    expect(isCollectibleCondition(currentCondition)).toBe(false);
    expect(isPlayableCondition(currentCondition)).toBe(true);
    expect(isTradeAcceptable(currentCondition)).toBe(true);

    // Get guidance for this condition
    const guidance = getGradingGuidance(currentCondition);
    expect(guidance).toContain('visible');
  });
});
