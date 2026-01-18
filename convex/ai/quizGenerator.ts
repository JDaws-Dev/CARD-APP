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
 * AI Quiz Generator
 *
 * Generates personalized quizzes from a user's card collection.
 * Kids can test their knowledge about cards they own with fun,
 * educational questions.
 *
 * Features:
 * - Multiple question types: multiple choice, true/false, image-based
 * - Personalized to user's collection
 * - Game-specific terminology and content
 * - Kid-friendly language and difficulty levels
 * - XP rewards for correct answers
 *
 * Note: Internal mutations and queries are in quizHelpers.ts because
 * they cannot be in a 'use node' file.
 */

// ============================================================================
// TYPES
// ============================================================================

export type QuestionType = 'multiple_choice' | 'true_false' | 'image_based';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  cardId?: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
}

export interface QuizResult {
  questions: QuizQuestion[];
  quizId: string;
  title: string;
  description: string;
  totalXp: number;
  error?: string;
}

// ============================================================================
// GAME-SPECIFIC QUIZ PROMPTS
// ============================================================================

const QUIZ_PROMPTS: Record<GameSlug, string> = {
  pokemon: `You are creating a fun quiz for a young Pokémon card collector!

Generate engaging questions about Pokémon cards. Questions should test:
- Pokémon types and weaknesses
- Evolution chains
- Card rarities
- Special abilities and attacks
- Set knowledge

Keep questions fun, educational, and age-appropriate (6-14 years old).`,

  yugioh: `You are creating a fun quiz for a young Yu-Gi-Oh! card collector!

Generate engaging questions about Yu-Gi-Oh! cards. Questions should test:
- Monster types and attributes
- Card effects and abilities
- Archetypes
- Card rarities
- Deck strategies

Keep questions fun, educational, and age-appropriate (6-14 years old).`,

  onepiece: `You are creating a fun quiz for a young One Piece card collector!

Generate engaging questions about One Piece cards. Questions should test:
- Character affiliations (crews, marines, etc.)
- Devil Fruit powers
- Card colors and strategies
- Character abilities
- Story events

Keep questions fun, educational, and age-appropriate (6-14 years old).`,

  lorcana: `You are creating a fun quiz for a young Disney Lorcana collector!

Generate engaging questions about Lorcana cards. Questions should test:
- Disney characters and their movies
- Ink colors and abilities
- Card types (Character, Action, Item)
- Lore and glimmers
- Song cards

Keep questions fun, magical, and age-appropriate (6-14 years old).`,
};

// ============================================================================
// QUIZ GENERATION ACTION
// ============================================================================

/**
 * Generate a personalized quiz from the user's collection
 */
export const generateQuiz = action({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    questionCount: v.optional(v.number()), // Default 5
    questionTypes: v.optional(
      v.array(
        v.union(v.literal('multiple_choice'), v.literal('true_false'), v.literal('image_based'))
      )
    ),
    difficulty: v.optional(v.union(v.literal('easy'), v.literal('medium'), v.literal('hard'))),
    gameSlug: v.optional(
      v.union(
        v.literal('pokemon'),
        v.literal('yugioh'),
        v.literal('onepiece'),
        v.literal('lorcana')
      )
    ),
  },
  handler: async (ctx, args): Promise<QuizResult> => {
    const questionCount = Math.min(Math.max(args.questionCount ?? 5, 1), 10);
    const questionTypes = args.questionTypes ?? ['multiple_choice', 'true_false'];
    const difficulty = args.difficulty ?? 'easy';
    const gameSlug = args.gameSlug ?? 'pokemon';

    // Check rate limit
    const rateLimitCheck = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'quiz',
    });

    if (!rateLimitCheck.allowed) {
      const hoursUntilReset = Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000 / 60 / 60);
      return {
        questions: [],
        quizId: '',
        title: '',
        description: '',
        totalXp: 0,
        error: `You've taken lots of quizzes today! 🧠 Come back in ${hoursUntilReset} hours for more quiz fun!`,
      };
    }

    // Get random cards from collection for quiz questions
    const collectionCards = await ctx.runQuery(internal.ai.quizHelpers.getRandomCollectionCards, {
      profileId: args.profileId,
      count: questionCount * 2, // Get extra cards for variety
      gameSlug,
    });

    if (collectionCards.length < 3) {
      return {
        questions: [],
        quizId: '',
        title: '',
        description: '',
        totalXp: 0,
        error: `You need at least 3 cards in your collection to generate a quiz! Keep collecting! 🎴`,
      };
    }

    try {
      // Build the prompt with card details
      const gameContext = getGameContext(gameSlug);
      const quizPrompt = QUIZ_PROMPTS[gameSlug];
      const gameName = GAME_CONTEXTS[gameSlug].name;

      const cardsList = collectionCards
        .slice(0, questionCount)
        .map(
          (card: { name: string; supertype?: string; rarity?: string; types?: string[]; setId: string }, i: number) =>
            `${i + 1}. ${card.name} (${card.supertype || 'Unknown'}, ${card.rarity || 'Unknown'}, Types: ${card.types?.join(', ') || 'None'}, Set: ${card.setId})`
        )
        .join('\n');

      const typesRequested = questionTypes.join(', ');
      const xpPerQuestion = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;

      const userMessage = `${quizPrompt}

Create exactly ${questionCount} quiz questions about these cards from the player's collection:
${cardsList}

Question types to include: ${typesRequested}
Difficulty level: ${difficulty}
Game: ${gameName}

Requirements:
- For multiple_choice: 4 options, only 1 correct
- For true_false: 2 options ("True" and "False"), make sure the correct answer is accurate
- For image_based: Ask about visual elements like the card art, colors, or symbols
- Include a brief, encouraging explanation for each answer
- Questions should be about the specific cards listed above
- Each question awards ${xpPerQuestion} XP

Respond in JSON format:
{
  "title": "Fun quiz title related to ${gameName}",
  "description": "Short encouraging description for kids",
  "questions": [
    {
      "type": "multiple_choice|true_false|image_based",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Why this is the correct answer - keep it fun and educational!",
      "cardName": "Name of the card this question is about",
      "difficulty": "${difficulty}"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        max_tokens: TOKEN_LIMITS.QUIZ,
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
        return createFallbackQuiz(collectionCards, difficulty, gameSlug);
      }

      // Parse JSON response
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      interface ParsedQuestion {
        type: QuestionType;
        question: string;
        options: string[];
        correctAnswerIndex: number;
        explanation: string;
        cardName?: string;
        difficulty: 'easy' | 'medium' | 'hard';
      }

      let parsed: {
        title: string;
        description: string;
        questions: ParsedQuestion[];
      };
      try {
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        return createFallbackQuiz(collectionCards, difficulty, gameSlug);
      }

      // Build quiz result
      const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Match card names to cardIds and imageUrls
      const cardByName = new Map<string, { cardId: string; imageUrl: string }>(
        collectionCards.map((c: { name: string; cardId: string; imageSmall: string }) => [
          c.name.toLowerCase(),
          { cardId: c.cardId, imageUrl: c.imageSmall },
        ])
      );

      const questions: QuizQuestion[] = parsed.questions.map((q, index) => {
        const cardInfo = q.cardName ? cardByName.get(q.cardName.toLowerCase()) : undefined;
        return {
          id: `${quizId}_q${index}`,
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation,
          cardId: cardInfo?.cardId,
          imageUrl: q.type === 'image_based' ? cardInfo?.imageUrl : undefined,
          difficulty: q.difficulty || difficulty,
          xpReward: xpPerQuestion,
        };
      });

      const totalXp = questions.reduce((sum, q) => sum + q.xpReward, 0);

      // Log usage
      await ctx.runMutation(internal.ai.quizHelpers.logQuizGeneration, {
        profileId: args.profileId,
        familyId: args.familyId,
        gameSlug,
        quizId,
        questionCount: questions.length,
        model: MODELS.GPT4O_MINI,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      });

      return {
        questions,
        quizId,
        title: parsed.title,
        description: parsed.description,
        totalXp,
      };
    } catch (error) {
      console.error('Quiz generation error:', error);
      return createFallbackQuiz(collectionCards, difficulty, gameSlug);
    }
  },
});

/**
 * Create a fallback quiz when AI generation fails
 */
function createFallbackQuiz(
  cards: Array<{
    cardId: string;
    name: string;
    supertype?: string;
    types?: string[];
    rarity?: string;
    imageSmall: string;
  }>,
  difficulty: 'easy' | 'medium' | 'hard',
  gameSlug: GameSlug
): QuizResult {
  const gameName = GAME_CONTEXTS[gameSlug].name;
  const xpPerQuestion = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
  const quizId = `quiz_fallback_${Date.now()}`;

  // Generate simple questions from card data
  const questions: QuizQuestion[] = cards.slice(0, 3).map((card, index) => ({
    id: `${quizId}_q${index}`,
    type: 'multiple_choice' as QuestionType,
    question: `What type is ${card.name}?`,
    options: [card.types?.[0] || 'Normal', 'Fire', 'Water', 'Electric']
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 4),
    correctAnswerIndex: 0,
    explanation: `${card.name} is a ${card.types?.[0] || 'Normal'} type card!`,
    cardId: card.cardId,
    difficulty,
    xpReward: xpPerQuestion,
  }));

  return {
    questions,
    quizId,
    title: `${gameName} Quick Quiz`,
    description: 'Test your card knowledge!',
    totalXp: questions.reduce((sum, q) => sum + q.xpReward, 0),
  };
}

// ============================================================================
// QUIZ RESULT SUBMISSION
// ============================================================================

/**
 * Submit quiz results and award XP
 */
export const submitQuizResults = action({
  args: {
    profileId: v.id('profiles'),
    quizId: v.string(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        selectedAnswerIndex: v.number(),
        correct: v.boolean(),
        xpEarned: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const totalCorrect = args.answers.filter((a) => a.correct).length;
    const totalQuestions = args.answers.length;
    const totalXpEarned = args.answers.reduce((sum, a) => sum + (a.correct ? a.xpEarned : 0), 0);

    // Award XP to profile
    if (totalXpEarned > 0) {
      await ctx.runMutation(internal.ai.quizHelpers.awardQuizXp, {
        profileId: args.profileId,
        xpAmount: totalXpEarned,
        quizId: args.quizId,
        score: totalCorrect,
        totalQuestions,
      });
    }

    // Calculate percentage and generate message
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);
    let message: string;
    let emoji: string;

    if (percentage === 100) {
      message = 'Perfect score! You are a card master!';
      emoji = '🏆';
    } else if (percentage >= 80) {
      message = 'Excellent work! You really know your cards!';
      emoji = '🌟';
    } else if (percentage >= 60) {
      message = 'Good job! Keep collecting and learning!';
      emoji = '👍';
    } else if (percentage >= 40) {
      message = 'Nice try! Study your cards and try again!';
      emoji = '📚';
    } else {
      message = "Keep learning! You'll do better next time!";
      emoji = '💪';
    }

    return {
      totalCorrect,
      totalQuestions,
      percentage,
      totalXpEarned,
      message: `${emoji} ${message}`,
    };
  },
});

// ============================================================================
// HELPER ACTIONS
// ============================================================================

/**
 * Get remaining quizzes for today
 */
export const getRemainingQuizzes = action({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<{ remaining: number; resetAt: number; limit: number }> => {
    const status = await ctx.runQuery(internal.ai.rateLimit.getRateLimitStatus, {
      profileId: args.profileId,
      featureType: 'quiz',
    });

    return {
      remaining: status.remaining,
      resetAt: status.resetAt,
      limit: 5, // RATE_LIMITS.QUIZZES_PER_DAY
    };
  },
});
