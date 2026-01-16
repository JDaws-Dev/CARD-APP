// ============================================================================
// CONFLICT RESOLUTION UTILITIES
// Pure functions for handling sync conflicts when same account is used on
// multiple devices.
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/**
 * Valid card variant types
 */
export type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

/**
 * Conflict resolution strategy
 */
export type ResolutionStrategy =
  | 'last_write_wins'
  | 'keep_higher'
  | 'merge_add'
  | 'server_wins'
  | 'client_wins';

/**
 * A card entry in a collection
 */
export interface CollectionCard {
  cardId: string;
  variant: CardVariant;
  quantity: number;
}

/**
 * Comparison result for a single card
 */
export interface CardComparison {
  cardId: string;
  variant: CardVariant;
  serverQuantity: number | null;
  clientQuantity: number | null;
  status: 'in_sync' | 'conflict' | 'only_server' | 'only_client';
}

/**
 * Result of comparing two collection states
 */
export interface CollectionComparison {
  hasConflicts: boolean;
  inSync: CollectionCard[];
  conflicts: Array<{
    cardId: string;
    variant: CardVariant;
    serverQuantity: number;
    clientQuantity: number;
  }>;
  onlyOnServer: CollectionCard[];
  onlyOnClient: CollectionCard[];
  summary: {
    totalServerCards: number;
    totalClientCards: number;
    inSyncCount: number;
    conflictCount: number;
    onlyOnServerCount: number;
    onlyOnClientCount: number;
  };
}

/**
 * Result of resolving a conflict
 */
export interface ConflictResolution {
  cardId: string;
  variant: CardVariant;
  resolvedQuantity: number;
  strategy: ResolutionStrategy;
  serverQuantity: number;
  clientQuantity: number;
  conflictType: 'quantity_mismatch' | 'missing_on_server' | 'missing_on_client';
}

/**
 * Sync status information
 */
export interface SyncStatus {
  state: 'synced' | 'needs_sync' | 'syncing' | 'error';
  lastSyncTimestamp: number | null;
  pendingChanges: number;
  conflictCount: number;
}

/**
 * Offline change to be synced
 */
export interface PendingChange {
  id: string;
  cardId: string;
  variant: CardVariant;
  action: 'add' | 'remove' | 'update';
  quantity: number;
  expectedServerQuantity: number | null;
  timestamp: number;
  deviceId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default resolution strategy
 */
export const DEFAULT_STRATEGY: ResolutionStrategy = 'last_write_wins';

/**
 * Valid card variants
 */
export const VALID_VARIANTS: CardVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  '1stEditionHolofoil',
  '1stEditionNormal',
];

/**
 * Resolution strategy display names
 */
export const STRATEGY_DISPLAY_NAMES: Record<ResolutionStrategy, string> = {
  last_write_wins: 'Most Recent Wins',
  keep_higher: 'Keep Higher Quantity',
  merge_add: 'Merge Changes',
  server_wins: 'Keep Server Version',
  client_wins: 'Keep Local Version',
};

/**
 * Resolution strategy descriptions
 */
export const STRATEGY_DESCRIPTIONS: Record<ResolutionStrategy, string> = {
  last_write_wins: 'The most recent change will be kept. Simple and fast, but may lose changes.',
  keep_higher:
    'Always keeps the higher quantity. Good for collecting where you never want to lose cards.',
  merge_add:
    'Combines changes from both sources. Best when both devices added cards independently.',
  server_wins: 'Always keeps the server version. Use when server data is authoritative.',
  client_wins: 'Always keeps your local version. Use when you want to override server data.',
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a string is a valid resolution strategy
 */
export function isValidStrategy(value: string): value is ResolutionStrategy {
  return ['last_write_wins', 'keep_higher', 'merge_add', 'server_wins', 'client_wins'].includes(
    value
  );
}

/**
 * Check if a string is a valid card variant
 */
export function isValidVariant(value: string): value is CardVariant {
  return VALID_VARIANTS.includes(value as CardVariant);
}

/**
 * Validate a collection card entry
 */
export function isValidCollectionCard(card: unknown): card is CollectionCard {
  if (typeof card !== 'object' || card === null) return false;
  const c = card as Record<string, unknown>;
  return (
    typeof c.cardId === 'string' &&
    c.cardId.length > 0 &&
    typeof c.variant === 'string' &&
    isValidVariant(c.variant) &&
    typeof c.quantity === 'number' &&
    c.quantity >= 0 &&
    Number.isInteger(c.quantity)
  );
}

// ============================================================================
// COLLECTION COMPARISON FUNCTIONS
// ============================================================================

/**
 * Create a unique key for a card entry (cardId + variant)
 */
export function createCardKey(cardId: string, variant: CardVariant): string {
  return `${cardId}|${variant}`;
}

/**
 * Parse a card key back into cardId and variant
 */
export function parseCardKey(key: string): { cardId: string; variant: CardVariant } {
  const [cardId, variant] = key.split('|');
  return {
    cardId,
    variant: (variant as CardVariant) || 'normal',
  };
}

/**
 * Build a map of cards by their key
 */
export function buildCardMap(cards: CollectionCard[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const card of cards) {
    const key = createCardKey(card.cardId, card.variant);
    map.set(key, card.quantity);
  }
  return map;
}

/**
 * Compare two collection states and identify differences
 */
export function compareCollections(
  serverCards: CollectionCard[],
  clientCards: CollectionCard[]
): CollectionComparison {
  const serverMap = buildCardMap(serverCards);
  const clientMap = buildCardMap(clientCards);

  const inSync: CollectionCard[] = [];
  const conflicts: Array<{
    cardId: string;
    variant: CardVariant;
    serverQuantity: number;
    clientQuantity: number;
  }> = [];
  const onlyOnServer: CollectionCard[] = [];
  const onlyOnClient: CollectionCard[] = [];

  // Check server cards against client
  for (const [key, serverQty] of serverMap) {
    const { cardId, variant } = parseCardKey(key);
    const clientQty = clientMap.get(key);

    if (clientQty === undefined) {
      onlyOnServer.push({ cardId, variant, quantity: serverQty });
    } else if (clientQty !== serverQty) {
      conflicts.push({
        cardId,
        variant,
        serverQuantity: serverQty,
        clientQuantity: clientQty,
      });
    } else {
      inSync.push({ cardId, variant, quantity: serverQty });
    }
  }

  // Check client cards not on server
  for (const [key, clientQty] of clientMap) {
    if (!serverMap.has(key)) {
      const { cardId, variant } = parseCardKey(key);
      onlyOnClient.push({ cardId, variant, quantity: clientQty });
    }
  }

  const hasConflicts = conflicts.length > 0 || onlyOnServer.length > 0 || onlyOnClient.length > 0;

  return {
    hasConflicts,
    inSync,
    conflicts,
    onlyOnServer,
    onlyOnClient,
    summary: {
      totalServerCards: serverMap.size,
      totalClientCards: clientMap.size,
      inSyncCount: inSync.length,
      conflictCount: conflicts.length,
      onlyOnServerCount: onlyOnServer.length,
      onlyOnClientCount: onlyOnClient.length,
    },
  };
}

/**
 * Get a single card comparison
 */
export function compareCard(
  cardId: string,
  variant: CardVariant,
  serverQuantity: number | null,
  clientQuantity: number | null
): CardComparison {
  let status: CardComparison['status'];

  if (serverQuantity === null && clientQuantity === null) {
    status = 'in_sync'; // Both don't have it
  } else if (serverQuantity === null) {
    status = 'only_client';
  } else if (clientQuantity === null) {
    status = 'only_server';
  } else if (serverQuantity === clientQuantity) {
    status = 'in_sync';
  } else {
    status = 'conflict';
  }

  return {
    cardId,
    variant,
    serverQuantity,
    clientQuantity,
    status,
  };
}

// ============================================================================
// CONFLICT RESOLUTION FUNCTIONS
// ============================================================================

/**
 * Resolve a quantity conflict using the specified strategy
 */
export function resolveQuantityConflict(
  serverQuantity: number,
  clientQuantity: number,
  expectedServerQuantity: number | null,
  strategy: ResolutionStrategy
): number {
  switch (strategy) {
    case 'last_write_wins':
    case 'client_wins':
      return clientQuantity;

    case 'server_wins':
      return serverQuantity;

    case 'keep_higher':
      return Math.max(serverQuantity, clientQuantity);

    case 'merge_add':
      if (expectedServerQuantity !== null) {
        // Calculate deltas from expected state
        const serverDelta = serverQuantity - expectedServerQuantity;
        const clientDelta = clientQuantity - expectedServerQuantity;
        // Apply both deltas
        return Math.max(0, expectedServerQuantity + serverDelta + clientDelta);
      }
      // Fallback to max if no expected state
      return Math.max(serverQuantity, clientQuantity);

    default:
      return clientQuantity;
  }
}

/**
 * Resolve a single card conflict
 */
export function resolveCardConflict(
  cardId: string,
  variant: CardVariant,
  serverQuantity: number,
  clientQuantity: number,
  expectedServerQuantity: number | null,
  strategy: ResolutionStrategy
): ConflictResolution {
  const resolvedQuantity = resolveQuantityConflict(
    serverQuantity,
    clientQuantity,
    expectedServerQuantity,
    strategy
  );

  return {
    cardId,
    variant,
    resolvedQuantity,
    strategy,
    serverQuantity,
    clientQuantity,
    conflictType: 'quantity_mismatch',
  };
}

/**
 * Resolve a card that only exists on one side
 */
export function resolveMissingCardConflict(
  cardId: string,
  variant: CardVariant,
  quantity: number,
  existsOn: 'server' | 'client',
  strategy: ResolutionStrategy
): ConflictResolution {
  let resolvedQuantity: number;

  switch (strategy) {
    case 'server_wins':
      resolvedQuantity = existsOn === 'server' ? quantity : 0;
      break;

    case 'client_wins':
    case 'last_write_wins':
      resolvedQuantity = existsOn === 'client' ? quantity : 0;
      break;

    case 'keep_higher':
    case 'merge_add':
      // Keep the card regardless of where it exists
      resolvedQuantity = quantity;
      break;

    default:
      resolvedQuantity = existsOn === 'client' ? quantity : 0;
  }

  return {
    cardId,
    variant,
    resolvedQuantity,
    strategy,
    serverQuantity: existsOn === 'server' ? quantity : 0,
    clientQuantity: existsOn === 'client' ? quantity : 0,
    conflictType: existsOn === 'server' ? 'missing_on_client' : 'missing_on_server',
  };
}

/**
 * Resolve all conflicts in a collection comparison
 */
export function resolveAllConflicts(
  comparison: CollectionComparison,
  strategy: ResolutionStrategy
): ConflictResolution[] {
  const resolutions: ConflictResolution[] = [];

  // Resolve quantity conflicts
  for (const conflict of comparison.conflicts) {
    resolutions.push(
      resolveCardConflict(
        conflict.cardId,
        conflict.variant,
        conflict.serverQuantity,
        conflict.clientQuantity,
        null, // No expected state for bulk comparison
        strategy
      )
    );
  }

  // Resolve cards only on server
  for (const card of comparison.onlyOnServer) {
    resolutions.push(
      resolveMissingCardConflict(card.cardId, card.variant, card.quantity, 'server', strategy)
    );
  }

  // Resolve cards only on client
  for (const card of comparison.onlyOnClient) {
    resolutions.push(
      resolveMissingCardConflict(card.cardId, card.variant, card.quantity, 'client', strategy)
    );
  }

  return resolutions;
}

/**
 * Apply resolutions to get the final collection state
 */
export function applyResolutions(
  inSyncCards: CollectionCard[],
  resolutions: ConflictResolution[]
): CollectionCard[] {
  const result: CollectionCard[] = [...inSyncCards];

  for (const resolution of resolutions) {
    if (resolution.resolvedQuantity > 0) {
      result.push({
        cardId: resolution.cardId,
        variant: resolution.variant,
        quantity: resolution.resolvedQuantity,
      });
    }
  }

  return result;
}

// ============================================================================
// SYNC STATUS FUNCTIONS
// ============================================================================

/**
 * Determine sync status from comparison and pending changes
 */
export function determineSyncStatus(
  comparison: CollectionComparison | null,
  pendingChanges: PendingChange[],
  isSyncing: boolean
): SyncStatus {
  if (isSyncing) {
    return {
      state: 'syncing',
      lastSyncTimestamp: null,
      pendingChanges: pendingChanges.length,
      conflictCount: comparison?.summary.conflictCount ?? 0,
    };
  }

  if (comparison === null) {
    return {
      state: 'error',
      lastSyncTimestamp: null,
      pendingChanges: pendingChanges.length,
      conflictCount: 0,
    };
  }

  if (comparison.hasConflicts || pendingChanges.length > 0) {
    return {
      state: 'needs_sync',
      lastSyncTimestamp: null,
      pendingChanges: pendingChanges.length,
      conflictCount: comparison.summary.conflictCount,
    };
  }

  return {
    state: 'synced',
    lastSyncTimestamp: Date.now(),
    pendingChanges: 0,
    conflictCount: 0,
  };
}

/**
 * Get a human-readable sync status message
 */
export function getSyncStatusMessage(status: SyncStatus): string {
  switch (status.state) {
    case 'synced':
      return 'All changes synced';
    case 'syncing':
      return `Syncing ${status.pendingChanges} changes...`;
    case 'needs_sync':
      if (status.conflictCount > 0) {
        return `${status.conflictCount} conflicts need resolution`;
      }
      return `${status.pendingChanges} changes to sync`;
    case 'error':
      return 'Sync error - tap to retry';
    default:
      return 'Unknown status';
  }
}

// ============================================================================
// PENDING CHANGES FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for a pending change
 */
export function generateChangeId(): string {
  return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a pending change record
 */
export function createPendingChange(
  cardId: string,
  variant: CardVariant,
  action: 'add' | 'remove' | 'update',
  quantity: number,
  expectedServerQuantity: number | null,
  deviceId: string
): PendingChange {
  return {
    id: generateChangeId(),
    cardId,
    variant,
    action,
    quantity,
    expectedServerQuantity,
    timestamp: Date.now(),
    deviceId,
  };
}

/**
 * Merge multiple pending changes for the same card
 */
export function mergePendingChanges(changes: PendingChange[]): PendingChange[] {
  const changeMap = new Map<string, PendingChange>();

  for (const change of changes) {
    const key = createCardKey(change.cardId, change.variant);
    const existing = changeMap.get(key);

    if (!existing) {
      changeMap.set(key, change);
    } else {
      // Merge changes
      const merged: PendingChange = {
        ...existing,
        action: change.action,
        quantity: change.action === 'add' ? existing.quantity + change.quantity : change.quantity,
        timestamp: Math.max(existing.timestamp, change.timestamp),
      };
      changeMap.set(key, merged);
    }
  }

  return Array.from(changeMap.values());
}

/**
 * Sort pending changes by timestamp
 */
export function sortPendingChanges(changes: PendingChange[]): PendingChange[] {
  return [...changes].sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================================================
// CHECKSUM FUNCTIONS
// ============================================================================

/**
 * Calculate a simple checksum for a collection
 */
export function calculateChecksum(cards: CollectionCard[]): number {
  const sortedCards = [...cards].sort((a, b) => {
    const aKey = createCardKey(a.cardId, a.variant);
    const bKey = createCardKey(b.cardId, b.variant);
    return aKey.localeCompare(bKey);
  });

  const checksumData = sortedCards.map((c) => `${c.cardId}|${c.variant}|${c.quantity}`).join(';');

  return hashCode(checksumData);
}

/**
 * Simple hash code function for string
 */
function hashCode(str: string): number {
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
 * Check if two collections have matching checksums
 */
export function checksumsMatch(serverChecksum: number, clientChecksum: number): boolean {
  return serverChecksum === clientChecksum;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the display name for a resolution strategy
 */
export function getStrategyDisplayName(strategy: ResolutionStrategy): string {
  return STRATEGY_DISPLAY_NAMES[strategy];
}

/**
 * Get the description for a resolution strategy
 */
export function getStrategyDescription(strategy: ResolutionStrategy): string {
  return STRATEGY_DESCRIPTIONS[strategy];
}

/**
 * Format a conflict for display
 */
export function formatConflictForDisplay(conflict: CardComparison | ConflictResolution): string {
  if ('resolvedQuantity' in conflict) {
    return `${conflict.cardId} (${conflict.variant}): Server=${conflict.serverQuantity}, Local=${conflict.clientQuantity} → ${conflict.resolvedQuantity}`;
  }
  return `${conflict.cardId} (${conflict.variant}): Server=${conflict.serverQuantity ?? 'none'}, Local=${conflict.clientQuantity ?? 'none'}`;
}

/**
 * Get a summary string for a collection comparison
 */
export function getComparisonSummary(comparison: CollectionComparison): string {
  const { summary } = comparison;
  if (!comparison.hasConflicts) {
    return `All ${summary.inSyncCount} cards in sync`;
  }

  const parts: string[] = [];
  if (summary.conflictCount > 0) {
    parts.push(`${summary.conflictCount} quantity conflicts`);
  }
  if (summary.onlyOnServerCount > 0) {
    parts.push(`${summary.onlyOnServerCount} only on server`);
  }
  if (summary.onlyOnClientCount > 0) {
    parts.push(`${summary.onlyOnClientCount} only locally`);
  }
  return parts.join(', ');
}

/**
 * Get recommended strategy based on conflict types
 */
export function getRecommendedStrategy(comparison: CollectionComparison): ResolutionStrategy {
  // If mostly quantity conflicts, merge_add works well
  if (
    comparison.summary.conflictCount > 0 &&
    comparison.summary.onlyOnServerCount === 0 &&
    comparison.summary.onlyOnClientCount === 0
  ) {
    return 'merge_add';
  }

  // If cards exist on different sides, keep_higher preserves data
  if (comparison.summary.onlyOnServerCount > 0 || comparison.summary.onlyOnClientCount > 0) {
    return 'keep_higher';
  }

  // Default to last_write_wins
  return 'last_write_wins';
}

/**
 * Format relative time since a timestamp
 */
export function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
