/**
 * Tests for API Response Time Logging Utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  recordResponseTime,
  getPercentileStats,
  getEndpointStats,
  getAllEndpointStats,
  getEndpointSummaries,
  addResponseTimeHeader,
  withResponseTimeLogging,
  measureResponseTime,
  clearResponseTimeStore,
  getResponseTimeStoreSize,
  getTotalSampleCount,
  formatPercentileStats,
  exportMetrics,
  PercentileStats,
} from '../responseTimeLogs';

// Clear store before each test
beforeEach(() => {
  clearResponseTimeStore();
});

// ============================================================================
// recordResponseTime Tests
// ============================================================================

describe('recordResponseTime', () => {
  it('should record a single response time sample', () => {
    recordResponseTime('/api/test', 100, 200);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.sampleCount).toBe(1);
    expect(stats?.p50).toBe(100);
  });

  it('should record multiple samples for the same endpoint', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 150, 200);
    recordResponseTime('/api/test', 200, 200);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.sampleCount).toBe(3);
  });

  it('should track different endpoints separately', () => {
    recordResponseTime('/api/search', 50, 200);
    recordResponseTime('/api/cards', 100, 200);

    const searchStats = getPercentileStats('/api/search');
    const cardsStats = getPercentileStats('/api/cards');

    expect(searchStats).not.toBeNull();
    expect(cardsStats).not.toBeNull();
    expect(searchStats?.sampleCount).toBe(1);
    expect(cardsStats?.sampleCount).toBe(1);
    expect(searchStats?.p50).toBe(50);
    expect(cardsStats?.p50).toBe(100);
  });

  it('should track status codes correctly', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 100, 201);
    recordResponseTime('/api/test', 100, 400);
    recordResponseTime('/api/test', 100, 404);
    recordResponseTime('/api/test', 100, 500);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.successCount).toBe(2);
    expect(stats?.clientErrorCount).toBe(2);
    expect(stats?.serverErrorCount).toBe(1);
  });

  it('should respect maxSamples limit with circular buffer', () => {
    const maxSamples = 5;

    // Record more samples than the max
    for (let i = 0; i < 10; i++) {
      recordResponseTime('/api/test', i * 10, 200, maxSamples);
    }

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    // Should only keep maxSamples
    expect(stats?.sampleCount).toBe(maxSamples);
  });
});

// ============================================================================
// getPercentileStats Tests
// ============================================================================

describe('getPercentileStats', () => {
  it('should return null for non-existent endpoint', () => {
    const stats = getPercentileStats('/api/nonexistent');
    expect(stats).toBeNull();
  });

  it('should calculate p50 correctly (median)', () => {
    // Record 5 samples
    recordResponseTime('/api/test', 10, 200);
    recordResponseTime('/api/test', 20, 200);
    recordResponseTime('/api/test', 30, 200);
    recordResponseTime('/api/test', 40, 200);
    recordResponseTime('/api/test', 50, 200);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.p50).toBe(30); // Middle value
  });

  it('should calculate p95 correctly', () => {
    // Record 100 samples from 1-100
    for (let i = 1; i <= 100; i++) {
      recordResponseTime('/api/test', i, 200);
    }

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    // p95 of 1-100 should be around 95
    expect(stats?.p95).toBeGreaterThanOrEqual(94);
    expect(stats?.p95).toBeLessThanOrEqual(96);
  });

  it('should calculate p99 correctly', () => {
    // Record 100 samples from 1-100
    for (let i = 1; i <= 100; i++) {
      recordResponseTime('/api/test', i, 200);
    }

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    // p99 of 1-100 should be around 99
    expect(stats?.p99).toBeGreaterThanOrEqual(98);
    expect(stats?.p99).toBeLessThanOrEqual(100);
  });

  it('should calculate min and max correctly', () => {
    recordResponseTime('/api/test', 50, 200);
    recordResponseTime('/api/test', 10, 200);
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 30, 200);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.min).toBe(10);
    expect(stats?.max).toBe(100);
  });

  it('should calculate average correctly', () => {
    recordResponseTime('/api/test', 10, 200);
    recordResponseTime('/api/test', 20, 200);
    recordResponseTime('/api/test', 30, 200);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.avg).toBe(20); // (10+20+30)/3 = 20
  });

  it('should handle single sample correctly', () => {
    recordResponseTime('/api/test', 100, 200);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.p50).toBe(100);
    expect(stats?.p95).toBe(100);
    expect(stats?.p99).toBe(100);
    expect(stats?.min).toBe(100);
    expect(stats?.max).toBe(100);
    expect(stats?.avg).toBe(100);
  });
});

// ============================================================================
// getEndpointStats Tests
// ============================================================================

describe('getEndpointStats', () => {
  it('should return null for non-existent endpoint', () => {
    const stats = getEndpointStats('/api/nonexistent');
    expect(stats).toBeNull();
  });

  it('should include endpoint name in stats', () => {
    recordResponseTime('/api/search', 100, 200);

    const stats = getEndpointStats('/api/search');
    expect(stats).not.toBeNull();
    expect(stats?.endpoint).toBe('/api/search');
  });

  it('should include time range information', () => {
    recordResponseTime('/api/test', 100, 200);
    // Small delay to ensure different timestamps
    recordResponseTime('/api/test', 150, 200);

    const stats = getEndpointStats('/api/test');
    expect(stats).not.toBeNull();
    if (stats && stats.oldestSample && stats.newestSample) {
      expect(stats.oldestSample).toBeLessThanOrEqual(stats.newestSample);
    }
    expect(stats?.timeRangeMs).toBeGreaterThanOrEqual(0);
  });

  it('should include all percentile stats', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 200, 200);

    const stats = getEndpointStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats).toHaveProperty('p50');
    expect(stats).toHaveProperty('p95');
    expect(stats).toHaveProperty('p99');
    expect(stats).toHaveProperty('min');
    expect(stats).toHaveProperty('max');
    expect(stats).toHaveProperty('avg');
    expect(stats).toHaveProperty('sampleCount');
    expect(stats).toHaveProperty('successCount');
    expect(stats).toHaveProperty('clientErrorCount');
    expect(stats).toHaveProperty('serverErrorCount');
  });
});

// ============================================================================
// getAllEndpointStats Tests
// ============================================================================

describe('getAllEndpointStats', () => {
  it('should return empty array when no data', () => {
    const stats = getAllEndpointStats();
    expect(stats).toEqual([]);
  });

  it('should return stats for all tracked endpoints', () => {
    recordResponseTime('/api/search', 50, 200);
    recordResponseTime('/api/cards', 100, 200);
    recordResponseTime('/api/sets', 75, 200);

    const stats = getAllEndpointStats();
    expect(stats.length).toBe(3);
  });

  it('should sort by sample count descending', () => {
    recordResponseTime('/api/less', 50, 200);
    recordResponseTime('/api/more', 50, 200);
    recordResponseTime('/api/more', 50, 200);
    recordResponseTime('/api/more', 50, 200);

    const stats = getAllEndpointStats();
    expect(stats.length).toBe(2);
    expect(stats[0].endpoint).toBe('/api/more');
    expect(stats[0].sampleCount).toBe(3);
    expect(stats[1].endpoint).toBe('/api/less');
    expect(stats[1].sampleCount).toBe(1);
  });
});

// ============================================================================
// getEndpointSummaries Tests
// ============================================================================

describe('getEndpointSummaries', () => {
  it('should return empty array when no data', () => {
    const summaries = getEndpointSummaries();
    expect(summaries).toEqual([]);
  });

  it('should return summaries with error rate calculation', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 100, 400);
    recordResponseTime('/api/test', 100, 500);

    const summaries = getEndpointSummaries();
    expect(summaries.length).toBe(1);
    expect(summaries[0].endpoint).toBe('/api/test');
    expect(summaries[0].sampleCount).toBe(4);
    expect(summaries[0].errorRate).toBe(50); // 2 errors out of 4 = 50%
  });

  it('should return 0 error rate for all successful requests', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 100, 201);

    const summaries = getEndpointSummaries();
    expect(summaries[0].errorRate).toBe(0);
  });
});

// ============================================================================
// addResponseTimeHeader Tests
// ============================================================================

describe('addResponseTimeHeader', () => {
  it('should add X-Response-Time header to response', () => {
    const response = NextResponse.json({ data: 'test' });
    addResponseTimeHeader(response, 150);

    expect(response.headers.get('X-Response-Time')).toBe('150ms');
  });

  it('should return the same response object', () => {
    const response = NextResponse.json({ data: 'test' });
    const result = addResponseTimeHeader(response, 100);

    expect(result).toBe(response);
  });
});

// ============================================================================
// withResponseTimeLogging Tests
// ============================================================================

describe('withResponseTimeLogging', () => {
  it('should wrap handler and record response time', async () => {
    const mockHandler = async () => NextResponse.json({ data: 'test' });

    const wrappedHandler = withResponseTimeLogging(mockHandler, {
      endpoint: '/api/test',
    });

    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    await wrappedHandler(mockRequest);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.sampleCount).toBe(1);
  });

  it('should add response time header by default', async () => {
    const mockHandler = async () => NextResponse.json({ data: 'test' });

    const wrappedHandler = withResponseTimeLogging(mockHandler, {
      endpoint: '/api/test',
    });

    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const response = await wrappedHandler(mockRequest);

    expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/);
  });

  it('should not add header when includeHeaders is false', async () => {
    const mockHandler = async () => NextResponse.json({ data: 'test' });

    const wrappedHandler = withResponseTimeLogging(mockHandler, {
      endpoint: '/api/test',
      includeHeaders: false,
    });

    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const response = await wrappedHandler(mockRequest);

    expect(response.headers.get('X-Response-Time')).toBeNull();
  });

  it('should track correct status code', async () => {
    const mockHandler = async () => NextResponse.json({ error: 'Not found' }, { status: 404 });

    const wrappedHandler = withResponseTimeLogging(mockHandler, {
      endpoint: '/api/test',
    });

    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    await wrappedHandler(mockRequest);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.clientErrorCount).toBe(1);
  });
});

// ============================================================================
// measureResponseTime Tests
// ============================================================================

describe('measureResponseTime', () => {
  it('should measure and record response time', () => {
    const startTime = performance.now() - 100; // Simulate 100ms ago

    const duration = measureResponseTime(startTime, '/api/test', 200);

    expect(duration).toBeGreaterThanOrEqual(99);

    const stats = getPercentileStats('/api/test');
    expect(stats).not.toBeNull();
    expect(stats?.sampleCount).toBe(1);
  });

  it('should return rounded duration', () => {
    const startTime = performance.now();

    const duration = measureResponseTime(startTime, '/api/test', 200);

    expect(Number.isInteger(duration)).toBe(true);
  });
});

// ============================================================================
// Store Management Tests
// ============================================================================

describe('Store Management', () => {
  describe('clearResponseTimeStore', () => {
    it('should clear all stored data', () => {
      recordResponseTime('/api/test1', 100, 200);
      recordResponseTime('/api/test2', 100, 200);

      expect(getResponseTimeStoreSize()).toBe(2);

      clearResponseTimeStore();

      expect(getResponseTimeStoreSize()).toBe(0);
      expect(getAllEndpointStats()).toEqual([]);
    });
  });

  describe('getResponseTimeStoreSize', () => {
    it('should return 0 for empty store', () => {
      expect(getResponseTimeStoreSize()).toBe(0);
    });

    it('should return correct count of tracked endpoints', () => {
      recordResponseTime('/api/a', 100, 200);
      recordResponseTime('/api/b', 100, 200);
      recordResponseTime('/api/c', 100, 200);

      expect(getResponseTimeStoreSize()).toBe(3);
    });
  });

  describe('getTotalSampleCount', () => {
    it('should return 0 for empty store', () => {
      expect(getTotalSampleCount()).toBe(0);
    });

    it('should return total samples across all endpoints', () => {
      recordResponseTime('/api/a', 100, 200);
      recordResponseTime('/api/a', 100, 200);
      recordResponseTime('/api/b', 100, 200);

      expect(getTotalSampleCount()).toBe(3);
    });
  });
});

// ============================================================================
// formatPercentileStats Tests
// ============================================================================

describe('formatPercentileStats', () => {
  it('should return "No data available" for null stats', () => {
    const result = formatPercentileStats(null);
    expect(result).toBe('No data available');
  });

  it('should format stats as readable string', () => {
    const stats: PercentileStats = {
      p50: 100,
      p95: 200,
      p99: 300,
      min: 50,
      max: 400,
      avg: 150,
      sampleCount: 10,
      successCount: 8,
      clientErrorCount: 1,
      serverErrorCount: 1,
    };

    const result = formatPercentileStats(stats);

    expect(result).toContain('p50=100ms');
    expect(result).toContain('p95=200ms');
    expect(result).toContain('p99=300ms');
    expect(result).toContain('min=50ms');
    expect(result).toContain('max=400ms');
    expect(result).toContain('avg=150ms');
    expect(result).toContain('samples=10');
    expect(result).toContain('success=8');
    expect(result).toContain('clientErr=1');
    expect(result).toContain('serverErr=1');
  });
});

// ============================================================================
// exportMetrics Tests
// ============================================================================

describe('exportMetrics', () => {
  it('should export metrics with correct structure', () => {
    recordResponseTime('/api/test', 100, 200);

    const metrics = exportMetrics();

    expect(metrics).toHaveProperty('timestamp');
    expect(metrics).toHaveProperty('windowMs');
    expect(metrics).toHaveProperty('endpoints');
    expect(metrics).toHaveProperty('totals');
    expect(typeof metrics.timestamp).toBe('number');
    expect(Array.isArray(metrics.endpoints)).toBe(true);
  });

  it('should export empty endpoints array when no data', () => {
    const metrics = exportMetrics();

    expect(metrics.endpoints).toEqual([]);
    expect(metrics.totals.endpoints).toBe(0);
    expect(metrics.totals.samples).toBe(0);
  });

  it('should export correct endpoint data', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 150, 200);
    recordResponseTime('/api/test', 200, 404);

    const metrics = exportMetrics();

    expect(metrics.endpoints.length).toBe(1);
    expect(metrics.endpoints[0].name).toBe('/api/test');
    expect(metrics.endpoints[0].latency.p50).toBeGreaterThanOrEqual(100);
    expect(metrics.endpoints[0].counts.total).toBe(3);
    expect(metrics.endpoints[0].counts.success).toBe(2);
    expect(metrics.endpoints[0].counts.clientError).toBe(1);
    expect(metrics.endpoints[0].counts.serverError).toBe(0);
  });

  it('should calculate error rate correctly in export', () => {
    recordResponseTime('/api/test', 100, 200);
    recordResponseTime('/api/test', 100, 500);

    const metrics = exportMetrics();

    // 1 error out of 2 = 50%
    expect(metrics.endpoints[0].errorRate).toBe(50);
  });

  it('should include totals summary', () => {
    recordResponseTime('/api/a', 100, 200);
    recordResponseTime('/api/a', 100, 200);
    recordResponseTime('/api/b', 100, 200);

    const metrics = exportMetrics();

    expect(metrics.totals.endpoints).toBe(2);
    expect(metrics.totals.samples).toBe(3);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  it('should handle realistic API traffic patterns', () => {
    // Simulate realistic response time distribution
    // Most requests fast, some slow outliers
    const fastTimes = Array(90).fill(50); // 90 fast requests at 50ms
    const mediumTimes = Array(8).fill(150); // 8 medium requests at 150ms
    const slowTimes = [500, 1000]; // 2 slow requests

    [...fastTimes, ...mediumTimes, ...slowTimes].forEach((time) => {
      recordResponseTime('/api/realistic', time, 200);
    });

    const stats = getPercentileStats('/api/realistic');
    expect(stats).not.toBeNull();
    expect(stats?.sampleCount).toBe(100);
    expect(stats?.p50).toBe(50); // Median should be 50 (most common)
    expect(stats?.p95).toBeGreaterThanOrEqual(50); // p95 captures slower requests
    expect(stats?.p99).toBeGreaterThanOrEqual(150); // p99 captures slowest
    expect(stats?.min).toBe(50);
    expect(stats?.max).toBe(1000);
  });

  it('should handle mixed success and error responses', () => {
    // 70% success, 20% client errors, 10% server errors
    for (let i = 0; i < 70; i++) {
      recordResponseTime('/api/mixed', Math.random() * 100 + 50, 200);
    }
    for (let i = 0; i < 20; i++) {
      recordResponseTime(
        '/api/mixed',
        Math.random() * 50 + 20,
        400 + Math.floor(Math.random() * 100)
      );
    }
    for (let i = 0; i < 10; i++) {
      recordResponseTime(
        '/api/mixed',
        Math.random() * 200 + 100,
        500 + Math.floor(Math.random() * 4)
      );
    }

    const stats = getPercentileStats('/api/mixed');
    expect(stats).not.toBeNull();
    expect(stats?.sampleCount).toBe(100);
    expect(stats?.successCount).toBe(70);
    expect(stats?.clientErrorCount).toBe(20);
    expect(stats?.serverErrorCount).toBe(10);
  });

  it('should track multiple endpoints simultaneously', () => {
    const endpoints = ['/api/search', '/api/cards', '/api/sets', '/api/filter'];

    endpoints.forEach((endpoint, index) => {
      // Each endpoint has different response times
      for (let i = 0; i < 10; i++) {
        recordResponseTime(endpoint, (index + 1) * 20 + i, 200);
      }
    });

    const stats = getAllEndpointStats();
    expect(stats.length).toBe(4);

    const summaries = getEndpointSummaries();
    expect(summaries.length).toBe(4);

    const metrics = exportMetrics();
    expect(metrics.endpoints.length).toBe(4);
    expect(metrics.totals.samples).toBe(40);
  });
});
