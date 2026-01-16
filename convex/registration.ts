import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

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
 * Characters allowed in verification tokens (URL-safe)
 */
const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationError {
  field: string;
  code: string;
  message: string;
}

interface RegistrationResult {
  success: boolean;
  errors: ValidationError[];
  familyId?: string;
  profileId?: string;
  verificationToken?: string;
  message?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 */
function validateEmailFormat(email: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmed = email.trim();

  if (!trimmed) {
    errors.push({
      field: 'email',
      code: 'REQUIRED',
      message: 'Email is required',
    });
    return errors;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    errors.push({
      field: 'email',
      code: 'INVALID_FORMAT',
      message: 'Please enter a valid email address',
    });
  }

  // Check for common typos in domains
  const domain = trimmed.split('@')[1]?.toLowerCase();
  const typoPatterns = [
    { typo: 'gmial.com', suggestion: 'gmail.com' },
    { typo: 'gmai.com', suggestion: 'gmail.com' },
    { typo: 'gamil.com', suggestion: 'gmail.com' },
    { typo: 'hotmal.com', suggestion: 'hotmail.com' },
    { typo: 'hotnail.com', suggestion: 'hotmail.com' },
    { typo: 'yaho.com', suggestion: 'yahoo.com' },
    { typo: 'yahooo.com', suggestion: 'yahoo.com' },
  ];

  const typo = typoPatterns.find((p) => p.typo === domain);
  if (typo) {
    errors.push({
      field: 'email',
      code: 'POSSIBLE_TYPO',
      message: `Did you mean ${trimmed.replace(domain, typo.suggestion)}?`,
    });
  }

  return errors;
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({
      field: 'password',
      code: 'REQUIRED',
      message: 'Password is required',
    });
    return errors;
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

  // Check for password complexity (at least 2 of: lowercase, uppercase, number, special)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const complexityCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (complexityCount < 2) {
    errors.push({
      field: 'password',
      code: 'WEAK_PASSWORD',
      message: 'Password must contain at least 2 of: lowercase, uppercase, number, special character',
    });
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    'password1',
    '12345678',
    'qwerty12',
    'letmein1',
    'welcome1',
    'pokemon1',
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push({
      field: 'password',
      code: 'COMMON_PASSWORD',
      message: 'This password is too common. Please choose a stronger password.',
    });
  }

  return errors;
}

/**
 * Validate display name
 */
function validateDisplayName(name: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmed = name.trim();

  if (!trimmed) {
    errors.push({
      field: 'displayName',
      code: 'REQUIRED',
      message: 'Display name is required',
    });
    return errors;
  }

  if (trimmed.length < MIN_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      code: 'TOO_SHORT',
      message: `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} character`,
    });
  }

  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      code: 'TOO_LONG',
      message: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`,
    });
  }

  // Check for allowed characters (letters, numbers, spaces, hyphens, apostrophes)
  const allowedCharsRegex = /^[\p{L}\p{N}\s\-']+$/u;
  if (!allowedCharsRegex.test(trimmed)) {
    errors.push({
      field: 'displayName',
      code: 'INVALID_CHARS',
      message: 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    });
  }

  return errors;
}

/**
 * Generate a secure random token
 */
function generateVerificationToken(): string {
  let token = '';
  for (let i = 0; i < EMAIL_VERIFICATION_TOKEN_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * TOKEN_CHARS.length);
    token += TOKEN_CHARS[randomIndex];
  }
  return token;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Check if an email is already registered
 */
export const isEmailRegistered = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    // Check families table
    const existingFamily = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .first();

    return {
      isRegistered: !!existingFamily,
      email: normalizedEmail,
    };
  },
});

/**
 * Validate registration input without creating anything
 */
export const validateRegistrationInput = query({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const errors: ValidationError[] = [];

    // Validate email format
    const emailErrors = validateEmailFormat(args.email);
    errors.push(...emailErrors);

    // Validate password strength
    const passwordErrors = validatePasswordStrength(args.password);
    errors.push(...passwordErrors);

    // Validate display name
    const displayNameErrors = validateDisplayName(args.displayName);
    errors.push(...displayNameErrors);

    // Check if email is already registered (only if email format is valid)
    if (emailErrors.filter((e) => e.code !== 'POSSIBLE_TYPO').length === 0) {
      const normalizedEmail = args.email.trim().toLowerCase();
      const existingFamily = await ctx.db
        .query('families')
        .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
        .first();

      if (existingFamily) {
        errors.push({
          field: 'email',
          code: 'ALREADY_REGISTERED',
          message: 'An account with this email already exists',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedInput: {
        email: args.email.trim().toLowerCase(),
        displayName: args.displayName.trim().replace(/\s+/g, ' '),
      },
    };
  },
});

/**
 * Get the status of an email verification token
 */
export const getVerificationTokenStatus = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!verification) {
      return {
        valid: false,
        reason: 'TOKEN_NOT_FOUND',
        message: 'This verification link is invalid.',
      };
    }

    if (verification.verifiedAt) {
      return {
        valid: false,
        reason: 'ALREADY_VERIFIED',
        message: 'This email has already been verified.',
        familyId: verification.familyId,
      };
    }

    if (verification.expiresAt < Date.now()) {
      return {
        valid: false,
        reason: 'EXPIRED',
        message: 'This verification link has expired. Please request a new one.',
        familyId: verification.familyId,
      };
    }

    return {
      valid: true,
      email: verification.email,
      familyId: verification.familyId,
    };
  },
});

/**
 * Check if a family's email is verified
 */
export const isEmailVerified = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .first();

    return {
      isVerified: verification?.verifiedAt != null,
      verifiedAt: verification?.verifiedAt,
      email: verification?.email,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Register a new parent account.
 * Creates family, parent profile, and email verification token.
 *
 * Note: This mutation does NOT handle password storage directly.
 * Password authentication is handled by Convex Auth's Password provider.
 * This mutation should be called AFTER successful signup via Convex Auth.
 */
export const registerParentAccount = mutation({
  args: {
    email: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args): Promise<RegistrationResult> => {
    const errors: ValidationError[] = [];

    // Validate email format
    const emailErrors = validateEmailFormat(args.email);
    errors.push(...emailErrors.filter((e) => e.code !== 'POSSIBLE_TYPO'));

    // Validate display name
    const displayNameErrors = validateDisplayName(args.displayName);
    errors.push(...displayNameErrors);

    // Check if email is already registered
    const normalizedEmail = args.email.trim().toLowerCase();
    const existingFamily = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .first();

    if (existingFamily) {
      errors.push({
        field: 'email',
        code: 'ALREADY_REGISTERED',
        message: 'An account with this email already exists',
      });
    }

    // Return errors if validation failed
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    // Sanitize inputs
    const sanitizedDisplayName = args.displayName.trim().replace(/\s+/g, ' ');

    // Create family
    const familyId = await ctx.db.insert('families', {
      email: normalizedEmail,
      subscriptionTier: 'free',
    });

    // Create parent profile
    const profileId = await ctx.db.insert('profiles', {
      familyId,
      displayName: sanitizedDisplayName,
      profileType: 'parent',
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000;

    // Store verification token
    await ctx.db.insert('emailVerifications', {
      familyId,
      email: normalizedEmail,
      token: verificationToken,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      errors: [],
      familyId: familyId as unknown as string,
      profileId: profileId as unknown as string,
      verificationToken,
      message: 'Account created! Please check your email to verify your account.',
    };
  },
});

/**
 * Verify email with token
 */
export const verifyEmail = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!verification) {
      return {
        success: false,
        error: 'TOKEN_NOT_FOUND',
        message: 'This verification link is invalid.',
      };
    }

    if (verification.verifiedAt) {
      return {
        success: false,
        error: 'ALREADY_VERIFIED',
        message: 'This email has already been verified.',
        familyId: verification.familyId,
      };
    }

    if (verification.expiresAt < Date.now()) {
      return {
        success: false,
        error: 'EXPIRED',
        message: 'This verification link has expired. Please request a new one.',
        familyId: verification.familyId,
      };
    }

    // Mark as verified
    await ctx.db.patch(verification._id, {
      verifiedAt: Date.now(),
    });

    return {
      success: true,
      familyId: verification.familyId,
      email: verification.email,
      message: 'Email verified successfully! You can now access all features.',
    };
  },
});

/**
 * Resend verification email
 */
export const resendVerificationEmail = mutation({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    // Get the family
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return {
        success: false,
        error: 'FAMILY_NOT_FOUND',
        message: 'Account not found.',
      };
    }

    // Check if already verified
    const existingVerification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .first();

    if (existingVerification?.verifiedAt) {
      return {
        success: false,
        error: 'ALREADY_VERIFIED',
        message: 'This email has already been verified.',
      };
    }

    // Delete old verification tokens for this family
    const oldTokens = await ctx.db
      .query('emailVerifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    for (const token of oldTokens) {
      await ctx.db.delete(token._id);
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000;

    // Store new verification token
    await ctx.db.insert('emailVerifications', {
      familyId: args.familyId,
      email: family.email,
      token: verificationToken,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      verificationToken,
      email: family.email,
      message: 'Verification email sent! Please check your inbox.',
    };
  },
});

/**
 * Internal mutation to clean up expired verification tokens
 */
export const cleanupExpiredTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all expired, unverified tokens
    const allTokens = await ctx.db.query('emailVerifications').collect();

    let deletedCount = 0;
    for (const token of allTokens) {
      // Delete if expired and not verified
      if (token.expiresAt < now && !token.verifiedAt) {
        await ctx.db.delete(token._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});

/**
 * Get registration status for a family
 */
export const getRegistrationStatus = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return null;
    }

    // Get email verification status
    const verification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .first();

    // Get parent profile
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const parentProfile = profiles.find((p) => p.profileType === 'parent');

    return {
      familyId: family._id,
      email: family.email,
      isEmailVerified: verification?.verifiedAt != null,
      verifiedAt: verification?.verifiedAt,
      subscriptionTier: family.subscriptionTier,
      hasParentProfile: !!parentProfile,
      parentProfile: parentProfile
        ? {
            id: parentProfile._id,
            displayName: parentProfile.displayName,
          }
        : null,
      profileCount: profiles.length,
      createdAt: family._creationTime,
    };
  },
});
