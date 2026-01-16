import { NextRequest, NextResponse } from 'next/server';
import {
  getScarletVioletSets,
  getSwordShieldSets,
  getAllSupportedSets,
  POKEMON_SERIES,
  type PokemonSeries,
} from '@/lib/pokemon-tcg';

/**
 * GET /api/sets
 * Query params:
 *   - series: "Scarlet & Violet" | "Sword & Shield" | "all" (default: "all")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const series = searchParams.get('series') || 'all';

    let sets;

    if (series === 'all') {
      sets = await getAllSupportedSets();
    } else if (series === 'Scarlet & Violet') {
      sets = await getScarletVioletSets();
    } else if (series === 'Sword & Shield') {
      sets = await getSwordShieldSets();
    } else {
      return NextResponse.json(
        {
          error: 'Invalid series parameter',
          validOptions: [...POKEMON_SERIES, 'all'],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: sets,
      series: series,
      count: sets.length,
      availableSeries: [...POKEMON_SERIES] as PokemonSeries[],
    });
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}
