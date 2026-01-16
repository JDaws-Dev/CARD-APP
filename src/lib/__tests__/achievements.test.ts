import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  AchievementCategory,
  EarnedAchievement,
  // Constants
  MILESTONE_THRESHOLDS,
  SET_COMPLETION_THRESHOLDS,
  STREAK_THRESHOLDS,
  TYPE_SPECIALIST_THRESHOLD,
  TYPE_TO_BADGE_KEY,
  POKEMON_FAN_THRESHOLDS,
  // Milestone functions
  checkMilestoneAchievements,
  getHighestMilestone,
  getNextMilestone,
  // Set completion functions
  calculateSetCompletion,
  checkSetCompletionAchievements,
  createSetBadgeKey,
  parseSetBadgeKey,
  // Type specialist functions
  checkTypeSpecialistAchievements,
  getTypeSpecialistKey,
  getTypesWithBadges,
  // Streak functions
  checkStreakAchievements,
  getHighestStreakBadge,
  // Pokemon fan functions
  checkPokemonFanAchievements,
  // Display utilities
  formatEarnedDate,
  formatEarnedDateRelative,
  sortAchievementsByDate,
  groupAchievementsByCategory,
  countAchievementsByCategory,
  getTotalBadgesForCategory,
  // Set completion badge utilities
  getSetCompletionBadgesToAward,
  getCurrentSetCompletionTier,
  getNextSetCompletionTier,
  cardsNeededForPercentage,
  getSetCompletionSummary,
  isSetComplete,
  getAllEarnedBadgeKeysForCompletion,
} from '../achievements';

describe('Achievement Constants', () => {
  describe('MILESTONE_THRESHOLDS', () => {
    it('should have 7 milestone levels', () => {
      expect(MILESTONE_THRESHOLDS).toHaveLength(7);
    });

    it('should be sorted by threshold ascending', () => {
      for (let i = 1; i < MILESTONE_THRESHOLDS.length; i++) {
        expect(MILESTONE_THRESHOLDS[i].threshold).toBeGreaterThan(
          MILESTONE_THRESHOLDS[i - 1].threshold
        );
      }
    });

    it('should have expected thresholds', () => {
      expect(MILESTONE_THRESHOLDS.map((m) => m.threshold)).toEqual([
        1, 10, 50, 100, 250, 500, 1000,
      ]);
    });

    it('should have unique keys', () => {
      const keys = MILESTONE_THRESHOLDS.map((m) => m.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe('SET_COMPLETION_THRESHOLDS', () => {
    it('should have 4 completion levels', () => {
      expect(SET_COMPLETION_THRESHOLDS).toHaveLength(4);
    });

    it('should cover 25%, 50%, 75%, and 100%', () => {
      expect(SET_COMPLETION_THRESHOLDS.map((s) => s.threshold)).toEqual([
        25, 50, 75, 100,
      ]);
    });
  });

  describe('STREAK_THRESHOLDS', () => {
    it('should have 4 streak levels', () => {
      expect(STREAK_THRESHOLDS).toHaveLength(4);
    });

    it('should have expected day thresholds', () => {
      expect(STREAK_THRESHOLDS.map((s) => s.threshold)).toEqual([3, 7, 14, 30]);
    });
  });

  describe('TYPE_TO_BADGE_KEY', () => {
    it('should have 11 Pokemon types', () => {
      expect(Object.keys(TYPE_TO_BADGE_KEY)).toHaveLength(11);
    });

    it('should include all major Pokemon types', () => {
      const types = Object.keys(TYPE_TO_BADGE_KEY);
      expect(types).toContain('Fire');
      expect(types).toContain('Water');
      expect(types).toContain('Grass');
      expect(types).toContain('Lightning');
      expect(types).toContain('Psychic');
    });
  });
});

describe('Milestone Achievements', () => {
  describe('checkMilestoneAchievements', () => {
    it('should return no badges for 0 cards', () => {
      const result = checkMilestoneAchievements(0);
      expect(result.earnedBadges).toEqual([]);
      expect(result.nextMilestone?.key).toBe('first_catch');
      expect(result.nextMilestone?.threshold).toBe(1);
    });

    it('should award first_catch for 1 card', () => {
      const result = checkMilestoneAchievements(1);
      expect(result.earnedBadges).toContain('first_catch');
      expect(result.earnedBadges).toHaveLength(1);
    });

    it('should award multiple badges at once', () => {
      const result = checkMilestoneAchievements(50);
      expect(result.earnedBadges).toContain('first_catch');
      expect(result.earnedBadges).toContain('starter_collector');
      expect(result.earnedBadges).toContain('rising_trainer');
      expect(result.earnedBadges).toHaveLength(3);
    });

    it('should award all badges at 1000+ cards', () => {
      const result = checkMilestoneAchievements(1000);
      expect(result.earnedBadges).toHaveLength(7);
      expect(result.nextMilestone).toBeNull();
    });

    it('should exclude already earned badges', () => {
      const result = checkMilestoneAchievements(50, ['first_catch', 'starter_collector']);
      expect(result.earnedBadges).toEqual(['rising_trainer']);
    });

    it('should return empty array if all eligible badges are already earned', () => {
      const result = checkMilestoneAchievements(5, ['first_catch']);
      expect(result.earnedBadges).toEqual([]);
    });

    it('should calculate correct progress', () => {
      const result = checkMilestoneAchievements(75);
      expect(result.progress.current).toBe(75);
      expect(result.progress.nextTarget).toBe(100);
      expect(result.progress.percentToNext).toBe(75);
    });

    it('should show 100% progress when all milestones achieved', () => {
      const result = checkMilestoneAchievements(1500);
      expect(result.progress.percentToNext).toBe(100);
      expect(result.progress.nextTarget).toBeNull();
    });

    it('should calculate remaining cards correctly', () => {
      const result = checkMilestoneAchievements(45);
      expect(result.nextMilestone?.remaining).toBe(5); // 50 - 45 = 5
    });
  });

  describe('getHighestMilestone', () => {
    it('should return null for 0 cards', () => {
      expect(getHighestMilestone(0)).toBeNull();
    });

    it('should return first_catch for 1-9 cards', () => {
      expect(getHighestMilestone(1)).toBe('first_catch');
      expect(getHighestMilestone(9)).toBe('first_catch');
    });

    it('should return starter_collector for 10-49 cards', () => {
      expect(getHighestMilestone(10)).toBe('starter_collector');
      expect(getHighestMilestone(49)).toBe('starter_collector');
    });

    it('should return legendary_collector for 1000+ cards', () => {
      expect(getHighestMilestone(1000)).toBe('legendary_collector');
      expect(getHighestMilestone(5000)).toBe('legendary_collector');
    });
  });

  describe('getNextMilestone', () => {
    it('should return first_catch for 0 cards', () => {
      const result = getNextMilestone(0);
      expect(result?.key).toBe('first_catch');
      expect(result?.remaining).toBe(1);
    });

    it('should return null when all milestones achieved', () => {
      expect(getNextMilestone(1000)).toBeNull();
      expect(getNextMilestone(5000)).toBeNull();
    });

    it('should calculate remaining correctly', () => {
      const result = getNextMilestone(95);
      expect(result?.key).toBe('pokemon_trainer');
      expect(result?.remaining).toBe(5);
    });
  });
});

describe('Set Completion Achievements', () => {
  describe('calculateSetCompletion', () => {
    it('should return 0 for empty set', () => {
      expect(calculateSetCompletion(0, 100)).toBe(0);
    });

    it('should return 0 for invalid total', () => {
      expect(calculateSetCompletion(5, 0)).toBe(0);
      expect(calculateSetCompletion(5, -1)).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      expect(calculateSetCompletion(25, 100)).toBe(25);
      expect(calculateSetCompletion(50, 100)).toBe(50);
      expect(calculateSetCompletion(75, 200)).toBe(38); // 37.5 rounds to 38
    });

    it('should return 100 for complete set', () => {
      expect(calculateSetCompletion(100, 100)).toBe(100);
      expect(calculateSetCompletion(200, 200)).toBe(100);
    });

    it('should handle over-collection (> 100%)', () => {
      // Theoretically shouldn't happen but should handle gracefully
      expect(calculateSetCompletion(150, 100)).toBe(150);
    });
  });

  describe('checkSetCompletionAchievements', () => {
    it('should return no badges for 0 cards', () => {
      const result = checkSetCompletionAchievements(0, 100);
      expect(result.earnedBadges).toEqual([]);
      expect(result.completionPercentage).toBe(0);
    });

    it('should award set_explorer at 25%', () => {
      const result = checkSetCompletionAchievements(25, 100);
      expect(result.earnedBadges).toContain('set_explorer');
      expect(result.earnedBadges).toHaveLength(1);
    });

    it('should award multiple badges at once', () => {
      const result = checkSetCompletionAchievements(75, 100);
      expect(result.earnedBadges).toContain('set_explorer');
      expect(result.earnedBadges).toContain('set_adventurer');
      expect(result.earnedBadges).toContain('set_master');
      expect(result.earnedBadges).toHaveLength(3);
    });

    it('should award all badges at 100%', () => {
      const result = checkSetCompletionAchievements(100, 100);
      expect(result.earnedBadges).toHaveLength(4);
      expect(result.earnedBadges).toContain('set_champion');
    });

    it('should exclude already earned badges', () => {
      const result = checkSetCompletionAchievements(50, 100, ['set_explorer']);
      expect(result.earnedBadges).toEqual(['set_adventurer']);
    });

    it('should calculate next badge correctly', () => {
      const result = checkSetCompletionAchievements(20, 100);
      expect(result.nextBadge?.key).toBe('set_explorer');
      expect(result.nextBadge?.cardsNeeded).toBe(5);
    });

    it('should return null nextBadge when complete', () => {
      const result = checkSetCompletionAchievements(100, 100);
      expect(result.nextBadge).toBeNull();
    });

    it('should handle sets with different sizes', () => {
      // 198-card set (like many modern sets)
      const result = checkSetCompletionAchievements(50, 198);
      expect(result.completionPercentage).toBe(25); // 25.25% rounds to 25
      expect(result.earnedBadges).toContain('set_explorer');
    });
  });

  describe('createSetBadgeKey', () => {
    it('should combine setId and badgeKey', () => {
      expect(createSetBadgeKey('sv1', 'set_explorer')).toBe('sv1_set_explorer');
      expect(createSetBadgeKey('swsh12', 'set_champion')).toBe('swsh12_set_champion');
    });
  });

  describe('parseSetBadgeKey', () => {
    it('should parse valid set badge keys', () => {
      const result = parseSetBadgeKey('sv1_set_explorer');
      expect(result?.setId).toBe('sv1');
      expect(result?.badgeKey).toBe('set_explorer');
    });

    it('should handle set IDs with numbers', () => {
      const result = parseSetBadgeKey('swsh12_set_champion');
      expect(result?.setId).toBe('swsh12');
      expect(result?.badgeKey).toBe('set_champion');
    });

    it('should return null for invalid keys', () => {
      expect(parseSetBadgeKey('invalid')).toBeNull();
      expect(parseSetBadgeKey('not_a_valid_badge')).toBeNull();
    });
  });
});

describe('Type Specialist Achievements', () => {
  describe('checkTypeSpecialistAchievements', () => {
    it('should return no badges for empty counts', () => {
      const result = checkTypeSpecialistAchievements({});
      expect(result.earnedBadges).toEqual([]);
      expect(result.nearbyBadges).toEqual([]);
    });

    it('should award badge at threshold (10)', () => {
      const result = checkTypeSpecialistAchievements({ Fire: 10 });
      expect(result.earnedBadges).toContain('fire_trainer');
    });

    it('should award badge above threshold', () => {
      const result = checkTypeSpecialistAchievements({ Water: 15 });
      expect(result.earnedBadges).toContain('water_trainer');
    });

    it('should not award badge below threshold', () => {
      const result = checkTypeSpecialistAchievements({ Fire: 9 });
      expect(result.earnedBadges).toEqual([]);
    });

    it('should track nearby badges', () => {
      const result = checkTypeSpecialistAchievements({ Fire: 7, Water: 3 });
      expect(result.nearbyBadges).toHaveLength(2);
      expect(result.nearbyBadges[0].type).toBe('Fire'); // Closest first
      expect(result.nearbyBadges[0].remaining).toBe(3);
    });

    it('should award multiple type badges', () => {
      const result = checkTypeSpecialistAchievements({
        Fire: 10,
        Water: 15,
        Grass: 20,
      });
      expect(result.earnedBadges).toHaveLength(3);
    });

    it('should exclude already earned badges', () => {
      const result = checkTypeSpecialistAchievements(
        { Fire: 10, Water: 10 },
        ['fire_trainer']
      );
      expect(result.earnedBadges).toEqual(['water_trainer']);
    });

    it('should sort nearby badges by remaining', () => {
      const result = checkTypeSpecialistAchievements({
        Fire: 8,
        Water: 5,
        Grass: 9,
      });
      // Sorted: Grass (1 remaining), Fire (2 remaining), Water (5 remaining)
      expect(result.nearbyBadges[0].type).toBe('Grass');
      expect(result.nearbyBadges[1].type).toBe('Fire');
      expect(result.nearbyBadges[2].type).toBe('Water');
    });
  });

  describe('getTypeSpecialistKey', () => {
    it('should return correct key for Fire', () => {
      expect(getTypeSpecialistKey('Fire')).toBe('fire_trainer');
    });

    it('should return correct key for Lightning', () => {
      expect(getTypeSpecialistKey('Lightning')).toBe('electric_trainer');
    });

    it('should return undefined for invalid type', () => {
      expect(getTypeSpecialistKey('Invalid')).toBeUndefined();
      expect(getTypeSpecialistKey('')).toBeUndefined();
    });
  });

  describe('getTypesWithBadges', () => {
    it('should return all badge-eligible types', () => {
      const types = getTypesWithBadges();
      expect(types).toHaveLength(11);
      expect(types).toContain('Fire');
      expect(types).toContain('Lightning');
    });
  });
});

describe('Streak Achievements', () => {
  describe('checkStreakAchievements', () => {
    it('should return no badges for 0 streak', () => {
      const result = checkStreakAchievements(0);
      expect(result.earnedBadges).toEqual([]);
      expect(result.nextBadge?.key).toBe('streak_3');
    });

    it('should return no badges for streak < 3', () => {
      const result = checkStreakAchievements(2);
      expect(result.earnedBadges).toEqual([]);
    });

    it('should award streak_3 at 3 days', () => {
      const result = checkStreakAchievements(3);
      expect(result.earnedBadges).toContain('streak_3');
      expect(result.earnedBadges).toHaveLength(1);
    });

    it('should award multiple badges at once', () => {
      const result = checkStreakAchievements(14);
      expect(result.earnedBadges).toContain('streak_3');
      expect(result.earnedBadges).toContain('streak_7');
      expect(result.earnedBadges).toContain('streak_14');
      expect(result.earnedBadges).toHaveLength(3);
    });

    it('should award all badges at 30+ days', () => {
      const result = checkStreakAchievements(30);
      expect(result.earnedBadges).toHaveLength(4);
    });

    it('should exclude already earned badges', () => {
      const result = checkStreakAchievements(7, ['streak_3']);
      expect(result.earnedBadges).toEqual(['streak_7']);
    });

    it('should calculate next badge correctly', () => {
      const result = checkStreakAchievements(5);
      expect(result.nextBadge?.key).toBe('streak_7');
      expect(result.nextBadge?.daysNeeded).toBe(2);
    });

    it('should return null nextBadge at max streak', () => {
      const result = checkStreakAchievements(30);
      expect(result.nextBadge).toBeNull();
    });
  });

  describe('getHighestStreakBadge', () => {
    it('should return null for 0 streak', () => {
      expect(getHighestStreakBadge(0)).toBeNull();
    });

    it('should return null for streak < 3', () => {
      expect(getHighestStreakBadge(2)).toBeNull();
    });

    it('should return streak_3 for 3-6 days', () => {
      expect(getHighestStreakBadge(3)).toBe('streak_3');
      expect(getHighestStreakBadge(6)).toBe('streak_3');
    });

    it('should return streak_30 for 30+ days', () => {
      expect(getHighestStreakBadge(30)).toBe('streak_30');
      expect(getHighestStreakBadge(100)).toBe('streak_30');
    });
  });
});

describe('Pokemon Fan Achievements', () => {
  describe('checkPokemonFanAchievements', () => {
    it('should return no badges for empty counts', () => {
      const result = checkPokemonFanAchievements({});
      expect(result.earnedBadges).toEqual([]);
    });

    it('should award pikachu_fan at 5 Pikachu cards', () => {
      const result = checkPokemonFanAchievements({ Pikachu: 5 });
      expect(result.earnedBadges).toContain('pikachu_fan');
    });

    it('should award charizard_fan at 3 Charizard cards', () => {
      const result = checkPokemonFanAchievements({ Charizard: 3 });
      expect(result.earnedBadges).toContain('charizard_fan');
    });

    it('should track progress for each Pokemon', () => {
      const result = checkPokemonFanAchievements({ Pikachu: 3, Charizard: 1 });
      expect(result.progress.Pikachu.count).toBe(3);
      expect(result.progress.Pikachu.threshold).toBe(5);
      expect(result.progress.Pikachu.earned).toBe(false);
      expect(result.progress.Charizard.count).toBe(1);
      expect(result.progress.Charizard.earned).toBe(false);
    });

    it('should exclude already earned badges', () => {
      const result = checkPokemonFanAchievements(
        { Pikachu: 5, Charizard: 3 },
        ['pikachu_fan']
      );
      expect(result.earnedBadges).toEqual(['charizard_fan']);
    });
  });
});

describe('Display Utilities', () => {
  describe('formatEarnedDate', () => {
    it('should format date correctly', () => {
      // Use a specific timestamp to avoid timezone issues
      // January 15, 2024 12:00:00 UTC
      const timestamp = new Date('2024-01-15T12:00:00Z').getTime();
      const result = formatEarnedDate(timestamp);
      // Should contain the year and month abbreviation
      expect(result).toMatch(/Jan.*2024/);
    });
  });

  describe('formatEarnedDateRelative', () => {
    it('should return "Just now" for recent timestamps', () => {
      const result = formatEarnedDateRelative(Date.now() - 30 * 1000); // 30 seconds ago
      expect(result).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const result = formatEarnedDateRelative(Date.now() - 5 * 60 * 1000);
      expect(result).toBe('5 minutes ago');
    });

    it('should return "1 minute ago" for singular', () => {
      const result = formatEarnedDateRelative(Date.now() - 90 * 1000); // 1.5 minutes
      expect(result).toBe('1 minute ago');
    });

    it('should return hours ago', () => {
      const result = formatEarnedDateRelative(Date.now() - 3 * 60 * 60 * 1000);
      expect(result).toBe('3 hours ago');
    });

    it('should return days ago', () => {
      const result = formatEarnedDateRelative(Date.now() - 5 * 24 * 60 * 60 * 1000);
      expect(result).toBe('5 days ago');
    });

    it('should return formatted date for old timestamps', () => {
      const oldDate = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days ago
      const result = formatEarnedDateRelative(oldDate);
      expect(result).toMatch(/\w+ \d+, \d+/); // "Jan 15, 2024" format
    });
  });

  describe('sortAchievementsByDate', () => {
    it('should sort by earnedAt descending (newest first)', () => {
      const achievements: EarnedAchievement[] = [
        { achievementKey: 'old', achievementType: 'streak', earnedAt: 1000 },
        { achievementKey: 'new', achievementType: 'streak', earnedAt: 3000 },
        { achievementKey: 'mid', achievementType: 'streak', earnedAt: 2000 },
      ];
      const sorted = sortAchievementsByDate(achievements);
      expect(sorted[0].achievementKey).toBe('new');
      expect(sorted[1].achievementKey).toBe('mid');
      expect(sorted[2].achievementKey).toBe('old');
    });

    it('should not mutate original array', () => {
      const achievements: EarnedAchievement[] = [
        { achievementKey: 'a', achievementType: 'streak', earnedAt: 1000 },
        { achievementKey: 'b', achievementType: 'streak', earnedAt: 2000 },
      ];
      sortAchievementsByDate(achievements);
      expect(achievements[0].achievementKey).toBe('a');
    });
  });

  describe('groupAchievementsByCategory', () => {
    it('should group achievements correctly', () => {
      const achievements: EarnedAchievement[] = [
        { achievementKey: 'first_catch', achievementType: 'collector_milestone', earnedAt: 1000 },
        { achievementKey: 'streak_3', achievementType: 'streak', earnedAt: 2000 },
        { achievementKey: 'fire_trainer', achievementType: 'type_specialist', earnedAt: 3000 },
        { achievementKey: 'starter_collector', achievementType: 'collector_milestone', earnedAt: 4000 },
      ];
      const grouped = groupAchievementsByCategory(achievements);
      expect(grouped.collector_milestone).toHaveLength(2);
      expect(grouped.streak).toHaveLength(1);
      expect(grouped.type_specialist).toHaveLength(1);
      expect(grouped.set_completion).toHaveLength(0);
      expect(grouped.pokemon_fan).toHaveLength(0);
    });

    it('should return empty arrays for categories with no achievements', () => {
      const grouped = groupAchievementsByCategory([]);
      expect(grouped.collector_milestone).toEqual([]);
      expect(grouped.streak).toEqual([]);
      expect(grouped.type_specialist).toEqual([]);
      expect(grouped.set_completion).toEqual([]);
      expect(grouped.pokemon_fan).toEqual([]);
    });
  });

  describe('countAchievementsByCategory', () => {
    it('should count achievements correctly', () => {
      const achievements: EarnedAchievement[] = [
        { achievementKey: 'first_catch', achievementType: 'collector_milestone', earnedAt: 1000 },
        { achievementKey: 'streak_3', achievementType: 'streak', earnedAt: 2000 },
        { achievementKey: 'fire_trainer', achievementType: 'type_specialist', earnedAt: 3000 },
        { achievementKey: 'starter_collector', achievementType: 'collector_milestone', earnedAt: 4000 },
      ];
      const counts = countAchievementsByCategory(achievements);
      expect(counts.collector_milestone).toBe(2);
      expect(counts.streak).toBe(1);
      expect(counts.type_specialist).toBe(1);
      expect(counts.set_completion).toBe(0);
      expect(counts.pokemon_fan).toBe(0);
    });
  });

  describe('getTotalBadgesForCategory', () => {
    it('should return correct count for collector_milestone', () => {
      expect(getTotalBadgesForCategory('collector_milestone')).toBe(7);
    });

    it('should return correct count for streak', () => {
      expect(getTotalBadgesForCategory('streak')).toBe(4);
    });

    it('should return correct count for type_specialist', () => {
      expect(getTotalBadgesForCategory('type_specialist')).toBe(11);
    });

    it('should return correct count for set_completion', () => {
      // Per-set, so returns the number of badge levels
      expect(getTotalBadgesForCategory('set_completion')).toBe(4);
    });

    it('should return correct count for pokemon_fan', () => {
      expect(getTotalBadgesForCategory('pokemon_fan')).toBe(4);
    });
  });
});

describe('Integration Scenarios', () => {
  describe('New User Journey', () => {
    it('should award first_catch on first card', () => {
      const result = checkMilestoneAchievements(1);
      expect(result.earnedBadges).toContain('first_catch');
      expect(result.nextMilestone?.key).toBe('starter_collector');
    });

    it('should track progress toward starter_collector', () => {
      const result = checkMilestoneAchievements(5);
      expect(result.progress.current).toBe(5);
      expect(result.progress.nextTarget).toBe(10);
      expect(result.progress.percentToNext).toBe(50);
    });
  });

  describe('Set Completion Journey', () => {
    it('should track progress through a full set', () => {
      const setSize = 200;

      // 20% - No badges yet
      let result = checkSetCompletionAchievements(40, setSize);
      expect(result.earnedBadges).toHaveLength(0);
      expect(result.nextBadge?.key).toBe('set_explorer');

      // 25% - First badge
      result = checkSetCompletionAchievements(50, setSize);
      expect(result.earnedBadges).toContain('set_explorer');

      // 50% - Second badge
      result = checkSetCompletionAchievements(100, setSize);
      expect(result.earnedBadges).toContain('set_adventurer');

      // 100% - All badges
      result = checkSetCompletionAchievements(200, setSize);
      expect(result.earnedBadges).toHaveLength(4);
    });
  });

  describe('Streak Building', () => {
    it('should encourage daily engagement', () => {
      // Day 1-2: No badges
      let result = checkStreakAchievements(2);
      expect(result.earnedBadges).toHaveLength(0);
      expect(result.nextBadge?.daysNeeded).toBe(1);

      // Day 3: First streak badge
      result = checkStreakAchievements(3);
      expect(result.earnedBadges).toContain('streak_3');

      // Day 7: Week warrior
      result = checkStreakAchievements(7, ['streak_3']);
      expect(result.earnedBadges).toEqual(['streak_7']);
    });
  });

  describe('Type Specialist Progress', () => {
    it('should track multiple type progressions', () => {
      const typeCounts = {
        Fire: 8,
        Water: 12, // Already earned
        Grass: 5,
        Lightning: 3,
      };

      const result = checkTypeSpecialistAchievements(typeCounts, ['water_trainer']);

      // Fire should be a nearby badge
      expect(result.nearbyBadges.find((b) => b.type === 'Fire')).toBeDefined();
      expect(result.nearbyBadges.find((b) => b.type === 'Fire')?.remaining).toBe(2);

      // Water should not be in earned (already earned)
      expect(result.earnedBadges).not.toContain('water_trainer');
    });
  });
});

describe('Set Completion Badge Utilities', () => {
  describe('getSetCompletionBadgesToAward', () => {
    it('should return no badges for 0 cards owned', () => {
      const result = getSetCompletionBadgesToAward('sv1', 0, 100);
      expect(result.badgesToAward).toEqual([]);
      expect(result.allBadges.every((b) => !b.earned)).toBe(true);
    });

    it('should return set_explorer badge at 25%', () => {
      const result = getSetCompletionBadgesToAward('sv1', 25, 100);
      expect(result.badgesToAward).toContain('sv1_set_explorer');
      expect(result.badgesToAward).toHaveLength(1);
    });

    it('should return multiple badges when appropriate', () => {
      const result = getSetCompletionBadgesToAward('sv1', 50, 100);
      expect(result.badgesToAward).toContain('sv1_set_explorer');
      expect(result.badgesToAward).toContain('sv1_set_adventurer');
      expect(result.badgesToAward).toHaveLength(2);
    });

    it('should return all badges at 100%', () => {
      const result = getSetCompletionBadgesToAward('sv1', 100, 100);
      expect(result.badgesToAward).toHaveLength(4);
      expect(result.badgesToAward).toContain('sv1_set_explorer');
      expect(result.badgesToAward).toContain('sv1_set_adventurer');
      expect(result.badgesToAward).toContain('sv1_set_master');
      expect(result.badgesToAward).toContain('sv1_set_champion');
    });

    it('should exclude already earned badges', () => {
      const result = getSetCompletionBadgesToAward('sv1', 100, 100, [
        'sv1_set_explorer',
        'sv1_set_adventurer',
      ]);
      expect(result.badgesToAward).toHaveLength(2);
      expect(result.badgesToAward).not.toContain('sv1_set_explorer');
      expect(result.badgesToAward).not.toContain('sv1_set_adventurer');
      expect(result.badgesToAward).toContain('sv1_set_master');
      expect(result.badgesToAward).toContain('sv1_set_champion');
    });

    it('should calculate cards needed for each badge', () => {
      const result = getSetCompletionBadgesToAward('sv1', 10, 100);
      const explorerBadge = result.allBadges.find((b) => b.key === 'set_explorer');
      expect(explorerBadge?.cardsNeeded).toBe(15); // Need 25, have 10
    });

    it('should handle different set IDs', () => {
      const result1 = getSetCompletionBadgesToAward('sv1', 50, 100);
      const result2 = getSetCompletionBadgesToAward('base1', 50, 100);
      expect(result1.badgesToAward[0]).toBe('sv1_set_explorer');
      expect(result2.badgesToAward[0]).toBe('base1_set_explorer');
    });

    it('should handle sets with non-round numbers', () => {
      // Set with 198 cards, 50 owned = 25.25%
      const result = getSetCompletionBadgesToAward('sv1', 50, 198);
      expect(result.badgesToAward).toContain('sv1_set_explorer');
    });
  });

  describe('getCurrentSetCompletionTier', () => {
    it('should return null for 0%', () => {
      expect(getCurrentSetCompletionTier(0)).toBeNull();
    });

    it('should return null for completion below 25%', () => {
      expect(getCurrentSetCompletionTier(24)).toBeNull();
    });

    it('should return set_explorer for 25-49%', () => {
      expect(getCurrentSetCompletionTier(25)?.key).toBe('set_explorer');
      expect(getCurrentSetCompletionTier(49)?.key).toBe('set_explorer');
    });

    it('should return set_adventurer for 50-74%', () => {
      expect(getCurrentSetCompletionTier(50)?.key).toBe('set_adventurer');
      expect(getCurrentSetCompletionTier(74)?.key).toBe('set_adventurer');
    });

    it('should return set_master for 75-99%', () => {
      expect(getCurrentSetCompletionTier(75)?.key).toBe('set_master');
      expect(getCurrentSetCompletionTier(99)?.key).toBe('set_master');
    });

    it('should return set_champion for 100%', () => {
      expect(getCurrentSetCompletionTier(100)?.key).toBe('set_champion');
    });

    it('should include threshold in result', () => {
      const result = getCurrentSetCompletionTier(60);
      expect(result?.threshold).toBe(50);
    });
  });

  describe('getNextSetCompletionTier', () => {
    it('should return set_explorer for 0%', () => {
      const result = getNextSetCompletionTier(0);
      expect(result?.key).toBe('set_explorer');
      expect(result?.threshold).toBe(25);
      expect(result?.percentageNeeded).toBe(25);
    });

    it('should return set_adventurer after 25%', () => {
      const result = getNextSetCompletionTier(25);
      expect(result?.key).toBe('set_adventurer');
      expect(result?.percentageNeeded).toBe(25);
    });

    it('should return set_champion after 75%', () => {
      const result = getNextSetCompletionTier(75);
      expect(result?.key).toBe('set_champion');
      expect(result?.percentageNeeded).toBe(25);
    });

    it('should return null at 100%', () => {
      expect(getNextSetCompletionTier(100)).toBeNull();
    });

    it('should calculate correct percentageNeeded', () => {
      const result = getNextSetCompletionTier(40);
      expect(result?.percentageNeeded).toBe(10); // Need 50, have 40
    });
  });

  describe('cardsNeededForPercentage', () => {
    it('should return 0 for empty set', () => {
      expect(cardsNeededForPercentage(25, 0, 0)).toBe(0);
    });

    it('should calculate correctly for 25% of 100', () => {
      expect(cardsNeededForPercentage(25, 0, 100)).toBe(25);
      expect(cardsNeededForPercentage(25, 10, 100)).toBe(15);
      expect(cardsNeededForPercentage(25, 25, 100)).toBe(0);
    });

    it('should return 0 if already at target', () => {
      expect(cardsNeededForPercentage(50, 60, 100)).toBe(0);
    });

    it('should round up for non-integer results', () => {
      // 25% of 37 = 9.25, should need 10
      expect(cardsNeededForPercentage(25, 0, 37)).toBe(10);
    });

    it('should handle 100%', () => {
      expect(cardsNeededForPercentage(100, 50, 100)).toBe(50);
    });
  });

  describe('getSetCompletionSummary', () => {
    it('should return complete summary for empty collection', () => {
      const summary = getSetCompletionSummary('sv1', 0, 100);
      expect(summary.setId).toBe('sv1');
      expect(summary.cardsOwned).toBe(0);
      expect(summary.totalCards).toBe(100);
      expect(summary.completionPercentage).toBe(0);
      expect(summary.currentTier).toBeNull();
      expect(summary.nextTier?.key).toBe('set_explorer');
      expect(summary.earnedBadgeKeys).toHaveLength(0);
    });

    it('should show correct progress at 30%', () => {
      const summary = getSetCompletionSummary('sv1', 30, 100);
      expect(summary.completionPercentage).toBe(30);
      expect(summary.currentTier?.key).toBe('set_explorer');
      expect(summary.nextTier?.key).toBe('set_adventurer');
      expect(summary.nextTier?.cardsNeeded).toBe(20);
    });

    it('should include all earned badges at 100%', () => {
      const summary = getSetCompletionSummary('sv1', 100, 100);
      expect(summary.earnedBadgeKeys).toHaveLength(4);
      expect(summary.nextTier).toBeNull();
    });

    it('should account for previously earned badges', () => {
      const summary = getSetCompletionSummary('sv1', 50, 100, ['sv1_set_explorer']);
      // Still shows all earned badges based on completion
      expect(summary.earnedBadgeKeys).toContain('sv1_set_explorer');
      expect(summary.earnedBadgeKeys).toContain('sv1_set_adventurer');
    });
  });

  describe('isSetComplete', () => {
    it('should return false for empty set', () => {
      expect(isSetComplete(0, 0)).toBe(false);
    });

    it('should return false for partial completion', () => {
      expect(isSetComplete(50, 100)).toBe(false);
      expect(isSetComplete(99, 100)).toBe(false);
    });

    it('should return true at exactly 100%', () => {
      expect(isSetComplete(100, 100)).toBe(true);
    });

    it('should return true when over 100% (duplicates)', () => {
      expect(isSetComplete(150, 100)).toBe(true);
    });
  });

  describe('getAllEarnedBadgeKeysForCompletion', () => {
    it('should return empty array for 0%', () => {
      expect(getAllEarnedBadgeKeysForCompletion('sv1', 0)).toEqual([]);
    });

    it('should return one key at 25%', () => {
      const keys = getAllEarnedBadgeKeysForCompletion('sv1', 25);
      expect(keys).toEqual(['sv1_set_explorer']);
    });

    it('should return two keys at 50%', () => {
      const keys = getAllEarnedBadgeKeysForCompletion('sv1', 50);
      expect(keys).toEqual(['sv1_set_explorer', 'sv1_set_adventurer']);
    });

    it('should return all four keys at 100%', () => {
      const keys = getAllEarnedBadgeKeysForCompletion('sv1', 100);
      expect(keys).toHaveLength(4);
    });

    it('should format keys with correct setId', () => {
      const keys = getAllEarnedBadgeKeysForCompletion('base1', 100);
      expect(keys.every((k) => k.startsWith('base1_'))).toBe(true);
    });
  });

  describe('Set Completion Badge Awarding Journey', () => {
    it('should award badges progressively as collection grows', () => {
      const setId = 'sv1';
      const totalCards = 200;
      let earned: string[] = [];

      // At 40 cards (20%) - no badges yet
      let result = getSetCompletionBadgesToAward(setId, 40, totalCards, earned);
      expect(result.badgesToAward).toHaveLength(0);

      // At 50 cards (25%) - first badge
      result = getSetCompletionBadgesToAward(setId, 50, totalCards, earned);
      expect(result.badgesToAward).toEqual(['sv1_set_explorer']);
      earned = [...earned, ...result.badgesToAward];

      // At 100 cards (50%) - second badge only (first already earned)
      result = getSetCompletionBadgesToAward(setId, 100, totalCards, earned);
      expect(result.badgesToAward).toEqual(['sv1_set_adventurer']);
      earned = [...earned, ...result.badgesToAward];

      // At 150 cards (75%) - third badge only
      result = getSetCompletionBadgesToAward(setId, 150, totalCards, earned);
      expect(result.badgesToAward).toEqual(['sv1_set_master']);
      earned = [...earned, ...result.badgesToAward];

      // At 200 cards (100%) - final badge only
      result = getSetCompletionBadgesToAward(setId, 200, totalCards, earned);
      expect(result.badgesToAward).toEqual(['sv1_set_champion']);
      earned = [...earned, ...result.badgesToAward];

      // No more badges to award
      result = getSetCompletionBadgesToAward(setId, 200, totalCards, earned);
      expect(result.badgesToAward).toHaveLength(0);
    });

    it('should handle collecting multiple sets simultaneously', () => {
      const earnedBadges: string[] = [];

      // Add to set 1
      let result1 = getSetCompletionBadgesToAward('sv1', 50, 100, earnedBadges);
      expect(result1.badgesToAward).toContain('sv1_set_explorer');
      expect(result1.badgesToAward).toContain('sv1_set_adventurer');

      // Add earned badges
      earnedBadges.push(...result1.badgesToAward);

      // Add to set 2
      let result2 = getSetCompletionBadgesToAward('sv2', 25, 100, earnedBadges);
      expect(result2.badgesToAward).toContain('sv2_set_explorer');

      // Set 2 badges should not be blocked by set 1 badges
      expect(result2.badgesToAward).not.toContain('sv1_set_explorer');
    });
  });
});
