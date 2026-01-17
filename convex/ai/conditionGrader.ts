'use node';

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { openai, MODELS, safetySystemPrompt, getGameContext } from './openai';
import type { GameSlug } from './openai';

/**
 * AI Card Condition Grader
 *
 * Educational tool that helps kids learn about card condition grading.
 * Uses GPT-4o Vision to analyze card photos and explain condition issues.
 *
 * Features:
 * - Identifies condition grade (NM, LP, MP, HP, DMG)
 * - Explains WHY the card has that grade in kid-friendly language
 * - Points out specific areas of wear (corners, edges, surface, centering)
 * - Provides educational tips for card care
 * - Rate limited to prevent abuse
 */

// Token limit for condition grading responses
const CONDITION_GRADING_TOKEN_LIMIT = 600;

// Condition grading prompt - universal for all TCGs
const CONDITION_GRADING_PROMPT = `You are a friendly card condition expert helping a young collector understand their card's condition!

Analyze this trading card image and grade its condition. Look carefully at:

1. **Corners** - Are they sharp, soft, or bent?
2. **Edges** - Any whitening, nicks, or wear?
3. **Surface** - Scratches, scuffs, print lines, or damage?
4. **Centering** - Is the card art centered properly?
5. **Overall** - Any bends, creases, or major damage?

Grade the card using these conditions:
- **NM (Near Mint)**: Almost perfect! No visible wear.
- **LP (Lightly Played)**: Tiny signs of wear, barely noticeable.
- **MP (Moderately Played)**: Noticeable wear but still good shape.
- **HP (Heavily Played)**: Significant wear, creases, or damage.
- **DMG (Damaged)**: Major damage - torn, water damaged, heavily creased.

IMPORTANT: Be encouraging and educational! This is for kids learning about card collecting.

Respond in JSON format:
{
  "grade": "NM" | "LP" | "MP" | "HP" | "DMG",
  "gradeName": "Full grade name (e.g., 'Near Mint')",
  "confidence": "high" | "medium" | "low",
  "overallSummary": "A friendly 1-2 sentence summary of the card's condition",
  "details": {
    "corners": {
      "rating": "perfect" | "good" | "fair" | "poor",
      "description": "What you see on the corners"
    },
    "edges": {
      "rating": "perfect" | "good" | "fair" | "poor",
      "description": "What you see on the edges"
    },
    "surface": {
      "rating": "perfect" | "good" | "fair" | "poor",
      "description": "What you see on the surface (scratches, scuffs, etc.)"
    },
    "centering": {
      "rating": "well-centered" | "slightly-off" | "off-center",
      "description": "How centered the card art is"
    }
  },
  "issuesFound": ["List of specific issues noticed, or empty if perfect"],
  "careTip": "A helpful tip about protecting cards in this condition",
  "funFact": "A fun fact about card collecting or grading",
  "wouldImproveGrade": "What would make this card grade higher (if applicable, otherwise null)"
}

If you cannot clearly see the card or determine its condition, explain why and ask for a clearer photo.`;

// Type for condition grading result
interface ConditionArea {
  rating: 'perfect' | 'good' | 'fair' | 'poor';
  description: string;
}

interface CenteringArea {
  rating: 'well-centered' | 'slightly-off' | 'off-center';
  description: string;
}

interface ConditionDetails {
  corners: ConditionArea;
  edges: ConditionArea;
  surface: ConditionArea;
  centering: CenteringArea;
}

export interface ConditionGradingResult {
  grade: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
  gradeName: string;
  confidence: 'high' | 'medium' | 'low';
  overallSummary: string;
  details: ConditionDetails;
  issuesFound: string[];
  careTip: string;
  funFact: string;
  wouldImproveGrade: string | null;
  error?: string;
}

// Fallback result for when grading fails
const FALLBACK_RESULT: ConditionGradingResult = {
  grade: 'LP',
  gradeName: 'Lightly Played',
  confidence: 'low',
  overallSummary:
    'I had trouble seeing the card clearly. Try taking another photo with better lighting!',
  details: {
    corners: { rating: 'good', description: "Couldn't see clearly" },
    edges: { rating: 'good', description: "Couldn't see clearly" },
    surface: { rating: 'good', description: "Couldn't see clearly" },
    centering: { rating: 'well-centered', description: "Couldn't see clearly" },
  },
  issuesFound: [],
  careTip: 'Always store your cards in sleeves to protect them!',
  funFact: 'The rarest trading cards can be worth more than a new car!',
  wouldImproveGrade: null,
};

/**
 * Grade a card's condition from an image
 *
 * Uses GPT-4o Vision to analyze the card and explain its condition
 * in kid-friendly language. Teaches collectors about grading.
 */
export const gradeCardCondition = action({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    imageBase64: v.string(), // Base64 encoded image data
    imageType: v.union(v.literal('jpeg'), v.literal('png'), v.literal('webp'), v.literal('gif')),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    cardName: v.optional(v.string()), // Optional card name for context
  },
  handler: async (ctx, args): Promise<ConditionGradingResult> => {
    // Check rate limit first
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'condition_grading',
    });

    if (!rateLimitCheck.allowed) {
      const timeUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60);
      return {
        ...FALLBACK_RESULT,
        error: `You've graded lots of cards today! 📚 Come back in ${timeUntilReset} minutes to grade more cards!`,
      };
    }

    try {
      // Build the prompt with optional card context
      const gameContext = getGameContext(args.gameSlug);
      let contextMessage = CONDITION_GRADING_PROMPT;
      if (args.cardName) {
        contextMessage += `\n\nThe collector believes this is a "${args.cardName}" card.`;
      }

      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_VISION,
        max_tokens: CONDITION_GRADING_TOKEN_LIMIT,
        messages: [
          {
            role: 'system',
            content: `${safetySystemPrompt}\n\n${gameContext}\n\nYou are teaching a young collector about card condition grading. Be encouraging and educational!`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: contextMessage,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${args.imageType};base64,${args.imageBase64}`,
                  detail: 'high', // Use high detail for accurate condition assessment
                },
              },
            ],
          },
        ],
      });

      // Parse the response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          ...FALLBACK_RESULT,
          error:
            "Hmm, I couldn't see the card clearly. Try taking another photo with better lighting! 📷",
        };
      }

      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      let result: ConditionGradingResult;
      try {
        result = JSON.parse(jsonStr.trim());
        // Validate required fields
        if (
          !result.grade ||
          !result.gradeName ||
          !result.overallSummary ||
          !result.details ||
          !result.careTip
        ) {
          throw new Error('Missing required fields');
        }
      } catch {
        // If parsing fails, return a friendly error
        return {
          ...FALLBACK_RESULT,
          error:
            'I had trouble grading that card. Could you try taking a clearer photo? Make sure the whole card is visible! 🔍',
        };
      }

      // Log usage and increment rate limit
      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      const estimatedCost = (inputTokens * 0.0025 + outputTokens * 0.01) / 1000; // GPT-4o pricing

      await ctx.runMutation(internal.ai.internalMutations.logConditionGrading, {
        profileId: args.profileId,
        familyId: args.familyId,
        gameSlug: args.gameSlug,
        model: MODELS.GPT4O_VISION,
        inputTokens,
        outputTokens,
        estimatedCost,
        grade: result.grade,
        confidence: result.confidence,
        cardName: args.cardName,
      });

      return result;
    } catch (error) {
      console.error('Condition grading error:', error);
      return {
        ...FALLBACK_RESULT,
        error: "Oops! Something went wrong while grading. Let's try again! 🔄",
      };
    }
  },
});

/**
 * Get remaining condition gradings for a profile today
 */
export const getRemainingGradings = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<{ remaining: number; resetAt: number; limit: number }> => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'condition_grading',
    });

    return {
      remaining: status.remaining as number,
      resetAt: status.resetAt as number,
      limit: 10, // 10 gradings per day
    };
  },
});

/**
 * Get educational content about card grading (no AI call needed)
 * Returns static content for the grading tutorial
 */
export const getGradingGuide = action({
  args: {},
  handler: async (): Promise<{
    grades: Array<{
      grade: string;
      name: string;
      description: string;
      whatToLookFor: string[];
      valueImpact: string;
      emoji: string;
    }>;
    generalTips: string[];
    funFacts: string[];
  }> => {
    return {
      grades: [
        {
          grade: 'NM',
          name: 'Near Mint',
          description: 'Almost perfect! This card looks like it just came out of a pack.',
          whatToLookFor: [
            'No visible scratches or scuffs',
            'Corners are sharp and not bent',
            'No whitening on edges',
            'Surface is clean and smooth',
            'Card is flat with no bends',
          ],
          valueImpact: 'Worth the most! Collectors love Near Mint cards.',
          emoji: '✨',
        },
        {
          grade: 'LP',
          name: 'Lightly Played',
          description: "Very good condition with only tiny signs of wear you'd barely notice.",
          whatToLookFor: [
            'Tiny scratches visible only up close',
            'Very slight corner wear',
            'Minor edge whitening',
            'Surface has minimal marks',
            'Card is mostly flat',
          ],
          valueImpact: 'Still very valuable! Great for collecting.',
          emoji: '👍',
        },
        {
          grade: 'MP',
          name: 'Moderately Played',
          description: 'Noticeable wear but the card is still in good shape overall.',
          whatToLookFor: [
            'Visible scratches on surface',
            'Noticeable corner and edge wear',
            'Some whitening on edges',
            'Minor creases possible',
            'Light scuffing on surface',
          ],
          valueImpact: 'Worth less, but still a good deal for rare cards!',
          emoji: '👌',
        },
        {
          grade: 'HP',
          name: 'Heavily Played',
          description: "Well-loved card with lots of signs it's been played a lot.",
          whatToLookFor: [
            'Heavy scratches and scuffs',
            'Rounded or damaged corners',
            'Significant edge wear',
            'Creases or small bends',
            'Surface damage visible',
          ],
          valueImpact: 'Worth less, but perfect for playing games with!',
          emoji: '🎮',
        },
        {
          grade: 'DMG',
          name: 'Damaged',
          description: 'Major damage like tears, water damage, or heavy creases.',
          whatToLookFor: [
            'Tears or missing pieces',
            'Water damage or stains',
            'Heavy creases or bends',
            'Major surface damage',
            'Writing or marks on card',
          ],
          valueImpact: 'Very low value, but can still be fun to have!',
          emoji: '💔',
        },
      ],
      generalTips: [
        'Always use card sleeves to protect your cards!',
        'Store cards in a cool, dry place away from sunlight.',
        'Use a toploader for your most valuable cards.',
        'Handle cards by the edges to avoid fingerprints.',
        "Don't stack heavy things on top of your card binders.",
        'Keep food and drinks away from your cards.',
      ],
      funFacts: [
        'PSA, BGS, and CGC are professional grading companies that rate cards 1-10.',
        'A PSA 10 means the card is basically perfect!',
        'Some graded cards have sold for over $1 million!',
        'Card centering matters - look at the borders around the art.',
        'Holo cards can show scratches more easily than regular cards.',
        'The term "pack fresh" means a card looks like it just came from a pack.',
      ],
    };
  },
});
