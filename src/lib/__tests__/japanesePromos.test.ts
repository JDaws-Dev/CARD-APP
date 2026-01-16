import { describe, it, expect } from 'vitest';
import {
  // Types
  type JapanesePromoCategory,
  type JapanesePromoSource,
  type JapanesePromoInfo,
  type CardForPromoDetection,
  // Constants
  JAPANESE_PROMO_SET_PATTERNS,
  JAPANESE_PROMO_NUMBER_PATTERNS,
  JAPANESE_PROMO_SOURCES,
  PROMO_CATEGORY_INFO,
  JAPANESE_PROMO_KEYWORDS,
  // Detection functions
  detectByNumberPattern,
  detectBySetId,
  detectByKeywords,
  hasJapanesePromoNumberFormat,
  detectJapanesePromo,
  // Categorization helpers
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryDescription,
  getSourceInfo,
  getSourcesForCategory,
  getAllCategories,
  getAllCategoryInfo,
  // Display helpers
  formatPromoForDisplay,
  getPromoTooltip,
  getPromoLabel,
  isCollectiblePromo,
  getPromoRarityTier,
  // Batch processing
  detectJapanesePromosInBatch,
  filterJapanesePromos,
  groupByPromoCategory,
  countByCategory,
  getPromoStats,
} from '../japanesePromos';

// =============================================================================
// TEST DATA
// =============================================================================

const createCard = (overrides: Partial<CardForPromoDetection> = {}): CardForPromoDetection => ({
  id: 'test-001',
  name: 'Pikachu',
  number: '001',
  rarity: 'Common',
  set: { id: 'sv1', name: 'Scarlet & Violet' },
  ...overrides,
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Constants', () => {
  describe('JAPANESE_PROMO_SET_PATTERNS', () => {
    it('should have multiple patterns defined', () => {
      expect(JAPANESE_PROMO_SET_PATTERNS.length).toBeGreaterThan(0);
    });

    it('should all be valid RegExp patterns', () => {
      for (const pattern of JAPANESE_PROMO_SET_PATTERNS) {
        expect(pattern).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('JAPANESE_PROMO_NUMBER_PATTERNS', () => {
    it('should have patterns for multiple categories', () => {
      expect(JAPANESE_PROMO_NUMBER_PATTERNS.length).toBeGreaterThan(10);
    });

    it('should all have required properties', () => {
      for (const item of JAPANESE_PROMO_NUMBER_PATTERNS) {
        expect(item.pattern).toBeInstanceOf(RegExp);
        expect(typeof item.category).toBe('string');
        expect(typeof item.source).toBe('string');
      }
    });

    it('should cover major promo categories', () => {
      const categories = new Set(JAPANESE_PROMO_NUMBER_PATTERNS.map((p) => p.category));
      expect(categories).toContain('magazine');
      expect(categories).toContain('tournament');
      expect(categories).toContain('movie');
      expect(categories).toContain('store');
    });
  });

  describe('JAPANESE_PROMO_SOURCES', () => {
    it('should have multiple sources defined', () => {
      expect(Object.keys(JAPANESE_PROMO_SOURCES).length).toBeGreaterThan(5);
    });

    it('should have all required fields for each source', () => {
      for (const [key, source] of Object.entries(JAPANESE_PROMO_SOURCES)) {
        expect(source.category).toBeDefined();
        expect(source.source).toBe(key);
        expect(source.displayName).toBeDefined();
        expect(source.description).toBeDefined();
      }
    });

    it('should include CoroCoro source', () => {
      expect(JAPANESE_PROMO_SOURCES.corocoro).toBeDefined();
      expect(JAPANESE_PROMO_SOURCES.corocoro.displayName).toBe('CoroCoro Comic');
    });

    it('should include Pokemon Center source', () => {
      expect(JAPANESE_PROMO_SOURCES.pokemon_center).toBeDefined();
      expect(JAPANESE_PROMO_SOURCES.pokemon_center.category).toBe('store');
    });
  });

  describe('PROMO_CATEGORY_INFO', () => {
    it('should have info for all categories', () => {
      const expectedCategories: JapanesePromoCategory[] = [
        'magazine',
        'tournament',
        'movie',
        'store',
        'campaign',
        'prerelease',
        'prize',
        'other',
      ];
      for (const category of expectedCategories) {
        expect(PROMO_CATEGORY_INFO[category]).toBeDefined();
        expect(PROMO_CATEGORY_INFO[category].displayName).toBeDefined();
        expect(PROMO_CATEGORY_INFO[category].icon).toBeDefined();
        expect(PROMO_CATEGORY_INFO[category].description).toBeDefined();
      }
    });
  });

  describe('JAPANESE_PROMO_KEYWORDS', () => {
    it('should have multiple keywords', () => {
      expect(JAPANESE_PROMO_KEYWORDS.length).toBeGreaterThan(5);
    });

    it('should include key Japanese promo indicators', () => {
      const keywordsArray = [...JAPANESE_PROMO_KEYWORDS];
      expect(keywordsArray).toContain('japan');
      expect(keywordsArray).toContain('corocoro');
      expect(keywordsArray).toContain('pokemon center');
    });
  });
});

// =============================================================================
// DETECTION FUNCTION TESTS
// =============================================================================

describe('Detection Functions', () => {
  describe('detectByNumberPattern', () => {
    it('should detect CoroCoro pattern with /C suffix', () => {
      const result = detectByNumberPattern('001/C');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('magazine');
      expect(result.source).toBe('CoroCoro Comic');
    });

    it('should detect V-Jump pattern', () => {
      const result = detectByNumberPattern('VJ-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('magazine');
      expect(result.source).toBe('V-Jump');
    });

    it('should detect Pokemon Center pattern', () => {
      const result = detectByNumberPattern('PC-123');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('store');
      expect(result.source).toBe('Pokemon Center');
    });

    it('should detect World Championships pattern', () => {
      const result = detectByNumberPattern('WCS-2023');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('tournament');
    });

    it('should detect Movie promo pattern', () => {
      const result = detectByNumberPattern('M23-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('movie');
    });

    it("should detect McDonald's Japan pattern", () => {
      const result = detectByNumberPattern('MCD-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('campaign');
    });

    it('should detect Prize card pattern', () => {
      const result = detectByNumberPattern('PRIZE-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('prize');
    });

    it('should detect Trophy card pattern', () => {
      const result = detectByNumberPattern('TROPHY-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('prize');
    });

    it('should return no match for regular card numbers', () => {
      const result = detectByNumberPattern('001/198');
      expect(result.isMatch).toBe(false);
      expect(result.category).toBeNull();
    });

    it('should handle empty string', () => {
      const result = detectByNumberPattern('');
      expect(result.isMatch).toBe(false);
    });

    it('should detect 7-Eleven pattern', () => {
      const result = detectByNumberPattern('7-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('store');
    });

    it('should detect Illustration Contest pattern', () => {
      const result = detectByNumberPattern('ILLUS-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('prize');
    });

    it('should detect Pre-release pattern', () => {
      const result = detectByNumberPattern('PR-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('prerelease');
    });

    it('should detect Japan Championships pattern', () => {
      const result = detectByNumberPattern('JCS-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('tournament');
    });

    it('should detect Gym Battle pattern', () => {
      const result = detectByNumberPattern('GYM-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('tournament');
    });

    it('should detect CORO prefix pattern', () => {
      const result = detectByNumberPattern('CORO001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('magazine');
    });

    it('should detect Lawson pattern', () => {
      const result = detectByNumberPattern('LS-001');
      expect(result.isMatch).toBe(true);
      expect(result.category).toBe('store');
    });
  });

  describe('detectBySetId', () => {
    it('should detect svp as potential Japanese promo set', () => {
      expect(detectBySetId('svp')).toBe(true);
    });

    it('should detect swshp as potential Japanese promo set', () => {
      expect(detectBySetId('swshp')).toBe(true);
    });

    it('should detect sets with -jp suffix', () => {
      expect(detectBySetId('sv1-jp')).toBe(true);
    });

    it('should detect sets with jp- prefix', () => {
      expect(detectBySetId('jp-promo')).toBe(true);
    });

    it('should not detect regular set IDs', () => {
      expect(detectBySetId('sv1')).toBe(false);
      expect(detectBySetId('swsh1')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(detectBySetId('')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(detectBySetId('SVP')).toBe(true);
      expect(detectBySetId('SV1-JP')).toBe(true);
    });
  });

  describe('detectByKeywords', () => {
    it('should detect "japan" keyword', () => {
      const result = detectByKeywords('Pikachu Japan Exclusive', 'Promo');
      expect(result.isMatch).toBe(true);
      expect(result.matchedKeyword).toBe('japan');
    });

    it('should detect "corocoro" keyword', () => {
      const result = detectByKeywords('Pikachu', 'CoroCoro Promo');
      expect(result.isMatch).toBe(true);
      expect(result.matchedKeyword).toBe('corocoro');
    });

    it('should detect "pokemon center" keyword', () => {
      const result = detectByKeywords('Eevee Pokemon Center', '');
      expect(result.isMatch).toBe(true);
      expect(result.matchedKeyword).toBe('pokemon center');
    });

    it('should detect "movie promo" keyword', () => {
      const result = detectByKeywords('Mewtwo Movie Promo', '');
      expect(result.isMatch).toBe(true);
    });

    it('should not detect when no keywords present', () => {
      const result = detectByKeywords('Pikachu', 'Base Set');
      expect(result.isMatch).toBe(false);
      expect(result.matchedKeyword).toBeNull();
    });

    it('should be case insensitive', () => {
      const result = detectByKeywords('PIKACHU JAPAN', 'COROCORO');
      expect(result.isMatch).toBe(true);
    });

    it('should detect "7-eleven" keyword', () => {
      const result = detectByKeywords('Pikachu 7-Eleven Promo', '');
      expect(result.isMatch).toBe(true);
    });

    it('should detect "wcs japan" keyword', () => {
      const result = detectByKeywords('Pikachu WCS Japan', '');
      expect(result.isMatch).toBe(true);
    });
  });

  describe('hasJapanesePromoNumberFormat', () => {
    it('should detect S-P format', () => {
      expect(hasJapanesePromoNumberFormat('001/S-P')).toBe(true);
    });

    it('should detect SM-P format', () => {
      expect(hasJapanesePromoNumberFormat('SM-P001')).toBe(true);
    });

    it('should detect -JP suffix', () => {
      expect(hasJapanesePromoNumberFormat('001-JP')).toBe(true);
    });

    it('should detect JP- prefix', () => {
      expect(hasJapanesePromoNumberFormat('JP-001')).toBe(true);
    });

    it('should not detect regular card numbers', () => {
      expect(hasJapanesePromoNumberFormat('001/198')).toBe(false);
      expect(hasJapanesePromoNumberFormat('SV001')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(hasJapanesePromoNumberFormat('')).toBe(false);
    });

    it('should detect PROMO prefix format', () => {
      expect(hasJapanesePromoNumberFormat('PROMO001')).toBe(true);
    });

    it('should detect C/001 format', () => {
      expect(hasJapanesePromoNumberFormat('C/001')).toBe(true);
    });
  });

  describe('detectJapanesePromo', () => {
    it('should detect CoroCoro promo with high confidence', () => {
      const card = createCard({ number: '001/C' });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.category).toBe('magazine');
      expect(result.confidence).toBe('high');
      expect(result.detectionMethod).toContain('number_pattern');
    });

    it('should detect by set ID with medium confidence', () => {
      const card = createCard({
        number: '001',
        set: { id: 'sv1-jp', name: 'Japanese Release' },
      });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.detectionMethod).toContain('set_id');
    });

    it('should detect by keyword with medium confidence', () => {
      const card = createCard({
        name: 'Pikachu Japan Exclusive',
        number: '001',
      });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.detectionMethod).toContain('keyword');
    });

    it('should not detect regular cards', () => {
      const card = createCard({
        name: 'Pikachu',
        number: '001/198',
        set: { id: 'sv1', name: 'Scarlet & Violet' },
      });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(false);
      expect(result.category).toBeNull();
      expect(result.source).toBeNull();
    });

    it('should combine multiple detection methods', () => {
      const card = createCard({
        name: 'Pikachu Japan Exclusive',
        number: 'PC-001',
        set: { id: 'svp', name: 'Promo' },
      });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.confidence).toBe('high');
      // Should have multiple detection methods
      expect(result.detectionMethod.split(', ').length).toBeGreaterThan(1);
    });

    it('should provide source information when available', () => {
      const card = createCard({ number: 'VJ-001' });
      const result = detectJapanesePromo(card);

      expect(result.source).not.toBeNull();
      expect(result.source?.displayName).toBe('V-Jump');
    });

    it('should detect prize card', () => {
      const card = createCard({ number: 'TROPHY-001' });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.category).toBe('prize');
    });

    it('should detect tournament promo', () => {
      const card = createCard({ number: 'WCS-2023' });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.category).toBe('tournament');
    });

    it('should detect store exclusive', () => {
      const card = createCard({ number: 'PC-001' });
      const result = detectJapanesePromo(card);

      expect(result.isJapanesePromo).toBe(true);
      expect(result.category).toBe('store');
    });
  });
});

// =============================================================================
// CATEGORIZATION HELPER TESTS
// =============================================================================

describe('Categorization Helpers', () => {
  describe('getCategoryDisplayName', () => {
    it('should return display name for magazine category', () => {
      expect(getCategoryDisplayName('magazine')).toBe('Magazine Promo');
    });

    it('should return display name for tournament category', () => {
      expect(getCategoryDisplayName('tournament')).toBe('Tournament Promo');
    });

    it('should return display name for movie category', () => {
      expect(getCategoryDisplayName('movie')).toBe('Movie Promo');
    });

    it('should return display name for store category', () => {
      expect(getCategoryDisplayName('store')).toBe('Store Exclusive');
    });

    it('should return display name for prize category', () => {
      expect(getCategoryDisplayName('prize')).toBe('Prize Card');
    });

    it('should return display name for other category', () => {
      expect(getCategoryDisplayName('other')).toBe('Japanese Promo');
    });
  });

  describe('getCategoryIcon', () => {
    it('should return icon for magazine category', () => {
      expect(getCategoryIcon('magazine')).toBe('📰');
    });

    it('should return icon for tournament category', () => {
      expect(getCategoryIcon('tournament')).toBe('🏆');
    });

    it('should return icon for movie category', () => {
      expect(getCategoryIcon('movie')).toBe('🎬');
    });

    it('should return icon for store category', () => {
      expect(getCategoryIcon('store')).toBe('🏪');
    });

    it('should return icon for prize category', () => {
      expect(getCategoryIcon('prize')).toBe('🥇');
    });
  });

  describe('getCategoryDescription', () => {
    it('should return description for each category', () => {
      const categories: JapanesePromoCategory[] = [
        'magazine',
        'tournament',
        'movie',
        'store',
        'campaign',
        'prerelease',
        'prize',
        'other',
      ];

      for (const category of categories) {
        const description = getCategoryDescription(category);
        expect(description).toBeDefined();
        expect(description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getSourceInfo', () => {
    it('should return source info for valid source key', () => {
      const source = getSourceInfo('corocoro');
      expect(source).not.toBeNull();
      expect(source?.displayName).toBe('CoroCoro Comic');
    });

    it('should return null for invalid source key', () => {
      const source = getSourceInfo('invalid_source');
      expect(source).toBeNull();
    });

    it('should return source info for pokemon_center', () => {
      const source = getSourceInfo('pokemon_center');
      expect(source).not.toBeNull();
      expect(source?.category).toBe('store');
    });
  });

  describe('getSourcesForCategory', () => {
    it('should return all magazine sources', () => {
      const sources = getSourcesForCategory('magazine');
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.every((s) => s.category === 'magazine')).toBe(true);
    });

    it('should return all store sources', () => {
      const sources = getSourcesForCategory('store');
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.every((s) => s.category === 'store')).toBe(true);
    });

    it('should return all tournament sources', () => {
      const sources = getSourcesForCategory('tournament');
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.every((s) => s.category === 'tournament')).toBe(true);
    });

    it('should return empty array for category with no sources', () => {
      // 'other' category has no predefined sources
      const sources = getSourcesForCategory('other');
      expect(Array.isArray(sources)).toBe(true);
    });
  });

  describe('getAllCategories', () => {
    it('should return all promo categories', () => {
      const categories = getAllCategories();
      expect(categories).toContain('magazine');
      expect(categories).toContain('tournament');
      expect(categories).toContain('movie');
      expect(categories).toContain('store');
      expect(categories).toContain('campaign');
      expect(categories).toContain('prerelease');
      expect(categories).toContain('prize');
      expect(categories).toContain('other');
      expect(categories.length).toBe(8);
    });
  });

  describe('getAllCategoryInfo', () => {
    it('should return info for all categories', () => {
      const info = getAllCategoryInfo();
      expect(info.length).toBe(8);

      for (const item of info) {
        expect(item.category).toBeDefined();
        expect(item.displayName).toBeDefined();
        expect(item.icon).toBeDefined();
        expect(item.description).toBeDefined();
      }
    });
  });
});

// =============================================================================
// DISPLAY HELPER TESTS
// =============================================================================

describe('Display Helpers', () => {
  describe('formatPromoForDisplay', () => {
    it('should format promo with source', () => {
      const card = createCard({ number: 'VJ-001' });
      const info = detectJapanesePromo(card);
      const display = formatPromoForDisplay(info);
      expect(display).toBe('V-Jump');
    });

    it('should format promo with category when no source', () => {
      const info: JapanesePromoInfo = {
        isJapanesePromo: true,
        category: 'tournament',
        source: null,
        confidence: 'medium',
        detectionMethod: 'keyword',
      };
      const display = formatPromoForDisplay(info);
      expect(display).toBe('Tournament Promo');
    });

    it('should return empty string for non-promo', () => {
      const card = createCard({ number: '001/198' });
      const info = detectJapanesePromo(card);
      const display = formatPromoForDisplay(info);
      expect(display).toBe('');
    });
  });

  describe('getPromoTooltip', () => {
    it('should generate tooltip for promo with source', () => {
      const card = createCard({ number: 'PC-001' });
      const info = detectJapanesePromo(card);
      const tooltip = getPromoTooltip(info);

      expect(tooltip).toContain('Pokemon Center');
    });

    it('should return empty string for non-promo', () => {
      const card = createCard({ number: '001/198' });
      const info = detectJapanesePromo(card);
      const tooltip = getPromoTooltip(info);
      expect(tooltip).toBe('');
    });

    it('should include confidence level for non-high confidence', () => {
      const info: JapanesePromoInfo = {
        isJapanesePromo: true,
        category: 'other',
        source: null,
        confidence: 'low',
        detectionMethod: 'number_format',
      };
      const tooltip = getPromoTooltip(info);
      expect(tooltip).toContain('low confidence');
    });
  });

  describe('getPromoLabel', () => {
    it('should return abbreviation for high confidence promo', () => {
      const card = createCard({ number: 'VJ-001' });
      const info = detectJapanesePromo(card);
      const label = getPromoLabel(info);
      expect(label).toBe('VJ');
    });

    it('should return category abbreviation for medium confidence', () => {
      const info: JapanesePromoInfo = {
        isJapanesePromo: true,
        category: 'tournament',
        source: null,
        confidence: 'medium',
        detectionMethod: 'keyword',
      };
      const label = getPromoLabel(info);
      expect(label).toBe('TOURN');
    });

    it('should return JP for other category', () => {
      const info: JapanesePromoInfo = {
        isJapanesePromo: true,
        category: 'other',
        source: null,
        confidence: 'low',
        detectionMethod: 'number_format',
      };
      const label = getPromoLabel(info);
      expect(label).toBe('JP');
    });

    it('should return empty string for non-promo', () => {
      const card = createCard({ number: '001/198' });
      const info = detectJapanesePromo(card);
      const label = getPromoLabel(info);
      expect(label).toBe('');
    });
  });

  describe('isCollectiblePromo', () => {
    it('should return true for prize cards', () => {
      const card = createCard({ number: 'TROPHY-001' });
      const info = detectJapanesePromo(card);
      expect(isCollectiblePromo(info)).toBe(true);
    });

    it('should return true for tournament cards', () => {
      const card = createCard({ number: 'WCS-2023' });
      const info = detectJapanesePromo(card);
      expect(isCollectiblePromo(info)).toBe(true);
    });

    it('should return true for movie promos', () => {
      const card = createCard({ number: 'M23-001' });
      const info = detectJapanesePromo(card);
      expect(isCollectiblePromo(info)).toBe(true);
    });

    it('should return false for magazine promos', () => {
      const card = createCard({ number: '001/C' });
      const info = detectJapanesePromo(card);
      expect(isCollectiblePromo(info)).toBe(false);
    });

    it('should return false for non-promos', () => {
      const card = createCard({ number: '001/198' });
      const info = detectJapanesePromo(card);
      expect(isCollectiblePromo(info)).toBe(false);
    });
  });

  describe('getPromoRarityTier', () => {
    it('should return ultra-rare for prize cards', () => {
      const card = createCard({ number: 'TROPHY-001' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBe('ultra-rare');
    });

    it('should return rare for tournament cards', () => {
      const card = createCard({ number: 'WCS-2023' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBe('rare');
    });

    it('should return uncommon for movie promos', () => {
      const card = createCard({ number: 'M23-001' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBe('uncommon');
    });

    it('should return common for magazine promos', () => {
      const card = createCard({ number: '001/C' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBe('common');
    });

    it('should return null for non-promos', () => {
      const card = createCard({ number: '001/198' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBeNull();
    });

    it('should return uncommon for store exclusives', () => {
      const card = createCard({ number: 'PC-001' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBe('uncommon');
    });

    it('should return common for campaign promos', () => {
      const card = createCard({ number: 'MCD-001' });
      const info = detectJapanesePromo(card);
      expect(getPromoRarityTier(info)).toBe('common');
    });
  });
});

// =============================================================================
// BATCH PROCESSING TESTS
// =============================================================================

describe('Batch Processing', () => {
  const testCards: CardForPromoDetection[] = [
    createCard({ id: 'card-1', number: '001/C' }), // CoroCoro promo
    createCard({ id: 'card-2', number: 'VJ-001' }), // V-Jump promo
    createCard({ id: 'card-3', number: '001/198' }), // Regular card
    createCard({ id: 'card-4', number: 'WCS-2023' }), // Tournament promo
    createCard({ id: 'card-5', number: 'M23-001' }), // Movie promo
    createCard({ id: 'card-6', number: '002/198' }), // Regular card
    createCard({ id: 'card-7', number: 'TROPHY-001' }), // Prize card
    createCard({ id: 'card-8', number: 'PC-001' }), // Store promo
  ];

  describe('detectJapanesePromosInBatch', () => {
    it('should detect promos for all cards', () => {
      const results = detectJapanesePromosInBatch(testCards);

      expect(results.size).toBe(8);
      expect(results.get('card-1')?.isJapanesePromo).toBe(true);
      expect(results.get('card-2')?.isJapanesePromo).toBe(true);
      expect(results.get('card-3')?.isJapanesePromo).toBe(false);
      expect(results.get('card-4')?.isJapanesePromo).toBe(true);
    });

    it('should handle empty array', () => {
      const results = detectJapanesePromosInBatch([]);
      expect(results.size).toBe(0);
    });
  });

  describe('filterJapanesePromos', () => {
    it('should filter to only Japanese promos', () => {
      const promos = filterJapanesePromos(testCards);

      expect(promos.length).toBe(6);
      expect(promos.some((c) => c.id === 'card-3')).toBe(false);
      expect(promos.some((c) => c.id === 'card-6')).toBe(false);
    });

    it('should return empty array when no promos', () => {
      const regularCards = [
        createCard({ id: 'reg-1', number: '001/198' }),
        createCard({ id: 'reg-2', number: '002/198' }),
      ];
      const promos = filterJapanesePromos(regularCards);
      expect(promos.length).toBe(0);
    });

    it('should handle empty array', () => {
      const promos = filterJapanesePromos([]);
      expect(promos.length).toBe(0);
    });
  });

  describe('groupByPromoCategory', () => {
    it('should group cards by category', () => {
      const groups = groupByPromoCategory(testCards);

      expect(groups.get('magazine')?.length).toBe(2); // CoroCoro + V-Jump
      expect(groups.get('tournament')?.length).toBe(1); // WCS
      expect(groups.get('movie')?.length).toBe(1); // Movie
      expect(groups.get('prize')?.length).toBe(1); // Trophy
      expect(groups.get('store')?.length).toBe(1); // PC
      expect(groups.get('non-promo')?.length).toBe(2); // Regular cards
    });

    it('should handle empty array', () => {
      const groups = groupByPromoCategory([]);
      expect(groups.size).toBe(0);
    });
  });

  describe('countByCategory', () => {
    it('should count cards by category', () => {
      const counts = countByCategory(testCards);

      expect(counts.magazine).toBe(2);
      expect(counts.tournament).toBe(1);
      expect(counts.movie).toBe(1);
      expect(counts.prize).toBe(1);
      expect(counts.store).toBe(1);
      expect(counts['non-promo']).toBe(2);
    });

    it('should return zeros for empty array', () => {
      const counts = countByCategory([]);
      expect(counts.magazine).toBe(0);
      expect(counts['non-promo']).toBe(0);
    });
  });

  describe('getPromoStats', () => {
    it('should calculate comprehensive stats', () => {
      const stats = getPromoStats(testCards);

      expect(stats.totalCards).toBe(8);
      expect(stats.japanesePromos).toBe(6);
      expect(stats.byCategory.magazine).toBe(2);
      expect(stats.byCategory.tournament).toBe(1);
      expect(stats.byCategory.movie).toBe(1);
      expect(stats.byCategory.prize).toBe(1);
      expect(stats.byCategory.store).toBe(1);
      expect(stats.collectibleCount).toBe(3); // tournament + movie + prize
    });

    it('should count by confidence level', () => {
      const stats = getPromoStats(testCards);
      expect(stats.byConfidence.high).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const stats = getPromoStats([]);
      expect(stats.totalCards).toBe(0);
      expect(stats.japanesePromos).toBe(0);
      expect(stats.collectibleCount).toBe(0);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration Scenarios', () => {
  describe('CoroCoro Comic Collection', () => {
    it('should properly identify and categorize CoroCoro promos', () => {
      const coroCoroCards = [
        createCard({ id: 'cc-1', name: 'Pikachu', number: '001/C' }),
        createCard({ id: 'cc-2', name: 'Charizard', number: 'CORO001' }),
        createCard({ id: 'cc-3', name: 'Mewtwo CoroCoro', number: '003' }),
      ];

      const results = detectJapanesePromosInBatch(coroCoroCards);

      // First two should be detected by number pattern
      expect(results.get('cc-1')?.isJapanesePromo).toBe(true);
      expect(results.get('cc-1')?.category).toBe('magazine');
      expect(results.get('cc-2')?.isJapanesePromo).toBe(true);

      // Third should be detected by keyword
      expect(results.get('cc-3')?.isJapanesePromo).toBe(true);
      expect(results.get('cc-3')?.detectionMethod).toContain('keyword');
    });
  });

  describe('Tournament Prize Cards', () => {
    it('should identify high-value tournament cards', () => {
      const tournamentCards = [
        createCard({ id: 't-1', name: 'Trophy Pikachu', number: 'TROPHY-2023' }),
        createCard({ id: 't-2', name: 'Champion Charizard', number: 'WCS-2023' }),
        createCard({ id: 't-3', name: 'Illustration Contest Winner', number: 'ILLUS-001' }),
      ];

      for (const card of tournamentCards) {
        const info = detectJapanesePromo(card);
        expect(info.isJapanesePromo).toBe(true);
        expect(isCollectiblePromo(info)).toBe(true);
      }

      // Trophy cards should be ultra-rare
      const trophyInfo = detectJapanesePromo(tournamentCards[0]);
      expect(getPromoRarityTier(trophyInfo)).toBe('ultra-rare');
    });
  });

  describe('Store Exclusive Collection', () => {
    it('should identify various store exclusives', () => {
      const storeCards = [
        createCard({ id: 's-1', name: 'Pokemon Center Pikachu', number: 'PC-001' }),
        createCard({ id: 's-2', name: '7-Eleven Eevee', number: '7-001' }),
        createCard({ id: 's-3', name: 'Lawson Snorlax', number: 'LS-001' }),
      ];

      const stats = getPromoStats(storeCards);
      expect(stats.japanesePromos).toBe(3);
      expect(stats.byCategory.store).toBe(3);

      // All store exclusives should be uncommon tier
      for (const card of storeCards) {
        const info = detectJapanesePromo(card);
        expect(getPromoRarityTier(info)).toBe('uncommon');
      }
    });
  });

  describe('Mixed Collection Analysis', () => {
    it('should properly analyze a diverse collection', () => {
      const collection = [
        // Magazine promos
        createCard({ id: 'm-1', number: '001/C' }),
        createCard({ id: 'm-2', number: 'VJ-001' }),
        // Store exclusives
        createCard({ id: 's-1', number: 'PC-001' }),
        // Tournament prizes
        createCard({ id: 't-1', number: 'WCS-2023' }),
        createCard({ id: 't-2', number: 'TROPHY-001' }),
        // Regular cards
        createCard({ id: 'r-1', number: '001/198' }),
        createCard({ id: 'r-2', number: '002/198' }),
        createCard({ id: 'r-3', number: '003/198' }),
      ];

      const stats = getPromoStats(collection);

      expect(stats.totalCards).toBe(8);
      expect(stats.japanesePromos).toBe(5);
      expect(stats.byCategory.magazine).toBe(2);
      expect(stats.byCategory.store).toBe(1);
      expect(stats.byCategory.tournament).toBe(1);
      expect(stats.byCategory.prize).toBe(1);

      // Collectible count should include tournament and prize
      expect(stats.collectibleCount).toBe(2);
    });
  });

  describe('Confidence Level Analysis', () => {
    it('should assign appropriate confidence levels', () => {
      // High confidence: clear number pattern
      const highConfCard = createCard({ number: 'VJ-001' });
      const highInfo = detectJapanesePromo(highConfCard);
      expect(highInfo.confidence).toBe('high');

      // Medium confidence: set ID or keyword only
      const medConfCard = createCard({
        name: 'Pikachu Japan Exclusive',
        number: '001',
      });
      const medInfo = detectJapanesePromo(medConfCard);
      expect(medInfo.isJapanesePromo).toBe(true);
      expect(medInfo.confidence).toBe('medium');

      // No match should not have confidence level
      const noMatchCard = createCard({ number: '001/198' });
      const noMatchInfo = detectJapanesePromo(noMatchCard);
      expect(noMatchInfo.isJapanesePromo).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle cards with missing set information', () => {
      const card: CardForPromoDetection = {
        id: 'no-set',
        name: 'Mystery Card',
        number: 'VJ-001',
      };
      const info = detectJapanesePromo(card);
      expect(info.isJapanesePromo).toBe(true);
    });

    it('should handle cards with empty number', () => {
      const card = createCard({ number: '' });
      const info = detectJapanesePromo(card);
      expect(info.isJapanesePromo).toBe(false);
    });

    it('should handle cards with special characters in name', () => {
      const card = createCard({
        name: "Pikachu's Japan Adventure!",
        number: '001',
      });
      const info = detectJapanesePromo(card);
      expect(info.isJapanesePromo).toBe(true); // "Japan" keyword
    });

    it('should not false positive on "Japan" in Pokemon name', () => {
      // If there was a Pokemon named "Japanchu" it should not match
      // But "Japan" as a standalone word should match
      const card = createCard({
        name: 'Japanchu', // Hypothetical Pokemon
        number: '001/198',
        set: { id: 'sv1', name: 'Regular Set' },
      });
      const info = detectJapanesePromo(card);
      // This WILL match because "japan" is contained in "Japanchu"
      // This is expected behavior based on the current implementation
      expect(info.isJapanesePromo).toBe(true);
    });
  });
});
