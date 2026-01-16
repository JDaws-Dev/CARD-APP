import { describe, it, expect } from 'vitest';
import {
  BADGE_DEFINITIONS,
  getBadge,
  getBadgesByCategory,
  getAllBadgeKeys,
  getMilestoneBadges,
  getSetCompletionBadges,
  getStreakBadges,
  getTypeSpecialistBadges,
  getPokemonFanBadges,
  getTypeSpecialistKey,
  calculateMilestoneProgress,
  calculateSetCompletionProgress,
  getNextMilestoneBadge,
  getTotalBadgeCount,
  getCategoryDisplayName,
  getAllCategories,
  type AchievementCategory,
} from '../badges';

describe('Badge Definitions', () => {
  describe('BADGE_DEFINITIONS', () => {
    it('should have all required properties for each badge', () => {
      for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
        expect(badge.type).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.threshold).toBeGreaterThan(0);
        expect(badge.icon).toBeDefined();
        expect(badge.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(key).toBeTruthy();
      }
    });

    it('should have set completion badges at 25%, 50%, 75%, and 100%', () => {
      const setBadges = getSetCompletionBadges();
      const thresholds = setBadges.map((b) => b.threshold);
      expect(thresholds).toContain(25);
      expect(thresholds).toContain(50);
      expect(thresholds).toContain(75);
      expect(thresholds).toContain(100);
    });

    it('should have collector milestone badges at expected thresholds', () => {
      const milestones = getMilestoneBadges();
      const thresholds = milestones.map((b) => b.threshold);
      expect(thresholds).toEqual([1, 10, 50, 100, 250, 500, 1000]);
    });

    it('should have streak badges at 3, 7, 14, and 30 days', () => {
      const streakBadges = getStreakBadges();
      const thresholds = streakBadges.map((b) => b.threshold);
      expect(thresholds).toEqual([3, 7, 14, 30]);
    });
  });

  describe('getBadge', () => {
    it('should return the badge definition for a valid key', () => {
      const badge = getBadge('first_catch');
      expect(badge).toBeDefined();
      expect(badge?.name).toBe('First Catch');
      expect(badge?.threshold).toBe(1);
    });

    it('should return undefined for an invalid key', () => {
      const badge = getBadge('invalid_badge_key');
      expect(badge).toBeUndefined();
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return only badges of the specified category', () => {
      const streakBadges = getBadgesByCategory('streak');
      expect(streakBadges.length).toBeGreaterThan(0);
      streakBadges.forEach((badge) => {
        expect(badge.type).toBe('streak');
      });
    });

    it('should return collector milestone badges', () => {
      const milestoneBadges = getBadgesByCategory('collector_milestone');
      expect(milestoneBadges.length).toBe(7);
    });

    it('should return type specialist badges', () => {
      const typeBadges = getBadgesByCategory('type_specialist');
      expect(typeBadges.length).toBe(11); // 11 Pokemon TCG types
    });
  });

  describe('getAllBadgeKeys', () => {
    it('should return all badge keys', () => {
      const keys = getAllBadgeKeys();
      expect(keys.length).toBe(Object.keys(BADGE_DEFINITIONS).length);
      expect(keys).toContain('first_catch');
      expect(keys).toContain('set_champion');
      expect(keys).toContain('streak_30');
    });
  });

  describe('getMilestoneBadges', () => {
    it('should return milestone badges sorted by threshold', () => {
      const milestones = getMilestoneBadges();
      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i].threshold).toBeGreaterThan(milestones[i - 1].threshold);
      }
    });

    it('should include the key property', () => {
      const milestones = getMilestoneBadges();
      milestones.forEach((milestone) => {
        expect(milestone.key).toBeDefined();
        expect(typeof milestone.key).toBe('string');
      });
    });
  });

  describe('getSetCompletionBadges', () => {
    it('should return set completion badges sorted by threshold', () => {
      const badges = getSetCompletionBadges();
      expect(badges.length).toBe(4);
      expect(badges[0].threshold).toBe(25);
      expect(badges[3].threshold).toBe(100);
    });
  });

  describe('getStreakBadges', () => {
    it('should return streak badges sorted by threshold', () => {
      const badges = getStreakBadges();
      expect(badges.length).toBe(4);
      expect(badges[0].threshold).toBe(3);
      expect(badges[3].threshold).toBe(30);
    });
  });

  describe('getTypeSpecialistBadges', () => {
    it('should return all 11 type specialist badges', () => {
      const badges = getTypeSpecialistBadges();
      expect(badges.length).toBe(11);

      const types = badges.map((b) => b.key);
      expect(types).toContain('fire_trainer');
      expect(types).toContain('water_trainer');
      expect(types).toContain('grass_trainer');
      expect(types).toContain('electric_trainer');
      expect(types).toContain('psychic_trainer');
      expect(types).toContain('dragon_trainer');
    });
  });

  describe('getPokemonFanBadges', () => {
    it('should return Pokemon fan badges', () => {
      const badges = getPokemonFanBadges();
      expect(badges.length).toBeGreaterThanOrEqual(3);

      const keys = badges.map((b) => b.key);
      expect(keys).toContain('pikachu_fan');
      expect(keys).toContain('charizard_fan');
      expect(keys).toContain('eevee_fan');
    });
  });

  describe('getTypeSpecialistKey', () => {
    it('should map Pokemon TCG types to badge keys', () => {
      expect(getTypeSpecialistKey('Fire')).toBe('fire_trainer');
      expect(getTypeSpecialistKey('Water')).toBe('water_trainer');
      expect(getTypeSpecialistKey('Lightning')).toBe('electric_trainer');
      expect(getTypeSpecialistKey('Psychic')).toBe('psychic_trainer');
      expect(getTypeSpecialistKey('Dragon')).toBe('dragon_trainer');
    });

    it('should return undefined for invalid types', () => {
      expect(getTypeSpecialistKey('InvalidType')).toBeUndefined();
      expect(getTypeSpecialistKey('')).toBeUndefined();
    });
  });

  describe('calculateMilestoneProgress', () => {
    it('should calculate progress for milestone badges', () => {
      const progress = calculateMilestoneProgress(25);

      // First catch (threshold: 1) should be earned
      const firstCatch = progress.find((p) => p.key === 'first_catch');
      expect(firstCatch?.isEarned).toBe(true);
      expect(firstCatch?.percentage).toBe(100);

      // Starter collector (threshold: 10) should be earned
      const starterCollector = progress.find((p) => p.key === 'starter_collector');
      expect(starterCollector?.isEarned).toBe(true);

      // Rising trainer (threshold: 50) should not be earned yet
      const risingTrainer = progress.find((p) => p.key === 'rising_trainer');
      expect(risingTrainer?.isEarned).toBe(false);
      expect(risingTrainer?.percentage).toBe(50);
    });

    it('should return 100% progress for earned badges', () => {
      const progress = calculateMilestoneProgress(1000);
      progress.forEach((p) => {
        expect(p.isEarned).toBe(true);
        expect(p.percentage).toBe(100);
      });
    });

    it('should handle zero cards', () => {
      const progress = calculateMilestoneProgress(0);
      progress.forEach((p) => {
        expect(p.isEarned).toBe(false);
        expect(p.percentage).toBe(0);
        expect(p.current).toBe(0);
      });
    });
  });

  describe('calculateSetCompletionProgress', () => {
    it('should calculate progress for set completion badges', () => {
      const progress = calculateSetCompletionProgress(50, 'sv1');

      // Set explorer (25%) should be earned
      const explorer = progress.find((p) => p.key === 'set_explorer_sv1');
      expect(explorer?.isEarned).toBe(true);

      // Set adventurer (50%) should be earned
      const adventurer = progress.find((p) => p.key === 'set_adventurer_sv1');
      expect(adventurer?.isEarned).toBe(true);

      // Set master (75%) should not be earned
      const master = progress.find((p) => p.key === 'set_master_sv1');
      expect(master?.isEarned).toBe(false);
      expect(master?.percentage).toBe(67); // 50/75 rounded
    });

    it('should include set ID in badge keys', () => {
      const progress = calculateSetCompletionProgress(100, 'sv2');
      progress.forEach((p) => {
        expect(p.key).toContain('_sv2');
      });
    });
  });

  describe('getNextMilestoneBadge', () => {
    it('should return the next unearned milestone', () => {
      const next = getNextMilestoneBadge(5);
      expect(next?.key).toBe('starter_collector');
      expect(next?.threshold).toBe(10);
    });

    it('should return null when all milestones are earned', () => {
      const next = getNextMilestoneBadge(1500);
      expect(next).toBeNull();
    });

    it('should return first_catch for zero cards', () => {
      const next = getNextMilestoneBadge(0);
      expect(next?.key).toBe('first_catch');
    });
  });

  describe('getTotalBadgeCount', () => {
    it('should return the total number of badge definitions', () => {
      const count = getTotalBadgeCount();
      expect(count).toBe(Object.keys(BADGE_DEFINITIONS).length);
      expect(count).toBeGreaterThan(20); // We have at least 20+ badges
    });
  });

  describe('getCategoryDisplayName', () => {
    it('should return human-readable category names', () => {
      expect(getCategoryDisplayName('collector_milestone')).toBe('Collector Milestones');
      expect(getCategoryDisplayName('set_completion')).toBe('Set Completion');
      expect(getCategoryDisplayName('type_specialist')).toBe('Type Specialists');
      expect(getCategoryDisplayName('pokemon_fan')).toBe('Pokemon Fans');
      expect(getCategoryDisplayName('streak')).toBe('Streaks');
    });
  });

  describe('getAllCategories', () => {
    it('should return all achievement categories', () => {
      const categories = getAllCategories();
      expect(categories).toContain('collector_milestone');
      expect(categories).toContain('set_completion');
      expect(categories).toContain('type_specialist');
      expect(categories).toContain('pokemon_fan');
      expect(categories).toContain('streak');
      expect(categories.length).toBe(5);
    });
  });
});

describe('Badge Data Integrity', () => {
  it('should have unique badge keys', () => {
    const keys = getAllBadgeKeys();
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should have unique badge names within each category', () => {
    const categories: AchievementCategory[] = [
      'collector_milestone',
      'set_completion',
      'type_specialist',
      'pokemon_fan',
      'streak',
    ];

    categories.forEach((category) => {
      const badges = getBadgesByCategory(category);
      const names = badges.map((b) => b.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  it('should have valid hex color codes for all badges', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    Object.values(BADGE_DEFINITIONS).forEach((badge) => {
      expect(badge.color).toMatch(hexColorRegex);
    });
  });

  it('should have non-empty icons for all badges', () => {
    Object.values(BADGE_DEFINITIONS).forEach((badge) => {
      expect(badge.icon.length).toBeGreaterThan(0);
    });
  });

  it('should have positive thresholds for all badges', () => {
    Object.values(BADGE_DEFINITIONS).forEach((badge) => {
      expect(badge.threshold).toBeGreaterThan(0);
    });
  });
});
