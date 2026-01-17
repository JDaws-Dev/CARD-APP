import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Maximum number of priority (starred) items per profile
export const MAX_PRIORITY_ITEMS = 5;

// ============================================================================
// QUERIES
// ============================================================================

export const getWishlist = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();
  },
});

export const isOnWishlist = query({
  args: { profileId: v.id('profiles'), cardId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .first();

    return card
      ? { onWishlist: true, isPriority: card.isPriority }
      : { onWishlist: false, isPriority: false };
  },
});

export const getPriorityCount = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const priorityItems = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile_and_priority', (q) =>
        q.eq('profileId', args.profileId).eq('isPriority', true)
      )
      .collect();

    return {
      count: priorityItems.length,
      max: MAX_PRIORITY_ITEMS,
      remaining: MAX_PRIORITY_ITEMS - priorityItems.length,
    };
  },
});

export const getWishlistByToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    // Find the share link
    const share = await ctx.db
      .query('wishlistShares')
      .withIndex('by_token', (q) => q.eq('shareToken', args.shareToken))
      .first();

    if (!share) {
      return null;
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return null;
    }

    // Get the profile info
    const profile = await ctx.db.get(share.profileId);
    if (!profile) {
      return null;
    }

    // Get the wishlist
    const wishlist = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', share.profileId))
      .collect();

    return {
      profileName: profile.displayName,
      wishlist,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const addToWishlist = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    isPriority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if already on wishlist
    const existing = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .first();

    if (existing) {
      return { cardId: existing._id, alreadyExists: true };
    }

    // If adding with priority, check the limit
    const wantsPriority = args.isPriority ?? false;
    if (wantsPriority) {
      const priorityItems = await ctx.db
        .query('wishlistCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
        .filter((q) => q.eq(q.field('isPriority'), true))
        .collect();

      if (priorityItems.length >= MAX_PRIORITY_ITEMS) {
        // Add to wishlist but without priority
        const cardId = await ctx.db.insert('wishlistCards', {
          profileId: args.profileId,
          cardId: args.cardId,
          isPriority: false,
        });
        return {
          cardId,
          alreadyExists: false,
          priorityDenied: true,
          reason: `Maximum of ${MAX_PRIORITY_ITEMS} priority items allowed`,
        };
      }
    }

    const cardId = await ctx.db.insert('wishlistCards', {
      profileId: args.profileId,
      cardId: args.cardId,
      isPriority: wantsPriority,
    });

    return { cardId, alreadyExists: false };
  },
});

export const removeFromWishlist = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const togglePriority = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .first();

    if (!existing) {
      return { success: false, error: 'Card not on wishlist' };
    }

    // If already priority, allow toggling off
    if (existing.isPriority) {
      await ctx.db.patch(existing._id, { isPriority: false });
      return { success: true, isPriority: false };
    }

    // If toggling ON, check current priority count
    const priorityItems = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('isPriority'), true))
      .collect();

    if (priorityItems.length >= MAX_PRIORITY_ITEMS) {
      return {
        success: false,
        error: `Maximum of ${MAX_PRIORITY_ITEMS} priority items allowed`,
        currentPriorityCount: priorityItems.length,
      };
    }

    await ctx.db.patch(existing._id, { isPriority: true });
    return { success: true, isPriority: true };
  },
});

export const createShareLink = mutation({
  args: {
    profileId: v.id('profiles'),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate a random token
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = args.expiresInDays
      ? Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    await ctx.db.insert('wishlistShares', {
      profileId: args.profileId,
      shareToken: token,
      expiresAt,
    });

    return token;
  },
});

// ============================================================================
// AFFILIATE LINK CONSTANTS (duplicated from src/lib for Convex runtime)
// ============================================================================

const DEFAULT_TCGPLAYER_AFFILIATE_ID = 'carddex';
const TCGPLAYER_AFFILIATE_PARAM = 'partner';
const TCGPLAYER_SOURCE_PARAM = 'utm_source';
const TCGPLAYER_CAMPAIGN_PARAM = 'utm_campaign';
const TCGPLAYER_MEDIUM_PARAM = 'utm_medium';

const TCGPLAYER_DOMAINS = ['tcgplayer.com', 'www.tcgplayer.com', 'shop.tcgplayer.com'];

/**
 * Check if a URL is a valid TCGPlayer URL
 */
function isTCGPlayerUrl(url: string | undefined | null): boolean {
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
 * Generate a TCGPlayer affiliate link
 */
function generateTCGPlayerAffiliateLink(
  url: string,
  shareToken: string,
  cardId: string,
  affiliateId?: string
): { originalUrl: string; affiliateUrl: string; hasAffiliateTracking: boolean } {
  if (!isTCGPlayerUrl(url)) {
    return {
      originalUrl: url,
      affiliateUrl: url,
      hasAffiliateTracking: false,
    };
  }

  try {
    const parsedUrl = new URL(url);
    const effectiveAffiliateId = affiliateId || DEFAULT_TCGPLAYER_AFFILIATE_ID;

    // Add affiliate tracking parameters
    parsedUrl.searchParams.set(TCGPLAYER_AFFILIATE_PARAM, effectiveAffiliateId);
    parsedUrl.searchParams.set(TCGPLAYER_SOURCE_PARAM, 'carddex_wishlist');
    parsedUrl.searchParams.set(TCGPLAYER_MEDIUM_PARAM, 'wishlist_share');

    // Generate sub-tracking ID from share token and card ID
    const cleanToken = shareToken.slice(0, 8);
    const cleanCardId = cardId.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 20);
    parsedUrl.searchParams.set(TCGPLAYER_CAMPAIGN_PARAM, `wishlist_${cleanToken}_${cleanCardId}`);

    return {
      originalUrl: url,
      affiliateUrl: parsedUrl.toString(),
      hasAffiliateTracking: true,
    };
  } catch {
    return {
      originalUrl: url,
      affiliateUrl: url,
      hasAffiliateTracking: false,
    };
  }
}

// ============================================================================
// AFFILIATE LINK QUERIES
// ============================================================================

/**
 * Get wishlist by share token with enriched card data and affiliate links
 * This is the enhanced version of getWishlistByToken that includes
 * card names, images, prices, and TCGPlayer affiliate links
 */
export const getWishlistByTokenWithAffiliateLinks = query({
  args: {
    shareToken: v.string(),
    affiliateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the share link
    const share = await ctx.db
      .query('wishlistShares')
      .withIndex('by_token', (q) => q.eq('shareToken', args.shareToken))
      .first();

    if (!share) {
      return null;
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return null;
    }

    // Get the profile info
    const profile = await ctx.db.get(share.profileId);
    if (!profile) {
      return null;
    }

    // Get the wishlist
    const wishlist = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', share.profileId))
      .collect();

    // Enrich cards with cached data and affiliate links
    const enrichedCards = await Promise.all(
      wishlist.map(async (item) => {
        // Look up card data from cache
        const cachedCard = await ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', item.cardId))
          .first();

        // Generate affiliate link if tcgPlayerUrl exists
        let affiliateLink = null;
        if (cachedCard?.tcgPlayerUrl) {
          affiliateLink = generateTCGPlayerAffiliateLink(
            cachedCard.tcgPlayerUrl,
            args.shareToken,
            item.cardId,
            args.affiliateId
          );
        }

        return {
          cardId: item.cardId,
          isPriority: item.isPriority,
          // Card data from cache
          name: cachedCard?.name,
          setId: cachedCard?.setId,
          rarity: cachedCard?.rarity,
          imageSmall: cachedCard?.imageSmall,
          imageLarge: cachedCard?.imageLarge,
          priceMarket: cachedCard?.priceMarket,
          // Affiliate link info
          tcgPlayerUrl: cachedCard?.tcgPlayerUrl,
          affiliateUrl: affiliateLink?.affiliateUrl,
          hasAffiliateTracking: affiliateLink?.hasAffiliateTracking ?? false,
        };
      })
    );

    // Calculate affiliate link stats
    const cardsWithLinks = enrichedCards.filter((c) => c.tcgPlayerUrl).length;
    const cardsWithAffiliateLinks = enrichedCards.filter((c) => c.hasAffiliateTracking).length;

    return {
      profileName: profile.displayName,
      shareToken: args.shareToken,
      createdAt: share._creationTime,
      expiresAt: share.expiresAt,
      wishlist: enrichedCards,
      stats: {
        totalCards: enrichedCards.length,
        cardsWithLinks,
        cardsWithAffiliateLinks,
        priorityCards: enrichedCards.filter((c) => c.isPriority).length,
      },
      // FTC-required disclosure flag
      hasAffiliateLinks: cardsWithAffiliateLinks > 0,
    };
  },
});

/**
 * Get affiliate link stats for a wishlist
 */
export const getWishlistAffiliateStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get the wishlist
    const wishlist = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count cards with TCGPlayer URLs
    let cardsWithTCGPlayerUrl = 0;
    let totalMarketValue = 0;

    for (const item of wishlist) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', item.cardId))
        .first();

      if (cachedCard?.tcgPlayerUrl) {
        cardsWithTCGPlayerUrl++;
      }
      if (cachedCard?.priceMarket) {
        totalMarketValue += cachedCard.priceMarket;
      }
    }

    return {
      totalCards: wishlist.length,
      cardsWithTCGPlayerUrl,
      affiliateLinkCoverage:
        wishlist.length > 0 ? Math.round((cardsWithTCGPlayerUrl / wishlist.length) * 100) : 0,
      totalMarketValue: Math.round(totalMarketValue * 100) / 100,
      priorityCards: wishlist.filter((c) => c.isPriority).length,
    };
  },
});

/**
 * Generate affiliate link for a single card
 * Useful for showing "Buy on TCGPlayer" buttons in UI
 */
export const getCardAffiliateLink = query({
  args: {
    cardId: v.string(),
    shareToken: v.optional(v.string()),
    affiliateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cachedCard = await ctx.db
      .query('cachedCards')
      .withIndex('by_card_id', (q) => q.eq('cardId', args.cardId))
      .first();

    if (!cachedCard?.tcgPlayerUrl) {
      return {
        cardId: args.cardId,
        hasLink: false,
        affiliateUrl: null,
        originalUrl: null,
      };
    }

    const affiliateLink = generateTCGPlayerAffiliateLink(
      cachedCard.tcgPlayerUrl,
      args.shareToken || 'direct',
      args.cardId,
      args.affiliateId
    );

    return {
      cardId: args.cardId,
      hasLink: true,
      affiliateUrl: affiliateLink.affiliateUrl,
      originalUrl: affiliateLink.originalUrl,
      hasAffiliateTracking: affiliateLink.hasAffiliateTracking,
      priceMarket: cachedCard.priceMarket,
    };
  },
});

/**
 * Get batch affiliate links for multiple cards
 */
export const getCardsAffiliateLinks = query({
  args: {
    cardIds: v.array(v.string()),
    shareToken: v.optional(v.string()),
    affiliateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.cardIds.map(async (cardId) => {
        const cachedCard = await ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first();

        if (!cachedCard?.tcgPlayerUrl) {
          return {
            cardId,
            hasLink: false,
            affiliateUrl: null,
            originalUrl: null,
            hasAffiliateTracking: false,
          };
        }

        const affiliateLink = generateTCGPlayerAffiliateLink(
          cachedCard.tcgPlayerUrl,
          args.shareToken || 'direct',
          cardId,
          args.affiliateId
        );

        return {
          cardId,
          hasLink: true,
          affiliateUrl: affiliateLink.affiliateUrl,
          originalUrl: affiliateLink.originalUrl,
          hasAffiliateTracking: affiliateLink.hasAffiliateTracking,
        };
      })
    );

    return {
      links: results,
      totalCards: results.length,
      cardsWithLinks: results.filter((r) => r.hasLink).length,
      cardsWithAffiliateTracking: results.filter((r) => r.hasAffiliateTracking).length,
    };
  },
});
