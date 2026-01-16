// ============================================================================
// DATA BACKUP UTILITIES
// Pure functions for data export/import validation and processing
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/** Export format version */
export const EXPORT_VERSION = '1.0.0';

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

/** Exported collection card format */
export interface ExportedCard {
  cardId: string;
  quantity: number;
  variant?: string;
}

/** Exported wishlist card format */
export interface ExportedWishlistCard {
  cardId: string;
  isPriority: boolean;
}

/** Exported achievement format */
export interface ExportedAchievement {
  achievementType: string;
  achievementKey: string;
  earnedAt: number;
}

/** Exported activity log format */
export interface ExportedActivityLog {
  action: string;
  metadata: Record<string, unknown> | null;
  timestamp: number;
}

/** Complete profile export format */
export interface ProfileExport {
  version: string;
  exportedAt: number;
  profile: {
    displayName: string;
    profileType?: string;
    xp?: number;
    level?: number;
  };
  collection: ExportedCard[];
  wishlist: ExportedWishlistCard[];
  achievements: ExportedAchievement[];
  activityLogs: ExportedActivityLog[];
  stats: {
    totalCards: number;
    uniqueCards: number;
    totalAchievements: number;
    wishlistCount: number;
  };
}

/** Import options */
export interface ImportOptions {
  mergeMode?: 'add' | 'replace';
  importWishlist?: boolean;
}

/** Import result */
export interface ImportResult {
  cardsImported: number;
  cardsUpdated: number;
  cardsSkipped: number;
  wishlistImported: number;
  errors: string[];
}

/** Validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a string is a valid card ID format.
 * Card IDs are typically in format "setId-number" (e.g., "sv1-1", "base1-4")
 */
export function isValidCardId(cardId: string): boolean {
  if (!cardId || typeof cardId !== 'string') {
    return false;
  }
  // Allow alphanumeric with hyphens, min 2 chars
  return /^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(cardId) || /^[a-zA-Z0-9]{2,}$/.test(cardId);
}

/**
 * Check if a variant is valid
 */
export function isValidVariant(variant: string | undefined): boolean {
  if (variant === undefined) {
    return true;
  }
  return VALID_VARIANTS.includes(variant as CardVariant);
}

/**
 * Check if a quantity is valid
 */
export function isValidQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1;
}

/**
 * Validate an exported card
 */
export function validateExportedCard(card: unknown): {
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

  if (!isValidQuantity(c.quantity as number)) {
    errors.push(`Invalid quantity: ${c.quantity}`);
  }

  if (c.variant !== undefined && !isValidVariant(c.variant as string)) {
    errors.push(`Invalid variant: ${c.variant}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate an exported wishlist card
 */
export function validateWishlistCard(card: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!card || typeof card !== 'object') {
    return { isValid: false, errors: ['Invalid wishlist card format'] };
  }

  const c = card as Record<string, unknown>;

  if (!isValidCardId(c.cardId as string)) {
    errors.push(`Invalid card ID: ${c.cardId}`);
  }

  if (typeof c.isPriority !== 'boolean') {
    errors.push(`Invalid isPriority: ${c.isPriority}`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate export version compatibility
 */
export function isVersionCompatible(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false;
  }
  // Currently only support 1.x versions
  return version.startsWith('1.');
}

/**
 * Validate a complete export data structure
 */
export function validateExportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid export data format'], warnings: [] };
  }

  const d = data as Record<string, unknown>;

  // Check version
  if (!isVersionCompatible(d.version as string)) {
    errors.push(`Incompatible export version: ${d.version}`);
  }

  // Check required fields
  if (!Array.isArray(d.collection)) {
    errors.push('Missing or invalid collection array');
  } else {
    // Validate each card
    d.collection.forEach((card, index) => {
      const result = validateExportedCard(card);
      if (!result.isValid) {
        result.errors.forEach((err) => errors.push(`Card ${index}: ${err}`));
      }
    });
  }

  // Wishlist is optional
  if (d.wishlist !== undefined && !Array.isArray(d.wishlist)) {
    errors.push('Invalid wishlist format');
  } else if (Array.isArray(d.wishlist)) {
    d.wishlist.forEach((card, index) => {
      const result = validateWishlistCard(card);
      if (!result.isValid) {
        result.errors.forEach((err) => warnings.push(`Wishlist card ${index}: ${err}`));
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// PROCESSING FUNCTIONS
// ============================================================================

/**
 * Normalize a card variant to a valid type
 */
export function normalizeVariant(variant: string | undefined): CardVariant {
  if (!variant) {
    return 'normal';
  }
  if (VALID_VARIANTS.includes(variant as CardVariant)) {
    return variant as CardVariant;
  }
  return 'normal';
}

/**
 * Clean and normalize export data for import
 */
export function normalizeExportData(data: ProfileExport): ProfileExport {
  return {
    ...data,
    collection: data.collection.map((card) => ({
      ...card,
      variant: normalizeVariant(card.variant),
      quantity: Math.max(1, Math.floor(card.quantity)),
    })),
    wishlist: data.wishlist.map((card) => ({
      ...card,
      isPriority: !!card.isPriority,
    })),
  };
}

/**
 * Calculate statistics from export data
 */
export function calculateExportStats(data: ProfileExport): ProfileExport['stats'] {
  const uniqueCards = new Set(data.collection.map((c) => c.cardId)).size;
  const totalCards = data.collection.reduce((sum, c) => sum + c.quantity, 0);

  return {
    uniqueCards,
    totalCards,
    totalAchievements: data.achievements.length,
    wishlistCount: data.wishlist.length,
  };
}

/**
 * Filter collection to remove invalid entries
 */
export function filterValidCards(cards: ExportedCard[]): ExportedCard[] {
  return cards.filter((card) => isValidCardId(card.cardId) && isValidQuantity(card.quantity));
}

/**
 * Filter wishlist to remove invalid entries
 */
export function filterValidWishlistCards(cards: ExportedWishlistCard[]): ExportedWishlistCard[] {
  return cards.filter(
    (card) => isValidCardId(card.cardId) && typeof card.isPriority === 'boolean'
  );
}

/**
 * Merge two collections (add mode)
 */
export function mergeCollections(
  existing: ExportedCard[],
  incoming: ExportedCard[]
): ExportedCard[] {
  const map = new Map<string, ExportedCard>();

  // Add existing cards
  for (const card of existing) {
    const key = `${card.cardId}:${card.variant ?? 'normal'}`;
    map.set(key, { ...card });
  }

  // Merge incoming cards
  for (const card of incoming) {
    const key = `${card.cardId}:${card.variant ?? 'normal'}`;
    const existingCard = map.get(key);
    if (existingCard) {
      existingCard.quantity += card.quantity;
    } else {
      map.set(key, { ...card });
    }
  }

  return Array.from(map.values());
}

/**
 * Replace collection (replace mode)
 */
export function replaceCollection(
  existing: ExportedCard[],
  incoming: ExportedCard[]
): ExportedCard[] {
  const map = new Map<string, ExportedCard>();

  // Add existing cards
  for (const card of existing) {
    const key = `${card.cardId}:${card.variant ?? 'normal'}`;
    map.set(key, { ...card });
  }

  // Replace with incoming cards
  for (const card of incoming) {
    const key = `${card.cardId}:${card.variant ?? 'normal'}`;
    map.set(key, { ...card });
  }

  return Array.from(map.values());
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format export timestamp for display
 */
export function formatExportDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time since last backup
 */
export function getTimeSinceBackup(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}

/**
 * Generate a filename for export
 */
export function generateExportFilename(profileName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const safeName = profileName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `carddex-backup-${safeName}-${date}.json`;
}

/**
 * Get backup recommendation message
 */
export function getBackupRecommendation(lastBackup: number | null): {
  urgency: 'none' | 'low' | 'medium' | 'high';
  message: string;
} {
  if (!lastBackup) {
    return {
      urgency: 'high',
      message: "You haven't backed up your collection yet. Create a backup to keep your cards safe!",
    };
  }

  const daysSinceBackup = Math.floor((Date.now() - lastBackup) / 86400000);

  if (daysSinceBackup < 7) {
    return {
      urgency: 'none',
      message: 'Your collection is backed up and secure.',
    };
  }

  if (daysSinceBackup < 14) {
    return {
      urgency: 'low',
      message: "It's been a while since your last backup. Consider backing up soon.",
    };
  }

  if (daysSinceBackup < 30) {
    return {
      urgency: 'medium',
      message: "It's been 2+ weeks since your last backup. We recommend backing up your collection.",
    };
  }

  return {
    urgency: 'high',
    message: "It's been over a month since your last backup. Please back up your collection!",
  };
}

/**
 * Estimate export file size
 */
export function estimateExportSize(stats: ProfileExport['stats']): number {
  // Rough estimate: ~100 bytes per card, ~50 bytes per wishlist item, ~80 bytes per achievement
  const cardBytes = stats.totalCards * 100;
  const wishlistBytes = stats.wishlistCount * 50;
  const achievementBytes = stats.totalAchievements * 80;
  const overhead = 500; // JSON structure overhead

  return cardBytes + wishlistBytes + achievementBytes + overhead;
}
