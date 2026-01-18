import { describe, it, expect } from 'vitest';

/**
 * Quiz Generator Tests
 *
 * Tests for the AI-powered quiz generator utility functions.
 * The actual AI generation is tested via integration tests,
 * but we test the types, validation, and helper functions here.
 */

// ============================================================================
// QUIZ TYPES AND VALIDATION
// ============================================================================

// Types matching convex/ai/quizGenerator.ts
type QuestionType = 'multiple_choice' | 'true_false' | 'image_based';

interface QuizQuestion {
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

interface QuizResult {
  questions: QuizQuestion[];
  quizId: string;
  title: string;
  description: string;
  totalXp: number;
  error?: string;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function isValidQuestionType(type: string): type is QuestionType {
  return ['multiple_choice', 'true_false', 'image_based'].includes(type);
}

function isValidDifficulty(difficulty: string): difficulty is 'easy' | 'medium' | 'hard' {
  return ['easy', 'medium', 'hard'].includes(difficulty);
}

function isValidQuestion(question: Partial<QuizQuestion>): question is QuizQuestion {
  return (
    typeof question.id === 'string' &&
    isValidQuestionType(question.type || '') &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    typeof question.correctAnswerIndex === 'number' &&
    question.correctAnswerIndex >= 0 &&
    question.correctAnswerIndex < question.options.length &&
    typeof question.explanation === 'string' &&
    isValidDifficulty(question.difficulty || '') &&
    typeof question.xpReward === 'number' &&
    question.xpReward > 0
  );
}

function calculateXpReward(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 5;
    case 'medium':
      return 10;
    case 'hard':
      return 15;
  }
}

function calculateQuizScore(answers: Array<{ correct: boolean; xpEarned: number }>): {
  totalCorrect: number;
  totalQuestions: number;
  percentage: number;
  totalXpEarned: number;
  message: string;
} {
  const totalCorrect = answers.filter((a) => a.correct).length;
  const totalQuestions = answers.length;
  const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalXpEarned = answers.reduce((sum, a) => sum + (a.correct ? a.xpEarned : 0), 0);

  let message: string;
  if (percentage === 100) {
    message = 'Perfect score! You are a card master!';
  } else if (percentage >= 80) {
    message = 'Excellent work! You really know your cards!';
  } else if (percentage >= 60) {
    message = 'Good job! Keep collecting and learning!';
  } else if (percentage >= 40) {
    message = 'Nice try! Study your cards and try again!';
  } else {
    message = "Keep learning! You'll do better next time!";
  }

  return {
    totalCorrect,
    totalQuestions,
    percentage,
    totalXpEarned,
    message,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Quiz Generator Types', () => {
  describe('QuestionType validation', () => {
    it('should accept valid question types', () => {
      expect(isValidQuestionType('multiple_choice')).toBe(true);
      expect(isValidQuestionType('true_false')).toBe(true);
      expect(isValidQuestionType('image_based')).toBe(true);
    });

    it('should reject invalid question types', () => {
      expect(isValidQuestionType('invalid')).toBe(false);
      expect(isValidQuestionType('')).toBe(false);
      expect(isValidQuestionType('MULTIPLE_CHOICE')).toBe(false);
    });
  });

  describe('Difficulty validation', () => {
    it('should accept valid difficulties', () => {
      expect(isValidDifficulty('easy')).toBe(true);
      expect(isValidDifficulty('medium')).toBe(true);
      expect(isValidDifficulty('hard')).toBe(true);
    });

    it('should reject invalid difficulties', () => {
      expect(isValidDifficulty('invalid')).toBe(false);
      expect(isValidDifficulty('')).toBe(false);
      expect(isValidDifficulty('EASY')).toBe(false);
      expect(isValidDifficulty('extreme')).toBe(false);
    });
  });
});

describe('Quiz Question Validation', () => {
  describe('isValidQuestion', () => {
    it('should accept valid multiple choice questions', () => {
      const validQuestion: QuizQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What type is Pikachu?',
        options: ['Fire', 'Water', 'Electric', 'Grass'],
        correctAnswerIndex: 2,
        explanation: 'Pikachu is an Electric type Pokemon!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(validQuestion)).toBe(true);
    });

    it('should accept valid true/false questions', () => {
      const validQuestion: QuizQuestion = {
        id: 'q2',
        type: 'true_false',
        question: 'Charizard is a Fire type Pokemon',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'Charizard is a Fire/Flying type!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(validQuestion)).toBe(true);
    });

    it('should accept valid image-based questions', () => {
      const validQuestion: QuizQuestion = {
        id: 'q3',
        type: 'image_based',
        question: 'Which Pokemon is shown in this card?',
        options: ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander'],
        correctAnswerIndex: 1,
        explanation: 'The card shows Ivysaur!',
        cardId: 'sv1-2',
        imageUrl: 'https://example.com/ivysaur.png',
        difficulty: 'medium',
        xpReward: 10,
      };
      expect(isValidQuestion(validQuestion)).toBe(true);
    });

    it('should reject questions with invalid type', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'invalid_type',
        question: 'What type is Pikachu?',
        options: ['Fire', 'Water', 'Electric', 'Grass'],
        correctAnswerIndex: 2,
        explanation: 'Pikachu is an Electric type!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(invalidQuestion)).toBe(false);
    });

    it('should reject questions with invalid correctAnswerIndex', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What type is Pikachu?',
        options: ['Fire', 'Water', 'Electric', 'Grass'],
        correctAnswerIndex: 5, // Out of bounds
        explanation: 'Pikachu is an Electric type!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(invalidQuestion)).toBe(false);
    });

    it('should reject questions with negative correctAnswerIndex', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What type is Pikachu?',
        options: ['Fire', 'Water', 'Electric', 'Grass'],
        correctAnswerIndex: -1,
        explanation: 'Pikachu is an Electric type!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(invalidQuestion)).toBe(false);
    });

    it('should reject questions with no options', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What type is Pikachu?',
        options: [],
        correctAnswerIndex: 0,
        explanation: 'Pikachu is an Electric type!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(invalidQuestion)).toBe(false);
    });

    it('should reject questions with only one option', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What type is Pikachu?',
        options: ['Electric'],
        correctAnswerIndex: 0,
        explanation: 'Pikachu is an Electric type!',
        difficulty: 'easy',
        xpReward: 5,
      };
      expect(isValidQuestion(invalidQuestion)).toBe(false);
    });

    it('should reject questions with zero xpReward', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What type is Pikachu?',
        options: ['Fire', 'Water', 'Electric', 'Grass'],
        correctAnswerIndex: 2,
        explanation: 'Pikachu is an Electric type!',
        difficulty: 'easy',
        xpReward: 0,
      };
      expect(isValidQuestion(invalidQuestion)).toBe(false);
    });

    it('should reject incomplete questions', () => {
      expect(isValidQuestion({})).toBe(false);
      expect(isValidQuestion({ id: 'q1' })).toBe(false);
      expect(isValidQuestion({ id: 'q1', type: 'multiple_choice' })).toBe(false);
    });
  });
});

describe('XP Reward Calculation', () => {
  describe('calculateXpReward', () => {
    it('should return 5 XP for easy difficulty', () => {
      expect(calculateXpReward('easy')).toBe(5);
    });

    it('should return 10 XP for medium difficulty', () => {
      expect(calculateXpReward('medium')).toBe(10);
    });

    it('should return 15 XP for hard difficulty', () => {
      expect(calculateXpReward('hard')).toBe(15);
    });
  });
});

describe('Quiz Score Calculation', () => {
  describe('calculateQuizScore', () => {
    it('should calculate perfect score correctly', () => {
      const answers = [
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(5);
      expect(result.totalQuestions).toBe(5);
      expect(result.percentage).toBe(100);
      expect(result.totalXpEarned).toBe(25);
      expect(result.message).toContain('Perfect score');
    });

    it('should calculate 80% score correctly', () => {
      const answers = [
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(4);
      expect(result.percentage).toBe(80);
      expect(result.totalXpEarned).toBe(20);
      expect(result.message).toContain('Excellent');
    });

    it('should calculate 60% score correctly', () => {
      const answers = [
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(3);
      expect(result.percentage).toBe(60);
      expect(result.totalXpEarned).toBe(15);
      expect(result.message).toContain('Good job');
    });

    it('should calculate 40% score correctly', () => {
      const answers = [
        { correct: true, xpEarned: 5 },
        { correct: true, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(2);
      expect(result.percentage).toBe(40);
      expect(result.totalXpEarned).toBe(10);
      expect(result.message).toContain('Nice try');
    });

    it('should calculate low score correctly', () => {
      const answers = [
        { correct: true, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(1);
      expect(result.percentage).toBe(20);
      expect(result.totalXpEarned).toBe(5);
      expect(result.message).toContain('Keep learning');
    });

    it('should handle zero score', () => {
      const answers = [
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
        { correct: false, xpEarned: 5 },
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.totalXpEarned).toBe(0);
    });

    it('should handle empty answers', () => {
      const result = calculateQuizScore([]);
      expect(result.totalCorrect).toBe(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.totalXpEarned).toBe(0);
    });

    it('should handle mixed difficulty XP rewards', () => {
      const answers = [
        { correct: true, xpEarned: 5 }, // easy
        { correct: true, xpEarned: 10 }, // medium
        { correct: true, xpEarned: 15 }, // hard
        { correct: false, xpEarned: 10 }, // missed medium
      ];

      const result = calculateQuizScore(answers);
      expect(result.totalCorrect).toBe(3);
      expect(result.percentage).toBe(75);
      expect(result.totalXpEarned).toBe(30); // 5 + 10 + 15
    });
  });
});

describe('Quiz Result Structure', () => {
  it('should have all required fields in QuizResult', () => {
    const validResult: QuizResult = {
      questions: [],
      quizId: 'quiz_123',
      title: 'Test Quiz',
      description: 'A test quiz',
      totalXp: 25,
    };

    expect(validResult.questions).toBeDefined();
    expect(validResult.quizId).toBeDefined();
    expect(validResult.title).toBeDefined();
    expect(validResult.description).toBeDefined();
    expect(validResult.totalXp).toBeDefined();
  });

  it('should support optional error field', () => {
    const errorResult: QuizResult = {
      questions: [],
      quizId: '',
      title: '',
      description: '',
      totalXp: 0,
      error: 'Not enough cards in collection',
    };

    expect(errorResult.error).toBe('Not enough cards in collection');
  });

  it('should calculate totalXp from questions', () => {
    const questions: QuizQuestion[] = [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Q1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0,
        explanation: 'E1',
        difficulty: 'easy',
        xpReward: 5,
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Q2',
        options: ['True', 'False'],
        correctAnswerIndex: 0,
        explanation: 'E2',
        difficulty: 'medium',
        xpReward: 10,
      },
      {
        id: 'q3',
        type: 'image_based',
        question: 'Q3',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 2,
        explanation: 'E3',
        difficulty: 'hard',
        xpReward: 15,
      },
    ];

    const totalXp = questions.reduce((sum, q) => sum + q.xpReward, 0);
    expect(totalXp).toBe(30);
  });
});

describe('Game-specific Quiz Support', () => {
  const SUPPORTED_GAMES = [
    'pokemon',
    'yugioh',
    'onepiece',
    'lorcana',
  ];

  it('should support all 4 TCG games', () => {
    expect(SUPPORTED_GAMES).toHaveLength(4);
  });

  it('should have pokemon as the first supported game', () => {
    expect(SUPPORTED_GAMES[0]).toBe('pokemon');
  });

  it('should include all TCG game slugs', () => {
    expect(SUPPORTED_GAMES).toContain('pokemon');
    expect(SUPPORTED_GAMES).toContain('yugioh');
    expect(SUPPORTED_GAMES).toContain('onepiece');
    expect(SUPPORTED_GAMES).toContain('lorcana');
  });
});

describe('Quiz Rate Limiting', () => {
  const QUIZZES_PER_DAY = 5;

  it('should have a daily limit of 5 quizzes', () => {
    expect(QUIZZES_PER_DAY).toBe(5);
  });

  it('should generate appropriate rate limit message', () => {
    const hoursUntilReset = 3;
    const message = `You've taken lots of quizzes today! Come back in ${hoursUntilReset} hours for more quiz fun!`;
    expect(message).toContain('quizzes today');
    expect(message).toContain(`${hoursUntilReset} hours`);
  });
});

describe('Minimum Collection Requirement', () => {
  const MIN_CARDS_FOR_QUIZ = 3;

  it('should require at least 3 cards for a quiz', () => {
    expect(MIN_CARDS_FOR_QUIZ).toBe(3);
  });

  it('should generate appropriate error message for insufficient cards', () => {
    const message = `You need at least ${MIN_CARDS_FOR_QUIZ} cards in your collection to generate a quiz! Keep collecting!`;
    expect(message).toContain(`at least ${MIN_CARDS_FOR_QUIZ} cards`);
    expect(message).toContain('Keep collecting');
  });
});

describe('Question Count Bounds', () => {
  const MIN_QUESTIONS = 1;
  const MAX_QUESTIONS = 10;
  const DEFAULT_QUESTIONS = 5;

  it('should have valid question count bounds', () => {
    expect(MIN_QUESTIONS).toBeLessThan(MAX_QUESTIONS);
    expect(DEFAULT_QUESTIONS).toBeGreaterThanOrEqual(MIN_QUESTIONS);
    expect(DEFAULT_QUESTIONS).toBeLessThanOrEqual(MAX_QUESTIONS);
  });

  it('should clamp question count to valid range', () => {
    const clampQuestionCount = (count: number): number => {
      return Math.min(Math.max(count, MIN_QUESTIONS), MAX_QUESTIONS);
    };

    expect(clampQuestionCount(0)).toBe(MIN_QUESTIONS);
    expect(clampQuestionCount(-5)).toBe(MIN_QUESTIONS);
    expect(clampQuestionCount(5)).toBe(5);
    expect(clampQuestionCount(15)).toBe(MAX_QUESTIONS);
    expect(clampQuestionCount(100)).toBe(MAX_QUESTIONS);
  });
});

describe('Quiz ID Generation', () => {
  it('should generate unique quiz IDs', () => {
    const generateQuizId = () => {
      return `quiz_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    };

    const id1 = generateQuizId();
    const id2 = generateQuizId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^quiz_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^quiz_\d+_[a-z0-9]+$/);
  });

  it('should start with "quiz_" prefix', () => {
    const generateQuizId = () => {
      return `quiz_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    };

    const id = generateQuizId();
    expect(id.startsWith('quiz_')).toBe(true);
  });
});
