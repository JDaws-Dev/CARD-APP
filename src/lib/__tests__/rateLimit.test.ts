import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  clearRateLimitStore,
  getRateLimitStoreSize,
  getRateLimitInfo,
  getClientIp,
  withRateLimit,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
} from '../rateLimit';

/**
 * Create a mock NextRequest with optional IP headers
 */
function createMockRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  const headersInit = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    headersInit.set(key, value);
  }
  return new NextRequest(new URL(url, 'http://localhost'), {
    headers: headersInit,
  });
}

describe('Rate Limiting Utility', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test
    clearRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.100, 10.0.0.1',
      });
      expect(getClientIp(request)).toBe('192.168.1.100');
    });

    it('extracts IP from x-forwarded-for header with single IP', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '203.0.113.50',
      });
      expect(getClientIp(request)).toBe('203.0.113.50');
    });

    it('extracts IP from x-real-ip header', () => {
      const request = createMockRequest('/api/test', {
        'x-real-ip': '172.16.0.1',
      });
      expect(getClientIp(request)).toBe('172.16.0.1');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '172.16.0.1',
      });
      expect(getClientIp(request)).toBe('192.168.1.100');
    });

    it('extracts IP from x-vercel-forwarded-for header', () => {
      const request = createMockRequest('/api/test', {
        'x-vercel-forwarded-for': '198.51.100.42',
      });
      expect(getClientIp(request)).toBe('198.51.100.42');
    });

    it('returns "unknown" when no IP headers present', () => {
      const request = createMockRequest('/api/test');
      expect(getClientIp(request)).toBe('unknown');
    });

    it('trims whitespace from IP addresses', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '  192.168.1.100  , 10.0.0.1',
      });
      expect(getClientIp(request)).toBe('192.168.1.100');
    });
  });

  describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = {
      limit: 3,
      windowMs: 60000, // 1 minute
    };

    it('allows first request', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.1',
      });
      const result = checkRateLimit(request, testConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(3);
    });

    it('allows requests up to the limit', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.2',
      });

      const result1 = checkRateLimit(request, testConfig);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit(request, testConfig);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit(request, testConfig);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('blocks requests over the limit', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.3',
      });

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request, testConfig);
      }

      // Fourth request should be blocked
      const result = checkRateLimit(request, testConfig);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('tracks different IPs separately', () => {
      const request1 = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.10',
      });
      const request2 = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.20',
      });

      // Use up limit for first IP
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request1, testConfig);
      }

      // Second IP should still be allowed
      const result = checkRateLimit(request2, testConfig);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('resets after window expires', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.4',
      });

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request, testConfig);
      }

      // Verify blocked
      expect(checkRateLimit(request, testConfig).allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(61000);

      // Should be allowed again
      const result = checkRateLimit(request, testConfig);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('uses custom key generator when provided', () => {
      const config: RateLimitConfig = {
        ...testConfig,
        keyGenerator: (req) => {
          const url = new URL(req.url);
          return url.searchParams.get('userId') || 'anonymous';
        },
      };

      const request1 = createMockRequest('/api/test?userId=user1');
      const request2 = createMockRequest('/api/test?userId=user2');

      // Use up limit for user1
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request1, config);
      }

      // user1 should be blocked
      expect(checkRateLimit(request1, config).allowed).toBe(false);

      // user2 should still be allowed
      expect(checkRateLimit(request2, config).allowed).toBe(true);
    });

    it('calculates retryAfter correctly', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.5',
      });

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request, testConfig);
      }

      const result = checkRateLimit(request, testConfig);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });

    it('provides correct resetTime', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.6',
      });

      const result = checkRateLimit(request, testConfig);

      // Reset time should be within the window
      expect(result.resetTime).toBeGreaterThan(now);
      expect(result.resetTime).toBeLessThanOrEqual(now + testConfig.windowMs);
    });
  });

  describe('createRateLimitResponse', () => {
    it('creates a 429 response', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        limit: 30,
        retryAfter: 45,
      };

      const response = createRateLimitResponse(result);

      expect(response.status).toBe(429);
    });

    it('includes error message in response body', async () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        limit: 30,
        retryAfter: 45,
      };

      const response = createRateLimitResponse(result);
      const data = await response.json();

      expect(data.error).toBe('Too many requests');
      expect(data.message).toContain('45 seconds');
      expect(data.retryAfter).toBe(45);
    });

    it('includes rate limit headers by default', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        limit: 30,
        retryAfter: 45,
      };

      const response = createRateLimitResponse(result);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('30');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('skips headers when includeHeaders is false', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        limit: 30,
        retryAfter: 45,
      };

      const response = createRateLimitResponse(result, false);

      expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
    });
  });

  describe('addRateLimitHeaders', () => {
    it('adds all rate limit headers to response', () => {
      const response = NextResponse.json({ success: true });
      const result = {
        allowed: true,
        remaining: 25,
        resetTime: Math.floor(Date.now() / 1000) * 1000 + 60000,
        limit: 30,
        retryAfter: 60,
      };

      addRateLimitHeaders(response, result);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('30');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('25');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('does not add Retry-After header for allowed requests', () => {
      const response = NextResponse.json({ success: true });
      const result = {
        allowed: true,
        remaining: 25,
        resetTime: Date.now() + 60000,
        limit: 30,
        retryAfter: 60,
      };

      addRateLimitHeaders(response, result);

      expect(response.headers.get('Retry-After')).toBeNull();
    });

    it('adds Retry-After header for blocked requests', () => {
      const response = NextResponse.json({ error: 'blocked' });
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        limit: 30,
        retryAfter: 45,
      };

      addRateLimitHeaders(response, result);

      expect(response.headers.get('Retry-After')).toBe('45');
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('has search config with appropriate limits', () => {
      expect(RATE_LIMIT_CONFIGS.search.limit).toBe(30);
      expect(RATE_LIMIT_CONFIGS.search.windowMs).toBe(60000);
    });

    it('has filter config with appropriate limits', () => {
      expect(RATE_LIMIT_CONFIGS.filter.limit).toBe(60);
      expect(RATE_LIMIT_CONFIGS.filter.windowMs).toBe(60000);
    });

    it('has cards config with appropriate limits', () => {
      expect(RATE_LIMIT_CONFIGS.cards.limit).toBe(100);
      expect(RATE_LIMIT_CONFIGS.cards.windowMs).toBe(60000);
    });

    it('has sets config with appropriate limits', () => {
      expect(RATE_LIMIT_CONFIGS.sets.limit).toBe(60);
      expect(RATE_LIMIT_CONFIGS.sets.windowMs).toBe(60000);
    });

    it('has health config with appropriate limits', () => {
      expect(RATE_LIMIT_CONFIGS.health.limit).toBe(10);
      expect(RATE_LIMIT_CONFIGS.health.windowMs).toBe(60000);
    });

    it('has strict config for expensive operations', () => {
      expect(RATE_LIMIT_CONFIGS.strict.limit).toBe(10);
      expect(RATE_LIMIT_CONFIGS.strict.windowMs).toBe(60000);
    });
  });

  describe('withRateLimit', () => {
    it('wraps handler and allows requests under limit', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));
      const wrappedHandler = withRateLimit(handler, {
        limit: 5,
        windowMs: 60000,
      });

      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.50',
      });

      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    });

    it('returns 429 when rate limit exceeded', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));
      const wrappedHandler = withRateLimit(handler, {
        limit: 2,
        windowMs: 60000,
      });

      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.51',
      });

      // Use up the limit
      await wrappedHandler(request);
      await wrappedHandler(request);

      // Third request should be blocked
      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(429);
    });

    it('respects includeHeaders option', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));
      const wrappedHandler = withRateLimit(handler, {
        limit: 5,
        windowMs: 60000,
        includeHeaders: false,
      });

      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.52',
      });

      const response = await wrappedHandler(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
    });
  });

  describe('clearRateLimitStore', () => {
    it('clears all entries from store', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.60',
      });

      checkRateLimit(request, { limit: 5, windowMs: 60000 });
      expect(getRateLimitStoreSize()).toBeGreaterThan(0);

      clearRateLimitStore();
      expect(getRateLimitStoreSize()).toBe(0);
    });
  });

  describe('getRateLimitStoreSize', () => {
    it('returns correct store size', () => {
      expect(getRateLimitStoreSize()).toBe(0);

      const request1 = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.70',
      });
      const request2 = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.71',
      });

      checkRateLimit(request1, { limit: 5, windowMs: 60000 });
      checkRateLimit(request2, { limit: 5, windowMs: 60000 });

      expect(getRateLimitStoreSize()).toBe(2);
    });
  });

  describe('getRateLimitInfo', () => {
    it('returns null for unknown key', () => {
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.99',
      });

      const info = getRateLimitInfo(request, { limit: 5, windowMs: 60000 });
      expect(info).toBeNull();
    });

    it('returns correct info for known key', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.80',
      });

      checkRateLimit(request, config);
      checkRateLimit(request, config);

      const info = getRateLimitInfo(request, config);

      expect(info).not.toBeNull();
      expect(info?.key).toBe('192.168.1.80');
      expect(info?.requestCount).toBe(2);
      expect(info?.remaining).toBe(3);
    });

    it('uses custom key generator', () => {
      const config: RateLimitConfig = {
        limit: 5,
        windowMs: 60000,
        keyGenerator: () => 'custom-key',
      };
      const request = createMockRequest('/api/test');

      checkRateLimit(request, config);

      const info = getRateLimitInfo(request, config);
      expect(info?.key).toBe('custom-key');
    });
  });

  describe('sliding window behavior', () => {
    it('gradually allows more requests as time passes', () => {
      const config: RateLimitConfig = { limit: 3, windowMs: 60000 };
      const request = createMockRequest('/api/test', {
        'x-forwarded-for': '192.168.1.90',
      });

      // Make requests at t=0, t=10s, t=20s
      vi.setSystemTime(0);
      checkRateLimit(request, config);

      vi.advanceTimersByTime(10000);
      checkRateLimit(request, config);

      vi.advanceTimersByTime(10000);
      checkRateLimit(request, config);

      // At t=20s, we're at the limit
      expect(checkRateLimit(request, config).allowed).toBe(false);

      // At t=61s, the first request has expired
      vi.advanceTimersByTime(41000);
      expect(checkRateLimit(request, config).allowed).toBe(true);
    });
  });

  describe('integration with API routes', () => {
    it('works with search endpoint config', () => {
      const request = createMockRequest('/api/search?q=Pikachu', {
        'x-forwarded-for': '10.0.0.1',
      });

      // Should allow 30 requests per minute
      for (let i = 0; i < 30; i++) {
        const result = checkRateLimit(request, RATE_LIMIT_CONFIGS.search);
        expect(result.allowed).toBe(true);
      }

      // 31st request should be blocked
      const result = checkRateLimit(request, RATE_LIMIT_CONFIGS.search);
      expect(result.allowed).toBe(false);
    });

    it('works with filter endpoint config', () => {
      const request = createMockRequest('/api/filter?setId=sv1', {
        'x-forwarded-for': '10.0.0.2',
      });

      // Should allow 60 requests per minute
      for (let i = 0; i < 60; i++) {
        const result = checkRateLimit(request, RATE_LIMIT_CONFIGS.filter);
        expect(result.allowed).toBe(true);
      }

      // 61st request should be blocked
      const result = checkRateLimit(request, RATE_LIMIT_CONFIGS.filter);
      expect(result.allowed).toBe(false);
    });
  });
});
