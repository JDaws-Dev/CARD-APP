/**
 * API Response Time Logging Utility
 *
 * Tracks response times for API endpoints and calculates percentile latencies.
 * Uses in-memory storage with sliding window for recent metrics.
 *
 * Note: This implementation is suitable for single-instance deployments.
 * For multi-instance deployments, use Redis or a distributed metrics store.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Configuration for response time tracking
 */
export interface ResponseTimeConfig {
  /** Name of the endpoint (used as key in the store) */
  endpoint: string;
  /** Time window in milliseconds to keep metrics (default: 5 minutes) */
  windowMs?: number;
  /** Maximum number of samples to keep per endpoint (default: 1000) */
  maxSamples?: number;
  /** Whether to include response time headers (default: true) */
  includeHeaders?: boolean;
}

/**
 * A single response time sample
 */
interface ResponseTimeSample {
  /** Response time in milliseconds */
  duration: number;
  /** Timestamp when the request completed */
  timestamp: number;
  /** HTTP status code of the response */
  statusCode: number;
}

/**
 * Percentile statistics for an endpoint
 */
export interface PercentileStats {
  /** 50th percentile (median) latency in ms */
  p50: number;
  /** 95th percentile latency in ms */
  p95: number;
  /** 99th percentile latency in ms */
  p99: number;
  /** Minimum latency in ms */
  min: number;
  /** Maximum latency in ms */
  max: number;
  /** Average latency in ms */
  avg: number;
  /** Total number of samples */
  sampleCount: number;
  /** Number of successful requests (2xx) */
  successCount: number;
  /** Number of client errors (4xx) */
  clientErrorCount: number;
  /** Number of server errors (5xx) */
  serverErrorCount: number;
}

/**
 * Full endpoint statistics including percentiles
 */
export interface EndpointStats extends PercentileStats {
  /** Endpoint name/path */
  endpoint: string;
  /** Oldest sample timestamp */
  oldestSample: number | null;
  /** Newest sample timestamp */
  newestSample: number | null;
  /** Time range of samples in ms */
  timeRangeMs: number;
}

/**
 * Entry in the response time store
 */
interface ResponseTimeEntry {
  /** Circular buffer of samples */
  samples: ResponseTimeSample[];
  /** Index for next write (for circular buffer) */
  writeIndex: number;
  /** Total number of samples recorded (can exceed maxSamples) */
  totalRecorded: number;
}

/**
 * In-memory store for response time data
 * Key: endpoint name
 * Value: response time entry with samples
 */
const responseTimeStore = new Map<string, ResponseTimeEntry>();

/**
 * Default configuration values
 */
const DEFAULT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SAMPLES = 1000;

/**
 * Last cleanup timestamp
 */
let lastCleanup = Date.now();

/**
 * Cleanup interval in milliseconds (1 minute)
 */
const CLEANUP_INTERVAL = 60 * 1000;

/**
 * Remove old samples from all endpoints
 */
function cleanupOldSamples(windowMs: number = DEFAULT_WINDOW_MS): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  const cutoff = now - windowMs;

  for (const [endpoint, entry] of responseTimeStore.entries()) {
    // Filter out samples older than the window
    entry.samples = entry.samples.filter((s) => s.timestamp > cutoff);

    // Reset write index if we cleared samples
    if (entry.samples.length === 0) {
      entry.writeIndex = 0;
    }

    // Remove empty entries
    if (entry.samples.length === 0 && entry.totalRecorded === 0) {
      responseTimeStore.delete(endpoint);
    }
  }
}

/**
 * Record a response time sample for an endpoint
 */
export function recordResponseTime(
  endpoint: string,
  duration: number,
  statusCode: number,
  maxSamples: number = DEFAULT_MAX_SAMPLES
): void {
  const now = Date.now();

  // Cleanup old samples periodically
  cleanupOldSamples();

  let entry = responseTimeStore.get(endpoint);
  if (!entry) {
    entry = {
      samples: [],
      writeIndex: 0,
      totalRecorded: 0,
    };
    responseTimeStore.set(endpoint, entry);
  }

  const sample: ResponseTimeSample = {
    duration,
    timestamp: now,
    statusCode,
  };

  // Use circular buffer approach
  if (entry.samples.length < maxSamples) {
    entry.samples.push(sample);
  } else {
    entry.samples[entry.writeIndex] = sample;
    entry.writeIndex = (entry.writeIndex + 1) % maxSamples;
  }

  entry.totalRecorded++;
}

/**
 * Calculate a percentile value from a sorted array of numbers
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

/**
 * Get percentile statistics for an endpoint
 */
export function getPercentileStats(
  endpoint: string,
  windowMs: number = DEFAULT_WINDOW_MS
): PercentileStats | null {
  const entry = responseTimeStore.get(endpoint);
  if (!entry || entry.samples.length === 0) {
    return null;
  }

  const now = Date.now();
  const cutoff = now - windowMs;

  // Filter to samples within the window
  const activeSamples = entry.samples.filter((s) => s.timestamp > cutoff);
  if (activeSamples.length === 0) {
    return null;
  }

  // Extract durations and sort them
  const durations = activeSamples.map((s) => s.duration).sort((a, b) => a - b);

  // Count by status code category
  let successCount = 0;
  let clientErrorCount = 0;
  let serverErrorCount = 0;

  for (const sample of activeSamples) {
    if (sample.statusCode >= 200 && sample.statusCode < 300) {
      successCount++;
    } else if (sample.statusCode >= 400 && sample.statusCode < 500) {
      clientErrorCount++;
    } else if (sample.statusCode >= 500) {
      serverErrorCount++;
    }
  }

  return {
    p50: calculatePercentile(durations, 50),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
    min: durations[0],
    max: durations[durations.length - 1],
    avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    sampleCount: activeSamples.length,
    successCount,
    clientErrorCount,
    serverErrorCount,
  };
}

/**
 * Get full statistics for an endpoint including time range
 */
export function getEndpointStats(
  endpoint: string,
  windowMs: number = DEFAULT_WINDOW_MS
): EndpointStats | null {
  const percentiles = getPercentileStats(endpoint, windowMs);
  if (!percentiles) {
    return null;
  }

  const entry = responseTimeStore.get(endpoint);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  const cutoff = now - windowMs;
  const activeSamples = entry.samples.filter((s) => s.timestamp > cutoff);

  if (activeSamples.length === 0) {
    return null;
  }

  const timestamps = activeSamples.map((s) => s.timestamp);
  const oldestSample = Math.min(...timestamps);
  const newestSample = Math.max(...timestamps);

  return {
    endpoint,
    ...percentiles,
    oldestSample,
    newestSample,
    timeRangeMs: newestSample - oldestSample,
  };
}

/**
 * Get statistics for all tracked endpoints
 */
export function getAllEndpointStats(windowMs: number = DEFAULT_WINDOW_MS): EndpointStats[] {
  const stats: EndpointStats[] = [];

  for (const endpoint of responseTimeStore.keys()) {
    const endpointStats = getEndpointStats(endpoint, windowMs);
    if (endpointStats) {
      stats.push(endpointStats);
    }
  }

  // Sort by sample count descending (most active endpoints first)
  return stats.sort((a, b) => b.sampleCount - a.sampleCount);
}

/**
 * Get a summary of all endpoints for quick monitoring
 */
export interface EndpointSummary {
  endpoint: string;
  p50: number;
  p95: number;
  p99: number;
  sampleCount: number;
  errorRate: number;
}

export function getEndpointSummaries(windowMs: number = DEFAULT_WINDOW_MS): EndpointSummary[] {
  const stats = getAllEndpointStats(windowMs);

  return stats.map((s) => ({
    endpoint: s.endpoint,
    p50: s.p50,
    p95: s.p95,
    p99: s.p99,
    sampleCount: s.sampleCount,
    errorRate:
      s.sampleCount > 0
        ? Math.round(((s.clientErrorCount + s.serverErrorCount) / s.sampleCount) * 100 * 100) / 100
        : 0,
  }));
}

/**
 * Add response time header to a response
 */
export function addResponseTimeHeader(response: NextResponse, duration: number): NextResponse {
  response.headers.set('X-Response-Time', `${duration}ms`);
  return response;
}

/**
 * Higher-order function to wrap an API route handler with response time logging
 */
export function withResponseTimeLogging<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>,
  config: ResponseTimeConfig
): (request: T) => Promise<NextResponse> {
  const { endpoint, windowMs, maxSamples, includeHeaders = true } = config;

  return async (request: T): Promise<NextResponse> => {
    const startTime = performance.now();

    // Call the original handler
    const response = await handler(request);

    const duration = Math.round(performance.now() - startTime);
    const statusCode = response.status;

    // Record the response time
    recordResponseTime(endpoint, duration, statusCode, maxSamples ?? DEFAULT_MAX_SAMPLES);

    // Add response time header if configured
    if (includeHeaders) {
      addResponseTimeHeader(response, duration);
    }

    return response;
  };
}

/**
 * Middleware-style function to measure and log response time
 * Returns the measured duration
 */
export function measureResponseTime(
  startTime: number,
  endpoint: string,
  statusCode: number,
  maxSamples: number = DEFAULT_MAX_SAMPLES
): number {
  const duration = Math.round(performance.now() - startTime);
  recordResponseTime(endpoint, duration, statusCode, maxSamples);
  return duration;
}

/**
 * Clear all response time data (useful for testing)
 */
export function clearResponseTimeStore(): void {
  responseTimeStore.clear();
  lastCleanup = Date.now();
}

/**
 * Get the current size of the response time store (useful for monitoring)
 */
export function getResponseTimeStoreSize(): number {
  return responseTimeStore.size;
}

/**
 * Get the total number of samples across all endpoints
 */
export function getTotalSampleCount(): number {
  let total = 0;
  for (const entry of responseTimeStore.values()) {
    total += entry.samples.length;
  }
  return total;
}

/**
 * Format percentile stats as a human-readable string
 */
export function formatPercentileStats(stats: PercentileStats | null): string {
  if (!stats) {
    return 'No data available';
  }

  return (
    `p50=${stats.p50}ms p95=${stats.p95}ms p99=${stats.p99}ms ` +
    `(min=${stats.min}ms max=${stats.max}ms avg=${stats.avg}ms) ` +
    `samples=${stats.sampleCount} ` +
    `success=${stats.successCount} clientErr=${stats.clientErrorCount} serverErr=${stats.serverErrorCount}`
  );
}

/**
 * Log response time stats to console (for debugging/monitoring)
 */
export function logResponseTimeStats(windowMs: number = DEFAULT_WINDOW_MS): void {
  const stats = getAllEndpointStats(windowMs);

  if (stats.length === 0) {
    console.log('[ResponseTime] No data available');
    return;
  }

  console.log(`[ResponseTime] Statistics (last ${Math.round(windowMs / 1000)}s):`);
  for (const s of stats) {
    console.log(`  ${s.endpoint}: ${formatPercentileStats(s)}`);
  }
}

/**
 * Export stats in a format suitable for external monitoring systems
 */
export interface MetricsExport {
  timestamp: number;
  windowMs: number;
  endpoints: {
    name: string;
    latency: {
      p50: number;
      p95: number;
      p99: number;
      min: number;
      max: number;
      avg: number;
    };
    counts: {
      total: number;
      success: number;
      clientError: number;
      serverError: number;
    };
    errorRate: number;
  }[];
  totals: {
    endpoints: number;
    samples: number;
  };
}

export function exportMetrics(windowMs: number = DEFAULT_WINDOW_MS): MetricsExport {
  const stats = getAllEndpointStats(windowMs);

  return {
    timestamp: Date.now(),
    windowMs,
    endpoints: stats.map((s) => ({
      name: s.endpoint,
      latency: {
        p50: s.p50,
        p95: s.p95,
        p99: s.p99,
        min: s.min,
        max: s.max,
        avg: s.avg,
      },
      counts: {
        total: s.sampleCount,
        success: s.successCount,
        clientError: s.clientErrorCount,
        serverError: s.serverErrorCount,
      },
      errorRate:
        s.sampleCount > 0
          ? Math.round(((s.clientErrorCount + s.serverErrorCount) / s.sampleCount) * 100 * 100) /
            100
          : 0,
    })),
    totals: {
      endpoints: stats.length,
      samples: getTotalSampleCount(),
    },
  };
}
