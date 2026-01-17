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
  cardId: 'sv2-25',
  gameSlug: 'pokemon',
  setId: 'sv2',
  name: 'Pikachu ex',
  number: '25',
  supertype: 'Pokémon',
  subtypes: ['Basic', 'ex'],
  types: ['Lightning'],
  rarity: 'Rare',
  imageSmall: 'https://images.pokemontcg.io/sv2/25.png',
  imageLarge: 'https://images.pokemontcg.io/sv2/25_hires.png',
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/456',
  priceMarket: 12.5,
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
  tcgPlayerUrl: 'https://www.tcgplayer.com/product/789',
  priceMarket: 25.0,
};

const mockOnePieceCard = {
  cardId: 'op-001',
  gameSlug: 'onepiece',
  setId: 'op1',
  name: 'Monkey D. Luffy',
  number: '001',
  supertype: 'Character',
  subtypes: ['Straw Hat Crew'],
  types: ['Red'],
  rarity: 'Leader',
  imageSmall: 'https://onepiece-cardgame.com/images/op1-001.png',
  imageLarge: 'https://onepiece-cardgame.com/images/op1-001_large.png',
  tcgPlayerUrl: undefined,
  priceMarket: undefined,
};

const mockLorcanaCard = {
  cardId: 'lorcana-set1-42',
  gameSlug: 'lorcana',
  setId: 'set1',
  name: 'Mickey Mouse',
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

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/search', () => {
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

  describe('query parameter validation', () => {
    it('returns 400 when query is missing', async () => {
      const request = createRequest('/api/search');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Search query is required');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when query is empty', async () => {
      const request = createRequest('/api/search?q=');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Search query is required');
    });

    it('returns 400 when query is whitespace only', async () => {
      const request = createRequest('/api/search?q=%20%20%20');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Search query is required');
    });

    it('returns 400 when query is too short', async () => {
      const request = createRequest('/api/search?q=a');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Search query must be at least 2 characters');
    });

    it('returns 400 when query is too long', async () => {
      const longQuery = 'a'.repeat(101);
      const request = createRequest(`/api/search?q=${longQuery}`);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Search query is too long');
    });

    it('trims whitespace from query', async () => {
      mockQuery.mockResolvedValue([mockPokemonCard1]);

      const request = createRequest('/api/search?q=%20Pikachu%20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe('Pikachu');
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'pokemon',
        searchTerm: 'Pikachu',
        limit: 20,
      });
    });

    it('accepts exactly 2 character query', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=ab');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('accepts exactly 100 character query', async () => {
      mockQuery.mockResolvedValue([]);
      const query = 'a'.repeat(100);

      const request = createRequest(`/api/search?q=${query}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('game parameter handling', () => {
    it('defaults to pokemon when no game specified', async () => {
      mockQuery.mockResolvedValue([mockPokemonCard1, mockPokemonCard2]);

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'pokemon',
        searchTerm: 'Pikachu',
        limit: 20,
      });
    });

    it('returns pokemon cards when game=pokemon', async () => {
      mockQuery.mockResolvedValue([mockPokemonCard1, mockPokemonCard2]);

      const request = createRequest('/api/search?q=Pikachu&game=pokemon');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.data).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('returns yugioh cards when game=yugioh', async () => {
      mockQuery.mockResolvedValue([mockYugiohCard]);

      const request = createRequest('/api/search?q=Dragon&game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('yugioh');
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Blue-Eyes White Dragon');
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'yugioh',
        searchTerm: 'Dragon',
        limit: 20,
      });
    });

    it('returns onepiece cards when game=onepiece', async () => {
      mockQuery.mockResolvedValue([mockOnePieceCard]);

      const request = createRequest('/api/search?q=Luffy&game=onepiece');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('onepiece');
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Monkey D. Luffy');
    });

    it('returns lorcana cards when game=lorcana', async () => {
      mockQuery.mockResolvedValue([mockLorcanaCard]);

      const request = createRequest('/api/search?q=Mickey&game=lorcana');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('lorcana');
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Mickey Mouse');
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
        const request = createRequest(`/api/search?q=test&game=${game}`);
        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.game).toBe(game);
      }
    });

    it('returns 400 for invalid game parameter', async () => {
      const request = createRequest('/api/search?q=Pikachu&game=invalidgame');
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

  describe('limit parameter handling', () => {
    it('defaults to limit of 20', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(20);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'pokemon',
        searchTerm: 'test',
        limit: 20,
      });
    });

    it('respects custom limit parameter', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=Mewtwo&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(10);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'pokemon',
        searchTerm: 'Mewtwo',
        limit: 10,
      });
    });

    it('clamps limit to max of 50', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=Eevee&limit=100');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(50);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'pokemon',
        searchTerm: 'Eevee',
        limit: 50,
      });
    });

    it('clamps limit to min of 1', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=Eevee&limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), {
        gameSlug: 'pokemon',
        searchTerm: 'Eevee',
        limit: 1,
      });
    });

    it('clamps negative limit to min of 1', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test&limit=-5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(1);
    });

    it('uses default limit for non-numeric limit parameter', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test&limit=abc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(20);
    });
  });

  describe('response structure', () => {
    it('returns correctly transformed card data', async () => {
      mockQuery.mockResolvedValue([mockPokemonCard1]);

      const request = createRequest('/api/search?q=Pikachu');
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
      mockQuery.mockResolvedValue([cardWithoutTcgplayer]);

      const request = createRequest('/api/search?q=Mickey&game=lorcana');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const card = data.data[0];
      expect(card.tcgplayer).toBeUndefined();
    });

    it('handles cards with tcgplayer url but no price', async () => {
      const cardWithUrlNoPrice = {
        ...mockPokemonCard1,
        priceMarket: undefined,
      };
      mockQuery.mockResolvedValue([cardWithUrlNoPrice]);

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const card = data.data[0];
      expect(card.tcgplayer).toEqual({
        url: 'https://www.tcgplayer.com/product/123',
        prices: undefined,
      });
    });

    it('includes query in response', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=Charizard');
      const response = await GET(request);
      const data = await response.json();

      expect(data.query).toBe('Charizard');
    });

    it('includes game in response', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test&game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(data.game).toBe('yugioh');
    });

    it('includes count in response', async () => {
      mockQuery.mockResolvedValue([mockPokemonCard1, mockPokemonCard2]);

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(data.count).toBe(2);
    });

    it('includes limit in response', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test&limit=30');
      const response = await GET(request);
      const data = await response.json();

      expect(data.limit).toBe(30);
    });

    it('includes availableGames in response', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test');
      const response = await GET(request);
      const data = await response.json();

      expect(data.availableGames).toEqual([
        'pokemon',
        'yugioh',
        'onepiece',
        'lorcana',
      ]);
    });

    it('returns empty array for no matches', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=NonexistentCard');
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

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
    });

    it('returns 500 on Convex query failure', async () => {
      mockQuery.mockRejectedValue(new Error('Convex connection failed'));

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search cards');
      expect(data.details).toBe('Convex connection failed');
    });

    it('handles non-Error exceptions gracefully', async () => {
      mockQuery.mockRejectedValue('String error');

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search cards');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('backward compatibility', () => {
    it('works without game parameter (defaults to pokemon)', async () => {
      mockQuery.mockResolvedValue([mockPokemonCard1]);

      const request = createRequest('/api/search?q=Pikachu');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.data).toHaveLength(1);
    });

    it('supports limit parameter without game parameter', async () => {
      mockQuery.mockResolvedValue([]);

      const request = createRequest('/api/search?q=test&limit=15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('pokemon');
      expect(data.limit).toBe(15);
    });
  });

  describe('cross-game search', () => {
    it('searches correctly within specified game', async () => {
      // Same search term, different games return different results
      mockQuery.mockResolvedValue([mockYugiohCard]);

      const request = createRequest('/api/search?q=Dragon&game=yugioh');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('yugioh');
      expect(data.data[0].gameSlug).toBe('yugioh');
    });

    it('lorcana search works correctly', async () => {
      mockQuery.mockResolvedValue([mockLorcanaCard]);

      const request = createRequest('/api/search?q=Mickey&game=lorcana');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.game).toBe('lorcana');
      expect(data.data[0].name).toBe('Mickey Mouse');
    });
  });
});
