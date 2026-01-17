import { describe, it, expect } from 'vitest';
import {
  VALID_GAMES,
  COMMON_TYPES_BY_GAME,
  isValidGameSlug,
  getValidGames,
  getCommonTypesForGame,
  createValidationErrorResponse,
  validateGameParam,
  validateStringParam,
  validateIntegerParam,
  validateArrayParam,
  validateAtLeastOne,
  validateConvexConfig,
  isValidResult,
  combineValidations,
  type GameSlug,
  type ValidationResult,
} from '../apiValidation';

describe('API Validation Middleware', () => {
  describe('VALID_GAMES constant', () => {
    it('contains exactly 4 valid game slugs', () => {
      // Only 4 games are supported: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana
      expect(VALID_GAMES).toHaveLength(4);
    });

    it('includes all expected game slugs', () => {
      expect(VALID_GAMES).toContain('pokemon');
      expect(VALID_GAMES).toContain('yugioh');
      expect(VALID_GAMES).toContain('onepiece');
      expect(VALID_GAMES).toContain('lorcana');
    });

    it('is a readonly array', () => {
      // Type check - attempting to modify should fail at compile time
      // At runtime, we can verify the array contents are as expected
      expect(VALID_GAMES[0]).toBe('pokemon');
    });
  });

  describe('COMMON_TYPES_BY_GAME constant', () => {
    it('has entries for all valid games', () => {
      for (const game of VALID_GAMES) {
        expect(COMMON_TYPES_BY_GAME[game]).toBeDefined();
        expect(Array.isArray(COMMON_TYPES_BY_GAME[game])).toBe(true);
      }
    });

    it('has correct Pokemon types', () => {
      const pokemonTypes = COMMON_TYPES_BY_GAME.pokemon;
      expect(pokemonTypes).toContain('Fire');
      expect(pokemonTypes).toContain('Water');
      expect(pokemonTypes).toContain('Grass');
      expect(pokemonTypes).toContain('Lightning');
      expect(pokemonTypes).toContain('Psychic');
    });

    it('has correct Yu-Gi-Oh! attributes', () => {
      const yugiohTypes = COMMON_TYPES_BY_GAME.yugioh;
      expect(yugiohTypes).toContain('DARK');
      expect(yugiohTypes).toContain('LIGHT');
      expect(yugiohTypes).toContain('EARTH');
      expect(yugiohTypes).toContain('DIVINE');
    });

    it('has correct One Piece colors', () => {
      const onepieceTypes = COMMON_TYPES_BY_GAME.onepiece;
      expect(onepieceTypes).toBeDefined();
      expect(Array.isArray(onepieceTypes)).toBe(true);
    });

    it('has correct Lorcana inks', () => {
      const lorcanaTypes = COMMON_TYPES_BY_GAME.lorcana;
      expect(lorcanaTypes).toContain('Amber');
      expect(lorcanaTypes).toContain('Amethyst');
      expect(lorcanaTypes).toContain('Steel');
    });
  });

  describe('isValidGameSlug', () => {
    it('returns true for valid game slugs', () => {
      expect(isValidGameSlug('pokemon')).toBe(true);
      expect(isValidGameSlug('yugioh')).toBe(true);
      expect(isValidGameSlug('onepiece')).toBe(true);
      expect(isValidGameSlug('lorcana')).toBe(true);
    });

    it('returns false for invalid game slugs', () => {
      expect(isValidGameSlug('invalid')).toBe(false);
      expect(isValidGameSlug('Pokemon')).toBe(false); // case-sensitive
      expect(isValidGameSlug('POKEMON')).toBe(false);
      expect(isValidGameSlug('')).toBe(false);
      expect(isValidGameSlug('magic')).toBe(false);
      expect(isValidGameSlug('yu-gi-oh')).toBe(false);
      // Unsupported games should return false
      expect(isValidGameSlug('mtg')).toBe(false);
      expect(isValidGameSlug('digimon')).toBe(false);
      expect(isValidGameSlug('dragonball')).toBe(false);
    });

    it('acts as a type guard', () => {
      const value: string = 'pokemon';
      if (isValidGameSlug(value)) {
        // TypeScript should recognize value as GameSlug here
        const game: GameSlug = value;
        expect(game).toBe('pokemon');
      }
    });
  });

  describe('getValidGames', () => {
    it('returns a copy of the valid games array', () => {
      const games = getValidGames();
      expect(games).toEqual([...VALID_GAMES]);
    });

    it('returns a new array each time (not a reference)', () => {
      const games1 = getValidGames();
      const games2 = getValidGames();
      expect(games1).not.toBe(games2);
      expect(games1).toEqual(games2);
    });

    it('returned array can be modified without affecting original', () => {
      const games = getValidGames();
      games.push('test' as GameSlug);
      expect(VALID_GAMES).toHaveLength(4);
    });
  });

  describe('getCommonTypesForGame', () => {
    it('returns types for pokemon', () => {
      const types = getCommonTypesForGame('pokemon');
      expect(types).toEqual(COMMON_TYPES_BY_GAME.pokemon);
    });

    it('returns types for yugioh', () => {
      const types = getCommonTypesForGame('yugioh');
      expect(types).toEqual(COMMON_TYPES_BY_GAME.yugioh);
    });

    it('returns types for all valid games', () => {
      for (const game of VALID_GAMES) {
        const types = getCommonTypesForGame(game);
        expect(types.length).toBeGreaterThan(0);
      }
    });
  });

  describe('createValidationErrorResponse', () => {
    it('creates a 400 response by default', async () => {
      const response = createValidationErrorResponse('Test error');
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Test error');
    });

    it('includes additional details in response', async () => {
      const response = createValidationErrorResponse('Invalid param', {
        validOptions: ['a', 'b'],
        received: 'c',
      });
      const body = await response.json();
      expect(body.error).toBe('Invalid param');
      expect(body.validOptions).toEqual(['a', 'b']);
      expect(body.received).toBe('c');
    });

    it('allows custom status codes', async () => {
      const response = createValidationErrorResponse('Server error', {}, 500);
      expect(response.status).toBe(500);
    });
  });

  describe('validateGameParam', () => {
    it('validates valid game slugs', () => {
      const result = validateGameParam('pokemon');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('pokemon');
    });

    it('validates all valid game slugs', () => {
      for (const game of VALID_GAMES) {
        const result = validateGameParam(game);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(game);
      }
    });

    it('uses default game when null is provided', () => {
      const result = validateGameParam(null);
      expect(result.valid).toBe(true);
      expect(result.value).toBe('pokemon');
    });

    it('uses custom default game', () => {
      const result = validateGameParam(null, { defaultGame: 'yugioh' });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('yugioh');
    });

    it('returns error when required and null provided', () => {
      const result = validateGameParam(null, { defaultGame: null });
      expect(result.valid).toBe(false);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorMessage).toBe('Missing required game parameter');
    });

    it('returns error for invalid game slug', async () => {
      const result = validateGameParam('invalid');
      expect(result.valid).toBe(false);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorMessage).toBe('Invalid game parameter: invalid');

      if (result.errorResponse) {
        const body = await result.errorResponse.json();
        expect(body.validOptions).toEqual(VALID_GAMES);
        expect(body.received).toBe('invalid');
      }
    });

    it('uses custom error message', async () => {
      const result = validateGameParam('bad', { errorMessage: 'Custom error' });
      expect(result.valid).toBe(false);
      if (result.errorResponse) {
        const body = await result.errorResponse.json();
        expect(body.error).toBe('Custom error');
      }
    });

    it('treats empty string as null', () => {
      const result = validateGameParam('');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('pokemon');
    });
  });

  describe('validateStringParam', () => {
    it('returns undefined for null optional param', () => {
      const result = validateStringParam(null, 'query');
      expect(result.valid).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('returns error when required param is null', () => {
      const result = validateStringParam(null, 'query', { required: true });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('query is required');
    });

    it('trims whitespace by default', () => {
      const result = validateStringParam('  hello  ', 'query');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('preserves whitespace when trim is false', () => {
      const result = validateStringParam('  hello  ', 'query', { trim: false });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('  hello  ');
    });

    it('validates minimum length', () => {
      const result = validateStringParam('a', 'query', { minLength: 2 });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('query too short: 1 < 2');
    });

    it('validates maximum length', () => {
      const result = validateStringParam('hello world', 'query', { maxLength: 5 });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('query too long: 11 > 5');
    });

    it('passes when length is within bounds', () => {
      const result = validateStringParam('hello', 'query', { minLength: 2, maxLength: 10 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('uses custom error messages', async () => {
      const result = validateStringParam('a', 'query', {
        minLength: 2,
        minLengthMessage: 'Too short!',
      });
      expect(result.valid).toBe(false);
      if (result.errorResponse) {
        const body = await result.errorResponse.json();
        expect(body.error).toBe('Too short!');
      }
    });

    it('handles empty string after trim as null', () => {
      const result = validateStringParam('   ', 'query', { required: true });
      expect(result.valid).toBe(false);
    });

    it('boundary: exact minimum length passes', () => {
      const result = validateStringParam('ab', 'query', { minLength: 2 });
      expect(result.valid).toBe(true);
    });

    it('boundary: exact maximum length passes', () => {
      const result = validateStringParam('abcde', 'query', { maxLength: 5 });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateIntegerParam', () => {
    it('returns default value for null param', () => {
      const result = validateIntegerParam(null, 'limit', { defaultValue: 50 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(50);
    });

    it('returns undefined for null param without default', () => {
      const result = validateIntegerParam(null, 'limit');
      expect(result.valid).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('parses valid integer', () => {
      const result = validateIntegerParam('42', 'limit');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(42);
    });

    it('clamps to minimum when below min', () => {
      const result = validateIntegerParam('0', 'limit', { min: 1, defaultValue: 10 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });

    it('clamps to maximum when above max', () => {
      const result = validateIntegerParam('500', 'limit', { max: 100, defaultValue: 50 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(100);
    });

    it('uses default for non-numeric value', () => {
      const result = validateIntegerParam('abc', 'limit', { defaultValue: 50 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(50);
    });

    it('returns error for non-numeric without default', () => {
      const result = validateIntegerParam('abc', 'limit', { useDefaultOnInvalid: false });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('Invalid limit: not a number');
    });

    it('returns error when required and null', () => {
      const result = validateIntegerParam(null, 'limit', { required: true });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('limit is required');
    });

    it('returns error when below min with strict validation', () => {
      const result = validateIntegerParam('0', 'limit', {
        min: 1,
        useDefaultOnInvalid: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('limit below minimum: 0 < 1');
    });

    it('returns error when above max with strict validation', () => {
      const result = validateIntegerParam('500', 'limit', {
        max: 100,
        useDefaultOnInvalid: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('limit above maximum: 500 > 100');
    });

    it('parses negative numbers', () => {
      const result = validateIntegerParam('-5', 'offset');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(-5);
    });

    it('handles empty string like null', () => {
      const result = validateIntegerParam('', 'limit', { defaultValue: 50 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(50);
    });

    it('boundary: exact minimum value passes', () => {
      const result = validateIntegerParam('1', 'limit', { min: 1 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });

    it('boundary: exact maximum value passes', () => {
      const result = validateIntegerParam('100', 'limit', { max: 100 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(100);
    });
  });

  describe('validateArrayParam', () => {
    it('returns empty array for undefined optional param', () => {
      const result = validateArrayParam<string>(undefined, 'items');
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('returns error when required param is undefined', () => {
      const result = validateArrayParam<string>(undefined, 'items', { required: true });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('items is required');
    });

    it('returns error when param is not an array', async () => {
      const result = validateArrayParam<string>('not-array', 'items');
      expect(result.valid).toBe(false);
      if (result.errorResponse) {
        const body = await result.errorResponse.json();
        expect(body.received).toBe('string');
      }
    });

    it('validates minimum length', () => {
      const result = validateArrayParam<string>([], 'items', { minLength: 1 });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('items too short: 0 < 1');
    });

    it('validates maximum length', async () => {
      const result = validateArrayParam<string>(['a', 'b', 'c'], 'items', { maxLength: 2 });
      expect(result.valid).toBe(false);
      if (result.errorResponse) {
        const body = await result.errorResponse.json();
        expect(body.received).toBe(3);
        expect(body.max).toBe(2);
      }
    });

    it('validates items with custom validator', () => {
      const result = validateArrayParam<string>(['a', '', 'c'], 'items', {
        itemValidator: (item) => typeof item === 'string' && item.length > 0,
        itemErrorMessage: 'All items must be non-empty strings',
      });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('items has 1 invalid items');
    });

    it('passes with valid items', () => {
      const result = validateArrayParam<number>([1, 2, 3], 'items', {
        itemValidator: (item) => typeof item === 'number',
      });
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([1, 2, 3]);
    });

    it('counts all invalid items', () => {
      const result = validateArrayParam<number>([1, 'a', 2, 'b', 3], 'items', {
        itemValidator: (item) => typeof item === 'number',
      });
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('items has 2 invalid items');
    });

    it('validates null same as undefined', () => {
      const result = validateArrayParam<string>(null, 'items');
      expect(result.valid).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('validateAtLeastOne', () => {
    it('returns valid when one param is provided', () => {
      const result = validateAtLeastOne({ setId: 'set1', type: null }, ['setId', 'type', 'name']);
      expect(result.valid).toBe(true);
    });

    it('returns valid when multiple params are provided', () => {
      const result = validateAtLeastOne({ setId: 'set1', type: 'Fire', name: null }, [
        'setId',
        'type',
        'name',
      ]);
      expect(result.valid).toBe(true);
    });

    it('returns error when no params are provided', async () => {
      const result = validateAtLeastOne({ setId: null, type: '', name: undefined }, [
        'setId',
        'type',
        'name',
      ]);
      expect(result.valid).toBe(false);
      if (result.errorResponse) {
        const body = await result.errorResponse.json();
        expect(body.error).toBe('At least one filter (setId, type, name) is required');
      }
    });

    it('treats empty string as not provided', () => {
      const result = validateAtLeastOne({ setId: '', type: '' }, ['setId', 'type']);
      expect(result.valid).toBe(false);
    });

    it('treats 0 as provided (falsy but valid)', () => {
      const result = validateAtLeastOne({ count: 0 }, ['count']);
      expect(result.valid).toBe(true);
    });

    it('treats false as provided', () => {
      const result = validateAtLeastOne({ enabled: false }, ['enabled']);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateConvexConfig', () => {
    const originalEnv = process.env.NEXT_PUBLIC_CONVEX_URL;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_CONVEX_URL = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_CONVEX_URL;
      }
    });

    it('returns valid with URL when configured', () => {
      process.env.NEXT_PUBLIC_CONVEX_URL = 'https://convex.test';
      const result = validateConvexConfig();
      expect(result.valid).toBe(true);
      expect(result.value).toBe('https://convex.test');
    });

    it('returns error when not configured', () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;
      const result = validateConvexConfig();
      expect(result.valid).toBe(false);
      expect(result.errorResponse?.status).toBe(500);
    });
  });

  describe('isValidResult', () => {
    it('returns true for valid result', () => {
      const result: ValidationResult<string> = { valid: true, value: 'test' };
      expect(isValidResult(result)).toBe(true);
    });

    it('returns false for invalid result', () => {
      const result: ValidationResult<string> = { valid: false, errorMessage: 'error' };
      expect(isValidResult(result)).toBe(false);
    });

    it('acts as type guard', () => {
      const result: ValidationResult<number> = { valid: true, value: 42 };
      if (isValidResult(result)) {
        // TypeScript should recognize result.value is defined here
        const value: number = result.value;
        expect(value).toBe(42);
      }
    });
  });

  describe('combineValidations', () => {
    it('returns valid when all validations pass', () => {
      const result = combineValidations(
        { valid: true, value: 'a' },
        { valid: true, value: 'b' },
        { valid: true, value: 'c' }
      );
      expect(result.valid).toBe(true);
    });

    it('returns first error when one validation fails', () => {
      const result = combineValidations(
        { valid: true, value: 'a' },
        { valid: false, errorMessage: 'Error B' },
        { valid: false, errorMessage: 'Error C' }
      );
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('Error B');
    });

    it('returns valid for empty array', () => {
      const result = combineValidations();
      expect(result.valid).toBe(true);
    });

    it('preserves error response from first failure', async () => {
      const errorResponse = createValidationErrorResponse('First error');
      const result = combineValidations(
        { valid: true, value: 'a' },
        { valid: false, errorResponse, errorMessage: 'First error' },
        { valid: false, errorMessage: 'Second error' }
      );
      expect(result.valid).toBe(false);
      expect(result.errorResponse).toBe(errorResponse);
    });
  });

  describe('Integration: Full validation flow', () => {
    it('validates search request parameters', () => {
      // Simulate validating a search request
      const gameResult = validateGameParam('pokemon');
      const queryResult = validateStringParam('pikachu', 'query', {
        required: true,
        minLength: 2,
        maxLength: 100,
      });
      const limitResult = validateIntegerParam('20', 'limit', {
        defaultValue: 20,
        min: 1,
        max: 50,
      });

      expect(gameResult.valid).toBe(true);
      expect(queryResult.valid).toBe(true);
      expect(limitResult.valid).toBe(true);

      expect(gameResult.value).toBe('pokemon');
      expect(queryResult.value).toBe('pikachu');
      expect(limitResult.value).toBe(20);
    });

    it('validates filter request parameters', () => {
      // Simulate validating a filter request
      const params = {
        setId: 'swsh1',
        type: 'Fire',
        name: null,
        rarity: null,
      };

      const gameResult = validateGameParam('pokemon');
      const atLeastOneResult = validateAtLeastOne(params, ['setId', 'type', 'name', 'rarity']);

      const combined = combineValidations(gameResult, atLeastOneResult);

      expect(combined.valid).toBe(true);
    });

    it('validates cards POST request', () => {
      const cardIds = ['card1', 'card2', 'card3'];

      const gameResult = validateGameParam(null); // Optional
      const cardsResult = validateArrayParam<string>(cardIds, 'cardIds', {
        minLength: 1,
        maxLength: 500,
        itemValidator: (item) => typeof item === 'string' && item.trim() !== '',
      });

      expect(gameResult.valid).toBe(true);
      expect(cardsResult.valid).toBe(true);
      expect(cardsResult.value).toEqual(cardIds);
    });

    it('fails early on first invalid parameter', () => {
      const gameResult = validateGameParam('invalid-game');
      const queryResult = validateStringParam(null, 'query', { required: true });

      const combined = combineValidations(gameResult, queryResult);

      // Should fail on game, not reach query validation
      expect(combined.valid).toBe(false);
      expect(combined.errorMessage).toBe('Invalid game parameter: invalid-game');
    });
  });
});
