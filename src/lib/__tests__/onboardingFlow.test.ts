/**
 * Tests for the onboarding flow content library
 */

import {
  type OnboardingStepId,
  type OnboardingProgress,
  ONBOARDING_STEPS,
  COMPLETION_STEP,
  TOTAL_STEPS,
  ONBOARDING_STORAGE_KEY,
  getStepById,
  getStepByNumber,
  getNextStep,
  getPreviousStep,
  isFirstStep,
  isLastContentStep,
  isCompletionStep,
  createInitialProgress,
  completeStep,
  goToStep,
  getProgressPercentage,
  isStepCompleted,
  setProfileName,
  setProfileType,
  saveOnboardingProgress,
  loadOnboardingProgress,
  clearOnboardingProgress,
  hasCompletedOnboarding,
  markOnboardingComplete,
  getStepLabel,
  getProgressText,
  formatOnboardingTime,
  getWelcomeMessage,
  getFirstCardsStats,
} from '../onboardingFlow';

// ============================================================================
// MOCK localStorage
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

beforeEach(() => {
  localStorageMock.clear();
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Onboarding Flow Constants', () => {
  test('TOTAL_STEPS matches the number of content steps', () => {
    expect(TOTAL_STEPS).toBe(ONBOARDING_STEPS.length);
  });

  test('all steps have required properties', () => {
    const requiredProps = [
      'id',
      'number',
      'title',
      'subtitle',
      'iconName',
      'gradientFrom',
      'gradientTo',
      'skippable',
    ];

    ONBOARDING_STEPS.forEach((step) => {
      requiredProps.forEach((prop) => {
        expect(step).toHaveProperty(prop);
      });
    });
  });

  test('step numbers are sequential starting from 1', () => {
    ONBOARDING_STEPS.forEach((step, index) => {
      expect(step.number).toBe(index + 1);
    });
  });

  test('all step IDs are unique', () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('COMPLETION_STEP has the expected properties', () => {
    expect(COMPLETION_STEP.id).toBe('complete');
    expect(COMPLETION_STEP.number).toBe(TOTAL_STEPS + 1);
  });

  test('storage key is defined', () => {
    expect(ONBOARDING_STORAGE_KEY).toBe('carddex-onboarding-progress');
  });
});

// ============================================================================
// STEP LOOKUP TESTS
// ============================================================================

describe('Step Lookup Functions', () => {
  describe('getStepById', () => {
    test('returns correct step for valid IDs', () => {
      expect(getStepById('welcome')?.id).toBe('welcome');
      expect(getStepById('games')?.id).toBe('games');
      expect(getStepById('profile')?.id).toBe('profile');
      expect(getStepById('first-cards')?.id).toBe('first-cards');
    });

    test('returns completion step for "complete"', () => {
      expect(getStepById('complete')).toBe(COMPLETION_STEP);
    });

    test('returns null for invalid IDs', () => {
      expect(getStepById('invalid' as OnboardingStepId)).toBeNull();
    });
  });

  describe('getStepByNumber', () => {
    test('returns correct step for valid numbers', () => {
      expect(getStepByNumber(1)?.id).toBe('welcome');
      expect(getStepByNumber(2)?.id).toBe('games');
      expect(getStepByNumber(3)?.id).toBe('profile');
      expect(getStepByNumber(4)?.id).toBe('first-cards');
    });

    test('returns completion step for step after last', () => {
      expect(getStepByNumber(TOTAL_STEPS + 1)).toBe(COMPLETION_STEP);
    });

    test('returns null for invalid numbers', () => {
      expect(getStepByNumber(0)).toBeNull();
      expect(getStepByNumber(-1)).toBeNull();
      expect(getStepByNumber(100)).toBeNull();
    });
  });

  describe('getNextStep', () => {
    test('returns next step in sequence', () => {
      expect(getNextStep('welcome')?.id).toBe('games');
      expect(getNextStep('games')?.id).toBe('profile');
      expect(getNextStep('profile')?.id).toBe('first-cards');
      expect(getNextStep('first-cards')?.id).toBe('complete');
    });

    test('returns null for complete step', () => {
      expect(getNextStep('complete')).toBeNull();
    });
  });

  describe('getPreviousStep', () => {
    test('returns previous step in sequence', () => {
      expect(getPreviousStep('games')?.id).toBe('welcome');
      expect(getPreviousStep('profile')?.id).toBe('games');
      expect(getPreviousStep('first-cards')?.id).toBe('profile');
    });

    test('returns last content step for complete', () => {
      expect(getPreviousStep('complete')?.id).toBe('first-cards');
    });

    test('returns null for first step', () => {
      expect(getPreviousStep('welcome')).toBeNull();
    });
  });

  describe('step position checks', () => {
    test('isFirstStep correctly identifies first step', () => {
      expect(isFirstStep('welcome')).toBe(true);
      expect(isFirstStep('games')).toBe(false);
      expect(isFirstStep('complete')).toBe(false);
    });

    test('isLastContentStep correctly identifies last content step', () => {
      expect(isLastContentStep('first-cards')).toBe(true);
      expect(isLastContentStep('welcome')).toBe(false);
      expect(isLastContentStep('complete')).toBe(false);
    });

    test('isCompletionStep correctly identifies completion step', () => {
      expect(isCompletionStep('complete')).toBe(true);
      expect(isCompletionStep('welcome')).toBe(false);
      expect(isCompletionStep('first-cards')).toBe(false);
    });
  });
});

// ============================================================================
// PROGRESS TRACKING TESTS
// ============================================================================

describe('Progress Tracking', () => {
  describe('createInitialProgress', () => {
    test('creates progress with correct initial values', () => {
      const progress = createInitialProgress();
      expect(progress.currentStep).toBe('welcome');
      expect(progress.completedSteps).toEqual([]);
      expect(progress.isComplete).toBe(false);
      expect(progress.startedAt).toBeDefined();
      expect(progress.completedAt).toBeUndefined();
    });
  });

  describe('completeStep', () => {
    test('marks step as completed and advances to next', () => {
      const initial = createInitialProgress();
      const updated = completeStep(initial, 'welcome');

      expect(updated.currentStep).toBe('games');
      expect(updated.completedSteps).toContain('welcome');
      expect(updated.isComplete).toBe(false);
    });

    test('completing last step marks as complete', () => {
      let progress = createInitialProgress();
      progress = completeStep(progress, 'welcome');
      progress = completeStep(progress, 'games');
      progress = completeStep(progress, 'profile');
      progress = completeStep(progress, 'first-cards');

      expect(progress.currentStep).toBe('complete');
      expect(progress.isComplete).toBe(true);
      expect(progress.completedAt).toBeDefined();
    });

    test('does not duplicate completed steps', () => {
      const initial = createInitialProgress();
      let progress = completeStep(initial, 'welcome');
      progress = completeStep(progress, 'welcome');

      const welcomeCount = progress.completedSteps.filter((s) => s === 'welcome').length;
      expect(welcomeCount).toBe(1);
    });
  });

  describe('goToStep', () => {
    test('navigates to specified step', () => {
      const initial = createInitialProgress();
      const updated = goToStep(initial, 'profile');
      expect(updated.currentStep).toBe('profile');
    });

    test('preserves other progress data', () => {
      let progress = createInitialProgress();
      progress = completeStep(progress, 'welcome');
      progress = completeStep(progress, 'games');

      const updated = goToStep(progress, 'welcome');
      expect(updated.currentStep).toBe('welcome');
      expect(updated.completedSteps).toContain('welcome');
      expect(updated.completedSteps).toContain('games');
    });
  });

  describe('getProgressPercentage', () => {
    test('returns 0 for new progress', () => {
      const progress = createInitialProgress();
      expect(getProgressPercentage(progress)).toBe(0);
    });

    test('returns 100 for complete progress', () => {
      const progress: OnboardingProgress = {
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        startedAt: Date.now(),
        completedAt: Date.now(),
      };
      expect(getProgressPercentage(progress)).toBe(100);
    });

    test('calculates intermediate percentages correctly', () => {
      let progress = createInitialProgress();
      progress = completeStep(progress, 'welcome');
      expect(getProgressPercentage(progress)).toBe(25);

      progress = completeStep(progress, 'games');
      expect(getProgressPercentage(progress)).toBe(50);
    });
  });

  describe('isStepCompleted', () => {
    test('returns true for completed steps', () => {
      let progress = createInitialProgress();
      progress = completeStep(progress, 'welcome');

      expect(isStepCompleted(progress, 'welcome')).toBe(true);
      expect(isStepCompleted(progress, 'games')).toBe(false);
    });
  });

  describe('profile data setters', () => {
    test('setProfileName updates profile name', () => {
      const progress = createInitialProgress();
      const updated = setProfileName(progress, 'Test User');
      expect(updated.profileName).toBe('Test User');
    });

    test('setProfileType updates profile type', () => {
      const progress = createInitialProgress();
      const updated = setProfileType(progress, 'parent');
      expect(updated.profileType).toBe('parent');
    });
  });
});

// ============================================================================
// LOCAL STORAGE TESTS
// ============================================================================

describe('Local Storage', () => {
  describe('saveOnboardingProgress and loadOnboardingProgress', () => {
    test('saves and loads progress correctly', () => {
      const progress = createInitialProgress();
      progress.profileName = 'Test';

      saveOnboardingProgress(progress);
      const loaded = loadOnboardingProgress();

      expect(loaded).not.toBeNull();
      expect(loaded?.currentStep).toBe(progress.currentStep);
      expect(loaded?.profileName).toBe('Test');
    });

    test('returns null for invalid stored data', () => {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'invalid json');
      expect(loadOnboardingProgress()).toBeNull();
    });

    test('returns null for empty storage', () => {
      expect(loadOnboardingProgress()).toBeNull();
    });
  });

  describe('clearOnboardingProgress', () => {
    test('removes progress from storage', () => {
      const progress = createInitialProgress();
      saveOnboardingProgress(progress);

      clearOnboardingProgress();
      expect(loadOnboardingProgress()).toBeNull();
    });
  });

  describe('hasCompletedOnboarding', () => {
    test('returns false when no progress exists', () => {
      expect(hasCompletedOnboarding()).toBe(false);
    });

    test('returns false for incomplete progress', () => {
      const progress = createInitialProgress();
      saveOnboardingProgress(progress);
      expect(hasCompletedOnboarding()).toBe(false);
    });

    test('returns true for complete progress', () => {
      const progress: OnboardingProgress = {
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        startedAt: Date.now(),
        completedAt: Date.now(),
      };
      saveOnboardingProgress(progress);
      expect(hasCompletedOnboarding()).toBe(true);
    });
  });

  describe('markOnboardingComplete', () => {
    test('marks existing progress as complete', () => {
      const progress = createInitialProgress();
      saveOnboardingProgress(progress);

      markOnboardingComplete();
      const loaded = loadOnboardingProgress();

      expect(loaded?.isComplete).toBe(true);
      expect(loaded?.completedAt).toBeDefined();
    });

    test('creates and marks complete when no existing progress', () => {
      markOnboardingComplete();
      const loaded = loadOnboardingProgress();

      expect(loaded?.isComplete).toBe(true);
      expect(loaded?.completedSteps).toHaveLength(TOTAL_STEPS);
    });
  });
});

// ============================================================================
// DISPLAY HELPER TESTS
// ============================================================================

describe('Display Helpers', () => {
  describe('getStepLabel', () => {
    test('returns correct labels for steps', () => {
      expect(getStepLabel('welcome')).toBe('Welcome to CardDex!');
      expect(getStepLabel('games')).toBe('What do you collect?');
      expect(getStepLabel('profile')).toBe('Create your profile');
      expect(getStepLabel('first-cards')).toBe('Add your first cards');
      expect(getStepLabel('complete')).toBe("You're all set!");
    });

    test('returns "Unknown Step" for invalid step', () => {
      expect(getStepLabel('invalid' as OnboardingStepId)).toBe('Unknown Step');
    });
  });

  describe('getProgressText', () => {
    test('returns step progress text', () => {
      expect(getProgressText('welcome')).toBe('Step 1 of 4');
      expect(getProgressText('games')).toBe('Step 2 of 4');
      expect(getProgressText('profile')).toBe('Step 3 of 4');
      expect(getProgressText('first-cards')).toBe('Step 4 of 4');
    });

    test('returns "Complete!" for completion step', () => {
      expect(getProgressText('complete')).toBe('Complete!');
    });
  });

  describe('formatOnboardingTime', () => {
    test('formats time under a minute', () => {
      const progress: OnboardingProgress = {
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        startedAt: Date.now() - 30000, // 30 seconds ago
        completedAt: Date.now(),
      };
      expect(formatOnboardingTime(progress)).toBe('Less than a minute');
    });

    test('formats exactly one minute', () => {
      const progress: OnboardingProgress = {
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        startedAt: Date.now() - 60000, // 1 minute ago
        completedAt: Date.now(),
      };
      expect(formatOnboardingTime(progress)).toBe('1 minute');
    });

    test('formats multiple minutes', () => {
      const progress: OnboardingProgress = {
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        startedAt: Date.now() - 180000, // 3 minutes ago
        completedAt: Date.now(),
      };
      expect(formatOnboardingTime(progress)).toBe('3 minutes');
    });
  });

  describe('getWelcomeMessage', () => {
    test('returns parent message for parent type', () => {
      const message = getWelcomeMessage('parent');
      expect(message).toContain('family');
    });

    test('returns child message for child type', () => {
      const message = getWelcomeMessage('child');
      expect(message).toContain('badges');
    });

    test('returns child message for undefined type', () => {
      const message = getWelcomeMessage(undefined);
      expect(message).toContain('badges');
    });
  });

  describe('getFirstCardsStats', () => {
    test('returns expected stats object', () => {
      const stats = getFirstCardsStats();
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('cards');
      expect(stats).toHaveProperty('badges');
      expect(stats.sets).toBe('500+');
      expect(stats.cards).toBe('20,000+');
      expect(stats.badges).toBe('50+');
    });
  });
});

// ============================================================================
// STEP CONTENT VALIDATION
// ============================================================================

describe('Step Content Validation', () => {
  test('all steps have non-empty titles', () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(step.title.length).toBeGreaterThan(0);
    });
  });

  test('all steps have non-empty subtitles', () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(step.subtitle.length).toBeGreaterThan(0);
    });
  });

  test('all steps have valid gradient classes', () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(step.gradientFrom).toMatch(/^from-/);
      expect(step.gradientTo).toMatch(/^to-/);
    });
  });

  test('first-cards step is skippable', () => {
    const firstCardsStep = getStepById('first-cards');
    expect(firstCardsStep?.skippable).toBe(true);
  });

  test('non-skippable steps are marked correctly', () => {
    const nonSkippableSteps = ['welcome', 'games', 'profile'];
    nonSkippableSteps.forEach((stepId) => {
      const step = getStepById(stepId as OnboardingStepId);
      expect(step?.skippable).toBe(false);
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  test('handles completing already completed step gracefully', () => {
    let progress = createInitialProgress();
    progress = completeStep(progress, 'welcome');
    const firstCompletion = { ...progress };

    progress = completeStep(progress, 'welcome');
    // Should have moved forward, not be stuck
    expect(progress.currentStep).toBe('games');
  });

  test('handles navigating to invalid step', () => {
    const progress = createInitialProgress();
    const updated = goToStep(progress, 'invalid' as OnboardingStepId);
    // Should set the step anyway (component will handle display)
    expect(updated.currentStep).toBe('invalid');
  });

  test('handles rapid step completions', () => {
    let progress = createInitialProgress();

    // Complete all steps rapidly
    progress = completeStep(progress, 'welcome');
    progress = completeStep(progress, 'games');
    progress = completeStep(progress, 'profile');
    progress = completeStep(progress, 'first-cards');

    expect(progress.isComplete).toBe(true);
    expect(progress.completedSteps).toHaveLength(4);
    expect(progress.currentStep).toBe('complete');
  });

  test('preserves timestamps across operations', () => {
    const progress = createInitialProgress();
    const startTime = progress.startedAt;

    const updated = completeStep(progress, 'welcome');
    expect(updated.startedAt).toBe(startTime);
  });
});
