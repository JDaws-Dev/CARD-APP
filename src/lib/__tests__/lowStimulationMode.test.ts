import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type LowStimulationSettings,
  type StimulationPreset,
  DEFAULT_LOW_STIM_SETTINGS,
  STIMULATION_PRESETS,
  PRESET_INFO,
  SETTING_INFO,
  LOW_STIM_ENABLED_KEY,
  LOW_STIM_SETTINGS_KEY,
  LOW_STIM_PRESET_KEY,
  getMatchingPreset,
  getPresetSettings,
  getPresetLabel,
  getPresetDescription,
  countEnabledSettings,
  getSettingsSummary,
  saveLowStimEnabled,
  loadLowStimEnabled,
  saveLowStimSettings,
  loadLowStimSettings,
  saveLowStimPreset,
  loadLowStimPreset,
  getLowStimClasses,
  shouldShowAnimations,
  shouldShowDecorations,
  shouldPlaySounds,
} from '../lowStimulationMode';

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

describe('Low-Stimulation Mode Constants', () => {
  describe('DEFAULT_LOW_STIM_SETTINGS', () => {
    it('should have all required setting properties', () => {
      expect(DEFAULT_LOW_STIM_SETTINGS.reduceAnimations).toBeDefined();
      expect(DEFAULT_LOW_STIM_SETTINGS.mutedColors).toBeDefined();
      expect(DEFAULT_LOW_STIM_SETTINGS.disableSounds).toBeDefined();
      expect(DEFAULT_LOW_STIM_SETTINGS.simplerLayouts).toBeDefined();
      expect(DEFAULT_LOW_STIM_SETTINGS.hideDecorations).toBeDefined();
      expect(DEFAULT_LOW_STIM_SETTINGS.softerContrast).toBeDefined();
    });

    it('should have boolean values for all settings', () => {
      Object.values(DEFAULT_LOW_STIM_SETTINGS).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });

    it('should have most settings enabled by default for maximum calm', () => {
      expect(DEFAULT_LOW_STIM_SETTINGS.reduceAnimations).toBe(true);
      expect(DEFAULT_LOW_STIM_SETTINGS.mutedColors).toBe(true);
      expect(DEFAULT_LOW_STIM_SETTINGS.disableSounds).toBe(true);
      expect(DEFAULT_LOW_STIM_SETTINGS.simplerLayouts).toBe(true);
      expect(DEFAULT_LOW_STIM_SETTINGS.hideDecorations).toBe(true);
    });

    it('should have softerContrast disabled by default', () => {
      // Softer contrast is a more aggressive option that may affect usability
      expect(DEFAULT_LOW_STIM_SETTINGS.softerContrast).toBe(false);
    });
  });

  describe('STIMULATION_PRESETS', () => {
    it('should have all three presets defined', () => {
      expect(STIMULATION_PRESETS.standard).toBeDefined();
      expect(STIMULATION_PRESETS.moderate).toBeDefined();
      expect(STIMULATION_PRESETS.minimal).toBeDefined();
    });

    it('should have standard preset with all settings disabled', () => {
      const standard = STIMULATION_PRESETS.standard;
      expect(standard.reduceAnimations).toBe(false);
      expect(standard.mutedColors).toBe(false);
      expect(standard.disableSounds).toBe(false);
      expect(standard.simplerLayouts).toBe(false);
      expect(standard.hideDecorations).toBe(false);
      expect(standard.softerContrast).toBe(false);
    });

    it('should have moderate preset with animations and decorations disabled', () => {
      const moderate = STIMULATION_PRESETS.moderate;
      expect(moderate.reduceAnimations).toBe(true);
      expect(moderate.disableSounds).toBe(true);
      expect(moderate.hideDecorations).toBe(true);
      // Should keep colors
      expect(moderate.mutedColors).toBe(false);
    });

    it('should have minimal preset with most settings enabled', () => {
      const minimal = STIMULATION_PRESETS.minimal;
      expect(minimal.reduceAnimations).toBe(true);
      expect(minimal.mutedColors).toBe(true);
      expect(minimal.disableSounds).toBe(true);
      expect(minimal.simplerLayouts).toBe(true);
      expect(minimal.hideDecorations).toBe(true);
      expect(minimal.softerContrast).toBe(true);
    });

    it('should have consistent properties across all presets', () => {
      const standardKeys = Object.keys(STIMULATION_PRESETS.standard).sort();
      const moderateKeys = Object.keys(STIMULATION_PRESETS.moderate).sort();
      const minimalKeys = Object.keys(STIMULATION_PRESETS.minimal).sort();

      expect(standardKeys).toEqual(moderateKeys);
      expect(moderateKeys).toEqual(minimalKeys);
    });
  });

  describe('PRESET_INFO', () => {
    it('should have info for all presets', () => {
      expect(PRESET_INFO.standard).toBeDefined();
      expect(PRESET_INFO.moderate).toBeDefined();
      expect(PRESET_INFO.minimal).toBeDefined();
    });

    it('should have all required properties for each preset', () => {
      const presets: StimulationPreset[] = ['standard', 'moderate', 'minimal'];
      presets.forEach((preset) => {
        const info = PRESET_INFO[preset];
        expect(info.label).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.shortDescription).toBeDefined();
      });
    });

    it('should have non-empty labels', () => {
      const presets: StimulationPreset[] = ['standard', 'moderate', 'minimal'];
      presets.forEach((preset) => {
        expect(PRESET_INFO[preset].label.length).toBeGreaterThan(0);
        expect(PRESET_INFO[preset].shortDescription.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SETTING_INFO', () => {
    it('should have info for all setting keys', () => {
      const settingKeys: Array<keyof LowStimulationSettings> = [
        'reduceAnimations',
        'mutedColors',
        'disableSounds',
        'simplerLayouts',
        'hideDecorations',
        'softerContrast',
      ];

      settingKeys.forEach((key) => {
        expect(SETTING_INFO[key]).toBeDefined();
        expect(SETTING_INFO[key].label).toBeDefined();
        expect(SETTING_INFO[key].description).toBeDefined();
      });
    });

    it('should have non-empty labels and descriptions', () => {
      Object.values(SETTING_INFO).forEach((info) => {
        expect(info.label.length).toBeGreaterThan(0);
        expect(info.description.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Utility Functions', () => {
  describe('getMatchingPreset', () => {
    it('should return standard for standard settings', () => {
      expect(getMatchingPreset(STIMULATION_PRESETS.standard)).toBe('standard');
    });

    it('should return moderate for moderate settings', () => {
      expect(getMatchingPreset(STIMULATION_PRESETS.moderate)).toBe('moderate');
    });

    it('should return minimal for minimal settings', () => {
      expect(getMatchingPreset(STIMULATION_PRESETS.minimal)).toBe('minimal');
    });

    it('should return null for custom settings that do not match any preset', () => {
      const customSettings: LowStimulationSettings = {
        reduceAnimations: true,
        mutedColors: false,
        disableSounds: false,
        simplerLayouts: true,
        hideDecorations: false,
        softerContrast: false,
      };
      expect(getMatchingPreset(customSettings)).toBeNull();
    });
  });

  describe('getPresetSettings', () => {
    it('should return settings for standard preset', () => {
      const settings = getPresetSettings('standard');
      expect(settings).toEqual(STIMULATION_PRESETS.standard);
    });

    it('should return settings for moderate preset', () => {
      const settings = getPresetSettings('moderate');
      expect(settings).toEqual(STIMULATION_PRESETS.moderate);
    });

    it('should return settings for minimal preset', () => {
      const settings = getPresetSettings('minimal');
      expect(settings).toEqual(STIMULATION_PRESETS.minimal);
    });

    it('should return a copy, not the original object', () => {
      const settings = getPresetSettings('standard');
      settings.reduceAnimations = true;
      expect(STIMULATION_PRESETS.standard.reduceAnimations).toBe(false);
    });
  });

  describe('getPresetLabel', () => {
    it('should return correct labels', () => {
      expect(getPresetLabel('standard')).toBe('Standard');
      expect(getPresetLabel('moderate')).toBe('Moderate');
      expect(getPresetLabel('minimal')).toBe('Minimal');
    });
  });

  describe('getPresetDescription', () => {
    it('should return non-empty descriptions', () => {
      expect(getPresetDescription('standard').length).toBeGreaterThan(0);
      expect(getPresetDescription('moderate').length).toBeGreaterThan(0);
      expect(getPresetDescription('minimal').length).toBeGreaterThan(0);
    });
  });

  describe('countEnabledSettings', () => {
    it('should return 0 for standard preset', () => {
      expect(countEnabledSettings(STIMULATION_PRESETS.standard)).toBe(0);
    });

    it('should return correct count for moderate preset', () => {
      // moderate has: reduceAnimations, disableSounds, hideDecorations
      expect(countEnabledSettings(STIMULATION_PRESETS.moderate)).toBe(3);
    });

    it('should return correct count for minimal preset', () => {
      // minimal has all 6 settings enabled
      expect(countEnabledSettings(STIMULATION_PRESETS.minimal)).toBe(6);
    });

    it('should count custom settings correctly', () => {
      const custom: LowStimulationSettings = {
        reduceAnimations: true,
        mutedColors: true,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: true,
        softerContrast: false,
      };
      expect(countEnabledSettings(custom)).toBe(3);
    });
  });

  describe('getSettingsSummary', () => {
    it('should return "Standard mode" for no settings enabled', () => {
      expect(getSettingsSummary(STIMULATION_PRESETS.standard)).toBe('Standard mode');
    });

    it('should return "All calm settings enabled" for all settings enabled', () => {
      const allEnabled: LowStimulationSettings = {
        reduceAnimations: true,
        mutedColors: true,
        disableSounds: true,
        simplerLayouts: true,
        hideDecorations: true,
        softerContrast: true,
      };
      expect(getSettingsSummary(allEnabled)).toBe('All calm settings enabled');
    });

    it('should list settings for small number enabled', () => {
      const twoEnabled: LowStimulationSettings = {
        reduceAnimations: true,
        mutedColors: true,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: false,
        softerContrast: false,
      };
      const summary = getSettingsSummary(twoEnabled);
      expect(summary).toContain('and');
    });

    it('should show count for many settings enabled', () => {
      const summary = getSettingsSummary(STIMULATION_PRESETS.moderate);
      expect(summary).toContain('3 settings enabled');
    });
  });
});

describe('Persistence Functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveLowStimEnabled / loadLowStimEnabled', () => {
    it('should save and load enabled state as true', () => {
      saveLowStimEnabled(true);
      expect(loadLowStimEnabled()).toBe(true);
    });

    it('should save and load enabled state as false', () => {
      saveLowStimEnabled(false);
      expect(loadLowStimEnabled()).toBe(false);
    });

    it('should return false for unset value', () => {
      expect(loadLowStimEnabled()).toBe(false);
    });

    it('should use the correct localStorage key', () => {
      saveLowStimEnabled(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(LOW_STIM_ENABLED_KEY, 'true');
    });
  });

  describe('saveLowStimSettings / loadLowStimSettings', () => {
    it('should save and load settings correctly', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: true,
        mutedColors: true,
        disableSounds: false,
        simplerLayouts: true,
        hideDecorations: false,
        softerContrast: true,
      };
      saveLowStimSettings(settings);
      expect(loadLowStimSettings()).toEqual(settings);
    });

    it('should return default settings for unset value', () => {
      expect(loadLowStimSettings()).toEqual(DEFAULT_LOW_STIM_SETTINGS);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem(LOW_STIM_SETTINGS_KEY, 'not valid json');
      expect(loadLowStimSettings()).toEqual(DEFAULT_LOW_STIM_SETTINGS);
    });

    it('should merge with defaults for partial saved settings', () => {
      localStorage.setItem(
        LOW_STIM_SETTINGS_KEY,
        JSON.stringify({ reduceAnimations: false })
      );
      const loaded = loadLowStimSettings();
      expect(loaded.reduceAnimations).toBe(false);
      // Other values should be defaults
      expect(loaded.mutedColors).toBe(DEFAULT_LOW_STIM_SETTINGS.mutedColors);
    });
  });

  describe('saveLowStimPreset / loadLowStimPreset', () => {
    it('should save and load preset correctly', () => {
      saveLowStimPreset('moderate');
      expect(loadLowStimPreset()).toBe('moderate');
    });

    it('should return standard for unset value', () => {
      expect(loadLowStimPreset()).toBe('standard');
    });

    it('should return standard for invalid preset value', () => {
      localStorage.setItem(LOW_STIM_PRESET_KEY, 'invalid');
      expect(loadLowStimPreset()).toBe('standard');
    });

    it('should use the correct localStorage key', () => {
      saveLowStimPreset('minimal');
      expect(localStorage.setItem).toHaveBeenCalledWith(LOW_STIM_PRESET_KEY, 'minimal');
    });
  });
});

describe('CSS Class Helpers', () => {
  describe('getLowStimClasses', () => {
    it('should return empty array when disabled', () => {
      expect(getLowStimClasses(false, DEFAULT_LOW_STIM_SETTINGS)).toEqual([]);
    });

    it('should return base class when enabled', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: false,
        mutedColors: false,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: false,
        softerContrast: false,
      };
      const classes = getLowStimClasses(true, settings);
      expect(classes).toContain('low-stim');
    });

    it('should return animation class when animations are reduced', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: true,
        mutedColors: false,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: false,
        softerContrast: false,
      };
      const classes = getLowStimClasses(true, settings);
      expect(classes).toContain('low-stim-no-animations');
    });

    it('should return muted class when colors are muted', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: false,
        mutedColors: true,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: false,
        softerContrast: false,
      };
      const classes = getLowStimClasses(true, settings);
      expect(classes).toContain('low-stim-muted');
    });

    it('should return simple class when layouts are simplified', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: false,
        mutedColors: false,
        disableSounds: false,
        simplerLayouts: true,
        hideDecorations: false,
        softerContrast: false,
      };
      const classes = getLowStimClasses(true, settings);
      expect(classes).toContain('low-stim-simple');
    });

    it('should return no-decorations class when decorations are hidden', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: false,
        mutedColors: false,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: true,
        softerContrast: false,
      };
      const classes = getLowStimClasses(true, settings);
      expect(classes).toContain('low-stim-no-decorations');
    });

    it('should return soft-contrast class when contrast is softened', () => {
      const settings: LowStimulationSettings = {
        reduceAnimations: false,
        mutedColors: false,
        disableSounds: false,
        simplerLayouts: false,
        hideDecorations: false,
        softerContrast: true,
      };
      const classes = getLowStimClasses(true, settings);
      expect(classes).toContain('low-stim-soft-contrast');
    });

    it('should return all classes for minimal preset', () => {
      const classes = getLowStimClasses(true, STIMULATION_PRESETS.minimal);
      expect(classes).toContain('low-stim');
      expect(classes).toContain('low-stim-no-animations');
      expect(classes).toContain('low-stim-muted');
      expect(classes).toContain('low-stim-simple');
      expect(classes).toContain('low-stim-no-decorations');
      expect(classes).toContain('low-stim-soft-contrast');
    });
  });

  describe('Convenience Check Functions', () => {
    describe('shouldShowAnimations', () => {
      it('should return true when mode is disabled', () => {
        expect(shouldShowAnimations(false, DEFAULT_LOW_STIM_SETTINGS)).toBe(true);
      });

      it('should return true when enabled but animations not reduced', () => {
        const settings: LowStimulationSettings = {
          ...DEFAULT_LOW_STIM_SETTINGS,
          reduceAnimations: false,
        };
        expect(shouldShowAnimations(true, settings)).toBe(true);
      });

      it('should return false when enabled and animations reduced', () => {
        const settings: LowStimulationSettings = {
          ...DEFAULT_LOW_STIM_SETTINGS,
          reduceAnimations: true,
        };
        expect(shouldShowAnimations(true, settings)).toBe(false);
      });
    });

    describe('shouldShowDecorations', () => {
      it('should return true when mode is disabled', () => {
        expect(shouldShowDecorations(false, DEFAULT_LOW_STIM_SETTINGS)).toBe(true);
      });

      it('should return true when enabled but decorations not hidden', () => {
        const settings: LowStimulationSettings = {
          ...DEFAULT_LOW_STIM_SETTINGS,
          hideDecorations: false,
        };
        expect(shouldShowDecorations(true, settings)).toBe(true);
      });

      it('should return false when enabled and decorations hidden', () => {
        const settings: LowStimulationSettings = {
          ...DEFAULT_LOW_STIM_SETTINGS,
          hideDecorations: true,
        };
        expect(shouldShowDecorations(true, settings)).toBe(false);
      });
    });

    describe('shouldPlaySounds', () => {
      it('should return true when mode is disabled', () => {
        expect(shouldPlaySounds(false, DEFAULT_LOW_STIM_SETTINGS)).toBe(true);
      });

      it('should return true when enabled but sounds not disabled', () => {
        const settings: LowStimulationSettings = {
          ...DEFAULT_LOW_STIM_SETTINGS,
          disableSounds: false,
        };
        expect(shouldPlaySounds(true, settings)).toBe(true);
      });

      it('should return false when enabled and sounds disabled', () => {
        const settings: LowStimulationSettings = {
          ...DEFAULT_LOW_STIM_SETTINGS,
          disableSounds: true,
        };
        expect(shouldPlaySounds(true, settings)).toBe(false);
      });
    });
  });
});

describe('Accessibility Considerations', () => {
  it('should provide features that reduce sensory overload', () => {
    const minimal = STIMULATION_PRESETS.minimal;
    // All these should be enabled for maximum sensory reduction
    expect(minimal.reduceAnimations).toBe(true);
    expect(minimal.mutedColors).toBe(true);
    expect(minimal.disableSounds).toBe(true);
    expect(minimal.hideDecorations).toBe(true);
  });

  it('should provide a moderate option for users who want some reduction', () => {
    const moderate = STIMULATION_PRESETS.moderate;
    // Moderate reduces animations and sounds but keeps colors
    expect(moderate.reduceAnimations).toBe(true);
    expect(moderate.disableSounds).toBe(true);
    expect(moderate.mutedColors).toBe(false);
  });

  it('should have clear labeling for each setting', () => {
    // All settings should have clear, non-technical labels
    Object.values(SETTING_INFO).forEach((info) => {
      expect(info.label).not.toContain('CSS');
      expect(info.label).not.toContain('DOM');
      expect(info.label).not.toContain('JavaScript');
    });
  });

  it('should have user-friendly preset names', () => {
    expect(PRESET_INFO.standard.label).toBe('Standard');
    expect(PRESET_INFO.moderate.label).toBe('Moderate');
    expect(PRESET_INFO.minimal.label).toBe('Minimal');
  });
});
