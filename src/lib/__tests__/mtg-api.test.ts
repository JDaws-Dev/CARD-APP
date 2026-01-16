/**
 * Unit tests for MTG API adapter helper functions
 */

import { describe, test, expect } from 'vitest';
import {
  // Types
  type MTGCard,
  type MTGSet,
  type MTGColor,
  type MTGRarity,
  type MTGFilterOptions,

  // Constants
  COLLECTIBLE_SET_TYPES,
  MTG_COLORS,
  MTG_RARITIES,

  // Helper functions
  isPromoCard,
  getCardImage,
  getCardColorNames,
  getRarityDisplayName,
  getMarketPrice,
  getCardDexId,
  isMultiFacedCard,
  getManaCost,
} from '../mtg-api';

// =============================================================================
// TEST DATA
// =============================================================================

const mockSingleFacedCard: MTGCard = {
  id: 'abc123',
  oracle_id: 'def456',
  name: 'Lightning Bolt',
  lang: 'en',
  released_at: '2010-07-16',
  mana_cost: '{R}',
  cmc: 1,
  type_line: 'Instant',
  oracle_text: 'Lightning Bolt deals 3 damage to any target.',
  colors: ['R'],
  color_identity: ['R'],
  keywords: [],
  layout: 'normal',
  set: 'm11',
  set_name: 'Magic 2011',
  set_type: 'core',
  collector_number: '149',
  rarity: 'common',
  artist: 'Christopher Moeller',
  border_color: 'black',
  frame: '2003',
  full_art: false,
  textless: false,
  image_uris: {
    small: 'https://cards.scryfall.io/small/front/l/b/lb.jpg',
    normal: 'https://cards.scryfall.io/normal/front/l/b/lb.jpg',
    large: 'https://cards.scryfall.io/large/front/l/b/lb.jpg',
    png: 'https://cards.scryfall.io/png/front/l/b/lb.png',
    art_crop: 'https://cards.scryfall.io/art_crop/front/l/b/lb.jpg',
    border_crop: 'https://cards.scryfall.io/border_crop/front/l/b/lb.jpg',
  },
  highres_image: true,
  prices: {
    usd: '2.50',
    usd_foil: '5.00',
    eur: '2.00',
    tix: '0.05',
  },
  legalities: {
    standard: 'not_legal',
    modern: 'legal',
    legacy: 'legal',
    vintage: 'legal',
  },
  scryfall_uri: 'https://scryfall.com/card/m11/149/lightning-bolt',
  uri: 'https://api.scryfall.com/cards/abc123',
  reprint: true,
  digital: false,
  promo: false,
  variation: false,
  reserved: false,
  foil: true,
  nonfoil: true,
  oversized: false,
};

const mockMultiFacedCard: MTGCard = {
  id: 'xyz789',
  oracle_id: 'uvw012',
  name: 'Delver of Secrets // Insectile Aberration',
  lang: 'en',
  released_at: '2021-09-24',
  cmc: 1,
  type_line: 'Creature — Human Wizard // Creature — Human Insect',
  colors: ['U'],
  color_identity: ['U'],
  keywords: ['Flying', 'Transform'],
  layout: 'transform',
  card_faces: [
    {
      name: 'Delver of Secrets',
      mana_cost: '{U}',
      type_line: 'Creature — Human Wizard',
      oracle_text:
        'At the beginning of your upkeep, look at the top card of your library. You may reveal that card. If an instant or sorcery card is revealed this way, transform Delver of Secrets.',
      power: '1',
      toughness: '1',
      artist: 'Matt Stewart',
      image_uris: {
        small: 'https://cards.scryfall.io/small/front/d/e/delver-front.jpg',
        normal: 'https://cards.scryfall.io/normal/front/d/e/delver-front.jpg',
        large: 'https://cards.scryfall.io/large/front/d/e/delver-front.jpg',
        png: 'https://cards.scryfall.io/png/front/d/e/delver-front.png',
        art_crop: 'https://cards.scryfall.io/art_crop/front/d/e/delver-front.jpg',
        border_crop: 'https://cards.scryfall.io/border_crop/front/d/e/delver-front.jpg',
      },
    },
    {
      name: 'Insectile Aberration',
      type_line: 'Creature — Human Insect',
      colors: ['U'],
      power: '3',
      toughness: '2',
      artist: 'Nils Hamm',
      image_uris: {
        small: 'https://cards.scryfall.io/small/back/d/e/delver-back.jpg',
        normal: 'https://cards.scryfall.io/normal/back/d/e/delver-back.jpg',
        large: 'https://cards.scryfall.io/large/back/d/e/delver-back.jpg',
        png: 'https://cards.scryfall.io/png/back/d/e/delver-back.png',
        art_crop: 'https://cards.scryfall.io/art_crop/back/d/e/delver-back.jpg',
        border_crop: 'https://cards.scryfall.io/border_crop/back/d/e/delver-back.jpg',
      },
    },
  ],
  set: 'mid',
  set_name: 'Innistrad: Midnight Hunt',
  set_type: 'expansion',
  collector_number: '47',
  rarity: 'uncommon',
  border_color: 'black',
  frame: '2015',
  full_art: false,
  textless: false,
  highres_image: true,
  prices: {
    usd: '0.75',
    usd_foil: '1.50',
    eur: '0.60',
  },
  legalities: {
    standard: 'not_legal',
    modern: 'legal',
    legacy: 'legal',
  },
  scryfall_uri: 'https://scryfall.com/card/mid/47/delver-of-secrets-insectile-aberration',
  uri: 'https://api.scryfall.com/cards/xyz789',
  reprint: true,
  digital: false,
  promo: false,
  variation: false,
  reserved: false,
  foil: true,
  nonfoil: true,
  oversized: false,
};

const mockPromoCard: MTGCard = {
  ...mockSingleFacedCard,
  id: 'promo123',
  name: 'Lightning Bolt (Promo)',
  promo: true,
  set: 'plst',
  set_type: 'promo',
  collector_number: 'A25-141',
};

const mockMultiColorCard: MTGCard = {
  ...mockSingleFacedCard,
  id: 'multi123',
  name: 'Omnath, Locus of Creation',
  mana_cost: '{R}{G}{W}{U}',
  cmc: 4,
  colors: ['R', 'G', 'W', 'U'],
  color_identity: ['R', 'G', 'W', 'U'],
  rarity: 'mythic',
};

const mockColorlessCard: MTGCard = {
  ...mockSingleFacedCard,
  id: 'colorless123',
  name: 'Sol Ring',
  mana_cost: '{1}',
  cmc: 1,
  colors: [],
  color_identity: [],
  type_line: 'Artifact',
  rarity: 'uncommon',
};

const mockCardNoPrice: MTGCard = {
  ...mockSingleFacedCard,
  id: 'noprice123',
  prices: {
    usd: null,
    usd_foil: null,
    eur: null,
  },
};

const mockCardNoImages: MTGCard = {
  ...mockSingleFacedCard,
  id: 'noimages123',
  image_uris: undefined,
  card_faces: undefined,
};

// =============================================================================
// CONSTANT TESTS
// =============================================================================

describe('Constants', () => {
  describe('COLLECTIBLE_SET_TYPES', () => {
    test('includes expected set types', () => {
      expect(COLLECTIBLE_SET_TYPES).toContain('core');
      expect(COLLECTIBLE_SET_TYPES).toContain('expansion');
      expect(COLLECTIBLE_SET_TYPES).toContain('masters');
      expect(COLLECTIBLE_SET_TYPES).toContain('masterpiece');
      expect(COLLECTIBLE_SET_TYPES).toContain('commander');
      expect(COLLECTIBLE_SET_TYPES).toContain('draft_innovation');
    });

    test('does not include non-collectible types', () => {
      expect(COLLECTIBLE_SET_TYPES).not.toContain('token');
      expect(COLLECTIBLE_SET_TYPES).not.toContain('memorabilia');
      expect(COLLECTIBLE_SET_TYPES).not.toContain('funny');
    });
  });

  describe('MTG_COLORS', () => {
    test('has all five colors', () => {
      expect(Object.keys(MTG_COLORS)).toHaveLength(5);
      expect(MTG_COLORS.W).toBe('White');
      expect(MTG_COLORS.U).toBe('Blue');
      expect(MTG_COLORS.B).toBe('Black');
      expect(MTG_COLORS.R).toBe('Red');
      expect(MTG_COLORS.G).toBe('Green');
    });
  });

  describe('MTG_RARITIES', () => {
    test('has all rarity levels', () => {
      expect(Object.keys(MTG_RARITIES)).toHaveLength(6);
    });

    test('has correct sort order', () => {
      expect(MTG_RARITIES.common.sortOrder).toBeLessThan(MTG_RARITIES.uncommon.sortOrder);
      expect(MTG_RARITIES.uncommon.sortOrder).toBeLessThan(MTG_RARITIES.rare.sortOrder);
      expect(MTG_RARITIES.rare.sortOrder).toBeLessThan(MTG_RARITIES.mythic.sortOrder);
    });

    test('has display names', () => {
      expect(MTG_RARITIES.common.name).toBe('Common');
      expect(MTG_RARITIES.mythic.name).toBe('Mythic Rare');
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('isPromoCard', () => {
  test('returns true for cards with promo flag', () => {
    expect(isPromoCard(mockPromoCard)).toBe(true);
  });

  test('returns true for cards from promo set type', () => {
    const promoSetCard: MTGCard = {
      ...mockSingleFacedCard,
      promo: false,
      set_type: 'promo',
    };
    expect(isPromoCard(promoSetCard)).toBe(true);
  });

  test('returns false for non-promo cards', () => {
    expect(isPromoCard(mockSingleFacedCard)).toBe(false);
    expect(isPromoCard(mockMultiFacedCard)).toBe(false);
  });
});

describe('getCardImage', () => {
  test('returns image URI for single-faced card', () => {
    expect(getCardImage(mockSingleFacedCard, 'normal')).toBe(
      'https://cards.scryfall.io/normal/front/l/b/lb.jpg'
    );
    expect(getCardImage(mockSingleFacedCard, 'small')).toBe(
      'https://cards.scryfall.io/small/front/l/b/lb.jpg'
    );
    expect(getCardImage(mockSingleFacedCard, 'large')).toBe(
      'https://cards.scryfall.io/large/front/l/b/lb.jpg'
    );
  });

  test('returns front face image for multi-faced card', () => {
    expect(getCardImage(mockMultiFacedCard, 'normal')).toBe(
      'https://cards.scryfall.io/normal/front/d/e/delver-front.jpg'
    );
  });

  test('defaults to normal size', () => {
    expect(getCardImage(mockSingleFacedCard)).toBe(
      'https://cards.scryfall.io/normal/front/l/b/lb.jpg'
    );
  });

  test('returns null for card with no images', () => {
    expect(getCardImage(mockCardNoImages)).toBeNull();
  });
});

describe('getCardColorNames', () => {
  test('returns color names for single color', () => {
    expect(getCardColorNames(mockSingleFacedCard)).toEqual(['Red']);
  });

  test('returns color names for multi-color card', () => {
    const colors = getCardColorNames(mockMultiColorCard);
    expect(colors).toContain('Red');
    expect(colors).toContain('Green');
    expect(colors).toContain('White');
    expect(colors).toContain('Blue');
    expect(colors).toHaveLength(4);
  });

  test('returns empty array for colorless card', () => {
    expect(getCardColorNames(mockColorlessCard)).toEqual([]);
  });

  test('handles card with no colors property', () => {
    const noColorsCard: MTGCard = { ...mockSingleFacedCard, colors: undefined };
    expect(getCardColorNames(noColorsCard)).toEqual([]);
  });
});

describe('getRarityDisplayName', () => {
  test('returns display name for known rarities', () => {
    expect(getRarityDisplayName('common')).toBe('Common');
    expect(getRarityDisplayName('uncommon')).toBe('Uncommon');
    expect(getRarityDisplayName('rare')).toBe('Rare');
    expect(getRarityDisplayName('mythic')).toBe('Mythic Rare');
    expect(getRarityDisplayName('special')).toBe('Special');
    expect(getRarityDisplayName('bonus')).toBe('Bonus');
  });

  test('returns input for unknown rarity', () => {
    expect(getRarityDisplayName('unknown' as MTGRarity)).toBe('unknown');
  });
});

describe('getMarketPrice', () => {
  test('returns USD price as number', () => {
    expect(getMarketPrice(mockSingleFacedCard)).toBe(2.5);
  });

  test('returns foil price when requested', () => {
    expect(getMarketPrice(mockSingleFacedCard, true)).toBe(5.0);
  });

  test('returns null when price is not available', () => {
    expect(getMarketPrice(mockCardNoPrice)).toBeNull();
    expect(getMarketPrice(mockCardNoPrice, true)).toBeNull();
  });

  test('handles invalid price strings', () => {
    const invalidPriceCard: MTGCard = {
      ...mockSingleFacedCard,
      prices: { usd: 'invalid', usd_foil: 'not a number' },
    };
    expect(getMarketPrice(invalidPriceCard)).toBeNull();
    expect(getMarketPrice(invalidPriceCard, true)).toBeNull();
  });
});

describe('getCardDexId', () => {
  test('returns set-collectornumber format', () => {
    expect(getCardDexId(mockSingleFacedCard)).toBe('m11-149');
    expect(getCardDexId(mockMultiFacedCard)).toBe('mid-47');
    expect(getCardDexId(mockPromoCard)).toBe('plst-A25-141');
  });
});

describe('isMultiFacedCard', () => {
  test('returns true for transform cards', () => {
    expect(isMultiFacedCard(mockMultiFacedCard)).toBe(true);
  });

  test('returns false for single-faced cards', () => {
    expect(isMultiFacedCard(mockSingleFacedCard)).toBe(false);
  });

  test('returns true for modal double-faced cards', () => {
    const mdfcCard: MTGCard = {
      ...mockMultiFacedCard,
      layout: 'modal_dfc',
    };
    expect(isMultiFacedCard(mdfcCard)).toBe(true);
  });

  test('returns false for split cards (different layout)', () => {
    const splitCard: MTGCard = {
      ...mockMultiFacedCard,
      layout: 'split',
    };
    expect(isMultiFacedCard(splitCard)).toBe(false);
  });

  test('returns false when card_faces is undefined', () => {
    const noFacesCard: MTGCard = {
      ...mockSingleFacedCard,
      layout: 'transform',
      card_faces: undefined,
    };
    expect(isMultiFacedCard(noFacesCard)).toBe(false);
  });
});

describe('getManaCost', () => {
  test('returns mana cost for single-faced card', () => {
    expect(getManaCost(mockSingleFacedCard)).toBe('{R}');
  });

  test('returns front face mana cost for multi-faced card', () => {
    expect(getManaCost(mockMultiFacedCard)).toBe('{U}');
  });

  test('returns null when no mana cost available', () => {
    const noManaCostCard: MTGCard = {
      ...mockSingleFacedCard,
      mana_cost: undefined,
    };
    expect(getManaCost(noManaCostCard)).toBeNull();
  });

  test('returns null for land cards (no mana cost)', () => {
    const landCard: MTGCard = {
      ...mockSingleFacedCard,
      name: 'Island',
      mana_cost: undefined,
      type_line: 'Basic Land — Island',
    };
    expect(getManaCost(landCard)).toBeNull();
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Integration Scenarios', () => {
  describe('Card display preparation', () => {
    test('can prepare all display data for a card', () => {
      const card = mockMultiColorCard;

      const displayData = {
        id: getCardDexId(card),
        name: card.name,
        imageUrl: getCardImage(card, 'normal'),
        colors: getCardColorNames(card),
        rarity: getRarityDisplayName(card.rarity),
        price: getMarketPrice(card),
        foilPrice: getMarketPrice(card, true),
        manaCost: getManaCost(card),
        isPromo: isPromoCard(card),
        isMultiFaced: isMultiFacedCard(card),
      };

      expect(displayData.id).toBe('m11-149');
      expect(displayData.name).toBe('Omnath, Locus of Creation');
      expect(displayData.imageUrl).toBe('https://cards.scryfall.io/normal/front/l/b/lb.jpg');
      expect(displayData.colors).toEqual(['Red', 'Green', 'White', 'Blue']);
      expect(displayData.rarity).toBe('Mythic Rare');
      expect(displayData.price).toBe(2.5);
      expect(displayData.foilPrice).toBe(5.0);
      expect(displayData.manaCost).toBe('{R}{G}{W}{U}');
      expect(displayData.isPromo).toBe(false);
      expect(displayData.isMultiFaced).toBe(false);
    });
  });

  describe('Transform card handling', () => {
    test('properly handles transform card display', () => {
      const card = mockMultiFacedCard;

      expect(isMultiFacedCard(card)).toBe(true);
      expect(getCardImage(card, 'normal')).toBe(
        'https://cards.scryfall.io/normal/front/d/e/delver-front.jpg'
      );
      expect(getManaCost(card)).toBe('{U}');
      expect(getCardColorNames(card)).toEqual(['Blue']);
    });
  });

  describe('Promo card identification', () => {
    test('identifies promo cards correctly', () => {
      expect(isPromoCard(mockPromoCard)).toBe(true);
      expect(isPromoCard(mockSingleFacedCard)).toBe(false);

      // Card from promo set
      const promoSetCard: MTGCard = {
        ...mockSingleFacedCard,
        promo: false,
        set_type: 'promo',
      };
      expect(isPromoCard(promoSetCard)).toBe(true);
    });
  });

  describe('Price handling', () => {
    test('handles various price scenarios', () => {
      // Normal card with prices
      expect(getMarketPrice(mockSingleFacedCard)).toBe(2.5);
      expect(getMarketPrice(mockSingleFacedCard, true)).toBe(5.0);

      // Card without prices
      expect(getMarketPrice(mockCardNoPrice)).toBeNull();

      // Card with only non-foil price
      const nonFoilOnlyCard: MTGCard = {
        ...mockSingleFacedCard,
        prices: { usd: '1.00', usd_foil: null },
      };
      expect(getMarketPrice(nonFoilOnlyCard)).toBe(1.0);
      expect(getMarketPrice(nonFoilOnlyCard, true)).toBeNull();
    });
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  test('handles card with empty colors array', () => {
    const emptyColorsCard: MTGCard = { ...mockSingleFacedCard, colors: [] };
    expect(getCardColorNames(emptyColorsCard)).toEqual([]);
  });

  test('handles card with special collector numbers', () => {
    const specialNumberCard: MTGCard = {
      ...mockSingleFacedCard,
      collector_number: '★',
    };
    expect(getCardDexId(specialNumberCard)).toBe('m11-★');
  });

  test('handles card with very long collector number', () => {
    const longNumberCard: MTGCard = {
      ...mockSingleFacedCard,
      collector_number: 'A25-141-PROMO-SPECIAL',
    };
    expect(getCardDexId(longNumberCard)).toBe('m11-A25-141-PROMO-SPECIAL');
  });

  test('handles zero price', () => {
    const zeroPriceCard: MTGCard = {
      ...mockSingleFacedCard,
      prices: { usd: '0', usd_foil: '0.00' },
    };
    expect(getMarketPrice(zeroPriceCard)).toBe(0);
    expect(getMarketPrice(zeroPriceCard, true)).toBe(0);
  });

  test('handles very high prices', () => {
    const highPriceCard: MTGCard = {
      ...mockSingleFacedCard,
      prices: { usd: '99999.99', usd_foil: '150000.00' },
    };
    expect(getMarketPrice(highPriceCard)).toBe(99999.99);
    expect(getMarketPrice(highPriceCard, true)).toBe(150000.0);
  });
});

// Type checking tests - ensure types are exported correctly
describe('Type exports', () => {
  test('MTGColor type accepts valid colors', () => {
    const colors: MTGColor[] = ['W', 'U', 'B', 'R', 'G'];
    expect(colors).toHaveLength(5);
  });

  test('MTGRarity type accepts valid rarities', () => {
    const rarities: MTGRarity[] = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'];
    expect(rarities).toHaveLength(6);
  });

  test('MTGFilterOptions type is usable', () => {
    const options: MTGFilterOptions = {
      setCode: 'neo',
      colors: ['U', 'B'],
      rarity: 'rare',
      type: 'Creature',
      name: 'Ninja',
      cmc: 3,
      cmcOperator: '<=',
      limit: 20,
    };
    expect(options.setCode).toBe('neo');
    expect(options.colors).toEqual(['U', 'B']);
  });
});
