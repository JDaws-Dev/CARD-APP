import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type FocusModeSettings,
  type FocusModePreset,
  DEFAULT_FOCUS_MODE_SETTINGS,
  FOCUS_MODE_PRESETS,
  FOCUS_MODE_PRESET_INFO,
  FOCUS_MODE_SETTING_INFO,
  HIDDEN_GAMIFICATION_ELEMENTS,
  FOCUS_MODE_ENABLED_KEY,
  FOCUS_MODE_SETTINGS_KEY,
  FOCUS_MODE_PRESET_KEY,
  FOCUS_MODE_CSS_CLASS,
  FOCUS_MODE_HIDE_CLASS,
  FOCUS_MODE_SHOW_CLASS,
  getMatchingFocusModePreset,
  getFocusModePresetSettings,
  getFocusModePresetLabel,
  getFocusModePresetDescription,
  countHiddenSettings,
  getFocusModeSettingsSummary,
  isFocusModeEffectivelyEnabled,
  saveFocusModeEnabled,
  loadFocusModeEnabled,
  saveFocusModeSettings,
  loadFocusModeSettings,
  saveFocusModePreset,
  loadFocusModePreset,
  applyFocusModeClasses,
  isFocusModeClassApplied,
  getFocusModeLabel,
  getFocusModeDescription,
  getFocusModeTooltip,
  getFocusModeAriaLabel,
} from '../focusMode';

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

// Mock document for CSS class tests
const documentMock = {
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
    },
  },
};

Object.defineProperty(global, 'document', {
  value: documentMock,
});

describe('Focus Mode Constants', () => {
  describe('DEFAULT_FOCUS_MODE_SETTINGS', () => {
    it('should have all required setting properties', () => {
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideStreaks).toBeDefined();
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideLevels).toBeDefined();
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideAchievements).toBeDefined();
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideMilestones).toBeDefined();
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideCompletionCelebrations).toBeDefined();
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideProgressBars).toBeDefined();
    });

    it('should have boolean values for all settings', () => {
      Object.values(DEFAULT_FOCUS_MODE_SETTINGS).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });

    it('should have all settings enabled by default for full focus', () => {
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideStreaks).toBe(true);
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideLevels).toBe(true);
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideAchievements).toBe(true);
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideMilestones).toBe(true);
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideCompletionCelebrations).toBe(true);
      expect(DEFAULT_FOCUS_MODE_SETTINGS.hideProgressBars).toBe(true);
    });
  });

  describe('FOCUS_MODE_PRESETS', () => {
    it('should have all three presets defined', () => {
      expect(FOCUS_MODE_PRESETS.off).toBeDefined();
      expect(FOCUS_MODE_PRESETS.minimal).toBeDefined();
      expect(FOCUS_MODE_PRESETS.full).toBeDefined();
    });

    it('should have off preset with all settings disabled', () => {
      const off = FOCUS_MODE_PRESETS.off;
      expect(off.hideStreaks).toBe(false);
      expect(off.hideLevels).toBe(false);
      expect(off.hideAchievements).toBe(false);
      expect(off.hideMilestones).toBe(false);
      expect(off.hideCompletionCelebrations).toBe(false);
      expect(off.hideProgressBars).toBe(false);
    });

    it('should have minimal preset with header elements hidden', () => {
      const minimal = FOCUS_MODE_PRESETS.minimal;
      expect(minimal.hideStreaks).toBe(true);
      expect(minimal.hideLevels).toBe(true);
      expect(minimal.hideAchievements).toBe(false);
      expect(minimal.hideMilestones).toBe(true);
      expect(minimal.hideCompletionCelebrations).toBe(false);
      expect(minimal.hideProgressBars).toBe(false);
    });

    it('should have full preset with all settings enabled', () => {
      const full = FOCUS_MODE_PRESETS.full;
      expect(full.hideStreaks).toBe(true);
      expect(full.hideLevels).toBe(true);
      expect(full.hideAchievements).toBe(true);
      expect(full.hideMilestones).toBe(true);
      expect(full.hideCompletionCelebrations).toBe(true);
      expect(full.hideProgressBars).toBe(true);
    });
  });

  describe('FOCUS_MODE_PRESET_INFO', () => {
    it('should have info for all presets', () => {
      expect(FOCUS_MODE_PRESET_INFO.off).toBeDefined();
      expect(FOCUS_MODE_PRESET_INFO.minimal).toBeDefined();
      expect(FOCUS_MODE_PRESET_INFO.full).toBeDefined();
    });

    it('should have label, description, and shortDescription for each preset', () => {
      (['off', 'minimal', 'full'] as FocusModePreset[]).forEach((preset) => {
        const info = FOCUS_MODE_PRESET_INFO[preset];
        expect(info.label).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.shortDescription).toBeDefined();
        expect(typeof info.label).toBe('string');
        expect(typeof info.description).toBe('string');
        expect(typeof info.shortDescription).toBe('string');
      });
    });
  });

  describe('FOCUS_MODE_SETTING_INFO', () => {
    it('should have info for all settings', () => {
      expect(FOCUS_MODE_SETTING_INFO.hideStreaks).toBeDefined();
      expect(FOCUS_MODE_SETTING_INFO.hideLevels).toBeDefined();
      expect(FOCUS_MODE_SETTING_INFO.hideAchievements).toBeDefined();
      expect(FOCUS_MODE_SETTING_INFO.hideMilestones).toBeDefined();
      expect(FOCUS_MODE_SETTING_INFO.hideCompletionCelebrations).toBeDefined();
      expect(FOCUS_MODE_SETTING_INFO.hideProgressBars).toBeDefined();
    });

    it('should have label and description for each setting', () => {
      Object.values(FOCUS_MODE_SETTING_INFO).forEach((info) => {
        expect(info.label).toBeDefined();
        expect(info.description).toBeDefined();
        expect(typeof info.label).toBe('string');
        expect(typeof info.description).toBe('string');
      });
    });
  });

  describe('HIDDEN_GAMIFICATION_ELEMENTS', () => {
    it('should list all gamification elements that are hidden', () => {
      expect(HIDDEN_GAMIFICATION_ELEMENTS.length).toBeGreaterThan(0);
      expect(HIDDEN_GAMIFICATION_ELEMENTS).toContain('Streak counters');
      expect(HIDDEN_GAMIFICATION_ELEMENTS).toContain('Level & XP displays');
      expect(HIDDEN_GAMIFICATION_ELEMENTS).toContain('Achievement badges');
    });
  });

  describe('CSS Class Constants', () => {
    it('should have focus mode CSS class defined', () => {
      expect(FOCUS_MODE_CSS_CLASS).toBe('focus-mode');
    });

    it('should have hide class defined', () => {
      expect(FOCUS_MODE_HIDE_CLASS).toBe('hide-in-focus-mode');
    });

    it('should have show class defined', () => {
      expect(FOCUS_MODE_SHOW_CLASS).toBe('show-in-focus-mode');
    });
  });

  describe('localStorage Keys', () => {
    it('should have enabled key defined', () => {
      expect(FOCUS_MODE_ENABLED_KEY).toBe('carddex_focus_mode_enabled');
    });

    it('should have settings key defined', () => {
      expect(FOCUS_MODE_SETTINGS_KEY).toBe('carddex_focus_mode_settings');
    });

    it('should have preset key defined', () => {
      expect(FOCUS_MODE_PRESET_KEY).toBe('carddex_focus_mode_preset');
    });
  });
});

describe('Focus Mode Utility Functions', () => {
  describe('getMatchingFocusModePreset', () => {
    it('should return off for all settings disabled', () => {
      expect(getMatchingFocusModePreset(FOCUS_MODE_PRESETS.off)).toBe('off');
    });

    it('should return minimal for minimal preset settings', () => {
      expect(getMatchingFocusModePreset(FOCUS_MODE_PRESETS.minimal)).toBe('minimal');
    });

    it('should return full for all settings enabled', () => {
      expect(getMatchingFocusModePreset(FOCUS_MODE_PRESETS.full)).toBe('full');
    });

    it('should return null for custom settings that do not match a preset', () => {
      const customSettings: FocusModeSettings = {
        hideStreaks: true,
        hideLevels: false,
        hideAchievements: true,
        hideMilestones: false,
        hideCompletionCelebrations: true,
        hideProgressBars: false,
      };
      expect(getMatchingFocusModePreset(customSettings)).toBeNull();
    });
  });

  describe('getFocusModePresetSettings', () => {
    it('should return settings for off preset', () => {
      const settings = getFocusModePresetSettings('off');
      expect(settings.hideStreaks).toBe(false);
    });

    it('should return settings for full preset', () => {
      const settings = getFocusModePresetSettings('full');
      expect(settings.hideStreaks).toBe(true);
    });

    it('should return a copy of the settings (not the original)', () => {
      const settings = getFocusModePresetSettings('full');
      settings.hideStreaks = false;
      expect(FOCUS_MODE_PRESETS.full.hideStreaks).toBe(true);
    });
  });

  describe('getFocusModePresetLabel', () => {
    it('should return correct label for each preset', () => {
      expect(getFocusModePresetLabel('off')).toBe('Off');
      expect(getFocusModePresetLabel('minimal')).toBe('Minimal');
      expect(getFocusModePresetLabel('full')).toBe('Full Focus');
    });
  });

  describe('getFocusModePresetDescription', () => {
    it('should return non-empty description for each preset', () => {
      expect(getFocusModePresetDescription('off').length).toBeGreaterThan(0);
      expect(getFocusModePresetDescription('minimal').length).toBeGreaterThan(0);
      expect(getFocusModePresetDescription('full').length).toBeGreaterThan(0);
    });
  });

  describe('countHiddenSettings', () => {
    it('should return 0 for off preset', () => {
      expect(countHiddenSettings(FOCUS_MODE_PRESETS.off)).toBe(0);
    });

    it('should return correct count for minimal preset', () => {
      const count = countHiddenSettings(FOCUS_MODE_PRESETS.minimal);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(6);
    });

    it('should return 6 for full preset', () => {
      expect(countHiddenSettings(FOCUS_MODE_PRESETS.full)).toBe(6);
    });
  });

  describe('getFocusModeSettingsSummary', () => {
    it('should return "All features visible" for off preset', () => {
      expect(getFocusModeSettingsSummary(FOCUS_MODE_PRESETS.off)).toBe('All features visible');
    });

    it('should return "All gamification hidden" for full preset', () => {
      expect(getFocusModeSettingsSummary(FOCUS_MODE_PRESETS.full)).toBe('All gamification hidden');
    });

    it('should return summary with count for partial settings', () => {
      const summary = getFocusModeSettingsSummary(FOCUS_MODE_PRESETS.minimal);
      expect(summary).toContain('hidden');
    });
  });

  describe('isFocusModeEffectivelyEnabled', () => {
    it('should return false when all settings are false', () => {
      expect(isFocusModeEffectivelyEnabled(FOCUS_MODE_PRESETS.off)).toBe(false);
    });

    it('should return true when any setting is true', () => {
      const settings: FocusModeSettings = {
        ...FOCUS_MODE_PRESETS.off,
        hideStreaks: true,
      };
      expect(isFocusModeEffectivelyEnabled(settings)).toBe(true);
    });
  });
});

describe('Focus Mode Persistence Functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveFocusModeEnabled / loadFocusModeEnabled', () => {
    it('should save and load enabled state as true', () => {
      saveFocusModeEnabled(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(FOCUS_MODE_ENABLED_KEY, 'true');
      expect(loadFocusModeEnabled()).toBe(true);
    });

    it('should save and load enabled state as false', () => {
      saveFocusModeEnabled(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(FOCUS_MODE_ENABLED_KEY, 'false');
    });

    it('should return false when nothing is saved', () => {
      expect(loadFocusModeEnabled()).toBe(false);
    });
  });

  describe('saveFocusModeSettings / loadFocusModeSettings', () => {
    it('should save and load settings', () => {
      saveFocusModeSettings(FOCUS_MODE_PRESETS.full);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should return off preset when nothing is saved', () => {
      const settings = loadFocusModeSettings();
      expect(settings.hideStreaks).toBe(false);
      expect(settings.hideLevels).toBe(false);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');
      const settings = loadFocusModeSettings();
      expect(settings).toEqual(FOCUS_MODE_PRESETS.off);
    });
  });

  describe('saveFocusModePreset / loadFocusModePreset', () => {
    it('should save and load preset', () => {
      saveFocusModePreset('full');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(FOCUS_MODE_PRESET_KEY, 'full');
    });

    it('should return off when nothing is saved', () => {
      expect(loadFocusModePreset()).toBe('off');
    });

    it('should return off for invalid preset value', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid');
      expect(loadFocusModePreset()).toBe('off');
    });
  });
});

describe('Focus Mode CSS Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('applyFocusModeClasses', () => {
    it('should add focus-mode class when enabled', () => {
      applyFocusModeClasses(true);
      expect(documentMock.documentElement.classList.add).toHaveBeenCalledWith(FOCUS_MODE_CSS_CLASS);
    });

    it('should remove focus-mode class when disabled', () => {
      applyFocusModeClasses(false);
      expect(documentMock.documentElement.classList.remove).toHaveBeenCalledWith(
        FOCUS_MODE_CSS_CLASS
      );
    });
  });

  describe('isFocusModeClassApplied', () => {
    it('should check if focus-mode class is applied', () => {
      isFocusModeClassApplied();
      expect(documentMock.documentElement.classList.contains).toHaveBeenCalledWith(
        FOCUS_MODE_CSS_CLASS
      );
    });
  });
});

describe('Focus Mode Display Helpers', () => {
  describe('getFocusModeLabel', () => {
    it('should return correct label for enabled state', () => {
      expect(getFocusModeLabel(true)).toBe('Focus mode on');
    });

    it('should return correct label for disabled state', () => {
      expect(getFocusModeLabel(false)).toBe('Focus mode');
    });
  });

  describe('getFocusModeDescription', () => {
    it('should return description mentioning hidden when enabled', () => {
      expect(getFocusModeDescription(true)).toContain('hidden');
    });

    it('should return description mentioning features when disabled', () => {
      expect(getFocusModeDescription(false)).toContain('gamification');
    });
  });

  describe('getFocusModeTooltip', () => {
    it('should indicate enabled state in tooltip', () => {
      expect(getFocusModeTooltip(true)).toContain('on');
    });

    it('should indicate what focus mode does in tooltip', () => {
      expect(getFocusModeTooltip(false)).toContain('gamification');
    });
  });

  describe('getFocusModeAriaLabel', () => {
    it('should provide accessible label for enabled state', () => {
      const label = getFocusModeAriaLabel(true);
      expect(label).toContain('Disable');
      expect(label.length).toBeGreaterThan(10);
    });

    it('should provide accessible label for disabled state', () => {
      const label = getFocusModeAriaLabel(false);
      expect(label).toContain('Enable');
      expect(label.length).toBeGreaterThan(10);
    });
  });
});

describe('Focus Mode Accessibility Considerations', () => {
  it('should have meaningful descriptions for screen readers', () => {
    // All presets should have user-friendly descriptions
    (['off', 'minimal', 'full'] as FocusModePreset[]).forEach((preset) => {
      const info = FOCUS_MODE_PRESET_INFO[preset];
      expect(info.description.length).toBeGreaterThan(20);
      expect(info.shortDescription.length).toBeGreaterThan(5);
    });
  });

  it('should have descriptive setting labels', () => {
    Object.values(FOCUS_MODE_SETTING_INFO).forEach((info) => {
      expect(info.label.length).toBeGreaterThan(3);
      expect(info.description.length).toBeGreaterThan(10);
    });
  });

  it('should list hidden elements for user awareness', () => {
    // Users should know what gets hidden
    expect(HIDDEN_GAMIFICATION_ELEMENTS.length).toBeGreaterThanOrEqual(5);
    HIDDEN_GAMIFICATION_ELEMENTS.forEach((element) => {
      expect(typeof element).toBe('string');
      expect(element.length).toBeGreaterThan(3);
    });
  });
});

describe('Focus Mode Integration Scenarios', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should support complete flow: save preset, load, and apply classes', () => {
    // Save full focus mode
    saveFocusModePreset('full');
    saveFocusModeEnabled(true);
    saveFocusModeSettings(FOCUS_MODE_PRESETS.full);

    // Load and verify
    expect(loadFocusModePreset()).toBe('full');
    expect(loadFocusModeEnabled()).toBe(true);

    // Apply classes
    applyFocusModeClasses(true);
    expect(documentMock.documentElement.classList.add).toHaveBeenCalledWith(FOCUS_MODE_CSS_CLASS);
  });

  it('should support disabling focus mode completely', () => {
    // Start with focus mode enabled
    saveFocusModeEnabled(true);
    saveFocusModePreset('full');

    // Disable
    saveFocusModeEnabled(false);
    saveFocusModePreset('off');

    // Verify
    expect(loadFocusModePreset()).toBe('off');
    expect(loadFocusModeEnabled()).toBe(false);

    // Apply classes
    applyFocusModeClasses(false);
    expect(documentMock.documentElement.classList.remove).toHaveBeenCalledWith(
      FOCUS_MODE_CSS_CLASS
    );
  });

  it('should handle custom settings that do not match a preset', () => {
    const customSettings: FocusModeSettings = {
      hideStreaks: true,
      hideLevels: false,
      hideAchievements: true,
      hideMilestones: false,
      hideCompletionCelebrations: false,
      hideProgressBars: true,
    };

    saveFocusModeSettings(customSettings);

    const preset = getMatchingFocusModePreset(customSettings);
    expect(preset).toBeNull();

    // Even with no matching preset, focus mode should be effectively enabled
    expect(isFocusModeEffectivelyEnabled(customSettings)).toBe(true);
    expect(countHiddenSettings(customSettings)).toBe(3);
  });
});
