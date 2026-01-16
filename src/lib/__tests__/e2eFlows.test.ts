/**
 * End-to-End Tests for Critical User Flows
 *
 * These tests simulate complete user flows for:
 * 1. Add card to collection flow
 * 2. Create/manage wishlist flow
 * 3. Share wishlist link flow
 *
 * The tests verify the business logic and data transformations
 * that occur during these critical user journeys.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Collection utilities
import {
  CardVariant,
  CollectionCard,
  VALID_VARIANTS,
  isValidVariant,
  isValidCardId,
  isValidQuantity,
  extractSetId,
  getCollectionStats,
  checkCardOwnership,
  filterBySet,
  groupCardsByCardId,
  getUniqueCardIds,
  addCardToCollection,
  removeCardFromCollection,
  updateCardQuantity,
  incrementCardQuantity,
  decrementCardQuantity,
  findSharedCards,
  findUniqueCards,
  mergeCollections,
} from '../collections';

// Wishlist utilities
import {
  MAX_PRIORITY_ITEMS,
  canAddPriority,
  validatePriorityToggle,
  getPriorityStatus,
} from '../wishlist';

// Affiliate link utilities
import {
  isTCGPlayerUrl,
  detectPlatform,
  generateTCGPlayerAffiliateLink,
  generateAffiliateLink,
  generateWishlistSubId,
  enrichCardWithAffiliateLink,
  enrichCardsWithAffiliateLinks,
  calculateAffiliateLinkStats,
  getAffiliateLinkSummary,
  hasAffiliateTracking,
  isValidAffiliateId,
  shouldShowAffiliateLinks,
  getAffiliateDisclosure,
} from '../affiliateLinks';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createCard(cardId: string, quantity = 1, variant: CardVariant = 'normal'): CollectionCard {
  return { cardId, quantity, variant };
}

function createWishlistCard(cardId: string, isPriority = false, tcgPlayerUrl?: string) {
  return {
    cardId,
    isPriority,
    name: `Card ${cardId}`,
    tcgPlayerUrl,
    priceMarket: Math.random() * 100,
  };
}

function generateShareToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================================================
// E2E FLOW 1: ADD CARD TO COLLECTION
// ============================================================================

describe('E2E Flow: Add Card to Collection', () => {
  describe('Step 1: Validate card input', () => {
    it('should validate card ID format', () => {
      // Valid card IDs
      expect(isValidCardId('sv1-1')).toBe(true);
      expect(isValidCardId('swsh12-123')).toBe(true);
      expect(isValidCardId('base1-45')).toBe(true);
      expect(isValidCardId('xy-promo-1')).toBe(true);

      // Invalid card IDs
      expect(isValidCardId('')).toBe(false);
      expect(isValidCardId('sv1')).toBe(false);
      expect(isValidCardId('-1')).toBe(false);
    });

    it('should validate variant type', () => {
      for (const variant of VALID_VARIANTS) {
        expect(isValidVariant(variant)).toBe(true);
      }
      expect(isValidVariant('invalid')).toBe(false);
      expect(isValidVariant('HOLOFOIL')).toBe(false);
    });

    it('should validate quantity', () => {
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(10)).toBe(true);
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
    });
  });

  describe('Step 2: Check current ownership', () => {
    it('should detect when card is not yet owned', () => {
      const collection: CollectionCard[] = [];
      const ownership = checkCardOwnership(collection, 'sv1-1');

      expect(ownership.owned).toBe(false);
      expect(ownership.quantity).toBe(0);
      expect(ownership.variants).toEqual({});
    });

    it('should detect existing card ownership', () => {
      const collection = [createCard('sv1-1', 2, 'normal'), createCard('sv1-1', 1, 'holofoil')];
      const ownership = checkCardOwnership(collection, 'sv1-1');

      expect(ownership.owned).toBe(true);
      expect(ownership.quantity).toBe(3);
      expect(ownership.variants).toEqual({ normal: 2, holofoil: 1 });
    });
  });

  describe('Step 3: Add card to collection', () => {
    it('should add new card to empty collection', () => {
      const collection: CollectionCard[] = [];
      const result = addCardToCollection(collection, 'sv1-1', 1, 'normal');

      expect(result.collection).toHaveLength(1);
      expect(result.isNew).toBe(true);
      expect(result.collection[0]).toEqual({ cardId: 'sv1-1', quantity: 1, variant: 'normal' });
    });

    it('should add new variant of existing card', () => {
      const collection = [createCard('sv1-1', 2, 'normal')];
      const result = addCardToCollection(collection, 'sv1-1', 1, 'holofoil');

      expect(result.collection).toHaveLength(2);
      expect(result.isNew).toBe(true);
      expect(result.collection).toContainEqual({ cardId: 'sv1-1', quantity: 2, variant: 'normal' });
      expect(result.collection).toContainEqual({
        cardId: 'sv1-1',
        quantity: 1,
        variant: 'holofoil',
      });
    });

    it('should increment quantity for existing card+variant', () => {
      const collection = [createCard('sv1-1', 2, 'normal')];
      const result = addCardToCollection(collection, 'sv1-1', 3, 'normal');

      expect(result.collection).toHaveLength(1);
      expect(result.isNew).toBe(false);
      expect(result.collection[0].quantity).toBe(5);
    });
  });

  describe('Step 4: Update collection stats', () => {
    it('should calculate stats after adding cards', () => {
      const collection = [
        createCard('sv1-1', 3, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-25', 2, 'normal'),
        createCard('sv2-10', 1, 'normal'),
      ];

      const stats = getCollectionStats(collection);

      expect(stats.uniqueCards).toBe(4);
      expect(stats.totalCards).toBe(7);
      expect(stats.setsStarted).toBe(2); // sv1 and sv2
    });
  });

  describe('Complete Flow: New user adds first cards', () => {
    it('should correctly track a new user adding multiple cards', () => {
      let collection: CollectionCard[] = [];

      // User adds first card
      expect(isValidCardId('sv1-1')).toBe(true);
      expect(isValidVariant('normal')).toBe(true);
      expect(isValidQuantity(1)).toBe(true);

      let result = addCardToCollection(collection, 'sv1-1', 1, 'normal');
      collection = result.collection;

      let stats = getCollectionStats(collection);
      expect(stats.uniqueCards).toBe(1);
      expect(stats.totalCards).toBe(1);
      expect(stats.setsStarted).toBe(1);

      // User adds a holofoil variant of the same card
      result = addCardToCollection(collection, 'sv1-1', 1, 'holofoil');
      collection = result.collection;

      stats = getCollectionStats(collection);
      expect(stats.uniqueCards).toBe(2);
      expect(stats.totalCards).toBe(2);
      expect(stats.setsStarted).toBe(1);

      // User adds a card from a different set
      result = addCardToCollection(collection, 'sv2-50', 2, 'reverseHolofoil');
      collection = result.collection;

      stats = getCollectionStats(collection);
      expect(stats.uniqueCards).toBe(3);
      expect(stats.totalCards).toBe(4);
      expect(stats.setsStarted).toBe(2);

      // Verify ownership
      const sv1Ownership = checkCardOwnership(collection, 'sv1-1');
      expect(sv1Ownership.owned).toBe(true);
      expect(sv1Ownership.quantity).toBe(2);
      expect(sv1Ownership.variants).toEqual({ normal: 1, holofoil: 1 });

      const sv2Ownership = checkCardOwnership(collection, 'sv2-50');
      expect(sv2Ownership.owned).toBe(true);
      expect(sv2Ownership.quantity).toBe(2);
      expect(sv2Ownership.variants).toEqual({ reverseHolofoil: 2 });
    });
  });

  describe('Complete Flow: Update existing collection', () => {
    it('should correctly update quantities and remove cards', () => {
      let collection = [
        createCard('sv1-1', 3, 'normal'),
        createCard('sv1-1', 2, 'holofoil'),
        createCard('sv1-25', 1, 'normal'),
      ];

      // Update quantity of a card
      let result = updateCardQuantity(collection, 'sv1-1', 5, 'normal');
      collection = result.collection;
      expect(checkCardOwnership(collection, 'sv1-1').variants.normal).toBe(5);

      // Increment quantity
      const incResult = incrementCardQuantity(collection, 'sv1-25', 'normal');
      collection = incResult.collection;
      expect(checkCardOwnership(collection, 'sv1-25').quantity).toBe(2);

      // Decrement quantity
      const decResult = decrementCardQuantity(collection, 'sv1-25', 'normal');
      collection = decResult.collection;
      expect(checkCardOwnership(collection, 'sv1-25').quantity).toBe(1);

      // Remove a card entirely
      const removeResult = removeCardFromCollection(collection, 'sv1-1', 'holofoil');
      collection = removeResult.collection;
      const ownership = checkCardOwnership(collection, 'sv1-1');
      expect(ownership.variants.holofoil).toBeUndefined();
      expect(ownership.variants.normal).toBe(5);
    });
  });
});

// ============================================================================
// E2E FLOW 2: CREATE AND MANAGE WISHLIST
// ============================================================================

describe('E2E Flow: Create and Manage Wishlist', () => {
  let wishlist: Array<{ cardId: string; isPriority: boolean }>;

  beforeEach(() => {
    wishlist = [];
  });

  describe('Step 1: Add cards to wishlist', () => {
    it('should add card to empty wishlist', () => {
      wishlist.push({ cardId: 'sv1-1', isPriority: false });

      expect(wishlist).toHaveLength(1);
      expect(wishlist[0].cardId).toBe('sv1-1');
      expect(wishlist[0].isPriority).toBe(false);
    });

    it('should prevent duplicate cards', () => {
      wishlist.push({ cardId: 'sv1-1', isPriority: false });

      // Simulate duplicate check
      const exists = wishlist.some((item) => item.cardId === 'sv1-1');
      expect(exists).toBe(true);

      // Should not add duplicate
      if (!exists) {
        wishlist.push({ cardId: 'sv1-1', isPriority: false });
      }
      expect(wishlist).toHaveLength(1);
    });
  });

  describe('Step 2: Manage priority items', () => {
    it('should allow adding priority when under limit', () => {
      const status = getPriorityStatus([]);
      expect(status.isFull).toBe(false);

      const canAdd = canAddPriority(0);
      expect(canAdd.canAdd).toBe(true);
      expect(canAdd.remaining).toBe(5);
    });

    it('should enforce priority limit', () => {
      const priorityItems = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const status = getPriorityStatus(priorityItems);

      expect(status.isFull).toBe(true);
      expect(status.remaining).toBe(0);

      const canAdd = canAddPriority(5);
      expect(canAdd.canAdd).toBe(false);
    });

    it('should validate priority toggle operations', () => {
      // Toggle ON when under limit
      expect(validatePriorityToggle(3, false).allowed).toBe(true);

      // Toggle ON when at limit
      const atLimitResult = validatePriorityToggle(5, false);
      expect(atLimitResult.allowed).toBe(false);
      expect(atLimitResult.reason).toBeDefined();

      // Toggle OFF always allowed
      expect(validatePriorityToggle(5, true).allowed).toBe(true);
    });
  });

  describe('Step 3: Remove from wishlist', () => {
    it('should remove card from wishlist', () => {
      wishlist = [
        { cardId: 'sv1-1', isPriority: false },
        { cardId: 'sv1-2', isPriority: true },
        { cardId: 'sv1-3', isPriority: false },
      ];

      wishlist = wishlist.filter((item) => item.cardId !== 'sv1-2');

      expect(wishlist).toHaveLength(2);
      expect(wishlist.some((item) => item.cardId === 'sv1-2')).toBe(false);
    });
  });

  describe('Complete Flow: User builds wishlist with priorities', () => {
    it('should correctly manage wishlist throughout user session', () => {
      // User adds first card
      wishlist.push({ cardId: 'sv1-1', isPriority: false });
      expect(wishlist).toHaveLength(1);

      // User marks it as priority
      let priorityItems = wishlist.filter((i) => i.isPriority).map((i) => i.cardId);
      const validation1 = validatePriorityToggle(priorityItems.length, false);
      expect(validation1.allowed).toBe(true);
      wishlist[0].isPriority = true;

      // User adds more cards
      wishlist.push({ cardId: 'sv1-2', isPriority: false });
      wishlist.push({ cardId: 'sv1-3', isPriority: false });
      wishlist.push({ cardId: 'sv1-4', isPriority: false });
      wishlist.push({ cardId: 'sv1-5', isPriority: false });

      // User marks 4 more as priority (reaching the limit)
      for (let i = 1; i <= 4; i++) {
        priorityItems = wishlist.filter((item) => item.isPriority).map((item) => item.cardId);
        const validation = validatePriorityToggle(priorityItems.length, false);
        expect(validation.allowed).toBe(true);
        wishlist[i].isPriority = true;
      }

      // Verify we're at the limit
      priorityItems = wishlist.filter((item) => item.isPriority).map((item) => item.cardId);
      const status = getPriorityStatus(priorityItems);
      expect(status.isFull).toBe(true);
      expect(status.count).toBe(5);

      // User tries to add another priority - should be denied
      wishlist.push({ cardId: 'sv1-6', isPriority: false });
      const cannotAdd = validatePriorityToggle(5, false);
      expect(cannotAdd.allowed).toBe(false);

      // User removes a priority to make room
      const idx = wishlist.findIndex((i) => i.cardId === 'sv1-2');
      wishlist[idx].isPriority = false;

      // Now user can add new priority
      priorityItems = wishlist.filter((item) => item.isPriority).map((item) => item.cardId);
      const canNowAdd = validatePriorityToggle(priorityItems.length, false);
      expect(canNowAdd.allowed).toBe(true);
    });
  });
});

// ============================================================================
// E2E FLOW 3: SHARE WISHLIST LINK
// ============================================================================

describe('E2E Flow: Share Wishlist Link', () => {
  describe('Step 1: Generate share token', () => {
    it('should generate valid share tokens', () => {
      const token = generateShareToken();

      expect(token).toHaveLength(12);
      expect(typeof token).toBe('string');
      // Should only contain allowed characters
      expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateShareToken());
      }
      // Extremely unlikely to have collisions in 100 tokens
      expect(tokens.size).toBeGreaterThanOrEqual(99);
    });
  });

  describe('Step 2: Generate affiliate links', () => {
    it('should detect TCGPlayer URLs', () => {
      expect(isTCGPlayerUrl('https://www.tcgplayer.com/product/123')).toBe(true);
      expect(isTCGPlayerUrl('https://shop.tcgplayer.com/pokemon/card')).toBe(true);
      expect(isTCGPlayerUrl('https://amazon.com/product')).toBe(false);
      expect(isTCGPlayerUrl(null)).toBe(false);
    });

    it('should detect platform from URL', () => {
      expect(detectPlatform('https://www.tcgplayer.com/product/123')).toBe('tcgplayer');
      expect(detectPlatform('https://www.cardmarket.com/en/Pokemon')).toBe('cardmarket');
      expect(detectPlatform('https://www.ebay.com/itm/123')).toBe('ebay');
      expect(detectPlatform('https://www.amazon.com/product')).toBeNull();
    });

    it('should generate TCGPlayer affiliate links', () => {
      const url = 'https://www.tcgplayer.com/product/123456';
      const result = generateTCGPlayerAffiliateLink(url, { affiliateId: 'carddex' });

      expect(result.originalUrl).toBe(url);
      expect(result.hasAffiliateTracking).toBe(true);
      expect(result.affiliateUrl).toContain('partner=carddex');
      expect(result.affiliateUrl).toContain('utm_source=carddex_wishlist');
    });

    it('should generate wishlist-specific sub IDs', () => {
      const shareToken = 'ABC123xyz456';
      const cardId = 'sv1-123';
      const subId = generateWishlistSubId(shareToken, cardId);

      expect(subId).toBe('wishlist_ABC123xy_sv1-123');
    });
  });

  describe('Step 3: Enrich wishlist cards with affiliate links', () => {
    it('should enrich a single card with affiliate link', () => {
      const card = {
        cardId: 'sv1-1',
        name: 'Pikachu',
        tcgPlayerUrl: 'https://www.tcgplayer.com/product/123',
      };
      const shareToken = 'ABC123xyz456';

      const enriched = enrichCardWithAffiliateLink(card, shareToken);

      expect(enriched.cardId).toBe('sv1-1');
      expect(enriched.name).toBe('Pikachu');
      expect(enriched.affiliateLink).toBeDefined();
      expect(enriched.affiliateLink?.hasAffiliateTracking).toBe(true);
      expect(enriched.affiliateLink?.affiliateUrl).toContain('partner=');
    });

    it('should handle cards without TCGPlayer URLs', () => {
      const card = {
        cardId: 'sv1-1',
        name: 'Pikachu',
        tcgPlayerUrl: undefined,
      };

      const enriched = enrichCardWithAffiliateLink(card, 'token123');

      expect(enriched.affiliateLink).toBeUndefined();
    });

    it('should enrich multiple cards', () => {
      const cards = [
        { cardId: 'sv1-1', name: 'Pikachu', tcgPlayerUrl: 'https://www.tcgplayer.com/product/1' },
        { cardId: 'sv1-2', name: 'Charizard', tcgPlayerUrl: 'https://www.tcgplayer.com/product/2' },
        { cardId: 'sv1-3', name: 'Bulbasaur', tcgPlayerUrl: undefined },
      ];

      const enriched = enrichCardsWithAffiliateLinks(cards, 'shareToken123');

      expect(enriched).toHaveLength(3);
      expect(enriched[0].affiliateLink?.hasAffiliateTracking).toBe(true);
      expect(enriched[1].affiliateLink?.hasAffiliateTracking).toBe(true);
      expect(enriched[2].affiliateLink).toBeUndefined();
    });
  });

  describe('Step 4: Calculate affiliate stats', () => {
    it('should calculate stats for enriched wishlist', () => {
      const cards = [
        {
          cardId: 'sv1-1',
          tcgPlayerUrl: 'https://tcgplayer.com/1',
          affiliateLink: {
            platform: 'tcgplayer' as const,
            hasAffiliateTracking: true,
            originalUrl: '',
            affiliateUrl: '',
          },
        },
        {
          cardId: 'sv1-2',
          tcgPlayerUrl: 'https://tcgplayer.com/2',
          affiliateLink: {
            platform: 'tcgplayer' as const,
            hasAffiliateTracking: true,
            originalUrl: '',
            affiliateUrl: '',
          },
        },
        { cardId: 'sv1-3', tcgPlayerUrl: undefined, affiliateLink: undefined },
      ];

      const stats = calculateAffiliateLinkStats(cards);

      expect(stats.totalCards).toBe(3);
      expect(stats.cardsWithLinks).toBe(2);
      expect(stats.cardsWithAffiliateLinks).toBe(2);
      expect(stats.linksByPlatform.tcgplayer).toBe(2);
    });

    it('should generate summary message', () => {
      const stats = {
        totalCards: 10,
        cardsWithLinks: 8,
        cardsWithAffiliateLinks: 8,
        linksByPlatform: { tcgplayer: 8, cardmarket: 0, ebay: 0 },
      };

      const summary = getAffiliateLinkSummary(stats);
      expect(summary).toContain('8 of 10');
      expect(summary).toContain('80%');
    });
  });

  describe('Step 5: Handle share access rules', () => {
    it('should determine affiliate link visibility by profile type', () => {
      expect(shouldShowAffiliateLinks('parent')).toBe(true);
      expect(shouldShowAffiliateLinks('child')).toBe(false);
      expect(shouldShowAffiliateLinks(undefined)).toBe(false);
    });

    it('should provide FTC-required disclosure', () => {
      const disclosure = getAffiliateDisclosure();
      expect(disclosure).toContain('affiliate');
      expect(disclosure).toContain('commission');
    });
  });

  describe('Complete Flow: Parent shares wishlist with affiliate links', () => {
    it('should correctly generate shareable wishlist with tracking', () => {
      // Step 1: Create wishlist
      const wishlist = [
        createWishlistCard('sv1-1', true, 'https://www.tcgplayer.com/product/1'),
        createWishlistCard('sv1-2', true, 'https://www.tcgplayer.com/product/2'),
        createWishlistCard('sv1-3', false, 'https://www.tcgplayer.com/product/3'),
        createWishlistCard('sv1-4', false, undefined), // No buy link
      ];

      // Step 2: Generate share token
      const shareToken = generateShareToken();
      expect(shareToken).toHaveLength(12);

      // Step 3: Enrich with affiliate links
      const enrichedWishlist = enrichCardsWithAffiliateLinks(
        wishlist.map((w) => ({
          cardId: w.cardId,
          name: w.name,
          tcgPlayerUrl: w.tcgPlayerUrl,
        })),
        shareToken,
        { affiliateId: 'carddex' }
      );

      // Verify enrichment
      expect(enrichedWishlist).toHaveLength(4);
      expect(enrichedWishlist.filter((c) => c.affiliateLink?.hasAffiliateTracking)).toHaveLength(3);

      // Step 4: Calculate stats
      const stats = calculateAffiliateLinkStats(enrichedWishlist);
      expect(stats.cardsWithAffiliateLinks).toBe(3);
      expect(stats.totalCards).toBe(4);

      // Step 5: Verify disclosure is available
      const disclosure = getAffiliateDisclosure();
      expect(disclosure.length).toBeGreaterThan(0);

      // Verify subIds contain share token
      const firstCardSubId = generateWishlistSubId(shareToken, 'sv1-1');
      expect(firstCardSubId).toContain(shareToken.slice(0, 8));
    });
  });
});

// ============================================================================
// E2E FLOW 4: CROSS-FLOW INTEGRATION
// ============================================================================

describe('E2E Flow: Cross-Flow Integration', () => {
  describe('Collection to Wishlist flow', () => {
    it('should find cards missing from collection for wishlist', () => {
      const collection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-2', 1, 'holofoil'),
        createCard('sv1-3', 1, 'normal'),
      ];

      const wantedCards = ['sv1-1', 'sv1-4', 'sv1-5', 'sv1-6'];

      // Find which wanted cards are not in collection
      const collectionCardIds = getUniqueCardIds(collection);
      const missingCards = wantedCards.filter((id) => !collectionCardIds.includes(id));

      expect(missingCards).toEqual(['sv1-4', 'sv1-5', 'sv1-6']);
    });

    it('should find cards user owns but wants specific variant', () => {
      const collection = [createCard('sv1-1', 2, 'normal'), createCard('sv1-2', 1, 'normal')];

      // User wants holofoil versions
      const wantedVariants = [
        { cardId: 'sv1-1', variant: 'holofoil' as CardVariant },
        { cardId: 'sv1-2', variant: 'holofoil' as CardVariant },
        { cardId: 'sv1-3', variant: 'holofoil' as CardVariant }, // Don't own at all
      ];

      const missingVariants = wantedVariants.filter((wanted) => {
        const ownership = checkCardOwnership(collection, wanted.cardId);
        return !ownership.variants[wanted.variant];
      });

      expect(missingVariants).toHaveLength(3);
      expect(missingVariants.map((v) => v.cardId)).toContain('sv1-1');
      expect(missingVariants.map((v) => v.cardId)).toContain('sv1-2');
      expect(missingVariants.map((v) => v.cardId)).toContain('sv1-3');
    });
  });

  describe('Family collection sharing flow', () => {
    it('should find shared cards between two family members', () => {
      const kidCollection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-2', 1, 'holofoil'),
        createCard('sv1-5', 1, 'normal'),
      ];

      const parentCollection = [
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-3', 3, 'normal'),
        createCard('sv1-5', 2, 'reverseHolofoil'),
      ];

      const shared = findSharedCards(kidCollection, parentCollection);
      expect(shared).toContain('sv1-1');
      expect(shared).toContain('sv1-5');
      expect(shared).not.toContain('sv1-2');
      expect(shared).not.toContain('sv1-3');
    });

    it('should find unique cards for trading suggestions', () => {
      const kid1Collection = [createCard('sv1-1', 2, 'normal'), createCard('sv1-2', 1, 'holofoil')];

      const kid2Collection = [createCard('sv1-1', 1, 'normal'), createCard('sv1-3', 1, 'normal')];

      // Cards kid1 has that kid2 doesn't
      const kid1Unique = findUniqueCards(kid1Collection, kid2Collection);
      expect(kid1Unique).toContain('sv1-2');
      expect(kid1Unique).not.toContain('sv1-1');

      // Cards kid2 has that kid1 doesn't
      const kid2Unique = findUniqueCards(kid2Collection, kid1Collection);
      expect(kid2Unique).toContain('sv1-3');
      expect(kid2Unique).not.toContain('sv1-1');
    });

    it('should merge collections for family overview', () => {
      const kid1Collection = [createCard('sv1-1', 2, 'normal'), createCard('sv1-2', 1, 'holofoil')];

      const kid2Collection = [createCard('sv1-1', 1, 'normal'), createCard('sv1-3', 1, 'normal')];

      const familyCollection = mergeCollections(kid1Collection, kid2Collection);

      // Should combine quantities for same card+variant
      const sv1_1_ownership = checkCardOwnership(familyCollection, 'sv1-1');
      expect(sv1_1_ownership.variants.normal).toBe(3); // 2 + 1

      // Should include all unique cards
      expect(getUniqueCardIds(familyCollection).sort()).toEqual(['sv1-1', 'sv1-2', 'sv1-3']);
    });
  });

  describe('Set completion to wishlist flow', () => {
    it('should generate wishlist for completing a set', () => {
      // User's current collection for set sv1
      const collection = [
        createCard('sv1-1', 1, 'normal'),
        createCard('sv1-3', 1, 'normal'),
        createCard('sv1-5', 1, 'normal'),
      ];

      // All cards in the set (simplified)
      const setCards = ['sv1-1', 'sv1-2', 'sv1-3', 'sv1-4', 'sv1-5', 'sv1-6', 'sv1-7'];

      // Find missing cards for wishlist
      const ownedCardIds = getUniqueCardIds(filterBySet(collection, 'sv1'));
      const missingCards = setCards.filter((id) => !ownedCardIds.includes(id));

      expect(missingCards).toEqual(['sv1-2', 'sv1-4', 'sv1-6', 'sv1-7']);

      // Generate wishlist suggestions with priority on rarer cards
      const wishlistSuggestions = missingCards.map((cardId, index) => ({
        cardId,
        isPriority: index < MAX_PRIORITY_ITEMS, // First 5 get priority
      }));

      expect(wishlistSuggestions).toHaveLength(4);
      expect(wishlistSuggestions.filter((w) => w.isPriority)).toHaveLength(4);
    });
  });
});

// ============================================================================
// E2E VALIDATION TESTS
// ============================================================================

describe('E2E Validation: Edge Cases', () => {
  describe('Collection edge cases', () => {
    it('should handle empty collection operations', () => {
      const empty: CollectionCard[] = [];

      expect(getCollectionStats(empty)).toEqual({
        totalCards: 0,
        uniqueCards: 0,
        setsStarted: 0,
      });

      expect(checkCardOwnership(empty, 'sv1-1').owned).toBe(false);
      expect(filterBySet(empty, 'sv1')).toHaveLength(0);
      expect(groupCardsByCardId(empty)).toHaveLength(0);
      expect(getUniqueCardIds(empty)).toHaveLength(0);
    });

    it('should handle very large collections', () => {
      const largeCollection: CollectionCard[] = [];
      for (let set = 1; set <= 10; set++) {
        for (let card = 1; card <= 100; card++) {
          largeCollection.push(createCard(`sv${set}-${card}`, 1, 'normal'));
        }
      }

      const stats = getCollectionStats(largeCollection);
      expect(stats.uniqueCards).toBe(1000);
      expect(stats.totalCards).toBe(1000);
      expect(stats.setsStarted).toBe(10);
    });

    it('should handle all variant types', () => {
      const collection = VALID_VARIANTS.map((variant) => createCard('sv1-1', 1, variant));

      const grouped = groupCardsByCardId(collection);
      expect(grouped).toHaveLength(1);
      expect(grouped[0].totalQuantity).toBe(5);
      expect(Object.keys(grouped[0].variants)).toHaveLength(5);
    });
  });

  describe('Wishlist edge cases', () => {
    it('should handle wishlist at exact limit', () => {
      const atLimit = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const status = getPriorityStatus(atLimit);

      expect(status.isFull).toBe(true);
      expect(status.remaining).toBe(0);
      expect(canAddPriority(5).canAdd).toBe(false);
    });

    it('should handle empty wishlist priority operations', () => {
      const empty = getPriorityStatus([]);

      expect(empty.isFull).toBe(false);
      expect(empty.remaining).toBe(5);
      expect(canAddPriority(0).canAdd).toBe(true);
    });
  });

  describe('Affiliate link edge cases', () => {
    it('should handle malformed URLs', () => {
      expect(isTCGPlayerUrl('not-a-url')).toBe(false);
      expect(isTCGPlayerUrl('')).toBe(false);
      expect(detectPlatform('invalid')).toBeNull();

      const result = generateAffiliateLink('not-a-url', {});
      expect(result).toBeNull();
    });

    it('should handle URLs that already have affiliate tracking', () => {
      const existingTracking = 'https://www.tcgplayer.com/product/123?partner=existing';
      expect(hasAffiliateTracking(existingTracking)).toBe(true);
    });

    it('should validate affiliate IDs', () => {
      expect(isValidAffiliateId('carddex')).toBe(true);
      expect(isValidAffiliateId('my_affiliate-id123')).toBe(true);
      expect(isValidAffiliateId('ab')).toBe(false); // Too short
      expect(isValidAffiliateId('a'.repeat(51))).toBe(false); // Too long
      expect(isValidAffiliateId('invalid@id')).toBe(false); // Invalid chars
    });
  });
});

// ============================================================================
// E2E PERFORMANCE SIMULATION
// ============================================================================

describe('E2E Performance: Large Data Sets', () => {
  it('should handle collection operations on large datasets efficiently', () => {
    // Simulate a power user with a large collection
    const largeCollection: CollectionCard[] = [];
    for (let set = 1; set <= 50; set++) {
      for (let card = 1; card <= 200; card++) {
        const variant = VALID_VARIANTS[card % 5];
        largeCollection.push(createCard(`sv${set}-${card}`, Math.ceil(Math.random() * 4), variant));
      }
    }

    // All operations should complete quickly
    const startStats = performance.now();
    const stats = getCollectionStats(largeCollection);
    const statsTime = performance.now() - startStats;

    expect(stats.uniqueCards).toBe(10000);
    expect(statsTime).toBeLessThan(100); // Should complete in under 100ms

    const startFilter = performance.now();
    const filtered = filterBySet(largeCollection, 'sv25');
    const filterTime = performance.now() - startFilter;

    expect(filtered).toHaveLength(200);
    expect(filterTime).toBeLessThan(50);

    const startGroup = performance.now();
    const grouped = groupCardsByCardId(largeCollection);
    const groupTime = performance.now() - startGroup;

    expect(grouped.length).toBeLessThanOrEqual(10000);
    expect(groupTime).toBeLessThan(100);
  });

  it('should handle wishlist enrichment for large wishlists', () => {
    const largeWishlist = Array.from({ length: 100 }, (_, i) => ({
      cardId: `sv1-${i + 1}`,
      name: `Card ${i + 1}`,
      tcgPlayerUrl: i % 3 === 0 ? `https://www.tcgplayer.com/product/${i + 1}` : undefined,
    }));

    const start = performance.now();
    const enriched = enrichCardsWithAffiliateLinks(largeWishlist, 'shareToken123');
    const duration = performance.now() - start;

    expect(enriched).toHaveLength(100);
    expect(duration).toBeLessThan(50);

    const stats = calculateAffiliateLinkStats(enriched);
    expect(stats.totalCards).toBe(100);
    expect(stats.cardsWithLinks).toBe(34); // Every 3rd card has a URL
  });
});
