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
