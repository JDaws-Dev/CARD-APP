import { describe, expect, test } from 'vitest';
import {
  STREAK_MILESTONES,
  TIER_CONFIG,
  getMilestoneByDays,
  getAchievedMilestones,
  getNextMilestone,
  getHighestMilestone,
  getDaysToNextMilestone,
  getMilestoneProgressPercentage,
  getStreakMilestoneProgress,
  justAchievedMilestone,
  getUnlockedItemIds,
  getMilestoneTierLabel,
  getMilestoneEncouragement,
  formatMilestoneDays,
  getMilestoneIndex,
  getTotalMilestones,
  hasAchievedAllMilestones,
} from '../streakMilestones';

// ============================================================================
// CONSTANTS VALIDATION
// ============================================================================

describe('STREAK_MILESTONES constant', () => {
  test('has exactly 5 milestones', () => {
    expect(STREAK_MILESTONES).toHaveLength(5);
  });

  test('milestones are at correct day thresholds', () => {
    const days = STREAK_MILESTONES.map((m) => m.days);
    expect(days).toEqual([7, 14, 30, 60, 100]);
  });

  test('all milestones have required properties', () => {
    STREAK_MILESTONES.forEach((milestone) => {
      expect(milestone).toHaveProperty('days');
      expect(milestone).toHaveProperty('name');
      expect(milestone).toHaveProperty('title');
      expect(milestone).toHaveProperty('description');
      expect(milestone).toHaveProperty('icon');
      expect(milestone).toHaveProperty('gradient');
      expect(milestone).toHaveProperty('glowColor');
      expect(milestone).toHaveProperty('tier');
      expect(milestone).toHaveProperty('unlockedItemIds');
    });
  });

  test('all milestones have unique names', () => {
    const names = STREAK_MILESTONES.map((m) => m.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('milestones are in ascending order by days', () => {
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i].days).toBeGreaterThan(STREAK_MILESTONES[i - 1].days);
    }
  });

  test('each milestone has at least one unlockable item', () => {
    STREAK_MILESTONES.forEach((milestone) => {
      expect(milestone.unlockedItemIds.length).toBeGreaterThan(0);
    });
  });

  test('tier progression is bronze -> silver -> gold -> platinum -> diamond', () => {
    const tiers = STREAK_MILESTONES.map((m) => m.tier);
    expect(tiers).toEqual(['bronze', 'silver', 'gold', 'platinum', 'diamond']);
  });
});

describe('TIER_CONFIG constant', () => {
  test('has all 5 tiers', () => {
    expect(Object.keys(TIER_CONFIG)).toHaveLength(5);
    expect(TIER_CONFIG).toHaveProperty('bronze');
    expect(TIER_CONFIG).toHaveProperty('silver');
    expect(TIER_CONFIG).toHaveProperty('gold');
    expect(TIER_CONFIG).toHaveProperty('platinum');
    expect(TIER_CONFIG).toHaveProperty('diamond');
  });

  test('each tier has required styling properties', () => {
    Object.values(TIER_CONFIG).forEach((tier) => {
      expect(tier).toHaveProperty('label');
      expect(tier).toHaveProperty('bgColor');
      expect(tier).toHaveProperty('textColor');
      expect(tier).toHaveProperty('borderColor');
    });
  });
});

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

describe('getMilestoneByDays', () => {
  test('returns correct milestone for valid days', () => {
    expect(getMilestoneByDays(7)?.name).toBe('Week Warrior');
    expect(getMilestoneByDays(14)?.name).toBe('Fortnight Champion');
    expect(getMilestoneByDays(30)?.name).toBe('Monthly Master');
    expect(getMilestoneByDays(60)?.name).toBe('Season Collector');
    expect(getMilestoneByDays(100)?.name).toBe('Legendary Collector');
  });

  test('returns undefined for non-milestone days', () => {
    expect(getMilestoneByDays(5)).toBeUndefined();
    expect(getMilestoneByDays(15)).toBeUndefined();
    expect(getMilestoneByDays(50)).toBeUndefined();
    expect(getMilestoneByDays(101)).toBeUndefined();
  });
});

// ============================================================================
// ACHIEVEMENT TRACKING
// ============================================================================

describe('getAchievedMilestones', () => {
  test('returns empty array for streak less than 7', () => {
    expect(getAchievedMilestones(0)).toEqual([]);
    expect(getAchievedMilestones(6)).toEqual([]);
  });

  test('returns first milestone at 7 days', () => {
    const achieved = getAchievedMilestones(7);
    expect(achieved).toHaveLength(1);
    expect(achieved[0].days).toBe(7);
  });

  test('returns first two milestones at 14 days', () => {
    const achieved = getAchievedMilestones(14);
    expect(achieved).toHaveLength(2);
    expect(achieved.map((m) => m.days)).toEqual([7, 14]);
  });

  test('returns all milestones at 100 days', () => {
    const achieved = getAchievedMilestones(100);
    expect(achieved).toHaveLength(5);
  });

  test('returns all milestones above 100 days', () => {
    const achieved = getAchievedMilestones(150);
    expect(achieved).toHaveLength(5);
  });

  test('handles intermediate values correctly', () => {
    expect(getAchievedMilestones(8)).toHaveLength(1);
    expect(getAchievedMilestones(29)).toHaveLength(2);
    expect(getAchievedMilestones(30)).toHaveLength(3);
    expect(getAchievedMilestones(59)).toHaveLength(3);
    expect(getAchievedMilestones(60)).toHaveLength(4);
    expect(getAchievedMilestones(99)).toHaveLength(4);
  });
});

describe('getNextMilestone', () => {
  test('returns first milestone for 0 streak', () => {
    const next = getNextMilestone(0);
    expect(next?.days).toBe(7);
  });

  test('returns second milestone after achieving first', () => {
    const next = getNextMilestone(7);
    expect(next?.days).toBe(14);
  });

  test('returns null after achieving all milestones', () => {
    expect(getNextMilestone(100)).toBeNull();
    expect(getNextMilestone(150)).toBeNull();
  });

  test('returns correct next milestone for intermediate values', () => {
    expect(getNextMilestone(5)?.days).toBe(7);
    expect(getNextMilestone(10)?.days).toBe(14);
    expect(getNextMilestone(20)?.days).toBe(30);
    expect(getNextMilestone(45)?.days).toBe(60);
    expect(getNextMilestone(80)?.days).toBe(100);
  });
});

describe('getHighestMilestone', () => {
  test('returns null for streak below 7', () => {
    expect(getHighestMilestone(0)).toBeNull();
    expect(getHighestMilestone(6)).toBeNull();
  });

  test('returns first milestone at 7 days', () => {
    expect(getHighestMilestone(7)?.days).toBe(7);
  });

  test('returns highest achieved milestone', () => {
    expect(getHighestMilestone(14)?.days).toBe(14);
    expect(getHighestMilestone(30)?.days).toBe(30);
    expect(getHighestMilestone(60)?.days).toBe(60);
    expect(getHighestMilestone(100)?.days).toBe(100);
  });

  test('handles intermediate values', () => {
    expect(getHighestMilestone(10)?.days).toBe(7);
    expect(getHighestMilestone(25)?.days).toBe(14);
    expect(getHighestMilestone(50)?.days).toBe(30);
    expect(getHighestMilestone(75)?.days).toBe(60);
    expect(getHighestMilestone(120)?.days).toBe(100);
  });
});

// ============================================================================
// PROGRESS CALCULATIONS
// ============================================================================

describe('getDaysToNextMilestone', () => {
  test('returns 7 for 0 streak', () => {
    expect(getDaysToNextMilestone(0)).toBe(7);
  });

  test('returns correct days remaining', () => {
    expect(getDaysToNextMilestone(5)).toBe(2);
    expect(getDaysToNextMilestone(7)).toBe(7); // 14 - 7
    expect(getDaysToNextMilestone(10)).toBe(4); // 14 - 10
    expect(getDaysToNextMilestone(14)).toBe(16); // 30 - 14
    expect(getDaysToNextMilestone(30)).toBe(30); // 60 - 30
    expect(getDaysToNextMilestone(60)).toBe(40); // 100 - 60
  });

  test('returns 0 when all milestones achieved', () => {
    expect(getDaysToNextMilestone(100)).toBe(0);
    expect(getDaysToNextMilestone(150)).toBe(0);
  });
});

describe('getMilestoneProgressPercentage', () => {
  test('returns 0 for 0 streak', () => {
    expect(getMilestoneProgressPercentage(0)).toBe(0);
  });

  test('returns 100 when all milestones achieved', () => {
    expect(getMilestoneProgressPercentage(100)).toBe(100);
    expect(getMilestoneProgressPercentage(150)).toBe(100);
  });

  test('calculates progress within first milestone range', () => {
    expect(getMilestoneProgressPercentage(0)).toBe(0);
    expect(getMilestoneProgressPercentage(3)).toBe(43); // 3/7 ≈ 43%
    expect(getMilestoneProgressPercentage(7)).toBe(0); // At milestone, progress to next starts at 0
  });

  test('calculates progress between milestones', () => {
    // Between 7 and 14 (range of 7)
    expect(getMilestoneProgressPercentage(7)).toBe(0);
    expect(getMilestoneProgressPercentage(10)).toBe(43); // 3/7 ≈ 43%
    expect(getMilestoneProgressPercentage(14)).toBe(0); // At milestone

    // Between 14 and 30 (range of 16)
    expect(getMilestoneProgressPercentage(22)).toBe(50); // 8/16 = 50%
  });
});

describe('getStreakMilestoneProgress', () => {
  test('returns complete progress object', () => {
    const progress = getStreakMilestoneProgress(25);

    expect(progress).toHaveProperty('currentStreak', 25);
    expect(progress).toHaveProperty('achievedMilestones');
    expect(progress).toHaveProperty('nextMilestone');
    expect(progress).toHaveProperty('daysToNextMilestone');
    expect(progress).toHaveProperty('progressPercentage');
    expect(progress).toHaveProperty('highestAchievedMilestone');
  });

  test('calculates correct values for 25 day streak', () => {
    const progress = getStreakMilestoneProgress(25);

    expect(progress.currentStreak).toBe(25);
    expect(progress.achievedMilestones).toHaveLength(2);
    expect(progress.nextMilestone?.days).toBe(30);
    expect(progress.daysToNextMilestone).toBe(5);
    expect(progress.highestAchievedMilestone?.days).toBe(14);
  });

  test('handles 0 streak', () => {
    const progress = getStreakMilestoneProgress(0);

    expect(progress.achievedMilestones).toHaveLength(0);
    expect(progress.nextMilestone?.days).toBe(7);
    expect(progress.daysToNextMilestone).toBe(7);
    expect(progress.highestAchievedMilestone).toBeNull();
  });

  test('handles all milestones achieved', () => {
    const progress = getStreakMilestoneProgress(100);

    expect(progress.achievedMilestones).toHaveLength(5);
    expect(progress.nextMilestone).toBeNull();
    expect(progress.daysToNextMilestone).toBe(0);
    expect(progress.progressPercentage).toBe(100);
  });
});

// ============================================================================
// MILESTONE DETECTION
// ============================================================================

describe('justAchievedMilestone', () => {
  test('returns null when no milestone crossed', () => {
    expect(justAchievedMilestone(5, 4)).toBeNull();
    expect(justAchievedMilestone(10, 9)).toBeNull();
    expect(justAchievedMilestone(15, 14)).toBeNull();
  });

  test('returns milestone when crossing threshold', () => {
    expect(justAchievedMilestone(7, 6)?.days).toBe(7);
    expect(justAchievedMilestone(14, 13)?.days).toBe(14);
    expect(justAchievedMilestone(30, 29)?.days).toBe(30);
    expect(justAchievedMilestone(60, 59)?.days).toBe(60);
    expect(justAchievedMilestone(100, 99)?.days).toBe(100);
  });

  test('returns milestone when jumping past threshold', () => {
    expect(justAchievedMilestone(10, 5)?.days).toBe(7);
    expect(justAchievedMilestone(20, 10)?.days).toBe(14);
  });

  test('returns null when already past milestone', () => {
    expect(justAchievedMilestone(8, 7)).toBeNull();
    expect(justAchievedMilestone(15, 14)).toBeNull();
  });
});

// ============================================================================
// UNLOCKED ITEMS
// ============================================================================

describe('getUnlockedItemIds', () => {
  test('returns empty array for 0 streak', () => {
    expect(getUnlockedItemIds(0)).toEqual([]);
  });

  test('returns first milestone items at 7 days', () => {
    const items = getUnlockedItemIds(7);
    expect(items).toContain('frame_streak_silver');
    expect(items).toContain('badge_moon');
  });

  test('accumulates items as milestones are achieved', () => {
    const items7 = getUnlockedItemIds(7);
    const items14 = getUnlockedItemIds(14);
    const items30 = getUnlockedItemIds(30);

    expect(items14.length).toBeGreaterThan(items7.length);
    expect(items30.length).toBeGreaterThan(items14.length);
  });

  test('includes all items at 100 days', () => {
    const items = getUnlockedItemIds(100);
    // Should have items from all milestones
    expect(items).toContain('frame_streak_silver');
    expect(items).toContain('frame_streak_gold');
    expect(items).toContain('frame_streak_platinum');
    expect(items).toContain('frame_streak_diamond');
    expect(items).toContain('frame_streak_legendary');
    expect(items).toContain('badge_streak_100');
    expect(items).toContain('hat_streak_legend');
  });
});

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

describe('getMilestoneTierLabel', () => {
  test('returns correct labels for all tiers', () => {
    expect(getMilestoneTierLabel('bronze')).toBe('Bronze');
    expect(getMilestoneTierLabel('silver')).toBe('Silver');
    expect(getMilestoneTierLabel('gold')).toBe('Gold');
    expect(getMilestoneTierLabel('platinum')).toBe('Platinum');
    expect(getMilestoneTierLabel('diamond')).toBe('Diamond');
  });
});

describe('getMilestoneEncouragement', () => {
  test('returns all milestones message when complete', () => {
    const msg = getMilestoneEncouragement(100);
    expect(msg).toContain('all streak milestones');
  });

  test('returns "just 1 more day" message when 1 day away', () => {
    expect(getMilestoneEncouragement(6)).toContain('1 more day');
    expect(getMilestoneEncouragement(13)).toContain('1 more day');
  });

  test('returns "almost there" message when 2-3 days away', () => {
    expect(getMilestoneEncouragement(5)).toContain('Almost there');
    expect(getMilestoneEncouragement(12)).toContain('Almost there');
  });

  test('returns "getting close" message when 4-7 days away', () => {
    expect(getMilestoneEncouragement(10)).toContain('Getting close');
  });

  test('returns progress message for longer distances', () => {
    const msg = getMilestoneEncouragement(0);
    // At 0 days, it's 7 days to Week Warrior which triggers "Getting close" message
    expect(msg).toContain('days to');
  });
});

describe('formatMilestoneDays', () => {
  test('formats milestone days correctly', () => {
    expect(formatMilestoneDays(7)).toBe('1 week');
    expect(formatMilestoneDays(14)).toBe('2 weeks');
    expect(formatMilestoneDays(30)).toBe('1 month');
    expect(formatMilestoneDays(60)).toBe('2 months');
    expect(formatMilestoneDays(100)).toBe('100 days');
  });

  test('formats non-milestone days with generic format', () => {
    expect(formatMilestoneDays(5)).toBe('5 days');
    expect(formatMilestoneDays(45)).toBe('45 days');
  });
});

describe('getMilestoneIndex', () => {
  test('returns 1-based index', () => {
    expect(getMilestoneIndex(STREAK_MILESTONES[0])).toBe(1);
    expect(getMilestoneIndex(STREAK_MILESTONES[1])).toBe(2);
    expect(getMilestoneIndex(STREAK_MILESTONES[4])).toBe(5);
  });
});

describe('getTotalMilestones', () => {
  test('returns 5', () => {
    expect(getTotalMilestones()).toBe(5);
  });
});

describe('hasAchievedAllMilestones', () => {
  test('returns false for streaks below 100', () => {
    expect(hasAchievedAllMilestones(0)).toBe(false);
    expect(hasAchievedAllMilestones(50)).toBe(false);
    expect(hasAchievedAllMilestones(99)).toBe(false);
  });

  test('returns true for streaks at or above 100', () => {
    expect(hasAchievedAllMilestones(100)).toBe(true);
    expect(hasAchievedAllMilestones(150)).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Milestone progression', () => {
  test('progresses correctly through all milestones', () => {
    const testCases = [
      { streak: 0, achieved: 0, next: 7 },
      { streak: 7, achieved: 1, next: 14 },
      { streak: 14, achieved: 2, next: 30 },
      { streak: 30, achieved: 3, next: 60 },
      { streak: 60, achieved: 4, next: 100 },
      { streak: 100, achieved: 5, next: null },
    ];

    testCases.forEach(({ streak, achieved, next }) => {
      const progress = getStreakMilestoneProgress(streak);
      expect(progress.achievedMilestones.length).toBe(achieved);
      expect(progress.nextMilestone?.days ?? null).toBe(next);
    });
  });
});

describe('Integration: Item unlocks', () => {
  test('unlocks correct items at each milestone', () => {
    // At 7 days, should unlock Week Warrior items
    const items7 = getUnlockedItemIds(7);
    expect(items7).toContain('frame_streak_silver');

    // At 14 days, should have 7-day and 14-day items
    const items14 = getUnlockedItemIds(14);
    expect(items14).toContain('frame_streak_silver');
    expect(items14).toContain('frame_streak_gold');

    // At 100 days, should have all streak items
    const items100 = getUnlockedItemIds(100);
    expect(items100).toContain('hat_streak_legend');
    expect(items100).toContain('badge_streak_100');
  });
});
