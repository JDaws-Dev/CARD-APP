/**
 * Unified API Evaluation
 *
 * This module documents the evaluation of unified TCG APIs (ApiTCG.com and JustTCG.com)
 * to determine if they can replace multiple individual game-specific adapters.
 *
 * Evaluation Date: 2026-01-16
 *
 * =============================================================================
 * EXECUTIVE SUMMARY
 * =============================================================================
 *
 * After evaluating both ApiTCG.com and JustTCG.com, the recommendation is to
 * KEEP THE CURRENT MULTI-ADAPTER ARCHITECTURE for the following reasons:
 *
 * 1. Pricing data availability (JustTCG has it, ApiTCG doesn't)
 * 2. Rate limit concerns (JustTCG free tier: 10 req/min, 1000/month)
 * 3. Data completeness varies by game on unified APIs
 * 4. Individual APIs are more mature and game-specific
 * 5. No dependency on a single third-party aggregator
 *
 * However, JustTCG could be useful as a SUPPLEMENTAL source for:
 * - Cross-game pricing data (TCGPlayer integration)
 * - Bulk card lookups by external IDs (TCGPlayer, Scryfall)
 * - Price comparison features
 *
 * =============================================================================
 * API TCG EVALUATION (apitcg.com)
 * =============================================================================
 *
 * Coverage: 10 games
 * - Pokémon ✓
 * - One Piece ✓
 * - Dragon Ball Fusion ✓ (currently using this)
 * - Digimon ✓
 * - Magic: The Gathering ✓
 * - Union Arena
 * - Gundam
 * - Star Wars Unlimited
 * - Riftbound (League of Legends)
 * - Mitos y Leyendas (coming soon)
 *
 * NOT Covered:
 * - Yu-Gi-Oh! ✗
 * - Disney Lorcana ✗
 *
 * Pros:
 * - Open source, community-driven
 * - Covers some niche games (Gundam, Star Wars Unlimited)
 * - Good card data structure with images
 * - No strict rate limit documented
 *
 * Cons:
 * - NO PRICING DATA (critical for collection value)
 * - Missing Yu-Gi-Oh! (major TCG)
 * - Missing Disney Lorcana (growing TCG)
 * - Sets endpoint "under construction"
 * - API key optional but recommended
 * - Less mature than individual game APIs
 *
 * Current Usage:
 * - Already used for Dragon Ball Fusion World (dragonball-api.ts)
 *
 * =============================================================================
 * JUSTTCG EVALUATION (justtcg.com)
 * =============================================================================
 *
 * Coverage: 7 games
 * - Magic: The Gathering ✓ (100K+ cards)
 * - Pokémon ✓ (20K+ cards)
 * - Yu-Gi-Oh! ✓ (35K+ cards)
 * - Disney Lorcana ✓ (1K+ cards)
 * - One Piece TCG ✓ (5K+ cards)
 * - Digimon TCG ✓ (4K+ cards)
 * - Union Arena ✓
 *
 * NOT Covered:
 * - Dragon Ball Fusion World ✗
 *
 * Endpoints:
 * - GET /v1/games - List all games
 * - GET /v1/sets - Get sets with game filter
 * - GET/POST /v1/cards - Search cards, bulk lookup
 *
 * Authentication:
 * - API key required (x-api-key header)
 * - Environment variable: JUSTTCG_API_KEY
 *
 * Rate Limits by Plan:
 * - Free: 10 req/min, 1,000/month
 * - Starter: 50 req/min, 10,000/month ($9/mo)
 * - Professional: 100 req/min, 50,000/month ($29/mo)
 * - Enterprise: 500 req/min, 500,000/month ($99/mo)
 *
 * Pros:
 * - HAS PRICING DATA (TCGPlayer integration) - critical feature
 * - Good coverage of major TCGs
 * - External ID support (TCGPlayer, MTGJSON, Scryfall)
 * - Bulk card operations (100 cards per call)
 * - Consistent response format across games
 * - Condition and printing type filters
 *
 * Cons:
 * - API key required (not optional like other APIs)
 * - Strict rate limits on free tier (10 req/min, 1000/month)
 * - Missing Dragon Ball Fusion World
 * - Monthly cost for production use ($9-99/mo)
 * - Single point of failure for multiple games
 * - Less game-specific data (normalized but may lose details)
 *
 * =============================================================================
 * COMPARISON WITH CURRENT ADAPTERS
 * =============================================================================
 *
 * | Game        | Current Adapter     | ApiTCG | JustTCG | Pricing |
 * |-------------|---------------------|--------|---------|---------|
 * | Pokémon     | pokemontcg.io       | ✓      | ✓       | TCGPlayer (both) |
 * | Yu-Gi-Oh!   | ygoprodeck.com      | ✗      | ✓       | TCGPlayer (YGO) |
 * | MTG         | scryfall.com        | ✓      | ✓       | Scryfall (MTG) |
 * | One Piece   | optcg-api           | ✓      | ✓       | None    |
 * | Lorcana     | lorcast.com         | ✗      | ✓       | Lorcast (Lorcana) |
 * | Digimon     | digimoncard.io      | ✓      | ✓       | None    |
 * | Dragon Ball | apitcg.com          | ✓      | ✗       | None    |
 *
 * Current adapters: 7 individual APIs
 * ApiTCG coverage: 5/7 games (missing Yu-Gi-Oh!, Lorcana)
 * JustTCG coverage: 6/7 games (missing Dragon Ball)
 *
 * =============================================================================
 * RECOMMENDATION
 * =============================================================================
 *
 * KEEP CURRENT MULTI-ADAPTER ARCHITECTURE
 *
 * Rationale:
 *
 * 1. NEITHER unified API covers all 7 games
 *    - ApiTCG: Missing Yu-Gi-Oh! and Lorcana
 *    - JustTCG: Missing Dragon Ball Fusion World
 *    - Would still need 2-3 adapters even with unified API
 *
 * 2. Pricing data is inconsistent
 *    - JustTCG has pricing but at a cost (literally)
 *    - Current adapters: Pokemon, MTG, Lorcana have pricing
 *    - ApiTCG has NO pricing data
 *
 * 3. Rate limits on JustTCG free tier are restrictive
 *    - 10 requests/minute = very slow for bulk operations
 *    - 1,000 requests/month = not enough for active use
 *    - Would need paid plan for production
 *
 * 4. Individual APIs are more reliable and feature-rich
 *    - pokemontcg.io: Official-quality data, good rate limits
 *    - scryfall.com: Excellent MTG data, pricing, rulings
 *    - ygoprodeck.com: 20 req/sec, comprehensive Yu-Gi-Oh! data
 *
 * 5. Avoiding single point of failure
 *    - If JustTCG goes down, all games affected
 *    - Current: only one game affected per API outage
 *
 * POTENTIAL FUTURE USE CASES FOR JUSTTCG:
 *
 * 1. Price comparison feature
 *    - Use JustTCG for cross-game pricing data
 *    - "What's my collection worth?" across all games
 *
 * 2. TCGPlayer link enrichment
 *    - Get TCGPlayer product IDs for affiliate links
 *    - Support wishlist sharing with purchase links
 *
 * 3. Bulk card validation
 *    - Verify card existence across games
 *    - Import from other apps using TCGPlayer IDs
 *
 * =============================================================================
 */

// Export types and constants for potential future JustTCG integration

/**
 * JustTCG API configuration
 */
export const JUSTTCG_CONFIG = {
  baseUrl: 'https://justtcg.com/v1',
  envKeyName: 'JUSTTCG_API_KEY',
  rateLimits: {
    free: { requestsPerMinute: 10, monthlyLimit: 1000 },
    starter: { requestsPerMinute: 50, monthlyLimit: 10000 },
    professional: { requestsPerMinute: 100, monthlyLimit: 50000 },
    enterprise: { requestsPerMinute: 500, monthlyLimit: 500000 },
  },
  supportedGames: ['mtg', 'pokemon', 'yugioh', 'lorcana', 'onepiece', 'digimon', 'unionarena'],
} as const;

/**
 * ApiTCG configuration
 */
export const APITCG_CONFIG = {
  baseUrl: 'https://apitcg.com/api',
  envKeyName: 'APITCG_KEY', // Optional but recommended
  supportedGames: [
    'pokemon',
    'one-piece',
    'dragon-ball-fusion',
    'digimon',
    'magic',
    'union-arena',
    'gundam',
    'star-wars-unlimited',
    'riftbound',
  ],
  // Note: Currently used for Dragon Ball Fusion World in dragonball-api.ts
} as const;

/**
 * Evaluation result type
 */
export interface UnifiedApiEvaluation {
  apiName: string;
  gamesSupported: string[];
  gamesMissing: string[];
  hasPricing: boolean;
  rateLimitFree: { requestsPerMinute: number; monthlyLimit: number } | null;
  requiresApiKey: boolean;
  recommendation: 'use' | 'partial' | 'skip';
  notes: string[];
}

/**
 * Get evaluation results for both APIs
 */
export function getUnifiedApiEvaluations(): UnifiedApiEvaluation[] {
  return [
    {
      apiName: 'ApiTCG',
      gamesSupported: [
        'pokemon',
        'onepiece',
        'dragonball',
        'digimon',
        'mtg',
        'unionarena',
        'gundam',
        'starwars',
      ],
      gamesMissing: ['yugioh', 'lorcana'],
      hasPricing: false,
      rateLimitFree: null, // Not strictly documented
      requiresApiKey: false, // Optional
      recommendation: 'partial',
      notes: [
        'Already used for Dragon Ball Fusion World',
        'No pricing data - critical limitation',
        'Missing Yu-Gi-Oh! and Lorcana',
        'Sets endpoint under construction',
      ],
    },
    {
      apiName: 'JustTCG',
      gamesSupported: ['mtg', 'pokemon', 'yugioh', 'lorcana', 'onepiece', 'digimon', 'unionarena'],
      gamesMissing: ['dragonball'],
      hasPricing: true,
      rateLimitFree: { requestsPerMinute: 10, monthlyLimit: 1000 },
      requiresApiKey: true,
      recommendation: 'partial',
      notes: [
        'Has pricing data via TCGPlayer integration',
        'Missing Dragon Ball Fusion World',
        'Restrictive free tier (10 req/min, 1000/month)',
        'Useful for cross-game pricing features',
        'Could supplement current adapters for price data',
      ],
    },
  ];
}

/**
 * Check if a game is supported by a unified API
 */
export function isGameSupported(apiName: 'apitcg' | 'justtcg', gameSlug: string): boolean {
  const config = apiName === 'apitcg' ? APITCG_CONFIG : JUSTTCG_CONFIG;
  const normalizedSlug = gameSlug.toLowerCase().replace(/-/g, '');
  return config.supportedGames.some((g) => g.toLowerCase().replace(/-/g, '') === normalizedSlug);
}

/**
 * Get the best data source recommendation for a game
 */
export function getRecommendedDataSource(gameSlug: string): {
  primary: string;
  forPricing: string | null;
  notes: string;
} {
  const recommendations: Record<
    string,
    { primary: string; forPricing: string | null; notes: string }
  > = {
    pokemon: {
      primary: 'pokemontcg.io',
      forPricing: 'pokemontcg.io (TCGPlayer)',
      notes: 'Official-quality data, good rate limits, built-in pricing',
    },
    yugioh: {
      primary: 'ygoprodeck.com',
      forPricing: 'ygoprodeck.com (TCGPlayer)',
      notes: '20 req/sec, comprehensive data, built-in pricing',
    },
    mtg: {
      primary: 'scryfall.com',
      forPricing: 'scryfall.com',
      notes: 'Best MTG data, 10 req/sec, excellent pricing',
    },
    onepiece: {
      primary: 'optcg-api',
      forPricing: 'JustTCG (if needed)',
      notes: 'No built-in pricing, JustTCG could supplement',
    },
    lorcana: {
      primary: 'lorcast.com',
      forPricing: 'lorcast.com',
      notes: 'Good Lorcana data, built-in pricing',
    },
    digimon: {
      primary: 'digimoncard.io',
      forPricing: 'JustTCG (if needed)',
      notes: 'No built-in pricing, JustTCG could supplement',
    },
    dragonball: {
      primary: 'apitcg.com',
      forPricing: null,
      notes: 'Only available source, no pricing available anywhere',
    },
  };

  return (
    recommendations[gameSlug.toLowerCase()] || {
      primary: 'unknown',
      forPricing: null,
      notes: 'Game not currently supported',
    }
  );
}
