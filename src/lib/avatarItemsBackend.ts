/**
 * Pure utility functions for avatar items backend logic.
 * These functions are decoupled from Convex for testability.
 */

// ============================================================================
// TYPES
// ============================================================================

export type AvatarItemCategory = 'hat' | 'frame' | 'badge' | 'background' | 'accessory';

export type AvatarItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type UnlockRequirement = 'achievement' | 'level' | 'milestone' | 'special' | 'default';

export interface AvatarItemDefinition {
  itemId: string;
  category: AvatarItemCategory;
  name: string;
  description: string;
  imageUrl: string;
  rarity: AvatarItemRarity;
  unlockRequirement: UnlockRequirement;
  unlockValue?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface EarnedAvatarItem {
  itemId: string;
  earnedAt: number;
  earnedBy?: string;
}

export interface AvatarConfig {
  equippedHat?: string;
  equippedFrame?: string;
  equippedBadge?: string;
  equippedBackground?: string;
  equippedAccessory?: string;
}

export interface AvatarItemWithStatus extends AvatarItemDefinition {
  isEarned: boolean;
  earnedAt?: number;
  earnedBy?: string;
  isEquipped: boolean;
}

export interface CategorySummary {
  category: AvatarItemCategory;
  displayName: string;
  icon: string;
  totalItems: number;
  earnedItems: number;
  equippedItem?: string;
}

export interface AvatarStats {
  totalEarned: number;
  totalAvailable: number;
  percentComplete: number;
  byCategory: Record<AvatarItemCategory, { earned: number; total: number }>;
  byRarity: Record<AvatarItemRarity, { earned: number; total: number }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AVATAR_ITEM_CATEGORIES: AvatarItemCategory[] = [
  'hat',
  'frame',
  'badge',
  'background',
  'accessory',
];

export const AVATAR_ITEM_RARITIES: AvatarItemRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export const UNLOCK_REQUIREMENTS: UnlockRequirement[] = [
  'achievement',
  'level',
  'milestone',
  'special',
  'default',
];

export const CATEGORY_DISPLAY_NAMES: Record<AvatarItemCategory, string> = {
  hat: 'Hats',
  frame: 'Frames',
  badge: 'Badges',
  background: 'Backgrounds',
  accessory: 'Accessories',
};

export const RARITY_DISPLAY_NAMES: Record<AvatarItemRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const RARITY_COLORS: Record<AvatarItemRarity, string> = {
  common: '#A8A878',
  uncommon: '#78C850',
  rare: '#6890F0',
  epic: '#A040A0',
  legendary: '#F8D030',
};

export const RARITY_SORT_ORDER: Record<AvatarItemRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

export const CATEGORY_ICONS: Record<AvatarItemCategory, string> = {
  hat: '🎩',
  frame: '🖼️',
  badge: '🏅',
  background: '🌅',
  accessory: '✨',
};

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidCategory(category: string): category is AvatarItemCategory {
  return AVATAR_ITEM_CATEGORIES.includes(category as AvatarItemCategory);
}

export function isValidRarity(rarity: string): rarity is AvatarItemRarity {
  return AVATAR_ITEM_RARITIES.includes(rarity as AvatarItemRarity);
}

export function isValidUnlockRequirement(requirement: string): requirement is UnlockRequirement {
  return UNLOCK_REQUIREMENTS.includes(requirement as UnlockRequirement);
}

export function isValidItemId(itemId: string): boolean {
  return typeof itemId === 'string' && itemId.length > 0 && itemId.length <= 100;
}

export function validateAvatarItem(item: Partial<AvatarItemDefinition>): string[] {
  const errors: string[] = [];

  if (!item.itemId || !isValidItemId(item.itemId)) {
    errors.push('Invalid or missing itemId');
  }
  if (!item.category || !isValidCategory(item.category)) {
    errors.push('Invalid or missing category');
  }
  if (!item.name || item.name.length === 0) {
    errors.push('Missing name');
  }
  if (!item.rarity || !isValidRarity(item.rarity)) {
    errors.push('Invalid or missing rarity');
  }
  if (!item.unlockRequirement || !isValidUnlockRequirement(item.unlockRequirement)) {
    errors.push('Invalid or missing unlockRequirement');
  }
  if (typeof item.sortOrder !== 'number' || item.sortOrder < 0) {
    errors.push('Invalid sortOrder');
  }

  return errors;
}

// ============================================================================
// ITEM LOOKUP
// ============================================================================

export function filterItemsByCategory(
  items: AvatarItemDefinition[],
  category: AvatarItemCategory
): AvatarItemDefinition[] {
  return items.filter((item) => item.category === category && item.isActive);
}

export function filterItemsByRarity(
  items: AvatarItemDefinition[],
  rarity: AvatarItemRarity
): AvatarItemDefinition[] {
  return items.filter((item) => item.rarity === rarity && item.isActive);
}

export function filterActiveItems(items: AvatarItemDefinition[]): AvatarItemDefinition[] {
  return items.filter((item) => item.isActive);
}

export function findItemById(
  items: AvatarItemDefinition[],
  itemId: string
): AvatarItemDefinition | undefined {
  return items.find((item) => item.itemId === itemId);
}

export function getDefaultItems(items: AvatarItemDefinition[]): AvatarItemDefinition[] {
  return items.filter((item) => item.unlockRequirement === 'default' && item.isActive);
}

export function getItemsForAchievement(
  items: AvatarItemDefinition[],
  achievementKey: string
): AvatarItemDefinition[] {
  return items.filter(
    (item) =>
      item.unlockRequirement === 'achievement' &&
      item.unlockValue === achievementKey &&
      item.isActive
  );
}

export function getItemsForLevel(
  items: AvatarItemDefinition[],
  level: number
): AvatarItemDefinition[] {
  return items.filter(
    (item) =>
      item.unlockRequirement === 'level' && item.unlockValue === level.toString() && item.isActive
  );
}

// ============================================================================
// EARNED ITEMS LOGIC
// ============================================================================

export function hasEarnedItem(earnedItems: EarnedAvatarItem[], itemId: string): boolean {
  return earnedItems.some((earned) => earned.itemId === itemId);
}

export function getEarnedItemDetails(
  earnedItems: EarnedAvatarItem[],
  itemId: string
): EarnedAvatarItem | undefined {
  return earnedItems.find((earned) => earned.itemId === itemId);
}

export function getEarnedItemsInCategory(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[],
  category: AvatarItemCategory
): EarnedAvatarItem[] {
  const categoryItemIds = new Set(
    filterItemsByCategory(items, category).map((item) => item.itemId)
  );
  return earnedItems.filter((earned) => categoryItemIds.has(earned.itemId));
}

export function countEarnedItemsByRarity(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[]
): Record<AvatarItemRarity, number> {
  const counts: Record<AvatarItemRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  const itemMap = new Map(items.map((item) => [item.itemId, item]));

  for (const earned of earnedItems) {
    const item = itemMap.get(earned.itemId);
    if (item) {
      counts[item.rarity]++;
    }
  }

  return counts;
}

export function getRecentlyEarnedItems(
  earnedItems: EarnedAvatarItem[],
  limit: number = 5
): EarnedAvatarItem[] {
  return [...earnedItems].sort((a, b) => b.earnedAt - a.earnedAt).slice(0, limit);
}

export function getOldestEarnedItem(earnedItems: EarnedAvatarItem[]): EarnedAvatarItem | undefined {
  if (earnedItems.length === 0) return undefined;
  return [...earnedItems].sort((a, b) => a.earnedAt - b.earnedAt)[0];
}

// ============================================================================
// AVATAR CONFIG LOGIC
// ============================================================================

export function getEquippedItem(
  config: AvatarConfig,
  category: AvatarItemCategory
): string | undefined {
  switch (category) {
    case 'hat':
      return config.equippedHat;
    case 'frame':
      return config.equippedFrame;
    case 'badge':
      return config.equippedBadge;
    case 'background':
      return config.equippedBackground;
    case 'accessory':
      return config.equippedAccessory;
  }
}

export function setEquippedItem(
  config: AvatarConfig,
  category: AvatarItemCategory,
  itemId: string | undefined
): AvatarConfig {
  const newConfig = { ...config };
  switch (category) {
    case 'hat':
      newConfig.equippedHat = itemId;
      break;
    case 'frame':
      newConfig.equippedFrame = itemId;
      break;
    case 'badge':
      newConfig.equippedBadge = itemId;
      break;
    case 'background':
      newConfig.equippedBackground = itemId;
      break;
    case 'accessory':
      newConfig.equippedAccessory = itemId;
      break;
  }
  return newConfig;
}

export function isItemEquipped(config: AvatarConfig, itemId: string): boolean {
  return (
    config.equippedHat === itemId ||
    config.equippedFrame === itemId ||
    config.equippedBadge === itemId ||
    config.equippedBackground === itemId ||
    config.equippedAccessory === itemId
  );
}

export function getEquippedItemIds(config: AvatarConfig): string[] {
  const ids: string[] = [];
  if (config.equippedHat) ids.push(config.equippedHat);
  if (config.equippedFrame) ids.push(config.equippedFrame);
  if (config.equippedBadge) ids.push(config.equippedBadge);
  if (config.equippedBackground) ids.push(config.equippedBackground);
  if (config.equippedAccessory) ids.push(config.equippedAccessory);
  return ids;
}

export function countEquippedItems(config: AvatarConfig): number {
  return getEquippedItemIds(config).length;
}

export function createEmptyConfig(): AvatarConfig {
  return {
    equippedHat: undefined,
    equippedFrame: undefined,
    equippedBadge: undefined,
    equippedBackground: undefined,
    equippedAccessory: undefined,
  };
}

// ============================================================================
// UNLOCK CHECKING
// ============================================================================

export function canUnlockWithAchievement(
  item: AvatarItemDefinition,
  earnedAchievements: string[]
): boolean {
  if (item.unlockRequirement !== 'achievement' || !item.unlockValue) {
    return false;
  }
  return earnedAchievements.includes(item.unlockValue);
}

export function canUnlockWithLevel(item: AvatarItemDefinition, currentLevel: number): boolean {
  if (item.unlockRequirement !== 'level' || !item.unlockValue) {
    return false;
  }
  const requiredLevel = parseInt(item.unlockValue, 10);
  return !isNaN(requiredLevel) && currentLevel >= requiredLevel;
}

export function isDefaultItem(item: AvatarItemDefinition): boolean {
  return item.unlockRequirement === 'default';
}

export function isUnlockable(
  item: AvatarItemDefinition,
  earnedAchievements: string[],
  currentLevel: number
): boolean {
  if (item.unlockRequirement === 'default') {
    return true;
  }
  if (item.unlockRequirement === 'achievement') {
    return canUnlockWithAchievement(item, earnedAchievements);
  }
  if (item.unlockRequirement === 'level') {
    return canUnlockWithLevel(item, currentLevel);
  }
  return false;
}

export function getNewlyUnlockableItems(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[],
  earnedAchievements: string[],
  currentLevel: number
): AvatarItemDefinition[] {
  const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));
  return items.filter(
    (item) =>
      item.isActive &&
      !earnedItemIds.has(item.itemId) &&
      isUnlockable(item, earnedAchievements, currentLevel)
  );
}

export function getItemsToAwardForAchievement(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[],
  achievementKey: string
): AvatarItemDefinition[] {
  const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));
  return items.filter(
    (item) =>
      item.isActive &&
      item.unlockRequirement === 'achievement' &&
      item.unlockValue === achievementKey &&
      !earnedItemIds.has(item.itemId)
  );
}

export function getItemsToAwardForLevel(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[],
  level: number
): AvatarItemDefinition[] {
  const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));
  return items.filter((item) => {
    if (!item.isActive || item.unlockRequirement !== 'level' || !item.unlockValue) {
      return false;
    }
    const requiredLevel = parseInt(item.unlockValue, 10);
    return !isNaN(requiredLevel) && level >= requiredLevel && !earnedItemIds.has(item.itemId);
  });
}

// ============================================================================
// ENRICHMENT
// ============================================================================

export function enrichItemsWithStatus(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[],
  config: AvatarConfig
): AvatarItemWithStatus[] {
  return items.map((item) => {
    const earned = getEarnedItemDetails(earnedItems, item.itemId);
    return {
      ...item,
      isEarned: !!earned,
      earnedAt: earned?.earnedAt,
      earnedBy: earned?.earnedBy,
      isEquipped: isItemEquipped(config, item.itemId),
    };
  });
}

export function getCategorySummaries(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[],
  config: AvatarConfig
): CategorySummary[] {
  return AVATAR_ITEM_CATEGORIES.map((category) => {
    const categoryItems = filterItemsByCategory(items, category);
    const earnedInCategory = getEarnedItemsInCategory(items, earnedItems, category);
    const equipped = getEquippedItem(config, category);

    return {
      category,
      displayName: CATEGORY_DISPLAY_NAMES[category],
      icon: CATEGORY_ICONS[category],
      totalItems: categoryItems.length,
      earnedItems: earnedInCategory.length,
      equippedItem: equipped,
    };
  });
}

// ============================================================================
// SORTING
// ============================================================================

export function sortByRarityDesc(items: AvatarItemDefinition[]): AvatarItemDefinition[] {
  return [...items].sort((a, b) => RARITY_SORT_ORDER[b.rarity] - RARITY_SORT_ORDER[a.rarity]);
}

export function sortByRarityAsc(items: AvatarItemDefinition[]): AvatarItemDefinition[] {
  return [...items].sort((a, b) => RARITY_SORT_ORDER[a.rarity] - RARITY_SORT_ORDER[b.rarity]);
}

export function sortBySortOrder(items: AvatarItemDefinition[]): AvatarItemDefinition[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function sortItemsForDisplay(items: AvatarItemWithStatus[]): AvatarItemWithStatus[] {
  return [...items].sort((a, b) => {
    // Earned items first
    if (a.isEarned && !b.isEarned) return -1;
    if (!a.isEarned && b.isEarned) return 1;
    // Then by rarity (rarest first)
    const rarityDiff = RARITY_SORT_ORDER[b.rarity] - RARITY_SORT_ORDER[a.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    // Then by sort order
    return a.sortOrder - b.sortOrder;
  });
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function getCategoryDisplayName(category: AvatarItemCategory): string {
  return CATEGORY_DISPLAY_NAMES[category];
}

export function getRarityDisplayName(rarity: AvatarItemRarity): string {
  return RARITY_DISPLAY_NAMES[rarity];
}

export function getRarityColor(rarity: AvatarItemRarity): string {
  return RARITY_COLORS[rarity];
}

export function getCategoryIcon(category: AvatarItemCategory): string {
  return CATEGORY_ICONS[category];
}

export function formatEarnedDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeEarnedDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return formatEarnedDate(timestamp);
  } else if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

export function getUnlockDescription(item: AvatarItemDefinition): string {
  switch (item.unlockRequirement) {
    case 'default':
      return 'Available to all collectors';
    case 'achievement':
      return `Earn the "${item.unlockValue}" achievement`;
    case 'level':
      return `Reach Level ${item.unlockValue}`;
    case 'milestone':
      return `Reach collection milestone: ${item.unlockValue}`;
    case 'special':
      return 'Special event item';
    default:
      return 'Unknown requirement';
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

export function calculateAvatarStats(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[]
): AvatarStats {
  const activeItems = filterActiveItems(items);
  const byCategory: Record<AvatarItemCategory, { earned: number; total: number }> = {
    hat: { earned: 0, total: 0 },
    frame: { earned: 0, total: 0 },
    badge: { earned: 0, total: 0 },
    background: { earned: 0, total: 0 },
    accessory: { earned: 0, total: 0 },
  };
  const byRarity: Record<AvatarItemRarity, { earned: number; total: number }> = {
    common: { earned: 0, total: 0 },
    uncommon: { earned: 0, total: 0 },
    rare: { earned: 0, total: 0 },
    epic: { earned: 0, total: 0 },
    legendary: { earned: 0, total: 0 },
  };

  const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));

  for (const item of activeItems) {
    byCategory[item.category].total++;
    byRarity[item.rarity].total++;

    if (earnedItemIds.has(item.itemId)) {
      byCategory[item.category].earned++;
      byRarity[item.rarity].earned++;
    }
  }

  return {
    totalEarned: earnedItems.length,
    totalAvailable: activeItems.length,
    percentComplete:
      activeItems.length > 0 ? Math.round((earnedItems.length / activeItems.length) * 100) : 0,
    byCategory,
    byRarity,
  };
}

export function getCompletionByCategory(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[]
): Record<AvatarItemCategory, number> {
  const stats = calculateAvatarStats(items, earnedItems);
  const result: Record<AvatarItemCategory, number> = {
    hat: 0,
    frame: 0,
    badge: 0,
    background: 0,
    accessory: 0,
  };

  for (const category of AVATAR_ITEM_CATEGORIES) {
    const { earned, total } = stats.byCategory[category];
    result[category] = total > 0 ? Math.round((earned / total) * 100) : 0;
  }

  return result;
}

export function getRarestEarnedItem(
  items: AvatarItemDefinition[],
  earnedItems: EarnedAvatarItem[]
): AvatarItemDefinition | undefined {
  const itemMap = new Map(items.map((item) => [item.itemId, item]));
  let rarestItem: AvatarItemDefinition | undefined;
  let highestRarity = 0;

  for (const earned of earnedItems) {
    const item = itemMap.get(earned.itemId);
    if (item && RARITY_SORT_ORDER[item.rarity] > highestRarity) {
      highestRarity = RARITY_SORT_ORDER[item.rarity];
      rarestItem = item;
    }
  }

  return rarestItem;
}
