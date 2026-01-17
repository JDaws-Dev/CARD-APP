import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import {
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from '../../../lib/rateLimit';

/**
 * Valid game slugs for the API
 */
const VALID_GAMES = [
  'pokemon',
  'yugioh',
  'mtg',
  'onepiece',
  'lorcana',
  'digimon',
  'dragonball',
] as const;

type GameSlug = (typeof VALID_GAMES)[number];

/**
 * Validate if a string is a valid game slug
 */
function isValidGameSlug(value: string): value is GameSlug {
  return VALID_GAMES.includes(value as GameSlug);
}

/**
 * GET /api/search
 * Query params:
 *   - q: Search query string (required, 2-100 characters)
 *   - game: "pokemon" | "yugioh" | "mtg" | "onepiece" | "lorcana" | "digimon" | "dragonball" (default: "pokemon")
 *   - limit: Optional limit on results (default 20, max 50)
 *
 * Returns cached cards from Convex database matching the search term within the specified game.
 * Searches by card name (case-insensitive partial match).
 */
export async function GET(request: NextRequest) {
  // Check rate limit first
  const rateLimitResult = checkRateLimit(request, RATE_LIMIT_CONFIGS.search);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const game = searchParams.get('game') || 'pokemon';
    const limitParam = searchParams.get('limit');

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (trimmedQuery.length > 100) {
      return NextResponse.json({ error: 'Search query is too long' }, { status: 400 });
    }

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

    // Parse and validate limit
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 50;
    const MIN_LIMIT = 1;
    let limit = DEFAULT_LIMIT;

    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit)) {
        limit = Math.min(Math.max(MIN_LIMIT, parsedLimit), MAX_LIMIT);
      }
    }

    // Initialize Convex HTTP client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Search cards using Convex query
    const cachedCards = await client.query(api.dataPopulation.searchCardsByGame, {
      gameSlug: game,
      searchTerm: trimmedQuery,
      limit,
    });

    // Transform cards to standard API response format
    const transformedCards = cachedCards.map(
      (card: {
        cardId: string;
        gameSlug: string;
        setId: string;
        name: string;
        number: string;
        supertype: string;
        subtypes: string[];
        types: string[];
        rarity: string | undefined;
        imageSmall: string;
        imageLarge: string;
        tcgPlayerUrl: string | undefined;
        priceMarket: number | undefined;
      }) => ({
        id: card.cardId,
        name: card.name,
        supertype: card.supertype,
        subtypes: card.subtypes,
        types: card.types,
        number: card.number,
        rarity: card.rarity,
        images: {
          small: card.imageSmall,
          large: card.imageLarge,
        },
        tcgplayer: card.tcgPlayerUrl
          ? {
              url: card.tcgPlayerUrl,
              prices: card.priceMarket
                ? {
                    normal: { market: card.priceMarket },
                  }
                : undefined,
            }
          : undefined,
        set: {
          id: card.setId,
          name: '', // Set name not stored in cachedCards
        },
        gameSlug: card.gameSlug,
      })
    );

    const response = NextResponse.json({
      data: transformedCards,
      query: trimmedQuery,
      game,
      count: transformedCards.length,
      limit,
      availableGames: VALID_GAMES,
    });

    // Add rate limit headers to successful response
    addRateLimitHeaders(response, rateLimitResult);
    return response;
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json(
      {
        error: 'Failed to search cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
