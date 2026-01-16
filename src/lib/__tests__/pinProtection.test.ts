import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  // Constants
  MIN_PIN_LENGTH,
  MAX_PIN_LENGTH,
  SALT_LENGTH,
  PBKDF2_ITERATIONS,
  HASH_ALGORITHM,
  MAX_PIN_ATTEMPTS,
  PIN_LOCKOUT_DURATION,
  COMMON_WEAK_PINS,
  // Validation
  isPinDigitsOnly,
  isPinLengthValid,
  validatePin,
  isValidPin,
  // Strength analysis
  hasRepeatedDigits,
  isSequentialPattern,
  hasOnlyTwoDigits,
  isCommonWeakPin,
  countUniqueDigits,
  analyzePinStrength,
  getPinStrengthColor,
  getPinStrengthLabel,
  // Hashing
  generateSalt,
  hexToBytes,
  bytesToHex,
  hashPinWithSalt,
  createPinHash,
  parsePinHash,
  verifyPin,
  // Display utilities
  maskPin,
  formatPinHint,
  getRemainingDigitsMessage,
  // State utilities
  hasPinSet,
  requiresPinProtection,
  getPinProtectedFeatures,
  // Attempt tracking
  isAccountLocked,
  getRemainingLockoutTime,
  formatLockoutTime,
  getRemainingAttemptsMessage,
  // Types
  PinStrength,
} from '../pinProtection';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('PIN Protection Constants', () => {
  it('should have MIN_PIN_LENGTH of 4', () => {
    expect(MIN_PIN_LENGTH).toBe(4);
  });

  it('should have MAX_PIN_LENGTH of 6', () => {
    expect(MAX_PIN_LENGTH).toBe(6);
  });

  it('should have SALT_LENGTH of 16 bytes', () => {
    expect(SALT_LENGTH).toBe(16);
  });

  it('should have reasonable PBKDF2 iterations', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(10000);
    expect(PBKDF2_ITERATIONS).toBe(100000);
  });

  it('should use SHA-256 for hashing', () => {
    expect(HASH_ALGORITHM).toBe('SHA-256');
  });

  it('should have MAX_PIN_ATTEMPTS of 5', () => {
    expect(MAX_PIN_ATTEMPTS).toBe(5);
  });

  it('should have PIN_LOCKOUT_DURATION of 15 minutes', () => {
    expect(PIN_LOCKOUT_DURATION).toBe(15 * 60 * 1000);
  });

  it('should have a list of common weak PINs', () => {
    expect(COMMON_WEAK_PINS).toContain('1234');
    expect(COMMON_WEAK_PINS).toContain('0000');
    expect(COMMON_WEAK_PINS).toContain('1111');
    expect(COMMON_WEAK_PINS.length).toBeGreaterThan(10);
  });
});

// ============================================================================
// VALIDATION FUNCTION TESTS
// ============================================================================

describe('isPinDigitsOnly', () => {
  it('should return true for digits only', () => {
    expect(isPinDigitsOnly('1234')).toBe(true);
    expect(isPinDigitsOnly('000000')).toBe(true);
    expect(isPinDigitsOnly('9876')).toBe(true);
  });

  it('should return false for non-digit characters', () => {
    expect(isPinDigitsOnly('12ab')).toBe(false);
    expect(isPinDigitsOnly('abc')).toBe(false);
    expect(isPinDigitsOnly('12 34')).toBe(false);
    expect(isPinDigitsOnly('12-34')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isPinDigitsOnly('')).toBe(false);
  });
});

describe('isPinLengthValid', () => {
  it('should return true for valid lengths', () => {
    expect(isPinLengthValid('1234')).toBe(true); // MIN_PIN_LENGTH
    expect(isPinLengthValid('12345')).toBe(true);
    expect(isPinLengthValid('123456')).toBe(true); // MAX_PIN_LENGTH
  });

  it('should return false for lengths below minimum', () => {
    expect(isPinLengthValid('')).toBe(false);
    expect(isPinLengthValid('1')).toBe(false);
    expect(isPinLengthValid('12')).toBe(false);
    expect(isPinLengthValid('123')).toBe(false);
  });

  it('should return false for lengths above maximum', () => {
    expect(isPinLengthValid('1234567')).toBe(false);
    expect(isPinLengthValid('12345678')).toBe(false);
  });
});

describe('validatePin', () => {
  it('should return valid for correct PINs', () => {
    expect(validatePin('1234')).toEqual({ isValid: true });
    expect(validatePin('567890')).toEqual({ isValid: true });
    expect(validatePin('00000')).toEqual({ isValid: true });
  });

  it('should return error for empty PIN', () => {
    expect(validatePin('')).toEqual({
      isValid: false,
      error: 'PIN is required',
    });
  });

  it('should return error for null/undefined PIN', () => {
    expect(validatePin(null as unknown as string)).toEqual({
      isValid: false,
      error: 'PIN is required',
    });
    expect(validatePin(undefined as unknown as string)).toEqual({
      isValid: false,
      error: 'PIN is required',
    });
  });

  it('should return error for too short PIN', () => {
    expect(validatePin('123')).toEqual({
      isValid: false,
      error: 'PIN must be at least 4 digits',
    });
  });

  it('should return error for too long PIN', () => {
    expect(validatePin('1234567')).toEqual({
      isValid: false,
      error: 'PIN must be at most 6 digits',
    });
  });

  it('should return error for non-digit PIN', () => {
    expect(validatePin('12ab')).toEqual({
      isValid: false,
      error: 'PIN must contain only digits',
    });
    expect(validatePin('abcd')).toEqual({
      isValid: false,
      error: 'PIN must contain only digits',
    });
  });
});

describe('isValidPin', () => {
  it('should return true for valid PINs', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('987654')).toBe(true);
  });

  it('should return false for invalid PINs', () => {
    expect(isValidPin('')).toBe(false);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('abcd')).toBe(false);
  });
});

// ============================================================================
// PIN STRENGTH ANALYSIS TESTS
// ============================================================================

describe('hasRepeatedDigits', () => {
  it('should return true for all same digits', () => {
    expect(hasRepeatedDigits('1111')).toBe(true);
    expect(hasRepeatedDigits('0000')).toBe(true);
    expect(hasRepeatedDigits('999999')).toBe(true);
  });

  it('should return false for mixed digits', () => {
    expect(hasRepeatedDigits('1234')).toBe(false);
    expect(hasRepeatedDigits('1122')).toBe(false);
    expect(hasRepeatedDigits('1211')).toBe(false);
  });
});

describe('isSequentialPattern', () => {
  it('should return true for ascending sequences', () => {
    expect(isSequentialPattern('1234')).toBe(true);
    expect(isSequentialPattern('4567')).toBe(true);
    expect(isSequentialPattern('0123')).toBe(true);
    expect(isSequentialPattern('123456')).toBe(true);
  });

  it('should return true for descending sequences', () => {
    expect(isSequentialPattern('4321')).toBe(true);
    expect(isSequentialPattern('9876')).toBe(true);
    expect(isSequentialPattern('654321')).toBe(true);
  });

  it('should return false for non-sequential patterns', () => {
    expect(isSequentialPattern('1357')).toBe(false);
    expect(isSequentialPattern('2468')).toBe(false);
    expect(isSequentialPattern('1324')).toBe(false);
    expect(isSequentialPattern('9182')).toBe(false);
  });
});

describe('hasOnlyTwoDigits', () => {
  it('should return true for one or two unique digits', () => {
    expect(hasOnlyTwoDigits('1111')).toBe(true);
    expect(hasOnlyTwoDigits('1212')).toBe(true);
    expect(hasOnlyTwoDigits('1122')).toBe(true);
  });

  it('should return false for three or more unique digits', () => {
    expect(hasOnlyTwoDigits('1234')).toBe(false);
    expect(hasOnlyTwoDigits('1123')).toBe(false);
    expect(hasOnlyTwoDigits('123456')).toBe(false);
  });
});

describe('isCommonWeakPin', () => {
  it('should return true for common weak PINs', () => {
    expect(isCommonWeakPin('1234')).toBe(true);
    expect(isCommonWeakPin('0000')).toBe(true);
    expect(isCommonWeakPin('1111')).toBe(true);
    expect(isCommonWeakPin('2580')).toBe(true);
  });

  it('should return false for uncommon PINs', () => {
    expect(isCommonWeakPin('7382')).toBe(false);
    expect(isCommonWeakPin('4829')).toBe(false);
    expect(isCommonWeakPin('371649')).toBe(false);
  });
});

describe('countUniqueDigits', () => {
  it('should count unique digits correctly', () => {
    expect(countUniqueDigits('1111')).toBe(1);
    expect(countUniqueDigits('1122')).toBe(2);
    expect(countUniqueDigits('1234')).toBe(4);
    expect(countUniqueDigits('123456')).toBe(6);
  });
});

describe('analyzePinStrength', () => {
  it('should rate all-same-digit PINs as weak', () => {
    const result = analyzePinStrength('1111');
    expect(result.strength).toBe('weak');
    expect(result.score).toBeLessThan(35);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('should rate sequential PINs as weak', () => {
    const result = analyzePinStrength('1234');
    expect(result.strength).toBe('weak');
    expect(result.feedback).toContain('Avoid sequential patterns like 1234');
  });

  it('should rate common weak PINs as weak', () => {
    const result = analyzePinStrength('2580');
    expect(result.strength).toBe('weak');
    expect(result.feedback).toContain('This is a commonly used PIN');
  });

  it('should rate diverse 6-digit PINs as strong', () => {
    const result = analyzePinStrength('793168');
    expect(result.strength).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('should give bonus for longer PINs', () => {
    const fourDigit = analyzePinStrength('7918');
    const sixDigit = analyzePinStrength('791845');
    expect(sixDigit.score).toBeGreaterThan(fourDigit.score);
  });

  it('should give bonus for more unique digits', () => {
    const twoUnique = analyzePinStrength('1212');
    const fourUnique = analyzePinStrength('1278');
    expect(fourUnique.score).toBeGreaterThan(twoUnique.score);
  });
});

describe('getPinStrengthColor', () => {
  it('should return correct colors', () => {
    expect(getPinStrengthColor('weak')).toBe('text-red-500');
    expect(getPinStrengthColor('medium')).toBe('text-yellow-500');
    expect(getPinStrengthColor('strong')).toBe('text-green-500');
  });
});

describe('getPinStrengthLabel', () => {
  it('should return correct labels', () => {
    expect(getPinStrengthLabel('weak')).toBe('Weak');
    expect(getPinStrengthLabel('medium')).toBe('Medium');
    expect(getPinStrengthLabel('strong')).toBe('Strong');
  });
});

// ============================================================================
// HASHING UTILITIES TESTS
// ============================================================================

describe('generateSalt', () => {
  it('should generate a hex string of correct length', () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]+$/);
    expect(salt.length).toBe(SALT_LENGTH * 2); // hex is 2 chars per byte
  });

  it('should generate unique salts', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toBe(salt2);
  });
});

describe('hexToBytes', () => {
  it('should convert hex to bytes correctly', () => {
    const bytes = hexToBytes('0102ff');
    expect(bytes).toEqual(new Uint8Array([1, 2, 255]));
  });

  it('should handle empty string', () => {
    const bytes = hexToBytes('');
    expect(bytes).toEqual(new Uint8Array([]));
  });
});

describe('bytesToHex', () => {
  it('should convert bytes to hex correctly', () => {
    const hex = bytesToHex(new Uint8Array([1, 2, 255]));
    expect(hex).toBe('0102ff');
  });

  it('should pad single digit hex values', () => {
    const hex = bytesToHex(new Uint8Array([0, 1, 15]));
    expect(hex).toBe('00010f');
  });

  it('should handle empty array', () => {
    const hex = bytesToHex(new Uint8Array([]));
    expect(hex).toBe('');
  });
});

describe('hexToBytes and bytesToHex roundtrip', () => {
  it('should roundtrip correctly', () => {
    const original = 'deadbeef0123456789abcdef';
    const bytes = hexToBytes(original);
    const result = bytesToHex(bytes);
    expect(result).toBe(original);
  });
});

describe('hashPinWithSalt', () => {
  it('should produce consistent hash for same inputs', async () => {
    const salt = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    const hash1 = await hashPinWithSalt('1234', salt);
    const hash2 = await hashPinWithSalt('1234', salt);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different PINs', async () => {
    const salt = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    const hash1 = await hashPinWithSalt('1234', salt);
    const hash2 = await hashPinWithSalt('5678', salt);
    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for different salts', async () => {
    const hash1 = await hashPinWithSalt('1234', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    const hash2 = await hashPinWithSalt('1234', 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce a 64-character hex hash (256 bits)', async () => {
    const salt = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
    const hash = await hashPinWithSalt('1234', salt);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('createPinHash', () => {
  it('should produce a salt:hash format string', async () => {
    const pinHash = await createPinHash('1234');
    expect(pinHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('should produce different hashes for same PIN (due to random salt)', async () => {
    const hash1 = await createPinHash('1234');
    const hash2 = await createPinHash('1234');
    expect(hash1).not.toBe(hash2);
  });
});

describe('parsePinHash', () => {
  it('should parse valid hash correctly', () => {
    const parsed = parsePinHash('abcdef0123456789:0123456789abcdef');
    expect(parsed).toEqual({
      salt: 'abcdef0123456789',
      hash: '0123456789abcdef',
    });
  });

  it('should return null for invalid format', () => {
    expect(parsePinHash('nocolon')).toBeNull();
    expect(parsePinHash('too:many:colons')).toBeNull();
    expect(parsePinHash('')).toBeNull();
    expect(parsePinHash(null as unknown as string)).toBeNull();
    expect(parsePinHash(undefined as unknown as string)).toBeNull();
  });

  it('should return null for non-hex characters', () => {
    expect(parsePinHash('ghij:klmn')).toBeNull();
    expect(parsePinHash('abcd:xyz!')).toBeNull();
  });
});

describe('verifyPin', () => {
  it('should return true for correct PIN', async () => {
    const pinHash = await createPinHash('1234');
    const isValid = await verifyPin('1234', pinHash);
    expect(isValid).toBe(true);
  });

  it('should return false for incorrect PIN', async () => {
    const pinHash = await createPinHash('1234');
    const isValid = await verifyPin('5678', pinHash);
    expect(isValid).toBe(false);
  });

  it('should return false for invalid hash format', async () => {
    const isValid = await verifyPin('1234', 'invalid-hash');
    expect(isValid).toBe(false);
  });

  it('should work with 6-digit PINs', async () => {
    const pinHash = await createPinHash('123456');
    expect(await verifyPin('123456', pinHash)).toBe(true);
    expect(await verifyPin('654321', pinHash)).toBe(false);
  });
});

// ============================================================================
// DISPLAY UTILITIES TESTS
// ============================================================================

describe('maskPin', () => {
  it('should mask PIN with bullets', () => {
    expect(maskPin('1234')).toBe('••••');
    expect(maskPin('123456')).toBe('••••••');
    expect(maskPin('')).toBe('');
  });
});

describe('formatPinHint', () => {
  it('should return hint with correct length range', () => {
    const hint = formatPinHint();
    expect(hint).toContain('4');
    expect(hint).toContain('6');
    expect(hint.toLowerCase()).toContain('digit');
  });
});

describe('getRemainingDigitsMessage', () => {
  it('should show remaining digits needed when below minimum', () => {
    expect(getRemainingDigitsMessage(0)).toContain('4');
    expect(getRemainingDigitsMessage(1)).toContain('3');
    expect(getRemainingDigitsMessage(2)).toContain('2');
    expect(getRemainingDigitsMessage(3)).toContain('1');
  });

  it('should show digits allowed when at or above minimum', () => {
    expect(getRemainingDigitsMessage(4)).toContain('2');
    expect(getRemainingDigitsMessage(5)).toContain('1');
  });

  it('should show maximum reached at max length', () => {
    expect(getRemainingDigitsMessage(6)).toContain('Maximum');
  });
});

// ============================================================================
// STATE UTILITIES TESTS
// ============================================================================

describe('hasPinSet', () => {
  it('should return true when PIN hash exists', () => {
    expect(hasPinSet('somehash:value')).toBe(true);
    expect(hasPinSet('abc')).toBe(true);
  });

  it('should return false when no PIN hash', () => {
    expect(hasPinSet(undefined)).toBe(false);
    expect(hasPinSet(null)).toBe(false);
    expect(hasPinSet('')).toBe(false);
  });
});

describe('requiresPinProtection', () => {
  it('should require PIN for child profiles accessing parent features', () => {
    expect(requiresPinProtection('view_prices', 'child')).toBe(true);
    expect(requiresPinProtection('access_settings', 'child')).toBe(true);
    expect(requiresPinProtection('delete_profile', 'child')).toBe(true);
    expect(requiresPinProtection('change_subscription', 'child')).toBe(true);
  });

  it('should not require PIN for parent profiles', () => {
    expect(requiresPinProtection('view_prices', 'parent')).toBe(false);
    expect(requiresPinProtection('access_settings', 'parent')).toBe(false);
  });

  it('should handle undefined profile type', () => {
    expect(requiresPinProtection('view_prices', undefined)).toBe(false);
  });
});

describe('getPinProtectedFeatures', () => {
  it('should return list of protected features', () => {
    const features = getPinProtectedFeatures();
    expect(features.length).toBeGreaterThan(0);
    expect(features).toContain('View card prices');
    expect(features).toContain('Manage subscription');
  });
});

// ============================================================================
// ATTEMPT TRACKING TESTS
// ============================================================================

describe('isAccountLocked', () => {
  it('should return false when below max attempts', () => {
    expect(isAccountLocked(0, Date.now())).toBe(false);
    expect(isAccountLocked(4, Date.now())).toBe(false);
  });

  it('should return true when at max attempts within lockout period', () => {
    const now = Date.now();
    expect(isAccountLocked(5, now)).toBe(true);
    expect(isAccountLocked(10, now)).toBe(true);
  });

  it('should return false when lockout period expired', () => {
    const expired = Date.now() - PIN_LOCKOUT_DURATION - 1000;
    expect(isAccountLocked(5, expired)).toBe(false);
  });

  it('should return false when no last attempt time', () => {
    expect(isAccountLocked(5, undefined)).toBe(false);
  });
});

describe('getRemainingLockoutTime', () => {
  it('should return 0 when no last attempt time', () => {
    expect(getRemainingLockoutTime(undefined)).toBe(0);
  });

  it('should return 0 when lockout expired', () => {
    const expired = Date.now() - PIN_LOCKOUT_DURATION - 1000;
    expect(getRemainingLockoutTime(expired)).toBe(0);
  });

  it('should return remaining seconds when locked', () => {
    const recentAttempt = Date.now() - 60000; // 1 minute ago
    const remaining = getRemainingLockoutTime(recentAttempt);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(PIN_LOCKOUT_DURATION / 1000);
  });
});

describe('formatLockoutTime', () => {
  it('should format seconds only', () => {
    expect(formatLockoutTime(30)).toBe('30s');
    expect(formatLockoutTime(1)).toBe('1s');
  });

  it('should format minutes and seconds', () => {
    expect(formatLockoutTime(90)).toBe('1m 30s');
    expect(formatLockoutTime(600)).toBe('10m 0s');
  });

  it('should return Unlocked for zero or negative', () => {
    expect(formatLockoutTime(0)).toBe('Unlocked');
    expect(formatLockoutTime(-1)).toBe('Unlocked');
  });
});

describe('getRemainingAttemptsMessage', () => {
  it('should show remaining attempts', () => {
    expect(getRemainingAttemptsMessage(0)).toContain('5');
    expect(getRemainingAttemptsMessage(3)).toContain('2');
  });

  it('should show warning for last attempt', () => {
    const message = getRemainingAttemptsMessage(4);
    expect(message).toContain('1');
    expect(message.toLowerCase()).toContain('warning');
  });

  it('should show locked message when no attempts left', () => {
    expect(getRemainingAttemptsMessage(5)).toContain('locked');
    expect(getRemainingAttemptsMessage(10)).toContain('locked');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('PIN Protection Integration', () => {
  describe('Complete PIN lifecycle', () => {
    it('should validate, hash, and verify a PIN', async () => {
      const pin = '847291';

      // Validate
      expect(isValidPin(pin)).toBe(true);

      // Analyze strength
      const strength = analyzePinStrength(pin);
      expect(strength.strength).toBe('strong');

      // Hash
      const hash = await createPinHash(pin);
      expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);

      // Verify correct PIN
      expect(await verifyPin(pin, hash)).toBe(true);

      // Reject incorrect PIN
      expect(await verifyPin('000000', hash)).toBe(false);
    });
  });

  describe('Child profile access control', () => {
    it('should always require PIN for child profiles', () => {
      const protectedActions = [
        'view_prices',
        'access_settings',
        'delete_profile',
        'change_subscription',
      ] as const;

      for (const action of protectedActions) {
        expect(requiresPinProtection(action, 'child')).toBe(true);
      }
    });
  });

  describe('Lockout scenario', () => {
    it('should handle lockout flow correctly', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      // Start with some failed attempts
      expect(isAccountLocked(3, fiveMinutesAgo)).toBe(false);
      expect(getRemainingAttemptsMessage(3)).toContain('2');

      // Hit max attempts
      expect(isAccountLocked(5, now)).toBe(true);
      const remaining = getRemainingLockoutTime(now);
      expect(remaining).toBeGreaterThan(0);
      expect(formatLockoutTime(remaining)).toContain('m');
    });
  });

  describe('Weak PIN detection', () => {
    it('should flag common patterns as weak', () => {
      const weakPins = ['1234', '0000', '1111', '4321', '2580'];

      for (const pin of weakPins) {
        const analysis = analyzePinStrength(pin);
        expect(analysis.strength).toBe('weak');
        expect(analysis.feedback.length).toBeGreaterThan(0);
      }
    });

    it('should accept strong PINs', () => {
      const strongPins = ['847291', '592847', '183746'];

      for (const pin of strongPins) {
        const analysis = analyzePinStrength(pin);
        expect(analysis.strength).not.toBe('weak');
      }
    });
  });
});
