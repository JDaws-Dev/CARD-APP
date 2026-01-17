/**
 * Suspicious API Access Pattern Detection
 *
 * Tracks and logs unusual API access patterns that may indicate abuse,
 * scraping attempts, or automated attacks. Works alongside rate limiting
 * to provide visibility into potentially malicious behavior.
 *
 * Detection patterns:
 * - Rate limit exhaustion (repeated 429 responses)
 * - Rapid request bursts (many requests in short time)
 * - Sequential/enumeration patterns (card IDs, set IDs)
 * - Multi-game scanning (accessing all games in rapid succession)
 * - Failed request patterns (many 4xx errors)
 */

import { NextRequest } from 'next/server';
import { getClientIp } from './rateLimit';

/**
 * Log severity levels
 */
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Suspicious pattern types
 */
export type SuspiciousPatternType =
  | 'rate_limit_exhaustion'
  | 'rapid_burst'
  | 'sequential_enumeration'
  | 'multi_game_scan'
  | 'high_error_rate'
  | 'unusual_volume';

/**
 * Access log entry
 */
export interface AccessLogEntry {
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  gameSlug?: string;
  queryParams?: Record<string, string>;
}

/**
 * Suspicious access event
 */
export interface SuspiciousAccessEvent {
  type: SuspiciousPatternType;
  level: LogLevel;
  clientIp: string;
  endpoint: string;
  timestamp: Date;
  message: string;
  details: Record<string, unknown>;
}

/**
 * Client access history
 */
interface ClientAccessHistory {
  /** Recent request timestamps for burst detection */
  recentRequests: number[];
  /** Rate limit hits in current window */
  rateLimitHits: number;
  /** Error counts by status code */
  errorCounts: Record<number, number>;
  /** Games accessed in current window */
  gamesAccessed: Set<string>;
  /** Sequential parameters detected */
  sequentialParams: string[];
  /** When this entry was last updated */
  lastUpdated: number;
  /** When this entry expires */
  expiresAt: number;
}

/**
 * Configuration for suspicious access detection
 */
export interface SuspiciousAccessConfig {
  /** Time window for tracking patterns (ms) */
  windowMs: number;
  /** Number of rate limit hits to trigger alert */
  rateLimitHitThreshold: number;
  /** Number of requests in burst window to trigger alert */
  burstThreshold: number;
  /** Burst detection window (ms) */
  burstWindowMs: number;
  /** Number of games accessed rapidly to trigger alert */
  multiGameThreshold: number;
  /** Error rate threshold (percentage) to trigger alert */
  errorRateThreshold: number;
  /** Minimum requests before checking error rate */
  minRequestsForErrorRate: number;
  /** Custom log function (default: console) */
  logFn?: (event: SuspiciousAccessEvent) => void;
}

/**
 * Default configuration
 */
export const DEFAULT_SUSPICIOUS_ACCESS_CONFIG: SuspiciousAccessConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  rateLimitHitThreshold: 3,
  burstThreshold: 20,
  burstWindowMs: 10 * 1000, // 10 seconds
  multiGameThreshold: 5,
  errorRateThreshold: 50, // 50% error rate
  minRequestsForErrorRate: 10,
};

/**
 * In-memory store for client access history
 * Note: For multi-instance deployments, use Redis or a distributed store
 */
const accessHistoryStore = new Map<string, ClientAccessHistory>();

/**
 * Last cleanup timestamp
 */
let lastCleanup = Date.now();

/**
 * Cleanup interval (2 minutes)
 */
const CLEANUP_INTERVAL = 2 * 60 * 1000;

/**
 * Events log for testing and monitoring
 */
const recentEvents: SuspiciousAccessEvent[] = [];
const MAX_RECENT_EVENTS = 100;

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  for (const [key, entry] of accessHistoryStore.entries()) {
    if (entry.expiresAt < now) {
      accessHistoryStore.delete(key);
    }
  }
}

/**
 * Get or create client access history
 */
function getClientHistory(clientIp: string, config: SuspiciousAccessConfig): ClientAccessHistory {
  const now = Date.now();
  let history = accessHistoryStore.get(clientIp);

  if (!history || history.expiresAt < now) {
    history = {
      recentRequests: [],
      rateLimitHits: 0,
      errorCounts: {},
      gamesAccessed: new Set(),
      sequentialParams: [],
      lastUpdated: now,
      expiresAt: now + config.windowMs,
    };
  }

  return history;
}

/**
 * Log a suspicious access event
 */
function logSuspiciousEvent(event: SuspiciousAccessEvent, config: SuspiciousAccessConfig): void {
  // Add to recent events for monitoring
  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.shift();
  }

  // Use custom log function if provided, otherwise use console
  if (config.logFn) {
    config.logFn(event);
  } else {
    const logMethod =
      event.level === 'error'
        ? console.error
        : event.level === 'warn'
          ? console.warn
          : console.info;

    logMethod(
      `[SUSPICIOUS_ACCESS] [${event.level.toUpperCase()}] ${event.type}: ${event.message}`,
      {
        clientIp: event.clientIp,
        endpoint: event.endpoint,
        timestamp: event.timestamp.toISOString(),
        ...event.details,
      }
    );
  }
}

/**
 * Check for rapid burst pattern
 */
function checkBurstPattern(
  history: ClientAccessHistory,
  clientIp: string,
  endpoint: string,
  config: SuspiciousAccessConfig
): SuspiciousAccessEvent | null {
  const now = Date.now();
  const burstWindowStart = now - config.burstWindowMs;
  const recentInBurst = history.recentRequests.filter((ts) => ts > burstWindowStart);

  if (recentInBurst.length >= config.burstThreshold) {
    return {
      type: 'rapid_burst',
      level: 'warn',
      clientIp,
      endpoint,
      timestamp: new Date(),
      message: `Rapid burst detected: ${recentInBurst.length} requests in ${config.burstWindowMs / 1000}s`,
      details: {
        requestCount: recentInBurst.length,
        windowSeconds: config.burstWindowMs / 1000,
        threshold: config.burstThreshold,
      },
    };
  }

  return null;
}

/**
 * Check for rate limit exhaustion pattern
 */
function checkRateLimitExhaustion(
  history: ClientAccessHistory,
  clientIp: string,
  endpoint: string,
  config: SuspiciousAccessConfig
): SuspiciousAccessEvent | null {
  if (history.rateLimitHits >= config.rateLimitHitThreshold) {
    return {
      type: 'rate_limit_exhaustion',
      level: 'warn',
      clientIp,
      endpoint,
      timestamp: new Date(),
      message: `Rate limit exhaustion: ${history.rateLimitHits} rate limit hits in window`,
      details: {
        rateLimitHits: history.rateLimitHits,
        threshold: config.rateLimitHitThreshold,
      },
    };
  }

  return null;
}

/**
 * Check for multi-game scanning pattern
 */
function checkMultiGameScan(
  history: ClientAccessHistory,
  clientIp: string,
  endpoint: string,
  config: SuspiciousAccessConfig
): SuspiciousAccessEvent | null {
  if (history.gamesAccessed.size >= config.multiGameThreshold) {
    return {
      type: 'multi_game_scan',
      level: 'info',
      clientIp,
      endpoint,
      timestamp: new Date(),
      message: `Multi-game scanning: accessed ${history.gamesAccessed.size} different games`,
      details: {
        gamesAccessed: Array.from(history.gamesAccessed),
        threshold: config.multiGameThreshold,
      },
    };
  }

  return null;
}

/**
 * Check for high error rate pattern
 */
function checkHighErrorRate(
  history: ClientAccessHistory,
  clientIp: string,
  endpoint: string,
  config: SuspiciousAccessConfig
): SuspiciousAccessEvent | null {
  const totalRequests = history.recentRequests.length;
  if (totalRequests < config.minRequestsForErrorRate) {
    return null;
  }

  const totalErrors = Object.entries(history.errorCounts)
    .filter(([code]) => parseInt(code) >= 400)
    .reduce((sum, [, count]) => sum + count, 0);

  const errorRate = (totalErrors / totalRequests) * 100;

  if (errorRate >= config.errorRateThreshold) {
    return {
      type: 'high_error_rate',
      level: 'warn',
      clientIp,
      endpoint,
      timestamp: new Date(),
      message: `High error rate: ${errorRate.toFixed(1)}% of requests resulted in errors`,
      details: {
        errorRate: errorRate.toFixed(1),
        totalRequests,
        totalErrors,
        errorCounts: { ...history.errorCounts },
        threshold: config.errorRateThreshold,
      },
    };
  }

  return null;
}

/**
 * Detect sequential/enumeration patterns in parameters
 */
function detectSequentialPattern(values: string[]): boolean {
  if (values.length < 5) {
    return false;
  }

  // Check for numeric sequences
  const numericValues = values.map((v) => {
    const match = v.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  });

  if (numericValues.every((v) => v !== null)) {
    const sorted = (numericValues.filter((v) => v !== null) as number[]).sort((a, b) => a - b);
    let sequentialCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] <= 2) {
        sequentialCount++;
      }
    }
    // More than 60% sequential suggests enumeration
    return sequentialCount / (sorted.length - 1) > 0.6;
  }

  return false;
}

/**
 * Check for sequential enumeration pattern
 */
function checkSequentialEnumeration(
  history: ClientAccessHistory,
  clientIp: string,
  endpoint: string,
  _config: SuspiciousAccessConfig
): SuspiciousAccessEvent | null {
  if (detectSequentialPattern(history.sequentialParams)) {
    return {
      type: 'sequential_enumeration',
      level: 'warn',
      clientIp,
      endpoint,
      timestamp: new Date(),
      message: `Sequential enumeration detected: potential scraping attempt`,
      details: {
        sampleParams: history.sequentialParams.slice(-10),
        patternLength: history.sequentialParams.length,
      },
    };
  }

  return null;
}

/**
 * Record an API request and check for suspicious patterns
 *
 * @param request - The NextRequest object
 * @param endpoint - The API endpoint being accessed
 * @param statusCode - The response status code
 * @param options - Additional options
 * @returns Array of detected suspicious events (empty if none)
 */
export function recordApiAccess(
  request: NextRequest,
  endpoint: string,
  statusCode: number,
  options: {
    gameSlug?: string;
    queryParams?: Record<string, string>;
    config?: Partial<SuspiciousAccessConfig>;
  } = {}
): SuspiciousAccessEvent[] {
  const config = { ...DEFAULT_SUSPICIOUS_ACCESS_CONFIG, ...options.config };
  const clientIp = getClientIp(request);
  const now = Date.now();

  // Cleanup expired entries periodically
  cleanupExpiredEntries();

  // Get or create client history
  const history = getClientHistory(clientIp, config);

  // Update history
  history.recentRequests.push(now);
  history.lastUpdated = now;

  // Filter out old requests outside the window
  const windowStart = now - config.windowMs;
  history.recentRequests = history.recentRequests.filter((ts) => ts > windowStart);

  // Track rate limit hits (429 status)
  if (statusCode === 429) {
    history.rateLimitHits++;
  }

  // Track error responses
  if (statusCode >= 400) {
    history.errorCounts[statusCode] = (history.errorCounts[statusCode] || 0) + 1;
  }

  // Track games accessed
  if (options.gameSlug) {
    history.gamesAccessed.add(options.gameSlug);
  }

  // Track sequential parameters for enumeration detection
  if (options.queryParams) {
    const trackableParams = ['cardId', 'setId', 'id', 'offset'];
    for (const param of trackableParams) {
      if (options.queryParams[param]) {
        history.sequentialParams.push(options.queryParams[param]);
        // Keep only recent params
        if (history.sequentialParams.length > 50) {
          history.sequentialParams = history.sequentialParams.slice(-50);
        }
      }
    }
  }

  // Save updated history
  accessHistoryStore.set(clientIp, history);

  // Check for suspicious patterns
  const detectedEvents: SuspiciousAccessEvent[] = [];

  const checks = [
    checkBurstPattern,
    checkRateLimitExhaustion,
    checkMultiGameScan,
    checkHighErrorRate,
    checkSequentialEnumeration,
  ];

  for (const check of checks) {
    const event = check(history, clientIp, endpoint, config);
    if (event) {
      detectedEvents.push(event);
      logSuspiciousEvent(event, config);
    }
  }

  return detectedEvents;
}

/**
 * Get recent suspicious events (for monitoring/debugging)
 *
 * @param limit - Maximum number of events to return
 * @returns Array of recent suspicious events
 */
export function getRecentSuspiciousEvents(limit = 50): SuspiciousAccessEvent[] {
  return recentEvents.slice(-limit);
}

/**
 * Get suspicious event count by type
 *
 * @returns Map of event type to count
 */
export function getSuspiciousEventCounts(): Record<SuspiciousPatternType, number> {
  const counts: Record<SuspiciousPatternType, number> = {
    rate_limit_exhaustion: 0,
    rapid_burst: 0,
    sequential_enumeration: 0,
    multi_game_scan: 0,
    high_error_rate: 0,
    unusual_volume: 0,
  };

  for (const event of recentEvents) {
    counts[event.type]++;
  }

  return counts;
}

/**
 * Get client access statistics (for monitoring/debugging)
 *
 * @param clientIp - The client IP to get stats for
 * @returns Client access statistics or null if not found
 */
export function getClientAccessStats(clientIp: string): {
  requestCount: number;
  rateLimitHits: number;
  errorCounts: Record<number, number>;
  gamesAccessed: string[];
  lastSeen: Date;
} | null {
  const history = accessHistoryStore.get(clientIp);
  if (!history) {
    return null;
  }

  return {
    requestCount: history.recentRequests.length,
    rateLimitHits: history.rateLimitHits,
    errorCounts: { ...history.errorCounts },
    gamesAccessed: Array.from(history.gamesAccessed),
    lastSeen: new Date(history.lastUpdated),
  };
}

/**
 * Clear all access history (useful for testing)
 */
export function clearAccessHistory(): void {
  accessHistoryStore.clear();
  recentEvents.length = 0;
  lastCleanup = Date.now();
}

/**
 * Get the current size of the access history store (for monitoring)
 */
export function getAccessHistorySize(): number {
  return accessHistoryStore.size;
}

/**
 * Check if an IP has any suspicious activity flags
 *
 * @param clientIp - The client IP to check
 * @param config - Configuration options
 * @returns Object with suspicious activity indicators
 */
export function checkSuspiciousActivity(
  clientIp: string,
  config: Partial<SuspiciousAccessConfig> = {}
): {
  isSuspicious: boolean;
  reasons: SuspiciousPatternType[];
  severity: LogLevel;
} {
  const fullConfig = { ...DEFAULT_SUSPICIOUS_ACCESS_CONFIG, ...config };
  const history = accessHistoryStore.get(clientIp);

  if (!history) {
    return { isSuspicious: false, reasons: [], severity: 'info' };
  }

  const reasons: SuspiciousPatternType[] = [];
  let maxSeverity: LogLevel = 'info';

  // Check rate limit exhaustion
  if (history.rateLimitHits >= fullConfig.rateLimitHitThreshold) {
    reasons.push('rate_limit_exhaustion');
    maxSeverity = 'warn';
  }

  // Check burst pattern
  const now = Date.now();
  const burstWindowStart = now - fullConfig.burstWindowMs;
  const recentInBurst = history.recentRequests.filter((ts) => ts > burstWindowStart);
  if (recentInBurst.length >= fullConfig.burstThreshold) {
    reasons.push('rapid_burst');
    maxSeverity = 'warn';
  }

  // Check multi-game scan
  if (history.gamesAccessed.size >= fullConfig.multiGameThreshold) {
    reasons.push('multi_game_scan');
    if (maxSeverity === 'info') {
      maxSeverity = 'info';
    }
  }

  // Check high error rate
  const totalRequests = history.recentRequests.length;
  if (totalRequests >= fullConfig.minRequestsForErrorRate) {
    const totalErrors = Object.entries(history.errorCounts)
      .filter(([code]) => parseInt(code) >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    const errorRate = (totalErrors / totalRequests) * 100;
    if (errorRate >= fullConfig.errorRateThreshold) {
      reasons.push('high_error_rate');
      maxSeverity = 'warn';
    }
  }

  // Check sequential enumeration
  if (detectSequentialPattern(history.sequentialParams)) {
    reasons.push('sequential_enumeration');
    maxSeverity = 'error';
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    severity: maxSeverity,
  };
}
