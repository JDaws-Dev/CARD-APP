// ============================================================================
// PIN PROTECTION UTILITIES
// Pure functions for PIN validation, hashing, and verification
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum PIN length (4 digits) */
export const MIN_PIN_LENGTH = 4;

/** Maximum PIN length (6 digits) */
export const MAX_PIN_LENGTH = 6;

/** Salt length for hashing (16 bytes = 32 hex chars) */
export const SALT_LENGTH = 16;

/** Number of iterations for PBKDF2 */
export const PBKDF2_ITERATIONS = 100000;

/** Hash algorithm */
export const HASH_ALGORITHM = 'SHA-256';

// ============================================================================
// TYPES
// ============================================================================

/** PIN validation result */
export interface PinValidationResult {
  isValid: boolean;
  error?: string;
}

/** PIN hash with salt (format: salt:hash) */
export type PinHash = string;

/** Parsed PIN hash components */
export interface ParsedPinHash {
  salt: string;
  hash: string;
}

/** PIN strength level */
export type PinStrength = 'weak' | 'medium' | 'strong';

/** PIN strength analysis */
export interface PinStrengthAnalysis {
  strength: PinStrength;
  score: number; // 0-100
  feedback: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a PIN contains only digits
 */
export function isPinDigitsOnly(pin: string): boolean {
  return /^\d+$/.test(pin);
}

/**
 * Check if a PIN is within the allowed length range
 */
export function isPinLengthValid(pin: string): boolean {
  return pin.length >= MIN_PIN_LENGTH && pin.length <= MAX_PIN_LENGTH;
}

/**
 * Validate a PIN and return detailed error if invalid
 */
export function validatePin(pin: string): PinValidationResult {
  if (!pin || typeof pin !== 'string') {
    return { isValid: false, error: 'PIN is required' };
  }

  if (pin.length < MIN_PIN_LENGTH) {
    return {
      isValid: false,
      error: `PIN must be at least ${MIN_PIN_LENGTH} digits`,
    };
  }

  if (pin.length > MAX_PIN_LENGTH) {
    return {
      isValid: false,
      error: `PIN must be at most ${MAX_PIN_LENGTH} digits`,
    };
  }

  if (!isPinDigitsOnly(pin)) {
    return { isValid: false, error: 'PIN must contain only digits' };
  }

  return { isValid: true };
}

/**
 * Check if a PIN is valid (convenience function)
 */
export function isValidPin(pin: string): boolean {
  return validatePin(pin).isValid;
}

// ============================================================================
// PIN STRENGTH ANALYSIS
// ============================================================================

/**
 * Check if PIN contains repeated digits (e.g., 1111, 2222)
 */
export function hasRepeatedDigits(pin: string): boolean {
  const digits = pin.split('');
  return digits.every((d) => d === digits[0]);
}

/**
 * Check if PIN is a sequential pattern (e.g., 1234, 4321, 5678)
 */
export function isSequentialPattern(pin: string): boolean {
  const ascending = '0123456789';
  const descending = '9876543210';

  // Check if the PIN is a substring of ascending or descending sequence
  return ascending.includes(pin) || descending.includes(pin);
}

/**
 * Check if PIN contains only two unique digits
 */
export function hasOnlyTwoDigits(pin: string): boolean {
  const uniqueDigits = new Set(pin.split(''));
  return uniqueDigits.size <= 2;
}

/**
 * Common weak PINs that should be avoided
 */
export const COMMON_WEAK_PINS = [
  '1234',
  '0000',
  '1111',
  '2222',
  '3333',
  '4444',
  '5555',
  '6666',
  '7777',
  '8888',
  '9999',
  '1212',
  '1313',
  '2020',
  '4321',
  '6789',
  '1122',
  '2580', // Vertical line on keypad
  '0852', // Vertical line reversed
  '123456',
  '654321',
];

/**
 * Check if PIN is a commonly used weak PIN
 */
export function isCommonWeakPin(pin: string): boolean {
  return COMMON_WEAK_PINS.includes(pin);
}

/**
 * Calculate the number of unique digits in a PIN
 */
export function countUniqueDigits(pin: string): number {
  return new Set(pin.split('')).size;
}

/**
 * Analyze PIN strength and provide feedback
 */
export function analyzePinStrength(pin: string): PinStrengthAnalysis {
  const feedback: string[] = [];
  let score = 50; // Start at medium

  // Length bonus
  if (pin.length > MIN_PIN_LENGTH) {
    score += (pin.length - MIN_PIN_LENGTH) * 10;
  }

  // Unique digits bonus
  const uniqueDigits = countUniqueDigits(pin);
  if (uniqueDigits >= 4) {
    score += 15;
  } else if (uniqueDigits === 3) {
    score += 5;
  } else if (uniqueDigits <= 2) {
    score -= 20;
    feedback.push('Use more unique digits');
  }

  // Pattern penalties
  if (hasRepeatedDigits(pin)) {
    score -= 30;
    feedback.push('Avoid using all the same digit');
  }

  if (isSequentialPattern(pin)) {
    score -= 25;
    feedback.push('Avoid sequential patterns like 1234');
  }

  if (isCommonWeakPin(pin)) {
    score -= 35;
    feedback.push('This is a commonly used PIN');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine strength level
  let strength: PinStrength;
  if (score < 35) {
    strength = 'weak';
    if (feedback.length === 0) {
      feedback.push('Consider using a more complex PIN');
    }
  } else if (score < 70) {
    strength = 'medium';
  } else {
    strength = 'strong';
    if (feedback.length === 0) {
      feedback.push('Good PIN choice!');
    }
  }

  return { strength, score, feedback };
}

/**
 * Get a color class for PIN strength display
 */
export function getPinStrengthColor(strength: PinStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
  }
}

/**
 * Get display label for PIN strength
 */
export function getPinStrengthLabel(strength: PinStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
  }
}

// ============================================================================
// HASHING UTILITIES (Pure functions for preparing hash operations)
// ============================================================================

/**
 * Generate a random salt as hex string
 * Note: This uses crypto.getRandomValues which is available in browsers and Node.js
 */
export function generateSalt(): string {
  const buffer = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a PIN with salt using PBKDF2
 * This is an async function that uses the Web Crypto API
 */
export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  const saltData = hexToBytes(salt);

  // Import the PIN as a key
  const keyMaterial = await crypto.subtle.importKey('raw', pinData, 'PBKDF2', false, [
    'deriveBits',
  ]);

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  // Convert to hex string
  return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * Create a PIN hash (salt:hash format)
 */
export async function createPinHash(pin: string): Promise<PinHash> {
  const salt = generateSalt();
  const hash = await hashPinWithSalt(pin, salt);
  return `${salt}:${hash}`;
}

/**
 * Parse a stored PIN hash into components
 */
export function parsePinHash(pinHash: PinHash): ParsedPinHash | null {
  if (!pinHash || typeof pinHash !== 'string') {
    return null;
  }

  const parts = pinHash.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const [salt, hash] = parts;

  // Validate hex format
  if (!/^[0-9a-f]+$/i.test(salt) || !/^[0-9a-f]+$/i.test(hash)) {
    return null;
  }

  return { salt, hash };
}

/**
 * Verify a PIN against a stored hash
 */
export async function verifyPin(pin: string, storedHash: PinHash): Promise<boolean> {
  const parsed = parsePinHash(storedHash);
  if (!parsed) {
    return false;
  }

  const computedHash = await hashPinWithSalt(pin, parsed.salt);
  return computedHash === parsed.hash;
}

// ============================================================================
// PIN DISPLAY UTILITIES
// ============================================================================

/**
 * Mask a PIN for display (e.g., "****")
 */
export function maskPin(pin: string): string {
  return '•'.repeat(pin.length);
}

/**
 * Format PIN input hint
 */
export function formatPinHint(): string {
  return `Enter a ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digit PIN`;
}

/**
 * Get remaining digits message for PIN entry
 */
export function getRemainingDigitsMessage(currentLength: number): string {
  const remaining = MIN_PIN_LENGTH - currentLength;
  if (remaining > 0) {
    return `${remaining} more digit${remaining === 1 ? '' : 's'} needed`;
  }
  const available = MAX_PIN_LENGTH - currentLength;
  if (available > 0) {
    return `${available} more digit${available === 1 ? '' : 's'} allowed`;
  }
  return 'Maximum length reached';
}

// ============================================================================
// PIN STATE UTILITIES
// ============================================================================

/**
 * Check if a family has a PIN set
 */
export function hasPinSet(parentPinHash: string | undefined | null): boolean {
  return !!parentPinHash && parentPinHash.length > 0;
}

/**
 * Check if PIN protection is required for an action
 */
export function requiresPinProtection(
  action: 'view_prices' | 'access_settings' | 'delete_profile' | 'change_subscription',
  profileType: 'parent' | 'child' | undefined
): boolean {
  // Only parent profiles can access these features
  if (profileType === 'child') {
    return true; // Always require PIN for child trying to access parent features
  }

  // Parent profiles don't need PIN for their own features
  return false;
}

/**
 * Get list of features that require PIN protection for children
 */
export function getPinProtectedFeatures(): string[] {
  return [
    'View card prices',
    'Access parent settings',
    'Delete profiles',
    'Manage subscription',
    'View family activity',
    'Export collection data',
  ];
}

// ============================================================================
// ATTEMPT TRACKING UTILITIES (for rate limiting)
// ============================================================================

/** Maximum failed PIN attempts before lockout */
export const MAX_PIN_ATTEMPTS = 5;

/** Lockout duration in milliseconds (15 minutes) */
export const PIN_LOCKOUT_DURATION = 15 * 60 * 1000;

/**
 * Check if account is locked due to too many failed attempts
 */
export function isAccountLocked(
  failedAttempts: number,
  lastAttemptTime: number | undefined
): boolean {
  if (failedAttempts < MAX_PIN_ATTEMPTS) {
    return false;
  }

  if (!lastAttemptTime) {
    return false;
  }

  const timeSinceLastAttempt = Date.now() - lastAttemptTime;
  return timeSinceLastAttempt < PIN_LOCKOUT_DURATION;
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockoutTime(lastAttemptTime: number | undefined): number {
  if (!lastAttemptTime) {
    return 0;
  }

  const elapsed = Date.now() - lastAttemptTime;
  const remaining = PIN_LOCKOUT_DURATION - elapsed;
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Format lockout time for display
 */
export function formatLockoutTime(seconds: number): string {
  if (seconds <= 0) {
    return 'Unlocked';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Get message for remaining attempts
 */
export function getRemainingAttemptsMessage(failedAttempts: number): string {
  const remaining = MAX_PIN_ATTEMPTS - failedAttempts;

  if (remaining <= 0) {
    return 'Account is temporarily locked';
  }

  if (remaining === 1) {
    return 'Warning: 1 attempt remaining before lockout';
  }

  return `${remaining} attempts remaining`;
}
