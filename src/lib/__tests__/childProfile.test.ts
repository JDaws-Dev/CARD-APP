/**
 * Tests for child profile creation and validation utilities.
 */

import { describe, expect, it } from 'vitest';
import {
  // Constants
  MIN_DISPLAY_NAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  FREE_TIER_MAX_CHILD_PROFILES,
  FAMILY_TIER_MAX_CHILD_PROFILES,
  MAX_PARENT_PROFILES,
  MAX_TOTAL_PROFILES,
  BLOCKED_NAME_PATTERNS,
  DEFAULT_CHILD_AVATARS,

  // Display name validation
  isDisplayNameLengthValid,
  isDisplayNameCharsValid,
  containsBlockedContent,
  isWhitespaceOnly,
  hasExcessiveSpaces,
  validateDisplayName,
  sanitizeDisplayName,

  // Avatar URL validation
  isValidUrlFormat,
  isAllowedAvatarUrl,
  validateAvatarUrl,

  // Profile count utilities
  countProfilesByType,
  isDisplayNameUniqueInFamily,
  getMaxChildProfilesForTier,
  getMaxTotalProfilesForTier,

  // Profile creation validation
  canCreateChildProfile,
  canCreateParentProfile,
  validateChildProfileInput,
  validateChildProfileUpdate,

  // Display helpers
  getProfileLimitMessage,
  formatProfileCounts,
  getRemainingProfilesInfo,
  getRandomDefaultAvatar,
  getDefaultAvatarByIndex,

  // Error helpers
  getErrorMessage,
  isUpgradeRequiredError,
  getFirstErrorMessage,
  combineValidationResults,

  // Types
  ExistingProfile,
  ValidationError,
  ValidationResult,
} from '../childProfile';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  it('should have valid display name length limits', () => {
    expect(MIN_DISPLAY_NAME_LENGTH).toBe(1);
    expect(MAX_DISPLAY_NAME_LENGTH).toBe(30);
    expect(MIN_DISPLAY_NAME_LENGTH).toBeLessThan(MAX_DISPLAY_NAME_LENGTH);
  });

  it('should have valid profile limits', () => {
    expect(FREE_TIER_MAX_CHILD_PROFILES).toBe(1);
    expect(FAMILY_TIER_MAX_CHILD_PROFILES).toBe(3);
    expect(MAX_PARENT_PROFILES).toBe(1);
    expect(MAX_TOTAL_PROFILES).toBe(4);
    // Family max should be greater than free
    expect(FAMILY_TIER_MAX_CHILD_PROFILES).toBeGreaterThan(FREE_TIER_MAX_CHILD_PROFILES);
    // Total should accommodate parent + max children
    expect(MAX_TOTAL_PROFILES).toBeGreaterThanOrEqual(
      MAX_PARENT_PROFILES + FAMILY_TIER_MAX_CHILD_PROFILES
    );
  });

  it('should have blocked name patterns defined', () => {
    expect(BLOCKED_NAME_PATTERNS).toBeInstanceOf(Array);
    expect(BLOCKED_NAME_PATTERNS.length).toBeGreaterThan(0);
    BLOCKED_NAME_PATTERNS.forEach((pattern) => {
      expect(pattern).toBeInstanceOf(RegExp);
    });
  });

  it('should have default avatars defined', () => {
    expect(DEFAULT_CHILD_AVATARS).toBeInstanceOf(Array);
    expect(DEFAULT_CHILD_AVATARS.length).toBeGreaterThan(0);
    DEFAULT_CHILD_AVATARS.forEach((avatar) => {
      expect(typeof avatar).toBe('string');
      expect(avatar.startsWith('/')).toBe(true);
    });
  });
});

// ============================================================================
// DISPLAY NAME VALIDATION TESTS
// ============================================================================

describe('Display name validation', () => {
  describe('isDisplayNameLengthValid', () => {
    it('should accept valid length names', () => {
      expect(isDisplayNameLengthValid('A')).toBe(true);
      expect(isDisplayNameLengthValid('John')).toBe(true);
      expect(isDisplayNameLengthValid('A'.repeat(30))).toBe(true);
    });

    it('should reject empty names', () => {
      expect(isDisplayNameLengthValid('')).toBe(false);
    });

    it('should reject names that are too long', () => {
      expect(isDisplayNameLengthValid('A'.repeat(31))).toBe(false);
      expect(isDisplayNameLengthValid('A'.repeat(50))).toBe(false);
    });

    it('should trim whitespace before checking', () => {
      expect(isDisplayNameLengthValid('  John  ')).toBe(true);
      expect(isDisplayNameLengthValid('   ')).toBe(false);
    });
  });

  describe('isDisplayNameCharsValid', () => {
    it('should accept alphanumeric names', () => {
      expect(isDisplayNameCharsValid('John')).toBe(true);
      expect(isDisplayNameCharsValid('john123')).toBe(true);
      expect(isDisplayNameCharsValid('User99')).toBe(true);
    });

    it('should accept names with spaces', () => {
      expect(isDisplayNameCharsValid('John Doe')).toBe(true);
      expect(isDisplayNameCharsValid('Mary Jane Watson')).toBe(true);
    });

    it('should accept names with hyphens and apostrophes', () => {
      expect(isDisplayNameCharsValid("O'Brien")).toBe(true);
      expect(isDisplayNameCharsValid('Mary-Jane')).toBe(true);
      expect(isDisplayNameCharsValid("Jean-Pierre O'Malley")).toBe(true);
    });

    it('should accept Unicode letters', () => {
      expect(isDisplayNameCharsValid('José')).toBe(true);
      expect(isDisplayNameCharsValid('Müller')).toBe(true);
      expect(isDisplayNameCharsValid('Sakura')).toBe(true);
    });

    it('should reject special characters', () => {
      expect(isDisplayNameCharsValid('John@Doe')).toBe(false);
      expect(isDisplayNameCharsValid('User#1')).toBe(false);
      expect(isDisplayNameCharsValid('Hello!')).toBe(false);
      expect(isDisplayNameCharsValid('Test_User')).toBe(false);
    });
  });

  describe('containsBlockedContent', () => {
    it('should detect inappropriate words', () => {
      expect(containsBlockedContent('badword hell')).toBe(true);
      expect(containsBlockedContent('damn it')).toBe(true);
    });

    it('should not block normal names', () => {
      expect(containsBlockedContent('John')).toBe(false);
      expect(containsBlockedContent('Pokemon Master')).toBe(false);
      expect(containsBlockedContent('Card Collector')).toBe(false);
    });

    it('should detect phone number patterns', () => {
      expect(containsBlockedContent('John 555-123-4567')).toBe(true);
      expect(containsBlockedContent('555.123.4567')).toBe(true);
    });

    it('should detect email patterns', () => {
      expect(containsBlockedContent('john@email.com')).toBe(true);
      expect(containsBlockedContent('test@test.org')).toBe(true);
    });

    it('should be case insensitive for blocked words', () => {
      expect(containsBlockedContent('HELL')).toBe(true);
      expect(containsBlockedContent('Hell')).toBe(true);
    });
  });

  describe('isWhitespaceOnly', () => {
    it('should detect empty strings', () => {
      expect(isWhitespaceOnly('')).toBe(true);
    });

    it('should detect whitespace-only strings', () => {
      expect(isWhitespaceOnly('   ')).toBe(true);
      expect(isWhitespaceOnly('\t\n')).toBe(true);
    });

    it('should return false for strings with content', () => {
      expect(isWhitespaceOnly('a')).toBe(false);
      expect(isWhitespaceOnly(' a ')).toBe(false);
    });
  });

  describe('hasExcessiveSpaces', () => {
    it('should detect 3+ consecutive spaces', () => {
      expect(hasExcessiveSpaces('John   Doe')).toBe(true);
      expect(hasExcessiveSpaces('Too    many')).toBe(true);
    });

    it('should allow up to 2 consecutive spaces', () => {
      expect(hasExcessiveSpaces('John  Doe')).toBe(false);
      expect(hasExcessiveSpaces('John Doe')).toBe(false);
    });
  });

  describe('validateDisplayName', () => {
    it('should return valid for good names', () => {
      const result = validateDisplayName('John');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for empty name', () => {
      const result = validateDisplayName('');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'REQUIRED')).toBe(true);
    });

    it('should return error for whitespace-only name', () => {
      const result = validateDisplayName('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'REQUIRED')).toBe(true);
    });

    it('should return error for too long name', () => {
      const result = validateDisplayName('A'.repeat(35));
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TOO_LONG')).toBe(true);
    });

    it('should return error for invalid characters', () => {
      const result = validateDisplayName('John@Doe');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_CHARS')).toBe(true);
    });

    it('should return error for excessive spaces', () => {
      const result = validateDisplayName('John   Doe');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'EXCESSIVE_SPACES')).toBe(true);
    });

    it('should return error for inappropriate content', () => {
      const result = validateDisplayName('badword hell');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INAPPROPRIATE_CONTENT')).toBe(true);
    });

    it('should collect multiple errors', () => {
      const result = validateDisplayName('@@@   hell');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('sanitizeDisplayName', () => {
    it('should trim whitespace', () => {
      expect(sanitizeDisplayName('  John  ')).toBe('John');
    });

    it('should collapse multiple spaces', () => {
      expect(sanitizeDisplayName('John   Doe')).toBe('John Doe');
    });

    it('should handle mixed whitespace', () => {
      expect(sanitizeDisplayName('  John   Doe  ')).toBe('John Doe');
    });
  });
});

// ============================================================================
// AVATAR URL VALIDATION TESTS
// ============================================================================

describe('Avatar URL validation', () => {
  describe('isValidUrlFormat', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrlFormat('http://example.com/avatar.png')).toBe(true);
      expect(isValidUrlFormat('https://example.com/avatar.png')).toBe(true);
    });

    it('should accept relative paths', () => {
      expect(isValidUrlFormat('/avatars/default.png')).toBe(true);
      expect(isValidUrlFormat('/images/avatar.jpg')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrlFormat('not-a-url')).toBe(false);
      expect(isValidUrlFormat('ftp://example.com')).toBe(false);
    });
  });

  describe('isAllowedAvatarUrl', () => {
    it('should allow relative paths', () => {
      expect(isAllowedAvatarUrl('/avatars/test.png')).toBe(true);
    });

    it('should allow HTTP/HTTPS URLs', () => {
      expect(isAllowedAvatarUrl('https://example.com/avatar.png')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isAllowedAvatarUrl('not-valid')).toBe(false);
    });
  });

  describe('validateAvatarUrl', () => {
    it('should return valid for undefined', () => {
      const result = validateAvatarUrl(undefined);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for empty string', () => {
      const result = validateAvatarUrl('');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for valid URL', () => {
      const result = validateAvatarUrl('https://example.com/avatar.png');
      expect(result.isValid).toBe(true);
    });

    it('should return error for invalid URL', () => {
      const result = validateAvatarUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_URL')).toBe(true);
    });
  });
});

// ============================================================================
// PROFILE COUNT UTILITIES TESTS
// ============================================================================

describe('Profile count utilities', () => {
  describe('countProfilesByType', () => {
    it('should count empty array', () => {
      const counts = countProfilesByType([]);
      expect(counts).toEqual({ parent: 0, child: 0, total: 0 });
    });

    it('should count profiles by type', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
        { id: '3', displayName: 'Child2', profileType: 'child' },
      ];
      const counts = countProfilesByType(profiles);
      expect(counts).toEqual({ parent: 1, child: 2, total: 3 });
    });

    it('should count profiles without type as child', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'NoType' },
        { id: '2', displayName: 'Child', profileType: 'child' },
      ];
      const counts = countProfilesByType(profiles);
      expect(counts).toEqual({ parent: 0, child: 2, total: 2 });
    });
  });

  describe('isDisplayNameUniqueInFamily', () => {
    const profiles: ExistingProfile[] = [
      { id: '1', displayName: 'John', profileType: 'child' },
      { id: '2', displayName: 'Jane', profileType: 'child' },
    ];

    it('should return true for unique names', () => {
      expect(isDisplayNameUniqueInFamily('Bob', profiles)).toBe(true);
    });

    it('should return false for duplicate names', () => {
      expect(isDisplayNameUniqueInFamily('John', profiles)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isDisplayNameUniqueInFamily('JOHN', profiles)).toBe(false);
      expect(isDisplayNameUniqueInFamily('john', profiles)).toBe(false);
    });

    it('should exclude specified profile ID', () => {
      expect(isDisplayNameUniqueInFamily('John', profiles, '1')).toBe(true);
    });
  });

  describe('getMaxChildProfilesForTier', () => {
    it('should return correct limits', () => {
      expect(getMaxChildProfilesForTier('free')).toBe(1);
      expect(getMaxChildProfilesForTier('family')).toBe(3);
    });
  });

  describe('getMaxTotalProfilesForTier', () => {
    it('should return correct limits', () => {
      expect(getMaxTotalProfilesForTier('free')).toBe(2); // 1 parent + 1 child
      expect(getMaxTotalProfilesForTier('family')).toBe(4);
    });
  });
});

// ============================================================================
// PROFILE CREATION VALIDATION TESTS
// ============================================================================

describe('Profile creation validation', () => {
  describe('canCreateChildProfile', () => {
    it('should allow first child on free tier', () => {
      const result = canCreateChildProfile('free', []);
      expect(result.allowed).toBe(true);
    });

    it('should allow first child with parent on free tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
      ];
      const result = canCreateChildProfile('free', profiles);
      expect(result.allowed).toBe(true);
    });

    it('should block second child on free tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
      ];
      const result = canCreateChildProfile('free', profiles);
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
    });

    it('should allow multiple children on family tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
      ];
      const result = canCreateChildProfile('family', profiles);
      expect(result.allowed).toBe(true);
    });

    it('should block fourth child on family tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
        { id: '3', displayName: 'Child2', profileType: 'child' },
        { id: '4', displayName: 'Child3', profileType: 'child' },
      ];
      const result = canCreateChildProfile('family', profiles);
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(false); // Can't upgrade past limit
    });

    it('should block when total limit reached', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
        { id: '3', displayName: 'Child2', profileType: 'child' },
        { id: '4', displayName: 'Child3', profileType: 'child' },
      ];
      const result = canCreateChildProfile('family', profiles);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maximum');
    });
  });

  describe('canCreateParentProfile', () => {
    it('should allow first parent', () => {
      const result = canCreateParentProfile('free', []);
      expect(result.allowed).toBe(true);
    });

    it('should block second parent', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
      ];
      const result = canCreateParentProfile('free', profiles);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('one parent');
    });

    it('should allow parent with existing child', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Child1', profileType: 'child' },
      ];
      const result = canCreateParentProfile('free', profiles);
      expect(result.allowed).toBe(true);
    });
  });

  describe('validateChildProfileInput', () => {
    it('should validate valid input', () => {
      const result = validateChildProfileInput({ displayName: 'John' }, 'free', []);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid display name', () => {
      const result = validateChildProfileInput({ displayName: '' }, 'free', []);
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.field === 'displayName')).toBe(true);
    });

    it('should reject duplicate name', () => {
      const profiles: ExistingProfile[] = [{ id: '1', displayName: 'John', profileType: 'child' }];
      const result = validateChildProfileInput({ displayName: 'John' }, 'free', profiles);
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NAME')).toBe(true);
    });

    it('should reject when limit reached', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
      ];
      const result = validateChildProfileInput({ displayName: 'NewChild' }, 'free', profiles);
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === 'UPGRADE_REQUIRED')).toBe(true);
    });

    it('should sanitize input', () => {
      const result = validateChildProfileInput({ displayName: '  John  ' }, 'free', []);
      expect(result.success).toBe(true);
      expect(result.sanitizedInput?.displayName).toBe('John');
    });

    it('should validate avatar URL', () => {
      const result = validateChildProfileInput(
        { displayName: 'John', avatarUrl: 'invalid-url' },
        'free',
        []
      );
      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.field === 'avatarUrl')).toBe(true);
    });

    it('should accept valid avatar URL', () => {
      const result = validateChildProfileInput(
        { displayName: 'John', avatarUrl: '/avatars/default.png' },
        'free',
        []
      );
      expect(result.success).toBe(true);
    });
  });

  describe('validateChildProfileUpdate', () => {
    const profiles: ExistingProfile[] = [
      { id: '1', displayName: 'John', profileType: 'child' },
      { id: '2', displayName: 'Jane', profileType: 'child' },
    ];

    it('should validate valid update', () => {
      const result = validateChildProfileUpdate({ displayName: 'Johnny' }, profiles, '1');
      expect(result.isValid).toBe(true);
    });

    it('should allow keeping same name', () => {
      const result = validateChildProfileUpdate({ displayName: 'John' }, profiles, '1');
      expect(result.isValid).toBe(true);
    });

    it('should reject duplicate name (different profile)', () => {
      const result = validateChildProfileUpdate({ displayName: 'Jane' }, profiles, '1');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NAME')).toBe(true);
    });

    it('should validate partial updates', () => {
      const result = validateChildProfileUpdate({ avatarUrl: '/avatars/new.png' }, profiles, '1');
      expect(result.isValid).toBe(true);
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('Display helpers', () => {
  describe('getProfileLimitMessage', () => {
    it('should show limit reached message for free tier', () => {
      const counts = { parent: 1, child: 1, total: 2 };
      const message = getProfileLimitMessage('free', counts);
      expect(message).toContain('limit');
      expect(message).toContain('Upgrade');
    });

    it('should show remaining profiles', () => {
      const counts = { parent: 1, child: 0, total: 1 };
      const message = getProfileLimitMessage('family', counts);
      expect(message).toContain('3');
    });

    it('should use singular form for 1 remaining', () => {
      const counts = { parent: 1, child: 2, total: 3 };
      const message = getProfileLimitMessage('family', counts);
      expect(message).toContain('1 more');
    });
  });

  describe('formatProfileCounts', () => {
    it('should format empty counts', () => {
      expect(formatProfileCounts({ parent: 0, child: 0, total: 0 })).toBe('No profiles');
    });

    it('should format parent only', () => {
      expect(formatProfileCounts({ parent: 1, child: 0, total: 1 })).toBe('1 parent');
    });

    it('should format one child', () => {
      expect(formatProfileCounts({ parent: 0, child: 1, total: 1 })).toBe('1 child');
    });

    it('should format multiple children', () => {
      expect(formatProfileCounts({ parent: 0, child: 2, total: 2 })).toBe('2 children');
    });

    it('should format mixed', () => {
      expect(formatProfileCounts({ parent: 1, child: 2, total: 3 })).toBe('1 parent, 2 children');
    });
  });

  describe('getRemainingProfilesInfo', () => {
    it('should return correct info for empty family on free tier', () => {
      const info = getRemainingProfilesInfo('free', []);
      expect(info.childRemaining).toBe(1);
      expect(info.canAddChild).toBe(true);
      expect(info.canAddParent).toBe(true);
    });

    it('should return correct info for full free tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child', profileType: 'child' },
      ];
      const info = getRemainingProfilesInfo('free', profiles);
      expect(info.childRemaining).toBe(0);
      expect(info.canAddChild).toBe(false);
      expect(info.canAddParent).toBe(false);
    });

    it('should return correct info for family tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'Child1', profileType: 'child' },
      ];
      const info = getRemainingProfilesInfo('family', profiles);
      expect(info.childRemaining).toBe(2);
      expect(info.canAddChild).toBe(true);
      expect(info.canAddParent).toBe(false);
    });
  });

  describe('getRandomDefaultAvatar', () => {
    it('should return a valid avatar path', () => {
      const avatar = getRandomDefaultAvatar();
      expect(DEFAULT_CHILD_AVATARS).toContain(avatar);
    });
  });

  describe('getDefaultAvatarByIndex', () => {
    it('should return avatar by index', () => {
      expect(getDefaultAvatarByIndex(0)).toBe(DEFAULT_CHILD_AVATARS[0]);
      expect(getDefaultAvatarByIndex(1)).toBe(DEFAULT_CHILD_AVATARS[1]);
    });

    it('should wrap around for large indices', () => {
      const idx = DEFAULT_CHILD_AVATARS.length + 1;
      expect(getDefaultAvatarByIndex(idx)).toBe(DEFAULT_CHILD_AVATARS[1]);
    });

    it('should handle negative indices', () => {
      expect(getDefaultAvatarByIndex(-1)).toBe(DEFAULT_CHILD_AVATARS[1]);
    });
  });
});

// ============================================================================
// ERROR HELPERS TESTS
// ============================================================================

describe('Error helpers', () => {
  describe('getErrorMessage', () => {
    it('should return message for known codes', () => {
      expect(getErrorMessage('REQUIRED')).toBe('This field is required');
      expect(getErrorMessage('TOO_LONG')).toBe('Name is too long');
    });

    it('should return default for unknown codes', () => {
      expect(getErrorMessage('UNKNOWN_CODE')).toBe('Validation error');
    });
  });

  describe('isUpgradeRequiredError', () => {
    it('should detect upgrade required errors', () => {
      const errors: ValidationError[] = [
        { field: 'profile', code: 'UPGRADE_REQUIRED', message: 'Upgrade needed' },
      ];
      expect(isUpgradeRequiredError(errors)).toBe(true);
    });

    it('should return false for other errors', () => {
      const errors: ValidationError[] = [
        { field: 'displayName', code: 'TOO_LONG', message: 'Too long' },
      ];
      expect(isUpgradeRequiredError(errors)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(isUpgradeRequiredError([])).toBe(false);
    });
  });

  describe('getFirstErrorMessage', () => {
    it('should return first error message', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          { field: 'a', code: 'A', message: 'First' },
          { field: 'b', code: 'B', message: 'Second' },
        ],
      };
      expect(getFirstErrorMessage(result)).toBe('First');
    });

    it('should return null for no errors', () => {
      const result: ValidationResult = { isValid: true, errors: [] };
      expect(getFirstErrorMessage(result)).toBeNull();
    });
  });

  describe('combineValidationResults', () => {
    it('should combine multiple results', () => {
      const r1: ValidationResult = {
        isValid: false,
        errors: [{ field: 'a', code: 'A', message: 'Error A' }],
      };
      const r2: ValidationResult = {
        isValid: false,
        errors: [{ field: 'b', code: 'B', message: 'Error B' }],
      };
      const combined = combineValidationResults(r1, r2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
    });

    it('should return valid if all valid', () => {
      const r1: ValidationResult = { isValid: true, errors: [] };
      const r2: ValidationResult = { isValid: true, errors: [] };
      const combined = combineValidationResults(r1, r2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration scenarios', () => {
  describe('New family creating first child profile', () => {
    it('should succeed with valid input', () => {
      const result = validateChildProfileInput(
        { displayName: 'Little Timmy', avatarUrl: '/avatars/default/child-1.png' },
        'free',
        []
      );

      expect(result.success).toBe(true);
      expect(result.sanitizedInput?.displayName).toBe('Little Timmy');
      expect(result.canCreateResult?.allowed).toBe(true);
    });
  });

  describe('Free user trying to add second child', () => {
    it('should be blocked with upgrade prompt', () => {
      const existingProfiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
        { id: '2', displayName: 'First Child', profileType: 'child' },
      ];

      const result = validateChildProfileInput(
        { displayName: 'Second Child' },
        'free',
        existingProfiles
      );

      expect(result.success).toBe(false);
      expect(result.canCreateResult?.allowed).toBe(false);
      expect(result.canCreateResult?.upgradeRequired).toBe(true);
      expect(isUpgradeRequiredError(result.errors)).toBe(true);
    });
  });

  describe('Family plan user adding multiple children', () => {
    it('should allow up to 3 children', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Parent', profileType: 'parent' },
      ];

      // Add first child
      const r1 = validateChildProfileInput({ displayName: 'Child 1' }, 'family', profiles);
      expect(r1.success).toBe(true);

      // Simulate adding first child
      profiles.push({ id: '2', displayName: 'Child 1', profileType: 'child' });

      // Add second child
      const r2 = validateChildProfileInput({ displayName: 'Child 2' }, 'family', profiles);
      expect(r2.success).toBe(true);

      // Simulate adding second child
      profiles.push({ id: '3', displayName: 'Child 2', profileType: 'child' });

      // Add third child
      const r3 = validateChildProfileInput({ displayName: 'Child 3' }, 'family', profiles);
      expect(r3.success).toBe(true);

      // Simulate adding third child
      profiles.push({ id: '4', displayName: 'Child 3', profileType: 'child' });

      // Try to add fourth child - should fail
      const r4 = validateChildProfileInput({ displayName: 'Child 4' }, 'family', profiles);
      expect(r4.success).toBe(false);
      expect(r4.canCreateResult?.allowed).toBe(false);
    });
  });

  describe('Attempting to create profile with inappropriate name', () => {
    it('should be blocked with appropriate error', () => {
      const result = validateChildProfileInput({ displayName: 'hell boy' }, 'free', []);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === 'INAPPROPRIATE_CONTENT')).toBe(true);
    });
  });

  describe('Creating profile with duplicate name', () => {
    it('should be blocked even if name has different casing', () => {
      const existingProfiles: ExistingProfile[] = [
        { id: '1', displayName: 'Johnny', profileType: 'child' },
      ];

      const result = validateChildProfileInput({ displayName: 'JOHNNY' }, 'free', existingProfiles);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NAME')).toBe(true);
    });
  });

  describe('Profile limit display messages', () => {
    it('should show appropriate message for free tier with room', () => {
      const info = getRemainingProfilesInfo('free', []);
      expect(info.message).toContain('1 more');
    });

    it('should show upgrade message for free tier at limit', () => {
      const profiles: ExistingProfile[] = [{ id: '1', displayName: 'Child', profileType: 'child' }];
      const info = getRemainingProfilesInfo('free', profiles);
      expect(info.message).toContain('limit');
    });

    it('should show remaining count for family tier', () => {
      const profiles: ExistingProfile[] = [
        { id: '1', displayName: 'Child 1', profileType: 'child' },
      ];
      const info = getRemainingProfilesInfo('family', profiles);
      expect(info.childRemaining).toBe(2);
    });
  });
});
