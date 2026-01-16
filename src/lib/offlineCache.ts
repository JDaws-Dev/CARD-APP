// ============================================================================
// OFFLINE COLLECTION CACHING UTILITIES
// Provides service worker registration, cache management, and offline data access
// for viewing collection data when offline
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

/** Current cache version - increment when cache structure changes */
export const CACHE_VERSION = 1;

/** Cache name for collection data */
export const COLLECTION_CACHE_NAME = `carddex-collection-v${CACHE_VERSION}`;

/** Cache name for card images */
export const IMAGE_CACHE_NAME = `carddex-images-v${CACHE_VERSION}`;

/** Cache name for static assets */
export const STATIC_CACHE_NAME = `carddex-static-v${CACHE_VERSION}`;

/** Maximum age for cached collection data (in milliseconds) - 24 hours */
export const COLLECTION_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

/** Maximum age for cached images (in milliseconds) - 7 days */
export const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** Maximum number of card images to cache */
export const MAX_CACHED_IMAGES = 500;

/** Storage key for offline cache metadata */
export const CACHE_METADATA_KEY = 'carddex_offline_cache_meta';

/** Storage key for offline collection data */
export const COLLECTION_STORAGE_KEY = 'carddex_offline_collection';

/** Storage key for offline wishlist data */
export const WISHLIST_STORAGE_KEY = 'carddex_offline_wishlist';

/** Storage key for cached card data */
export const CARDS_STORAGE_KEY = 'carddex_offline_cards';

/** All cache names for cleanup */
export const ALL_CACHE_NAMES = [COLLECTION_CACHE_NAME, IMAGE_CACHE_NAME, STATIC_CACHE_NAME];

// ============================================================================
// TYPES
// ============================================================================

/** Card variant types */
export type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

/** Offline collection card entry */
export interface OfflineCollectionCard {
  cardId: string;
  variant: CardVariant;
  quantity: number;
}

/** Offline wishlist card entry */
export interface OfflineWishlistCard {
  cardId: string;
  isPriority: boolean;
}

/** Offline card data (from cached cards) */
export interface OfflineCachedCard {
  cardId: string;
  name: string;
  imageSmall: string;
  imageLarge?: string;
  setId: string;
  rarity?: string;
  types?: string[];
}

/** Cache metadata */
export interface CacheMetadata {
  version: number;
  lastUpdated: number;
  collectionCount: number;
  wishlistCount: number;
  cardsCached: number;
  imagesCached: number;
  profileId: string | null;
}

/** Cache status */
export type CacheStatus = 'empty' | 'stale' | 'fresh' | 'updating' | 'error';

/** Cache health report */
export interface CacheHealthReport {
  status: CacheStatus;
  lastUpdated: number | null;
  age: number;
  isExpired: boolean;
  collectionCount: number;
  wishlistCount: number;
  cardsCached: number;
  imagesCached: number;
  storageUsed: number;
  storageAvailable: number;
  errors: string[];
}

/** Service worker registration result */
export interface ServiceWorkerRegistrationResult {
  success: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

/** Cache update result */
export interface CacheUpdateResult {
  success: boolean;
  itemsCached: number;
  errors: string[];
  timestamp: number;
}

/** Offline data snapshot */
export interface OfflineDataSnapshot {
  collection: OfflineCollectionCard[];
  wishlist: OfflineWishlistCard[];
  cards: OfflineCachedCard[];
  metadata: CacheMetadata;
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return isBrowser() && 'serviceWorker' in navigator;
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (!isBrowser()) return false;

  try {
    const testKey = '__carddex_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  if (!isBrowser()) return false;

  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Check if Cache API is available
 */
export function isCacheAPIAvailable(): boolean {
  if (!isBrowser()) return false;

  try {
    return typeof caches !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get storage capabilities
 */
export function getStorageCapabilities(): {
  localStorage: boolean;
  indexedDB: boolean;
  cacheAPI: boolean;
  serviceWorker: boolean;
} {
  return {
    localStorage: isLocalStorageAvailable(),
    indexedDB: isIndexedDBAvailable(),
    cacheAPI: isCacheAPIAvailable(),
    serviceWorker: isServiceWorkerSupported(),
  };
}

// ============================================================================
// LOCAL STORAGE CACHE FUNCTIONS
// ============================================================================

/**
 * Save collection data to local storage for offline access
 */
export function saveCollectionToCache(
  profileId: string,
  collection: OfflineCollectionCard[]
): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const key = `${COLLECTION_STORAGE_KEY}_${profileId}`;
    const data = {
      collection,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    updateCacheMetadata(profileId, { collectionCount: collection.length });
    return true;
  } catch {
    return false;
  }
}

/**
 * Load collection data from local storage cache
 */
export function loadCollectionFromCache(
  profileId: string
): { collection: OfflineCollectionCard[]; timestamp: number } | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const key = `${COLLECTION_STORAGE_KEY}_${profileId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.collection || !Array.isArray(data.collection)) return null;

    return {
      collection: data.collection,
      timestamp: data.timestamp || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Save wishlist data to local storage for offline access
 */
export function saveWishlistToCache(profileId: string, wishlist: OfflineWishlistCard[]): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const key = `${WISHLIST_STORAGE_KEY}_${profileId}`;
    const data = {
      wishlist,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    updateCacheMetadata(profileId, { wishlistCount: wishlist.length });
    return true;
  } catch {
    return false;
  }
}

/**
 * Load wishlist data from local storage cache
 */
export function loadWishlistFromCache(
  profileId: string
): { wishlist: OfflineWishlistCard[]; timestamp: number } | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const key = `${WISHLIST_STORAGE_KEY}_${profileId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.wishlist || !Array.isArray(data.wishlist)) return null;

    return {
      wishlist: data.wishlist,
      timestamp: data.timestamp || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Save card data to local storage for offline access
 */
export function saveCardsToCache(profileId: string, cards: OfflineCachedCard[]): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const key = `${CARDS_STORAGE_KEY}_${profileId}`;
    const data = {
      cards,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    updateCacheMetadata(profileId, { cardsCached: cards.length });
    return true;
  } catch {
    return false;
  }
}

/**
 * Load card data from local storage cache
 */
export function loadCardsFromCache(
  profileId: string
): { cards: OfflineCachedCard[]; timestamp: number } | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const key = `${CARDS_STORAGE_KEY}_${profileId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!data.cards || !Array.isArray(data.cards)) return null;

    return {
      cards: data.cards,
      timestamp: data.timestamp || 0,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// CACHE METADATA FUNCTIONS
// ============================================================================

/**
 * Get default cache metadata
 */
export function getDefaultCacheMetadata(): CacheMetadata {
  return {
    version: CACHE_VERSION,
    lastUpdated: 0,
    collectionCount: 0,
    wishlistCount: 0,
    cardsCached: 0,
    imagesCached: 0,
    profileId: null,
  };
}

/**
 * Load cache metadata from local storage
 */
export function loadCacheMetadata(profileId: string): CacheMetadata {
  if (!isLocalStorageAvailable()) return getDefaultCacheMetadata();

  try {
    const key = `${CACHE_METADATA_KEY}_${profileId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return { ...getDefaultCacheMetadata(), profileId };

    const parsed = JSON.parse(stored);
    return {
      ...getDefaultCacheMetadata(),
      ...parsed,
      profileId,
    };
  } catch {
    return { ...getDefaultCacheMetadata(), profileId };
  }
}

/**
 * Save cache metadata to local storage
 */
export function saveCacheMetadata(profileId: string, metadata: CacheMetadata): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const key = `${CACHE_METADATA_KEY}_${profileId}`;
    localStorage.setItem(key, JSON.stringify({ ...metadata, profileId }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Update cache metadata with partial updates
 */
export function updateCacheMetadata(profileId: string, updates: Partial<CacheMetadata>): boolean {
  const current = loadCacheMetadata(profileId);
  const updated = {
    ...current,
    ...updates,
    lastUpdated: Date.now(),
    profileId,
  };
  return saveCacheMetadata(profileId, updated);
}

// ============================================================================
// CACHE STATUS FUNCTIONS
// ============================================================================

/**
 * Check if cached data is expired
 */
export function isCacheExpired(
  timestamp: number,
  maxAge: number = COLLECTION_CACHE_MAX_AGE
): boolean {
  if (!timestamp) return true;
  const age = Date.now() - timestamp;
  return age > maxAge;
}

/**
 * Calculate cache age in milliseconds
 */
export function getCacheAge(timestamp: number): number {
  if (!timestamp) return Infinity;
  return Date.now() - timestamp;
}

/**
 * Determine cache status from metadata
 */
export function determineCacheStatus(metadata: CacheMetadata): CacheStatus {
  if (!metadata.lastUpdated || metadata.lastUpdated === 0) {
    return 'empty';
  }

  if (isCacheExpired(metadata.lastUpdated)) {
    return 'stale';
  }

  return 'fresh';
}

/**
 * Get a human-readable cache status message
 */
export function getCacheStatusMessage(status: CacheStatus): string {
  switch (status) {
    case 'empty':
      return 'No offline data cached. Connect to the internet to cache your collection.';
    case 'stale':
      return 'Cached data may be outdated. Connect to sync latest changes.';
    case 'fresh':
      return 'Offline data is up to date.';
    case 'updating':
      return 'Updating offline cache...';
    case 'error':
      return 'Error accessing offline cache.';
    default:
      return 'Unknown cache status.';
  }
}

/**
 * Get cache status color for UI
 */
export function getCacheStatusColor(status: CacheStatus): string {
  switch (status) {
    case 'fresh':
      return 'green';
    case 'stale':
      return 'yellow';
    case 'updating':
      return 'blue';
    case 'empty':
      return 'gray';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

// ============================================================================
// CACHE HEALTH REPORT
// ============================================================================

/**
 * Get estimated storage usage for a profile
 */
export function estimateStorageUsage(profileId: string): number {
  if (!isLocalStorageAvailable()) return 0;

  let totalSize = 0;
  const keys = [
    `${COLLECTION_STORAGE_KEY}_${profileId}`,
    `${WISHLIST_STORAGE_KEY}_${profileId}`,
    `${CARDS_STORAGE_KEY}_${profileId}`,
    `${CACHE_METADATA_KEY}_${profileId}`,
  ];

  for (const key of keys) {
    const item = localStorage.getItem(key);
    if (item) {
      // Estimate: 2 bytes per character (UTF-16)
      totalSize += item.length * 2;
    }
  }

  return totalSize;
}

/**
 * Get estimated available storage
 */
export function estimateAvailableStorage(): number {
  // Most browsers have 5-10MB localStorage limit
  // Return a conservative estimate of 5MB
  const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes
  return STORAGE_LIMIT;
}

/**
 * Generate a comprehensive cache health report
 */
export function generateCacheHealthReport(profileId: string): CacheHealthReport {
  const metadata = loadCacheMetadata(profileId);
  const errors: string[] = [];

  // Check for storage issues
  if (!isLocalStorageAvailable()) {
    errors.push('localStorage is not available');
  }

  // Load data to check integrity
  const collectionData = loadCollectionFromCache(profileId);
  const wishlistData = loadWishlistFromCache(profileId);
  const cardsData = loadCardsFromCache(profileId);

  // Verify counts match
  if (collectionData && collectionData.collection.length !== metadata.collectionCount) {
    errors.push('Collection count mismatch in metadata');
  }

  if (wishlistData && wishlistData.wishlist.length !== metadata.wishlistCount) {
    errors.push('Wishlist count mismatch in metadata');
  }

  if (cardsData && cardsData.cards.length !== metadata.cardsCached) {
    errors.push('Cards cached count mismatch in metadata');
  }

  const status = errors.length > 0 ? 'error' : determineCacheStatus(metadata);
  const age = getCacheAge(metadata.lastUpdated);

  return {
    status,
    lastUpdated: metadata.lastUpdated || null,
    age,
    isExpired: isCacheExpired(metadata.lastUpdated),
    collectionCount: collectionData?.collection.length ?? 0,
    wishlistCount: wishlistData?.wishlist.length ?? 0,
    cardsCached: cardsData?.cards.length ?? 0,
    imagesCached: metadata.imagesCached,
    storageUsed: estimateStorageUsage(profileId),
    storageAvailable: estimateAvailableStorage(),
    errors,
  };
}

// ============================================================================
// CACHE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Clear all cached data for a profile
 */
export function clearProfileCache(profileId: string): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const keys = [
      `${COLLECTION_STORAGE_KEY}_${profileId}`,
      `${WISHLIST_STORAGE_KEY}_${profileId}`,
      `${CARDS_STORAGE_KEY}_${profileId}`,
      `${CACHE_METADATA_KEY}_${profileId}`,
    ];

    for (const key of keys) {
      localStorage.removeItem(key);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all offline caches
 */
export function clearAllOfflineCaches(): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const prefixes = [
      COLLECTION_STORAGE_KEY,
      WISHLIST_STORAGE_KEY,
      CARDS_STORAGE_KEY,
      CACHE_METADATA_KEY,
    ];

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get all cached profile IDs
 */
export function getCachedProfileIds(): string[] {
  if (!isLocalStorageAvailable()) return [];

  const profileIds = new Set<string>();
  const prefix = `${CACHE_METADATA_KEY}_`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const profileId = key.substring(prefix.length);
      if (profileId) {
        profileIds.add(profileId);
      }
    }
  }

  return Array.from(profileIds);
}

// ============================================================================
// OFFLINE DATA SNAPSHOT FUNCTIONS
// ============================================================================

/**
 * Create a complete offline data snapshot
 */
export function createOfflineSnapshot(
  profileId: string,
  collection: OfflineCollectionCard[],
  wishlist: OfflineWishlistCard[],
  cards: OfflineCachedCard[]
): OfflineDataSnapshot {
  const metadata: CacheMetadata = {
    version: CACHE_VERSION,
    lastUpdated: Date.now(),
    collectionCount: collection.length,
    wishlistCount: wishlist.length,
    cardsCached: cards.length,
    imagesCached: 0, // Will be updated when images are cached
    profileId,
  };

  return {
    collection,
    wishlist,
    cards,
    metadata,
  };
}

/**
 * Save a complete offline data snapshot
 */
export function saveOfflineSnapshot(
  profileId: string,
  snapshot: OfflineDataSnapshot
): CacheUpdateResult {
  const errors: string[] = [];
  let itemsCached = 0;

  if (!saveCollectionToCache(profileId, snapshot.collection)) {
    errors.push('Failed to save collection data');
  } else {
    itemsCached += snapshot.collection.length;
  }

  if (!saveWishlistToCache(profileId, snapshot.wishlist)) {
    errors.push('Failed to save wishlist data');
  } else {
    itemsCached += snapshot.wishlist.length;
  }

  if (!saveCardsToCache(profileId, snapshot.cards)) {
    errors.push('Failed to save card data');
  } else {
    itemsCached += snapshot.cards.length;
  }

  if (!saveCacheMetadata(profileId, snapshot.metadata)) {
    errors.push('Failed to save cache metadata');
  }

  return {
    success: errors.length === 0,
    itemsCached,
    errors,
    timestamp: Date.now(),
  };
}

/**
 * Load a complete offline data snapshot
 */
export function loadOfflineSnapshot(profileId: string): OfflineDataSnapshot | null {
  const collectionData = loadCollectionFromCache(profileId);
  const wishlistData = loadWishlistFromCache(profileId);
  const cardsData = loadCardsFromCache(profileId);
  const metadata = loadCacheMetadata(profileId);

  if (!collectionData && !wishlistData && !cardsData) {
    return null;
  }

  return {
    collection: collectionData?.collection ?? [],
    wishlist: wishlistData?.wishlist ?? [],
    cards: cardsData?.cards ?? [],
    metadata,
  };
}

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

/**
 * Service worker script content for offline caching
 * This returns the script content that should be saved to public/sw.js
 */
export function getServiceWorkerScript(): string {
  return `
// CardDex Service Worker for Offline Collection Caching
// Version: ${CACHE_VERSION}

const COLLECTION_CACHE = '${COLLECTION_CACHE_NAME}';
const IMAGE_CACHE = '${IMAGE_CACHE_NAME}';
const STATIC_CACHE = '${STATIC_CACHE_NAME}';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/sets',
  '/my-wishlist',
  '/badges',
];

// Image domains to cache
const IMAGE_DOMAINS = [
  'images.pokemontcg.io',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES).catch((err) => {
        console.warn('Failed to cache some static files:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('carddex-') &&
                   name !== COLLECTION_CACHE &&
                   name !== IMAGE_CACHE &&
                   name !== STATIC_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for API, cache first for images
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle image requests - cache first with network fallback
  if (IMAGE_DOMAINS.some(domain => url.hostname === domain)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached response and update cache in background
            fetch(event.request).then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Not in cache - fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Handle static page requests - network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/');
        });
      })
    );
    return;
  }

  // Default - network only
  event.respondWith(fetch(event.request));
});

// Message handler for cache operations
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_IMAGES') {
    const { images } = event.data;
    caches.open(IMAGE_CACHE).then((cache) => {
      Promise.all(
        images.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch(() => {})
        )
      );
    });
  }

  if (event.data.type === 'CLEAR_CACHE') {
    Promise.all([
      caches.delete(COLLECTION_CACHE),
      caches.delete(IMAGE_CACHE),
      caches.delete(STATIC_CACHE),
    ]).then(() => {
      event.source?.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});
`;
}

/**
 * Register the service worker for offline caching
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
  if (!isServiceWorkerSupported()) {
    return {
      success: false,
      registration: null,
      error: 'Service workers are not supported in this browser',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Wait for the service worker to be active
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', function handler() {
          if (this.state === 'activated') {
            this.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
    }

    return {
      success: true,
      registration,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      registration: null,
      error: err instanceof Error ? err.message : 'Failed to register service worker',
    };
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return await registration.unregister();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if service worker is registered and active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  return registration?.active !== null && registration?.active !== undefined;
}

// ============================================================================
// IMAGE CACHING
// ============================================================================

/**
 * Request the service worker to cache a list of image URLs
 */
export async function cacheImages(imageUrls: string[]): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'CACHE_IMAGES',
        images: imageUrls.slice(0, MAX_CACHED_IMAGES),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Extract image URLs from cached card data
 */
export function extractImageUrls(cards: OfflineCachedCard[]): string[] {
  const urls: string[] = [];
  for (const card of cards) {
    if (card.imageSmall) {
      urls.push(card.imageSmall);
    }
    if (card.imageLarge) {
      urls.push(card.imageLarge);
    }
  }
  return urls;
}

/**
 * Request the service worker to clear all caches
 */
export async function clearServiceWorkerCaches(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_CLEARED') {
            resolve(true);
          }
        };
        registration.active!.postMessage({ type: 'CLEAR_CACHE' }, [channel.port2]);

        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      });
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format cache age for display
 */
export function formatCacheAge(ageMs: number): string {
  if (!ageMs || ageMs === Infinity) {
    return 'Never cached';
  }

  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Format storage size for display
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Get a summary message for cache health
 */
export function getCacheHealthSummary(report: CacheHealthReport): string {
  if (report.errors.length > 0) {
    return `Cache error: ${report.errors[0]}`;
  }

  if (report.status === 'empty') {
    return 'No offline data available';
  }

  const parts: string[] = [];
  if (report.collectionCount > 0) {
    parts.push(`${report.collectionCount} cards`);
  }
  if (report.wishlistCount > 0) {
    parts.push(`${report.wishlistCount} wishlist items`);
  }

  const dataDesc = parts.length > 0 ? parts.join(', ') : 'No data';
  const ageDesc = formatCacheAge(report.age);

  return `${dataDesc} cached ${ageDesc}`;
}

/**
 * Check if cache should be refreshed (stale or empty)
 */
export function shouldRefreshCache(report: CacheHealthReport): boolean {
  return report.status === 'empty' || report.status === 'stale' || report.status === 'error';
}

/**
 * Get storage usage percentage
 */
export function getStorageUsagePercent(report: CacheHealthReport): number {
  if (report.storageAvailable === 0) return 0;
  return Math.round((report.storageUsed / report.storageAvailable) * 100);
}

/**
 * Check if storage is running low
 */
export function isStorageLow(report: CacheHealthReport, threshold: number = 80): boolean {
  return getStorageUsagePercent(report) >= threshold;
}
