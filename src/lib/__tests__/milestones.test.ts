import { describe, expect, test } from 'vitest';
import {
  COLLECTION_MILESTONES,
  checkMilestoneReached,
  getAllMilestonesCrossed,
  createMilestoneReachedData,
  getCurrentMilestone,
  getNextMilestone,
  getMilestoneByKey,
  getMilestoneByThreshold,
  cardsToNextMilestone,
  percentToNextMilestone,
  getMilestoneProgress,
  createCelebrationData,
  getCelebrationMessage,
  isValidMilestoneKey,
  getMilestoneThresholds,
  getMilestoneKeys,
  getReachedMilestones,
  getUnreachedMilestones,
  hasReachedAllMilestones,
  countReachedMilestones,
  getTotalMilestones,
  formatMilestoneProgress,
  getCurrentProgressIcon,
  getMotivationalMessage,
  getMilestoneSummary,
} from '../milestones';

// ============================================================================
// COLLECTION_MILESTONES CONSTANTS
// ============================================================================

describe('COLLECTION_MILESTONES constant', () => {
  test('has exactly 4 milestones', () => {
    expect(COLLECTION_MILESTONES).toHaveLength(4);
  });

  test('has correct thresholds: 10, 50, 100, 500', () => {
    const thresholds = COLLECTION_MILESTONES.map((m) => m.threshold);
    expect(thresholds).toEqual([10, 50, 100, 500]);
  });

  test('has unique keys', () => {
    const keys = COLLECTION_MILESTONES.map((m) => m.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test('all milestones have required properties', () => {
    for (const milestone of COLLECTION_MILESTONES) {
      expect(milestone).toHaveProperty('threshold');
      expect(milestone).toHaveProperty('key');
      expect(milestone).toHaveProperty('name');
      expect(milestone).toHaveProperty('description');
      expect(milestone).toHaveProperty('celebrationMessage');
      expect(milestone).toHaveProperty('icon');
      expect(milestone).toHaveProperty('confettiType');
    }
  });

  test('milestones are sorted by threshold ascending', () => {
    for (let i = 1; i < COLLECTION_MILESTONES.length; i++) {
      expect(COLLECTION_MILESTONES[i].threshold).toBeGreaterThan(
        COLLECTION_MILESTONES[i - 1].threshold
      );
    }
  });
});

// ============================================================================
// MILESTONE DETECTION
// ============================================================================

describe('checkMilestoneReached', () => {
  test('returns null when count stays the same', () => {
    expect(checkMilestoneReached(5, 5)).toBeNull();
  });

  test('returns null when count decreases', () => {
    expect(checkMilestoneReached(15, 10)).toBeNull();
  });

  test('returns null when no threshold is crossed', () => {
    expect(checkMilestoneReached(5, 8)).toBeNull();
    expect(checkMilestoneReached(12, 15)).toBeNull();
    expect(checkMilestoneReached(51, 55)).toBeNull();
  });

  test('returns milestone when 10 threshold is crossed', () => {
    const result = checkMilestoneReached(8, 10);
    expect(result).not.toBeNull();
    expect(result?.threshold).toBe(10);
    expect(result?.key).toBe('milestone_10');
  });

  test('returns milestone when 50 threshold is crossed', () => {
    const result = checkMilestoneReached(45, 50);
    expect(result).not.toBeNull();
    expect(result?.threshold).toBe(50);
    expect(result?.key).toBe('milestone_50');
  });

  test('returns milestone when 100 threshold is crossed', () => {
    const result = checkMilestoneReached(98, 101);
    expect(result).not.toBeNull();
    expect(result?.threshold).toBe(100);
    expect(result?.key).toBe('milestone_100');
  });

  test('returns milestone when 500 threshold is crossed', () => {
    const result = checkMilestoneReached(499, 500);
    expect(result).not.toBeNull();
    expect(result?.threshold).toBe(500);
    expect(result?.key).toBe('milestone_500');
  });

  test('returns highest milestone when multiple are crossed', () => {
    // Adding many cards at once (from 5 to 55)
    const result = checkMilestoneReached(5, 55);
    expect(result).not.toBeNull();
    expect(result?.threshold).toBe(50); // Highest crossed
  });

  test('returns null when already past threshold', () => {
    // Already at 15, adding to 20 - still no milestone crossed
    expect(checkMilestoneReached(15, 20)).toBeNull();
  });
});

describe('getAllMilestonesCrossed', () => {
  test('returns empty array when no milestones crossed', () => {
    expect(getAllMilestonesCrossed(5, 8)).toEqual([]);
  });

  test('returns empty array when count decreases', () => {
    expect(getAllMilestonesCrossed(15, 10)).toEqual([]);
  });

  test('returns single milestone when one is crossed', () => {
    const result = getAllMilestonesCrossed(8, 12);
    expect(result).toHaveLength(1);
    expect(result[0].threshold).toBe(10);
  });

  test('returns multiple milestones when several are crossed', () => {
    // Going from 5 to 120 crosses 10, 50, and 100
    const result = getAllMilestonesCrossed(5, 120);
    expect(result).toHaveLength(3);
    expect(result.map((m) => m.threshold)).toEqual([10, 50, 100]);
  });

  test('returns all milestones when going from 0 to 500+', () => {
    const result = getAllMilestonesCrossed(0, 600);
    expect(result).toHaveLength(4);
  });
});

describe('createMilestoneReachedData', () => {
  test('returns null when no milestone crossed', () => {
    expect(createMilestoneReachedData(5, 8)).toBeNull();
  });

  test('returns data with milestone when threshold crossed', () => {
    const result = createMilestoneReachedData(8, 12);
    expect(result).not.toBeNull();
    expect(result?.milestone.threshold).toBe(10);
    expect(result?.previousCount).toBe(8);
    expect(result?.newCount).toBe(12);
    expect(result?.reachedAt).toBeGreaterThan(0);
  });

  test('marks isFirstTime true when not already celebrated', () => {
    const result = createMilestoneReachedData(8, 12, []);
    expect(result?.isFirstTime).toBe(true);
  });

  test('marks isFirstTime false when already celebrated', () => {
    const result = createMilestoneReachedData(8, 12, ['milestone_10']);
    expect(result?.isFirstTime).toBe(false);
  });
});

// ============================================================================
// MILESTONE PROGRESS
// ============================================================================

describe('getCurrentMilestone', () => {
  test('returns null for 0 cards', () => {
    expect(getCurrentMilestone(0)).toBeNull();
  });

  test('returns null for less than 10 cards', () => {
    expect(getCurrentMilestone(5)).toBeNull();
    expect(getCurrentMilestone(9)).toBeNull();
  });

  test('returns first milestone for 10+ cards', () => {
    const result = getCurrentMilestone(10);
    expect(result?.threshold).toBe(10);
  });

  test('returns second milestone for 50+ cards', () => {
    const result = getCurrentMilestone(75);
    expect(result?.threshold).toBe(50);
  });

  test('returns third milestone for 100+ cards', () => {
    const result = getCurrentMilestone(150);
    expect(result?.threshold).toBe(100);
  });

  test('returns fourth milestone for 500+ cards', () => {
    const result = getCurrentMilestone(999);
    expect(result?.threshold).toBe(500);
  });
});

describe('getNextMilestone', () => {
  test('returns first milestone for 0 cards', () => {
    const result = getNextMilestone(0);
    expect(result?.threshold).toBe(10);
  });

  test('returns second milestone for 10+ cards', () => {
    const result = getNextMilestone(25);
    expect(result?.threshold).toBe(50);
  });

  test('returns third milestone for 50+ cards', () => {
    const result = getNextMilestone(75);
    expect(result?.threshold).toBe(100);
  });

  test('returns fourth milestone for 100+ cards', () => {
    const result = getNextMilestone(200);
    expect(result?.threshold).toBe(500);
  });

  test('returns null when all milestones reached', () => {
    expect(getNextMilestone(500)).toBeNull();
    expect(getNextMilestone(1000)).toBeNull();
  });
});

describe('getMilestoneByKey', () => {
  test('returns milestone for valid key', () => {
    const result = getMilestoneByKey('milestone_10');
    expect(result).not.toBeNull();
    expect(result?.threshold).toBe(10);
  });

  test('returns null for invalid key', () => {
    expect(getMilestoneByKey('invalid_key')).toBeNull();
    expect(getMilestoneByKey('')).toBeNull();
  });
});

describe('getMilestoneByThreshold', () => {
  test('returns milestone for valid threshold', () => {
    expect(getMilestoneByThreshold(10)?.key).toBe('milestone_10');
    expect(getMilestoneByThreshold(50)?.key).toBe('milestone_50');
    expect(getMilestoneByThreshold(100)?.key).toBe('milestone_100');
    expect(getMilestoneByThreshold(500)?.key).toBe('milestone_500');
  });

  test('returns null for invalid threshold', () => {
    expect(getMilestoneByThreshold(25)).toBeNull();
    expect(getMilestoneByThreshold(0)).toBeNull();
  });
});

describe('cardsToNextMilestone', () => {
  test('returns cards needed for first milestone', () => {
    expect(cardsToNextMilestone(0)).toBe(10);
    expect(cardsToNextMilestone(5)).toBe(5);
    expect(cardsToNextMilestone(9)).toBe(1);
  });

  test('returns cards needed for second milestone', () => {
    expect(cardsToNextMilestone(10)).toBe(40);
    expect(cardsToNextMilestone(25)).toBe(25);
  });

  test('returns cards needed for third milestone', () => {
    expect(cardsToNextMilestone(50)).toBe(50);
    expect(cardsToNextMilestone(75)).toBe(25);
  });

  test('returns cards needed for fourth milestone', () => {
    expect(cardsToNextMilestone(100)).toBe(400);
    expect(cardsToNextMilestone(300)).toBe(200);
  });

  test('returns 0 when all milestones reached', () => {
    expect(cardsToNextMilestone(500)).toBe(0);
    expect(cardsToNextMilestone(1000)).toBe(0);
  });
});

describe('percentToNextMilestone', () => {
  test('calculates percentage toward first milestone', () => {
    expect(percentToNextMilestone(0)).toBe(0);
    expect(percentToNextMilestone(5)).toBe(50);
    expect(percentToNextMilestone(9)).toBe(90);
  });

  test('calculates percentage toward second milestone', () => {
    expect(percentToNextMilestone(10)).toBe(0);
    expect(percentToNextMilestone(30)).toBe(50); // 20/40 = 50%
  });

  test('calculates percentage toward third milestone', () => {
    expect(percentToNextMilestone(50)).toBe(0);
    expect(percentToNextMilestone(75)).toBe(50); // 25/50 = 50%
  });

  test('calculates percentage toward fourth milestone', () => {
    expect(percentToNextMilestone(100)).toBe(0);
    expect(percentToNextMilestone(300)).toBe(50); // 200/400 = 50%
  });

  test('returns 100% when all milestones reached', () => {
    expect(percentToNextMilestone(500)).toBe(100);
    expect(percentToNextMilestone(1000)).toBe(100);
  });
});

describe('getMilestoneProgress', () => {
  test('returns progress for new collector', () => {
    const progress = getMilestoneProgress(5);
    expect(progress.currentCount).toBe(5);
    expect(progress.currentMilestone).toBeNull();
    expect(progress.nextMilestone?.threshold).toBe(10);
    expect(progress.cardsToNextMilestone).toBe(5);
  });

  test('returns progress for established collector', () => {
    const progress = getMilestoneProgress(75);
    expect(progress.currentCount).toBe(75);
    expect(progress.currentMilestone?.threshold).toBe(50);
    expect(progress.nextMilestone?.threshold).toBe(100);
    expect(progress.cardsToNextMilestone).toBe(25);
  });

  test('includes celebrated milestone info', () => {
    const celebrated = [{ key: 'milestone_10', reachedAt: Date.now() }];
    const progress = getMilestoneProgress(15, celebrated);

    const milestone10 = progress.allMilestones.find((m) => m.threshold === 10);
    expect(milestone10?.reached).toBe(true);
    expect(milestone10?.reachedAt).toBeDefined();
  });

  test('marks all milestones reached for max collector', () => {
    const progress = getMilestoneProgress(1000);
    expect(progress.allMilestones.every((m) => m.reached)).toBe(true);
    expect(progress.nextMilestone).toBeNull();
  });
});

// ============================================================================
// CELEBRATION DATA
// ============================================================================

describe('createCelebrationData', () => {
  test('returns no celebration for null milestone', () => {
    const data = createCelebrationData(null);
    expect(data.shouldCelebrate).toBe(false);
    expect(data.milestone).toBeNull();
    expect(data.confettiType).toBeNull();
  });

  test('returns celebration data for milestone', () => {
    const milestone = getMilestoneByThreshold(10);
    const data = createCelebrationData(milestone);
    expect(data.shouldCelebrate).toBe(true);
    expect(data.milestone).not.toBeNull();
    expect(data.message).toBe(milestone?.celebrationMessage);
    expect(data.confettiType).toBe('basic');
    expect(data.duration).toBe(2000);
  });

  test('different confetti for different milestones', () => {
    expect(createCelebrationData(getMilestoneByThreshold(10)).confettiType).toBe('basic');
    expect(createCelebrationData(getMilestoneByThreshold(50)).confettiType).toBe('stars');
    expect(createCelebrationData(getMilestoneByThreshold(100)).confettiType).toBe('fireworks');
    expect(createCelebrationData(getMilestoneByThreshold(500)).confettiType).toBe('rainbow');
  });

  test('longer duration for higher milestones', () => {
    const dur10 = createCelebrationData(getMilestoneByThreshold(10)).duration;
    const dur50 = createCelebrationData(getMilestoneByThreshold(50)).duration;
    const dur100 = createCelebrationData(getMilestoneByThreshold(100)).duration;
    const dur500 = createCelebrationData(getMilestoneByThreshold(500)).duration;

    expect(dur50).toBeGreaterThan(dur10);
    expect(dur100).toBeGreaterThan(dur50);
    expect(dur500).toBeGreaterThan(dur100);
  });
});

describe('getCelebrationMessage', () => {
  test('returns base message for single card add', () => {
    const milestone = getMilestoneByThreshold(10)!;
    const message = getCelebrationMessage(milestone, 1);
    expect(message).toBe(milestone.celebrationMessage);
  });

  test('adds context for multiple cards added', () => {
    const milestone = getMilestoneByThreshold(10)!;
    const message = getCelebrationMessage(milestone, 5);
    expect(message).toContain('5 cards at once');
    expect(message).toContain(milestone.celebrationMessage);
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe('isValidMilestoneKey', () => {
  test('returns true for valid keys', () => {
    expect(isValidMilestoneKey('milestone_10')).toBe(true);
    expect(isValidMilestoneKey('milestone_50')).toBe(true);
    expect(isValidMilestoneKey('milestone_100')).toBe(true);
    expect(isValidMilestoneKey('milestone_500')).toBe(true);
  });

  test('returns false for invalid keys', () => {
    expect(isValidMilestoneKey('invalid')).toBe(false);
    expect(isValidMilestoneKey('')).toBe(false);
    expect(isValidMilestoneKey('milestone_25')).toBe(false);
  });
});

describe('getMilestoneThresholds', () => {
  test('returns all thresholds', () => {
    const thresholds = getMilestoneThresholds();
    expect(thresholds).toEqual([10, 50, 100, 500]);
  });
});

describe('getMilestoneKeys', () => {
  test('returns all keys', () => {
    const keys = getMilestoneKeys();
    expect(keys).toEqual(['milestone_10', 'milestone_50', 'milestone_100', 'milestone_500']);
  });
});

// ============================================================================
// TRACKING HELPERS
// ============================================================================

describe('getReachedMilestones', () => {
  test('returns empty for new collector', () => {
    expect(getReachedMilestones(5)).toHaveLength(0);
  });

  test('returns reached milestones', () => {
    expect(getReachedMilestones(75).map((m) => m.threshold)).toEqual([10, 50]);
  });

  test('returns all milestones for max collector', () => {
    expect(getReachedMilestones(500)).toHaveLength(4);
  });
});

describe('getUnreachedMilestones', () => {
  test('returns all for new collector', () => {
    expect(getUnreachedMilestones(5)).toHaveLength(4);
  });

  test('returns unreached milestones', () => {
    expect(getUnreachedMilestones(75).map((m) => m.threshold)).toEqual([100, 500]);
  });

  test('returns empty for max collector', () => {
    expect(getUnreachedMilestones(500)).toHaveLength(0);
  });
});

describe('hasReachedAllMilestones', () => {
  test('returns false for less than 500', () => {
    expect(hasReachedAllMilestones(499)).toBe(false);
  });

  test('returns true for 500+', () => {
    expect(hasReachedAllMilestones(500)).toBe(true);
    expect(hasReachedAllMilestones(1000)).toBe(true);
  });
});

describe('countReachedMilestones', () => {
  test('counts correctly', () => {
    expect(countReachedMilestones(0)).toBe(0);
    expect(countReachedMilestones(5)).toBe(0);
    expect(countReachedMilestones(10)).toBe(1);
    expect(countReachedMilestones(50)).toBe(2);
    expect(countReachedMilestones(100)).toBe(3);
    expect(countReachedMilestones(500)).toBe(4);
  });
});

describe('getTotalMilestones', () => {
  test('returns 4', () => {
    expect(getTotalMilestones()).toBe(4);
  });
});

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

describe('formatMilestoneProgress', () => {
  test('formats progress correctly', () => {
    expect(formatMilestoneProgress(5)).toBe('5 more cards to Getting Started');
    expect(formatMilestoneProgress(9)).toBe('1 more card to Getting Started');
    expect(formatMilestoneProgress(10)).toBe('40 more cards to Rising Collector');
  });

  test('returns completion message when all done', () => {
    expect(formatMilestoneProgress(500)).toBe('All milestones reached!');
  });
});

describe('getCurrentProgressIcon', () => {
  test('returns default icon for new collector', () => {
    expect(getCurrentProgressIcon(5)).toBe('🃏');
  });

  test('returns milestone icon when reached', () => {
    expect(getCurrentProgressIcon(10)).toBe('🌟');
    expect(getCurrentProgressIcon(50)).toBe('✨');
    expect(getCurrentProgressIcon(100)).toBe('🎉');
    expect(getCurrentProgressIcon(500)).toBe('🏆');
  });
});

describe('getMotivationalMessage', () => {
  test('returns encouraging message for new collector', () => {
    const message = getMotivationalMessage(2);
    expect(message).toContain('Getting Started');
  });

  test('returns almost there message at 90%+', () => {
    const message = getMotivationalMessage(9);
    expect(message).toContain('Almost there');
  });

  test('returns completion message when all done', () => {
    const message = getMotivationalMessage(500);
    expect(message).toContain('every milestone');
  });

  test('returns halfway message at 50%', () => {
    const message = getMotivationalMessage(5);
    expect(message).toContain('Halfway');
  });
});

describe('getMilestoneSummary', () => {
  test('returns summary for new collector', () => {
    const summary = getMilestoneSummary(5);
    expect(summary.reached).toBe(0);
    expect(summary.total).toBe(4);
    expect(summary.icon).toBe('🃏');
  });

  test('returns summary for established collector', () => {
    const summary = getMilestoneSummary(75);
    expect(summary.reached).toBe(2);
    expect(summary.total).toBe(4);
    expect(summary.icon).toBe('✨');
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration: New collector journey', () => {
  test('simulates collector adding cards over time', () => {
    // Start with 0 cards
    let progress = getMilestoneProgress(0);
    expect(progress.currentMilestone).toBeNull();
    expect(progress.nextMilestone?.threshold).toBe(10);

    // Add 8 cards
    let crossed = checkMilestoneReached(0, 8);
    expect(crossed).toBeNull();

    // Add 2 more to reach 10
    crossed = checkMilestoneReached(8, 10);
    expect(crossed?.threshold).toBe(10);

    const celebration = createCelebrationData(crossed);
    expect(celebration.shouldCelebrate).toBe(true);
    expect(celebration.confettiType).toBe('basic');

    // Check progress after celebration
    progress = getMilestoneProgress(10);
    expect(progress.currentMilestone?.threshold).toBe(10);
    expect(progress.nextMilestone?.threshold).toBe(50);
    expect(progress.cardsToNextMilestone).toBe(40);
  });
});

describe('Integration: Bulk card addition', () => {
  test('handles adding many cards at once', () => {
    // Add 60 cards at once (crossing 10 and 50)
    const crossed = getAllMilestonesCrossed(5, 65);
    expect(crossed).toHaveLength(2);
    expect(crossed.map((m) => m.threshold)).toEqual([10, 50]);

    // The highest milestone for celebration
    const highest = checkMilestoneReached(5, 65);
    expect(highest?.threshold).toBe(50);
  });
});

describe('Integration: Master collector', () => {
  test('handles collector reaching all milestones', () => {
    const progress = getMilestoneProgress(500);

    expect(progress.currentMilestone?.threshold).toBe(500);
    expect(progress.nextMilestone).toBeNull();
    expect(progress.cardsToNextMilestone).toBe(0);
    expect(progress.percentToNextMilestone).toBe(100);
    expect(hasReachedAllMilestones(500)).toBe(true);

    const summary = getMilestoneSummary(500);
    expect(summary.reached).toBe(4);
    expect(summary.progressText).toBe('All milestones reached!');
  });
});
