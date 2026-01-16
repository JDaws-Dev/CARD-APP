import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  // Constants
  FREE_TIER_MAX_SETS,
  FREE_TIER_MAX_CHILD_PROFILES,
  FAMILY_TIER_MAX_SETS,
  FAMILY_TIER_MAX_CHILD_PROFILES,
  MAX_PARENT_PROFILES,
  MAX_TOTAL_PROFILES,
  TIER_DISPLAY_NAMES,
  TIER_FEATURES,
  // Types
  SubscriptionTier,
  SubscriptionInfo,
  LimitCheckResult,
  SubscriptionLimits,
  ProfileCounts,
  SetUsage,
  ProfileUsage,
  SubscriptionStatus,
  UpgradePrompt,
  // Subscription status functions
  isSubscriptionActive,
  isSubscriptionExpired,
  getEffectiveTier,
  getDaysUntilExpiration,
  getSubscriptionStatus,
  // Tier limit functions
  getLimitsForTier,
  getLimitsForSubscription,
  // Set limit checking
  canAddSet,
  canAddCardFromSet,
  getSetUsage,
  categorizeSetsByLimit,
  // Profile limit checking
  canAddChildProfile,
  canAddParentProfile,
  getProfileUsage,
  countProfiles,
  // Upgrade prompts
  getSetLimitUpgradePrompt,
  getProfileLimitUpgradePrompt,
  // Display helpers
  getTierDisplayName,
  getTierFeatures,
  formatSetUsage,
  formatProfileUsage,
  getUsageColorClass,
  formatSubscriptionStatus,
  // Validation helpers
  isValidTier,
  createSubscriptionInfo,
  isFeatureAvailable,
  // Set ID extraction
  extractSetIdFromCardId,
  getUniqueSetIds,
  countSetsFromCardIds,
} from '../subscriptionLimits';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createFreeSubscription(): SubscriptionInfo {
  return { tier: 'free' };
}

function createFamilySubscription(expiresAt?: number): SubscriptionInfo {
  return { tier: 'family', expiresAt };
}

function createExpiredFamilySubscription(): SubscriptionInfo {
  return { tier: 'family', expiresAt: Date.now() - 1000 }; // Expired 1 second ago
}

function createProfileCounts(parent: number, child: number): ProfileCounts {
  return { parent, child, total: parent + child };
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Subscription Limit Constants', () => {
  describe('Tier limits', () => {
    it('should have FREE_TIER_MAX_SETS = 3', () => {
      expect(FREE_TIER_MAX_SETS).toBe(3);
    });

    it('should have FREE_TIER_MAX_CHILD_PROFILES = 1', () => {
      expect(FREE_TIER_MAX_CHILD_PROFILES).toBe(1);
    });

    it('should have FAMILY_TIER_MAX_SETS = Infinity', () => {
      expect(FAMILY_TIER_MAX_SETS).toBe(Infinity);
    });

    it('should have FAMILY_TIER_MAX_CHILD_PROFILES = 3', () => {
      expect(FAMILY_TIER_MAX_CHILD_PROFILES).toBe(3);
    });

    it('should have MAX_PARENT_PROFILES = 1', () => {
      expect(MAX_PARENT_PROFILES).toBe(1);
    });

    it('should have MAX_TOTAL_PROFILES = 4', () => {
      expect(MAX_TOTAL_PROFILES).toBe(4);
    });
  });

  describe('Display names', () => {
    it('should have correct tier display names', () => {
      expect(TIER_DISPLAY_NAMES.free).toBe('Free Plan');
      expect(TIER_DISPLAY_NAMES.family).toBe('Family Plan');
    });
  });

  describe('Feature lists', () => {
    it('should have features for free tier', () => {
      expect(TIER_FEATURES.free).toContain('Track up to 3 sets');
      expect(TIER_FEATURES.free).toContain('1 child profile');
    });

    it('should have features for family tier', () => {
      expect(TIER_FEATURES.family).toContain('Unlimited sets');
      expect(TIER_FEATURES.family).toContain('Up to 3 child profiles');
    });

    it('should have more features for family tier', () => {
      expect(TIER_FEATURES.family.length).toBeGreaterThan(TIER_FEATURES.free.length);
    });
  });
});

// ============================================================================
// SUBSCRIPTION STATUS TESTS
// ============================================================================

describe('isSubscriptionActive', () => {
  it('should return true for free tier', () => {
    expect(isSubscriptionActive(createFreeSubscription())).toBe(true);
  });

  it('should return true for family tier without expiration', () => {
    expect(isSubscriptionActive(createFamilySubscription())).toBe(true);
  });

  it('should return true for family tier with future expiration', () => {
    const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
    expect(isSubscriptionActive(createFamilySubscription(futureDate))).toBe(true);
  });

  it('should return false for expired family tier', () => {
    expect(isSubscriptionActive(createExpiredFamilySubscription())).toBe(false);
  });
});

describe('isSubscriptionExpired', () => {
  it('should return false for free tier', () => {
    expect(isSubscriptionExpired(createFreeSubscription())).toBe(false);
  });

  it('should return false for family tier without expiration', () => {
    expect(isSubscriptionExpired(createFamilySubscription())).toBe(false);
  });

  it('should return false for family tier with future expiration', () => {
    const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    expect(isSubscriptionExpired(createFamilySubscription(futureDate))).toBe(false);
  });

  it('should return true for expired family tier', () => {
    expect(isSubscriptionExpired(createExpiredFamilySubscription())).toBe(true);
  });
});

describe('getEffectiveTier', () => {
  it('should return "free" for free tier', () => {
    expect(getEffectiveTier(createFreeSubscription())).toBe('free');
  });

  it('should return "family" for active family subscription', () => {
    expect(getEffectiveTier(createFamilySubscription())).toBe('family');
  });

  it('should return "free" for expired family subscription', () => {
    expect(getEffectiveTier(createExpiredFamilySubscription())).toBe('free');
  });
});

describe('getDaysUntilExpiration', () => {
  it('should return null for free tier', () => {
    expect(getDaysUntilExpiration(createFreeSubscription())).toBeNull();
  });

  it('should return null for family tier without expiration', () => {
    expect(getDaysUntilExpiration(createFamilySubscription())).toBeNull();
  });

  it('should return 0 for expired subscription', () => {
    expect(getDaysUntilExpiration(createExpiredFamilySubscription())).toBe(0);
  });

  it('should return correct days for future expiration', () => {
    const daysFromNow = 10;
    const futureDate = Date.now() + daysFromNow * 24 * 60 * 60 * 1000;
    expect(getDaysUntilExpiration(createFamilySubscription(futureDate))).toBe(daysFromNow);
  });

  it('should round up partial days', () => {
    // 1.5 days from now
    const futureDate = Date.now() + 1.5 * 24 * 60 * 60 * 1000;
    expect(getDaysUntilExpiration(createFamilySubscription(futureDate))).toBe(2);
  });
});

describe('getSubscriptionStatus', () => {
  it('should return complete status for free tier', () => {
    const status = getSubscriptionStatus(createFreeSubscription());
    expect(status.tier).toBe('free');
    expect(status.isActive).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.daysUntilExpiration).toBeNull();
    expect(status.limits.unlimitedSets).toBe(false);
  });

  it('should return complete status for family tier', () => {
    const status = getSubscriptionStatus(createFamilySubscription());
    expect(status.tier).toBe('family');
    expect(status.isActive).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.limits.unlimitedSets).toBe(true);
  });

  it('should fall back to free limits for expired subscription', () => {
    const status = getSubscriptionStatus(createExpiredFamilySubscription());
    expect(status.tier).toBe('free');
    expect(status.isExpired).toBe(true);
    expect(status.limits.maxSets).toBe(FREE_TIER_MAX_SETS);
  });
});

// ============================================================================
// TIER LIMITS TESTS
// ============================================================================

describe('getLimitsForTier', () => {
  describe('free tier', () => {
    const limits = getLimitsForTier('free');

    it('should have maxSets = 3', () => {
      expect(limits.maxSets).toBe(3);
    });

    it('should have maxChildProfiles = 1', () => {
      expect(limits.maxChildProfiles).toBe(1);
    });

    it('should have maxTotalProfiles = 2 (1 parent + 1 child)', () => {
      expect(limits.maxTotalProfiles).toBe(2);
    });

    it('should have unlimitedSets = false', () => {
      expect(limits.unlimitedSets).toBe(false);
    });
  });

  describe('family tier', () => {
    const limits = getLimitsForTier('family');

    it('should have maxSets = Infinity', () => {
      expect(limits.maxSets).toBe(Infinity);
    });

    it('should have maxChildProfiles = 3', () => {
      expect(limits.maxChildProfiles).toBe(3);
    });

    it('should have maxTotalProfiles = 4', () => {
      expect(limits.maxTotalProfiles).toBe(4);
    });

    it('should have unlimitedSets = true', () => {
      expect(limits.unlimitedSets).toBe(true);
    });
  });
});

describe('getLimitsForSubscription', () => {
  it('should return free tier limits for free subscription', () => {
    const limits = getLimitsForSubscription(createFreeSubscription());
    expect(limits.maxSets).toBe(FREE_TIER_MAX_SETS);
  });

  it('should return family tier limits for active family subscription', () => {
    const limits = getLimitsForSubscription(createFamilySubscription());
    expect(limits.unlimitedSets).toBe(true);
  });

  it('should return free tier limits for expired family subscription', () => {
    const limits = getLimitsForSubscription(createExpiredFamilySubscription());
    expect(limits.maxSets).toBe(FREE_TIER_MAX_SETS);
    expect(limits.unlimitedSets).toBe(false);
  });
});

// ============================================================================
// SET LIMIT CHECKING TESTS
// ============================================================================

describe('canAddSet', () => {
  describe('free tier', () => {
    const subscription = createFreeSubscription();

    it('should allow first set', () => {
      const result = canAddSet(subscription, 0);
      expect(result.allowed).toBe(true);
      expect(result.upgradeRequired).toBe(false);
    });

    it('should allow second set', () => {
      const result = canAddSet(subscription, 1);
      expect(result.allowed).toBe(true);
    });

    it('should allow third set', () => {
      const result = canAddSet(subscription, 2);
      expect(result.allowed).toBe(true);
    });

    it('should not allow fourth set', () => {
      const result = canAddSet(subscription, 3);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Free plan');
      expect(result.upgradeRequired).toBe(true);
    });

    it('should return correct counts', () => {
      const result = canAddSet(subscription, 2);
      expect(result.currentCount).toBe(2);
      expect(result.maxAllowed).toBe(3);
    });
  });

  describe('family tier', () => {
    const subscription = createFamilySubscription();

    it('should always allow new sets', () => {
      expect(canAddSet(subscription, 0).allowed).toBe(true);
      expect(canAddSet(subscription, 10).allowed).toBe(true);
      expect(canAddSet(subscription, 100).allowed).toBe(true);
    });

    it('should return Infinity for maxAllowed', () => {
      const result = canAddSet(subscription, 50);
      expect(result.maxAllowed).toBe(Infinity);
      expect(result.upgradeRequired).toBe(false);
    });
  });
});

describe('canAddCardFromSet', () => {
  const subscription = createFreeSubscription();

  it('should allow card from existing set', () => {
    const result = canAddCardFromSet(subscription, 'sv1', ['sv1', 'sv2', 'sv3']);
    expect(result.allowed).toBe(true);
  });

  it('should allow card from new set when below limit', () => {
    const result = canAddCardFromSet(subscription, 'sv4', ['sv1', 'sv2']);
    expect(result.allowed).toBe(true);
  });

  it('should not allow card from new set when at limit', () => {
    const result = canAddCardFromSet(subscription, 'sv4', ['sv1', 'sv2', 'sv3']);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it('should always allow for family tier', () => {
    const familySub = createFamilySubscription();
    const result = canAddCardFromSet(familySub, 'sv4', ['sv1', 'sv2', 'sv3']);
    expect(result.allowed).toBe(true);
  });
});

describe('getSetUsage', () => {
  describe('free tier', () => {
    const subscription = createFreeSubscription();

    it('should calculate usage correctly with no sets', () => {
      const usage = getSetUsage(subscription, 0);
      expect(usage.setsUsed).toBe(0);
      expect(usage.setsRemaining).toBe(3);
      expect(usage.percentUsed).toBe(0);
      expect(usage.isAtLimit).toBe(false);
      expect(usage.isNearLimit).toBe(false);
    });

    it('should calculate usage correctly at 2 sets', () => {
      const usage = getSetUsage(subscription, 2);
      expect(usage.setsUsed).toBe(2);
      expect(usage.setsRemaining).toBe(1);
      expect(usage.percentUsed).toBeCloseTo(66.67, 1);
      expect(usage.isAtLimit).toBe(false);
      expect(usage.isNearLimit).toBe(true);
    });

    it('should detect at limit', () => {
      const usage = getSetUsage(subscription, 3);
      expect(usage.isAtLimit).toBe(true);
      expect(usage.setsRemaining).toBe(0);
      expect(usage.percentUsed).toBe(100);
    });
  });

  describe('family tier', () => {
    const subscription = createFamilySubscription();

    it('should return Infinity for setsRemaining', () => {
      const usage = getSetUsage(subscription, 50);
      expect(usage.setsUsed).toBe(50);
      expect(usage.setsRemaining).toBe(Infinity);
      expect(usage.isAtLimit).toBe(false);
      expect(usage.isNearLimit).toBe(false);
    });
  });
});

describe('categorizeSetsByLimit', () => {
  const subscription = createFreeSubscription();

  it('should allow all sets when below limit', () => {
    const result = categorizeSetsByLimit(subscription, ['sv1'], ['sv2', 'sv3', 'sv4']);
    expect(result.allowed).toContain('sv2');
    expect(result.allowed).toContain('sv3');
    expect(result.blocked).toHaveLength(0);
  });

  it('should always allow existing sets', () => {
    const result = categorizeSetsByLimit(
      subscription,
      ['sv1', 'sv2', 'sv3'],
      ['sv1', 'sv2', 'sv3', 'sv4']
    );
    expect(result.allowed).toContain('sv1');
    expect(result.allowed).toContain('sv2');
    expect(result.allowed).toContain('sv3');
    expect(result.blocked).toContain('sv4');
  });

  it('should block new sets when at limit', () => {
    const result = categorizeSetsByLimit(subscription, ['sv1', 'sv2', 'sv3'], ['sv4', 'sv5']);
    expect(result.blocked).toContain('sv4');
    expect(result.blocked).toContain('sv5');
    expect(result.allowed).toHaveLength(0);
  });

  it('should allow all sets for family tier', () => {
    const familySub = createFamilySubscription();
    const result = categorizeSetsByLimit(familySub, ['sv1', 'sv2', 'sv3'], ['sv4', 'sv5']);
    expect(result.allowed).toContain('sv4');
    expect(result.allowed).toContain('sv5');
    expect(result.blocked).toHaveLength(0);
  });
});

// ============================================================================
// PROFILE LIMIT CHECKING TESTS
// ============================================================================

describe('canAddChildProfile', () => {
  describe('free tier', () => {
    const subscription = createFreeSubscription();

    it('should allow first child profile', () => {
      const result = canAddChildProfile(subscription, createProfileCounts(1, 0));
      expect(result.allowed).toBe(true);
    });

    it('should not allow second child profile (total limit reached)', () => {
      // Free tier: max 2 total profiles (1 parent + 1 child)
      // When we have 1 parent + 1 child, we've hit the total limit
      const result = canAddChildProfile(subscription, createProfileCounts(1, 1));
      expect(result.allowed).toBe(false);
      // Total limit is checked first, so we get the total limit message
      expect(result.reason).toContain('Maximum of 2 profiles');
    });

    it('should not allow when at total limit', () => {
      const result = canAddChildProfile(subscription, createProfileCounts(1, 1));
      expect(result.allowed).toBe(false);
    });
  });

  describe('family tier', () => {
    const subscription = createFamilySubscription();

    it('should allow up to 3 child profiles', () => {
      expect(canAddChildProfile(subscription, createProfileCounts(1, 0)).allowed).toBe(true);
      expect(canAddChildProfile(subscription, createProfileCounts(1, 1)).allowed).toBe(true);
      expect(canAddChildProfile(subscription, createProfileCounts(1, 2)).allowed).toBe(true);
    });

    it('should not allow fourth child profile (total limit)', () => {
      const result = canAddChildProfile(subscription, createProfileCounts(1, 3));
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(false); // Can't upgrade past total limit
    });
  });
});

describe('canAddParentProfile', () => {
  it('should allow first parent profile', () => {
    const result = canAddParentProfile(createProfileCounts(0, 0));
    expect(result.allowed).toBe(true);
  });

  it('should not allow second parent profile', () => {
    const result = canAddParentProfile(createProfileCounts(1, 0));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Only one parent');
    expect(result.upgradeRequired).toBe(false);
  });
});

describe('getProfileUsage', () => {
  const subscription = createFreeSubscription();

  it('should calculate usage with no profiles', () => {
    const usage = getProfileUsage(subscription, createProfileCounts(0, 0));
    expect(usage.childProfilesUsed).toBe(0);
    expect(usage.childProfilesRemaining).toBe(1);
    expect(usage.totalProfilesUsed).toBe(0);
    expect(usage.totalProfilesRemaining).toBe(2);
    expect(usage.isAtChildLimit).toBe(false);
    expect(usage.isAtTotalLimit).toBe(false);
  });

  it('should detect at child limit', () => {
    const usage = getProfileUsage(subscription, createProfileCounts(1, 1));
    expect(usage.isAtChildLimit).toBe(true);
    expect(usage.childProfilesRemaining).toBe(0);
  });

  it('should handle family tier with more profiles', () => {
    const familySub = createFamilySubscription();
    const usage = getProfileUsage(familySub, createProfileCounts(1, 2));
    expect(usage.childProfilesRemaining).toBe(1);
    expect(usage.totalProfilesRemaining).toBe(1);
    expect(usage.isAtChildLimit).toBe(false);
  });
});

describe('countProfiles', () => {
  it('should count profiles correctly', () => {
    const profiles = [
      { profileType: 'parent' as const },
      { profileType: 'child' as const },
      { profileType: 'child' as const },
    ];
    const counts = countProfiles(profiles);
    expect(counts.parent).toBe(1);
    expect(counts.child).toBe(2);
    expect(counts.total).toBe(3);
  });

  it('should treat undefined profileType as child', () => {
    const profiles = [{ profileType: undefined }, {}];
    const counts = countProfiles(profiles);
    expect(counts.child).toBe(2);
    expect(counts.parent).toBe(0);
  });

  it('should handle empty array', () => {
    const counts = countProfiles([]);
    expect(counts.parent).toBe(0);
    expect(counts.child).toBe(0);
    expect(counts.total).toBe(0);
  });
});

// ============================================================================
// UPGRADE PROMPTS TESTS
// ============================================================================

describe('getSetLimitUpgradePrompt', () => {
  const subscription = createFreeSubscription();

  it('should not show prompt when plenty of room', () => {
    const prompt = getSetLimitUpgradePrompt(subscription, 1);
    expect(prompt.show).toBe(false);
  });

  it('should show near limit prompt at 2 sets', () => {
    const prompt = getSetLimitUpgradePrompt(subscription, 2);
    expect(prompt.show).toBe(true);
    expect(prompt.title).toBe('Almost at Set Limit');
    expect(prompt.feature).toBe('sets');
  });

  it('should show at limit prompt at 3 sets', () => {
    const prompt = getSetLimitUpgradePrompt(subscription, 3);
    expect(prompt.show).toBe(true);
    expect(prompt.title).toBe('Set Limit Reached');
  });

  it('should not show prompt for family tier', () => {
    const familySub = createFamilySubscription();
    const prompt = getSetLimitUpgradePrompt(familySub, 100);
    expect(prompt.show).toBe(false);
  });
});

describe('getProfileLimitUpgradePrompt', () => {
  const subscription = createFreeSubscription();

  it('should not show prompt when below limit', () => {
    const prompt = getProfileLimitUpgradePrompt(subscription, createProfileCounts(1, 0));
    expect(prompt.show).toBe(false);
  });

  it('should show prompt when at child limit', () => {
    const prompt = getProfileLimitUpgradePrompt(subscription, createProfileCounts(1, 1));
    expect(prompt.show).toBe(true);
    expect(prompt.title).toBe('Profile Limit Reached');
    expect(prompt.feature).toBe('profiles');
  });

  it('should not show prompt for family tier at child limit', () => {
    const familySub = createFamilySubscription();
    const prompt = getProfileLimitUpgradePrompt(familySub, createProfileCounts(1, 3));
    expect(prompt.show).toBe(false);
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('getTierDisplayName', () => {
  it('should return correct display names', () => {
    expect(getTierDisplayName('free')).toBe('Free Plan');
    expect(getTierDisplayName('family')).toBe('Family Plan');
  });
});

describe('getTierFeatures', () => {
  it('should return features for free tier', () => {
    const features = getTierFeatures('free');
    expect(features.length).toBeGreaterThan(0);
    expect(features).toContain('Track up to 3 sets');
  });

  it('should return features for family tier', () => {
    const features = getTierFeatures('family');
    expect(features.length).toBeGreaterThan(0);
    expect(features).toContain('Unlimited sets');
  });
});

describe('formatSetUsage', () => {
  it('should format limited usage', () => {
    const usage: SetUsage = {
      setsUsed: 2,
      setsRemaining: 1,
      percentUsed: 66.67,
      isAtLimit: false,
      isNearLimit: true,
    };
    expect(formatSetUsage(usage)).toBe('2/3 sets');
  });

  it('should format unlimited usage', () => {
    const usage: SetUsage = {
      setsUsed: 50,
      setsRemaining: Infinity,
      percentUsed: 0,
      isAtLimit: false,
      isNearLimit: false,
    };
    expect(formatSetUsage(usage)).toBe('50 sets (unlimited)');
  });
});

describe('formatProfileUsage', () => {
  it('should format profile usage correctly', () => {
    const usage: ProfileUsage = {
      childProfilesUsed: 1,
      childProfilesRemaining: 2,
      totalProfilesUsed: 2,
      totalProfilesRemaining: 2,
      isAtChildLimit: false,
      isAtTotalLimit: false,
    };
    expect(formatProfileUsage(usage)).toBe('1/3 child profiles');
  });
});

describe('getUsageColorClass', () => {
  it('should return green for low usage', () => {
    expect(getUsageColorClass(0)).toBe('text-green-500');
    expect(getUsageColorClass(50)).toBe('text-green-500');
    expect(getUsageColorClass(66)).toBe('text-green-500');
  });

  it('should return yellow for medium usage', () => {
    expect(getUsageColorClass(67)).toBe('text-yellow-500');
    expect(getUsageColorClass(80)).toBe('text-yellow-500');
    expect(getUsageColorClass(99)).toBe('text-yellow-500');
  });

  it('should return red for full usage', () => {
    expect(getUsageColorClass(100)).toBe('text-red-500');
    expect(getUsageColorClass(150)).toBe('text-red-500');
  });
});

describe('formatSubscriptionStatus', () => {
  it('should format free tier', () => {
    const status = getSubscriptionStatus(createFreeSubscription());
    expect(formatSubscriptionStatus(status)).toBe('Free Plan');
  });

  it('should format family tier', () => {
    const status = getSubscriptionStatus(createFamilySubscription());
    expect(formatSubscriptionStatus(status)).toBe('Family Plan');
  });

  it('should format expired subscription as Free Plan (effective tier)', () => {
    // When subscription expires, effective tier falls back to 'free'
    // So the status shows 'Free Plan' rather than 'Subscription Expired'
    const status = getSubscriptionStatus(createExpiredFamilySubscription());
    expect(formatSubscriptionStatus(status)).toBe('Free Plan');
  });

  it('should show renewal warning when expiring soon', () => {
    const expiresIn5Days = Date.now() + 5 * 24 * 60 * 60 * 1000;
    const status = getSubscriptionStatus(createFamilySubscription(expiresIn5Days));
    expect(formatSubscriptionStatus(status)).toContain('Renews in 5 days');
  });

  it('should use singular for 1 day', () => {
    const expiresIn1Day = Date.now() + 1 * 24 * 60 * 60 * 1000;
    const status = getSubscriptionStatus(createFamilySubscription(expiresIn1Day));
    expect(formatSubscriptionStatus(status)).toContain('Renews in 1 day');
    expect(formatSubscriptionStatus(status)).not.toContain('days');
  });
});

// ============================================================================
// VALIDATION HELPERS TESTS
// ============================================================================

describe('isValidTier', () => {
  it('should return true for valid tiers', () => {
    expect(isValidTier('free')).toBe(true);
    expect(isValidTier('family')).toBe(true);
  });

  it('should return false for invalid values', () => {
    expect(isValidTier('premium')).toBe(false);
    expect(isValidTier('FREE')).toBe(false);
    expect(isValidTier('')).toBe(false);
    expect(isValidTier(null)).toBe(false);
    expect(isValidTier(undefined)).toBe(false);
    expect(isValidTier(123)).toBe(false);
  });
});

describe('createSubscriptionInfo', () => {
  it('should create subscription info without expiration', () => {
    const info = createSubscriptionInfo('free');
    expect(info.tier).toBe('free');
    expect(info.expiresAt).toBeUndefined();
  });

  it('should create subscription info with expiration', () => {
    const expiry = Date.now() + 1000000;
    const info = createSubscriptionInfo('family', expiry);
    expect(info.tier).toBe('family');
    expect(info.expiresAt).toBe(expiry);
  });
});

describe('isFeatureAvailable', () => {
  it('should check unlimitedSets feature', () => {
    expect(isFeatureAvailable(createFreeSubscription(), 'unlimitedSets')).toBe(false);
    expect(isFeatureAvailable(createFamilySubscription(), 'unlimitedSets')).toBe(true);
    expect(isFeatureAvailable(createExpiredFamilySubscription(), 'unlimitedSets')).toBe(false);
  });

  it('should check multipleChildren feature', () => {
    expect(isFeatureAvailable(createFreeSubscription(), 'multipleChildren')).toBe(false);
    expect(isFeatureAvailable(createFamilySubscription(), 'multipleChildren')).toBe(true);
    expect(isFeatureAvailable(createExpiredFamilySubscription(), 'multipleChildren')).toBe(false);
  });
});

// ============================================================================
// SET ID EXTRACTION TESTS
// ============================================================================

describe('extractSetIdFromCardId', () => {
  it('should extract simple set IDs', () => {
    expect(extractSetIdFromCardId('sv1-1')).toBe('sv1');
    expect(extractSetIdFromCardId('sv2-25')).toBe('sv2');
    expect(extractSetIdFromCardId('xy1-100')).toBe('xy1');
  });

  it('should handle complex set IDs with multiple dashes', () => {
    expect(extractSetIdFromCardId('swsh12pt5-25')).toBe('swsh12pt5');
    expect(extractSetIdFromCardId('dp1-holo-123')).toBe('dp1-holo');
  });

  it('should handle card IDs without dashes', () => {
    expect(extractSetIdFromCardId('sv1')).toBe('sv1');
  });
});

describe('getUniqueSetIds', () => {
  it('should return unique set IDs', () => {
    const cardIds = ['sv1-1', 'sv1-2', 'sv2-1', 'sv2-2', 'sv3-1'];
    const setIds = getUniqueSetIds(cardIds);
    expect(setIds).toHaveLength(3);
    expect(setIds).toContain('sv1');
    expect(setIds).toContain('sv2');
    expect(setIds).toContain('sv3');
  });

  it('should handle empty array', () => {
    expect(getUniqueSetIds([])).toHaveLength(0);
  });

  it('should handle single card', () => {
    expect(getUniqueSetIds(['sv1-1'])).toEqual(['sv1']);
  });
});

describe('countSetsFromCardIds', () => {
  it('should count unique sets', () => {
    const cardIds = ['sv1-1', 'sv1-2', 'sv2-1', 'sv3-1'];
    expect(countSetsFromCardIds(cardIds)).toBe(3);
  });

  it('should return 0 for empty array', () => {
    expect(countSetsFromCardIds([])).toBe(0);
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration: New Free User Journey', () => {
  const subscription = createFreeSubscription();

  it('should allow building collection up to 3 sets', () => {
    // Start with empty collection
    expect(canAddCardFromSet(subscription, 'sv1', []).allowed).toBe(true);

    // Add first card from first set
    expect(canAddCardFromSet(subscription, 'sv1-1', []).allowed).toBe(true);

    // Add card from same set (always allowed)
    expect(canAddCardFromSet(subscription, 'sv1', ['sv1']).allowed).toBe(true);

    // Add second set
    expect(canAddCardFromSet(subscription, 'sv2', ['sv1']).allowed).toBe(true);

    // Add third set
    expect(canAddCardFromSet(subscription, 'sv3', ['sv1', 'sv2']).allowed).toBe(true);

    // Fourth set blocked
    const result = canAddCardFromSet(subscription, 'sv4', ['sv1', 'sv2', 'sv3']);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });
});

describe('Integration: Upgrade Flow', () => {
  it('should unlock features after upgrade', () => {
    // Start on free tier at limits
    const freeSub = createFreeSubscription();
    expect(canAddSet(freeSub, 3).allowed).toBe(false);
    expect(canAddChildProfile(freeSub, createProfileCounts(1, 1)).allowed).toBe(false);

    // Upgrade to family
    const familySub = createFamilySubscription();
    expect(canAddSet(familySub, 3).allowed).toBe(true);
    expect(canAddSet(familySub, 100).allowed).toBe(true);
    expect(canAddChildProfile(familySub, createProfileCounts(1, 1)).allowed).toBe(true);
  });
});

describe('Integration: Subscription Expiration', () => {
  it('should fall back to free limits when subscription expires', () => {
    // Active family subscription
    const activeSub = createFamilySubscription(Date.now() + 86400000);
    expect(getLimitsForSubscription(activeSub).unlimitedSets).toBe(true);
    expect(getEffectiveTier(activeSub)).toBe('family');

    // Expired family subscription
    const expiredSub = createExpiredFamilySubscription();
    expect(getLimitsForSubscription(expiredSub).unlimitedSets).toBe(false);
    expect(getEffectiveTier(expiredSub)).toBe('free');
    expect(canAddSet(expiredSub, 3).allowed).toBe(false);
  });
});

describe('Integration: Profile Limit Progression', () => {
  it('should properly enforce profile limits through progression', () => {
    const freeSub = createFreeSubscription();
    const familySub = createFamilySubscription();

    // Free tier: 1 parent allowed
    expect(canAddParentProfile(createProfileCounts(0, 0)).allowed).toBe(true);
    expect(canAddParentProfile(createProfileCounts(1, 0)).allowed).toBe(false);

    // Free tier: 1 child allowed
    expect(canAddChildProfile(freeSub, createProfileCounts(1, 0)).allowed).toBe(true);
    expect(canAddChildProfile(freeSub, createProfileCounts(1, 1)).allowed).toBe(false);

    // Family tier: 3 children allowed
    expect(canAddChildProfile(familySub, createProfileCounts(1, 1)).allowed).toBe(true);
    expect(canAddChildProfile(familySub, createProfileCounts(1, 2)).allowed).toBe(true);
    expect(canAddChildProfile(familySub, createProfileCounts(1, 3)).allowed).toBe(false); // Total limit
  });
});
