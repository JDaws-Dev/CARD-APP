import {
  // Types
  CardVariant,
  ResolutionStrategy,
  CollectionCard,
  CollectionComparison,
  ConflictResolution,
  SyncStatus,
  PendingChange,
  // Constants
  DEFAULT_STRATEGY,
  VALID_VARIANTS,
  STRATEGY_DISPLAY_NAMES,
  STRATEGY_DESCRIPTIONS,
  // Validation functions
  isValidStrategy,
  isValidVariant,
  isValidCollectionCard,
  // Collection comparison functions
  createCardKey,
  parseCardKey,
  buildCardMap,
  compareCollections,
  compareCard,
  // Conflict resolution functions
  resolveQuantityConflict,
  resolveCardConflict,
  resolveMissingCardConflict,
  resolveAllConflicts,
  applyResolutions,
  // Sync status functions
  determineSyncStatus,
  getSyncStatusMessage,
  // Pending changes functions
  generateChangeId,
  createPendingChange,
  mergePendingChanges,
  sortPendingChanges,
  // Checksum functions
  calculateChecksum,
  checksumsMatch,
  // Display helpers
  getStrategyDisplayName,
  getStrategyDescription,
  formatConflictForDisplay,
  getComparisonSummary,
  getRecommendedStrategy,
  formatTimeSince,
} from '../conflictResolution';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('conflictResolution constants', () => {
  describe('DEFAULT_STRATEGY', () => {
    it('should be last_write_wins', () => {
      expect(DEFAULT_STRATEGY).toBe('last_write_wins');
    });
  });

  describe('VALID_VARIANTS', () => {
    it('should contain all valid variants', () => {
      expect(VALID_VARIANTS).toContain('normal');
      expect(VALID_VARIANTS).toContain('holofoil');
      expect(VALID_VARIANTS).toContain('reverseHolofoil');
      expect(VALID_VARIANTS).toContain('1stEditionHolofoil');
      expect(VALID_VARIANTS).toContain('1stEditionNormal');
    });

    it('should have exactly 5 variants', () => {
      expect(VALID_VARIANTS).toHaveLength(5);
    });
  });

  describe('STRATEGY_DISPLAY_NAMES', () => {
    it('should have names for all strategies', () => {
      expect(STRATEGY_DISPLAY_NAMES.last_write_wins).toBe('Most Recent Wins');
      expect(STRATEGY_DISPLAY_NAMES.keep_higher).toBe('Keep Higher Quantity');
      expect(STRATEGY_DISPLAY_NAMES.merge_add).toBe('Merge Changes');
      expect(STRATEGY_DISPLAY_NAMES.server_wins).toBe('Keep Server Version');
      expect(STRATEGY_DISPLAY_NAMES.client_wins).toBe('Keep Local Version');
    });
  });

  describe('STRATEGY_DESCRIPTIONS', () => {
    it('should have descriptions for all strategies', () => {
      expect(STRATEGY_DESCRIPTIONS.last_write_wins).toContain('recent');
      expect(STRATEGY_DESCRIPTIONS.keep_higher).toContain('higher');
      expect(STRATEGY_DESCRIPTIONS.merge_add).toContain('Combines');
      expect(STRATEGY_DESCRIPTIONS.server_wins).toContain('server');
      expect(STRATEGY_DESCRIPTIONS.client_wins).toContain('local');
    });
  });
});

// ============================================================================
// VALIDATION FUNCTIONS TESTS
// ============================================================================

describe('validation functions', () => {
  describe('isValidStrategy', () => {
    it('should return true for valid strategies', () => {
      expect(isValidStrategy('last_write_wins')).toBe(true);
      expect(isValidStrategy('keep_higher')).toBe(true);
      expect(isValidStrategy('merge_add')).toBe(true);
      expect(isValidStrategy('server_wins')).toBe(true);
      expect(isValidStrategy('client_wins')).toBe(true);
    });

    it('should return false for invalid strategies', () => {
      expect(isValidStrategy('invalid')).toBe(false);
      expect(isValidStrategy('')).toBe(false);
      expect(isValidStrategy('LAST_WRITE_WINS')).toBe(false);
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
      expect(isValidVariant('')).toBe(false);
      expect(isValidVariant('NORMAL')).toBe(false);
    });
  });

  describe('isValidCollectionCard', () => {
    it('should return true for valid cards', () => {
      expect(isValidCollectionCard({ cardId: 'sv1-1', variant: 'normal', quantity: 1 })).toBe(true);
      expect(isValidCollectionCard({ cardId: 'sv1-1', variant: 'holofoil', quantity: 5 })).toBe(
        true
      );
    });

    it('should return false for invalid cards', () => {
      expect(isValidCollectionCard(null)).toBe(false);
      expect(isValidCollectionCard(undefined)).toBe(false);
      expect(isValidCollectionCard({})).toBe(false);
      expect(isValidCollectionCard({ cardId: '', variant: 'normal', quantity: 1 })).toBe(false);
      expect(isValidCollectionCard({ cardId: 'sv1-1', variant: 'invalid', quantity: 1 })).toBe(
        false
      );
      expect(isValidCollectionCard({ cardId: 'sv1-1', variant: 'normal', quantity: -1 })).toBe(
        false
      );
      expect(isValidCollectionCard({ cardId: 'sv1-1', variant: 'normal', quantity: 1.5 })).toBe(
        false
      );
    });
  });
});

// ============================================================================
// COLLECTION COMPARISON FUNCTIONS TESTS
// ============================================================================

describe('collection comparison functions', () => {
  describe('createCardKey', () => {
    it('should create a key from cardId and variant', () => {
      expect(createCardKey('sv1-1', 'normal')).toBe('sv1-1|normal');
      expect(createCardKey('xy1-25', 'holofoil')).toBe('xy1-25|holofoil');
    });
  });

  describe('parseCardKey', () => {
    it('should parse a key back to cardId and variant', () => {
      expect(parseCardKey('sv1-1|normal')).toEqual({
        cardId: 'sv1-1',
        variant: 'normal',
      });
      expect(parseCardKey('xy1-25|holofoil')).toEqual({
        cardId: 'xy1-25',
        variant: 'holofoil',
      });
    });

    it('should default to normal variant if missing', () => {
      expect(parseCardKey('sv1-1|')).toEqual({
        cardId: 'sv1-1',
        variant: 'normal',
      });
    });
  });

  describe('buildCardMap', () => {
    it('should create a map from cards', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
      ];
      const map = buildCardMap(cards);
      expect(map.get('sv1-1|normal')).toBe(2);
      expect(map.get('sv1-2|holofoil')).toBe(1);
      expect(map.size).toBe(2);
    });

    it('should handle empty array', () => {
      const map = buildCardMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('compareCollections', () => {
    it('should identify in-sync cards', () => {
      const serverCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
      const clientCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];

      const result = compareCollections(serverCards, clientCards);
      expect(result.hasConflicts).toBe(false);
      expect(result.inSync).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should identify quantity conflicts', () => {
      const serverCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
      const clientCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 5 }];

      const result = compareCollections(serverCards, clientCards);
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].serverQuantity).toBe(2);
      expect(result.conflicts[0].clientQuantity).toBe(5);
    });

    it('should identify cards only on server', () => {
      const serverCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
      const clientCards: CollectionCard[] = [];

      const result = compareCollections(serverCards, clientCards);
      expect(result.hasConflicts).toBe(true);
      expect(result.onlyOnServer).toHaveLength(1);
      expect(result.onlyOnClient).toHaveLength(0);
    });

    it('should identify cards only on client', () => {
      const serverCards: CollectionCard[] = [];
      const clientCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];

      const result = compareCollections(serverCards, clientCards);
      expect(result.hasConflicts).toBe(true);
      expect(result.onlyOnClient).toHaveLength(1);
      expect(result.onlyOnServer).toHaveLength(0);
    });

    it('should handle complex mixed scenarios', () => {
      const serverCards: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'normal', quantity: 1 },
        { cardId: 'sv1-3', variant: 'holofoil', quantity: 3 },
      ];
      const clientCards: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'normal', quantity: 5 },
        { cardId: 'sv1-4', variant: 'normal', quantity: 1 },
      ];

      const result = compareCollections(serverCards, clientCards);
      expect(result.hasConflicts).toBe(true);
      expect(result.inSync).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.onlyOnServer).toHaveLength(1);
      expect(result.onlyOnClient).toHaveLength(1);
      expect(result.summary.totalServerCards).toBe(3);
      expect(result.summary.totalClientCards).toBe(3);
    });
  });

  describe('compareCard', () => {
    it('should identify in-sync cards', () => {
      const result = compareCard('sv1-1', 'normal', 5, 5);
      expect(result.status).toBe('in_sync');
    });

    it('should identify conflicts', () => {
      const result = compareCard('sv1-1', 'normal', 5, 3);
      expect(result.status).toBe('conflict');
    });

    it('should identify only_server', () => {
      const result = compareCard('sv1-1', 'normal', 5, null);
      expect(result.status).toBe('only_server');
    });

    it('should identify only_client', () => {
      const result = compareCard('sv1-1', 'normal', null, 5);
      expect(result.status).toBe('only_client');
    });

    it('should handle both null as in_sync', () => {
      const result = compareCard('sv1-1', 'normal', null, null);
      expect(result.status).toBe('in_sync');
    });
  });
});

// ============================================================================
// CONFLICT RESOLUTION FUNCTIONS TESTS
// ============================================================================

describe('conflict resolution functions', () => {
  describe('resolveQuantityConflict', () => {
    it('should use client quantity for last_write_wins', () => {
      expect(resolveQuantityConflict(5, 10, null, 'last_write_wins')).toBe(10);
    });

    it('should use client quantity for client_wins', () => {
      expect(resolveQuantityConflict(5, 10, null, 'client_wins')).toBe(10);
    });

    it('should use server quantity for server_wins', () => {
      expect(resolveQuantityConflict(5, 10, null, 'server_wins')).toBe(5);
    });

    it('should use higher quantity for keep_higher', () => {
      expect(resolveQuantityConflict(5, 10, null, 'keep_higher')).toBe(10);
      expect(resolveQuantityConflict(15, 10, null, 'keep_higher')).toBe(15);
    });

    it('should merge changes for merge_add with expected state', () => {
      // Expected: 5, Server became: 8 (+3), Client became: 7 (+2)
      // Result: 5 + 3 + 2 = 10
      expect(resolveQuantityConflict(8, 7, 5, 'merge_add')).toBe(10);
    });

    it('should use max for merge_add without expected state', () => {
      expect(resolveQuantityConflict(5, 10, null, 'merge_add')).toBe(10);
    });

    it('should not go below zero for merge_add', () => {
      // Expected: 10, Server: 3 (-7), Client: 2 (-8)
      // Result: max(0, 10 - 7 - 8) = max(0, -5) = 0
      expect(resolveQuantityConflict(3, 2, 10, 'merge_add')).toBe(0);
    });
  });

  describe('resolveCardConflict', () => {
    it('should return correct resolution structure', () => {
      const result = resolveCardConflict('sv1-1', 'normal', 5, 10, null, 'keep_higher');
      expect(result.cardId).toBe('sv1-1');
      expect(result.variant).toBe('normal');
      expect(result.resolvedQuantity).toBe(10);
      expect(result.strategy).toBe('keep_higher');
      expect(result.serverQuantity).toBe(5);
      expect(result.clientQuantity).toBe(10);
      expect(result.conflictType).toBe('quantity_mismatch');
    });
  });

  describe('resolveMissingCardConflict', () => {
    it('should keep server card when server_wins', () => {
      const result = resolveMissingCardConflict('sv1-1', 'normal', 5, 'server', 'server_wins');
      expect(result.resolvedQuantity).toBe(5);
      expect(result.conflictType).toBe('missing_on_client');
    });

    it('should remove server card when client_wins', () => {
      const result = resolveMissingCardConflict('sv1-1', 'normal', 5, 'server', 'client_wins');
      expect(result.resolvedQuantity).toBe(0);
    });

    it('should keep client card when client_wins', () => {
      const result = resolveMissingCardConflict('sv1-1', 'normal', 5, 'client', 'client_wins');
      expect(result.resolvedQuantity).toBe(5);
      expect(result.conflictType).toBe('missing_on_server');
    });

    it('should remove client card when server_wins', () => {
      const result = resolveMissingCardConflict('sv1-1', 'normal', 5, 'client', 'server_wins');
      expect(result.resolvedQuantity).toBe(0);
    });

    it('should keep card for keep_higher regardless of where it exists', () => {
      const serverResult = resolveMissingCardConflict(
        'sv1-1',
        'normal',
        5,
        'server',
        'keep_higher'
      );
      expect(serverResult.resolvedQuantity).toBe(5);

      const clientResult = resolveMissingCardConflict(
        'sv1-1',
        'normal',
        5,
        'client',
        'keep_higher'
      );
      expect(clientResult.resolvedQuantity).toBe(5);
    });
  });

  describe('resolveAllConflicts', () => {
    it('should resolve all types of conflicts', () => {
      const comparison: CollectionComparison = {
        hasConflicts: true,
        inSync: [],
        conflicts: [
          {
            cardId: 'sv1-1',
            variant: 'normal',
            serverQuantity: 2,
            clientQuantity: 5,
          },
        ],
        onlyOnServer: [{ cardId: 'sv1-2', variant: 'normal', quantity: 3 }],
        onlyOnClient: [{ cardId: 'sv1-3', variant: 'holofoil', quantity: 1 }],
        summary: {
          totalServerCards: 2,
          totalClientCards: 2,
          inSyncCount: 0,
          conflictCount: 1,
          onlyOnServerCount: 1,
          onlyOnClientCount: 1,
        },
      };

      const resolutions = resolveAllConflicts(comparison, 'client_wins');
      expect(resolutions).toHaveLength(3);

      // Quantity conflict: client wins
      const quantityResolution = resolutions.find((r) => r.cardId === 'sv1-1');
      expect(quantityResolution?.resolvedQuantity).toBe(5);

      // Server only: client wins removes it
      const serverOnlyResolution = resolutions.find((r) => r.cardId === 'sv1-2');
      expect(serverOnlyResolution?.resolvedQuantity).toBe(0);

      // Client only: client wins keeps it
      const clientOnlyResolution = resolutions.find((r) => r.cardId === 'sv1-3');
      expect(clientOnlyResolution?.resolvedQuantity).toBe(1);
    });
  });

  describe('applyResolutions', () => {
    it('should combine in-sync cards with resolved conflicts', () => {
      const inSyncCards: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
      const resolutions: ConflictResolution[] = [
        {
          cardId: 'sv1-2',
          variant: 'holofoil',
          resolvedQuantity: 3,
          strategy: 'keep_higher',
          serverQuantity: 1,
          clientQuantity: 3,
          conflictType: 'quantity_mismatch',
        },
      ];

      const result = applyResolutions(inSyncCards, resolutions);
      expect(result).toHaveLength(2);
      expect(result.find((c) => c.cardId === 'sv1-1')).toBeDefined();
      expect(result.find((c) => c.cardId === 'sv1-2')?.quantity).toBe(3);
    });

    it('should filter out zero quantity resolutions', () => {
      const resolutions: ConflictResolution[] = [
        {
          cardId: 'sv1-1',
          variant: 'normal',
          resolvedQuantity: 0,
          strategy: 'server_wins',
          serverQuantity: 0,
          clientQuantity: 5,
          conflictType: 'missing_on_server',
        },
      ];

      const result = applyResolutions([], resolutions);
      expect(result).toHaveLength(0);
    });
  });
});

// ============================================================================
// SYNC STATUS FUNCTIONS TESTS
// ============================================================================

describe('sync status functions', () => {
  describe('determineSyncStatus', () => {
    it('should return syncing when isSyncing is true', () => {
      const status = determineSyncStatus(null, [], true);
      expect(status.state).toBe('syncing');
    });

    it('should return error when comparison is null', () => {
      const status = determineSyncStatus(null, [], false);
      expect(status.state).toBe('error');
    });

    it('should return needs_sync when there are conflicts', () => {
      const comparison: CollectionComparison = {
        hasConflicts: true,
        inSync: [],
        conflicts: [
          {
            cardId: 'sv1-1',
            variant: 'normal',
            serverQuantity: 1,
            clientQuantity: 2,
          },
        ],
        onlyOnServer: [],
        onlyOnClient: [],
        summary: {
          totalServerCards: 1,
          totalClientCards: 1,
          inSyncCount: 0,
          conflictCount: 1,
          onlyOnServerCount: 0,
          onlyOnClientCount: 0,
        },
      };
      const status = determineSyncStatus(comparison, [], false);
      expect(status.state).toBe('needs_sync');
      expect(status.conflictCount).toBe(1);
    });

    it('should return needs_sync when there are pending changes', () => {
      const comparison: CollectionComparison = {
        hasConflicts: false,
        inSync: [],
        conflicts: [],
        onlyOnServer: [],
        onlyOnClient: [],
        summary: {
          totalServerCards: 0,
          totalClientCards: 0,
          inSyncCount: 0,
          conflictCount: 0,
          onlyOnServerCount: 0,
          onlyOnClientCount: 0,
        },
      };
      const pendingChanges: PendingChange[] = [
        {
          id: 'test',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 1,
          expectedServerQuantity: null,
          timestamp: Date.now(),
          deviceId: 'device1',
        },
      ];
      const status = determineSyncStatus(comparison, pendingChanges, false);
      expect(status.state).toBe('needs_sync');
      expect(status.pendingChanges).toBe(1);
    });

    it('should return synced when everything is in sync', () => {
      const comparison: CollectionComparison = {
        hasConflicts: false,
        inSync: [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }],
        conflicts: [],
        onlyOnServer: [],
        onlyOnClient: [],
        summary: {
          totalServerCards: 1,
          totalClientCards: 1,
          inSyncCount: 1,
          conflictCount: 0,
          onlyOnServerCount: 0,
          onlyOnClientCount: 0,
        },
      };
      const status = determineSyncStatus(comparison, [], false);
      expect(status.state).toBe('synced');
    });
  });

  describe('getSyncStatusMessage', () => {
    it('should return appropriate messages', () => {
      expect(
        getSyncStatusMessage({
          state: 'synced',
          lastSyncTimestamp: Date.now(),
          pendingChanges: 0,
          conflictCount: 0,
        })
      ).toBe('All changes synced');

      expect(
        getSyncStatusMessage({
          state: 'syncing',
          lastSyncTimestamp: null,
          pendingChanges: 5,
          conflictCount: 0,
        })
      ).toBe('Syncing 5 changes...');

      expect(
        getSyncStatusMessage({
          state: 'needs_sync',
          lastSyncTimestamp: null,
          pendingChanges: 3,
          conflictCount: 2,
        })
      ).toBe('2 conflicts need resolution');

      expect(
        getSyncStatusMessage({
          state: 'needs_sync',
          lastSyncTimestamp: null,
          pendingChanges: 3,
          conflictCount: 0,
        })
      ).toBe('3 changes to sync');

      expect(
        getSyncStatusMessage({
          state: 'error',
          lastSyncTimestamp: null,
          pendingChanges: 0,
          conflictCount: 0,
        })
      ).toBe('Sync error - tap to retry');
    });
  });
});

// ============================================================================
// PENDING CHANGES FUNCTIONS TESTS
// ============================================================================

describe('pending changes functions', () => {
  describe('generateChangeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateChangeId();
      const id2 = generateChangeId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^change_\d+_[a-z0-9]+$/);
    });
  });

  describe('createPendingChange', () => {
    it('should create a valid pending change', () => {
      const change = createPendingChange('sv1-1', 'normal', 'add', 2, null, 'device1');
      expect(change.cardId).toBe('sv1-1');
      expect(change.variant).toBe('normal');
      expect(change.action).toBe('add');
      expect(change.quantity).toBe(2);
      expect(change.expectedServerQuantity).toBeNull();
      expect(change.deviceId).toBe('device1');
      expect(change.timestamp).toBeLessThanOrEqual(Date.now());
      expect(change.id).toMatch(/^change_/);
    });
  });

  describe('mergePendingChanges', () => {
    it('should merge changes for the same card', () => {
      const changes: PendingChange[] = [
        {
          id: 'c1',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 2,
          expectedServerQuantity: null,
          timestamp: 1000,
          deviceId: 'device1',
        },
        {
          id: 'c2',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 3,
          expectedServerQuantity: null,
          timestamp: 2000,
          deviceId: 'device1',
        },
      ];

      const merged = mergePendingChanges(changes);
      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(5);
      expect(merged[0].timestamp).toBe(2000);
    });

    it('should not merge different cards', () => {
      const changes: PendingChange[] = [
        {
          id: 'c1',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 2,
          expectedServerQuantity: null,
          timestamp: 1000,
          deviceId: 'device1',
        },
        {
          id: 'c2',
          cardId: 'sv1-2',
          variant: 'normal',
          action: 'add',
          quantity: 3,
          expectedServerQuantity: null,
          timestamp: 2000,
          deviceId: 'device1',
        },
      ];

      const merged = mergePendingChanges(changes);
      expect(merged).toHaveLength(2);
    });

    it('should not merge different variants of the same card', () => {
      const changes: PendingChange[] = [
        {
          id: 'c1',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 2,
          expectedServerQuantity: null,
          timestamp: 1000,
          deviceId: 'device1',
        },
        {
          id: 'c2',
          cardId: 'sv1-1',
          variant: 'holofoil',
          action: 'add',
          quantity: 3,
          expectedServerQuantity: null,
          timestamp: 2000,
          deviceId: 'device1',
        },
      ];

      const merged = mergePendingChanges(changes);
      expect(merged).toHaveLength(2);
    });

    it('should use latest quantity for update actions', () => {
      const changes: PendingChange[] = [
        {
          id: 'c1',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 2,
          expectedServerQuantity: null,
          timestamp: 1000,
          deviceId: 'device1',
        },
        {
          id: 'c2',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'update',
          quantity: 5,
          expectedServerQuantity: null,
          timestamp: 2000,
          deviceId: 'device1',
        },
      ];

      const merged = mergePendingChanges(changes);
      expect(merged).toHaveLength(1);
      expect(merged[0].action).toBe('update');
      expect(merged[0].quantity).toBe(5);
    });
  });

  describe('sortPendingChanges', () => {
    it('should sort by timestamp ascending', () => {
      const changes: PendingChange[] = [
        {
          id: 'c2',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 1,
          expectedServerQuantity: null,
          timestamp: 2000,
          deviceId: 'd1',
        },
        {
          id: 'c1',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 1,
          expectedServerQuantity: null,
          timestamp: 1000,
          deviceId: 'd1',
        },
        {
          id: 'c3',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 1,
          expectedServerQuantity: null,
          timestamp: 3000,
          deviceId: 'd1',
        },
      ];

      const sorted = sortPendingChanges(changes);
      expect(sorted[0].timestamp).toBe(1000);
      expect(sorted[1].timestamp).toBe(2000);
      expect(sorted[2].timestamp).toBe(3000);
    });

    it('should not mutate original array', () => {
      const changes: PendingChange[] = [
        {
          id: 'c2',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 1,
          expectedServerQuantity: null,
          timestamp: 2000,
          deviceId: 'd1',
        },
        {
          id: 'c1',
          cardId: 'sv1-1',
          variant: 'normal',
          action: 'add',
          quantity: 1,
          expectedServerQuantity: null,
          timestamp: 1000,
          deviceId: 'd1',
        },
      ];

      const sorted = sortPendingChanges(changes);
      expect(changes[0].id).toBe('c2');
      expect(sorted[0].id).toBe('c1');
    });
  });
});

// ============================================================================
// CHECKSUM FUNCTIONS TESTS
// ============================================================================

describe('checksum functions', () => {
  describe('calculateChecksum', () => {
    it('should return same checksum for same cards', () => {
      const cards1: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
      ];
      const cards2: CollectionCard[] = [
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
      ];

      expect(calculateChecksum(cards1)).toBe(calculateChecksum(cards2));
    });

    it('should return different checksum for different quantities', () => {
      const cards1: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }];
      const cards2: CollectionCard[] = [{ cardId: 'sv1-1', variant: 'normal', quantity: 3 }];

      expect(calculateChecksum(cards1)).not.toBe(calculateChecksum(cards2));
    });

    it('should return 0 for empty collection', () => {
      expect(calculateChecksum([])).toBe(0);
    });
  });

  describe('checksumsMatch', () => {
    it('should return true for matching checksums', () => {
      expect(checksumsMatch(12345, 12345)).toBe(true);
    });

    it('should return false for different checksums', () => {
      expect(checksumsMatch(12345, 54321)).toBe(false);
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('display helpers', () => {
  describe('getStrategyDisplayName', () => {
    it('should return display names', () => {
      expect(getStrategyDisplayName('last_write_wins')).toBe('Most Recent Wins');
      expect(getStrategyDisplayName('keep_higher')).toBe('Keep Higher Quantity');
    });
  });

  describe('getStrategyDescription', () => {
    it('should return descriptions', () => {
      expect(getStrategyDescription('last_write_wins')).toContain('recent');
      expect(getStrategyDescription('keep_higher')).toContain('higher');
    });
  });

  describe('formatConflictForDisplay', () => {
    it('should format a CardComparison', () => {
      const comparison = compareCard('sv1-1', 'normal', 5, 3);
      const formatted = formatConflictForDisplay(comparison);
      expect(formatted).toContain('sv1-1');
      expect(formatted).toContain('Server=5');
      expect(formatted).toContain('Local=3');
    });

    it('should format a ConflictResolution', () => {
      const resolution: ConflictResolution = {
        cardId: 'sv1-1',
        variant: 'normal',
        resolvedQuantity: 5,
        strategy: 'keep_higher',
        serverQuantity: 3,
        clientQuantity: 5,
        conflictType: 'quantity_mismatch',
      };
      const formatted = formatConflictForDisplay(resolution);
      expect(formatted).toContain('sv1-1');
      expect(formatted).toContain('→ 5');
    });
  });

  describe('getComparisonSummary', () => {
    it('should return summary for in-sync collection', () => {
      const comparison: CollectionComparison = {
        hasConflicts: false,
        inSync: [{ cardId: 'sv1-1', variant: 'normal', quantity: 2 }],
        conflicts: [],
        onlyOnServer: [],
        onlyOnClient: [],
        summary: {
          totalServerCards: 1,
          totalClientCards: 1,
          inSyncCount: 1,
          conflictCount: 0,
          onlyOnServerCount: 0,
          onlyOnClientCount: 0,
        },
      };
      expect(getComparisonSummary(comparison)).toBe('All 1 cards in sync');
    });

    it('should return summary for collection with conflicts', () => {
      const comparison: CollectionComparison = {
        hasConflicts: true,
        inSync: [],
        conflicts: [{ cardId: 'sv1-1', variant: 'normal', serverQuantity: 1, clientQuantity: 2 }],
        onlyOnServer: [{ cardId: 'sv1-2', variant: 'normal', quantity: 1 }],
        onlyOnClient: [],
        summary: {
          totalServerCards: 2,
          totalClientCards: 1,
          inSyncCount: 0,
          conflictCount: 1,
          onlyOnServerCount: 1,
          onlyOnClientCount: 0,
        },
      };
      const summary = getComparisonSummary(comparison);
      expect(summary).toContain('1 quantity conflicts');
      expect(summary).toContain('1 only on server');
    });
  });

  describe('getRecommendedStrategy', () => {
    it('should recommend merge_add for quantity-only conflicts', () => {
      const comparison: CollectionComparison = {
        hasConflicts: true,
        inSync: [],
        conflicts: [{ cardId: 'sv1-1', variant: 'normal', serverQuantity: 1, clientQuantity: 2 }],
        onlyOnServer: [],
        onlyOnClient: [],
        summary: {
          totalServerCards: 1,
          totalClientCards: 1,
          inSyncCount: 0,
          conflictCount: 1,
          onlyOnServerCount: 0,
          onlyOnClientCount: 0,
        },
      };
      expect(getRecommendedStrategy(comparison)).toBe('merge_add');
    });

    it('should recommend keep_higher when cards are on different sides', () => {
      const comparison: CollectionComparison = {
        hasConflicts: true,
        inSync: [],
        conflicts: [],
        onlyOnServer: [{ cardId: 'sv1-1', variant: 'normal', quantity: 1 }],
        onlyOnClient: [],
        summary: {
          totalServerCards: 1,
          totalClientCards: 0,
          inSyncCount: 0,
          conflictCount: 0,
          onlyOnServerCount: 1,
          onlyOnClientCount: 0,
        },
      };
      expect(getRecommendedStrategy(comparison)).toBe('keep_higher');
    });

    it('should recommend last_write_wins as default', () => {
      const comparison: CollectionComparison = {
        hasConflicts: false,
        inSync: [{ cardId: 'sv1-1', variant: 'normal', quantity: 1 }],
        conflicts: [],
        onlyOnServer: [],
        onlyOnClient: [],
        summary: {
          totalServerCards: 1,
          totalClientCards: 1,
          inSyncCount: 1,
          conflictCount: 0,
          onlyOnServerCount: 0,
          onlyOnClientCount: 0,
        },
      };
      expect(getRecommendedStrategy(comparison)).toBe('last_write_wins');
    });
  });

  describe('formatTimeSince', () => {
    it('should format "just now"', () => {
      expect(formatTimeSince(Date.now())).toBe('just now');
    });

    it('should format minutes', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(formatTimeSince(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should format hours', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      expect(formatTimeSince(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should format days', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      expect(formatTimeSince(threeDaysAgo)).toBe('3 days ago');
    });

    it('should handle singular forms', () => {
      const oneMinuteAgo = Date.now() - 60 * 1000;
      expect(formatTimeSince(oneMinuteAgo)).toBe('1 minute ago');

      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      expect(formatTimeSince(oneHourAgo)).toBe('1 hour ago');

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      expect(formatTimeSince(oneDayAgo)).toBe('1 day ago');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('integration scenarios', () => {
  describe('Offline device adds cards, comes back online', () => {
    it('should merge offline additions with server state', () => {
      // Server state before device went offline
      const serverBefore: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 2 },
        { cardId: 'sv1-2', variant: 'normal', quantity: 1 },
      ];

      // Device adds cards offline (starting from serverBefore state)
      const clientAfterOffline: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 4 }, // +2
        { cardId: 'sv1-2', variant: 'normal', quantity: 1 }, // unchanged
        { cardId: 'sv1-3', variant: 'normal', quantity: 1 }, // new card
      ];

      // Meanwhile, server also changed (another device added cards)
      const serverNow: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 3 }, // +1
        { cardId: 'sv1-2', variant: 'normal', quantity: 2 }, // +1
      ];

      // Compare
      const comparison = compareCollections(serverNow, clientAfterOffline);
      expect(comparison.hasConflicts).toBe(true);
      expect(comparison.conflicts).toHaveLength(2); // sv1-1 and sv1-2
      expect(comparison.onlyOnClient).toHaveLength(1); // sv1-3

      // Resolve with merge_add (keeping both changes)
      const resolutions = resolveAllConflicts(comparison, 'keep_higher');

      // sv1-1: server=3, client=4 -> keep_higher = 4
      const sv1_1 = resolutions.find((r) => r.cardId === 'sv1-1');
      expect(sv1_1?.resolvedQuantity).toBe(4);

      // sv1-2: server=2, client=1 -> keep_higher = 2
      const sv1_2 = resolutions.find((r) => r.cardId === 'sv1-2');
      expect(sv1_2?.resolvedQuantity).toBe(2);

      // sv1-3: only on client -> keep_higher keeps it = 1
      const sv1_3 = resolutions.find((r) => r.cardId === 'sv1-3');
      expect(sv1_3?.resolvedQuantity).toBe(1);
    });
  });

  describe('Two devices add the same card simultaneously', () => {
    it('should use merge_add to combine both additions', () => {
      // Original state: sv1-1 had 2
      const expectedServerQuantity = 2;

      // Device A adds 3 -> sees 5
      const deviceAQuantity = 5;

      // Device B adds 2 -> sees 4
      const deviceBQuantity = 4;

      // Server was updated by Device A first -> now has 5
      const serverQuantity = 5;

      // Device B tries to sync with merge_add
      // Expected: 2, Server: 5 (+3), DeviceB: 4 (+2)
      // Result: 2 + 3 + 2 = 7
      const resolved = resolveQuantityConflict(
        serverQuantity,
        deviceBQuantity,
        expectedServerQuantity,
        'merge_add'
      );
      expect(resolved).toBe(7);
    });
  });

  describe('Full sync flow', () => {
    it('should correctly determine and resolve all conflicts', () => {
      const serverCards: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 5 },
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 1 },
        { cardId: 'sv1-3', variant: 'normal', quantity: 3 },
      ];

      const clientCards: CollectionCard[] = [
        { cardId: 'sv1-1', variant: 'normal', quantity: 5 }, // in sync
        { cardId: 'sv1-2', variant: 'holofoil', quantity: 2 }, // conflict
        { cardId: 'sv1-4', variant: 'normal', quantity: 1 }, // new on client
      ];

      // 1. Compare
      const comparison = compareCollections(serverCards, clientCards);
      expect(comparison.summary.inSyncCount).toBe(1);
      expect(comparison.summary.conflictCount).toBe(1);
      expect(comparison.summary.onlyOnServerCount).toBe(1);
      expect(comparison.summary.onlyOnClientCount).toBe(1);

      // 2. Determine status
      const status = determineSyncStatus(comparison, [], false);
      expect(status.state).toBe('needs_sync');

      // 3. Get recommended strategy
      const strategy = getRecommendedStrategy(comparison);
      expect(strategy).toBe('keep_higher'); // Because of onlyOn cards

      // 4. Resolve all
      const resolutions = resolveAllConflicts(comparison, strategy);
      expect(resolutions).toHaveLength(3);

      // 5. Apply resolutions
      const finalCollection = applyResolutions(comparison.inSync, resolutions);
      expect(finalCollection).toHaveLength(4);

      // Verify final state
      const sv1_1 = finalCollection.find((c) => c.cardId === 'sv1-1' && c.variant === 'normal');
      expect(sv1_1?.quantity).toBe(5);

      const sv1_2 = finalCollection.find((c) => c.cardId === 'sv1-2' && c.variant === 'holofoil');
      expect(sv1_2?.quantity).toBe(2); // keep_higher

      const sv1_3 = finalCollection.find((c) => c.cardId === 'sv1-3' && c.variant === 'normal');
      expect(sv1_3?.quantity).toBe(3); // kept from server

      const sv1_4 = finalCollection.find((c) => c.cardId === 'sv1-4' && c.variant === 'normal');
      expect(sv1_4?.quantity).toBe(1); // kept from client

      // 6. Calculate final checksum
      const checksum = calculateChecksum(finalCollection);
      expect(typeof checksum).toBe('number');
    });
  });
});
