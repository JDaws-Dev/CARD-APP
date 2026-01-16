/**
 * Unit tests for onepiece-api.ts
 * Tests helper functions and constants (API calls are not tested directly)
 */

import {
  // Constants
  ONEPIECE_RARITIES,
  ONEPIECE_COLORS,
  ONEPIECE_CARD_TYPES,
  ONEPIECE_ATTRIBUTES,
  // Types
  type OnePieceCard,
  type OnePieceRarity,
  type OnePieceCardType,
  type OnePieceColor,
  type OnePieceAttribute,
  // Helper functions
  extractSetCode,
  extractCardNumber,
  isLeaderCard,
  isCharacterCard,
  isEventCard,
  isStageCard,
  isDonCard,
  hasCounter,
  hasEffect,
  isMultiColor,
  getColorComponents,
  getCardClasses,
  getCardImage,
  getCardDexId,
  parseCardDexId,
  getRarityDisplayName,
  getTypeDisplayName,
  getAttributeDisplayName,
  getColorInfo,
  formatPower,
  formatCost,
  formatCounter,
  getCardSummary,
  sortBySetAndNumber,
  sortByRarity,
  sortByPower,
  sortByCost,
  filterByColor,
  filterByClass,
  getUniqueClasses,
  getUniqueColors,
  calculateDeckStats,
} from '../onepiece-api';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

function createMockCard(overrides: Partial<OnePieceCard> = {}): OnePieceCard {
  return {
    id: 'card_test123',
    code: 'OP01-001',
    rarity: 'R',
    type: 'CHARACTER',
    name: 'Monkey D. Luffy',
    cost: 3,
    attribute: 'Strike',
    power: 5000,
    counter: 1000,
    color: 'Red',
    class: 'Straw Hat Crew/Supernovas',
    effect: 'When this card attacks, draw 1 card.',
    set: 'Romance Dawn',
    image: 'https://example.com/op01-001.png',
    _tag: 'Card',
    ...overrides,
  };
}

function createLeaderCard(overrides: Partial<OnePieceCard> = {}): OnePieceCard {
  return createMockCard({
    code: 'OP01-001',
    type: 'LEADER',
    rarity: 'L',
    cost: null,
    counter: null,
    ...overrides,
  });
}

function createEventCard(overrides: Partial<OnePieceCard> = {}): OnePieceCard {
  return createMockCard({
    code: 'OP01-050',
    type: 'EVENT',
    power: null,
    counter: null,
    attribute: null,
    ...overrides,
  });
}

function createStageCard(overrides: Partial<OnePieceCard> = {}): OnePieceCard {
  return createMockCard({
    code: 'OP01-090',
    type: 'STAGE',
    power: null,
    counter: null,
    attribute: null,
    ...overrides,
  });
}

// =============================================================================
// CONSTANT VALIDATION TESTS
// =============================================================================

describe('ONEPIECE_RARITIES', () => {
  it('should have all expected rarities', () => {
    const expectedRarities: OnePieceRarity[] = ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'SP', 'P'];
    expect(Object.keys(ONEPIECE_RARITIES)).toHaveLength(expectedRarities.length);
    for (const rarity of expectedRarities) {
      expect(ONEPIECE_RARITIES[rarity]).toBeDefined();
    }
  });

  it('should have unique sort orders', () => {
    const sortOrders = Object.values(ONEPIECE_RARITIES).map((r) => r.sortOrder);
    const uniqueSortOrders = new Set(sortOrders);
    expect(uniqueSortOrders.size).toBe(sortOrders.length);
  });

  it('should have ascending sort orders', () => {
    const sortOrders = Object.values(ONEPIECE_RARITIES).map((r) => r.sortOrder);
    const sorted = [...sortOrders].sort((a, b) => a - b);
    expect(sortOrders).toEqual(sorted);
  });

  it('should have name for each rarity', () => {
    for (const rarity of Object.values(ONEPIECE_RARITIES)) {
      expect(rarity.name).toBeTruthy();
      expect(typeof rarity.name).toBe('string');
    }
  });
});

describe('ONEPIECE_COLORS', () => {
  it('should have all six main colors', () => {
    const expectedColors = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
    expect(Object.keys(ONEPIECE_COLORS)).toHaveLength(expectedColors.length);
    for (const color of expectedColors) {
      expect(ONEPIECE_COLORS[color]).toBeDefined();
    }
  });

  it('should have valid hex codes', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const color of Object.values(ONEPIECE_COLORS)) {
      expect(color.hex).toMatch(hexPattern);
    }
  });
});

describe('ONEPIECE_CARD_TYPES', () => {
  it('should have all card types', () => {
    const expectedTypes: OnePieceCardType[] = ['LEADER', 'CHARACTER', 'EVENT', 'STAGE', 'DON!!'];
    expect(Object.keys(ONEPIECE_CARD_TYPES)).toHaveLength(expectedTypes.length);
    for (const type of expectedTypes) {
      expect(ONEPIECE_CARD_TYPES[type]).toBeDefined();
    }
  });

  it('should have name and description for each type', () => {
    for (const cardType of Object.values(ONEPIECE_CARD_TYPES)) {
      expect(cardType.name).toBeTruthy();
      expect(cardType.description).toBeTruthy();
    }
  });
});

describe('ONEPIECE_ATTRIBUTES', () => {
  it('should have all attributes', () => {
    const expectedAttributes: OnePieceAttribute[] = [
      'Slash',
      'Ranged',
      'Strike',
      'Wisdom',
      'Special',
    ];
    expect(Object.keys(ONEPIECE_ATTRIBUTES)).toHaveLength(expectedAttributes.length);
    for (const attr of expectedAttributes) {
      expect(ONEPIECE_ATTRIBUTES[attr]).toBeDefined();
    }
  });

  it('should have name and icon for each attribute', () => {
    for (const attr of Object.values(ONEPIECE_ATTRIBUTES)) {
      expect(attr.name).toBeTruthy();
      expect(attr.icon).toBeTruthy();
    }
  });
});

// =============================================================================
// CODE EXTRACTION TESTS
// =============================================================================

describe('extractSetCode', () => {
  it('should extract set code from standard card codes', () => {
    expect(extractSetCode('OP01-001')).toBe('OP01');
    expect(extractSetCode('OP02-123')).toBe('OP02');
    expect(extractSetCode('EB01-001')).toBe('EB01');
    expect(extractSetCode('ST01-001')).toBe('ST01');
  });

  it('should handle different format codes', () => {
    expect(extractSetCode('OP01-001-P')).toBe('OP01');
    expect(extractSetCode('P-001')).toBe('P-001'); // No letter+number pattern, returns original
  });

  it('should convert to uppercase', () => {
    expect(extractSetCode('op01-001')).toBe('OP01');
    expect(extractSetCode('Op01-001')).toBe('OP01');
  });

  it('should return original code if no match', () => {
    expect(extractSetCode('INVALID')).toBe('INVALID');
  });
});

describe('extractCardNumber', () => {
  it('should extract card number from card codes', () => {
    expect(extractCardNumber('OP01-001')).toBe('001');
    expect(extractCardNumber('OP02-123')).toBe('123');
    expect(extractCardNumber('EB01-050')).toBe('050');
  });

  it('should return original if no separator', () => {
    expect(extractCardNumber('OP01')).toBe('OP01');
  });
});

// =============================================================================
// CARD TYPE CHECKING TESTS
// =============================================================================

describe('isLeaderCard', () => {
  it('should return true for leader cards', () => {
    const leader = createLeaderCard();
    expect(isLeaderCard(leader)).toBe(true);
  });

  it('should return false for non-leader cards', () => {
    const character = createMockCard({ type: 'CHARACTER' });
    expect(isLeaderCard(character)).toBe(false);
  });
});

describe('isCharacterCard', () => {
  it('should return true for character cards', () => {
    const character = createMockCard({ type: 'CHARACTER' });
    expect(isCharacterCard(character)).toBe(true);
  });

  it('should return false for non-character cards', () => {
    const leader = createLeaderCard();
    expect(isCharacterCard(leader)).toBe(false);
  });
});

describe('isEventCard', () => {
  it('should return true for event cards', () => {
    const event = createEventCard();
    expect(isEventCard(event)).toBe(true);
  });

  it('should return false for non-event cards', () => {
    const character = createMockCard();
    expect(isEventCard(character)).toBe(false);
  });
});

describe('isStageCard', () => {
  it('should return true for stage cards', () => {
    const stage = createStageCard();
    expect(isStageCard(stage)).toBe(true);
  });

  it('should return false for non-stage cards', () => {
    const character = createMockCard();
    expect(isStageCard(character)).toBe(false);
  });
});

describe('isDonCard', () => {
  it('should return true for DON!! cards', () => {
    const don = createMockCard({ type: 'DON!!' });
    expect(isDonCard(don)).toBe(true);
  });

  it('should return false for non-DON!! cards', () => {
    const character = createMockCard();
    expect(isDonCard(character)).toBe(false);
  });
});

// =============================================================================
// CARD PROPERTY CHECKING TESTS
// =============================================================================

describe('hasCounter', () => {
  it('should return true if card has a counter value', () => {
    const card = createMockCard({ counter: 1000 });
    expect(hasCounter(card)).toBe(true);
  });

  it('should return false if counter is null', () => {
    const card = createMockCard({ counter: null });
    expect(hasCounter(card)).toBe(false);
  });

  it('should return false if counter is 0', () => {
    const card = createMockCard({ counter: 0 });
    expect(hasCounter(card)).toBe(false);
  });
});

describe('hasEffect', () => {
  it('should return true if card has an effect', () => {
    const card = createMockCard({ effect: 'Some effect text' });
    expect(hasEffect(card)).toBe(true);
  });

  it('should return false if effect is null', () => {
    const card = createMockCard({ effect: null });
    expect(hasEffect(card)).toBe(false);
  });

  it('should return false if effect is empty string', () => {
    const card = createMockCard({ effect: '' });
    expect(hasEffect(card)).toBe(false);
  });
});

describe('isMultiColor', () => {
  it('should return true for multi-color cards', () => {
    const card = createMockCard({ color: 'Red/Green' });
    expect(isMultiColor(card)).toBe(true);
  });

  it('should return false for single color cards', () => {
    const card = createMockCard({ color: 'Red' });
    expect(isMultiColor(card)).toBe(false);
  });
});

describe('getColorComponents', () => {
  it('should return array of colors for multi-color cards', () => {
    const card = createMockCard({ color: 'Red/Green' });
    expect(getColorComponents(card)).toEqual(['Red', 'Green']);
  });

  it('should return single color in array for single color cards', () => {
    const card = createMockCard({ color: 'Blue' });
    expect(getColorComponents(card)).toEqual(['Blue']);
  });
});

describe('getCardClasses', () => {
  it('should return array of classes', () => {
    const card = createMockCard({ class: 'Straw Hat Crew/Supernovas' });
    expect(getCardClasses(card)).toEqual(['Straw Hat Crew', 'Supernovas']);
  });

  it('should return empty array if no class', () => {
    const card = createMockCard({ class: '' });
    expect(getCardClasses(card)).toEqual([]);
  });

  it('should handle single class', () => {
    const card = createMockCard({ class: 'Navy' });
    expect(getCardClasses(card)).toEqual(['Navy']);
  });
});

// =============================================================================
// IMAGE AND ID TESTS
// =============================================================================

describe('getCardImage', () => {
  it('should return the image URL', () => {
    const card = createMockCard({ image: 'https://example.com/card.png' });
    expect(getCardImage(card)).toBe('https://example.com/card.png');
  });
});

describe('getCardDexId', () => {
  it('should return prefixed card code', () => {
    const card = createMockCard({ code: 'OP01-001' });
    expect(getCardDexId(card)).toBe('optcg-OP01-001');
  });
});

describe('parseCardDexId', () => {
  it('should parse valid dex ID', () => {
    expect(parseCardDexId('optcg-OP01-001')).toBe('OP01-001');
  });

  it('should return null for invalid prefix', () => {
    expect(parseCardDexId('ygo-12345')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseCardDexId('')).toBeNull();
  });
});

// =============================================================================
// DISPLAY NAME TESTS
// =============================================================================

describe('getRarityDisplayName', () => {
  it('should return display name for known rarities', () => {
    expect(getRarityDisplayName('R')).toBe('Rare');
    expect(getRarityDisplayName('SR')).toBe('Super Rare');
    expect(getRarityDisplayName('SEC')).toBe('Secret Rare');
    expect(getRarityDisplayName('L')).toBe('Leader');
  });

  it('should return original for unknown rarity', () => {
    expect(getRarityDisplayName('UNKNOWN' as OnePieceRarity)).toBe('UNKNOWN');
  });
});

describe('getTypeDisplayName', () => {
  it('should return display name for known types', () => {
    expect(getTypeDisplayName('LEADER')).toBe('Leader');
    expect(getTypeDisplayName('CHARACTER')).toBe('Character');
    expect(getTypeDisplayName('EVENT')).toBe('Event');
    expect(getTypeDisplayName('STAGE')).toBe('Stage');
    expect(getTypeDisplayName('DON!!')).toBe('DON!!');
  });

  it('should return original for unknown type', () => {
    expect(getTypeDisplayName('UNKNOWN' as OnePieceCardType)).toBe('UNKNOWN');
  });
});

describe('getAttributeDisplayName', () => {
  it('should return display name for known attributes', () => {
    expect(getAttributeDisplayName('Strike')).toBe('Strike');
    expect(getAttributeDisplayName('Slash')).toBe('Slash');
    expect(getAttributeDisplayName('Ranged')).toBe('Ranged');
  });

  it('should return original for unknown attribute', () => {
    expect(getAttributeDisplayName('UNKNOWN' as OnePieceAttribute)).toBe('UNKNOWN');
  });
});

describe('getColorInfo', () => {
  it('should return color info for single colors', () => {
    const redInfo = getColorInfo('Red');
    expect(redInfo).toEqual({ name: 'Red', hex: '#E63946' });
  });

  it('should return primary color info for multi-colors', () => {
    const multiInfo = getColorInfo('Red/Green');
    expect(multiInfo).toEqual({ name: 'Red', hex: '#E63946' });
  });

  it('should return null for unknown colors', () => {
    expect(getColorInfo('Unknown')).toBeNull();
  });
});

// =============================================================================
// FORMATTING TESTS
// =============================================================================

describe('formatPower', () => {
  it('should format numeric power', () => {
    expect(formatPower(5000)).toBe('5000');
    expect(formatPower(0)).toBe('0');
  });

  it('should return dash for null', () => {
    expect(formatPower(null)).toBe('-');
  });
});

describe('formatCost', () => {
  it('should format numeric cost', () => {
    expect(formatCost(3)).toBe('3');
    expect(formatCost(0)).toBe('0');
  });

  it('should return dash for null', () => {
    expect(formatCost(null)).toBe('-');
  });
});

describe('formatCounter', () => {
  it('should format counter with plus sign', () => {
    expect(formatCounter(1000)).toBe('+1000');
    expect(formatCounter(2000)).toBe('+2000');
  });

  it('should return dash for null', () => {
    expect(formatCounter(null)).toBe('-');
  });
});

describe('getCardSummary', () => {
  it('should create summary for character card', () => {
    const card = createMockCard({
      type: 'CHARACTER',
      color: 'Red',
      cost: 3,
      power: 5000,
      counter: 1000,
    });
    const summary = getCardSummary(card);
    expect(summary).toContain('CHARACTER');
    expect(summary).toContain('Red');
    expect(summary).toContain('Cost: 3');
    expect(summary).toContain('Power: 5000');
    expect(summary).toContain('Counter: +1000');
  });

  it('should handle cards with null values', () => {
    const card = createEventCard();
    const summary = getCardSummary(card);
    expect(summary).toContain('EVENT');
    expect(summary).not.toContain('Power');
    expect(summary).not.toContain('Counter');
  });
});

// =============================================================================
// SORTING TESTS
// =============================================================================

describe('sortBySetAndNumber', () => {
  it('should sort by set code then card number', () => {
    const cards = [
      createMockCard({ code: 'OP02-001' }),
      createMockCard({ code: 'OP01-003' }),
      createMockCard({ code: 'OP01-001' }),
      createMockCard({ code: 'OP01-002' }),
    ];
    const sorted = sortBySetAndNumber(cards);
    expect(sorted.map((c) => c.code)).toEqual(['OP01-001', 'OP01-002', 'OP01-003', 'OP02-001']);
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ code: 'OP02-001' }), createMockCard({ code: 'OP01-001' })];
    const original = [...cards];
    sortBySetAndNumber(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByRarity', () => {
  it('should sort by rarity (highest first)', () => {
    const cards = [
      createMockCard({ rarity: 'C' }),
      createMockCard({ rarity: 'SEC' }),
      createMockCard({ rarity: 'R' }),
      createMockCard({ rarity: 'SR' }),
    ];
    const sorted = sortByRarity(cards);
    expect(sorted.map((c) => c.rarity)).toEqual(['SEC', 'SR', 'R', 'C']);
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
      createMockCard({ power: 3000 }),
      createMockCard({ power: 8000 }),
      createMockCard({ power: 5000 }),
    ];
    const sorted = sortByPower(cards);
    expect(sorted.map((c) => c.power)).toEqual([8000, 5000, 3000]);
  });

  it('should handle null power values', () => {
    const cards = [
      createMockCard({ power: 5000 }),
      createMockCard({ power: null }),
      createMockCard({ power: 3000 }),
    ];
    const sorted = sortByPower(cards);
    expect(sorted.map((c) => c.power)).toEqual([5000, 3000, null]);
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ power: 3000 }), createMockCard({ power: 5000 })];
    const original = [...cards];
    sortByPower(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByCost', () => {
  it('should sort by cost (lowest first)', () => {
    const cards = [
      createMockCard({ cost: 5 }),
      createMockCard({ cost: 1 }),
      createMockCard({ cost: 3 }),
    ];
    const sorted = sortByCost(cards);
    expect(sorted.map((c) => c.cost)).toEqual([1, 3, 5]);
  });

  it('should handle null cost values', () => {
    const cards = [
      createMockCard({ cost: null }),
      createMockCard({ cost: 3 }),
      createMockCard({ cost: 1 }),
    ];
    const sorted = sortByCost(cards);
    expect(sorted.map((c) => c.cost)).toEqual([1, 3, null]);
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ cost: 5 }), createMockCard({ cost: 1 })];
    const original = [...cards];
    sortByCost(cards);
    expect(cards).toEqual(original);
  });
});

// =============================================================================
// FILTERING TESTS
// =============================================================================

describe('filterByColor', () => {
  it('should filter by exact color match', () => {
    const cards = [
      createMockCard({ color: 'Red' }),
      createMockCard({ color: 'Blue' }),
      createMockCard({ color: 'Red/Green' }),
    ];
    const filtered = filterByColor(cards, 'Red');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((c) => c.color.includes('Red'))).toBe(true);
  });

  it('should be case insensitive', () => {
    const cards = [createMockCard({ color: 'Red' }), createMockCard({ color: 'Blue' })];
    const filtered = filterByColor(cards, 'red');
    expect(filtered).toHaveLength(1);
  });
});

describe('filterByClass', () => {
  it('should filter by class', () => {
    const cards = [
      createMockCard({ class: 'Straw Hat Crew' }),
      createMockCard({ class: 'Navy' }),
      createMockCard({ class: 'Straw Hat Crew/Supernovas' }),
    ];
    const filtered = filterByClass(cards, 'Straw Hat');
    expect(filtered).toHaveLength(2);
  });

  it('should be case insensitive', () => {
    const cards = [createMockCard({ class: 'Navy' }), createMockCard({ class: 'Marines' })];
    const filtered = filterByClass(cards, 'navy');
    expect(filtered).toHaveLength(1);
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('getUniqueClasses', () => {
  it('should return all unique classes', () => {
    const cards = [
      createMockCard({ class: 'Straw Hat Crew/Supernovas' }),
      createMockCard({ class: 'Navy' }),
      createMockCard({ class: 'Straw Hat Crew' }),
    ];
    const classes = getUniqueClasses(cards);
    expect(classes).toContain('Straw Hat Crew');
    expect(classes).toContain('Supernovas');
    expect(classes).toContain('Navy');
    expect(classes).toHaveLength(3);
  });

  it('should return sorted array', () => {
    const cards = [createMockCard({ class: 'Z' }), createMockCard({ class: 'A' })];
    const classes = getUniqueClasses(cards);
    expect(classes).toEqual(['A', 'Z']);
  });

  it('should handle empty cards array', () => {
    expect(getUniqueClasses([])).toEqual([]);
  });
});

describe('getUniqueColors', () => {
  it('should return all unique colors', () => {
    const cards = [
      createMockCard({ color: 'Red/Green' }),
      createMockCard({ color: 'Blue' }),
      createMockCard({ color: 'Red' }),
    ];
    const colors = getUniqueColors(cards);
    expect(colors).toContain('Red');
    expect(colors).toContain('Green');
    expect(colors).toContain('Blue');
    expect(colors).toHaveLength(3);
  });

  it('should return sorted array', () => {
    const cards = [createMockCard({ color: 'Yellow' }), createMockCard({ color: 'Blue' })];
    const colors = getUniqueColors(cards);
    expect(colors).toEqual(['Blue', 'Yellow']);
  });

  it('should handle empty cards array', () => {
    expect(getUniqueColors([])).toEqual([]);
  });
});

// =============================================================================
// DECK STATISTICS TESTS
// =============================================================================

describe('calculateDeckStats', () => {
  it('should calculate deck statistics', () => {
    const cards = [
      createLeaderCard(),
      createMockCard({ type: 'CHARACTER', cost: 2, power: 4000 }),
      createMockCard({ type: 'CHARACTER', cost: 4, power: 6000 }),
      createEventCard({ cost: 3 }),
      createStageCard({ cost: 2 }),
    ];
    const stats = calculateDeckStats(cards);

    expect(stats.totalCards).toBe(5);
    expect(stats.leaders).toBe(1);
    expect(stats.characters).toBe(2);
    expect(stats.events).toBe(1);
    expect(stats.stages).toBe(1);
  });

  it('should calculate average cost', () => {
    const cards = [
      createMockCard({ cost: 2 }),
      createMockCard({ cost: 4 }),
      createMockCard({ cost: 6 }),
    ];
    const stats = calculateDeckStats(cards);
    expect(stats.avgCost).toBe(4);
  });

  it('should calculate average power', () => {
    const cards = [
      createMockCard({ power: 3000 }),
      createMockCard({ power: 5000 }),
      createMockCard({ power: 7000 }),
    ];
    const stats = calculateDeckStats(cards);
    expect(stats.avgPower).toBe(5000);
  });

  it('should handle null values in averages', () => {
    const cards = [
      createMockCard({ cost: 3, power: 5000 }),
      createEventCard({ cost: 2, power: null }),
    ];
    const stats = calculateDeckStats(cards);
    expect(stats.avgCost).toBe(2.5);
    expect(stats.avgPower).toBe(5000); // Only 1 card with power
  });

  it('should return unique colors', () => {
    const cards = [
      createMockCard({ color: 'Red' }),
      createMockCard({ color: 'Red/Green' }),
      createMockCard({ color: 'Blue' }),
    ];
    const stats = calculateDeckStats(cards);
    expect(stats.colors).toContain('Red');
    expect(stats.colors).toContain('Green');
    expect(stats.colors).toContain('Blue');
  });

  it('should handle empty deck', () => {
    const stats = calculateDeckStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.leaders).toBe(0);
    expect(stats.avgCost).toBe(0);
    expect(stats.avgPower).toBe(0);
    expect(stats.colors).toEqual([]);
  });
});

// =============================================================================
// INTEGRATION SCENARIO TESTS
// =============================================================================

describe('Integration: Building a deck view', () => {
  it('should sort and filter cards for deck display', () => {
    const deckCards = [
      createLeaderCard({ code: 'OP01-001', color: 'Red' }),
      createMockCard({ code: 'OP01-002', type: 'CHARACTER', color: 'Red', cost: 1, rarity: 'C' }),
      createMockCard({ code: 'OP01-003', type: 'CHARACTER', color: 'Red', cost: 3, rarity: 'R' }),
      createEventCard({ code: 'OP01-050', color: 'Red', cost: 2 }),
    ];

    // Filter to Red cards only
    const redCards = filterByColor(deckCards, 'Red');
    expect(redCards).toHaveLength(4);

    // Sort by cost for mana curve view
    const byCost = sortByCost(redCards);
    expect(byCost.map((c) => c.cost)).toEqual([1, 2, 3, null]); // Null cost cards sorted to end

    // Get deck stats
    const stats = calculateDeckStats(deckCards);
    expect(stats.leaders).toBe(1);
    expect(stats.characters).toBe(2);
    expect(stats.events).toBe(1);
    expect(stats.colors).toContain('Red');
  });
});

describe('Integration: Card search and display', () => {
  it('should prepare card for display', () => {
    const card = createMockCard({
      code: 'OP01-001',
      name: 'Monkey D. Luffy',
      type: 'CHARACTER',
      rarity: 'SR',
      color: 'Red/Green',
      power: 5000,
      cost: 3,
      counter: 1000,
      class: 'Straw Hat Crew/Supernovas',
    });

    // Get display info
    const dexId = getCardDexId(card);
    expect(dexId).toBe('optcg-OP01-001');

    const setCode = extractSetCode(card.code);
    expect(setCode).toBe('OP01');

    const rarityName = getRarityDisplayName(card.rarity);
    expect(rarityName).toBe('Super Rare');

    const typeName = getTypeDisplayName(card.type);
    expect(typeName).toBe('Character');

    const isMulti = isMultiColor(card);
    expect(isMulti).toBe(true);

    const colors = getColorComponents(card);
    expect(colors).toEqual(['Red', 'Green']);

    const classes = getCardClasses(card);
    expect(classes).toEqual(['Straw Hat Crew', 'Supernovas']);

    const summary = getCardSummary(card);
    expect(summary).toContain('CHARACTER');
    expect(summary).toContain('Red/Green');
    expect(summary).toContain('Cost: 3');
  });
});

describe('Integration: Collection analysis', () => {
  it('should analyze a card collection', () => {
    const collection = [
      createLeaderCard({ code: 'OP01-001', color: 'Red' }),
      createMockCard({ code: 'OP01-010', rarity: 'C', color: 'Red' }),
      createMockCard({ code: 'OP01-020', rarity: 'R', color: 'Red' }),
      createMockCard({ code: 'OP01-030', rarity: 'SR', color: 'Red/Blue' }),
      createMockCard({ code: 'OP02-001', rarity: 'SEC', color: 'Blue' }),
    ];

    // Get unique colors in collection
    const colors = getUniqueColors(collection);
    expect(colors).toEqual(['Blue', 'Red']);

    // Get unique classes
    const classes = getUniqueClasses(collection);
    expect(classes.length).toBeGreaterThan(0);

    // Sort by rarity for showcase
    const byRarity = sortByRarity(collection);
    expect(byRarity[0].rarity).toBe('SEC'); // Secret Rare first

    // Calculate stats
    const stats = calculateDeckStats(collection);
    expect(stats.totalCards).toBe(5);
  });
});
