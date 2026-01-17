import { describe, it, expect } from 'vitest';
import {
  MAX_PRIORITY_ITEMS,
  canAddPriority,
  validatePriorityToggle,
  getPriorityStatus,
  VALID_GAME_SLUGS,
  isValidGameSlug,
  filterWishlistByGame,
  countWishlistByGame,
  getWishlistSummary,
  type WishlistItem,
  type GameSlug,
} from '../wishlist';

describe('Wishlist Priority Logic', () => {
  describe('MAX_PRIORITY_ITEMS', () => {
    it('should be set to 5', () => {
      expect(MAX_PRIORITY_ITEMS).toBe(5);
    });
  });

  describe('canAddPriority', () => {
    it('should allow adding when no priority items exist', () => {
      const result = canAddPriority(0);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.max).toBe(5);
    });

    it('should allow adding when under the limit', () => {
      const result = canAddPriority(3);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should allow adding at 4 items (one slot remaining)', () => {
      const result = canAddPriority(4);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should not allow adding when at the limit', () => {
      const result = canAddPriority(5);
      expect(result.canAdd).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should not allow adding when over the limit', () => {
      const result = canAddPriority(6);
      expect(result.canAdd).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should always return max as 5', () => {
      expect(canAddPriority(0).max).toBe(5);
      expect(canAddPriority(3).max).toBe(5);
      expect(canAddPriority(5).max).toBe(5);
    });
  });

  describe('validatePriorityToggle', () => {
    describe('toggling OFF (removing priority)', () => {
      it('should always allow toggling off regardless of count', () => {
        expect(validatePriorityToggle(5, true).allowed).toBe(true);
        expect(validatePriorityToggle(10, true).allowed).toBe(true);
        expect(validatePriorityToggle(0, true).allowed).toBe(true);
      });

      it('should not include a reason when toggling off', () => {
        const result = validatePriorityToggle(5, true);
        expect(result.reason).toBeUndefined();
      });
    });

    describe('toggling ON (adding priority)', () => {
      it('should allow when under the limit', () => {
        expect(validatePriorityToggle(0, false).allowed).toBe(true);
        expect(validatePriorityToggle(2, false).allowed).toBe(true);
        expect(validatePriorityToggle(4, false).allowed).toBe(true);
      });

      it('should not allow when at the limit', () => {
        const result = validatePriorityToggle(5, false);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Maximum of 5 priority items allowed');
      });

      it('should not allow when over the limit', () => {
        const result = validatePriorityToggle(6, false);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBeDefined();
      });

      it('should not include a reason when allowed', () => {
        const result = validatePriorityToggle(3, false);
        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });
  });

  describe('getPriorityStatus', () => {
    it('should return correct status for empty list', () => {
      const result = getPriorityStatus([]);
      expect(result.count).toBe(0);
      expect(result.max).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.isFull).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should return correct status for partially filled list', () => {
      const items = ['card-1', 'card-2', 'card-3'];
      const result = getPriorityStatus(items);
      expect(result.count).toBe(3);
      expect(result.remaining).toBe(2);
      expect(result.isFull).toBe(false);
      expect(result.items).toEqual(items);
    });

    it('should return correct status when full', () => {
      const items = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'];
      const result = getPriorityStatus(items);
      expect(result.count).toBe(5);
      expect(result.remaining).toBe(0);
      expect(result.isFull).toBe(true);
      expect(result.items).toEqual(items);
    });

    it('should handle edge case of over limit gracefully', () => {
      const items = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];
      const result = getPriorityStatus(items);
      expect(result.count).toBe(6);
      expect(result.remaining).toBe(0);
      expect(result.isFull).toBe(true);
    });

    it('should preserve the items array reference', () => {
      const items = ['card-a', 'card-b'];
      const result = getPriorityStatus(items);
      expect(result.items).toBe(items);
    });
  });
});

describe('Priority Logic Integration Scenarios', () => {
  it('should correctly model adding first priority item', () => {
    // Start with 0 priority items
    const beforeStatus = getPriorityStatus([]);
    expect(beforeStatus.isFull).toBe(false);

    // Check if we can add
    const canAdd = canAddPriority(beforeStatus.count);
    expect(canAdd.canAdd).toBe(true);

    // Validate the toggle
    const validation = validatePriorityToggle(beforeStatus.count, false);
    expect(validation.allowed).toBe(true);
  });

  it('should correctly model reaching the limit', () => {
    // Start with 4 priority items
    const currentItems = ['c1', 'c2', 'c3', 'c4'];
    const beforeStatus = getPriorityStatus(currentItems);
    expect(beforeStatus.remaining).toBe(1);

    // Can still add one more
    const canAdd = canAddPriority(beforeStatus.count);
    expect(canAdd.canAdd).toBe(true);

    // After adding, should be full
    const afterItems = [...currentItems, 'c5'];
    const afterStatus = getPriorityStatus(afterItems);
    expect(afterStatus.isFull).toBe(true);
    expect(afterStatus.remaining).toBe(0);

    // Cannot add more
    const canAddMore = canAddPriority(afterStatus.count);
    expect(canAddMore.canAdd).toBe(false);
  });

  it('should correctly model removing priority when full', () => {
    // Start with 5 priority items (full)
    const fullItems = ['c1', 'c2', 'c3', 'c4', 'c5'];
    const fullStatus = getPriorityStatus(fullItems);
    expect(fullStatus.isFull).toBe(true);

    // Should be able to toggle off
    const validation = validatePriorityToggle(fullStatus.count, true);
    expect(validation.allowed).toBe(true);

    // After removing one, should have room
    const afterItems = fullItems.slice(0, 4);
    const afterStatus = getPriorityStatus(afterItems);
    expect(afterStatus.isFull).toBe(false);
    expect(afterStatus.remaining).toBe(1);
  });
});

// ============================================================================
// Multi-TCG Game Filtering Tests
// ============================================================================

describe('VALID_GAME_SLUGS', () => {
  it('should contain all expected game slugs', () => {
    expect(VALID_GAME_SLUGS).toContain('pokemon');
    expect(VALID_GAME_SLUGS).toContain('yugioh');
    expect(VALID_GAME_SLUGS).toContain('mtg');
    expect(VALID_GAME_SLUGS).toContain('onepiece');
    expect(VALID_GAME_SLUGS).toContain('lorcana');
    expect(VALID_GAME_SLUGS).toContain('digimon');
    expect(VALID_GAME_SLUGS).toContain('dragonball');
  });

  it('should have exactly 7 game slugs', () => {
    expect(VALID_GAME_SLUGS.length).toBe(7);
  });
});

describe('isValidGameSlug', () => {
  it('should return true for valid game slugs', () => {
    expect(isValidGameSlug('pokemon')).toBe(true);
    expect(isValidGameSlug('yugioh')).toBe(true);
    expect(isValidGameSlug('mtg')).toBe(true);
    expect(isValidGameSlug('onepiece')).toBe(true);
    expect(isValidGameSlug('lorcana')).toBe(true);
    expect(isValidGameSlug('digimon')).toBe(true);
    expect(isValidGameSlug('dragonball')).toBe(true);
  });

  it('should return false for invalid game slugs', () => {
    expect(isValidGameSlug('invalid')).toBe(false);
    expect(isValidGameSlug('POKEMON')).toBe(false);
    expect(isValidGameSlug('Pokemon')).toBe(false);
    expect(isValidGameSlug('')).toBe(false);
  });

  it('should return false for null and undefined', () => {
    expect(isValidGameSlug(null)).toBe(false);
    expect(isValidGameSlug(undefined)).toBe(false);
  });
});

describe('filterWishlistByGame', () => {
  const testItems: WishlistItem[] = [
    { cardId: 'sv1-1', isPriority: false, gameSlug: 'pokemon' },
    { cardId: 'sv1-2', isPriority: true, gameSlug: 'pokemon' },
    { cardId: 'LOB-001', isPriority: false, gameSlug: 'yugioh' },
    { cardId: 'LOB-002', isPriority: true, gameSlug: 'yugioh' },
    { cardId: 'ST-01', isPriority: false, gameSlug: 'onepiece' },
    { cardId: 'unknown-card', isPriority: false }, // No gameSlug
  ];

  it('should return all items when gameSlug is undefined', () => {
    const result = filterWishlistByGame(testItems, undefined);
    expect(result).toEqual(testItems);
    expect(result.length).toBe(6);
  });

  it('should filter to only Pokemon cards', () => {
    const result = filterWishlistByGame(testItems, 'pokemon');
    expect(result.length).toBe(2);
    expect(result.every((item) => item.gameSlug === 'pokemon')).toBe(true);
  });

  it('should filter to only Yu-Gi-Oh! cards', () => {
    const result = filterWishlistByGame(testItems, 'yugioh');
    expect(result.length).toBe(2);
    expect(result.every((item) => item.gameSlug === 'yugioh')).toBe(true);
  });

  it('should filter to only One Piece cards', () => {
    const result = filterWishlistByGame(testItems, 'onepiece');
    expect(result.length).toBe(1);
    expect(result[0].cardId).toBe('ST-01');
  });

  it('should return empty array for game with no cards', () => {
    const result = filterWishlistByGame(testItems, 'lorcana');
    expect(result).toEqual([]);
  });

  it('should handle empty wishlist', () => {
    const result = filterWishlistByGame([], 'pokemon');
    expect(result).toEqual([]);
  });

  it('should preserve priority status when filtering', () => {
    const result = filterWishlistByGame(testItems, 'pokemon');
    const priorityItem = result.find((item) => item.cardId === 'sv1-2');
    expect(priorityItem?.isPriority).toBe(true);
  });
});

describe('countWishlistByGame', () => {
  const testItems: WishlistItem[] = [
    { cardId: 'sv1-1', isPriority: false, gameSlug: 'pokemon' },
    { cardId: 'sv1-2', isPriority: true, gameSlug: 'pokemon' },
    { cardId: 'sv1-3', isPriority: true, gameSlug: 'pokemon' },
    { cardId: 'LOB-001', isPriority: false, gameSlug: 'yugioh' },
    { cardId: 'LOB-002', isPriority: true, gameSlug: 'yugioh' },
    { cardId: 'unknown-card', isPriority: false }, // No gameSlug
  ];

  it('should count items by game correctly', () => {
    const result = countWishlistByGame(testItems);

    expect(result.pokemon).toEqual({ total: 3, priority: 2 });
    expect(result.yugioh).toEqual({ total: 2, priority: 1 });
  });

  it('should handle items without gameSlug as "unknown"', () => {
    const result = countWishlistByGame(testItems);
    expect(result.unknown).toEqual({ total: 1, priority: 0 });
  });

  it('should return empty object for empty wishlist', () => {
    const result = countWishlistByGame([]);
    expect(result).toEqual({});
  });

  it('should count priority items correctly', () => {
    const items: WishlistItem[] = [
      { cardId: 'c1', isPriority: true, gameSlug: 'mtg' },
      { cardId: 'c2', isPriority: true, gameSlug: 'mtg' },
      { cardId: 'c3', isPriority: false, gameSlug: 'mtg' },
    ];
    const result = countWishlistByGame(items);
    expect(result.mtg).toEqual({ total: 3, priority: 2 });
  });
});

describe('getWishlistSummary', () => {
  const testItems: WishlistItem[] = [
    { cardId: 'sv1-1', isPriority: false, gameSlug: 'pokemon' },
    { cardId: 'sv1-2', isPriority: true, gameSlug: 'pokemon' },
    { cardId: 'LOB-001', isPriority: false, gameSlug: 'yugioh' },
    { cardId: 'LOB-002', isPriority: true, gameSlug: 'yugioh' },
    { cardId: 'LOB-003', isPriority: true, gameSlug: 'yugioh' },
    { cardId: 'unknown-card', isPriority: false }, // No gameSlug
  ];

  it('should return correct total items count', () => {
    const result = getWishlistSummary(testItems);
    expect(result.totalItems).toBe(6);
  });

  it('should return correct priority items count', () => {
    const result = getWishlistSummary(testItems);
    expect(result.priorityItems).toBe(3);
  });

  it('should include breakdown by game', () => {
    const result = getWishlistSummary(testItems);
    expect(result.byGame.pokemon).toEqual({ total: 2, priority: 1 });
    expect(result.byGame.yugioh).toEqual({ total: 3, priority: 2 });
    expect(result.byGame.unknown).toEqual({ total: 1, priority: 0 });
  });

  it('should list games with items (excluding unknown)', () => {
    const result = getWishlistSummary(testItems);
    expect(result.gamesWithItems).toContain('pokemon');
    expect(result.gamesWithItems).toContain('yugioh');
    expect(result.gamesWithItems).not.toContain('unknown');
  });

  it('should handle empty wishlist', () => {
    const result = getWishlistSummary([]);
    expect(result.totalItems).toBe(0);
    expect(result.priorityItems).toBe(0);
    expect(result.byGame).toEqual({});
    expect(result.gamesWithItems).toEqual([]);
  });

  it('should handle wishlist with all items from one game', () => {
    const singleGameItems: WishlistItem[] = [
      { cardId: 'c1', isPriority: true, gameSlug: 'lorcana' },
      { cardId: 'c2', isPriority: false, gameSlug: 'lorcana' },
    ];
    const result = getWishlistSummary(singleGameItems);
    expect(result.gamesWithItems).toEqual(['lorcana']);
    expect(result.byGame.lorcana).toEqual({ total: 2, priority: 1 });
  });
});

describe('Multi-TCG Wishlist Integration Scenarios', () => {
  it('should correctly model filtering and summarizing a mixed wishlist', () => {
    const mixedWishlist: WishlistItem[] = [
      { cardId: 'poke-1', isPriority: true, gameSlug: 'pokemon' },
      { cardId: 'poke-2', isPriority: false, gameSlug: 'pokemon' },
      { cardId: 'yugi-1', isPriority: true, gameSlug: 'yugioh' },
      { cardId: 'lorca-1', isPriority: true, gameSlug: 'lorcana' },
      { cardId: 'lorca-2', isPriority: false, gameSlug: 'lorcana' },
    ];

    // Get summary
    const summary = getWishlistSummary(mixedWishlist);
    expect(summary.totalItems).toBe(5);
    expect(summary.priorityItems).toBe(3);
    expect(summary.gamesWithItems.length).toBe(3);

    // Filter by each game
    const pokemonOnly = filterWishlistByGame(mixedWishlist, 'pokemon');
    expect(pokemonOnly.length).toBe(2);

    const yugiohOnly = filterWishlistByGame(mixedWishlist, 'yugioh');
    expect(yugiohOnly.length).toBe(1);

    const lorcanaOnly = filterWishlistByGame(mixedWishlist, 'lorcana');
    expect(lorcanaOnly.length).toBe(2);

    // Verify counts match
    expect(summary.byGame.pokemon.total).toBe(pokemonOnly.length);
    expect(summary.byGame.yugioh.total).toBe(yugiohOnly.length);
    expect(summary.byGame.lorcana.total).toBe(lorcanaOnly.length);
  });

  it('should handle wishlist with items missing gameSlug', () => {
    const mixedWishlist: WishlistItem[] = [
      { cardId: 'known-1', isPriority: true, gameSlug: 'pokemon' },
      { cardId: 'legacy-1', isPriority: false }, // No gameSlug
      { cardId: 'legacy-2', isPriority: true }, // No gameSlug
    ];

    // Summary should count unknown items separately
    const summary = getWishlistSummary(mixedWishlist);
    expect(summary.totalItems).toBe(3);
    expect(summary.byGame.unknown.total).toBe(2);
    expect(summary.byGame.unknown.priority).toBe(1);

    // Filtering by specific game should not include unknown items
    const pokemonOnly = filterWishlistByGame(mixedWishlist, 'pokemon');
    expect(pokemonOnly.length).toBe(1);

    // gamesWithItems should only include valid game slugs
    expect(summary.gamesWithItems).toEqual(['pokemon']);
  });

  it('should validate game slugs correctly before filtering', () => {
    const items: WishlistItem[] = [{ cardId: 'c1', isPriority: false, gameSlug: 'pokemon' }];

    // Should work with valid game slug
    expect(isValidGameSlug('pokemon')).toBe(true);
    const filtered = filterWishlistByGame(items, 'pokemon' as GameSlug);
    expect(filtered.length).toBe(1);

    // Invalid game slug check
    expect(isValidGameSlug('invalid-game')).toBe(false);
  });
});
