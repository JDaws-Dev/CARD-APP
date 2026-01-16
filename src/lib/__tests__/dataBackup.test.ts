import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  // Constants
  EXPORT_VERSION,
  VALID_VARIANTS,
  // Types
  type CardVariant,
  type ExportedCard,
  type ExportedWishlistCard,
  type ProfileExport,
  type ImportOptions,
  type ValidationResult,
  // Validation functions
  isValidCardId,
  isValidVariant,
  isValidQuantity,
  validateExportedCard,
  validateWishlistCard,
  isVersionCompatible,
  validateExportData,
  // Processing functions
  normalizeVariant,
  normalizeExportData,
  calculateExportStats,
  filterValidCards,
  filterValidWishlistCards,
  mergeCollections,
  replaceCollection,
  // Display helpers
  formatFileSize,
  formatExportDate,
  getTimeSinceBackup,
  generateExportFilename,
  getBackupRecommendation,
  estimateExportSize,
} from '../dataBackup';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Data Backup Constants', () => {
  it('should have a valid export version', () => {
    expect(EXPORT_VERSION).toBe('1.0.0');
    expect(EXPORT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should have all card variants defined', () => {
    expect(VALID_VARIANTS).toContain('normal');
    expect(VALID_VARIANTS).toContain('holofoil');
    expect(VALID_VARIANTS).toContain('reverseHolofoil');
    expect(VALID_VARIANTS).toContain('1stEditionHolofoil');
    expect(VALID_VARIANTS).toContain('1stEditionNormal');
    expect(VALID_VARIANTS).toHaveLength(5);
  });
});

// ============================================================================
// VALIDATION FUNCTION TESTS
// ============================================================================

describe('isValidCardId', () => {
  it('should return true for valid card IDs', () => {
    expect(isValidCardId('sv1-1')).toBe(true);
    expect(isValidCardId('base1-4')).toBe(true);
    expect(isValidCardId('xy-25')).toBe(true);
    expect(isValidCardId('sm12-150')).toBe(true);
  });

  it('should return true for card IDs without hyphen', () => {
    expect(isValidCardId('sv1001')).toBe(true);
    expect(isValidCardId('ab')).toBe(true);
  });

  it('should return false for invalid card IDs', () => {
    expect(isValidCardId('')).toBe(false);
    expect(isValidCardId('a')).toBe(false);
    expect(isValidCardId(null as unknown as string)).toBe(false);
    expect(isValidCardId(undefined as unknown as string)).toBe(false);
    expect(isValidCardId(123 as unknown as string)).toBe(false);
  });
});

describe('isValidVariant', () => {
  it('should return true for valid variants', () => {
    expect(isValidVariant('normal')).toBe(true);
    expect(isValidVariant('holofoil')).toBe(true);
    expect(isValidVariant('reverseHolofoil')).toBe(true);
    expect(isValidVariant('1stEditionHolofoil')).toBe(true);
    expect(isValidVariant('1stEditionNormal')).toBe(true);
  });

  it('should return true for undefined (default)', () => {
    expect(isValidVariant(undefined)).toBe(true);
  });

  it('should return false for invalid variants', () => {
    expect(isValidVariant('invalid')).toBe(false);
    expect(isValidVariant('NORMAL')).toBe(false);
    expect(isValidVariant('')).toBe(false);
  });
});

describe('isValidQuantity', () => {
  it('should return true for valid quantities', () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(10)).toBe(true);
    expect(isValidQuantity(100)).toBe(true);
    expect(isValidQuantity(999)).toBe(true);
  });

  it('should return false for invalid quantities', () => {
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
    expect(isValidQuantity(NaN)).toBe(false);
    expect(isValidQuantity('1' as unknown as number)).toBe(false);
  });
});

describe('validateExportedCard', () => {
  it('should validate a correct card', () => {
    const result = validateExportedCard({
      cardId: 'sv1-1',
      quantity: 2,
      variant: 'holofoil',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a card without variant', () => {
    const result = validateExportedCard({
      cardId: 'sv1-1',
      quantity: 1,
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid card ID', () => {
    const result = validateExportedCard({
      cardId: '',
      quantity: 1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid card ID: ');
  });

  it('should reject invalid quantity', () => {
    const result = validateExportedCard({
      cardId: 'sv1-1',
      quantity: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid quantity: 0');
  });

  it('should reject invalid variant', () => {
    const result = validateExportedCard({
      cardId: 'sv1-1',
      quantity: 1,
      variant: 'invalid',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid variant: invalid');
  });

  it('should reject non-object input', () => {
    const result = validateExportedCard(null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid card format');
  });
});

describe('validateWishlistCard', () => {
  it('should validate a correct wishlist card', () => {
    const result = validateWishlistCard({
      cardId: 'sv1-1',
      isPriority: true,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid card ID', () => {
    const result = validateWishlistCard({
      cardId: '',
      isPriority: false,
    });
    expect(result.isValid).toBe(false);
  });

  it('should reject non-boolean isPriority', () => {
    const result = validateWishlistCard({
      cardId: 'sv1-1',
      isPriority: 'true' as unknown as boolean,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('isPriority'))).toBe(true);
  });
});

describe('isVersionCompatible', () => {
  it('should accept 1.x versions', () => {
    expect(isVersionCompatible('1.0.0')).toBe(true);
    expect(isVersionCompatible('1.1.0')).toBe(true);
    expect(isVersionCompatible('1.99.99')).toBe(true);
  });

  it('should reject non-1.x versions', () => {
    expect(isVersionCompatible('2.0.0')).toBe(false);
    expect(isVersionCompatible('0.9.0')).toBe(false);
  });

  it('should reject invalid versions', () => {
    expect(isVersionCompatible('')).toBe(false);
    expect(isVersionCompatible(null as unknown as string)).toBe(false);
    expect(isVersionCompatible(undefined as unknown as string)).toBe(false);
  });
});

describe('validateExportData', () => {
  const createValidExportData = (): Partial<ProfileExport> => ({
    version: '1.0.0',
    collection: [{ cardId: 'sv1-1', quantity: 2, variant: 'normal' }],
    wishlist: [{ cardId: 'sv1-2', isPriority: true }],
  });

  it('should validate correct export data', () => {
    const result = validateExportData(createValidExportData());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid version', () => {
    const data = createValidExportData();
    data.version = '2.0.0';
    const result = validateExportData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('should reject missing collection', () => {
    const data = createValidExportData();
    delete (data as Record<string, unknown>).collection;
    const result = validateExportData(data);
    expect(result.isValid).toBe(false);
  });

  it('should add warnings for invalid wishlist cards', () => {
    const data = createValidExportData();
    data.wishlist = [{ cardId: '', isPriority: true }];
    const result = validateExportData(data);
    // Warnings don't affect validity
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should reject non-object input', () => {
    const result = validateExportData(null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid export data format');
  });
});

// ============================================================================
// PROCESSING FUNCTION TESTS
// ============================================================================

describe('normalizeVariant', () => {
  it('should return valid variants unchanged', () => {
    expect(normalizeVariant('normal')).toBe('normal');
    expect(normalizeVariant('holofoil')).toBe('holofoil');
    expect(normalizeVariant('reverseHolofoil')).toBe('reverseHolofoil');
  });

  it('should return normal for undefined', () => {
    expect(normalizeVariant(undefined)).toBe('normal');
  });

  it('should return normal for invalid variants', () => {
    expect(normalizeVariant('invalid')).toBe('normal');
    expect(normalizeVariant('')).toBe('normal');
  });
});

describe('normalizeExportData', () => {
  it('should normalize card variants', () => {
    const data: ProfileExport = {
      version: '1.0.0',
      exportedAt: Date.now(),
      profile: { displayName: 'Test' },
      collection: [
        { cardId: 'sv1-1', quantity: 2, variant: undefined },
        { cardId: 'sv1-2', quantity: 1.7, variant: 'invalid' },
      ],
      wishlist: [{ cardId: 'sv1-3', isPriority: false }],
      achievements: [],
      activityLogs: [],
      stats: { totalCards: 0, uniqueCards: 0, totalAchievements: 0, wishlistCount: 0 },
    };

    const normalized = normalizeExportData(data);
    expect(normalized.collection[0].variant).toBe('normal');
    expect(normalized.collection[1].variant).toBe('normal');
    expect(normalized.collection[1].quantity).toBe(1); // Floored
  });
});

describe('calculateExportStats', () => {
  it('should calculate correct statistics', () => {
    const data: ProfileExport = {
      version: '1.0.0',
      exportedAt: Date.now(),
      profile: { displayName: 'Test' },
      collection: [
        { cardId: 'sv1-1', quantity: 2 },
        { cardId: 'sv1-1', quantity: 3, variant: 'holofoil' },
        { cardId: 'sv1-2', quantity: 1 },
      ],
      wishlist: [
        { cardId: 'sv1-3', isPriority: true },
        { cardId: 'sv1-4', isPriority: false },
      ],
      achievements: [
        { achievementType: 'milestone', achievementKey: 'first_catch', earnedAt: Date.now() },
      ],
      activityLogs: [],
      stats: { totalCards: 0, uniqueCards: 0, totalAchievements: 0, wishlistCount: 0 },
    };

    const stats = calculateExportStats(data);
    expect(stats.totalCards).toBe(6); // 2 + 3 + 1
    expect(stats.uniqueCards).toBe(2); // sv1-1 and sv1-2
    expect(stats.totalAchievements).toBe(1);
    expect(stats.wishlistCount).toBe(2);
  });
});

describe('filterValidCards', () => {
  it('should filter out invalid cards', () => {
    const cards: ExportedCard[] = [
      { cardId: 'sv1-1', quantity: 2 },
      { cardId: '', quantity: 1 },
      { cardId: 'sv1-2', quantity: 0 },
      { cardId: 'sv1-3', quantity: 1 },
    ];

    const filtered = filterValidCards(cards);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.cardId)).toEqual(['sv1-1', 'sv1-3']);
  });
});

describe('filterValidWishlistCards', () => {
  it('should filter out invalid wishlist cards', () => {
    const cards: ExportedWishlistCard[] = [
      { cardId: 'sv1-1', isPriority: true },
      { cardId: '', isPriority: false },
      { cardId: 'sv1-2', isPriority: 'yes' as unknown as boolean },
      { cardId: 'sv1-3', isPriority: false },
    ];

    const filtered = filterValidWishlistCards(cards);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.cardId)).toEqual(['sv1-1', 'sv1-3']);
  });
});

describe('mergeCollections', () => {
  it('should merge collections by adding quantities', () => {
    const existing: ExportedCard[] = [
      { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
      { cardId: 'sv1-2', quantity: 1, variant: 'normal' },
    ];

    const incoming: ExportedCard[] = [
      { cardId: 'sv1-1', quantity: 3, variant: 'normal' },
      { cardId: 'sv1-3', quantity: 1, variant: 'normal' },
    ];

    const merged = mergeCollections(existing, incoming);

    expect(merged).toHaveLength(3);
    expect(merged.find((c) => c.cardId === 'sv1-1')?.quantity).toBe(5); // 2 + 3
    expect(merged.find((c) => c.cardId === 'sv1-2')?.quantity).toBe(1);
    expect(merged.find((c) => c.cardId === 'sv1-3')?.quantity).toBe(1);
  });

  it('should keep variants separate', () => {
    const existing: ExportedCard[] = [{ cardId: 'sv1-1', quantity: 2, variant: 'normal' }];

    const incoming: ExportedCard[] = [{ cardId: 'sv1-1', quantity: 1, variant: 'holofoil' }];

    const merged = mergeCollections(existing, incoming);

    expect(merged).toHaveLength(2);
    expect(merged.find((c) => c.variant === 'normal')?.quantity).toBe(2);
    expect(merged.find((c) => c.variant === 'holofoil')?.quantity).toBe(1);
  });
});

describe('replaceCollection', () => {
  it('should replace quantities from incoming', () => {
    const existing: ExportedCard[] = [
      { cardId: 'sv1-1', quantity: 10, variant: 'normal' },
      { cardId: 'sv1-2', quantity: 5, variant: 'normal' },
    ];

    const incoming: ExportedCard[] = [
      { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
      { cardId: 'sv1-3', quantity: 1, variant: 'normal' },
    ];

    const replaced = replaceCollection(existing, incoming);

    expect(replaced.find((c) => c.cardId === 'sv1-1')?.quantity).toBe(2); // Replaced
    expect(replaced.find((c) => c.cardId === 'sv1-2')?.quantity).toBe(5); // Kept
    expect(replaced.find((c) => c.cardId === 'sv1-3')?.quantity).toBe(1); // Added
  });
});

// ============================================================================
// DISPLAY HELPER TESTS
// ============================================================================

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});

describe('formatExportDate', () => {
  it('should format timestamp to readable date', () => {
    const timestamp = new Date('2026-01-15T14:30:00Z').getTime();
    const formatted = formatExportDate(timestamp);

    expect(formatted).toContain('2026');
    expect(formatted).toContain('January');
    expect(formatted).toContain('15');
  });
});

describe('getTimeSinceBackup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Just now" for recent timestamps', () => {
    const now = Date.now();
    expect(getTimeSinceBackup(now)).toBe('Just now');
    expect(getTimeSinceBackup(now - 30000)).toBe('Just now');
  });

  it('should return minutes ago', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60000;
    expect(getTimeSinceBackup(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should return hours ago', () => {
    const twoHoursAgo = Date.now() - 2 * 3600000;
    expect(getTimeSinceBackup(twoHoursAgo)).toBe('2 hours ago');
  });

  it('should return days ago', () => {
    const threeDaysAgo = Date.now() - 3 * 86400000;
    expect(getTimeSinceBackup(threeDaysAgo)).toBe('3 days ago');
  });

  it('should handle singular forms', () => {
    expect(getTimeSinceBackup(Date.now() - 60000)).toBe('1 minute ago');
    expect(getTimeSinceBackup(Date.now() - 3600000)).toBe('1 hour ago');
    expect(getTimeSinceBackup(Date.now() - 86400000)).toBe('1 day ago');
  });
});

describe('generateExportFilename', () => {
  it('should generate valid filename', () => {
    const filename = generateExportFilename('Test User');
    expect(filename).toMatch(/^carddex-backup-test-user-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('should sanitize special characters', () => {
    const filename = generateExportFilename('User@Name!');
    expect(filename).toMatch(/^carddex-backup-user-name-/);
    expect(filename).not.toContain('@');
    expect(filename).not.toContain('!');
  });
});

describe('getBackupRecommendation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return high urgency for no backup', () => {
    const result = getBackupRecommendation(null);
    expect(result.urgency).toBe('high');
    expect(result.message).toContain("haven't backed up");
  });

  it('should return none for recent backup', () => {
    const twoDaysAgo = Date.now() - 2 * 86400000;
    const result = getBackupRecommendation(twoDaysAgo);
    expect(result.urgency).toBe('none');
  });

  it('should return low for 7-14 days', () => {
    const tenDaysAgo = Date.now() - 10 * 86400000;
    const result = getBackupRecommendation(tenDaysAgo);
    expect(result.urgency).toBe('low');
  });

  it('should return medium for 14-30 days', () => {
    const twentyDaysAgo = Date.now() - 20 * 86400000;
    const result = getBackupRecommendation(twentyDaysAgo);
    expect(result.urgency).toBe('medium');
  });

  it('should return high for 30+ days', () => {
    const fortyDaysAgo = Date.now() - 40 * 86400000;
    const result = getBackupRecommendation(fortyDaysAgo);
    expect(result.urgency).toBe('high');
    expect(result.message).toContain('month');
  });
});

describe('estimateExportSize', () => {
  it('should estimate size based on stats', () => {
    const stats = {
      totalCards: 100,
      uniqueCards: 50,
      totalAchievements: 10,
      wishlistCount: 20,
    };

    const estimate = estimateExportSize(stats);
    expect(estimate).toBeGreaterThan(0);
    // 100 cards * 100 bytes + 20 wishlist * 50 + 10 achievements * 80 + 500 overhead
    // = 10000 + 1000 + 800 + 500 = 12300
    expect(estimate).toBe(12300);
  });

  it('should handle empty stats', () => {
    const stats = {
      totalCards: 0,
      uniqueCards: 0,
      totalAchievements: 0,
      wishlistCount: 0,
    };

    const estimate = estimateExportSize(stats);
    expect(estimate).toBe(500); // Just overhead
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Data Backup Integration', () => {
  describe('Complete export validation workflow', () => {
    it('should validate and normalize a complete export', () => {
      const exportData: ProfileExport = {
        version: '1.0.0',
        exportedAt: Date.now(),
        profile: { displayName: 'Test Collector', profileType: 'child' },
        collection: [
          { cardId: 'sv1-1', quantity: 2, variant: 'holofoil' },
          { cardId: 'sv1-2', quantity: 1 },
          { cardId: 'sv1-3', quantity: 3, variant: 'reverseHolofoil' },
        ],
        wishlist: [
          { cardId: 'sv1-100', isPriority: true },
          { cardId: 'sv1-101', isPriority: false },
        ],
        achievements: [
          { achievementType: 'milestone', achievementKey: 'first_catch', earnedAt: Date.now() },
        ],
        activityLogs: [],
        stats: { totalCards: 6, uniqueCards: 3, totalAchievements: 1, wishlistCount: 2 },
      };

      // Validate
      const validation = validateExportData(exportData);
      expect(validation.isValid).toBe(true);

      // Normalize
      const normalized = normalizeExportData(exportData);
      expect(normalized.collection[1].variant).toBe('normal');

      // Calculate stats
      const stats = calculateExportStats(normalized);
      expect(stats.totalCards).toBe(6);
      expect(stats.uniqueCards).toBe(3);
    });
  });

  describe('Collection merge workflow', () => {
    it('should correctly merge two collections', () => {
      const existing: ExportedCard[] = [
        { cardId: 'sv1-1', quantity: 4, variant: 'normal' },
        { cardId: 'sv1-1', quantity: 2, variant: 'holofoil' },
        { cardId: 'sv1-2', quantity: 1, variant: 'normal' },
      ];

      const incoming: ExportedCard[] = [
        { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
        { cardId: 'sv1-1', quantity: 1, variant: 'holofoil' },
        { cardId: 'sv1-3', quantity: 3, variant: 'normal' },
      ];

      const merged = mergeCollections(existing, incoming);

      // Should have 4 entries: sv1-1 normal, sv1-1 holofoil, sv1-2 normal, sv1-3 normal
      expect(merged).toHaveLength(4);

      const sv1Normal = merged.find((c) => c.cardId === 'sv1-1' && c.variant === 'normal');
      expect(sv1Normal?.quantity).toBe(6); // 4 + 2

      const sv1Holo = merged.find((c) => c.cardId === 'sv1-1' && c.variant === 'holofoil');
      expect(sv1Holo?.quantity).toBe(3); // 2 + 1
    });
  });

  describe('Backup recommendation workflow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should provide appropriate recommendations based on backup age', () => {
      // New user, never backed up
      expect(getBackupRecommendation(null).urgency).toBe('high');

      // Backed up yesterday
      const yesterday = Date.now() - 86400000;
      expect(getBackupRecommendation(yesterday).urgency).toBe('none');

      // Backed up 10 days ago
      const tenDaysAgo = Date.now() - 10 * 86400000;
      expect(getBackupRecommendation(tenDaysAgo).urgency).toBe('low');

      // Backed up 3 weeks ago
      const threeWeeksAgo = Date.now() - 21 * 86400000;
      expect(getBackupRecommendation(threeWeeksAgo).urgency).toBe('medium');

      // Backed up 2 months ago
      const twoMonthsAgo = Date.now() - 60 * 86400000;
      expect(getBackupRecommendation(twoMonthsAgo).urgency).toBe('high');
    });
  });
});
