import { NextRequest, NextResponse } from 'next/server';
import { filterCards, POKEMON_TYPES } from '@/lib/pokemon-tcg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');
    const type = searchParams.get('type');
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Validate at least one filter is provided
    if (!setId && !type && !name) {
      return NextResponse.json(
        { error: 'At least one filter (setId, type, or name) is required' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (type && !POKEMON_TYPES.includes(type as (typeof POKEMON_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid type. Valid types are: ${POKEMON_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate name length if provided
    if (name) {
      if (name.length < 2) {
        return NextResponse.json(
          { error: 'Name filter must be at least 2 characters' },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json({ error: 'Name filter is too long' }, { status: 400 });
      }
    }

    // Clamp limit to reasonable bounds
    const clampedLimit = Math.min(Math.max(1, limit), 100);

    const cards = await filterCards({
      setId: setId || undefined,
      type: type || undefined,
      name: name?.trim() || undefined,
      limit: clampedLimit,
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error filtering cards:', error);
    return NextResponse.json({ error: 'Failed to filter cards' }, { status: 500 });
  }
}
