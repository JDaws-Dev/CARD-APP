import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

/**
 * Valid game slugs for the API
 */
const VALID_GAMES = ['pokemon', 'yugioh', 'onepiece', 'lorcana'] as const;

type GameSlug = (typeof VALID_GAMES)[number];

/**
 * Validate if a string is a valid game slug
 */
function isValidGameSlug(value: string): value is GameSlug {
  return VALID_GAMES.includes(value as GameSlug);
}

/**
 * GET /api/sets
 * Query params:
 *   - game: "pokemon" | "yugioh" | "onepiece" | "lorcana" (default: "pokemon")
 *   - series: Optional filter by series name within the selected game
 *
 * Returns cached sets from Convex database for the specified game.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game') || 'pokemon';
    const series = searchParams.get('series');

    // Validate game parameter
    if (!isValidGameSlug(game)) {
      return NextResponse.json(
        {
          error: 'Invalid game parameter',
          validOptions: VALID_GAMES,
          received: game,
        },
        { status: 400 }
      );
    }

    // Initialize Convex HTTP client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Fetch sets from Convex cache
    const cachedSets = await client.query(api.dataPopulation.getSetsByGame, {
      gameSlug: game,
    });

    // Filter by series if provided
    let sets = cachedSets;
    if (series && series !== 'all') {
      sets = cachedSets.filter((set) => set.series.toLowerCase() === series.toLowerCase());
    }

    // Get unique series names for the game
    const availableSeries = [...new Set(cachedSets.map((set) => set.series))].sort();

    return NextResponse.json({
      data: sets,
      game,
      series: series || 'all',
      count: sets.length,
      totalForGame: cachedSets.length,
      availableSeries,
      availableGames: VALID_GAMES,
    });
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
