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
 * AI-Powered Shopping Assistant for Parents
 *
 * Helps parents find the perfect gifts by analyzing their child's:
 * - Wishlist items (priority and regular)
 * - Set completion progress (cards needed to complete sets)
 * - Collection patterns (favorite types, themes)
 * - Budget constraints
 *
 * Features:
 * - Budget-aware recommendations
 * - Set completion bundles (suggest cards that complete sets together)
 * - Priority wishlist highlighting
 * - Price range filtering
 * - Gift occasion suggestions (birthday, holiday, achievement reward)
 *
 * Note: Internal queries are in shoppingAssistantHelpers.ts because
 * they cannot be in a 'use node' file.
 */

// ============================================================================
// TYPES
// ============================================================================

export type GiftOccasion = 'birthday' | 'holiday' | 'reward' | 'just_because';
export type PriceRange = 'budget' | 'moderate' | 'premium';

export interface GiftSuggestion {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  estimatedPrice: number | null;
  reason: string; // Why this is a good gift for the child
  category: 'wishlist_priority' | 'wishlist' | 'set_completion' | 'type_match' | 'popular';
  setCompletionInfo?: {
    cardsOwned: number;
    totalCards: number;
    percentComplete: number;
    cardsNeeded: number;
  };
}

export interface GiftBundle {
  name: string; // e.g., "Complete the Scarlet & Violet set!"
  cards: GiftSuggestion[];
  totalPrice: number;
  reason: string;
  bundleType: 'set_completion' | 'type_theme' | 'wishlist_batch';
}

export interface ShoppingAssistantResult {
  suggestions: GiftSuggestion[];
  bundles: GiftBundle[];
  summary: string; // Parent-friendly summary
  collectorProfile: {
    displayName: string;
    favoriteTypes: string[];
    activeSets: string[];
    wishlistCount: number;
    priorityWishlistCount: number;
  };
  budgetAnalysis: {
    totalWishlistValue: number;
    averageCardPrice: number;
    budgetFriendlyCount: number; // Cards under $5
    moderateCount: number; // Cards $5-$20
    premiumCount: number; // Cards over $20
  };
  error?: string;
}

// ============================================================================
// GAME-SPECIFIC SHOPPING ASSISTANT PROMPTS
// ============================================================================

const SHOPPING_PROMPTS: Record<GameSlug, string> = {
  pokemon: `You are helping a parent find the perfect Pokémon card gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Cards that complete Evolution chains make thoughtful gifts
- Sets closer to completion feel rewarding to finish
- Popular Pokémon (Pikachu, Charizard, Eevee) are always appreciated
- Match the child's favorite types for personalized gifts

Focus on making gift-giving special and meaningful for young collectors.`,

  yugioh: `You are helping a parent find the perfect Yu-Gi-Oh! card gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Cards that complete archetypes make powerful gifts
- Iconic cards (Blue-Eyes, Dark Magician) are collector favorites
- Match their favorite card types and attributes
- Sets closer to completion feel rewarding to finish

Focus on making gift-giving special for young duelists.`,

  mtg: `You are helping a parent find the perfect Magic: The Gathering gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Cards that match their favorite colors
- Legendary creatures and planeswalkers are popular
- Complete playset suggestions (4 copies for deck building)
- Sets closer to completion feel rewarding

Focus on thoughtful gifts for young Planeswalkers.`,

  onepiece: `You are helping a parent find the perfect One Piece card gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Cards featuring favorite crews (Straw Hats, etc.)
- Popular characters (Luffy, Zoro, Nami) are always appreciated
- Leader cards make exciting gifts
- Sets closer to completion feel rewarding

Make gift-giving feel like a pirate adventure!`,

  lorcana: `You are helping a parent find the perfect Disney Lorcana gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Cards from favorite Disney movies
- Enchanted cards are extra special
- Match their favorite ink colors
- Sets closer to completion feel rewarding

Make gift-giving magical for Disney fans!`,

  digimon: `You are helping a parent find the perfect Digimon card gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Cards that complete Digivolution lines
- Partner Digimon are special to collectors
- Match their favorite Digimon levels and colors
- Sets closer to completion feel rewarding

Make gift-giving feel like a Digi-adventure!`,

  dragonball: `You are helping a parent find the perfect Dragon Ball card gifts!

Consider these factors for great gift suggestions:
- Priority wishlist items are most wanted
- Transformation cards (Super Saiyan) are exciting
- Popular characters (Goku, Vegeta) are always appreciated
- Match their favorite energy colors
- Sets closer to completion feel rewarding

Make gift-giving power-packed for young fighters!`,
};

// ============================================================================
// MAIN SHOPPING ASSISTANT ACTION
// ============================================================================

/**
 * Get AI-powered gift suggestions for a child's collection
 * Designed for parents to find the perfect gifts
 */
export const getGiftSuggestions = action({
  args: {
    parentProfileId: v.id('profiles'), // Parent making the request
    childProfileId: v.id('profiles'), // Child to shop for
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
    budget: v.optional(v.number()), // Max total budget in USD
    occasion: v.optional(
      v.union(
        v.literal('birthday'),
        v.literal('holiday'),
        v.literal('reward'),
        v.literal('just_because')
      )
    ),
    maxSuggestions: v.optional(v.number()), // Default 10
    includeBundles: v.optional(v.boolean()), // Default true
  },
  handler: async (ctx, args): Promise<ShoppingAssistantResult> => {
    const maxSuggestions = Math.min(Math.max(args.maxSuggestions ?? 10, 1), 20);
    const includeBundles = args.includeBundles ?? true;
    const occasion = args.occasion ?? 'just_because';
    const budget = args.budget;

    // Check rate limit (using parent's profile for rate limiting)
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.parentProfileId,
      featureType: 'shopping_assistant',
    });

    if (!rateLimitCheck.allowed) {
      const hoursUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60 / 60);
      return createErrorResult(
        `You've used the shopping assistant a lot today! Come back in ${hoursUntilReset} hours for more suggestions.`
      );
    }

    // Verify parent has access to this child's profile
    const accessCheck = await ctx.runQuery(
      internal.ai.shoppingAssistantHelpers.verifyParentAccess,
      {
        parentProfileId: args.parentProfileId,
        childProfileId: args.childProfileId,
        familyId: args.familyId,
      }
    );

    if (!accessCheck.valid) {
      return createErrorResult("You don't have access to view this collector's profile.");
    }

    // Analyze the child's collection and wishlist
    const analysis = await ctx.runQuery(internal.ai.shoppingAssistantHelpers.analyzeForGifts, {
      profileId: args.childProfileId,
      gameSlug: args.gameSlug,
    });

    if (analysis.wishlistItems.length === 0 && analysis.activeSets.length === 0) {
      return {
        suggestions: [],
        bundles: [],
        summary: `${accessCheck.childDisplayName} hasn't added any cards to their wishlist yet, and they're just getting started with their collection. Consider getting them a booster pack or starter deck to begin their collection!`,
        collectorProfile: {
          displayName: accessCheck.childDisplayName,
          favoriteTypes: [],
          activeSets: [],
          wishlistCount: 0,
          priorityWishlistCount: 0,
        },
        budgetAnalysis: {
          totalWishlistValue: 0,
          averageCardPrice: 0,
          budgetFriendlyCount: 0,
          moderateCount: 0,
          premiumCount: 0,
        },
      };
    }

    // Get candidate cards for suggestions
    const candidates = await ctx.runQuery(internal.ai.shoppingAssistantHelpers.getGiftCandidates, {
      profileId: args.childProfileId,
      gameSlug: args.gameSlug,
      budget: budget,
      limit: 50, // Get extra for AI to select from
    });

    try {
      // Build the prompt for AI gift suggestions
      const gameContext = getGameContext(args.gameSlug);
      const shoppingPrompt = SHOPPING_PROMPTS[args.gameSlug];
      const gameName = GAME_CONTEXTS[args.gameSlug].name;

      const collectorSummary = `
Gift Shopping for ${accessCheck.childDisplayName}'s ${gameName} Collection:

Collector Profile:
- Total unique cards: ${analysis.totalCards}
- Favorite types: ${analysis.favoriteTypes.join(', ') || 'Still discovering!'}
- Active sets: ${analysis.activeSets.map((s: { name: string }) => s.name).join(', ') || 'Just starting out'}
- Wishlist items: ${analysis.wishlistItems.length} cards (${analysis.priorityCount} priority)
- Collection style: ${analysis.collectionStyle}

Gift Occasion: ${occasionDescription(occasion)}
${budget ? `Budget: Up to $${budget.toFixed(2)}` : 'Budget: Flexible'}
`;

      const wishlistSection =
        analysis.wishlistItems.length > 0
          ? `
Priority Wishlist Items (Most Wanted):
${analysis.wishlistItems
  .filter((c: { isPriority: boolean }) => c.isPriority)
  .slice(0, 10)
  .map(
    (card: { name: string; rarity?: string; setName: string; marketPrice?: number }, i: number) =>
      `${i + 1}. ${card.name} (${card.rarity || 'Common'}, Set: ${card.setName}, Price: $${card.marketPrice?.toFixed(2) || 'Unknown'})`
  )
  .join('\n')}

Other Wishlist Items:
${analysis.wishlistItems
  .filter((c: { isPriority: boolean }) => !c.isPriority)
  .slice(0, 10)
  .map(
    (card: { name: string; rarity?: string; setName: string; marketPrice?: number }, i: number) =>
      `${i + 1}. ${card.name} (${card.rarity || 'Common'}, Set: ${card.setName}, Price: $${card.marketPrice?.toFixed(2) || 'Unknown'})`
  )
  .join('\n')}
`
          : '';

      const setCompletionSection =
        analysis.activeSets.length > 0
          ? `
Sets Close to Completion:
${analysis.activeSets
  .slice(0, 5)
  .map(
    (set: { name: string; owned: number; total: number }) =>
      `- ${set.name}: ${set.owned}/${set.total} cards (${Math.round((set.owned / set.total) * 100)}% complete)`
  )
  .join('\n')}
`
          : '';

      const candidatesList = candidates
        .slice(0, 30)
        .map(
          (
            card: {
              name: string;
              rarity?: string;
              setName: string;
              marketPrice?: number;
              types?: string[];
              category: string;
            },
            i: number
          ) =>
            `${i + 1}. ${card.name} (${card.rarity || 'Common'}, Set: ${card.setName}, Price: $${card.marketPrice?.toFixed(2) || 'Unknown'}, Types: ${card.types?.join(', ') || 'None'}, Category: ${card.category})`
        )
        .join('\n');

      const userMessage = `${shoppingPrompt}

${collectorSummary}
${wishlistSection}
${setCompletionSection}

Available gift candidates:
${candidatesList}

Based on this collector's profile and the gift occasion, select the ${maxSuggestions} best gift suggestions.

For each suggestion:
1. Explain why this would be a great gift (parent-friendly language)
2. Consider the budget if specified
3. Prioritize wishlist items, especially priority ones
4. Consider set completion value

${includeBundles ? 'Also suggest 1-2 gift bundles (2-4 cards that go well together).' : ''}

Respond in JSON format:
{
  "summary": "A helpful 2-3 sentence summary for the parent about these gift ideas",
  "suggestions": [
    {
      "cardIndex": 1,
      "reason": "Parent-friendly reason why this is a great gift",
      "category": "wishlist_priority|wishlist|set_completion|type_match|popular"
    }
  ]${
    includeBundles
      ? `,
  "bundles": [
    {
      "name": "Bundle name (e.g., Complete the Evolution!)",
      "cardIndices": [1, 3, 5],
      "reason": "Why these cards make a great gift together"
    }
  ]`
      : ''
  }
}`;

      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        max_tokens: TOKEN_LIMITS.RECOMMENDATIONS,
        messages: [
          {
            role: 'system',
            content: `${safetySystemPrompt}\n\n${gameContext}\n\nYou are helping a PARENT shop for their child. Use parent-friendly language, not kid language. Focus on value, thoughtfulness, and making the child happy.`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return createFallbackResult(
          analysis,
          candidates,
          accessCheck.childDisplayName,
          args.gameSlug,
          maxSuggestions,
          budget
        );
      }

      // Parse JSON response
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      interface ParsedSuggestion {
        cardIndex: number;
        reason: string;
        category: GiftSuggestion['category'];
      }

      interface ParsedBundle {
        name: string;
        cardIndices: number[];
        reason: string;
      }

      let parsed: {
        summary: string;
        suggestions: ParsedSuggestion[];
        bundles?: ParsedBundle[];
      };
      try {
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        return createFallbackResult(
          analysis,
          candidates,
          accessCheck.childDisplayName,
          args.gameSlug,
          maxSuggestions,
          budget
        );
      }

      // Build gift suggestions from AI response
      const suggestions: GiftSuggestion[] = parsed.suggestions
        .map((sug) => {
          const cardIndex = sug.cardIndex - 1;
          if (cardIndex < 0 || cardIndex >= candidates.length) return null;

          const card = candidates[cardIndex];
          return {
            cardId: card.cardId,
            name: card.name,
            setId: card.setId,
            setName: card.setName,
            rarity: card.rarity || 'Common',
            imageUrl: card.imageSmall,
            estimatedPrice: card.marketPrice ?? null,
            reason: sug.reason,
            category: sug.category,
            setCompletionInfo: card.setCompletionInfo,
          } as GiftSuggestion;
        })
        .filter((sug): sug is GiftSuggestion => sug !== null)
        .slice(0, maxSuggestions);

      // Build gift bundles if requested
      const bundles: GiftBundle[] = [];
      if (includeBundles && parsed.bundles) {
        for (const bundle of parsed.bundles.slice(0, 2)) {
          const bundleCards: GiftSuggestion[] = [];
          let totalPrice = 0;

          for (const idx of bundle.cardIndices) {
            const cardIndex = idx - 1;
            if (cardIndex >= 0 && cardIndex < candidates.length) {
              const card = candidates[cardIndex];
              bundleCards.push({
                cardId: card.cardId,
                name: card.name,
                setId: card.setId,
                setName: card.setName,
                rarity: card.rarity || 'Common',
                imageUrl: card.imageSmall,
                estimatedPrice: card.marketPrice ?? null,
                reason: '',
                category: card.category as GiftSuggestion['category'],
              });
              totalPrice += card.marketPrice || 0;
            }
          }

          if (bundleCards.length >= 2) {
            bundles.push({
              name: bundle.name,
              cards: bundleCards,
              totalPrice: Math.round(totalPrice * 100) / 100,
              reason: bundle.reason,
              bundleType: determineBundleType(bundleCards),
            });
          }
        }
      }

      // Calculate budget analysis
      const budgetAnalysis = calculateBudgetAnalysis(analysis.wishlistItems);

      // Log usage
      await ctx.runMutation(internal.ai.shoppingAssistantHelpers.logShoppingAssistantUsage, {
        profileId: args.parentProfileId,
        familyId: args.familyId,
        gameSlug: args.gameSlug,
        suggestionCount: suggestions.length,
        bundleCount: bundles.length,
        model: MODELS.GPT4O_MINI,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      });

      return {
        suggestions,
        bundles,
        summary: parsed.summary,
        collectorProfile: {
          displayName: accessCheck.childDisplayName,
          favoriteTypes: analysis.favoriteTypes,
          activeSets: analysis.activeSets.map((s: { name: string }) => s.name),
          wishlistCount: analysis.wishlistItems.length,
          priorityWishlistCount: analysis.priorityCount,
        },
        budgetAnalysis,
      };
    } catch (error) {
      console.error('Shopping assistant error:', error);
      return createFallbackResult(
        analysis,
        candidates,
        accessCheck.childDisplayName,
        args.gameSlug,
        maxSuggestions,
        budget
      );
    }
  },
});

// ============================================================================
// QUICK WISHLIST SUMMARY
// ============================================================================

/**
 * Get a quick summary of a child's wishlist for gift shopping
 * (lightweight version without AI)
 */
export const getWishlistSummary = action({
  args: {
    parentProfileId: v.id('profiles'),
    childProfileId: v.id('profiles'),
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
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    childDisplayName: string;
    wishlistItems: Array<{
      cardId: string;
      name: string;
      setName: string;
      rarity: string;
      imageUrl: string;
      estimatedPrice: number | null;
      isPriority: boolean;
    }>;
    totalValue: number;
    priorityCount: number;
    error?: string;
  }> => {
    // Verify access
    const accessCheck = await ctx.runQuery(
      internal.ai.shoppingAssistantHelpers.verifyParentAccess,
      {
        parentProfileId: args.parentProfileId,
        childProfileId: args.childProfileId,
        familyId: args.familyId,
      }
    );

    if (!accessCheck.valid) {
      return {
        childDisplayName: '',
        wishlistItems: [],
        totalValue: 0,
        priorityCount: 0,
        error: "You don't have access to view this collector's wishlist.",
      };
    }

    // Get wishlist details
    const wishlist = await ctx.runQuery(internal.ai.shoppingAssistantHelpers.getWishlistDetails, {
      profileId: args.childProfileId,
      gameSlug: args.gameSlug,
    });

    let totalValue = 0;
    let priorityCount = 0;

    const wishlistItems = wishlist.map(
      (card: {
        cardId: string;
        name: string;
        setName: string;
        rarity?: string;
        imageSmall: string;
        marketPrice?: number;
        isPriority: boolean;
      }) => {
        if (card.marketPrice) {
          totalValue += card.marketPrice;
        }
        if (card.isPriority) {
          priorityCount++;
        }
        return {
          cardId: card.cardId,
          name: card.name,
          setName: card.setName,
          rarity: card.rarity || 'Common',
          imageUrl: card.imageSmall,
          estimatedPrice: card.marketPrice ?? null,
          isPriority: card.isPriority,
        };
      }
    );

    // Sort with priority items first
    wishlistItems.sort((a: { isPriority: boolean }, b: { isPriority: boolean }) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });

    return {
      childDisplayName: accessCheck.childDisplayName,
      wishlistItems,
      totalValue: Math.round(totalValue * 100) / 100,
      priorityCount,
    };
  },
});

// ============================================================================
// HELPER ACTIONS
// ============================================================================

/**
 * Get remaining shopping assistant uses for today
 */
export const getRemainingShoppingAssistantUses = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<{ remaining: number; resetAt: number; limit: number }> => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'shopping_assistant',
    });

    return {
      remaining: status.remaining as number,
      resetAt: status.resetAt as number,
      limit: 15, // Daily limit
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function occasionDescription(occasion: GiftOccasion): string {
  switch (occasion) {
    case 'birthday':
      return 'Birthday gift - make it special!';
    case 'holiday':
      return 'Holiday gift - festive and fun';
    case 'reward':
      return 'Achievement reward - celebrate their accomplishment';
    case 'just_because':
    default:
      return 'Just because - a nice surprise';
  }
}

function determineBundleType(cards: GiftSuggestion[]): GiftBundle['bundleType'] {
  // Check if all cards are from the same set
  const setIds = new Set(cards.map((c) => c.setId));
  if (setIds.size === 1) {
    return 'set_completion';
  }

  // Check if most cards are wishlist items
  const wishlistCount = cards.filter(
    (c) => c.category === 'wishlist' || c.category === 'wishlist_priority'
  ).length;
  if (wishlistCount >= cards.length / 2) {
    return 'wishlist_batch';
  }

  return 'type_theme';
}

function calculateBudgetAnalysis(
  wishlistItems: Array<{ marketPrice?: number }>
): ShoppingAssistantResult['budgetAnalysis'] {
  let totalValue = 0;
  let budgetFriendlyCount = 0;
  let moderateCount = 0;
  let premiumCount = 0;
  let priceCount = 0;

  for (const item of wishlistItems) {
    const price = item.marketPrice ?? 0;
    if (price > 0) {
      totalValue += price;
      priceCount++;

      if (price < 5) {
        budgetFriendlyCount++;
      } else if (price <= 20) {
        moderateCount++;
      } else {
        premiumCount++;
      }
    }
  }

  return {
    totalWishlistValue: Math.round(totalValue * 100) / 100,
    averageCardPrice: priceCount > 0 ? Math.round((totalValue / priceCount) * 100) / 100 : 0,
    budgetFriendlyCount,
    moderateCount,
    premiumCount,
  };
}

function createErrorResult(error: string): ShoppingAssistantResult {
  return {
    suggestions: [],
    bundles: [],
    summary: '',
    collectorProfile: {
      displayName: '',
      favoriteTypes: [],
      activeSets: [],
      wishlistCount: 0,
      priorityWishlistCount: 0,
    },
    budgetAnalysis: {
      totalWishlistValue: 0,
      averageCardPrice: 0,
      budgetFriendlyCount: 0,
      moderateCount: 0,
      premiumCount: 0,
    },
    error,
  };
}

function createFallbackResult(
  analysis: {
    totalCards: number;
    favoriteTypes: string[];
    activeSets: Array<{ setId: string; name: string; owned: number; total: number }>;
    collectionStyle: string;
    wishlistItems: Array<{
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity?: string;
      imageSmall: string;
      marketPrice?: number;
      isPriority: boolean;
    }>;
    priorityCount: number;
  },
  candidates: Array<{
    cardId: string;
    name: string;
    setId: string;
    setName: string;
    rarity?: string;
    imageSmall: string;
    marketPrice?: number;
    types?: string[];
    category: string;
    setCompletionInfo?: {
      cardsOwned: number;
      totalCards: number;
      percentComplete: number;
      cardsNeeded: number;
    };
  }>,
  childDisplayName: string,
  gameSlug: GameSlug,
  maxSuggestions: number,
  budget?: number
): ShoppingAssistantResult {
  const gameName = GAME_CONTEXTS[gameSlug].name;

  // Build simple rule-based suggestions
  const suggestions: GiftSuggestion[] = [];

  // First, add priority wishlist items
  const priorityItems = candidates.filter((c) => c.category === 'wishlist_priority');
  for (const card of priorityItems.slice(0, maxSuggestions)) {
    if (budget && card.marketPrice && card.marketPrice > budget) continue;

    suggestions.push({
      cardId: card.cardId,
      name: card.name,
      setId: card.setId,
      setName: card.setName,
      rarity: card.rarity || 'Common',
      imageUrl: card.imageSmall,
      estimatedPrice: card.marketPrice ?? null,
      reason: `This is on ${childDisplayName}'s priority wishlist - they really want this card!`,
      category: 'wishlist_priority',
      setCompletionInfo: card.setCompletionInfo,
    });

    if (suggestions.length >= maxSuggestions) break;
  }

  // Then add regular wishlist items
  if (suggestions.length < maxSuggestions) {
    const wishlistItems = candidates.filter((c) => c.category === 'wishlist');
    for (const card of wishlistItems) {
      if (budget && card.marketPrice && card.marketPrice > budget) continue;

      suggestions.push({
        cardId: card.cardId,
        name: card.name,
        setId: card.setId,
        setName: card.setName,
        rarity: card.rarity || 'Common',
        imageUrl: card.imageSmall,
        estimatedPrice: card.marketPrice ?? null,
        reason: `This card is on ${childDisplayName}'s wishlist.`,
        category: 'wishlist',
        setCompletionInfo: card.setCompletionInfo,
      });

      if (suggestions.length >= maxSuggestions) break;
    }
  }

  // Fill with set completion suggestions
  if (suggestions.length < maxSuggestions) {
    const setCompletionItems = candidates.filter((c) => c.category === 'set_completion');
    for (const card of setCompletionItems) {
      if (suggestions.some((s) => s.cardId === card.cardId)) continue;
      if (budget && card.marketPrice && card.marketPrice > budget) continue;

      const completionInfo = card.setCompletionInfo;
      const reason = completionInfo
        ? `This card will help complete the ${card.setName} set (${completionInfo.percentComplete}% done).`
        : `This card is from a set ${childDisplayName} is collecting.`;

      suggestions.push({
        cardId: card.cardId,
        name: card.name,
        setId: card.setId,
        setName: card.setName,
        rarity: card.rarity || 'Common',
        imageUrl: card.imageSmall,
        estimatedPrice: card.marketPrice ?? null,
        reason,
        category: 'set_completion',
        setCompletionInfo: card.setCompletionInfo,
      });

      if (suggestions.length >= maxSuggestions) break;
    }
  }

  return {
    suggestions,
    bundles: [],
    summary: `Here are some gift ideas for ${childDisplayName}'s ${gameName} collection! ${analysis.priorityCount > 0 ? `They have ${analysis.priorityCount} priority items on their wishlist.` : ''}`,
    collectorProfile: {
      displayName: childDisplayName,
      favoriteTypes: analysis.favoriteTypes,
      activeSets: analysis.activeSets.map((s) => s.name),
      wishlistCount: analysis.wishlistItems.length,
      priorityWishlistCount: analysis.priorityCount,
    },
    budgetAnalysis: calculateBudgetAnalysis(analysis.wishlistItems),
  };
}
