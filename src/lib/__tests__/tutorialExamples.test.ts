import { describe, it, expect } from 'vitest';
import {
  RARITY_EXAMPLES,
  HOLO_VS_NONHOLO_EXAMPLES,
  SET_SYMBOL_EXAMPLES,
  CARD_NUMBER_EXAMPLES,
  SECRET_RARE_EXAMPLES,
  ULTRA_RARE_EXAMPLES,
  TYPE_EXAMPLES,
  EVOLUTION_EXAMPLES,
  TRAINER_EXAMPLES,
  STEP_EXAMPLES,
  GUIDE_EXAMPLES,
  getStepExamples,
  getGuideExamples,
  getGuideCardIds,
  getStepCardIds,
  getExampleSetById,
  getAllExampleSets,
  guideHasExamples,
  stepHasExamples,
  type TutorialExampleSet,
  type TutorialCardExample,
} from '../tutorialExamples';

// ============================================================================
// EXAMPLE SET STRUCTURE TESTS
// ============================================================================

describe('Example Set Structures', () => {
  const allExampleSets: TutorialExampleSet[] = [
    RARITY_EXAMPLES,
    HOLO_VS_NONHOLO_EXAMPLES,
    SET_SYMBOL_EXAMPLES,
    CARD_NUMBER_EXAMPLES,
    SECRET_RARE_EXAMPLES,
    ULTRA_RARE_EXAMPLES,
    TYPE_EXAMPLES,
    EVOLUTION_EXAMPLES,
    TRAINER_EXAMPLES,
  ];

  describe('All example sets have required fields', () => {
    it.each(allExampleSets)('$id has valid structure', (exampleSet) => {
      // Required fields
      expect(exampleSet.id).toBeDefined();
      expect(typeof exampleSet.id).toBe('string');
      expect(exampleSet.id.length).toBeGreaterThan(0);

      expect(exampleSet.title).toBeDefined();
      expect(typeof exampleSet.title).toBe('string');
      expect(exampleSet.title.length).toBeGreaterThan(0);

      expect(Array.isArray(exampleSet.cards)).toBe(true);
      expect(exampleSet.cards.length).toBeGreaterThan(0);
    });

    it.each(allExampleSets)('$id has unique card IDs', (exampleSet) => {
      const cardIds = exampleSet.cards.map((c) => c.cardId);
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(cardIds.length);
    });
  });

  describe('All cards have required fields', () => {
    const allCards: TutorialCardExample[] = allExampleSets.flatMap((set) => set.cards);

    it.each(allCards)('card $cardId has valid structure', (card) => {
      expect(card.cardId).toBeDefined();
      expect(typeof card.cardId).toBe('string');
      expect(card.cardId.length).toBeGreaterThan(0);
      // Card IDs should follow Pokemon TCG API format (set-number)
      expect(card.cardId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/i);

      expect(card.label).toBeDefined();
      expect(typeof card.label).toBe('string');
      expect(card.label.length).toBeGreaterThan(0);

      expect(card.description).toBeDefined();
      expect(typeof card.description).toBe('string');
      expect(card.description.length).toBeGreaterThan(0);

      // Optional highlight
      if (card.highlight !== undefined) {
        expect(typeof card.highlight).toBe('string');
        expect(card.highlight.length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// SPECIFIC EXAMPLE SET TESTS
// ============================================================================

describe('Rarity Examples', () => {
  it('includes examples for common, uncommon, and rare cards', () => {
    const labels = RARITY_EXAMPLES.cards.map((c) => c.label.toLowerCase());
    expect(labels.some((l) => l.includes('common'))).toBe(true);
    expect(labels.some((l) => l.includes('uncommon'))).toBe(true);
    expect(labels.some((l) => l.includes('rare'))).toBe(true);
  });

  it('has educational note about rarity symbols', () => {
    expect(RARITY_EXAMPLES.educationalNote).toBeDefined();
    expect(RARITY_EXAMPLES.educationalNote).toContain('symbol');
  });
});

describe('Holo vs Non-Holo Examples', () => {
  it('includes both holo and non-holo examples', () => {
    const labels = HOLO_VS_NONHOLO_EXAMPLES.cards.map((c) => c.label.toLowerCase());
    expect(labels.some((l) => l.includes('non-holo'))).toBe(true);
    expect(labels.some((l) => l.includes('holo'))).toBe(true);
  });

  it('has educational note about holographic cards', () => {
    expect(HOLO_VS_NONHOLO_EXAMPLES.educationalNote).toBeDefined();
    expect(HOLO_VS_NONHOLO_EXAMPLES.educationalNote?.toLowerCase()).toContain('holo');
  });
});

describe('Type Examples', () => {
  it('includes multiple Pokemon types', () => {
    const labels = TYPE_EXAMPLES.cards.map((c) => c.label.toLowerCase());
    expect(labels).toContain('grass type');
    expect(labels).toContain('fire type');
    expect(labels).toContain('water type');
  });

  it('has at least 5 different type examples', () => {
    expect(TYPE_EXAMPLES.cards.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Evolution Examples', () => {
  it('includes Basic, Stage 1, and Stage 2 examples', () => {
    const labels = EVOLUTION_EXAMPLES.cards.map((c) => c.label.toLowerCase());
    expect(labels).toContain('basic');
    expect(labels).toContain('stage 1');
    expect(labels).toContain('stage 2');
  });

  it('examples follow an evolution chain', () => {
    // Check that descriptions reference evolution
    const descriptions = EVOLUTION_EXAMPLES.cards.map((c) => c.description.toLowerCase());
    expect(descriptions.some((d) => d.includes('evolve'))).toBe(true);
  });
});

// ============================================================================
// STEP EXAMPLES TESTS
// ============================================================================

describe('Step Examples', () => {
  it('STEP_EXAMPLES has valid keys format', () => {
    const keys = Object.keys(STEP_EXAMPLES);
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      // Keys should be in format "guideId:stepId"
      expect(key).toMatch(/^[a-z-]+:step-\d+$/);
    }
  });

  it('all step examples have valid example set structure', () => {
    for (const [, exampleSet] of Object.entries(STEP_EXAMPLES)) {
      expect(exampleSet.id).toBeDefined();
      expect(exampleSet.title).toBeDefined();
      expect(exampleSet.cards.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// GUIDE EXAMPLES TESTS
// ============================================================================

describe('Guide Examples', () => {
  it('GUIDE_EXAMPLES has at least 3 guides with examples', () => {
    const keys = Object.keys(GUIDE_EXAMPLES);
    expect(keys.length).toBeGreaterThanOrEqual(3);
  });

  it('all guide examples are arrays of example sets', () => {
    for (const [, exampleSets] of Object.entries(GUIDE_EXAMPLES)) {
      expect(Array.isArray(exampleSets)).toBe(true);
      expect(exampleSets.length).toBeGreaterThan(0);

      for (const set of exampleSets) {
        expect(set.id).toBeDefined();
        expect(set.cards).toBeDefined();
      }
    }
  });
});

// ============================================================================
// LOOKUP FUNCTION TESTS
// ============================================================================

describe('getStepExamples', () => {
  it('returns example set for existing step', () => {
    const result = getStepExamples('organizing-by-set', 'step-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('set-symbols');
  });

  it('returns null for non-existent step', () => {
    const result = getStepExamples('non-existent-guide', 'step-1');
    expect(result).toBeNull();
  });

  it('returns null for guide without step examples', () => {
    const result = getStepExamples('organizing-by-set', 'step-999');
    expect(result).toBeNull();
  });
});

describe('getGuideExamples', () => {
  it('returns array of example sets for guide with examples', () => {
    const result = getGuideExamples('organizing-by-set');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array for guide without examples', () => {
    const result = getGuideExamples('non-existent-guide');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe('getGuideCardIds', () => {
  it('returns array of unique card IDs for guide', () => {
    const result = getGuideCardIds('organizing-by-set');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check all IDs are strings
    for (const id of result) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }

    // Check uniqueness
    const uniqueIds = new Set(result);
    expect(uniqueIds.size).toBe(result.length);
  });

  it('returns empty array for guide without examples', () => {
    const result = getGuideCardIds('non-existent-guide');
    expect(result).toEqual([]);
  });

  it('includes cards from both guide-level and step-level examples', () => {
    // organizing-by-set has both guide-level examples and step-level examples
    const result = getGuideCardIds('organizing-by-set');

    // Should include cards from guide examples (SET_SYMBOL_EXAMPLES has sv1-1)
    expect(result).toContain('sv1-1');
  });
});

describe('getStepCardIds', () => {
  it('returns array of card IDs for step with examples', () => {
    const result = getStepCardIds('organizing-by-set', 'step-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty array for step without examples', () => {
    const result = getStepCardIds('non-existent-guide', 'step-1');
    expect(result).toEqual([]);
  });
});

describe('getExampleSetById', () => {
  it('returns example set for valid ID', () => {
    const result = getExampleSetById('rarity-examples');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('rarity-examples');
  });

  it('returns null for invalid ID', () => {
    const result = getExampleSetById('non-existent-id');
    expect(result).toBeNull();
  });

  it('can find all predefined example sets', () => {
    const ids = [
      'rarity-examples',
      'holo-vs-nonholo',
      'set-symbols',
      'card-numbers',
      'secret-rares',
      'ultra-rares',
      'pokemon-types',
      'evolutions',
      'trainer-types',
    ];

    for (const id of ids) {
      const result = getExampleSetById(id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(id);
    }
  });
});

describe('getAllExampleSets', () => {
  it('returns array of all predefined example sets', () => {
    const result = getAllExampleSets();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(9); // 9 predefined sets
  });

  it('all returned sets have valid structure', () => {
    const result = getAllExampleSets();
    for (const set of result) {
      expect(set.id).toBeDefined();
      expect(set.title).toBeDefined();
      expect(set.cards.length).toBeGreaterThan(0);
    }
  });
});

describe('guideHasExamples', () => {
  it('returns true for guide with guide-level examples', () => {
    expect(guideHasExamples('organizing-by-set')).toBe(true);
  });

  it('returns true for guide with only step-level examples', () => {
    // card-storage has step-level examples but check if it works
    expect(guideHasExamples('card-storage')).toBe(true);
  });

  it('returns false for guide without any examples', () => {
    expect(guideHasExamples('non-existent-guide')).toBe(false);
  });
});

describe('stepHasExamples', () => {
  it('returns true for step with examples', () => {
    expect(stepHasExamples('organizing-by-set', 'step-1')).toBe(true);
  });

  it('returns false for step without examples', () => {
    expect(stepHasExamples('organizing-by-set', 'step-2')).toBe(false);
  });

  it('returns false for non-existent guide/step', () => {
    expect(stepHasExamples('non-existent', 'step-1')).toBe(false);
  });
});

// ============================================================================
// CONTENT QUALITY TESTS
// ============================================================================

describe('Content Quality', () => {
  it('all card IDs follow Pokemon TCG API format', () => {
    const allSets = getAllExampleSets();
    const allCardIds = allSets.flatMap((set) => set.cards.map((c) => c.cardId));

    for (const id of allCardIds) {
      // Pokemon TCG API card IDs are like "sv1-1", "swsh1-139", etc.
      expect(id).toMatch(/^[a-z0-9]+-\d+$/i);
    }
  });

  it('educational notes are kid-friendly (no complex jargon)', () => {
    const allSets = getAllExampleSets();

    for (const set of allSets) {
      if (set.educationalNote) {
        // Check that notes don't contain overly complex terms
        expect(set.educationalNote.toLowerCase()).not.toContain('algorithm');
        expect(set.educationalNote.toLowerCase()).not.toContain('implementation');
        expect(set.educationalNote.toLowerCase()).not.toContain('database');
      }
    }
  });

  it('highlights provide actionable guidance', () => {
    const allSets = getAllExampleSets();
    const cardsWithHighlights = allSets.flatMap((set) => set.cards).filter((c) => c.highlight);

    expect(cardsWithHighlights.length).toBeGreaterThan(0);

    for (const card of cardsWithHighlights) {
      // Highlights should tell kids what to look for
      expect(card.highlight!.toLowerCase()).toMatch(/(look|notice|see|find|the)/);
    }
  });

  it('example sets have descriptive titles', () => {
    const allSets = getAllExampleSets();

    for (const set of allSets) {
      expect(set.title.length).toBeGreaterThan(3);
      expect(set.title.length).toBeLessThan(50);
    }
  });
});

// ============================================================================
// CARD ID VALIDITY TESTS
// ============================================================================

describe('Card ID Validity', () => {
  it('uses valid Scarlet & Violet card IDs', () => {
    const svCardIds = getAllExampleSets()
      .flatMap((set) => set.cards)
      .map((c) => c.cardId)
      .filter((id) => id.startsWith('sv'));

    expect(svCardIds.length).toBeGreaterThan(0);

    for (const id of svCardIds) {
      // SV set IDs are like sv1, sv2, sv3, sv3pt5, sv4, sv5, sv6, sv7, sv8
      expect(id).toMatch(/^sv\d+p?t?\d*-\d+$/i);
    }
  });

  it('uses valid Sword & Shield card IDs', () => {
    const swshCardIds = getAllExampleSets()
      .flatMap((set) => set.cards)
      .map((c) => c.cardId)
      .filter((id) => id.startsWith('swsh'));

    // May or may not have SWSH cards, but if we do, validate format
    for (const id of swshCardIds) {
      expect(id).toMatch(/^swsh\d+-\d+$/i);
    }
  });
});
