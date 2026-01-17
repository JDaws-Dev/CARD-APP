import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

/**
 * Health check response type
 */
interface HealthCheckResponse {
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
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * GET /api/health
 *
 * Health check endpoint for uptime monitoring.
 * Returns the overall system health status including:
 * - Database connectivity (Convex)
 * - Environment configuration
 * - Response latency
 *
 * Status codes:
 * - 200: All systems operational (healthy)
 * - 200: Some systems degraded but operational (degraded)
 * - 503: Critical systems unavailable (unhealthy)
 */
export async function GET() {
  const startTime = Date.now();

  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: {
        status: 'ok',
      },
      environment: {
        status: 'ok',
        convexConfigured: false,
      },
    },
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
  };

  // Check environment configuration
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    response.checks.environment.status = 'error';
    response.checks.environment.convexConfigured = false;
    response.status = 'unhealthy';
  } else {
    response.checks.environment.convexConfigured = true;
  }

  // Check database connectivity
  if (convexUrl) {
    const dbStartTime = Date.now();
    try {
      const client = new ConvexHttpClient(convexUrl);
      // Use a simple query to verify database connectivity
      await client.query(api.games.getGameCount, {});
      response.checks.database.status = 'ok';
      response.checks.database.latencyMs = Date.now() - dbStartTime;
    } catch (error) {
      response.checks.database.status = 'error';
      response.checks.database.latencyMs = Date.now() - dbStartTime;
      response.checks.database.error =
        error instanceof Error ? error.message : 'Unknown database error';

      // Database error makes the system unhealthy
      if (response.status === 'healthy') {
        response.status = 'degraded';
      }
    }
  } else {
    response.checks.database.status = 'error';
    response.checks.database.error = 'Convex URL not configured';
  }

  // Determine HTTP status code based on health status
  const httpStatus = response.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
