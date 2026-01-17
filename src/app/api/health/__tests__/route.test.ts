import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

// Mock the Convex HTTP client
const mockQuery = vi.fn();

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

// Mock environment variable
const originalEnv = process.env;

function parseJsonResponse(response: Response): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latencyMs?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'error';
      convexConfigured: boolean;
    };
  };
  uptime?: number;
}> {
  return response.json();
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_CONVEX_URL: 'https://test-convex.cloud',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('healthy status', () => {
    it('returns healthy status when all systems are operational', async () => {
      mockQuery.mockResolvedValue(7); // Mock game count

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks.database.status).toBe('ok');
      expect(data.checks.environment.status).toBe('ok');
      expect(data.checks.environment.convexConfigured).toBe(true);
    });

    it('includes timestamp in ISO format', async () => {
      mockQuery.mockResolvedValue(7);

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('includes database latency when healthy', async () => {
      mockQuery.mockResolvedValue(7);

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.checks.database.latencyMs).toBeDefined();
      expect(typeof data.checks.database.latencyMs).toBe('number');
      expect(data.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('includes uptime in seconds', async () => {
      mockQuery.mockResolvedValue(7);

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('includes version string', async () => {
      mockQuery.mockResolvedValue(7);

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.version).toBeDefined();
      expect(typeof data.version).toBe('string');
    });
  });

  describe('degraded status', () => {
    it('returns degraded status when database fails but environment is configured', async () => {
      mockQuery.mockRejectedValue(new Error('Connection timeout'));

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.checks.database.status).toBe('error');
      expect(data.checks.database.error).toBe('Connection timeout');
      expect(data.checks.environment.status).toBe('ok');
    });

    it('includes database latency even when query fails', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.checks.database.latencyMs).toBeDefined();
      expect(typeof data.checks.database.latencyMs).toBe('number');
    });

    it('handles non-Error exceptions from database', async () => {
      mockQuery.mockRejectedValue('String error');

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data.status).toBe('degraded');
      expect(data.checks.database.error).toBe('Unknown database error');
    });
  });

  describe('unhealthy status', () => {
    it('returns unhealthy status when NEXT_PUBLIC_CONVEX_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.checks.environment.status).toBe('error');
      expect(data.checks.environment.convexConfigured).toBe(false);
      expect(data.checks.database.status).toBe('error');
      expect(data.checks.database.error).toBe('Convex URL not configured');
    });

    it('returns 503 HTTP status for unhealthy state', async () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;

      const response = await GET();

      expect(response.status).toBe(503);
    });
  });

  describe('response structure', () => {
    it('includes all required fields', async () => {
      mockQuery.mockResolvedValue(7);

      const response = await GET();
      const data = await parseJsonResponse(response);

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('uptime');
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('environment');
      expect(data.checks.database).toHaveProperty('status');
      expect(data.checks.environment).toHaveProperty('status');
      expect(data.checks.environment).toHaveProperty('convexConfigured');
    });

    it('returns valid JSON response', async () => {
      mockQuery.mockResolvedValue(7);

      const response = await GET();

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
