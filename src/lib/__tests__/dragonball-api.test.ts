/**
 * Unit tests for dragonball-api.ts
 * Tests helper functions and constants (API calls are not tested directly)
 */

import {
  // Constants
  DRAGONBALL_RARITIES,
  DRAGONBALL_COLORS,
  DRAGONBALL_CARD_TYPES,
  // Types
  type DragonBallCard,
  type DragonBallRarity,
  type DragonBallCardType,
  type DragonBallColor,
  // Helper functions
  extractSetCode,
  extractCardNumber,
  getCardDexId,
  parseCardDexId,
  getCardImage,
  isLeaderCard,
  isBattleCard,
  isExtraCard,
  isUnisonCard,
  isMultiColor,
  hasEffect,
  hasComboPower,
  hasFeatures,
  getColorInfo,
  getRarityDisplayName,
  getTypeDisplayName,
  formatCost,
  formatPower,
  formatComboPower,
  getCardSummary,
  sortBySetAndNumber,
  sortByRarity,
  sortByPower,
  sortByCost,
  filterByColor,
  filterByFeature,
  getUniqueFeatures,
  getUniqueColors,
  calculateDeckStats,
  extractSetsFromCards,
} from '../dragonball-api';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

function createMockCard(overrides: Partial<DragonBallCard> = {}): DragonBallCard {
  return {
    id: 'test-123',
    code: 'FB01-001',
    rarity: 'R',
    name: 'Son Goku',
    color: 'Red',
    cardType: 'Battle',
    cost: 3,
    specifiedCost: null,
    power: 15000,
    comboPower: 10000,
    features: ['Saiyan', 'Universe 7'],
    effect: 'When this card attacks, draw 1 card.',
    images: {
      small: 'https://example.com/small/FB01-001.png',
      large: 'https://example.com/large/FB01-001.png',
    },
    set: {
      name: 'Fusion Booster 01',
    },
    getIt: null,
    ...overrides,
  };
}

function createLeaderCard(overrides: Partial<DragonBallCard> = {}): DragonBallCard {
  return createMockCard({
    code: 'FB01-001',
    cardType: 'Leader',
    cost: null,
    comboPower: null,
    features: [],
    ...overrides,
  });
}

function createExtraCard(overrides: Partial<DragonBallCard> = {}): DragonBallCard {
  return createMockCard({
    code: 'FB01-050',
    cardType: 'Extra',
    power: null,
    comboPower: null,
    features: [],
    ...overrides,
  });
}

function createUnisonCard(overrides: Partial<DragonBallCard> = {}): DragonBallCard {
  return createMockCard({
    code: 'FB01-070',
    cardType: 'Unison',
    ...overrides,
  });
}

// =============================================================================
// CONSTANT VALIDATION TESTS
// =============================================================================

describe('DRAGONBALL_RARITIES', () => {
  it('should have all expected rarities', () => {
    const expectedRarities: DragonBallRarity[] = ['C', 'UC', 'R', 'SR', 'SCR', 'SPR', 'PR'];
    expect(Object.keys(DRAGONBALL_RARITIES)).toHaveLength(expectedRarities.length);
    for (const rarity of expectedRarities) {
      expect(DRAGONBALL_RARITIES[rarity]).toBeDefined();
    }
  });

  it('should have unique sort orders', () => {
    const sortOrders = Object.values(DRAGONBALL_RARITIES).map((r) => r.sortOrder);
    const uniqueSortOrders = new Set(sortOrders);
    expect(uniqueSortOrders.size).toBe(sortOrders.length);
  });

  it('should have ascending sort orders', () => {
    const sortOrders = Object.values(DRAGONBALL_RARITIES).map((r) => r.sortOrder);
    const sorted = [...sortOrders].sort((a, b) => a - b);
    expect(sortOrders).toEqual(sorted);
  });

  it('should have name for each rarity', () => {
    for (const rarity of Object.values(DRAGONBALL_RARITIES)) {
      expect(rarity.name).toBeTruthy();
      expect(typeof rarity.name).toBe('string');
    }
  });
});

describe('DRAGONBALL_COLORS', () => {
  it('should have all expected colors', () => {
    const expectedColors: DragonBallColor[] = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'Multi'];
    expect(Object.keys(DRAGONBALL_COLORS)).toHaveLength(expectedColors.length);
    for (const color of expectedColors) {
      expect(DRAGONBALL_COLORS[color]).toBeDefined();
    }
  });

  it('should have valid hex codes', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const color of Object.values(DRAGONBALL_COLORS)) {
      expect(color.hex).toMatch(hexRegex);
    }
  });

  it('should have name for each color', () => {
    for (const color of Object.values(DRAGONBALL_COLORS)) {
      expect(color.name).toBeTruthy();
      expect(typeof color.name).toBe('string');
    }
  });
});

describe('DRAGONBALL_CARD_TYPES', () => {
  it('should have all four card types', () => {
    const expectedTypes: DragonBallCardType[] = ['Leader', 'Battle', 'Extra', 'Unison'];
    expect(Object.keys(DRAGONBALL_CARD_TYPES)).toHaveLength(expectedTypes.length);
    for (const type of expectedTypes) {
      expect(DRAGONBALL_CARD_TYPES[type]).toBeDefined();
    }
  });

  it('should have name and description for each type', () => {
    for (const cardType of Object.values(DRAGONBALL_CARD_TYPES)) {
      expect(cardType.name).toBeTruthy();
      expect(cardType.description).toBeTruthy();
    }
  });
});

// =============================================================================
// EXTRACT FUNCTIONS TESTS
// =============================================================================

describe('extractSetCode', () => {
  it('should extract set code from card code', () => {
    expect(extractSetCode('FB01-001')).toBe('FB01');
    expect(extractSetCode('FB02-050')).toBe('FB02');
    expect(extractSetCode('FB10-100')).toBe('FB10');
  });

  it('should handle uppercase conversion', () => {
    expect(extractSetCode('fb01-001')).toBe('FB01');
    expect(extractSetCode('Fb02-050')).toBe('FB02');
  });

  it('should return original if no match', () => {
    expect(extractSetCode('invalid')).toBe('invalid');
  });
});

describe('extractCardNumber', () => {
  it('should extract card number portion', () => {
    expect(extractCardNumber('FB01-001')).toBe('001');
    expect(extractCardNumber('FB02-050')).toBe('050');
    expect(extractCardNumber('FB10-100')).toBe('100');
  });

  it('should return full string if no dash', () => {
    expect(extractCardNumber('FB01001')).toBe('FB01001');
  });
});

// =============================================================================
// CARD ID FUNCTIONS TESTS
// =============================================================================

describe('getCardDexId', () => {
  it('should generate dragonball-prefixed ID', () => {
    const card = createMockCard({ code: 'FB01-001' });
    expect(getCardDexId(card)).toBe('dragonball-FB01-001');
  });

  it('should handle various card codes', () => {
    expect(getCardDexId(createMockCard({ code: 'FB02-050' }))).toBe('dragonball-FB02-050');
    expect(getCardDexId(createMockCard({ code: 'PR-001' }))).toBe('dragonball-PR-001');
  });
});

describe('parseCardDexId', () => {
  it('should parse valid dragonball CardDex IDs', () => {
    expect(parseCardDexId('dragonball-FB01-001')).toBe('FB01-001');
    expect(parseCardDexId('dragonball-FB02-050')).toBe('FB02-050');
    expect(parseCardDexId('dragonball-PR-001')).toBe('PR-001');
  });

  it('should return null for invalid IDs', () => {
    expect(parseCardDexId('pokemon-FB01-001')).toBeNull();
    expect(parseCardDexId('FB01-001')).toBeNull();
    expect(parseCardDexId('')).toBeNull();
  });
});

describe('getCardImage', () => {
  it('should return large image by default', () => {
    const card = createMockCard();
    expect(getCardImage(card)).toBe(card.images.large);
  });

  it('should return small image when specified', () => {
    const card = createMockCard();
    expect(getCardImage(card, 'small')).toBe(card.images.small);
  });

  it('should return large image when specified', () => {
    const card = createMockCard();
    expect(getCardImage(card, 'large')).toBe(card.images.large);
  });
});

// =============================================================================
// CARD TYPE CHECKING TESTS
// =============================================================================

describe('isLeaderCard', () => {
  it('should return true for Leader cards', () => {
    expect(isLeaderCard(createLeaderCard())).toBe(true);
  });

  it('should return false for non-Leader cards', () => {
    expect(isLeaderCard(createMockCard())).toBe(false);
    expect(isLeaderCard(createExtraCard())).toBe(false);
    expect(isLeaderCard(createUnisonCard())).toBe(false);
  });
});

describe('isBattleCard', () => {
  it('should return true for Battle cards', () => {
    expect(isBattleCard(createMockCard())).toBe(true);
  });

  it('should return false for non-Battle cards', () => {
    expect(isBattleCard(createLeaderCard())).toBe(false);
    expect(isBattleCard(createExtraCard())).toBe(false);
  });
});

describe('isExtraCard', () => {
  it('should return true for Extra cards', () => {
    expect(isExtraCard(createExtraCard())).toBe(true);
  });

  it('should return false for non-Extra cards', () => {
    expect(isExtraCard(createMockCard())).toBe(false);
    expect(isExtraCard(createLeaderCard())).toBe(false);
  });
});

describe('isUnisonCard', () => {
  it('should return true for Unison cards', () => {
    expect(isUnisonCard(createUnisonCard())).toBe(true);
  });

  it('should return false for non-Unison cards', () => {
    expect(isUnisonCard(createMockCard())).toBe(false);
    expect(isUnisonCard(createExtraCard())).toBe(false);
  });
});

// =============================================================================
// PROPERTY CHECKING TESTS
// =============================================================================

describe('isMultiColor', () => {
  it('should return true for Multi color cards', () => {
    expect(isMultiColor(createMockCard({ color: 'Multi' }))).toBe(true);
  });

  it('should return false for single color cards', () => {
    expect(isMultiColor(createMockCard({ color: 'Red' }))).toBe(false);
    expect(isMultiColor(createMockCard({ color: 'Blue' }))).toBe(false);
  });
});

describe('hasEffect', () => {
  it('should return true for cards with effect', () => {
    expect(hasEffect(createMockCard({ effect: 'Draw 1 card.' }))).toBe(true);
  });

  it('should return false for cards without effect', () => {
    expect(hasEffect(createMockCard({ effect: null }))).toBe(false);
    expect(hasEffect(createMockCard({ effect: '' }))).toBe(false);
  });
});

describe('hasComboPower', () => {
  it('should return true for cards with combo power', () => {
    expect(hasComboPower(createMockCard({ comboPower: 10000 }))).toBe(true);
  });

  it('should return false for cards without combo power', () => {
    expect(hasComboPower(createMockCard({ comboPower: null }))).toBe(false);
    expect(hasComboPower(createMockCard({ comboPower: 0 }))).toBe(false);
  });
});

describe('hasFeatures', () => {
  it('should return true for cards with features', () => {
    expect(hasFeatures(createMockCard({ features: ['Saiyan'] }))).toBe(true);
  });

  it('should return false for cards without features', () => {
    expect(hasFeatures(createMockCard({ features: [] }))).toBe(false);
  });
});

// =============================================================================
// DISPLAY FUNCTIONS TESTS
// =============================================================================

describe('getColorInfo', () => {
  it('should return color info for valid colors', () => {
    const redInfo = getColorInfo('Red');
    expect(redInfo.name).toBe('Red');
    expect(redInfo.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should handle all valid colors', () => {
    const colors: DragonBallColor[] = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'Multi'];
    for (const color of colors) {
      const info = getColorInfo(color);
      expect(info.name).toBeTruthy();
      expect(info.hex).toBeTruthy();
    }
  });
});

describe('getRarityDisplayName', () => {
  it('should return display name for valid rarities', () => {
    expect(getRarityDisplayName('C')).toBe('Common');
    expect(getRarityDisplayName('UC')).toBe('Uncommon');
    expect(getRarityDisplayName('R')).toBe('Rare');
    expect(getRarityDisplayName('SR')).toBe('Super Rare');
    expect(getRarityDisplayName('SCR')).toBe('Secret Rare');
    expect(getRarityDisplayName('SPR')).toBe('Special Rare');
    expect(getRarityDisplayName('PR')).toBe('Promo');
  });
});

describe('getTypeDisplayName', () => {
  it('should return display name for card types', () => {
    expect(getTypeDisplayName('Leader')).toBe('Leader');
    expect(getTypeDisplayName('Battle')).toBe('Battle');
    expect(getTypeDisplayName('Extra')).toBe('Extra');
    expect(getTypeDisplayName('Unison')).toBe('Unison');
  });
});

// =============================================================================
// FORMATTING FUNCTIONS TESTS
// =============================================================================

describe('formatCost', () => {
  it('should format numeric costs', () => {
    expect(formatCost(3)).toBe('3');
    expect(formatCost(10)).toBe('10');
    expect(formatCost(0)).toBe('0');
  });

  it('should return dash for null', () => {
    expect(formatCost(null)).toBe('-');
  });
});

describe('formatPower', () => {
  it('should format power values', () => {
    expect(formatPower(15000)).toBe('15000');
    expect(formatPower(20000)).toBe('20000');
  });

  it('should return dash for null', () => {
    expect(formatPower(null)).toBe('-');
  });
});

describe('formatComboPower', () => {
  it('should format combo power with plus sign', () => {
    expect(formatComboPower(10000)).toBe('+10000');
    expect(formatComboPower(5000)).toBe('+5000');
  });

  it('should return dash for null', () => {
    expect(formatComboPower(null)).toBe('-');
  });
});

describe('getCardSummary', () => {
  it('should generate summary for Battle cards', () => {
    const card = createMockCard({
      cardType: 'Battle',
      color: 'Red',
      cost: 3,
      power: 15000,
      comboPower: 10000,
    });
    const summary = getCardSummary(card);
    expect(summary).toContain('Battle');
    expect(summary).toContain('Red');
    expect(summary).toContain('Cost: 3');
    expect(summary).toContain('Power: 15000');
    expect(summary).toContain('Combo: +10000');
  });

  it('should handle Leader cards without cost', () => {
    const card = createLeaderCard();
    const summary = getCardSummary(card);
    expect(summary).toContain('Leader');
    expect(summary).not.toContain('Cost:');
  });

  it('should handle Extra cards without power/combo', () => {
    const card = createExtraCard();
    const summary = getCardSummary(card);
    expect(summary).toContain('Extra');
    expect(summary).not.toContain('Power:');
    expect(summary).not.toContain('Combo:');
  });
});

// =============================================================================
// SORTING FUNCTIONS TESTS
// =============================================================================

describe('sortBySetAndNumber', () => {
  it('should sort by set code then card number', () => {
    const cards = [
      createMockCard({ code: 'FB02-001' }),
      createMockCard({ code: 'FB01-050' }),
      createMockCard({ code: 'FB01-001' }),
    ];
    const sorted = sortBySetAndNumber(cards);
    expect(sorted[0].code).toBe('FB01-001');
    expect(sorted[1].code).toBe('FB01-050');
    expect(sorted[2].code).toBe('FB02-001');
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ code: 'FB02-001' }), createMockCard({ code: 'FB01-001' })];
    const original = [...cards];
    sortBySetAndNumber(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByRarity', () => {
  it('should sort by rarity (highest first)', () => {
    const cards = [
      createMockCard({ rarity: 'C' }),
      createMockCard({ rarity: 'SR' }),
      createMockCard({ rarity: 'R' }),
    ];
    const sorted = sortByRarity(cards);
    expect(sorted[0].rarity).toBe('SR');
    expect(sorted[1].rarity).toBe('R');
    expect(sorted[2].rarity).toBe('C');
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ rarity: 'C' }), createMockCard({ rarity: 'SR' })];
    const original = [...cards];
    sortByRarity(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByPower', () => {
  it('should sort by power (highest first)', () => {
    const cards = [
      createMockCard({ power: 10000 }),
      createMockCard({ power: 25000 }),
      createMockCard({ power: 15000 }),
    ];
    const sorted = sortByPower(cards);
    expect(sorted[0].power).toBe(25000);
    expect(sorted[1].power).toBe(15000);
    expect(sorted[2].power).toBe(10000);
  });

  it('should handle null power', () => {
    const cards = [createExtraCard(), createMockCard({ power: 15000 })];
    const sorted = sortByPower(cards);
    expect(sorted[0].power).toBe(15000);
    expect(sorted[1].power).toBeNull();
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

  it('should handle null cost', () => {
    const cards = [createLeaderCard(), createMockCard({ cost: 3 })];
    const sorted = sortByCost(cards);
    expect(sorted[0].cost).toBe(3);
    expect(sorted[1].cost).toBeNull();
  });
});

// =============================================================================
// FILTERING FUNCTIONS TESTS
// =============================================================================

describe('filterByColor', () => {
  it('should filter by color', () => {
    const cards = [
      createMockCard({ color: 'Red' }),
      createMockCard({ color: 'Blue' }),
      createMockCard({ color: 'Red' }),
    ];
    const redCards = filterByColor(cards, 'Red');
    expect(redCards).toHaveLength(2);
    expect(redCards.every((c) => c.color === 'Red')).toBe(true);
  });
});

describe('filterByFeature', () => {
  it('should filter by feature (case insensitive)', () => {
    const cards = [
      createMockCard({ features: ['Saiyan', 'Universe 7'] }),
      createMockCard({ features: ['Android'] }),
      createMockCard({ features: ['Saiyan'] }),
    ];
    const saiyans = filterByFeature(cards, 'saiyan');
    expect(saiyans).toHaveLength(2);
  });

  it('should handle partial matches', () => {
    const cards = [createMockCard({ features: ['Universe 7'] })];
    expect(filterByFeature(cards, 'Universe')).toHaveLength(1);
  });
});

// =============================================================================
// UNIQUE VALUE FUNCTIONS TESTS
// =============================================================================

describe('getUniqueFeatures', () => {
  it('should return unique features from cards', () => {
    const cards = [
      createMockCard({ features: ['Saiyan', 'Universe 7'] }),
      createMockCard({ features: ['Saiyan', 'Android'] }),
    ];
    const features = getUniqueFeatures(cards);
    expect(features).toContain('Saiyan');
    expect(features).toContain('Universe 7');
    expect(features).toContain('Android');
    expect(features).toHaveLength(3);
  });

  it('should return sorted features', () => {
    const cards = [
      createMockCard({ features: ['Zebra', 'Alpha'] }),
      createMockCard({ features: ['Beta'] }),
    ];
    const features = getUniqueFeatures(cards);
    expect(features).toEqual(['Alpha', 'Beta', 'Zebra']);
  });
});

describe('getUniqueColors', () => {
  it('should return unique colors from cards', () => {
    const cards = [
      createMockCard({ color: 'Red' }),
      createMockCard({ color: 'Blue' }),
      createMockCard({ color: 'Red' }),
    ];
    const colors = getUniqueColors(cards);
    expect(colors).toContain('Red');
    expect(colors).toContain('Blue');
    expect(colors).toHaveLength(2);
  });
});

// =============================================================================
// DECK STATISTICS TESTS
// =============================================================================

describe('calculateDeckStats', () => {
  it('should calculate deck statistics', () => {
    const cards = [
      createLeaderCard(),
      createMockCard({ cost: 3, power: 15000 }),
      createMockCard({ cost: 5, power: 20000 }),
      createExtraCard({ cost: 2 }),
      createUnisonCard({ cost: 4, power: 10000 }),
    ];

    const stats = calculateDeckStats(cards);
    expect(stats.totalCards).toBe(5);
    expect(stats.leaders).toBe(1);
    expect(stats.battles).toBe(2);
    expect(stats.extras).toBe(1);
    expect(stats.unisons).toBe(1);
    expect(stats.avgCost).toBeGreaterThan(0);
    expect(stats.avgPower).toBeGreaterThan(0);
    expect(stats.colors).toContain('Red');
  });

  it('should handle empty deck', () => {
    const stats = calculateDeckStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.leaders).toBe(0);
    expect(stats.avgCost).toBe(0);
    expect(stats.avgPower).toBe(0);
  });
});

// =============================================================================
// SET EXTRACTION TESTS
// =============================================================================

describe('extractSetsFromCards', () => {
  it('should extract unique sets from cards', () => {
    const cards = [
      createMockCard({ code: 'FB01-001', set: { name: 'Fusion Booster 01' } }),
      createMockCard({ code: 'FB01-002', set: { name: 'Fusion Booster 01' } }),
      createMockCard({ code: 'FB02-001', set: { name: 'Fusion Booster 02' } }),
    ];

    const sets = extractSetsFromCards(cards);
    expect(sets).toHaveLength(2);
    expect(sets.find((s) => s.code === 'FB01')?.cardCount).toBe(2);
    expect(sets.find((s) => s.code === 'FB02')?.cardCount).toBe(1);
  });

  it('should handle empty card list', () => {
    const sets = extractSetsFromCards([]);
    expect(sets).toHaveLength(0);
  });

  it('should sort sets by code', () => {
    const cards = [
      createMockCard({ code: 'FB02-001', set: { name: 'Fusion Booster 02' } }),
      createMockCard({ code: 'FB01-001', set: { name: 'Fusion Booster 01' } }),
    ];

    const sets = extractSetsFromCards(cards);
    expect(sets[0].code).toBe('FB01');
    expect(sets[1].code).toBe('FB02');
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Integration: Building a deck view', () => {
  it('should prepare cards for deck display', () => {
    const deckCards = [
      createLeaderCard(),
      createMockCard({ cost: 2 }),
      createMockCard({ cost: 3 }),
      createMockCard({ cost: 4 }),
      createExtraCard({ cost: 1 }),
    ];

    // Sort by cost for mana curve display
    const sortedCards = sortByCost(deckCards);
    expect(sortedCards[0].cost).toBe(1);

    // Calculate stats
    const stats = calculateDeckStats(deckCards);
    expect(stats.totalCards).toBe(5);
    expect(stats.leaders).toBe(1);
    expect(stats.battles).toBe(3);

    // Get unique colors for color distribution
    const colors = getUniqueColors(deckCards);
    expect(colors.length).toBeGreaterThan(0);
  });
});

describe('Integration: Card search and display', () => {
  it('should prepare card for display', () => {
    const card = createMockCard();

    // Get display info
    const summary = getCardSummary(card);
    expect(summary).toContain('Battle');

    // Get CardDex ID for tracking
    const dexId = getCardDexId(card);
    expect(dexId).toMatch(/^dragonball-/);

    // Parse back if needed
    const cardCode = parseCardDexId(dexId);
    expect(cardCode).toBe(card.code);

    // Get image URL
    const imageUrl = getCardImage(card);
    expect(imageUrl).toBeTruthy();
  });
});

describe('Integration: Collection filtering', () => {
  it('should filter collection by multiple criteria', () => {
    const collection = [
      createMockCard({ color: 'Red', features: ['Saiyan'], rarity: 'R' }),
      createMockCard({ color: 'Red', features: ['Android'], rarity: 'UC' }),
      createMockCard({ color: 'Blue', features: ['Saiyan'], rarity: 'SR' }),
      createExtraCard({ color: 'Red' }),
      createLeaderCard({ color: 'Red' }),
    ];

    // Filter to Red cards only
    let filtered = filterByColor(collection, 'Red');
    expect(filtered).toHaveLength(4);

    // Filter to Saiyans only
    const saiyans = filterByFeature(collection, 'Saiyan');
    expect(saiyans).toHaveLength(2);

    // Sort by rarity
    const byRarity = sortByRarity(saiyans);
    expect(byRarity[0].rarity).toBe('SR');
  });
});

describe('Integration: Feature analysis', () => {
  it('should analyze card features for deck building', () => {
    const cards = [
      createMockCard({ features: ['Saiyan', 'Universe 7'] }),
      createMockCard({ features: ['Saiyan', 'Super Saiyan'] }),
      createMockCard({ features: ['Frieza Army'] }),
      createMockCard({ features: ['Universe 7'] }),
    ];

    // Get all unique features
    const allFeatures = getUniqueFeatures(cards);
    expect(allFeatures).toContain('Saiyan');
    expect(allFeatures).toContain('Universe 7');
    expect(allFeatures).toContain('Super Saiyan');
    expect(allFeatures).toContain('Frieza Army');

    // Filter for Saiyan tribal
    const saiyans = filterByFeature(cards, 'Saiyan');
    expect(saiyans).toHaveLength(2);
  });
});
