/**
 * Subscription validation utility functions for the CardDex app.
 * Pure functions that can be tested independently of Convex.
 */

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionTier = 'free' | 'family';

export type FeatureCategory =
  | 'collection'
  | 'profiles'
  | 'trading'
  | 'wishlist'
  | 'analytics'
  | 'parent'
  | 'advanced';

export interface PremiumFeature {
  id: string;
  displayName: string;
  description: string;
  category: FeatureCategory;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  expiresAt?: number;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: number;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export interface TierLimits {
  maxSets: number;
  maxChildProfiles: number;
  maxWishlistItems: number;
  maxGames: number;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  featureInfo?: PremiumFeature;
}

export interface SubscriptionComparison {
  tier: SubscriptionTier;
  displayName: string;
  price: number;
  billingPeriod: string | null;
  limits: TierLimits;
  featureCount: number;
}

export interface UpgradeInfo {
  canUpgrade: boolean;
  currentTier: SubscriptionTier;
  targetTier: SubscriptionTier;
  priceMonthly: number;
  priceAnnual: number;
  savings: string;
  highlights: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All premium features with their metadata.
 */
export const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  // Collection features
  unlimited_sets: {
    id: 'unlimited_sets',
    displayName: 'Unlimited Sets',
    description: 'Track cards from unlimited sets (Free plan: 3 sets)',
    category: 'collection',
  },
  multiple_children: {
    id: 'multiple_children',
    displayName: 'Multiple Child Profiles',
    description: 'Create up to 3 child profiles (Free plan: 1 profile)',
    category: 'profiles',
  },

  // Trading features
  trade_calculator: {
    id: 'trade_calculator',
    displayName: 'Trade Value Calculator',
    description: 'Calculate fair trade values between cards',
    category: 'trading',
  },
  trade_history: {
    id: 'trade_history',
    displayName: 'Trade History',
    description: 'Track past trades and their values',
    category: 'trading',
  },

  // Wishlist features
  unlimited_wishlist: {
    id: 'unlimited_wishlist',
    displayName: 'Unlimited Wishlist Items',
    description: 'Add unlimited cards to wishlist (Free plan: 50 items)',
    category: 'wishlist',
  },
  priority_items: {
    id: 'priority_items',
    displayName: 'Priority Wishlist Items',
    description: 'Mark up to 5 wishlist items as priority',
    category: 'wishlist',
  },
  shareable_wishlist: {
    id: 'shareable_wishlist',
    displayName: 'Shareable Wishlist Links',
    description: 'Generate public links to share your wishlist',
    category: 'wishlist',
  },

  // Analytics features
  collection_value: {
    id: 'collection_value',
    displayName: 'Collection Value Tracking',
    description: 'See estimated market value of your collection',
    category: 'analytics',
  },
  price_history: {
    id: 'price_history',
    displayName: 'Price History Charts',
    description: 'Track card price changes over time',
    category: 'analytics',
  },

  // Parent features
  family_dashboard: {
    id: 'family_dashboard',
    displayName: 'Family Dashboard',
    description: 'View activity across all family profiles',
    category: 'parent',
  },
  duplicate_finder: {
    id: 'duplicate_finder',
    displayName: 'Family Duplicate Finder',
    description: 'Find duplicate cards across family members for trading',
    category: 'parent',
  },

  // Advanced features
  multi_tcg: {
    id: 'multi_tcg',
    displayName: 'Multiple TCG Support',
    description: 'Track collections for Yu-Gi-Oh!, Magic, One Piece, and more',
    category: 'advanced',
  },
  export_data: {
    id: 'export_data',
    displayName: 'Export Collection Data',
    description: 'Export your collection as CSV or JSON',
    category: 'advanced',
  },
  import_data: {
    id: 'import_data',
    displayName: 'Import Collection Data',
    description: 'Import collections from other apps',
    category: 'advanced',
  },
};

/**
 * Feature IDs that are available on free tier.
 */
export const FREE_TIER_FEATURE_IDS = new Set<string>(['priority_items', 'shareable_wishlist']);

/**
 * Free tier limits.
 */
export const FREE_TIER_LIMITS: TierLimits = {
  maxSets: 3,
  maxChildProfiles: 1,
  maxWishlistItems: 50,
  maxGames: 1,
};

/**
 * Family tier limits.
 */
export const FAMILY_TIER_LIMITS: TierLimits = {
  maxSets: Infinity,
  maxChildProfiles: 3,
  maxWishlistItems: Infinity,
  maxGames: 7,
};

/**
 * Pricing information.
 */
export const PRICING = {
  free: {
    monthly: 0,
    annual: 0,
  },
  family: {
    monthly: 4.99,
    annual: 39.99,
  },
};

/**
 * Days before expiration to show warning.
 */
export const EXPIRATION_WARNING_DAYS = 7;

// ============================================================================
// SUBSCRIPTION STATUS FUNCTIONS
// ============================================================================

/**
 * Check if a subscription is currently active (not expired).
 */
export function isSubscriptionActive(
  tier: SubscriptionTier,
  expiresAt: number | undefined
): boolean {
  if (tier === 'free') return true;
  if (expiresAt === undefined) return true; // No expiration means active
  return expiresAt > Date.now();
}

/**
 * Get the effective subscription tier (falls back to free if expired).
 */
export function getEffectiveTier(
  tier: SubscriptionTier,
  expiresAt: number | undefined
): SubscriptionTier {
  if (tier === 'family' && expiresAt !== undefined && expiresAt <= Date.now()) {
    return 'free';
  }
  return tier;
}

/**
 * Get days until subscription expires.
 * Returns null for free tier or no expiration.
 */
export function getDaysUntilExpiration(expiresAt: number | undefined): number | null {
  if (expiresAt === undefined) return null;
  const msRemaining = expiresAt - Date.now();
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
}

/**
 * Check if subscription is expiring soon (within warning period).
 */
export function isExpiringSoon(
  tier: SubscriptionTier,
  expiresAt: number | undefined,
  warningDays: number = EXPIRATION_WARNING_DAYS
): boolean {
  if (tier === 'free') return false;
  if (expiresAt === undefined) return false;
  const daysRemaining = getDaysUntilExpiration(expiresAt);
  if (daysRemaining === null) return false;
  return daysRemaining > 0 && daysRemaining <= warningDays;
}

/**
 * Check if subscription has expired.
 */
export function isSubscriptionExpired(
  tier: SubscriptionTier,
  expiresAt: number | undefined
): boolean {
  if (tier === 'free') return false;
  if (expiresAt === undefined) return false;
  return expiresAt <= Date.now();
}

/**
 * Get complete subscription status.
 */
export function getSubscriptionStatus(info: SubscriptionInfo): SubscriptionStatus {
  const effectiveTier = getEffectiveTier(info.tier, info.expiresAt);
  const isActive = isSubscriptionActive(info.tier, info.expiresAt);
  const daysRemaining = info.tier === 'family' ? getDaysUntilExpiration(info.expiresAt) : null;

  return {
    tier: effectiveTier,
    isActive,
    expiresAt: info.expiresAt,
    daysRemaining,
    isExpiringSoon: isExpiringSoon(info.tier, info.expiresAt),
    isExpired: isSubscriptionExpired(info.tier, info.expiresAt),
  };
}

// ============================================================================
// TIER LIMITS FUNCTIONS
// ============================================================================

/**
 * Get limits for a subscription tier.
 */
export function getLimitsForTier(tier: SubscriptionTier): TierLimits {
  return tier === 'family' ? { ...FAMILY_TIER_LIMITS } : { ...FREE_TIER_LIMITS };
}

/**
 * Get effective limits based on subscription status.
 */
export function getEffectiveLimits(info: SubscriptionInfo): TierLimits {
  const effectiveTier = getEffectiveTier(info.tier, info.expiresAt);
  return getLimitsForTier(effectiveTier);
}

/**
 * Check if a limit is unlimited (-1 or Infinity).
 */
export function isUnlimited(limit: number): boolean {
  return limit === Infinity || limit === -1;
}

/**
 * Format a limit for display (handles unlimited).
 */
export function formatLimit(limit: number): string {
  if (isUnlimited(limit)) return 'Unlimited';
  return limit.toString();
}

/**
 * Check if at or over a limit.
 */
export function isAtLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return false;
  return current >= limit;
}

/**
 * Check if near a limit (within 1 of max).
 */
export function isNearLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return false;
  return !isAtLimit(current, limit) && current >= limit - 1;
}

/**
 * Get remaining slots for a limited resource.
 */
export function getRemainingSlots(current: number, limit: number): number {
  if (isUnlimited(limit)) return Infinity;
  return Math.max(0, limit - current);
}

// ============================================================================
// FEATURE ACCESS FUNCTIONS
// ============================================================================

/**
 * Check if a feature is available on free tier.
 */
export function isFreeTierFeature(featureId: string): boolean {
  return FREE_TIER_FEATURE_IDS.has(featureId);
}

/**
 * Check if a feature is available for a given tier.
 */
export function isFeatureAvailableForTier(featureId: string, tier: SubscriptionTier): boolean {
  // Free tier features are available to everyone
  if (isFreeTierFeature(featureId)) {
    return true;
  }
  // All other features require family tier
  return tier === 'family';
}

/**
 * Check feature access for a subscription.
 */
export function checkFeatureAccess(featureId: string, info: SubscriptionInfo): FeatureAccessResult {
  const effectiveTier = getEffectiveTier(info.tier, info.expiresAt);
  const hasAccess = isFeatureAvailableForTier(featureId, effectiveTier);

  if (hasAccess) {
    return { hasAccess: true };
  }

  const feature = PREMIUM_FEATURES[featureId];
  return {
    hasAccess: false,
    reason: feature
      ? `${feature.displayName} requires a Family subscription`
      : 'This feature requires a Family subscription',
    upgradeRequired: true,
    featureInfo: feature,
  };
}

/**
 * Get all features a tier has access to.
 */
export function getFeaturesForTier(tier: SubscriptionTier): PremiumFeature[] {
  const allFeatures = Object.values(PREMIUM_FEATURES);
  return allFeatures.filter((f) => isFeatureAvailableForTier(f.id, tier));
}

/**
 * Get all feature IDs a tier has access to.
 */
export function getFeatureIdsForTier(tier: SubscriptionTier): string[] {
  return getFeaturesForTier(tier).map((f) => f.id);
}

/**
 * Get features that require upgrade from current tier.
 */
export function getLockedFeatures(tier: SubscriptionTier): PremiumFeature[] {
  const allFeatures = Object.values(PREMIUM_FEATURES);
  return allFeatures.filter((f) => !isFeatureAvailableForTier(f.id, tier));
}

/**
 * Count features available for a tier.
 */
export function countFeaturesForTier(tier: SubscriptionTier): number {
  return getFeaturesForTier(tier).length;
}

/**
 * Count total premium features.
 */
export function countTotalFeatures(): number {
  return Object.keys(PREMIUM_FEATURES).length;
}

// ============================================================================
// FEATURE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get a premium feature by ID.
 */
export function getFeatureById(featureId: string): PremiumFeature | undefined {
  return PREMIUM_FEATURES[featureId];
}

/**
 * Get all premium features.
 */
export function getAllFeatures(): PremiumFeature[] {
  return Object.values(PREMIUM_FEATURES);
}

/**
 * Get features by category.
 */
export function getFeaturesByCategory(category: FeatureCategory): PremiumFeature[] {
  return getAllFeatures().filter((f) => f.category === category);
}

/**
 * Get all feature categories.
 */
export function getAllCategories(): FeatureCategory[] {
  const categories = new Set<FeatureCategory>();
  for (const feature of getAllFeatures()) {
    categories.add(feature.category);
  }
  return Array.from(categories);
}

/**
 * Group features by category.
 */
export function groupFeaturesByCategory(): Record<FeatureCategory, PremiumFeature[]> {
  const grouped: Partial<Record<FeatureCategory, PremiumFeature[]>> = {};
  for (const feature of getAllFeatures()) {
    if (!grouped[feature.category]) {
      grouped[feature.category] = [];
    }
    grouped[feature.category]!.push(feature);
  }
  return grouped as Record<FeatureCategory, PremiumFeature[]>;
}

/**
 * Check if a feature ID is valid.
 */
export function isValidFeatureId(featureId: string): boolean {
  return featureId in PREMIUM_FEATURES;
}

// ============================================================================
// UPGRADE HELPERS
// ============================================================================

/**
 * Check if a tier can be upgraded.
 */
export function canUpgrade(tier: SubscriptionTier): boolean {
  return tier === 'free';
}

/**
 * Get upgrade information for a user on free tier.
 */
export function getUpgradeInfo(currentTier: SubscriptionTier): UpgradeInfo {
  return {
    canUpgrade: canUpgrade(currentTier),
    currentTier,
    targetTier: 'family',
    priceMonthly: PRICING.family.monthly,
    priceAnnual: PRICING.family.annual,
    savings: calculateAnnualSavings(),
    highlights: getUpgradeHighlights(),
  };
}

/**
 * Calculate annual savings compared to monthly.
 */
export function calculateAnnualSavings(): string {
  const monthlyTotal = PRICING.family.monthly * 12;
  const annualTotal = PRICING.family.annual;
  const savings = monthlyTotal - annualTotal;
  const percentage = Math.round((savings / monthlyTotal) * 100);
  return `Save $${savings.toFixed(2)} (${percentage}%)`;
}

/**
 * Get upgrade highlights for marketing.
 */
export function getUpgradeHighlights(): string[] {
  return [
    'Unlimited sets to track',
    'Up to 3 child profiles',
    'Trade value calculator',
    'Collection value tracking',
    'Multi-TCG support (7 games)',
    'Export your collection data',
  ];
}

/**
 * Get subscription comparison for upgrade page.
 */
export function getSubscriptionComparison(): SubscriptionComparison[] {
  return [
    {
      tier: 'free',
      displayName: 'Free',
      price: 0,
      billingPeriod: null,
      limits: FREE_TIER_LIMITS,
      featureCount: countFeaturesForTier('free'),
    },
    {
      tier: 'family',
      displayName: 'Family',
      price: PRICING.family.monthly,
      billingPeriod: 'month',
      limits: {
        ...FAMILY_TIER_LIMITS,
        maxSets: -1, // -1 indicates unlimited for display
        maxWishlistItems: -1,
      },
      featureCount: countFeaturesForTier('family'),
    },
  ];
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get display name for a tier.
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return tier === 'family' ? 'Family Plan' : 'Free Plan';
}

/**
 * Get short display name for a tier.
 */
export function getTierShortName(tier: SubscriptionTier): string {
  return tier === 'family' ? 'Family' : 'Free';
}

/**
 * Format expiration date for display.
 */
export function formatExpirationDate(expiresAt: number | undefined): string {
  if (expiresAt === undefined) return 'Never';
  const date = new Date(expiresAt);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get subscription status message.
 */
export function getStatusMessage(status: SubscriptionStatus): string {
  // Check expired first - even if tier has fallen back to 'free'
  if (status.isExpired) {
    return 'Subscription Expired';
  }

  if (status.tier === 'free') {
    return 'Free Plan';
  }

  if (status.isExpiringSoon && status.daysRemaining !== null) {
    return `Expires in ${status.daysRemaining} day${status.daysRemaining === 1 ? '' : 's'}`;
  }

  return 'Family Plan';
}

/**
 * Get expiration warning message if applicable.
 */
export function getExpirationWarning(status: SubscriptionStatus): string | null {
  if (!status.isExpiringSoon || status.daysRemaining === null) {
    return null;
  }

  if (status.daysRemaining === 0) {
    return 'Your subscription expires today! Renew now to keep your premium features.';
  }

  if (status.daysRemaining === 1) {
    return 'Your subscription expires tomorrow! Renew now to avoid losing access.';
  }

  return `Your subscription expires in ${status.daysRemaining} days. Renew soon to keep your premium features.`;
}

/**
 * Get feature category display name.
 */
export function getCategoryDisplayName(category: FeatureCategory): string {
  const names: Record<FeatureCategory, string> = {
    collection: 'Collection',
    profiles: 'Profiles',
    trading: 'Trading',
    wishlist: 'Wishlist',
    analytics: 'Analytics',
    parent: 'Parent Features',
    advanced: 'Advanced',
  };
  return names[category];
}

/**
 * Format price for display.
 */
export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}

/**
 * Get pricing display string.
 */
export function getPricingDisplay(tier: SubscriptionTier): string {
  if (tier === 'free') return 'Free';
  return `${formatPrice(PRICING.family.monthly)}/month or ${formatPrice(PRICING.family.annual)}/year`;
}
