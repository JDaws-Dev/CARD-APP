/**
 * Affiliate Link Generation Utilities
 *
 * Generates affiliate-tracked links for TCGPlayer and other marketplaces.
 * Used primarily for wishlist share links to enable monetization when
 * family members purchase cards from shared wishlists.
 */

// ============================================================================
// TYPES
// ============================================================================

export type AffiliatePlatform = 'tcgplayer' | 'cardmarket' | 'ebay';

export interface AffiliateConfig {
  platform: AffiliatePlatform;
  affiliateId?: string;
  subId?: string; // Sub-tracking ID for campaign/source tracking
  campaignId?: string; // Campaign identifier
}

export interface AffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  platform: AffiliatePlatform;
  hasAffiliateTracking: boolean;
  affiliateId?: string;
  subId?: string;
}

export interface WishlistCardWithAffiliateLink {
  cardId: string;
  name?: string;
  tcgPlayerUrl?: string;
  affiliateLink?: AffiliateLink;
}

export interface AffiliateLinkStats {
  totalCards: number;
  cardsWithLinks: number;
  cardsWithAffiliateLinks: number;
  linksByPlatform: Record<AffiliatePlatform, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Default affiliate ID placeholder - should be configured via environment
export const DEFAULT_TCGPLAYER_AFFILIATE_ID = 'carddex';

// TCGPlayer affiliate URL parameters
export const TCGPLAYER_AFFILIATE_PARAM = 'partner';
export const TCGPLAYER_SUBID_PARAM = 'utm_campaign';
export const TCGPLAYER_SOURCE_PARAM = 'utm_source';

// Supported domains for affiliate link generation
export const TCGPLAYER_DOMAINS = ['tcgplayer.com', 'www.tcgplayer.com', 'shop.tcgplayer.com'];

export const CARDMARKET_DOMAINS = ['cardmarket.com', 'www.cardmarket.com'];

export const EBAY_DOMAINS = ['ebay.com', 'www.ebay.com'];

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a URL is a valid TCGPlayer URL
 */
export function isTCGPlayerUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return TCGPLAYER_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a valid Cardmarket URL
 */
export function isCardmarketUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return CARDMARKET_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a valid eBay URL
 */
export function isEbayUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return EBAY_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Detect the platform from a URL
 */
export function detectPlatform(url: string | undefined | null): AffiliatePlatform | null {
  if (isTCGPlayerUrl(url)) return 'tcgplayer';
  if (isCardmarketUrl(url)) return 'cardmarket';
  if (isEbayUrl(url)) return 'ebay';
  return null;
}

/**
 * Check if a URL already has affiliate tracking
 */
export function hasAffiliateTracking(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    // Check for common affiliate parameters
    return (
      parsedUrl.searchParams.has(TCGPLAYER_AFFILIATE_PARAM) ||
      parsedUrl.searchParams.has('affiliate') ||
      parsedUrl.searchParams.has('aff_id') ||
      parsedUrl.searchParams.has('ref')
    );
  } catch {
    return false;
  }
}

/**
 * Validate an affiliate ID format
 */
export function isValidAffiliateId(affiliateId: string | undefined | null): boolean {
  if (!affiliateId || typeof affiliateId !== 'string') {
    return false;
  }

  // Affiliate IDs should be alphanumeric, possibly with underscores/hyphens
  // Length between 3 and 50 characters
  return /^[a-zA-Z0-9_-]{3,50}$/.test(affiliateId);
}

// ============================================================================
// AFFILIATE LINK GENERATION
// ============================================================================

/**
 * Generate a TCGPlayer affiliate link
 */
export function generateTCGPlayerAffiliateLink(
  url: string,
  config?: Partial<AffiliateConfig>
): AffiliateLink {
  if (!isTCGPlayerUrl(url)) {
    return {
      originalUrl: url,
      affiliateUrl: url,
      platform: 'tcgplayer',
      hasAffiliateTracking: false,
    };
  }

  try {
    const parsedUrl = new URL(url);
    const affiliateId = config?.affiliateId || DEFAULT_TCGPLAYER_AFFILIATE_ID;

    // Add affiliate tracking parameters
    parsedUrl.searchParams.set(TCGPLAYER_AFFILIATE_PARAM, affiliateId);
    parsedUrl.searchParams.set(TCGPLAYER_SOURCE_PARAM, 'carddex_wishlist');

    if (config?.subId) {
      parsedUrl.searchParams.set(TCGPLAYER_SUBID_PARAM, config.subId);
    }

    if (config?.campaignId) {
      parsedUrl.searchParams.set('utm_medium', config.campaignId);
    }

    return {
      originalUrl: url,
      affiliateUrl: parsedUrl.toString(),
      platform: 'tcgplayer',
      hasAffiliateTracking: true,
      affiliateId,
      subId: config?.subId,
    };
  } catch {
    return {
      originalUrl: url,
      affiliateUrl: url,
      platform: 'tcgplayer',
      hasAffiliateTracking: false,
    };
  }
}

/**
 * Generate a Cardmarket affiliate link (placeholder for future implementation)
 */
export function generateCardmarketAffiliateLink(
  url: string,
  config?: Partial<AffiliateConfig>
): AffiliateLink {
  // Cardmarket affiliate implementation would go here
  // For now, return the original URL
  return {
    originalUrl: url,
    affiliateUrl: url,
    platform: 'cardmarket',
    hasAffiliateTracking: false,
    affiliateId: config?.affiliateId,
  };
}

/**
 * Generate an eBay affiliate link (placeholder for future implementation)
 */
export function generateEbayAffiliateLink(
  url: string,
  config?: Partial<AffiliateConfig>
): AffiliateLink {
  // eBay affiliate implementation would go here
  // For now, return the original URL
  return {
    originalUrl: url,
    affiliateUrl: url,
    platform: 'ebay',
    hasAffiliateTracking: false,
    affiliateId: config?.affiliateId,
  };
}

/**
 * Generate an affiliate link for any supported platform
 */
export function generateAffiliateLink(
  url: string | undefined | null,
  config?: Partial<AffiliateConfig>
): AffiliateLink | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const platform = config?.platform || detectPlatform(url);

  if (!platform) {
    return null;
  }

  switch (platform) {
    case 'tcgplayer':
      return generateTCGPlayerAffiliateLink(url, config);
    case 'cardmarket':
      return generateCardmarketAffiliateLink(url, config);
    case 'ebay':
      return generateEbayAffiliateLink(url, config);
    default:
      return null;
  }
}

// ============================================================================
// WISHLIST INTEGRATION
// ============================================================================

/**
 * Generate a sub-tracking ID for a wishlist share
 * Combines the share token and card ID for detailed tracking
 */
export function generateWishlistSubId(shareToken: string, cardId: string): string {
  // Create a clean subId: wishlist_<token>_<cardId>
  const cleanToken = shareToken.slice(0, 8);
  const cleanCardId = cardId.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 20);
  return `wishlist_${cleanToken}_${cleanCardId}`;
}

/**
 * Generate a campaign ID for wishlist shares
 */
export function generateWishlistCampaignId(): string {
  return 'wishlist_share';
}

/**
 * Enrich a wishlist card with an affiliate link
 */
export function enrichCardWithAffiliateLink(
  card: { cardId: string; name?: string; tcgPlayerUrl?: string },
  shareToken?: string,
  config?: Partial<AffiliateConfig>
): WishlistCardWithAffiliateLink {
  const result: WishlistCardWithAffiliateLink = {
    cardId: card.cardId,
    name: card.name,
    tcgPlayerUrl: card.tcgPlayerUrl,
  };

  if (!card.tcgPlayerUrl) {
    return result;
  }

  const subId = shareToken ? generateWishlistSubId(shareToken, card.cardId) : undefined;
  const campaignId = generateWishlistCampaignId();

  const affiliateLink = generateAffiliateLink(card.tcgPlayerUrl, {
    ...config,
    subId,
    campaignId,
  });

  if (affiliateLink) {
    result.affiliateLink = affiliateLink;
  }

  return result;
}

/**
 * Enrich multiple wishlist cards with affiliate links
 */
export function enrichCardsWithAffiliateLinks(
  cards: Array<{ cardId: string; name?: string; tcgPlayerUrl?: string }>,
  shareToken?: string,
  config?: Partial<AffiliateConfig>
): WishlistCardWithAffiliateLink[] {
  return cards.map((card) => enrichCardWithAffiliateLink(card, shareToken, config));
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Calculate affiliate link statistics for a set of cards
 */
export function calculateAffiliateLinkStats(
  cards: WishlistCardWithAffiliateLink[]
): AffiliateLinkStats {
  const stats: AffiliateLinkStats = {
    totalCards: cards.length,
    cardsWithLinks: 0,
    cardsWithAffiliateLinks: 0,
    linksByPlatform: {
      tcgplayer: 0,
      cardmarket: 0,
      ebay: 0,
    },
  };

  for (const card of cards) {
    if (card.tcgPlayerUrl) {
      stats.cardsWithLinks++;
    }

    if (card.affiliateLink?.hasAffiliateTracking) {
      stats.cardsWithAffiliateLinks++;
      stats.linksByPlatform[card.affiliateLink.platform]++;
    }
  }

  return stats;
}

/**
 * Get a display-friendly affiliate link summary
 */
export function getAffiliateLinkSummary(stats: AffiliateLinkStats): string {
  if (stats.cardsWithAffiliateLinks === 0) {
    return 'No affiliate links available';
  }

  const percent = Math.round((stats.cardsWithAffiliateLinks / stats.totalCards) * 100);
  return `${stats.cardsWithAffiliateLinks} of ${stats.totalCards} cards (${percent}%) have affiliate links`;
}

// ============================================================================
// URL PARSING UTILITIES
// ============================================================================

/**
 * Extract the affiliate ID from a URL if present
 */
export function extractAffiliateId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.searchParams.get(TCGPLAYER_AFFILIATE_PARAM) ||
      parsedUrl.searchParams.get('affiliate') ||
      parsedUrl.searchParams.get('aff_id') ||
      parsedUrl.searchParams.get('ref')
    );
  } catch {
    return null;
  }
}

/**
 * Remove affiliate tracking from a URL
 */
export function stripAffiliateTracking(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    // Remove common affiliate parameters
    parsedUrl.searchParams.delete(TCGPLAYER_AFFILIATE_PARAM);
    parsedUrl.searchParams.delete(TCGPLAYER_SUBID_PARAM);
    parsedUrl.searchParams.delete(TCGPLAYER_SOURCE_PARAM);
    parsedUrl.searchParams.delete('utm_medium');
    parsedUrl.searchParams.delete('affiliate');
    parsedUrl.searchParams.delete('aff_id');
    parsedUrl.searchParams.delete('ref');

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

/**
 * Replace existing affiliate tracking with new affiliate ID
 */
export function replaceAffiliateTracking(
  url: string | undefined | null,
  config: Partial<AffiliateConfig>
): string | null {
  const strippedUrl = stripAffiliateTracking(url);
  if (!strippedUrl) {
    return null;
  }

  const affiliateLink = generateAffiliateLink(strippedUrl, config);
  return affiliateLink?.affiliateUrl || strippedUrl;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get a friendly display name for a platform
 */
export function getPlatformDisplayName(platform: AffiliatePlatform): string {
  switch (platform) {
    case 'tcgplayer':
      return 'TCGPlayer';
    case 'cardmarket':
      return 'Cardmarket';
    case 'ebay':
      return 'eBay';
    default:
      return 'Unknown';
  }
}

/**
 * Get a "Buy on X" button label
 */
export function getBuyButtonLabel(platform: AffiliatePlatform): string {
  return `Buy on ${getPlatformDisplayName(platform)}`;
}

/**
 * Check if affiliate links should be shown for a profile type
 * (Parents see prices/links, kids do not by default)
 */
export function shouldShowAffiliateLinks(profileType: 'parent' | 'child' | undefined): boolean {
  return profileType === 'parent';
}

/**
 * Get affiliate disclosure text (required by FTC)
 */
export function getAffiliateDisclosure(): string {
  return 'This page contains affiliate links. We may earn a commission from purchases made through these links.';
}

/**
 * Get short affiliate disclosure for compact displays
 */
export function getShortAffiliateDisclosure(): string {
  return 'Affiliate links';
}

// ============================================================================
// TCGPLAYER SEARCH URL GENERATION
// ============================================================================

/**
 * TCGPlayer category slugs for each supported game
 */
export const TCGPLAYER_GAME_CATEGORIES: Record<string, string> = {
  pokemon: 'pokemon',
  yugioh: 'yugioh',
  onepiece: 'one-piece-card-game',
  lorcana: 'lorcana-tcg',
};

/**
 * Generate a TCGPlayer search URL for a card
 * Used when direct product URL is not available
 */
export function generateTCGPlayerSearchUrl(
  cardName: string,
  setName?: string,
  game?: string
): string {
  // Build search query: "cardName setName"
  const searchQuery = setName ? `${cardName} ${setName}` : cardName;
  const encodedQuery = encodeURIComponent(searchQuery);

  // Get game category if available
  const category = game ? TCGPLAYER_GAME_CATEGORIES[game] : null;

  // Build URL with or without category
  if (category) {
    return `https://www.tcgplayer.com/search/${category}/product?q=${encodedQuery}`;
  }

  return `https://www.tcgplayer.com/search/all/product?q=${encodedQuery}`;
}

/**
 * Get the best available purchase URL for a card
 * Prefers direct TCGPlayer URL if available, otherwise generates a search URL
 */
export function getCardPurchaseUrl(
  card: {
    name: string;
    tcgplayer?: { url?: string };
    set?: { name?: string };
  },
  game?: string
): string {
  // If card has a direct TCGPlayer URL, use it
  if (card.tcgplayer?.url) {
    return card.tcgplayer.url;
  }

  // Otherwise generate a search URL
  return generateTCGPlayerSearchUrl(card.name, card.set?.name, game);
}

/**
 * Get purchase URL with affiliate tracking
 */
export function getCardPurchaseUrlWithAffiliate(
  card: {
    name: string;
    tcgplayer?: { url?: string };
    set?: { name?: string };
  },
  game?: string,
  config?: Partial<AffiliateConfig>
): AffiliateLink {
  const baseUrl = getCardPurchaseUrl(card, game);
  return generateTCGPlayerAffiliateLink(baseUrl, config);
}
