import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCardsByIds,
  POKEMON_SERIES,
  getSetsBySeries,
  getScarletVioletSets,
  getSwordShieldSets,
  getAllSupportedSets,
  isPromoCard,
  getPromoSetLabel,
  PROMO_SET_IDS,
  type PokemonCard,
} from '../pokemon-tcg';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('pokemon-tcg', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('POKEMON_SERIES', () => {
    it('includes Scarlet & Violet', () => {
      expect(POKEMON_SERIES).toContain('Scarlet & Violet');
    });

    it('includes Sword & Shield', () => {
      expect(POKEMON_SERIES).toContain('Sword & Shield');
    });

    it('has exactly 2 supported series', () => {
      expect(POKEMON_SERIES).toHaveLength(2);
    });
  });

  describe('getSetsBySeries', () => {
    it('fetches sets for a given series', async () => {
      const mockSets = [{ id: 'sv1', name: 'Scarlet & Violet', series: 'Scarlet & Violet' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSets }),
      });

      const result = await getSetsBySeries('Scarlet & Violet');

      expect(result).toEqual(mockSets);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('series%3A%22Scarlet%20%26%20Violet%22'),
        expect.any(Object)
      );
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getSetsBySeries('Scarlet & Violet')).rejects.toThrow('Pokemon TCG API error');
    });
  });

  describe('getScarletVioletSets', () => {
    it('fetches Scarlet & Violet sets', async () => {
      const mockSets = [{ id: 'sv1', name: 'Scarlet & Violet', series: 'Scarlet & Violet' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSets }),
      });

      const result = await getScarletVioletSets();

      expect(result).toEqual(mockSets);
    });
  });

  describe('getSwordShieldSets', () => {
    it('fetches Sword & Shield sets', async () => {
      const mockSets = [{ id: 'swsh1', name: 'Sword & Shield', series: 'Sword & Shield' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSets }),
      });

      const result = await getSwordShieldSets();

      expect(result).toEqual(mockSets);
    });
  });

  describe('getAllSupportedSets', () => {
    it('fetches both SV and SWSH sets', async () => {
      const svSets = [
        {
          id: 'sv1',
          name: 'Scarlet & Violet',
          series: 'Scarlet & Violet',
          releaseDate: '2023/03/31',
        },
      ];
      const swshSets = [
        {
          id: 'swsh1',
          name: 'Sword & Shield',
          series: 'Sword & Shield',
          releaseDate: '2020/02/07',
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: svSets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: swshSets }),
        });

      const result = await getAllSupportedSets();

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('sorts sets by release date (newest first)', async () => {
      const svSets = [
        {
          id: 'sv1',
          name: 'Scarlet & Violet',
          series: 'Scarlet & Violet',
          releaseDate: '2023/03/31',
        },
      ];
      const swshSets = [
        {
          id: 'swsh1',
          name: 'Sword & Shield',
          series: 'Sword & Shield',
          releaseDate: '2020/02/07',
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: svSets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: swshSets }),
        });

      const result = await getAllSupportedSets();

      // SV (2023) should come before SWSH (2020)
      expect(result[0].series).toBe('Scarlet & Violet');
      expect(result[1].series).toBe('Sword & Shield');
    });
  });

  describe('getCardsByIds', () => {
    it('returns empty array for empty input', async () => {
      const result = await getCardsByIds([]);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches cards by IDs', async () => {
      const mockCards = [
        { id: 'sv1-1', name: 'Pikachu', set: { id: 'sv1', name: 'Scarlet & Violet' } },
        { id: 'sv1-2', name: 'Charizard', set: { id: 'sv1', name: 'Scarlet & Violet' } },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCards }),
      });

      const result = await getCardsByIds(['sv1-1', 'sv1-2']);

      expect(result).toEqual(mockCards);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cards?q='),
        expect.any(Object)
      );
    });

    it('batches large requests', async () => {
      // Create 75 card IDs (should result in 2 batches of 50 and 25)
      const cardIds = Array.from({ length: 75 }, (_, i) => `sv1-${i + 1}`);

      const batch1Cards = Array.from({ length: 50 }, (_, i) => ({
        id: `sv1-${i + 1}`,
        name: `Card ${i + 1}`,
      }));
      const batch2Cards = Array.from({ length: 25 }, (_, i) => ({
        id: `sv1-${i + 51}`,
        name: `Card ${i + 51}`,
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: batch1Cards }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: batch2Cards }),
        });

      const result = await getCardsByIds(cardIds);

      expect(result).toHaveLength(75);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getCardsByIds(['sv1-1'])).rejects.toThrow('Pokemon TCG API error');
    });
  });

  describe('PROMO_SET_IDS', () => {
    it('includes all known promo set IDs', () => {
      expect(PROMO_SET_IDS).toContain('svp');
      expect(PROMO_SET_IDS).toContain('swshp');
      expect(PROMO_SET_IDS).toContain('smp');
      expect(PROMO_SET_IDS).toContain('xyp');
      expect(PROMO_SET_IDS).toContain('bwp');
      expect(PROMO_SET_IDS).toContain('dpp');
      expect(PROMO_SET_IDS).toContain('np');
      expect(PROMO_SET_IDS).toContain('basep');
      expect(PROMO_SET_IDS).toContain('hsp');
    });

    it('has exactly 9 promo set IDs', () => {
      expect(PROMO_SET_IDS).toHaveLength(9);
    });
  });

  describe('isPromoCard', () => {
    // Helper to create a mock card
    const createCard = (overrides: Partial<PokemonCard> = {}): PokemonCard => ({
      id: 'sv1-1',
      name: 'Pikachu',
      supertype: 'Pokemon',
      number: '1',
      images: { small: '', large: '' },
      set: { id: 'sv1', name: 'Scarlet & Violet' },
      ...overrides,
    });

    it('returns true for cards with rarity "Promo"', () => {
      const card = createCard({ rarity: 'Promo' });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns true for cards with rarity "promo" (case insensitive)', () => {
      const card = createCard({ rarity: 'promo' });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns true for cards with rarity "PROMO" (case insensitive)', () => {
      const card = createCard({ rarity: 'PROMO' });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns true for cards in Scarlet & Violet promo set (svp)', () => {
      const card = createCard({
        id: 'svp-1',
        set: { id: 'svp', name: 'Scarlet & Violet Black Star Promos' },
      });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns true for cards in Sword & Shield promo set (swshp)', () => {
      const card = createCard({
        id: 'swshp-SWSH001',
        set: { id: 'swshp', name: 'SWSH Black Star Promos' },
      });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns true for cards in Sun & Moon promo set (smp)', () => {
      const card = createCard({
        id: 'smp-SM01',
        set: { id: 'smp', name: 'SM Black Star Promos' },
      });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns true for cards in XY promo set (xyp)', () => {
      const card = createCard({
        id: 'xyp-XY01',
        set: { id: 'xyp', name: 'XY Black Star Promos' },
      });
      expect(isPromoCard(card)).toBe(true);
    });

    it('returns false for regular set cards', () => {
      const card = createCard({
        rarity: 'Rare',
        set: { id: 'sv1', name: 'Scarlet & Violet' },
      });
      expect(isPromoCard(card)).toBe(false);
    });

    it('returns false for cards with undefined rarity in regular sets', () => {
      const card = createCard({
        rarity: undefined,
        set: { id: 'sv1', name: 'Scarlet & Violet' },
      });
      expect(isPromoCard(card)).toBe(false);
    });
  });

  describe('getPromoSetLabel', () => {
    // Helper to create a mock card
    const createCard = (overrides: Partial<PokemonCard> = {}): PokemonCard => ({
      id: 'sv1-1',
      name: 'Pikachu',
      supertype: 'Pokemon',
      number: '1',
      images: { small: '', large: '' },
      set: { id: 'sv1', name: 'Scarlet & Violet' },
      ...overrides,
    });

    it('returns null for non-promo cards', () => {
      const card = createCard({ rarity: 'Rare' });
      expect(getPromoSetLabel(card)).toBeNull();
    });

    it('returns "SV Promo" for Scarlet & Violet promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'svp', name: 'Scarlet & Violet Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('SV Promo');
    });

    it('returns "SWSH Promo" for Sword & Shield promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'swshp', name: 'SWSH Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('SWSH Promo');
    });

    it('returns "SM Promo" for Sun & Moon promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'smp', name: 'SM Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('SM Promo');
    });

    it('returns "XY Promo" for XY promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'xyp', name: 'XY Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('XY Promo');
    });

    it('returns "BW Promo" for Black & White promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'bwp', name: 'BW Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('BW Promo');
    });

    it('returns "DP Promo" for Diamond & Pearl promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'dpp', name: 'DP Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('DP Promo');
    });

    it('returns "Nintendo Promo" for Nintendo promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'np', name: 'Nintendo Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('Nintendo Promo');
    });

    it('returns "Base Promo" for Base promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'basep', name: 'Wizards Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('Base Promo');
    });

    it('returns "HGSS Promo" for HGSS promo cards', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'hsp', name: 'HGSS Black Star Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('HGSS Promo');
    });

    it('returns "Promo" for promo cards with unknown set ID', () => {
      const card = createCard({
        rarity: 'Promo',
        set: { id: 'unknown', name: 'Unknown Promos' },
      });
      expect(getPromoSetLabel(card)).toBe('Promo');
    });
  });
});
