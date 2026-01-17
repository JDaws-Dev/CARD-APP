/**
 * Rate Limiting Utility for API Routes
 *
 * Implements a sliding window rate limiter using in-memory storage.
 * Note: This implementation is suitable for single-instance deployments.
 * For multi-instance deployments, use Redis or a distributed rate limiter.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiter configuration options
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key generator function (default: IP-based) */
  keyGenerator?: (request: NextRequest) => string;
  /** Whether to include rate limit headers in response */
  includeHeaders?: boolean;
}

/**
 * Rate limit result returned by the check function
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Timestamp when the rate limit resets (ms since epoch) */
  resetTime: number;
  /** Total limit for the window */
  limit: number;
  /** Time until rate limit resets in seconds */
  retryAfter: number;
}

/**
 * Entry in the rate limit store
 */
interface RateLimitEntry {
  /** Timestamps of requests within the window */
  timestamps: number[];
  /** When this entry expires (for cleanup) */
  expiresAt: number;
}

/**
 * In-memory store for rate limit data
 * Key: identifier (IP or custom key)
 * Value: rate limit entry with request timestamps
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Last cleanup timestamp
 */
let lastCleanup = Date.now();

/**
 * Cleanup interval in milliseconds (5 minutes)
 */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Remove expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.expiresAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Check common headers for proxied requests
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; the first is the client
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Vercel specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Check if a request is rate limited
 */
export function checkRateLimit(request: NextRequest, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Generate key for this request
  const key = config.keyGenerator ? config.keyGenerator(request) : getClientIp(request);

  // Cleanup expired entries periodically
  cleanupExpiredEntries();

  // Get or create entry for this key
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = {
      timestamps: [],
      expiresAt: now + config.windowMs,
    };
  }

  // Filter timestamps to only include those within the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Calculate remaining requests
  const requestsInWindow = entry.timestamps.length;
  const remaining = Math.max(0, config.limit - requestsInWindow);
  const allowed = requestsInWindow < config.limit;

  // Calculate reset time (when the oldest request in window expires)
  let resetTime: number;
  if (entry.timestamps.length > 0) {
    resetTime = entry.timestamps[0] + config.windowMs;
  } else {
    resetTime = now + config.windowMs;
  }

  // If allowed, record this request
  if (allowed) {
    entry.timestamps.push(now);
    entry.expiresAt = now + config.windowMs;
  }

  // Update store
  rateLimitStore.set(key, entry);

  const retryAfter = Math.max(0, Math.ceil((resetTime - now) / 1000));

  return {
    allowed,
    remaining: allowed ? remaining - 1 : remaining,
    resetTime,
    limit: config.limit,
    retryAfter,
  };
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  includeHeaders = true
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  );

  if (includeHeaders) {
    addRateLimitHeaders(response, result);
  }

  return response;
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

  if (!result.allowed) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }

  return response;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  /** Search endpoints: 30 requests per minute */
  search: {
    limit: 30,
    windowMs: 60 * 1000,
  },
  /** Filter endpoints: 60 requests per minute */
  filter: {
    limit: 60,
    windowMs: 60 * 1000,
  },
  /** Card lookup endpoints: 100 requests per minute */
  cards: {
    limit: 100,
    windowMs: 60 * 1000,
  },
  /** Sets endpoints: 60 requests per minute */
  sets: {
    limit: 60,
    windowMs: 60 * 1000,
  },
  /** Health check: 10 requests per minute (prevent abuse) */
  health: {
    limit: 10,
    windowMs: 60 * 1000,
  },
  /** Strict rate limit for expensive operations: 10 requests per minute */
  strict: {
    limit: 10,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * Higher-order function to wrap an API route handler with rate limiting
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>,
  config: RateLimitConfig
): (request: T) => Promise<NextResponse> {
  return async (request: T): Promise<NextResponse> => {
    const result = checkRateLimit(request, config);

    if (!result.allowed) {
      return createRateLimitResponse(result, config.includeHeaders !== false);
    }

    // Call the original handler
    const response = await handler(request);

    // Add rate limit headers to successful responses
    if (config.includeHeaders !== false) {
      addRateLimitHeaders(response, result);
    }

    return response;
  };
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
  lastCleanup = Date.now();
}

/**
 * Get the current size of the rate limit store (useful for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}

/**
 * Get rate limit info for a specific key (useful for debugging)
 */
export function getRateLimitInfo(
  request: NextRequest,
  config: RateLimitConfig
): { key: string; requestCount: number; remaining: number } | null {
  const key = config.keyGenerator ? config.keyGenerator(request) : getClientIp(request);

  const entry = rateLimitStore.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const activeTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

  return {
    key,
    requestCount: activeTimestamps.length,
    remaining: Math.max(0, config.limit - activeTimestamps.length),
  };
}
