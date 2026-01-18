import OpenAI from 'openai';

/**
 * OpenAI Client Configuration for CardDex/KidCollect
 *
 * This module provides a configured OpenAI client for use in Convex Actions.
 * All AI features use this centralized client.
 *
 * Usage in Convex Actions:
 * ```typescript
 * import { openai, MODELS, safetySystemPrompt } from './ai/openai';
 *
 * const response = await openai.chat.completions.create({
 *   model: MODELS.GPT4O_MINI,
 *   messages: [
 *     { role: 'system', content: safetySystemPrompt },
 *     { role: 'user', content: userMessage }
 *   ]
 * });
 * ```
 */

// Initialize OpenAI client with API key from environment
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Available OpenAI Models
 * - GPT4O: Best for complex reasoning, card scanning, detailed analysis
 * - GPT4O_MINI: Cost-effective for chat, simple queries, storytelling
 */
export const MODELS = {
  GPT4O: 'gpt-4o' as const,
  GPT4O_MINI: 'gpt-4o-mini' as const,
  GPT4O_VISION: 'gpt-4o' as const, // GPT-4o has vision capabilities built-in
} as const;

/**
 * Token Limits for different use cases
 * These help manage costs and response lengths
 */
export const TOKEN_LIMITS = {
  CARD_SCAN: 500, // Card identification responses are concise
  CHAT_RESPONSE: 300, // Keep chat responses kid-friendly and brief
  STORY: 400, // Card stories should be engaging but not too long
  QUIZ: 600, // Quiz generation needs more tokens for questions/answers
  RECOMMENDATIONS: 400, // Card recommendations with explanations
} as const;

/**
 * System prompt for kid-safe AI interactions
 * All AI features should use this as a base system prompt
 */
export const safetySystemPrompt = `You are a friendly, enthusiastic assistant for CardDex, a trading card collection app for kids and families.

IMPORTANT RULES:
1. Always be kid-friendly - use simple language appropriate for ages 6-14
2. Be enthusiastic and encouraging about collecting cards
3. Never discuss card values over $100 or investment/speculation
4. Focus on the fun of collecting, not monetary value
5. Keep responses concise and engaging
6. Use emojis sparingly to add fun 🎴✨
7. Never ask for or reference personal information
8. If asked about something inappropriate, redirect to card collecting

You help with:
- Identifying cards from photos
- Answering questions about card collections
- Telling fun facts and stories about cards
- Creating quizzes about card knowledge
- Suggesting cards to collect based on interests`;

/**
 * Game-specific context for multi-TCG support
 */
export const GAME_CONTEXTS = {
  pokemon: {
    name: 'Pokémon TCG',
    theme: 'Pokémon',
    terminology: {
      card: 'Pokémon card',
      rare: 'Ultra Rare',
      pack: 'booster pack',
    },
    concepts: ['types (Fire, Water, Grass, etc.)', 'Trainer cards', 'Energy cards', 'evolutions', 'HP', 'attacks'],
    characters: ['Pikachu', 'Charizard', 'Mewtwo', 'Eevee'],
    deckBuilding: 'types and evolutions',
  },
  yugioh: {
    name: 'Yu-Gi-Oh! TCG',
    theme: 'Yu-Gi-Oh!',
    terminology: {
      card: 'Yu-Gi-Oh! card',
      rare: 'Secret Rare',
      pack: 'booster pack',
    },
    concepts: ['archetypes', 'Monster cards', 'Spell cards', 'Trap cards', 'ATK/DEF', 'Levels', 'Extra Deck'],
    characters: ['Blue-Eyes White Dragon', 'Dark Magician', 'Exodia'],
    deckBuilding: 'archetypes and combos',
  },
  onepiece: {
    name: 'One Piece Card Game',
    theme: 'One Piece',
    terminology: {
      card: 'One Piece card',
      rare: 'Secret Rare',
      pack: 'booster pack',
    },
    concepts: ['Leaders', 'colors (Red, Green, Blue, Purple, Black, Yellow)', 'DON!! cards', 'Characters', 'Events', 'Stages', 'power'],
    characters: ['Luffy', 'Zoro', 'Nami', 'Shanks', 'Ace'],
    deckBuilding: 'colors and Leaders',
  },
  lorcana: {
    name: 'Disney Lorcana',
    theme: 'Lorcana',
    terminology: {
      card: 'Lorcana card',
      rare: 'Enchanted',
      pack: 'booster pack',
    },
    concepts: ['ink colors (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel)', 'lore', 'Characters', 'Songs', 'Actions', 'Items', 'Locations', 'willpower', 'strength'],
    characters: ['Mickey Mouse', 'Elsa', 'Maleficent', 'Stitch'],
    deckBuilding: 'ink colors and card synergies',
  },
} as const;

export type GameSlug = keyof typeof GAME_CONTEXTS;

/**
 * Get game-specific system prompt addition
 * Provides rich context to help the AI use appropriate terminology and concepts
 */
export function getGameContext(gameSlug: GameSlug): string {
  const game = GAME_CONTEXTS[gameSlug];
  return `You are currently helping with ${game.name} cards.

GAME-SPECIFIC INSTRUCTIONS:
- Always refer to cards as "${game.terminology.card}s"
- Use the correct rarity terms (highest rarity: ${game.terminology.rare})
- Key concepts for this game: ${game.concepts.join(', ')}
- Popular characters: ${game.characters.join(', ')}
- When discussing deck building, focus on ${game.deckBuilding}

IMPORTANT: Do NOT use terminology from other card games. For example:
${gameSlug === 'pokemon' ? '- Say "types" not "archetypes", "Trainer cards" not "Spell cards"' : ''}
${gameSlug === 'yugioh' ? '- Say "archetypes" not "types", "Spell/Trap cards" not "Trainer cards"' : ''}
${gameSlug === 'onepiece' ? '- Say "Leaders" and "colors" not "types" or "archetypes", use "DON!!" not "Energy"' : ''}
${gameSlug === 'lorcana' ? '- Say "ink colors" not "types", "lore" not "HP", "Songs" not "Spell cards"' : ''}

Help the user both explore their existing collection AND discover new cards they might want to collect!`;
}

/**
 * Rate limiting configuration
 * These limits help prevent abuse and control costs
 */
export const RATE_LIMITS = {
  CARD_SCANS_PER_DAY: 20, // Per profile
  CHAT_MESSAGES_PER_HOUR: 30, // Per profile
  STORIES_PER_DAY: 10, // Per profile
  QUIZZES_PER_DAY: 5, // Per profile
} as const;

/**
 * Estimated costs per operation (in USD)
 * GPT-4o: ~$2.50/1M input, ~$10/1M output
 * GPT-4o-mini: ~$0.15/1M input, ~$0.60/1M output
 */
export const ESTIMATED_COSTS = {
  CARD_SCAN: 0.01, // Vision + response
  CHAT_MESSAGE: 0.001, // Mini model
  STORY: 0.002, // Mini model, longer response
  QUIZ: 0.003, // Mini model, structured output
} as const;
