/**
 * API Request Validation Middleware
 *
 * Centralized validation utilities for API routes to ensure consistent
 * validation of game parameters, query strings, and request bodies.
 */

import { NextResponse } from 'next/server';

/**
 * Valid game slugs for the TCG API
 * Note: Only 4 games are currently supported: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana
 */
export const VALID_GAMES = ['pokemon', 'yugioh', 'onepiece', 'lorcana'] as const;

/**
 * Game slug type derived from the valid games array
 */
export type GameSlug = (typeof VALID_GAMES)[number];

/**
 * Common types/colors by game for validation hints and suggestions
 */
export const COMMON_TYPES_BY_GAME: Record<GameSlug, readonly string[]> = {
  pokemon: [
    'Colorless',
    'Darkness',
    'Dragon',
    'Fairy',
    'Fighting',
    'Fire',
    'Grass',
    'Lightning',
    'Metal',
    'Psychic',
    'Water',
  ] as const,
  yugioh: ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'] as const,
  onepiece: ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'] as const,
  lorcana: ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'] as const,
} as const;

/**
 * Validation result type
 */
export interface ValidationResult<T = unknown> {
  /** Whether the validation passed */
  valid: boolean;
  /** The validated/transformed value (only present if valid) */
  value?: T;
  /** Error response to return (only present if invalid) */
  errorResponse?: NextResponse;
  /** Error message (for logging) */
  errorMessage?: string;
}

/**
 * Type guard to check if a string is a valid game slug
 */
export function isValidGameSlug(value: string): value is GameSlug {
  return VALID_GAMES.includes(value as GameSlug);
}

/**
 * Get the list of valid game slugs as a copy
 */
export function getValidGames(): GameSlug[] {
  return [...VALID_GAMES];
}

/**
 * Get common types for a specific game
 */
export function getCommonTypesForGame(game: GameSlug): readonly string[] {
  return COMMON_TYPES_BY_GAME[game];
}

/**
 * Create a standardized error response for invalid parameters
 */
export function createValidationErrorResponse(
  error: string,
  details?: Record<string, unknown>,
  status = 400
): NextResponse {
  return NextResponse.json(
    {
      error,
      ...details,
    },
    { status }
  );
}

/**
 * Validate the game query parameter
 *
 * @param game - The game parameter value from query string
 * @param options - Validation options
 * @returns Validation result with validated game slug or error response
 */
export function validateGameParam(
  game: string | null,
  options: {
    /** Default game if not provided (set to null to require game param) */
    defaultGame?: GameSlug | null;
    /** Custom error message */
    errorMessage?: string;
  } = {}
): ValidationResult<GameSlug> {
  const { defaultGame = 'pokemon', errorMessage } = options;

  // Use default if not provided
  if (game === null || game === '') {
    if (defaultGame === null) {
      return {
        valid: false,
        errorResponse: createValidationErrorResponse(
          errorMessage || 'Missing required game parameter',
          { validOptions: VALID_GAMES }
        ),
        errorMessage: 'Missing required game parameter',
      };
    }
    return { valid: true, value: defaultGame };
  }

  // Validate against allowed values
  if (!isValidGameSlug(game)) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(errorMessage || 'Invalid game parameter', {
        validOptions: VALID_GAMES,
        received: game,
      }),
      errorMessage: `Invalid game parameter: ${game}`,
    };
  }

  return { valid: true, value: game };
}

/**
 * Options for string validation
 */
export interface StringValidationOptions {
  /** Minimum length (inclusive) */
  minLength?: number;
  /** Maximum length (inclusive) */
  maxLength?: number;
  /** Whether to trim whitespace before validation */
  trim?: boolean;
  /** Error message for empty/missing values */
  requiredMessage?: string;
  /** Error message for too short values */
  minLengthMessage?: string;
  /** Error message for too long values */
  maxLengthMessage?: string;
  /** Whether the parameter is required */
  required?: boolean;
}

/**
 * Validate a string query parameter
 *
 * @param value - The parameter value from query string
 * @param paramName - The name of the parameter (for error messages)
 * @param options - Validation options
 * @returns Validation result with validated string or error response
 */
export function validateStringParam(
  value: string | null,
  paramName: string,
  options: StringValidationOptions = {}
): ValidationResult<string | undefined> {
  const {
    minLength,
    maxLength,
    trim = true,
    requiredMessage,
    minLengthMessage,
    maxLengthMessage,
    required = false,
  } = options;

  // Handle null/empty case
  if (value === null || value === '') {
    if (required) {
      return {
        valid: false,
        errorResponse: createValidationErrorResponse(requiredMessage || `${paramName} is required`),
        errorMessage: `${paramName} is required`,
      };
    }
    return { valid: true, value: undefined };
  }

  // Trim if requested
  const processedValue = trim ? value.trim() : value;

  // Check if empty after trim
  if (processedValue === '') {
    if (required) {
      return {
        valid: false,
        errorResponse: createValidationErrorResponse(requiredMessage || `${paramName} is required`),
        errorMessage: `${paramName} is required`,
      };
    }
    return { valid: true, value: undefined };
  }

  // Validate minimum length
  if (minLength !== undefined && processedValue.length < minLength) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(
        minLengthMessage || `${paramName} must be at least ${minLength} characters`
      ),
      errorMessage: `${paramName} too short: ${processedValue.length} < ${minLength}`,
    };
  }

  // Validate maximum length
  if (maxLength !== undefined && processedValue.length > maxLength) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(maxLengthMessage || `${paramName} is too long`),
      errorMessage: `${paramName} too long: ${processedValue.length} > ${maxLength}`,
    };
  }

  return { valid: true, value: processedValue };
}

/**
 * Options for integer validation
 */
export interface IntegerValidationOptions {
  /** Minimum value (inclusive) */
  min?: number;
  /** Maximum value (inclusive) */
  max?: number;
  /** Default value if not provided */
  defaultValue?: number;
  /** Whether invalid numbers should use the default instead of erroring */
  useDefaultOnInvalid?: boolean;
  /** Whether the parameter is required (no default) */
  required?: boolean;
  /** Error message for invalid values */
  invalidMessage?: string;
}

/**
 * Validate and parse an integer query parameter
 *
 * @param value - The parameter value from query string
 * @param paramName - The name of the parameter (for error messages)
 * @param options - Validation options
 * @returns Validation result with validated integer or error response
 */
export function validateIntegerParam(
  value: string | null,
  paramName: string,
  options: IntegerValidationOptions = {}
): ValidationResult<number | undefined> {
  const {
    min,
    max,
    defaultValue,
    useDefaultOnInvalid = true,
    required = false,
    invalidMessage,
  } = options;

  // Handle null case
  if (value === null || value === '') {
    if (required) {
      return {
        valid: false,
        errorResponse: createValidationErrorResponse(`${paramName} is required`),
        errorMessage: `${paramName} is required`,
      };
    }
    return { valid: true, value: defaultValue };
  }

  // Parse integer
  const parsed = parseInt(value, 10);

  // Handle invalid number
  if (isNaN(parsed)) {
    if (useDefaultOnInvalid && defaultValue !== undefined) {
      return { valid: true, value: defaultValue };
    }
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(
        invalidMessage || `Invalid ${paramName} parameter`,
        {
          received: value,
          message: `${paramName} must be a valid integer`,
        }
      ),
      errorMessage: `Invalid ${paramName}: not a number`,
    };
  }

  // Apply min/max bounds
  let finalValue = parsed;

  if (min !== undefined) {
    if (parsed < min) {
      // If useDefaultOnInvalid and value is out of bounds, clamp instead of error
      if (useDefaultOnInvalid) {
        finalValue = min;
      } else {
        return {
          valid: false,
          errorResponse: createValidationErrorResponse(
            invalidMessage || `Invalid ${paramName} parameter`,
            {
              received: value,
              message: `${paramName} must be at least ${min}`,
            }
          ),
          errorMessage: `${paramName} below minimum: ${parsed} < ${min}`,
        };
      }
    }
  }

  if (max !== undefined) {
    if (parsed > max) {
      if (useDefaultOnInvalid) {
        finalValue = Math.min(finalValue, max);
      } else {
        return {
          valid: false,
          errorResponse: createValidationErrorResponse(
            invalidMessage || `Invalid ${paramName} parameter`,
            {
              received: value,
              message: `${paramName} must be at most ${max}`,
            }
          ),
          errorMessage: `${paramName} above maximum: ${parsed} > ${max}`,
        };
      }
    }
  }

  return { valid: true, value: finalValue };
}

/**
 * Validate an array parameter (typically from JSON body)
 *
 * @param value - The parameter value
 * @param paramName - The name of the parameter (for error messages)
 * @param options - Validation options
 * @returns Validation result with validated array or error response
 */
export function validateArrayParam<T>(
  value: unknown,
  paramName: string,
  options: {
    /** Minimum array length */
    minLength?: number;
    /** Maximum array length */
    maxLength?: number;
    /** Whether the parameter is required */
    required?: boolean;
    /** Validator function for each item */
    itemValidator?: (item: unknown, index: number) => boolean;
    /** Error message for invalid items */
    itemErrorMessage?: string;
  } = {}
): ValidationResult<T[]> {
  const { minLength = 0, maxLength, required = false, itemValidator, itemErrorMessage } = options;

  // Handle undefined/null case
  if (value === undefined || value === null) {
    if (required) {
      return {
        valid: false,
        errorResponse: createValidationErrorResponse(`${paramName} is required`),
        errorMessage: `${paramName} is required`,
      };
    }
    return { valid: true, value: [] };
  }

  // Validate is array
  if (!Array.isArray(value)) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(`${paramName} must be an array`, {
        received: typeof value,
      }),
      errorMessage: `${paramName} is not an array`,
    };
  }

  // Validate minimum length
  if (value.length < minLength) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(
        `${paramName} must have at least ${minLength} items`
      ),
      errorMessage: `${paramName} too short: ${value.length} < ${minLength}`,
    };
  }

  // Validate maximum length
  if (maxLength !== undefined && value.length > maxLength) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(
        `Too many items in ${paramName} (max ${maxLength})`,
        {
          received: value.length,
          max: maxLength,
        }
      ),
      errorMessage: `${paramName} too long: ${value.length} > ${maxLength}`,
    };
  }

  // Validate individual items
  if (itemValidator) {
    const invalidIndices: number[] = [];
    for (let i = 0; i < value.length; i++) {
      if (!itemValidator(value[i], i)) {
        invalidIndices.push(i);
      }
    }
    if (invalidIndices.length > 0) {
      return {
        valid: false,
        errorResponse: createValidationErrorResponse(
          itemErrorMessage || `Invalid items in ${paramName}`,
          { invalidCount: invalidIndices.length }
        ),
        errorMessage: `${paramName} has ${invalidIndices.length} invalid items`,
      };
    }
  }

  return { valid: true, value: value as T[] };
}

/**
 * Validate that at least one of the specified parameters is provided
 *
 * @param params - Object with parameter names as keys and their values
 * @param paramNames - List of parameter names to check
 * @returns Validation result
 */
export function validateAtLeastOne(
  params: Record<string, unknown>,
  paramNames: string[]
): ValidationResult<void> {
  const hasAny = paramNames.some((name) => {
    const value = params[name];
    return value !== undefined && value !== null && value !== '';
  });

  if (!hasAny) {
    return {
      valid: false,
      errorResponse: createValidationErrorResponse(
        `At least one filter (${paramNames.join(', ')}) is required`
      ),
      errorMessage: `Missing required filter: one of ${paramNames.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate Convex URL environment variable is configured
 *
 * @returns Validation result with the URL or error response
 */
export function validateConvexConfig(): ValidationResult<string> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    console.error('NEXT_PUBLIC_CONVEX_URL not configured');
    return {
      valid: false,
      errorResponse: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
      errorMessage: 'NEXT_PUBLIC_CONVEX_URL not configured',
    };
  }

  return { valid: true, value: convexUrl };
}

/**
 * Helper to check if validation result is valid
 */
export function isValidResult<T>(
  result: ValidationResult<T>
): result is ValidationResult<T> & { valid: true; value: T } {
  return result.valid === true;
}

/**
 * Combine multiple validation results, returning the first error if any
 *
 * @param results - Array of validation results
 * @returns Combined validation result
 */
export function combineValidations(
  ...results: ValidationResult<unknown>[]
): ValidationResult<void> {
  for (const result of results) {
    if (!result.valid) {
      return result as ValidationResult<void>;
    }
  }
  return { valid: true };
}
