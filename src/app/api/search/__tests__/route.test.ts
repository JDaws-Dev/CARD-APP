import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the pokemon-tcg module
vi.mock('@/lib/pokemon-tcg', () => ({
  searchCards: vi.fn(),
}));

import { searchCards } from '@/lib/pokemon-tcg';

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when query is missing', async () => {
    const request = new NextRequest('http://localhost/api/search');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query is required');
    expect(searchCards).not.toHaveBeenCalled();
  });

  it('returns 400 when query is empty', async () => {
    const request = new NextRequest('http://localhost/api/search?q=');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query is required');
  });

  it('returns 400 when query is too short', async () => {
    const request = new NextRequest('http://localhost/api/search?q=a');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query must be at least 2 characters');
  });

  it('returns 400 when query is too long', async () => {
    const longQuery = 'a'.repeat(101);
    const request = new NextRequest(`http://localhost/api/search?q=${longQuery}`);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query is too long');
  });

  it('returns cards for valid query', async () => {
    const mockCards = [
      { id: 'sv1-25', name: 'Pikachu', images: { small: 'url1', large: 'url2' } },
      { id: 'sv2-25', name: 'Pikachu ex', images: { small: 'url3', large: 'url4' } },
    ];
    vi.mocked(searchCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/search?q=Pikachu');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCards);
    expect(searchCards).toHaveBeenCalledWith('Pikachu', 20);
  });

  it('trims whitespace from query', async () => {
    const mockCards = [
      { id: 'sv1-1', name: 'Charizard', images: { small: 'url1', large: 'url2' } },
    ];
    vi.mocked(searchCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/search?q=%20Charizard%20');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(searchCards).toHaveBeenCalledWith('Charizard', 20);
  });

  it('respects custom limit parameter', async () => {
    const mockCards = [];
    vi.mocked(searchCards).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/search?q=Mewtwo&limit=10');

    await GET(request);

    expect(searchCards).toHaveBeenCalledWith('Mewtwo', 10);
  });

  it('clamps limit to max of 50', async () => {
    vi.mocked(searchCards).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost/api/search?q=Eevee&limit=100');

    await GET(request);

    expect(searchCards).toHaveBeenCalledWith('Eevee', 50);
  });

  it('clamps limit to min of 1', async () => {
    vi.mocked(searchCards).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost/api/search?q=Eevee&limit=0');

    await GET(request);

    expect(searchCards).toHaveBeenCalledWith('Eevee', 1);
  });

  it('returns 500 on API failure', async () => {
    vi.mocked(searchCards).mockRejectedValueOnce(new Error('API Error'));

    const request = new NextRequest('http://localhost/api/search?q=Pikachu');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to search cards');
  });
});
