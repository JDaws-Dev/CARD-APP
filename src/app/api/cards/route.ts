import { NextRequest, NextResponse } from 'next/server';
import { getCardsByIds } from '@/lib/pokemon-tcg';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardIds } = body;

    if (!Array.isArray(cardIds)) {
      return NextResponse.json({ error: 'cardIds must be an array' }, { status: 400 });
    }

    if (cardIds.length === 0) {
      return NextResponse.json([]);
    }

    // Limit to prevent abuse
    if (cardIds.length > 500) {
      return NextResponse.json({ error: 'Too many card IDs (max 500)' }, { status: 400 });
    }

    const cards = await getCardsByIds(cardIds);
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
