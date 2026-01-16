/**
 * Registration utilities for parent account creation and email verification
 *
 * This module provides pure utility functions for:
 * - Email validation and suggestions
 * - Password strength analysis
 * - Display name validation
 * - Verification token utilities
 * - Registration status helpers
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const EMAIL_VERIFICATION_TOKEN_LENGTH = 32;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_DISPLAY_NAME_LENGTH = 1;
export const MAX_DISPLAY_NAME_LENGTH = 30;

/**
 * Common email domain typos and their corrections
 */
export const EMAIL_TYPO_CORRECTIONS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com',
};

/**
 * Common weak passwords to disallow
 */
export const COMMON_WEAK_PASSWORDS = [
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty12',
  'qwerty123',
  'letmein1',
  'welcome1',
  'pokemon1',
  'pokemon123',
  'pikachu1',
  'charizard',
  'cardcollector',
];

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  normalizedEmail: string;
  suggestedCorrection?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  isAcceptable: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  strength: PasswordStrength;
}

export interface DisplayNameValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedName: string;
}

export interface RegistrationValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  emailResult: EmailValidationResult;
  passwordResult: PasswordValidationResult;
  displayNameResult: DisplayNameValidationResult;
}

export interface VerificationStatus {
  isVerified: boolean;
  isPending: boolean;
  isExpired: boolean;
  canResend: boolean;
  expiresAt?: number;
  verifiedAt?: number;
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Check if an email has a valid format
 */
export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Get the domain from an email address
 */
export function getEmailDomain(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  return atIndex >= 0 ? trimmed.slice(atIndex + 1) : '';
}

/**
 * Get a suggested correction for a potentially mistyped email domain
 */
export function getEmailTypoSuggestion(email: string): string | undefined {
  const domain = getEmailDomain(email);
  if (!domain) return undefined;

  const correction = EMAIL_TYPO_CORRECTIONS[domain];
  if (correction) {
    const localPart = email.trim().toLowerCase().split('@')[0];
    return `${localPart}@${correction}`;
  }

  return undefined;
}

/**
 * Normalize an email address (trim, lowercase)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate an email address with detailed feedback
 */
export function validateEmail(email: string): EmailValidationResult {
  const errors: ValidationError[] = [];
  const normalizedEmail = normalizeEmail(email);

  if (!email.trim()) {
    errors.push({
      field: 'email',
      code: 'REQUIRED',
      message: 'Email is required',
    });
    return {
      isValid: false,
      errors,
      normalizedEmail,
    };
  }

  if (!isValidEmailFormat(email)) {
    errors.push({
      field: 'email',
      code: 'INVALID_FORMAT',
      message: 'Please enter a valid email address',
    });
  }

  const suggestedCorrection = getEmailTypoSuggestion(email);

  return {
    isValid: errors.length === 0,
    errors,
    normalizedEmail,
    suggestedCorrection,
  };
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Check if password contains lowercase letters
 */
export function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password);
}

/**
 * Check if password contains uppercase letters
 */
export function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password);
}

/**
 * Check if password contains numbers
 */
export function hasNumber(password: string): boolean {
  return /[0-9]/.test(password);
}

/**
 * Check if password contains special characters
 */
export function hasSpecialChar(password: string): boolean {
  return /[^a-zA-Z0-9]/.test(password);
}

/**
 * Check if password is a common weak password
 */
export function isCommonWeakPassword(password: string): boolean {
  return COMMON_WEAK_PASSWORDS.includes(password.toLowerCase());
}

/**
 * Count character type categories in password
 */
export function countPasswordCategories(password: string): number {
  let count = 0;
  if (hasLowercase(password)) count++;
  if (hasUppercase(password)) count++;
  if (hasNumber(password)) count++;
  if (hasSpecialChar(password)) count++;
  return count;
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      feedback: ['Password is required'],
      isAcceptable: false,
    };
  }

  const feedback: string[] = [];
  let score = 0;

  // Length scoring
  if (password.length >= MIN_PASSWORD_LENGTH) {
    score += 1;
  } else {
    feedback.push(`Add ${MIN_PASSWORD_LENGTH - password.length} more characters`);
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Category scoring
  const categories = countPasswordCategories(password);
  if (categories >= 2) {
    score += 1;
  } else {
    feedback.push('Add uppercase, numbers, or special characters');
  }

  if (categories >= 3) {
    score += 1;
  }

  // Deductions
  if (isCommonWeakPassword(password)) {
    score = Math.max(0, score - 2);
    feedback.push('This is a commonly used password');
  }

  // Repetitive patterns
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters');
  }

  // Level assignment
  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score <= 1) {
    level = 'weak';
    if (feedback.length === 0) feedback.push('Password is too weak');
  } else if (score === 2) {
    level = 'fair';
  } else if (score === 3) {
    level = 'good';
  } else {
    level = 'strong';
  }

  // Acceptable requires at least MIN_PASSWORD_LENGTH and 2 categories
  const isAcceptable =
    password.length >= MIN_PASSWORD_LENGTH &&
    categories >= 2 &&
    !isCommonWeakPassword(password);

  return {
    score,
    level,
    feedback,
    isAcceptable,
  };
}

/**
 * Validate password with detailed feedback
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: ValidationError[] = [];
  const strength = calculatePasswordStrength(password);

  if (!password) {
    errors.push({
      field: 'password',
      code: 'REQUIRED',
      message: 'Password is required',
    });
    return { isValid: false, errors, strength };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: 'password',
      code: 'TOO_SHORT',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push({
      field: 'password',
      code: 'TOO_LONG',
      message: `Password must be ${MAX_PASSWORD_LENGTH} characters or less`,
    });
  }

  const categories = countPasswordCategories(password);
  if (categories < 2) {
    errors.push({
      field: 'password',
      code: 'WEAK_PASSWORD',
      message:
        'Password must contain at least 2 of: lowercase, uppercase, number, special character',
    });
  }

  if (isCommonWeakPassword(password)) {
    errors.push({
      field: 'password',
      code: 'COMMON_PASSWORD',
      message: 'This password is too common. Please choose a stronger password.',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Get a color for password strength indicator
 */
export function getPasswordStrengthColor(level: PasswordStrength['level']): string {
  switch (level) {
    case 'weak':
      return '#ef4444'; // red
    case 'fair':
      return '#f59e0b'; // amber
    case 'good':
      return '#22c55e'; // green
    case 'strong':
      return '#10b981'; // emerald
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get a label for password strength
 */
export function getPasswordStrengthLabel(level: PasswordStrength['level']): string {
  switch (level) {
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
}

// ============================================================================
// DISPLAY NAME VALIDATION
// ============================================================================

/**
 * Check if display name contains only allowed characters
 */
export function hasAllowedDisplayNameChars(name: string): boolean {
  // Allow letters (any language), numbers, spaces, hyphens, apostrophes
  const allowedCharsRegex = /^[\p{L}\p{N}\s\-']+$/u;
  return allowedCharsRegex.test(name.trim());
}

/**
 * Sanitize a display name (trim, normalize spaces)
 */
export function sanitizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Validate display name with detailed feedback
 */
export function validateDisplayName(name: string): DisplayNameValidationResult {
  const errors: ValidationError[] = [];
  const sanitizedName = sanitizeDisplayName(name);

  if (!sanitizedName) {
    errors.push({
      field: 'displayName',
      code: 'REQUIRED',
      message: 'Display name is required',
    });
    return {
      isValid: false,
      errors,
      sanitizedName,
    };
  }

  if (sanitizedName.length < MIN_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      code: 'TOO_SHORT',
      message: `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} character`,
    });
  }

  if (sanitizedName.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      code: 'TOO_LONG',
      message: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`,
    });
  }

  if (!hasAllowedDisplayNameChars(name.trim())) {
    errors.push({
      field: 'displayName',
      code: 'INVALID_CHARS',
      message:
        'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedName,
  };
}

// ============================================================================
// COMBINED REGISTRATION VALIDATION
// ============================================================================

/**
 * Validate all registration fields at once
 */
export function validateRegistration(
  email: string,
  password: string,
  displayName: string
): RegistrationValidationResult {
  const emailResult = validateEmail(email);
  const passwordResult = validatePassword(password);
  const displayNameResult = validateDisplayName(displayName);

  const allErrors = [
    ...emailResult.errors,
    ...passwordResult.errors,
    ...displayNameResult.errors,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    emailResult,
    passwordResult,
    displayNameResult,
  };
}

// ============================================================================
// VERIFICATION STATUS HELPERS
// ============================================================================

/**
 * Parse verification status from API response
 */
export function parseVerificationStatus(data: {
  isVerified?: boolean;
  verifiedAt?: number | null;
  expiresAt?: number | null;
}): VerificationStatus {
  const now = Date.now();
  const isVerified = data.isVerified ?? data.verifiedAt != null;
  const isExpired = data.expiresAt != null && data.expiresAt < now;
  const isPending = !isVerified && !isExpired;
  const canResend = !isVerified;

  return {
    isVerified,
    isPending,
    isExpired,
    canResend,
    expiresAt: data.expiresAt ?? undefined,
    verifiedAt: data.verifiedAt ?? undefined,
  };
}

/**
 * Get a user-friendly verification status message
 */
export function getVerificationStatusMessage(status: VerificationStatus): string {
  if (status.isVerified) {
    return 'Email verified';
  }
  if (status.isExpired) {
    return 'Verification link expired. Please request a new one.';
  }
  if (status.isPending) {
    return 'Please check your email for the verification link.';
  }
  return 'Unknown status';
}

/**
 * Get time remaining until verification expires
 */
export function getVerificationTimeRemaining(expiresAt: number): {
  hours: number;
  minutes: number;
  isExpired: boolean;
  message: string;
} {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    return {
      hours: 0,
      minutes: 0,
      isExpired: true,
      message: 'Expired',
    };
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  let message: string;
  if (hours > 0) {
    message = `Expires in ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    message = `Expires in ${minutes}m`;
  } else {
    message = 'Expires soon';
  }

  return {
    hours,
    minutes,
    isExpired: false,
    message,
  };
}

// ============================================================================
// VERIFICATION TOKEN UTILITIES
// ============================================================================

/**
 * Check if a token looks valid (correct length and characters)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || token.length !== EMAIL_VERIFICATION_TOKEN_LENGTH) {
    return false;
  }

  // Check if token contains only alphanumeric characters
  return /^[A-Za-z0-9]+$/.test(token);
}

/**
 * Extract verification token from URL
 */
export function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Check for token in query params
    const tokenParam = urlObj.searchParams.get('token');
    if (tokenParam && isValidTokenFormat(tokenParam)) {
      return tokenParam;
    }

    // Check for token in path (e.g., /verify/TOKEN)
    const pathParts = urlObj.pathname.split('/');
    for (const part of pathParts) {
      if (isValidTokenFormat(part)) {
        return part;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build a verification URL
 */
export function buildVerificationUrl(baseUrl: string, token: string): string {
  const url = new URL('/verify', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Get all errors for a specific field
 */
export function getFieldErrors(errors: ValidationError[], field: string): ValidationError[] {
  return errors.filter((e) => e.field === field);
}

/**
 * Check if a specific error code exists
 */
export function hasErrorCode(errors: ValidationError[], code: string): boolean {
  return errors.some((e) => e.code === code);
}

/**
 * Get the first error message for a field
 */
export function getFirstFieldError(errors: ValidationError[], field: string): string | null {
  const fieldErrors = getFieldErrors(errors, field);
  return fieldErrors.length > 0 ? fieldErrors[0].message : null;
}

/**
 * Format errors for display (grouped by field)
 */
export function formatErrorsForDisplay(
  errors: ValidationError[]
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const error of errors) {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error.message);
  }

  return grouped;
}
