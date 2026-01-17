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
 * Card Storyteller
 *
 * Generates fun, educational stories and facts about any card.
 * Kids can tap a card to hear interesting lore, trivia, and facts.
 *
 * Features:
 * - Game-specific lore and terminology
 * - Educational facts about the card/character
 * - Kid-friendly language and tone
 * - Caching to reduce API calls for popular cards
 */

// Story cache type
interface CachedStory {
  cardId: string;
  gameSlug: GameSlug;
  story: string;
  facts: string[];
  generatedAt: number;
}

// In-memory cache for stories (24 hour TTL)
const storyCache = new Map<string, CachedStory>();
const STORY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get a cached story if available
 */
function getCachedStory(cardId: string, gameSlug: GameSlug): CachedStory | null {
  const key = `${gameSlug}-${cardId}`;
  const cached = storyCache.get(key);

  if (!cached) return null;
  if (Date.now() - cached.generatedAt > STORY_CACHE_TTL) {
    storyCache.delete(key);
    return null;
  }

  return cached;
}

/**
 * Cache a story
 */
function cacheStory(story: CachedStory): void {
  const key = `${story.gameSlug}-${story.cardId}`;
  storyCache.set(key, story);

  // Clean up old entries (keep max 500)
  if (storyCache.size > 500) {
    const entries = Array.from(storyCache.entries());
    entries.sort((a, b) => a[1].generatedAt - b[1].generatedAt);
    const toDelete = entries.slice(0, entries.length - 300);
    for (const [key] of toDelete) {
      storyCache.delete(key);
    }
  }
}

// Game-specific story prompts
const STORY_PROMPTS: Record<GameSlug, string> = {
  pokemon: `You are a friendly Pokémon expert telling a young trainer about a card they just found!

Create an engaging, educational response about this Pokémon card. Include:
1. A short story or scenario featuring this Pokémon (2-3 sentences)
2. 3-4 fun facts about:
   - The Pokémon's special abilities or characteristics
   - Where this Pokémon lives in the games/anime
   - Interesting trivia about the card or Pokémon
   - Evolution chain if applicable

Keep it exciting and use kid-friendly language! Add emojis to make it fun.

Respond in JSON format:
{
  "story": "The short engaging story",
  "facts": ["Fact 1", "Fact 2", "Fact 3"],
  "didYouKnow": "One special 'Did you know?' trivia"
}`,

  yugioh: `You are a friendly Duelist telling a young player about a card they just discovered!

Create an engaging, educational response about this Yu-Gi-Oh! card. Include:
1. A short story about this card being used in a duel (2-3 sentences)
2. 3-4 fun facts about:
   - The card's abilities and effects
   - Lore or backstory if it's a monster
   - How this card fits into deck strategies
   - Interesting trivia from the anime or manga

Keep it exciting and use kid-friendly language! Add emojis to make it fun.

Respond in JSON format:
{
  "story": "The short engaging story",
  "facts": ["Fact 1", "Fact 2", "Fact 3"],
  "didYouKnow": "One special 'Did you know?' trivia"
}`,

  onepiece: `You are a friendly pirate crew member telling a young adventurer about a card they just found!

Create an engaging, educational response about this One Piece card. Include:
1. A short story featuring this character on an adventure (2-3 sentences)
2. 3-4 fun facts about:
   - The character's abilities and role
   - Their story in the One Piece world
   - Their crew or affiliations
   - Interesting trivia from the anime or manga

Keep it exciting and use kid-friendly language! Add emojis to make it fun.

Respond in JSON format:
{
  "story": "The short engaging story",
  "facts": ["Fact 1", "Fact 2", "Fact 3"],
  "didYouKnow": "One special 'Did you know?' trivia"
}`,

  lorcana: `You are a friendly Illumineer telling a young storyteller about a card they just discovered!

Create an engaging, educational response about this Lorcana card. Include:
1. A short story featuring this Disney character on a magical adventure (2-3 sentences)
2. 3-4 fun facts about:
   - The character's abilities in Lorcana
   - Their original Disney movie or story
   - The ink color and what it represents
   - Interesting trivia about the card or character

Keep it magical and use kid-friendly language! Add emojis to make it fun.

Respond in JSON format:
{
  "story": "The short engaging story",
  "facts": ["Fact 1", "Fact 2", "Fact 3"],
  "didYouKnow": "One special 'Did you know?' trivia"
}`,
};

/**
 * Get a story about a card
 */
export const getCardStory = action({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    cardId: v.string(),
    cardName: v.string(),
    cardType: v.optional(v.string()), // Pokémon, Trainer, Monster, etc.
    rarity: v.optional(v.string()),
    setName: v.optional(v.string()),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    story: string;
    facts: string[];
    didYouKnow: string;
    cached: boolean;
    error?: string;
  }> => {
    // Check cache first
    const cached = getCachedStory(args.cardId, args.gameSlug);
    if (cached) {
      return {
        story: cached.story,
        facts: cached.facts,
        didYouKnow: cached.facts[0] || '',
        cached: true,
      };
    }

    // Check rate limit
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'story',
    });

    if (!rateLimitCheck.allowed) {
      const timeUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60 / 60);
      return {
        story: '',
        facts: [],
        didYouKnow: '',
        cached: false,
        error: `You've heard lots of stories today! 📚 Come back in ${timeUntilReset} hours to hear more card stories!`,
      };
    }

    try {
      // Build the prompt with card details
      const gameContext = getGameContext(args.gameSlug);
      const storyPrompt = STORY_PROMPTS[args.gameSlug];
      const gameName = GAME_CONTEXTS[args.gameSlug].name;

      const cardDetails = `
Card Name: ${args.cardName}
Card Type: ${args.cardType || 'Unknown'}
Rarity: ${args.rarity || 'Unknown'}
Set: ${args.setName || 'Unknown'}
Game: ${gameName}
`;

      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        max_tokens: TOKEN_LIMITS.STORY,
        messages: [
          {
            role: 'system',
            content: `${safetySystemPrompt}\n\n${gameContext}`,
          },
          {
            role: 'user',
            content: `${storyPrompt}\n\nHere's the card:\n${cardDetails}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          story: `${args.cardName} is an awesome card! 🎴`,
          facts: ['This card is part of your collection!'],
          didYouKnow: 'Every card tells a story!',
          cached: false,
          error: 'Could not generate story',
        };
      }

      // Parse JSON response
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      let result: { story: string; facts: string[]; didYouKnow: string };
      try {
        result = JSON.parse(jsonStr.trim());
      } catch {
        // Fallback if JSON parsing fails
        result = {
          story: content.slice(0, 200),
          facts: ['This is a cool card!'],
          didYouKnow: 'Collecting cards is awesome!',
        };
      }

      // Cache the result
      const storyToCache: CachedStory = {
        cardId: args.cardId,
        gameSlug: args.gameSlug,
        story: result.story,
        facts: result.facts,
        generatedAt: Date.now(),
      };
      cacheStory(storyToCache);

      // Log usage
      await ctx.runMutation(internal.ai.internalMutations.logStoryGeneration, {
        profileId: args.profileId,
        familyId: args.familyId,
        gameSlug: args.gameSlug,
        cardId: args.cardId,
        cardName: args.cardName,
        model: MODELS.GPT4O_MINI,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      });

      return {
        story: result.story,
        facts: result.facts,
        didYouKnow: result.didYouKnow,
        cached: false,
      };
    } catch (error) {
      console.error('Story generation error:', error);
      return {
        story: `${args.cardName} is an awesome card in your collection! 🌟`,
        facts: ['Every card you collect makes your collection stronger!'],
        didYouKnow: 'Keep collecting to discover more amazing cards!',
        cached: false,
        error: 'Could not generate story',
      };
    }
  },
});

/**
 * Get remaining stories for today
 */
export const getRemainingStories = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<{ remaining: number; resetAt: number; limit: number }> => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'story',
    });

    return {
      remaining: status.remaining as number,
      resetAt: status.resetAt as number,
      limit: 10, // RATE_LIMITS.STORIES_PER_DAY
    };
  },
});
