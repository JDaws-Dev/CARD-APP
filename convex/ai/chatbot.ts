'use node';

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { openai, MODELS, TOKEN_LIMITS, safetySystemPrompt, getGameContext } from './openai';
import type { GameSlug } from './openai';
import { Id } from '../_generated/dataModel';

/**
 * Collection Chatbot
 *
 * Natural language interface for kids to ask questions about their collection.
 * Uses GPT-4o-mini with function calling to query collection data.
 *
 * Example questions:
 * - "How many fire type Pokémon do I have?"
 * - "What's my rarest card?"
 * - "Which sets am I closest to completing?"
 * - "Do I have any Charizard cards?"
 */

// Chat message type
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Collection stats for function calling
interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  byType: Record<string, number>;
  byRarity: Record<string, number>;
  bySet: Record<string, { owned: number; total: number; percentage: number }>;
  recentlyAdded: Array<{ name: string; addedAt: number }>;
  wishlistCount: number;
}

// Function definitions for OpenAI function calling
const COLLECTION_FUNCTIONS = [
  {
    name: 'get_collection_stats',
    description:
      'Get overall statistics about the collection including total cards, types, rarities, and set completion progress',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_collection',
    description: 'Search for specific cards in the collection by name, type, or other criteria',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (card name, Pokémon name, etc.)',
        },
        type: {
          type: 'string',
          description: 'Filter by type (Fire, Water, Grass, etc.)',
        },
        rarity: {
          type: 'string',
          description: 'Filter by rarity (Common, Uncommon, Rare, etc.)',
        },
        setId: {
          type: 'string',
          description: 'Filter by set ID',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_rarest_cards',
    description: 'Get the rarest or most valuable cards in the collection',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of cards to return (default 5)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_set_progress',
    description: 'Get completion progress for a specific set or all sets',
    parameters: {
      type: 'object',
      properties: {
        setId: {
          type: 'string',
          description: 'Specific set ID to check, or leave empty for all sets',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_wishlist',
    description: 'Get cards on the wishlist',
    parameters: {
      type: 'object',
      properties: {
        priorityOnly: {
          type: 'boolean',
          description: 'Only return priority items',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_recently_added',
    description: 'Get recently added cards to the collection',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent cards to return (default 10)',
        },
      },
      required: [],
    },
  },
];

/**
 * Main chat endpoint
 */
export const chat = action({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    message: v.string(),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
  },
  handler: async (ctx, args): Promise<{ response: string; error?: string }> => {
    // Check rate limit
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'chat',
    });

    if (!rateLimitCheck.allowed) {
      const timeUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60);
      return {
        response: `Whoa, you're chatting a lot! 💬 Let's take a quick break. Come back in ${timeUntilReset} minutes!`,
        error: 'rate_limited',
      };
    }

    try {
      // Get recent chat history for context (last 10 messages)
      const chatHistory = await ctx.runQuery(internal.ai.chatbotQueries.getChatHistory, {
        profileId: args.profileId,
        limit: 10,
      });

      // Build messages array
      const gameContext = getGameContext(args.gameSlug);
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: `${safetySystemPrompt}\n\n${gameContext}\n\nYou have access to functions that can query the user's card collection. Use them to answer questions about their collection accurately. Always be enthusiastic and encouraging about their collection!`,
        },
        // Add chat history
        ...chatHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        // Add current message
        {
          role: 'user' as const,
          content: args.message,
        },
      ];

      // Call OpenAI with function calling
      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        max_tokens: TOKEN_LIMITS.CHAT_RESPONSE,
        messages,
        tools: COLLECTION_FUNCTIONS.map((fn) => ({
          type: 'function' as const,
          function: fn,
        })),
        tool_choice: 'auto',
      });

      let assistantMessage = response.choices[0]?.message;
      let finalResponse = assistantMessage?.content || '';

      // Handle function calls
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        const functionResults: Array<{
          role: 'tool';
          tool_call_id: string;
          content: string;
        }> = [];

        for (const toolCall of assistantMessage.tool_calls) {
          const fn = (toolCall as { function: { name: string; arguments: string }; id: string })
            .function;
          const functionName = fn.name;
          const functionArgs = JSON.parse(fn.arguments || '{}');

          // Execute the function
          const result = await executeFunction(
            ctx,
            args.profileId,
            args.gameSlug,
            functionName,
            functionArgs
          );

          functionResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        // Get final response with function results
        const followUpResponse = await openai.chat.completions.create({
          model: MODELS.GPT4O_MINI,
          max_tokens: TOKEN_LIMITS.CHAT_RESPONSE,
          messages: [
            ...messages,
            {
              role: 'assistant' as const,
              content: assistantMessage.content,
              tool_calls: assistantMessage.tool_calls,
            },
            ...functionResults,
          ],
        });

        finalResponse =
          followUpResponse.choices[0]?.message?.content ||
          "I found some info but I'm not sure how to explain it. Try asking differently! 🤔";

        // Update token counts
        const totalInputTokens =
          (response.usage?.prompt_tokens ?? 0) + (followUpResponse.usage?.prompt_tokens ?? 0);
        const totalOutputTokens =
          (response.usage?.completion_tokens ?? 0) +
          (followUpResponse.usage?.completion_tokens ?? 0);

        // Log usage
        await ctx.runMutation(internal.ai.internalMutations.logChatMessage, {
          profileId: args.profileId,
          familyId: args.familyId,
          gameSlug: args.gameSlug,
          userMessage: args.message,
          assistantMessage: finalResponse,
          model: MODELS.GPT4O_MINI,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          usedFunctions: assistantMessage.tool_calls.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (tc: any) => tc.function?.name ?? 'unknown'
          ),
        });
      } else {
        // No function calls, just a direct response
        await ctx.runMutation(internal.ai.internalMutations.logChatMessage, {
          profileId: args.profileId,
          familyId: args.familyId,
          gameSlug: args.gameSlug,
          userMessage: args.message,
          assistantMessage: finalResponse,
          model: MODELS.GPT4O_MINI,
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
          usedFunctions: [],
        });
      }

      return { response: finalResponse };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        response: 'Oops! I got a bit confused there. Could you try asking that again? 🤔',
        error: 'internal_error',
      };
    }
  },
});

/**
 * Execute a collection function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeFunction(
  ctx: any,
  profileId: Id<'profiles'>,
  gameSlug: GameSlug,
  functionName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (functionName) {
    case 'get_collection_stats':
      return await ctx.runQuery(internal.ai.chatbotQueries.getCollectionStats, {
        profileId,
        gameSlug,
      });

    case 'search_collection':
      return await ctx.runQuery(internal.ai.chatbotQueries.searchCollection, {
        profileId,
        gameSlug,
        query: (args.query as string) || undefined,
        type: (args.type as string) || undefined,
        rarity: (args.rarity as string) || undefined,
        setId: (args.setId as string) || undefined,
      });

    case 'get_rarest_cards':
      return await ctx.runQuery(internal.ai.chatbotQueries.getRarestCards, {
        profileId,
        gameSlug,
        limit: (args.limit as number) || 5,
      });

    case 'get_set_progress':
      return await ctx.runQuery(internal.ai.chatbotQueries.getSetProgress, {
        profileId,
        gameSlug,
        setId: (args.setId as string) || undefined,
      });

    case 'get_wishlist':
      return await ctx.runQuery(internal.ai.chatbotQueries.getWishlist, {
        profileId,
        gameSlug,
        priorityOnly: (args.priorityOnly as boolean) || false,
      });

    case 'get_recently_added':
      return await ctx.runQuery(internal.ai.chatbotQueries.getRecentlyAdded, {
        profileId,
        limit: (args.limit as number) || 10,
      });

    default:
      return { error: 'Unknown function' };
  }
}
