import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DYSLEXIC_FONT_ENABLED_KEY,
  DYSLEXIC_FONT_CLASS,
  DYSLEXIC_FONT_INFO,
  saveDyslexicFontEnabled,
  loadDyslexicFontEnabled,
  applyDyslexicFontClass,
  isDyslexicFontApplied,
  getDyslexicFontLabel,
  getDyslexicFontDescription,
  getDyslexicFontTooltip,
} from '../dyslexicFont';

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

describe('Dyslexic Font Constants', () => {
  describe('DYSLEXIC_FONT_ENABLED_KEY', () => {
    it('should be a non-empty string', () => {
      expect(DYSLEXIC_FONT_ENABLED_KEY).toBeDefined();
      expect(typeof DYSLEXIC_FONT_ENABLED_KEY).toBe('string');
      expect(DYSLEXIC_FONT_ENABLED_KEY.length).toBeGreaterThan(0);
    });

    it('should contain carddex identifier', () => {
      expect(DYSLEXIC_FONT_ENABLED_KEY).toContain('carddex');
    });
  });

  describe('DYSLEXIC_FONT_CLASS', () => {
    it('should be a valid CSS class name', () => {
      expect(DYSLEXIC_FONT_CLASS).toBeDefined();
      expect(typeof DYSLEXIC_FONT_CLASS).toBe('string');
      // CSS class names should not contain spaces
      expect(DYSLEXIC_FONT_CLASS).not.toContain(' ');
    });

    it('should be dyslexic-font', () => {
      expect(DYSLEXIC_FONT_CLASS).toBe('dyslexic-font');
    });
  });

  describe('DYSLEXIC_FONT_INFO', () => {
    it('should have all required properties', () => {
      expect(DYSLEXIC_FONT_INFO.name).toBeDefined();
      expect(DYSLEXIC_FONT_INFO.description).toBeDefined();
      expect(DYSLEXIC_FONT_INFO.shortDescription).toBeDefined();
      expect(DYSLEXIC_FONT_INFO.benefits).toBeDefined();
      expect(DYSLEXIC_FONT_INFO.source).toBeDefined();
    });

    it('should have non-empty name', () => {
      expect(DYSLEXIC_FONT_INFO.name.length).toBeGreaterThan(0);
    });

    it('should have benefits array with items', () => {
      expect(Array.isArray(DYSLEXIC_FONT_INFO.benefits)).toBe(true);
      expect(DYSLEXIC_FONT_INFO.benefits.length).toBeGreaterThan(0);
    });

    it('should have valid source URL', () => {
      expect(DYSLEXIC_FONT_INFO.source).toMatch(/^https?:\/\//);
    });

    it('should have description explaining the font purpose', () => {
      expect(DYSLEXIC_FONT_INFO.description.length).toBeGreaterThan(20);
    });
  });
});

describe('Persistence Functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveDyslexicFontEnabled / loadDyslexicFontEnabled', () => {
    it('should save and load enabled state as true', () => {
      saveDyslexicFontEnabled(true);
      expect(loadDyslexicFontEnabled()).toBe(true);
    });

    it('should save and load enabled state as false', () => {
      saveDyslexicFontEnabled(false);
      expect(loadDyslexicFontEnabled()).toBe(false);
    });

    it('should return false for unset value', () => {
      expect(loadDyslexicFontEnabled()).toBe(false);
    });

    it('should use the correct localStorage key', () => {
      saveDyslexicFontEnabled(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(DYSLEXIC_FONT_ENABLED_KEY, 'true');
    });

    it('should load using the correct localStorage key', () => {
      loadDyslexicFontEnabled();
      expect(localStorage.getItem).toHaveBeenCalledWith(DYSLEXIC_FONT_ENABLED_KEY);
    });

    it('should handle invalid stored value gracefully', () => {
      localStorage.setItem(DYSLEXIC_FONT_ENABLED_KEY, 'invalid');
      expect(loadDyslexicFontEnabled()).toBe(false);
    });

    it('should handle localStorage errors gracefully in save', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => saveDyslexicFontEnabled(true)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage errors gracefully in load', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Access denied');
      });

      // Should return false and not throw
      expect(loadDyslexicFontEnabled()).toBe(false);

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

  describe('applyDyslexicFontClass', () => {
    it('should add class when enabled', () => {
      applyDyslexicFontClass(true);
      expect(mockClassList.add).toHaveBeenCalledWith(DYSLEXIC_FONT_CLASS);
    });

    it('should remove class when disabled', () => {
      applyDyslexicFontClass(false);
      expect(mockClassList.remove).toHaveBeenCalledWith(DYSLEXIC_FONT_CLASS);
    });

    it('should not call add when disabled', () => {
      applyDyslexicFontClass(false);
      expect(mockClassList.add).not.toHaveBeenCalled();
    });

    it('should not call remove when enabled', () => {
      applyDyslexicFontClass(true);
      expect(mockClassList.remove).not.toHaveBeenCalled();
    });
  });

  describe('isDyslexicFontApplied', () => {
    it('should return true when class is present', () => {
      mockClassList.contains.mockReturnValue(true);
      expect(isDyslexicFontApplied()).toBe(true);
    });

    it('should return false when class is not present', () => {
      mockClassList.contains.mockReturnValue(false);
      expect(isDyslexicFontApplied()).toBe(false);
    });

    it('should check for the correct class', () => {
      isDyslexicFontApplied();
      expect(mockClassList.contains).toHaveBeenCalledWith(DYSLEXIC_FONT_CLASS);
    });
  });
});

describe('Display Helpers', () => {
  describe('getDyslexicFontLabel', () => {
    it('should return OpenDyslexic On when enabled', () => {
      expect(getDyslexicFontLabel(true)).toBe('OpenDyslexic On');
    });

    it('should return Standard Font when disabled', () => {
      expect(getDyslexicFontLabel(false)).toBe('Standard Font');
    });

    it('should return non-empty strings', () => {
      expect(getDyslexicFontLabel(true).length).toBeGreaterThan(0);
      expect(getDyslexicFontLabel(false).length).toBeGreaterThan(0);
    });
  });

  describe('getDyslexicFontDescription', () => {
    it('should mention OpenDyslexic when enabled', () => {
      expect(getDyslexicFontDescription(true).toLowerCase()).toContain('opendyslexic');
    });

    it('should mention standard font when disabled', () => {
      expect(getDyslexicFontDescription(false).toLowerCase()).toContain('standard');
    });

    it('should return different descriptions for each state', () => {
      expect(getDyslexicFontDescription(true)).not.toBe(getDyslexicFontDescription(false));
    });
  });

  describe('getDyslexicFontTooltip', () => {
    it('should provide toggle guidance when enabled', () => {
      const tooltip = getDyslexicFontTooltip(true);
      expect(tooltip.toLowerCase()).toContain('standard');
    });

    it('should provide toggle guidance when disabled', () => {
      const tooltip = getDyslexicFontTooltip(false);
      expect(tooltip.toLowerCase()).toContain('dyslexia');
    });

    it('should suggest action on click', () => {
      const enabledTooltip = getDyslexicFontTooltip(true);
      const disabledTooltip = getDyslexicFontTooltip(false);

      expect(enabledTooltip.toLowerCase()).toContain('click');
      expect(disabledTooltip.toLowerCase()).toContain('click');
    });

    it('should return different tooltips for each state', () => {
      expect(getDyslexicFontTooltip(true)).not.toBe(getDyslexicFontTooltip(false));
    });
  });
});

describe('Accessibility Considerations', () => {
  it('should have user-friendly font name', () => {
    expect(DYSLEXIC_FONT_INFO.name).toBe('OpenDyslexic');
  });

  it('should have benefits that explain the font features', () => {
    const benefitsText = DYSLEXIC_FONT_INFO.benefits.join(' ').toLowerCase();

    // Should mention key features
    expect(benefitsText).toContain('weighted');
    expect(benefitsText).toContain('letter');
    expect(benefitsText).toContain('readability');
  });

  it('should have a concise short description', () => {
    // Short description should be brief (under 50 chars)
    expect(DYSLEXIC_FONT_INFO.shortDescription.length).toBeLessThan(50);
  });

  it('should provide clear state labels', () => {
    // Labels should clearly indicate state
    const enabledLabel = getDyslexicFontLabel(true);
    const disabledLabel = getDyslexicFontLabel(false);

    expect(enabledLabel.toLowerCase()).toContain('on');
    expect(disabledLabel.toLowerCase()).toContain('standard');
  });
});

describe('Integration Considerations', () => {
  it('should use consistent naming for localStorage key', () => {
    // Key should follow the carddex_ prefix pattern used by other settings
    expect(DYSLEXIC_FONT_ENABLED_KEY).toMatch(/^carddex_/);
  });

  it('should use consistent CSS class naming', () => {
    // Class should be lowercase with hyphens
    expect(DYSLEXIC_FONT_CLASS).toMatch(/^[a-z][a-z-]*$/);
  });

  it('should persist state correctly through save/load cycle', () => {
    localStorageMock.clear();

    // Initially false
    expect(loadDyslexicFontEnabled()).toBe(false);

    // Save true
    saveDyslexicFontEnabled(true);
    expect(loadDyslexicFontEnabled()).toBe(true);

    // Save false
    saveDyslexicFontEnabled(false);
    expect(loadDyslexicFontEnabled()).toBe(false);
  });
});
