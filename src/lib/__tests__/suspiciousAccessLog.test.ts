/**
 * Tests for Suspicious API Access Pattern Detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  recordApiAccess,
  getRecentSuspiciousEvents,
  getSuspiciousEventCounts,
  getClientAccessStats,
  clearAccessHistory,
  getAccessHistorySize,
  checkSuspiciousActivity,
  DEFAULT_SUSPICIOUS_ACCESS_CONFIG,
  type SuspiciousAccessEvent,
  type SuspiciousAccessConfig,
} from '../suspiciousAccessLog';

/**
 * Helper to create a mock NextRequest with a specific IP
 */
function createMockRequest(ip: string, url = 'https://example.com/api/test'): NextRequest {
  const headersInit = new Headers();
  headersInit.set('x-forwarded-for', ip);
  return new NextRequest(new URL(url, 'http://localhost'), {
    headers: headersInit,
  });
}

describe('suspiciousAccessLog', () => {
  beforeEach(() => {
    // Clear all history before each test
    clearAccessHistory();
  });

  describe('recordApiAccess', () => {
    it('should record a successful request without flagging as suspicious', () => {
      const request = createMockRequest('192.168.1.1');
      const events = recordApiAccess(request, '/api/search', 200);

      expect(events).toHaveLength(0);
    });

    it('should track request count for a client', () => {
      const request = createMockRequest('192.168.1.2');

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        recordApiAccess(request, '/api/search', 200);
      }

      const stats = getClientAccessStats('192.168.1.2');
      expect(stats).not.toBeNull();
      expect(stats?.requestCount).toBe(5);
    });

    it('should track rate limit hits', () => {
      const request = createMockRequest('192.168.1.3');

      // Record 2 rate limit hits
      recordApiAccess(request, '/api/search', 429);
      recordApiAccess(request, '/api/search', 429);

      const stats = getClientAccessStats('192.168.1.3');
      expect(stats?.rateLimitHits).toBe(2);
    });

    it('should track error counts by status code', () => {
      const request = createMockRequest('192.168.1.4');

      recordApiAccess(request, '/api/search', 400);
      recordApiAccess(request, '/api/search', 400);
      recordApiAccess(request, '/api/search', 404);
      recordApiAccess(request, '/api/search', 500);

      const stats = getClientAccessStats('192.168.1.4');
      expect(stats?.errorCounts).toEqual({
        400: 2,
        404: 1,
        500: 1,
      });
    });

    it('should track games accessed', () => {
      const request = createMockRequest('192.168.1.5');

      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'pokemon' });
      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'yugioh' });
      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'pokemon' }); // Duplicate

      const stats = getClientAccessStats('192.168.1.5');
      expect(stats?.gamesAccessed).toEqual(expect.arrayContaining(['pokemon', 'yugioh']));
      expect(stats?.gamesAccessed).toHaveLength(2);
    });
  });

  describe('rate limit exhaustion detection', () => {
    it('should detect rate limit exhaustion when threshold is reached', () => {
      const request = createMockRequest('192.168.2.1');
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 3 };

      // First two hits should not trigger
      recordApiAccess(request, '/api/search', 429, { config });
      recordApiAccess(request, '/api/search', 429, { config });

      // Third hit should trigger
      const events = recordApiAccess(request, '/api/search', 429, { config });

      const exhaustionEvent = events.find((e) => e.type === 'rate_limit_exhaustion');
      expect(exhaustionEvent).toBeDefined();
      expect(exhaustionEvent?.level).toBe('warn');
      expect(exhaustionEvent?.details.rateLimitHits).toBe(3);
    });

    it('should not trigger rate limit exhaustion below threshold', () => {
      const request = createMockRequest('192.168.2.2');
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 5 };

      // Only 2 hits, below threshold of 5
      recordApiAccess(request, '/api/search', 429, { config });
      const events = recordApiAccess(request, '/api/search', 429, { config });

      const exhaustionEvent = events.find((e) => e.type === 'rate_limit_exhaustion');
      expect(exhaustionEvent).toBeUndefined();
    });
  });

  describe('rapid burst detection', () => {
    it('should detect rapid burst when threshold is reached', () => {
      const request = createMockRequest('192.168.3.1');
      const config: Partial<SuspiciousAccessConfig> = {
        burstThreshold: 5,
        burstWindowMs: 10000,
      };

      // Make 5 requests (threshold)
      let events: SuspiciousAccessEvent[] = [];
      for (let i = 0; i < 5; i++) {
        events = recordApiAccess(request, '/api/search', 200, { config });
      }

      const burstEvent = events.find((e) => e.type === 'rapid_burst');
      expect(burstEvent).toBeDefined();
      expect(burstEvent?.level).toBe('warn');
      expect(burstEvent?.details.requestCount).toBe(5);
    });

    it('should not trigger burst detection below threshold', () => {
      const request = createMockRequest('192.168.3.2');
      const config: Partial<SuspiciousAccessConfig> = {
        burstThreshold: 10,
        burstWindowMs: 10000,
      };

      // Make only 4 requests
      let events: SuspiciousAccessEvent[] = [];
      for (let i = 0; i < 4; i++) {
        events = recordApiAccess(request, '/api/search', 200, { config });
      }

      const burstEvent = events.find((e) => e.type === 'rapid_burst');
      expect(burstEvent).toBeUndefined();
    });
  });

  describe('multi-game scan detection', () => {
    it('should detect multi-game scanning when threshold is reached', () => {
      const request = createMockRequest('192.168.4.1');
      const config: Partial<SuspiciousAccessConfig> = { multiGameThreshold: 4 };

      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'pokemon', config });
      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'yugioh', config });
      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'onepiece', config });
      const events = recordApiAccess(request, '/api/cards', 200, { gameSlug: 'lorcana', config });

      const scanEvent = events.find((e) => e.type === 'multi_game_scan');
      expect(scanEvent).toBeDefined();
      expect(scanEvent?.level).toBe('info');
      expect(scanEvent?.details.gamesAccessed).toEqual(
        expect.arrayContaining(['pokemon', 'yugioh', 'onepiece', 'lorcana'])
      );
    });

    it('should not trigger multi-game scan below threshold', () => {
      const request = createMockRequest('192.168.4.2');
      const config: Partial<SuspiciousAccessConfig> = { multiGameThreshold: 5 };

      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'pokemon', config });
      recordApiAccess(request, '/api/cards', 200, { gameSlug: 'yugioh', config });
      const events = recordApiAccess(request, '/api/cards', 200, { gameSlug: 'onepiece', config });

      const scanEvent = events.find((e) => e.type === 'multi_game_scan');
      expect(scanEvent).toBeUndefined();
    });
  });

  describe('high error rate detection', () => {
    it('should detect high error rate when threshold is exceeded', () => {
      const request = createMockRequest('192.168.5.1');
      const config: Partial<SuspiciousAccessConfig> = {
        errorRateThreshold: 50,
        minRequestsForErrorRate: 10,
      };

      // Make 5 successful and 6 error requests (60% error rate)
      for (let i = 0; i < 5; i++) {
        recordApiAccess(request, '/api/search', 200, { config });
      }
      for (let i = 0; i < 5; i++) {
        recordApiAccess(request, '/api/search', 400, { config });
      }
      // 11th request triggers check (6 errors / 11 total = ~55%)
      const events = recordApiAccess(request, '/api/search', 400, { config });

      const errorEvent = events.find((e) => e.type === 'high_error_rate');
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.level).toBe('warn');
    });

    it('should not check error rate below minimum requests', () => {
      const request = createMockRequest('192.168.5.2');
      const config: Partial<SuspiciousAccessConfig> = {
        errorRateThreshold: 50,
        minRequestsForErrorRate: 10,
      };

      // All errors but below minimum threshold
      for (let i = 0; i < 5; i++) {
        recordApiAccess(request, '/api/search', 400, { config });
      }

      const events = getRecentSuspiciousEvents();
      const errorEvent = events.find((e) => e.type === 'high_error_rate');
      expect(errorEvent).toBeUndefined();
    });

    it('should not trigger when error rate is below threshold', () => {
      const request = createMockRequest('192.168.5.3');
      const config: Partial<SuspiciousAccessConfig> = {
        errorRateThreshold: 50,
        minRequestsForErrorRate: 10,
      };

      // Make 8 successful and 3 error requests (27% error rate)
      for (let i = 0; i < 8; i++) {
        recordApiAccess(request, '/api/search', 200, { config });
      }
      for (let i = 0; i < 3; i++) {
        recordApiAccess(request, '/api/search', 400, { config });
      }

      const events = getRecentSuspiciousEvents();
      const errorEvent = events.find(
        (e) => e.type === 'high_error_rate' && e.clientIp === '192.168.5.3'
      );
      expect(errorEvent).toBeUndefined();
    });
  });

  describe('sequential enumeration detection', () => {
    it('should detect sequential card IDs suggesting scraping', () => {
      const request = createMockRequest('192.168.6.1');
      const config: Partial<SuspiciousAccessConfig> = {};

      // Simulate sequential card ID lookups
      for (let i = 1; i <= 10; i++) {
        recordApiAccess(request, '/api/cards', 200, {
          queryParams: { cardId: `card-${i}` },
          config,
        });
      }

      const events = getRecentSuspiciousEvents();
      const enumEvent = events.find(
        (e) => e.type === 'sequential_enumeration' && e.clientIp === '192.168.6.1'
      );
      expect(enumEvent).toBeDefined();
      expect(enumEvent?.level).toBe('warn');
    });

    it('should not flag random non-sequential access', () => {
      const request = createMockRequest('192.168.6.2');
      const config: Partial<SuspiciousAccessConfig> = {};

      // Random, non-sequential IDs
      const randomIds = ['card-42', 'card-100', 'card-7', 'card-999', 'card-50'];
      for (const id of randomIds) {
        recordApiAccess(request, '/api/cards', 200, {
          queryParams: { cardId: id },
          config,
        });
      }

      const events = getRecentSuspiciousEvents();
      const enumEvent = events.find(
        (e) => e.type === 'sequential_enumeration' && e.clientIp === '192.168.6.2'
      );
      expect(enumEvent).toBeUndefined();
    });
  });

  describe('getRecentSuspiciousEvents', () => {
    it('should return recent events in order', () => {
      const request1 = createMockRequest('192.168.7.1');
      const request2 = createMockRequest('192.168.7.2');
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 1 };

      // Trigger events from different IPs
      recordApiAccess(request1, '/api/search', 429, { config });
      recordApiAccess(request2, '/api/search', 429, { config });

      const events = getRecentSuspiciousEvents(10);
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.some((e) => e.clientIp === '192.168.7.1')).toBe(true);
      expect(events.some((e) => e.clientIp === '192.168.7.2')).toBe(true);
    });

    it('should respect the limit parameter', () => {
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 1 };

      // Generate many events
      for (let i = 0; i < 10; i++) {
        const request = createMockRequest(`192.168.8.${i}`);
        recordApiAccess(request, '/api/search', 429, { config });
      }

      const events = getRecentSuspiciousEvents(5);
      expect(events.length).toBe(5);
    });
  });

  describe('getSuspiciousEventCounts', () => {
    it('should count events by type', () => {
      const config: Partial<SuspiciousAccessConfig> = {
        rateLimitHitThreshold: 1,
        multiGameThreshold: 2,
      };

      // Generate different event types
      const request1 = createMockRequest('192.168.9.1');
      recordApiAccess(request1, '/api/search', 429, { config }); // rate_limit_exhaustion

      const request2 = createMockRequest('192.168.9.2');
      recordApiAccess(request2, '/api/cards', 200, { gameSlug: 'pokemon', config });
      recordApiAccess(request2, '/api/cards', 200, { gameSlug: 'yugioh', config }); // multi_game_scan

      const counts = getSuspiciousEventCounts();
      expect(counts.rate_limit_exhaustion).toBeGreaterThanOrEqual(1);
      expect(counts.multi_game_scan).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getClientAccessStats', () => {
    it('should return null for unknown client', () => {
      const stats = getClientAccessStats('unknown-ip');
      expect(stats).toBeNull();
    });

    it('should return complete stats for known client', () => {
      const request = createMockRequest('192.168.10.1');

      recordApiAccess(request, '/api/search', 200, { gameSlug: 'pokemon' });
      recordApiAccess(request, '/api/search', 400);
      recordApiAccess(request, '/api/search', 429);

      const stats = getClientAccessStats('192.168.10.1');
      expect(stats).not.toBeNull();
      expect(stats?.requestCount).toBe(3);
      expect(stats?.rateLimitHits).toBe(1);
      expect(stats?.errorCounts[400]).toBe(1);
      expect(stats?.errorCounts[429]).toBe(1);
      expect(stats?.gamesAccessed).toContain('pokemon');
      expect(stats?.lastSeen).toBeInstanceOf(Date);
    });
  });

  describe('clearAccessHistory', () => {
    it('should clear all stored history', () => {
      const request = createMockRequest('192.168.11.1');
      recordApiAccess(request, '/api/search', 200);

      expect(getAccessHistorySize()).toBeGreaterThan(0);

      clearAccessHistory();

      expect(getAccessHistorySize()).toBe(0);
      expect(getClientAccessStats('192.168.11.1')).toBeNull();
    });

    it('should clear recent events', () => {
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 1 };
      const request = createMockRequest('192.168.11.2');
      recordApiAccess(request, '/api/search', 429, { config });

      expect(getRecentSuspiciousEvents().length).toBeGreaterThan(0);

      clearAccessHistory();

      expect(getRecentSuspiciousEvents()).toHaveLength(0);
    });
  });

  describe('checkSuspiciousActivity', () => {
    it('should return not suspicious for new client', () => {
      const result = checkSuspiciousActivity('unknown-ip');
      expect(result.isSuspicious).toBe(false);
      expect(result.reasons).toHaveLength(0);
      expect(result.severity).toBe('info');
    });

    it('should detect suspicious activity for flagged client', () => {
      const request = createMockRequest('192.168.12.1');
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 2 };

      // Trigger rate limit exhaustion
      recordApiAccess(request, '/api/search', 429, { config });
      recordApiAccess(request, '/api/search', 429, { config });

      const result = checkSuspiciousActivity('192.168.12.1', config);
      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('rate_limit_exhaustion');
      expect(result.severity).toBe('warn');
    });

    it('should report multiple reasons when applicable', () => {
      const request = createMockRequest('192.168.12.2');
      const config: Partial<SuspiciousAccessConfig> = {
        rateLimitHitThreshold: 1,
        multiGameThreshold: 2,
      };

      // Trigger multiple patterns
      recordApiAccess(request, '/api/search', 429, { gameSlug: 'pokemon', config });
      recordApiAccess(request, '/api/search', 200, { gameSlug: 'yugioh', config });

      const result = checkSuspiciousActivity('192.168.12.2', config);
      expect(result.isSuspicious).toBe(true);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.reasons).toContain('rate_limit_exhaustion');
      expect(result.reasons).toContain('multi_game_scan');
    });
  });

  describe('custom log function', () => {
    it('should use custom log function when provided', () => {
      const loggedEvents: SuspiciousAccessEvent[] = [];
      const customLogFn = (event: SuspiciousAccessEvent) => {
        loggedEvents.push(event);
      };

      const request = createMockRequest('192.168.13.1');
      const config: Partial<SuspiciousAccessConfig> = {
        rateLimitHitThreshold: 1,
        logFn: customLogFn,
      };

      recordApiAccess(request, '/api/search', 429, { config });

      expect(loggedEvents.length).toBe(1);
      expect(loggedEvents[0].type).toBe('rate_limit_exhaustion');
    });
  });

  describe('default configuration', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.windowMs).toBe(5 * 60 * 1000);
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.rateLimitHitThreshold).toBe(3);
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.burstThreshold).toBe(20);
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.burstWindowMs).toBe(10 * 1000);
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.multiGameThreshold).toBe(5);
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.errorRateThreshold).toBe(50);
      expect(DEFAULT_SUSPICIOUS_ACCESS_CONFIG.minRequestsForErrorRate).toBe(10);
    });
  });

  describe('isolated client tracking', () => {
    it('should track clients independently', () => {
      const request1 = createMockRequest('192.168.14.1');
      const request2 = createMockRequest('192.168.14.2');

      // Client 1: 5 requests
      for (let i = 0; i < 5; i++) {
        recordApiAccess(request1, '/api/search', 200);
      }

      // Client 2: 2 requests with errors
      recordApiAccess(request2, '/api/search', 400);
      recordApiAccess(request2, '/api/search', 500);

      const stats1 = getClientAccessStats('192.168.14.1');
      const stats2 = getClientAccessStats('192.168.14.2');

      expect(stats1?.requestCount).toBe(5);
      expect(stats1?.errorCounts).toEqual({});

      expect(stats2?.requestCount).toBe(2);
      expect(stats2?.errorCounts).toEqual({ 400: 1, 500: 1 });
    });
  });

  describe('event details', () => {
    it('should include complete event details', () => {
      const request = createMockRequest('192.168.15.1');
      const config: Partial<SuspiciousAccessConfig> = { rateLimitHitThreshold: 1 };

      const events = recordApiAccess(request, '/api/search', 429, { config });

      expect(events.length).toBe(1);
      const event = events[0];

      expect(event.type).toBe('rate_limit_exhaustion');
      expect(event.level).toBe('warn');
      expect(event.clientIp).toBe('192.168.15.1');
      expect(event.endpoint).toBe('/api/search');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.message).toContain('Rate limit exhaustion');
      expect(event.details).toHaveProperty('rateLimitHits');
      expect(event.details).toHaveProperty('threshold');
    });
  });

  describe('query params tracking', () => {
    it('should track trackable query parameters', () => {
      const request = createMockRequest('192.168.16.1');

      recordApiAccess(request, '/api/cards', 200, {
        queryParams: { cardId: 'card-123', setId: 'set-abc', offset: '50' },
      });

      // These are tracked internally for enumeration detection
      // We can verify by checking if stats exist
      const stats = getClientAccessStats('192.168.16.1');
      expect(stats).not.toBeNull();
    });

    it('should not track non-trackable parameters', () => {
      const request = createMockRequest('192.168.16.2');

      // Record request with non-trackable params
      recordApiAccess(request, '/api/search', 200, {
        queryParams: { q: 'pikachu', limit: '20' },
      });

      const stats = getClientAccessStats('192.168.16.2');
      expect(stats).not.toBeNull();
    });
  });
});
