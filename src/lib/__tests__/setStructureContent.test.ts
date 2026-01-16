/**
 * Tests for Set Structure Content library
 */

import {
  getSetStructureOnboarding,
  getOnboardingStep,
  getAllOnboardingSteps,
  getSetTypeInfo,
  getAllSetTypes,
  getCollectionGoalInfo,
  getAllCollectionGoals,
  getGoalsByDifficulty,
  getDifficultyDisplayInfo,
  getTotalStepCount,
  getRandomSetFact,
  getAllSetFacts,
  SET_STRUCTURE_ONBOARDING,
  SET_TYPES,
  COLLECTION_GOALS,
} from '../setStructureContent';

// ============================================================================
// BASIC LOOKUP TESTS
// ============================================================================

describe('Set Structure Content - Lookup Functions', () => {
  describe('getSetStructureOnboarding', () => {
    it('should return the onboarding content', () => {
      const onboarding = getSetStructureOnboarding();
      expect(onboarding).not.toBeNull();
      expect(onboarding.id).toBe('set-structure-intro');
      expect(onboarding.title).toBe('Understanding Pokemon Sets');
    });

    it('should have steps defined', () => {
      const onboarding = getSetStructureOnboarding();
      expect(onboarding.steps.length).toBeGreaterThan(0);
    });

    it('should have fun facts defined', () => {
      const onboarding = getSetStructureOnboarding();
      expect(onboarding.funFacts.length).toBeGreaterThan(0);
    });
  });

  describe('getOnboardingStep', () => {
    it('should return step by ID', () => {
      const step = getOnboardingStep('what-is-a-set');
      expect(step).not.toBeNull();
      expect(step?.id).toBe('what-is-a-set');
      expect(step?.title).toBe('What is a Set?');
    });

    it('should return null for unknown step ID', () => {
      const step = getOnboardingStep('unknown-step');
      expect(step).toBeNull();
    });

    it('should return null for empty string', () => {
      const step = getOnboardingStep('');
      expect(step).toBeNull();
    });
  });

  describe('getAllOnboardingSteps', () => {
    it('should return all steps', () => {
      const steps = getAllOnboardingSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps).toBe(SET_STRUCTURE_ONBOARDING.steps);
    });
  });
});

// ============================================================================
// SET TYPES TESTS
// ============================================================================

describe('Set Structure Content - Set Types', () => {
  describe('getSetTypeInfo', () => {
    it('should return set type by ID', () => {
      const setType = getSetTypeInfo('main-expansion');
      expect(setType).not.toBeNull();
      expect(setType?.id).toBe('main-expansion');
      expect(setType?.name).toBe('Main Expansion');
    });

    it('should return null for unknown type ID', () => {
      const setType = getSetTypeInfo('unknown-type');
      expect(setType).toBeNull();
    });
  });

  describe('getAllSetTypes', () => {
    it('should return all set types', () => {
      const types = getAllSetTypes();
      expect(types.length).toBeGreaterThan(0);
      expect(types).toBe(SET_TYPES);
    });

    it('should include main expansion type', () => {
      const types = getAllSetTypes();
      const mainExpansion = types.find((t) => t.id === 'main-expansion');
      expect(mainExpansion).toBeDefined();
    });

    it('should include promo set type', () => {
      const types = getAllSetTypes();
      const promoSet = types.find((t) => t.id === 'promo-set');
      expect(promoSet).toBeDefined();
    });
  });
});

// ============================================================================
// COLLECTION GOALS TESTS
// ============================================================================

describe('Set Structure Content - Collection Goals', () => {
  describe('getCollectionGoalInfo', () => {
    it('should return goal by ID', () => {
      const goal = getCollectionGoalInfo('master-set');
      expect(goal).not.toBeNull();
      expect(goal?.id).toBe('master-set');
      expect(goal?.name).toBe('Master Set');
    });

    it('should return null for unknown goal ID', () => {
      const goal = getCollectionGoalInfo('unknown-goal');
      expect(goal).toBeNull();
    });
  });

  describe('getAllCollectionGoals', () => {
    it('should return all goals', () => {
      const goals = getAllCollectionGoals();
      expect(goals.length).toBeGreaterThan(0);
      expect(goals).toBe(COLLECTION_GOALS);
    });
  });

  describe('getGoalsByDifficulty', () => {
    it('should return easy goals', () => {
      const goals = getGoalsByDifficulty('easy');
      expect(goals.every((g) => g.difficulty === 'easy')).toBe(true);
    });

    it('should return medium goals', () => {
      const goals = getGoalsByDifficulty('medium');
      expect(goals.every((g) => g.difficulty === 'medium')).toBe(true);
    });

    it('should return hard goals', () => {
      const goals = getGoalsByDifficulty('hard');
      expect(goals.every((g) => g.difficulty === 'hard')).toBe(true);
    });

    it('should return expert goals', () => {
      const goals = getGoalsByDifficulty('expert');
      expect(goals.every((g) => g.difficulty === 'expert')).toBe(true);
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('Set Structure Content - Display Helpers', () => {
  describe('getDifficultyDisplayInfo', () => {
    it('should return correct info for easy', () => {
      const info = getDifficultyDisplayInfo('easy');
      expect(info.label).toBe('Easy');
      expect(info.colorClass).toContain('emerald');
      expect(info.bgClass).toContain('emerald');
    });

    it('should return correct info for medium', () => {
      const info = getDifficultyDisplayInfo('medium');
      expect(info.label).toBe('Medium');
      expect(info.colorClass).toContain('blue');
      expect(info.bgClass).toContain('blue');
    });

    it('should return correct info for hard', () => {
      const info = getDifficultyDisplayInfo('hard');
      expect(info.label).toBe('Hard');
      expect(info.colorClass).toContain('amber');
      expect(info.bgClass).toContain('amber');
    });

    it('should return correct info for expert', () => {
      const info = getDifficultyDisplayInfo('expert');
      expect(info.label).toBe('Expert');
      expect(info.colorClass).toContain('rose');
      expect(info.bgClass).toContain('rose');
    });
  });

  describe('getTotalStepCount', () => {
    it('should return the correct number of steps', () => {
      const count = getTotalStepCount();
      expect(count).toBe(SET_STRUCTURE_ONBOARDING.steps.length);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('getRandomSetFact', () => {
    it('should return a string', () => {
      const fact = getRandomSetFact();
      expect(typeof fact).toBe('string');
      expect(fact.length).toBeGreaterThan(0);
    });

    it('should return a fact from the funFacts array', () => {
      const fact = getRandomSetFact();
      expect(SET_STRUCTURE_ONBOARDING.funFacts).toContain(fact);
    });
  });

  describe('getAllSetFacts', () => {
    it('should return all fun facts', () => {
      const facts = getAllSetFacts();
      expect(facts.length).toBeGreaterThan(0);
      expect(facts).toBe(SET_STRUCTURE_ONBOARDING.funFacts);
    });
  });
});

// ============================================================================
// DATA STRUCTURE VALIDATION
// ============================================================================

describe('Set Structure Content - Data Structure Validation', () => {
  describe('Onboarding Steps', () => {
    it('should have required fields for all steps', () => {
      for (const step of SET_STRUCTURE_ONBOARDING.steps) {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.summary).toBeTruthy();
        expect(step.tip).toBeTruthy();
        expect(step.iconName).toBeTruthy();
      }
    });

    it('should have unique step IDs', () => {
      const ids = SET_STRUCTURE_ONBOARDING.steps.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Set Types', () => {
    it('should have required fields for all set types', () => {
      for (const setType of SET_TYPES) {
        expect(setType.id).toBeTruthy();
        expect(setType.name).toBeTruthy();
        expect(setType.description).toBeTruthy();
        expect(setType.examples.length).toBeGreaterThan(0);
        expect(setType.cardCountRange).toBeTruthy();
        expect(setType.releaseFrequency).toBeTruthy();
        expect(setType.gradientFrom).toBeTruthy();
        expect(setType.gradientTo).toBeTruthy();
        expect(setType.iconName).toBeTruthy();
      }
    });

    it('should have unique set type IDs', () => {
      const ids = SET_TYPES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Collection Goals', () => {
    it('should have required fields for all goals', () => {
      for (const goal of COLLECTION_GOALS) {
        expect(goal.id).toBeTruthy();
        expect(goal.name).toBeTruthy();
        expect(goal.description).toBeTruthy();
        expect(goal.completion).toBeTruthy();
        expect(goal.difficulty).toBeTruthy();
        expect(goal.advice).toBeTruthy();
        expect(goal.iconName).toBeTruthy();
      }
    });

    it('should have unique goal IDs', () => {
      const ids = COLLECTION_GOALS.map((g) => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid difficulty values', () => {
      const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
      for (const goal of COLLECTION_GOALS) {
        expect(validDifficulties).toContain(goal.difficulty);
      }
    });
  });
});

// ============================================================================
// CONTENT QUALITY CHECKS
// ============================================================================

describe('Set Structure Content - Content Quality', () => {
  it('should have kid-friendly language (no complex jargon)', () => {
    const complexWords = ['accordingly', 'henceforth', 'therefore', 'consequently', 'paradigm'];
    const allContent = [
      SET_STRUCTURE_ONBOARDING.fullDescription,
      ...SET_STRUCTURE_ONBOARDING.steps.map((s) => s.description),
      ...SET_TYPES.map((t) => t.description),
      ...COLLECTION_GOALS.map((g) => g.description),
    ]
      .join(' ')
      .toLowerCase();

    for (const word of complexWords) {
      expect(allContent).not.toContain(word);
    }
  });

  it('should have at least 4 onboarding steps', () => {
    expect(SET_STRUCTURE_ONBOARDING.steps.length).toBeGreaterThanOrEqual(4);
  });

  it('should have at least 3 set types', () => {
    expect(SET_TYPES.length).toBeGreaterThanOrEqual(3);
  });

  it('should have at least 3 collection goals', () => {
    expect(COLLECTION_GOALS.length).toBeGreaterThanOrEqual(3);
  });

  it('should have at least 3 fun facts', () => {
    expect(SET_STRUCTURE_ONBOARDING.funFacts.length).toBeGreaterThanOrEqual(3);
  });

  it('should explain what a master set is', () => {
    const masterSetStep = SET_STRUCTURE_ONBOARDING.steps.find(
      (s) => s.id === 'what-is-master-set' || s.title.toLowerCase().includes('master set')
    );
    expect(masterSetStep).toBeDefined();
    expect(masterSetStep?.description.toLowerCase()).toContain('master');
  });

  it('should have a master set collection goal', () => {
    const masterSetGoal = COLLECTION_GOALS.find((g) => g.id === 'master-set');
    expect(masterSetGoal).toBeDefined();
    expect(masterSetGoal?.difficulty).toBe('expert');
  });

  it('should have tips for all onboarding steps', () => {
    for (const step of SET_STRUCTURE_ONBOARDING.steps) {
      expect(step.tip.length).toBeGreaterThan(10);
    }
  });
});

// ============================================================================
// SPECIFIC CONTENT TESTS
// ============================================================================

describe('Set Structure Content - Specific Content', () => {
  it('should include step about card numbers', () => {
    const cardNumberStep = SET_STRUCTURE_ONBOARDING.steps.find(
      (s) => s.id === 'card-numbers' || s.title.toLowerCase().includes('number')
    );
    expect(cardNumberStep).toBeDefined();
  });

  it('should include step about set symbols', () => {
    const symbolStep = SET_STRUCTURE_ONBOARDING.steps.find(
      (s) => s.id === 'set-symbols' || s.title.toLowerCase().includes('symbol')
    );
    expect(symbolStep).toBeDefined();
  });

  it('should have main expansion as a set type', () => {
    const mainExpansion = SET_TYPES.find((t) => t.id === 'main-expansion');
    expect(mainExpansion).toBeDefined();
    expect(mainExpansion?.name).toBe('Main Expansion');
  });

  it('should have complete set as an easy/medium goal', () => {
    const completeSetGoal = COLLECTION_GOALS.find((g) => g.id === 'complete-set');
    expect(completeSetGoal).toBeDefined();
    expect(['easy', 'medium']).toContain(completeSetGoal?.difficulty);
  });

  it('should have gradient colors defined for onboarding', () => {
    expect(SET_STRUCTURE_ONBOARDING.gradientFrom).toMatch(/^from-/);
    expect(SET_STRUCTURE_ONBOARDING.gradientTo).toMatch(/^to-/);
  });

  it('should have gradient colors defined for all set types', () => {
    for (const setType of SET_TYPES) {
      expect(setType.gradientFrom).toMatch(/^from-/);
      expect(setType.gradientTo).toMatch(/^to-/);
    }
  });
});
