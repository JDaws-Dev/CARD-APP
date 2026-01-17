'use node';

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import {
  openai,
  MODELS,
  TOKEN_LIMITS,
  safetySystemPrompt,
  getGameContext,
  GAME_CONTEXTS,
} from './openai';
import type { GameSlug } from './openai';

/**
 * AI-Powered Card Recommendations
 *
 * Provides smart card recommendations based on the user's collection patterns,
 * preferences, and goals. Analyzes what they already collect to suggest
 * cards they might enjoy adding to their collection.
 *
 * Features:
 * - Set completion suggestions (cards needed to complete sets)
 * - Type/theme-based recommendations (based on favorite types)
 * - Similar card suggestions (cards like ones they already own)
 * - Trending/popular card suggestions for their age group
 * - Budget-friendly alternatives
 *
 * Note: Internal queries are in recommendationsHelpers.ts because
 * they cannot be in a 'use node' file.
 */

// ============================================================================
// TYPES
// ============================================================================

export type RecommendationType =
  | 'set_completion' // Cards to complete sets they're working on
  | 'type_based' // Based on their favorite types
  | 'similar_cards' // Cards similar to ones they love
  | 'diversify' // Expand into new types/sets
  | 'wishlist_similar'; // Cards similar to their wishlist

export interface CardRecommendation {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  reason: string; // Kid-friendly explanation of why this is recommended
  recommendationType: RecommendationType;
  matchScore: number; // 0-100, how well this matches their preferences
}

export interface RecommendationResult {
  recommendations: CardRecommendation[];
  summary: string; // Kid-friendly summary of recommendations
  collectionInsights: {
    favoriteTypes: string[];
    activeSets: string[];
    collectionStyle: string; // e.g., "type collector", "set completionist"
  };
  error?: string;
}

// ============================================================================
// GAME-SPECIFIC RECOMMENDATION PROMPTS
// ============================================================================

const RECOMMENDATION_PROMPTS: Record<GameSlug, string> = {
  pokemon: `You are recommending Pokémon cards to a young collector!

Consider these factors:
- Their favorite Pokémon types (Fire, Water, Grass, etc.)
- Evolution chains they might want to complete
- Sets they're actively collecting
- Rare cards that match their collection style
- Cards featuring popular Pokémon they don't have yet

Keep recommendations fun and achievable for kids collecting cards.`,

  yugioh: `You are recommending Yu-Gi-Oh! cards to a young duelist!

Consider these factors:
- Their favorite archetypes and card types
- Cards that would strengthen their collection themes
- Monster types and attributes they prefer
- Cards from sets they're actively collecting
- Iconic cards they might be missing

Focus on collection value rather than competitive deck building.`,

  mtg: `You are recommending Magic: The Gathering cards to a young collector!

Consider these factors:
- Their favorite colors and color combinations
- Creature types they collect
- Sets they're working on completing
- Cards with cool art they might enjoy
- Legendary creatures and planeswalkers

Keep it focused on collecting fun, not competitive play.`,

  onepiece: `You are recommending One Piece cards to a young collector!

Consider these factors:
- Their favorite crews (Straw Hats, Whitebeard Pirates, etc.)
- Character types they collect
- Colors they prefer
- Sets they're actively collecting
- Iconic characters they're missing

Focus on collecting beloved characters from the series.`,

  lorcana: `You are recommending Disney Lorcana cards to a young collector!

Consider these factors:
- Their favorite Disney characters and movies
- Ink colors they prefer
- Card types they collect (Characters, Actions, Items)
- Sets they're working on
- Enchanted and rare cards they might enjoy

Make it magical and Disney-themed!`,

  digimon: `You are recommending Digimon cards to a young collector!

Consider these factors:
- Their favorite Digimon and evolution lines
- Digimon levels they collect
- Colors and types they prefer
- Sets they're actively collecting
- Partner Digimon they might want

Focus on completing Digivolution chains!`,

  dragonball: `You are recommending Dragon Ball cards to a young collector!

Consider these factors:
- Their favorite Dragon Ball characters and transformations
- Energy colors they prefer
- Character families (Saiyan, Namekian, etc.)
- Sets they're collecting
- Iconic moments and characters they're missing

Make it power-packed and exciting!`,
};

// ============================================================================
// MAIN RECOMMENDATION ACTION
// ============================================================================

/**
 * Get personalized card recommendations based on collection patterns
 */
export const getRecommendations = action({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('mtg'),
      v.literal('onepiece'),
      v.literal('lorcana'),
      v.literal('digimon'),
      v.literal('dragonball')
    ),
    recommendationTypes: v.optional(
      v.array(
        v.union(
          v.literal('set_completion'),
          v.literal('type_based'),
          v.literal('similar_cards'),
          v.literal('diversify'),
          v.literal('wishlist_similar')
        )
      )
    ),
    limit: v.optional(v.number()), // Default 10
  },
  handler: async (ctx, args): Promise<RecommendationResult> => {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 20);
    const recommendationTypes = args.recommendationTypes ?? [
      'set_completion',
      'type_based',
      'similar_cards',
    ];

    // Check rate limit
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'recommendation',
    });

    if (!rateLimitCheck.allowed) {
      const hoursUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60 / 60);
      return {
        recommendations: [],
        summary: '',
        collectionInsights: {
          favoriteTypes: [],
          activeSets: [],
          collectionStyle: '',
        },
        error: `You've asked for lots of recommendations today! 🎴 Come back in ${hoursUntilReset} hours for more suggestions!`,
      };
    }

    // Get collection analysis
    const collectionAnalysis = await ctx.runQuery(
      internal.ai.recommendationsHelpers.analyzeCollectionPatterns,
      {
        profileId: args.profileId,
        gameSlug: args.gameSlug,
      }
    );

    if (collectionAnalysis.totalCards < 5) {
      return {
        recommendations: [],
        summary:
          "You're just getting started! Add more cards to your collection, and I'll learn what you like and give you awesome recommendations! 🌟",
        collectionInsights: {
          favoriteTypes: [],
          activeSets: [],
          collectionStyle: 'new collector',
        },
        error: 'Need at least 5 cards for personalized recommendations',
      };
    }

    // Get candidate cards for recommendations
    const candidateCards = await ctx.runQuery(
      internal.ai.recommendationsHelpers.getCandidateCards,
      {
        profileId: args.profileId,
        gameSlug: args.gameSlug,
        favoriteTypes: collectionAnalysis.favoriteTypes,
        activeSets: collectionAnalysis.activeSets,
        limit: 50, // Get more candidates than needed for AI to select from
      }
    );

    if (candidateCards.length === 0) {
      return createFallbackRecommendations(collectionAnalysis, args.gameSlug);
    }

    try {
      // Build the prompt for AI recommendations
      const gameContext = getGameContext(args.gameSlug);
      const recommendationPrompt = RECOMMENDATION_PROMPTS[args.gameSlug];
      const gameName = GAME_CONTEXTS[args.gameSlug].name;

      const collectionSummary = `
Collection Analysis for this ${gameName} collector:
- Total unique cards: ${collectionAnalysis.totalCards}
- Favorite types: ${collectionAnalysis.favoriteTypes.join(', ') || 'None yet'}
- Active sets: ${collectionAnalysis.activeSets.map((s) => s.name).join(', ') || 'None yet'}
- Set completion progress: ${collectionAnalysis.activeSets.map((s) => `${s.name}: ${s.owned}/${s.total}`).join(', ') || 'N/A'}
- Collection style: ${collectionAnalysis.collectionStyle}
- Recently added types: ${collectionAnalysis.recentTypes.join(', ') || 'None'}
`;

      const candidatesList = candidateCards
        .map(
          (card, i) =>
            `${i + 1}. ${card.name} (${card.rarity || 'Common'}, Set: ${card.setName}, Types: ${card.types?.join(', ') || 'None'})`
        )
        .join('\n');

      const typesRequested = recommendationTypes.join(', ');

      const userMessage = `${recommendationPrompt}

${collectionSummary}

Based on this collector's patterns, select the ${limit} best cards to recommend from these candidates:

${candidatesList}

Recommendation types to prioritize: ${typesRequested}

For each recommended card, provide:
1. Why this card matches their collection style
2. A fun, encouraging reason a kid would understand
3. A match score (0-100) based on how well it fits their preferences

Respond in JSON format:
{
  "summary": "A fun 1-2 sentence summary of why these cards are great for this collector",
  "recommendations": [
    {
      "cardIndex": 1,
      "reason": "Kid-friendly reason why this card is perfect for them",
      "recommendationType": "set_completion|type_based|similar_cards|diversify|wishlist_similar",
      "matchScore": 85
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        max_tokens: TOKEN_LIMITS.RECOMMENDATIONS,
        messages: [
          {
            role: 'system',
            content: `${safetySystemPrompt}\n\n${gameContext}`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return createFallbackRecommendations(collectionAnalysis, args.gameSlug);
      }

      // Parse JSON response
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      interface ParsedRecommendation {
        cardIndex: number;
        reason: string;
        recommendationType: RecommendationType;
        matchScore: number;
      }

      let parsed: {
        summary: string;
        recommendations: ParsedRecommendation[];
      };
      try {
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        return createFallbackRecommendations(collectionAnalysis, args.gameSlug);
      }

      // Build recommendation results
      const recommendations: CardRecommendation[] = parsed.recommendations
        .map((rec) => {
          const cardIndex = rec.cardIndex - 1; // Convert 1-indexed to 0-indexed
          if (cardIndex < 0 || cardIndex >= candidateCards.length) return null;

          const card = candidateCards[cardIndex];
          return {
            cardId: card.cardId,
            name: card.name,
            setId: card.setId,
            setName: card.setName,
            rarity: card.rarity || 'Common',
            imageUrl: card.imageSmall,
            reason: rec.reason,
            recommendationType: rec.recommendationType,
            matchScore: Math.min(100, Math.max(0, rec.matchScore)),
          };
        })
        .filter((rec): rec is CardRecommendation => rec !== null)
        .slice(0, limit);

      // Log usage
      await ctx.runMutation(internal.ai.recommendationsHelpers.logRecommendationGeneration, {
        profileId: args.profileId,
        familyId: args.familyId,
        gameSlug: args.gameSlug,
        recommendationCount: recommendations.length,
        model: MODELS.GPT4O_MINI,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      });

      return {
        recommendations,
        summary: parsed.summary,
        collectionInsights: {
          favoriteTypes: collectionAnalysis.favoriteTypes,
          activeSets: collectionAnalysis.activeSets.map((s) => s.name),
          collectionStyle: collectionAnalysis.collectionStyle,
        },
      };
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return createFallbackRecommendations(collectionAnalysis, args.gameSlug);
    }
  },
});

/**
 * Create fallback recommendations when AI generation fails
 */
function createFallbackRecommendations(
  analysis: {
    totalCards: number;
    favoriteTypes: string[];
    activeSets: Array<{ setId: string; name: string; owned: number; total: number }>;
    collectionStyle: string;
    recentTypes: string[];
  },
  gameSlug: GameSlug
): RecommendationResult {
  const gameName = GAME_CONTEXTS[gameSlug].name;

  return {
    recommendations: [],
    summary: `Keep collecting ${gameName} cards! Based on your collection, you love ${analysis.favoriteTypes[0] || 'all types'} cards. Check out more from your favorite sets! 🌟`,
    collectionInsights: {
      favoriteTypes: analysis.favoriteTypes,
      activeSets: analysis.activeSets.map((s) => s.name),
      collectionStyle: analysis.collectionStyle,
    },
  };
}

// ============================================================================
// SET COMPLETION RECOMMENDATIONS
// ============================================================================

/**
 * Get cards needed to complete sets the user is actively collecting
 */
export const getSetCompletionRecommendations = action({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('mtg'),
      v.literal('onepiece'),
      v.literal('lorcana'),
      v.literal('digimon'),
      v.literal('dragonball')
    ),
    setId: v.optional(v.string()), // Specific set, or null for closest-to-completion
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<RecommendationResult> => {
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 20);

    // Check rate limit
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'recommendation',
    });

    if (!rateLimitCheck.allowed) {
      const hoursUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60 / 60);
      return {
        recommendations: [],
        summary: '',
        collectionInsights: {
          favoriteTypes: [],
          activeSets: [],
          collectionStyle: '',
        },
        error: `You've asked for lots of recommendations today! 🎴 Come back in ${hoursUntilReset} hours for more suggestions!`,
      };
    }

    // Get missing cards for set completion
    const missingCards = await ctx.runQuery(
      internal.ai.recommendationsHelpers.getMissingCardsForSets,
      {
        profileId: args.profileId,
        gameSlug: args.gameSlug,
        setId: args.setId,
        limit: limit * 2, // Get extra to filter by rarity preference
      }
    );

    if (missingCards.cards.length === 0) {
      return {
        recommendations: [],
        summary: args.setId
          ? "You've completed this set! Amazing job! 🏆"
          : "You're making great progress on your sets! Keep collecting! 🌟",
        collectionInsights: {
          favoriteTypes: [],
          activeSets: missingCards.activeSets.map((s) => s.name),
          collectionStyle: 'set completionist',
        },
      };
    }

    // Convert to recommendations format
    const recommendations: CardRecommendation[] = missingCards.cards
      .slice(0, limit)
      .map((card) => ({
        cardId: card.cardId,
        name: card.name,
        setId: card.setId,
        setName: card.setName,
        rarity: card.rarity || 'Common',
        imageUrl: card.imageSmall,
        reason: `This card will bring you closer to completing ${card.setName}! You have ${card.setProgress.owned}/${card.setProgress.total} cards.`,
        recommendationType: 'set_completion' as RecommendationType,
        matchScore: Math.round((card.setProgress.owned / card.setProgress.total) * 100),
      }));

    // Log usage
    await ctx.runMutation(internal.ai.recommendationsHelpers.logRecommendationGeneration, {
      profileId: args.profileId,
      familyId: args.familyId,
      gameSlug: args.gameSlug,
      recommendationCount: recommendations.length,
      model: 'rule_based', // No AI call for set completion
      inputTokens: 0,
      outputTokens: 0,
    });

    const topSet = missingCards.activeSets[0];
    return {
      recommendations,
      summary: topSet
        ? `You're ${Math.round((topSet.owned / topSet.total) * 100)}% done with ${topSet.name}! Here are some cards to get you closer! 🎯`
        : 'Here are some cards to help complete your sets! 📚',
      collectionInsights: {
        favoriteTypes: [],
        activeSets: missingCards.activeSets.map((s) => s.name),
        collectionStyle: 'set completionist',
      },
    };
  },
});

// ============================================================================
// HELPER ACTIONS
// ============================================================================

/**
 * Get remaining recommendations for today
 */
export const getRemainingRecommendations = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'recommendation',
    });

    return {
      remaining: status.remaining,
      resetAt: status.resetAt,
      limit: 20, // Daily limit
    };
  },
});
