import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Premium features that require a family subscription.
 * Each feature has an id, display name, and description.
 */
export const PREMIUM_FEATURES = {
  // Collection features
  UNLIMITED_SETS: {
    id: 'unlimited_sets',
    displayName: 'Unlimited Sets',
    description: 'Track cards from unlimited sets (Free plan: 3 sets)',
    category: 'collection',
  },
  MULTIPLE_CHILDREN: {
    id: 'multiple_children',
    displayName: 'Multiple Child Profiles',
    description: 'Create up to 3 child profiles (Free plan: 1 profile)',
    category: 'profiles',
  },

  // Trading features
  TRADE_CALCULATOR: {
    id: 'trade_calculator',
    displayName: 'Trade Value Calculator',
    description: 'Calculate fair trade values between cards',
    category: 'trading',
  },
  TRADE_HISTORY: {
    id: 'trade_history',
    displayName: 'Trade History',
    description: 'Track past trades and their values',
    category: 'trading',
  },

  // Wishlist features
  UNLIMITED_WISHLIST: {
    id: 'unlimited_wishlist',
    displayName: 'Unlimited Wishlist Items',
    description: 'Add unlimited cards to wishlist (Free plan: 50 items)',
    category: 'wishlist',
  },
  PRIORITY_ITEMS: {
    id: 'priority_items',
    displayName: 'Priority Wishlist Items',
    description: 'Mark up to 5 wishlist items as priority',
    category: 'wishlist',
  },
  SHAREABLE_WISHLIST: {
    id: 'shareable_wishlist',
    displayName: 'Shareable Wishlist Links',
    description: 'Generate public links to share your wishlist',
    category: 'wishlist',
  },

  // Analytics features
  COLLECTION_VALUE: {
    id: 'collection_value',
    displayName: 'Collection Value Tracking',
    description: 'See estimated market value of your collection',
    category: 'analytics',
  },
  PRICE_HISTORY: {
    id: 'price_history',
    displayName: 'Price History Charts',
    description: 'Track card price changes over time',
    category: 'analytics',
  },

  // Parent features
  FAMILY_DASHBOARD: {
    id: 'family_dashboard',
    displayName: 'Family Dashboard',
    description: 'View activity across all family profiles',
    category: 'parent',
  },
  DUPLICATE_FINDER: {
    id: 'duplicate_finder',
    displayName: 'Family Duplicate Finder',
    description: 'Find duplicate cards across family members for trading',
    category: 'parent',
  },

  // Advanced features
  MULTI_TCG: {
    id: 'multi_tcg',
    displayName: 'Multiple TCG Support',
    description: 'Track collections for Yu-Gi-Oh!, Magic, One Piece, and more',
    category: 'advanced',
  },
  EXPORT_DATA: {
    id: 'export_data',
    displayName: 'Export Collection Data',
    description: 'Export your collection as CSV or JSON',
    category: 'advanced',
  },
  IMPORT_DATA: {
    id: 'import_data',
    displayName: 'Import Collection Data',
    description: 'Import collections from other apps',
    category: 'advanced',
  },
} as const;

/**
 * Features available on free tier (accessible to everyone).
 */
export const FREE_TIER_FEATURES: Set<string> = new Set([
  PREMIUM_FEATURES.PRIORITY_ITEMS.id,
  PREMIUM_FEATURES.SHAREABLE_WISHLIST.id,
]);

/**
 * Free tier limits.
 */
export const FREE_TIER_LIMITS = {
  maxSets: 3,
  maxChildProfiles: 1,
  maxWishlistItems: 50,
  maxGames: 1, // Pokemon only
} as const;

/**
 * Family tier limits.
 */
export const FAMILY_TIER_LIMITS = {
  maxSets: Infinity,
  maxChildProfiles: 3,
  maxWishlistItems: Infinity,
  maxGames: 7, // All TCGs
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type PremiumFeatureId = (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES]['id'];
export type SubscriptionTier = 'free' | 'family';
export type FeatureCategory =
  | 'collection'
  | 'profiles'
  | 'trading'
  | 'wishlist'
  | 'analytics'
  | 'parent'
  | 'advanced';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a subscription is currently active (not expired).
 */
function isSubscriptionActive(tier: SubscriptionTier, expiresAt: number | undefined): boolean {
  if (tier === 'free') return true;
  if (!expiresAt) return true; // No expiration = active
  return expiresAt > Date.now();
}

/**
 * Get the effective subscription tier (falls back to free if expired).
 */
function getEffectiveTier(tier: SubscriptionTier, expiresAt: number | undefined): SubscriptionTier {
  if (tier === 'family' && expiresAt && expiresAt <= Date.now()) {
    return 'free';
  }
  return tier;
}

/**
 * Check if a feature is available for a given tier.
 */
function isFeatureAvailableForTier(featureId: string, tier: SubscriptionTier): boolean {
  // Free tier features are available to everyone
  if (FREE_TIER_FEATURES.has(featureId)) {
    return true;
  }
  // All other premium features require family tier
  return tier === 'family';
}

/**
 * Get days until subscription expires.
 * Returns null for free tier or no expiration.
 */
function getDaysUntilExpiration(expiresAt: number | undefined): number | null {
  if (!expiresAt) return null;
  const msRemaining = expiresAt - Date.now();
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
}

/**
 * Get all premium feature objects.
 */
function getAllPremiumFeatures() {
  return Object.values(PREMIUM_FEATURES);
}

/**
 * Get features by category.
 */
function getFeaturesByCategory(category: FeatureCategory) {
  return getAllPremiumFeatures().filter((f) => f.category === category);
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Check if a specific premium feature is available for a profile.
 * Returns access status and upgrade information.
 */
export const checkFeatureAccess = query({
  args: {
    profileId: v.id('profiles'),
    featureId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        hasAccess: false,
        reason: 'Profile not found',
        upgradeRequired: true,
      };
    }

    // Get family
    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return {
        hasAccess: false,
        reason: 'Family not found',
        upgradeRequired: true,
      };
    }

    // Get effective tier
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const hasAccess = isFeatureAvailableForTier(args.featureId, effectiveTier);

    if (hasAccess) {
      return {
        hasAccess: true,
        tier: effectiveTier,
        expiresAt: family.subscriptionExpiresAt,
        daysRemaining: getDaysUntilExpiration(family.subscriptionExpiresAt),
      };
    }

    // Find the feature for better error messaging
    const feature = getAllPremiumFeatures().find((f) => f.id === args.featureId);

    return {
      hasAccess: false,
      reason: feature
        ? `${feature.displayName} requires a Family subscription`
        : 'This feature requires a Family subscription',
      upgradeRequired: true,
      featureInfo: feature,
      currentTier: effectiveTier,
    };
  },
});

/**
 * Check multiple premium features at once.
 * Useful for loading feature access states on app initialization.
 */
export const checkMultipleFeatureAccess = query({
  args: {
    profileId: v.id('profiles'),
    featureIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        accessMap: {},
        tier: 'free' as const,
        isActive: false,
        error: 'Profile not found',
      };
    }

    // Get family
    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return {
        accessMap: {},
        tier: 'free' as const,
        isActive: false,
        error: 'Family not found',
      };
    }

    // Get effective tier
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);

    // Build access map
    const accessMap: Record<string, boolean> = {};
    for (const featureId of args.featureIds) {
      accessMap[featureId] = isFeatureAvailableForTier(featureId, effectiveTier);
    }

    return {
      accessMap,
      tier: effectiveTier,
      isActive: isSubscriptionActive(family.subscriptionTier, family.subscriptionExpiresAt),
      expiresAt: family.subscriptionExpiresAt,
      daysRemaining: getDaysUntilExpiration(family.subscriptionExpiresAt),
    };
  },
});

/**
 * Get complete subscription status for a family.
 * Returns tier, limits, and all feature access states.
 */
export const getSubscriptionStatus = query({
  args: {
    familyId: v.id('families'),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return null;
    }

    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const isActive = isSubscriptionActive(family.subscriptionTier, family.subscriptionExpiresAt);
    const daysRemaining = getDaysUntilExpiration(family.subscriptionExpiresAt);

    // Get limits for effective tier
    const limits = effectiveTier === 'family' ? FAMILY_TIER_LIMITS : FREE_TIER_LIMITS;

    // Build feature access map for all features
    const featureAccess: Record<string, boolean> = {};
    for (const feature of getAllPremiumFeatures()) {
      featureAccess[feature.id] = isFeatureAvailableForTier(feature.id, effectiveTier);
    }

    return {
      // Subscription info
      tier: effectiveTier,
      storedTier: family.subscriptionTier,
      isActive,
      expiresAt: family.subscriptionExpiresAt,
      daysRemaining,
      isExpiringSoon: daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0,
      isExpired: family.subscriptionTier === 'family' && !isActive,

      // Limits
      limits: {
        maxSets: limits.maxSets === Infinity ? -1 : limits.maxSets, // -1 indicates unlimited
        maxChildProfiles: limits.maxChildProfiles,
        maxWishlistItems: limits.maxWishlistItems === Infinity ? -1 : limits.maxWishlistItems,
        maxGames: limits.maxGames,
        unlimitedSets: limits.maxSets === Infinity,
        unlimitedWishlist: limits.maxWishlistItems === Infinity,
      },

      // Feature access
      featureAccess,

      // Upgrade info
      canUpgrade: effectiveTier === 'free',
      upgradePrompt:
        effectiveTier === 'free'
          ? 'Upgrade to Family Plan for unlimited sets, multiple child profiles, and more!'
          : null,
    };
  },
});

/**
 * Get subscription status by profile ID (convenience wrapper).
 */
export const getSubscriptionStatusByProfile = query({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return null;
    }

    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const isActive = isSubscriptionActive(family.subscriptionTier, family.subscriptionExpiresAt);
    const daysRemaining = getDaysUntilExpiration(family.subscriptionExpiresAt);
    const limits = effectiveTier === 'family' ? FAMILY_TIER_LIMITS : FREE_TIER_LIMITS;

    return {
      profileId: args.profileId,
      familyId: profile.familyId,
      tier: effectiveTier,
      isActive,
      expiresAt: family.subscriptionExpiresAt,
      daysRemaining,
      isExpiringSoon: daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0,
      limits: {
        maxSets: limits.maxSets === Infinity ? -1 : limits.maxSets,
        maxChildProfiles: limits.maxChildProfiles,
        maxWishlistItems: limits.maxWishlistItems === Infinity ? -1 : limits.maxWishlistItems,
        maxGames: limits.maxGames,
      },
    };
  },
});

/**
 * Get all premium features with their access status for display.
 */
export const getPremiumFeaturesWithAccess = query({
  args: {
    familyId: v.id('families'),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return { features: [], tier: 'free' as const };
    }

    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);

    const features = getAllPremiumFeatures().map((feature) => ({
      ...feature,
      hasAccess: isFeatureAvailableForTier(feature.id, effectiveTier),
      requiresUpgrade: !isFeatureAvailableForTier(feature.id, effectiveTier),
    }));

    // Group by category
    const byCategory: Record<string, typeof features> = {};
    for (const feature of features) {
      if (!byCategory[feature.category]) {
        byCategory[feature.category] = [];
      }
      byCategory[feature.category].push(feature);
    }

    return {
      features,
      byCategory,
      tier: effectiveTier,
      totalFeatures: features.length,
      accessibleFeatures: features.filter((f) => f.hasAccess).length,
      lockedFeatures: features.filter((f) => !f.hasAccess).length,
    };
  },
});

/**
 * Validate access before performing a premium action.
 * Use this in mutations to gate premium features.
 */
export const validatePremiumAccess = query({
  args: {
    profileId: v.id('profiles'),
    featureId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        allowed: false,
        error: 'Profile not found',
        errorCode: 'PROFILE_NOT_FOUND',
      };
    }

    // Get family
    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return {
        allowed: false,
        error: 'Family not found',
        errorCode: 'FAMILY_NOT_FOUND',
      };
    }

    // Get effective tier
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const hasAccess = isFeatureAvailableForTier(args.featureId, effectiveTier);

    if (!hasAccess) {
      const feature = getAllPremiumFeatures().find((f) => f.id === args.featureId);
      return {
        allowed: false,
        error: feature
          ? `${feature.displayName} requires a Family subscription. Upgrade to unlock this feature.`
          : 'This feature requires a Family subscription.',
        errorCode: 'SUBSCRIPTION_REQUIRED',
        requiredTier: 'family',
        currentTier: effectiveTier,
        featureId: args.featureId,
        featureName: feature?.displayName,
      };
    }

    return {
      allowed: true,
      tier: effectiveTier,
    };
  },
});

/**
 * Get subscription comparison for upgrade flow.
 * Shows what user gains by upgrading.
 */
export const getSubscriptionComparison = query({
  args: {},
  handler: async () => {
    const allFeatures = getAllPremiumFeatures();
    const freeFeatureIds = Array.from(FREE_TIER_FEATURES);

    const freeFeatures = allFeatures.filter((f) => freeFeatureIds.includes(f.id));
    const familyOnlyFeatures = allFeatures.filter((f) => !freeFeatureIds.includes(f.id));

    return {
      tiers: [
        {
          tier: 'free' as const,
          displayName: 'Free',
          price: 0,
          billingPeriod: null,
          limits: FREE_TIER_LIMITS,
          features: freeFeatures,
          featureCount: freeFeatures.length,
        },
        {
          tier: 'family' as const,
          displayName: 'Family',
          price: 4.99,
          billingPeriod: 'month',
          annualPrice: 39.99,
          limits: {
            ...FAMILY_TIER_LIMITS,
            maxSets: -1, // -1 = unlimited for display
            maxWishlistItems: -1,
          },
          features: allFeatures,
          featureCount: allFeatures.length,
          additionalFeatures: familyOnlyFeatures,
        },
      ],
      upgradeHighlights: [
        'Unlimited sets to track',
        'Up to 3 child profiles',
        'Trade value calculator',
        'Collection value tracking',
        'Multi-TCG support (7 games)',
        'Export your collection data',
      ],
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Record a feature access attempt for analytics.
 * Can be used to track which premium features users try to access.
 */
export const recordFeatureAccessAttempt = mutation({
  args: {
    profileId: v.id('profiles'),
    featureId: v.string(),
    wasBlocked: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get profile to validate
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { recorded: false };
    }

    // Log to activity logs if blocked (for future analytics)
    if (args.wasBlocked) {
      await ctx.db.insert('activityLogs', {
        profileId: args.profileId,
        action: 'card_removed', // Using existing action type for now
        metadata: {
          type: 'feature_access_blocked',
          featureId: args.featureId,
          timestamp: Date.now(),
        },
      });
    }

    return { recorded: true };
  },
});

/**
 * Require premium access - throws error if not available.
 * Use this helper in other mutations to gate premium features.
 */
export const requirePremiumFeature = mutation({
  args: {
    profileId: v.id('profiles'),
    featureId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get family
    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Get effective tier
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const hasAccess = isFeatureAvailableForTier(args.featureId, effectiveTier);

    if (!hasAccess) {
      const feature = getAllPremiumFeatures().find((f) => f.id === args.featureId);
      throw new Error(
        feature
          ? `${feature.displayName} requires a Family subscription. Upgrade to unlock this feature.`
          : 'This feature requires a Family subscription.'
      );
    }

    return {
      allowed: true,
      tier: effectiveTier,
      familyId: profile.familyId,
    };
  },
});
