import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the pokemon-tcg module
vi.mock('@/lib/pokemon-tcg', () => ({
  filterCards: vi.fn(),
  POKEMON_TYPES: [
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
  ],
}));

import { filterCards } from '@/lib/pokemon-tcg';

describe('GET /api/filter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when no filters are provided', async () => {
    const request = new NextRequest('http://localhost/api/filter');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('At least one filter (setId, type, or name) is required');
    expect(filterCards).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid type', async () => {
    const request = new NextRequest('http://localhost/api/filter?type=InvalidType');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid type');
    expect(filterCards).not.toHaveBeenCalled();
  });

  it('returns 400 when name is too short', async () => {
    const request = new NextRequest('http://localhost/api/filter?name=a');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name filter must be at least 2 characters');
  });

  it('returns 400 when name is too long', async () => {
    const longName = 'a'.repeat(101);
    const request = new NextRequest(`http://localhost/api/filter?name=${longName}`);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name filter is too long');
  });

  it('returns cards when filtered by setId only', async () => {
    const mockCards = [{ id: 'sv1-25', name: 'Pikachu', images: { small: 'url1', large: 'url2' } }];
    vi.mocked(filterCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/filter?setId=sv1');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCards);
    expect(filterCards).toHaveBeenCalledWith({
      setId: 'sv1',
      type: undefined,
      name: undefined,
      limit: 50,
    });
  });

  it('returns cards when filtered by type only', async () => {
    const mockCards = [
      {
        id: 'sv1-25',
        name: 'Pikachu',
        types: ['Lightning'],
        images: { small: 'url1', large: 'url2' },
      },
    ];
    vi.mocked(filterCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/filter?type=Lightning');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCards);
    expect(filterCards).toHaveBeenCalledWith({
      setId: undefined,
      type: 'Lightning',
      name: undefined,
      limit: 50,
    });
  });

  it('returns cards when filtered by name only', async () => {
    const mockCards = [{ id: 'sv1-25', name: 'Pikachu', images: { small: 'url1', large: 'url2' } }];
    vi.mocked(filterCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/filter?name=Pikachu');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCards);
    expect(filterCards).toHaveBeenCalledWith({
      setId: undefined,
      type: undefined,
      name: 'Pikachu',
      limit: 50,
    });
  });

  it('returns cards when filtered by multiple criteria', async () => {
    const mockCards = [
      {
        id: 'sv1-25',
        name: 'Pikachu',
        types: ['Lightning'],
        images: { small: 'url1', large: 'url2' },
      },
    ];
    vi.mocked(filterCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest(
      'http://localhost/api/filter?setId=sv1&type=Lightning&name=Pikachu'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCards);
    expect(filterCards).toHaveBeenCalledWith({
      setId: 'sv1',
      type: 'Lightning',
      name: 'Pikachu',
      limit: 50,
    });
  });

  it('trims whitespace from name', async () => {
    vi.mocked(filterCards).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost/api/filter?name=%20Charizard%20');

    await GET(request);

    expect(filterCards).toHaveBeenCalledWith({
      setId: undefined,
      type: undefined,
      name: 'Charizard',
      limit: 50,
    });
  });

  it('respects custom limit parameter', async () => {
    vi.mocked(filterCards).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost/api/filter?type=Fire&limit=25');

    await GET(request);

    expect(filterCards).toHaveBeenCalledWith({
      setId: undefined,
      type: 'Fire',
      name: undefined,
      limit: 25,
    });
  });

  it('clamps limit to max of 100', async () => {
    vi.mocked(filterCards).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost/api/filter?type=Water&limit=200');

    await GET(request);

    expect(filterCards).toHaveBeenCalledWith({
      setId: undefined,
      type: 'Water',
      name: undefined,
      limit: 100,
    });
  });

  it('clamps limit to min of 1', async () => {
    vi.mocked(filterCards).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost/api/filter?type=Grass&limit=0');

    await GET(request);

    expect(filterCards).toHaveBeenCalledWith({
      setId: undefined,
      type: 'Grass',
      name: undefined,
      limit: 1,
    });
  });

  it('validates all valid Pokemon types', async () => {
    const validTypes = [
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
    ];

    for (const type of validTypes) {
      vi.mocked(filterCards).mockResolvedValueOnce([]);
      const request = new NextRequest(`http://localhost/api/filter?type=${type}`);
      const response = await GET(request);
      expect(response.status).toBe(200);
    }
  });

  it('returns 500 on API failure', async () => {
    vi.mocked(filterCards).mockRejectedValueOnce(new Error('API Error'));

    const request = new NextRequest('http://localhost/api/filter?type=Fire');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to filter cards');
  });
});
