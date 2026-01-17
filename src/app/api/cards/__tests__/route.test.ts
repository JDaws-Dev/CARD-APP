import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock the Convex HTTP client
const mockQuery = vi.fn();

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

// Mock environment variable
const originalEnv = process.env;

// Sample cached card data
const mockPokemonCard1 = {
  cardId: 'sv1-1',
  gameSlug: 'pokemon',
  setId: 'sv1',
  name: 'Pikachu',
  number: '1',
  supertype: 'Pokémon',
  subtypes: ['Basic'],
  types: ['Lightning'],
  rarity: 'Common',
  imageSmall: 'https://images.pokemontcg.io/sv1/1.png',
  imageLarge: 'https://images.pokemontcg.io/sv1/1_hires.png',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/123',
  priceMarket: 0.25,
};

const mockPokemonCard2 = {
  cardId: 'sv1-2',
  gameSlug: 'pokemon',
  setId: 'sv1',
  name: 'Charizard',
  number: '2',
  supertype: 'Pokémon',
  subtypes: ['Stage 2'],
  types: ['Fire'],
  rarity: 'Rare Holo',
  imageSmall: 'https://images.pokemontcg.io/sv1/2.png',
  imageLarge: 'https://images.pokemontcg.io/sv1/2_hires.png',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/456',
  priceMarket: 25.0,
};

const mockYugiohCard = {
  cardId: 'LOB-001',
  gameSlug: 'yugioh',
  setId: 'LOB',
  name: 'Blue-Eyes White Dragon',
  number: '001',
  supertype: 'Monster',
  subtypes: ['Normal'],
  types: ['Dragon'],
  rarity: 'Ultra Rare',
  imageSmall: 'https://images.ygoprodeck.com/images/cards/LOB-001.jpg',
  imageLarge: 'https://images.ygoprodeck.com/images/cards/LOB-001.jpg',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/789',
  priceMarket: 100.0,
};

function createPostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/cards', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function createGetRequest(params: string): NextRequest {
  return new NextRequest(new URL(`http://localhost/api/cards${params}`));
}

describe('/api/cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_CONVEX_URL: 'https://test-convex.cloud',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/cards', () => {
    describe('cardIds validation', () => {
      it('returns 400 when cardIds is not an array', async () => {
        const request = createPostRequest({ cardIds: 'not-an-array' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('cardIds must be an array');
        expect(data.received).toBe('string');
      });

      it('returns 400 when cardIds is null', async () => {
        const request = createPostRequest({ cardIds: null });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('cardIds must be an array');
      });

      it('returns 400 when cardIds contains non-strings', async () => {
        const request = createPostRequest({ cardIds: ['valid', 123, 'also-valid'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('All cardIds must be non-empty strings');
        expect(data.invalidCount).toBe(1);
      });

      it('returns 400 when cardIds contains empty strings', async () => {
        const request = createPostRequest({ cardIds: ['valid', '', 'also-valid'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('All cardIds must be non-empty strings');
      });

      it('returns 400 when too many cardIds provided', async () => {
        const cardIds = Array.from({ length: 501 }, (_, i) => `sv1-${i}`);
        const request = createPostRequest({ cardIds });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Too many card IDs (max 500)');
        expect(data.received).toBe(501);
        expect(data.max).toBe(500);
      });
    });

    describe('empty cardIds', () => {
      it('returns empty result for empty cardIds array', async () => {
        const request = createPostRequest({ cardIds: [] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual([]);
        expect(data.count).toBe(0);
        expect(data.requested).toBe(0);
        expect(mockQuery).not.toHaveBeenCalled();
      });

      it('includes game in response when provided', async () => {
        const request = createPostRequest({ cardIds: [], game: 'pokemon' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.game).toBe('pokemon');
        expect(data.availableGames).toContain('pokemon');
      });
    });

    describe('game parameter validation', () => {
      it('returns 400 for invalid game parameter', async () => {
        const request = createPostRequest({ cardIds: ['sv1-1'], game: 'invalidgame' });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid game parameter');
        expect(data.validOptions).toContain('pokemon');
        expect(data.validOptions).toContain('yugioh');
        expect(data.received).toBe('invalidgame');
      });

      it('accepts all valid game slugs', async () => {
        const validGames = [
          'pokemon',
          'yugioh',
          'onepiece',
          'lorcana',
        ];

        for (const game of validGames) {
          mockQuery.mockResolvedValue({
            cards: {},
            stats: { found: 0, missing: 1 },
          });
          const request = createPostRequest({ cardIds: ['test-1'], game });
          const response = await POST(request);
          expect(response.status).toBe(200);
        }
      });

      it('works without game parameter (game is optional for POST)', async () => {
        mockQuery.mockResolvedValue({
          cards: { 'sv1-1': mockPokemonCard1 },
          stats: { found: 1, missing: 0, requested: 1, unique: 1, truncated: 0 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.game).toBe(null);
      });
    });

    describe('fetching cards', () => {
      it('returns cards in data array format', async () => {
        mockQuery.mockResolvedValue({
          cards: { 'sv1-1': mockPokemonCard1 },
          stats: { found: 1, missing: 0 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].id).toBe('sv1-1');
        expect(data.data[0].name).toBe('Pikachu');
        expect(data.data[0].images.small).toBe('https://images.pokemontcg.io/sv1/1.png');
      });

      it('also returns cards in map format', async () => {
        mockQuery.mockResolvedValue({
          cards: { 'sv1-1': mockPokemonCard1 },
          stats: { found: 1, missing: 0 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(data.cards).toBeDefined();
        expect(data.cards['sv1-1']).toBeDefined();
        expect(data.cards['sv1-1'].name).toBe('Pikachu');
      });

      it('returns multiple cards', async () => {
        mockQuery.mockResolvedValue({
          cards: {
            'sv1-1': mockPokemonCard1,
            'sv1-2': mockPokemonCard2,
          },
          stats: { found: 2, missing: 0 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1', 'sv1-2'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(2);
        expect(data.count).toBe(2);
        expect(data.found).toBe(2);
        expect(data.missing).toBe(0);
      });

      it('handles missing cards gracefully', async () => {
        mockQuery.mockResolvedValue({
          cards: { 'sv1-1': mockPokemonCard1 },
          stats: { found: 1, missing: 1 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1', 'nonexistent'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(1);
        expect(data.found).toBe(1);
        expect(data.missing).toBe(1);
        expect(data.requested).toBe(2);
      });

      it('transforms card data to expected format', async () => {
        mockQuery.mockResolvedValue({
          cards: { 'sv1-1': mockPokemonCard1 },
          stats: { found: 1, missing: 0 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        const card = data.data[0];
        expect(card.id).toBe('sv1-1');
        expect(card.name).toBe('Pikachu');
        expect(card.supertype).toBe('Pokémon');
        expect(card.subtypes).toEqual(['Basic']);
        expect(card.types).toEqual(['Lightning']);
        expect(card.number).toBe('1');
        expect(card.rarity).toBe('Common');
        expect(card.images.small).toBe('https://images.pokemontcg.io/sv1/1.png');
        expect(card.images.large).toBe('https://images.pokemontcg.io/sv1/1_hires.png');
        expect(card.tcgplayer.url).toBe('https://www.tcgplayer.com/product/123');
        expect(card.tcgplayer.prices.normal.market).toBe(0.25);
        expect(card.set.id).toBe('sv1');
        expect(card.gameSlug).toBe('pokemon');
      });

      it('handles cards without tcgplayer data', async () => {
        const cardWithoutPrice = {
          ...mockPokemonCard1,
          tcgPlayerUrl: undefined,
          priceMarket: undefined,
        };
        mockQuery.mockResolvedValue({
          cards: { 'sv1-1': cardWithoutPrice },
          stats: { found: 1, missing: 0 },
        });

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(data.data[0].tcgplayer).toBeUndefined();
      });
    });

    describe('batching', () => {
      it('batches requests when cardIds exceed 200', async () => {
        const cardIds = Array.from({ length: 250 }, (_, i) => `sv1-${i}`);

        mockQuery
          .mockResolvedValueOnce({
            cards: Object.fromEntries(
              cardIds.slice(0, 200).map((id) => [id, { ...mockPokemonCard1, cardId: id }])
            ),
            stats: { found: 200, missing: 0 },
          })
          .mockResolvedValueOnce({
            cards: Object.fromEntries(
              cardIds.slice(200).map((id) => [id, { ...mockPokemonCard1, cardId: id }])
            ),
            stats: { found: 50, missing: 0 },
          });

        const request = createPostRequest({ cardIds });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(data.found).toBe(250);
      });
    });

    describe('error handling', () => {
      it('returns 500 when NEXT_PUBLIC_CONVEX_URL is not set', async () => {
        delete process.env.NEXT_PUBLIC_CONVEX_URL;

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Server configuration error');
      });

      it('returns 500 on Convex query failure', async () => {
        mockQuery.mockRejectedValue(new Error('Convex connection failed'));

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch cards');
        expect(data.details).toBe('Convex connection failed');
      });

      it('handles non-Error exceptions gracefully', async () => {
        mockQuery.mockRejectedValue('String error');

        const request = createPostRequest({ cardIds: ['sv1-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch cards');
        expect(data.details).toBe('Unknown error');
      });
    });

    describe('response structure', () => {
      it('includes availableGames in response', async () => {
        mockQuery.mockResolvedValue({
          cards: {},
          stats: { found: 0, missing: 1 },
        });

        const request = createPostRequest({ cardIds: ['test-1'] });
        const response = await POST(request);
        const data = await response.json();

        expect(data.availableGames).toEqual([
          'pokemon',
          'yugioh',
          'onepiece',
          'lorcana',
        ]);
      });
    });
  });

  describe('GET /api/cards', () => {
    describe('game parameter validation', () => {
      it('returns 400 when game parameter is missing', async () => {
        const request = createGetRequest('');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required game parameter');
        expect(data.validOptions).toContain('pokemon');
      });

      it('returns 400 for invalid game parameter', async () => {
        const request = createGetRequest('?game=invalidgame');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid game parameter');
        expect(data.received).toBe('invalidgame');
      });

      it('accepts all valid game slugs', async () => {
        const validGames = [
          'pokemon',
          'yugioh',
          'onepiece',
          'lorcana',
        ];

        for (const game of validGames) {
          mockQuery.mockResolvedValue([]);
          const request = createGetRequest(`?game=${game}`);
          const response = await GET(request);
          expect(response.status).toBe(200);
        }
      });
    });

    describe('pagination parameters', () => {
      it('uses default limit of 50', async () => {
        mockQuery.mockResolvedValue([]);

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limit).toBe(50);
        expect(data.offset).toBe(0);
      });

      it('accepts custom limit', async () => {
        mockQuery.mockResolvedValue([]);

        const request = createGetRequest('?game=pokemon&limit=100');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limit).toBe(100);
      });

      it('caps limit at 500', async () => {
        mockQuery.mockResolvedValue([]);

        const request = createGetRequest('?game=pokemon&limit=1000');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.limit).toBe(500);
      });

      it('returns 400 for invalid limit', async () => {
        const request = createGetRequest('?game=pokemon&limit=invalid');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid limit parameter');
      });

      it('returns 400 for negative limit', async () => {
        const request = createGetRequest('?game=pokemon&limit=-1');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid limit parameter');
      });

      it('accepts offset parameter', async () => {
        mockQuery.mockResolvedValue([]);

        const request = createGetRequest('?game=pokemon&offset=100');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.offset).toBe(100);
      });

      it('returns 400 for invalid offset', async () => {
        const request = createGetRequest('?game=pokemon&offset=invalid');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid offset parameter');
      });

      it('returns 400 for negative offset', async () => {
        const request = createGetRequest('?game=pokemon&offset=-1');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid offset parameter');
      });
    });

    describe('fetching cards by game', () => {
      it('returns cards for pokemon game', async () => {
        mockQuery.mockResolvedValue([mockPokemonCard1, mockPokemonCard2]);

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.game).toBe('pokemon');
        expect(data.data).toHaveLength(2);
        expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
          gameSlug: 'pokemon',
          limit: 50,
          offset: 0,
        });
      });

      it('returns cards for yugioh game', async () => {
        mockQuery.mockResolvedValue([mockYugiohCard]);

        const request = createGetRequest('?game=yugioh');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.game).toBe('yugioh');
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toBe('Blue-Eyes White Dragon');
      });

      it('includes hasMore flag when results equal limit', async () => {
        const cards = Array.from({ length: 50 }, (_, i) => ({
          ...mockPokemonCard1,
          cardId: `sv1-${i}`,
        }));
        mockQuery.mockResolvedValue(cards);

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(data.hasMore).toBe(true);
      });

      it('sets hasMore to false when results are less than limit', async () => {
        mockQuery.mockResolvedValue([mockPokemonCard1]);

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(data.hasMore).toBe(false);
      });
    });

    describe('fetching cards by setId', () => {
      it('filters by setId when provided', async () => {
        mockQuery.mockResolvedValue([mockPokemonCard1]);

        const request = createGetRequest('?game=pokemon&setId=sv1');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.setId).toBe('sv1');
        expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
          setId: 'sv1',
          gameSlug: 'pokemon',
        });
      });

      it('returns null setId when not provided', async () => {
        mockQuery.mockResolvedValue([]);

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(data.setId).toBe(null);
      });
    });

    describe('card transformation', () => {
      it('transforms card data to expected format', async () => {
        mockQuery.mockResolvedValue([mockPokemonCard1]);

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        const card = data.data[0];
        expect(card.id).toBe('sv1-1');
        expect(card.name).toBe('Pikachu');
        expect(card.images.small).toBeDefined();
        expect(card.images.large).toBeDefined();
        expect(card.set.id).toBe('sv1');
        expect(card.gameSlug).toBe('pokemon');
      });
    });

    describe('error handling', () => {
      it('returns 500 when NEXT_PUBLIC_CONVEX_URL is not set', async () => {
        delete process.env.NEXT_PUBLIC_CONVEX_URL;

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Server configuration error');
      });

      it('returns 500 on Convex query failure', async () => {
        mockQuery.mockRejectedValue(new Error('Convex connection failed'));

        const request = createGetRequest('?game=pokemon');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch cards');
        expect(data.details).toBe('Convex connection failed');
      });
    });

    describe('response structure', () => {
      it('includes all expected fields', async () => {
        mockQuery.mockResolvedValue([mockPokemonCard1]);

        const request = createGetRequest('?game=pokemon&setId=sv1&limit=25&offset=0');
        const response = await GET(request);
        const data = await response.json();

        expect(data.data).toBeDefined();
        expect(data.game).toBe('pokemon');
        expect(data.setId).toBe('sv1');
        expect(data.count).toBe(1);
        expect(data.limit).toBe(25);
        expect(data.offset).toBe(0);
        expect(data.hasMore).toBeDefined();
        expect(data.availableGames).toEqual([
          'pokemon',
          'yugioh',
          'onepiece',
          'lorcana',
        ]);
      });
    });
  });
});
