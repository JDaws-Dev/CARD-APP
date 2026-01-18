import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Free tier limits
 */
const FREE_TIER_MAX_SETS = 3;
const FREE_TIER_MAX_CHILD_PROFILES = 1;

/**
 * Family tier limits (paid subscription)
 */
const FAMILY_TIER_MAX_CHILD_PROFILES = 3;

/**
 * Shared limits (apply to all tiers)
 */
const MAX_PARENT_PROFILES = 1;
const MAX_TOTAL_PROFILES = 4; // 1 parent + up to 3 children

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a subscription is active (not expired).
 */
function isSubscriptionActive(tier: 'free' | 'family', expiresAt: number | undefined): boolean {
  if (tier === 'free') return true;
  if (!expiresAt) return true;
  return expiresAt > Date.now();
}

/**
 * Get the effective subscription tier (falls back to free if expired).
 */
function getEffectiveTier(
  tier: 'free' | 'family',
  expiresAt: number | undefined
): 'free' | 'family' {
  if (tier === 'family' && expiresAt && expiresAt <= Date.now()) {
    return 'free';
  }
  return tier;
}

/**
 * Get limits for a subscription tier.
 */
function getLimitsForTier(tier: 'free' | 'family'): {
  maxSets: number;
  maxChildProfiles: number;
  maxTotalProfiles: number;
  unlimitedSets: boolean;
} {
  if (tier === 'family') {
    return {
      maxSets: Infinity,
      maxChildProfiles: FAMILY_TIER_MAX_CHILD_PROFILES,
      maxTotalProfiles: MAX_TOTAL_PROFILES,
      unlimitedSets: true,
    };
  }

  // Free tier
  return {
    maxSets: FREE_TIER_MAX_SETS,
    maxChildProfiles: FREE_TIER_MAX_CHILD_PROFILES,
    maxTotalProfiles: MAX_PARENT_PROFILES + FREE_TIER_MAX_CHILD_PROFILES,
    unlimitedSets: false,
  };
}

/**
 * Extract set ID from a card ID.
 */
function extractSetIdFromCardId(cardId: string): string {
  const lastDashIndex = cardId.lastIndexOf('-');
  if (lastDashIndex === -1) return cardId;
  return cardId.substring(0, lastDashIndex);
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get subscription limits for a family.
 * Returns current limits based on subscription tier and expiration.
 */
export const getSubscriptionLimits = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return null;
    }

    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    return {
      tier: effectiveTier,
      isSubscriptionActive: isSubscriptionActive(
        family.subscriptionTier,
        family.subscriptionExpiresAt
      ),
      expiresAt: family.subscriptionExpiresAt,
      limits,
    };
  },
});

/**
 * Get current set usage for a profile.
 * Returns how many sets are being used and if more can be added.
 */
export const getSetUsage = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get profile and family
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return null;
    }

    // Get effective tier and limits
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    // Get unique sets in collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueSetIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueSetIds.add(extractSetIdFromCardId(card.cardId));
    }

    const setsUsed = uniqueSetIds.size;
    const setsRemaining = limits.unlimitedSets ? Infinity : Math.max(0, limits.maxSets - setsUsed);

    return {
      setsUsed,
      setsRemaining,
      maxSets: limits.maxSets,
      isAtLimit: !limits.unlimitedSets && setsUsed >= limits.maxSets,
      isNearLimit: !limits.unlimitedSets && setsRemaining === 1,
      unlimitedSets: limits.unlimitedSets,
      currentSetIds: Array.from(uniqueSetIds),
      tier: effectiveTier,
    };
  },
});

/**
 * Get current profile usage for a family.
 * Returns how many profiles exist and if more can be added.
 */
export const getProfileUsage = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return null;
    }

    // Get effective tier and limits
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    // Get all profiles for this family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Count by type
    let parentCount = 0;
    let childCount = 0;
    for (const profile of profiles) {
      if (profile.profileType === 'parent') {
        parentCount++;
      } else {
        childCount++;
      }
    }

    const totalCount = parentCount + childCount;

    return {
      parentProfilesUsed: parentCount,
      childProfilesUsed: childCount,
      totalProfilesUsed: totalCount,
      maxParentProfiles: MAX_PARENT_PROFILES,
      maxChildProfiles: limits.maxChildProfiles,
      maxTotalProfiles: limits.maxTotalProfiles,
      childProfilesRemaining: Math.max(0, limits.maxChildProfiles - childCount),
      totalProfilesRemaining: Math.max(0, limits.maxTotalProfiles - totalCount),
      canAddParent: parentCount < MAX_PARENT_PROFILES && totalCount < limits.maxTotalProfiles,
      canAddChild: childCount < limits.maxChildProfiles && totalCount < limits.maxTotalProfiles,
      isAtChildLimit: childCount >= limits.maxChildProfiles,
      isAtTotalLimit: totalCount >= limits.maxTotalProfiles,
      tier: effectiveTier,
    };
  },
});

/**
 * Check if a profile can add a card from a specific set.
 * Returns whether the action is allowed and why if not.
 */
export const canAddCardFromSet = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get profile and family
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { allowed: false, reason: 'Profile not found' };
    }

    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return { allowed: false, reason: 'Family not found' };
    }

    // Get effective tier and limits
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    // Unlimited sets - always allowed
    if (limits.unlimitedSets) {
      return { allowed: true };
    }

    // Get unique sets in collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueSetIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueSetIds.add(extractSetIdFromCardId(card.cardId));
    }

    // Already have this set - always allowed
    if (uniqueSetIds.has(args.setId)) {
      return { allowed: true };
    }

    // Check if we can add a new set
    if (uniqueSetIds.size >= limits.maxSets) {
      return {
        allowed: false,
        reason: `Free plan is limited to ${limits.maxSets} sets. Upgrade to Family Plan for unlimited sets.`,
        upgradeRequired: true,
        currentSetCount: uniqueSetIds.size,
        maxSets: limits.maxSets,
      };
    }

    return { allowed: true };
  },
});

/**
 * Check if a family can add a child profile.
 * Returns whether the action is allowed and why if not.
 */
export const canAddChildProfileQuery = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return { allowed: false, reason: 'Family not found' };
    }

    // Get effective tier and limits
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    // Get all profiles for this family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Count by type
    let childCount = 0;
    let totalCount = 0;
    for (const profile of profiles) {
      totalCount++;
      if (profile.profileType !== 'parent') {
        childCount++;
      }
    }

    // Check total limit first
    if (totalCount >= limits.maxTotalProfiles) {
      return {
        allowed: false,
        reason: `Maximum of ${limits.maxTotalProfiles} profiles reached.`,
        upgradeRequired: false,
        currentChildCount: childCount,
        maxChildProfiles: limits.maxChildProfiles,
      };
    }

    // Check child limit
    if (childCount >= limits.maxChildProfiles) {
      return {
        allowed: false,
        reason: `Free plan is limited to ${limits.maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`,
        upgradeRequired: true,
        currentChildCount: childCount,
        maxChildProfiles: limits.maxChildProfiles,
      };
    }

    return { allowed: true };
  },
});

/**
 * Get upgrade prompt information if user is at or near limits.
 */
export const getUpgradePrompts = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { showSetPrompt: false, showProfilePrompt: false };
    }

    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      return { showSetPrompt: false, showProfilePrompt: false };
    }

    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);

    // Already on family tier - no prompts needed
    if (effectiveTier === 'family') {
      return { showSetPrompt: false, showProfilePrompt: false };
    }

    const limits = getLimitsForTier(effectiveTier);

    // Check set usage
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueSetIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueSetIds.add(extractSetIdFromCardId(card.cardId));
    }

    const setsUsed = uniqueSetIds.size;
    const setsRemaining = limits.maxSets - setsUsed;

    // Check profile usage
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', profile.familyId))
      .collect();

    let childCount = 0;
    for (const p of profiles) {
      if (p.profileType !== 'parent') {
        childCount++;
      }
    }

    const setPrompt = {
      show: setsRemaining <= 1,
      isAtLimit: setsRemaining <= 0,
      isNearLimit: setsRemaining === 1,
      title: setsRemaining <= 0 ? 'Set Limit Reached' : 'Almost at Set Limit',
      message:
        setsRemaining <= 0
          ? `You've reached the ${FREE_TIER_MAX_SETS} set limit on the Free plan. Upgrade to Family Plan for unlimited sets!`
          : `You have 1 set slot remaining on the Free plan. Upgrade to Family Plan for unlimited sets!`,
    };

    const profilePrompt = {
      show: childCount >= limits.maxChildProfiles,
      isAtLimit: childCount >= limits.maxChildProfiles,
      title: 'Profile Limit Reached',
      message: `You've reached the ${FREE_TIER_MAX_CHILD_PROFILES} child profile limit on the Free plan. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles!`,
    };

    return {
      showSetPrompt: setPrompt.show,
      setPrompt,
      showProfilePrompt: profilePrompt.show,
      profilePrompt,
      tier: effectiveTier,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Validate and add a card to collection with set limit enforcement.
 * This is a wrapper mutation that checks limits before adding.
 */
export const addCardWithLimitCheck = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    quantity: v.optional(v.number()),
    variant: v.optional(v.string()), // Supports all game variants
  },
  handler: async (ctx, args) => {
    // Get profile and family
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const family = await ctx.db.get(profile.familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Get effective tier and limits
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    // Extract set ID from card ID
    const setId = extractSetIdFromCardId(args.cardId);

    // If not unlimited, check set limits
    if (!limits.unlimitedSets) {
      // Get unique sets in collection
      const collectionCards = await ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
        .collect();

      const uniqueSetIds = new Set<string>();
      for (const card of collectionCards) {
        uniqueSetIds.add(extractSetIdFromCardId(card.cardId));
      }

      // Check if this is a new set and if we're at the limit
      if (!uniqueSetIds.has(setId) && uniqueSetIds.size >= limits.maxSets) {
        throw new Error(
          `Set limit reached. Free plan is limited to ${limits.maxSets} sets. Upgrade to Family Plan for unlimited sets.`
        );
      }
    }

    // Check if card already exists with this variant
    const variant = args.variant ?? 'normal';
    const existing = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_card_variant', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId).eq('variant', variant)
      )
      .first();

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + (args.quantity ?? 1);
      await ctx.db.patch(existing._id, { quantity: newQuantity });
      return { cardId: existing._id, action: 'updated', quantity: newQuantity };
    }

    // Insert new card
    const cardDocId = await ctx.db.insert('collectionCards', {
      profileId: args.profileId,
      cardId: args.cardId,
      quantity: args.quantity ?? 1,
      variant,
    });

    return { cardId: cardDocId, action: 'added', quantity: args.quantity ?? 1 };
  },
});

/**
 * Create a child profile with limit enforcement.
 * This is a wrapper mutation that checks limits before creating.
 */
export const createChildProfileWithLimitCheck = mutation({
  args: {
    familyId: v.id('families'),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Get effective tier and limits
    const effectiveTier = getEffectiveTier(family.subscriptionTier, family.subscriptionExpiresAt);
    const limits = getLimitsForTier(effectiveTier);

    // Get all profiles for this family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Count by type
    let childCount = 0;
    let totalCount = 0;
    for (const profile of profiles) {
      totalCount++;
      if (profile.profileType !== 'parent') {
        childCount++;
      }
    }

    // Check total limit first
    if (totalCount >= limits.maxTotalProfiles) {
      throw new Error(`Maximum of ${limits.maxTotalProfiles} profiles reached.`);
    }

    // Check child limit
    if (childCount >= limits.maxChildProfiles) {
      throw new Error(
        `Child profile limit reached. Free plan is limited to ${limits.maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`
      );
    }

    // Create the profile
    const profileId = await ctx.db.insert('profiles', {
      familyId: args.familyId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      profileType: 'child',
    });

    return { profileId, childCount: childCount + 1, maxChildProfiles: limits.maxChildProfiles };
  },
});
