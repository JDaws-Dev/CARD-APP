import { describe, expect, it } from 'vitest';
import {
  // Constants
  DEFAULT_TCGPLAYER_AFFILIATE_ID,
  TCGPLAYER_AFFILIATE_PARAM,
  TCGPLAYER_SUBID_PARAM,
  TCGPLAYER_SOURCE_PARAM,
  TCGPLAYER_DOMAINS,
  CARDMARKET_DOMAINS,
  EBAY_DOMAINS,
  // Validation
  isTCGPlayerUrl,
  isCardmarketUrl,
  isEbayUrl,
  detectPlatform,
  hasAffiliateTracking,
  isValidAffiliateId,
  // Link generation
  generateTCGPlayerAffiliateLink,
  generateCardmarketAffiliateLink,
  generateEbayAffiliateLink,
  generateAffiliateLink,
  // Wishlist integration
  generateWishlistSubId,
  generateWishlistCampaignId,
  enrichCardWithAffiliateLink,
  enrichCardsWithAffiliateLinks,
  // Statistics
  calculateAffiliateLinkStats,
  getAffiliateLinkSummary,
  // URL utilities
  extractAffiliateId,
  stripAffiliateTracking,
  replaceAffiliateTracking,
  // Display helpers
  getPlatformDisplayName,
  getBuyButtonLabel,
  shouldShowAffiliateLinks,
  getAffiliateDisclosure,
  getShortAffiliateDisclosure,
  // Types
  AffiliatePlatform,
  AffiliateConfig,
  AffiliateLink,
  WishlistCardWithAffiliateLink,
} from '../affiliateLinks';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Affiliate Link Constants', () => {
  it('should have a default TCGPlayer affiliate ID', () => {
    expect(DEFAULT_TCGPLAYER_AFFILIATE_ID).toBe('carddex');
  });

  it('should have correct TCGPlayer parameter names', () => {
    expect(TCGPLAYER_AFFILIATE_PARAM).toBe('partner');
    expect(TCGPLAYER_SUBID_PARAM).toBe('utm_campaign');
    expect(TCGPLAYER_SOURCE_PARAM).toBe('utm_source');
  });

  it('should have valid TCGPlayer domains', () => {
    expect(TCGPLAYER_DOMAINS).toContain('tcgplayer.com');
    expect(TCGPLAYER_DOMAINS).toContain('www.tcgplayer.com');
    expect(TCGPLAYER_DOMAINS.length).toBeGreaterThanOrEqual(2);
  });

  it('should have valid Cardmarket domains', () => {
    expect(CARDMARKET_DOMAINS).toContain('cardmarket.com');
    expect(CARDMARKET_DOMAINS.length).toBeGreaterThanOrEqual(1);
  });

  it('should have valid eBay domains', () => {
    expect(EBAY_DOMAINS).toContain('ebay.com');
    expect(EBAY_DOMAINS.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('isTCGPlayerUrl', () => {
  it('should return true for valid TCGPlayer URLs', () => {
    expect(isTCGPlayerUrl('https://tcgplayer.com/product/12345')).toBe(true);
    expect(isTCGPlayerUrl('https://www.tcgplayer.com/product/12345')).toBe(true);
    expect(isTCGPlayerUrl('https://shop.tcgplayer.com/pokemon/card')).toBe(true);
    expect(isTCGPlayerUrl('http://tcgplayer.com/product')).toBe(true);
  });

  it('should return false for non-TCGPlayer URLs', () => {
    expect(isTCGPlayerUrl('https://cardmarket.com/product/12345')).toBe(false);
    expect(isTCGPlayerUrl('https://ebay.com/itm/12345')).toBe(false);
    expect(isTCGPlayerUrl('https://amazon.com/dp/12345')).toBe(false);
  });

  it('should return false for invalid inputs', () => {
    expect(isTCGPlayerUrl('')).toBe(false);
    expect(isTCGPlayerUrl(null)).toBe(false);
    expect(isTCGPlayerUrl(undefined)).toBe(false);
    expect(isTCGPlayerUrl('not-a-url')).toBe(false);
  });
});

describe('isCardmarketUrl', () => {
  it('should return true for valid Cardmarket URLs', () => {
    expect(isCardmarketUrl('https://cardmarket.com/en/Pokemon/Products')).toBe(true);
    expect(isCardmarketUrl('https://www.cardmarket.com/de/YuGiOh')).toBe(true);
  });

  it('should return false for non-Cardmarket URLs', () => {
    expect(isCardmarketUrl('https://tcgplayer.com/product')).toBe(false);
    expect(isCardmarketUrl('https://ebay.com/itm/12345')).toBe(false);
  });

  it('should return false for invalid inputs', () => {
    expect(isCardmarketUrl('')).toBe(false);
    expect(isCardmarketUrl(null)).toBe(false);
    expect(isCardmarketUrl(undefined)).toBe(false);
  });
});

describe('isEbayUrl', () => {
  it('should return true for valid eBay URLs', () => {
    expect(isEbayUrl('https://ebay.com/itm/12345')).toBe(true);
    expect(isEbayUrl('https://www.ebay.com/p/12345')).toBe(true);
  });

  it('should return false for non-eBay URLs', () => {
    expect(isEbayUrl('https://tcgplayer.com/product')).toBe(false);
    expect(isEbayUrl('https://cardmarket.com/product')).toBe(false);
  });

  it('should return false for invalid inputs', () => {
    expect(isEbayUrl('')).toBe(false);
    expect(isEbayUrl(null)).toBe(false);
    expect(isEbayUrl(undefined)).toBe(false);
  });
});

describe('detectPlatform', () => {
  it('should detect TCGPlayer platform', () => {
    expect(detectPlatform('https://tcgplayer.com/product/12345')).toBe('tcgplayer');
    expect(detectPlatform('https://www.tcgplayer.com/product')).toBe('tcgplayer');
  });

  it('should detect Cardmarket platform', () => {
    expect(detectPlatform('https://cardmarket.com/en/Pokemon')).toBe('cardmarket');
  });

  it('should detect eBay platform', () => {
    expect(detectPlatform('https://ebay.com/itm/12345')).toBe('ebay');
  });

  it('should return null for unknown platforms', () => {
    expect(detectPlatform('https://amazon.com/dp/12345')).toBeNull();
    expect(detectPlatform('https://google.com')).toBeNull();
    expect(detectPlatform('')).toBeNull();
    expect(detectPlatform(null)).toBeNull();
  });
});

describe('hasAffiliateTracking', () => {
  it('should return true for URLs with affiliate parameters', () => {
    expect(hasAffiliateTracking('https://tcgplayer.com/product?partner=carddex')).toBe(true);
    expect(hasAffiliateTracking('https://tcgplayer.com/product?affiliate=abc')).toBe(true);
    expect(hasAffiliateTracking('https://tcgplayer.com/product?aff_id=123')).toBe(true);
    expect(hasAffiliateTracking('https://tcgplayer.com/product?ref=xyz')).toBe(true);
  });

  it('should return false for URLs without affiliate parameters', () => {
    expect(hasAffiliateTracking('https://tcgplayer.com/product/12345')).toBe(false);
    expect(hasAffiliateTracking('https://tcgplayer.com/product?utm_source=test')).toBe(false);
  });

  it('should return false for invalid inputs', () => {
    expect(hasAffiliateTracking('')).toBe(false);
    expect(hasAffiliateTracking(null)).toBe(false);
    expect(hasAffiliateTracking('not-a-url')).toBe(false);
  });
});

describe('isValidAffiliateId', () => {
  it('should return true for valid affiliate IDs', () => {
    expect(isValidAffiliateId('carddex')).toBe(true);
    expect(isValidAffiliateId('partner_123')).toBe(true);
    expect(isValidAffiliateId('my-affiliate-id')).toBe(true);
    expect(isValidAffiliateId('ABC123')).toBe(true);
  });

  it('should return false for invalid affiliate IDs', () => {
    expect(isValidAffiliateId('')).toBe(false);
    expect(isValidAffiliateId('ab')).toBe(false); // Too short
    expect(isValidAffiliateId('a'.repeat(51))).toBe(false); // Too long
    expect(isValidAffiliateId('has spaces')).toBe(false);
    expect(isValidAffiliateId('has@symbol')).toBe(false);
    expect(isValidAffiliateId(null)).toBe(false);
    expect(isValidAffiliateId(undefined)).toBe(false);
  });
});

// ============================================================================
// LINK GENERATION TESTS
// ============================================================================

describe('generateTCGPlayerAffiliateLink', () => {
  it('should generate an affiliate link with default config', () => {
    const url = 'https://tcgplayer.com/product/12345';
    const result = generateTCGPlayerAffiliateLink(url);

    expect(result.originalUrl).toBe(url);
    expect(result.hasAffiliateTracking).toBe(true);
    expect(result.platform).toBe('tcgplayer');
    expect(result.affiliateUrl).toContain('partner=carddex');
    expect(result.affiliateUrl).toContain('utm_source=carddex_wishlist');
  });

  it('should use custom affiliate ID', () => {
    const url = 'https://tcgplayer.com/product/12345';
    const result = generateTCGPlayerAffiliateLink(url, { affiliateId: 'customid' });

    expect(result.affiliateId).toBe('customid');
    expect(result.affiliateUrl).toContain('partner=customid');
  });

  it('should add subId when provided', () => {
    const url = 'https://tcgplayer.com/product/12345';
    const result = generateTCGPlayerAffiliateLink(url, { subId: 'my_subid' });

    expect(result.subId).toBe('my_subid');
    expect(result.affiliateUrl).toContain('utm_campaign=my_subid');
  });

  it('should add campaignId when provided', () => {
    const url = 'https://tcgplayer.com/product/12345';
    const result = generateTCGPlayerAffiliateLink(url, { campaignId: 'wishlist' });

    expect(result.affiliateUrl).toContain('utm_medium=wishlist');
  });

  it('should preserve existing query parameters', () => {
    const url = 'https://tcgplayer.com/product/12345?language=en';
    const result = generateTCGPlayerAffiliateLink(url);

    expect(result.affiliateUrl).toContain('language=en');
    expect(result.affiliateUrl).toContain('partner=carddex');
  });

  it('should return original URL for non-TCGPlayer URLs', () => {
    const url = 'https://amazon.com/dp/12345';
    const result = generateTCGPlayerAffiliateLink(url);

    expect(result.originalUrl).toBe(url);
    expect(result.affiliateUrl).toBe(url);
    expect(result.hasAffiliateTracking).toBe(false);
  });
});

describe('generateCardmarketAffiliateLink', () => {
  it('should return the original URL (placeholder implementation)', () => {
    const url = 'https://cardmarket.com/en/Pokemon/Products';
    const result = generateCardmarketAffiliateLink(url);

    expect(result.originalUrl).toBe(url);
    expect(result.affiliateUrl).toBe(url);
    expect(result.platform).toBe('cardmarket');
    expect(result.hasAffiliateTracking).toBe(false);
  });
});

describe('generateEbayAffiliateLink', () => {
  it('should return the original URL (placeholder implementation)', () => {
    const url = 'https://ebay.com/itm/12345';
    const result = generateEbayAffiliateLink(url);

    expect(result.originalUrl).toBe(url);
    expect(result.affiliateUrl).toBe(url);
    expect(result.platform).toBe('ebay');
    expect(result.hasAffiliateTracking).toBe(false);
  });
});

describe('generateAffiliateLink', () => {
  it('should auto-detect TCGPlayer and generate affiliate link', () => {
    const url = 'https://tcgplayer.com/product/12345';
    const result = generateAffiliateLink(url);

    expect(result).not.toBeNull();
    expect(result?.platform).toBe('tcgplayer');
    expect(result?.hasAffiliateTracking).toBe(true);
  });

  it('should auto-detect Cardmarket', () => {
    const url = 'https://cardmarket.com/en/Pokemon';
    const result = generateAffiliateLink(url);

    expect(result).not.toBeNull();
    expect(result?.platform).toBe('cardmarket');
  });

  it('should auto-detect eBay', () => {
    const url = 'https://ebay.com/itm/12345';
    const result = generateAffiliateLink(url);

    expect(result).not.toBeNull();
    expect(result?.platform).toBe('ebay');
  });

  it('should use explicit platform config', () => {
    const url = 'https://tcgplayer.com/product/12345';
    const result = generateAffiliateLink(url, { platform: 'tcgplayer' });

    expect(result?.platform).toBe('tcgplayer');
  });

  it('should return null for unknown platforms', () => {
    const url = 'https://amazon.com/dp/12345';
    const result = generateAffiliateLink(url);

    expect(result).toBeNull();
  });

  it('should return null for invalid inputs', () => {
    expect(generateAffiliateLink('')).toBeNull();
    expect(generateAffiliateLink(null)).toBeNull();
    expect(generateAffiliateLink(undefined)).toBeNull();
  });
});

// ============================================================================
// WISHLIST INTEGRATION TESTS
// ============================================================================

describe('generateWishlistSubId', () => {
  it('should generate a sub ID from share token and card ID', () => {
    const subId = generateWishlistSubId('abc123def456', 'sv1-123');

    expect(subId).toContain('wishlist_');
    expect(subId).toContain('abc123de');
    expect(subId).toContain('sv1-123');
  });

  it('should sanitize card IDs with special characters', () => {
    const subId = generateWishlistSubId('token123', 'sv1/123@test');

    expect(subId).not.toContain('/');
    expect(subId).not.toContain('@');
  });

  it('should truncate long card IDs', () => {
    const longCardId = 'a'.repeat(50);
    const subId = generateWishlistSubId('token123', longCardId);

    expect(subId.length).toBeLessThan(50);
  });
});

describe('generateWishlistCampaignId', () => {
  it('should return wishlist_share', () => {
    expect(generateWishlistCampaignId()).toBe('wishlist_share');
  });
});

describe('enrichCardWithAffiliateLink', () => {
  it('should enrich a card with TCGPlayer URL', () => {
    const card = {
      cardId: 'sv1-1',
      name: 'Pikachu',
      tcgPlayerUrl: 'https://tcgplayer.com/product/12345',
    };

    const result = enrichCardWithAffiliateLink(card, 'sharetoken123');

    expect(result.cardId).toBe('sv1-1');
    expect(result.name).toBe('Pikachu');
    expect(result.affiliateLink).toBeDefined();
    expect(result.affiliateLink?.hasAffiliateTracking).toBe(true);
    expect(result.affiliateLink?.affiliateUrl).toContain('utm_campaign=wishlist_');
  });

  it('should return card without affiliate link if no tcgPlayerUrl', () => {
    const card = {
      cardId: 'sv1-1',
      name: 'Pikachu',
    };

    const result = enrichCardWithAffiliateLink(card);

    expect(result.cardId).toBe('sv1-1');
    expect(result.affiliateLink).toBeUndefined();
  });

  it('should work without share token', () => {
    const card = {
      cardId: 'sv1-1',
      tcgPlayerUrl: 'https://tcgplayer.com/product/12345',
    };

    const result = enrichCardWithAffiliateLink(card);

    expect(result.affiliateLink).toBeDefined();
    expect(result.affiliateLink?.hasAffiliateTracking).toBe(true);
  });

  it('should use custom affiliate config', () => {
    const card = {
      cardId: 'sv1-1',
      tcgPlayerUrl: 'https://tcgplayer.com/product/12345',
    };

    const result = enrichCardWithAffiliateLink(card, 'token', { affiliateId: 'custom' });

    expect(result.affiliateLink?.affiliateId).toBe('custom');
  });
});

describe('enrichCardsWithAffiliateLinks', () => {
  it('should enrich multiple cards', () => {
    const cards = [
      { cardId: 'sv1-1', tcgPlayerUrl: 'https://tcgplayer.com/p/1' },
      { cardId: 'sv1-2', tcgPlayerUrl: 'https://tcgplayer.com/p/2' },
      { cardId: 'sv1-3' }, // No URL
    ];

    const result = enrichCardsWithAffiliateLinks(cards, 'token123');

    expect(result).toHaveLength(3);
    expect(result[0].affiliateLink).toBeDefined();
    expect(result[1].affiliateLink).toBeDefined();
    expect(result[2].affiliateLink).toBeUndefined();
  });

  it('should handle empty array', () => {
    const result = enrichCardsWithAffiliateLinks([]);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe('calculateAffiliateLinkStats', () => {
  it('should calculate stats for cards with affiliate links', () => {
    const cards: WishlistCardWithAffiliateLink[] = [
      {
        cardId: 'sv1-1',
        tcgPlayerUrl: 'https://tcgplayer.com/p/1',
        affiliateLink: {
          originalUrl: 'https://tcgplayer.com/p/1',
          affiliateUrl: 'https://tcgplayer.com/p/1?partner=carddex',
          platform: 'tcgplayer',
          hasAffiliateTracking: true,
        },
      },
      {
        cardId: 'sv1-2',
        tcgPlayerUrl: 'https://tcgplayer.com/p/2',
        affiliateLink: {
          originalUrl: 'https://tcgplayer.com/p/2',
          affiliateUrl: 'https://tcgplayer.com/p/2?partner=carddex',
          platform: 'tcgplayer',
          hasAffiliateTracking: true,
        },
      },
      { cardId: 'sv1-3' }, // No URL
    ];

    const stats = calculateAffiliateLinkStats(cards);

    expect(stats.totalCards).toBe(3);
    expect(stats.cardsWithLinks).toBe(2);
    expect(stats.cardsWithAffiliateLinks).toBe(2);
    expect(stats.linksByPlatform.tcgplayer).toBe(2);
    expect(stats.linksByPlatform.cardmarket).toBe(0);
    expect(stats.linksByPlatform.ebay).toBe(0);
  });

  it('should handle empty array', () => {
    const stats = calculateAffiliateLinkStats([]);

    expect(stats.totalCards).toBe(0);
    expect(stats.cardsWithLinks).toBe(0);
    expect(stats.cardsWithAffiliateLinks).toBe(0);
  });

  it('should handle cards without affiliate tracking', () => {
    const cards: WishlistCardWithAffiliateLink[] = [
      {
        cardId: 'sv1-1',
        tcgPlayerUrl: 'https://cardmarket.com/p/1',
        affiliateLink: {
          originalUrl: 'https://cardmarket.com/p/1',
          affiliateUrl: 'https://cardmarket.com/p/1',
          platform: 'cardmarket',
          hasAffiliateTracking: false,
        },
      },
    ];

    const stats = calculateAffiliateLinkStats(cards);

    expect(stats.totalCards).toBe(1);
    expect(stats.cardsWithLinks).toBe(1);
    expect(stats.cardsWithAffiliateLinks).toBe(0);
  });
});

describe('getAffiliateLinkSummary', () => {
  it('should return summary for cards with affiliate links', () => {
    const stats = {
      totalCards: 10,
      cardsWithLinks: 8,
      cardsWithAffiliateLinks: 6,
      linksByPlatform: { tcgplayer: 6, cardmarket: 0, ebay: 0 } as Record<
        AffiliatePlatform,
        number
      >,
    };

    const summary = getAffiliateLinkSummary(stats);

    expect(summary).toContain('6');
    expect(summary).toContain('10');
    expect(summary).toContain('60%');
  });

  it('should return no links message when none available', () => {
    const stats = {
      totalCards: 5,
      cardsWithLinks: 0,
      cardsWithAffiliateLinks: 0,
      linksByPlatform: { tcgplayer: 0, cardmarket: 0, ebay: 0 } as Record<
        AffiliatePlatform,
        number
      >,
    };

    const summary = getAffiliateLinkSummary(stats);

    expect(summary).toContain('No affiliate links');
  });
});

// ============================================================================
// URL UTILITIES TESTS
// ============================================================================

describe('extractAffiliateId', () => {
  it('should extract affiliate ID from partner parameter', () => {
    expect(extractAffiliateId('https://tcgplayer.com/p/1?partner=carddex')).toBe('carddex');
  });

  it('should extract affiliate ID from affiliate parameter', () => {
    expect(extractAffiliateId('https://tcgplayer.com/p/1?affiliate=abc123')).toBe('abc123');
  });

  it('should extract affiliate ID from aff_id parameter', () => {
    expect(extractAffiliateId('https://tcgplayer.com/p/1?aff_id=xyz')).toBe('xyz');
  });

  it('should extract affiliate ID from ref parameter', () => {
    expect(extractAffiliateId('https://tcgplayer.com/p/1?ref=myref')).toBe('myref');
  });

  it('should return null if no affiliate ID', () => {
    expect(extractAffiliateId('https://tcgplayer.com/p/1')).toBeNull();
  });

  it('should return null for invalid input', () => {
    expect(extractAffiliateId('')).toBeNull();
    expect(extractAffiliateId(null)).toBeNull();
    expect(extractAffiliateId('not-a-url')).toBeNull();
  });
});

describe('stripAffiliateTracking', () => {
  it('should remove partner parameter', () => {
    const url = 'https://tcgplayer.com/p/1?partner=carddex&language=en';
    const result = stripAffiliateTracking(url);

    expect(result).not.toContain('partner=');
    expect(result).toContain('language=en');
  });

  it('should remove multiple affiliate parameters', () => {
    const url = 'https://tcgplayer.com/p/1?partner=x&utm_campaign=y&utm_source=z&utm_medium=w';
    const result = stripAffiliateTracking(url);

    expect(result).not.toContain('partner=');
    expect(result).not.toContain('utm_campaign=');
    expect(result).not.toContain('utm_source=');
    expect(result).not.toContain('utm_medium=');
  });

  it('should return null for invalid input', () => {
    expect(stripAffiliateTracking('')).toBeNull();
    expect(stripAffiliateTracking(null)).toBeNull();
  });

  it('should return URL unchanged if no affiliate params', () => {
    const url = 'https://tcgplayer.com/p/1?language=en';
    const result = stripAffiliateTracking(url);

    expect(result).toContain('language=en');
  });
});

describe('replaceAffiliateTracking', () => {
  it('should replace existing affiliate tracking', () => {
    const url = 'https://tcgplayer.com/p/1?partner=oldid';
    const result = replaceAffiliateTracking(url, { affiliateId: 'newid' });

    expect(result).toContain('partner=newid');
    expect(result).not.toContain('partner=oldid');
  });

  it('should add affiliate tracking to URL without it', () => {
    const url = 'https://tcgplayer.com/p/1';
    const result = replaceAffiliateTracking(url, { affiliateId: 'carddex' });

    expect(result).toContain('partner=carddex');
  });

  it('should return null for invalid input', () => {
    expect(replaceAffiliateTracking('', { affiliateId: 'test' })).toBeNull();
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('getPlatformDisplayName', () => {
  it('should return correct display names', () => {
    expect(getPlatformDisplayName('tcgplayer')).toBe('TCGPlayer');
    expect(getPlatformDisplayName('cardmarket')).toBe('Cardmarket');
    expect(getPlatformDisplayName('ebay')).toBe('eBay');
  });
});

describe('getBuyButtonLabel', () => {
  it('should return correct button labels', () => {
    expect(getBuyButtonLabel('tcgplayer')).toBe('Buy on TCGPlayer');
    expect(getBuyButtonLabel('cardmarket')).toBe('Buy on Cardmarket');
    expect(getBuyButtonLabel('ebay')).toBe('Buy on eBay');
  });
});

describe('shouldShowAffiliateLinks', () => {
  it('should return true for parent profiles', () => {
    expect(shouldShowAffiliateLinks('parent')).toBe(true);
  });

  it('should return false for child profiles', () => {
    expect(shouldShowAffiliateLinks('child')).toBe(false);
  });

  it('should return false for undefined profile type', () => {
    expect(shouldShowAffiliateLinks(undefined)).toBe(false);
  });
});

describe('getAffiliateDisclosure', () => {
  it('should return disclosure text', () => {
    const disclosure = getAffiliateDisclosure();

    expect(disclosure).toContain('affiliate');
    expect(disclosure).toContain('commission');
    expect(disclosure.length).toBeGreaterThan(20);
  });
});

describe('getShortAffiliateDisclosure', () => {
  it('should return short disclosure text', () => {
    const disclosure = getShortAffiliateDisclosure();

    expect(disclosure).toBe('Affiliate links');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Affiliate Link Integration', () => {
  describe('Complete wishlist enrichment flow', () => {
    it('should enrich a wishlist with affiliate links and calculate stats', () => {
      const wishlistCards = [
        { cardId: 'sv1-1', name: 'Pikachu', tcgPlayerUrl: 'https://tcgplayer.com/p/1' },
        { cardId: 'sv1-2', name: 'Charizard', tcgPlayerUrl: 'https://tcgplayer.com/p/2' },
        { cardId: 'sv1-3', name: 'Bulbasaur', tcgPlayerUrl: 'https://tcgplayer.com/p/3' },
        { cardId: 'sv1-4', name: 'Squirtle' }, // No URL
      ];

      const enriched = enrichCardsWithAffiliateLinks(wishlistCards, 'sharetoken123');
      const stats = calculateAffiliateLinkStats(enriched);

      expect(enriched).toHaveLength(4);
      expect(stats.totalCards).toBe(4);
      expect(stats.cardsWithLinks).toBe(3);
      expect(stats.cardsWithAffiliateLinks).toBe(3);
      expect(stats.linksByPlatform.tcgplayer).toBe(3);

      // Verify affiliate URLs have correct parameters
      expect(enriched[0].affiliateLink?.affiliateUrl).toContain('partner=carddex');
      expect(enriched[0].affiliateLink?.affiliateUrl).toContain('utm_source=carddex_wishlist');
      expect(enriched[0].affiliateLink?.affiliateUrl).toContain('utm_campaign=wishlist_');
      expect(enriched[0].affiliateLink?.affiliateUrl).toContain('utm_medium=wishlist_share');
    });
  });

  describe('URL manipulation flow', () => {
    it('should strip and replace affiliate tracking', () => {
      const originalUrl = 'https://tcgplayer.com/p/1?partner=oldpartner&utm_source=old';

      // Strip existing tracking
      const strippedUrl = stripAffiliateTracking(originalUrl);
      expect(strippedUrl).not.toContain('partner=');
      expect(strippedUrl).not.toContain('utm_source=');

      // Add new tracking
      const newUrl = replaceAffiliateTracking(originalUrl, {
        affiliateId: 'newpartner',
        subId: 'campaign123',
      });

      expect(newUrl).toContain('partner=newpartner');
      expect(newUrl).toContain('utm_campaign=campaign123');
      expect(newUrl).not.toContain('partner=oldpartner');
    });
  });

  describe('Profile-based display logic', () => {
    it('should show affiliate links only for parent profiles', () => {
      const card = {
        cardId: 'sv1-1',
        tcgPlayerUrl: 'https://tcgplayer.com/p/1',
      };

      const enrichedCard = enrichCardWithAffiliateLink(card);

      // Parent should see links
      if (shouldShowAffiliateLinks('parent') && enrichedCard.affiliateLink) {
        expect(enrichedCard.affiliateLink.affiliateUrl).toBeTruthy();
      }

      // Child should not see links
      expect(shouldShowAffiliateLinks('child')).toBe(false);
    });
  });
});
