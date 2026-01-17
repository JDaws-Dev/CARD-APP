import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { clearRateLimitStore } from '../../../../lib/rateLimit';

// Mock the Convex HTTP client
const mockQuery = vi.fn();

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

// Mock environment variable
const originalEnv = process.env;

// Sample cached card data for different games
const mockPokemonCard1 = {
  cardId: 'sv1-25',
  gameSlug: 'pokemon',
  setId: 'sv1',
  name: 'Pikachu',
  number: '25',
  supertype: 'Pokémon',
  subtypes: ['Basic'],
  types: ['Lightning'],
  rarity: 'Common',
  imageSmall: 'https://images.pokemontcg.io/sv1/25.png',
  imageLarge: 'https://images.pokemontcg.io/sv1/25_hires.png',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/123',
  priceMarket: 0.5,
};

const mockPokemonCard2 = {
  cardId: 'sv1-26',
  gameSlug: 'pokemon',
  setId: 'sv1',
  name: 'Raichu',
  number: '26',
  supertype: 'Pokémon',
  subtypes: ['Stage 1'],
  types: ['Lightning'],
  rarity: 'Rare',
  imageSmall: 'https://images.pokemontcg.io/sv1/26.png',
  imageLarge: 'https://images.pokemontcg.io/sv1/26_hires.png',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/456',
  priceMarket: 1.5,
};

const mockFireCard = {
  cardId: 'sv1-10',
  gameSlug: 'pokemon',
  setId: 'sv1',
  name: 'Charizard',
  number: '10',
  supertype: 'Pokémon',
  subtypes: ['Stage 2'],
  types: ['Fire'],
  rarity: 'Rare Holo',
  imageSmall: 'https://images.pokemontcg.io/sv1/10.png',
  imageLarge: 'https://images.pokemontcg.io/sv1/10_hires.png',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/789',
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
  imageSmall: 'https://images.ygoprodeck.com/images/cards_small/89631139.jpg',
  imageLarge: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
  tcgPlayerUrl: undefined,
  priceMarket: 25.0,
};


const mockLorcanaCard = {
  cardId: 'tfc-42',
  gameSlug: 'lorcana',
  setId: 'tfc',
  name: 'Mickey Mouse - Brave Little Tailor',
  number: '42',
  supertype: 'Character',
  subtypes: ['Hero'],
  types: ['Amber'],
  rarity: 'Rare',
  imageSmall: 'https://lorcast.com/images/small/42.png',
  imageLarge: 'https://lorcast.com/images/large/42.png',
  tcgPlayerUrl: undefined,
  priceMarket: undefined,
};

const mockOnePieceCard = {
  cardId: 'optcg-OP01-001',
  gameSlug: 'onepiece',
  setId: 'OP01',
  name: 'Monkey D. Luffy',
  number: 'OP01-001',
  supertype: 'Character',
  subtypes: ['Straw Hat Crew'],
  types: ['Red'],
  rarity: 'Leader',
  imageSmall: 'https://optcg.com/images/OP01-001.png',
  imageLarge: 'https://optcg.com/images/OP01-001_large.png',
  tcgPlayerUrl: undefined,
  priceMarket: undefined,
};


function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost'));
}

function createFilterResult(
  cards: (typeof mockPokemonCard1)[],
  opts: { totalCount?: number; hasMore?: boolean } = {}
) {
  return {
    cards,
    totalCount: opts.totalCount ?? cards.length,
    limit: 50,
    offset: 0,
    hasMore: opts.hasMore ?? false,
    filters: {},
  };
}

describe('GET /api/filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear rate limit store before each test to prevent test interference
    clearRateLimitStore();
    // Set up environment variable
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_CONVEX_URL: 'https://test-convex.cloud',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('filter parameter validation', () => {
    it('returns 400 when no filters are provided', async () => {
      const request = createRequest('/api/filter');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one filter (setId, type, name, or rarity) is required');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when only game is provided (no actual filter)', async () => {
      const request = createRequest('/api/filter?game=pokemon');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one filter (setId, type, name, or rarity) is required');
    });

    it('returns 400 when name is too short', async () => {
      const request = createRequest('/api/filter?name=a');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name filter must be at least 2 characters');
    });

    it('returns 400 when name is too long', async () => {
      const longName = 'a'.repeat(101);
      const request = createRequest(`/api/filter?name=${longName}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name filter is too long');
    });

    it('accepts exactly 2 character name', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?name=ab');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('accepts exactly 100 character name', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));
      const longName = 'a'.repeat(100);

      const request = createRequest(`/api/filter?name=${longName}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('trims whitespace from name', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?name=%20Pikachu%20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.name).toBe('Pikachu');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Pikachu',
        })
      );
    });
  });

  describe('game parameter handling', () => {
    it('defaults to pokemon when no game specified', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?setId=sv1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          gameSlug: 'pokemon',
        })
      );
    });

    it('returns pokemon cards when game=pokemon', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1, mockPokemonCard2]));

      const request = createRequest('/api/filter?setId=sv1&game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.data).toHaveLength(2);
    });

    it('accepts all valid game slugs', async () => {
      const validGames = [
        'pokemon',
        'yugioh',
        'onepiece',
        'lorcana',
      ];

      for (const game of validGames) {
        mockQuery.mockResolvedValue(createFilterResult([]));
        const request = createRequest(`/api/filter?type=Fire&game=${game}`);
        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.game).toBe(game);
      }
    });

    it('returns 400 for invalid game parameter', async () => {
      const request = createRequest('/api/filter?setId=sv1&game=invalidgame');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid game parameter');
      expect(data.validOptions).toContain('pokemon');
      expect(data.validOptions).toContain('yugioh');
      expect(data.validOptions).toContain('onepiece');
      expect(data.validOptions).toContain('lorcana');
      expect(data.received).toBe('invalidgame');
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('filter by setId', () => {
    it('returns cards when filtered by setId only', async () => {
      mockQuery.mockResolvedValue(
        createFilterResult([mockPokemonCard1, mockPokemonCard2], { totalCount: 2 })
      );

      const request = createRequest('/api/filter?setId=sv1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.filters.setId).toBe('sv1');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          setId: 'sv1',
        })
      );
    });
  });

  describe('filter by type', () => {
    it('returns cards when filtered by type only', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1, mockPokemonCard2]));

      const request = createRequest('/api/filter?type=Lightning');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.filters.type).toBe('Lightning');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'Lightning',
        })
      );
    });

    it('filters fire type cards correctly', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockFireCard]));

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].types).toContain('Fire');
    });
  });

  describe('filter by name', () => {
    it('returns cards when filtered by name only', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?name=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.filters.name).toBe('Pikachu');
    });
  });

  describe('filter by rarity', () => {
    it('returns cards when filtered by rarity only', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockFireCard]));

      const request = createRequest('/api/filter?rarity=Rare%20Holo');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.filters.rarity).toBe('Rare Holo');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rarity: 'Rare Holo',
        })
      );
    });
  });

  describe('multiple filters', () => {
    it('returns cards when filtered by multiple criteria', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?setId=sv1&type=Lightning&name=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.setId).toBe('sv1');
      expect(data.filters.type).toBe('Lightning');
      expect(data.filters.name).toBe('Pikachu');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          setId: 'sv1',
          type: 'Lightning',
          name: 'Pikachu',
        })
      );
    });

    it('combines setId, type, name, and rarity filters', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockFireCard]));

      const request = createRequest(
        '/api/filter?setId=sv1&type=Fire&name=Charizard&rarity=Rare%20Holo'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          setId: 'sv1',
          type: 'Fire',
          name: 'Charizard',
          rarity: 'Rare Holo',
        })
      );
    });
  });

  describe('limit parameter handling', () => {
    it('defaults to limit of 50', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(50);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('respects custom limit parameter', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&limit=25');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(25);
    });

    it('clamps limit to max of 100', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Water&limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(100);
    });

    it('clamps limit to min of 1', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Grass&limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(1);
    });

    it('clamps negative limit to min of 1', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&limit=-5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(1);
    });

    it('uses default limit for non-numeric limit parameter', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&limit=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(50);
    });
  });

  describe('offset parameter handling', () => {
    it('defaults to offset of 0', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offset).toBe(0);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          offset: 0,
        })
      );
    });

    it('respects custom offset parameter', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&offset=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offset).toBe(50);
    });

    it('ignores negative offset', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&offset=-10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offset).toBe(0);
    });

    it('uses default offset for non-numeric offset parameter', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&offset=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offset).toBe(0);
    });
  });

  describe('response structure', () => {
    it('returns correctly transformed card data', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?setId=sv1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);

      const card = data.data[0];
      expect(card.id).toBe('sv1-25');
      expect(card.name).toBe('Pikachu');
      expect(card.supertype).toBe('Pokémon');
      expect(card.subtypes).toEqual(['Basic']);
      expect(card.types).toEqual(['Lightning']);
      expect(card.number).toBe('25');
      expect(card.rarity).toBe('Common');
      expect(card.images).toEqual({
        small: 'https://images.pokemontcg.io/sv1/25.png',
        large: 'https://images.pokemontcg.io/sv1/25_hires.png',
      });
      expect(card.tcgplayer).toEqual({
        url: 'https://www.tcgplayer.com/product/123',
        prices: {
          normal: { market: 0.5 },
        },
      });
      expect(card.set).toEqual({
        id: 'sv1',
        name: '',
      });
      expect(card.gameSlug).toBe('pokemon');
    });

    it('handles cards without tcgplayer data', async () => {
      const cardWithoutTcgplayer = {
        ...mockLorcanaCard,
        tcgPlayerUrl: undefined,
        priceMarket: undefined,
      };
      mockQuery.mockResolvedValue(createFilterResult([cardWithoutTcgplayer]));

      const request = createRequest('/api/filter?type=Amber&game=lorcana');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const card = data.data[0];
      expect(card.tcgplayer).toBeUndefined();
    });

    it('includes game in response', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(data.game).toBe('yugioh');
    });

    it('includes filters in response', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?setId=sv1&type=Fire&name=test&rarity=Common');
      const response = await GET(request);
      const data = await response.json();

      expect(data.filters).toEqual({
        setId: 'sv1',
        type: 'Fire',
        name: 'test',
        rarity: 'Common',
      });
    });

    it('includes count and totalCount in response', async () => {
      mockQuery.mockResolvedValue(
        createFilterResult([mockPokemonCard1, mockPokemonCard2], { totalCount: 50, hasMore: true })
      );

      const request = createRequest('/api/filter?setId=sv1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.count).toBe(2);
      expect(data.totalCount).toBe(50);
    });

    it('includes hasMore in response', async () => {
      mockQuery.mockResolvedValue(
        createFilterResult([mockPokemonCard1], { totalCount: 100, hasMore: true })
      );

      const request = createRequest('/api/filter?setId=sv1');
      const response = await GET(request);
      const data = await response.json();

      expect(data.hasMore).toBe(true);
    });

    it('includes availableGames in response', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(data.availableGames).toEqual([
        'pokemon',
        'yugioh',
        'onepiece',
        'lorcana',
      ]);
    });

    it('includes commonTypes for each game', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Fire&game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(data.commonTypes).toContain('Fire');
      expect(data.commonTypes).toContain('Water');
      expect(data.commonTypes).toContain('Lightning');
    });

    it('returns correct commonTypes for yugioh', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=DARK&game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(data.commonTypes).toContain('DARK');
      expect(data.commonTypes).toContain('LIGHT');
      expect(data.commonTypes).toContain('EARTH');
    });

    it('returns correct commonTypes for lorcana', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?type=Amber&game=lorcana');
      const response = await GET(request);
      const data = await response.json();

      expect(data.commonTypes).toContain('Amber');
      expect(data.commonTypes).toContain('Ruby');
      expect(data.commonTypes).toContain('Steel');
    });

    it('returns empty array for no matches', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?name=NonexistentCard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('error handling', () => {
    it('returns 500 when NEXT_PUBLIC_CONVEX_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
    });

    it('returns 500 on Convex query failure', async () => {
      mockQuery.mockRejectedValue(new Error('Convex connection failed'));

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to filter cards');
      expect(data.details).toBe('Convex connection failed');
    });

    it('handles non-Error exceptions gracefully', async () => {
      mockQuery.mockRejectedValue('String error');

      const request = createRequest('/api/filter?type=Fire');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to filter cards');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('backward compatibility', () => {
    it('works without game parameter (defaults to pokemon)', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?type=Lightning');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.data).toHaveLength(1);
    });

    it('supports all original filter parameters without game parameter', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockPokemonCard1]));

      const request = createRequest('/api/filter?setId=sv1&type=Lightning&name=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
    });
  });

  describe('cross-game filtering', () => {
    it('filters yugioh cards correctly', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockYugiohCard]));

      const request = createRequest('/api/filter?type=Dragon&game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('yugioh');
      expect(data.data[0].gameSlug).toBe('yugioh');
    });

    it('filters lorcana cards correctly', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockLorcanaCard]));

      const request = createRequest('/api/filter?type=Amber&game=lorcana');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('lorcana');
    });

    it('filters onepiece cards correctly', async () => {
      mockQuery.mockResolvedValue(createFilterResult([mockOnePieceCard]));

      const request = createRequest('/api/filter?name=Luffy&game=onepiece');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('onepiece');
    });

  });

  describe('pagination', () => {
    it('returns correct pagination metadata', async () => {
      mockQuery.mockResolvedValue(
        createFilterResult([mockPokemonCard1, mockPokemonCard2], { totalCount: 100, hasMore: true })
      );

      const request = createRequest('/api/filter?setId=sv1&limit=50&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
      expect(data.hasMore).toBe(true);
      expect(data.totalCount).toBe(100);
    });

    it('passes offset to Convex query', async () => {
      mockQuery.mockResolvedValue(createFilterResult([]));

      const request = createRequest('/api/filter?setId=sv1&limit=50&offset=100');
      await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          limit: 50,
          offset: 100,
        })
      );
    });
  });
});
