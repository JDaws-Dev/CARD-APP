import { v } from 'convex/values';
import { mutation, query, internalQuery, QueryCtx, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { RATE_LIMITS } from './openai';

/**
 * AI Feature Rate Limiting Utilities
 *
 * Implements rate limiting for AI features to:
 * 1. Prevent abuse and cost overruns
 * 2. Ensure fair usage across all users
 * 3. Track usage for monitoring and billing
 *
 * Caching Strategy:
 * - Rate limit checks use in-memory cache with 60-second TTL
 * - Cache is invalidated on rate limit increments
 * - Reduces database reads for frequently checked limits
 */

// In-memory cache for rate limit status
// Key format: `${profileId}-${featureType}-${windowStart}`
const rateLimitCache = new Map<string, { count: number; timestamp: number; windowStart: number }>();

// Cache TTL in milliseconds (60 seconds)
const CACHE_TTL = 60 * 1000;

/**
 * Get cache key for rate limit lookup
 */
function getCacheKey(
  profileId: Id<'profiles'>,
  featureType: FeatureType,
  windowStart: number
): string {
  return `${profileId}-${featureType}-${windowStart}`;
}

/**
 * Get cached rate limit count if valid
 */
function getCachedCount(
  profileId: Id<'profiles'>,
  featureType: FeatureType,
  windowStart: number
): number | null {
  const key = getCacheKey(profileId, featureType, windowStart);
  const cached = rateLimitCache.get(key);

  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    rateLimitCache.delete(key);
    return null;
  }

  // Check if window has changed
  if (cached.windowStart !== windowStart) {
    rateLimitCache.delete(key);
    return null;
  }

  return cached.count;
}

/**
 * Update cache with new count
 */
function updateCache(
  profileId: Id<'profiles'>,
  featureType: FeatureType,
  windowStart: number,
  count: number
): void {
  const key = getCacheKey(profileId, featureType, windowStart);
  rateLimitCache.set(key, {
    count,
    timestamp: Date.now(),
    windowStart,
  });

  // Clean up old cache entries periodically (keep last 1000)
  if (rateLimitCache.size > 1000) {
    const entries = Array.from(rateLimitCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - 500);
    for (const [key] of toDelete) {
      rateLimitCache.delete(key);
    }
  }
}

/**
 * Invalidate cache entry (call after incrementing)
 */
function invalidateCache(
  profileId: Id<'profiles'>,
  featureType: FeatureType,
  windowStart: number
): void {
  const key = getCacheKey(profileId, featureType, windowStart);
  rateLimitCache.delete(key);
}

export type FeatureType =
  | 'card_scan'
  | 'chat'
  | 'story'
  | 'quiz'
  | 'recommendation'
  | 'trade_advisor'
  | 'shopping_assistant'
  | 'condition_grading';

// Rate limit configuration per feature
const FEATURE_LIMITS: Record<FeatureType, { limit: number; window: 'hourly' | 'daily' }> = {
  card_scan: { limit: RATE_LIMITS.CARD_SCANS_PER_DAY, window: 'daily' },
  chat: { limit: RATE_LIMITS.CHAT_MESSAGES_PER_HOUR, window: 'hourly' },
  story: { limit: RATE_LIMITS.STORIES_PER_DAY, window: 'daily' },
  quiz: { limit: RATE_LIMITS.QUIZZES_PER_DAY, window: 'daily' },
  recommendation: { limit: 20, window: 'daily' },
  trade_advisor: { limit: 10, window: 'daily' },
  shopping_assistant: { limit: 15, window: 'daily' },
  condition_grading: { limit: 10, window: 'daily' },
};

/**
 * Get the start of the current time window
 */
function getWindowStart(windowType: 'hourly' | 'daily'): number {
  const now = new Date();
  if (windowType === 'hourly') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
  } else {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
}

/**
 * Check if a profile can use an AI feature (rate limit check)
 * Uses in-memory cache to reduce database reads
 */
export async function checkRateLimit(
  ctx: QueryCtx,
  profileId: Id<'profiles'>,
  featureType: FeatureType
): Promise<{ allowed: boolean; remaining: number; resetAt: number; cached: boolean }> {
  const config = FEATURE_LIMITS[featureType];
  const windowStart = getWindowStart(config.window);

  // Check cache first
  const cachedCount = getCachedCount(profileId, featureType, windowStart);
  let currentCount: number;
  let cached = false;

  if (cachedCount !== null) {
    currentCount = cachedCount;
    cached = true;
  } else {
    // Get current usage count from database
    const rateLimitRecord = await ctx.db
      .query('aiRateLimits')
      .withIndex('by_profile_feature_window', (q) =>
        q
          .eq('profileId', profileId)
          .eq('featureType', featureType)
          .eq('windowType', config.window)
          .eq('windowStart', windowStart)
      )
      .first();

    currentCount = rateLimitRecord?.count ?? 0;

    // Update cache with fetched value
    updateCache(profileId, featureType, windowStart, currentCount);
  }

  const remaining = Math.max(0, config.limit - currentCount);
  const allowed = currentCount < config.limit;

  // Calculate reset time
  const resetAt =
    config.window === 'hourly' ? windowStart + 60 * 60 * 1000 : windowStart + 24 * 60 * 60 * 1000;

  return { allowed, remaining, resetAt, cached };
}

/**
 * Increment the rate limit counter after a successful AI call
 * Invalidates the cache to ensure accurate counts
 */
export async function incrementRateLimit(
  ctx: MutationCtx,
  profileId: Id<'profiles'>,
  featureType: FeatureType
): Promise<{ newCount: number }> {
  const config = FEATURE_LIMITS[featureType];
  const windowStart = getWindowStart(config.window);

  // Invalidate cache immediately
  invalidateCache(profileId, featureType, windowStart);

  // Try to find existing record
  const existingRecord = await ctx.db
    .query('aiRateLimits')
    .withIndex('by_profile_feature_window', (q) =>
      q
        .eq('profileId', profileId)
        .eq('featureType', featureType)
        .eq('windowType', config.window)
        .eq('windowStart', windowStart)
    )
    .first();

  let newCount: number;

  if (existingRecord) {
    // Update existing record
    newCount = existingRecord.count + 1;
    await ctx.db.patch(existingRecord._id, {
      count: newCount,
    });
  } else {
    // Create new record
    newCount = 1;
    await ctx.db.insert('aiRateLimits', {
      profileId,
      featureType,
      windowType: config.window,
      windowStart,
      count: newCount,
    });
  }

  // Update cache with new count
  updateCache(profileId, featureType, windowStart, newCount);

  return { newCount };
}

/**
 * Log an AI usage event for cost tracking
 */
export async function logAIUsage(
  ctx: MutationCtx,
  args: {
    profileId: Id<'profiles'>;
    familyId: Id<'families'>;
    featureType: FeatureType;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    gameSlug?: 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';
    metadata?: unknown;
  }
): Promise<void> {
  await ctx.db.insert('aiUsageLogs', {
    profileId: args.profileId,
    familyId: args.familyId,
    featureType: args.featureType,
    model: args.model,
    inputTokens: args.inputTokens,
    outputTokens: args.outputTokens,
    estimatedCost: args.estimatedCost,
    gameSlug: args.gameSlug,
    metadata: args.metadata,
    timestamp: Date.now(),
  });
}

// ============================================================================
// CONVEX QUERIES AND MUTATIONS
// ============================================================================

/**
 * Internal query to check rate limit status for a feature
 */
export const getRateLimitStatus = internalQuery({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await checkRateLimit(ctx, args.profileId, args.featureType);
  },
});

/**
 * Query to get AI usage stats for a profile (for parent dashboard)
 */
export const getAIUsageStats = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()), // Default 7 days
  },
  handler: async (ctx, args) => {
    const daysAgo = args.days ?? 7;
    const startTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    const usageLogs = await ctx.db
      .query('aiUsageLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.gte(q.field('timestamp'), startTime))
      .collect();

    // Aggregate by feature type
    const byFeature: Record<string, { count: number; totalCost: number }> = {};
    let totalCost = 0;
    let totalCalls = 0;

    for (const log of usageLogs) {
      if (!byFeature[log.featureType]) {
        byFeature[log.featureType] = { count: 0, totalCost: 0 };
      }
      byFeature[log.featureType].count++;
      byFeature[log.featureType].totalCost += log.estimatedCost;
      totalCost += log.estimatedCost;
      totalCalls++;
    }

    return {
      totalCalls,
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      byFeature,
      period: `${daysAgo} days`,
    };
  },
});

/**
 * Query to get family-wide AI usage (for billing/admin)
 */
export const getFamilyAIUsage = query({
  args: {
    familyId: v.id('families'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysAgo = args.days ?? 30;
    const startTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    const usageLogs = await ctx.db
      .query('aiUsageLogs')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .filter((q) => q.gte(q.field('timestamp'), startTime))
      .collect();

    let totalCost = 0;
    let totalCalls = 0;
    const byProfile: Record<string, { count: number; cost: number }> = {};

    for (const log of usageLogs) {
      totalCost += log.estimatedCost;
      totalCalls++;

      const profileKey = log.profileId.toString();
      if (!byProfile[profileKey]) {
        byProfile[profileKey] = { count: 0, cost: 0 };
      }
      byProfile[profileKey].count++;
      byProfile[profileKey].cost += log.estimatedCost;
    }

    return {
      totalCalls,
      totalCost: Math.round(totalCost * 100) / 100,
      byProfile,
      period: `${daysAgo} days`,
    };
  },
});
