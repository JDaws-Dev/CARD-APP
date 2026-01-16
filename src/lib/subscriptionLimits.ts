/**
 * Subscription limit utility functions for the CardDex app.
 * Pure functions that can be tested independently of Convex.
 *
 * Free tier limitations:
 * - Maximum 3 sets can be tracked in collection
 * - Maximum 1 child profile per family (+ 1 parent)
 *
 * Family tier (paid):
 * - Unlimited sets
 * - Up to 4 profiles per family (1 parent + up to 3 children)
 */

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionTier = 'free' | 'family';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt?: number; // Unix timestamp
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
  upgradeRequired: boolean;
}

export interface SubscriptionLimits {
  maxSets: number;
  maxChildProfiles: number;
  maxTotalProfiles: number;
  unlimitedSets: boolean;
}

export interface ProfileCounts {
  parent: number;
  child: number;
  total: number;
}

export interface SetUsage {
  setsUsed: number;
  setsRemaining: number;
  percentUsed: number;
  isAtLimit: boolean;
  isNearLimit: boolean; // Within 1 of limit
}

export interface ProfileUsage {
  childProfilesUsed: number;
  childProfilesRemaining: number;
  totalProfilesUsed: number;
  totalProfilesRemaining: number;
  isAtChildLimit: boolean;
  isAtTotalLimit: boolean;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  isExpired: boolean;
  daysUntilExpiration: number | null;
  limits: SubscriptionLimits;
}

export interface UpgradePrompt {
  show: boolean;
  title: string;
  message: string;
  feature: 'sets' | 'profiles';
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Free tier limits
 */
export const FREE_TIER_MAX_SETS = 3;
export const FREE_TIER_MAX_CHILD_PROFILES = 1;

/**
 * Family tier limits (paid subscription)
 */
export const FAMILY_TIER_MAX_SETS = Infinity; // Unlimited
export const FAMILY_TIER_MAX_CHILD_PROFILES = 3;

/**
 * Shared limits (apply to all tiers)
 */
export const MAX_PARENT_PROFILES = 1;
export const MAX_TOTAL_PROFILES = 4; // 1 parent + up to 3 children

/**
 * Tier display names
 */
export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free Plan',
  family: 'Family Plan',
};

/**
 * Tier feature descriptions
 */
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['Track up to 3 sets', '1 child profile', 'Basic collection tracking', 'Wishlist creation'],
  family: [
    'Unlimited sets',
    'Up to 3 child profiles',
    'Priority support',
    'Advanced analytics',
    'Trade value calculator',
    'Family activity feed',
  ],
};

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================

/**
 * Check if a subscription is active (not expired).
 */
export function isSubscriptionActive(subscription: SubscriptionInfo): boolean {
  if (subscription.tier === 'free') return true;
  if (!subscription.expiresAt) return true;
  return subscription.expiresAt > Date.now();
}

/**
 * Check if a subscription has expired.
 */
export function isSubscriptionExpired(subscription: SubscriptionInfo): boolean {
  if (subscription.tier === 'free') return false;
  if (!subscription.expiresAt) return false;
  return subscription.expiresAt <= Date.now();
}

/**
 * Get the effective subscription tier (falls back to free if expired).
 */
export function getEffectiveTier(subscription: SubscriptionInfo): SubscriptionTier {
  if (isSubscriptionExpired(subscription)) {
    return 'free';
  }
  return subscription.tier;
}

/**
 * Get days until subscription expiration.
 * Returns null for free tier or subscriptions without expiration.
 */
export function getDaysUntilExpiration(subscription: SubscriptionInfo): number | null {
  if (subscription.tier === 'free') return null;
  if (!subscription.expiresAt) return null;

  const msUntilExpiration = subscription.expiresAt - Date.now();
  if (msUntilExpiration <= 0) return 0;

  return Math.ceil(msUntilExpiration / (1000 * 60 * 60 * 24));
}

/**
 * Get full subscription status including limits.
 */
export function getSubscriptionStatus(subscription: SubscriptionInfo): SubscriptionStatus {
  const effectiveTier = getEffectiveTier(subscription);
  const isActive = isSubscriptionActive(subscription);
  const isExpired = isSubscriptionExpired(subscription);
  const daysUntilExpiration = getDaysUntilExpiration(subscription);
  const limits = getLimitsForTier(effectiveTier);

  return {
    tier: effectiveTier,
    isActive,
    isExpired,
    daysUntilExpiration,
    limits,
  };
}

// ============================================================================
// TIER LIMITS
// ============================================================================

/**
 * Get limits for a specific subscription tier.
 */
export function getLimitsForTier(tier: SubscriptionTier): SubscriptionLimits {
  if (tier === 'family') {
    return {
      maxSets: FAMILY_TIER_MAX_SETS,
      maxChildProfiles: FAMILY_TIER_MAX_CHILD_PROFILES,
      maxTotalProfiles: MAX_TOTAL_PROFILES,
      unlimitedSets: true,
    };
  }

  // Free tier (default)
  return {
    maxSets: FREE_TIER_MAX_SETS,
    maxChildProfiles: FREE_TIER_MAX_CHILD_PROFILES,
    maxTotalProfiles: MAX_PARENT_PROFILES + FREE_TIER_MAX_CHILD_PROFILES, // 2 (1 parent + 1 child)
    unlimitedSets: false,
  };
}

/**
 * Get limits for a subscription (handles expiration).
 */
export function getLimitsForSubscription(subscription: SubscriptionInfo): SubscriptionLimits {
  const effectiveTier = getEffectiveTier(subscription);
  return getLimitsForTier(effectiveTier);
}

// ============================================================================
// SET LIMIT CHECKING
// ============================================================================

/**
 * Check if a profile can add cards from a new set.
 */
export function canAddSet(
  subscription: SubscriptionInfo,
  currentSetCount: number
): LimitCheckResult {
  const limits = getLimitsForSubscription(subscription);

  if (limits.unlimitedSets) {
    return {
      allowed: true,
      currentCount: currentSetCount,
      maxAllowed: Infinity,
      upgradeRequired: false,
    };
  }

  const allowed = currentSetCount < limits.maxSets;

  return {
    allowed,
    reason: allowed
      ? undefined
      : `Free plan is limited to ${limits.maxSets} sets. Upgrade to Family Plan for unlimited sets.`,
    currentCount: currentSetCount,
    maxAllowed: limits.maxSets,
    upgradeRequired: !allowed,
  };
}

/**
 * Check if adding a card would exceed set limits.
 * Takes the set ID of the card being added and the current sets in collection.
 */
export function canAddCardFromSet(
  subscription: SubscriptionInfo,
  cardSetId: string,
  currentSetIds: string[]
): LimitCheckResult {
  const limits = getLimitsForSubscription(subscription);

  // If user already has cards from this set, it's always allowed
  if (currentSetIds.includes(cardSetId)) {
    return {
      allowed: true,
      currentCount: currentSetIds.length,
      maxAllowed: limits.unlimitedSets ? Infinity : limits.maxSets,
      upgradeRequired: false,
    };
  }

  // This is a new set - check if we can add it
  return canAddSet(subscription, currentSetIds.length);
}

/**
 * Get set usage information.
 */
export function getSetUsage(subscription: SubscriptionInfo, currentSetCount: number): SetUsage {
  const limits = getLimitsForSubscription(subscription);

  if (limits.unlimitedSets) {
    return {
      setsUsed: currentSetCount,
      setsRemaining: Infinity,
      percentUsed: 0, // Not applicable for unlimited
      isAtLimit: false,
      isNearLimit: false,
    };
  }

  const setsRemaining = Math.max(0, limits.maxSets - currentSetCount);
  const percentUsed = (currentSetCount / limits.maxSets) * 100;

  return {
    setsUsed: currentSetCount,
    setsRemaining,
    percentUsed,
    isAtLimit: currentSetCount >= limits.maxSets,
    isNearLimit: setsRemaining === 1,
  };
}

/**
 * Get sets that are allowed vs blocked for free tier.
 * Useful for UI to show which sets are available to add.
 */
export function categorizeSetsByLimit(
  subscription: SubscriptionInfo,
  currentSetIds: string[],
  availableSetIds: string[]
): { allowed: string[]; blocked: string[] } {
  const limits = getLimitsForSubscription(subscription);

  if (limits.unlimitedSets) {
    return {
      allowed: availableSetIds,
      blocked: [],
    };
  }

  const allowed: string[] = [];
  const blocked: string[] = [];

  for (const setId of availableSetIds) {
    if (currentSetIds.includes(setId)) {
      // Already have this set - always allowed
      allowed.push(setId);
    } else if (currentSetIds.length < limits.maxSets) {
      // Can add new sets
      allowed.push(setId);
    } else {
      // At limit - new sets are blocked
      blocked.push(setId);
    }
  }

  return { allowed, blocked };
}

// ============================================================================
// PROFILE LIMIT CHECKING
// ============================================================================

/**
 * Check if a family can add a child profile.
 */
export function canAddChildProfile(
  subscription: SubscriptionInfo,
  currentProfileCounts: ProfileCounts
): LimitCheckResult {
  const limits = getLimitsForSubscription(subscription);

  // Check total profile limit first
  if (currentProfileCounts.total >= limits.maxTotalProfiles) {
    return {
      allowed: false,
      reason: `Maximum of ${limits.maxTotalProfiles} profiles reached.`,
      currentCount: currentProfileCounts.child,
      maxAllowed: limits.maxChildProfiles,
      upgradeRequired: false, // Upgrading won't help if at total limit
    };
  }

  // Check child profile limit
  const allowed = currentProfileCounts.child < limits.maxChildProfiles;

  return {
    allowed,
    reason: allowed
      ? undefined
      : `Free plan is limited to ${limits.maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`,
    currentCount: currentProfileCounts.child,
    maxAllowed: limits.maxChildProfiles,
    upgradeRequired: !allowed && limits.maxChildProfiles < FAMILY_TIER_MAX_CHILD_PROFILES,
  };
}

/**
 * Check if a family can add a parent profile.
 */
export function canAddParentProfile(currentProfileCounts: ProfileCounts): LimitCheckResult {
  const allowed = currentProfileCounts.parent < MAX_PARENT_PROFILES;

  return {
    allowed,
    reason: allowed ? undefined : 'Only one parent profile allowed per family.',
    currentCount: currentProfileCounts.parent,
    maxAllowed: MAX_PARENT_PROFILES,
    upgradeRequired: false, // Upgrading doesn't increase parent limit
  };
}

/**
 * Get profile usage information.
 */
export function getProfileUsage(
  subscription: SubscriptionInfo,
  currentProfileCounts: ProfileCounts
): ProfileUsage {
  const limits = getLimitsForSubscription(subscription);

  return {
    childProfilesUsed: currentProfileCounts.child,
    childProfilesRemaining: Math.max(0, limits.maxChildProfiles - currentProfileCounts.child),
    totalProfilesUsed: currentProfileCounts.total,
    totalProfilesRemaining: Math.max(0, limits.maxTotalProfiles - currentProfileCounts.total),
    isAtChildLimit: currentProfileCounts.child >= limits.maxChildProfiles,
    isAtTotalLimit: currentProfileCounts.total >= limits.maxTotalProfiles,
  };
}

/**
 * Count profiles by type.
 */
export function countProfiles(
  profiles: Array<{ profileType?: 'parent' | 'child' }>
): ProfileCounts {
  let parent = 0;
  let child = 0;

  for (const profile of profiles) {
    if (profile.profileType === 'parent') {
      parent++;
    } else {
      // Default to child if not specified
      child++;
    }
  }

  return {
    parent,
    child,
    total: parent + child,
  };
}

// ============================================================================
// UPGRADE PROMPTS
// ============================================================================

/**
 * Get an upgrade prompt for set limits.
 */
export function getSetLimitUpgradePrompt(
  subscription: SubscriptionInfo,
  currentSetCount: number
): UpgradePrompt {
  const usage = getSetUsage(subscription, currentSetCount);

  if (usage.isAtLimit) {
    return {
      show: true,
      title: 'Set Limit Reached',
      message: `You've reached the ${FREE_TIER_MAX_SETS} set limit on the Free plan. Upgrade to Family Plan for unlimited sets!`,
      feature: 'sets',
    };
  }

  if (usage.isNearLimit) {
    return {
      show: true,
      title: 'Almost at Set Limit',
      message: `You have 1 set slot remaining on the Free plan. Upgrade to Family Plan for unlimited sets!`,
      feature: 'sets',
    };
  }

  return {
    show: false,
    title: '',
    message: '',
    feature: 'sets',
  };
}

/**
 * Get an upgrade prompt for profile limits.
 */
export function getProfileLimitUpgradePrompt(
  subscription: SubscriptionInfo,
  currentProfileCounts: ProfileCounts
): UpgradePrompt {
  const limits = getLimitsForSubscription(subscription);
  const usage = getProfileUsage(subscription, currentProfileCounts);

  if (usage.isAtChildLimit && limits.maxChildProfiles < FAMILY_TIER_MAX_CHILD_PROFILES) {
    return {
      show: true,
      title: 'Profile Limit Reached',
      message: `You've reached the ${FREE_TIER_MAX_CHILD_PROFILES} child profile limit on the Free plan. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles!`,
      feature: 'profiles',
    };
  }

  return {
    show: false,
    title: '',
    message: '',
    feature: 'profiles',
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the display name for a subscription tier.
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return TIER_DISPLAY_NAMES[tier];
}

/**
 * Get features for a subscription tier.
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  return TIER_FEATURES[tier];
}

/**
 * Format set usage for display.
 */
export function formatSetUsage(usage: SetUsage): string {
  if (usage.setsRemaining === Infinity) {
    return `${usage.setsUsed} sets (unlimited)`;
  }
  return `${usage.setsUsed}/${usage.setsUsed + usage.setsRemaining} sets`;
}

/**
 * Format profile usage for display.
 */
export function formatProfileUsage(usage: ProfileUsage): string {
  return `${usage.childProfilesUsed}/${usage.childProfilesUsed + usage.childProfilesRemaining} child profiles`;
}

/**
 * Get a color class for usage percentage.
 */
export function getUsageColorClass(percentUsed: number): string {
  if (percentUsed >= 100) return 'text-red-500';
  if (percentUsed >= 67) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Format subscription status for display.
 */
export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  if (status.tier === 'free') {
    return 'Free Plan';
  }

  if (status.isExpired) {
    return 'Subscription Expired';
  }

  if (status.daysUntilExpiration !== null && status.daysUntilExpiration <= 7) {
    return `Family Plan - Renews in ${status.daysUntilExpiration} day${status.daysUntilExpiration === 1 ? '' : 's'}`;
  }

  return 'Family Plan';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a subscription tier value.
 */
export function isValidTier(value: unknown): value is SubscriptionTier {
  return value === 'free' || value === 'family';
}

/**
 * Create a SubscriptionInfo object from family data.
 */
export function createSubscriptionInfo(
  tier: SubscriptionTier,
  expiresAt?: number
): SubscriptionInfo {
  return {
    tier,
    expiresAt,
  };
}

/**
 * Check if a feature is available for a subscription tier.
 */
export function isFeatureAvailable(
  subscription: SubscriptionInfo,
  feature: 'unlimitedSets' | 'multipleChildren'
): boolean {
  const effectiveTier = getEffectiveTier(subscription);
  const limits = getLimitsForTier(effectiveTier);

  switch (feature) {
    case 'unlimitedSets':
      return limits.unlimitedSets;
    case 'multipleChildren':
      return limits.maxChildProfiles > 1;
    default:
      return false;
  }
}

// ============================================================================
// SET ID EXTRACTION
// ============================================================================

/**
 * Extract set ID from a card ID.
 * Card IDs are in format "setId-number" (e.g., "sv1-1", "swsh12pt5-25").
 */
export function extractSetIdFromCardId(cardId: string): string {
  // Handle cards with multiple dashes in set ID (e.g., "swsh12pt5-25")
  const lastDashIndex = cardId.lastIndexOf('-');
  if (lastDashIndex === -1) return cardId;
  return cardId.substring(0, lastDashIndex);
}

/**
 * Get unique set IDs from a list of card IDs.
 */
export function getUniqueSetIds(cardIds: string[]): string[] {
  const setIds = new Set<string>();
  for (const cardId of cardIds) {
    setIds.add(extractSetIdFromCardId(cardId));
  }
  return Array.from(setIds);
}

/**
 * Count sets from a list of card IDs.
 */
export function countSetsFromCardIds(cardIds: string[]): number {
  return getUniqueSetIds(cardIds).length;
}
