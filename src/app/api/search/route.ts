import { NextRequest, NextResponse } from 'next/server';
import { searchCards } from '@/lib/pokemon-tcg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json({ error: 'Search query is too long' }, { status: 400 });
    }

    // Limit the results to a reasonable amount
    const clampedLimit = Math.min(Math.max(1, limit), 50);

    const cards = await searchCards(query.trim(), clampedLimit);
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json({ error: 'Failed to search cards' }, { status: 500 });
  }
}
