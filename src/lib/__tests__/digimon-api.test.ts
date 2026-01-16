/**
 * Tests for Digimon API client
 * Tests pure utility functions and constants
 */

import {
  // Constants
  DIGIMON_COLORS,
  DIGIMON_CARD_TYPES,
  DIGIMON_RARITIES,
  DIGIMON_ATTRIBUTES,
  DIGIMON_STAGES,
  // Types
  type DigimonCard,
  type DigimonColor,
  type DigimonCardType,
  type DigimonRarity,
  type DigimonAttribute,
  type DigimonStage,
  // Helper functions
  extractSetCode,
  extractCardNumber,
  getCardDexId,
  parseCardDexId,
  getCardImage,
  isDigimonCard,
  isOptionCard,
  isTamerCard,
  isDigiEggCard,
  isDualColor,
  getCardColors,
  hasEvolutionCost,
  getDigimonTypes,
  getColorInfo,
  getRarityDisplayName,
  getTypeDisplayName,
  getAttributeDisplayName,
  getStageDisplayName,
  formatPlayCost,
  formatEvolutionCost,
  formatDP,
  formatLevel,
  getCardSummary,
  getFullEffectText,
  sortByCardNumber,
  sortByRarity,
  sortByLevel,
  sortByDP,
  sortByPlayCost,
  sortByStage,
  filterByColor,
  filterByDigimonType,
  getUniqueColors,
  getUniqueDigimonTypes,
  calculateDeckStats,
  canEvolveFrom,
  getEvolutionRequirements,
  getTCGPlayerUrl,
  getDigimonCardIoUrl,
  extractSetsFromCards,
} from '../digimon-api';

// =============================================================================
// TEST DATA
// =============================================================================

function createMockCard(overrides: Partial<DigimonCard> = {}): DigimonCard {
  return {
    name: 'Agumon',
    type: 'Digimon',
    id: 'BT1-010',
    level: 3,
    play_cost: 3,
    evolution_cost: 0,
    evolution_color: 'Red',
    evolution_level: 2,
    color: 'Red',
    color2: null,
    digi_type: 'Reptile',
    digi_type2: null,
    form: 'Child',
    dp: 2000,
    attribute: 'Vaccine',
    rarity: 'U',
    stage: 'Rookie',
    main_effect:
      '[On Play] Reveal the top 3 cards of your deck. Add 1 Tamer card among them to your hand. Place the rest at the bottom of your deck in any order.',
    source_effect: null,
    alt_effect: null,
    series: 'Digimon Card Game',
    pretty_url: 'agumon-bt1-010',
    date_added: '2020-05-15',
    tcgplayer_name: 'Agumon [BT1-010]',
    tcgplayer_id: 123456,
    set_name: ['Release Special Booster', 'BT-01: Booster New Evolution'],
    ...overrides,
  };
}

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('DIGIMON_COLORS', () => {
  it('should have all 8 colors', () => {
    expect(Object.keys(DIGIMON_COLORS)).toHaveLength(8);
  });

  it('should have all expected colors', () => {
    const expectedColors: DigimonColor[] = [
      'Red',
      'Blue',
      'Yellow',
      'Green',
      'Purple',
      'Black',
      'White',
      'Colorless',
    ];
    for (const color of expectedColors) {
      expect(DIGIMON_COLORS[color]).toBeDefined();
      expect(DIGIMON_COLORS[color].name).toBe(color);
      expect(DIGIMON_COLORS[color].hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('DIGIMON_CARD_TYPES', () => {
  it('should have all 4 card types', () => {
    expect(Object.keys(DIGIMON_CARD_TYPES)).toHaveLength(4);
  });

  it('should have all expected types', () => {
    const expectedTypes: DigimonCardType[] = ['Digimon', 'Option', 'Tamer', 'Digi-Egg'];
    for (const type of expectedTypes) {
      expect(DIGIMON_CARD_TYPES[type]).toBeDefined();
      expect(DIGIMON_CARD_TYPES[type].name).toBe(type);
      expect(DIGIMON_CARD_TYPES[type].description).toBeTruthy();
    }
  });
});

describe('DIGIMON_RARITIES', () => {
  it('should have all 6 rarities', () => {
    expect(Object.keys(DIGIMON_RARITIES)).toHaveLength(6);
  });

  it('should have ascending sort orders', () => {
    const rarities: DigimonRarity[] = ['C', 'U', 'R', 'SR', 'SEC', 'P'];
    let lastOrder = 0;
    for (const rarity of rarities) {
      expect(DIGIMON_RARITIES[rarity].sortOrder).toBeGreaterThan(lastOrder);
      lastOrder = DIGIMON_RARITIES[rarity].sortOrder;
    }
  });

  it('should have display names', () => {
    expect(DIGIMON_RARITIES['SR'].name).toBe('Super Rare');
    expect(DIGIMON_RARITIES['SEC'].name).toBe('Secret Rare');
  });
});

describe('DIGIMON_ATTRIBUTES', () => {
  it('should have all 6 attributes', () => {
    expect(Object.keys(DIGIMON_ATTRIBUTES)).toHaveLength(6);
  });

  it('should have all expected attributes', () => {
    const expectedAttributes: DigimonAttribute[] = [
      'Vaccine',
      'Virus',
      'Data',
      'Free',
      'Variable',
      'Unknown',
    ];
    for (const attr of expectedAttributes) {
      expect(DIGIMON_ATTRIBUTES[attr]).toBe(attr);
    }
  });
});

describe('DIGIMON_STAGES', () => {
  it('should have all 9 stages', () => {
    expect(Object.keys(DIGIMON_STAGES)).toHaveLength(9);
  });

  it('should have correct evolution order', () => {
    // Digi-Egg should come first
    expect(DIGIMON_STAGES['Digi-Egg'].sortOrder).toBe(0);
    // In-Training before Rookie
    expect(DIGIMON_STAGES['In-Training'].sortOrder).toBeLessThan(
      DIGIMON_STAGES['Rookie'].sortOrder
    );
    // Rookie before Champion
    expect(DIGIMON_STAGES['Rookie'].sortOrder).toBeLessThan(DIGIMON_STAGES['Champion'].sortOrder);
    // Champion before Ultimate
    expect(DIGIMON_STAGES['Champion'].sortOrder).toBeLessThan(DIGIMON_STAGES['Ultimate'].sortOrder);
    // Ultimate before Mega
    expect(DIGIMON_STAGES['Ultimate'].sortOrder).toBeLessThan(DIGIMON_STAGES['Mega'].sortOrder);
  });
});

// =============================================================================
// CARD ID EXTRACTION FUNCTIONS
// =============================================================================

describe('extractSetCode', () => {
  it('should extract set code from card number', () => {
    expect(extractSetCode('BT1-010')).toBe('BT1');
    expect(extractSetCode('ST1-01')).toBe('ST1');
    expect(extractSetCode('EX1-001')).toBe('EX1');
  });

  it('should handle promo cards', () => {
    expect(extractSetCode('P-001')).toBe('P');
  });

  it('should return empty string for invalid format', () => {
    expect(extractSetCode('invalid')).toBe('');
    expect(extractSetCode('')).toBe('');
  });

  it('should handle uppercase conversion', () => {
    expect(extractSetCode('bt1-010')).toBe('BT1');
  });
});

describe('extractCardNumber', () => {
  it('should extract card number after hyphen', () => {
    expect(extractCardNumber('BT1-010')).toBe('010');
    expect(extractCardNumber('ST1-01')).toBe('01');
    expect(extractCardNumber('EX1-001')).toBe('001');
  });

  it('should return full string if no hyphen', () => {
    expect(extractCardNumber('invalid')).toBe('invalid');
  });
});

// =============================================================================
// CARD DEX ID FUNCTIONS
// =============================================================================

describe('getCardDexId', () => {
  it('should generate correct ID format', () => {
    const card = createMockCard({ id: 'BT1-010' });
    expect(getCardDexId(card)).toBe('digimon-BT1-010');
  });

  it('should handle different card IDs', () => {
    const card = createMockCard({ id: 'ST5-12' });
    expect(getCardDexId(card)).toBe('digimon-ST5-12');
  });
});

describe('parseCardDexId', () => {
  it('should parse valid ID', () => {
    const result = parseCardDexId('digimon-BT1-010');
    expect(result).toBe('BT1-010');
  });

  it('should return null for invalid ID', () => {
    expect(parseCardDexId('invalid-id')).toBeNull();
    expect(parseCardDexId('pokemon-BT1-010')).toBeNull();
  });

  it('should return null for missing prefix', () => {
    expect(parseCardDexId('BT1-010')).toBeNull();
  });
});

// =============================================================================
// CARD TYPE CHECK FUNCTIONS
// =============================================================================

describe('card type checks', () => {
  it('isDigimonCard should detect Digimon cards', () => {
    expect(isDigimonCard(createMockCard({ type: 'Digimon' }))).toBe(true);
    expect(isDigimonCard(createMockCard({ type: 'Option' }))).toBe(false);
  });

  it('isOptionCard should detect Option cards', () => {
    expect(isOptionCard(createMockCard({ type: 'Option' }))).toBe(true);
    expect(isOptionCard(createMockCard({ type: 'Digimon' }))).toBe(false);
  });

  it('isTamerCard should detect Tamer cards', () => {
    expect(isTamerCard(createMockCard({ type: 'Tamer' }))).toBe(true);
    expect(isTamerCard(createMockCard({ type: 'Digimon' }))).toBe(false);
  });

  it('isDigiEggCard should detect Digi-Egg cards', () => {
    expect(isDigiEggCard(createMockCard({ type: 'Digi-Egg' }))).toBe(true);
    expect(isDigiEggCard(createMockCard({ type: 'Digimon' }))).toBe(false);
  });
});

// =============================================================================
// COLOR FUNCTIONS
// =============================================================================

describe('isDualColor', () => {
  it('should detect dual-color cards', () => {
    expect(isDualColor(createMockCard({ color: 'Red', color2: 'Blue' }))).toBe(true);
    expect(isDualColor(createMockCard({ color: 'Red', color2: null }))).toBe(false);
  });
});

describe('getCardColors', () => {
  it('should return single color for mono-color cards', () => {
    const colors = getCardColors(createMockCard({ color: 'Red', color2: null }));
    expect(colors).toEqual(['Red']);
  });

  it('should return both colors for dual-color cards', () => {
    const colors = getCardColors(createMockCard({ color: 'Red', color2: 'Blue' }));
    expect(colors).toEqual(['Red', 'Blue']);
  });
});

describe('getColorInfo', () => {
  it('should return color info for known color', () => {
    const info = getColorInfo('Red');
    expect(info.name).toBe('Red');
    expect(info.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should return default for unknown color', () => {
    const info = getColorInfo('Unknown' as DigimonColor);
    expect(info.name).toBe('Unknown');
    expect(info.hex).toBe('#9E9E9E');
  });
});

// =============================================================================
// EVOLUTION FUNCTIONS
// =============================================================================

describe('hasEvolutionCost', () => {
  it('should return true for cards with evolution cost', () => {
    expect(hasEvolutionCost(createMockCard({ evolution_cost: 2 }))).toBe(true);
  });

  it('should return false for cards without evolution cost', () => {
    expect(hasEvolutionCost(createMockCard({ evolution_cost: null }))).toBe(false);
    expect(hasEvolutionCost(createMockCard({ evolution_cost: 0 }))).toBe(false);
  });
});

describe('getEvolutionRequirements', () => {
  it('should return evolution requirements for evolving cards', () => {
    const card = createMockCard({
      evolution_cost: 3,
      evolution_level: 4,
      evolution_color: 'Red/Blue',
    });
    const requirements = getEvolutionRequirements(card);

    expect(requirements).not.toBeNull();
    expect(requirements!.cost).toBe(3);
    expect(requirements!.level).toBe(4);
    expect(requirements!.colors).toEqual(['Red', 'Blue']);
  });

  it('should return null for cards without evolution cost', () => {
    const card = createMockCard({ evolution_cost: null });
    expect(getEvolutionRequirements(card)).toBeNull();
  });

  it('should return null for cards with zero evolution cost', () => {
    const card = createMockCard({ evolution_cost: 0 });
    expect(getEvolutionRequirements(card)).toBeNull();
  });
});

describe('canEvolveFrom', () => {
  it('should return true when source matches evolution requirements', () => {
    const targetCard = createMockCard({
      evolution_level: 3,
      evolution_color: 'Red',
    });
    const sourceCard = createMockCard({
      level: 3,
      color: 'Red',
      color2: null,
    });

    expect(canEvolveFrom(targetCard, sourceCard)).toBe(true);
  });

  it('should return false when level does not match', () => {
    const targetCard = createMockCard({
      evolution_level: 4,
      evolution_color: 'Red',
    });
    const sourceCard = createMockCard({
      level: 3,
      color: 'Red',
      color2: null,
    });

    expect(canEvolveFrom(targetCard, sourceCard)).toBe(false);
  });

  it('should return false when color does not match', () => {
    const targetCard = createMockCard({
      evolution_level: 3,
      evolution_color: 'Red',
    });
    const sourceCard = createMockCard({
      level: 3,
      color: 'Blue',
      color2: null,
    });

    expect(canEvolveFrom(targetCard, sourceCard)).toBe(false);
  });

  it('should handle dual-color evolution requirements', () => {
    const targetCard = createMockCard({
      evolution_level: 3,
      evolution_color: 'Red/Blue',
    });
    const sourceCard = createMockCard({
      level: 3,
      color: 'Blue',
      color2: null,
    });

    expect(canEvolveFrom(targetCard, sourceCard)).toBe(true);
  });

  it('should return false for cards without evolution requirements', () => {
    const targetCard = createMockCard({
      evolution_level: null,
      evolution_color: null,
    });
    const sourceCard = createMockCard({ level: 3, color: 'Red' });

    expect(canEvolveFrom(targetCard, sourceCard)).toBe(false);
  });
});

// =============================================================================
// DIGIMON TYPE FUNCTIONS
// =============================================================================

describe('getDigimonTypes', () => {
  it('should return single type', () => {
    const card = createMockCard({ digi_type: 'Dragon', digi_type2: null });
    expect(getDigimonTypes(card)).toEqual(['Dragon']);
  });

  it('should return both types', () => {
    const card = createMockCard({ digi_type: 'Dragon', digi_type2: 'Dragonkin' });
    expect(getDigimonTypes(card)).toEqual(['Dragon', 'Dragonkin']);
  });

  it('should return empty array for no types', () => {
    const card = createMockCard({ digi_type: null, digi_type2: null });
    expect(getDigimonTypes(card)).toEqual([]);
  });
});

// =============================================================================
// DISPLAY NAME FUNCTIONS
// =============================================================================

describe('getRarityDisplayName', () => {
  it('should return display name for known rarity', () => {
    expect(getRarityDisplayName('SR')).toBe('Super Rare');
    expect(getRarityDisplayName('SEC')).toBe('Secret Rare');
    expect(getRarityDisplayName('C')).toBe('Common');
  });

  it('should return rarity as-is for unknown rarity', () => {
    expect(getRarityDisplayName('Unknown' as DigimonRarity)).toBe('Unknown');
  });
});

describe('getTypeDisplayName', () => {
  it('should return display name for known type', () => {
    expect(getTypeDisplayName('Digimon')).toBe('Digimon');
    expect(getTypeDisplayName('Digi-Egg')).toBe('Digi-Egg');
  });
});

describe('getAttributeDisplayName', () => {
  it('should return display name for known attribute', () => {
    expect(getAttributeDisplayName('Vaccine')).toBe('Vaccine');
    expect(getAttributeDisplayName('Virus')).toBe('Virus');
  });

  it('should return dash for null', () => {
    expect(getAttributeDisplayName(null)).toBe('-');
  });
});

describe('getStageDisplayName', () => {
  it('should return display name for known stage', () => {
    expect(getStageDisplayName('Rookie')).toBe('Rookie');
    expect(getStageDisplayName('Mega')).toBe('Mega');
  });

  it('should return dash for null', () => {
    expect(getStageDisplayName(null)).toBe('-');
  });
});

// =============================================================================
// FORMAT FUNCTIONS
// =============================================================================

describe('formatPlayCost', () => {
  it('should format play cost as string', () => {
    expect(formatPlayCost(3)).toBe('3');
    expect(formatPlayCost(0)).toBe('0');
  });

  it('should return dash for null', () => {
    expect(formatPlayCost(null)).toBe('-');
  });
});

describe('formatEvolutionCost', () => {
  it('should format evolution cost as string', () => {
    expect(formatEvolutionCost(2)).toBe('2');
    expect(formatEvolutionCost(0)).toBe('0');
  });

  it('should return dash for null', () => {
    expect(formatEvolutionCost(null)).toBe('-');
  });
});

describe('formatDP', () => {
  it('should format DP with K for thousands', () => {
    expect(formatDP(5000)).toBe('5K');
    expect(formatDP(12000)).toBe('12K');
  });

  it('should format DP without K for small values', () => {
    expect(formatDP(500)).toBe('500');
  });

  it('should return dash for null', () => {
    expect(formatDP(null)).toBe('-');
  });
});

describe('formatLevel', () => {
  it('should format level with Lv. prefix', () => {
    expect(formatLevel(3)).toBe('Lv.3');
    expect(formatLevel(6)).toBe('Lv.6');
  });

  it('should return dash for null', () => {
    expect(formatLevel(null)).toBe('-');
  });
});

// =============================================================================
// CARD SUMMARY AND EFFECT FUNCTIONS
// =============================================================================

describe('getCardSummary', () => {
  it('should generate summary for Digimon card', () => {
    const card = createMockCard();
    const summary = getCardSummary(card);

    expect(summary).toContain('Digimon');
    expect(summary).toContain('Red');
    expect(summary).toContain('Lv.3');
    expect(summary).toContain('DP: 2K');
    expect(summary).toContain('Cost: 3');
  });

  it('should handle dual-color cards', () => {
    const card = createMockCard({ color: 'Red', color2: 'Blue' });
    const summary = getCardSummary(card);

    expect(summary).toContain('Red/Blue');
  });

  it('should handle cards without level and DP', () => {
    const card = createMockCard({
      type: 'Option',
      level: null,
      dp: null,
    });
    const summary = getCardSummary(card);

    expect(summary).toContain('Option');
    expect(summary).not.toContain('Lv.');
    expect(summary).not.toContain('DP:');
  });
});

describe('getFullEffectText', () => {
  it('should return main effect only when no other effects', () => {
    const card = createMockCard({
      main_effect: 'Main effect text.',
      source_effect: null,
      alt_effect: null,
    });

    expect(getFullEffectText(card)).toBe('Main effect text.');
  });

  it('should combine main and source effects', () => {
    const card = createMockCard({
      main_effect: 'Main effect text.',
      source_effect: 'Source effect text.',
      alt_effect: null,
    });

    const effectText = getFullEffectText(card);
    expect(effectText).toContain('Main effect text.');
    expect(effectText).toContain('[Inherited Effect] Source effect text.');
  });

  it('should include alt effect when present', () => {
    const card = createMockCard({
      main_effect: 'Main effect text.',
      source_effect: null,
      alt_effect: 'Alt effect text.',
    });

    const effectText = getFullEffectText(card);
    expect(effectText).toContain('[Alt Effect] Alt effect text.');
  });

  it('should return empty string when no effects', () => {
    const card = createMockCard({
      main_effect: null,
      source_effect: null,
      alt_effect: null,
    });

    expect(getFullEffectText(card)).toBe('');
  });
});

// =============================================================================
// IMAGE FUNCTION
// =============================================================================

describe('getCardImage', () => {
  it('should return image URL', () => {
    const card = createMockCard({ id: 'BT1-010' });
    const url = getCardImage(card);
    expect(url).toContain('BT1-010');
    expect(url).toContain('.png');
  });

  it('should work with different card IDs', () => {
    const card = createMockCard({ id: 'ST5-05' });
    const url = getCardImage(card);
    expect(url).toContain('ST5-05');
  });
});

// =============================================================================
// SORTING FUNCTIONS
// =============================================================================

describe('sortByCardNumber', () => {
  it('should sort by set code then card number', () => {
    const cards = [
      createMockCard({ id: 'BT2-010' }),
      createMockCard({ id: 'BT1-005' }),
      createMockCard({ id: 'BT1-015' }),
    ];

    const sorted = sortByCardNumber(cards);
    expect(sorted[0].id).toBe('BT1-005');
    expect(sorted[1].id).toBe('BT1-015');
    expect(sorted[2].id).toBe('BT2-010');
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ id: 'BT2-010' }), createMockCard({ id: 'BT1-005' })];
    const original = [...cards];
    sortByCardNumber(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByRarity', () => {
  it('should sort by rarity (highest first)', () => {
    const cards = [
      createMockCard({ rarity: 'C' }),
      createMockCard({ rarity: 'SEC' }),
      createMockCard({ rarity: 'R' }),
    ];

    const sorted = sortByRarity(cards);
    expect(sorted[0].rarity).toBe('SEC');
    expect(sorted[1].rarity).toBe('R');
    expect(sorted[2].rarity).toBe('C');
  });

  it('should not mutate original array', () => {
    const cards = [createMockCard({ rarity: 'C' }), createMockCard({ rarity: 'SEC' })];
    const original = [...cards];
    sortByRarity(cards);
    expect(cards).toEqual(original);
  });
});

describe('sortByLevel', () => {
  it('should sort by level (lowest first)', () => {
    const cards = [
      createMockCard({ level: 5 }),
      createMockCard({ level: 3 }),
      createMockCard({ level: 6 }),
    ];

    const sorted = sortByLevel(cards);
    expect(sorted[0].level).toBe(3);
    expect(sorted[1].level).toBe(5);
    expect(sorted[2].level).toBe(6);
  });

  it('should handle null level', () => {
    const cards = [createMockCard({ level: 3 }), createMockCard({ level: null })];

    const sorted = sortByLevel(cards);
    expect(sorted[0].level).toBe(3);
    expect(sorted[1].level).toBeNull();
  });
});

describe('sortByDP', () => {
  it('should sort by DP (highest first)', () => {
    const cards = [
      createMockCard({ dp: 3000 }),
      createMockCard({ dp: 7000 }),
      createMockCard({ dp: 5000 }),
    ];

    const sorted = sortByDP(cards);
    expect(sorted[0].dp).toBe(7000);
    expect(sorted[1].dp).toBe(5000);
    expect(sorted[2].dp).toBe(3000);
  });

  it('should handle null DP', () => {
    const cards = [createMockCard({ dp: 5000 }), createMockCard({ dp: null })];

    const sorted = sortByDP(cards);
    expect(sorted[0].dp).toBe(5000);
    expect(sorted[1].dp).toBeNull();
  });
});

describe('sortByPlayCost', () => {
  it('should sort by play cost (lowest first)', () => {
    const cards = [
      createMockCard({ play_cost: 5 }),
      createMockCard({ play_cost: 2 }),
      createMockCard({ play_cost: 7 }),
    ];

    const sorted = sortByPlayCost(cards);
    expect(sorted[0].play_cost).toBe(2);
    expect(sorted[1].play_cost).toBe(5);
    expect(sorted[2].play_cost).toBe(7);
  });
});

describe('sortByStage', () => {
  it('should sort by evolution stage order', () => {
    const cards = [
      createMockCard({ stage: 'Mega' }),
      createMockCard({ stage: 'Rookie' }),
      createMockCard({ stage: 'Champion' }),
    ];

    const sorted = sortByStage(cards);
    expect(sorted[0].stage).toBe('Rookie');
    expect(sorted[1].stage).toBe('Champion');
    expect(sorted[2].stage).toBe('Mega');
  });

  it('should handle null stage', () => {
    const cards = [createMockCard({ stage: 'Rookie' }), createMockCard({ stage: null })];

    const sorted = sortByStage(cards);
    expect(sorted[0].stage).toBe('Rookie');
    expect(sorted[1].stage).toBeNull();
  });
});

// =============================================================================
// FILTER FUNCTIONS
// =============================================================================

describe('filterByColor', () => {
  it('should filter cards by primary color', () => {
    const cards = [
      createMockCard({ color: 'Red', color2: null }),
      createMockCard({ color: 'Blue', color2: null }),
      createMockCard({ color: 'Red', color2: null }),
    ];

    const filtered = filterByColor(cards, 'Red');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((c) => c.color === 'Red')).toBe(true);
  });

  it('should include cards where secondary color matches', () => {
    const cards = [
      createMockCard({ color: 'Red', color2: null }),
      createMockCard({ color: 'Blue', color2: 'Red' }),
    ];

    const filtered = filterByColor(cards, 'Red');
    expect(filtered).toHaveLength(2);
  });

  it('should return empty array when no matches', () => {
    const cards = [createMockCard({ color: 'Red', color2: null })];

    const filtered = filterByColor(cards, 'Yellow');
    expect(filtered).toHaveLength(0);
  });
});

describe('filterByDigimonType', () => {
  it('should filter cards by Digimon type', () => {
    const cards = [
      createMockCard({ digi_type: 'Dragon', digi_type2: null }),
      createMockCard({ digi_type: 'Reptile', digi_type2: null }),
      createMockCard({ digi_type: 'Dragon', digi_type2: 'Dragonkin' }),
    ];

    const filtered = filterByDigimonType(cards, 'Dragon');
    expect(filtered).toHaveLength(2);
  });

  it('should be case-insensitive', () => {
    const cards = [createMockCard({ digi_type: 'Dragon', digi_type2: null })];

    const filtered = filterByDigimonType(cards, 'dragon');
    expect(filtered).toHaveLength(1);
  });

  it('should include cards where secondary type matches', () => {
    const cards = [createMockCard({ digi_type: 'Holy Beast', digi_type2: 'Dragon' })];

    const filtered = filterByDigimonType(cards, 'Dragon');
    expect(filtered).toHaveLength(1);
  });
});

// =============================================================================
// UNIQUE VALUE FUNCTIONS
// =============================================================================

describe('getUniqueColors', () => {
  it('should return unique colors', () => {
    const cards = [
      createMockCard({ color: 'Red', color2: null }),
      createMockCard({ color: 'Blue', color2: 'Red' }),
      createMockCard({ color: 'Red', color2: null }),
    ];

    const colors = getUniqueColors(cards);
    expect(colors).toHaveLength(2);
    expect(colors).toContain('Red');
    expect(colors).toContain('Blue');
  });

  it('should include secondary colors', () => {
    const cards = [createMockCard({ color: 'Red', color2: 'Yellow' })];

    const colors = getUniqueColors(cards);
    expect(colors).toContain('Yellow');
  });

  it('should return sorted array', () => {
    const cards = [
      createMockCard({ color: 'Yellow', color2: null }),
      createMockCard({ color: 'Blue', color2: null }),
      createMockCard({ color: 'Red', color2: null }),
    ];

    const colors = getUniqueColors(cards);
    expect(colors).toEqual(['Blue', 'Red', 'Yellow']);
  });
});

describe('getUniqueDigimonTypes', () => {
  it('should return unique Digimon types', () => {
    const cards = [
      createMockCard({ digi_type: 'Dragon', digi_type2: null }),
      createMockCard({ digi_type: 'Reptile', digi_type2: 'Dragon' }),
      createMockCard({ digi_type: 'Wizard', digi_type2: null }),
    ];

    const types = getUniqueDigimonTypes(cards);
    expect(types).toHaveLength(3);
    expect(types).toContain('Dragon');
    expect(types).toContain('Reptile');
    expect(types).toContain('Wizard');
  });

  it('should handle null types', () => {
    const cards = [
      createMockCard({ digi_type: 'Dragon', digi_type2: null }),
      createMockCard({ digi_type: null, digi_type2: null }),
    ];

    const types = getUniqueDigimonTypes(cards);
    expect(types).toEqual(['Dragon']);
  });
});

// =============================================================================
// DECK STATISTICS
// =============================================================================

describe('calculateDeckStats', () => {
  it('should calculate comprehensive deck statistics', () => {
    const cards = [
      createMockCard({ type: 'Digimon', color: 'Red', play_cost: 3, dp: 3000, level: 3 }),
      createMockCard({ type: 'Digimon', color: 'Red', play_cost: 5, dp: 6000, level: 4 }),
      createMockCard({ type: 'Digimon', color: 'Blue', play_cost: 7, dp: 10000, level: 5 }),
      createMockCard({ type: 'Option', color: 'Red', play_cost: 4, dp: null, level: null }),
      createMockCard({ type: 'Tamer', color: 'Red', play_cost: 3, dp: null, level: null }),
      createMockCard({
        type: 'Digi-Egg',
        color: 'Red',
        play_cost: null,
        dp: null,
        level: 2,
        stage: 'Digi-Egg',
      }),
    ];

    const stats = calculateDeckStats(cards);

    expect(stats.totalCards).toBe(6);
    expect(stats.digimon).toBe(3);
    expect(stats.options).toBe(1);
    expect(stats.tamers).toBe(1);
    expect(stats.digiEggs).toBe(1);
    expect(stats.avgPlayCost).toBeCloseTo(4.4, 1); // (3+5+7+4+3)/5
    expect(stats.avgDP).toBeCloseTo(6333, 0); // (3000+6000+10000)/3
    expect(stats.colors).toContain('Red');
    expect(stats.colors).toContain('Blue');
    expect(stats.levelDistribution[3]).toBe(1);
    expect(stats.levelDistribution[4]).toBe(1);
    expect(stats.levelDistribution[5]).toBe(1);
  });

  it('should handle empty array', () => {
    const stats = calculateDeckStats([]);

    expect(stats.totalCards).toBe(0);
    expect(stats.avgPlayCost).toBe(0);
    expect(stats.avgDP).toBe(0);
    expect(stats.colors).toEqual([]);
    expect(stats.levelDistribution).toEqual({});
  });
});

// =============================================================================
// URL FUNCTIONS
// =============================================================================

describe('getTCGPlayerUrl', () => {
  it('should return TCGPlayer URL when ID exists', () => {
    const card = createMockCard({ tcgplayer_id: 123456 });
    expect(getTCGPlayerUrl(card)).toBe('https://www.tcgplayer.com/product/123456');
  });

  it('should return null when no TCGPlayer ID', () => {
    const card = createMockCard({ tcgplayer_id: null });
    expect(getTCGPlayerUrl(card)).toBeNull();
  });
});

describe('getDigimonCardIoUrl', () => {
  it('should return DigimonCard.io URL', () => {
    const card = createMockCard({ pretty_url: 'agumon-bt1-010' });
    expect(getDigimonCardIoUrl(card)).toBe('https://digimoncard.io/agumon-bt1-010');
  });
});

// =============================================================================
// SET EXTRACTION
// =============================================================================

describe('extractSetsFromCards', () => {
  it('should extract unique sets from cards', () => {
    const cards = [
      createMockCard({ set_name: ['BT-01: Booster New Evolution'] }),
      createMockCard({ set_name: ['BT-01: Booster New Evolution', 'Release Special Booster'] }),
      createMockCard({ set_name: ['BT-02: Ultimate Power'] }),
    ];

    const sets = extractSetsFromCards(cards);

    expect(sets).toHaveLength(3);
    expect(sets.map((s) => s.name)).toContain('BT-01: Booster New Evolution');
    expect(sets.map((s) => s.name)).toContain('Release Special Booster');
    expect(sets.map((s) => s.name)).toContain('BT-02: Ultimate Power');
  });

  it('should count cards per set', () => {
    const cards = [
      createMockCard({ set_name: ['BT-01'] }),
      createMockCard({ set_name: ['BT-01'] }),
      createMockCard({ set_name: ['BT-02'] }),
    ];

    const sets = extractSetsFromCards(cards);
    const bt01 = sets.find((s) => s.name === 'BT-01');
    const bt02 = sets.find((s) => s.name === 'BT-02');

    expect(bt01?.cardCount).toBe(2);
    expect(bt02?.cardCount).toBe(1);
  });

  it('should handle empty array', () => {
    const sets = extractSetsFromCards([]);
    expect(sets).toEqual([]);
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('Integration scenarios', () => {
  describe('Card display preparation', () => {
    it('should prepare card data for display', () => {
      const card = createMockCard();

      const dexId = getCardDexId(card);
      const summary = getCardSummary(card);
      const image = getCardImage(card);
      const effectText = getFullEffectText(card);
      const tcgPlayerUrl = getTCGPlayerUrl(card);

      expect(dexId).toBe('digimon-BT1-010');
      expect(summary).toContain('Digimon');
      expect(summary).toContain('Red');
      expect(image).toContain('BT1-010');
      expect(effectText).toContain('Reveal the top 3 cards');
      expect(tcgPlayerUrl).toBe('https://www.tcgplayer.com/product/123456');
    });
  });

  describe('Evolution chain analysis', () => {
    it('should identify valid evolution paths', () => {
      const rookieCard = createMockCard({
        name: 'Agumon',
        id: 'BT1-010',
        level: 3,
        stage: 'Rookie',
        color: 'Red',
      });

      const championCard = createMockCard({
        name: 'Greymon',
        id: 'BT1-020',
        level: 4,
        stage: 'Champion',
        color: 'Red',
        evolution_level: 3,
        evolution_color: 'Red',
        evolution_cost: 2,
      });

      const ultimateCard = createMockCard({
        name: 'MetalGreymon',
        id: 'BT1-030',
        level: 5,
        stage: 'Ultimate',
        color: 'Red',
        evolution_level: 4,
        evolution_color: 'Red',
        evolution_cost: 3,
      });

      // Greymon can evolve from Agumon
      expect(canEvolveFrom(championCard, rookieCard)).toBe(true);
      // MetalGreymon can evolve from Greymon
      expect(canEvolveFrom(ultimateCard, championCard)).toBe(true);
      // MetalGreymon cannot evolve from Agumon
      expect(canEvolveFrom(ultimateCard, rookieCard)).toBe(false);
    });
  });

  describe('Deck building analysis', () => {
    it('should analyze a deck composition', () => {
      const deck = [
        // Red Digimon line
        createMockCard({ type: 'Digimon', color: 'Red', level: 3, dp: 2000, play_cost: 3 }),
        createMockCard({ type: 'Digimon', color: 'Red', level: 4, dp: 5000, play_cost: 5 }),
        createMockCard({ type: 'Digimon', color: 'Red', level: 5, dp: 8000, play_cost: 7 }),
        createMockCard({ type: 'Digimon', color: 'Red', level: 6, dp: 12000, play_cost: 12 }),
        // Blue Digimon for tech
        createMockCard({ type: 'Digimon', color: 'Blue', level: 4, dp: 4000, play_cost: 4 }),
        // Options
        createMockCard({ type: 'Option', color: 'Red', play_cost: 2, level: null, dp: null }),
        createMockCard({ type: 'Option', color: 'Red', play_cost: 3, level: null, dp: null }),
        // Tamers
        createMockCard({ type: 'Tamer', color: 'Red', play_cost: 3, level: null, dp: null }),
        // Digi-Eggs
        createMockCard({
          type: 'Digi-Egg',
          color: 'Red',
          level: 2,
          play_cost: null,
          dp: null,
          stage: 'Digi-Egg',
        }),
      ];

      const stats = calculateDeckStats(deck);

      expect(stats.totalCards).toBe(9);
      expect(stats.digimon).toBe(5);
      expect(stats.options).toBe(2);
      expect(stats.tamers).toBe(1);
      expect(stats.digiEggs).toBe(1);
      expect(stats.colors).toHaveLength(2);
      expect(stats.colors).toContain('Red');
      expect(stats.colors).toContain('Blue');

      // Filter Red cards only
      const redCards = filterByColor(deck, 'Red');
      expect(redCards).toHaveLength(8);

      // Sort by level for evolution display
      const digimonCards = deck.filter((c) => c.type === 'Digimon');
      const sortedByLevel = sortByLevel(digimonCards);
      expect(sortedByLevel[0].level).toBe(3);
      expect(sortedByLevel[sortedByLevel.length - 1].level).toBe(6);
    });
  });

  describe('Collection filtering', () => {
    it('should filter and sort a collection', () => {
      const collection = [
        createMockCard({ color: 'Red', rarity: 'C', dp: 3000 }),
        createMockCard({ color: 'Red', rarity: 'SR', dp: 8000 }),
        createMockCard({ color: 'Blue', rarity: 'R', dp: 5000 }),
        createMockCard({ color: 'Red', rarity: 'R', dp: 6000 }),
      ];

      // Filter to Red cards
      const redCards = filterByColor(collection, 'Red');
      expect(redCards).toHaveLength(3);

      // Sort by rarity (highest first)
      const sortedByRarity = sortByRarity(redCards);
      expect(sortedByRarity[0].rarity).toBe('SR');

      // Sort by DP (highest first)
      const sortedByDP = sortByDP(redCards);
      expect(sortedByDP[0].dp).toBe(8000);
    });
  });
});
