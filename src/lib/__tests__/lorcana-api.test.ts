/**
 * Tests for Lorcana API client
 * Tests pure utility functions and constants
 */

import {
  // Constants
  LORCANA_INKS,
  LORCANA_RARITIES,
  LORCANA_CARD_TYPES,
  // Types
  type LorcanaCard,
  type LorcanaInk,
  type LorcanaRarity,
  type LorcanaCardType,
  // Helper functions
  getCardDexId,
  parseCardDexId,
  getCardImage,
  isCharacterCard,
  isActionCard,
  isSongCard,
  isItemCard,
  isLocationCard,
  isLandscapeCard,
  isInkable,
  isFloodborn,
  hasShift,
  hasSinger,
  isCoreLegal,
  getRarityDisplayName,
  getTypeDisplayName,
  getInkInfo,
  getMarketPrice,
  formatCost,
  formatStrength,
  formatWillpower,
  formatLore,
  getCardSummary,
  getFullCardName,
  sortBySetAndNumber,
  sortByRarity,
  sortByCost,
  sortByStrength,
  sortByLore,
  filterByInk,
  filterByClassification,
  getUniqueInks,
  getUniqueClassifications,
  calculateDeckStats,
} from '../lorcana-api';

// =============================================================================
// TEST DATA
// =============================================================================

function createMockCard(overrides: Partial<LorcanaCard> = {}): LorcanaCard {
  return {
    id: 'card_123',
    name: 'Elsa',
    version: 'Snow Queen',
    layout: 'normal',
    released_at: '2023-08-18',
    image_uris: {
      small: 'https://example.com/small.avif',
      normal: 'https://example.com/normal.avif',
      large: 'https://example.com/large.avif',
    },
    cost: 4,
    inkwell: true,
    ink: 'Sapphire',
    type: ['Character'],
    classifications: ['Floodborn', 'Hero', 'Queen'],
    text: 'Shift 3 (You may pay 3 ink to play this on top of one of your characters named Elsa.)',
    move_cost: null,
    strength: 3,
    willpower: 4,
    lore: 2,
    rarity: 'Legendary',
    illustrators: ['Artist Name'],
    collector_number: '42',
    lang: 'en',
    flavor_text: 'Let it go!',
    tcgplayer_id: 12345,
    legalities: { core: 'legal' },
    set: {
      id: 'set_123',
      code: '1',
      name: 'The First Chapter',
    },
    prices: {
      usd: '25.00',
      usd_foil: '75.00',
    },
    ...overrides,
  };
}

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('LORCANA_INKS', () => {
  it('should have all 6 ink colors', () => {
    expect(Object.keys(LORCANA_INKS)).toHaveLength(6);
  });

  it('should have all expected inks', () => {
    const expectedInks: LorcanaInk[] = [
      'Amber',
      'Amethyst',
      'Emerald',
      'Ruby',
      'Sapphire',
      'Steel',
    ];
    for (const ink of expectedInks) {
      expect(LORCANA_INKS[ink]).toBeDefined();
      expect(LORCANA_INKS[ink].name).toBe(ink);
      expect(LORCANA_INKS[ink].hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('LORCANA_RARITIES', () => {
  it('should have all 7 rarities', () => {
    expect(Object.keys(LORCANA_RARITIES)).toHaveLength(7);
  });

  it('should have ascending sort orders', () => {
    const rarities: LorcanaRarity[] = [
      'Common',
      'Uncommon',
      'Rare',
      'Super_rare',
      'Legendary',
      'Enchanted',
      'Promo',
    ];
    let lastOrder = 0;
    for (const rarity of rarities) {
      expect(LORCANA_RARITIES[rarity].sortOrder).toBeGreaterThan(lastOrder);
      lastOrder = LORCANA_RARITIES[rarity].sortOrder;
    }
  });

  it('should have display names', () => {
    expect(LORCANA_RARITIES['Super_rare'].name).toBe('Super Rare');
  });
});

describe('LORCANA_CARD_TYPES', () => {
  it('should have all 5 card types', () => {
    expect(Object.keys(LORCANA_CARD_TYPES)).toHaveLength(5);
  });

  it('should have all expected types', () => {
    const expectedTypes: LorcanaCardType[] = ['Action', 'Character', 'Item', 'Location', 'Song'];
    for (const type of expectedTypes) {
      expect(LORCANA_CARD_TYPES[type]).toBeDefined();
      expect(LORCANA_CARD_TYPES[type].name).toBe(type);
      expect(LORCANA_CARD_TYPES[type].description).toBeTruthy();
    }
  });
});

// =============================================================================
// CARD ID FUNCTIONS
// =============================================================================

describe('getCardDexId', () => {
  it('should generate correct ID format', () => {
    const card = createMockCard();
    expect(getCardDexId(card)).toBe('lorcana-1-42');
  });

  it('should handle different set codes', () => {
    const card = createMockCard({
      set: { id: 'set_456', code: 'D100', name: 'Disney 100' },
      collector_number: '123',
    });
    expect(getCardDexId(card)).toBe('lorcana-D100-123');
  });
});

describe('parseCardDexId', () => {
  it('should parse valid ID', () => {
    const result = parseCardDexId('lorcana-1-42');
    expect(result).toEqual({ setCode: '1', collectorNumber: '42' });
  });

  it('should handle multi-part collector numbers', () => {
    const result = parseCardDexId('lorcana-D100-42-P');
    expect(result).toEqual({ setCode: 'D100', collectorNumber: '42-P' });
  });

  it('should return null for invalid ID', () => {
    expect(parseCardDexId('invalid-id')).toBeNull();
    expect(parseCardDexId('pokemon-1-42')).toBeNull();
  });

  it('should return null for incomplete ID', () => {
    expect(parseCardDexId('lorcana-')).toBeNull();
  });
});

// =============================================================================
// CARD TYPE CHECKS
// =============================================================================

describe('card type checks', () => {
  it('isCharacterCard should detect character cards', () => {
    expect(isCharacterCard(createMockCard({ type: ['Character'] }))).toBe(true);
    expect(isCharacterCard(createMockCard({ type: ['Action'] }))).toBe(false);
  });

  it('isActionCard should detect action cards', () => {
    expect(isActionCard(createMockCard({ type: ['Action'] }))).toBe(true);
    expect(isActionCard(createMockCard({ type: ['Character'] }))).toBe(false);
  });

  it('isSongCard should detect song cards', () => {
    expect(isSongCard(createMockCard({ type: ['Action', 'Song'] }))).toBe(true);
    expect(isSongCard(createMockCard({ type: ['Action'] }))).toBe(false);
  });

  it('isItemCard should detect item cards', () => {
    expect(isItemCard(createMockCard({ type: ['Item'] }))).toBe(true);
    expect(isItemCard(createMockCard({ type: ['Character'] }))).toBe(false);
  });

  it('isLocationCard should detect location cards', () => {
    expect(isLocationCard(createMockCard({ type: ['Location'] }))).toBe(true);
    expect(isLocationCard(createMockCard({ type: ['Character'] }))).toBe(false);
  });
});

describe('isLandscapeCard', () => {
  it('should detect landscape layout', () => {
    expect(isLandscapeCard(createMockCard({ layout: 'landscape' }))).toBe(true);
    expect(isLandscapeCard(createMockCard({ layout: 'normal' }))).toBe(false);
  });
});

describe('isInkable', () => {
  it('should detect inkable cards', () => {
    expect(isInkable(createMockCard({ inkwell: true }))).toBe(true);
    expect(isInkable(createMockCard({ inkwell: false }))).toBe(false);
  });
});

describe('isFloodborn', () => {
  it('should detect Floodborn classification', () => {
    expect(isFloodborn(createMockCard({ classifications: ['Floodborn', 'Hero'] }))).toBe(true);
    expect(isFloodborn(createMockCard({ classifications: ['Hero', 'Queen'] }))).toBe(false);
  });

  it('should handle null classifications', () => {
    expect(isFloodborn(createMockCard({ classifications: null }))).toBe(false);
  });
});

describe('hasShift', () => {
  it('should detect Shift ability in text', () => {
    const withShift = createMockCard({
      text: 'Shift 3 (You may pay 3 ink to play this on top of one of your characters named Elsa.)',
    });
    expect(hasShift(withShift)).toBe(true);

    const withoutShift = createMockCard({ text: 'Some other ability text.' });
    expect(hasShift(withoutShift)).toBe(false);
  });
});

describe('hasSinger', () => {
  it('should detect Singer ability in text', () => {
    const withSinger = createMockCard({
      text: 'Singer 5 (This character counts as cost 5 to sing songs.)',
    });
    expect(hasSinger(withSinger)).toBe(true);

    const withoutSinger = createMockCard({ text: 'Some other ability text.' });
    expect(hasSinger(withoutSinger)).toBe(false);
  });
});

describe('isCoreLegal', () => {
  it('should check core format legality', () => {
    expect(isCoreLegal(createMockCard({ legalities: { core: 'legal' } }))).toBe(true);
    expect(isCoreLegal(createMockCard({ legalities: { core: 'not_legal' } }))).toBe(false);
    expect(isCoreLegal(createMockCard({ legalities: { core: 'banned' } }))).toBe(false);
  });
});

// =============================================================================
// IMAGE AND DISPLAY FUNCTIONS
// =============================================================================

describe('getCardImage', () => {
  it('should return normal size by default', () => {
    const card = createMockCard();
    expect(getCardImage(card)).toBe('https://example.com/normal.avif');
  });

  it('should return requested size', () => {
    const card = createMockCard();
    expect(getCardImage(card, 'small')).toBe('https://example.com/small.avif');
    expect(getCardImage(card, 'large')).toBe('https://example.com/large.avif');
  });
});

describe('getRarityDisplayName', () => {
  it('should return display name for known rarity', () => {
    expect(getRarityDisplayName('Super_rare')).toBe('Super Rare');
    expect(getRarityDisplayName('Legendary')).toBe('Legendary');
  });

  it('should return rarity as-is for unknown rarity', () => {
    expect(getRarityDisplayName('Unknown' as LorcanaRarity)).toBe('Unknown');
  });
});

describe('getTypeDisplayName', () => {
  it('should return display name for known type', () => {
    expect(getTypeDisplayName('Character')).toBe('Character');
    expect(getTypeDisplayName('Song')).toBe('Song');
  });
});

describe('getInkInfo', () => {
  it('should return ink info', () => {
    const info = getInkInfo('Sapphire');
    expect(info.name).toBe('Sapphire');
    expect(info.hex).toBe('#3498DB');
  });
});

// =============================================================================
// PRICE FUNCTIONS
// =============================================================================

describe('getMarketPrice', () => {
  it('should return USD price', () => {
    const card = createMockCard({ prices: { usd: '25.00', usd_foil: '75.00' } });
    expect(getMarketPrice(card)).toBe(25.0);
  });

  it('should return foil price when requested', () => {
    const card = createMockCard({ prices: { usd: '25.00', usd_foil: '75.00' } });
    expect(getMarketPrice(card, true)).toBe(75.0);
  });

  it('should return null for missing price', () => {
    const card = createMockCard({ prices: { usd: null, usd_foil: null } });
    expect(getMarketPrice(card)).toBeNull();
  });

  it('should return null for invalid price string', () => {
    const card = createMockCard({ prices: { usd: 'invalid', usd_foil: null } });
    expect(getMarketPrice(card)).toBeNull();
  });
});

// =============================================================================
// FORMAT FUNCTIONS
// =============================================================================

describe('formatCost', () => {
  it('should format cost as string', () => {
    expect(formatCost(4)).toBe('4');
    expect(formatCost(0)).toBe('0');
  });
});

describe('formatStrength', () => {
  it('should format strength as string', () => {
    expect(formatStrength(3)).toBe('3');
  });

  it('should return dash for null', () => {
    expect(formatStrength(null)).toBe('-');
  });
});

describe('formatWillpower', () => {
  it('should format willpower as string', () => {
    expect(formatWillpower(4)).toBe('4');
  });

  it('should return dash for null', () => {
    expect(formatWillpower(null)).toBe('-');
  });
});

describe('formatLore', () => {
  it('should format lore with diamond symbol', () => {
    expect(formatLore(2)).toBe('◆2');
  });

  it('should return dash for null', () => {
    expect(formatLore(null)).toBe('-');
  });
});

describe('getCardSummary', () => {
  it('should generate summary for character card', () => {
    const card = createMockCard();
    const summary = getCardSummary(card);
    expect(summary).toContain('Character');
    expect(summary).toContain('Sapphire');
    expect(summary).toContain('Cost: 4');
    expect(summary).toContain('3/4');
    expect(summary).toContain('◆2');
  });

  it('should handle card without stats', () => {
    const card = createMockCard({
      type: ['Action'],
      strength: null,
      willpower: null,
      lore: null,
    });
    const summary = getCardSummary(card);
    expect(summary).toContain('Action');
    expect(summary).toContain('Cost:');
    expect(summary).not.toContain('/');
    expect(summary).not.toContain('◆');
  });
});

describe('getFullCardName', () => {
  it('should combine name and version', () => {
    const card = createMockCard({ name: 'Elsa', version: 'Snow Queen' });
    expect(getFullCardName(card)).toBe('Elsa - Snow Queen');
  });

  it('should return name only when no version', () => {
    const card = createMockCard({ name: 'Let It Go', version: null });
    expect(getFullCardName(card)).toBe('Let It Go');
  });
});

// =============================================================================
// SORTING FUNCTIONS
// =============================================================================

describe('sortBySetAndNumber', () => {
  it('should sort by set code then collector number', () => {
    const cards = [
      createMockCard({
        set: { id: 's2', code: '2', name: 'Set 2' },
        collector_number: '10',
      }),
      createMockCard({
        set: { id: 's1', code: '1', name: 'Set 1' },
        collector_number: '5',
      }),
      createMockCard({
        set: { id: 's1', code: '1', name: 'Set 1' },
        collector_number: '15',
      }),
    ];

    const sorted = sortBySetAndNumber(cards);
    expect(sorted[0].set.code).toBe('1');
    expect(sorted[0].collector_number).toBe('5');
    expect(sorted[1].set.code).toBe('1');
    expect(sorted[1].collector_number).toBe('15');
    expect(sorted[2].set.code).toBe('2');
  });

  it('should not mutate original array', () => {
    const cards = [
      createMockCard({ collector_number: '10' }),
      createMockCard({ collector_number: '5' }),
    ];
    const original = [...cards];
    sortBySetAndNumber(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByRarity', () => {
  it('should sort by rarity (highest first)', () => {
    const cards = [
      createMockCard({ rarity: 'Common' }),
      createMockCard({ rarity: 'Legendary' }),
      createMockCard({ rarity: 'Rare' }),
    ];

    const sorted = sortByRarity(cards);
    expect(sorted[0].rarity).toBe('Legendary');
    expect(sorted[1].rarity).toBe('Rare');
    expect(sorted[2].rarity).toBe('Common');
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ rarity: 'Common' }), createMockCard({ rarity: 'Legendary' })];
    const original = [...cards];
    sortByRarity(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByCost', () => {
  it('should sort by cost (lowest first)', () => {
    const cards = [
      createMockCard({ cost: 5 }),
      createMockCard({ cost: 2 }),
      createMockCard({ cost: 3 }),
    ];

    const sorted = sortByCost(cards);
    expect(sorted[0].cost).toBe(2);
    expect(sorted[1].cost).toBe(3);
    expect(sorted[2].cost).toBe(5);
  });
});

describe('sortByStrength', () => {
  it('should sort by strength (highest first)', () => {
    const cards = [
      createMockCard({ strength: 2 }),
      createMockCard({ strength: 5 }),
      createMockCard({ strength: 3 }),
    ];

    const sorted = sortByStrength(cards);
    expect(sorted[0].strength).toBe(5);
    expect(sorted[1].strength).toBe(3);
    expect(sorted[2].strength).toBe(2);
  });

  it('should handle null strength', () => {
    const cards = [createMockCard({ strength: 3 }), createMockCard({ strength: null })];

    const sorted = sortByStrength(cards);
    expect(sorted[0].strength).toBe(3);
    expect(sorted[1].strength).toBeNull();
  });
});

describe('sortByLore', () => {
  it('should sort by lore (highest first)', () => {
    const cards = [
      createMockCard({ lore: 1 }),
      createMockCard({ lore: 3 }),
      createMockCard({ lore: 2 }),
    ];

    const sorted = sortByLore(cards);
    expect(sorted[0].lore).toBe(3);
    expect(sorted[1].lore).toBe(2);
    expect(sorted[2].lore).toBe(1);
  });
});

// =============================================================================
// FILTER FUNCTIONS
// =============================================================================

describe('filterByInk', () => {
  it('should filter cards by ink color', () => {
    const cards = [
      createMockCard({ ink: 'Sapphire' }),
      createMockCard({ ink: 'Ruby' }),
      createMockCard({ ink: 'Sapphire' }),
    ];

    const filtered = filterByInk(cards, 'Sapphire');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((c) => c.ink === 'Sapphire')).toBe(true);
  });

  it('should return empty array when no matches', () => {
    const cards = [createMockCard({ ink: 'Sapphire' }), createMockCard({ ink: 'Ruby' })];

    const filtered = filterByInk(cards, 'Emerald');
    expect(filtered).toHaveLength(0);
  });
});

describe('filterByClassification', () => {
  it('should filter cards by classification', () => {
    const cards = [
      createMockCard({ classifications: ['Floodborn', 'Hero'] }),
      createMockCard({ classifications: ['Hero', 'Prince'] }),
      createMockCard({ classifications: ['Villain'] }),
    ];

    const filtered = filterByClassification(cards, 'Hero');
    expect(filtered).toHaveLength(2);
  });

  it('should be case-insensitive', () => {
    const cards = [createMockCard({ classifications: ['Floodborn', 'Hero'] })];

    const filtered = filterByClassification(cards, 'hero');
    expect(filtered).toHaveLength(1);
  });

  it('should handle null classifications', () => {
    const cards = [
      createMockCard({ classifications: ['Hero'] }),
      createMockCard({ classifications: null }),
    ];

    const filtered = filterByClassification(cards, 'Hero');
    expect(filtered).toHaveLength(1);
  });
});

// =============================================================================
// UNIQUE VALUE FUNCTIONS
// =============================================================================

describe('getUniqueInks', () => {
  it('should return unique ink colors', () => {
    const cards = [
      createMockCard({ ink: 'Sapphire' }),
      createMockCard({ ink: 'Ruby' }),
      createMockCard({ ink: 'Sapphire' }),
      createMockCard({ ink: null }),
    ];

    const inks = getUniqueInks(cards);
    expect(inks).toHaveLength(2);
    expect(inks).toContain('Sapphire');
    expect(inks).toContain('Ruby');
  });

  it('should return sorted array', () => {
    const cards = [
      createMockCard({ ink: 'Steel' }),
      createMockCard({ ink: 'Amber' }),
      createMockCard({ ink: 'Ruby' }),
    ];

    const inks = getUniqueInks(cards);
    expect(inks).toEqual(['Amber', 'Ruby', 'Steel']);
  });
});

describe('getUniqueClassifications', () => {
  it('should return unique classifications', () => {
    const cards = [
      createMockCard({ classifications: ['Floodborn', 'Hero'] }),
      createMockCard({ classifications: ['Hero', 'Queen'] }),
      createMockCard({ classifications: ['Villain'] }),
    ];

    const classifications = getUniqueClassifications(cards);
    expect(classifications).toHaveLength(4);
    expect(classifications).toContain('Floodborn');
    expect(classifications).toContain('Hero');
    expect(classifications).toContain('Queen');
    expect(classifications).toContain('Villain');
  });

  it('should handle null classifications', () => {
    const cards = [
      createMockCard({ classifications: ['Hero'] }),
      createMockCard({ classifications: null }),
    ];

    const classifications = getUniqueClassifications(cards);
    expect(classifications).toEqual(['Hero']);
  });
});

// =============================================================================
// DECK STATISTICS
// =============================================================================

describe('calculateDeckStats', () => {
  it('should calculate comprehensive deck statistics', () => {
    const cards = [
      createMockCard({ type: ['Character'], cost: 2, inkwell: true, ink: 'Sapphire' }),
      createMockCard({ type: ['Character'], cost: 4, inkwell: true, ink: 'Sapphire' }),
      createMockCard({ type: ['Action'], cost: 1, inkwell: false, ink: 'Sapphire' }),
      createMockCard({ type: ['Action', 'Song'], cost: 3, inkwell: true, ink: 'Ruby' }),
      createMockCard({ type: ['Item'], cost: 2, inkwell: true, ink: 'Ruby' }),
      createMockCard({ type: ['Location'], cost: 3, inkwell: false, ink: 'Emerald' }),
    ];

    const stats = calculateDeckStats(cards);
    expect(stats.totalCards).toBe(6);
    expect(stats.characters).toBe(2);
    expect(stats.actions).toBe(2); // Action and Song/Action
    expect(stats.songs).toBe(1);
    expect(stats.items).toBe(1);
    expect(stats.locations).toBe(1);
    expect(stats.avgCost).toBe(2.5); // (2+4+1+3+2+3)/6
    expect(stats.inkableCount).toBe(4);
    expect(stats.inks).toContain('Sapphire');
    expect(stats.inks).toContain('Ruby');
    expect(stats.inks).toContain('Emerald');
  });

  it('should handle empty array', () => {
    const stats = calculateDeckStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.avgCost).toBe(0);
    expect(stats.inks).toEqual([]);
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Integration scenarios', () => {
  describe('Card display preparation', () => {
    it('should prepare card data for display', () => {
      const card = createMockCard();

      // Get all display values
      const fullName = getFullCardName(card);
      const image = getCardImage(card, 'large');
      const summary = getCardSummary(card);
      const price = getMarketPrice(card);
      const foilPrice = getMarketPrice(card, true);
      const dexId = getCardDexId(card);

      expect(fullName).toBe('Elsa - Snow Queen');
      expect(image).toBe('https://example.com/large.avif');
      expect(summary).toContain('Character');
      expect(price).toBe(25.0);
      expect(foilPrice).toBe(75.0);
      expect(dexId).toBe('lorcana-1-42');
    });
  });

  describe('Floodborn card detection', () => {
    it('should identify Floodborn cards with Shift', () => {
      const floodbornCard = createMockCard({
        classifications: ['Floodborn', 'Hero'],
        text: 'Shift 3 (You may pay 3 ink to play this on top of one of your characters named Elsa.)',
      });

      expect(isFloodborn(floodbornCard)).toBe(true);
      expect(hasShift(floodbornCard)).toBe(true);
    });

    it('should identify non-Floodborn characters', () => {
      const normalCard = createMockCard({
        classifications: ['Hero', 'Princess'],
        text: 'Some regular ability.',
      });

      expect(isFloodborn(normalCard)).toBe(false);
      expect(hasShift(normalCard)).toBe(false);
    });
  });

  describe('Song card mechanics', () => {
    it('should identify song cards and singers', () => {
      const songCard = createMockCard({
        type: ['Action', 'Song'],
        text: 'A character with cost 5 or more can sing this for free.',
      });

      const singerCard = createMockCard({
        type: ['Character'],
        text: 'Singer 5 (This character counts as cost 5 to sing songs.)',
      });

      expect(isSongCard(songCard)).toBe(true);
      expect(isSongCard(singerCard)).toBe(false);
      expect(hasSinger(singerCard)).toBe(true);
      expect(hasSinger(songCard)).toBe(false);
    });
  });

  describe('Collection filtering', () => {
    it('should filter and sort a collection', () => {
      const collection = [
        createMockCard({ ink: 'Sapphire', cost: 4, rarity: 'Rare' }),
        createMockCard({ ink: 'Sapphire', cost: 2, rarity: 'Legendary' }),
        createMockCard({ ink: 'Ruby', cost: 3, rarity: 'Common' }),
        createMockCard({ ink: 'Sapphire', cost: 1, rarity: 'Uncommon' }),
      ];

      // Filter to Sapphire cards
      const sapphireCards = filterByInk(collection, 'Sapphire');
      expect(sapphireCards).toHaveLength(3);

      // Sort by cost
      const sortedByCost = sortByCost(sapphireCards);
      expect(sortedByCost[0].cost).toBe(1);
      expect(sortedByCost[1].cost).toBe(2);
      expect(sortedByCost[2].cost).toBe(4);

      // Sort by rarity
      const sortedByRarity = sortByRarity(sapphireCards);
      expect(sortedByRarity[0].rarity).toBe('Legendary');
    });
  });

  describe('Deck building analysis', () => {
    it('should analyze a deck composition', () => {
      const deck = [
        // Sapphire characters
        createMockCard({ type: ['Character'], ink: 'Sapphire', cost: 2, inkwell: true }),
        createMockCard({ type: ['Character'], ink: 'Sapphire', cost: 3, inkwell: true }),
        createMockCard({ type: ['Character'], ink: 'Sapphire', cost: 4, inkwell: false }),
        // Ruby characters
        createMockCard({ type: ['Character'], ink: 'Ruby', cost: 3, inkwell: true }),
        createMockCard({ type: ['Character'], ink: 'Ruby', cost: 5, inkwell: true }),
        // Sapphire actions
        createMockCard({ type: ['Action'], ink: 'Sapphire', cost: 1, inkwell: true }),
        createMockCard({ type: ['Action', 'Song'], ink: 'Sapphire', cost: 3, inkwell: false }),
      ];

      const stats = calculateDeckStats(deck);

      expect(stats.totalCards).toBe(7);
      expect(stats.characters).toBe(5);
      expect(stats.actions).toBe(2);
      expect(stats.songs).toBe(1);
      expect(stats.inkableCount).toBe(5);
      expect(stats.inks).toHaveLength(2);
      expect(stats.inks).toContain('Sapphire');
      expect(stats.inks).toContain('Ruby');
    });
  });
});
