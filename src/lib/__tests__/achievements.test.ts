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

// Import new milestone badge utilities
import {
  MILESTONE_BADGE_DEFINITIONS,
  getMilestoneBadgesToAward,
  getMilestoneProgressSummary,
  getMilestoneBadgeDefinition,
  getCurrentMilestoneTitle,
  cardsNeededForMilestone,
  getMilestonePercentProgress,
  hasMilestoneBeenReached,
  getAllEarnedMilestoneKeys,
  countEarnedMilestones,
} from '../achievements';

describe('Milestone Badge Utilities', () => {
  describe('MILESTONE_BADGE_DEFINITIONS', () => {
    it('should have 7 milestone definitions', () => {
      expect(MILESTONE_BADGE_DEFINITIONS).toHaveLength(7);
    });

    it('should have unique keys', () => {
      const keys = MILESTONE_BADGE_DEFINITIONS.map((m) => m.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should be sorted by threshold ascending', () => {
      for (let i = 1; i < MILESTONE_BADGE_DEFINITIONS.length; i++) {
        expect(MILESTONE_BADGE_DEFINITIONS[i].threshold).toBeGreaterThan(
          MILESTONE_BADGE_DEFINITIONS[i - 1].threshold
        );
      }
    });

    it('should have names for all milestones', () => {
      for (const milestone of MILESTONE_BADGE_DEFINITIONS) {
        expect(milestone.name).toBeTruthy();
        expect(typeof milestone.name).toBe('string');
      }
    });

    it('should match MILESTONE_THRESHOLDS keys', () => {
      const defKeys = MILESTONE_BADGE_DEFINITIONS.map((m) => m.key);
      const thresholdKeys = MILESTONE_THRESHOLDS.map((m) => m.key);
      expect(defKeys).toEqual(thresholdKeys);
    });
  });

  describe('getMilestoneBadgesToAward', () => {
    it('should return no badges for 0 cards', () => {
      expect(getMilestoneBadgesToAward(0)).toEqual([]);
    });

    it('should return first_catch for 1 card', () => {
      const badges = getMilestoneBadgesToAward(1);
      expect(badges).toEqual(['first_catch']);
    });

    it('should return multiple badges when crossing thresholds', () => {
      const badges = getMilestoneBadgesToAward(50);
      expect(badges).toContain('first_catch');
      expect(badges).toContain('starter_collector');
      expect(badges).toContain('rising_trainer');
      expect(badges).toHaveLength(3);
    });

    it('should return all badges at 1000+ cards', () => {
      const badges = getMilestoneBadgesToAward(1000);
      expect(badges).toHaveLength(7);
    });

    it('should exclude already earned badges', () => {
      const badges = getMilestoneBadgesToAward(50, ['first_catch', 'starter_collector']);
      expect(badges).toEqual(['rising_trainer']);
    });

    it('should return empty array if all eligible badges earned', () => {
      const badges = getMilestoneBadgesToAward(5, ['first_catch']);
      expect(badges).toEqual([]);
    });

    it('should not include badges above current card count', () => {
      const badges = getMilestoneBadgesToAward(49);
      expect(badges).not.toContain('rising_trainer');
    });
  });

  describe('getMilestoneProgressSummary', () => {
    it('should return correct summary for 0 cards', () => {
      const summary = getMilestoneProgressSummary(0);
      expect(summary.totalUniqueCards).toBe(0);
      expect(summary.currentMilestone).toBeNull();
      expect(summary.nextMilestone?.key).toBe('first_catch');
      expect(summary.totalMilestonesEarned).toBe(0);
      expect(summary.totalMilestonesAvailable).toBe(7);
    });

    it('should return correct summary at milestone boundary', () => {
      const summary = getMilestoneProgressSummary(10);
      expect(summary.currentMilestone?.key).toBe('starter_collector');
      expect(summary.nextMilestone?.key).toBe('rising_trainer');
      expect(summary.nextMilestone?.cardsNeeded).toBe(40);
    });

    it('should calculate progress percentages correctly', () => {
      const summary = getMilestoneProgressSummary(5);
      const firstCatchMilestone = summary.milestones.find((m) => m.key === 'first_catch');
      const starterMilestone = summary.milestones.find((m) => m.key === 'starter_collector');
      expect(firstCatchMilestone?.progress).toBe(100); // 5/1 = capped at 100
      expect(starterMilestone?.progress).toBe(50); // 5/10 = 50%
    });

    it('should show all milestones earned at 1000+ cards', () => {
      const summary = getMilestoneProgressSummary(1500, [
        'first_catch',
        'starter_collector',
        'rising_trainer',
        'pokemon_trainer',
        'elite_collector',
        'pokemon_master',
        'legendary_collector',
      ]);
      expect(summary.totalMilestonesEarned).toBe(7);
      expect(summary.nextMilestone).toBeNull();
    });

    it('should correctly count earned milestones from provided keys', () => {
      const summary = getMilestoneProgressSummary(100, ['first_catch', 'starter_collector']);
      expect(summary.totalMilestonesEarned).toBe(2);
    });

    it('should cap progress at 100%', () => {
      const summary = getMilestoneProgressSummary(1500);
      for (const milestone of summary.milestones) {
        expect(milestone.progress).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getMilestoneBadgeDefinition', () => {
    it('should return definition for valid key', () => {
      const def = getMilestoneBadgeDefinition('first_catch');
      expect(def?.key).toBe('first_catch');
      expect(def?.name).toBe('First Catch');
      expect(def?.threshold).toBe(1);
    });

    it('should return null for invalid key', () => {
      expect(getMilestoneBadgeDefinition('invalid_key')).toBeNull();
    });

    it('should return definition for all milestone keys', () => {
      for (const milestone of MILESTONE_BADGE_DEFINITIONS) {
        const def = getMilestoneBadgeDefinition(milestone.key);
        expect(def).not.toBeNull();
        expect(def?.key).toBe(milestone.key);
      }
    });
  });

  describe('getCurrentMilestoneTitle', () => {
    it('should return "New Collector" for 0 cards', () => {
      expect(getCurrentMilestoneTitle(0)).toBe('New Collector');
    });

    it('should return "First Catch" for 1-9 cards', () => {
      expect(getCurrentMilestoneTitle(1)).toBe('First Catch');
      expect(getCurrentMilestoneTitle(9)).toBe('First Catch');
    });

    it('should return "Starter Collector" for 10-49 cards', () => {
      expect(getCurrentMilestoneTitle(10)).toBe('Starter Collector');
      expect(getCurrentMilestoneTitle(49)).toBe('Starter Collector');
    });

    it('should return "Legendary Collector" for 1000+ cards', () => {
      expect(getCurrentMilestoneTitle(1000)).toBe('Legendary Collector');
      expect(getCurrentMilestoneTitle(5000)).toBe('Legendary Collector');
    });
  });

  describe('cardsNeededForMilestone', () => {
    it('should return correct cards needed for first_catch', () => {
      expect(cardsNeededForMilestone(0, 'first_catch')).toBe(1);
    });

    it('should return 0 if milestone already reached', () => {
      expect(cardsNeededForMilestone(10, 'first_catch')).toBe(0);
      expect(cardsNeededForMilestone(100, 'starter_collector')).toBe(0);
    });

    it('should return correct cards needed for partially complete milestone', () => {
      expect(cardsNeededForMilestone(45, 'rising_trainer')).toBe(5);
      expect(cardsNeededForMilestone(95, 'pokemon_trainer')).toBe(5);
    });

    it('should return 0 for invalid milestone key', () => {
      expect(cardsNeededForMilestone(50, 'invalid_key')).toBe(0);
    });
  });

  describe('getMilestonePercentProgress', () => {
    it('should return 0 for 0 cards', () => {
      expect(getMilestonePercentProgress(0, 'first_catch')).toBe(0);
    });

    it('should return 100 when milestone reached', () => {
      expect(getMilestonePercentProgress(1, 'first_catch')).toBe(100);
      expect(getMilestonePercentProgress(10, 'starter_collector')).toBe(100);
    });

    it('should cap at 100%', () => {
      expect(getMilestonePercentProgress(500, 'first_catch')).toBe(100);
    });

    it('should calculate correct percentage for partial progress', () => {
      expect(getMilestonePercentProgress(5, 'starter_collector')).toBe(50);
      expect(getMilestonePercentProgress(25, 'rising_trainer')).toBe(50);
    });

    it('should return 0 for invalid milestone key', () => {
      expect(getMilestonePercentProgress(50, 'invalid_key')).toBe(0);
    });
  });

  describe('hasMilestoneBeenReached', () => {
    it('should return false for 0 cards', () => {
      expect(hasMilestoneBeenReached(0, 'first_catch')).toBe(false);
    });

    it('should return true at exact threshold', () => {
      expect(hasMilestoneBeenReached(1, 'first_catch')).toBe(true);
      expect(hasMilestoneBeenReached(10, 'starter_collector')).toBe(true);
      expect(hasMilestoneBeenReached(50, 'rising_trainer')).toBe(true);
    });

    it('should return true above threshold', () => {
      expect(hasMilestoneBeenReached(5, 'first_catch')).toBe(true);
      expect(hasMilestoneBeenReached(100, 'starter_collector')).toBe(true);
    });

    it('should return false below threshold', () => {
      expect(hasMilestoneBeenReached(9, 'starter_collector')).toBe(false);
      expect(hasMilestoneBeenReached(49, 'rising_trainer')).toBe(false);
    });

    it('should return false for invalid milestone key', () => {
      expect(hasMilestoneBeenReached(1000, 'invalid_key')).toBe(false);
    });
  });

  describe('getAllEarnedMilestoneKeys', () => {
    it('should return empty array for 0 cards', () => {
      expect(getAllEarnedMilestoneKeys(0)).toEqual([]);
    });

    it('should return only first_catch for 1-9 cards', () => {
      expect(getAllEarnedMilestoneKeys(1)).toEqual(['first_catch']);
      expect(getAllEarnedMilestoneKeys(9)).toEqual(['first_catch']);
    });

    it('should return first two for 10-49 cards', () => {
      const keys = getAllEarnedMilestoneKeys(10);
      expect(keys).toEqual(['first_catch', 'starter_collector']);
    });

    it('should return all keys for 1000+ cards', () => {
      const keys = getAllEarnedMilestoneKeys(1000);
      expect(keys).toHaveLength(7);
      expect(keys).toContain('legendary_collector');
    });
  });

  describe('countEarnedMilestones', () => {
    it('should return 0 for 0 cards', () => {
      expect(countEarnedMilestones(0)).toBe(0);
    });

    it('should return 1 for 1-9 cards', () => {
      expect(countEarnedMilestones(1)).toBe(1);
      expect(countEarnedMilestones(9)).toBe(1);
    });

    it('should return 3 for 50-99 cards', () => {
      expect(countEarnedMilestones(50)).toBe(3);
      expect(countEarnedMilestones(99)).toBe(3);
    });

    it('should return 7 for 1000+ cards', () => {
      expect(countEarnedMilestones(1000)).toBe(7);
      expect(countEarnedMilestones(5000)).toBe(7);
    });
  });

  describe('Milestone Badge Awarding Journey', () => {
    it('should track progressive badge collection', () => {
      let earnedBadges: string[] = [];

      // Start with 0 cards
      let badges = getMilestoneBadgesToAward(0, earnedBadges);
      expect(badges).toHaveLength(0);

      // Add first card
      badges = getMilestoneBadgesToAward(1, earnedBadges);
      expect(badges).toEqual(['first_catch']);
      earnedBadges.push(...badges);

      // Add more cards to reach 10
      badges = getMilestoneBadgesToAward(10, earnedBadges);
      expect(badges).toEqual(['starter_collector']);
      earnedBadges.push(...badges);

      // Jump to 100 cards
      badges = getMilestoneBadgesToAward(100, earnedBadges);
      expect(badges).toContain('rising_trainer');
      expect(badges).toContain('pokemon_trainer');
      expect(badges).not.toContain('first_catch');
      expect(badges).not.toContain('starter_collector');
    });

    it('should show correct progress at each stage', () => {
      // At 45 cards (between starter_collector and rising_trainer)
      let summary = getMilestoneProgressSummary(45);
      expect(summary.currentMilestone?.key).toBe('starter_collector');
      expect(summary.nextMilestone?.key).toBe('rising_trainer');
      expect(summary.nextMilestone?.cardsNeeded).toBe(5);
      expect(summary.nextMilestone?.percentProgress).toBe(90);

      // At 250 cards (exactly at elite_collector)
      summary = getMilestoneProgressSummary(250);
      expect(summary.currentMilestone?.key).toBe('elite_collector');
      expect(summary.nextMilestone?.key).toBe('pokemon_master');
      expect(summary.nextMilestone?.cardsNeeded).toBe(250);
    });
  });
});

// Import new type specialist badge utilities
import {
  TYPE_SPECIALIST_BADGE_DEFINITIONS,
  getTypeSpecialistBadgesToAward,
  getTypeSpecialistProgressSummary,
  getTypeSpecialistBadgeDefinition,
  getTypeSpecialistBadgeForType,
  cardsNeededForTypeSpecialist,
  getTypeSpecialistPercentProgress,
  hasTypeSpecialistBeenEarned,
  getAllEarnedTypeSpecialistKeys,
  countEarnedTypeSpecialistBadges,
  countCardsByType,
  getNearbyTypeSpecialistBadges,
  getDominantType,
  getTypeDistribution,
} from '../achievements';

describe('Type Specialist Badge Utilities', () => {
  describe('TYPE_SPECIALIST_BADGE_DEFINITIONS', () => {
    it('should have 11 type specialist definitions', () => {
      expect(TYPE_SPECIALIST_BADGE_DEFINITIONS).toHaveLength(11);
    });

    it('should have unique keys', () => {
      const keys = TYPE_SPECIALIST_BADGE_DEFINITIONS.map((b) => b.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should have unique types', () => {
      const types = TYPE_SPECIALIST_BADGE_DEFINITIONS.map((b) => b.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it('should have names for all badges', () => {
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        expect(badge.name).toBeTruthy();
        expect(typeof badge.name).toBe('string');
      }
    });

    it('should include all major Pokemon types', () => {
      const types = TYPE_SPECIALIST_BADGE_DEFINITIONS.map((b) => b.type);
      expect(types).toContain('Fire');
      expect(types).toContain('Water');
      expect(types).toContain('Grass');
      expect(types).toContain('Lightning');
      expect(types).toContain('Psychic');
      expect(types).toContain('Fighting');
      expect(types).toContain('Darkness');
      expect(types).toContain('Metal');
      expect(types).toContain('Dragon');
      expect(types).toContain('Fairy');
      expect(types).toContain('Colorless');
    });

    it('should match TYPE_TO_BADGE_KEY mapping', () => {
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        expect(TYPE_TO_BADGE_KEY[badge.type]).toBe(badge.key);
      }
    });
  });

  describe('getTypeSpecialistBadgesToAward', () => {
    it('should return no badges for empty type counts', () => {
      expect(getTypeSpecialistBadgesToAward({})).toEqual([]);
    });

    it('should return no badges when all counts below threshold', () => {
      expect(getTypeSpecialistBadgesToAward({ Fire: 5, Water: 9 })).toEqual([]);
    });

    it('should return fire_trainer at threshold (10)', () => {
      const badges = getTypeSpecialistBadgesToAward({ Fire: 10 });
      expect(badges).toEqual(['fire_trainer']);
    });

    it('should return badge above threshold', () => {
      const badges = getTypeSpecialistBadgesToAward({ Water: 15 });
      expect(badges).toContain('water_trainer');
    });

    it('should return multiple badges when multiple types at threshold', () => {
      const badges = getTypeSpecialistBadgesToAward({
        Fire: 10,
        Water: 15,
        Grass: 20,
      });
      expect(badges).toHaveLength(3);
      expect(badges).toContain('fire_trainer');
      expect(badges).toContain('water_trainer');
      expect(badges).toContain('grass_trainer');
    });

    it('should return all 11 badges when all types at threshold', () => {
      const typeCounts: Record<string, number> = {};
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        typeCounts[badge.type] = 10;
      }
      const badges = getTypeSpecialistBadgesToAward(typeCounts);
      expect(badges).toHaveLength(11);
    });

    it('should exclude already earned badges', () => {
      const badges = getTypeSpecialistBadgesToAward(
        { Fire: 10, Water: 10 },
        ['fire_trainer']
      );
      expect(badges).toEqual(['water_trainer']);
    });

    it('should return empty array if all eligible badges earned', () => {
      const badges = getTypeSpecialistBadgesToAward(
        { Fire: 10 },
        ['fire_trainer']
      );
      expect(badges).toEqual([]);
    });

    it('should not include badges for types not at threshold', () => {
      const badges = getTypeSpecialistBadgesToAward({ Fire: 10, Water: 5 });
      expect(badges).toContain('fire_trainer');
      expect(badges).not.toContain('water_trainer');
    });
  });

  describe('getTypeSpecialistProgressSummary', () => {
    it('should return correct summary for empty type counts', () => {
      const summary = getTypeSpecialistProgressSummary({});
      expect(summary.totalTypeBadgesEarned).toBe(0);
      expect(summary.totalTypeBadgesAvailable).toBe(11);
      expect(summary.nearbyBadges).toHaveLength(0);
      expect(summary.earnedBadges).toHaveLength(0);
    });

    it('should show progress for types with cards', () => {
      const summary = getTypeSpecialistProgressSummary({ Fire: 5, Water: 8 });
      const fireProgress = summary.typeProgress.find((t) => t.type === 'Fire');
      const waterProgress = summary.typeProgress.find((t) => t.type === 'Water');

      expect(fireProgress?.count).toBe(5);
      expect(fireProgress?.progress).toBe(50);
      expect(fireProgress?.remaining).toBe(5);
      expect(fireProgress?.earned).toBe(false);

      expect(waterProgress?.count).toBe(8);
      expect(waterProgress?.progress).toBe(80);
      expect(waterProgress?.remaining).toBe(2);
    });

    it('should mark earned badges correctly', () => {
      const summary = getTypeSpecialistProgressSummary(
        { Fire: 10, Water: 5 },
        ['fire_trainer']
      );
      const fireProgress = summary.typeProgress.find((t) => t.type === 'Fire');
      expect(fireProgress?.earned).toBe(true);
      expect(fireProgress?.remaining).toBe(0);
      expect(summary.totalTypeBadgesEarned).toBe(1);
    });

    it('should sort typeProgress with earned first, then by progress', () => {
      const summary = getTypeSpecialistProgressSummary(
        { Fire: 10, Water: 8, Grass: 3 },
        ['fire_trainer']
      );
      // Fire (earned) should be first, then Water (80%), then Grass (30%)
      expect(summary.typeProgress[0].type).toBe('Fire');
      expect(summary.typeProgress[1].type).toBe('Water');
    });

    it('should identify nearby badges correctly', () => {
      const summary = getTypeSpecialistProgressSummary(
        { Fire: 8, Water: 3 },
        []
      );
      expect(summary.nearbyBadges).toHaveLength(2);
      // Sorted by remaining: Fire (2 remaining), Water (7 remaining)
      expect(summary.nearbyBadges[0].type).toBe('Fire');
      expect(summary.nearbyBadges[0].remaining).toBe(2);
      expect(summary.nearbyBadges[1].type).toBe('Water');
      expect(summary.nearbyBadges[1].remaining).toBe(7);
    });

    it('should not include earned badges in nearbyBadges', () => {
      const summary = getTypeSpecialistProgressSummary(
        { Fire: 10, Water: 5 },
        ['fire_trainer']
      );
      expect(summary.nearbyBadges.find((b) => b.type === 'Fire')).toBeUndefined();
    });

    it('should not include types with 0 cards in nearbyBadges', () => {
      const summary = getTypeSpecialistProgressSummary({ Fire: 5 });
      expect(summary.nearbyBadges).toHaveLength(1);
      expect(summary.nearbyBadges[0].type).toBe('Fire');
    });
  });

  describe('getTypeSpecialistBadgeDefinition', () => {
    it('should return definition for valid key', () => {
      const def = getTypeSpecialistBadgeDefinition('fire_trainer');
      expect(def?.type).toBe('Fire');
      expect(def?.key).toBe('fire_trainer');
      expect(def?.name).toBe('Fire Trainer');
    });

    it('should return null for invalid key', () => {
      expect(getTypeSpecialistBadgeDefinition('invalid_key')).toBeNull();
    });

    it('should return definition for all badge keys', () => {
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        const def = getTypeSpecialistBadgeDefinition(badge.key);
        expect(def).not.toBeNull();
        expect(def?.key).toBe(badge.key);
      }
    });
  });

  describe('getTypeSpecialistBadgeForType', () => {
    it('should return definition for valid type', () => {
      const def = getTypeSpecialistBadgeForType('Fire');
      expect(def?.type).toBe('Fire');
      expect(def?.key).toBe('fire_trainer');
      expect(def?.name).toBe('Fire Trainer');
    });

    it('should return null for invalid type', () => {
      expect(getTypeSpecialistBadgeForType('InvalidType')).toBeNull();
    });

    it('should handle Lightning -> electric_trainer mapping', () => {
      const def = getTypeSpecialistBadgeForType('Lightning');
      expect(def?.key).toBe('electric_trainer');
      expect(def?.name).toBe('Electric Trainer');
    });

    it('should return definition for all Pokemon types', () => {
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        const def = getTypeSpecialistBadgeForType(badge.type);
        expect(def).not.toBeNull();
        expect(def?.type).toBe(badge.type);
      }
    });
  });

  describe('cardsNeededForTypeSpecialist', () => {
    it('should return 10 for 0 cards', () => {
      expect(cardsNeededForTypeSpecialist(0)).toBe(10);
    });

    it('should return correct remaining for partial progress', () => {
      expect(cardsNeededForTypeSpecialist(3)).toBe(7);
      expect(cardsNeededForTypeSpecialist(5)).toBe(5);
      expect(cardsNeededForTypeSpecialist(9)).toBe(1);
    });

    it('should return 0 at threshold', () => {
      expect(cardsNeededForTypeSpecialist(10)).toBe(0);
    });

    it('should return 0 above threshold', () => {
      expect(cardsNeededForTypeSpecialist(15)).toBe(0);
      expect(cardsNeededForTypeSpecialist(100)).toBe(0);
    });
  });

  describe('getTypeSpecialistPercentProgress', () => {
    it('should return 0 for 0 cards', () => {
      expect(getTypeSpecialistPercentProgress(0)).toBe(0);
    });

    it('should return correct percentage for partial progress', () => {
      expect(getTypeSpecialistPercentProgress(1)).toBe(10);
      expect(getTypeSpecialistPercentProgress(5)).toBe(50);
      expect(getTypeSpecialistPercentProgress(8)).toBe(80);
    });

    it('should return 100 at threshold', () => {
      expect(getTypeSpecialistPercentProgress(10)).toBe(100);
    });

    it('should cap at 100% above threshold', () => {
      expect(getTypeSpecialistPercentProgress(15)).toBe(100);
      expect(getTypeSpecialistPercentProgress(100)).toBe(100);
    });
  });

  describe('hasTypeSpecialistBeenEarned', () => {
    it('should return false for 0 cards', () => {
      expect(hasTypeSpecialistBeenEarned(0)).toBe(false);
    });

    it('should return false below threshold', () => {
      expect(hasTypeSpecialistBeenEarned(9)).toBe(false);
    });

    it('should return true at exact threshold', () => {
      expect(hasTypeSpecialistBeenEarned(10)).toBe(true);
    });

    it('should return true above threshold', () => {
      expect(hasTypeSpecialistBeenEarned(15)).toBe(true);
      expect(hasTypeSpecialistBeenEarned(100)).toBe(true);
    });
  });

  describe('getAllEarnedTypeSpecialistKeys', () => {
    it('should return empty array for empty type counts', () => {
      expect(getAllEarnedTypeSpecialistKeys({})).toEqual([]);
    });

    it('should return empty array when all below threshold', () => {
      expect(getAllEarnedTypeSpecialistKeys({ Fire: 5, Water: 9 })).toEqual([]);
    });

    it('should return keys for types at threshold', () => {
      const keys = getAllEarnedTypeSpecialistKeys({ Fire: 10, Water: 5 });
      expect(keys).toEqual(['fire_trainer']);
    });

    it('should return multiple keys when multiple types at threshold', () => {
      const keys = getAllEarnedTypeSpecialistKeys({ Fire: 10, Water: 15, Grass: 20 });
      expect(keys).toHaveLength(3);
      expect(keys).toContain('fire_trainer');
      expect(keys).toContain('water_trainer');
      expect(keys).toContain('grass_trainer');
    });

    it('should return all 11 keys when all types at threshold', () => {
      const typeCounts: Record<string, number> = {};
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        typeCounts[badge.type] = 10;
      }
      const keys = getAllEarnedTypeSpecialistKeys(typeCounts);
      expect(keys).toHaveLength(11);
    });
  });

  describe('countEarnedTypeSpecialistBadges', () => {
    it('should return 0 for empty type counts', () => {
      expect(countEarnedTypeSpecialistBadges({})).toBe(0);
    });

    it('should return 0 when all below threshold', () => {
      expect(countEarnedTypeSpecialistBadges({ Fire: 5, Water: 9 })).toBe(0);
    });

    it('should count types at threshold', () => {
      expect(countEarnedTypeSpecialistBadges({ Fire: 10, Water: 5 })).toBe(1);
    });

    it('should count multiple types at threshold', () => {
      expect(countEarnedTypeSpecialistBadges({ Fire: 10, Water: 15, Grass: 20 })).toBe(3);
    });

    it('should return 11 when all types at threshold', () => {
      const typeCounts: Record<string, number> = {};
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        typeCounts[badge.type] = 10;
      }
      expect(countEarnedTypeSpecialistBadges(typeCounts)).toBe(11);
    });
  });

  describe('countCardsByType', () => {
    it('should return empty object for empty array', () => {
      expect(countCardsByType([])).toEqual({});
    });

    it('should count single type cards', () => {
      const cards = [
        { types: ['Fire'] },
        { types: ['Fire'] },
        { types: ['Water'] },
      ];
      const counts = countCardsByType(cards);
      expect(counts).toEqual({ Fire: 2, Water: 1 });
    });

    it('should count dual type cards (both types counted)', () => {
      const cards = [
        { types: ['Fire', 'Water'] },
        { types: ['Fire'] },
      ];
      const counts = countCardsByType(cards);
      expect(counts).toEqual({ Fire: 2, Water: 1 });
    });

    it('should handle cards with empty types array', () => {
      const cards = [
        { types: [] },
        { types: ['Fire'] },
      ];
      const counts = countCardsByType(cards);
      expect(counts).toEqual({ Fire: 1 });
    });

    it('should handle many cards with various types', () => {
      const cards = [
        { types: ['Fire'] },
        { types: ['Fire', 'Dragon'] },
        { types: ['Water'] },
        { types: ['Water', 'Dragon'] },
        { types: ['Dragon'] },
      ];
      const counts = countCardsByType(cards);
      expect(counts.Fire).toBe(2);
      expect(counts.Water).toBe(2);
      expect(counts.Dragon).toBe(3);
    });
  });

  describe('getNearbyTypeSpecialistBadges', () => {
    it('should return empty array for empty type counts', () => {
      expect(getNearbyTypeSpecialistBadges({})).toEqual([]);
    });

    it('should return types with partial progress', () => {
      const nearby = getNearbyTypeSpecialistBadges({ Fire: 5, Water: 8 });
      expect(nearby).toHaveLength(2);
    });

    it('should sort by remaining (closest first)', () => {
      const nearby = getNearbyTypeSpecialistBadges({ Fire: 5, Water: 8, Grass: 3 });
      expect(nearby[0].type).toBe('Water'); // 2 remaining
      expect(nearby[1].type).toBe('Fire'); // 5 remaining
      expect(nearby[2].type).toBe('Grass'); // 7 remaining
    });

    it('should not include types at or above threshold', () => {
      const nearby = getNearbyTypeSpecialistBadges({ Fire: 10, Water: 5 });
      expect(nearby).toHaveLength(1);
      expect(nearby[0].type).toBe('Water');
    });

    it('should not include types with 0 cards', () => {
      const nearby = getNearbyTypeSpecialistBadges({ Fire: 5, Water: 0 });
      expect(nearby).toHaveLength(1);
      expect(nearby[0].type).toBe('Fire');
    });

    it('should exclude already earned badges', () => {
      const nearby = getNearbyTypeSpecialistBadges(
        { Fire: 10, Water: 5 },
        ['water_trainer'] // even though not at threshold, exclude if earned
      );
      expect(nearby).toHaveLength(0);
    });

    it('should include remaining count in results', () => {
      const nearby = getNearbyTypeSpecialistBadges({ Fire: 7 });
      expect(nearby[0].remaining).toBe(3);
      expect(nearby[0].count).toBe(7);
    });
  });

  describe('getDominantType', () => {
    it('should return null for empty type counts', () => {
      expect(getDominantType({})).toBeNull();
    });

    it('should return the type with most cards', () => {
      expect(getDominantType({ Fire: 5, Water: 10, Grass: 3 })).toBe('Water');
    });

    it('should return one type when tied (first encountered)', () => {
      const dominant = getDominantType({ Fire: 10, Water: 10 });
      // Should return one of them (implementation detail)
      expect(['Fire', 'Water']).toContain(dominant);
    });

    it('should return the only type if single', () => {
      expect(getDominantType({ Fire: 5 })).toBe('Fire');
    });
  });

  describe('getTypeDistribution', () => {
    it('should return empty array for empty type counts', () => {
      expect(getTypeDistribution({})).toEqual([]);
    });

    it('should calculate correct percentages', () => {
      const dist = getTypeDistribution({ Fire: 50, Water: 50 });
      expect(dist).toHaveLength(2);
      expect(dist[0].percentage).toBe(50);
      expect(dist[1].percentage).toBe(50);
    });

    it('should sort by count descending', () => {
      const dist = getTypeDistribution({ Fire: 30, Water: 50, Grass: 20 });
      expect(dist[0].type).toBe('Water');
      expect(dist[1].type).toBe('Fire');
      expect(dist[2].type).toBe('Grass');
    });

    it('should include count and percentage', () => {
      const dist = getTypeDistribution({ Fire: 25, Water: 75 });
      const waterDist = dist.find((d) => d.type === 'Water');
      expect(waterDist?.count).toBe(75);
      expect(waterDist?.percentage).toBe(75);
    });

    it('should handle single type', () => {
      const dist = getTypeDistribution({ Fire: 100 });
      expect(dist).toHaveLength(1);
      expect(dist[0].type).toBe('Fire');
      expect(dist[0].percentage).toBe(100);
    });

    it('should round percentages', () => {
      const dist = getTypeDistribution({ Fire: 33, Water: 67 });
      // 33/100 = 33%, 67/100 = 67%
      expect(dist.find((d) => d.type === 'Fire')?.percentage).toBe(33);
      expect(dist.find((d) => d.type === 'Water')?.percentage).toBe(67);
    });
  });

  describe('Type Specialist Badge Awarding Journey', () => {
    it('should track progressive badge collection by type', () => {
      let earnedBadges: string[] = [];
      const typeCounts: Record<string, number> = {};

      // Start collecting Fire cards
      typeCounts.Fire = 5;
      let badges = getTypeSpecialistBadgesToAward(typeCounts, earnedBadges);
      expect(badges).toHaveLength(0);

      // Reach Fire threshold
      typeCounts.Fire = 10;
      badges = getTypeSpecialistBadgesToAward(typeCounts, earnedBadges);
      expect(badges).toEqual(['fire_trainer']);
      earnedBadges.push(...badges);

      // Add Water cards
      typeCounts.Water = 15;
      badges = getTypeSpecialistBadgesToAward(typeCounts, earnedBadges);
      expect(badges).toEqual(['water_trainer']);
      earnedBadges.push(...badges);

      // Fire badge already earned, not returned again
      typeCounts.Fire = 20;
      badges = getTypeSpecialistBadgesToAward(typeCounts, earnedBadges);
      expect(badges).toHaveLength(0);
    });

    it('should show correct progress summary at each stage', () => {
      // Starting collection
      let summary = getTypeSpecialistProgressSummary({ Fire: 5, Water: 8 });
      expect(summary.totalTypeBadgesEarned).toBe(0);
      expect(summary.nearbyBadges).toHaveLength(2);
      expect(summary.nearbyBadges[0].type).toBe('Water'); // 2 remaining

      // After earning Fire badge
      summary = getTypeSpecialistProgressSummary(
        { Fire: 10, Water: 8 },
        ['fire_trainer']
      );
      expect(summary.totalTypeBadgesEarned).toBe(1);
      expect(summary.earnedBadges).toHaveLength(1);
      expect(summary.nearbyBadges).toHaveLength(1); // Only Water now

      // After earning all badges
      const allTypeCounts: Record<string, number> = {};
      const allBadgeKeys: string[] = [];
      for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
        allTypeCounts[badge.type] = 10;
        allBadgeKeys.push(badge.key);
      }
      summary = getTypeSpecialistProgressSummary(allTypeCounts, allBadgeKeys);
      expect(summary.totalTypeBadgesEarned).toBe(11);
      expect(summary.nearbyBadges).toHaveLength(0);
    });

    it('should handle multi-type cards correctly', () => {
      const cards = [
        { types: ['Fire'] },
        { types: ['Fire'] },
        { types: ['Fire'] },
        { types: ['Fire', 'Dragon'] },
        { types: ['Fire', 'Dragon'] },
        { types: ['Fire', 'Dragon'] },
        { types: ['Dragon'] },
        { types: ['Dragon'] },
        { types: ['Dragon'] },
        { types: ['Dragon'] },
      ];

      const typeCounts = countCardsByType(cards);
      // Fire: 6 (3 pure + 3 dual)
      // Dragon: 7 (4 pure + 3 dual)
      expect(typeCounts.Fire).toBe(6);
      expect(typeCounts.Dragon).toBe(7);

      // Neither at threshold yet
      const badges = getTypeSpecialistBadgesToAward(typeCounts);
      expect(badges).toHaveLength(0);

      // Add more Fire cards to reach threshold
      typeCounts.Fire = 10;
      const newBadges = getTypeSpecialistBadgesToAward(typeCounts);
      expect(newBadges).toContain('fire_trainer');
    });
  });
});

// Import Pokemon fan badge utilities
import {
  POKEMON_FAN_BADGE_DEFINITIONS,
  EEVEELUTIONS,
  LEGENDARY_POKEMON,
  matchesPokemonName,
  isEeveelution,
  isLegendaryPokemon,
  countPokemonByCategory,
  getPokemonFanBadgesToAward,
  getPokemonFanProgressSummary,
  getPokemonFanBadgeDefinition,
  getPokemonFanBadgeForPokemon,
  cardsNeededForPokemonFan,
  getPokemonFanPercentProgress,
  hasPokemonFanBeenEarned,
  getAllEarnedPokemonFanKeys,
  countEarnedPokemonFanBadges,
  getNearbyPokemonFanBadges,
  getPokemonWithFanBadges,
} from '../achievements';

describe('Pokemon Fan Badge Utilities', () => {
  describe('POKEMON_FAN_BADGE_DEFINITIONS', () => {
    it('should have 5 Pokemon fan badge definitions', () => {
      expect(POKEMON_FAN_BADGE_DEFINITIONS).toHaveLength(5);
    });

    it('should have unique keys', () => {
      const keys = POKEMON_FAN_BADGE_DEFINITIONS.map((b) => b.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should have unique Pokemon categories', () => {
      const pokemons = POKEMON_FAN_BADGE_DEFINITIONS.map((b) => b.pokemon);
      expect(new Set(pokemons).size).toBe(pokemons.length);
    });

    it('should have names for all badges', () => {
      for (const badge of POKEMON_FAN_BADGE_DEFINITIONS) {
        expect(badge.name).toBeTruthy();
        expect(typeof badge.name).toBe('string');
      }
    });

    it('should have correct thresholds', () => {
      const pikachu = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === 'Pikachu');
      const eevee = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === 'Eevee');
      const charizard = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === 'Charizard');
      const mewtwo = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === 'Mewtwo');
      const legendary = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === 'Legendary');

      expect(pikachu?.threshold).toBe(5);
      expect(eevee?.threshold).toBe(5);
      expect(charizard?.threshold).toBe(3);
      expect(mewtwo?.threshold).toBe(3);
      expect(legendary?.threshold).toBe(10);
    });

    it('should match POKEMON_FAN_THRESHOLDS', () => {
      expect(POKEMON_FAN_THRESHOLDS.Pikachu.threshold).toBe(5);
      expect(POKEMON_FAN_THRESHOLDS.Eevee.threshold).toBe(5);
      expect(POKEMON_FAN_THRESHOLDS.Charizard.threshold).toBe(3);
      expect(POKEMON_FAN_THRESHOLDS.Mewtwo.threshold).toBe(3);
    });
  });

  describe('EEVEELUTIONS', () => {
    it('should have 9 Eeveelutions (Eevee + 8 evolutions)', () => {
      expect(EEVEELUTIONS).toHaveLength(9);
    });

    it('should include Eevee and all evolutions', () => {
      expect(EEVEELUTIONS).toContain('Eevee');
      expect(EEVEELUTIONS).toContain('Vaporeon');
      expect(EEVEELUTIONS).toContain('Jolteon');
      expect(EEVEELUTIONS).toContain('Flareon');
      expect(EEVEELUTIONS).toContain('Espeon');
      expect(EEVEELUTIONS).toContain('Umbreon');
      expect(EEVEELUTIONS).toContain('Leafeon');
      expect(EEVEELUTIONS).toContain('Glaceon');
      expect(EEVEELUTIONS).toContain('Sylveon');
    });
  });

  describe('LEGENDARY_POKEMON', () => {
    it('should have a significant number of legendaries', () => {
      expect(LEGENDARY_POKEMON.length).toBeGreaterThan(50);
    });

    it('should include Gen 1 legendaries', () => {
      expect(LEGENDARY_POKEMON).toContain('Articuno');
      expect(LEGENDARY_POKEMON).toContain('Zapdos');
      expect(LEGENDARY_POKEMON).toContain('Moltres');
      expect(LEGENDARY_POKEMON).toContain('Mewtwo');
      expect(LEGENDARY_POKEMON).toContain('Mew');
    });

    it('should include popular legendaries from later generations', () => {
      expect(LEGENDARY_POKEMON).toContain('Rayquaza');
      expect(LEGENDARY_POKEMON).toContain('Giratina');
      expect(LEGENDARY_POKEMON).toContain('Arceus');
      expect(LEGENDARY_POKEMON).toContain('Zacian');
      expect(LEGENDARY_POKEMON).toContain('Koraidon');
    });
  });

  describe('matchesPokemonName', () => {
    it('should match exact Pokemon name', () => {
      expect(matchesPokemonName('Pikachu', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('Charizard', 'Charizard')).toBe(true);
    });

    it('should match Pokemon name with suffix (V, VMAX, ex, etc.)', () => {
      expect(matchesPokemonName('Pikachu V', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('Pikachu VMAX', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('Pikachu ex', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('Pikachu VSTAR', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('Charizard V', 'Charizard')).toBe(true);
      expect(matchesPokemonName('Mewtwo GX', 'Mewtwo')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(matchesPokemonName('PIKACHU', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('pikachu', 'Pikachu')).toBe(true);
      expect(matchesPokemonName('Pikachu', 'pikachu')).toBe(true);
    });

    it('should not match partial Pokemon names', () => {
      expect(matchesPokemonName('Pikachu', 'Pika')).toBe(false);
      expect(matchesPokemonName('Raichu', 'Pikachu')).toBe(false);
    });

    it('should not match different Pokemon', () => {
      expect(matchesPokemonName('Charizard', 'Pikachu')).toBe(false);
      expect(matchesPokemonName('Charmander', 'Charizard')).toBe(false);
    });
  });

  describe('isEeveelution', () => {
    it('should return true for Eevee', () => {
      expect(isEeveelution('Eevee')).toBe(true);
      expect(isEeveelution('Eevee V')).toBe(true);
      expect(isEeveelution('Eevee VMAX')).toBe(true);
    });

    it('should return true for all Eeveelutions', () => {
      expect(isEeveelution('Vaporeon')).toBe(true);
      expect(isEeveelution('Jolteon')).toBe(true);
      expect(isEeveelution('Flareon')).toBe(true);
      expect(isEeveelution('Espeon')).toBe(true);
      expect(isEeveelution('Umbreon')).toBe(true);
      expect(isEeveelution('Leafeon')).toBe(true);
      expect(isEeveelution('Glaceon')).toBe(true);
      expect(isEeveelution('Sylveon')).toBe(true);
    });

    it('should return true for Eeveelution variants', () => {
      expect(isEeveelution('Vaporeon V')).toBe(true);
      expect(isEeveelution('Sylveon VMAX')).toBe(true);
      expect(isEeveelution('Umbreon ex')).toBe(true);
    });

    it('should return false for non-Eeveelutions', () => {
      expect(isEeveelution('Pikachu')).toBe(false);
      expect(isEeveelution('Charizard')).toBe(false);
      expect(isEeveelution('Evee')).toBe(false); // typo
    });
  });

  describe('isLegendaryPokemon', () => {
    it('should return true for Gen 1 legendaries', () => {
      expect(isLegendaryPokemon('Articuno')).toBe(true);
      expect(isLegendaryPokemon('Zapdos')).toBe(true);
      expect(isLegendaryPokemon('Moltres')).toBe(true);
      expect(isLegendaryPokemon('Mewtwo')).toBe(true);
      expect(isLegendaryPokemon('Mew')).toBe(true);
    });

    it('should return true for legendary variants', () => {
      expect(isLegendaryPokemon('Mewtwo V')).toBe(true);
      expect(isLegendaryPokemon('Rayquaza VMAX')).toBe(true);
      expect(isLegendaryPokemon('Giratina ex')).toBe(true);
      expect(isLegendaryPokemon('Arceus VSTAR')).toBe(true);
    });

    it('should return false for non-legendaries', () => {
      expect(isLegendaryPokemon('Pikachu')).toBe(false);
      expect(isLegendaryPokemon('Charizard')).toBe(false);
      expect(isLegendaryPokemon('Dragonite')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Mewtwo is legendary, but Mewt is not
      expect(isLegendaryPokemon('Mewt')).toBe(false);
    });
  });

  describe('countPokemonByCategory', () => {
    it('should return zeros for empty array', () => {
      const counts = countPokemonByCategory([]);
      expect(counts.Pikachu).toBe(0);
      expect(counts.Eevee).toBe(0);
      expect(counts.Charizard).toBe(0);
      expect(counts.Mewtwo).toBe(0);
      expect(counts.Legendary).toBe(0);
    });

    it('should count Pikachu cards', () => {
      const counts = countPokemonByCategory(['Pikachu', 'Pikachu V', 'Pikachu VMAX']);
      expect(counts.Pikachu).toBe(3);
    });

    it('should count Eevee and all Eeveelutions together', () => {
      const counts = countPokemonByCategory([
        'Eevee',
        'Vaporeon',
        'Jolteon',
        'Flareon',
        'Espeon',
      ]);
      expect(counts.Eevee).toBe(5);
    });

    it('should count Charizard cards', () => {
      const counts = countPokemonByCategory(['Charizard', 'Charizard V', 'Charizard ex']);
      expect(counts.Charizard).toBe(3);
    });

    it('should count Mewtwo cards', () => {
      const counts = countPokemonByCategory(['Mewtwo', 'Mewtwo V', 'Mewtwo GX']);
      expect(counts.Mewtwo).toBe(3);
    });

    it('should count Legendary cards', () => {
      const counts = countPokemonByCategory([
        'Articuno',
        'Zapdos',
        'Moltres',
        'Mewtwo',
        'Rayquaza',
      ]);
      expect(counts.Legendary).toBe(5);
    });

    it('should count Mewtwo as both Mewtwo and Legendary', () => {
      const counts = countPokemonByCategory(['Mewtwo', 'Mewtwo V']);
      expect(counts.Mewtwo).toBe(2);
      expect(counts.Legendary).toBe(2); // Mewtwo is legendary
    });

    it('should not double count non-overlapping categories', () => {
      const counts = countPokemonByCategory(['Pikachu', 'Charizard', 'Eevee']);
      expect(counts.Pikachu).toBe(1);
      expect(counts.Charizard).toBe(1);
      expect(counts.Eevee).toBe(1);
      expect(counts.Mewtwo).toBe(0);
      expect(counts.Legendary).toBe(0);
    });

    it('should handle mixed collection', () => {
      const counts = countPokemonByCategory([
        'Pikachu',
        'Pikachu V',
        'Eevee',
        'Umbreon',
        'Charizard',
        'Rayquaza',
        'Zacian',
        'Bulbasaur',
        'Squirtle',
      ]);
      expect(counts.Pikachu).toBe(2);
      expect(counts.Eevee).toBe(2);
      expect(counts.Charizard).toBe(1);
      expect(counts.Mewtwo).toBe(0);
      expect(counts.Legendary).toBe(2);
    });
  });

  describe('getPokemonFanBadgesToAward', () => {
    it('should return no badges for empty counts', () => {
      expect(getPokemonFanBadgesToAward({})).toEqual([]);
    });

    it('should return no badges when all counts below threshold', () => {
      expect(getPokemonFanBadgesToAward({ Pikachu: 2, Eevee: 3, Charizard: 1 })).toEqual([]);
    });

    it('should return pikachu_fan at threshold (5)', () => {
      const badges = getPokemonFanBadgesToAward({ Pikachu: 5 });
      expect(badges).toEqual(['pikachu_fan']);
    });

    it('should return charizard_fan at threshold (3)', () => {
      const badges = getPokemonFanBadgesToAward({ Charizard: 3 });
      expect(badges).toEqual(['charizard_fan']);
    });

    it('should return mewtwo_fan at threshold (3)', () => {
      const badges = getPokemonFanBadgesToAward({ Mewtwo: 3 });
      expect(badges).toEqual(['mewtwo_fan']);
    });

    it('should return eevee_fan at threshold (5)', () => {
      const badges = getPokemonFanBadgesToAward({ Eevee: 5 });
      expect(badges).toEqual(['eevee_fan']);
    });

    it('should return legendary_fan at threshold (10)', () => {
      const badges = getPokemonFanBadgesToAward({ Legendary: 10 });
      expect(badges).toEqual(['legendary_fan']);
    });

    it('should return multiple badges when multiple thresholds met', () => {
      const badges = getPokemonFanBadgesToAward({
        Pikachu: 5,
        Charizard: 3,
        Eevee: 5,
      });
      expect(badges).toHaveLength(3);
      expect(badges).toContain('pikachu_fan');
      expect(badges).toContain('charizard_fan');
      expect(badges).toContain('eevee_fan');
    });

    it('should return all 5 badges when all thresholds met', () => {
      const badges = getPokemonFanBadgesToAward({
        Pikachu: 5,
        Eevee: 5,
        Charizard: 3,
        Mewtwo: 3,
        Legendary: 10,
      });
      expect(badges).toHaveLength(5);
    });

    it('should exclude already earned badges', () => {
      const badges = getPokemonFanBadgesToAward(
        { Pikachu: 5, Charizard: 3 },
        ['pikachu_fan']
      );
      expect(badges).toEqual(['charizard_fan']);
    });

    it('should return empty array if all eligible badges earned', () => {
      const badges = getPokemonFanBadgesToAward(
        { Pikachu: 5 },
        ['pikachu_fan']
      );
      expect(badges).toEqual([]);
    });
  });

  describe('getPokemonFanProgressSummary', () => {
    it('should return correct summary for empty counts', () => {
      const summary = getPokemonFanProgressSummary({});
      expect(summary.totalPokemonFanBadgesEarned).toBe(0);
      expect(summary.totalPokemonFanBadgesAvailable).toBe(5);
      expect(summary.nearbyBadges).toHaveLength(0);
      expect(summary.earnedBadges).toHaveLength(0);
    });

    it('should show progress for Pokemon with cards', () => {
      const summary = getPokemonFanProgressSummary({ Pikachu: 3, Charizard: 2 });
      const pikachuProgress = summary.pokemonProgress.find((p) => p.pokemon === 'Pikachu');
      const charizardProgress = summary.pokemonProgress.find((p) => p.pokemon === 'Charizard');

      expect(pikachuProgress?.count).toBe(3);
      expect(pikachuProgress?.progress).toBe(60); // 3/5 = 60%
      expect(pikachuProgress?.remaining).toBe(2);
      expect(pikachuProgress?.earned).toBe(false);

      expect(charizardProgress?.count).toBe(2);
      expect(charizardProgress?.progress).toBe(67); // 2/3 = 67%
      expect(charizardProgress?.remaining).toBe(1);
    });

    it('should mark earned badges correctly', () => {
      const summary = getPokemonFanProgressSummary(
        { Pikachu: 5, Charizard: 2 },
        ['pikachu_fan']
      );
      const pikachuProgress = summary.pokemonProgress.find((p) => p.pokemon === 'Pikachu');
      expect(pikachuProgress?.earned).toBe(true);
      expect(pikachuProgress?.remaining).toBe(0);
      expect(summary.totalPokemonFanBadgesEarned).toBe(1);
    });

    it('should sort pokemonProgress with earned first, then by progress', () => {
      const summary = getPokemonFanProgressSummary(
        { Pikachu: 5, Charizard: 2, Eevee: 1 },
        ['pikachu_fan']
      );
      // Pikachu (earned) should be first, then Charizard (67%), then Eevee (20%)
      expect(summary.pokemonProgress[0].pokemon).toBe('Pikachu');
      expect(summary.pokemonProgress[1].pokemon).toBe('Charizard');
    });

    it('should identify nearby badges correctly', () => {
      const summary = getPokemonFanProgressSummary({ Pikachu: 4, Charizard: 1 });
      expect(summary.nearbyBadges).toHaveLength(2);
      // Sorted by remaining: Pikachu (1 remaining), Charizard (2 remaining)
      expect(summary.nearbyBadges[0].pokemon).toBe('Pikachu');
      expect(summary.nearbyBadges[0].remaining).toBe(1);
      expect(summary.nearbyBadges[1].pokemon).toBe('Charizard');
      expect(summary.nearbyBadges[1].remaining).toBe(2);
    });

    it('should not include earned badges in nearbyBadges', () => {
      const summary = getPokemonFanProgressSummary(
        { Pikachu: 5, Charizard: 2 },
        ['pikachu_fan']
      );
      expect(summary.nearbyBadges.find((b) => b.pokemon === 'Pikachu')).toBeUndefined();
    });
  });

  describe('getPokemonFanBadgeDefinition', () => {
    it('should return definition for valid key', () => {
      const def = getPokemonFanBadgeDefinition('pikachu_fan');
      expect(def?.pokemon).toBe('Pikachu');
      expect(def?.key).toBe('pikachu_fan');
      expect(def?.name).toBe('Pikachu Fan');
      expect(def?.threshold).toBe(5);
    });

    it('should return null for invalid key', () => {
      expect(getPokemonFanBadgeDefinition('invalid_key')).toBeNull();
    });

    it('should return definition for all badge keys', () => {
      for (const badge of POKEMON_FAN_BADGE_DEFINITIONS) {
        const def = getPokemonFanBadgeDefinition(badge.key);
        expect(def).not.toBeNull();
        expect(def?.key).toBe(badge.key);
      }
    });
  });

  describe('getPokemonFanBadgeForPokemon', () => {
    it('should return definition for valid Pokemon', () => {
      const def = getPokemonFanBadgeForPokemon('Pikachu');
      expect(def?.pokemon).toBe('Pikachu');
      expect(def?.key).toBe('pikachu_fan');
      expect(def?.threshold).toBe(5);
    });

    it('should return null for invalid Pokemon', () => {
      expect(getPokemonFanBadgeForPokemon('Bulbasaur')).toBeNull();
    });

    it('should return definition for all Pokemon categories', () => {
      for (const badge of POKEMON_FAN_BADGE_DEFINITIONS) {
        const def = getPokemonFanBadgeForPokemon(badge.pokemon);
        expect(def).not.toBeNull();
        expect(def?.pokemon).toBe(badge.pokemon);
      }
    });
  });

  describe('cardsNeededForPokemonFan', () => {
    it('should return correct cards needed for Pikachu (threshold 5)', () => {
      expect(cardsNeededForPokemonFan(0, 'Pikachu')).toBe(5);
      expect(cardsNeededForPokemonFan(3, 'Pikachu')).toBe(2);
      expect(cardsNeededForPokemonFan(5, 'Pikachu')).toBe(0);
      expect(cardsNeededForPokemonFan(10, 'Pikachu')).toBe(0);
    });

    it('should return correct cards needed for Charizard (threshold 3)', () => {
      expect(cardsNeededForPokemonFan(0, 'Charizard')).toBe(3);
      expect(cardsNeededForPokemonFan(1, 'Charizard')).toBe(2);
      expect(cardsNeededForPokemonFan(3, 'Charizard')).toBe(0);
    });

    it('should return correct cards needed for Legendary (threshold 10)', () => {
      expect(cardsNeededForPokemonFan(0, 'Legendary')).toBe(10);
      expect(cardsNeededForPokemonFan(5, 'Legendary')).toBe(5);
      expect(cardsNeededForPokemonFan(10, 'Legendary')).toBe(0);
    });

    it('should return 0 for invalid Pokemon category', () => {
      expect(cardsNeededForPokemonFan(5, 'Bulbasaur')).toBe(0);
    });
  });

  describe('getPokemonFanPercentProgress', () => {
    it('should return 0 for 0 cards', () => {
      expect(getPokemonFanPercentProgress(0, 'Pikachu')).toBe(0);
    });

    it('should return correct percentage for partial progress', () => {
      expect(getPokemonFanPercentProgress(1, 'Pikachu')).toBe(20); // 1/5 = 20%
      expect(getPokemonFanPercentProgress(2, 'Pikachu')).toBe(40);
      expect(getPokemonFanPercentProgress(1, 'Charizard')).toBe(33); // 1/3 = 33%
      expect(getPokemonFanPercentProgress(5, 'Legendary')).toBe(50); // 5/10 = 50%
    });

    it('should return 100 at threshold', () => {
      expect(getPokemonFanPercentProgress(5, 'Pikachu')).toBe(100);
      expect(getPokemonFanPercentProgress(3, 'Charizard')).toBe(100);
      expect(getPokemonFanPercentProgress(10, 'Legendary')).toBe(100);
    });

    it('should cap at 100% above threshold', () => {
      expect(getPokemonFanPercentProgress(10, 'Pikachu')).toBe(100);
      expect(getPokemonFanPercentProgress(50, 'Legendary')).toBe(100);
    });

    it('should return 0 for invalid Pokemon category', () => {
      expect(getPokemonFanPercentProgress(50, 'Bulbasaur')).toBe(0);
    });
  });

  describe('hasPokemonFanBeenEarned', () => {
    it('should return false for 0 cards', () => {
      expect(hasPokemonFanBeenEarned(0, 'Pikachu')).toBe(false);
    });

    it('should return false below threshold', () => {
      expect(hasPokemonFanBeenEarned(4, 'Pikachu')).toBe(false);
      expect(hasPokemonFanBeenEarned(2, 'Charizard')).toBe(false);
      expect(hasPokemonFanBeenEarned(9, 'Legendary')).toBe(false);
    });

    it('should return true at exact threshold', () => {
      expect(hasPokemonFanBeenEarned(5, 'Pikachu')).toBe(true);
      expect(hasPokemonFanBeenEarned(3, 'Charizard')).toBe(true);
      expect(hasPokemonFanBeenEarned(10, 'Legendary')).toBe(true);
    });

    it('should return true above threshold', () => {
      expect(hasPokemonFanBeenEarned(10, 'Pikachu')).toBe(true);
      expect(hasPokemonFanBeenEarned(5, 'Charizard')).toBe(true);
      expect(hasPokemonFanBeenEarned(50, 'Legendary')).toBe(true);
    });

    it('should return false for invalid Pokemon category', () => {
      expect(hasPokemonFanBeenEarned(100, 'Bulbasaur')).toBe(false);
    });
  });

  describe('getAllEarnedPokemonFanKeys', () => {
    it('should return empty array for empty counts', () => {
      expect(getAllEarnedPokemonFanKeys({})).toEqual([]);
    });

    it('should return empty array when all below threshold', () => {
      expect(getAllEarnedPokemonFanKeys({ Pikachu: 4, Charizard: 2 })).toEqual([]);
    });

    it('should return keys for Pokemon at threshold', () => {
      const keys = getAllEarnedPokemonFanKeys({ Pikachu: 5, Charizard: 2 });
      expect(keys).toEqual(['pikachu_fan']);
    });

    it('should return multiple keys when multiple thresholds met', () => {
      const keys = getAllEarnedPokemonFanKeys({
        Pikachu: 5,
        Charizard: 3,
        Eevee: 5,
      });
      expect(keys).toHaveLength(3);
      expect(keys).toContain('pikachu_fan');
      expect(keys).toContain('charizard_fan');
      expect(keys).toContain('eevee_fan');
    });

    it('should return all 5 keys when all thresholds met', () => {
      const keys = getAllEarnedPokemonFanKeys({
        Pikachu: 5,
        Eevee: 5,
        Charizard: 3,
        Mewtwo: 3,
        Legendary: 10,
      });
      expect(keys).toHaveLength(5);
    });
  });

  describe('countEarnedPokemonFanBadges', () => {
    it('should return 0 for empty counts', () => {
      expect(countEarnedPokemonFanBadges({})).toBe(0);
    });

    it('should return 0 when all below threshold', () => {
      expect(countEarnedPokemonFanBadges({ Pikachu: 4, Charizard: 2 })).toBe(0);
    });

    it('should count badges at threshold', () => {
      expect(countEarnedPokemonFanBadges({ Pikachu: 5, Charizard: 2 })).toBe(1);
    });

    it('should count multiple badges at threshold', () => {
      expect(countEarnedPokemonFanBadges({ Pikachu: 5, Charizard: 3 })).toBe(2);
    });

    it('should return 5 when all thresholds met', () => {
      expect(countEarnedPokemonFanBadges({
        Pikachu: 5,
        Eevee: 5,
        Charizard: 3,
        Mewtwo: 3,
        Legendary: 10,
      })).toBe(5);
    });
  });

  describe('getNearbyPokemonFanBadges', () => {
    it('should return empty array for empty counts', () => {
      expect(getNearbyPokemonFanBadges({})).toEqual([]);
    });

    it('should return Pokemon with partial progress', () => {
      const nearby = getNearbyPokemonFanBadges({ Pikachu: 3, Charizard: 2 });
      expect(nearby).toHaveLength(2);
    });

    it('should sort by remaining (closest first)', () => {
      const nearby = getNearbyPokemonFanBadges({ Pikachu: 4, Charizard: 1, Eevee: 2 });
      // Pikachu: 1 remaining, Charizard: 2 remaining, Eevee: 3 remaining
      expect(nearby[0].pokemon).toBe('Pikachu');
      expect(nearby[0].remaining).toBe(1);
      expect(nearby[1].pokemon).toBe('Charizard');
      expect(nearby[1].remaining).toBe(2);
      expect(nearby[2].pokemon).toBe('Eevee');
      expect(nearby[2].remaining).toBe(3);
    });

    it('should not include Pokemon at or above threshold', () => {
      const nearby = getNearbyPokemonFanBadges({ Pikachu: 5, Charizard: 2 });
      expect(nearby).toHaveLength(1);
      expect(nearby[0].pokemon).toBe('Charizard');
    });

    it('should not include Pokemon with 0 cards', () => {
      const nearby = getNearbyPokemonFanBadges({ Pikachu: 3, Charizard: 0 });
      expect(nearby).toHaveLength(1);
      expect(nearby[0].pokemon).toBe('Pikachu');
    });

    it('should exclude already earned badges', () => {
      const nearby = getNearbyPokemonFanBadges(
        { Pikachu: 3, Charizard: 2 },
        ['pikachu_fan']
      );
      expect(nearby).toHaveLength(1);
      expect(nearby[0].pokemon).toBe('Charizard');
    });

    it('should include count and remaining in results', () => {
      const nearby = getNearbyPokemonFanBadges({ Pikachu: 3 });
      expect(nearby[0].count).toBe(3);
      expect(nearby[0].remaining).toBe(2);
      expect(nearby[0].name).toBe('Pikachu Fan');
    });
  });

  describe('getPokemonWithFanBadges', () => {
    it('should return all 5 Pokemon categories', () => {
      const pokemons = getPokemonWithFanBadges();
      expect(pokemons).toHaveLength(5);
      expect(pokemons).toContain('Pikachu');
      expect(pokemons).toContain('Eevee');
      expect(pokemons).toContain('Charizard');
      expect(pokemons).toContain('Mewtwo');
      expect(pokemons).toContain('Legendary');
    });
  });

  describe('Pokemon Fan Badge Awarding Journey', () => {
    it('should track progressive badge collection', () => {
      let earnedBadges: string[] = [];
      let pokemonCounts: Record<string, number> = {};

      // Start collecting Pikachu cards
      pokemonCounts.Pikachu = 2;
      let badges = getPokemonFanBadgesToAward(pokemonCounts, earnedBadges);
      expect(badges).toHaveLength(0);

      // Reach Pikachu threshold
      pokemonCounts.Pikachu = 5;
      badges = getPokemonFanBadgesToAward(pokemonCounts, earnedBadges);
      expect(badges).toEqual(['pikachu_fan']);
      earnedBadges.push(...badges);

      // Add Charizard cards
      pokemonCounts.Charizard = 3;
      badges = getPokemonFanBadgesToAward(pokemonCounts, earnedBadges);
      expect(badges).toEqual(['charizard_fan']);
      earnedBadges.push(...badges);

      // Pikachu badge already earned, not returned again
      pokemonCounts.Pikachu = 10;
      badges = getPokemonFanBadgesToAward(pokemonCounts, earnedBadges);
      expect(badges).toHaveLength(0);
    });

    it('should handle Eevee collection correctly', () => {
      // Count various Eeveelutions
      const cardNames = [
        'Eevee',
        'Eevee V',
        'Vaporeon',
        'Jolteon',
        'Umbreon ex',
      ];
      const counts = countPokemonByCategory(cardNames);
      expect(counts.Eevee).toBe(5);

      const badges = getPokemonFanBadgesToAward(counts);
      expect(badges).toContain('eevee_fan');
    });

    it('should handle Legendary collection with Mewtwo overlap', () => {
      // Mewtwo counts for both Mewtwo and Legendary badges
      const cardNames = [
        'Mewtwo',
        'Mewtwo V',
        'Mewtwo VMAX',
        'Rayquaza',
        'Zacian',
        'Zamazenta',
        'Eternatus',
        'Articuno',
        'Zapdos',
        'Moltres',
      ];
      const counts = countPokemonByCategory(cardNames);
      expect(counts.Mewtwo).toBe(3);
      expect(counts.Legendary).toBe(10); // All 10 are legendaries (including 3 Mewtwo)

      const badges = getPokemonFanBadgesToAward(counts);
      expect(badges).toContain('mewtwo_fan');
      expect(badges).toContain('legendary_fan');
    });

    it('should show correct progress summary at each stage', () => {
      // Starting collection
      let summary = getPokemonFanProgressSummary({ Pikachu: 3, Charizard: 1 });
      expect(summary.totalPokemonFanBadgesEarned).toBe(0);
      expect(summary.nearbyBadges).toHaveLength(2);
      expect(summary.nearbyBadges[0].pokemon).toBe('Pikachu'); // 2 remaining
      expect(summary.nearbyBadges[1].pokemon).toBe('Charizard'); // 2 remaining

      // After earning Pikachu badge
      summary = getPokemonFanProgressSummary(
        { Pikachu: 5, Charizard: 1 },
        ['pikachu_fan']
      );
      expect(summary.totalPokemonFanBadgesEarned).toBe(1);
      expect(summary.earnedBadges).toHaveLength(1);
      expect(summary.nearbyBadges).toHaveLength(1);
      expect(summary.nearbyBadges[0].pokemon).toBe('Charizard');

      // After earning all badges
      summary = getPokemonFanProgressSummary(
        {
          Pikachu: 5,
          Eevee: 5,
          Charizard: 3,
          Mewtwo: 3,
          Legendary: 10,
        },
        ['pikachu_fan', 'eevee_fan', 'charizard_fan', 'mewtwo_fan', 'legendary_fan']
      );
      expect(summary.totalPokemonFanBadgesEarned).toBe(5);
      expect(summary.nearbyBadges).toHaveLength(0);
    });
  });
});
