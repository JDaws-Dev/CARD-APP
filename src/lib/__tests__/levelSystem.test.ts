import { describe, it, expect } from 'vitest';
import {
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  XP_REWARDS,
  calculateLevelFromXP,
  getLevelInfo,
  getLevelTitle,
  getXPForLevel,
  getNextLevelInfo,
  getXPProgress,
  getLevelProgress,
  willLevelUp,
  calculateLevelUp,
  getXPReward,
  calculateCardXP,
  calculateSetCompletionXP,
  calculateDailyLoginXP,
  getXPRewardDescription,
  isValidXP,
  isValidLevel,
  getAllLevelThresholds,
  getLevelsEarnedBetween,
  xpNeededForLevel,
  formatXP,
  formatLevel,
  getLevelProgressMessage,
  summarizeXPGains,
  type XPGain,
} from '../levelSystem';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Level System Constants', () => {
  describe('LEVEL_THRESHOLDS', () => {
    it('should have 15 levels', () => {
      expect(LEVEL_THRESHOLDS).toHaveLength(15);
    });

    it('should start at level 1 with 0 XP', () => {
      expect(LEVEL_THRESHOLDS[0].level).toBe(1);
      expect(LEVEL_THRESHOLDS[0].xpRequired).toBe(0);
    });

    it('should have ascending levels', () => {
      for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].level).toBe(i + 1);
      }
    });

    it('should have ascending XP requirements', () => {
      for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].xpRequired).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1].xpRequired);
      }
    });

    it('should have unique titles for each level', () => {
      const titles = LEVEL_THRESHOLDS.map((t) => t.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('MAX_LEVEL should match number of thresholds', () => {
      expect(MAX_LEVEL).toBe(LEVEL_THRESHOLDS.length);
    });
  });

  describe('XP_REWARDS', () => {
    it('should have positive XP for all rewards', () => {
      for (const [key, value] of Object.entries(XP_REWARDS)) {
        expect(value).toBeGreaterThan(0);
        expect(typeof value).toBe('number');
      }
    });

    it('should reward more XP for rarer cards', () => {
      expect(XP_REWARDS.ADD_FIRST_EDITION).toBeGreaterThan(XP_REWARDS.ADD_HOLOFOIL);
      expect(XP_REWARDS.ADD_HOLOFOIL).toBeGreaterThan(XP_REWARDS.ADD_REVERSE_HOLOFOIL);
      expect(XP_REWARDS.ADD_REVERSE_HOLOFOIL).toBeGreaterThan(XP_REWARDS.ADD_CARD);
      expect(XP_REWARDS.ADD_CARD).toBeGreaterThan(XP_REWARDS.ADD_CARD_DUPLICATE);
    });

    it('should reward more XP for higher set completion', () => {
      expect(XP_REWARDS.SET_COMPLETION_100).toBeGreaterThan(XP_REWARDS.SET_COMPLETION_75);
      expect(XP_REWARDS.SET_COMPLETION_75).toBeGreaterThan(XP_REWARDS.SET_COMPLETION_50);
      expect(XP_REWARDS.SET_COMPLETION_50).toBeGreaterThan(XP_REWARDS.SET_COMPLETION_25);
    });
  });
});

// ============================================================================
// LEVEL CALCULATION TESTS
// ============================================================================

describe('calculateLevelFromXP', () => {
  it('should return level 1 for 0 XP', () => {
    expect(calculateLevelFromXP(0)).toBe(1);
  });

  it('should return level 1 for negative XP', () => {
    expect(calculateLevelFromXP(-100)).toBe(1);
  });

  it('should return correct level for exact thresholds', () => {
    expect(calculateLevelFromXP(100)).toBe(2);
    expect(calculateLevelFromXP(250)).toBe(3);
    expect(calculateLevelFromXP(500)).toBe(4);
    expect(calculateLevelFromXP(850)).toBe(5);
  });

  it('should return correct level for XP between thresholds', () => {
    expect(calculateLevelFromXP(50)).toBe(1);
    expect(calculateLevelFromXP(99)).toBe(1);
    expect(calculateLevelFromXP(101)).toBe(2);
    expect(calculateLevelFromXP(249)).toBe(2);
    expect(calculateLevelFromXP(251)).toBe(3);
  });

  it('should cap at max level for very high XP', () => {
    expect(calculateLevelFromXP(11200)).toBe(15);
    expect(calculateLevelFromXP(100000)).toBe(15);
    expect(calculateLevelFromXP(999999)).toBe(15);
  });

  it('should handle boundary conditions', () => {
    // Just before level 2
    expect(calculateLevelFromXP(99)).toBe(1);
    // Exactly level 2
    expect(calculateLevelFromXP(100)).toBe(2);
    // Just after level 2 threshold
    expect(calculateLevelFromXP(101)).toBe(2);
  });
});

describe('getLevelInfo', () => {
  it('should return level info for valid levels', () => {
    const level1 = getLevelInfo(1);
    expect(level1).not.toBeNull();
    expect(level1?.level).toBe(1);
    expect(level1?.title).toBe('Rookie Collector');
    expect(level1?.xpRequired).toBe(0);

    const level5 = getLevelInfo(5);
    expect(level5).not.toBeNull();
    expect(level5?.level).toBe(5);
    expect(level5?.title).toBe('Rising Trainer');
  });

  it('should return null for invalid levels', () => {
    expect(getLevelInfo(0)).toBeNull();
    expect(getLevelInfo(-1)).toBeNull();
    expect(getLevelInfo(16)).toBeNull();
    expect(getLevelInfo(100)).toBeNull();
  });
});

describe('getLevelTitle', () => {
  it('should return correct titles', () => {
    expect(getLevelTitle(1)).toBe('Rookie Collector');
    expect(getLevelTitle(10)).toBe('Champion Collector');
    expect(getLevelTitle(15)).toBe('Collection Legend');
  });

  it('should return Unknown for invalid levels', () => {
    expect(getLevelTitle(0)).toBe('Unknown');
    expect(getLevelTitle(16)).toBe('Unknown');
  });
});

describe('getXPForLevel', () => {
  it('should return correct XP requirements', () => {
    expect(getXPForLevel(1)).toBe(0);
    expect(getXPForLevel(2)).toBe(100);
    expect(getXPForLevel(3)).toBe(250);
    expect(getXPForLevel(15)).toBe(11200);
  });

  it('should return 0 for invalid levels', () => {
    expect(getXPForLevel(0)).toBe(0);
    expect(getXPForLevel(16)).toBe(0);
  });
});

describe('getNextLevelInfo', () => {
  it('should return next level info', () => {
    const next = getNextLevelInfo(1);
    expect(next).not.toBeNull();
    expect(next?.level).toBe(2);
    expect(next?.xpRequired).toBe(100);
  });

  it('should return null at max level', () => {
    expect(getNextLevelInfo(15)).toBeNull();
  });

  it('should return null for invalid current levels', () => {
    expect(getNextLevelInfo(16)).toBeNull();
  });
});

describe('getXPProgress', () => {
  it('should return correct progress for level 1', () => {
    const progress = getXPProgress(50);
    expect(progress.xpInCurrentLevel).toBe(50);
    expect(progress.xpToNextLevel).toBe(50);
    expect(progress.percentToNextLevel).toBe(50);
  });

  it('should return correct progress at level boundary', () => {
    const progress = getXPProgress(100);
    expect(progress.xpInCurrentLevel).toBe(0);
    expect(progress.xpToNextLevel).toBe(150); // 250 - 100
    expect(progress.percentToNextLevel).toBe(0);
  });

  it('should return 100% at max level', () => {
    const progress = getXPProgress(15000);
    expect(progress.percentToNextLevel).toBe(100);
    expect(progress.xpToNextLevel).toBe(0);
  });

  it('should handle zero XP', () => {
    const progress = getXPProgress(0);
    expect(progress.xpInCurrentLevel).toBe(0);
    expect(progress.xpToNextLevel).toBe(100);
    expect(progress.percentToNextLevel).toBe(0);
  });
});

describe('getLevelProgress', () => {
  it('should return complete progress info', () => {
    const progress = getLevelProgress(150);
    expect(progress.currentLevel).toBe(2);
    expect(progress.currentTitle).toBe('Novice Collector');
    expect(progress.totalXP).toBe(150);
    expect(progress.isMaxLevel).toBe(false);
    expect(progress.nextLevel).not.toBeNull();
    expect(progress.nextLevel?.level).toBe(3);
  });

  it('should indicate max level correctly', () => {
    const progress = getLevelProgress(15000);
    expect(progress.currentLevel).toBe(15);
    expect(progress.isMaxLevel).toBe(true);
    expect(progress.nextLevel).toBeNull();
  });
});

describe('willLevelUp', () => {
  it('should return true when level up occurs', () => {
    expect(willLevelUp(90, 20)).toBe(true); // 90 + 20 = 110, level 1 -> 2
    expect(willLevelUp(240, 20)).toBe(true); // 240 + 20 = 260, level 2 -> 3
  });

  it('should return false when no level up occurs', () => {
    expect(willLevelUp(50, 10)).toBe(false); // 50 + 10 = 60, still level 1
    expect(willLevelUp(110, 10)).toBe(false); // 110 + 10 = 120, still level 2
  });

  it('should return true for multiple level ups', () => {
    expect(willLevelUp(50, 500)).toBe(true); // 50 + 500 = 550, level 1 -> 4
  });
});

describe('calculateLevelUp', () => {
  it('should return level up result when leveling up', () => {
    const result = calculateLevelUp(90, 20);
    expect(result).not.toBeNull();
    expect(result?.previousLevel).toBe(1);
    expect(result?.newLevel).toBe(2);
    expect(result?.levelsGained).toBe(1);
    expect(result?.totalXP).toBe(110);
  });

  it('should return null when no level up', () => {
    const result = calculateLevelUp(50, 10);
    expect(result).toBeNull();
  });

  it('should handle multiple level ups', () => {
    const result = calculateLevelUp(50, 900);
    expect(result).not.toBeNull();
    expect(result?.previousLevel).toBe(1);
    expect(result?.newLevel).toBe(5);
    expect(result?.levelsGained).toBe(4);
  });
});

// ============================================================================
// XP CALCULATION TESTS
// ============================================================================

describe('getXPReward', () => {
  it('should return correct XP for each action', () => {
    expect(getXPReward('ADD_CARD')).toBe(10);
    expect(getXPReward('ADD_CARD_DUPLICATE')).toBe(2);
    expect(getXPReward('ADD_HOLOFOIL')).toBe(15);
    expect(getXPReward('DAILY_LOGIN')).toBe(5);
    expect(getXPReward('SET_COMPLETION_100')).toBe(500);
  });
});

describe('calculateCardXP', () => {
  it('should return base XP for normal card', () => {
    expect(calculateCardXP('normal', false)).toBe(10);
    expect(calculateCardXP(undefined, false)).toBe(10);
  });

  it('should return duplicate XP for duplicate cards', () => {
    expect(calculateCardXP('normal', true)).toBe(2);
    expect(calculateCardXP('holofoil', true)).toBe(2);
    expect(calculateCardXP(undefined, true)).toBe(2);
  });

  it('should return higher XP for special variants', () => {
    expect(calculateCardXP('holofoil', false)).toBe(15);
    expect(calculateCardXP('reverseHolofoil', false)).toBe(12);
    expect(calculateCardXP('1stEditionHolofoil', false)).toBe(20);
    expect(calculateCardXP('1stEditionNormal', false)).toBe(20);
  });
});

describe('calculateSetCompletionXP', () => {
  it('should return correct XP for completion milestones', () => {
    expect(calculateSetCompletionXP(100)).toBe(500);
    expect(calculateSetCompletionXP(75)).toBe(200);
    expect(calculateSetCompletionXP(50)).toBe(100);
    expect(calculateSetCompletionXP(25)).toBe(50);
  });

  it('should return 0 for below 25%', () => {
    expect(calculateSetCompletionXP(24)).toBe(0);
    expect(calculateSetCompletionXP(10)).toBe(0);
    expect(calculateSetCompletionXP(0)).toBe(0);
  });

  it('should return highest tier for exact boundaries', () => {
    expect(calculateSetCompletionXP(25)).toBe(50);
    expect(calculateSetCompletionXP(50)).toBe(100);
    expect(calculateSetCompletionXP(75)).toBe(200);
  });
});

describe('calculateDailyLoginXP', () => {
  it('should return base XP for first day', () => {
    expect(calculateDailyLoginXP(1)).toBe(5);
  });

  it('should add streak bonus for consecutive days', () => {
    expect(calculateDailyLoginXP(2)).toBe(7); // 5 + (1 * 2)
    expect(calculateDailyLoginXP(7)).toBe(17); // 5 + (6 * 2)
    expect(calculateDailyLoginXP(30)).toBe(63); // 5 + (29 * 2)
  });

  it('should handle zero streak', () => {
    expect(calculateDailyLoginXP(0)).toBe(5);
  });
});

describe('getXPRewardDescription', () => {
  it('should return formatted description', () => {
    const desc = getXPRewardDescription('ADD_CARD');
    expect(desc).toContain('Added a new card');
    expect(desc).toContain('+10 XP');
  });

  it('should use provided amount when given', () => {
    const desc = getXPRewardDescription('DAILY_LOGIN', 17);
    expect(desc).toContain('+17 XP');
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('isValidXP', () => {
  it('should return true for valid XP values', () => {
    expect(isValidXP(0)).toBe(true);
    expect(isValidXP(100)).toBe(true);
    expect(isValidXP(10000)).toBe(true);
  });

  it('should return false for invalid XP values', () => {
    expect(isValidXP(-1)).toBe(false);
    expect(isValidXP(NaN)).toBe(false);
  });
});

describe('isValidLevel', () => {
  it('should return true for valid levels', () => {
    expect(isValidLevel(1)).toBe(true);
    expect(isValidLevel(8)).toBe(true);
    expect(isValidLevel(15)).toBe(true);
  });

  it('should return false for invalid levels', () => {
    expect(isValidLevel(0)).toBe(false);
    expect(isValidLevel(-1)).toBe(false);
    expect(isValidLevel(16)).toBe(false);
    expect(isValidLevel(NaN)).toBe(false);
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('getAllLevelThresholds', () => {
  it('should return all level thresholds', () => {
    const thresholds = getAllLevelThresholds();
    expect(thresholds).toHaveLength(15);
    expect(thresholds[0].level).toBe(1);
    expect(thresholds[14].level).toBe(15);
  });
});

describe('getLevelsEarnedBetween', () => {
  it('should return levels earned between two XP amounts', () => {
    const levels = getLevelsEarnedBetween(50, 300);
    expect(levels).toHaveLength(2); // Level 2 (100) and Level 3 (250)
    expect(levels[0].level).toBe(2);
    expect(levels[1].level).toBe(3);
  });

  it('should return empty array if no levels earned', () => {
    const levels = getLevelsEarnedBetween(50, 90);
    expect(levels).toHaveLength(0);
  });

  it('should return empty array if XP decreased', () => {
    const levels = getLevelsEarnedBetween(300, 50);
    expect(levels).toHaveLength(0);
  });
});

describe('xpNeededForLevel', () => {
  it('should calculate XP needed to reach target level', () => {
    expect(xpNeededForLevel(50, 2)).toBe(50); // Need 100, have 50
    expect(xpNeededForLevel(100, 3)).toBe(150); // Need 250, have 100
  });

  it('should return 0 if already at or past target', () => {
    expect(xpNeededForLevel(150, 2)).toBe(0);
    expect(xpNeededForLevel(500, 3)).toBe(0);
  });
});

describe('formatXP', () => {
  it('should format XP with commas and suffix', () => {
    expect(formatXP(1000)).toBe('1,000 XP');
    expect(formatXP(10000)).toBe('10,000 XP');
    expect(formatXP(100)).toBe('100 XP');
  });
});

describe('formatLevel', () => {
  it('should format level with prefix', () => {
    expect(formatLevel(1)).toBe('Level 1');
    expect(formatLevel(10)).toBe('Level 10');
  });
});

describe('getLevelProgressMessage', () => {
  it('should return max level message', () => {
    const progress = getLevelProgress(15000);
    const message = getLevelProgressMessage(progress);
    expect(message).toContain('highest level');
  });

  it('should return encouraging message for high progress', () => {
    const progress = getLevelProgress(95); // 95% to level 2
    const message = getLevelProgressMessage(progress);
    expect(message).toContain('Almost there');
  });

  it('should return progress message for lower progress', () => {
    const progress = getLevelProgress(10); // 10% progress to level 2 (10/100)
    const message = getLevelProgressMessage(progress);
    expect(message).toContain('XP to reach');
  });
});

describe('summarizeXPGains', () => {
  it('should summarize XP gains by action', () => {
    const gains: XPGain[] = [
      { action: 'ADD_CARD', amount: 10, description: 'test' },
      { action: 'ADD_CARD', amount: 10, description: 'test' },
      { action: 'ADD_HOLOFOIL', amount: 15, description: 'test' },
    ];

    const summary = summarizeXPGains(gains);
    expect(summary.totalXP).toBe(35);
    expect(summary.byAction['ADD_CARD'].count).toBe(2);
    expect(summary.byAction['ADD_CARD'].totalXP).toBe(20);
    expect(summary.byAction['ADD_HOLOFOIL'].count).toBe(1);
    expect(summary.byAction['ADD_HOLOFOIL'].totalXP).toBe(15);
  });

  it('should handle empty array', () => {
    const summary = summarizeXPGains([]);
    expect(summary.totalXP).toBe(0);
    expect(Object.keys(summary.byAction)).toHaveLength(0);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Level System Integration', () => {
  describe('New User Journey', () => {
    it('should track progress from new user to level 5', () => {
      let totalXP = 0;
      let currentLevel = calculateLevelFromXP(totalXP);
      expect(currentLevel).toBe(1);

      // User adds 10 unique cards (10 XP each)
      for (let i = 0; i < 10; i++) {
        totalXP += calculateCardXP('normal', false);
      }
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(100);
      expect(currentLevel).toBe(2);

      // User adds 5 holofoil cards (15 XP each)
      for (let i = 0; i < 5; i++) {
        totalXP += calculateCardXP('holofoil', false);
      }
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(175);
      expect(currentLevel).toBe(2);

      // User completes 25% of a set
      totalXP += calculateSetCompletionXP(25);
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(225);
      expect(currentLevel).toBe(2);

      // User completes 50% of a set
      totalXP += calculateSetCompletionXP(50);
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(325);
      expect(currentLevel).toBe(3);

      // User has 7-day streak daily logins
      for (let i = 1; i <= 7; i++) {
        totalXP += calculateDailyLoginXP(i);
      }
      // Day 1: 5, Day 2: 7, Day 3: 9, Day 4: 11, Day 5: 13, Day 6: 15, Day 7: 17 = 77 XP
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(402);
      expect(currentLevel).toBe(3);

      // User earns milestone achievement
      totalXP += XP_REWARDS.ACHIEVEMENT_MILESTONE;
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(452);
      expect(currentLevel).toBe(3);

      // User completes 100% of a set (major XP boost)
      totalXP += calculateSetCompletionXP(100);
      currentLevel = calculateLevelFromXP(totalXP);
      expect(totalXP).toBe(952);
      // Level 5 requires 850 XP, Level 6 requires 1300 XP
      expect(currentLevel).toBe(5);
    });
  });

  describe('Max Level Achievement', () => {
    it('should correctly handle reaching and staying at max level', () => {
      const totalXP = 11200; // Exactly max level
      const progress = getLevelProgress(totalXP);

      expect(progress.currentLevel).toBe(15);
      expect(progress.isMaxLevel).toBe(true);
      expect(progress.nextLevel).toBeNull();
      expect(progress.percentToNextLevel).toBe(100);

      // Should not level up beyond max
      const result = calculateLevelUp(totalXP, 1000);
      expect(result).toBeNull();
    });
  });

  describe('Multiple Level Ups', () => {
    it('should correctly handle skipping levels', () => {
      const startXP = 50;
      const xpGain = 1000; // 50 + 1000 = 1050, Level 5 (850) but not Level 6 (1300)

      const result = calculateLevelUp(startXP, xpGain);
      expect(result).not.toBeNull();
      expect(result?.previousLevel).toBe(1);
      expect(result?.newLevel).toBe(5); // 1050 XP = Level 5
      expect(result?.levelsGained).toBe(4);

      const levelsEarned = getLevelsEarnedBetween(startXP, startXP + xpGain);
      expect(levelsEarned).toHaveLength(4);
      expect(levelsEarned.map((l) => l.level)).toEqual([2, 3, 4, 5]);
    });
  });
});
