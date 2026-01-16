/**
 * Tests for Tutorial Content library
 */

import {
  getTutorialGuide,
  getTutorialCategory,
  getAllTutorialGuides,
  getAllTutorialCategories,
  getGuidesByCategory,
  getGuidesByDifficulty,
  getCategoryForGuide,
  getDifficultyInfo,
  getTotalEstimatedTime,
  TUTORIAL_GUIDES,
  TUTORIAL_CATEGORIES,
  // New validation functions
  VALID_CATEGORY_IDS,
  isValidCategoryId,
  isValidGuideIdFormat,
  isValidGuide,
  isValidStep,
  isValidStepId,
  // New lookup functions
  getStep,
  getStepIndex,
  getGuidesWithBadges,
  getGuideBadgeId,
  guideExists,
  categoryExists,
  // Sorting functions
  CATEGORY_SORT_ORDER,
  sortGuidesByCategory,
  sortGuidesByDuration,
  sortGuidesByStepCount,
  sortGuidesByDifficulty,
  sortCategories,
  // Filtering functions
  filterByMaxDuration,
  filterIncompleteGuides,
  filterCompletedGuides,
  // Progress tracking functions
  calculateTutorialProgress,
  calculateGuideProgress,
  calculateCategoryProgress,
  enrichGuidesWithProgress,
  getNextRecommendedGuide,
  isCategoryComplete,
  areAllTutorialsComplete,
  // Navigation functions
  getStepNavigation,
  getNextGuide,
  getPreviousGuide,
  // Display helpers
  formatEstimatedTime,
  formatProgressPercent,
  getProgressMessage,
  getStepIndicator,
  getCategoryDisplayLabel,
  getGuideDisplayLabel,
  getBadgeEarnedMessage,
  // Search functions
  searchGuides,
  countTotalSteps,
  calculateTotalTimeMinutes,
  // Category helpers
  getAllCategoryProgress,
  getGuideCountByCategory,
  getGuidesGroupedByCategory,
  // Types
  type GuideProgress,
  type TutorialProgress,
  type GuideWithProgress,
  type CategoryProgressSummary,
} from '../tutorialContent';

// ============================================================================
// BASIC LOOKUP TESTS
// ============================================================================

describe('Tutorial Content - Lookup Functions', () => {
  describe('getTutorialGuide', () => {
    it('should return guide by ID', () => {
      const guide = getTutorialGuide('organizing-by-set');
      expect(guide).not.toBeNull();
      expect(guide?.id).toBe('organizing-by-set');
      expect(guide?.title).toBe('Organizing by Set');
    });

    it('should return null for unknown guide ID', () => {
      const guide = getTutorialGuide('unknown-guide');
      expect(guide).toBeNull();
    });

    it('should return null for empty string', () => {
      const guide = getTutorialGuide('');
      expect(guide).toBeNull();
    });
  });

  describe('getTutorialCategory', () => {
    it('should return category by ID', () => {
      const category = getTutorialCategory('organization');
      expect(category).not.toBeNull();
      expect(category?.id).toBe('organization');
      expect(category?.name).toBe('Card Organization');
    });

    it('should return null for unknown category ID', () => {
      const category = getTutorialCategory('unknown-category');
      expect(category).toBeNull();
    });
  });

  describe('getAllTutorialGuides', () => {
    it('should return all guides', () => {
      const guides = getAllTutorialGuides();
      expect(guides.length).toBeGreaterThan(0);
      expect(guides).toBe(TUTORIAL_GUIDES);
    });
  });

  describe('getAllTutorialCategories', () => {
    it('should return all categories', () => {
      const categories = getAllTutorialCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toBe(TUTORIAL_CATEGORIES);
    });
  });
});

// ============================================================================
// CATEGORY-BASED LOOKUPS
// ============================================================================

describe('Tutorial Content - Category Lookups', () => {
  describe('getGuidesByCategory', () => {
    it('should return guides for organization category', () => {
      const guides = getGuidesByCategory('organization');
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every((g) => g.category === 'organization')).toBe(true);
    });

    it('should return guides for care category', () => {
      const guides = getGuidesByCategory('care');
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every((g) => g.category === 'care')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const guides = getGuidesByCategory('unknown');
      expect(guides).toEqual([]);
    });
  });

  describe('getCategoryForGuide', () => {
    it('should return category for a guide', () => {
      const category = getCategoryForGuide('organizing-by-set');
      expect(category).not.toBeNull();
      expect(category?.id).toBe('organization');
    });

    it('should return null for unknown guide', () => {
      const category = getCategoryForGuide('unknown-guide');
      expect(category).toBeNull();
    });
  });
});

// ============================================================================
// DIFFICULTY-BASED LOOKUPS
// ============================================================================

describe('Tutorial Content - Difficulty Lookups', () => {
  describe('getGuidesByDifficulty', () => {
    it('should return beginner guides', () => {
      const guides = getGuidesByDifficulty('beginner');
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every((g) => g.difficulty === 'beginner')).toBe(true);
    });

    it('should return intermediate guides', () => {
      const guides = getGuidesByDifficulty('intermediate');
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every((g) => g.difficulty === 'intermediate')).toBe(true);
    });

    it('should return empty array for advanced if none exist', () => {
      const guides = getGuidesByDifficulty('advanced');
      // May be empty if no advanced guides defined
      expect(Array.isArray(guides)).toBe(true);
    });
  });

  describe('getDifficultyInfo', () => {
    it('should return correct info for beginner', () => {
      const info = getDifficultyInfo('beginner');
      expect(info.label).toBe('Beginner');
      expect(info.colorClass).toContain('emerald');
      expect(info.bgClass).toContain('emerald');
    });

    it('should return correct info for intermediate', () => {
      const info = getDifficultyInfo('intermediate');
      expect(info.label).toBe('Intermediate');
      expect(info.colorClass).toContain('amber');
      expect(info.bgClass).toContain('amber');
    });

    it('should return correct info for advanced', () => {
      const info = getDifficultyInfo('advanced');
      expect(info.label).toBe('Advanced');
      expect(info.colorClass).toContain('rose');
      expect(info.bgClass).toContain('rose');
    });
  });
});

// ============================================================================
// TIME CALCULATION
// ============================================================================

describe('Tutorial Content - Time Calculation', () => {
  describe('getTotalEstimatedTime', () => {
    it('should calculate total time for multiple guides', () => {
      const time = getTotalEstimatedTime(['organizing-by-set', 'binder-setup-basics']);
      // Both guides have time in their estimatedTime field
      expect(time).toMatch(/^\d+ min$/);
      const minutes = parseInt(time, 10);
      expect(minutes).toBeGreaterThan(0);
    });

    it('should return "0 min" for empty array', () => {
      const time = getTotalEstimatedTime([]);
      expect(time).toBe('0 min');
    });

    it('should handle unknown guide IDs gracefully', () => {
      const time = getTotalEstimatedTime(['unknown-guide-1', 'unknown-guide-2']);
      expect(time).toBe('0 min');
    });

    it('should handle mixed known and unknown guide IDs', () => {
      const time = getTotalEstimatedTime(['organizing-by-set', 'unknown-guide']);
      const minutes = parseInt(time, 10);
      expect(minutes).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// DATA STRUCTURE VALIDATION
// ============================================================================

describe('Tutorial Content - Data Structure Validation', () => {
  describe('Tutorial Guides', () => {
    it('should have required fields for all guides', () => {
      for (const guide of TUTORIAL_GUIDES) {
        expect(guide.id).toBeTruthy();
        expect(guide.title).toBeTruthy();
        expect(guide.shortDescription).toBeTruthy();
        expect(guide.fullDescription).toBeTruthy();
        expect(guide.category).toBeTruthy();
        expect(guide.difficulty).toBeTruthy();
        expect(guide.estimatedTime).toBeTruthy();
        expect(guide.steps.length).toBeGreaterThan(0);
        expect(guide.tips.length).toBeGreaterThan(0);
        expect(guide.funFacts.length).toBeGreaterThan(0);
        expect(guide.gradientFrom).toBeTruthy();
        expect(guide.gradientTo).toBeTruthy();
        expect(guide.iconColorClass).toBeTruthy();
      }
    });

    it('should have valid steps structure', () => {
      for (const guide of TUTORIAL_GUIDES) {
        for (const step of guide.steps) {
          expect(step.id).toBeTruthy();
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
          expect(step.summary).toBeTruthy();
          expect(step.tip).toBeTruthy();
        }
      }
    });

    it('should have unique guide IDs', () => {
      const ids = TUTORIAL_GUIDES.map((g) => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique step IDs within each guide', () => {
      for (const guide of TUTORIAL_GUIDES) {
        const stepIds = guide.steps.map((s) => s.id);
        const uniqueStepIds = new Set(stepIds);
        expect(uniqueStepIds.size).toBe(stepIds.length);
      }
    });

    it('should have valid difficulty values', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      for (const guide of TUTORIAL_GUIDES) {
        expect(validDifficulties).toContain(guide.difficulty);
      }
    });

    it('should have valid category values', () => {
      const validCategories = ['organization', 'storage', 'care', 'basics'];
      for (const guide of TUTORIAL_GUIDES) {
        expect(validCategories).toContain(guide.category);
      }
    });
  });

  describe('Tutorial Categories', () => {
    it('should have required fields for all categories', () => {
      for (const category of TUTORIAL_CATEGORIES) {
        expect(category.id).toBeTruthy();
        expect(category.name).toBeTruthy();
        expect(category.description).toBeTruthy();
        expect(category.iconName).toBeTruthy();
        expect(category.guides.length).toBeGreaterThan(0);
      }
    });

    it('should have unique category IDs', () => {
      const ids = TUTORIAL_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should reference valid guide IDs', () => {
      const allGuideIds = TUTORIAL_GUIDES.map((g) => g.id);
      for (const category of TUTORIAL_CATEGORIES) {
        for (const guideId of category.guides) {
          expect(allGuideIds).toContain(guideId);
        }
      }
    });
  });
});

// ============================================================================
// CONTENT QUALITY CHECKS
// ============================================================================

describe('Tutorial Content - Content Quality', () => {
  it('should have kid-friendly language (no complex words)', () => {
    const complexWords = ['accordingly', 'henceforth', 'therefore', 'consequently'];
    for (const guide of TUTORIAL_GUIDES) {
      const content =
        `${guide.fullDescription} ${guide.steps.map((s) => s.description).join(' ')}`.toLowerCase();
      for (const word of complexWords) {
        expect(content).not.toContain(word);
      }
    }
  });

  it('should have reasonable estimated times (between 1-30 min)', () => {
    for (const guide of TUTORIAL_GUIDES) {
      const minutes = parseInt(guide.estimatedTime, 10);
      expect(minutes).toBeGreaterThanOrEqual(1);
      expect(minutes).toBeLessThanOrEqual(30);
    }
  });

  it('should have at least 2 steps per guide', () => {
    for (const guide of TUTORIAL_GUIDES) {
      expect(guide.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have at least 2 tips per guide', () => {
    for (const guide of TUTORIAL_GUIDES) {
      expect(guide.tips.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

describe('Tutorial Content - Validation Functions', () => {
  describe('VALID_CATEGORY_IDS constant', () => {
    it('should contain expected category IDs', () => {
      expect(VALID_CATEGORY_IDS).toContain('basics');
      expect(VALID_CATEGORY_IDS).toContain('organization');
      expect(VALID_CATEGORY_IDS).toContain('storage');
      expect(VALID_CATEGORY_IDS).toContain('care');
    });

    it('should have 4 category IDs', () => {
      expect(VALID_CATEGORY_IDS).toHaveLength(4);
    });
  });

  describe('isValidCategoryId', () => {
    it('should return true for valid category IDs', () => {
      expect(isValidCategoryId('basics')).toBe(true);
      expect(isValidCategoryId('organization')).toBe(true);
      expect(isValidCategoryId('storage')).toBe(true);
      expect(isValidCategoryId('care')).toBe(true);
    });

    it('should return false for invalid category IDs', () => {
      expect(isValidCategoryId('invalid')).toBe(false);
      expect(isValidCategoryId('')).toBe(false);
      expect(isValidCategoryId('BASICS')).toBe(false);
    });
  });

  describe('isValidGuideIdFormat', () => {
    it('should return true for valid guide ID formats', () => {
      expect(isValidGuideIdFormat('organizing-by-set')).toBe(true);
      expect(isValidGuideIdFormat('card-handling')).toBe(true);
      expect(isValidGuideIdFormat('first-collection')).toBe(true);
      expect(isValidGuideIdFormat('a1')).toBe(true);
    });

    it('should return false for invalid guide ID formats', () => {
      expect(isValidGuideIdFormat('')).toBe(false);
      expect(isValidGuideIdFormat('Invalid-ID')).toBe(false);
      expect(isValidGuideIdFormat('123-test')).toBe(false);
      expect(isValidGuideIdFormat('test-')).toBe(false);
      expect(isValidGuideIdFormat('-test')).toBe(false);
    });
  });

  describe('isValidGuide', () => {
    it('should return true for valid guide objects', () => {
      const guide = getTutorialGuide('organizing-by-set');
      expect(isValidGuide(guide)).toBe(true);
    });

    it('should return false for invalid guide objects', () => {
      expect(isValidGuide(null)).toBe(false);
      expect(isValidGuide(undefined)).toBe(false);
      expect(isValidGuide({})).toBe(false);
      expect(isValidGuide({ id: 'test' })).toBe(false);
    });
  });

  describe('isValidStep', () => {
    it('should return true for valid step objects', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        expect(isValidStep(guide.steps[0])).toBe(true);
      }
    });

    it('should return false for invalid step objects', () => {
      expect(isValidStep(null)).toBe(false);
      expect(isValidStep(undefined)).toBe(false);
      expect(isValidStep({})).toBe(false);
      expect(isValidStep({ id: 'step-1' })).toBe(false);
    });
  });

  describe('isValidStepId', () => {
    it('should return true for valid step IDs', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        expect(isValidStepId(guide, 'step-1')).toBe(true);
        expect(isValidStepId(guide, 'step-2')).toBe(true);
      }
    });

    it('should return false for invalid step IDs', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        expect(isValidStepId(guide, 'invalid-step')).toBe(false);
        expect(isValidStepId(guide, '')).toBe(false);
      }
    });
  });
});

// ============================================================================
// ADDITIONAL LOOKUP FUNCTIONS
// ============================================================================

describe('Tutorial Content - Additional Lookup Functions', () => {
  describe('getStep', () => {
    it('should return step by ID', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const step = getStep(guide, 'step-1');
        expect(step).not.toBeNull();
        expect(step?.id).toBe('step-1');
      }
    });

    it('should return null for unknown step ID', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const step = getStep(guide, 'unknown-step');
        expect(step).toBeNull();
      }
    });
  });

  describe('getStepIndex', () => {
    it('should return 1-based index for step', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        expect(getStepIndex(guide, 'step-1')).toBe(1);
        expect(getStepIndex(guide, 'step-2')).toBe(2);
      }
    });

    it('should return 0 for unknown step', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        expect(getStepIndex(guide, 'unknown-step')).toBe(0);
      }
    });
  });

  describe('getGuidesWithBadges', () => {
    it('should return guides that have completion badges', () => {
      const guidesWithBadges = getGuidesWithBadges();
      expect(guidesWithBadges.length).toBeGreaterThan(0);
      for (const guide of guidesWithBadges) {
        expect(guide.completionBadgeId).toBeTruthy();
      }
    });
  });

  describe('getGuideBadgeId', () => {
    it('should return badge ID for guide with badge', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide && guide.completionBadgeId) {
        expect(getGuideBadgeId(guide)).toBe(guide.completionBadgeId);
      }
    });

    it('should return null for guide without badge', () => {
      const guide = getTutorialGuide('organizing-by-type');
      if (guide && !guide.completionBadgeId) {
        expect(getGuideBadgeId(guide)).toBeNull();
      }
    });
  });

  describe('guideExists', () => {
    it('should return true for existing guide', () => {
      expect(guideExists('organizing-by-set')).toBe(true);
    });

    it('should return false for non-existing guide', () => {
      expect(guideExists('non-existent-guide')).toBe(false);
    });
  });

  describe('categoryExists', () => {
    it('should return true for existing category', () => {
      expect(categoryExists('organization')).toBe(true);
    });

    it('should return false for non-existing category', () => {
      expect(categoryExists('non-existent-category')).toBe(false);
    });
  });
});

// ============================================================================
// SORTING FUNCTIONS
// ============================================================================

describe('Tutorial Content - Sorting Functions', () => {
  describe('CATEGORY_SORT_ORDER', () => {
    it('should have correct order', () => {
      expect(CATEGORY_SORT_ORDER['basics']).toBe(1);
      expect(CATEGORY_SORT_ORDER['organization']).toBe(2);
      expect(CATEGORY_SORT_ORDER['storage']).toBe(3);
      expect(CATEGORY_SORT_ORDER['care']).toBe(4);
    });
  });

  describe('sortGuidesByCategory', () => {
    it('should sort guides by category order', () => {
      const sorted = sortGuidesByCategory(TUTORIAL_GUIDES);
      expect(sorted.length).toBe(TUTORIAL_GUIDES.length);
      // First guide should be from 'basics' category
      const basicsGuide = sorted.find((g) => g.category === 'basics');
      if (basicsGuide) {
        const basicsIndex = sorted.indexOf(basicsGuide);
        // Check that basics guides come before organization guides
        const orgGuide = sorted.find((g) => g.category === 'organization');
        if (orgGuide) {
          expect(basicsIndex).toBeLessThan(sorted.indexOf(orgGuide));
        }
      }
    });

    it('should not mutate original array', () => {
      const original = [...TUTORIAL_GUIDES];
      sortGuidesByCategory(TUTORIAL_GUIDES);
      expect(TUTORIAL_GUIDES).toEqual(original);
    });
  });

  describe('sortGuidesByDuration', () => {
    it('should sort guides by duration (shortest first)', () => {
      const sorted = sortGuidesByDuration(TUTORIAL_GUIDES);
      for (let i = 1; i < sorted.length; i++) {
        const prevTime = parseInt(sorted[i - 1].estimatedTime, 10) || 0;
        const currTime = parseInt(sorted[i].estimatedTime, 10) || 0;
        expect(prevTime).toBeLessThanOrEqual(currTime);
      }
    });

    it('should not mutate original array', () => {
      const original = [...TUTORIAL_GUIDES];
      sortGuidesByDuration(TUTORIAL_GUIDES);
      expect(TUTORIAL_GUIDES).toEqual(original);
    });
  });

  describe('sortGuidesByStepCount', () => {
    it('should sort guides by step count (fewest first)', () => {
      const sorted = sortGuidesByStepCount(TUTORIAL_GUIDES);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].steps.length).toBeLessThanOrEqual(sorted[i].steps.length);
      }
    });

    it('should not mutate original array', () => {
      const original = [...TUTORIAL_GUIDES];
      sortGuidesByStepCount(TUTORIAL_GUIDES);
      expect(TUTORIAL_GUIDES).toEqual(original);
    });
  });

  describe('sortGuidesByDifficulty', () => {
    it('should sort guides by difficulty (beginner first)', () => {
      const sorted = sortGuidesByDifficulty(TUTORIAL_GUIDES);
      const difficultyOrder: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
      for (let i = 1; i < sorted.length; i++) {
        const prevOrder = difficultyOrder[sorted[i - 1].difficulty] ?? 999;
        const currOrder = difficultyOrder[sorted[i].difficulty] ?? 999;
        expect(prevOrder).toBeLessThanOrEqual(currOrder);
      }
    });
  });

  describe('sortCategories', () => {
    it('should sort categories by recommended order', () => {
      const sorted = sortCategories(TUTORIAL_CATEGORIES);
      expect(sorted.length).toBe(TUTORIAL_CATEGORIES.length);
      expect(sorted[0].id).toBe('basics');
    });

    it('should not mutate original array', () => {
      const original = [...TUTORIAL_CATEGORIES];
      sortCategories(TUTORIAL_CATEGORIES);
      expect(TUTORIAL_CATEGORIES).toEqual(original);
    });
  });
});

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

describe('Tutorial Content - Filtering Functions', () => {
  describe('filterByMaxDuration', () => {
    it('should filter guides by max duration', () => {
      const filtered = filterByMaxDuration(TUTORIAL_GUIDES, 5);
      for (const guide of filtered) {
        const minutes = parseInt(guide.estimatedTime, 10);
        expect(minutes).toBeLessThanOrEqual(5);
      }
    });

    it('should return empty array if no guides match', () => {
      const filtered = filterByMaxDuration(TUTORIAL_GUIDES, 0);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterIncompleteGuides', () => {
    it('should return only incomplete guides', () => {
      const completedIds = ['organizing-by-set'];
      const filtered = filterIncompleteGuides(TUTORIAL_GUIDES, completedIds);
      expect(filtered.some((g) => g.id === 'organizing-by-set')).toBe(false);
      expect(filtered.length).toBe(TUTORIAL_GUIDES.length - 1);
    });

    it('should return all guides if none completed', () => {
      const filtered = filterIncompleteGuides(TUTORIAL_GUIDES, []);
      expect(filtered.length).toBe(TUTORIAL_GUIDES.length);
    });
  });

  describe('filterCompletedGuides', () => {
    it('should return only completed guides', () => {
      const completedIds = ['organizing-by-set', 'card-handling'];
      const filtered = filterCompletedGuides(TUTORIAL_GUIDES, completedIds);
      expect(filtered.length).toBe(2);
      expect(filtered.every((g) => completedIds.includes(g.id))).toBe(true);
    });

    it('should return empty array if none completed', () => {
      const filtered = filterCompletedGuides(TUTORIAL_GUIDES, []);
      expect(filtered).toHaveLength(0);
    });
  });
});

// ============================================================================
// PROGRESS TRACKING FUNCTIONS
// ============================================================================

describe('Tutorial Content - Progress Tracking Functions', () => {
  describe('calculateTutorialProgress', () => {
    it('should calculate progress with no completed guides', () => {
      const progress = calculateTutorialProgress([]);
      expect(progress.totalGuidesComplete).toBe(0);
      expect(progress.totalGuidesAvailable).toBe(TUTORIAL_GUIDES.length);
      expect(progress.percentComplete).toBe(0);
      expect(progress.totalTimeSpentMinutes).toBe(0);
      expect(progress.badgesEarned).toHaveLength(0);
    });

    it('should calculate progress with some completed guides', () => {
      const completedIds = ['organizing-by-set', 'card-handling'];
      const progress = calculateTutorialProgress(completedIds);
      expect(progress.totalGuidesComplete).toBe(2);
      expect(progress.percentComplete).toBeGreaterThan(0);
      expect(progress.totalTimeSpentMinutes).toBeGreaterThan(0);
    });

    it('should include badges earned from completed guides', () => {
      const guidesWithBadges = getGuidesWithBadges();
      if (guidesWithBadges.length > 0) {
        const progress = calculateTutorialProgress([guidesWithBadges[0].id]);
        expect(progress.badgesEarned.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('calculateGuideProgress', () => {
    it('should calculate guide progress with no completed steps', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const progress = calculateGuideProgress(guide, []);
        expect(progress.guideId).toBe('organizing-by-set');
        expect(progress.completedSteps).toHaveLength(0);
        expect(progress.isComplete).toBe(false);
        expect(progress.lastStepViewed).toBe('');
      }
    });

    it('should calculate guide progress with some completed steps', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const progress = calculateGuideProgress(guide, ['step-1', 'step-2']);
        expect(progress.completedSteps).toHaveLength(2);
        expect(progress.lastStepViewed).toBe('step-2');
      }
    });

    it('should mark guide complete when all steps done', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const allStepIds = guide.steps.map((s) => s.id);
        const progress = calculateGuideProgress(guide, allStepIds);
        expect(progress.isComplete).toBe(true);
      }
    });

    it('should filter out invalid step IDs', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const progress = calculateGuideProgress(guide, ['step-1', 'invalid-step']);
        expect(progress.completedSteps).toHaveLength(1);
      }
    });
  });

  describe('calculateCategoryProgress', () => {
    it('should calculate category progress with no completed guides', () => {
      const progress = calculateCategoryProgress('organization', []);
      expect(progress.categoryId).toBe('organization');
      expect(progress.guidesComplete).toBe(0);
      expect(progress.percentComplete).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    it('should calculate category progress with some completed guides', () => {
      const progress = calculateCategoryProgress('organization', ['organizing-by-set']);
      expect(progress.guidesComplete).toBe(1);
      expect(progress.percentComplete).toBeGreaterThan(0);
    });
  });

  describe('enrichGuidesWithProgress', () => {
    it('should enrich guides with progress info', () => {
      const enriched = enrichGuidesWithProgress(TUTORIAL_GUIDES, ['organizing-by-set']);
      expect(enriched.length).toBe(TUTORIAL_GUIDES.length);

      const completedGuide = enriched.find((g) => g.id === 'organizing-by-set');
      expect(completedGuide?.progress.isComplete).toBe(true);
      expect(completedGuide?.progress.isStarted).toBe(true);

      const incompleteGuide = enriched.find((g) => g.id !== 'organizing-by-set');
      expect(incompleteGuide?.progress.isComplete).toBe(false);
    });
  });

  describe('getNextRecommendedGuide', () => {
    it('should return first guide when none completed', () => {
      const next = getNextRecommendedGuide([]);
      expect(next).not.toBeNull();
      // Should be a basics guide (first in sort order)
      expect(next?.category).toBe('basics');
    });

    it('should return next incomplete guide', () => {
      const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
      const firstGuideId = sortedGuides[0].id;
      const next = getNextRecommendedGuide([firstGuideId]);
      expect(next).not.toBeNull();
      expect(next?.id).not.toBe(firstGuideId);
    });

    it('should return null when all completed', () => {
      const allIds = TUTORIAL_GUIDES.map((g) => g.id);
      const next = getNextRecommendedGuide(allIds);
      expect(next).toBeNull();
    });
  });

  describe('isCategoryComplete', () => {
    it('should return false when no guides completed', () => {
      expect(isCategoryComplete('organization', [])).toBe(false);
    });

    it('should return true when all guides in category completed', () => {
      const orgCategory = getTutorialCategory('organization');
      if (orgCategory) {
        expect(isCategoryComplete('organization', orgCategory.guides)).toBe(true);
      }
    });

    it('should return false for non-existent category', () => {
      expect(isCategoryComplete('invalid', [])).toBe(false);
    });
  });

  describe('areAllTutorialsComplete', () => {
    it('should return false when no guides completed', () => {
      expect(areAllTutorialsComplete([])).toBe(false);
    });

    it('should return false when some guides incomplete', () => {
      expect(areAllTutorialsComplete(['organizing-by-set'])).toBe(false);
    });

    it('should return true when all guides completed', () => {
      const allIds = TUTORIAL_GUIDES.map((g) => g.id);
      expect(areAllTutorialsComplete(allIds)).toBe(true);
    });
  });
});

// ============================================================================
// NAVIGATION FUNCTIONS
// ============================================================================

describe('Tutorial Content - Navigation Functions', () => {
  describe('getStepNavigation', () => {
    it('should return navigation info for first step', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const nav = getStepNavigation(guide, 'step-1');
        expect(nav.currentStep).toBe(1);
        expect(nav.isFirstStep).toBe(true);
        expect(nav.isLastStep).toBe(false);
        expect(nav.hasPrevious).toBe(false);
        expect(nav.hasNext).toBe(true);
        expect(nav.previousStepId).toBeNull();
        expect(nav.nextStepId).toBe('step-2');
      }
    });

    it('should return navigation info for last step', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const lastStepId = guide.steps[guide.steps.length - 1].id;
        const nav = getStepNavigation(guide, lastStepId);
        expect(nav.isLastStep).toBe(true);
        expect(nav.hasNext).toBe(false);
        expect(nav.nextStepId).toBeNull();
      }
    });

    it('should return navigation info for middle step', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide && guide.steps.length > 2) {
        const nav = getStepNavigation(guide, 'step-2');
        expect(nav.currentStep).toBe(2);
        expect(nav.isFirstStep).toBe(false);
        expect(nav.isLastStep).toBe(false);
        expect(nav.hasPrevious).toBe(true);
        expect(nav.hasNext).toBe(true);
      }
    });

    it('should handle invalid step ID', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const nav = getStepNavigation(guide, 'invalid-step');
        expect(nav.currentStep).toBe(0);
        expect(nav.hasPrevious).toBe(false);
        expect(nav.hasNext).toBe(false);
      }
    });
  });

  describe('getNextGuide', () => {
    it('should return next guide in sequence', () => {
      const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
      const firstGuideId = sortedGuides[0].id;
      const next = getNextGuide(firstGuideId);
      expect(next).not.toBeNull();
      expect(next?.id).toBe(sortedGuides[1].id);
    });

    it('should return null for last guide', () => {
      const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
      const lastGuideId = sortedGuides[sortedGuides.length - 1].id;
      const next = getNextGuide(lastGuideId);
      expect(next).toBeNull();
    });

    it('should return null for invalid guide ID', () => {
      const next = getNextGuide('invalid-guide');
      expect(next).toBeNull();
    });
  });

  describe('getPreviousGuide', () => {
    it('should return previous guide in sequence', () => {
      const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
      const secondGuideId = sortedGuides[1].id;
      const prev = getPreviousGuide(secondGuideId);
      expect(prev).not.toBeNull();
      expect(prev?.id).toBe(sortedGuides[0].id);
    });

    it('should return null for first guide', () => {
      const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
      const firstGuideId = sortedGuides[0].id;
      const prev = getPreviousGuide(firstGuideId);
      expect(prev).toBeNull();
    });
  });
});

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

describe('Tutorial Content - Display Helpers', () => {
  describe('formatEstimatedTime', () => {
    it('should format time correctly', () => {
      expect(formatEstimatedTime('1 min')).toBe('1 min');
      expect(formatEstimatedTime('5 min')).toBe('5 mins');
      expect(formatEstimatedTime('10 min')).toBe('10 mins');
    });

    it('should handle invalid time', () => {
      expect(formatEstimatedTime('invalid')).toBe('Less than 1 min');
      expect(formatEstimatedTime('')).toBe('Less than 1 min');
    });
  });

  describe('formatProgressPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatProgressPercent(0)).toBe('0%');
      expect(formatProgressPercent(50)).toBe('50%');
      expect(formatProgressPercent(100)).toBe('100%');
      expect(formatProgressPercent(33.33)).toBe('33%');
    });
  });

  describe('getProgressMessage', () => {
    it('should return start message when none completed', () => {
      const msg = getProgressMessage(0, 10, false);
      expect(msg).toBe('Start your collecting journey!');
    });

    it('should return completion message when all done', () => {
      const msg = getProgressMessage(10, 10, true);
      expect(msg).toBe('Congratulations! You completed all tutorials!');
    });

    it('should return remaining count message', () => {
      const msg = getProgressMessage(5, 10, false);
      expect(msg).toBe('5 guides remaining');
    });

    it('should return singular message for 1 remaining', () => {
      const msg = getProgressMessage(9, 10, false);
      expect(msg).toBe('Just 1 guide left - you can do it!');
    });
  });

  describe('getStepIndicator', () => {
    it('should format step indicator correctly', () => {
      expect(getStepIndicator(1, 4)).toBe('Step 1 of 4');
      expect(getStepIndicator(3, 5)).toBe('Step 3 of 5');
    });
  });

  describe('getCategoryDisplayLabel', () => {
    it('should return category name', () => {
      const category = getTutorialCategory('organization');
      if (category) {
        expect(getCategoryDisplayLabel(category)).toBe('Card Organization');
      }
    });
  });

  describe('getGuideDisplayLabel', () => {
    it('should return guide title', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        expect(getGuideDisplayLabel(guide)).toBe('Organizing by Set');
      }
    });
  });

  describe('getBadgeEarnedMessage', () => {
    it('should format badge message correctly', () => {
      expect(getBadgeEarnedMessage('organization-basics')).toBe(
        'You earned the organization basics badge!'
      );
      expect(getBadgeEarnedMessage('card-care-basics')).toBe(
        'You earned the card care basics badge!'
      );
    });
  });
});

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

describe('Tutorial Content - Search Functions', () => {
  describe('searchGuides', () => {
    it('should find guides by title', () => {
      const results = searchGuides('organizing');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.title.toLowerCase().includes('organizing'))).toBe(true);
    });

    it('should find guides by step content', () => {
      const results = searchGuides('binder');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = searchGuides('xyznonexistent');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for empty search term', () => {
      const results = searchGuides('');
      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const results1 = searchGuides('ORGANIZING');
      const results2 = searchGuides('organizing');
      expect(results1.length).toBe(results2.length);
    });
  });

  describe('countTotalSteps', () => {
    it('should count all steps across guides', () => {
      const count = countTotalSteps();
      expect(count).toBeGreaterThan(0);
      const expectedCount = TUTORIAL_GUIDES.reduce((sum, g) => sum + g.steps.length, 0);
      expect(count).toBe(expectedCount);
    });
  });

  describe('calculateTotalTimeMinutes', () => {
    it('should calculate total time in minutes', () => {
      const totalTime = calculateTotalTimeMinutes();
      expect(totalTime).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// CATEGORY HELPERS
// ============================================================================

describe('Tutorial Content - Category Helpers', () => {
  describe('getAllCategoryProgress', () => {
    it('should return progress for all categories', () => {
      const progress = getAllCategoryProgress([]);
      expect(progress.length).toBe(TUTORIAL_CATEGORIES.length);
      for (const p of progress) {
        expect(p.guidesComplete).toBe(0);
        expect(p.percentComplete).toBe(0);
      }
    });

    it('should reflect completed guides', () => {
      const orgCategory = getTutorialCategory('organization');
      if (orgCategory && orgCategory.guides.length > 0) {
        const progress = getAllCategoryProgress([orgCategory.guides[0]]);
        const orgProgress = progress.find((p) => p.categoryId === 'organization');
        expect(orgProgress?.guidesComplete).toBe(1);
      }
    });
  });

  describe('getGuideCountByCategory', () => {
    it('should return correct counts', () => {
      const counts = getGuideCountByCategory();
      for (const category of TUTORIAL_CATEGORIES) {
        expect(counts[category.id]).toBe(category.guides.length);
      }
    });
  });

  describe('getGuidesGroupedByCategory', () => {
    it('should return guides grouped by category', () => {
      const grouped = getGuidesGroupedByCategory();
      expect(grouped.length).toBe(TUTORIAL_CATEGORIES.length);
      for (const group of grouped) {
        expect(group.category).toBeTruthy();
        expect(group.guides.length).toBeGreaterThan(0);
        expect(group.totalMinutes).toBeGreaterThanOrEqual(0);
      }
    });

    it('should be sorted by category order', () => {
      const grouped = getGuidesGroupedByCategory();
      expect(grouped[0].category.id).toBe('basics');
    });
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Tutorial Content - Integration Scenarios', () => {
  describe('New User Journey', () => {
    it('should guide new user through tutorials', () => {
      // New user has no completed guides
      const completedIds: string[] = [];

      // Get the first recommended guide
      const firstGuide = getNextRecommendedGuide(completedIds);
      expect(firstGuide).not.toBeNull();
      expect(firstGuide?.category).toBe('basics');

      // Calculate initial progress
      const initialProgress = calculateTutorialProgress(completedIds);
      expect(initialProgress.percentComplete).toBe(0);

      // User completes first guide
      if (firstGuide) {
        completedIds.push(firstGuide.id);
        const updatedProgress = calculateTutorialProgress(completedIds);
        expect(updatedProgress.totalGuidesComplete).toBe(1);
        expect(updatedProgress.percentComplete).toBeGreaterThan(0);
      }
    });
  });

  describe('Category Completion Journey', () => {
    it('should track category completion', () => {
      const categoryId = 'organization';
      const category = getTutorialCategory(categoryId);

      if (category) {
        // Start with no completed guides
        expect(isCategoryComplete(categoryId, [])).toBe(false);

        // Complete all guides in the category
        expect(isCategoryComplete(categoryId, category.guides)).toBe(true);

        // Check category progress
        const progress = calculateCategoryProgress(categoryId, category.guides);
        expect(progress.isComplete).toBe(true);
        expect(progress.percentComplete).toBe(100);
      }
    });
  });

  describe('Guide Step Navigation', () => {
    it('should navigate through guide steps', () => {
      const guide = getTutorialGuide('organizing-by-set');
      if (guide) {
        const completedSteps: string[] = [];

        // Start at step 1
        let stepId = guide.steps[0].id;
        let nav = getStepNavigation(guide, stepId);
        expect(nav.isFirstStep).toBe(true);

        // Navigate through all steps
        while (nav.hasNext) {
          completedSteps.push(stepId);
          stepId = nav.nextStepId!;
          nav = getStepNavigation(guide, stepId);
        }

        // Should be at last step
        expect(nav.isLastStep).toBe(true);
        completedSteps.push(stepId);

        // Check guide progress
        const progress = calculateGuideProgress(guide, completedSteps);
        expect(progress.isComplete).toBe(true);
      }
    });
  });
});
