import { describe, it, expect } from 'vitest';
import {
  HAT_ITEMS,
  FRAME_ITEMS,
  BADGE_ITEMS,
  ALL_AVATAR_ITEMS,
  RARITY_CONFIG,
  getItemsByCategory,
  getItemById,
  isItemUnlocked,
  getUnlockedItems,
  getLockedItems,
  getUnlockProgress,
  getUnlockRequirementDisplay,
  getCategoryDisplayName,
  getCategoryIcon,
  DEFAULT_EQUIPPED_AVATAR,
  type AvatarItem,
  type AvatarItemCategory,
} from '../avatarItems';

describe('Avatar Items Definitions', () => {
  describe('Item collections', () => {
    it('should have hat items defined', () => {
      expect(HAT_ITEMS.length).toBeGreaterThan(0);
      expect(HAT_ITEMS.every((item) => item.category === 'hat')).toBe(true);
    });

    it('should have frame items defined', () => {
      expect(FRAME_ITEMS.length).toBeGreaterThan(0);
      expect(FRAME_ITEMS.every((item) => item.category === 'frame')).toBe(true);
    });

    it('should have badge items defined', () => {
      expect(BADGE_ITEMS.length).toBeGreaterThan(0);
      expect(BADGE_ITEMS.every((item) => item.category === 'badge')).toBe(true);
    });

    it('should have all items in ALL_AVATAR_ITEMS', () => {
      expect(ALL_AVATAR_ITEMS.length).toBe(
        HAT_ITEMS.length + FRAME_ITEMS.length + BADGE_ITEMS.length
      );
    });

    it('should have unique item IDs', () => {
      const ids = ALL_AVATAR_ITEMS.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid rarity for all items', () => {
      const validRarities = Object.keys(RARITY_CONFIG);
      ALL_AVATAR_ITEMS.forEach((item) => {
        expect(validRarities).toContain(item.rarity);
      });
    });

    it('should have required properties for all items', () => {
      ALL_AVATAR_ITEMS.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.category).toBeTruthy();
        expect(item.rarity).toBeTruthy();
        expect(item.icon).toBeTruthy();
        expect(item.gradient).toBeTruthy();
        expect(item.unlockRequirement).toBeTruthy();
        expect(item.unlockRequirement.type).toBeTruthy();
        expect(item.unlockRequirement.value).toBeDefined();
      });
    });
  });

  describe('Rarity configuration', () => {
    it('should have all rarity levels configured', () => {
      expect(RARITY_CONFIG.common).toBeDefined();
      expect(RARITY_CONFIG.uncommon).toBeDefined();
      expect(RARITY_CONFIG.rare).toBeDefined();
      expect(RARITY_CONFIG.epic).toBeDefined();
      expect(RARITY_CONFIG.legendary).toBeDefined();
    });

    it('should have required properties for each rarity', () => {
      Object.values(RARITY_CONFIG).forEach((config) => {
        expect(config.label).toBeTruthy();
        expect(config.gradient).toBeTruthy();
        expect(config.textColor).toBeTruthy();
        expect(config.bgColor).toBeTruthy();
      });
    });
  });

  describe('Default equipped avatar', () => {
    it('should have null values for all slots', () => {
      expect(DEFAULT_EQUIPPED_AVATAR.hatId).toBeNull();
      expect(DEFAULT_EQUIPPED_AVATAR.frameId).toBeNull();
      expect(DEFAULT_EQUIPPED_AVATAR.badgeId).toBeNull();
    });
  });
});

describe('Avatar Items Utility Functions', () => {
  describe('getItemsByCategory', () => {
    it('should return hat items for hat category', () => {
      const items = getItemsByCategory('hat');
      expect(items.length).toBe(HAT_ITEMS.length);
      items.forEach((item) => expect(item.category).toBe('hat'));
    });

    it('should return frame items for frame category', () => {
      const items = getItemsByCategory('frame');
      expect(items.length).toBe(FRAME_ITEMS.length);
      items.forEach((item) => expect(item.category).toBe('frame'));
    });

    it('should return badge items for badge category', () => {
      const items = getItemsByCategory('badge');
      expect(items.length).toBe(BADGE_ITEMS.length);
      items.forEach((item) => expect(item.category).toBe('badge'));
    });
  });

  describe('getItemById', () => {
    it('should return the correct item by ID', () => {
      const item = getItemById('hat_starter');
      expect(item).toBeDefined();
      expect(item?.id).toBe('hat_starter');
      expect(item?.name).toBe('Starter Cap');
    });

    it('should return undefined for non-existent ID', () => {
      const item = getItemById('non_existent_item');
      expect(item).toBeUndefined();
    });
  });

  describe('isItemUnlocked', () => {
    const starterHat = HAT_ITEMS.find((item) => item.id === 'hat_starter')!;
    const collectorHat = HAT_ITEMS.find((item) => item.id === 'hat_collector')!;
    const fireHat = HAT_ITEMS.find((item) => item.id === 'hat_fire')!;
    const sunBadge = BADGE_ITEMS.find((item) => item.id === 'badge_sun')!;

    it('should unlock achievement-based items when achievement is earned', () => {
      const earnedAchievements = new Set(['first_catch']);
      expect(isItemUnlocked(starterHat, earnedAchievements, 0, 0)).toBe(true);
    });

    it('should not unlock achievement-based items without the achievement', () => {
      const earnedAchievements = new Set<string>();
      expect(isItemUnlocked(starterHat, earnedAchievements, 0, 0)).toBe(false);
    });

    it('should unlock milestone-based items when card count is reached', () => {
      const earnedAchievements = new Set<string>();
      expect(isItemUnlocked(collectorHat, earnedAchievements, 50, 0)).toBe(true);
      expect(isItemUnlocked(collectorHat, earnedAchievements, 49, 0)).toBe(false);
    });

    it('should unlock streak-based items when streak is reached', () => {
      const earnedAchievements = new Set<string>();
      expect(isItemUnlocked(sunBadge, earnedAchievements, 0, 3)).toBe(true);
      expect(isItemUnlocked(sunBadge, earnedAchievements, 0, 2)).toBe(false);
    });

    it('should handle type specialist achievements', () => {
      const earnedAchievements = new Set(['fire_trainer']);
      expect(isItemUnlocked(fireHat, earnedAchievements, 0, 0)).toBe(true);
    });
  });

  describe('getUnlockedItems', () => {
    it('should return empty array when no achievements', () => {
      const unlocked = getUnlockedItems(new Set<string>(), 0, 0);
      expect(unlocked.length).toBe(0);
    });

    it('should return items for earned achievements', () => {
      const earnedAchievements = new Set(['first_catch']);
      const unlocked = getUnlockedItems(earnedAchievements, 0, 0);
      expect(unlocked.some((item) => item.id === 'hat_starter')).toBe(true);
    });

    it('should return items for milestone cards', () => {
      const unlocked = getUnlockedItems(new Set<string>(), 10, 0);
      expect(unlocked.some((item) => item.id === 'frame_basic')).toBe(true);
    });

    it('should return multiple items when multiple requirements are met', () => {
      const earnedAchievements = new Set(['first_catch', 'fire_trainer', 'streak_3']);
      const unlocked = getUnlockedItems(earnedAchievements, 50, 7);
      expect(unlocked.length).toBeGreaterThan(3);
    });
  });

  describe('getLockedItems', () => {
    it('should return all items when no achievements', () => {
      const locked = getLockedItems(new Set<string>(), 0, 0);
      expect(locked.length).toBe(ALL_AVATAR_ITEMS.length);
    });

    it('should return fewer items when some are unlocked', () => {
      const earnedAchievements = new Set(['first_catch']);
      const locked = getLockedItems(earnedAchievements, 10, 3);
      const unlocked = getUnlockedItems(earnedAchievements, 10, 3);
      expect(locked.length + unlocked.length).toBe(ALL_AVATAR_ITEMS.length);
    });
  });

  describe('getUnlockProgress', () => {
    it('should return 0% progress for achievement-based items without achievement', () => {
      const starterHat = HAT_ITEMS.find((item) => item.id === 'hat_starter')!;
      const progress = getUnlockProgress(starterHat, new Set<string>(), 0, 0);
      expect(progress.progress).toBe(0);
      expect(progress.current).toBe(0);
    });

    it('should return 100% progress for achievement-based items with achievement', () => {
      const starterHat = HAT_ITEMS.find((item) => item.id === 'hat_starter')!;
      const progress = getUnlockProgress(starterHat, new Set(['first_catch']), 0, 0);
      expect(progress.progress).toBe(100);
      expect(progress.current).toBe(1);
    });

    it('should return partial progress for milestone-based items', () => {
      const collectorHat = HAT_ITEMS.find((item) => item.id === 'hat_collector')!;
      const progress = getUnlockProgress(collectorHat, new Set<string>(), 25, 0);
      expect(progress.progress).toBe(50); // 25/50 = 50%
      expect(progress.current).toBe(25);
      expect(progress.required).toBe(50);
    });

    it('should return partial progress for streak-based items', () => {
      const sunBadge = BADGE_ITEMS.find((item) => item.id === 'badge_sun')!;
      const progress = getUnlockProgress(sunBadge, new Set<string>(), 0, 2);
      expect(progress.progress).toBeCloseTo(66.67, 0); // 2/3 ≈ 66.67%
      expect(progress.current).toBe(2);
      expect(progress.required).toBe(3);
    });

    it('should cap progress at 100%', () => {
      const collectorHat = HAT_ITEMS.find((item) => item.id === 'hat_collector')!;
      const progress = getUnlockProgress(collectorHat, new Set<string>(), 100, 0);
      expect(progress.progress).toBe(100);
    });
  });

  describe('getUnlockRequirementDisplay', () => {
    it('should return friendly display for first_catch achievement', () => {
      const starterHat = HAT_ITEMS.find((item) => item.id === 'hat_starter')!;
      const display = getUnlockRequirementDisplay(starterHat);
      expect(display).toBe('Add your first card');
    });

    it('should return friendly display for milestone requirement', () => {
      const collectorHat = HAT_ITEMS.find((item) => item.id === 'hat_collector')!;
      const display = getUnlockRequirementDisplay(collectorHat);
      expect(display).toBe('Collect 50 unique cards');
    });

    it('should return friendly display for streak requirement', () => {
      const sunBadge = BADGE_ITEMS.find((item) => item.id === 'badge_sun')!;
      const display = getUnlockRequirementDisplay(sunBadge);
      expect(display).toBe('Maintain a 3-day streak');
    });

    it('should return friendly display for type trainer achievements', () => {
      const fireHat = HAT_ITEMS.find((item) => item.id === 'hat_fire')!;
      const display = getUnlockRequirementDisplay(fireHat);
      expect(display).toBe('Collect 10+ Fire-type cards');
    });

    it('should handle unknown achievement keys gracefully', () => {
      const mockItem: AvatarItem = {
        ...HAT_ITEMS[0],
        unlockRequirement: { type: 'achievement', value: 'unknown_achievement' },
      };
      const display = getUnlockRequirementDisplay(mockItem);
      expect(display).toContain('unknown_achievement');
    });
  });

  describe('getCategoryDisplayName', () => {
    it('should return "Hats" for hat category', () => {
      expect(getCategoryDisplayName('hat')).toBe('Hats');
    });

    it('should return "Frames" for frame category', () => {
      expect(getCategoryDisplayName('frame')).toBe('Frames');
    });

    it('should return "Badges" for badge category', () => {
      expect(getCategoryDisplayName('badge')).toBe('Badges');
    });
  });

  describe('getCategoryIcon', () => {
    it('should return an icon component for each category', () => {
      const categories: AvatarItemCategory[] = ['hat', 'frame', 'badge'];
      categories.forEach((category) => {
        const icon = getCategoryIcon(category);
        expect(icon).toBeDefined();
        // React components can be functions or objects (forwardRef components)
        expect(['function', 'object']).toContain(typeof icon);
      });
    });
  });
});

describe('Avatar Items Edge Cases', () => {
  it('should handle empty achievement set', () => {
    const emptyAchievements = new Set<string>();
    const unlocked = getUnlockedItems(emptyAchievements, 0, 0);
    expect(Array.isArray(unlocked)).toBe(true);
    expect(unlocked.length).toBe(0);
  });

  it('should handle very large card counts', () => {
    const unlocked = getUnlockedItems(new Set<string>(), 10000, 0);
    expect(Array.isArray(unlocked)).toBe(true);
    // Should unlock milestone-based items
    expect(unlocked.some((item) => item.unlockRequirement.type === 'milestone')).toBe(true);
  });

  it('should handle very long streaks', () => {
    const unlocked = getUnlockedItems(new Set<string>(), 0, 365);
    expect(Array.isArray(unlocked)).toBe(true);
    // Should unlock all streak-based items
    expect(unlocked.some((item) => item.unlockRequirement.type === 'streak')).toBe(true);
  });

  it('should correctly identify item category membership', () => {
    HAT_ITEMS.forEach((item) => {
      expect(item.category).toBe('hat');
      expect(item.id.startsWith('hat_')).toBe(true);
    });

    FRAME_ITEMS.forEach((item) => {
      expect(item.category).toBe('frame');
      expect(item.id.startsWith('frame_')).toBe(true);
    });

    BADGE_ITEMS.forEach((item) => {
      expect(item.category).toBe('badge');
      expect(item.id.startsWith('badge_')).toBe(true);
    });
  });
});
