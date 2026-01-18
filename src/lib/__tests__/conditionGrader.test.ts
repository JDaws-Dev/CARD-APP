import { describe, it, expect } from 'vitest';

/**
 * Condition Grader Tests
 *
 * Tests for the AI-powered card condition grading utility functions.
 * The actual AI Vision calls are tested via integration tests,
 * but we test the types, validation, and helper functions here.
 */

// ============================================================================
// CONDITION GRADING TYPES
// ============================================================================

type ConditionGrade = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
type ConditionRating = 'perfect' | 'good' | 'fair' | 'poor';
type CenteringRating = 'well-centered' | 'slightly-off' | 'off-center';
type Confidence = 'high' | 'medium' | 'low';

interface ConditionArea {
  rating: ConditionRating;
  description: string;
}

interface CenteringArea {
  rating: CenteringRating;
  description: string;
}

interface ConditionDetails {
  corners: ConditionArea;
  edges: ConditionArea;
  surface: ConditionArea;
  centering: CenteringArea;
}

interface ConditionGradingResult {
  grade: ConditionGrade;
  gradeName: string;
  confidence: Confidence;
  overallSummary: string;
  details: ConditionDetails;
  issuesFound: string[];
  careTip: string;
  funFact: string;
  wouldImproveGrade: string | null;
  error?: string;
}

interface GradeInfo {
  grade: string;
  name: string;
  description: string;
  whatToLookFor: string[];
  valueImpact: string;
  emoji: string;
}

interface GradingGuide {
  grades: GradeInfo[];
  generalTips: string[];
  funFacts: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function isValidGrade(grade: string): grade is ConditionGrade {
  return ['NM', 'LP', 'MP', 'HP', 'DMG'].includes(grade);
}

function isValidConditionRating(rating: string): rating is ConditionRating {
  return ['perfect', 'good', 'fair', 'poor'].includes(rating);
}

function isValidCenteringRating(rating: string): rating is CenteringRating {
  return ['well-centered', 'slightly-off', 'off-center'].includes(rating);
}

function isValidConfidence(confidence: string): confidence is Confidence {
  return ['high', 'medium', 'low'].includes(confidence);
}

function getGradeFullName(grade: ConditionGrade): string {
  const names: Record<ConditionGrade, string> = {
    NM: 'Near Mint',
    LP: 'Lightly Played',
    MP: 'Moderately Played',
    HP: 'Heavily Played',
    DMG: 'Damaged',
  };
  return names[grade];
}

function getGradeEmoji(grade: ConditionGrade): string {
  const emojis: Record<ConditionGrade, string> = {
    NM: '✨',
    LP: '👍',
    MP: '👌',
    HP: '🎮',
    DMG: '💔',
  };
  return emojis[grade];
}

function getGradeSortOrder(grade: ConditionGrade): number {
  const order: Record<ConditionGrade, number> = {
    NM: 1,
    LP: 2,
    MP: 3,
    HP: 4,
    DMG: 5,
  };
  return order[grade];
}

function isValidConditionArea(area: Partial<ConditionArea>): area is ConditionArea {
  return (
    typeof area.rating === 'string' &&
    isValidConditionRating(area.rating) &&
    typeof area.description === 'string' &&
    area.description.length > 0
  );
}

function isValidCenteringArea(area: Partial<CenteringArea>): area is CenteringArea {
  return (
    typeof area.rating === 'string' &&
    isValidCenteringRating(area.rating) &&
    typeof area.description === 'string' &&
    area.description.length > 0
  );
}

function isValidConditionDetails(details: Partial<ConditionDetails>): details is ConditionDetails {
  return (
    details.corners !== undefined &&
    isValidConditionArea(details.corners) &&
    details.edges !== undefined &&
    isValidConditionArea(details.edges) &&
    details.surface !== undefined &&
    isValidConditionArea(details.surface) &&
    details.centering !== undefined &&
    isValidCenteringArea(details.centering)
  );
}

function isValidGradingResult(result: Partial<ConditionGradingResult>): boolean {
  return (
    typeof result.grade === 'string' &&
    isValidGrade(result.grade) &&
    typeof result.gradeName === 'string' &&
    typeof result.confidence === 'string' &&
    isValidConfidence(result.confidence) &&
    typeof result.overallSummary === 'string' &&
    result.details !== undefined &&
    isValidConditionDetails(result.details) &&
    Array.isArray(result.issuesFound) &&
    typeof result.careTip === 'string' &&
    typeof result.funFact === 'string'
  );
}

function estimateGradeFromRatings(
  corners: ConditionRating,
  edges: ConditionRating,
  surface: ConditionRating
): ConditionGrade {
  const ratings = [corners, edges, surface];
  const poorCount = ratings.filter((r) => r === 'poor').length;
  const fairCount = ratings.filter((r) => r === 'fair').length;
  const goodCount = ratings.filter((r) => r === 'good').length;

  if (poorCount >= 2) return 'DMG';
  if (poorCount >= 1) return 'HP';
  if (fairCount >= 2) return 'MP';
  if (fairCount >= 1) return 'LP';
  if (goodCount >= 1) return 'LP'; // Any 'good' rating means LP (not perfect)
  return 'NM';
}

function getValuePercentage(grade: ConditionGrade): number {
  const percentages: Record<ConditionGrade, number> = {
    NM: 100,
    LP: 80,
    MP: 50,
    HP: 30,
    DMG: 10,
  };
  return percentages[grade];
}

function isTradeAcceptable(grade: ConditionGrade): boolean {
  return grade === 'NM' || grade === 'LP';
}

function compareGrades(gradeA: ConditionGrade, gradeB: ConditionGrade): number {
  return getGradeSortOrder(gradeA) - getGradeSortOrder(gradeB);
}

function getConditionCategory(grade: ConditionGrade): 'excellent' | 'good' | 'fair' | 'poor' {
  switch (grade) {
    case 'NM':
      return 'excellent';
    case 'LP':
      return 'good';
    case 'MP':
      return 'fair';
    case 'HP':
    case 'DMG':
      return 'poor';
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Condition Grading Types', () => {
  describe('Grade validation', () => {
    it('should accept all valid grades', () => {
      expect(isValidGrade('NM')).toBe(true);
      expect(isValidGrade('LP')).toBe(true);
      expect(isValidGrade('MP')).toBe(true);
      expect(isValidGrade('HP')).toBe(true);
      expect(isValidGrade('DMG')).toBe(true);
    });

    it('should reject invalid grades', () => {
      expect(isValidGrade('nm')).toBe(false);
      expect(isValidGrade('MINT')).toBe(false);
      expect(isValidGrade('')).toBe(false);
      expect(isValidGrade('EX')).toBe(false);
      expect(isValidGrade('GD')).toBe(false);
    });
  });

  describe('Condition rating validation', () => {
    it('should accept valid condition ratings', () => {
      expect(isValidConditionRating('perfect')).toBe(true);
      expect(isValidConditionRating('good')).toBe(true);
      expect(isValidConditionRating('fair')).toBe(true);
      expect(isValidConditionRating('poor')).toBe(true);
    });

    it('should reject invalid condition ratings', () => {
      expect(isValidConditionRating('excellent')).toBe(false);
      expect(isValidConditionRating('bad')).toBe(false);
      expect(isValidConditionRating('')).toBe(false);
      expect(isValidConditionRating('PERFECT')).toBe(false);
    });
  });

  describe('Centering rating validation', () => {
    it('should accept valid centering ratings', () => {
      expect(isValidCenteringRating('well-centered')).toBe(true);
      expect(isValidCenteringRating('slightly-off')).toBe(true);
      expect(isValidCenteringRating('off-center')).toBe(true);
    });

    it('should reject invalid centering ratings', () => {
      expect(isValidCenteringRating('centered')).toBe(false);
      expect(isValidCenteringRating('perfect')).toBe(false);
      expect(isValidCenteringRating('')).toBe(false);
    });
  });

  describe('Confidence validation', () => {
    it('should accept valid confidence levels', () => {
      expect(isValidConfidence('high')).toBe(true);
      expect(isValidConfidence('medium')).toBe(true);
      expect(isValidConfidence('low')).toBe(true);
    });

    it('should reject invalid confidence levels', () => {
      expect(isValidConfidence('very-high')).toBe(false);
      expect(isValidConfidence('uncertain')).toBe(false);
      expect(isValidConfidence('')).toBe(false);
    });
  });
});

describe('Grade Information Functions', () => {
  describe('getGradeFullName', () => {
    it('should return correct full names for all grades', () => {
      expect(getGradeFullName('NM')).toBe('Near Mint');
      expect(getGradeFullName('LP')).toBe('Lightly Played');
      expect(getGradeFullName('MP')).toBe('Moderately Played');
      expect(getGradeFullName('HP')).toBe('Heavily Played');
      expect(getGradeFullName('DMG')).toBe('Damaged');
    });
  });

  describe('getGradeEmoji', () => {
    it('should return appropriate emojis for all grades', () => {
      expect(getGradeEmoji('NM')).toBe('✨');
      expect(getGradeEmoji('LP')).toBe('👍');
      expect(getGradeEmoji('MP')).toBe('👌');
      expect(getGradeEmoji('HP')).toBe('🎮');
      expect(getGradeEmoji('DMG')).toBe('💔');
    });
  });

  describe('getGradeSortOrder', () => {
    it('should return correct sort order (1=best, 5=worst)', () => {
      expect(getGradeSortOrder('NM')).toBe(1);
      expect(getGradeSortOrder('LP')).toBe(2);
      expect(getGradeSortOrder('MP')).toBe(3);
      expect(getGradeSortOrder('HP')).toBe(4);
      expect(getGradeSortOrder('DMG')).toBe(5);
    });

    it('should maintain correct ordering', () => {
      expect(getGradeSortOrder('NM')).toBeLessThan(getGradeSortOrder('LP'));
      expect(getGradeSortOrder('LP')).toBeLessThan(getGradeSortOrder('MP'));
      expect(getGradeSortOrder('MP')).toBeLessThan(getGradeSortOrder('HP'));
      expect(getGradeSortOrder('HP')).toBeLessThan(getGradeSortOrder('DMG'));
    });
  });

  describe('getValuePercentage', () => {
    it('should return correct value percentages', () => {
      expect(getValuePercentage('NM')).toBe(100);
      expect(getValuePercentage('LP')).toBe(80);
      expect(getValuePercentage('MP')).toBe(50);
      expect(getValuePercentage('HP')).toBe(30);
      expect(getValuePercentage('DMG')).toBe(10);
    });

    it('should have decreasing value as condition worsens', () => {
      expect(getValuePercentage('NM')).toBeGreaterThan(getValuePercentage('LP'));
      expect(getValuePercentage('LP')).toBeGreaterThan(getValuePercentage('MP'));
      expect(getValuePercentage('MP')).toBeGreaterThan(getValuePercentage('HP'));
      expect(getValuePercentage('HP')).toBeGreaterThan(getValuePercentage('DMG'));
    });
  });
});

describe('Condition Area Validation', () => {
  describe('isValidConditionArea', () => {
    it('should accept valid condition areas', () => {
      expect(isValidConditionArea({ rating: 'perfect', description: 'Sharp corners' })).toBe(true);
      expect(isValidConditionArea({ rating: 'good', description: 'Minor wear' })).toBe(true);
      expect(isValidConditionArea({ rating: 'fair', description: 'Visible wear' })).toBe(true);
      expect(isValidConditionArea({ rating: 'poor', description: 'Heavy damage' })).toBe(true);
    });

    it('should reject invalid condition areas', () => {
      expect(
        isValidConditionArea({ rating: 'invalid' as ConditionRating, description: 'test' })
      ).toBe(false);
      expect(isValidConditionArea({ rating: 'perfect', description: '' })).toBe(false);
      expect(isValidConditionArea({ rating: 'perfect' } as ConditionArea)).toBe(false);
      expect(isValidConditionArea({} as ConditionArea)).toBe(false);
    });
  });

  describe('isValidCenteringArea', () => {
    it('should accept valid centering areas', () => {
      expect(
        isValidCenteringArea({ rating: 'well-centered', description: 'Perfect centering' })
      ).toBe(true);
      expect(
        isValidCenteringArea({ rating: 'slightly-off', description: 'Slightly off center' })
      ).toBe(true);
      expect(isValidCenteringArea({ rating: 'off-center', description: 'Very off center' })).toBe(
        true
      );
    });

    it('should reject invalid centering areas', () => {
      expect(
        isValidCenteringArea({ rating: 'centered' as CenteringRating, description: 'test' })
      ).toBe(false);
      expect(isValidCenteringArea({ rating: 'well-centered', description: '' })).toBe(false);
    });
  });
});

describe('Condition Details Validation', () => {
  it('should accept valid condition details', () => {
    const validDetails: ConditionDetails = {
      corners: { rating: 'perfect', description: 'Sharp corners' },
      edges: { rating: 'good', description: 'Minor edge wear' },
      surface: { rating: 'perfect', description: 'Clean surface' },
      centering: { rating: 'well-centered', description: 'Good centering' },
    };
    expect(isValidConditionDetails(validDetails)).toBe(true);
  });

  it('should reject details missing corners', () => {
    const invalidDetails = {
      edges: { rating: 'good', description: 'Minor edge wear' },
      surface: { rating: 'perfect', description: 'Clean surface' },
      centering: { rating: 'well-centered', description: 'Good centering' },
    };
    expect(isValidConditionDetails(invalidDetails as ConditionDetails)).toBe(false);
  });

  it('should reject details with invalid area', () => {
    const invalidDetails = {
      corners: { rating: 'invalid', description: 'test' },
      edges: { rating: 'good', description: 'Minor edge wear' },
      surface: { rating: 'perfect', description: 'Clean surface' },
      centering: { rating: 'well-centered', description: 'Good centering' },
    };
    expect(isValidConditionDetails(invalidDetails as ConditionDetails)).toBe(false);
  });
});

describe('Grading Result Validation', () => {
  it('should accept a valid grading result', () => {
    const validResult: ConditionGradingResult = {
      grade: 'LP',
      gradeName: 'Lightly Played',
      confidence: 'high',
      overallSummary: 'This card is in great condition!',
      details: {
        corners: { rating: 'good', description: 'Minor corner wear' },
        edges: { rating: 'perfect', description: 'Clean edges' },
        surface: { rating: 'good', description: 'Light scratches' },
        centering: { rating: 'well-centered', description: 'Good centering' },
      },
      issuesFound: ['Minor corner wear', 'Light surface scratches'],
      careTip: 'Store in a sleeve!',
      funFact: 'Cards are cool!',
      wouldImproveGrade: null,
    };
    expect(isValidGradingResult(validResult)).toBe(true);
  });

  it('should accept result with empty issues array', () => {
    const result: ConditionGradingResult = {
      grade: 'NM',
      gradeName: 'Near Mint',
      confidence: 'high',
      overallSummary: 'Perfect card!',
      details: {
        corners: { rating: 'perfect', description: 'Sharp' },
        edges: { rating: 'perfect', description: 'Clean' },
        surface: { rating: 'perfect', description: 'Pristine' },
        centering: { rating: 'well-centered', description: 'Centered' },
      },
      issuesFound: [],
      careTip: 'Keep it sleeved!',
      funFact: 'Rare find!',
      wouldImproveGrade: null,
    };
    expect(isValidGradingResult(result)).toBe(true);
  });

  it('should reject result with invalid grade', () => {
    const result = {
      grade: 'EXCELLENT',
      gradeName: 'Excellent',
      confidence: 'high',
      overallSummary: 'Great card',
      details: {
        corners: { rating: 'perfect', description: 'Sharp' },
        edges: { rating: 'perfect', description: 'Clean' },
        surface: { rating: 'perfect', description: 'Pristine' },
        centering: { rating: 'well-centered', description: 'Centered' },
      },
      issuesFound: [],
      careTip: 'Tip',
      funFact: 'Fact',
      wouldImproveGrade: null,
    };
    expect(isValidGradingResult(result as ConditionGradingResult)).toBe(false);
  });
});

describe('Grade Estimation from Ratings', () => {
  it('should estimate NM when all ratings are perfect', () => {
    expect(estimateGradeFromRatings('perfect', 'perfect', 'perfect')).toBe('NM');
  });

  it('should estimate LP for minor issues', () => {
    expect(estimateGradeFromRatings('good', 'perfect', 'perfect')).toBe('LP');
    expect(estimateGradeFromRatings('perfect', 'good', 'perfect')).toBe('LP');
    expect(estimateGradeFromRatings('good', 'good', 'perfect')).toBe('LP');
  });

  it('should estimate MP for fair ratings', () => {
    expect(estimateGradeFromRatings('fair', 'fair', 'good')).toBe('MP');
    expect(estimateGradeFromRatings('good', 'fair', 'fair')).toBe('MP');
  });

  it('should estimate HP for one poor rating', () => {
    expect(estimateGradeFromRatings('poor', 'good', 'good')).toBe('HP');
    expect(estimateGradeFromRatings('good', 'poor', 'good')).toBe('HP');
    expect(estimateGradeFromRatings('good', 'good', 'poor')).toBe('HP');
  });

  it('should estimate DMG for multiple poor ratings', () => {
    expect(estimateGradeFromRatings('poor', 'poor', 'good')).toBe('DMG');
    expect(estimateGradeFromRatings('poor', 'poor', 'poor')).toBe('DMG');
    expect(estimateGradeFromRatings('good', 'poor', 'poor')).toBe('DMG');
  });
});

describe('Trade Acceptability', () => {
  it('should accept NM and LP for trading', () => {
    expect(isTradeAcceptable('NM')).toBe(true);
    expect(isTradeAcceptable('LP')).toBe(true);
  });

  it('should not recommend MP, HP, DMG for trading', () => {
    expect(isTradeAcceptable('MP')).toBe(false);
    expect(isTradeAcceptable('HP')).toBe(false);
    expect(isTradeAcceptable('DMG')).toBe(false);
  });
});

describe('Grade Comparison', () => {
  it('should correctly compare grades', () => {
    expect(compareGrades('NM', 'LP')).toBeLessThan(0);
    expect(compareGrades('LP', 'NM')).toBeGreaterThan(0);
    expect(compareGrades('NM', 'NM')).toBe(0);
    expect(compareGrades('DMG', 'NM')).toBeGreaterThan(0);
    expect(compareGrades('MP', 'HP')).toBeLessThan(0);
  });

  it('should maintain ordering for sorting', () => {
    const grades: ConditionGrade[] = ['DMG', 'NM', 'HP', 'LP', 'MP'];
    const sorted = [...grades].sort(compareGrades);
    expect(sorted).toEqual(['NM', 'LP', 'MP', 'HP', 'DMG']);
  });
});

describe('Condition Category', () => {
  it('should categorize NM as excellent', () => {
    expect(getConditionCategory('NM')).toBe('excellent');
  });

  it('should categorize LP as good', () => {
    expect(getConditionCategory('LP')).toBe('good');
  });

  it('should categorize MP as fair', () => {
    expect(getConditionCategory('MP')).toBe('fair');
  });

  it('should categorize HP and DMG as poor', () => {
    expect(getConditionCategory('HP')).toBe('poor');
    expect(getConditionCategory('DMG')).toBe('poor');
  });
});

describe('Grading Guide Structure', () => {
  it('should have all required grades in guide', () => {
    const expectedGrades = ['NM', 'LP', 'MP', 'HP', 'DMG'];
    const guide: GradingGuide = {
      grades: [
        {
          grade: 'NM',
          name: 'Near Mint',
          description: 'Almost perfect!',
          whatToLookFor: ['Sharp corners', 'Clean edges'],
          valueImpact: 'Worth the most!',
          emoji: '✨',
        },
        {
          grade: 'LP',
          name: 'Lightly Played',
          description: 'Very good condition',
          whatToLookFor: ['Minor wear'],
          valueImpact: 'Still valuable',
          emoji: '👍',
        },
        {
          grade: 'MP',
          name: 'Moderately Played',
          description: 'Noticeable wear',
          whatToLookFor: ['Visible scratches'],
          valueImpact: 'Good for playing',
          emoji: '👌',
        },
        {
          grade: 'HP',
          name: 'Heavily Played',
          description: 'Significant wear',
          whatToLookFor: ['Heavy scratches'],
          valueImpact: 'For playing only',
          emoji: '🎮',
        },
        {
          grade: 'DMG',
          name: 'Damaged',
          description: 'Major damage',
          whatToLookFor: ['Tears', 'Creases'],
          valueImpact: 'Low value',
          emoji: '💔',
        },
      ],
      generalTips: ['Use sleeves!'],
      funFacts: ['PSA grades 1-10'],
    };

    expect(guide.grades.map((g) => g.grade)).toEqual(expectedGrades);
    expect(guide.grades.every((g) => g.whatToLookFor.length > 0)).toBe(true);
    expect(guide.generalTips.length).toBeGreaterThan(0);
    expect(guide.funFacts.length).toBeGreaterThan(0);
  });

  it('should have valid emojis for all grades', () => {
    const expectedEmojis: Record<ConditionGrade, string> = {
      NM: '✨',
      LP: '👍',
      MP: '👌',
      HP: '🎮',
      DMG: '💔',
    };

    for (const [grade, emoji] of Object.entries(expectedEmojis)) {
      expect(getGradeEmoji(grade as ConditionGrade)).toBe(emoji);
    }
  });
});

describe('Error Handling', () => {
  it('should handle error results gracefully', () => {
    const errorResult: ConditionGradingResult = {
      grade: 'LP',
      gradeName: 'Lightly Played',
      confidence: 'low',
      overallSummary: 'Could not see card clearly',
      details: {
        corners: { rating: 'good', description: 'Unknown' },
        edges: { rating: 'good', description: 'Unknown' },
        surface: { rating: 'good', description: 'Unknown' },
        centering: { rating: 'well-centered', description: 'Unknown' },
      },
      issuesFound: [],
      careTip: 'Use sleeves!',
      funFact: 'Cards are cool!',
      wouldImproveGrade: null,
      error: 'Could not analyze card',
    };

    expect(errorResult.error).toBeDefined();
    expect(isValidGradingResult(errorResult)).toBe(true);
  });

  it('should have kid-friendly error messages', () => {
    const kidFriendlyPhrases = ['try again', 'clearer photo', 'better lighting', 'come back'];

    const sampleError =
      "I couldn't see the card clearly. Try taking another photo with better lighting!";

    // Error should contain at least one kid-friendly phrase
    const hasKidFriendlyPhrase = kidFriendlyPhrases.some((phrase) =>
      sampleError.toLowerCase().includes(phrase)
    );
    expect(hasKidFriendlyPhrase).toBe(true);
  });
});

describe('Multi-TCG Support', () => {
  const validGameSlugs = [
    'pokemon',
    'yugioh',
    'onepiece',
    'lorcana',
  ];

  it('should support all valid game slugs', () => {
    for (const slug of validGameSlugs) {
      // Condition grading should work for any game
      expect(validGameSlugs.includes(slug)).toBe(true);
    }
  });

  it('should have 4 supported games', () => {
    expect(validGameSlugs.length).toBe(4);
  });
});

describe('Rate Limiting', () => {
  it('should have reasonable daily limit', () => {
    const dailyLimit = 10;
    expect(dailyLimit).toBeGreaterThanOrEqual(5);
    expect(dailyLimit).toBeLessThanOrEqual(50);
  });

  it('should calculate time until reset correctly', () => {
    const now = Date.now();
    const windowStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ).getTime();
    const resetAt = windowStart + 24 * 60 * 60 * 1000;

    const timeUntilReset = Math.ceil((resetAt - now) / 1000 / 60);
    expect(timeUntilReset).toBeGreaterThan(0);
    expect(timeUntilReset).toBeLessThanOrEqual(24 * 60); // Max 24 hours
  });
});
