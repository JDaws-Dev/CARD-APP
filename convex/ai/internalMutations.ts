import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

/**
 * Internal mutations for AI features
 *
 * These are separated from Node.js action files because mutations
 * must run in the Convex runtime, not Node.js.
 */

/**
 * Internal mutation to log card scan usage
 */
export const logCardScan = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCost: v.number(),
    identified: v.boolean(),
    cardName: v.optional(v.string()),
    suggestedCardId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    // Log the usage
    await ctx.db.insert('aiUsageLogs', {
      profileId: args.profileId,
      familyId: args.familyId,
      featureType: 'card_scan',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost: args.estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        identified: args.identified,
        cardName: args.cardName,
        suggestedCardId: args.suggestedCardId,
      },
      timestamp: Date.now(),
    });

    // Increment rate limit
    const config = { limit: 20, window: 'daily' as const };
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const existingRecord = await ctx.db
      .query('aiRateLimits')
      .withIndex('by_profile_feature_window', (q) =>
        q
          .eq('profileId', args.profileId)
          .eq('featureType', 'card_scan')
          .eq('windowType', config.window)
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
        featureType: 'card_scan',
        windowType: config.window,
        windowStart,
        count: 1,
      });
    }
  },
});

/**
 * Log a chat message and update rate limits
 */
export const logChatMessage = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    userMessage: v.string(),
    assistantMessage: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    usedFunctions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Save user message to chat history
    await ctx.db.insert('aiChatHistory', {
      profileId: args.profileId,
      role: 'user',
      content: args.userMessage,
      gameSlug: args.gameSlug,
      timestamp: now,
    });

    // Save assistant message to chat history
    await ctx.db.insert('aiChatHistory', {
      profileId: args.profileId,
      role: 'assistant',
      content: args.assistantMessage,
      gameSlug: args.gameSlug,
      timestamp: now + 1, // Ensure ordering
    });

    // Log usage
    const estimatedCost = (args.inputTokens * 0.00015 + args.outputTokens * 0.0006) / 1000; // GPT-4o-mini pricing

    await ctx.db.insert('aiUsageLogs', {
      profileId: args.profileId,
      familyId: args.familyId,
      featureType: 'chat',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        usedFunctions: args.usedFunctions,
      },
      timestamp: now,
    });

    // Increment rate limit
    const windowStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours()
    ).getTime();

    const existingRecord = await ctx.db
      .query('aiRateLimits')
      .withIndex('by_profile_feature_window', (q) =>
        q
          .eq('profileId', args.profileId)
          .eq('featureType', 'chat')
          .eq('windowType', 'hourly')
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
        featureType: 'chat',
        windowType: 'hourly',
        windowStart,
        count: 1,
      });
    }

    // Clean up old chat history (keep last 50 messages per profile)
    const allHistory = await ctx.db
      .query('aiChatHistory')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .collect();

    if (allHistory.length > 50) {
      const toDelete = allHistory.slice(50);
      for (const msg of toDelete) {
        await ctx.db.delete(msg._id);
      }
    }
  },
});

/**
 * Clear chat history for a profile
 */
export const clearChatHistory = internalMutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query('aiChatHistory')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const msg of history) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: history.length };
  },
});

/**
 * Log story generation
 */
export const logStoryGeneration = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    cardId: v.string(),
    cardName: v.string(),
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
      featureType: 'story',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        cardId: args.cardId,
        cardName: args.cardName,
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
          .eq('featureType', 'story')
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
        featureType: 'story',
        windowType: 'daily',
        windowStart,
        count: 1,
      });
    }
  },
});

/**
 * Log condition grading usage
 */
export const logConditionGrading = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCost: v.number(),
    grade: v.union(
      v.literal('NM'),
      v.literal('LP'),
      v.literal('MP'),
      v.literal('HP'),
      v.literal('DMG')
    ),
    confidence: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    cardName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Log usage
    await ctx.db.insert('aiUsageLogs', {
      profileId: args.profileId,
      familyId: args.familyId,
      featureType: 'condition_grading',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost: args.estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        grade: args.grade,
        confidence: args.confidence,
        cardName: args.cardName,
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
          .eq('featureType', 'condition_grading')
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
        featureType: 'condition_grading',
        windowType: 'daily',
        windowStart,
        count: 1,
      });
    }
  },
});
