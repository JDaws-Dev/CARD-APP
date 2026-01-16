import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  ...authTables,

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
    setId: v.string(), // Pokemon TCG API set ID (e.g., "sv1")
    name: v.string(),
    series: v.string(),
    releaseDate: v.string(),
    totalCards: v.number(),
    logoUrl: v.optional(v.string()),
    symbolUrl: v.optional(v.string()),
  }).index('by_set_id', ['setId']),

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
});
