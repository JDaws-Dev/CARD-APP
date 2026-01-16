// ============================================================================
// DATA PERSISTENCE UTILITIES
// Client-side utilities for data persistence guarantee
// Provides checksum computation, device tracking, and recovery helpers
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/** Data integrity check version - must match Convex module */
export const INTEGRITY_VERSION = 1;

/** Device types for tracking */
export type DeviceType = 'web' | 'ios' | 'android' | 'desktop' | 'unknown';

/** Card variant types */
export type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

/** Valid card variants */
export const VALID_VARIANTS: CardVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  '1stEditionHolofoil',
  '1stEditionNormal',
];

/** Collection card for persistence */
export interface PersistenceCard {
  cardId: string;
  variant: CardVariant;
  quantity: number;
}

/** Wishlist card for persistence */
export interface PersistenceWishlistCard {
  cardId: string;
  isPriority: boolean;
}

/** Achievement for persistence */
export interface PersistenceAchievement {
  achievementType: string;
  achievementKey: string;
  earnedAt: number;
}

/** Data snapshot for persistence */
export interface DataSnapshot {
  version: number;
  createdAt: number;
  checksum: number;
  collection: PersistenceCard[];
  wishlist: PersistenceWishlistCard[];
  achievements: PersistenceAchievement[];
  stats: DataStats;
}

/** Data statistics */
export interface DataStats {
  collectionCards: number;
  totalQuantity: number;
  uniqueCardIds: number;
  wishlistCards: number;
  achievements: number;
}

/** Checksum result */
export interface ChecksumResult {
  checksum: number;
  stats: DataStats;
  timestamp: number;
}

/** Data health status */
export type DataHealthStatus = 'healthy' | 'warning' | 'error' | 'empty' | 'unknown';

/** Persistence status */
export interface PersistenceStatus {
  health: DataHealthStatus;
  checksum: number;
  stats: DataStats;
  lastSync: number | null;
  lastBackup: number | null;
  deviceCount: number;
}

/** Discrepancy report */
export interface DiscrepancyReport {
  isValid: boolean;
  discrepancies: string[];
  suggestions: string[];
}

// ============================================================================
// CHECKSUM FUNCTIONS
// ============================================================================

/**
 * Compute a hash code from a string.
 * Must match the server-side implementation exactly.
 */
export function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash;
}

/**
 * Compute checksum for collection data.
 * Must match the server-side implementation exactly.
 */
export function computeCollectionChecksum(cards: PersistenceCard[]): number {
  const sortedData = cards
    .map((c) => `${c.cardId}|${c.variant}|${c.quantity}`)
    .sort()
    .join(';');
  return hashCode(sortedData);
}

/**
 * Compute checksum for wishlist data.
 */
export function computeWishlistChecksum(wishlist: PersistenceWishlistCard[]): number {
  const sortedData = wishlist
    .map((w) => `${w.cardId}|${w.isPriority}`)
    .sort()
    .join(';');
  return hashCode(sortedData);
}

/**
 * Compute checksum for achievement data.
 */
export function computeAchievementChecksum(achievements: PersistenceAchievement[]): number {
  const sortedData = achievements
    .map((a) => `${a.achievementType}|${a.achievementKey}|${a.earnedAt}`)
    .sort()
    .join(';');
  return hashCode(sortedData);
}

/**
 * Compute a combined checksum for all profile data.
 * This must match the server-side implementation exactly.
 */
export function computeFullChecksum(
  collection: PersistenceCard[],
  wishlist: PersistenceWishlistCard[],
  achievements: PersistenceAchievement[]
): ChecksumResult {
  const collectionData = collection
    .map((c) => `${c.cardId}|${c.variant}|${c.quantity}`)
    .sort()
    .join(';');

  const wishlistData = wishlist
    .map((w) => `${w.cardId}|${w.isPriority}`)
    .sort()
    .join(';');

  const achievementData = achievements
    .map((a) => `${a.achievementType}|${a.achievementKey}|${a.earnedAt}`)
    .sort()
    .join(';');

  const allData = [collectionData, wishlistData, achievementData].join('||');
  const checksum = hashCode(allData);

  const uniqueCardIds = new Set(collection.map((c) => c.cardId)).size;

  return {
    checksum,
    stats: {
      collectionCards: collection.length,
      totalQuantity: collection.reduce((sum, c) => sum + c.quantity, 0),
      uniqueCardIds,
      wishlistCards: wishlist.length,
      achievements: achievements.length,
    },
    timestamp: Date.now(),
  };
}

// ============================================================================
// DEVICE IDENTIFICATION
// ============================================================================

/**
 * Generate a unique device ID.
 * Uses a combination of random values for uniqueness.
 */
export function generateDeviceId(): string {
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestampPart = Date.now().toString(36);
  return `device_${randomPart}${timestampPart}`;
}

/**
 * Get a persistent device ID from localStorage, or generate a new one.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return generateDeviceId();
  }

  const storageKey = 'carddex_device_id';
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

/**
 * Detect the current device type.
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown';
  }

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }

  if (/android/.test(ua)) {
    return 'android';
  }

  if (/electron/.test(ua) || /nwjs/.test(ua)) {
    return 'desktop';
  }

  return 'web';
}

/**
 * Get a human-readable device name.
 */
export function getDeviceName(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Unknown Device';
  }

  const ua = navigator.userAgent;

  // Try to extract device/browser info
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) {
    const match = ua.match(/Android\s[\d.]+;\s*([^;)]+)/);
    return match ? match[1].trim() : 'Android Device';
  }
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Web Browser';
}

// ============================================================================
// LOCAL STORAGE CACHE
// ============================================================================

const STORAGE_PREFIX = 'carddex_persistence_';

/**
 * Save a checksum to local storage for offline verification.
 */
export function saveLocalChecksum(profileId: string, checksum: number, stats: DataStats): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  const key = `${STORAGE_PREFIX}checksum_${profileId}`;
  const data = {
    checksum,
    stats,
    savedAt: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or other error - silently fail
  }
}

/**
 * Get a saved checksum from local storage.
 */
export function getLocalChecksum(
  profileId: string
): { checksum: number; stats: DataStats; savedAt: number } | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  const key = `${STORAGE_PREFIX}checksum_${profileId}`;

  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Parse error - return null
  }

  return null;
}

/**
 * Save a data snapshot to local storage for offline recovery.
 */
export function saveLocalSnapshot(profileId: string, snapshot: DataSnapshot): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  const key = `${STORAGE_PREFIX}snapshot_${profileId}`;

  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
    return true;
  } catch {
    // Storage quota exceeded
    return false;
  }
}

/**
 * Get a saved data snapshot from local storage.
 */
export function getLocalSnapshot(profileId: string): DataSnapshot | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  const key = `${STORAGE_PREFIX}snapshot_${profileId}`;

  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Parse error
  }

  return null;
}

/**
 * Clear local persistence data for a profile.
 */
export function clearLocalPersistenceData(profileId: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  const checksumKey = `${STORAGE_PREFIX}checksum_${profileId}`;
  const snapshotKey = `${STORAGE_PREFIX}snapshot_${profileId}`;

  localStorage.removeItem(checksumKey);
  localStorage.removeItem(snapshotKey);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a card ID format.
 */
export function isValidCardId(cardId: string): boolean {
  if (!cardId || typeof cardId !== 'string') {
    return false;
  }
  // Allow alphanumeric with hyphens, min 2 chars
  return /^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(cardId) || /^[a-zA-Z0-9]{2,}$/.test(cardId);
}

/**
 * Validate a card variant.
 */
export function isValidVariant(variant: string | undefined): variant is CardVariant {
  if (variant === undefined) {
    return false;
  }
  return VALID_VARIANTS.includes(variant as CardVariant);
}

/**
 * Validate a card quantity.
 */
export function isValidQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1;
}

/**
 * Validate a persistence card.
 */
export function validatePersistenceCard(card: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!card || typeof card !== 'object') {
    return { isValid: false, errors: ['Invalid card format'] };
  }

  const c = card as Record<string, unknown>;

  if (!isValidCardId(c.cardId as string)) {
    errors.push(`Invalid card ID: ${c.cardId}`);
  }

  if (!isValidVariant(c.variant as string)) {
    errors.push(`Invalid variant: ${c.variant}`);
  }

  if (!isValidQuantity(c.quantity as number)) {
    errors.push(`Invalid quantity: ${c.quantity}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate a data snapshot.
 */
export function validateDataSnapshot(snapshot: unknown): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!snapshot || typeof snapshot !== 'object') {
    return { isValid: false, errors: ['Invalid snapshot format'], warnings: [] };
  }

  const s = snapshot as Record<string, unknown>;

  // Check version
  if (typeof s.version !== 'number' || s.version !== INTEGRITY_VERSION) {
    warnings.push(
      `Snapshot version ${s.version} may not be compatible with current version ${INTEGRITY_VERSION}`
    );
  }

  // Check required fields
  if (typeof s.checksum !== 'number') {
    errors.push('Missing or invalid checksum');
  }

  if (!Array.isArray(s.collection)) {
    errors.push('Missing or invalid collection array');
  } else {
    // Validate each card
    s.collection.forEach((card, index) => {
      const result = validatePersistenceCard(card);
      if (!result.isValid) {
        result.errors.forEach((err) => errors.push(`Card ${index}: ${err}`));
      }
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ============================================================================
// COMPARISON & DIFF FUNCTIONS
// ============================================================================

/**
 * Compare two checksums and generate a discrepancy report.
 */
export function compareChecksums(
  localChecksum: number,
  serverChecksum: number,
  localStats: DataStats,
  serverStats: DataStats
): DiscrepancyReport {
  const discrepancies: string[] = [];
  const suggestions: string[] = [];

  if (localChecksum !== serverChecksum) {
    discrepancies.push('Checksum mismatch between local and server data');
  }

  if (localStats.collectionCards !== serverStats.collectionCards) {
    const diff = serverStats.collectionCards - localStats.collectionCards;
    if (diff > 0) {
      discrepancies.push(`Server has ${diff} more card entries than local`);
      suggestions.push('Refresh your collection to get the latest data');
    } else {
      discrepancies.push(`Local has ${-diff} more card entries than server`);
      suggestions.push('Some local changes may not have synced - try syncing again');
    }
  }

  if (localStats.totalQuantity !== serverStats.totalQuantity) {
    const diff = serverStats.totalQuantity - localStats.totalQuantity;
    if (diff > 0) {
      discrepancies.push(`Server has ${diff} more total cards than local`);
    } else {
      discrepancies.push(`Local has ${-diff} more total cards than server`);
    }
  }

  if (localStats.wishlistCards !== serverStats.wishlistCards) {
    discrepancies.push('Wishlist count differs between local and server');
    suggestions.push('Refresh your wishlist to sync the latest changes');
  }

  if (localStats.achievements !== serverStats.achievements) {
    discrepancies.push('Achievement count differs between local and server');
    suggestions.push('Some achievements may not have synced properly');
  }

  if (discrepancies.length === 0) {
    return { isValid: true, discrepancies: [], suggestions: [] };
  }

  return { isValid: false, discrepancies, suggestions };
}

/**
 * Find differences between two collections.
 */
export function diffCollections(
  localCollection: PersistenceCard[],
  serverCollection: PersistenceCard[]
): {
  onlyInLocal: PersistenceCard[];
  onlyInServer: PersistenceCard[];
  quantityDifferences: Array<{
    cardId: string;
    variant: CardVariant;
    localQuantity: number;
    serverQuantity: number;
  }>;
} {
  const localMap = new Map<string, PersistenceCard>();
  for (const card of localCollection) {
    const key = `${card.cardId}|${card.variant}`;
    localMap.set(key, card);
  }

  const serverMap = new Map<string, PersistenceCard>();
  for (const card of serverCollection) {
    const key = `${card.cardId}|${card.variant}`;
    serverMap.set(key, card);
  }

  const onlyInLocal: PersistenceCard[] = [];
  const onlyInServer: PersistenceCard[] = [];
  const quantityDifferences: Array<{
    cardId: string;
    variant: CardVariant;
    localQuantity: number;
    serverQuantity: number;
  }> = [];

  // Find cards only in local
  for (const [key, card] of localMap) {
    const serverCard = serverMap.get(key);
    if (!serverCard) {
      onlyInLocal.push(card);
    } else if (card.quantity !== serverCard.quantity) {
      quantityDifferences.push({
        cardId: card.cardId,
        variant: card.variant,
        localQuantity: card.quantity,
        serverQuantity: serverCard.quantity,
      });
    }
  }

  // Find cards only in server
  for (const [key, card] of serverMap) {
    if (!localMap.has(key)) {
      onlyInServer.push(card);
    }
  }

  return { onlyInLocal, onlyInServer, quantityDifferences };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get a human-readable data health message.
 */
export function getDataHealthMessage(status: DataHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Your collection data is safe and synced across all devices.';
    case 'warning':
      return 'Some data may not be synced. Please check your connection.';
    case 'error':
      return 'There may be an issue with your data. Please contact support if this persists.';
    case 'empty':
      return 'No collection data found. Start adding cards to build your collection!';
    case 'unknown':
    default:
      return 'Unable to verify data status. Please try again.';
  }
}

/**
 * Get a color for the data health status.
 */
export function getDataHealthColor(status: DataHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    case 'empty':
      return 'gray';
    case 'unknown':
    default:
      return 'gray';
  }
}

/**
 * Format a timestamp for display.
 */
export function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'Just now';
  }

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(diff / 86400000);
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get a sync status message.
 */
export function getSyncStatusMessage(lastSync: number | null): {
  message: string;
  urgency: 'none' | 'low' | 'medium' | 'high';
} {
  if (!lastSync) {
    return {
      message: 'Your data has never been verified. Create a backup point to ensure data safety.',
      urgency: 'high',
    };
  }

  const daysSinceSync = (Date.now() - lastSync) / 86400000;

  if (daysSinceSync < 1) {
    return {
      message: 'Your data was recently verified and is secure.',
      urgency: 'none',
    };
  }

  if (daysSinceSync < 7) {
    return {
      message: 'Your data is synced. Consider creating a backup point.',
      urgency: 'low',
    };
  }

  if (daysSinceSync < 30) {
    return {
      message: 'It has been a while since your last sync. We recommend verifying your data.',
      urgency: 'medium',
    };
  }

  return {
    message: 'It has been over a month since your last sync. Please verify your data.',
    urgency: 'high',
  };
}

/**
 * Format stats for display.
 */
export function formatDataStats(stats: DataStats): string {
  const parts: string[] = [];

  if (stats.collectionCards > 0) {
    parts.push(`${stats.totalQuantity} cards (${stats.uniqueCardIds} unique)`);
  }

  if (stats.wishlistCards > 0) {
    parts.push(`${stats.wishlistCards} wishlist items`);
  }

  if (stats.achievements > 0) {
    parts.push(`${stats.achievements} achievements`);
  }

  if (parts.length === 0) {
    return 'No data';
  }

  return parts.join(', ');
}
