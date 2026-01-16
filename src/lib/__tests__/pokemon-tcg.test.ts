import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCardsByIds } from '../pokemon-tcg';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('pokemon-tcg', () => {
  beforeEach(() => {
    mockFetch.mockReset();
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
});
