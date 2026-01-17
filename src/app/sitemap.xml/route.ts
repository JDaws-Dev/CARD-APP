import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import {
  generateCompleteSitemap,
  STATIC_PUBLIC_ROUTES,
  type SetForSitemap,
  type SitemapConfig,
} from '../../lib/sitemap';

// Valid game slugs for fetching sets
const GAME_SLUGS = ['pokemon', 'yugioh', 'onepiece', 'lorcana'] as const;
type GameSlug = (typeof GAME_SLUGS)[number];

/**
 * GET /sitemap.xml
 *
 * Generates and serves a dynamic XML sitemap containing:
 * - Static public routes (home, login, sets list, etc.)
 * - Dynamic set detail pages for all TCG games (/sets/[setId])
 *
 * The sitemap is generated fresh on each request to ensure it reflects
 * the current state of the database. For production, consider caching
 * with edge caching or incremental static regeneration.
 *
 * Response headers:
 * - Content-Type: application/xml
 * - Cache-Control: public, max-age=3600 (1 hour cache)
 */
export async function GET() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Server configuration error</error>',
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }

  try {
    const client = new ConvexHttpClient(convexUrl);

    // Fetch all sets from all games in parallel
    const setsPromises = GAME_SLUGS.map(async (gameSlug: GameSlug) => {
      try {
        const sets = await client.query(api.dataPopulation.getSetsByGame, { gameSlug });
        return sets.map((set: { setId: string; releaseDate?: string }) => ({
          setId: set.setId,
          gameSlug,
          releaseDate: set.releaseDate,
        }));
      } catch {
        // If a game's sets can't be fetched, return empty array
        // This ensures partial failures don't break the entire sitemap
        return [];
      }
    });

    const setsArrays = await Promise.all(setsPromises);
    const allSets: SetForSitemap[] = setsArrays.flat();

    // Configure sitemap generation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kidcollect.app';
    const config: SitemapConfig = {
      baseUrl,
      defaultPriority: 0.5,
      defaultChangeFreq: 'weekly',
    };

    // Generate the sitemap XML
    const sitemapXml = generateCompleteSitemap(config, allSets, STATIC_PUBLIC_ROUTES);

    return new NextResponse(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Sitemap-URLs': String(STATIC_PUBLIC_ROUTES.length + allSets.length),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap: ${errorMessage}</error>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}
