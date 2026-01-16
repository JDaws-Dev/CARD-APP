import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// TYPES
// ============================================================================

export type AvatarItemCategory = 'hat' | 'frame' | 'badge' | 'background' | 'accessory';
export type AvatarItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type UnlockRequirement = 'achievement' | 'level' | 'milestone' | 'special' | 'default';

// Schema validator for category
const avatarItemCategory = v.union(
  v.literal('hat'),
  v.literal('frame'),
  v.literal('badge'),
  v.literal('background'),
  v.literal('accessory')
);

// Schema validator for rarity
const avatarItemRarity = v.union(
  v.literal('common'),
  v.literal('uncommon'),
  v.literal('rare'),
  v.literal('epic'),
  v.literal('legendary')
);

// ============================================================================
// CONSTANTS
// ============================================================================

export const RARITY_COLORS: Record<AvatarItemRarity, string> = {
  common: '#A8A878',
  uncommon: '#78C850',
  rare: '#6890F0',
  epic: '#A040A0',
  legendary: '#F8D030',
};

export const CATEGORY_ICONS: Record<AvatarItemCategory, string> = {
  hat: '🎩',
  frame: '🖼️',
  badge: '🏅',
  background: '🌅',
  accessory: '✨',
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all available avatar items.
 * Returns items with their unlock status for the given profile.
 */
export const getAllItems = query({
  args: { profileId: v.optional(v.id('profiles')) },
  handler: async (ctx, args) => {
    const items = await ctx.db.query('avatarItems').collect();

    if (!args.profileId) {
      return items.filter((item) => item.isActive);
    }

    // Get earned items for this profile
    const earnedItems = await ctx.db
      .query('profileAvatarItems')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId!))
      .collect();

    const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));

    // Enrich items with earned status
    return items
      .filter((item) => item.isActive)
      .map((item) => ({
        ...item,
        isEarned: earnedItemIds.has(item.itemId),
        earnedAt: earnedItems.find((e) => e.itemId === item.itemId)?.earnedAt ?? null,
      }));
  },
});

/**
 * Get items by category.
 */
export const getItemsByCategory = query({
  args: {
    profileId: v.optional(v.id('profiles')),
    category: avatarItemCategory,
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('avatarItems')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .collect();

    if (!args.profileId) {
      return items.filter((item) => item.isActive);
    }

    // Get earned items for this profile
    const earnedItems = await ctx.db
      .query('profileAvatarItems')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId!))
      .collect();

    const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));

    return items
      .filter((item) => item.isActive)
      .map((item) => ({
        ...item,
        isEarned: earnedItemIds.has(item.itemId),
        earnedAt: earnedItems.find((e) => e.itemId === item.itemId)?.earnedAt ?? null,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get a single item by ID.
 */
export const getItemById = query({
  args: { itemId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('avatarItems')
      .withIndex('by_item_id', (q) => q.eq('itemId', args.itemId))
      .first();
  },
});

/**
 * Get all earned items for a profile.
 */
export const getEarnedItems = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const earnedItems = await ctx.db
      .query('profileAvatarItems')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Enrich with item details
    const enrichedItems = await Promise.all(
      earnedItems.map(async (earned) => {
        const item = await ctx.db
          .query('avatarItems')
          .withIndex('by_item_id', (q) => q.eq('itemId', earned.itemId))
          .first();

        return {
          ...earned,
          item: item ?? null,
        };
      })
    );

    return enrichedItems.filter((e) => e.item !== null);
  },
});

/**
 * Get the avatar configuration for a profile.
 */
export const getAvatarConfig = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('profileAvatarConfig')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first();

    if (!config) {
      return {
        equippedHat: null,
        equippedFrame: null,
        equippedBadge: null,
        equippedBackground: null,
        equippedAccessory: null,
      };
    }

    return {
      equippedHat: config.equippedHat ?? null,
      equippedFrame: config.equippedFrame ?? null,
      equippedBadge: config.equippedBadge ?? null,
      equippedBackground: config.equippedBackground ?? null,
      equippedAccessory: config.equippedAccessory ?? null,
    };
  },
});

/**
 * Get full avatar display data for a profile.
 * Includes equipped items with their details.
 */
export const getAvatarDisplay = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('profileAvatarConfig')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first();

    const equippedIds = [
      config?.equippedHat,
      config?.equippedFrame,
      config?.equippedBadge,
      config?.equippedBackground,
      config?.equippedAccessory,
    ].filter(Boolean) as string[];

    // Fetch details for equipped items
    const equippedItems: Record<
      string,
      {
        itemId: string;
        category: string;
        name: string;
        description: string;
        imageUrl: string;
        rarity: string;
        unlockRequirement: string;
        unlockValue?: string;
        sortOrder: number;
        isActive: boolean;
      }
    > = {};
    for (const itemId of equippedIds) {
      const avatarItem = await ctx.db
        .query('avatarItems')
        .withIndex('by_item_id', (q) => q.eq('itemId', itemId))
        .first();
      if (avatarItem) {
        equippedItems[itemId] = avatarItem;
      }
    }

    return {
      config: {
        hat: config?.equippedHat ?? null,
        frame: config?.equippedFrame ?? null,
        badge: config?.equippedBadge ?? null,
        background: config?.equippedBackground ?? null,
        accessory: config?.equippedAccessory ?? null,
      },
      items: equippedItems,
    };
  },
});

/**
 * Get avatar item statistics for a profile.
 */
export const getAvatarStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all active items
    const allItems = await ctx.db.query('avatarItems').collect();
    const activeItems = allItems.filter((item) => item.isActive);

    // Get earned items
    const earnedItems = await ctx.db
      .query('profileAvatarItems')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));

    // Count by category
    const byCategory: Record<string, { earned: number; total: number }> = {};
    for (const item of activeItems) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { earned: 0, total: 0 };
      }
      byCategory[item.category].total++;
      if (earnedItemIds.has(item.itemId)) {
        byCategory[item.category].earned++;
      }
    }

    // Count by rarity
    const byRarity: Record<string, { earned: number; total: number }> = {};
    for (const item of activeItems) {
      if (!byRarity[item.rarity]) {
        byRarity[item.rarity] = { earned: 0, total: 0 };
      }
      byRarity[item.rarity].total++;
      if (earnedItemIds.has(item.itemId)) {
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
      recentlyEarned: earnedItems
        .sort((a, b) => b.earnedAt - a.earnedAt)
        .slice(0, 5)
        .map((e) => e.itemId),
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Award an avatar item to a profile.
 * Checks if item exists and hasn't already been earned.
 */
export const awardItem = mutation({
  args: {
    profileId: v.id('profiles'),
    itemId: v.string(),
    earnedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if item exists
    const item = await ctx.db
      .query('avatarItems')
      .withIndex('by_item_id', (q) => q.eq('itemId', args.itemId))
      .first();

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Check if already earned
    const existing = await ctx.db
      .query('profileAvatarItems')
      .withIndex('by_profile_and_item', (q) =>
        q.eq('profileId', args.profileId).eq('itemId', args.itemId)
      )
      .first();

    if (existing) {
      return { success: false, error: 'Item already earned', existingId: existing._id };
    }

    // Award the item
    const earnedId = await ctx.db.insert('profileAvatarItems', {
      profileId: args.profileId,
      itemId: args.itemId,
      earnedAt: Date.now(),
      earnedBy: args.earnedBy,
    });

    return { success: true, earnedId, item };
  },
});

/**
 * Award multiple items at once (batch operation).
 */
export const awardItems = mutation({
  args: {
    profileId: v.id('profiles'),
    items: v.array(
      v.object({
        itemId: v.string(),
        earnedBy: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      itemId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const itemInput of args.items) {
      // Check if item exists
      const item = await ctx.db
        .query('avatarItems')
        .withIndex('by_item_id', (q) => q.eq('itemId', itemInput.itemId))
        .first();

      if (!item) {
        results.push({ itemId: itemInput.itemId, success: false, error: 'Item not found' });
        continue;
      }

      // Check if already earned
      const existing = await ctx.db
        .query('profileAvatarItems')
        .withIndex('by_profile_and_item', (q) =>
          q.eq('profileId', args.profileId).eq('itemId', itemInput.itemId)
        )
        .first();

      if (existing) {
        results.push({
          itemId: itemInput.itemId,
          success: false,
          error: 'Item already earned',
        });
        continue;
      }

      // Award the item
      await ctx.db.insert('profileAvatarItems', {
        profileId: args.profileId,
        itemId: itemInput.itemId,
        earnedAt: Date.now(),
        earnedBy: itemInput.earnedBy,
      });

      results.push({ itemId: itemInput.itemId, success: true });
    }

    return {
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  },
});

/**
 * Equip an avatar item.
 * Validates that the item is earned before equipping.
 */
export const equipItem = mutation({
  args: {
    profileId: v.id('profiles'),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the item to find its category
    const item = await ctx.db
      .query('avatarItems')
      .withIndex('by_item_id', (q) => q.eq('itemId', args.itemId))
      .first();

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Check if item is earned (or is a default item)
    if (item.unlockRequirement !== 'default') {
      const earned = await ctx.db
        .query('profileAvatarItems')
        .withIndex('by_profile_and_item', (q) =>
          q.eq('profileId', args.profileId).eq('itemId', args.itemId)
        )
        .first();

      if (!earned) {
        return { success: false, error: 'Item not earned' };
      }
    }

    // Get or create config
    let config = await ctx.db
      .query('profileAvatarConfig')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first();

    if (!config) {
      // Create new config
      const configId = await ctx.db.insert('profileAvatarConfig', {
        profileId: args.profileId,
        [`equipped${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`]: args.itemId,
        lastUpdated: Date.now(),
      });
      return { success: true, configId };
    }

    // Update existing config
    const updateField = `equipped${item.category.charAt(0).toUpperCase() + item.category.slice(1)}`;
    await ctx.db.patch(config._id, {
      [updateField]: args.itemId,
      lastUpdated: Date.now(),
    });

    return { success: true, configId: config._id };
  },
});

/**
 * Unequip an avatar item.
 */
export const unequipItem = mutation({
  args: {
    profileId: v.id('profiles'),
    category: avatarItemCategory,
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query('profileAvatarConfig')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first();

    if (!config) {
      return { success: true, message: 'Nothing to unequip' };
    }

    const updateField = `equipped${args.category.charAt(0).toUpperCase() + args.category.slice(1)}`;
    await ctx.db.patch(config._id, {
      [updateField]: undefined,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Check and award items based on earned achievements.
 * Should be called after achievements are awarded.
 */
export const checkAndAwardItems = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all achievements for this profile
    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const earnedAchievementKeys = new Set(achievements.map((a) => a.achievementKey));

    // Get profile level
    const profile = await ctx.db.get(args.profileId);
    const currentLevel = profile?.level ?? 1;

    // Get all items that can be earned
    const allItems = await ctx.db.query('avatarItems').collect();
    const activeItems = allItems.filter((item) => item.isActive);

    // Get already earned items
    const earnedItems = await ctx.db
      .query('profileAvatarItems')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();
    const earnedItemIds = new Set(earnedItems.map((e) => e.itemId));

    const awarded: string[] = [];

    for (const item of activeItems) {
      // Skip if already earned
      if (earnedItemIds.has(item.itemId)) {
        continue;
      }

      let shouldAward = false;
      let earnedBy = '';

      switch (item.unlockRequirement) {
        case 'default':
          // Default items are always available, award them
          shouldAward = true;
          earnedBy = 'default';
          break;

        case 'achievement':
          if (item.unlockValue && earnedAchievementKeys.has(item.unlockValue)) {
            shouldAward = true;
            earnedBy = `achievement:${item.unlockValue}`;
          }
          break;

        case 'level':
          if (item.unlockValue) {
            const requiredLevel = parseInt(item.unlockValue, 10);
            if (!isNaN(requiredLevel) && currentLevel >= requiredLevel) {
              shouldAward = true;
              earnedBy = `level:${requiredLevel}`;
            }
          }
          break;

        // milestone and special items need specific handling elsewhere
      }

      if (shouldAward) {
        await ctx.db.insert('profileAvatarItems', {
          profileId: args.profileId,
          itemId: item.itemId,
          earnedAt: Date.now(),
          earnedBy,
        });
        awarded.push(item.itemId);
      }
    }

    return {
      awarded,
      totalAwarded: awarded.length,
    };
  },
});

/**
 * Add a new avatar item to the system (admin function).
 */
export const createItem = mutation({
  args: {
    itemId: v.string(),
    category: avatarItemCategory,
    name: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    rarity: avatarItemRarity,
    unlockRequirement: v.union(
      v.literal('achievement'),
      v.literal('level'),
      v.literal('milestone'),
      v.literal('special'),
      v.literal('default')
    ),
    unlockValue: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if item ID already exists
    const existing = await ctx.db
      .query('avatarItems')
      .withIndex('by_item_id', (q) => q.eq('itemId', args.itemId))
      .first();

    if (existing) {
      return { success: false, error: 'Item ID already exists' };
    }

    const itemId = await ctx.db.insert('avatarItems', args);
    return { success: true, itemId };
  },
});

/**
 * Seed the avatar items table with predefined items.
 * This should be called once during setup.
 */
export const seedAvatarItems = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if items already exist
    const existingItems = await ctx.db.query('avatarItems').collect();
    if (existingItems.length > 0) {
      return {
        success: false,
        message: 'Items already seeded',
        existingCount: existingItems.length,
      };
    }

    // Define all avatar items
    const items: Array<{
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
    }> = [
      // Default items
      {
        itemId: 'frame_basic',
        category: 'frame',
        name: 'Basic Frame',
        description: 'A simple frame for your avatar',
        imageUrl: '/avatars/frames/basic.png',
        rarity: 'common',
        unlockRequirement: 'default',
        sortOrder: 0,
        isActive: true,
      },
      {
        itemId: 'background_default',
        category: 'background',
        name: 'Default Background',
        description: 'A clean, simple background',
        imageUrl: '/avatars/backgrounds/default.png',
        rarity: 'common',
        unlockRequirement: 'default',
        sortOrder: 0,
        isActive: true,
      },

      // Milestone achievement items
      {
        itemId: 'badge_first_catch',
        category: 'badge',
        name: 'First Catch Badge',
        description: 'Earned by adding your first card',
        imageUrl: '/avatars/badges/first_catch.png',
        rarity: 'common',
        unlockRequirement: 'achievement',
        unlockValue: 'first_catch',
        sortOrder: 1,
        isActive: true,
      },
      {
        itemId: 'badge_starter_collector',
        category: 'badge',
        name: 'Starter Collector Badge',
        description: 'Earned by collecting 10 cards',
        imageUrl: '/avatars/badges/starter_collector.png',
        rarity: 'common',
        unlockRequirement: 'achievement',
        unlockValue: 'starter_collector',
        sortOrder: 2,
        isActive: true,
      },
      {
        itemId: 'hat_rising_trainer',
        category: 'hat',
        name: 'Rising Trainer Hat',
        description: 'Earned by collecting 50 cards',
        imageUrl: '/avatars/hats/rising_trainer.png',
        rarity: 'uncommon',
        unlockRequirement: 'achievement',
        unlockValue: 'rising_trainer',
        sortOrder: 1,
        isActive: true,
      },
      {
        itemId: 'frame_pokemon_trainer',
        category: 'frame',
        name: 'Pokemon Trainer Frame',
        description: 'Earned by collecting 100 cards',
        imageUrl: '/avatars/frames/pokemon_trainer.png',
        rarity: 'rare',
        unlockRequirement: 'achievement',
        unlockValue: 'pokemon_trainer',
        sortOrder: 2,
        isActive: true,
      },
      {
        itemId: 'badge_elite_collector',
        category: 'badge',
        name: 'Elite Collector Badge',
        description: 'Earned by collecting 250 cards',
        imageUrl: '/avatars/badges/elite_collector.png',
        rarity: 'rare',
        unlockRequirement: 'achievement',
        unlockValue: 'elite_collector',
        sortOrder: 3,
        isActive: true,
      },
      {
        itemId: 'background_pokemon_master',
        category: 'background',
        name: 'Pokemon Master Background',
        description: 'Earned by collecting 500 cards',
        imageUrl: '/avatars/backgrounds/pokemon_master.png',
        rarity: 'epic',
        unlockRequirement: 'achievement',
        unlockValue: 'pokemon_master',
        sortOrder: 2,
        isActive: true,
      },
      {
        itemId: 'frame_legendary_collector',
        category: 'frame',
        name: 'Legendary Collector Frame',
        description: 'Earned by collecting 1000 cards',
        imageUrl: '/avatars/frames/legendary_collector.png',
        rarity: 'legendary',
        unlockRequirement: 'achievement',
        unlockValue: 'legendary_collector',
        sortOrder: 3,
        isActive: true,
      },

      // Streak items
      {
        itemId: 'accessory_streak_3',
        category: 'accessory',
        name: 'Flame Aura',
        description: 'Earned by adding cards 3 days in a row',
        imageUrl: '/avatars/accessories/flame_aura.png',
        rarity: 'uncommon',
        unlockRequirement: 'achievement',
        unlockValue: 'streak_3',
        sortOrder: 1,
        isActive: true,
      },
      {
        itemId: 'badge_streak_7',
        category: 'badge',
        name: 'Week Warrior Badge',
        description: 'Earned by adding cards 7 days in a row',
        imageUrl: '/avatars/badges/week_warrior.png',
        rarity: 'rare',
        unlockRequirement: 'achievement',
        unlockValue: 'streak_7',
        sortOrder: 4,
        isActive: true,
      },
      {
        itemId: 'hat_streak_30',
        category: 'hat',
        name: 'Monthly Master Crown',
        description: 'Earned by adding cards 30 days in a row',
        imageUrl: '/avatars/hats/monthly_master.png',
        rarity: 'legendary',
        unlockRequirement: 'achievement',
        unlockValue: 'streak_30',
        sortOrder: 2,
        isActive: true,
      },

      // Type specialist items
      {
        itemId: 'hat_fire_trainer',
        category: 'hat',
        name: 'Fire Trainer Cap',
        description: 'Earned by collecting 10+ Fire-type cards',
        imageUrl: '/avatars/hats/fire_trainer.png',
        rarity: 'uncommon',
        unlockRequirement: 'achievement',
        unlockValue: 'fire_trainer',
        sortOrder: 3,
        isActive: true,
      },
      {
        itemId: 'background_water_trainer',
        category: 'background',
        name: 'Ocean Background',
        description: 'Earned by collecting 10+ Water-type cards',
        imageUrl: '/avatars/backgrounds/ocean.png',
        rarity: 'uncommon',
        unlockRequirement: 'achievement',
        unlockValue: 'water_trainer',
        sortOrder: 3,
        isActive: true,
      },
      {
        itemId: 'accessory_electric_trainer',
        category: 'accessory',
        name: 'Electric Spark',
        description: 'Earned by collecting 10+ Electric-type cards',
        imageUrl: '/avatars/accessories/electric_spark.png',
        rarity: 'uncommon',
        unlockRequirement: 'achievement',
        unlockValue: 'electric_trainer',
        sortOrder: 2,
        isActive: true,
      },
      {
        itemId: 'frame_dragon_trainer',
        category: 'frame',
        name: 'Dragon Frame',
        description: 'Earned by collecting 10+ Dragon-type cards',
        imageUrl: '/avatars/frames/dragon.png',
        rarity: 'epic',
        unlockRequirement: 'achievement',
        unlockValue: 'dragon_trainer',
        sortOrder: 4,
        isActive: true,
      },

      // Pokemon fan items
      {
        itemId: 'hat_pikachu_fan',
        category: 'hat',
        name: 'Pikachu Ears',
        description: 'Earned by collecting 5+ Pikachu cards',
        imageUrl: '/avatars/hats/pikachu_ears.png',
        rarity: 'rare',
        unlockRequirement: 'achievement',
        unlockValue: 'pikachu_fan',
        sortOrder: 4,
        isActive: true,
      },
      {
        itemId: 'accessory_charizard_fan',
        category: 'accessory',
        name: 'Charizard Wings',
        description: 'Earned by collecting 3+ Charizard cards',
        imageUrl: '/avatars/accessories/charizard_wings.png',
        rarity: 'epic',
        unlockRequirement: 'achievement',
        unlockValue: 'charizard_fan',
        sortOrder: 3,
        isActive: true,
      },
      {
        itemId: 'background_legendary_fan',
        category: 'background',
        name: 'Legendary Background',
        description: 'Earned by collecting 10+ Legendary Pokemon cards',
        imageUrl: '/avatars/backgrounds/legendary.png',
        rarity: 'legendary',
        unlockRequirement: 'achievement',
        unlockValue: 'legendary_fan',
        sortOrder: 4,
        isActive: true,
      },

      // Level items
      {
        itemId: 'frame_level_5',
        category: 'frame',
        name: 'Apprentice Frame',
        description: 'Earned by reaching Level 5',
        imageUrl: '/avatars/frames/level_5.png',
        rarity: 'uncommon',
        unlockRequirement: 'level',
        unlockValue: '5',
        sortOrder: 5,
        isActive: true,
      },
      {
        itemId: 'hat_level_10',
        category: 'hat',
        name: 'Expert Cap',
        description: 'Earned by reaching Level 10',
        imageUrl: '/avatars/hats/level_10.png',
        rarity: 'rare',
        unlockRequirement: 'level',
        unlockValue: '10',
        sortOrder: 5,
        isActive: true,
      },
      {
        itemId: 'background_level_15',
        category: 'background',
        name: 'Champion Arena',
        description: 'Earned by reaching Level 15 (max level)',
        imageUrl: '/avatars/backgrounds/champion_arena.png',
        rarity: 'legendary',
        unlockRequirement: 'level',
        unlockValue: '15',
        sortOrder: 5,
        isActive: true,
      },
    ];

    // Insert all items
    for (const item of items) {
      await ctx.db.insert('avatarItems', item);
    }

    return { success: true, itemsSeeded: items.length };
  },
});
