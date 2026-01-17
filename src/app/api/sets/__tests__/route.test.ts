import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the Convex HTTP client
const mockQuery = vi.fn();

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

// Mock environment variable
const originalEnv = process.env;

// Sample cached set data
const mockPokemonSet1 = {
  _id: 'cached_set_1',
  _creationTime: 1704067200000,
  setId: 'sv1',
  gameSlug: 'pokemon' as const,
  name: 'Scarlet & Violet',
  series: 'Scarlet & Violet',
  releaseDate: '2023-03-31',
  totalCards: 258,
  logoUrl: 'https://images.pokemontcg.io/sv1/logo.png',
  symbolUrl: 'https://images.pokemontcg.io/sv1/symbol.png',
};

const mockPokemonSet2 = {
  _id: 'cached_set_2',
  _creationTime: 1704067200000,
  setId: 'swsh1',
  gameSlug: 'pokemon' as const,
  name: 'Sword & Shield',
  series: 'Sword & Shield',
  releaseDate: '2020-02-07',
  totalCards: 216,
  logoUrl: 'https://images.pokemontcg.io/swsh1/logo.png',
  symbolUrl: 'https://images.pokemontcg.io/swsh1/symbol.png',
};

const mockYugiohSet = {
  _id: 'cached_set_3',
  _creationTime: 1704067200000,
  setId: 'LOB',
  gameSlug: 'yugioh' as const,
  name: 'Legend of Blue Eyes White Dragon',
  series: 'Core Sets',
  releaseDate: '2002-03-08',
  totalCards: 126,
  logoUrl: undefined,
  symbolUrl: undefined,
};

const mockMtgSet = {
  _id: 'cached_set_4',
  _creationTime: 1704067200000,
  setId: 'dmu',
  gameSlug: 'mtg' as const,
  name: 'Dominaria United',
  series: 'Dominaria',
  releaseDate: '2022-09-09',
  totalCards: 281,
  logoUrl: undefined,
  symbolUrl: 'https://svgs.scryfall.io/sets/dmu.svg',
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/sets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_CONVEX_URL: 'https://test-convex.cloud',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('game parameter handling', () => {
    it('defaults to pokemon when no game specified', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), { gameSlug: 'pokemon' });
    });

    it('returns pokemon sets when game=pokemon', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.data).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('returns yugioh sets when game=yugioh', async () => {
      mockQuery.mockResolvedValue([mockYugiohSet]);

      const request = createRequest('/api/sets?game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('yugioh');
      expect(data.data).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), { gameSlug: 'yugioh' });
    });

    it('returns mtg sets when game=mtg', async () => {
      mockQuery.mockResolvedValue([mockMtgSet]);

      const request = createRequest('/api/sets?game=mtg');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('mtg');
      expect(data.data).toHaveLength(1);
    });

    it('accepts all valid game slugs', async () => {
      const validGames = [
        'pokemon',
        'yugioh',
        'mtg',
        'onepiece',
        'lorcana',
        'digimon',
        'dragonball',
      ];

      for (const game of validGames) {
        mockQuery.mockResolvedValue([]);
        const request = createRequest(`/api/sets?game=${game}`);
        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.game).toBe(game);
      }
    });

    it('returns 400 for invalid game parameter', async () => {
      const request = createRequest('/api/sets?game=invalidgame');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid game parameter');
      expect(data.validOptions).toContain('pokemon');
      expect(data.validOptions).toContain('yugioh');
      expect(data.validOptions).toContain('mtg');
      expect(data.received).toBe('invalidgame');
    });
  });

  describe('series filtering', () => {
    it('returns all sets when series is not specified', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.series).toBe('all');
    });

    it('returns all sets when series=all', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon&series=all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.series).toBe('all');
    });

    it('filters by series name (case-insensitive)', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon&series=Scarlet%20%26%20Violet');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].series).toBe('Scarlet & Violet');
      expect(data.series).toBe('Scarlet & Violet');
      expect(data.totalForGame).toBe(2);
    });

    it('filters by series name with lowercase', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon&series=scarlet%20%26%20violet');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].series).toBe('Scarlet & Violet');
    });

    it('returns empty array for non-matching series', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon&series=NonexistentSeries');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(0);
      expect(data.count).toBe(0);
      expect(data.totalForGame).toBe(2);
    });
  });

  describe('response structure', () => {
    it('includes count in response', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1]);

      const request = createRequest('/api/sets?game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(data.count).toBe(1);
      expect(data.totalForGame).toBe(1);
    });

    it('includes availableSeries in response', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(data.availableSeries).toContain('Scarlet & Violet');
      expect(data.availableSeries).toContain('Sword & Shield');
      expect(data.availableSeries).toHaveLength(2);
    });

    it('includes availableGames in response', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/sets');
      const response = await GET(request);
      const data = await response.json();

      expect(data.availableGames).toEqual([
        'pokemon',
        'yugioh',
        'mtg',
        'onepiece',
        'lorcana',
        'digimon',
        'dragonball',
      ]);
    });

    it('sorts availableSeries alphabetically', async () => {
      const mockSetsUnsorted = [
        { ...mockPokemonSet1, series: 'Zebra Series' },
        { ...mockPokemonSet2, series: 'Alpha Series' },
        { ...mockPokemonSet1, _id: 'test3', series: 'Middle Series' },
      ];
      mockQuery.mockResolvedValue(mockSetsUnsorted);

      const request = createRequest('/api/sets?game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(data.availableSeries).toEqual(['Alpha Series', 'Middle Series', 'Zebra Series']);
    });

    it('returns empty data array when no sets exist for game', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/sets?game=dragonball');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(0);
      expect(data.count).toBe(0);
      expect(data.availableSeries).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('returns 500 when NEXT_PUBLIC_CONVEX_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;

      const request = createRequest('/api/sets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
    });

    it('returns 500 on Convex query failure', async () => {
      mockQuery.mockRejectedValue(new Error('Convex connection failed'));

      const request = createRequest('/api/sets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sets');
      expect(data.details).toBe('Convex connection failed');
    });

    it('handles non-Error exceptions gracefully', async () => {
      mockQuery.mockRejectedValue('String error');

      const request = createRequest('/api/sets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch sets');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('backward compatibility', () => {
    it('works without game parameter (defaults to pokemon)', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
    });

    it('supports series filter without game parameter', async () => {
      mockQuery.mockResolvedValue([mockPokemonSet1, mockPokemonSet2]);

      const request = createRequest('/api/sets?series=Sword%20%26%20Shield');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.data).toHaveLength(1);
      expect(data.data[0].series).toBe('Sword & Shield');
    });
  });
});
