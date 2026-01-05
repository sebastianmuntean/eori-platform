import { NextResponse } from 'next/server';
import type { Request } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserEffectivePermissions } from '../../../../../lib/auth/permissions';
import { formatErrorResponse, logError } from '@/lib/errors';
import { logRequest, logResponse, logError as logErrorSecure } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * @openapi
 * /api/auth/permissions:
 *   get:
 *     summary: Get current user's effective permissions
 *     description: Returns all effective permissions for the currently authenticated user (from roles + overrides).
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's effective permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["hr.employees.view", "accounting.invoices.view"]
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Not authenticated"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Rate limit configuration for permissions endpoint
 * 30 requests per minute per user/IP to prevent enumeration attacks
 */
const PERMISSIONS_RATE_LIMIT_MAX = 30;
const PERMISSIONS_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * GET /api/auth/permissions
 * Returns effective permissions for the authenticated user
 * 
 * Security:
 * - Requires authentication
 * - Rate limited to prevent enumeration
 * - Returns empty array on error (doesn't leak information)
 */
export async function GET(request: Request) {
  logRequest('/api/auth/permissions', 'GET');

  try {
    // Get user for authentication and rate limiting
    const { userId } = await getCurrentUser();

    if (!userId) {
      logResponse('/api/auth/permissions', 'GET', 401);
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }

    // Apply rate limiting to prevent enumeration and DoS attacks
    const rateLimitResult = await checkRateLimit(
      request,
      PERMISSIONS_RATE_LIMIT_MAX,
      PERMISSIONS_RATE_LIMIT_WINDOW_MS
    );

    if (!rateLimitResult.allowed) {
      logResponse('/api/auth/permissions', 'GET', 429);
      return rateLimitResult.response || NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // Fetch user permissions
    const result = await getUserEffectivePermissions(userId);

    if (!result.success) {
      logResponse('/api/auth/permissions', 'GET', 500);
      // Don't expose internal error details
      return NextResponse.json(
        { success: false, error: 'Failed to fetch permissions' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }

    // Validate permissions array
    const permissions = Array.isArray(result.permissions) 
      ? result.permissions.filter((p): p is string => typeof p === 'string' && p.length > 0)
      : [];

    logResponse('/api/auth/permissions', 'GET', 200);
    return NextResponse.json({
      success: true,
      permissions,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logErrorSecure('Error getting user permissions', error, { endpoint: '/api/auth/permissions', method: 'GET' });
    logError(error, { endpoint: '/api/auth/permissions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
}

