import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  // Constants
  INTEGRITY_VERSION,
  VALID_VARIANTS,
  // Types
  type DeviceType,
  type CardVariant,
  type PersistenceCard,
  type PersistenceWishlistCard,
  type PersistenceAchievement,
  type DataSnapshot,
  type DataStats,
  type DataHealthStatus,
  // Checksum functions
  hashCode,
  computeCollectionChecksum,
  computeWishlistChecksum,
  computeAchievementChecksum,
  computeFullChecksum,
  // Device identification
  generateDeviceId,
  getOrCreateDeviceId,
  detectDeviceType,
  getDeviceName,
  // Local storage
  saveLocalChecksum,
  getLocalChecksum,
  saveLocalSnapshot,
  getLocalSnapshot,
  clearLocalPersistenceData,
  // Validation
  isValidCardId,
  isValidVariant,
  isValidQuantity,
  validatePersistenceCard,
  validateDataSnapshot,
  // Comparison & diff
  compareChecksums,
  diffCollections,
  // Display helpers
  getDataHealthMessage,
  getDataHealthColor,
  formatSyncTime,
  getSyncStatusMessage,
  formatDataStats,
} from '../dataPersistence';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Data Persistence Constants', () => {
  it('should have a valid integrity version', () => {
    expect(INTEGRITY_VERSION).toBe(1);
    expect(typeof INTEGRITY_VERSION).toBe('number');
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
// CHECKSUM FUNCTION TESTS
// ============================================================================

describe('hashCode', () => {
  it('should return consistent hash for same input', () => {
    const input = 'test string';
    expect(hashCode(input)).toBe(hashCode(input));
  });

  it('should return different hash for different input', () => {
    expect(hashCode('test1')).not.toBe(hashCode('test2'));
  });

  it('should return 0 for empty string', () => {
    expect(hashCode('')).toBe(0);
  });

  it('should handle long strings', () => {
    const longString = 'a'.repeat(10000);
    const hash = hashCode(longString);
    expect(typeof hash).toBe('number');
    expect(Number.isInteger(hash)).toBe(true);
  });

  it('should handle special characters', () => {
    const hash = hashCode('test|string|with|pipes');
    expect(typeof hash).toBe('number');
  });
});

describe('computeCollectionChecksum', () => {
  it('should compute checksum for collection', () => {
    const cards: PersistenceCard[] = [
      { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
    ];
    const checksum = computeCollectionChecksum(cards);
    expect(typeof checksum).toBe('number');
  });

  it('should return same checksum regardless of order', () => {
    const cards1: PersistenceCard[] = [
      { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
    ];
    const cards2: PersistenceCard[] = [
      { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
      { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
    ];
    expect(computeCollectionChecksum(cards1)).toBe(computeCollectionChecksum(cards2));
  });

  it('should return different checksum for different data', () => {
    const cards1: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
    const cards2: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 3 }];
    expect(computeCollectionChecksum(cards1)).not.toBe(computeCollectionChecksum(cards2));
  });

  it('should handle empty collection', () => {
    const checksum = computeCollectionChecksum([]);
    expect(checksum).toBe(0);
  });
});

describe('computeWishlistChecksum', () => {
  it('should compute checksum for wishlist', () => {
    const wishlist: PersistenceWishlistCard[] = [
      { cardId: 'sv1-1', isPriority: true },
      { cardId: 'sv1-2', isPriority: false },
    ];
    const checksum = computeWishlistChecksum(wishlist);
    expect(typeof checksum).toBe('number');
  });

  it('should return same checksum regardless of order', () => {
    const wishlist1: PersistenceWishlistCard[] = [
      { cardId: 'sv1-1', isPriority: true },
      { cardId: 'sv1-2', isPriority: false },
    ];
    const wishlist2: PersistenceWishlistCard[] = [
      { cardId: 'sv1-2', isPriority: false },
      { cardId: 'sv1-1', isPriority: true },
    ];
    expect(computeWishlistChecksum(wishlist1)).toBe(computeWishlistChecksum(wishlist2));
  });
});

describe('computeAchievementChecksum', () => {
  it('should compute checksum for achievements', () => {
    const achievements: PersistenceAchievement[] = [
      { achievementType: 'milestone', achievementKey: 'first_card', earnedAt: 1000 },
      { achievementType: 'streak', achievementKey: 'week_streak', earnedAt: 2000 },
    ];
    const checksum = computeAchievementChecksum(achievements);
    expect(typeof checksum).toBe('number');
  });
});

describe('computeFullChecksum', () => {
  it('should compute full checksum with stats', () => {
    const collection: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
    const wishlist: PersistenceWishlistCard[] = [{ cardId: 'sv1-2', isPriority: true }];
    const achievements: PersistenceAchievement[] = [
      { achievementType: 'milestone', achievementKey: 'first_card', earnedAt: 1000 },
    ];

    const result = computeFullChecksum(collection, wishlist, achievements);

    expect(result.checksum).toBeDefined();
    expect(result.stats.collectionCards).toBe(1);
    expect(result.stats.totalQuantity).toBe(2);
    expect(result.stats.uniqueCardIds).toBe(1);
    expect(result.stats.wishlistCards).toBe(1);
    expect(result.stats.achievements).toBe(1);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('should count unique cards correctly', () => {
    const collection: PersistenceCard[] = [
      { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      { cardId: 'sv1-1', variant: 'holofoil', quantity: 1 },
      { cardId: 'sv1-2', variant: 'normal', quantity: 3 },
    ];

    const result = computeFullChecksum(collection, [], []);

    expect(result.stats.collectionCards).toBe(3);
    expect(result.stats.totalQuantity).toBe(6);
    expect(result.stats.uniqueCardIds).toBe(2);
  });
});

// ============================================================================
// DEVICE IDENTIFICATION TESTS
// ============================================================================

describe('generateDeviceId', () => {
  it('should generate unique device IDs', () => {
    const id1 = generateDeviceId();
    const id2 = generateDeviceId();
    expect(id1).not.toBe(id2);
  });

  it('should start with device_ prefix', () => {
    const id = generateDeviceId();
    expect(id).toMatch(/^device_/);
  });

  it('should generate alphanumeric IDs', () => {
    const id = generateDeviceId();
    expect(id).toMatch(/^device_[a-z0-9]+$/);
  });
});

describe('getOrCreateDeviceId', () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create new device ID if none exists', () => {
    const id = getOrCreateDeviceId();
    expect(id).toMatch(/^device_/);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should return existing device ID', () => {
    mockLocalStorage['carddex_device_id'] = 'device_existing123';
    const id = getOrCreateDeviceId();
    expect(id).toBe('device_existing123');
  });
});

describe('detectDeviceType', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect iOS devices', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    });
    expect(detectDeviceType()).toBe('ios');
  });

  it('should detect Android devices', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B)',
    });
    expect(detectDeviceType()).toBe('android');
  });

  it('should detect web browsers', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/100.0',
    });
    expect(detectDeviceType()).toBe('web');
  });

  it('should return unknown for undefined navigator', () => {
    vi.stubGlobal('navigator', undefined);
    expect(detectDeviceType()).toBe('unknown');
  });
});

describe('getDeviceName', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return iPhone for iOS', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    });
    expect(getDeviceName()).toBe('iPhone');
  });

  it('should return iPad for iPad', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    });
    expect(getDeviceName()).toBe('iPad');
  });

  it('should return Mac for macOS', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });
    expect(getDeviceName()).toBe('Mac');
  });

  it('should return Windows for Windows', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
    expect(getDeviceName()).toBe('Windows');
  });
});

// ============================================================================
// LOCAL STORAGE TESTS
// ============================================================================

describe('Local Storage Functions', () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveLocalChecksum and getLocalChecksum', () => {
    it('should save and retrieve checksum', () => {
      const profileId = 'profile123';
      const checksum = 12345;
      const stats: DataStats = {
        collectionCards: 10,
        totalQuantity: 25,
        uniqueCardIds: 8,
        wishlistCards: 5,
        achievements: 3,
      };

      saveLocalChecksum(profileId, checksum, stats);
      const result = getLocalChecksum(profileId);

      expect(result).not.toBeNull();
      expect(result?.checksum).toBe(checksum);
      expect(result?.stats.collectionCards).toBe(10);
      expect(result?.savedAt).toBeGreaterThan(0);
    });

    it('should return null for non-existent profile', () => {
      const result = getLocalChecksum('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('saveLocalSnapshot and getLocalSnapshot', () => {
    it('should save and retrieve snapshot', () => {
      const profileId = 'profile123';
      const snapshot: DataSnapshot = {
        version: INTEGRITY_VERSION,
        createdAt: Date.now(),
        checksum: 12345,
        collection: [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }],
        wishlist: [{ cardId: 'sv1-2', isPriority: true }],
        achievements: [
          { achievementType: 'milestone', achievementKey: 'first_card', earnedAt: 1000 },
        ],
        stats: {
          collectionCards: 1,
          totalQuantity: 2,
          uniqueCardIds: 1,
          wishlistCards: 1,
          achievements: 1,
        },
      };

      const saved = saveLocalSnapshot(profileId, snapshot);
      expect(saved).toBe(true);

      const result = getLocalSnapshot(profileId);
      expect(result).not.toBeNull();
      expect(result?.checksum).toBe(12345);
      expect(result?.collection).toHaveLength(1);
    });

    it('should return null for non-existent snapshot', () => {
      const result = getLocalSnapshot('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('clearLocalPersistenceData', () => {
    it('should clear all persistence data for a profile', () => {
      const profileId = 'profile123';

      // Save some data first
      saveLocalChecksum(profileId, 12345, {
        collectionCards: 10,
        totalQuantity: 25,
        uniqueCardIds: 8,
        wishlistCards: 5,
        achievements: 3,
      });

      clearLocalPersistenceData(profileId);

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        `carddex_persistence_checksum_${profileId}`
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        `carddex_persistence_snapshot_${profileId}`
      );
    });
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('isValidCardId', () => {
  it('should return true for valid card IDs', () => {
    expect(isValidCardId('sv1-1')).toBe(true);
    expect(isValidCardId('base1-4')).toBe(true);
    expect(isValidCardId('xy-25')).toBe(true);
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

  it('should return false for invalid variants', () => {
    expect(isValidVariant('invalid')).toBe(false);
    expect(isValidVariant(undefined)).toBe(false);
    expect(isValidVariant('')).toBe(false);
  });
});

describe('isValidQuantity', () => {
  it('should return true for valid quantities', () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(10)).toBe(true);
    expect(isValidQuantity(999)).toBe(true);
  });

  it('should return false for invalid quantities', () => {
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
    expect(isValidQuantity(NaN)).toBe(false);
  });
});

describe('validatePersistenceCard', () => {
  it('should validate a correct card', () => {
    const result = validatePersistenceCard({
      cardId: 'sv1-1',
      variant: 'holofoil',
      quantity: 2,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid card ID', () => {
    const result = validatePersistenceCard({
      cardId: '',
      variant: 'normal',
      quantity: 1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('card ID'))).toBe(true);
  });

  it('should reject invalid variant', () => {
    const result = validatePersistenceCard({
      cardId: 'sv1-1',
      variant: 'invalid',
      quantity: 1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('variant'))).toBe(true);
  });

  it('should reject invalid quantity', () => {
    const result = validatePersistenceCard({
      cardId: 'sv1-1',
      variant: 'normal',
      quantity: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('quantity'))).toBe(true);
  });

  it('should reject non-object input', () => {
    const result = validatePersistenceCard(null);
    expect(result.isValid).toBe(false);
  });
});

describe('validateDataSnapshot', () => {
  const createValidSnapshot = (): DataSnapshot => ({
    version: INTEGRITY_VERSION,
    createdAt: Date.now(),
    checksum: 12345,
    collection: [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }],
    wishlist: [{ cardId: 'sv1-2', isPriority: true }],
    achievements: [{ achievementType: 'milestone', achievementKey: 'first', earnedAt: 1000 }],
    stats: {
      collectionCards: 1,
      totalQuantity: 2,
      uniqueCardIds: 1,
      wishlistCards: 1,
      achievements: 1,
    },
  });

  it('should validate a correct snapshot', () => {
    const result = validateDataSnapshot(createValidSnapshot());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should warn about version mismatch', () => {
    const snapshot = createValidSnapshot();
    snapshot.version = 999;
    const result = validateDataSnapshot(snapshot);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('version');
  });

  it('should reject missing checksum', () => {
    const snapshot = createValidSnapshot();
    delete (snapshot as Record<string, unknown>).checksum;
    const result = validateDataSnapshot(snapshot);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('checksum'))).toBe(true);
  });

  it('should reject missing collection', () => {
    const snapshot = createValidSnapshot();
    delete (snapshot as Record<string, unknown>).collection;
    const result = validateDataSnapshot(snapshot);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('collection'))).toBe(true);
  });

  it('should reject non-object input', () => {
    const result = validateDataSnapshot(null);
    expect(result.isValid).toBe(false);
  });
});

// ============================================================================
// COMPARISON & DIFF TESTS
// ============================================================================

describe('compareChecksums', () => {
  const baseStats: DataStats = {
    collectionCards: 10,
    totalQuantity: 25,
    uniqueCardIds: 8,
    wishlistCards: 5,
    achievements: 3,
  };

  it('should return valid for matching checksums and stats', () => {
    const result = compareChecksums(12345, 12345, baseStats, baseStats);
    expect(result.isValid).toBe(true);
    expect(result.discrepancies).toHaveLength(0);
  });

  it('should detect checksum mismatch', () => {
    const result = compareChecksums(12345, 54321, baseStats, baseStats);
    expect(result.isValid).toBe(false);
    expect(result.discrepancies.some((d) => d.includes('Checksum'))).toBe(true);
  });

  it('should detect collection card count mismatch', () => {
    const serverStats = { ...baseStats, collectionCards: 15 };
    const result = compareChecksums(12345, 12345, baseStats, serverStats);
    expect(result.isValid).toBe(false);
    expect(result.discrepancies.some((d) => d.includes('card entries'))).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should detect wishlist mismatch', () => {
    const serverStats = { ...baseStats, wishlistCards: 10 };
    const result = compareChecksums(12345, 12345, baseStats, serverStats);
    expect(result.isValid).toBe(false);
    expect(result.discrepancies.some((d) => d.includes('Wishlist'))).toBe(true);
  });

  it('should detect achievement mismatch', () => {
    const serverStats = { ...baseStats, achievements: 5 };
    const result = compareChecksums(12345, 12345, baseStats, serverStats);
    expect(result.isValid).toBe(false);
    expect(result.discrepancies.some((d) => d.includes('Achievement'))).toBe(true);
  });
});

describe('diffCollections', () => {
  it('should find cards only in local', () => {
    const local: PersistenceCard[] = [
      { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      { cardId: 'sv1-2', variant: 'normal', quantity: 1 },
    ];
    const server: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];

    const diff = diffCollections(local, server);

    expect(diff.onlyInLocal).toHaveLength(1);
    expect(diff.onlyInLocal[0].cardId).toBe('sv1-2');
    expect(diff.onlyInServer).toHaveLength(0);
    expect(diff.quantityDifferences).toHaveLength(0);
  });

  it('should find cards only in server', () => {
    const local: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
    const server: PersistenceCard[] = [
      { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      { cardId: 'sv1-3', variant: 'holofoil', quantity: 1 },
    ];

    const diff = diffCollections(local, server);

    expect(diff.onlyInLocal).toHaveLength(0);
    expect(diff.onlyInServer).toHaveLength(1);
    expect(diff.onlyInServer[0].cardId).toBe('sv1-3');
  });

  it('should find quantity differences', () => {
    const local: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
    const server: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 5 }];

    const diff = diffCollections(local, server);

    expect(diff.quantityDifferences).toHaveLength(1);
    expect(diff.quantityDifferences[0].localQuantity).toBe(2);
    expect(diff.quantityDifferences[0].serverQuantity).toBe(5);
  });

  it('should handle empty collections', () => {
    const diff = diffCollections([], []);

    expect(diff.onlyInLocal).toHaveLength(0);
    expect(diff.onlyInServer).toHaveLength(0);
    expect(diff.quantityDifferences).toHaveLength(0);
  });

  it('should treat different variants as different cards', () => {
    const local: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
    const server: PersistenceCard[] = [{ cardId: 'sv1-1', variant: 'holofoil', quantity: 2 }];

    const diff = diffCollections(local, server);

    expect(diff.onlyInLocal).toHaveLength(1);
    expect(diff.onlyInServer).toHaveLength(1);
  });
});

// ============================================================================
// DISPLAY HELPER TESTS
// ============================================================================

describe('getDataHealthMessage', () => {
  it('should return correct messages for each status', () => {
    expect(getDataHealthMessage('healthy')).toContain('safe');
    expect(getDataHealthMessage('warning')).toContain('not be synced');
    expect(getDataHealthMessage('error')).toContain('issue');
    expect(getDataHealthMessage('empty')).toContain('No collection');
    expect(getDataHealthMessage('unknown')).toContain('Unable');
  });
});

describe('getDataHealthColor', () => {
  it('should return correct colors for each status', () => {
    expect(getDataHealthColor('healthy')).toBe('green');
    expect(getDataHealthColor('warning')).toBe('yellow');
    expect(getDataHealthColor('error')).toBe('red');
    expect(getDataHealthColor('empty')).toBe('gray');
    expect(getDataHealthColor('unknown')).toBe('gray');
  });
});

describe('formatSyncTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Never" for null', () => {
    expect(formatSyncTime(null)).toBe('Never');
  });

  it('should return "Just now" for recent times', () => {
    expect(formatSyncTime(Date.now() - 30000)).toBe('Just now');
  });

  it('should return minutes ago', () => {
    expect(formatSyncTime(Date.now() - 5 * 60000)).toBe('5 minutes ago');
    expect(formatSyncTime(Date.now() - 1 * 60000)).toBe('1 minute ago');
  });

  it('should return hours ago', () => {
    expect(formatSyncTime(Date.now() - 2 * 3600000)).toBe('2 hours ago');
    expect(formatSyncTime(Date.now() - 1 * 3600000)).toBe('1 hour ago');
  });

  it('should return days ago', () => {
    expect(formatSyncTime(Date.now() - 3 * 86400000)).toBe('3 days ago');
    expect(formatSyncTime(Date.now() - 1 * 86400000)).toBe('1 day ago');
  });

  it('should return formatted date for older times', () => {
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    const result = formatSyncTime(twoWeeksAgo);
    // Should be a formatted date string, not "X days ago"
    expect(result).not.toContain('days ago');
  });
});

describe('getSyncStatusMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return high urgency for no sync', () => {
    const result = getSyncStatusMessage(null);
    expect(result.urgency).toBe('high');
    expect(result.message).toContain('never');
  });

  it('should return none for recent sync', () => {
    const result = getSyncStatusMessage(Date.now() - 12 * 3600000);
    expect(result.urgency).toBe('none');
    expect(result.message).toContain('recently');
  });

  it('should return low for 1-7 days', () => {
    const result = getSyncStatusMessage(Date.now() - 3 * 86400000);
    expect(result.urgency).toBe('low');
  });

  it('should return medium for 7-30 days', () => {
    const result = getSyncStatusMessage(Date.now() - 14 * 86400000);
    expect(result.urgency).toBe('medium');
  });

  it('should return high for 30+ days', () => {
    const result = getSyncStatusMessage(Date.now() - 45 * 86400000);
    expect(result.urgency).toBe('high');
    expect(result.message).toContain('month');
  });
});

describe('formatDataStats', () => {
  it('should format stats with all data', () => {
    const stats: DataStats = {
      collectionCards: 50,
      totalQuantity: 100,
      uniqueCardIds: 50,
      wishlistCards: 10,
      achievements: 5,
    };
    const result = formatDataStats(stats);
    expect(result).toContain('100 cards');
    expect(result).toContain('50 unique');
    expect(result).toContain('10 wishlist');
    expect(result).toContain('5 achievements');
  });

  it('should return "No data" for empty stats', () => {
    const stats: DataStats = {
      collectionCards: 0,
      totalQuantity: 0,
      uniqueCardIds: 0,
      wishlistCards: 0,
      achievements: 0,
    };
    const result = formatDataStats(stats);
    expect(result).toBe('No data');
  });

  it('should omit zero values', () => {
    const stats: DataStats = {
      collectionCards: 10,
      totalQuantity: 20,
      uniqueCardIds: 10,
      wishlistCards: 0,
      achievements: 0,
    };
    const result = formatDataStats(stats);
    expect(result).toContain('20 cards');
    expect(result).not.toContain('wishlist');
    expect(result).not.toContain('achievements');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Data Persistence Integration', () => {
  describe('Full checksum workflow', () => {
    it('should compute consistent checksums across operations', () => {
      const collection: PersistenceCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
        { cardId: 'sv1-3', variant: 'normal', quantity: 3 },
      ];
      const wishlist: PersistenceWishlistCard[] = [
        { cardId: 'sv1-10', isPriority: true },
        { cardId: 'sv1-20', isPriority: false },
      ];
      const achievements: PersistenceAchievement[] = [
        { achievementType: 'milestone', achievementKey: 'first_card', earnedAt: 1000 },
        { achievementType: 'streak', achievementKey: 'week', earnedAt: 2000 },
      ];

      // Compute full checksum
      const result1 = computeFullChecksum(collection, wishlist, achievements);

      // Compute again - should be identical
      const result2 = computeFullChecksum(collection, wishlist, achievements);

      expect(result1.checksum).toBe(result2.checksum);
      expect(result1.stats).toEqual(result2.stats);
    });
  });

  describe('Collection diff workflow', () => {
    it('should correctly identify all differences', () => {
      const local: PersistenceCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'normal', quantity: 5 },
        { cardId: 'sv1-local', variant: 'normal', quantity: 1 },
      ];

      const server: PersistenceCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 }, // Same
        { cardId: 'sv1-2', variant: 'normal', quantity: 3 }, // Different quantity
        { cardId: 'sv1-server', variant: 'holofoil', quantity: 1 }, // Only on server
      ];

      const diff = diffCollections(local, server);

      // sv1-local is only in local
      expect(diff.onlyInLocal).toHaveLength(1);
      expect(diff.onlyInLocal[0].cardId).toBe('sv1-local');

      // sv1-server is only in server
      expect(diff.onlyInServer).toHaveLength(1);
      expect(diff.onlyInServer[0].cardId).toBe('sv1-server');

      // sv1-2 has quantity difference
      expect(diff.quantityDifferences).toHaveLength(1);
      expect(diff.quantityDifferences[0].cardId).toBe('sv1-2');
      expect(diff.quantityDifferences[0].localQuantity).toBe(5);
      expect(diff.quantityDifferences[0].serverQuantity).toBe(3);
    });
  });

  describe('Validation workflow', () => {
    it('should validate and report errors for invalid snapshot', () => {
      const invalidSnapshot = {
        version: INTEGRITY_VERSION,
        createdAt: Date.now(),
        checksum: 12345,
        collection: [
          { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
          { cardId: '', variant: 'invalid', quantity: 0 }, // Invalid card
        ],
        wishlist: [],
        achievements: [],
        stats: {
          collectionCards: 2,
          totalQuantity: 2,
          uniqueCardIds: 1,
          wishlistCards: 0,
          achievements: 0,
        },
      };

      const result = validateDataSnapshot(invalidSnapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should have errors for card ID, variant, and quantity
      expect(result.errors.some((e) => e.includes('card ID'))).toBe(true);
      expect(result.errors.some((e) => e.includes('variant'))).toBe(true);
      expect(result.errors.some((e) => e.includes('quantity'))).toBe(true);
    });
  });
});
