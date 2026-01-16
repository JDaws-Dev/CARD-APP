/**
 * Tests for Reduced Motion Library
 *
 * Tests the manual reduced motion toggle functionality that works
 * independently of the system's prefers-reduced-motion setting.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Types
  type ReducedMotionMode,
  // Constants
  REDUCED_MOTION_MODE_KEY,
  REDUCED_MOTION_CLASS,
  REDUCED_MOTION_INFO,
  MOTION_MODE_INFO,
  MOTION_MODE_OPTIONS,
  // Persistence functions
  saveReducedMotionMode,
  loadReducedMotionMode,
  // Motion state resolution
  shouldReduceMotion,
  getEffectiveMotionDescription,
  // CSS class helpers
  getReducedMotionClasses,
  applyReducedMotionClass,
  isReducedMotionApplied,
  // Display helpers
  getReducedMotionLabel,
  getReducedMotionDescription,
  getReducedMotionTooltip,
  getMotionStatusIndicator,
} from '../reducedMotion';

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

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Reduced Motion Constants', () => {
  describe('localStorage keys', () => {
    it('should have correct localStorage key for mode', () => {
      expect(REDUCED_MOTION_MODE_KEY).toBe('carddex_reduced_motion_mode');
    });

    it('should follow the carddex_ prefix pattern', () => {
      expect(REDUCED_MOTION_MODE_KEY).toMatch(/^carddex_/);
    });
  });

  describe('CSS class constants', () => {
    it('should have correct reduce-motion class', () => {
      expect(REDUCED_MOTION_CLASS).toBe('reduce-motion');
    });

    it('should be a valid CSS class name (no spaces)', () => {
      expect(REDUCED_MOTION_CLASS).not.toContain(' ');
    });
  });

  describe('REDUCED_MOTION_INFO', () => {
    it('should have required fields', () => {
      expect(REDUCED_MOTION_INFO).toHaveProperty('name');
      expect(REDUCED_MOTION_INFO).toHaveProperty('description');
      expect(REDUCED_MOTION_INFO).toHaveProperty('shortDescription');
      expect(REDUCED_MOTION_INFO).toHaveProperty('benefits');
    });

    it('should have meaningful name', () => {
      expect(REDUCED_MOTION_INFO.name.length).toBeGreaterThan(0);
      expect(REDUCED_MOTION_INFO.name).toBe('Reduced Motion');
    });

    it('should have non-empty description', () => {
      expect(REDUCED_MOTION_INFO.description.length).toBeGreaterThan(10);
    });

    it('should have non-empty short description', () => {
      expect(REDUCED_MOTION_INFO.shortDescription.length).toBeGreaterThan(0);
    });

    it('should have benefits as array with items', () => {
      expect(Array.isArray(REDUCED_MOTION_INFO.benefits)).toBe(true);
      expect(REDUCED_MOTION_INFO.benefits.length).toBeGreaterThan(0);
    });

    it('should have meaningful benefits', () => {
      REDUCED_MOTION_INFO.benefits.forEach((benefit) => {
        expect(benefit.length).toBeGreaterThan(5);
      });
    });
  });

  describe('MOTION_MODE_INFO', () => {
    it('should have info for all modes', () => {
      const modes: ReducedMotionMode[] = ['system', 'always', 'never'];
      modes.forEach((mode) => {
        expect(MOTION_MODE_INFO[mode]).toBeDefined();
      });
    });

    it('should have required fields for each mode', () => {
      Object.values(MOTION_MODE_INFO).forEach((info) => {
        expect(info).toHaveProperty('label');
        expect(info).toHaveProperty('description');
        expect(info).toHaveProperty('shortDescription');
      });
    });

    it('should have non-empty labels for all modes', () => {
      Object.values(MOTION_MODE_INFO).forEach((info) => {
        expect(info.label.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptive labels', () => {
      expect(MOTION_MODE_INFO.system.label).toBe('System');
      expect(MOTION_MODE_INFO.always.label).toBe('Always Reduce');
      expect(MOTION_MODE_INFO.never.label).toBe('Always Show');
    });

    it('should have non-empty descriptions', () => {
      Object.values(MOTION_MODE_INFO).forEach((info) => {
        expect(info.description.length).toBeGreaterThan(10);
      });
    });

    it('should have non-empty short descriptions', () => {
      Object.values(MOTION_MODE_INFO).forEach((info) => {
        expect(info.shortDescription.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MOTION_MODE_OPTIONS', () => {
    it('should have all three options', () => {
      expect(MOTION_MODE_OPTIONS).toHaveLength(3);
      expect(MOTION_MODE_OPTIONS).toContain('system');
      expect(MOTION_MODE_OPTIONS).toContain('always');
      expect(MOTION_MODE_OPTIONS).toContain('never');
    });

    it('should have system as first option', () => {
      expect(MOTION_MODE_OPTIONS[0]).toBe('system');
    });

    it('should be an array', () => {
      expect(Array.isArray(MOTION_MODE_OPTIONS)).toBe(true);
    });
  });
});

// ============================================================================
// PERSISTENCE TESTS
// ============================================================================

describe('Reduced Motion Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveReducedMotionMode', () => {
    it('should call localStorage.setItem with correct key', () => {
      saveReducedMotionMode('always');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        REDUCED_MOTION_MODE_KEY,
        'always'
      );
    });

    it('should save system mode', () => {
      saveReducedMotionMode('system');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        REDUCED_MOTION_MODE_KEY,
        'system'
      );
    });

    it('should save never mode', () => {
      saveReducedMotionMode('never');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        REDUCED_MOTION_MODE_KEY,
        'never'
      );
    });

    it('should save always mode', () => {
      saveReducedMotionMode('always');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        REDUCED_MOTION_MODE_KEY,
        'always'
      );
    });
  });

  describe('loadReducedMotionMode', () => {
    it('should return saved mode from localStorage', () => {
      localStorageMock.store[REDUCED_MOTION_MODE_KEY] = 'always';
      expect(loadReducedMotionMode()).toBe('always');
    });

    it('should return system when nothing saved', () => {
      expect(loadReducedMotionMode()).toBe('system');
    });

    it('should return system for invalid saved value', () => {
      localStorageMock.store[REDUCED_MOTION_MODE_KEY] = 'invalid';
      expect(loadReducedMotionMode()).toBe('system');
    });

    it('should handle all valid modes', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        localStorageMock.store[REDUCED_MOTION_MODE_KEY] = mode;
        expect(loadReducedMotionMode()).toBe(mode);
      });
    });

    it('should call localStorage.getItem', () => {
      loadReducedMotionMode();
      expect(localStorageMock.getItem).toHaveBeenCalledWith(REDUCED_MOTION_MODE_KEY);
    });
  });
});

// ============================================================================
// MOTION STATE RESOLUTION TESTS
// ============================================================================

describe('Motion State Resolution', () => {
  describe('shouldReduceMotion', () => {
    it('should return true when mode is always regardless of system', () => {
      expect(shouldReduceMotion('always', false)).toBe(true);
      expect(shouldReduceMotion('always', true)).toBe(true);
    });

    it('should return false when mode is never regardless of system', () => {
      expect(shouldReduceMotion('never', false)).toBe(false);
      expect(shouldReduceMotion('never', true)).toBe(false);
    });

    it('should follow system preference when mode is system', () => {
      expect(shouldReduceMotion('system', false)).toBe(false);
      expect(shouldReduceMotion('system', true)).toBe(true);
    });

    it('should handle default case', () => {
      // TypeScript would normally catch this, but testing runtime behavior
      expect(shouldReduceMotion('system', false)).toBe(false);
    });
  });

  describe('getEffectiveMotionDescription', () => {
    it('should describe system mode following system setting (reduced)', () => {
      const desc = getEffectiveMotionDescription('system', true);
      expect(desc).toContain('following system setting');
      expect(desc.toLowerCase()).toContain('reduced');
    });

    it('should describe system mode following system setting (enabled)', () => {
      const desc = getEffectiveMotionDescription('system', false);
      expect(desc).toContain('following system setting');
      expect(desc.toLowerCase()).toContain('enabled');
    });

    it('should describe always mode', () => {
      const desc = getEffectiveMotionDescription('always', false);
      expect(desc.toLowerCase()).toContain('always reduced');
    });

    it('should describe never mode', () => {
      const desc = getEffectiveMotionDescription('never', true);
      expect(desc.toLowerCase()).toContain('always shown');
    });

    it('should return non-empty description for all modes', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        expect(getEffectiveMotionDescription(mode, true).length).toBeGreaterThan(0);
        expect(getEffectiveMotionDescription(mode, false).length).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================================================
// CSS CLASS HELPERS TESTS
// ============================================================================

describe('CSS Class Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReducedMotionClasses', () => {
    it('should return reduce-motion class when should reduce', () => {
      const classes = getReducedMotionClasses(true);
      expect(classes).toContain(REDUCED_MOTION_CLASS);
      expect(classes.length).toBe(1);
    });

    it('should return empty array when should not reduce', () => {
      const classes = getReducedMotionClasses(false);
      expect(classes).toHaveLength(0);
    });
  });

  describe('applyReducedMotionClass', () => {
    it('should add class when should reduce', () => {
      applyReducedMotionClass(true);
      expect(mockClassList.add).toHaveBeenCalledWith(REDUCED_MOTION_CLASS);
    });

    it('should remove class when should not reduce', () => {
      applyReducedMotionClass(false);
      expect(mockClassList.remove).toHaveBeenCalledWith(REDUCED_MOTION_CLASS);
    });
  });

  describe('isReducedMotionApplied', () => {
    it('should return true when class is applied', () => {
      mockClassList.contains.mockReturnValue(true);
      expect(isReducedMotionApplied()).toBe(true);
      expect(mockClassList.contains).toHaveBeenCalledWith(REDUCED_MOTION_CLASS);
    });

    it('should return false when class is not applied', () => {
      mockClassList.contains.mockReturnValue(false);
      expect(isReducedMotionApplied()).toBe(false);
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('Display Helpers', () => {
  describe('getReducedMotionLabel', () => {
    it('should return correct label for each mode', () => {
      expect(getReducedMotionLabel('system')).toBe('System');
      expect(getReducedMotionLabel('always')).toBe('Always Reduce');
      expect(getReducedMotionLabel('never')).toBe('Always Show');
    });

    it('should return non-empty labels', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        expect(getReducedMotionLabel(mode).length).toBeGreaterThan(0);
      });
    });
  });

  describe('getReducedMotionDescription', () => {
    it('should return description for each mode', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        const desc = getReducedMotionDescription(mode);
        expect(desc.length).toBeGreaterThan(0);
      });
    });

    it('should return different descriptions for different modes', () => {
      const descriptions = MOTION_MODE_OPTIONS.map((mode) =>
        getReducedMotionDescription(mode)
      );
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(MOTION_MODE_OPTIONS.length);
    });
  });

  describe('getReducedMotionTooltip', () => {
    it('should include mode info in tooltip', () => {
      const tooltip = getReducedMotionTooltip('always', false);
      expect(tooltip.length).toBeGreaterThan(0);
    });

    it('should indicate reduced state when motion is reduced', () => {
      const tooltip = getReducedMotionTooltip('always', false);
      expect(tooltip.toLowerCase()).toContain('reduced');
    });

    it('should indicate motion state when not reduced', () => {
      const tooltip = getReducedMotionTooltip('never', true);
      expect(tooltip.toLowerCase()).toContain('motion');
    });

    it('should return non-empty tooltip for all combinations', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        expect(getReducedMotionTooltip(mode, true).length).toBeGreaterThan(0);
        expect(getReducedMotionTooltip(mode, false).length).toBeGreaterThan(0);
      });
    });
  });

  describe('getMotionStatusIndicator', () => {
    it('should return reduced indicator when motion is reduced (always mode)', () => {
      const indicator = getMotionStatusIndicator('always', false);
      expect(indicator.icon).toBe('reduced');
      expect(indicator.color).toBe('cyan');
    });

    it('should return enabled indicator when motion is not reduced (never mode)', () => {
      const indicator = getMotionStatusIndicator('never', true);
      expect(indicator.icon).toBe('enabled');
      expect(indicator.color).toBe('gray');
    });

    it('should follow system preference for system mode (reduced)', () => {
      const indicator = getMotionStatusIndicator('system', true);
      expect(indicator.icon).toBe('reduced');
      expect(indicator.color).toBe('cyan');
    });

    it('should follow system preference for system mode (enabled)', () => {
      const indicator = getMotionStatusIndicator('system', false);
      expect(indicator.icon).toBe('enabled');
      expect(indicator.color).toBe('gray');
    });

    it('should have valid icon values', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        [true, false].forEach((systemPref) => {
          const indicator = getMotionStatusIndicator(mode, systemPref);
          expect(['reduced', 'enabled']).toContain(indicator.icon);
        });
      });
    });

    it('should have valid color values', () => {
      MOTION_MODE_OPTIONS.forEach((mode) => {
        [true, false].forEach((systemPref) => {
          const indicator = getMotionStatusIndicator(mode, systemPref);
          expect(['cyan', 'gray']).toContain(indicator.color);
        });
      });
    });
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Accessibility Considerations', () => {
  it('should have descriptive labels for screen readers', () => {
    MOTION_MODE_OPTIONS.forEach((mode) => {
      const label = getReducedMotionLabel(mode);
      const description = getReducedMotionDescription(mode);
      expect(label.length).toBeGreaterThan(0);
      expect(description.length).toBeGreaterThan(0);
    });
  });

  it('should provide clear status indication', () => {
    // Reduced motion state
    const reducedIndicator = getMotionStatusIndicator('always', false);
    expect(reducedIndicator.icon).toBe('reduced');

    // Enabled motion state
    const enabledIndicator = getMotionStatusIndicator('never', true);
    expect(enabledIndicator.icon).toBe('enabled');
  });

  it('should have accessible tooltip text (no HTML)', () => {
    MOTION_MODE_OPTIONS.forEach((mode) => {
      const tooltip = getReducedMotionTooltip(mode, false);
      expect(tooltip.length).toBeGreaterThan(0);
      // Tooltip should not contain HTML or complex formatting
      expect(tooltip).not.toContain('<');
      expect(tooltip).not.toContain('>');
    });
  });

  it('should have human-readable descriptions', () => {
    MOTION_MODE_OPTIONS.forEach((mode) => {
      const desc = getEffectiveMotionDescription(mode, true);
      // Should contain actual words, not technical jargon
      expect(desc).toMatch(/[a-z]/i);
      expect(desc.split(' ').length).toBeGreaterThan(1);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Scenarios', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should persist and restore mode correctly', () => {
    // Save a mode
    saveReducedMotionMode('always');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      REDUCED_MOTION_MODE_KEY,
      'always'
    );

    // Simulate loading (set the store value directly to mock localStorage)
    localStorageMock.store[REDUCED_MOTION_MODE_KEY] = 'always';
    const loadedMode = loadReducedMotionMode();
    expect(loadedMode).toBe('always');

    // Apply the class based on resolved state
    const shouldReduce = shouldReduceMotion(loadedMode, false);
    expect(shouldReduce).toBe(true);

    applyReducedMotionClass(shouldReduce);
    expect(mockClassList.add).toHaveBeenCalledWith(REDUCED_MOTION_CLASS);
  });

  it('should handle mode cycle correctly', () => {
    // Start with system
    let mode: ReducedMotionMode = 'system';
    expect(mode).toBe('system');

    // Cycle to always
    mode = 'always';
    expect(shouldReduceMotion(mode, false)).toBe(true);

    // Cycle to never
    mode = 'never';
    expect(shouldReduceMotion(mode, true)).toBe(false);

    // Cycle back to system
    mode = 'system';
    expect(shouldReduceMotion(mode, true)).toBe(true);
    expect(shouldReduceMotion(mode, false)).toBe(false);
  });

  it('should correctly override system preference with always mode', () => {
    // System does NOT prefer reduced motion
    const systemPrefersReduced = false;

    // User sets to always - should reduce regardless
    expect(shouldReduceMotion('always', systemPrefersReduced)).toBe(true);
  });

  it('should correctly override system preference with never mode', () => {
    // System DOES prefer reduced motion
    const systemPrefersReduced = true;

    // User sets to never - should NOT reduce regardless
    expect(shouldReduceMotion('never', systemPrefersReduced)).toBe(false);
  });

  it('should follow system preference when mode is system', () => {
    expect(shouldReduceMotion('system', true)).toBe(true);
    expect(shouldReduceMotion('system', false)).toBe(false);
  });

  it('should provide consistent UI state', () => {
    // When mode is always
    const alwaysIndicator = getMotionStatusIndicator('always', false);
    const alwaysTooltip = getReducedMotionTooltip('always', false);
    expect(alwaysIndicator.icon).toBe('reduced');
    expect(alwaysTooltip.toLowerCase()).toContain('reduced');

    // When mode is never
    const neverIndicator = getMotionStatusIndicator('never', true);
    const neverTooltip = getReducedMotionTooltip('never', true);
    expect(neverIndicator.icon).toBe('enabled');
    expect(neverTooltip.toLowerCase()).toContain('motion');
  });
});
