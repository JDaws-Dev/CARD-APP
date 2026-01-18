import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { looksLikeEmailPrefix, getDisplayName, getFirstName } from '../displayName';

// Mock the localStorage and loadOnboardingProgress
vi.mock('../onboardingFlow', () => ({
  loadOnboardingProgress: vi.fn(),
}));

import { loadOnboardingProgress } from '../onboardingFlow';

describe('looksLikeEmailPrefix', () => {
  describe('returns true for email-like patterns', () => {
    it('returns true for null', () => {
      expect(looksLikeEmailPrefix(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(looksLikeEmailPrefix(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(looksLikeEmailPrefix('')).toBe(true);
    });

    it('returns true for whitespace only', () => {
      expect(looksLikeEmailPrefix('   ')).toBe(true);
    });

    it('returns true for single character', () => {
      expect(looksLikeEmailPrefix('a')).toBe(true);
    });

    it('returns true for lowercase letters with numbers', () => {
      expect(looksLikeEmailPrefix('john123')).toBe(true);
      expect(looksLikeEmailPrefix('user42')).toBe(true);
      expect(looksLikeEmailPrefix('jedaws1')).toBe(true);
      expect(looksLikeEmailPrefix('test2024')).toBe(true);
    });

    it('returns true for OAuth-derived initials + surname patterns', () => {
      // These are common patterns when OAuth providers parse email local parts
      // e.g., "jedawes@gmail.com" -> "JE Dawes" or "J Dawes"
      expect(looksLikeEmailPrefix('JE Dawes')).toBe(true);
      expect(looksLikeEmailPrefix('J Smith')).toBe(true);
      expect(looksLikeEmailPrefix('AB Jones')).toBe(true);
      expect(looksLikeEmailPrefix('JK Rowling')).toBe(true);
      expect(looksLikeEmailPrefix('ABC Test')).toBe(true);
    });
  });

  describe('returns false for valid names', () => {
    it('returns false for proper capitalized name', () => {
      expect(looksLikeEmailPrefix('John')).toBe(false);
      expect(looksLikeEmailPrefix('Mary')).toBe(false);
    });

    it('returns false for full name with space', () => {
      expect(looksLikeEmailPrefix('John Smith')).toBe(false);
      expect(looksLikeEmailPrefix('Mary Jane Watson')).toBe(false);
    });

    it('returns false for lowercase name without numbers', () => {
      expect(looksLikeEmailPrefix('john')).toBe(false);
      expect(looksLikeEmailPrefix('alice')).toBe(false);
    });

    it('returns false for nickname without numbers', () => {
      expect(looksLikeEmailPrefix('kidcollector')).toBe(false);
      expect(looksLikeEmailPrefix('pokemonmaster')).toBe(false);
    });

    it('returns false for name with only uppercase letters', () => {
      expect(looksLikeEmailPrefix('JOHN')).toBe(false);
    });

    it('returns false for mixed case without numbers', () => {
      expect(looksLikeEmailPrefix('JohnDoe')).toBe(false);
    });
  });
});

describe('getDisplayName', () => {
  const mockLoadOnboardingProgress = vi.mocked(loadOnboardingProgress);

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadOnboardingProgress.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with valid database name', () => {
    it('returns database name when it looks like a real name', () => {
      expect(getDisplayName('John')).toBe('John');
      expect(getDisplayName('Mary Smith')).toBe('Mary Smith');
      expect(getDisplayName('Alice')).toBe('Alice');
    });

    it('returns database name for capitalized single word', () => {
      expect(getDisplayName('Collector')).toBe('Collector');
    });
  });

  describe('with email-like database name', () => {
    it('falls back to onboarding name when database name has numbers', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        profileName: 'Johnny',
        profileType: 'child',
        startedAt: Date.now(),
      });

      expect(getDisplayName('john123')).toBe('Johnny');
    });

    it('uses database name as last resort if no onboarding name', () => {
      mockLoadOnboardingProgress.mockReturnValue(null);
      expect(getDisplayName('john123')).toBe('john123');
    });

    it('returns Collector when no name available', () => {
      mockLoadOnboardingProgress.mockReturnValue(null);
      expect(getDisplayName(null)).toBe('Collector');
      expect(getDisplayName(undefined)).toBe('Collector');
      expect(getDisplayName('')).toBe('Collector');
    });
  });

  describe('onboarding fallback', () => {
    it('uses onboarding name when database name is null', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: ['welcome', 'games', 'profile', 'first-cards'],
        isComplete: true,
        profileName: 'Timmy',
        profileType: 'child',
        startedAt: Date.now(),
      });

      expect(getDisplayName(null)).toBe('Timmy');
    });

    it('trims whitespace from onboarding name', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: [],
        isComplete: false,
        profileName: '  Timmy  ',
        profileType: 'child',
        startedAt: Date.now(),
      });

      expect(getDisplayName(null)).toBe('Timmy');
    });

    it('skips empty onboarding name', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: [],
        isComplete: false,
        profileName: '   ',
        profileType: 'child',
        startedAt: Date.now(),
      });

      expect(getDisplayName(null)).toBe('Collector');
    });
  });

  describe('error handling', () => {
    it('handles localStorage error gracefully', () => {
      mockLoadOnboardingProgress.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(getDisplayName('john123')).toBe('john123');
    });

    it('returns Collector when all fallbacks fail', () => {
      mockLoadOnboardingProgress.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(getDisplayName(null)).toBe('Collector');
    });
  });

  describe('priority order', () => {
    it('prefers valid database name over onboarding name', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: [],
        isComplete: false,
        profileName: 'OnboardingName',
        profileType: 'child',
        startedAt: Date.now(),
      });

      // Database name looks valid, should use it
      expect(getDisplayName('DatabaseName')).toBe('DatabaseName');
    });

    it('prefers onboarding name over email-like database name', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: [],
        isComplete: false,
        profileName: 'RealName',
        profileType: 'child',
        startedAt: Date.now(),
      });

      // Database name looks like email prefix, should fall back
      expect(getDisplayName('user123')).toBe('RealName');
    });

    it('prefers onboarding name over OAuth-derived initials name', () => {
      mockLoadOnboardingProgress.mockReturnValue({
        currentStep: 'complete',
        completedSteps: [],
        isComplete: false,
        profileName: 'Jeremiah',
        profileType: 'child',
        startedAt: Date.now(),
      });

      // Database name looks like OAuth-derived "JE Dawes", should fall back to "Jeremiah"
      expect(getDisplayName('JE Dawes')).toBe('Jeremiah');
    });
  });
});

describe('getFirstName', () => {
  it('extracts first name from full name', () => {
    expect(getFirstName('Jeremy Daws')).toBe('Jeremy');
    expect(getFirstName('Mary Jane Watson')).toBe('Mary');
    expect(getFirstName('John')).toBe('John');
  });

  it('handles single names', () => {
    expect(getFirstName('Alice')).toBe('Alice');
    expect(getFirstName('Collector')).toBe('Collector');
  });

  it('trims whitespace', () => {
    expect(getFirstName('  Jeremy  ')).toBe('Jeremy');
    expect(getFirstName('  Mary Jane  ')).toBe('Mary');
  });

  it('handles multiple spaces between names', () => {
    expect(getFirstName('Jeremy    Daws')).toBe('Jeremy');
  });

  it('returns Collector for empty strings', () => {
    expect(getFirstName('')).toBe('Collector');
    expect(getFirstName('   ')).toBe('Collector');
  });
});
