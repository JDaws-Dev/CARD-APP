'use node';

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { openai, MODELS, TOKEN_LIMITS, safetySystemPrompt, getGameContext } from './openai';
import type { GameSlug } from './openai';

/**
 * AI Card Scanner
 *
 * Allows kids to take a photo of a card and have AI identify it.
 * Uses GPT-4o Vision to analyze card images.
 *
 * Features:
 * - Identifies card name, set, and number
 * - Matches to TCG API card ID for adding to collection
 * - Kid-friendly responses with fun facts
 * - Rate limited to prevent abuse
 */

// Card identification prompt for different TCGs
const CARD_SCAN_PROMPTS: Record<GameSlug, string> = {
  pokemon: `You are identifying a Pokémon Trading Card Game card from an image.

Analyze the image and extract:
1. Card Name (the Pokémon, Trainer, or Energy name)
2. Set Symbol (look for the small symbol near the card number)
3. Card Number (format: XXX/YYY, e.g., "025/165")
4. Rarity Symbol (circle = Common, diamond = Uncommon, star = Rare, etc.)
5. Any special features (Holo, Reverse Holo, Full Art, etc.)

If you can identify the set, provide the set code (e.g., "sv1" for Scarlet & Violet base set).

Respond in JSON format:
{
  "identified": true/false,
  "cardName": "string",
  "setName": "string or null",
  "setCode": "string or null",
  "cardNumber": "string",
  "rarity": "string or null",
  "specialFeatures": ["array of features"],
  "confidence": "high/medium/low",
  "funFact": "A kid-friendly fun fact about this card or Pokémon",
  "suggestedCardId": "string or null (format: setCode-cardNumber, e.g., 'sv1-25')"
}

If you cannot identify the card, set "identified" to false and explain why in a kid-friendly way.`,

  yugioh: `You are identifying a Yu-Gi-Oh! Trading Card Game card from an image.

Analyze the image and extract:
1. Card Name
2. Set Code (letters/numbers in bottom right, e.g., "LOB-001")
3. Card Type (Monster, Spell, Trap)
4. Rarity (Common, Rare, Super Rare, Ultra Rare, Secret Rare, etc.)
5. Edition (1st Edition, Unlimited, Limited Edition)

Respond in JSON format:
{
  "identified": true/false,
  "cardName": "string",
  "setCode": "string",
  "cardType": "string",
  "rarity": "string or null",
  "edition": "string or null",
  "confidence": "high/medium/low",
  "funFact": "A kid-friendly fun fact about this card",
  "suggestedCardId": "string or null"
}`,

  onepiece: `You are identifying a One Piece Card Game card from an image.

Analyze the image and extract:
1. Card Name
2. Set Code
3. Card Number
4. Card Type (Leader, Character, Event, Stage)
5. Rarity

Respond in JSON format:
{
  "identified": true/false,
  "cardName": "string",
  "setCode": "string or null",
  "cardNumber": "string",
  "cardType": "string",
  "rarity": "string or null",
  "confidence": "high/medium/low",
  "funFact": "A kid-friendly fun fact about this character",
  "suggestedCardId": "string or null"
}`,

  lorcana: `You are identifying a Disney Lorcana card from an image.

Analyze the image and extract:
1. Character Name and Version
2. Set Name
3. Card Number
4. Ink Color (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel)
5. Rarity (Common, Uncommon, Rare, Super Rare, Legendary, Enchanted)

Respond in JSON format:
{
  "identified": true/false,
  "cardName": "string",
  "setName": "string or null",
  "cardNumber": "string",
  "inkColor": "string",
  "rarity": "string or null",
  "confidence": "high/medium/low",
  "funFact": "A kid-friendly fun fact about this Disney character",
  "suggestedCardId": "string or null"
}`,
};

// Type for the response from the AI
interface CardScanResult {
  identified: boolean;
  cardName?: string;
  setName?: string | null;
  setCode?: string | null;
  cardNumber?: string;
  cardType?: string;
  rarity?: string | null;
  specialFeatures?: string[];
  edition?: string | null;
  inkColor?: string;
  collectorNumber?: string;
  confidence?: 'high' | 'medium' | 'low';
  funFact?: string;
  suggestedCardId?: string | null;
  error?: string;
}

/**
 * Scan a card image and identify it
 */
export const scanCard = action({
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
  },
  handler: async (ctx, args): Promise<CardScanResult> => {
    // Check rate limit first
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'card_scan',
    });

    if (!rateLimitCheck.allowed) {
      const resetDate = new Date(rateLimitCheck.resetAt);
      const timeUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60);
      return {
        identified: false,
        error: `You've used all your card scans for today! 📸 You can scan ${rateLimitCheck.remaining} more cards. Come back in ${timeUntilReset} minutes to scan more cards!`,
      };
    }

    try {
      // Build the prompt
      const gamePrompt = CARD_SCAN_PROMPTS[args.gameSlug];
      const gameContext = getGameContext(args.gameSlug);

      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_VISION,
        max_tokens: TOKEN_LIMITS.CARD_SCAN,
        messages: [
          {
            role: 'system',
            content: `${safetySystemPrompt}\n\n${gameContext}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: gamePrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/${args.imageType};base64,${args.imageBase64}`,
                  detail: 'high', // Use high detail for better card recognition
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
          identified: false,
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

      let result: CardScanResult;
      try {
        result = JSON.parse(jsonStr.trim());
      } catch {
        // If parsing fails, return a friendly error
        return {
          identified: false,
          error:
            'I had trouble understanding that card. Could you try taking a clearer photo? Make sure the whole card is visible! 🔍',
        };
      }

      // Log usage and increment rate limit
      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      const estimatedCost = (inputTokens * 0.0025 + outputTokens * 0.01) / 1000; // GPT-4o pricing

      await ctx.runMutation(internal.ai.internalMutations.logCardScan, {
        profileId: args.profileId,
        familyId: args.familyId,
        gameSlug: args.gameSlug,
        model: MODELS.GPT4O_VISION,
        inputTokens,
        outputTokens,
        estimatedCost,
        identified: result.identified,
        cardName: result.cardName,
        suggestedCardId: result.suggestedCardId,
      });

      return result;
    } catch (error) {
      console.error('Card scan error:', error);
      return {
        identified: false,
        error: "Oops! Something went wrong while scanning. Let's try again! 🔄",
      };
    }
  },
});

/**
 * Get remaining card scans for a profile
 */
export const getRemainingScans = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<{ remaining: number; resetAt: number; limit: number }> => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'card_scan',
    });

    return {
      remaining: status.remaining as number,
      resetAt: status.resetAt as number,
      limit: 20, // RATE_LIMITS.CARD_SCANS_PER_DAY
    };
  },
});
