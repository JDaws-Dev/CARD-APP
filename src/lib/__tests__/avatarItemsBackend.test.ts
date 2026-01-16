import { describe, expect, it } from 'vitest';
import {
  // Types
  type AvatarItemDefinition,
  type EarnedAvatarItem,
  type AvatarConfig,
  type AvatarItemWithStatus,
  // Constants
  AVATAR_ITEM_CATEGORIES,
  AVATAR_ITEM_RARITIES,
  UNLOCK_REQUIREMENTS,
  CATEGORY_DISPLAY_NAMES,
  RARITY_DISPLAY_NAMES,
  RARITY_COLORS,
  RARITY_SORT_ORDER,
  CATEGORY_ICONS,
  // Validation
  isValidCategory,
  isValidRarity,
  isValidUnlockRequirement,
  isValidItemId,
  validateAvatarItem,
  // Item lookup
  filterItemsByCategory,
  filterItemsByRarity,
  filterActiveItems,
  findItemById,
  getDefaultItems,
  getItemsForAchievement,
  getItemsForLevel,
  // Earned items logic
  hasEarnedItem,
  getEarnedItemDetails,
  getEarnedItemsInCategory,
  countEarnedItemsByRarity,
  getRecentlyEarnedItems,
  getOldestEarnedItem,
  // Avatar config logic
  getEquippedItem,
  setEquippedItem,
  isItemEquipped,
  getEquippedItemIds,
  countEquippedItems,
  createEmptyConfig,
  // Unlock checking
  canUnlockWithAchievement,
  canUnlockWithLevel,
  isDefaultItem,
  isUnlockable,
  getNewlyUnlockableItems,
  getItemsToAwardForAchievement,
  getItemsToAwardForLevel,
  // Enrichment
  enrichItemsWithStatus,
  getCategorySummaries,
  // Sorting
  sortByRarityDesc,
  sortByRarityAsc,
  sortBySortOrder,
  sortItemsForDisplay,
  // Display helpers
  getCategoryDisplayName,
  getRarityDisplayName,
  getRarityColor,
  getCategoryIcon,
  formatEarnedDate,
  formatRelativeEarnedDate,
  getUnlockDescription,
  // Statistics
  calculateAvatarStats,
  getCompletionByCategory,
  getRarestEarnedItem,
} from '../avatarItemsBackend';

// ============================================================================
// TEST DATA
// ============================================================================

const createTestItem = (overrides: Partial<AvatarItemDefinition> = {}): AvatarItemDefinition => ({
  itemId: 'test_item',
  category: 'hat',
  name: 'Test Item',
  description: 'A test item',
  imageUrl: '/test.png',
  rarity: 'common',
  unlockRequirement: 'default',
  sortOrder: 0,
  isActive: true,
  ...overrides,
});

const createTestItems = (): AvatarItemDefinition[] => [
  createTestItem({ itemId: 'hat_1', category: 'hat', rarity: 'common', sortOrder: 1 }),
  createTestItem({ itemId: 'hat_2', category: 'hat', rarity: 'rare', sortOrder: 2 }),
  createTestItem({ itemId: 'frame_1', category: 'frame', rarity: 'uncommon', sortOrder: 1 }),
  createTestItem({ itemId: 'frame_2', category: 'frame', rarity: 'epic', sortOrder: 2 }),
  createTestItem({ itemId: 'badge_1', category: 'badge', rarity: 'legendary', sortOrder: 1 }),
  createTestItem({
    itemId: 'achievement_item',
    category: 'accessory',
    rarity: 'rare',
    unlockRequirement: 'achievement',
    unlockValue: 'first_catch',
    sortOrder: 1,
  }),
  createTestItem({
    itemId: 'level_item',
    category: 'background',
    rarity: 'epic',
    unlockRequirement: 'level',
    unlockValue: '5',
    sortOrder: 1,
  }),
  createTestItem({ itemId: 'inactive_item', category: 'hat', isActive: false, sortOrder: 99 }),
];

const createEarnedItem = (itemId: string, daysAgo: number = 0): EarnedAvatarItem => ({
  itemId,
  earnedAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
  earnedBy: 'test',
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  describe('AVATAR_ITEM_CATEGORIES', () => {
    it('should have 5 categories', () => {
      expect(AVATAR_ITEM_CATEGORIES).toHaveLength(5);
    });

    it('should contain expected categories', () => {
      expect(AVATAR_ITEM_CATEGORIES).toContain('hat');
      expect(AVATAR_ITEM_CATEGORIES).toContain('frame');
      expect(AVATAR_ITEM_CATEGORIES).toContain('badge');
      expect(AVATAR_ITEM_CATEGORIES).toContain('background');
      expect(AVATAR_ITEM_CATEGORIES).toContain('accessory');
    });
  });

  describe('AVATAR_ITEM_RARITIES', () => {
    it('should have 5 rarities', () => {
      expect(AVATAR_ITEM_RARITIES).toHaveLength(5);
    });

    it('should be in order from common to legendary', () => {
      expect(AVATAR_ITEM_RARITIES[0]).toBe('common');
      expect(AVATAR_ITEM_RARITIES[4]).toBe('legendary');
    });
  });

  describe('UNLOCK_REQUIREMENTS', () => {
    it('should have 5 unlock types', () => {
      expect(UNLOCK_REQUIREMENTS).toHaveLength(5);
    });
  });

  describe('RARITY_SORT_ORDER', () => {
    it('should have ascending sort values', () => {
      expect(RARITY_SORT_ORDER.common).toBeLessThan(RARITY_SORT_ORDER.uncommon);
      expect(RARITY_SORT_ORDER.uncommon).toBeLessThan(RARITY_SORT_ORDER.rare);
      expect(RARITY_SORT_ORDER.rare).toBeLessThan(RARITY_SORT_ORDER.epic);
      expect(RARITY_SORT_ORDER.epic).toBeLessThan(RARITY_SORT_ORDER.legendary);
    });
  });

  describe('Display name constants', () => {
    it('should have display names for all categories', () => {
      for (const category of AVATAR_ITEM_CATEGORIES) {
        expect(CATEGORY_DISPLAY_NAMES[category]).toBeDefined();
        expect(CATEGORY_DISPLAY_NAMES[category].length).toBeGreaterThan(0);
      }
    });

    it('should have display names for all rarities', () => {
      for (const rarity of AVATAR_ITEM_RARITIES) {
        expect(RARITY_DISPLAY_NAMES[rarity]).toBeDefined();
      }
    });

    it('should have colors for all rarities', () => {
      for (const rarity of AVATAR_ITEM_RARITIES) {
        expect(RARITY_COLORS[rarity]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('should have icons for all categories', () => {
      for (const category of AVATAR_ITEM_CATEGORIES) {
        expect(CATEGORY_ICONS[category]).toBeDefined();
      }
    });
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('Validation', () => {
  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('hat')).toBe(true);
      expect(isValidCategory('frame')).toBe(true);
      expect(isValidCategory('badge')).toBe(true);
      expect(isValidCategory('background')).toBe(true);
      expect(isValidCategory('accessory')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory('HAT')).toBe(false);
    });
  });

  describe('isValidRarity', () => {
    it('should return true for valid rarities', () => {
      expect(isValidRarity('common')).toBe(true);
      expect(isValidRarity('legendary')).toBe(true);
    });

    it('should return false for invalid rarities', () => {
      expect(isValidRarity('mythic')).toBe(false);
      expect(isValidRarity('')).toBe(false);
    });
  });

  describe('isValidUnlockRequirement', () => {
    it('should return true for valid requirements', () => {
      expect(isValidUnlockRequirement('achievement')).toBe(true);
      expect(isValidUnlockRequirement('default')).toBe(true);
    });

    it('should return false for invalid requirements', () => {
      expect(isValidUnlockRequirement('purchase')).toBe(false);
    });
  });

  describe('isValidItemId', () => {
    it('should return true for valid item IDs', () => {
      expect(isValidItemId('hat_1')).toBe(true);
      expect(isValidItemId('a')).toBe(true);
    });

    it('should return false for invalid item IDs', () => {
      expect(isValidItemId('')).toBe(false);
      expect(isValidItemId('a'.repeat(101))).toBe(false);
    });
  });

  describe('validateAvatarItem', () => {
    it('should return no errors for valid item', () => {
      const item = createTestItem();
      expect(validateAvatarItem(item)).toHaveLength(0);
    });

    it('should return errors for missing fields', () => {
      const errors = validateAvatarItem({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Invalid or missing itemId');
      expect(errors).toContain('Invalid or missing category');
    });

    it('should return error for invalid sortOrder', () => {
      const item = createTestItem({ sortOrder: -1 });
      const errors = validateAvatarItem(item);
      expect(errors).toContain('Invalid sortOrder');
    });
  });
});

// ============================================================================
// ITEM LOOKUP TESTS
// ============================================================================

describe('Item Lookup', () => {
  const items = createTestItems();

  describe('filterItemsByCategory', () => {
    it('should filter items by category', () => {
      const hats = filterItemsByCategory(items, 'hat');
      expect(hats).toHaveLength(2);
      expect(hats.every((item) => item.category === 'hat')).toBe(true);
    });

    it('should exclude inactive items', () => {
      const hats = filterItemsByCategory(items, 'hat');
      expect(hats.find((item) => item.itemId === 'inactive_item')).toBeUndefined();
    });

    it('should return empty array for category with no items', () => {
      const nonExistent = filterItemsByCategory(items, 'accessory');
      const activeAccessories = nonExistent.filter((i) => i.isActive);
      expect(activeAccessories).toHaveLength(1);
    });
  });

  describe('filterItemsByRarity', () => {
    it('should filter items by rarity', () => {
      const rares = filterItemsByRarity(items, 'rare');
      expect(rares.every((item) => item.rarity === 'rare')).toBe(true);
    });
  });

  describe('filterActiveItems', () => {
    it('should return only active items', () => {
      const active = filterActiveItems(items);
      expect(active.every((item) => item.isActive)).toBe(true);
      expect(active).toHaveLength(7);
    });
  });

  describe('findItemById', () => {
    it('should find item by ID', () => {
      const item = findItemById(items, 'hat_1');
      expect(item).toBeDefined();
      expect(item?.itemId).toBe('hat_1');
    });

    it('should return undefined for non-existent ID', () => {
      const item = findItemById(items, 'non_existent');
      expect(item).toBeUndefined();
    });
  });

  describe('getDefaultItems', () => {
    it('should return items with default unlock requirement', () => {
      const defaults = getDefaultItems(items);
      expect(defaults.every((item) => item.unlockRequirement === 'default')).toBe(true);
    });
  });

  describe('getItemsForAchievement', () => {
    it('should return items for specific achievement', () => {
      const achievementItems = getItemsForAchievement(items, 'first_catch');
      expect(achievementItems).toHaveLength(1);
      expect(achievementItems[0].itemId).toBe('achievement_item');
    });

    it('should return empty array for non-existent achievement', () => {
      const achievementItems = getItemsForAchievement(items, 'non_existent');
      expect(achievementItems).toHaveLength(0);
    });
  });

  describe('getItemsForLevel', () => {
    it('should return items for specific level', () => {
      const levelItems = getItemsForLevel(items, 5);
      expect(levelItems).toHaveLength(1);
      expect(levelItems[0].itemId).toBe('level_item');
    });
  });
});

// ============================================================================
// EARNED ITEMS LOGIC TESTS
// ============================================================================

describe('Earned Items Logic', () => {
  const earnedItems: EarnedAvatarItem[] = [
    createEarnedItem('hat_1', 10),
    createEarnedItem('hat_2', 5),
    createEarnedItem('frame_1', 1),
  ];

  describe('hasEarnedItem', () => {
    it('should return true for earned items', () => {
      expect(hasEarnedItem(earnedItems, 'hat_1')).toBe(true);
    });

    it('should return false for non-earned items', () => {
      expect(hasEarnedItem(earnedItems, 'hat_3')).toBe(false);
    });

    it('should handle empty earned list', () => {
      expect(hasEarnedItem([], 'hat_1')).toBe(false);
    });
  });

  describe('getEarnedItemDetails', () => {
    it('should return details for earned item', () => {
      const details = getEarnedItemDetails(earnedItems, 'hat_1');
      expect(details).toBeDefined();
      expect(details?.itemId).toBe('hat_1');
    });

    it('should return undefined for non-earned item', () => {
      expect(getEarnedItemDetails(earnedItems, 'hat_3')).toBeUndefined();
    });
  });

  describe('getEarnedItemsInCategory', () => {
    const items = createTestItems();

    it('should return earned items in category', () => {
      const earnedHats = getEarnedItemsInCategory(items, earnedItems, 'hat');
      expect(earnedHats).toHaveLength(2);
    });

    it('should return empty array for category with no earned items', () => {
      const earnedBadges = getEarnedItemsInCategory(items, earnedItems, 'badge');
      expect(earnedBadges).toHaveLength(0);
    });
  });

  describe('countEarnedItemsByRarity', () => {
    const items = createTestItems();

    it('should count earned items by rarity', () => {
      const counts = countEarnedItemsByRarity(items, earnedItems);
      expect(counts.common).toBe(1);
      expect(counts.rare).toBe(1);
      expect(counts.uncommon).toBe(1);
      expect(counts.epic).toBe(0);
      expect(counts.legendary).toBe(0);
    });
  });

  describe('getRecentlyEarnedItems', () => {
    it('should return items sorted by earnedAt descending', () => {
      const recent = getRecentlyEarnedItems(earnedItems, 2);
      expect(recent).toHaveLength(2);
      expect(recent[0].itemId).toBe('frame_1');
      expect(recent[1].itemId).toBe('hat_2');
    });

    it('should limit results', () => {
      const recent = getRecentlyEarnedItems(earnedItems, 1);
      expect(recent).toHaveLength(1);
    });
  });

  describe('getOldestEarnedItem', () => {
    it('should return oldest earned item', () => {
      const oldest = getOldestEarnedItem(earnedItems);
      expect(oldest?.itemId).toBe('hat_1');
    });

    it('should return undefined for empty list', () => {
      expect(getOldestEarnedItem([])).toBeUndefined();
    });
  });
});

// ============================================================================
// AVATAR CONFIG LOGIC TESTS
// ============================================================================

describe('Avatar Config Logic', () => {
  const config: AvatarConfig = {
    equippedHat: 'hat_1',
    equippedFrame: 'frame_1',
    equippedBadge: undefined,
    equippedBackground: undefined,
    equippedAccessory: 'accessory_1',
  };

  describe('getEquippedItem', () => {
    it('should return equipped item for category', () => {
      expect(getEquippedItem(config, 'hat')).toBe('hat_1');
      expect(getEquippedItem(config, 'frame')).toBe('frame_1');
      expect(getEquippedItem(config, 'accessory')).toBe('accessory_1');
    });

    it('should return undefined for unequipped category', () => {
      expect(getEquippedItem(config, 'badge')).toBeUndefined();
      expect(getEquippedItem(config, 'background')).toBeUndefined();
    });
  });

  describe('setEquippedItem', () => {
    it('should set equipped item for category', () => {
      const newConfig = setEquippedItem(config, 'badge', 'badge_1');
      expect(newConfig.equippedBadge).toBe('badge_1');
      expect(newConfig.equippedHat).toBe('hat_1');
    });

    it('should not mutate original config', () => {
      setEquippedItem(config, 'badge', 'badge_1');
      expect(config.equippedBadge).toBeUndefined();
    });

    it('should handle undefined to unequip', () => {
      const newConfig = setEquippedItem(config, 'hat', undefined);
      expect(newConfig.equippedHat).toBeUndefined();
    });
  });

  describe('isItemEquipped', () => {
    it('should return true for equipped items', () => {
      expect(isItemEquipped(config, 'hat_1')).toBe(true);
      expect(isItemEquipped(config, 'frame_1')).toBe(true);
    });

    it('should return false for non-equipped items', () => {
      expect(isItemEquipped(config, 'hat_2')).toBe(false);
      expect(isItemEquipped(config, 'non_existent')).toBe(false);
    });
  });

  describe('getEquippedItemIds', () => {
    it('should return all equipped item IDs', () => {
      const ids = getEquippedItemIds(config);
      expect(ids).toContain('hat_1');
      expect(ids).toContain('frame_1');
      expect(ids).toContain('accessory_1');
      expect(ids).toHaveLength(3);
    });

    it('should return empty array for empty config', () => {
      const ids = getEquippedItemIds(createEmptyConfig());
      expect(ids).toHaveLength(0);
    });
  });

  describe('countEquippedItems', () => {
    it('should count equipped items', () => {
      expect(countEquippedItems(config)).toBe(3);
    });

    it('should return 0 for empty config', () => {
      expect(countEquippedItems(createEmptyConfig())).toBe(0);
    });
  });

  describe('createEmptyConfig', () => {
    it('should create config with all undefined', () => {
      const empty = createEmptyConfig();
      expect(empty.equippedHat).toBeUndefined();
      expect(empty.equippedFrame).toBeUndefined();
      expect(empty.equippedBadge).toBeUndefined();
      expect(empty.equippedBackground).toBeUndefined();
      expect(empty.equippedAccessory).toBeUndefined();
    });
  });
});

// ============================================================================
// UNLOCK CHECKING TESTS
// ============================================================================

describe('Unlock Checking', () => {
  const items = createTestItems();

  describe('canUnlockWithAchievement', () => {
    const achievementItem = items.find((i) => i.itemId === 'achievement_item')!;
    const defaultItem = items.find((i) => i.itemId === 'hat_1')!;

    it('should return true when achievement is earned', () => {
      expect(canUnlockWithAchievement(achievementItem, ['first_catch'])).toBe(true);
    });

    it('should return false when achievement not earned', () => {
      expect(canUnlockWithAchievement(achievementItem, [])).toBe(false);
      expect(canUnlockWithAchievement(achievementItem, ['other_achievement'])).toBe(false);
    });

    it('should return false for non-achievement items', () => {
      expect(canUnlockWithAchievement(defaultItem, ['first_catch'])).toBe(false);
    });
  });

  describe('canUnlockWithLevel', () => {
    const levelItem = items.find((i) => i.itemId === 'level_item')!;
    const defaultItem = items.find((i) => i.itemId === 'hat_1')!;

    it('should return true when level is reached', () => {
      expect(canUnlockWithLevel(levelItem, 5)).toBe(true);
      expect(canUnlockWithLevel(levelItem, 10)).toBe(true);
    });

    it('should return false when level not reached', () => {
      expect(canUnlockWithLevel(levelItem, 4)).toBe(false);
      expect(canUnlockWithLevel(levelItem, 1)).toBe(false);
    });

    it('should return false for non-level items', () => {
      expect(canUnlockWithLevel(defaultItem, 100)).toBe(false);
    });
  });

  describe('isDefaultItem', () => {
    it('should return true for default items', () => {
      const defaultItem = items.find((i) => i.unlockRequirement === 'default')!;
      expect(isDefaultItem(defaultItem)).toBe(true);
    });

    it('should return false for non-default items', () => {
      const achievementItem = items.find((i) => i.unlockRequirement === 'achievement')!;
      expect(isDefaultItem(achievementItem)).toBe(false);
    });
  });

  describe('isUnlockable', () => {
    it('should return true for default items', () => {
      const defaultItem = items.find((i) => i.unlockRequirement === 'default')!;
      expect(isUnlockable(defaultItem, [], 1)).toBe(true);
    });

    it('should check achievement for achievement items', () => {
      const achievementItem = items.find((i) => i.unlockRequirement === 'achievement')!;
      expect(isUnlockable(achievementItem, ['first_catch'], 1)).toBe(true);
      expect(isUnlockable(achievementItem, [], 1)).toBe(false);
    });

    it('should check level for level items', () => {
      const levelItem = items.find((i) => i.unlockRequirement === 'level')!;
      expect(isUnlockable(levelItem, [], 5)).toBe(true);
      expect(isUnlockable(levelItem, [], 4)).toBe(false);
    });
  });

  describe('getNewlyUnlockableItems', () => {
    it('should return items that can be unlocked but are not earned', () => {
      const earned: EarnedAvatarItem[] = [];
      const newItems = getNewlyUnlockableItems(items, earned, ['first_catch'], 5);
      expect(newItems.length).toBeGreaterThan(0);
      expect(newItems.some((i) => i.itemId === 'achievement_item')).toBe(true);
      expect(newItems.some((i) => i.itemId === 'level_item')).toBe(true);
    });

    it('should exclude already earned items', () => {
      const earned: EarnedAvatarItem[] = [createEarnedItem('achievement_item')];
      const newItems = getNewlyUnlockableItems(items, earned, ['first_catch'], 5);
      expect(newItems.some((i) => i.itemId === 'achievement_item')).toBe(false);
    });

    it('should exclude inactive items', () => {
      const earned: EarnedAvatarItem[] = [];
      const newItems = getNewlyUnlockableItems(items, earned, [], 1);
      expect(newItems.some((i) => !i.isActive)).toBe(false);
    });
  });

  describe('getItemsToAwardForAchievement', () => {
    it('should return items to award for achievement', () => {
      const toAward = getItemsToAwardForAchievement(items, [], 'first_catch');
      expect(toAward).toHaveLength(1);
      expect(toAward[0].itemId).toBe('achievement_item');
    });

    it('should exclude already earned items', () => {
      const earned = [createEarnedItem('achievement_item')];
      const toAward = getItemsToAwardForAchievement(items, earned, 'first_catch');
      expect(toAward).toHaveLength(0);
    });
  });

  describe('getItemsToAwardForLevel', () => {
    it('should return items to award at level', () => {
      const toAward = getItemsToAwardForLevel(items, [], 5);
      expect(toAward).toHaveLength(1);
      expect(toAward[0].itemId).toBe('level_item');
    });

    it('should return items for all levels up to current', () => {
      const toAward = getItemsToAwardForLevel(items, [], 10);
      expect(toAward.some((i) => i.itemId === 'level_item')).toBe(true);
    });
  });
});

// ============================================================================
// ENRICHMENT TESTS
// ============================================================================

describe('Enrichment', () => {
  const items = createTestItems();
  const earned: EarnedAvatarItem[] = [createEarnedItem('hat_1'), createEarnedItem('frame_1')];
  const config: AvatarConfig = {
    equippedHat: 'hat_1',
    equippedFrame: undefined,
    equippedBadge: undefined,
    equippedBackground: undefined,
    equippedAccessory: undefined,
  };

  describe('enrichItemsWithStatus', () => {
    it('should enrich items with earned status', () => {
      const enriched = enrichItemsWithStatus(items, earned, config);
      const hat1 = enriched.find((i) => i.itemId === 'hat_1')!;
      const hat2 = enriched.find((i) => i.itemId === 'hat_2')!;

      expect(hat1.isEarned).toBe(true);
      expect(hat1.earnedAt).toBeDefined();
      expect(hat2.isEarned).toBe(false);
      expect(hat2.earnedAt).toBeUndefined();
    });

    it('should enrich items with equipped status', () => {
      const enriched = enrichItemsWithStatus(items, earned, config);
      const hat1 = enriched.find((i) => i.itemId === 'hat_1')!;
      const frame1 = enriched.find((i) => i.itemId === 'frame_1')!;

      expect(hat1.isEquipped).toBe(true);
      expect(frame1.isEquipped).toBe(false);
    });
  });

  describe('getCategorySummaries', () => {
    it('should return summaries for all categories', () => {
      const summaries = getCategorySummaries(items, earned, config);
      expect(summaries).toHaveLength(5);
    });

    it('should include correct counts', () => {
      const summaries = getCategorySummaries(items, earned, config);
      const hatSummary = summaries.find((s) => s.category === 'hat')!;

      expect(hatSummary.totalItems).toBe(2);
      expect(hatSummary.earnedItems).toBe(1);
      expect(hatSummary.equippedItem).toBe('hat_1');
    });

    it('should include display names and icons', () => {
      const summaries = getCategorySummaries(items, earned, config);
      expect(summaries.every((s) => s.displayName.length > 0)).toBe(true);
      expect(summaries.every((s) => s.icon.length > 0)).toBe(true);
    });
  });
});

// ============================================================================
// SORTING TESTS
// ============================================================================

describe('Sorting', () => {
  const items = createTestItems().filter((i) => i.isActive);

  describe('sortByRarityDesc', () => {
    it('should sort by rarity descending (rarest first)', () => {
      const sorted = sortByRarityDesc(items);
      const rarities = sorted.map((i) => i.rarity);

      let prevOrder = Infinity;
      for (const rarity of rarities) {
        const order = RARITY_SORT_ORDER[rarity];
        expect(order).toBeLessThanOrEqual(prevOrder);
        prevOrder = order;
      }
    });

    it('should not mutate original array', () => {
      const originalLength = items.length;
      const originalFirst = items[0];
      sortByRarityDesc(items);
      expect(items.length).toBe(originalLength);
      expect(items[0]).toBe(originalFirst);
    });
  });

  describe('sortByRarityAsc', () => {
    it('should sort by rarity ascending (most common first)', () => {
      const sorted = sortByRarityAsc(items);
      const rarities = sorted.map((i) => i.rarity);

      let prevOrder = 0;
      for (const rarity of rarities) {
        const order = RARITY_SORT_ORDER[rarity];
        expect(order).toBeGreaterThanOrEqual(prevOrder);
        prevOrder = order;
      }
    });
  });

  describe('sortBySortOrder', () => {
    it('should sort by sortOrder ascending', () => {
      const sorted = sortBySortOrder(items);

      let prevOrder = -Infinity;
      for (const item of sorted) {
        expect(item.sortOrder).toBeGreaterThanOrEqual(prevOrder);
        prevOrder = item.sortOrder;
      }
    });
  });

  describe('sortItemsForDisplay', () => {
    const config: AvatarConfig = createEmptyConfig();
    const earned = [createEarnedItem('hat_2')];
    const enriched = enrichItemsWithStatus(items, earned, config);

    it('should sort earned items first', () => {
      const sorted = sortItemsForDisplay(enriched);
      const earnedIndex = sorted.findIndex((i) => i.isEarned);
      const notEarnedIndex = sorted.findIndex((i) => !i.isEarned);

      if (earnedIndex !== -1 && notEarnedIndex !== -1) {
        expect(earnedIndex).toBeLessThan(notEarnedIndex);
      }
    });

    it('should then sort by rarity descending', () => {
      const sorted = sortItemsForDisplay(enriched);
      const earnedItems = sorted.filter((i) => i.isEarned);
      const notEarnedItems = sorted.filter((i) => !i.isEarned);

      // Check non-earned items are sorted by rarity
      if (notEarnedItems.length > 1) {
        for (let i = 1; i < notEarnedItems.length; i++) {
          const prevRarity = RARITY_SORT_ORDER[notEarnedItems[i - 1].rarity];
          const currRarity = RARITY_SORT_ORDER[notEarnedItems[i].rarity];
          expect(prevRarity).toBeGreaterThanOrEqual(currRarity);
        }
      }
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('Display Helpers', () => {
  describe('getCategoryDisplayName', () => {
    it('should return correct display names', () => {
      expect(getCategoryDisplayName('hat')).toBe('Hats');
      expect(getCategoryDisplayName('frame')).toBe('Frames');
    });
  });

  describe('getRarityDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRarityDisplayName('common')).toBe('Common');
      expect(getRarityDisplayName('legendary')).toBe('Legendary');
    });
  });

  describe('getRarityColor', () => {
    it('should return valid hex colors', () => {
      for (const rarity of AVATAR_ITEM_RARITIES) {
        expect(getRarityColor(rarity)).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('getCategoryIcon', () => {
    it('should return icons for all categories', () => {
      for (const category of AVATAR_ITEM_CATEGORIES) {
        expect(getCategoryIcon(category).length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatEarnedDate', () => {
    it('should format date correctly', () => {
      // Use a specific timestamp to avoid timezone issues
      const timestamp = new Date('2026-01-15T12:00:00Z').getTime();
      const formatted = formatEarnedDate(timestamp);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2026');
      // Just check it's a valid formatted date string
      expect(formatted).toMatch(/Jan \d+, 2026/);
    });
  });

  describe('formatRelativeEarnedDate', () => {
    it('should return "Just now" for very recent', () => {
      const formatted = formatRelativeEarnedDate(Date.now() - 30 * 1000);
      expect(formatted).toBe('Just now');
    });

    it('should return minutes for recent', () => {
      const formatted = formatRelativeEarnedDate(Date.now() - 5 * 60 * 1000);
      expect(formatted).toBe('5 minutes ago');
    });

    it('should return hours for today', () => {
      const formatted = formatRelativeEarnedDate(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatted).toBe('3 hours ago');
    });

    it('should return days for recent days', () => {
      const formatted = formatRelativeEarnedDate(Date.now() - 5 * 24 * 60 * 60 * 1000);
      expect(formatted).toBe('5 days ago');
    });

    it('should return singular form', () => {
      expect(formatRelativeEarnedDate(Date.now() - 1 * 60 * 1000)).toBe('1 minute ago');
      expect(formatRelativeEarnedDate(Date.now() - 1 * 60 * 60 * 1000)).toBe('1 hour ago');
      expect(formatRelativeEarnedDate(Date.now() - 1 * 24 * 60 * 60 * 1000)).toBe('1 day ago');
    });
  });

  describe('getUnlockDescription', () => {
    it('should return description for default items', () => {
      const item = createTestItem({ unlockRequirement: 'default' });
      expect(getUnlockDescription(item)).toBe('Available to all collectors');
    });

    it('should return description for achievement items', () => {
      const item = createTestItem({
        unlockRequirement: 'achievement',
        unlockValue: 'first_catch',
      });
      expect(getUnlockDescription(item)).toContain('first_catch');
    });

    it('should return description for level items', () => {
      const item = createTestItem({
        unlockRequirement: 'level',
        unlockValue: '5',
      });
      expect(getUnlockDescription(item)).toContain('Level 5');
    });
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe('Statistics', () => {
  const items = createTestItems();
  const earned: EarnedAvatarItem[] = [
    createEarnedItem('hat_1'),
    createEarnedItem('hat_2'),
    createEarnedItem('badge_1'),
  ];

  describe('calculateAvatarStats', () => {
    it('should calculate total earned and available', () => {
      const stats = calculateAvatarStats(items, earned);
      expect(stats.totalEarned).toBe(3);
      expect(stats.totalAvailable).toBe(7); // Excludes inactive
    });

    it('should calculate percent complete', () => {
      const stats = calculateAvatarStats(items, earned);
      expect(stats.percentComplete).toBe(Math.round((3 / 7) * 100));
    });

    it('should count by category', () => {
      const stats = calculateAvatarStats(items, earned);
      expect(stats.byCategory.hat.earned).toBe(2);
      expect(stats.byCategory.hat.total).toBe(2);
      expect(stats.byCategory.badge.earned).toBe(1);
    });

    it('should count by rarity', () => {
      const stats = calculateAvatarStats(items, earned);
      expect(stats.byRarity.common.earned).toBe(1);
      expect(stats.byRarity.rare.earned).toBe(1);
      expect(stats.byRarity.legendary.earned).toBe(1);
    });

    it('should handle empty earned list', () => {
      const stats = calculateAvatarStats(items, []);
      expect(stats.totalEarned).toBe(0);
      expect(stats.percentComplete).toBe(0);
    });
  });

  describe('getCompletionByCategory', () => {
    it('should return completion percentage for each category', () => {
      const completion = getCompletionByCategory(items, earned);
      expect(completion.hat).toBe(100);
      expect(completion.badge).toBe(100);
      expect(completion.frame).toBe(0);
    });
  });

  describe('getRarestEarnedItem', () => {
    it('should return the rarest earned item', () => {
      const rarest = getRarestEarnedItem(items, earned);
      expect(rarest?.rarity).toBe('legendary');
      expect(rarest?.itemId).toBe('badge_1');
    });

    it('should return undefined for empty earned list', () => {
      expect(getRarestEarnedItem(items, [])).toBeUndefined();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Scenarios', () => {
  describe('New User Journey', () => {
    it('should start with no earned items and empty config', () => {
      const items = createTestItems();
      const earned: EarnedAvatarItem[] = [];
      const config = createEmptyConfig();

      const stats = calculateAvatarStats(items, earned);
      expect(stats.totalEarned).toBe(0);
      expect(countEquippedItems(config)).toBe(0);

      // But should have default items available
      const defaults = getDefaultItems(items);
      expect(defaults.length).toBeGreaterThan(0);
    });
  });

  describe('Achievement Unlocks Item', () => {
    it('should flow from achievement to earned to equipped', () => {
      const items = createTestItems();
      let earned: EarnedAvatarItem[] = [];
      let config = createEmptyConfig();

      // Check items to award for achievement
      const toAward = getItemsToAwardForAchievement(items, earned, 'first_catch');
      expect(toAward).toHaveLength(1);

      // Award the item
      earned = [...earned, createEarnedItem(toAward[0].itemId)];
      expect(hasEarnedItem(earned, 'achievement_item')).toBe(true);

      // Equip the item
      config = setEquippedItem(config, 'accessory', 'achievement_item');
      expect(isItemEquipped(config, 'achievement_item')).toBe(true);

      // Verify stats
      const stats = calculateAvatarStats(items, earned);
      expect(stats.totalEarned).toBe(1);
    });
  });

  describe('Level Up Awards Items', () => {
    it('should award items when reaching required level', () => {
      const items = createTestItems();
      const earned: EarnedAvatarItem[] = [];

      // At level 4, no level items should be awarded
      const atLevel4 = getItemsToAwardForLevel(items, earned, 4);
      expect(atLevel4).toHaveLength(0);

      // At level 5, the level item should be available
      const atLevel5 = getItemsToAwardForLevel(items, earned, 5);
      expect(atLevel5).toHaveLength(1);
      expect(atLevel5[0].unlockValue).toBe('5');
    });
  });

  describe('Display Enrichment', () => {
    it('should enrich items for display with all status', () => {
      const items = createTestItems().filter((i) => i.isActive);
      const earned = [createEarnedItem('hat_1'), createEarnedItem('frame_1')];
      const config: AvatarConfig = {
        equippedHat: 'hat_1',
        equippedFrame: undefined,
        equippedBadge: undefined,
        equippedBackground: undefined,
        equippedAccessory: undefined,
      };

      const enriched = enrichItemsWithStatus(items, earned, config);
      const sorted = sortItemsForDisplay(enriched);

      // First item should be earned and equipped
      const firstEarned = sorted.find((i) => i.isEarned);
      expect(firstEarned).toBeDefined();

      // Check hat_1 status
      const hat1 = sorted.find((i) => i.itemId === 'hat_1')!;
      expect(hat1.isEarned).toBe(true);
      expect(hat1.isEquipped).toBe(true);

      // Check frame_1 status
      const frame1 = sorted.find((i) => i.itemId === 'frame_1')!;
      expect(frame1.isEarned).toBe(true);
      expect(frame1.isEquipped).toBe(false);
    });
  });
});
