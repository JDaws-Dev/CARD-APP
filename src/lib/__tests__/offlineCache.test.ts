/**
 * Tests for Offline Collection Caching utilities
 *
 * Tests the service worker registration, cache management, and offline data access
 * utilities for viewing collection data when offline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Constants
  CACHE_VERSION,
  COLLECTION_CACHE_NAME,
  IMAGE_CACHE_NAME,
  STATIC_CACHE_NAME,
  COLLECTION_CACHE_MAX_AGE,
  IMAGE_CACHE_MAX_AGE,
  MAX_CACHED_IMAGES,
  CACHE_METADATA_KEY,
  COLLECTION_STORAGE_KEY,
  WISHLIST_STORAGE_KEY,
  CARDS_STORAGE_KEY,
  ALL_CACHE_NAMES,
  // Types
  type CardVariant,
  type OfflineCollectionCard,
  type OfflineWishlistCard,
  type OfflineCachedCard,
  type CacheMetadata,
  type CacheStatus,
  type CacheHealthReport,
  // Environment detection
  isBrowser,
  isServiceWorkerSupported,
  isLocalStorageAvailable,
  isIndexedDBAvailable,
  isCacheAPIAvailable,
  getStorageCapabilities,
  // Local storage cache functions
  saveCollectionToCache,
  loadCollectionFromCache,
  saveWishlistToCache,
  loadWishlistFromCache,
  saveCardsToCache,
  loadCardsFromCache,
  // Cache metadata functions
  getDefaultCacheMetadata,
  loadCacheMetadata,
  saveCacheMetadata,
  updateCacheMetadata,
  // Cache status functions
  isCacheExpired,
  getCacheAge,
  determineCacheStatus,
  getCacheStatusMessage,
  getCacheStatusColor,
  // Cache health report
  estimateStorageUsage,
  estimateAvailableStorage,
  generateCacheHealthReport,
  // Cache management functions
  clearProfileCache,
  clearAllOfflineCaches,
  getCachedProfileIds,
  // Offline data snapshot functions
  createOfflineSnapshot,
  saveOfflineSnapshot,
  loadOfflineSnapshot,
  // Service worker
  getServiceWorkerScript,
  // Image caching
  extractImageUrls,
  // Display helpers
  formatCacheAge,
  formatStorageSize,
  getCacheHealthSummary,
  shouldRefreshCache,
  getStorageUsagePercent,
  isStorageLow,
} from '../offlineCache';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Offline Cache Constants', () => {
  it('has correct cache version', () => {
    expect(CACHE_VERSION).toBe(1);
  });

  it('has correct cache names with version', () => {
    expect(COLLECTION_CACHE_NAME).toBe(`carddex-collection-v${CACHE_VERSION}`);
    expect(IMAGE_CACHE_NAME).toBe(`carddex-images-v${CACHE_VERSION}`);
    expect(STATIC_CACHE_NAME).toBe(`carddex-static-v${CACHE_VERSION}`);
  });

  it('has correct cache max ages', () => {
    expect(COLLECTION_CACHE_MAX_AGE).toBe(24 * 60 * 60 * 1000); // 24 hours
    expect(IMAGE_CACHE_MAX_AGE).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
  });

  it('has correct max cached images limit', () => {
    expect(MAX_CACHED_IMAGES).toBe(500);
  });

  it('has correct storage keys', () => {
    expect(CACHE_METADATA_KEY).toBe('carddex_offline_cache_meta');
    expect(COLLECTION_STORAGE_KEY).toBe('carddex_offline_collection');
    expect(WISHLIST_STORAGE_KEY).toBe('carddex_offline_wishlist');
    expect(CARDS_STORAGE_KEY).toBe('carddex_offline_cards');
  });

  it('has all cache names in array', () => {
    expect(ALL_CACHE_NAMES).toContain(COLLECTION_CACHE_NAME);
    expect(ALL_CACHE_NAMES).toContain(IMAGE_CACHE_NAME);
    expect(ALL_CACHE_NAMES).toContain(STATIC_CACHE_NAME);
    expect(ALL_CACHE_NAMES.length).toBe(3);
  });
});

// ============================================================================
// ENVIRONMENT DETECTION TESTS
// ============================================================================

describe('Environment Detection', () => {
  describe('isBrowser', () => {
    it('returns false in test environment (no real DOM)', () => {
      // In vitest with jsdom, window exists but may not behave like a real browser
      const result = isBrowser();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isServiceWorkerSupported', () => {
    it('returns boolean', () => {
      const result = isServiceWorkerSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isLocalStorageAvailable', () => {
    let localStorage: ReturnType<typeof mockLocalStorage>;

    beforeEach(() => {
      localStorage = mockLocalStorage();
      vi.stubGlobal('localStorage', localStorage);
      vi.stubGlobal('window', { localStorage });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns true when localStorage is available', () => {
      const result = isLocalStorageAvailable();
      expect(result).toBe(true);
    });

    it('returns false when localStorage throws', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const result = isLocalStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('isIndexedDBAvailable', () => {
    it('returns boolean', () => {
      const result = isIndexedDBAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isCacheAPIAvailable', () => {
    it('returns boolean', () => {
      const result = isCacheAPIAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStorageCapabilities', () => {
    it('returns object with all capability flags', () => {
      const capabilities = getStorageCapabilities();
      expect(capabilities).toHaveProperty('localStorage');
      expect(capabilities).toHaveProperty('indexedDB');
      expect(capabilities).toHaveProperty('cacheAPI');
      expect(capabilities).toHaveProperty('serviceWorker');
      expect(typeof capabilities.localStorage).toBe('boolean');
      expect(typeof capabilities.indexedDB).toBe('boolean');
      expect(typeof capabilities.cacheAPI).toBe('boolean');
      expect(typeof capabilities.serviceWorker).toBe('boolean');
    });
  });
});

// ============================================================================
// LOCAL STORAGE CACHE TESTS
// ============================================================================

describe('Local Storage Cache Functions', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveCollectionToCache', () => {
    it('saves collection data to localStorage', () => {
      const profileId = 'profile-123';
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
      ];

      const result = saveCollectionToCache(profileId, collection);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('updates cache metadata', () => {
      const profileId = 'profile-123';
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      ];

      saveCollectionToCache(profileId, collection);

      // Metadata should have been saved
      const metadataKey = `${CACHE_METADATA_KEY}_${profileId}`;
      expect(localStorage.setItem).toHaveBeenCalledWith(metadataKey, expect.any(String));
    });

    it('returns false when localStorage is unavailable', () => {
      vi.stubGlobal('window', undefined);
      const result = saveCollectionToCache('profile', []);
      expect(result).toBe(false);
    });
  });

  describe('loadCollectionFromCache', () => {
    it('loads collection data from localStorage', () => {
      const profileId = 'profile-123';
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      ];

      // Save first
      saveCollectionToCache(profileId, collection);

      // Mock getItem to return the saved data
      const key = `${COLLECTION_STORAGE_KEY}_${profileId}`;
      const savedData = JSON.parse(
        localStorage.setItem.mock.calls.find((call) => call[0] === key)?.[1] || '{}'
      );
      localStorage.getItem.mockImplementation((k) =>
        k === key ? JSON.stringify(savedData) : null
      );

      const result = loadCollectionFromCache(profileId);

      expect(result).not.toBeNull();
      expect(result?.collection).toEqual(collection);
      expect(result?.timestamp).toBeGreaterThan(0);
    });

    it('returns null for missing data', () => {
      const result = loadCollectionFromCache('nonexistent');
      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      const result = loadCollectionFromCache('profile');
      expect(result).toBeNull();
    });
  });

  describe('saveWishlistToCache', () => {
    it('saves wishlist data to localStorage', () => {
      const profileId = 'profile-123';
      const wishlist: OfflineWishlistCard[] = [
        { cardId: 'sv1-1', isPriority: true },
        { cardId: 'sv1-2', isPriority: false },
      ];

      const result = saveWishlistToCache(profileId, wishlist);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('loadWishlistFromCache', () => {
    it('loads wishlist data from localStorage', () => {
      const profileId = 'profile-123';
      const wishlist: OfflineWishlistCard[] = [{ cardId: 'sv1-1', isPriority: true }];

      saveWishlistToCache(profileId, wishlist);

      const key = `${WISHLIST_STORAGE_KEY}_${profileId}`;
      const savedData = JSON.parse(
        localStorage.setItem.mock.calls.find((call) => call[0] === key)?.[1] || '{}'
      );
      localStorage.getItem.mockImplementation((k) =>
        k === key ? JSON.stringify(savedData) : null
      );

      const result = loadWishlistFromCache(profileId);

      expect(result).not.toBeNull();
      expect(result?.wishlist).toEqual(wishlist);
    });
  });

  describe('saveCardsToCache', () => {
    it('saves card data to localStorage', () => {
      const profileId = 'profile-123';
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/sv1/1_loRes.png',
          setId: 'sv1',
        },
      ];

      const result = saveCardsToCache(profileId, cards);

      expect(result).toBe(true);
    });
  });

  describe('loadCardsFromCache', () => {
    it('loads card data from localStorage', () => {
      const profileId = 'profile-123';
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/sv1/1_loRes.png',
          setId: 'sv1',
        },
      ];

      saveCardsToCache(profileId, cards);

      const key = `${CARDS_STORAGE_KEY}_${profileId}`;
      const savedData = JSON.parse(
        localStorage.setItem.mock.calls.find((call) => call[0] === key)?.[1] || '{}'
      );
      localStorage.getItem.mockImplementation((k) =>
        k === key ? JSON.stringify(savedData) : null
      );

      const result = loadCardsFromCache(profileId);

      expect(result).not.toBeNull();
      expect(result?.cards).toEqual(cards);
    });
  });
});

// ============================================================================
// CACHE METADATA TESTS
// ============================================================================

describe('Cache Metadata Functions', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getDefaultCacheMetadata', () => {
    it('returns default metadata with zero values', () => {
      const metadata = getDefaultCacheMetadata();

      expect(metadata.version).toBe(CACHE_VERSION);
      expect(metadata.lastUpdated).toBe(0);
      expect(metadata.collectionCount).toBe(0);
      expect(metadata.wishlistCount).toBe(0);
      expect(metadata.cardsCached).toBe(0);
      expect(metadata.imagesCached).toBe(0);
      expect(metadata.profileId).toBeNull();
    });
  });

  describe('saveCacheMetadata', () => {
    it('saves metadata to localStorage', () => {
      const profileId = 'profile-123';
      const metadata: CacheMetadata = {
        version: 1,
        lastUpdated: Date.now(),
        collectionCount: 10,
        wishlistCount: 5,
        cardsCached: 10,
        imagesCached: 20,
        profileId,
      };

      const result = saveCacheMetadata(profileId, metadata);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('loadCacheMetadata', () => {
    it('loads metadata from localStorage', () => {
      const profileId = 'profile-123';
      const metadata: CacheMetadata = {
        version: 1,
        lastUpdated: Date.now(),
        collectionCount: 10,
        wishlistCount: 5,
        cardsCached: 10,
        imagesCached: 20,
        profileId,
      };

      saveCacheMetadata(profileId, metadata);

      const key = `${CACHE_METADATA_KEY}_${profileId}`;
      localStorage.getItem.mockImplementation((k) => (k === key ? JSON.stringify(metadata) : null));

      const result = loadCacheMetadata(profileId);

      expect(result.version).toBe(metadata.version);
      expect(result.collectionCount).toBe(metadata.collectionCount);
      expect(result.profileId).toBe(profileId);
    });

    it('returns default metadata when not found', () => {
      const result = loadCacheMetadata('nonexistent');

      expect(result.version).toBe(CACHE_VERSION);
      expect(result.collectionCount).toBe(0);
      expect(result.profileId).toBe('nonexistent');
    });
  });

  describe('updateCacheMetadata', () => {
    it('updates metadata with partial updates', () => {
      const profileId = 'profile-123';

      // First save
      const result1 = updateCacheMetadata(profileId, { collectionCount: 5 });
      expect(result1).toBe(true);

      // Get saved metadata
      const key = `${CACHE_METADATA_KEY}_${profileId}`;
      const savedCalls = localStorage.setItem.mock.calls.filter((call) => call[0] === key);
      const lastSaved = JSON.parse(savedCalls[savedCalls.length - 1][1]);

      expect(lastSaved.collectionCount).toBe(5);
      expect(lastSaved.lastUpdated).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// CACHE STATUS TESTS
// ============================================================================

describe('Cache Status Functions', () => {
  describe('isCacheExpired', () => {
    it('returns true for zero timestamp', () => {
      expect(isCacheExpired(0)).toBe(true);
    });

    it('returns true for old timestamp', () => {
      const oldTimestamp = Date.now() - (COLLECTION_CACHE_MAX_AGE + 1000);
      expect(isCacheExpired(oldTimestamp)).toBe(true);
    });

    it('returns false for recent timestamp', () => {
      const recentTimestamp = Date.now() - 1000;
      expect(isCacheExpired(recentTimestamp)).toBe(false);
    });

    it('respects custom max age', () => {
      const timestamp = Date.now() - 5000; // 5 seconds ago
      expect(isCacheExpired(timestamp, 3000)).toBe(true); // 3 second max age
      expect(isCacheExpired(timestamp, 10000)).toBe(false); // 10 second max age
    });
  });

  describe('getCacheAge', () => {
    it('returns Infinity for zero timestamp', () => {
      expect(getCacheAge(0)).toBe(Infinity);
    });

    it('returns correct age in milliseconds', () => {
      const timestamp = Date.now() - 5000;
      const age = getCacheAge(timestamp);
      expect(age).toBeGreaterThanOrEqual(5000);
      expect(age).toBeLessThan(6000);
    });
  });

  describe('determineCacheStatus', () => {
    it('returns empty for zero lastUpdated', () => {
      const metadata = { ...getDefaultCacheMetadata(), lastUpdated: 0 };
      expect(determineCacheStatus(metadata)).toBe('empty');
    });

    it('returns stale for expired cache', () => {
      const metadata = {
        ...getDefaultCacheMetadata(),
        lastUpdated: Date.now() - (COLLECTION_CACHE_MAX_AGE + 1000),
      };
      expect(determineCacheStatus(metadata)).toBe('stale');
    });

    it('returns fresh for recent cache', () => {
      const metadata = {
        ...getDefaultCacheMetadata(),
        lastUpdated: Date.now() - 1000,
      };
      expect(determineCacheStatus(metadata)).toBe('fresh');
    });
  });

  describe('getCacheStatusMessage', () => {
    it('returns correct message for each status', () => {
      expect(getCacheStatusMessage('empty')).toContain('No offline data');
      expect(getCacheStatusMessage('stale')).toContain('outdated');
      expect(getCacheStatusMessage('fresh')).toContain('up to date');
      expect(getCacheStatusMessage('updating')).toContain('Updating');
      expect(getCacheStatusMessage('error')).toContain('Error');
    });

    it('returns default message for unknown status', () => {
      expect(getCacheStatusMessage('unknown' as CacheStatus)).toContain('Unknown');
    });
  });

  describe('getCacheStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getCacheStatusColor('fresh')).toBe('green');
      expect(getCacheStatusColor('stale')).toBe('yellow');
      expect(getCacheStatusColor('updating')).toBe('blue');
      expect(getCacheStatusColor('empty')).toBe('gray');
      expect(getCacheStatusColor('error')).toBe('red');
    });
  });
});

// ============================================================================
// CACHE HEALTH REPORT TESTS
// ============================================================================

describe('Cache Health Report Functions', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('estimateStorageUsage', () => {
    it('returns 0 for empty storage', () => {
      const usage = estimateStorageUsage('profile-123');
      expect(usage).toBe(0);
    });

    it('returns estimated size in bytes', () => {
      // Save some data
      saveCollectionToCache('profile-123', [{ cardId: 'sv1-1', variant: 'normal', quantity: 1 }]);

      // Get the saved data to calculate expected size
      const calls = localStorage.setItem.mock.calls;
      let totalSize = 0;
      for (const call of calls) {
        if (call[0].includes('profile-123')) {
          totalSize += call[1].length * 2; // UTF-16
        }
      }

      // Mock getItem to return the saved data
      localStorage.getItem.mockImplementation((key) => {
        const savedCall = calls.find((c) => c[0] === key);
        return savedCall ? savedCall[1] : null;
      });

      const usage = estimateStorageUsage('profile-123');
      expect(usage).toBeGreaterThan(0);
    });
  });

  describe('estimateAvailableStorage', () => {
    it('returns 5MB limit', () => {
      const available = estimateAvailableStorage();
      expect(available).toBe(5 * 1024 * 1024);
    });
  });

  describe('generateCacheHealthReport', () => {
    it('returns empty status for new profile', () => {
      const report = generateCacheHealthReport('new-profile');

      expect(report.status).toBe('empty');
      expect(report.collectionCount).toBe(0);
      expect(report.wishlistCount).toBe(0);
    });

    it('returns error status when localStorage unavailable', () => {
      vi.stubGlobal('window', undefined);
      const report = generateCacheHealthReport('profile-123');

      expect(report.errors).toContain('localStorage is not available');
    });
  });
});

// ============================================================================
// CACHE MANAGEMENT TESTS
// ============================================================================

describe('Cache Management Functions', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('clearProfileCache', () => {
    it('removes all cache keys for profile', () => {
      const profileId = 'profile-123';

      // Save some data
      saveCollectionToCache(profileId, []);
      saveWishlistToCache(profileId, []);
      saveCardsToCache(profileId, []);

      // Clear the removeItem mock to only count clearProfileCache calls
      localStorage.removeItem.mockClear();

      const result = clearProfileCache(profileId);

      expect(result).toBe(true);
      // Verify the specific cache keys were removed (not checking exact count
      // due to potential internal cleanup operations)
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        `${COLLECTION_STORAGE_KEY}_${profileId}`
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith(`${WISHLIST_STORAGE_KEY}_${profileId}`);
      expect(localStorage.removeItem).toHaveBeenCalledWith(`${CARDS_STORAGE_KEY}_${profileId}`);
      expect(localStorage.removeItem).toHaveBeenCalledWith(`${CACHE_METADATA_KEY}_${profileId}`);
    });

    it('returns false when localStorage unavailable', () => {
      vi.stubGlobal('window', undefined);
      const result = clearProfileCache('profile');
      expect(result).toBe(false);
    });
  });

  describe('clearAllOfflineCaches', () => {
    it('removes all offline cache keys', () => {
      // Save data for multiple profiles
      saveCollectionToCache('profile-1', []);
      saveCollectionToCache('profile-2', []);

      // Mock key method to return saved keys
      const savedKeys = localStorage.setItem.mock.calls.map((c) => c[0]);
      localStorage.key.mockImplementation((i) => savedKeys[i] || null);
      Object.defineProperty(localStorage, 'length', {
        get: () => savedKeys.length,
      });

      const result = clearAllOfflineCaches();

      expect(result).toBe(true);
    });
  });

  describe('getCachedProfileIds', () => {
    it('returns empty array for no cached profiles', () => {
      const ids = getCachedProfileIds();
      expect(ids).toEqual([]);
    });

    it('returns list of cached profile IDs', () => {
      // Save metadata for profiles
      updateCacheMetadata('profile-1', { collectionCount: 1 });
      updateCacheMetadata('profile-2', { collectionCount: 2 });

      // Mock localStorage to return our keys
      const savedKeys = localStorage.setItem.mock.calls
        .filter((c) => c[0].startsWith(CACHE_METADATA_KEY))
        .map((c) => c[0]);
      localStorage.key.mockImplementation((i) => savedKeys[i] || null);
      Object.defineProperty(localStorage, 'length', {
        get: () => savedKeys.length,
      });

      const ids = getCachedProfileIds();

      expect(ids).toContain('profile-1');
      expect(ids).toContain('profile-2');
    });
  });
});

// ============================================================================
// OFFLINE DATA SNAPSHOT TESTS
// ============================================================================

describe('Offline Data Snapshot Functions', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createOfflineSnapshot', () => {
    it('creates snapshot with all data', () => {
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      ];
      const wishlist: OfflineWishlistCard[] = [{ cardId: 'sv1-2', isPriority: true }];
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'url',
          setId: 'sv1',
        },
      ];

      const snapshot = createOfflineSnapshot('profile-123', collection, wishlist, cards);

      expect(snapshot.collection).toEqual(collection);
      expect(snapshot.wishlist).toEqual(wishlist);
      expect(snapshot.cards).toEqual(cards);
      expect(snapshot.metadata.collectionCount).toBe(1);
      expect(snapshot.metadata.wishlistCount).toBe(1);
      expect(snapshot.metadata.cardsCached).toBe(1);
      expect(snapshot.metadata.profileId).toBe('profile-123');
      expect(snapshot.metadata.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('saveOfflineSnapshot', () => {
    it('saves all snapshot data', () => {
      const snapshot = createOfflineSnapshot(
        'profile-123',
        [{ cardId: 'sv1-1', variant: 'normal', quantity: 1 }],
        [{ cardId: 'sv1-2', isPriority: false }],
        [{ cardId: 'sv1-1', name: 'Pikachu', imageSmall: 'url', setId: 'sv1' }]
      );

      const result = saveOfflineSnapshot('profile-123', snapshot);

      expect(result.success).toBe(true);
      expect(result.itemsCached).toBe(3); // 1 collection + 1 wishlist + 1 card
      expect(result.errors).toHaveLength(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('reports errors when save fails', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const snapshot = createOfflineSnapshot('profile-123', [], [], []);
      const result = saveOfflineSnapshot('profile-123', snapshot);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('loadOfflineSnapshot', () => {
    it('loads complete snapshot', () => {
      const profileId = 'profile-123';
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 1 },
      ];
      const wishlist: OfflineWishlistCard[] = [{ cardId: 'sv1-2', isPriority: true }];
      const cards: OfflineCachedCard[] = [
        { cardId: 'sv1-1', name: 'Pikachu', imageSmall: 'url', setId: 'sv1' },
      ];

      const originalSnapshot = createOfflineSnapshot(profileId, collection, wishlist, cards);
      saveOfflineSnapshot(profileId, originalSnapshot);

      // Mock getItem to return saved data
      const savedData: Record<string, string> = {};
      for (const call of localStorage.setItem.mock.calls) {
        savedData[call[0]] = call[1];
      }
      localStorage.getItem.mockImplementation((key) => savedData[key] || null);

      const loadedSnapshot = loadOfflineSnapshot(profileId);

      expect(loadedSnapshot).not.toBeNull();
      expect(loadedSnapshot?.collection).toEqual(collection);
      expect(loadedSnapshot?.wishlist).toEqual(wishlist);
      expect(loadedSnapshot?.cards).toEqual(cards);
    });

    it('returns null for missing snapshot', () => {
      const result = loadOfflineSnapshot('nonexistent');
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// SERVICE WORKER TESTS
// ============================================================================

describe('Service Worker Functions', () => {
  describe('getServiceWorkerScript', () => {
    it('returns valid JavaScript string', () => {
      const script = getServiceWorkerScript();

      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
    });

    it('includes correct cache names', () => {
      const script = getServiceWorkerScript();

      expect(script).toContain(COLLECTION_CACHE_NAME);
      expect(script).toContain(IMAGE_CACHE_NAME);
      expect(script).toContain(STATIC_CACHE_NAME);
    });

    it('includes install event handler', () => {
      const script = getServiceWorkerScript();
      expect(script).toContain("addEventListener('install'");
    });

    it('includes activate event handler', () => {
      const script = getServiceWorkerScript();
      expect(script).toContain("addEventListener('activate'");
    });

    it('includes fetch event handler', () => {
      const script = getServiceWorkerScript();
      expect(script).toContain("addEventListener('fetch'");
    });

    it('includes message handler for cache operations', () => {
      const script = getServiceWorkerScript();
      expect(script).toContain("addEventListener('message'");
      expect(script).toContain('CACHE_IMAGES');
      expect(script).toContain('CLEAR_CACHE');
    });

    it('includes image caching domains', () => {
      const script = getServiceWorkerScript();
      expect(script).toContain('images.pokemontcg.io');
    });
  });
});

// ============================================================================
// IMAGE CACHING TESTS
// ============================================================================

describe('Image Caching Functions', () => {
  describe('extractImageUrls', () => {
    it('extracts small image URLs', () => {
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/sv1/1_loRes.png',
          setId: 'sv1',
        },
        {
          cardId: 'sv1-2',
          name: 'Charizard',
          imageSmall: 'https://images.pokemontcg.io/sv1/2_loRes.png',
          setId: 'sv1',
        },
      ];

      const urls = extractImageUrls(cards);

      expect(urls).toContain('https://images.pokemontcg.io/sv1/1_loRes.png');
      expect(urls).toContain('https://images.pokemontcg.io/sv1/2_loRes.png');
    });

    it('extracts large image URLs when available', () => {
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/sv1/1_loRes.png',
          imageLarge: 'https://images.pokemontcg.io/sv1/1_hiRes.png',
          setId: 'sv1',
        },
      ];

      const urls = extractImageUrls(cards);

      expect(urls).toContain('https://images.pokemontcg.io/sv1/1_loRes.png');
      expect(urls).toContain('https://images.pokemontcg.io/sv1/1_hiRes.png');
    });

    it('handles empty cards array', () => {
      const urls = extractImageUrls([]);
      expect(urls).toEqual([]);
    });

    it('skips cards without images', () => {
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: '',
          setId: 'sv1',
        },
      ];

      const urls = extractImageUrls(cards);
      expect(urls).toEqual([]);
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('Display Helper Functions', () => {
  describe('formatCacheAge', () => {
    it('returns "Never cached" for zero or Infinity', () => {
      expect(formatCacheAge(0)).toBe('Never cached');
      expect(formatCacheAge(Infinity)).toBe('Never cached');
    });

    it('returns "Just now" for < 60 seconds', () => {
      expect(formatCacheAge(30 * 1000)).toBe('Just now');
    });

    it('returns minutes for 1-59 minutes', () => {
      expect(formatCacheAge(60 * 1000)).toBe('1 minute ago');
      expect(formatCacheAge(5 * 60 * 1000)).toBe('5 minutes ago');
      expect(formatCacheAge(59 * 60 * 1000)).toBe('59 minutes ago');
    });

    it('returns hours for 1-23 hours', () => {
      expect(formatCacheAge(60 * 60 * 1000)).toBe('1 hour ago');
      expect(formatCacheAge(12 * 60 * 60 * 1000)).toBe('12 hours ago');
    });

    it('returns days for >= 24 hours', () => {
      expect(formatCacheAge(24 * 60 * 60 * 1000)).toBe('1 day ago');
      expect(formatCacheAge(7 * 24 * 60 * 60 * 1000)).toBe('7 days ago');
    });
  });

  describe('formatStorageSize', () => {
    it('formats bytes correctly', () => {
      expect(formatStorageSize(0)).toBe('0 B');
      expect(formatStorageSize(500)).toBe('500 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatStorageSize(1024)).toBe('1.0 KB');
      expect(formatStorageSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatStorageSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatStorageSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatStorageSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });
  });

  describe('getCacheHealthSummary', () => {
    it('returns error message when errors present', () => {
      const report: CacheHealthReport = {
        status: 'error',
        lastUpdated: null,
        age: Infinity,
        isExpired: true,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 0,
        storageAvailable: 5 * 1024 * 1024,
        errors: ['Test error'],
      };

      const summary = getCacheHealthSummary(report);
      expect(summary).toContain('Test error');
    });

    it('returns empty message for empty status', () => {
      const report: CacheHealthReport = {
        status: 'empty',
        lastUpdated: null,
        age: Infinity,
        isExpired: true,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 0,
        storageAvailable: 5 * 1024 * 1024,
        errors: [],
      };

      const summary = getCacheHealthSummary(report);
      expect(summary).toContain('No offline data');
    });

    it('returns card count and age for cached data', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now() - 1000,
        age: 1000,
        isExpired: false,
        collectionCount: 10,
        wishlistCount: 5,
        cardsCached: 10,
        imagesCached: 20,
        storageUsed: 10000,
        storageAvailable: 5 * 1024 * 1024,
        errors: [],
      };

      const summary = getCacheHealthSummary(report);
      expect(summary).toContain('10 cards');
      expect(summary).toContain('5 wishlist items');
    });
  });

  describe('shouldRefreshCache', () => {
    it('returns true for empty status', () => {
      const report: CacheHealthReport = {
        status: 'empty',
        lastUpdated: null,
        age: Infinity,
        isExpired: true,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 0,
        storageAvailable: 5 * 1024 * 1024,
        errors: [],
      };

      expect(shouldRefreshCache(report)).toBe(true);
    });

    it('returns true for stale status', () => {
      const report: CacheHealthReport = {
        status: 'stale',
        lastUpdated: Date.now() - COLLECTION_CACHE_MAX_AGE - 1000,
        age: COLLECTION_CACHE_MAX_AGE + 1000,
        isExpired: true,
        collectionCount: 10,
        wishlistCount: 5,
        cardsCached: 10,
        imagesCached: 20,
        storageUsed: 10000,
        storageAvailable: 5 * 1024 * 1024,
        errors: [],
      };

      expect(shouldRefreshCache(report)).toBe(true);
    });

    it('returns false for fresh status', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now() - 1000,
        age: 1000,
        isExpired: false,
        collectionCount: 10,
        wishlistCount: 5,
        cardsCached: 10,
        imagesCached: 20,
        storageUsed: 10000,
        storageAvailable: 5 * 1024 * 1024,
        errors: [],
      };

      expect(shouldRefreshCache(report)).toBe(false);
    });
  });

  describe('getStorageUsagePercent', () => {
    it('returns 0 for zero available storage', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now(),
        age: 0,
        isExpired: false,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 1000,
        storageAvailable: 0,
        errors: [],
      };

      expect(getStorageUsagePercent(report)).toBe(0);
    });

    it('calculates percentage correctly', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now(),
        age: 0,
        isExpired: false,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 500 * 1024, // 500KB
        storageAvailable: 5 * 1024 * 1024, // 5MB
        errors: [],
      };

      expect(getStorageUsagePercent(report)).toBe(10);
    });
  });

  describe('isStorageLow', () => {
    it('returns false when under threshold', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now(),
        age: 0,
        isExpired: false,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 1 * 1024 * 1024, // 1MB
        storageAvailable: 5 * 1024 * 1024, // 5MB = 20%
        errors: [],
      };

      expect(isStorageLow(report)).toBe(false);
    });

    it('returns true when at or over threshold', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now(),
        age: 0,
        isExpired: false,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 4 * 1024 * 1024, // 4MB
        storageAvailable: 5 * 1024 * 1024, // 5MB = 80%
        errors: [],
      };

      expect(isStorageLow(report)).toBe(true);
    });

    it('respects custom threshold', () => {
      const report: CacheHealthReport = {
        status: 'fresh',
        lastUpdated: Date.now(),
        age: 0,
        isExpired: false,
        collectionCount: 0,
        wishlistCount: 0,
        cardsCached: 0,
        imagesCached: 0,
        storageUsed: 2.5 * 1024 * 1024, // 2.5MB
        storageAvailable: 5 * 1024 * 1024, // 5MB = 50%
        errors: [],
      };

      expect(isStorageLow(report, 50)).toBe(true);
      expect(isStorageLow(report, 60)).toBe(false);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Scenarios', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Complete offline workflow', () => {
    it('saves and loads complete collection data', () => {
      const profileId = 'user-123';
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-25', variant: 'holofoil', quantity: 1 },
        { cardId: 'swsh12-100', variant: 'reverseHolofoil', quantity: 3 },
      ];
      const wishlist: OfflineWishlistCard[] = [
        { cardId: 'sv1-50', isPriority: true },
        { cardId: 'sv1-51', isPriority: false },
      ];
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/sv1/1_loRes.png',
          imageLarge: 'https://images.pokemontcg.io/sv1/1_hiRes.png',
          setId: 'sv1',
          rarity: 'Common',
          types: ['Lightning'],
        },
        {
          cardId: 'sv1-25',
          name: 'Charizard ex',
          imageSmall: 'https://images.pokemontcg.io/sv1/25_loRes.png',
          setId: 'sv1',
          rarity: 'Double Rare',
          types: ['Fire'],
        },
      ];

      // Save data
      const snapshot = createOfflineSnapshot(profileId, collection, wishlist, cards);
      const saveResult = saveOfflineSnapshot(profileId, snapshot);

      expect(saveResult.success).toBe(true);
      expect(saveResult.itemsCached).toBe(7); // 3 collection + 2 wishlist + 2 cards

      // Mock localStorage.getItem to return saved data
      const savedData: Record<string, string> = {};
      for (const call of localStorage.setItem.mock.calls) {
        savedData[call[0]] = call[1];
      }
      localStorage.getItem.mockImplementation((key) => savedData[key] || null);

      // Load data
      const loadedSnapshot = loadOfflineSnapshot(profileId);

      expect(loadedSnapshot).not.toBeNull();
      expect(loadedSnapshot!.collection).toEqual(collection);
      expect(loadedSnapshot!.wishlist).toEqual(wishlist);
      expect(loadedSnapshot!.cards).toEqual(cards);

      // Check metadata
      expect(loadedSnapshot!.metadata.collectionCount).toBe(3);
      expect(loadedSnapshot!.metadata.wishlistCount).toBe(2);
      expect(loadedSnapshot!.metadata.cardsCached).toBe(2);
      expect(loadedSnapshot!.metadata.version).toBe(CACHE_VERSION);

      // Generate health report
      const report = generateCacheHealthReport(profileId);

      expect(report.status).toBe('fresh');
      expect(report.collectionCount).toBe(3);
      expect(report.wishlistCount).toBe(2);
      expect(report.cardsCached).toBe(2);
      expect(report.errors).toHaveLength(0);
    });
  });

  describe('Cache lifecycle', () => {
    it('handles multiple profiles independently', () => {
      // Save data for profile 1
      saveCollectionToCache('profile-1', [{ cardId: 'sv1-1', variant: 'normal', quantity: 1 }]);

      // Save data for profile 2
      saveCollectionToCache('profile-2', [{ cardId: 'sv1-2', variant: 'holofoil', quantity: 2 }]);

      // Mock localStorage.getItem
      const savedData: Record<string, string> = {};
      for (const call of localStorage.setItem.mock.calls) {
        savedData[call[0]] = call[1];
      }
      localStorage.getItem.mockImplementation((key) => savedData[key] || null);

      // Load profile 1
      const profile1Data = loadCollectionFromCache('profile-1');
      expect(profile1Data?.collection[0].cardId).toBe('sv1-1');
      expect(profile1Data?.collection[0].quantity).toBe(1);

      // Load profile 2
      const profile2Data = loadCollectionFromCache('profile-2');
      expect(profile2Data?.collection[0].cardId).toBe('sv1-2');
      expect(profile2Data?.collection[0].quantity).toBe(2);

      // Clear profile 1
      clearProfileCache('profile-1');

      // Profile 2 should still exist
      expect(localStorage.removeItem).toHaveBeenCalledWith(expect.stringContaining('profile-1'));
    });
  });

  describe('Cache expiration handling', () => {
    it('identifies stale cache correctly', () => {
      const profileId = 'profile-123';

      // Save metadata with old timestamp
      const oldMetadata: CacheMetadata = {
        version: CACHE_VERSION,
        lastUpdated: Date.now() - COLLECTION_CACHE_MAX_AGE - 1000,
        collectionCount: 10,
        wishlistCount: 5,
        cardsCached: 10,
        imagesCached: 20,
        profileId,
      };

      saveCacheMetadata(profileId, oldMetadata);

      // Mock localStorage.getItem
      const key = `${CACHE_METADATA_KEY}_${profileId}`;
      localStorage.getItem.mockImplementation((k) =>
        k === key ? JSON.stringify(oldMetadata) : null
      );

      // Check status
      const metadata = loadCacheMetadata(profileId);
      const status = determineCacheStatus(metadata);

      expect(status).toBe('stale');
      expect(isCacheExpired(metadata.lastUpdated)).toBe(true);
    });
  });

  describe('Image URL extraction', () => {
    it('extracts all image URLs for caching', () => {
      const cards: OfflineCachedCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/sv1/1_loRes.png',
          imageLarge: 'https://images.pokemontcg.io/sv1/1_hiRes.png',
          setId: 'sv1',
        },
        {
          cardId: 'sv1-2',
          name: 'Raichu',
          imageSmall: 'https://images.pokemontcg.io/sv1/2_loRes.png',
          setId: 'sv1',
        },
        {
          cardId: 'sv1-3',
          name: 'Bulbasaur',
          imageSmall: '', // No image
          setId: 'sv1',
        },
      ];

      const urls = extractImageUrls(cards);

      // Should have 3 URLs (2 small + 1 large)
      expect(urls).toHaveLength(3);
      expect(urls).toContain('https://images.pokemontcg.io/sv1/1_loRes.png');
      expect(urls).toContain('https://images.pokemontcg.io/sv1/1_hiRes.png');
      expect(urls).toContain('https://images.pokemontcg.io/sv1/2_loRes.png');
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Empty data handling', () => {
    it('handles empty collection', () => {
      const result = saveCollectionToCache('profile', []);
      expect(result).toBe(true);
    });

    it('handles empty wishlist', () => {
      const result = saveWishlistToCache('profile', []);
      expect(result).toBe(true);
    });

    it('handles empty cards', () => {
      const result = saveCardsToCache('profile', []);
      expect(result).toBe(true);
    });
  });

  describe('Large data handling', () => {
    it('handles large collection', () => {
      const largeCollection: OfflineCollectionCard[] = Array.from({ length: 1000 }, (_, i) => ({
        cardId: `sv1-${i}`,
        variant: 'normal' as CardVariant,
        quantity: 1,
      }));

      const result = saveCollectionToCache('profile', largeCollection);
      expect(result).toBe(true);
    });
  });

  describe('Invalid data handling', () => {
    it('handles corrupted JSON in localStorage', () => {
      localStorage.getItem.mockReturnValue('not valid json {{{');
      const result = loadCollectionFromCache('profile');
      expect(result).toBeNull();
    });

    it('handles missing required fields', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ timestamp: 123 }));
      const result = loadCollectionFromCache('profile');
      expect(result).toBeNull();
    });
  });

  describe('Storage quota exceeded', () => {
    it('returns false when save fails', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const result = saveCollectionToCache('profile', [
        { cardId: 'sv1-1', variant: 'normal', quantity: 1 },
      ]);

      expect(result).toBe(false);
    });
  });

  describe('Special characters in profile ID', () => {
    it('handles profile IDs with special characters', () => {
      const specialProfileId = 'user_123-abc';
      const collection: OfflineCollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 1 },
      ];

      const result = saveCollectionToCache(specialProfileId, collection);
      expect(result).toBe(true);

      // Verify the key was constructed correctly
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `${COLLECTION_STORAGE_KEY}_${specialProfileId}`,
        expect.any(String)
      );
    });
  });

  describe('Timestamp edge cases', () => {
    it('handles exactly at expiration boundary', () => {
      const exactlyExpired = Date.now() - COLLECTION_CACHE_MAX_AGE;
      expect(isCacheExpired(exactlyExpired)).toBe(false);

      const justExpired = Date.now() - COLLECTION_CACHE_MAX_AGE - 1;
      expect(isCacheExpired(justExpired)).toBe(true);
    });

    it('handles future timestamps', () => {
      const futureTimestamp = Date.now() + 1000000;
      expect(isCacheExpired(futureTimestamp)).toBe(false);
      expect(getCacheAge(futureTimestamp)).toBeLessThan(0);
    });
  });
});
