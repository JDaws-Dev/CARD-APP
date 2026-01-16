import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock the pokemon-tcg module
vi.mock('@/lib/pokemon-tcg', () => ({
  getCardsByIds: vi.fn(),
}));

import { getCardsByIds } from '@/lib/pokemon-tcg';

describe('POST /api/cards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty array for empty cardIds', async () => {
    const request = new NextRequest('http://localhost/api/cards', {
      method: 'POST',
      body: JSON.stringify({ cardIds: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data).toEqual([]);
    expect(getCardsByIds).not.toHaveBeenCalled();
  });

  it('returns cards for valid cardIds', async () => {
    const mockCards = [{ id: 'sv1-1', name: 'Pikachu', images: { small: 'url1', large: 'url2' } }];
    vi.mocked(getCardsByIds).mockResolvedValueOnce(mockCards);

    const request = new NextRequest('http://localhost/api/cards', {
      method: 'POST',
      body: JSON.stringify({ cardIds: ['sv1-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCards);
    expect(getCardsByIds).toHaveBeenCalledWith(['sv1-1']);
  });

  it('returns 400 for invalid cardIds type', async () => {
    const request = new NextRequest('http://localhost/api/cards', {
      method: 'POST',
      body: JSON.stringify({ cardIds: 'not-an-array' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('cardIds must be an array');
  });

  it('returns 400 for too many cardIds', async () => {
    const cardIds = Array.from({ length: 501 }, (_, i) => `sv1-${i}`);

    const request = new NextRequest('http://localhost/api/cards', {
      method: 'POST',
      body: JSON.stringify({ cardIds }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Too many card IDs (max 500)');
  });

  it('returns 500 on API failure', async () => {
    vi.mocked(getCardsByIds).mockRejectedValueOnce(new Error('API Error'));

    const request = new NextRequest('http://localhost/api/cards', {
      method: 'POST',
      body: JSON.stringify({ cardIds: ['sv1-1'] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch cards');
  });
});
