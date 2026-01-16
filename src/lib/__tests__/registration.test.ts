import { describe, expect, it } from 'vitest';
import {
  // Constants
  EMAIL_VERIFICATION_TOKEN_LENGTH,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  EMAIL_TYPO_CORRECTIONS,
  COMMON_WEAK_PASSWORDS,
  // Email validation
  isValidEmailFormat,
  getEmailDomain,
  getEmailTypoSuggestion,
  normalizeEmail,
  validateEmail,
  // Password validation
  hasLowercase,
  hasUppercase,
  hasNumber,
  hasSpecialChar,
  isCommonWeakPassword,
  countPasswordCategories,
  calculatePasswordStrength,
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  // Display name validation
  hasAllowedDisplayNameChars,
  sanitizeDisplayName,
  validateDisplayName,
  // Combined validation
  validateRegistration,
  // Verification status
  parseVerificationStatus,
  getVerificationStatusMessage,
  getVerificationTimeRemaining,
  // Token utilities
  isValidTokenFormat,
  extractTokenFromUrl,
  buildVerificationUrl,
  // Error helpers
  getFieldErrors,
  hasErrorCode,
  getFirstFieldError,
  formatErrorsForDisplay,
} from '../registration';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Registration Constants', () => {
  it('should have EMAIL_VERIFICATION_TOKEN_LENGTH of 32', () => {
    expect(EMAIL_VERIFICATION_TOKEN_LENGTH).toBe(32);
  });

  it('should have EMAIL_VERIFICATION_EXPIRY_HOURS of 24', () => {
    expect(EMAIL_VERIFICATION_EXPIRY_HOURS).toBe(24);
  });

  it('should have MIN_PASSWORD_LENGTH of 8', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it('should have MAX_PASSWORD_LENGTH of 128', () => {
    expect(MAX_PASSWORD_LENGTH).toBe(128);
  });

  it('should have MIN_DISPLAY_NAME_LENGTH of 1', () => {
    expect(MIN_DISPLAY_NAME_LENGTH).toBe(1);
  });

  it('should have MAX_DISPLAY_NAME_LENGTH of 30', () => {
    expect(MAX_DISPLAY_NAME_LENGTH).toBe(30);
  });

  it('should have EMAIL_TYPO_CORRECTIONS for common typos', () => {
    expect(EMAIL_TYPO_CORRECTIONS['gmial.com']).toBe('gmail.com');
    expect(EMAIL_TYPO_CORRECTIONS['hotmal.com']).toBe('hotmail.com');
    expect(EMAIL_TYPO_CORRECTIONS['yaho.com']).toBe('yahoo.com');
    expect(Object.keys(EMAIL_TYPO_CORRECTIONS).length).toBeGreaterThan(5);
  });

  it('should have COMMON_WEAK_PASSWORDS list', () => {
    expect(COMMON_WEAK_PASSWORDS).toContain('password');
    expect(COMMON_WEAK_PASSWORDS).toContain('12345678');
    expect(COMMON_WEAK_PASSWORDS).toContain('pokemon1');
    expect(COMMON_WEAK_PASSWORDS.length).toBeGreaterThan(10);
  });
});

// ============================================================================
// EMAIL VALIDATION TESTS
// ============================================================================

describe('isValidEmailFormat', () => {
  it('should return true for valid email formats', () => {
    expect(isValidEmailFormat('test@example.com')).toBe(true);
    expect(isValidEmailFormat('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmailFormat('user+tag@example.org')).toBe(true);
    expect(isValidEmailFormat('123@numbers.com')).toBe(true);
  });

  it('should return false for invalid email formats', () => {
    expect(isValidEmailFormat('')).toBe(false);
    expect(isValidEmailFormat('notanemail')).toBe(false);
    expect(isValidEmailFormat('missing@domain')).toBe(false);
    expect(isValidEmailFormat('@nodomain.com')).toBe(false);
    expect(isValidEmailFormat('spaces in@email.com')).toBe(false);
  });

  it('should trim whitespace before validation', () => {
    expect(isValidEmailFormat('  test@example.com  ')).toBe(true);
    expect(isValidEmailFormat('  ')).toBe(false);
  });
});

describe('getEmailDomain', () => {
  it('should extract domain from email', () => {
    expect(getEmailDomain('test@example.com')).toBe('example.com');
    expect(getEmailDomain('user@GMAIL.COM')).toBe('gmail.com');
    expect(getEmailDomain('  test@domain.co.uk  ')).toBe('domain.co.uk');
  });

  it('should return empty string for invalid emails', () => {
    expect(getEmailDomain('notanemail')).toBe('');
    expect(getEmailDomain('')).toBe('');
  });
});

describe('getEmailTypoSuggestion', () => {
  it('should suggest corrections for known typos', () => {
    expect(getEmailTypoSuggestion('user@gmial.com')).toBe('user@gmail.com');
    expect(getEmailTypoSuggestion('test@hotmal.com')).toBe('test@hotmail.com');
    expect(getEmailTypoSuggestion('name@yaho.com')).toBe('name@yahoo.com');
  });

  it('should return undefined for correct domains', () => {
    expect(getEmailTypoSuggestion('user@gmail.com')).toBeUndefined();
    expect(getEmailTypoSuggestion('test@hotmail.com')).toBeUndefined();
    expect(getEmailTypoSuggestion('name@yahoo.com')).toBeUndefined();
  });

  it('should return undefined for unknown domains', () => {
    expect(getEmailTypoSuggestion('user@company.com')).toBeUndefined();
    expect(getEmailTypoSuggestion('test@random.org')).toBeUndefined();
  });
});

describe('normalizeEmail', () => {
  it('should trim and lowercase email', () => {
    expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    expect(normalizeEmail('User@Gmail.Com')).toBe('user@gmail.com');
  });
});

describe('validateEmail', () => {
  it('should validate correct emails', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedEmail).toBe('test@example.com');
  });

  it('should return error for empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('REQUIRED');
  });

  it('should return error for invalid format', () => {
    const result = validateEmail('notanemail');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_FORMAT');
  });

  it('should suggest corrections for typos', () => {
    const result = validateEmail('user@gmial.com');
    expect(result.suggestedCorrection).toBe('user@gmail.com');
  });
});

// ============================================================================
// PASSWORD VALIDATION TESTS
// ============================================================================

describe('Password character checks', () => {
  describe('hasLowercase', () => {
    it('should detect lowercase letters', () => {
      expect(hasLowercase('abc')).toBe(true);
      expect(hasLowercase('ABC123')).toBe(false);
      expect(hasLowercase('Test123')).toBe(true);
    });
  });

  describe('hasUppercase', () => {
    it('should detect uppercase letters', () => {
      expect(hasUppercase('ABC')).toBe(true);
      expect(hasUppercase('abc123')).toBe(false);
      expect(hasUppercase('Test123')).toBe(true);
    });
  });

  describe('hasNumber', () => {
    it('should detect numbers', () => {
      expect(hasNumber('123')).toBe(true);
      expect(hasNumber('abc')).toBe(false);
      expect(hasNumber('Test123')).toBe(true);
    });
  });

  describe('hasSpecialChar', () => {
    it('should detect special characters', () => {
      expect(hasSpecialChar('!')).toBe(true);
      expect(hasSpecialChar('abc123')).toBe(false);
      expect(hasSpecialChar('Test@123')).toBe(true);
      expect(hasSpecialChar('pass-word')).toBe(true);
    });
  });
});

describe('isCommonWeakPassword', () => {
  it('should detect common weak passwords', () => {
    expect(isCommonWeakPassword('password')).toBe(true);
    expect(isCommonWeakPassword('PASSWORD')).toBe(true);
    expect(isCommonWeakPassword('12345678')).toBe(true);
    expect(isCommonWeakPassword('pokemon1')).toBe(true);
  });

  it('should allow strong passwords', () => {
    expect(isCommonWeakPassword('MyStr0ng!Pass')).toBe(false);
    expect(isCommonWeakPassword('Un1queP@ssword')).toBe(false);
  });
});

describe('countPasswordCategories', () => {
  it('should count character categories', () => {
    expect(countPasswordCategories('abc')).toBe(1);
    expect(countPasswordCategories('Abc')).toBe(2);
    expect(countPasswordCategories('Abc123')).toBe(3);
    expect(countPasswordCategories('Abc123!')).toBe(4);
  });
});

describe('calculatePasswordStrength', () => {
  it('should return weak for empty password', () => {
    const result = calculatePasswordStrength('');
    expect(result.level).toBe('weak');
    expect(result.score).toBe(0);
    expect(result.isAcceptable).toBe(false);
  });

  it('should return weak for short passwords', () => {
    const result = calculatePasswordStrength('short');
    expect(result.level).toBe('weak');
    expect(result.isAcceptable).toBe(false);
  });

  it('should return fair for basic passwords', () => {
    // Password1 has 9 chars (meets min), 3 categories (upper, lower, number) = 3 points = good
    // Let's use a simpler password with fewer categories
    const result = calculatePasswordStrength('password1'); // 9 chars, 2 categories (lower, number)
    expect(result.level).toBe('fair');
    expect(result.isAcceptable).toBe(true);
  });

  it('should return good for stronger passwords', () => {
    // MyPassword123 has 13 chars, 3 categories = 4 points = strong
    // Let's use a password that gets exactly 3 points
    const result = calculatePasswordStrength('Passw0rd'); // 8 chars, 3 categories = 3 points = good
    expect(result.level).toBe('good');
    expect(result.isAcceptable).toBe(true);
  });

  it('should return strong for complex passwords', () => {
    const result = calculatePasswordStrength('MyStr0ng!Pass123');
    expect(result.level).toBe('strong');
    expect(result.isAcceptable).toBe(true);
  });

  it('should penalize common passwords', () => {
    const result = calculatePasswordStrength('password123');
    expect(result.isAcceptable).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should validate strong passwords', () => {
    const result = validatePassword('MyStr0ng!Pass');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return error for empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('REQUIRED');
  });

  it('should return error for short password', () => {
    const result = validatePassword('Short1!');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TOO_SHORT')).toBe(true);
  });

  it('should return error for weak password', () => {
    const result = validatePassword('abcdefgh');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'WEAK_PASSWORD')).toBe(true);
  });

  it('should return error for common password', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'COMMON_PASSWORD')).toBe(true);
  });
});

describe('getPasswordStrengthColor', () => {
  it('should return correct colors', () => {
    expect(getPasswordStrengthColor('weak')).toBe('#ef4444');
    expect(getPasswordStrengthColor('fair')).toBe('#f59e0b');
    expect(getPasswordStrengthColor('good')).toBe('#22c55e');
    expect(getPasswordStrengthColor('strong')).toBe('#10b981');
  });
});

describe('getPasswordStrengthLabel', () => {
  it('should return correct labels', () => {
    expect(getPasswordStrengthLabel('weak')).toBe('Weak');
    expect(getPasswordStrengthLabel('fair')).toBe('Fair');
    expect(getPasswordStrengthLabel('good')).toBe('Good');
    expect(getPasswordStrengthLabel('strong')).toBe('Strong');
  });
});

// ============================================================================
// DISPLAY NAME VALIDATION TESTS
// ============================================================================

describe('hasAllowedDisplayNameChars', () => {
  it('should allow valid characters', () => {
    expect(hasAllowedDisplayNameChars('John')).toBe(true);
    expect(hasAllowedDisplayNameChars("Mary O'Brien")).toBe(true);
    expect(hasAllowedDisplayNameChars('Jean-Pierre')).toBe(true);
    expect(hasAllowedDisplayNameChars('User 123')).toBe(true);
    expect(hasAllowedDisplayNameChars('José')).toBe(true);
  });

  it('should reject invalid characters', () => {
    expect(hasAllowedDisplayNameChars('User@Name')).toBe(false);
    expect(hasAllowedDisplayNameChars('Name!')).toBe(false);
    expect(hasAllowedDisplayNameChars('Test<script>')).toBe(false);
  });
});

describe('sanitizeDisplayName', () => {
  it('should trim and normalize spaces', () => {
    expect(sanitizeDisplayName('  John  ')).toBe('John');
    expect(sanitizeDisplayName('John    Doe')).toBe('John Doe');
    expect(sanitizeDisplayName('  Multiple   Spaces  ')).toBe('Multiple Spaces');
  });
});

describe('validateDisplayName', () => {
  it('should validate correct names', () => {
    const result = validateDisplayName('John Doe');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedName).toBe('John Doe');
  });

  it('should return error for empty name', () => {
    const result = validateDisplayName('');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe('REQUIRED');
  });

  it('should return error for too long name', () => {
    const result = validateDisplayName('A'.repeat(31));
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'TOO_LONG')).toBe(true);
  });

  it('should return error for invalid characters', () => {
    const result = validateDisplayName('User@Name');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_CHARS')).toBe(true);
  });
});

// ============================================================================
// COMBINED VALIDATION TESTS
// ============================================================================

describe('validateRegistration', () => {
  it('should validate all fields together', () => {
    const result = validateRegistration(
      'test@example.com',
      'MyStr0ng!Pass',
      'John Doe'
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect all errors', () => {
    const result = validateRegistration('', '', '');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.emailResult.isValid).toBe(false);
    expect(result.passwordResult.isValid).toBe(false);
    expect(result.displayNameResult.isValid).toBe(false);
  });

  it('should return individual field results', () => {
    const result = validateRegistration(
      'invalid',
      'weak',
      'Valid Name'
    );
    expect(result.emailResult.isValid).toBe(false);
    expect(result.passwordResult.isValid).toBe(false);
    expect(result.displayNameResult.isValid).toBe(true);
  });
});

// ============================================================================
// VERIFICATION STATUS TESTS
// ============================================================================

describe('parseVerificationStatus', () => {
  it('should identify verified status', () => {
    const status = parseVerificationStatus({
      isVerified: true,
      verifiedAt: Date.now(),
    });
    expect(status.isVerified).toBe(true);
    expect(status.isPending).toBe(false);
    expect(status.canResend).toBe(false);
  });

  it('should identify pending status', () => {
    const futureTime = Date.now() + 60 * 60 * 1000;
    const status = parseVerificationStatus({
      isVerified: false,
      expiresAt: futureTime,
    });
    expect(status.isVerified).toBe(false);
    expect(status.isPending).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.canResend).toBe(true);
  });

  it('should identify expired status', () => {
    const pastTime = Date.now() - 60 * 60 * 1000;
    const status = parseVerificationStatus({
      isVerified: false,
      expiresAt: pastTime,
    });
    expect(status.isVerified).toBe(false);
    expect(status.isPending).toBe(false);
    expect(status.isExpired).toBe(true);
    expect(status.canResend).toBe(true);
  });
});

describe('getVerificationStatusMessage', () => {
  it('should return correct messages', () => {
    expect(
      getVerificationStatusMessage({ isVerified: true, isPending: false, isExpired: false, canResend: false })
    ).toBe('Email verified');

    expect(
      getVerificationStatusMessage({ isVerified: false, isPending: true, isExpired: false, canResend: true })
    ).toBe('Please check your email for the verification link.');

    expect(
      getVerificationStatusMessage({ isVerified: false, isPending: false, isExpired: true, canResend: true })
    ).toBe('Verification link expired. Please request a new one.');
  });
});

describe('getVerificationTimeRemaining', () => {
  it('should calculate time remaining', () => {
    const futureTime = Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000; // 2.5 hours
    const result = getVerificationTimeRemaining(futureTime);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(30);
    expect(result.isExpired).toBe(false);
    expect(result.message).toContain('2h');
  });

  it('should handle expired tokens', () => {
    const pastTime = Date.now() - 60 * 1000;
    const result = getVerificationTimeRemaining(pastTime);
    expect(result.isExpired).toBe(true);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.message).toBe('Expired');
  });

  it('should handle minutes only', () => {
    const futureTime = Date.now() + 45 * 60 * 1000; // 45 minutes
    const result = getVerificationTimeRemaining(futureTime);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(45);
    expect(result.message).toContain('45m');
  });
});

// ============================================================================
// TOKEN UTILITIES TESTS
// ============================================================================

describe('isValidTokenFormat', () => {
  it('should validate correct token format', () => {
    const validToken = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef'; // 32 chars
    expect(isValidTokenFormat(validToken)).toBe(true);
  });

  it('should reject invalid tokens', () => {
    expect(isValidTokenFormat('')).toBe(false);
    expect(isValidTokenFormat('short')).toBe(false);
    expect(isValidTokenFormat('A'.repeat(31))).toBe(false);
    expect(isValidTokenFormat('A'.repeat(33))).toBe(false);
    expect(isValidTokenFormat('ABC!@#$%^&*()DEFGHIJKLMNOPQRST')).toBe(false);
  });
});

describe('extractTokenFromUrl', () => {
  it('should extract token from query param', () => {
    const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
    const url = `https://example.com/verify?token=${token}`;
    expect(extractTokenFromUrl(url)).toBe(token);
  });

  it('should extract token from path', () => {
    const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
    const url = `https://example.com/verify/${token}`;
    expect(extractTokenFromUrl(url)).toBe(token);
  });

  it('should return null for invalid URLs', () => {
    expect(extractTokenFromUrl('not-a-url')).toBe(null);
    expect(extractTokenFromUrl('https://example.com/verify')).toBe(null);
  });
});

describe('buildVerificationUrl', () => {
  it('should build correct URL', () => {
    const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
    const url = buildVerificationUrl('https://example.com', token);
    expect(url).toBe(`https://example.com/verify?token=${token}`);
  });
});

// ============================================================================
// ERROR HELPERS TESTS
// ============================================================================

describe('getFieldErrors', () => {
  const errors = [
    { field: 'email', code: 'REQUIRED', message: 'Email required' },
    { field: 'email', code: 'INVALID', message: 'Invalid email' },
    { field: 'password', code: 'TOO_SHORT', message: 'Too short' },
  ];

  it('should filter errors by field', () => {
    const emailErrors = getFieldErrors(errors, 'email');
    expect(emailErrors).toHaveLength(2);
    expect(emailErrors[0].field).toBe('email');
  });

  it('should return empty array for unknown field', () => {
    expect(getFieldErrors(errors, 'unknown')).toHaveLength(0);
  });
});

describe('hasErrorCode', () => {
  const errors = [
    { field: 'email', code: 'REQUIRED', message: 'Email required' },
    { field: 'password', code: 'TOO_SHORT', message: 'Too short' },
  ];

  it('should find existing error codes', () => {
    expect(hasErrorCode(errors, 'REQUIRED')).toBe(true);
    expect(hasErrorCode(errors, 'TOO_SHORT')).toBe(true);
  });

  it('should return false for missing codes', () => {
    expect(hasErrorCode(errors, 'NOT_EXISTS')).toBe(false);
  });
});

describe('getFirstFieldError', () => {
  const errors = [
    { field: 'email', code: 'REQUIRED', message: 'Email required' },
    { field: 'email', code: 'INVALID', message: 'Invalid email' },
  ];

  it('should get first error message', () => {
    expect(getFirstFieldError(errors, 'email')).toBe('Email required');
  });

  it('should return null for unknown field', () => {
    expect(getFirstFieldError(errors, 'unknown')).toBe(null);
  });
});

describe('formatErrorsForDisplay', () => {
  it('should group errors by field', () => {
    const errors = [
      { field: 'email', code: 'REQUIRED', message: 'Email required' },
      { field: 'email', code: 'INVALID', message: 'Invalid email' },
      { field: 'password', code: 'TOO_SHORT', message: 'Too short' },
    ];

    const formatted = formatErrorsForDisplay(errors);
    expect(formatted.email).toHaveLength(2);
    expect(formatted.password).toHaveLength(1);
    expect(formatted.email).toContain('Email required');
    expect(formatted.email).toContain('Invalid email');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Registration Flow Integration', () => {
  describe('Complete registration validation', () => {
    it('should validate a complete valid registration', () => {
      const result = validateRegistration(
        'parent@family.com',
        'MySecure1Pass!',
        'Parent User'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.emailResult.normalizedEmail).toBe('parent@family.com');
      expect(result.displayNameResult.sanitizedName).toBe('Parent User');
      expect(result.passwordResult.strength.isAcceptable).toBe(true);
    });

    it('should catch all issues in invalid registration', () => {
      const result = validateRegistration(
        'invalid-email',
        'weak',
        '@@@invalid!!!'
      );

      expect(result.isValid).toBe(false);
      expect(result.emailResult.isValid).toBe(false);
      expect(result.passwordResult.isValid).toBe(false);
      expect(result.displayNameResult.isValid).toBe(false);
    });
  });

  describe('Email typo detection', () => {
    it('should suggest corrections for common typos', () => {
      const gmialResult = validateEmail('user@gmial.com');
      expect(gmialResult.suggestedCorrection).toBe('user@gmail.com');

      const hotmalResult = validateEmail('parent@hotmal.com');
      expect(hotmalResult.suggestedCorrection).toBe('parent@hotmail.com');
    });
  });

  describe('Password strength progression', () => {
    it('should show strength progression', () => {
      const weak = calculatePasswordStrength('abc'); // 0 points - too short
      const fair = calculatePasswordStrength('password1'); // 2 points - meets min, 2 categories
      const good = calculatePasswordStrength('Passw0rd'); // 3 points - meets min, 3 categories
      const strong = calculatePasswordStrength('MyV3ryStr0ng!Pass'); // 4 points - long, 4 categories

      expect(weak.score).toBeLessThan(fair.score);
      expect(fair.score).toBeLessThan(good.score);
      expect(good.score).toBeLessThanOrEqual(strong.score);
    });
  });

  describe('Verification token lifecycle', () => {
    it('should handle token from creation to verification', () => {
      // Simulate pending verification
      const pending = parseVerificationStatus({
        isVerified: false,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      expect(pending.isPending).toBe(true);
      expect(pending.canResend).toBe(true);

      // Simulate verified
      const verified = parseVerificationStatus({
        isVerified: true,
        verifiedAt: Date.now(),
      });
      expect(verified.isVerified).toBe(true);
      expect(verified.canResend).toBe(false);

      // Simulate expired
      const expired = parseVerificationStatus({
        isVerified: false,
        expiresAt: Date.now() - 1000,
      });
      expect(expired.isExpired).toBe(true);
      expect(expired.canResend).toBe(true);
    });
  });
});
