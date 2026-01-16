import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Types
  SubscriptionTier,
  FeatureCategory,
  PremiumFeature,
  SubscriptionInfo,
  SubscriptionStatus,
  TierLimits,
  FeatureAccessResult,
  // Constants
  PREMIUM_FEATURES,
  FREE_TIER_FEATURE_IDS,
  FREE_TIER_LIMITS,
  FAMILY_TIER_LIMITS,
  PRICING,
  EXPIRATION_WARNING_DAYS,
  // Subscription status functions
  isSubscriptionActive,
  getEffectiveTier,
  getDaysUntilExpiration,
  isExpiringSoon,
  isSubscriptionExpired,
  getSubscriptionStatus,
  // Tier limits functions
  getLimitsForTier,
  getEffectiveLimits,
  isUnlimited,
  formatLimit,
  isAtLimit,
  isNearLimit,
  getRemainingSlots,
  // Feature access functions
  isFreeTierFeature,
  isFeatureAvailableForTier,
  checkFeatureAccess,
  getFeaturesForTier,
  getFeatureIdsForTier,
  getLockedFeatures,
  countFeaturesForTier,
  countTotalFeatures,
  // Feature lookup functions
  getFeatureById,
  getAllFeatures,
  getFeaturesByCategory,
  getAllCategories,
  groupFeaturesByCategory,
  isValidFeatureId,
  // Upgrade helpers
  canUpgrade,
  getUpgradeInfo,
  calculateAnnualSavings,
  getUpgradeHighlights,
  getSubscriptionComparison,
  // Display helpers
  getTierDisplayName,
  getTierShortName,
  formatExpirationDate,
  getStatusMessage,
  getExpirationWarning,
  getCategoryDisplayName,
  formatPrice,
  getPricingDisplay,
} from '../subscriptionValidation';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('subscriptionValidation constants', () => {
  describe('PREMIUM_FEATURES', () => {
    it('should have at least 10 features defined', () => {
      const featureCount = Object.keys(PREMIUM_FEATURES).length;
      expect(featureCount).toBeGreaterThanOrEqual(10);
    });

    it('should have unique feature IDs', () => {
      const ids = Object.values(PREMIUM_FEATURES).map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have all required properties for each feature', () => {
      for (const [key, feature] of Object.entries(PREMIUM_FEATURES)) {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('displayName');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('category');
        expect(feature.id).toBe(key);
        expect(feature.displayName.length).toBeGreaterThan(0);
        expect(feature.description.length).toBeGreaterThan(0);
      }
    });

    it('should have valid categories for all features', () => {
      const validCategories: FeatureCategory[] = [
        'collection',
        'profiles',
        'trading',
        'wishlist',
        'analytics',
        'parent',
        'advanced',
      ];
      for (const feature of Object.values(PREMIUM_FEATURES)) {
        expect(validCategories).toContain(feature.category);
      }
    });
  });

  describe('FREE_TIER_FEATURE_IDS', () => {
    it('should be a Set', () => {
      expect(FREE_TIER_FEATURE_IDS).toBeInstanceOf(Set);
    });

    it('should contain valid feature IDs', () => {
      for (const featureId of FREE_TIER_FEATURE_IDS) {
        expect(PREMIUM_FEATURES[featureId]).toBeDefined();
      }
    });

    it('should have at least one free tier feature', () => {
      expect(FREE_TIER_FEATURE_IDS.size).toBeGreaterThan(0);
    });
  });

  describe('FREE_TIER_LIMITS', () => {
    it('should have all required limit properties', () => {
      expect(FREE_TIER_LIMITS).toHaveProperty('maxSets');
      expect(FREE_TIER_LIMITS).toHaveProperty('maxChildProfiles');
      expect(FREE_TIER_LIMITS).toHaveProperty('maxWishlistItems');
      expect(FREE_TIER_LIMITS).toHaveProperty('maxGames');
    });

    it('should have reasonable free tier limits', () => {
      expect(FREE_TIER_LIMITS.maxSets).toBe(3);
      expect(FREE_TIER_LIMITS.maxChildProfiles).toBe(1);
      expect(FREE_TIER_LIMITS.maxWishlistItems).toBe(50);
      expect(FREE_TIER_LIMITS.maxGames).toBe(1);
    });
  });

  describe('FAMILY_TIER_LIMITS', () => {
    it('should have all required limit properties', () => {
      expect(FAMILY_TIER_LIMITS).toHaveProperty('maxSets');
      expect(FAMILY_TIER_LIMITS).toHaveProperty('maxChildProfiles');
      expect(FAMILY_TIER_LIMITS).toHaveProperty('maxWishlistItems');
      expect(FAMILY_TIER_LIMITS).toHaveProperty('maxGames');
    });

    it('should have unlimited sets and wishlist items', () => {
      expect(FAMILY_TIER_LIMITS.maxSets).toBe(Infinity);
      expect(FAMILY_TIER_LIMITS.maxWishlistItems).toBe(Infinity);
    });

    it('should have reasonable family tier limits', () => {
      expect(FAMILY_TIER_LIMITS.maxChildProfiles).toBe(3);
      expect(FAMILY_TIER_LIMITS.maxGames).toBe(7);
    });

    it('should have higher limits than free tier', () => {
      expect(FAMILY_TIER_LIMITS.maxChildProfiles).toBeGreaterThan(
        FREE_TIER_LIMITS.maxChildProfiles
      );
      expect(FAMILY_TIER_LIMITS.maxGames).toBeGreaterThan(FREE_TIER_LIMITS.maxGames);
    });
  });

  describe('PRICING', () => {
    it('should have free tier at $0', () => {
      expect(PRICING.free.monthly).toBe(0);
      expect(PRICING.free.annual).toBe(0);
    });

    it('should have family tier pricing', () => {
      expect(PRICING.family.monthly).toBe(4.99);
      expect(PRICING.family.annual).toBe(39.99);
    });

    it('should have annual savings compared to monthly', () => {
      const monthlyTotal = PRICING.family.monthly * 12;
      expect(PRICING.family.annual).toBeLessThan(monthlyTotal);
    });
  });

  describe('EXPIRATION_WARNING_DAYS', () => {
    it('should be a reasonable warning period', () => {
      expect(EXPIRATION_WARNING_DAYS).toBe(7);
    });
  });
});

// ============================================================================
// SUBSCRIPTION STATUS FUNCTIONS TESTS
// ============================================================================

describe('subscription status functions', () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isSubscriptionActive', () => {
    it('should return true for free tier', () => {
      expect(isSubscriptionActive('free', undefined)).toBe(true);
      expect(isSubscriptionActive('free', mockNow - 1000)).toBe(true);
    });

    it('should return true for family tier with no expiration', () => {
      expect(isSubscriptionActive('family', undefined)).toBe(true);
    });

    it('should return true for family tier not expired', () => {
      const futureExpiration = mockNow + 30 * 24 * 60 * 60 * 1000; // 30 days
      expect(isSubscriptionActive('family', futureExpiration)).toBe(true);
    });

    it('should return false for expired family tier', () => {
      const pastExpiration = mockNow - 1000;
      expect(isSubscriptionActive('family', pastExpiration)).toBe(false);
    });

    it('should return false for family tier expiring exactly now', () => {
      expect(isSubscriptionActive('family', mockNow)).toBe(false);
    });
  });

  describe('getEffectiveTier', () => {
    it('should return free tier as-is', () => {
      expect(getEffectiveTier('free', undefined)).toBe('free');
      expect(getEffectiveTier('free', mockNow - 1000)).toBe('free');
    });

    it('should return family tier if not expired', () => {
      const futureExpiration = mockNow + 30 * 24 * 60 * 60 * 1000;
      expect(getEffectiveTier('family', futureExpiration)).toBe('family');
    });

    it('should return family tier if no expiration', () => {
      expect(getEffectiveTier('family', undefined)).toBe('family');
    });

    it('should fall back to free if family tier expired', () => {
      const pastExpiration = mockNow - 1000;
      expect(getEffectiveTier('family', pastExpiration)).toBe('free');
    });
  });

  describe('getDaysUntilExpiration', () => {
    it('should return null for undefined expiration', () => {
      expect(getDaysUntilExpiration(undefined)).toBeNull();
    });

    it('should return 0 for expired subscription', () => {
      const pastExpiration = mockNow - 1000;
      expect(getDaysUntilExpiration(pastExpiration)).toBe(0);
    });

    it('should return correct days for future expiration', () => {
      const oneDay = 24 * 60 * 60 * 1000;

      // Exactly 1 day from now (should round up to 1)
      expect(getDaysUntilExpiration(mockNow + oneDay)).toBe(1);

      // 7 days from now
      expect(getDaysUntilExpiration(mockNow + 7 * oneDay)).toBe(7);

      // 30 days from now
      expect(getDaysUntilExpiration(mockNow + 30 * oneDay)).toBe(30);
    });

    it('should round up partial days', () => {
      const halfDay = 12 * 60 * 60 * 1000;
      expect(getDaysUntilExpiration(mockNow + halfDay)).toBe(1);

      const oneAndHalfDays = 36 * 60 * 60 * 1000;
      expect(getDaysUntilExpiration(mockNow + oneAndHalfDays)).toBe(2);
    });
  });

  describe('isExpiringSoon', () => {
    it('should return false for free tier', () => {
      expect(isExpiringSoon('free', mockNow + 1000)).toBe(false);
    });

    it('should return false for undefined expiration', () => {
      expect(isExpiringSoon('family', undefined)).toBe(false);
    });

    it('should return false for expired subscription', () => {
      expect(isExpiringSoon('family', mockNow - 1000)).toBe(false);
    });

    it('should return true for expiration within warning period', () => {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      expect(isExpiringSoon('family', mockNow + threeDays)).toBe(true);
    });

    it('should return false for expiration beyond warning period', () => {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(isExpiringSoon('family', mockNow + thirtyDays)).toBe(false);
    });

    it('should respect custom warning days', () => {
      const fiveDays = 5 * 24 * 60 * 60 * 1000;
      expect(isExpiringSoon('family', mockNow + fiveDays, 3)).toBe(false);
      expect(isExpiringSoon('family', mockNow + fiveDays, 10)).toBe(true);
    });
  });

  describe('isSubscriptionExpired', () => {
    it('should return false for free tier', () => {
      expect(isSubscriptionExpired('free', mockNow - 1000)).toBe(false);
    });

    it('should return false for undefined expiration', () => {
      expect(isSubscriptionExpired('family', undefined)).toBe(false);
    });

    it('should return true for expired family subscription', () => {
      expect(isSubscriptionExpired('family', mockNow - 1000)).toBe(true);
    });

    it('should return false for active family subscription', () => {
      expect(isSubscriptionExpired('family', mockNow + 1000)).toBe(false);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return correct status for free tier', () => {
      const status = getSubscriptionStatus({ tier: 'free' });
      expect(status.tier).toBe('free');
      expect(status.isActive).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.isExpiringSoon).toBe(false);
      expect(status.daysRemaining).toBeNull();
    });

    it('should return correct status for active family tier', () => {
      const thirtyDays = mockNow + 30 * 24 * 60 * 60 * 1000;
      const status = getSubscriptionStatus({ tier: 'family', expiresAt: thirtyDays });
      expect(status.tier).toBe('family');
      expect(status.isActive).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.isExpiringSoon).toBe(false);
      expect(status.daysRemaining).toBe(30);
    });

    it('should return correct status for expiring soon family tier', () => {
      const threeDays = mockNow + 3 * 24 * 60 * 60 * 1000;
      const status = getSubscriptionStatus({ tier: 'family', expiresAt: threeDays });
      expect(status.tier).toBe('family');
      expect(status.isActive).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.isExpiringSoon).toBe(true);
      expect(status.daysRemaining).toBe(3);
    });

    it('should return correct status for expired family tier', () => {
      const pastExpiration = mockNow - 1000;
      const status = getSubscriptionStatus({ tier: 'family', expiresAt: pastExpiration });
      expect(status.tier).toBe('free'); // Falls back to free
      expect(status.isActive).toBe(false);
      expect(status.isExpired).toBe(true);
      expect(status.isExpiringSoon).toBe(false);
      expect(status.daysRemaining).toBe(0);
    });
  });
});

// ============================================================================
// TIER LIMITS FUNCTIONS TESTS
// ============================================================================

describe('tier limits functions', () => {
  describe('getLimitsForTier', () => {
    it('should return free tier limits for free tier', () => {
      const limits = getLimitsForTier('free');
      expect(limits).toEqual(FREE_TIER_LIMITS);
    });

    it('should return family tier limits for family tier', () => {
      const limits = getLimitsForTier('family');
      expect(limits).toEqual(FAMILY_TIER_LIMITS);
    });

    it('should return a copy, not the original object', () => {
      const limits = getLimitsForTier('free');
      limits.maxSets = 999;
      expect(FREE_TIER_LIMITS.maxSets).toBe(3);
    });
  });

  describe('getEffectiveLimits', () => {
    let mockNow: number;

    beforeEach(() => {
      mockNow = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return free limits for free tier', () => {
      const limits = getEffectiveLimits({ tier: 'free' });
      expect(limits).toEqual(FREE_TIER_LIMITS);
    });

    it('should return family limits for active family tier', () => {
      const limits = getEffectiveLimits({
        tier: 'family',
        expiresAt: mockNow + 30 * 24 * 60 * 60 * 1000,
      });
      expect(limits).toEqual(FAMILY_TIER_LIMITS);
    });

    it('should fall back to free limits for expired family tier', () => {
      const limits = getEffectiveLimits({
        tier: 'family',
        expiresAt: mockNow - 1000,
      });
      expect(limits).toEqual(FREE_TIER_LIMITS);
    });
  });

  describe('isUnlimited', () => {
    it('should return true for Infinity', () => {
      expect(isUnlimited(Infinity)).toBe(true);
    });

    it('should return true for -1', () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it('should return false for positive numbers', () => {
      expect(isUnlimited(0)).toBe(false);
      expect(isUnlimited(1)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
    });
  });

  describe('formatLimit', () => {
    it('should return "Unlimited" for unlimited values', () => {
      expect(formatLimit(Infinity)).toBe('Unlimited');
      expect(formatLimit(-1)).toBe('Unlimited');
    });

    it('should return string number for regular values', () => {
      expect(formatLimit(0)).toBe('0');
      expect(formatLimit(3)).toBe('3');
      expect(formatLimit(50)).toBe('50');
    });
  });

  describe('isAtLimit', () => {
    it('should return false for unlimited', () => {
      expect(isAtLimit(100, Infinity)).toBe(false);
      expect(isAtLimit(100, -1)).toBe(false);
    });

    it('should return true when current equals limit', () => {
      expect(isAtLimit(3, 3)).toBe(true);
    });

    it('should return true when current exceeds limit', () => {
      expect(isAtLimit(5, 3)).toBe(true);
    });

    it('should return false when under limit', () => {
      expect(isAtLimit(2, 3)).toBe(false);
    });
  });

  describe('isNearLimit', () => {
    it('should return false for unlimited', () => {
      expect(isNearLimit(100, Infinity)).toBe(false);
    });

    it('should return false when at limit', () => {
      expect(isNearLimit(3, 3)).toBe(false);
    });

    it('should return true when one below limit', () => {
      expect(isNearLimit(2, 3)).toBe(true);
    });

    it('should return false when more than one below limit', () => {
      expect(isNearLimit(1, 3)).toBe(false);
    });
  });

  describe('getRemainingSlots', () => {
    it('should return Infinity for unlimited', () => {
      expect(getRemainingSlots(5, Infinity)).toBe(Infinity);
    });

    it('should return correct remaining slots', () => {
      expect(getRemainingSlots(1, 3)).toBe(2);
      expect(getRemainingSlots(2, 3)).toBe(1);
      expect(getRemainingSlots(3, 3)).toBe(0);
    });

    it('should return 0 when over limit', () => {
      expect(getRemainingSlots(5, 3)).toBe(0);
    });
  });
});

// ============================================================================
// FEATURE ACCESS FUNCTIONS TESTS
// ============================================================================

describe('feature access functions', () => {
  describe('isFreeTierFeature', () => {
    it('should return true for free tier features', () => {
      for (const featureId of FREE_TIER_FEATURE_IDS) {
        expect(isFreeTierFeature(featureId)).toBe(true);
      }
    });

    it('should return false for premium-only features', () => {
      expect(isFreeTierFeature('unlimited_sets')).toBe(false);
      expect(isFreeTierFeature('collection_value')).toBe(false);
    });

    it('should return false for invalid feature IDs', () => {
      expect(isFreeTierFeature('invalid_feature')).toBe(false);
    });
  });

  describe('isFeatureAvailableForTier', () => {
    it('should return true for free tier features on free tier', () => {
      for (const featureId of FREE_TIER_FEATURE_IDS) {
        expect(isFeatureAvailableForTier(featureId, 'free')).toBe(true);
      }
    });

    it('should return true for all features on family tier', () => {
      for (const feature of Object.values(PREMIUM_FEATURES)) {
        expect(isFeatureAvailableForTier(feature.id, 'family')).toBe(true);
      }
    });

    it('should return false for premium features on free tier', () => {
      expect(isFeatureAvailableForTier('unlimited_sets', 'free')).toBe(false);
      expect(isFeatureAvailableForTier('collection_value', 'free')).toBe(false);
    });
  });

  describe('checkFeatureAccess', () => {
    let mockNow: number;

    beforeEach(() => {
      mockNow = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return hasAccess true for accessible features', () => {
      const result = checkFeatureAccess('priority_items', { tier: 'free' });
      expect(result.hasAccess).toBe(true);
    });

    it('should return hasAccess false for locked features', () => {
      const result = checkFeatureAccess('unlimited_sets', { tier: 'free' });
      expect(result.hasAccess).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.reason).toContain('Family subscription');
    });

    it('should include feature info when available', () => {
      const result = checkFeatureAccess('collection_value', { tier: 'free' });
      expect(result.featureInfo).toBeDefined();
      expect(result.featureInfo?.displayName).toBe('Collection Value Tracking');
    });

    it('should allow all features for family tier', () => {
      const futureExpiration = mockNow + 30 * 24 * 60 * 60 * 1000;
      const result = checkFeatureAccess('unlimited_sets', {
        tier: 'family',
        expiresAt: futureExpiration,
      });
      expect(result.hasAccess).toBe(true);
    });

    it('should fall back to free tier access for expired family', () => {
      const result = checkFeatureAccess('unlimited_sets', {
        tier: 'family',
        expiresAt: mockNow - 1000,
      });
      expect(result.hasAccess).toBe(false);
    });
  });

  describe('getFeaturesForTier', () => {
    it('should return free tier features for free tier', () => {
      const features = getFeaturesForTier('free');
      expect(features.length).toBe(FREE_TIER_FEATURE_IDS.size);
      for (const feature of features) {
        expect(FREE_TIER_FEATURE_IDS.has(feature.id)).toBe(true);
      }
    });

    it('should return all features for family tier', () => {
      const features = getFeaturesForTier('family');
      expect(features.length).toBe(Object.keys(PREMIUM_FEATURES).length);
    });
  });

  describe('getFeatureIdsForTier', () => {
    it('should return array of feature IDs', () => {
      const ids = getFeatureIdsForTier('family');
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(Object.keys(PREMIUM_FEATURES).length);
    });
  });

  describe('getLockedFeatures', () => {
    it('should return features locked for free tier', () => {
      const locked = getLockedFeatures('free');
      const total = Object.keys(PREMIUM_FEATURES).length;
      const free = FREE_TIER_FEATURE_IDS.size;
      expect(locked.length).toBe(total - free);
    });

    it('should return empty array for family tier', () => {
      const locked = getLockedFeatures('family');
      expect(locked.length).toBe(0);
    });
  });

  describe('countFeaturesForTier', () => {
    it('should count free tier features', () => {
      expect(countFeaturesForTier('free')).toBe(FREE_TIER_FEATURE_IDS.size);
    });

    it('should count all features for family tier', () => {
      expect(countFeaturesForTier('family')).toBe(Object.keys(PREMIUM_FEATURES).length);
    });
  });

  describe('countTotalFeatures', () => {
    it('should return total feature count', () => {
      expect(countTotalFeatures()).toBe(Object.keys(PREMIUM_FEATURES).length);
    });
  });
});

// ============================================================================
// FEATURE LOOKUP FUNCTIONS TESTS
// ============================================================================

describe('feature lookup functions', () => {
  describe('getFeatureById', () => {
    it('should return feature for valid ID', () => {
      const feature = getFeatureById('unlimited_sets');
      expect(feature).toBeDefined();
      expect(feature?.displayName).toBe('Unlimited Sets');
    });

    it('should return undefined for invalid ID', () => {
      const feature = getFeatureById('invalid_feature');
      expect(feature).toBeUndefined();
    });
  });

  describe('getAllFeatures', () => {
    it('should return array of all features', () => {
      const features = getAllFeatures();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBe(Object.keys(PREMIUM_FEATURES).length);
    });
  });

  describe('getFeaturesByCategory', () => {
    it('should return features for valid category', () => {
      const tradingFeatures = getFeaturesByCategory('trading');
      expect(tradingFeatures.length).toBeGreaterThan(0);
      for (const feature of tradingFeatures) {
        expect(feature.category).toBe('trading');
      }
    });

    it('should return empty array for category with no features', () => {
      // All categories have features, so use a type assertion trick
      const features = getFeaturesByCategory('nonexistent' as FeatureCategory);
      expect(features.length).toBe(0);
    });
  });

  describe('getAllCategories', () => {
    it('should return all unique categories', () => {
      const categories = getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      const unique = new Set(categories);
      expect(categories.length).toBe(unique.size);
    });
  });

  describe('groupFeaturesByCategory', () => {
    it('should group features by category', () => {
      const grouped = groupFeaturesByCategory();
      const categories = getAllCategories();

      for (const category of categories) {
        expect(grouped[category]).toBeDefined();
        expect(grouped[category].length).toBeGreaterThan(0);
        for (const feature of grouped[category]) {
          expect(feature.category).toBe(category);
        }
      }
    });
  });

  describe('isValidFeatureId', () => {
    it('should return true for valid feature IDs', () => {
      for (const featureId of Object.keys(PREMIUM_FEATURES)) {
        expect(isValidFeatureId(featureId)).toBe(true);
      }
    });

    it('should return false for invalid feature IDs', () => {
      expect(isValidFeatureId('invalid')).toBe(false);
      expect(isValidFeatureId('')).toBe(false);
      expect(isValidFeatureId('UNLIMITED_SETS')).toBe(false); // Case sensitive
    });
  });
});

// ============================================================================
// UPGRADE HELPERS TESTS
// ============================================================================

describe('upgrade helpers', () => {
  describe('canUpgrade', () => {
    it('should return true for free tier', () => {
      expect(canUpgrade('free')).toBe(true);
    });

    it('should return false for family tier', () => {
      expect(canUpgrade('family')).toBe(false);
    });
  });

  describe('getUpgradeInfo', () => {
    it('should return upgrade info for free tier', () => {
      const info = getUpgradeInfo('free');
      expect(info.canUpgrade).toBe(true);
      expect(info.currentTier).toBe('free');
      expect(info.targetTier).toBe('family');
      expect(info.priceMonthly).toBe(PRICING.family.monthly);
      expect(info.priceAnnual).toBe(PRICING.family.annual);
      expect(info.highlights.length).toBeGreaterThan(0);
    });

    it('should indicate no upgrade for family tier', () => {
      const info = getUpgradeInfo('family');
      expect(info.canUpgrade).toBe(false);
    });
  });

  describe('calculateAnnualSavings', () => {
    it('should return savings string', () => {
      const savings = calculateAnnualSavings();
      expect(savings).toContain('Save');
      expect(savings).toContain('$');
      expect(savings).toContain('%');
    });

    it('should calculate correct savings', () => {
      const monthlyTotal = PRICING.family.monthly * 12;
      const annualTotal = PRICING.family.annual;
      const expectedSavings = monthlyTotal - annualTotal;
      expect(calculateAnnualSavings()).toContain(expectedSavings.toFixed(2));
    });
  });

  describe('getUpgradeHighlights', () => {
    it('should return array of highlight strings', () => {
      const highlights = getUpgradeHighlights();
      expect(Array.isArray(highlights)).toBe(true);
      expect(highlights.length).toBeGreaterThan(0);
      for (const highlight of highlights) {
        expect(typeof highlight).toBe('string');
        expect(highlight.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getSubscriptionComparison', () => {
    it('should return comparison for both tiers', () => {
      const comparison = getSubscriptionComparison();
      expect(comparison.length).toBe(2);
      expect(comparison[0].tier).toBe('free');
      expect(comparison[1].tier).toBe('family');
    });

    it('should include limits for each tier', () => {
      const comparison = getSubscriptionComparison();
      for (const tier of comparison) {
        expect(tier.limits).toBeDefined();
        expect(tier.limits).toHaveProperty('maxSets');
        expect(tier.limits).toHaveProperty('maxChildProfiles');
      }
    });

    it('should show family tier with unlimited values as -1', () => {
      const comparison = getSubscriptionComparison();
      const familyTier = comparison.find((t) => t.tier === 'family');
      expect(familyTier?.limits.maxSets).toBe(-1);
      expect(familyTier?.limits.maxWishlistItems).toBe(-1);
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('display helpers', () => {
  describe('getTierDisplayName', () => {
    it('should return correct display names', () => {
      expect(getTierDisplayName('free')).toBe('Free Plan');
      expect(getTierDisplayName('family')).toBe('Family Plan');
    });
  });

  describe('getTierShortName', () => {
    it('should return short names', () => {
      expect(getTierShortName('free')).toBe('Free');
      expect(getTierShortName('family')).toBe('Family');
    });
  });

  describe('formatExpirationDate', () => {
    it('should return "Never" for undefined', () => {
      expect(formatExpirationDate(undefined)).toBe('Never');
    });

    it('should format date correctly', () => {
      const date = new Date('2026-06-15T12:00:00Z');
      const formatted = formatExpirationDate(date.getTime());
      expect(formatted).toContain('Jun');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2026');
    });
  });

  describe('getStatusMessage', () => {
    it('should return "Free Plan" for free tier', () => {
      const status: SubscriptionStatus = {
        tier: 'free',
        isActive: true,
        daysRemaining: null,
        isExpiringSoon: false,
        isExpired: false,
      };
      expect(getStatusMessage(status)).toBe('Free Plan');
    });

    it('should return "Subscription Expired" for expired', () => {
      const status: SubscriptionStatus = {
        tier: 'free',
        isActive: false,
        daysRemaining: 0,
        isExpiringSoon: false,
        isExpired: true,
      };
      expect(getStatusMessage(status)).toBe('Subscription Expired');
    });

    it('should return expiring message when expiring soon', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 3,
        isExpiringSoon: true,
        isExpired: false,
      };
      expect(getStatusMessage(status)).toContain('Expires in 3 days');
    });

    it('should handle singular day correctly', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 1,
        isExpiringSoon: true,
        isExpired: false,
      };
      expect(getStatusMessage(status)).toContain('Expires in 1 day');
    });

    it('should return "Family Plan" for active family tier', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 30,
        isExpiringSoon: false,
        isExpired: false,
      };
      expect(getStatusMessage(status)).toBe('Family Plan');
    });
  });

  describe('getExpirationWarning', () => {
    it('should return null when not expiring soon', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 30,
        isExpiringSoon: false,
        isExpired: false,
      };
      expect(getExpirationWarning(status)).toBeNull();
    });

    it('should return warning for today expiration', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 0,
        isExpiringSoon: true,
        isExpired: false,
      };
      const warning = getExpirationWarning(status);
      expect(warning).toContain('expires today');
    });

    it('should return warning for tomorrow expiration', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 1,
        isExpiringSoon: true,
        isExpired: false,
      };
      const warning = getExpirationWarning(status);
      expect(warning).toContain('expires tomorrow');
    });

    it('should return warning for multi-day expiration', () => {
      const status: SubscriptionStatus = {
        tier: 'family',
        isActive: true,
        daysRemaining: 5,
        isExpiringSoon: true,
        isExpired: false,
      };
      const warning = getExpirationWarning(status);
      expect(warning).toContain('expires in 5 days');
    });
  });

  describe('getCategoryDisplayName', () => {
    it('should return correct display names for all categories', () => {
      expect(getCategoryDisplayName('collection')).toBe('Collection');
      expect(getCategoryDisplayName('profiles')).toBe('Profiles');
      expect(getCategoryDisplayName('trading')).toBe('Trading');
      expect(getCategoryDisplayName('wishlist')).toBe('Wishlist');
      expect(getCategoryDisplayName('analytics')).toBe('Analytics');
      expect(getCategoryDisplayName('parent')).toBe('Parent Features');
      expect(getCategoryDisplayName('advanced')).toBe('Advanced');
    });
  });

  describe('formatPrice', () => {
    it('should return "Free" for 0', () => {
      expect(formatPrice(0)).toBe('Free');
    });

    it('should format prices correctly', () => {
      expect(formatPrice(4.99)).toBe('$4.99');
      expect(formatPrice(39.99)).toBe('$39.99');
      expect(formatPrice(100)).toBe('$100.00');
    });
  });

  describe('getPricingDisplay', () => {
    it('should return "Free" for free tier', () => {
      expect(getPricingDisplay('free')).toBe('Free');
    });

    it('should return pricing string for family tier', () => {
      const display = getPricingDisplay('family');
      expect(display).toContain('$4.99/month');
      expect(display).toContain('$39.99/year');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('subscription validation integration', () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('free user upgrade journey', () => {
    it('should show correct state for new free user', () => {
      const info: SubscriptionInfo = { tier: 'free' };
      const status = getSubscriptionStatus(info);
      const limits = getEffectiveLimits(info);
      const upgradeInfo = getUpgradeInfo(info.tier);

      expect(status.tier).toBe('free');
      expect(status.isActive).toBe(true);
      expect(limits).toEqual(FREE_TIER_LIMITS);
      expect(upgradeInfo.canUpgrade).toBe(true);

      // Check which features are accessible
      const accessibleCount = countFeaturesForTier('free');
      const totalCount = countTotalFeatures();
      expect(accessibleCount).toBeLessThan(totalCount);
    });

    it('should correctly identify blocked premium features', () => {
      const info: SubscriptionInfo = { tier: 'free' };

      // Try to access premium features
      const collectionValueAccess = checkFeatureAccess('collection_value', info);
      const multiTcgAccess = checkFeatureAccess('multi_tcg', info);

      expect(collectionValueAccess.hasAccess).toBe(false);
      expect(collectionValueAccess.upgradeRequired).toBe(true);
      expect(multiTcgAccess.hasAccess).toBe(false);
    });
  });

  describe('family user experience', () => {
    it('should show correct state for active family user', () => {
      const thirtyDays = mockNow + 30 * 24 * 60 * 60 * 1000;
      const info: SubscriptionInfo = { tier: 'family', expiresAt: thirtyDays };
      const status = getSubscriptionStatus(info);
      const limits = getEffectiveLimits(info);

      expect(status.tier).toBe('family');
      expect(status.isActive).toBe(true);
      expect(status.isExpiringSoon).toBe(false);
      expect(limits).toEqual(FAMILY_TIER_LIMITS);

      // All features should be accessible
      const accessibleCount = countFeaturesForTier('family');
      const totalCount = countTotalFeatures();
      expect(accessibleCount).toBe(totalCount);

      // Check specific features
      expect(checkFeatureAccess('collection_value', info).hasAccess).toBe(true);
      expect(checkFeatureAccess('multi_tcg', info).hasAccess).toBe(true);
    });
  });

  describe('subscription expiration flow', () => {
    it('should warn user when subscription is expiring soon', () => {
      const threeDays = mockNow + 3 * 24 * 60 * 60 * 1000;
      const info: SubscriptionInfo = { tier: 'family', expiresAt: threeDays };
      const status = getSubscriptionStatus(info);

      expect(status.isExpiringSoon).toBe(true);
      expect(status.daysRemaining).toBe(3);
      expect(getExpirationWarning(status)).not.toBeNull();

      // Still has access to all features
      expect(checkFeatureAccess('collection_value', info).hasAccess).toBe(true);
    });

    it('should fall back to free tier on expiration', () => {
      const expired: SubscriptionInfo = {
        tier: 'family',
        expiresAt: mockNow - 1000,
      };
      const status = getSubscriptionStatus(expired);
      const limits = getEffectiveLimits(expired);

      expect(status.tier).toBe('free');
      expect(status.isExpired).toBe(true);
      expect(limits).toEqual(FREE_TIER_LIMITS);

      // Premium features should be locked
      expect(checkFeatureAccess('collection_value', expired).hasAccess).toBe(false);
      expect(checkFeatureAccess('unlimited_sets', expired).hasAccess).toBe(false);

      // But free tier features still work
      expect(checkFeatureAccess('priority_items', expired).hasAccess).toBe(true);
    });
  });

  describe('limit checking workflow', () => {
    it('should correctly track resource usage against limits', () => {
      const freeLimits = getLimitsForTier('free');

      // User with 2 sets (near limit)
      const currentSets = 2;
      expect(isAtLimit(currentSets, freeLimits.maxSets)).toBe(false);
      expect(isNearLimit(currentSets, freeLimits.maxSets)).toBe(true);
      expect(getRemainingSlots(currentSets, freeLimits.maxSets)).toBe(1);

      // User at limit
      const atLimitSets = 3;
      expect(isAtLimit(atLimitSets, freeLimits.maxSets)).toBe(true);
      expect(isNearLimit(atLimitSets, freeLimits.maxSets)).toBe(false);
      expect(getRemainingSlots(atLimitSets, freeLimits.maxSets)).toBe(0);
    });

    it('should handle unlimited resources correctly', () => {
      const familyLimits = getLimitsForTier('family');

      // Family tier has unlimited sets
      expect(isUnlimited(familyLimits.maxSets)).toBe(true);
      expect(isAtLimit(100, familyLimits.maxSets)).toBe(false);
      expect(getRemainingSlots(100, familyLimits.maxSets)).toBe(Infinity);
      expect(formatLimit(familyLimits.maxSets)).toBe('Unlimited');
    });
  });
});
