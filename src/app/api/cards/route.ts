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
 * POST /api/cards
 * Body:
 *   - cardIds: string[] - Array of card IDs to fetch (max 500)
 *   - game: "pokemon" | "yugioh" | "mtg" | "onepiece" | "lorcana" | "digimon" | "dragonball" (optional, for validation)
 *
 * Returns cached cards from Convex database for the specified card IDs.
 *
 * Note: The `game` parameter is optional and used only for validation/logging.
 * Cards are fetched by their unique cardId regardless of game.
 * For backward compatibility, cardIds can be from any game when game is not specified.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardIds, game } = body;

    if (!Array.isArray(cardIds)) {
      return NextResponse.json(
        {
          error: 'cardIds must be an array',
          received: typeof cardIds,
        },
        { status: 400 }
      );
    }

    // Validate game parameter if provided
    if (game !== undefined && !isValidGameSlug(game)) {
      return NextResponse.json(
        {
          error: 'Invalid game parameter',
          validOptions: VALID_GAMES,
          received: game,
        },
        { status: 400 }
      );
    }

    if (cardIds.length === 0) {
      return NextResponse.json({
        data: [],
        cards: {},
        game: game || null,
        count: 0,
        requested: 0,
        availableGames: VALID_GAMES,
      });
    }

    // Limit to prevent abuse (200 is Convex limit, but allow up to 500 with batching)
    const MAX_CARDS = 500;
    if (cardIds.length > MAX_CARDS) {
      return NextResponse.json(
        {
          error: `Too many card IDs (max ${MAX_CARDS})`,
          received: cardIds.length,
          max: MAX_CARDS,
        },
        { status: 400 }
      );
    }

    // Validate card IDs are strings
    const invalidIds = cardIds.filter((id) => typeof id !== 'string' || id.trim() === '');
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: 'All cardIds must be non-empty strings',
          invalidCount: invalidIds.length,
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

    // Convex getCardsByIds has a limit of 200, so batch if needed
    const BATCH_SIZE = 200;
    const batches: string[][] = [];
    for (let i = 0; i < cardIds.length; i += BATCH_SIZE) {
      batches.push(cardIds.slice(i, i + BATCH_SIZE));
    }

    // Fetch all batches in parallel
    const batchResults = await Promise.all(
      batches.map((batch) =>
        client.query(api.dataPopulation.getCardsByIds, {
          cardIds: batch,
        })
      )
    );

    // Merge results from all batches
    const mergedCards: Record<string, unknown> = {};
    let totalFound = 0;
    let totalMissing = 0;

    for (const result of batchResults) {
      for (const [cardId, card] of Object.entries(result.cards)) {
        mergedCards[cardId] = card;
      }
      totalFound += result.stats.found;
      totalMissing += result.stats.missing;
    }

    // Collect unique set IDs to fetch set names
    const uniqueSetIds = [
      ...new Set(
        Object.values(mergedCards).map(
          (card) => (card as { setId: string }).setId
        )
      ),
    ];

    // Fetch set names from cachedSets table
    const setNames: Record<string, string> =
      uniqueSetIds.length > 0
        ? await client.query(api.dataPopulation.getSetNamesByIds, {
            setIds: uniqueSetIds,
          })
        : {};

    // Convert to array format for backward compatibility
    // Original API returned PokemonCard[] format
    const cardsArray = Object.values(mergedCards).map((card) => {
      const c = card as {
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
      };
      // Transform to match expected card format
      return {
        id: c.cardId,
        name: c.name,
        supertype: c.supertype,
        subtypes: c.subtypes,
        types: c.types,
        number: c.number,
        rarity: c.rarity,
        images: {
          small: c.imageSmall,
          large: c.imageLarge,
        },
        tcgplayer: c.tcgPlayerUrl
          ? {
              url: c.tcgPlayerUrl,
              prices: c.priceMarket
                ? {
                    normal: { market: c.priceMarket },
                  }
                : undefined,
            }
          : undefined,
        set: {
          id: c.setId,
          name: setNames[c.setId] || '',
        },
        gameSlug: c.gameSlug,
      };
    });

    return NextResponse.json({
      data: cardsArray,
      cards: mergedCards,
      game: game || null,
      count: cardsArray.length,
      requested: cardIds.length,
      found: totalFound,
      missing: totalMissing,
      availableGames: VALID_GAMES,
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cards
 * Query params:
 *   - game: "pokemon" | "yugioh" | "mtg" | "onepiece" | "lorcana" | "digimon" | "dragonball" (required)
 *   - setId: Optional filter by set ID
 *   - limit: Optional limit (default 50, max 500)
 *   - offset: Optional offset for pagination
 *
 * Returns cached cards from Convex database for the specified game.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');
    const setId = searchParams.get('setId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Game parameter is required for GET requests
    if (!game) {
      return NextResponse.json(
        {
          error: 'Missing required game parameter',
          validOptions: VALID_GAMES,
        },
        { status: 400 }
      );
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
    const MAX_LIMIT = 500;
    const DEFAULT_LIMIT = 50;
    let limit = DEFAULT_LIMIT;
    if (limitParam !== null) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          {
            error: 'Invalid limit parameter',
            received: limitParam,
            message: 'Limit must be a positive integer',
          },
          { status: 400 }
        );
      }
      limit = Math.min(limit, MAX_LIMIT);
    }

    // Parse and validate offset
    let offset = 0;
    if (offsetParam !== null) {
      offset = parseInt(offsetParam, 10);
      if (isNaN(offset) || offset < 0) {
        return NextResponse.json(
          {
            error: 'Invalid offset parameter',
            received: offsetParam,
            message: 'Offset must be a non-negative integer',
          },
          { status: 400 }
        );
      }
    }

    // Initialize Convex HTTP client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    let cards;
    if (setId) {
      // Fetch cards for a specific set
      cards = await client.query(api.dataPopulation.getCachedCardsInSet, {
        setId,
        gameSlug: game,
      });
      // Apply pagination manually since getCachedCardsInSet doesn't support it
      cards = cards.slice(offset, offset + limit);
    } else {
      // Fetch cards by game with pagination
      cards = await client.query(api.dataPopulation.getCardsByGame, {
        gameSlug: game,
        limit,
        offset,
      });
    }

    // Collect unique set IDs to fetch set names
    const uniqueSetIds = [
      ...new Set(
        cards.map(
          (card: { setId: string }) => card.setId
        )
      ),
    ];

    // Fetch set names from cachedSets table
    const setNames: Record<string, string> =
      uniqueSetIds.length > 0
        ? await client.query(api.dataPopulation.getSetNamesByIds, {
            setIds: uniqueSetIds,
          })
        : {};

    // Transform cards to standard format
    const transformedCards = cards.map(
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
          name: setNames[card.setId] || '',
        },
        gameSlug: card.gameSlug,
      })
    );

    return NextResponse.json({
      data: transformedCards,
      game,
      setId: setId || null,
      count: transformedCards.length,
      limit,
      offset,
      hasMore: transformedCards.length === limit,
      availableGames: VALID_GAMES,
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cards',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
