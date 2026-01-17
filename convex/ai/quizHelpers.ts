import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';

/**
 * Quiz Generator Helper Functions
 *
 * These are internal mutations and queries used by the quiz generator.
 * They are in a separate file because they cannot be in a 'use node' file.
 */

// ============================================================================
// INTERNAL QUERIES
// ============================================================================

/**
 * Get random cards from a user's collection for quiz generation
 */
export const getRandomCollectionCards = internalQuery({
  args: {
    profileId: v.id('profiles'),
    count: v.number(),
    gameSlug: v.optional(
      v.union(
        v.literal('pokemon'),
        v.literal('yugioh'),
        v.literal('onepiece'),
        v.literal('lorcana')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return [];
    }

    // Get card IDs
    const cardIds = collectionCards.map((c) => c.cardId);

    // Fetch card details from cache
    const cardDetailsPromises = cardIds.map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );

    const cardDetails = await Promise.all(cardDetailsPromises);

    // Filter out nulls and optionally filter by game
    let validCards = cardDetails.filter((card): card is NonNullable<typeof card> => card !== null);

    if (args.gameSlug) {
      validCards = validCards.filter((card) => card.gameSlug === args.gameSlug);
    }

    // Shuffle and take requested count
    const shuffled = validCards.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, args.count);
  },
});

/**
 * Get quiz statistics for a profile
 */
export const getQuizStats = internalQuery({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysAgo = args.days ?? 30;
    const startTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    // Get quiz activity logs
    const quizLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.gte(q.field('timestamp'), startTime))
      .collect();

    // Filter to quiz completions
    const quizCompletions = quizLogs.filter(
      (log) =>
        log.action === 'achievement_earned' &&
        (log.metadata as { type?: string })?.type === 'quiz_completed'
    );

    // Calculate stats
    let totalQuizzes = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalXpEarned = 0;

    for (const log of quizCompletions) {
      const metadata = log.metadata as {
        score?: number;
        totalQuestions?: number;
        xpEarned?: number;
      };
      totalQuizzes++;
      totalCorrect += metadata.score ?? 0;
      totalQuestions += metadata.totalQuestions ?? 0;
      totalXpEarned += metadata.xpEarned ?? 0;
    }

    return {
      totalQuizzes,
      totalCorrect,
      totalQuestions,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      totalXpEarned,
      period: `${daysAgo} days`,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Log quiz generation for usage tracking
 */
export const logQuizGeneration = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    quizId: v.string(),
    questionCount: v.number(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const estimatedCost = (args.inputTokens * 0.00015 + args.outputTokens * 0.0006) / 1000;

    // Log usage
    await ctx.db.insert('aiUsageLogs', {
      profileId: args.profileId,
      familyId: args.familyId,
      featureType: 'quiz',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        quizId: args.quizId,
        questionCount: args.questionCount,
      },
      timestamp: now,
    });

    // Increment rate limit (daily)
    const windowStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ).getTime();

    const existingRecord = await ctx.db
      .query('aiRateLimits')
      .withIndex('by_profile_feature_window', (q) =>
        q
          .eq('profileId', args.profileId)
          .eq('featureType', 'quiz')
          .eq('windowType', 'daily')
          .eq('windowStart', windowStart)
      )
      .first();

    if (existingRecord) {
      await ctx.db.patch(existingRecord._id, {
        count: existingRecord.count + 1,
      });
    } else {
      await ctx.db.insert('aiRateLimits', {
        profileId: args.profileId,
        featureType: 'quiz',
        windowType: 'daily',
        windowStart,
        count: 1,
      });
    }
  },
});

/**
 * Award XP for completing a quiz
 */
export const awardQuizXp = internalMutation({
  args: {
    profileId: v.id('profiles'),
    xpAmount: v.number(),
    quizId: v.string(),
    score: v.number(),
    totalQuestions: v.number(),
  },
  handler: async (ctx, args) => {
    // Get current profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Update XP
    const currentXp = profile.xp ?? 0;
    const newXp = currentXp + args.xpAmount;

    // Calculate level (100 XP per level)
    const newLevel = Math.floor(newXp / 100) + 1;

    await ctx.db.patch(args.profileId, {
      xp: newXp,
      level: newLevel,
    });

    // Log activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        type: 'quiz_completed',
        quizId: args.quizId,
        score: args.score,
        totalQuestions: args.totalQuestions,
        xpEarned: args.xpAmount,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      newXp,
      newLevel,
      xpGained: args.xpAmount,
    };
  },
});
