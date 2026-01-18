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
 * AI-Powered Trade Advisor
 *
 * Provides smart trade suggestions between siblings or family members
 * based on their collection data. Analyzes what each collector has that
 * the other might want, and suggests fair trades.
 *
 * Features:
 * - Find overlapping duplicates (cards one sibling has extras of that the other needs)
 * - Suggest balanced trades based on market value
 * - Consider each collector's preferences (favorite types, set completion goals)
 * - Provide kid-friendly explanations of why trades are fair
 *
 * Note: Internal queries are in tradeAdvisorHelpers.ts because
 * they cannot be in a 'use node' file.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TradeCard {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  marketPrice: number | null;
  types: string[];
}

export interface TradeSuggestion {
  fromProfile: {
    profileId: string;
    displayName: string;
    cards: TradeCard[];
    totalValue: number;
  };
  toProfile: {
    profileId: string;
    displayName: string;
    cards: TradeCard[];
    totalValue: number;
  };
  fairnessRating: 'very_fair' | 'fair' | 'slightly_uneven' | 'uneven';
  valueDifference: number;
  reason: string; // Kid-friendly explanation of why this trade is good
  tradeType: 'duplicate_swap' | 'wishlist_match' | 'set_completion' | 'type_match';
}

export interface TradeAdvisorResult {
  suggestions: TradeSuggestion[];
  summary: string; // Kid-friendly summary of trade opportunities
  analysisInsights: {
    profileA: {
      displayName: string;
      duplicateCount: number;
      wishlistMatchCount: number;
      favoriteTypes: string[];
    };
    profileB: {
      displayName: string;
      duplicateCount: number;
      wishlistMatchCount: number;
      favoriteTypes: string[];
    };
    overlapCount: number; // Cards that could be traded
  };
  error?: string;
}

// ============================================================================
// GAME-SPECIFIC TRADE ADVISOR PROMPTS
// ============================================================================

const TRADE_ADVISOR_PROMPTS: Record<GameSlug, string> = {
  pokemon: `You are helping kids trade Pokémon cards fairly!

Consider these factors for great trades:
- Evolution chains: Cards that complete a Pokémon's evolution line
- Type preferences: Match cards to each collector's favorite types
- Set completion: Help complete sets they're both working on
- Rarity balance: Similar rarity cards make fair trades
- Popular Pokémon: Everyone loves Pikachu and legendary Pokémon!

Make trades feel exciting and fair for both kids.`,

  yugioh: `You are helping young duelists trade Yu-Gi-Oh! cards fairly!

Consider these factors for great trades:
- Archetype support: Cards that match their favorite deck themes
- Monster types: Dragons, Warriors, Spellcasters, etc.
- Card types: Balance monsters, spells, and traps
- Rarity balance: Similar rarity cards make fair trades
- Iconic cards: Dark Magician, Blue-Eyes, etc.

Make trades feel like an exciting duel between friends!`,

  onepiece: `You are helping young pirates trade One Piece cards fairly!

Consider these factors for great trades:
- Crew preferences: Match cards to favorite crews (Straw Hats, etc.)
- Character favorites: Popular characters like Luffy, Zoro, etc.
- Color balance: Match trading colors
- Rarity balance: Similar rarity cards make fair trades
- Leader and character card preferences

Make trades feel like a friendly pirate adventure!`,

  lorcana: `You are helping young Illumineers trade Disney Lorcana cards fairly!

Consider these factors for great trades:
- Disney favorites: Match cards to favorite movies and characters
- Ink colors: Help balance their ink collections
- Card types: Characters, actions, items
- Rarity balance: Enchanted cards are special!
- Classic Disney vs. modern Disney preferences

Make trades feel like pure Disney magic!`,
};

// ============================================================================
// MAIN TRADE ADVISOR ACTION
// ============================================================================

/**
 * Get AI-powered trade suggestions between two collectors
 */
export const getTradeSuggestions = action({
  args: {
    profileIdA: v.id('profiles'),
    profileIdB: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    maxSuggestions: v.optional(v.number()), // Default 5
  },
  handler: async (ctx, args): Promise<TradeAdvisorResult> => {
    const maxSuggestions = Math.min(Math.max(args.maxSuggestions ?? 5, 1), 10);

    // Check rate limit
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileIdA, // Rate limit based on requesting profile
      featureType: 'trade_advisor',
    });

    if (!rateLimitCheck.allowed) {
      const hoursUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60 / 60);
      return {
        suggestions: [],
        summary: '',
        analysisInsights: {
          profileA: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          profileB: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          overlapCount: 0,
        },
        error: `You've asked for lots of trade ideas today! 🎴 Come back in ${hoursUntilReset} hours for more suggestions!`,
      };
    }

    // Verify both profiles are in the same family
    const familyCheck = await ctx.runQuery(internal.ai.tradeAdvisorHelpers.verifyFamilyProfiles, {
      profileIdA: args.profileIdA,
      profileIdB: args.profileIdB,
      familyId: args.familyId,
    });

    if (!familyCheck.valid) {
      return {
        suggestions: [],
        summary: '',
        analysisInsights: {
          profileA: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          profileB: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          overlapCount: 0,
        },
        error: 'These collectors need to be in the same family to trade! 👨‍👩‍👧‍👦',
      };
    }

    // Analyze both collections
    const analysis = await ctx.runQuery(internal.ai.tradeAdvisorHelpers.analyzeTradeOpportunities, {
      profileIdA: args.profileIdA,
      profileIdB: args.profileIdB,
      gameSlug: args.gameSlug,
    });

    if (analysis.tradeableCards.length === 0) {
      return {
        suggestions: [],
        summary: `${familyCheck.profileAName} and ${familyCheck.profileBName} don't have any cards to trade right now. Keep collecting, and trade opportunities will appear! 🌟`,
        analysisInsights: {
          profileA: {
            displayName: familyCheck.profileAName,
            duplicateCount: analysis.profileADuplicates,
            wishlistMatchCount: analysis.profileAWishlistMatches,
            favoriteTypes: analysis.profileAFavoriteTypes,
          },
          profileB: {
            displayName: familyCheck.profileBName,
            duplicateCount: analysis.profileBDuplicates,
            wishlistMatchCount: analysis.profileBWishlistMatches,
            favoriteTypes: analysis.profileBFavoriteTypes,
          },
          overlapCount: 0,
        },
      };
    }

    try {
      // Build the prompt for AI trade suggestions
      const gameContext = getGameContext(args.gameSlug);
      const tradePrompt = TRADE_ADVISOR_PROMPTS[args.gameSlug];
      const gameName = GAME_CONTEXTS[args.gameSlug].name;

      const collectionSummary = `
Trade Analysis for ${gameName}:

Collector A: ${familyCheck.profileAName}
- Has ${analysis.profileADuplicates} duplicate cards to trade
- ${analysis.profileAWishlistMatches} of their wishlist items are owned by ${familyCheck.profileBName}
- Favorite types: ${analysis.profileAFavoriteTypes.join(', ') || 'Not determined yet'}

Collector B: ${familyCheck.profileBName}
- Has ${analysis.profileBDuplicates} duplicate cards to trade
- ${analysis.profileBWishlistMatches} of their wishlist items are owned by ${familyCheck.profileAName}
- Favorite types: ${analysis.profileBFavoriteTypes.join(', ') || 'Not determined yet'}
`;

      const tradeableCardsList = analysis.tradeableCards
        .slice(0, 30) // Limit for prompt size
        .map(
          (
            card: {
              name: string;
              rarity?: string;
              ownerName: string;
              marketPrice?: number;
              types?: string[];
              wantedByName?: string;
            },
            i: number
          ) =>
            `${i + 1}. ${card.name} (${card.rarity || 'Common'}) - Owner: ${card.ownerName}, Price: $${card.marketPrice?.toFixed(2) || 'Unknown'}, Types: ${card.types?.join(', ') || 'None'}, Wanted by: ${card.wantedByName || 'Nobody specifically'}`
        )
        .join('\n');

      const userMessage = `${tradePrompt}

${collectionSummary}

Here are cards available for trading (owner has duplicates or doesn't need, and the other collector might want):

${tradeableCardsList}

Suggest up to ${maxSuggestions} fair trades between ${familyCheck.profileAName} and ${familyCheck.profileBName}.

For each trade suggestion:
1. Pick cards from each side that make a balanced trade
2. Explain why this trade is great for both collectors
3. Keep explanations fun and kid-friendly

Respond in JSON format:
{
  "summary": "A fun 1-2 sentence summary of the trade opportunities between these collectors",
  "suggestions": [
    {
      "fromProfileName": "${familyCheck.profileAName}",
      "fromCardIndices": [1, 2],
      "toProfileName": "${familyCheck.profileBName}",
      "toCardIndices": [5],
      "reason": "Kid-friendly reason why this trade is great for both!",
      "tradeType": "duplicate_swap|wishlist_match|set_completion|type_match"
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
        return createFallbackSuggestions(
          analysis,
          familyCheck.profileAName,
          familyCheck.profileBName,
          args.profileIdA,
          args.profileIdB,
          args.gameSlug,
          maxSuggestions
        );
      }

      // Parse JSON response
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      interface ParsedSuggestion {
        fromProfileName: string;
        fromCardIndices: number[];
        toProfileName: string;
        toCardIndices: number[];
        reason: string;
        tradeType: 'duplicate_swap' | 'wishlist_match' | 'set_completion' | 'type_match';
      }

      let parsed: {
        summary: string;
        suggestions: ParsedSuggestion[];
      };
      try {
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        return createFallbackSuggestions(
          analysis,
          familyCheck.profileAName,
          familyCheck.profileBName,
          args.profileIdA,
          args.profileIdB,
          args.gameSlug,
          maxSuggestions
        );
      }

      // Build trade suggestions from AI response
      const suggestions: TradeSuggestion[] = parsed.suggestions
        .map((sug: { fromCardIndices: number[]; toCardIndices: number[]; fromProfileName: string; toProfileName: string; reason: string; tradeType: TradeSuggestion['tradeType'] }) => {
          const fromCards: TradeCard[] = [];
          const toCards: TradeCard[] = [];

          // Map card indices to actual cards
          for (const idx of sug.fromCardIndices) {
            const cardIndex = idx - 1; // Convert 1-indexed to 0-indexed
            if (cardIndex >= 0 && cardIndex < analysis.tradeableCards.length) {
              const card = analysis.tradeableCards[cardIndex];
              fromCards.push({
                cardId: card.cardId,
                name: card.name,
                setId: card.setId,
                setName: card.setName,
                rarity: card.rarity || 'Common',
                imageUrl: card.imageSmall,
                marketPrice: card.marketPrice,
                types: card.types,
              });
            }
          }

          for (const idx of sug.toCardIndices) {
            const cardIndex = idx - 1;
            if (cardIndex >= 0 && cardIndex < analysis.tradeableCards.length) {
              const card = analysis.tradeableCards[cardIndex];
              toCards.push({
                cardId: card.cardId,
                name: card.name,
                setId: card.setId,
                setName: card.setName,
                rarity: card.rarity || 'Common',
                imageUrl: card.imageSmall,
                marketPrice: card.marketPrice,
                types: card.types,
              });
            }
          }

          if (fromCards.length === 0 || toCards.length === 0) {
            return null;
          }

          const fromTotal = fromCards.reduce((sum, c) => sum + (c.marketPrice || 0), 0);
          const toTotal = toCards.reduce((sum, c) => sum + (c.marketPrice || 0), 0);
          const valueDiff = Math.abs(fromTotal - toTotal);
          const avgValue = (fromTotal + toTotal) / 2;
          const percentDiff = avgValue > 0 ? (valueDiff / avgValue) * 100 : 0;

          let fairnessRating: TradeSuggestion['fairnessRating'] = 'very_fair';
          if (percentDiff > 30) fairnessRating = 'uneven';
          else if (percentDiff > 20) fairnessRating = 'slightly_uneven';
          else if (percentDiff > 10) fairnessRating = 'fair';

          // Determine which profile is "from" based on the suggestion
          const isFromProfileA = sug.fromProfileName === familyCheck.profileAName;

          return {
            fromProfile: {
              profileId: (isFromProfileA ? args.profileIdA : args.profileIdB) as string,
              displayName: sug.fromProfileName,
              cards: fromCards,
              totalValue: Math.round(fromTotal * 100) / 100,
            },
            toProfile: {
              profileId: (isFromProfileA ? args.profileIdB : args.profileIdA) as string,
              displayName: sug.toProfileName,
              cards: toCards,
              totalValue: Math.round(toTotal * 100) / 100,
            },
            fairnessRating,
            valueDifference: Math.round(valueDiff * 100) / 100,
            reason: sug.reason,
            tradeType: sug.tradeType,
          } as TradeSuggestion;
        })
        .filter((sug): sug is TradeSuggestion => sug !== null)
        .slice(0, maxSuggestions);

      // Log usage
      await ctx.runMutation(internal.ai.tradeAdvisorHelpers.logTradeAdvisorUsage, {
        profileId: args.profileIdA,
        familyId: args.familyId,
        gameSlug: args.gameSlug,
        suggestionCount: suggestions.length,
        model: MODELS.GPT4O_MINI,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      });

      return {
        suggestions,
        summary: parsed.summary,
        analysisInsights: {
          profileA: {
            displayName: familyCheck.profileAName,
            duplicateCount: analysis.profileADuplicates,
            wishlistMatchCount: analysis.profileAWishlistMatches,
            favoriteTypes: analysis.profileAFavoriteTypes,
          },
          profileB: {
            displayName: familyCheck.profileBName,
            duplicateCount: analysis.profileBDuplicates,
            wishlistMatchCount: analysis.profileBWishlistMatches,
            favoriteTypes: analysis.profileBFavoriteTypes,
          },
          overlapCount: analysis.tradeableCards.length,
        },
      };
    } catch (error) {
      console.error('Trade advisor error:', error);
      return createFallbackSuggestions(
        analysis,
        familyCheck.profileAName,
        familyCheck.profileBName,
        args.profileIdA,
        args.profileIdB,
        args.gameSlug,
        maxSuggestions
      );
    }
  },
});

/**
 * Create fallback suggestions when AI generation fails
 */
function createFallbackSuggestions(
  analysis: {
    profileADuplicates: number;
    profileAWishlistMatches: number;
    profileAFavoriteTypes: string[];
    profileBDuplicates: number;
    profileBWishlistMatches: number;
    profileBFavoriteTypes: string[];
    tradeableCards: Array<{
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity: string | undefined;
      imageSmall: string;
      marketPrice: number | null;
      types: string[];
      ownerProfileId: string;
      ownerName: string;
      wantedByName: string | null;
    }>;
  },
  profileAName: string,
  profileBName: string,
  profileIdA: string,
  profileIdB: string,
  gameSlug: GameSlug,
  maxSuggestions: number
): TradeAdvisorResult {
  const gameName = GAME_CONTEXTS[gameSlug].name;

  // Generate simple rule-based suggestions
  const suggestions: TradeSuggestion[] = [];

  // Group tradeable cards by owner
  const cardsByOwner = {
    A: analysis.tradeableCards.filter((c) => c.ownerProfileId === profileIdA),
    B: analysis.tradeableCards.filter((c) => c.ownerProfileId === profileIdB),
  };

  // Try to create simple 1-for-1 trades with similar values
  const sortedA = [...cardsByOwner.A].sort((a, b) => (a.marketPrice || 0) - (b.marketPrice || 0));
  const sortedB = [...cardsByOwner.B].sort((a, b) => (a.marketPrice || 0) - (b.marketPrice || 0));

  let aIdx = 0;
  let bIdx = 0;

  while (suggestions.length < maxSuggestions && aIdx < sortedA.length && bIdx < sortedB.length) {
    const cardA = sortedA[aIdx];
    const cardB = sortedB[bIdx];

    const priceA = cardA.marketPrice || 0;
    const priceB = cardB.marketPrice || 0;

    // Skip if prices are too different (more than 50% difference)
    const avgPrice = (priceA + priceB) / 2;
    const priceDiff = Math.abs(priceA - priceB);

    if (avgPrice > 0 && priceDiff / avgPrice < 0.5) {
      suggestions.push({
        fromProfile: {
          profileId: profileIdA,
          displayName: profileAName,
          cards: [
            {
              cardId: cardA.cardId,
              name: cardA.name,
              setId: cardA.setId,
              setName: cardA.setName,
              rarity: cardA.rarity || 'Common',
              imageUrl: cardA.imageSmall,
              marketPrice: cardA.marketPrice,
              types: cardA.types,
            },
          ],
          totalValue: Math.round(priceA * 100) / 100,
        },
        toProfile: {
          profileId: profileIdB,
          displayName: profileBName,
          cards: [
            {
              cardId: cardB.cardId,
              name: cardB.name,
              setId: cardB.setId,
              setName: cardB.setName,
              rarity: cardB.rarity || 'Common',
              imageUrl: cardB.imageSmall,
              marketPrice: cardB.marketPrice,
              types: cardB.types,
            },
          ],
          totalValue: Math.round(priceB * 100) / 100,
        },
        fairnessRating: priceDiff / avgPrice < 0.1 ? 'very_fair' : 'fair',
        valueDifference: Math.round(priceDiff * 100) / 100,
        reason: `${profileAName}'s ${cardA.name} and ${profileBName}'s ${cardB.name} are a great match!`,
        tradeType: 'duplicate_swap',
      });
    }

    // Move to next cards
    if (priceA <= priceB) {
      aIdx++;
    } else {
      bIdx++;
    }
  }

  return {
    suggestions,
    summary: `${profileAName} and ${profileBName} have some ${gameName} cards that could make great trades! 🎴`,
    analysisInsights: {
      profileA: {
        displayName: profileAName,
        duplicateCount: analysis.profileADuplicates,
        wishlistMatchCount: analysis.profileAWishlistMatches,
        favoriteTypes: analysis.profileAFavoriteTypes,
      },
      profileB: {
        displayName: profileBName,
        duplicateCount: analysis.profileBDuplicates,
        wishlistMatchCount: analysis.profileBWishlistMatches,
        favoriteTypes: analysis.profileBFavoriteTypes,
      },
      overlapCount: analysis.tradeableCards.length,
    },
  };
}

// ============================================================================
// QUICK TRADE CHECK
// ============================================================================

/**
 * Quick check to see if two profiles have potential trades
 * (lightweight version without AI)
 */
export const hasTradeOpportunities = action({
  args: {
    profileIdA: v.id('profiles'),
    profileIdB: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
  },
  handler: async (ctx, args): Promise<{
    hasOpportunities: boolean;
    reason?: string;
    tradeableCardCount?: number;
    duplicateCount?: number;
    wishlistMatchCount?: number;
    profileAName?: string;
    profileBName?: string;
  }> => {
    // Verify family
    const familyCheck = await ctx.runQuery(internal.ai.tradeAdvisorHelpers.verifyFamilyProfiles, {
      profileIdA: args.profileIdA,
      profileIdB: args.profileIdB,
      familyId: args.familyId,
    });

    if (!familyCheck.valid) {
      return {
        hasOpportunities: false,
        reason: 'Profiles must be in the same family',
      };
    }

    // Quick analysis
    const analysis = await ctx.runQuery(internal.ai.tradeAdvisorHelpers.analyzeTradeOpportunities, {
      profileIdA: args.profileIdA,
      profileIdB: args.profileIdB,
      gameSlug: args.gameSlug,
    });

    const totalDuplicates = analysis.profileADuplicates + analysis.profileBDuplicates;
    const totalWishlistMatches =
      analysis.profileAWishlistMatches + analysis.profileBWishlistMatches;

    return {
      hasOpportunities: analysis.tradeableCards.length > 0,
      tradeableCardCount: analysis.tradeableCards.length,
      duplicateCount: totalDuplicates,
      wishlistMatchCount: totalWishlistMatches,
      profileAName: familyCheck.profileAName,
      profileBName: familyCheck.profileBName,
    };
  },
});

// ============================================================================
// HELPER ACTIONS
// ============================================================================

/**
 * Get remaining trade advisor uses for today
 */
export const getRemainingTradeAdvice = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<{ remaining: number; resetAt: number; limit: number }> => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'trade_advisor',
    });

    return {
      remaining: status.remaining,
      resetAt: status.resetAt,
      limit: 10, // Daily limit
    };
  },
});
