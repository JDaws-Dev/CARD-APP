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
      v.literal('onepiece'),
      v.literal('lorcana')
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
      v.literal('onepiece'),
      v.literal('lorcana')
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
    // Trade settings (TRADE-003)
    tradeApprovalRequired: v.optional(v.boolean()), // Require parent approval for trades
    tradeNotificationsEnabled: v.optional(v.boolean()), // Notify parent of trades
  }).index('by_email', ['email']),

  /**
   * Email verification tokens for parent registration
   * Stores verification tokens and tracks verification status
   */
  emailVerifications: defineTable({
    familyId: v.id('families'),
    email: v.string(), // Denormalized for easier lookup
    token: v.string(), // Secure random token
    expiresAt: v.number(), // Unix timestamp when token expires
    createdAt: v.number(), // Unix timestamp when token was created
    verifiedAt: v.optional(v.number()), // Unix timestamp when email was verified
  })
    .index('by_family', ['familyId'])
    .index('by_token', ['token'])
    .index('by_email', ['email']),

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
    cardId: v.string(), // TCG API card ID (e.g., "sv1-1" for Pokemon, "LOB-001" for Yu-Gi-Oh)
    quantity: v.number(),
    // Variant string supports all games:
    // - Pokemon: normal, holofoil, reverseHolofoil, 1stEditionHolofoil, 1stEditionNormal
    // - Yu-Gi-Oh: common, rare, super_rare, ultra_rare, secret_rare, etc.
    // - One Piece/Lorcana: game-specific variants
    variant: v.optional(v.string()),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_card', ['profileId', 'cardId'])
    .index('by_profile_card_variant', ['profileId', 'cardId', 'variant']),

  // ============================================================================
  // WISHLIST
  // ============================================================================

  wishlistCards: defineTable({
    profileId: v.id('profiles'),
    cardId: v.string(), // TCG API card ID (e.g., "sv1-1" for Pokemon, "LOB-001" for Yu-Gi-Oh!)
    isPriority: v.boolean(),
    gameSlug: v.optional(
      v.union(
        v.literal('pokemon'),
        v.literal('yugioh'),
        v.literal('onepiece'),
        v.literal('lorcana'),
        v.literal('mtg') // Legacy data - MTG no longer supported but data may exist
      )
    ), // Game the card belongs to (denormalized for query performance)
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_card', ['profileId', 'cardId'])
    .index('by_profile_and_priority', ['profileId', 'isPriority'])
    .index('by_profile_and_game', ['profileId', 'gameSlug']),

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
    .index('by_profile_and_key', ['profileId', 'achievementKey'])
    .index('by_profile_and_type', ['profileId', 'achievementType']),

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
      v.literal('achievement_earned'),
      v.literal('trade_completed'), // Sibling Trade Tracking: trade completed event
      v.literal('trade_logged') // TRADE-001: Simple trade logging for real-life trades
    ),
    metadata: v.optional(v.any()), // Additional data about the action
    timestamp: v.optional(v.number()), // Unix timestamp for database-level time filtering
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_action', ['profileId', 'action'])
    .index('by_profile_action_time', ['profileId', 'action', 'timestamp']),

  // ============================================================================
  // SIBLING TRADE TRACKING (TRADE-001)
  // ============================================================================

  /**
   * Trade proposals between siblings within a family.
   * Tracks the full lifecycle from proposal to completion/cancellation.
   */
  trades: defineTable({
    familyId: v.id('families'), // Family context for parent visibility
    initiatorProfileId: v.id('profiles'), // Who proposed the trade
    recipientProfileId: v.id('profiles'), // Who receives the proposal
    status: v.union(
      v.literal('proposed'),
      v.literal('accepted'),
      v.literal('completed'),
      v.literal('declined'),
      v.literal('cancelled'),
      v.literal('expired')
    ),
    offeredCards: v.array(
      v.object({
        // Cards initiator is giving
        cardId: v.string(),
        quantity: v.number(),
        variant: v.optional(v.string()), // Supports all game variants
        cardName: v.optional(v.string()), // Denormalized for display
        setName: v.optional(v.string()),
      })
    ),
    requestedCards: v.array(
      v.object({
        // Cards initiator wants
        cardId: v.string(),
        quantity: v.number(),
        variant: v.optional(v.string()), // Supports all game variants
        cardName: v.optional(v.string()), // Denormalized for display
        setName: v.optional(v.string()),
      })
    ),
    message: v.optional(v.string()), // Optional trade message ("Please? 🙏")
    requiresParentApproval: v.boolean(), // Family setting for trade oversight
    parentApprovedAt: v.optional(v.number()),
    parentApprovedBy: v.optional(v.id('profiles')),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()), // When accepted/declined
    completedAt: v.optional(v.number()), // When cards transferred
    expiresAt: v.number(), // Auto-expire after 7 days
  })
    .index('by_family', ['familyId'])
    .index('by_initiator', ['initiatorProfileId'])
    .index('by_recipient', ['recipientProfileId'])
    .index('by_status', ['status'])
    .index('by_family_and_status', ['familyId', 'status'])
    .index('by_recipient_and_status', ['recipientProfileId', 'status']),

  // ============================================================================
  // CACHED CARD DATA (for offline support and faster queries)
  // ============================================================================

  cachedSets: defineTable({
    setId: v.string(), // TCG API set ID (e.g., "sv1" for Pokemon, "LOB" for Yu-Gi-Oh!)
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ), // Links set to its game
    name: v.string(),
    series: v.string(),
    releaseDate: v.string(),
    totalCards: v.number(),
    logoUrl: v.optional(v.string()),
    symbolUrl: v.optional(v.string()),
    // Kid-friendly set filtering fields (January 2026)
    isInPrint: v.optional(v.boolean()), // Whether set is currently available at retail
    printStatus: v.optional(
      v.union(
        v.literal('current'), // Currently in print, widely available
        v.literal('limited'), // Limited availability, may be out of print soon
        v.literal('out_of_print'), // No longer in print at retail
        v.literal('vintage') // Vintage/collector sets (>5 years old)
      )
    ),
  })
    .index('by_set_id', ['setId'])
    .index('by_game', ['gameSlug'])
    .index('by_game_and_release', ['gameSlug', 'releaseDate'])
    .index('by_game_and_print_status', ['gameSlug', 'isInPrint']),

  cachedCards: defineTable({
    cardId: v.string(), // TCG API card ID (e.g., "sv1-1" for Pokemon, "LOB-001" for Yu-Gi-Oh!)
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana'),
      v.literal('mtg') // Legacy data - MTG no longer supported but data exists
    ), // Links card to its game
    setId: v.string(),
    name: v.string(),
    number: v.string(),
    supertype: v.string(), // Pokemon, Trainer, Energy (game-specific supertypes)
    subtypes: v.array(v.string()), // Basic, Stage 1, etc. (game-specific subtypes)
    types: v.array(v.string()), // Fire, Water, etc. (game-specific types/attributes)
    rarity: v.optional(v.string()),
    imageSmall: v.string(),
    imageLarge: v.string(),
    tcgPlayerUrl: v.optional(v.string()),
    priceMarket: v.optional(v.number()), // Optional pricing for parent view
    availableVariants: v.optional(v.array(v.string())), // Variant keys from tcgplayer.prices (e.g., "normal", "holofoil", "reverseHolofoil")
  })
    .index('by_card_id', ['cardId'])
    .index('by_set', ['setId'])
    .index('by_game', ['gameSlug'])
    .index('by_game_and_set', ['gameSlug', 'setId'])
    .index('by_rarity', ['rarity'])
    .index('by_game_and_rarity', ['gameSlug', 'rarity'])
    .index('by_set_and_rarity', ['setId', 'rarity']),

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

  // ============================================================================
  // AI USAGE TRACKING
  // ============================================================================

  /**
   * Tracks AI feature usage for rate limiting and cost monitoring
   * Each row represents a single AI API call
   */
  aiUsageLogs: defineTable({
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    featureType: v.union(
      v.literal('card_scan'), // AI Card Scanner
      v.literal('chat'), // Collection Chatbot
      v.literal('story'), // Card Storyteller
      v.literal('quiz'), // Quiz Generator
      v.literal('recommendation'), // Card Recommendations
      v.literal('trade_advisor'), // Trade Advisor
      v.literal('shopping_assistant'), // Shopping Assistant
      v.literal('condition_grading') // Condition Grading Tutor
    ),
    model: v.string(), // OpenAI model used (e.g., "gpt-4o", "gpt-4o-mini")
    inputTokens: v.number(), // Tokens in the prompt
    outputTokens: v.number(), // Tokens in the response
    estimatedCost: v.number(), // Estimated cost in USD (cents)
    gameSlug: v.optional(
      v.union(
        v.literal('pokemon'),
        v.literal('yugioh'),
        v.literal('onepiece'),
        v.literal('lorcana')
      )
    ), // Which game this AI call was for
    metadata: v.optional(v.any()), // Additional context (card ID, chat topic, etc.)
    timestamp: v.number(), // Unix timestamp
  })
    .index('by_profile', ['profileId'])
    .index('by_family', ['familyId'])
    .index('by_profile_and_feature', ['profileId', 'featureType'])
    .index('by_profile_feature_time', ['profileId', 'featureType', 'timestamp'])
    .index('by_timestamp', ['timestamp']),

  /**
   * Rate limit tracking for AI features
   * Aggregated counts per profile per time window
   */
  aiRateLimits: defineTable({
    profileId: v.id('profiles'),
    featureType: v.union(
      v.literal('card_scan'),
      v.literal('chat'),
      v.literal('story'),
      v.literal('quiz'),
      v.literal('recommendation'),
      v.literal('trade_advisor'),
      v.literal('shopping_assistant'),
      v.literal('condition_grading')
    ),
    windowStart: v.number(), // Unix timestamp of window start (hourly or daily)
    windowType: v.union(v.literal('hourly'), v.literal('daily')),
    count: v.number(), // Number of uses in this window
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_feature_window', ['profileId', 'featureType', 'windowType', 'windowStart']),

  /**
   * Chat conversation history for Collection Chatbot
   * Stores messages to maintain context across sessions
   */
  aiChatHistory: defineTable({
    profileId: v.id('profiles'),
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    content: v.string(),
    gameSlug: v.optional(
      v.union(
        v.literal('pokemon'),
        v.literal('yugioh'),
        v.literal('onepiece'),
        v.literal('lorcana')
      )
    ),
    timestamp: v.number(),
  })
    .index('by_profile', ['profileId'])
    .index('by_profile_and_time', ['profileId', 'timestamp']),

  // ============================================================================
  // PARENT NOTIFICATIONS
  // ============================================================================

  /**
   * Notifications for parents about their children's activity.
   * Used for in-app notification bell and activity summaries.
   */
  notifications: defineTable({
    familyId: v.id('families'), // Which family this notification belongs to
    profileId: v.optional(v.id('profiles')), // Optional: which child triggered this (for child-specific notifications)
    type: v.union(
      v.literal('achievement_earned'), // A child earned an achievement
      v.literal('milestone_reached'), // A child reached a collection milestone
      v.literal('streak_update'), // Streak started, maintained, or at risk
      v.literal('collection_activity'), // Daily summary of card additions
      v.literal('wishlist_update'), // New items added to wishlist
      v.literal('system') // System notifications (updates, tips, etc.)
    ),
    title: v.string(), // Short notification title
    message: v.string(), // Full notification message
    metadata: v.optional(v.any()), // Additional data (achievement key, card count, etc.)
    isRead: v.boolean(), // Whether the parent has seen this notification
    readAt: v.optional(v.number()), // Unix timestamp when marked as read
    createdAt: v.number(), // Unix timestamp when notification was created
  })
    .index('by_family', ['familyId'])
    .index('by_family_and_read', ['familyId', 'isRead'])
    .index('by_family_and_type', ['familyId', 'type'])
    .index('by_profile', ['profileId'])
    .index('by_created', ['createdAt']),

  /**
   * Parent notification preferences.
   * Controls which notifications parents want to receive.
   */
  notificationPreferences: defineTable({
    familyId: v.id('families'), // One preferences record per family
    achievementNotifications: v.boolean(), // Notify when children earn achievements
    milestoneNotifications: v.boolean(), // Notify when children reach milestones
    streakNotifications: v.boolean(), // Notify about streak updates
    dailySummary: v.boolean(), // Send daily activity summaries
    weeklySummary: v.boolean(), // Send weekly collection reports
    systemNotifications: v.boolean(), // Receive system updates and tips
    quietHoursEnabled: v.optional(v.boolean()), // Enable quiet hours
    quietHoursStart: v.optional(v.string()), // Start time (HH:MM format, e.g., "22:00")
    quietHoursEnd: v.optional(v.string()), // End time (HH:MM format, e.g., "07:00")
    updatedAt: v.number(), // Unix timestamp of last update
  }).index('by_family', ['familyId']),

  // ============================================================================
  // PROFILE-SPECIFIC SETTINGS
  // ============================================================================

  /**
   * Per-profile settings for child-specific preferences.
   * Allows different settings (like sleep schedules) for each child.
   */
  profileSettings: defineTable({
    profileId: v.id('profiles'), // One settings record per profile

    // Game Selection (per-profile)
    primaryGame: v.optional(
      v.union(
        v.literal('pokemon'),
        v.literal('yugioh'),
        v.literal('onepiece'),
        v.literal('lorcana')
      )
    ), // Currently selected primary game for this profile

    // Sleep Schedule (per-child)
    sleepEnabled: v.optional(v.boolean()), // Whether sleep mode is enabled
    sleepStartHour: v.optional(v.number()), // 0-23 (e.g., 20 = 8 PM)
    sleepStartMinute: v.optional(v.number()), // 0-59
    sleepEndHour: v.optional(v.number()), // 0-23 (e.g., 7 = 7 AM)
    sleepEndMinute: v.optional(v.number()), // 0-59
    sleepPinHash: v.optional(v.string()), // Hashed PIN to exit sleep mode

    // Collection Preferences
    variantAwareCompletion: v.optional(v.boolean()), // If true, count each variant separately for set completion (default: false = unique cards only)

    // Metadata
    updatedAt: v.number(), // Unix timestamp of last update
    updatedBy: v.optional(v.id('profiles')), // Which profile last updated settings
  }).index('by_profile', ['profileId']),
});
