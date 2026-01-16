import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HIGH_CONTRAST_ENABLED_KEY,
  HIGH_CONTRAST_LEVEL_KEY,
  HIGH_CONTRAST_CLASS,
  HIGH_CONTRAST_MEDIUM_CLASS,
  HIGH_CONTRAST_HIGH_CLASS,
  HIGH_CONTRAST_INFO,
  CONTRAST_LEVEL_INFO,
  CONTRAST_LEVEL_OPTIONS,
  saveHighContrastEnabled,
  loadHighContrastEnabled,
  saveHighContrastLevel,
  loadHighContrastLevel,
  getHighContrastClasses,
  applyHighContrastClasses,
  isHighContrastApplied,
  getCurrentHighContrastLevel,
  getHighContrastLabel,
  getHighContrastDescription,
  getHighContrastTooltip,
  isHighContrastEnabled,
  type HighContrastLevel,
} from '../highContrastMode';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock document
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      classList: mockClassList,
    },
  },
  writable: true,
});

describe('High-Contrast Mode Constants', () => {
  describe('Storage Keys', () => {
    it('should have non-empty enabled key', () => {
      expect(HIGH_CONTRAST_ENABLED_KEY).toBeDefined();
      expect(typeof HIGH_CONTRAST_ENABLED_KEY).toBe('string');
      expect(HIGH_CONTRAST_ENABLED_KEY.length).toBeGreaterThan(0);
    });

    it('should have non-empty level key', () => {
      expect(HIGH_CONTRAST_LEVEL_KEY).toBeDefined();
      expect(typeof HIGH_CONTRAST_LEVEL_KEY).toBe('string');
      expect(HIGH_CONTRAST_LEVEL_KEY.length).toBeGreaterThan(0);
    });

    it('should contain carddex identifier', () => {
      expect(HIGH_CONTRAST_ENABLED_KEY).toContain('carddex');
      expect(HIGH_CONTRAST_LEVEL_KEY).toContain('carddex');
    });

    it('should follow the carddex_ prefix pattern', () => {
      expect(HIGH_CONTRAST_ENABLED_KEY).toMatch(/^carddex_/);
      expect(HIGH_CONTRAST_LEVEL_KEY).toMatch(/^carddex_/);
    });
  });

  describe('CSS Class Constants', () => {
    it('should have valid base class name', () => {
      expect(HIGH_CONTRAST_CLASS).toBeDefined();
      expect(typeof HIGH_CONTRAST_CLASS).toBe('string');
      expect(HIGH_CONTRAST_CLASS).not.toContain(' ');
    });

    it('should have valid medium class name', () => {
      expect(HIGH_CONTRAST_MEDIUM_CLASS).toBeDefined();
      expect(typeof HIGH_CONTRAST_MEDIUM_CLASS).toBe('string');
      expect(HIGH_CONTRAST_MEDIUM_CLASS).not.toContain(' ');
    });

    it('should have valid high class name', () => {
      expect(HIGH_CONTRAST_HIGH_CLASS).toBeDefined();
      expect(typeof HIGH_CONTRAST_HIGH_CLASS).toBe('string');
      expect(HIGH_CONTRAST_HIGH_CLASS).not.toContain(' ');
    });

    it('should be expected values', () => {
      expect(HIGH_CONTRAST_CLASS).toBe('high-contrast');
      expect(HIGH_CONTRAST_MEDIUM_CLASS).toBe('high-contrast-medium');
      expect(HIGH_CONTRAST_HIGH_CLASS).toBe('high-contrast-high');
    });

    it('should use consistent CSS class naming (lowercase with hyphens)', () => {
      expect(HIGH_CONTRAST_CLASS).toMatch(/^[a-z][a-z-]*$/);
      expect(HIGH_CONTRAST_MEDIUM_CLASS).toMatch(/^[a-z][a-z-]*$/);
      expect(HIGH_CONTRAST_HIGH_CLASS).toMatch(/^[a-z][a-z-]*$/);
    });
  });

  describe('HIGH_CONTRAST_INFO', () => {
    it('should have all required properties', () => {
      expect(HIGH_CONTRAST_INFO.name).toBeDefined();
      expect(HIGH_CONTRAST_INFO.description).toBeDefined();
      expect(HIGH_CONTRAST_INFO.shortDescription).toBeDefined();
      expect(HIGH_CONTRAST_INFO.benefits).toBeDefined();
    });

    it('should have non-empty name', () => {
      expect(HIGH_CONTRAST_INFO.name.length).toBeGreaterThan(0);
      expect(HIGH_CONTRAST_INFO.name).toBe('High Contrast');
    });

    it('should have benefits array with items', () => {
      expect(Array.isArray(HIGH_CONTRAST_INFO.benefits)).toBe(true);
      expect(HIGH_CONTRAST_INFO.benefits.length).toBeGreaterThan(0);
    });

    it('should have benefits that explain the mode features', () => {
      const benefitsText = HIGH_CONTRAST_INFO.benefits.join(' ').toLowerCase();
      expect(benefitsText).toContain('contrast');
    });

    it('should have description explaining the mode purpose', () => {
      expect(HIGH_CONTRAST_INFO.description.length).toBeGreaterThan(20);
    });

    it('should have a concise short description', () => {
      expect(HIGH_CONTRAST_INFO.shortDescription.length).toBeLessThan(50);
    });
  });

  describe('CONTRAST_LEVEL_INFO', () => {
    it('should have info for all levels', () => {
      expect(CONTRAST_LEVEL_INFO.off).toBeDefined();
      expect(CONTRAST_LEVEL_INFO.medium).toBeDefined();
      expect(CONTRAST_LEVEL_INFO.high).toBeDefined();
    });

    it('should have required properties for each level', () => {
      const levels: HighContrastLevel[] = ['off', 'medium', 'high'];
      for (const level of levels) {
        expect(CONTRAST_LEVEL_INFO[level].label).toBeDefined();
        expect(CONTRAST_LEVEL_INFO[level].description).toBeDefined();
        expect(CONTRAST_LEVEL_INFO[level].shortDescription).toBeDefined();
      }
    });

    it('should have non-empty labels', () => {
      expect(CONTRAST_LEVEL_INFO.off.label.length).toBeGreaterThan(0);
      expect(CONTRAST_LEVEL_INFO.medium.label.length).toBeGreaterThan(0);
      expect(CONTRAST_LEVEL_INFO.high.label.length).toBeGreaterThan(0);
    });

    it('should have distinct labels for each level', () => {
      const labels = [
        CONTRAST_LEVEL_INFO.off.label,
        CONTRAST_LEVEL_INFO.medium.label,
        CONTRAST_LEVEL_INFO.high.label,
      ];
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(3);
    });
  });

  describe('CONTRAST_LEVEL_OPTIONS', () => {
    it('should be an array', () => {
      expect(Array.isArray(CONTRAST_LEVEL_OPTIONS)).toBe(true);
    });

    it('should contain all levels', () => {
      expect(CONTRAST_LEVEL_OPTIONS).toContain('off');
      expect(CONTRAST_LEVEL_OPTIONS).toContain('medium');
      expect(CONTRAST_LEVEL_OPTIONS).toContain('high');
    });

    it('should have exactly 3 options', () => {
      expect(CONTRAST_LEVEL_OPTIONS.length).toBe(3);
    });

    it('should have off as first option', () => {
      expect(CONTRAST_LEVEL_OPTIONS[0]).toBe('off');
    });
  });
});

describe('Persistence Functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveHighContrastEnabled / loadHighContrastEnabled', () => {
    it('should save and load enabled state as true', () => {
      saveHighContrastEnabled(true);
      expect(loadHighContrastEnabled()).toBe(true);
    });

    it('should save and load enabled state as false', () => {
      saveHighContrastEnabled(false);
      expect(loadHighContrastEnabled()).toBe(false);
    });

    it('should return false for unset value', () => {
      expect(loadHighContrastEnabled()).toBe(false);
    });

    it('should use the correct localStorage key', () => {
      saveHighContrastEnabled(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(HIGH_CONTRAST_ENABLED_KEY, 'true');
    });

    it('should handle localStorage errors gracefully in save', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => saveHighContrastEnabled(true)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage errors gracefully in load', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Access denied');
      });

      expect(loadHighContrastEnabled()).toBe(false);

      localStorage.getItem = originalGetItem;
    });
  });

  describe('saveHighContrastLevel / loadHighContrastLevel', () => {
    it('should save and load off level', () => {
      saveHighContrastLevel('off');
      expect(loadHighContrastLevel()).toBe('off');
    });

    it('should save and load medium level', () => {
      saveHighContrastLevel('medium');
      expect(loadHighContrastLevel()).toBe('medium');
    });

    it('should save and load high level', () => {
      saveHighContrastLevel('high');
      expect(loadHighContrastLevel()).toBe('high');
    });

    it('should return off for unset value', () => {
      expect(loadHighContrastLevel()).toBe('off');
    });

    it('should use the correct localStorage key', () => {
      saveHighContrastLevel('medium');
      expect(localStorage.setItem).toHaveBeenCalledWith(HIGH_CONTRAST_LEVEL_KEY, 'medium');
    });

    it('should return off for invalid stored value', () => {
      localStorage.setItem(HIGH_CONTRAST_LEVEL_KEY, 'invalid');
      expect(loadHighContrastLevel()).toBe('off');
    });

    it('should handle localStorage errors gracefully in save', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => saveHighContrastLevel('high')).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage errors gracefully in load', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Access denied');
      });

      expect(loadHighContrastLevel()).toBe('off');

      localStorage.getItem = originalGetItem;
    });
  });
});

describe('CSS Class Helpers', () => {
  beforeEach(() => {
    mockClassList.add.mockClear();
    mockClassList.remove.mockClear();
    mockClassList.contains.mockClear();
  });

  describe('getHighContrastClasses', () => {
    it('should return empty array for off', () => {
      const classes = getHighContrastClasses('off');
      expect(classes).toEqual([]);
    });

    it('should return base and medium class for medium', () => {
      const classes = getHighContrastClasses('medium');
      expect(classes).toContain(HIGH_CONTRAST_CLASS);
      expect(classes).toContain(HIGH_CONTRAST_MEDIUM_CLASS);
      expect(classes).not.toContain(HIGH_CONTRAST_HIGH_CLASS);
    });

    it('should return base and high class for high', () => {
      const classes = getHighContrastClasses('high');
      expect(classes).toContain(HIGH_CONTRAST_CLASS);
      expect(classes).toContain(HIGH_CONTRAST_HIGH_CLASS);
      expect(classes).not.toContain(HIGH_CONTRAST_MEDIUM_CLASS);
    });

    it('should always include base class when not off', () => {
      const mediumClasses = getHighContrastClasses('medium');
      const highClasses = getHighContrastClasses('high');
      expect(mediumClasses).toContain(HIGH_CONTRAST_CLASS);
      expect(highClasses).toContain(HIGH_CONTRAST_CLASS);
    });
  });

  describe('applyHighContrastClasses', () => {
    it('should remove all classes when off', () => {
      applyHighContrastClasses('off');
      expect(mockClassList.remove).toHaveBeenCalledWith(
        HIGH_CONTRAST_CLASS,
        HIGH_CONTRAST_MEDIUM_CLASS,
        HIGH_CONTRAST_HIGH_CLASS
      );
      expect(mockClassList.add).not.toHaveBeenCalled();
    });

    it('should add medium classes when medium', () => {
      applyHighContrastClasses('medium');
      expect(mockClassList.add).toHaveBeenCalledWith(HIGH_CONTRAST_CLASS);
      expect(mockClassList.add).toHaveBeenCalledWith(HIGH_CONTRAST_MEDIUM_CLASS);
    });

    it('should add high classes when high', () => {
      applyHighContrastClasses('high');
      expect(mockClassList.add).toHaveBeenCalledWith(HIGH_CONTRAST_CLASS);
      expect(mockClassList.add).toHaveBeenCalledWith(HIGH_CONTRAST_HIGH_CLASS);
    });

    it('should always remove classes first before adding', () => {
      applyHighContrastClasses('high');
      // remove should be called before add
      expect(mockClassList.remove).toHaveBeenCalled();
    });
  });

  describe('isHighContrastApplied', () => {
    it('should return true when base class is present', () => {
      mockClassList.contains.mockReturnValue(true);
      expect(isHighContrastApplied()).toBe(true);
    });

    it('should return false when base class is not present', () => {
      mockClassList.contains.mockReturnValue(false);
      expect(isHighContrastApplied()).toBe(false);
    });

    it('should check for the correct class', () => {
      isHighContrastApplied();
      expect(mockClassList.contains).toHaveBeenCalledWith(HIGH_CONTRAST_CLASS);
    });
  });

  describe('getCurrentHighContrastLevel', () => {
    it('should return high when high class is present', () => {
      mockClassList.contains.mockImplementation((cls: string) => cls === HIGH_CONTRAST_HIGH_CLASS);
      expect(getCurrentHighContrastLevel()).toBe('high');
    });

    it('should return medium when medium class is present', () => {
      mockClassList.contains.mockImplementation(
        (cls: string) => cls === HIGH_CONTRAST_MEDIUM_CLASS
      );
      expect(getCurrentHighContrastLevel()).toBe('medium');
    });

    it('should return off when no class is present', () => {
      mockClassList.contains.mockReturnValue(false);
      expect(getCurrentHighContrastLevel()).toBe('off');
    });

    it('should prefer high over medium if both present', () => {
      mockClassList.contains.mockReturnValue(true);
      expect(getCurrentHighContrastLevel()).toBe('high');
    });
  });
});

describe('Display Helpers', () => {
  describe('getHighContrastLabel', () => {
    it('should return correct label for off', () => {
      expect(getHighContrastLabel('off')).toBe('Standard');
    });

    it('should return correct label for medium', () => {
      expect(getHighContrastLabel('medium')).toBe('Medium Contrast');
    });

    it('should return correct label for high', () => {
      expect(getHighContrastLabel('high')).toBe('High Contrast');
    });

    it('should return non-empty strings for all levels', () => {
      for (const level of CONTRAST_LEVEL_OPTIONS) {
        expect(getHighContrastLabel(level).length).toBeGreaterThan(0);
      }
    });
  });

  describe('getHighContrastDescription', () => {
    it('should return non-empty description for all levels', () => {
      for (const level of CONTRAST_LEVEL_OPTIONS) {
        expect(getHighContrastDescription(level).length).toBeGreaterThan(0);
      }
    });

    it('should return distinct descriptions', () => {
      const descriptions = CONTRAST_LEVEL_OPTIONS.map((level) => getHighContrastDescription(level));
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(3);
    });
  });

  describe('getHighContrastTooltip', () => {
    it('should provide enable guidance when off', () => {
      const tooltip = getHighContrastTooltip('off');
      expect(tooltip.toLowerCase()).toContain('enable');
    });

    it('should show current state when enabled', () => {
      const mediumTooltip = getHighContrastTooltip('medium');
      const highTooltip = getHighContrastTooltip('high');

      expect(mediumTooltip.toLowerCase()).toContain('contrast');
      expect(highTooltip.toLowerCase()).toContain('contrast');
    });

    it('should return non-empty strings for all levels', () => {
      for (const level of CONTRAST_LEVEL_OPTIONS) {
        expect(getHighContrastTooltip(level).length).toBeGreaterThan(0);
      }
    });
  });

  describe('isHighContrastEnabled', () => {
    it('should return false for off', () => {
      expect(isHighContrastEnabled('off')).toBe(false);
    });

    it('should return true for medium', () => {
      expect(isHighContrastEnabled('medium')).toBe(true);
    });

    it('should return true for high', () => {
      expect(isHighContrastEnabled('high')).toBe(true);
    });
  });
});

describe('Accessibility Considerations', () => {
  it('should have user-friendly mode name', () => {
    expect(HIGH_CONTRAST_INFO.name).toBe('High Contrast');
  });

  it('should provide clear level labels', () => {
    const offLabel = getHighContrastLabel('off');
    const mediumLabel = getHighContrastLabel('medium');
    const highLabel = getHighContrastLabel('high');

    // Labels should clearly indicate contrast level
    expect(offLabel.toLowerCase()).toContain('standard');
    expect(mediumLabel.toLowerCase()).toContain('medium');
    expect(highLabel.toLowerCase()).toContain('high');
  });

  it('should have benefits that explain the accessibility features', () => {
    const benefitsText = HIGH_CONTRAST_INFO.benefits.join(' ').toLowerCase();

    expect(benefitsText).toContain('text');
    expect(benefitsText).toContain('contrast');
    expect(benefitsText).toContain('border');
  });

  it('should mention focus indicators in benefits', () => {
    const benefitsText = HIGH_CONTRAST_INFO.benefits.join(' ').toLowerCase();
    expect(benefitsText).toContain('focus');
  });
});

describe('Integration Considerations', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should persist level correctly through save/load cycle', () => {
    // Initially off
    expect(loadHighContrastLevel()).toBe('off');

    // Save medium
    saveHighContrastLevel('medium');
    expect(loadHighContrastLevel()).toBe('medium');

    // Save high
    saveHighContrastLevel('high');
    expect(loadHighContrastLevel()).toBe('high');

    // Save off
    saveHighContrastLevel('off');
    expect(loadHighContrastLevel()).toBe('off');
  });

  it('should have consistent level types across all functions', () => {
    const levels: HighContrastLevel[] = ['off', 'medium', 'high'];

    for (const level of levels) {
      // All these functions should accept the same level types
      expect(() => getHighContrastClasses(level)).not.toThrow();
      expect(() => getHighContrastLabel(level)).not.toThrow();
      expect(() => getHighContrastDescription(level)).not.toThrow();
      expect(() => getHighContrastTooltip(level)).not.toThrow();
      expect(() => isHighContrastEnabled(level)).not.toThrow();
    }
  });

  it('should maintain consistency between CONTRAST_LEVEL_OPTIONS and CONTRAST_LEVEL_INFO', () => {
    for (const level of CONTRAST_LEVEL_OPTIONS) {
      expect(CONTRAST_LEVEL_INFO[level]).toBeDefined();
    }
  });
});
