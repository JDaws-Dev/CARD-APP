import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  ...authTables,

  // ============================================================================
  // MULTI-TCG GAME CONFIGURATION
  // ============================================================================

  /**
   * Supported trading card games
   * Each game has its own API adapter and configuration
   */
  games: defineTable({
    slug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('mtg'),
      v.literal('onepiece'),
      v.literal('lorcana'),
      v.literal('digimon'),
      v.literal('dragonball')
    ),
    displayName: v.string(), // User-friendly name (e.g., "Pokémon TCG")
    apiSource: v.string(), // API source domain (e.g., "pokemontcg.io")
    primaryColor: v.string(), // Hex color for branding (e.g., "#FFCB05")
    secondaryColor: v.optional(v.string()), // Optional secondary color
    isActive: v.boolean(), // Whether the game is currently enabled
    releaseOrder: v.number(), // Sort order for display (1 = first released TCG supported)
  })
    .index('by_slug', ['slug'])
    .index('by_active', ['isActive'])
    .index('by_release_order', ['releaseOrder']),

  /**
   * Junction table tracking which games each profile collects
   * Allows profiles to enable/disable specific TCGs
   */
  profileGames: defineTable({
    profileId: v.id('profiles'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('mtg'),
      v.literal('onepiece'),
      v.literal('lorcana'),
      v.literal('digimon'),
      v.literal('dragonball')
    ),
    enabledAt: v.number(), // Unix timestamp when this game was enabled for the profile
    isActive: v.optional(v.boolean()), // Can be disabled without removing history (default true)
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_game', ['profileId', 'gameSlug'])
    .index('by_game', ['gameSlug']),

  // ============================================================================
  // FAMILY & AUTHENTICATION
  // ============================================================================

  families: defineTable({
    email: v.string(),
    // Note: Password handled by Convex Auth or external auth provider
    subscriptionTier: v.union(v.literal('free'), v.literal('family')),
    subscriptionExpiresAt: v.optional(v.number()), // Unix timestamp
    parentPinHash: v.optional(v.string()),
  }).index('by_email', ['email']),

  profiles: defineTable({
    familyId: v.id('families'),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    profileType: v.optional(v.union(v.literal('parent'), v.literal('child'))),
    // XP/Level system fields
    xp: v.optional(v.number()), // Total XP earned
    level: v.optional(v.number()), // Current level (cached, derived from XP)
  }).index('by_family', ['familyId']),

  // ============================================================================
  // COLLECTION TRACKING
  // ============================================================================

  collectionCards: defineTable({
    profileId: v.id('profiles'),
    cardId: v.string(), // Pokemon TCG API card ID (e.g., "sv1-1")
    quantity: v.number(),
    variant: v.optional(
      v.union(
        v.literal('normal'),
        v.literal('holofoil'),
        v.literal('reverseHolofoil'),
        v.literal('1stEditionHolofoil'),
        v.literal('1stEditionNormal')
      )
    ),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_card', ['profileId', 'cardId'])
    .index('by_profile_card_variant', ['profileId', 'cardId', 'variant']),

  // ============================================================================
  // WISHLIST
  // ============================================================================

  wishlistCards: defineTable({
    profileId: v.id('profiles'),
    cardId: v.string(), // Pokemon TCG API card ID
    isPriority: v.boolean(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_card', ['profileId', 'cardId']),

  wishlistShares: defineTable({
    profileId: v.id('profiles'),
    shareToken: v.string(),
    expiresAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_profile', ['profileId'])
    .index('by_token', ['shareToken']),

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  achievements: defineTable({
    profileId: v.id('profiles'),
    achievementType: v.union(
      v.literal('set_completion'),
      v.literal('collector_milestone'),
      v.literal('type_specialist'),
      v.literal('pokemon_fan'),
      v.literal('streak')
    ),
    achievementKey: v.string(), // e.g., "sv1_25", "cards_100", "fire_trainer"
    achievementData: v.optional(v.any()), // Flexible data (set ID, count, etc.)
    earnedAt: v.number(), // Unix timestamp
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_key', ['profileId', 'achievementKey']),

  // Collection milestones tracking (for celebration triggers)
  collectionMilestones: defineTable({
    profileId: v.id('profiles'),
    milestoneKey: v.string(), // e.g., "milestone_10", "milestone_50", "milestone_100", "milestone_500"
    threshold: v.number(), // The card count threshold (10, 50, 100, 500)
    cardCountAtReach: v.number(), // Actual card count when milestone was reached
    celebratedAt: v.number(), // Unix timestamp when celebration was shown
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_key', ['profileId', 'milestoneKey']),

  // ============================================================================
  // ACTIVITY TRACKING (for streaks and parent dashboard)
  // ============================================================================

  activityLogs: defineTable({
    profileId: v.id('profiles'),
    action: v.union(
      v.literal('card_added'),
      v.literal('card_removed'),
      v.literal('achievement_earned')
    ),
    metadata: v.optional(v.any()), // Additional data about the action
  }).index('by_profile', ['profileId']),

  // ============================================================================
  // CACHED CARD DATA (for offline support and faster queries)
  // ============================================================================

  cachedSets: defineTable({
    setId: v.string(), // TCG API set ID (e.g., "sv1" for Pokemon, "LOB" for Yu-Gi-Oh!)
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('mtg'),
      v.literal('onepiece'),
      v.literal('lorcana'),
      v.literal('digimon'),
      v.literal('dragonball')
    ), // Links set to its game
    name: v.string(),
    series: v.string(),
    releaseDate: v.string(),
    totalCards: v.number(),
    logoUrl: v.optional(v.string()),
    symbolUrl: v.optional(v.string()),
  })
    .index('by_set_id', ['setId'])
    .index('by_game', ['gameSlug'])
    .index('by_game_and_release', ['gameSlug', 'releaseDate']),

  cachedCards: defineTable({
    cardId: v.string(), // Pokemon TCG API card ID (e.g., "sv1-1")
    setId: v.string(),
    name: v.string(),
    number: v.string(),
    supertype: v.string(), // Pokemon, Trainer, Energy
    subtypes: v.array(v.string()), // Basic, Stage 1, etc.
    types: v.array(v.string()), // Fire, Water, etc.
    rarity: v.optional(v.string()),
    imageSmall: v.string(),
    imageLarge: v.string(),
    tcgPlayerUrl: v.optional(v.string()),
    priceMarket: v.optional(v.number()), // Optional pricing for parent view
  })
    .index('by_card_id', ['cardId'])
    .index('by_set', ['setId']),

  // ============================================================================
  // AVATAR CUSTOMIZATION
  // ============================================================================

  // Available avatar items that can be earned
  avatarItems: defineTable({
    itemId: v.string(), // Unique item identifier (e.g., "hat_pikachu", "frame_gold")
    category: v.union(
      v.literal('hat'),
      v.literal('frame'),
      v.literal('badge'),
      v.literal('background'),
      v.literal('accessory')
    ),
    name: v.string(), // Display name (e.g., "Pikachu Hat")
    description: v.string(), // Description of the item
    imageUrl: v.string(), // URL to the item image/icon
    rarity: v.union(
      v.literal('common'),
      v.literal('uncommon'),
      v.literal('rare'),
      v.literal('epic'),
      v.literal('legendary')
    ),
    unlockRequirement: v.union(
      v.literal('achievement'), // Earned by completing an achievement
      v.literal('level'), // Earned by reaching a level
      v.literal('milestone'), // Earned by reaching a collection milestone
      v.literal('special'), // Special event or promo items
      v.literal('default') // Available to all by default
    ),
    unlockValue: v.optional(v.string()), // Achievement key, level number, or milestone key
    sortOrder: v.number(), // For display ordering within category
    isActive: v.boolean(), // Whether this item is currently available
  })
    .index('by_item_id', ['itemId'])
    .index('by_category', ['category'])
    .index('by_rarity', ['rarity']),

  // Items earned/unlocked by each profile
  profileAvatarItems: defineTable({
    profileId: v.id('profiles'),
    itemId: v.string(), // References avatarItems.itemId
    earnedAt: v.number(), // Unix timestamp when item was earned
    earnedBy: v.optional(v.string()), // Description of how earned (achievement key, etc.)
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_item', ['profileId', 'itemId']),

  // Current avatar configuration for each profile
  profileAvatarConfig: defineTable({
    profileId: v.id('profiles'),
    equippedHat: v.optional(v.string()), // itemId of equipped hat
    equippedFrame: v.optional(v.string()), // itemId of equipped frame
    equippedBadge: v.optional(v.string()), // itemId of equipped badge
    equippedBackground: v.optional(v.string()), // itemId of equipped background
    equippedAccessory: v.optional(v.string()), // itemId of equipped accessory
    lastUpdated: v.number(), // Unix timestamp
  }).index('by_profile', ['profileId']),
});
