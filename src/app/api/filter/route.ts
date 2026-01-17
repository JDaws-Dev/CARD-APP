import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

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
 * Common types by game for validation hints
 * Note: These are hints - the actual type values depend on the cached card data
 */
const COMMON_TYPES_BY_GAME: Record<GameSlug, string[]> = {
  pokemon: [
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
  yugioh: ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'],
  mtg: ['W', 'U', 'B', 'R', 'G'], // White, Blue, Black, Red, Green
  onepiece: ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'],
  lorcana: ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'],
  digimon: ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'],
  dragonball: ['Red', 'Blue', 'Green', 'Yellow'],
};

/**
 * GET /api/filter
 * Query params:
 *   - game: "pokemon" | "yugioh" | "mtg" | "onepiece" | "lorcana" | "digimon" | "dragonball" (default: "pokemon")
 *   - setId: Optional set ID to filter by
 *   - type: Optional type/color to filter by (e.g., "Fire" for Pokemon)
 *   - name: Optional partial name match (case-insensitive, 2-100 characters)
 *   - rarity: Optional rarity to filter by (e.g., "Rare Holo")
 *   - limit: Optional limit on results (default 50, max 100)
 *   - offset: Optional pagination offset (default 0)
 *
 * Returns cached cards from Convex database matching the filters within the specified game.
 * At least one filter (setId, type, name, or rarity) is required.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game') || 'pokemon';
    const setId = searchParams.get('setId');
    const type = searchParams.get('type');
    const name = searchParams.get('name');
    const rarity = searchParams.get('rarity');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

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

    // Validate at least one filter is provided
    if (!setId && !type && !name && !rarity) {
      return NextResponse.json(
        { error: 'At least one filter (setId, type, name, or rarity) is required' },
        { status: 400 }
      );
    }

    // Validate name length if provided
    if (name) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return NextResponse.json(
          { error: 'Name filter must be at least 2 characters' },
          { status: 400 }
        );
      }
      if (trimmedName.length > 100) {
        return NextResponse.json({ error: 'Name filter is too long' }, { status: 400 });
      }
    }

    // Parse and validate limit
    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;
    const MIN_LIMIT = 1;
    let limit = DEFAULT_LIMIT;

    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit)) {
        limit = Math.min(Math.max(MIN_LIMIT, parsedLimit), MAX_LIMIT);
      }
    }

    // Parse and validate offset
    let offset = 0;
    if (offsetParam !== null) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }

    // Initialize Convex HTTP client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Filter cards using Convex query
    const result = await client.query(api.dataPopulation.filterCardsByGame, {
      gameSlug: game,
      setId: setId || undefined,
      type: type || undefined,
      name: name?.trim() || undefined,
      rarity: rarity || undefined,
      limit,
      offset,
    });

    // Transform cards to standard API response format
    const transformedCards = result.cards.map(
      (card: {
        cardId: string;
        gameSlug: string;
        setId: string;
        name: string;
        number: string;
        supertype: string;
        subtypes: string[];
        types: string[];
        rarity?: string;
        imageSmall: string;
        imageLarge: string;
        tcgPlayerUrl?: string;
        priceMarket?: number;
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

    return NextResponse.json({
      data: transformedCards,
      game,
      filters: {
        setId: setId || undefined,
        type: type || undefined,
        name: name?.trim() || undefined,
        rarity: rarity || undefined,
      },
      count: transformedCards.length,
      totalCount: result.totalCount,
      limit,
      offset,
      hasMore: result.hasMore,
      availableGames: VALID_GAMES,
      commonTypes: COMMON_TYPES_BY_GAME[game],
    });
  } catch (error) {
    console.error('Error filtering cards:', error);
    return NextResponse.json(
      {
        error: 'Failed to filter cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
