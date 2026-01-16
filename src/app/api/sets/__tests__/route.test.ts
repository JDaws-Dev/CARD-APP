import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as pokemonTcg from '@/lib/pokemon-tcg';

// Mock the pokemon-tcg module
vi.mock('@/lib/pokemon-tcg', async () => {
  const actual = await vi.importActual('@/lib/pokemon-tcg');
  return {
    ...actual,
    getScarletVioletSets: vi.fn(),
    getSwordShieldSets: vi.fn(),
    getAllSupportedSets: vi.fn(),
  };
});

const mockSVSet = {
  id: 'sv1',
  name: 'Scarlet & Violet',
  series: 'Scarlet & Violet',
  printedTotal: 198,
  total: 258,
  releaseDate: '2023/03/31',
  updatedAt: '2023/03/31',
  images: {
    symbol: 'https://images.pokemontcg.io/sv1/symbol.png',
    logo: 'https://images.pokemontcg.io/sv1/logo.png',
  },
};

const mockSWSHSet = {
  id: 'swsh1',
  name: 'Sword & Shield',
  series: 'Sword & Shield',
  printedTotal: 202,
  total: 216,
  releaseDate: '2020/02/07',
  updatedAt: '2020/02/07',
  images: {
    symbol: 'https://images.pokemontcg.io/swsh1/symbol.png',
    logo: 'https://images.pokemontcg.io/swsh1/logo.png',
  },
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/sets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all sets by default', async () => {
    vi.mocked(pokemonTcg.getAllSupportedSets).mockResolvedValue([mockSVSet, mockSWSHSet]);

    const request = createRequest('/api/sets');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.series).toBe('all');
    expect(data.count).toBe(2);
    expect(data.availableSeries).toContain('Scarlet & Violet');
    expect(data.availableSeries).toContain('Sword & Shield');
  });

  it('returns all sets when series=all', async () => {
    vi.mocked(pokemonTcg.getAllSupportedSets).mockResolvedValue([mockSVSet, mockSWSHSet]);

    const request = createRequest('/api/sets?series=all');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.series).toBe('all');
    expect(pokemonTcg.getAllSupportedSets).toHaveBeenCalled();
  });

  it('returns only Scarlet & Violet sets when series=Scarlet & Violet', async () => {
    vi.mocked(pokemonTcg.getScarletVioletSets).mockResolvedValue([mockSVSet]);

    const request = createRequest('/api/sets?series=Scarlet%20%26%20Violet');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].series).toBe('Scarlet & Violet');
    expect(data.series).toBe('Scarlet & Violet');
    expect(pokemonTcg.getScarletVioletSets).toHaveBeenCalled();
  });

  it('returns only Sword & Shield sets when series=Sword & Shield', async () => {
    vi.mocked(pokemonTcg.getSwordShieldSets).mockResolvedValue([mockSWSHSet]);

    const request = createRequest('/api/sets?series=Sword%20%26%20Shield');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].series).toBe('Sword & Shield');
    expect(data.series).toBe('Sword & Shield');
    expect(pokemonTcg.getSwordShieldSets).toHaveBeenCalled();
  });

  it('returns 400 for invalid series parameter', async () => {
    const request = createRequest('/api/sets?series=InvalidSeries');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid series parameter');
    expect(data.validOptions).toContain('Scarlet & Violet');
    expect(data.validOptions).toContain('Sword & Shield');
    expect(data.validOptions).toContain('all');
  });

  it('returns 500 on API failure', async () => {
    vi.mocked(pokemonTcg.getAllSupportedSets).mockRejectedValue(new Error('API Error'));

    const request = createRequest('/api/sets');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch sets');
  });

  it('includes count in response', async () => {
    vi.mocked(pokemonTcg.getScarletVioletSets).mockResolvedValue([mockSVSet]);

    const request = createRequest('/api/sets?series=Scarlet%20%26%20Violet');
    const response = await GET(request);
    const data = await response.json();

    expect(data.count).toBe(1);
  });

  it('includes availableSeries in response', async () => {
    vi.mocked(pokemonTcg.getAllSupportedSets).mockResolvedValue([]);

    const request = createRequest('/api/sets');
    const response = await GET(request);
    const data = await response.json();

    expect(data.availableSeries).toEqual(['Scarlet & Violet', 'Sword & Shield']);
  });
});
