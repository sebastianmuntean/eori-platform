import { NextResponse } from 'next/server';
import { logout, getCurrentUser } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';
import { logRequest, logResponse, logError as logErrorSecure } from '@/lib/logger';
import { logLogout, extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';

/**
 * POST /api/auth/logout - Logout user and destroy session
 * 
 * Clears the user's session cookie and removes the session from the database.
 * This endpoint is idempotent - it's safe to call even if no session exists.
 * 
 * @returns { success: boolean, error?: string }
 * @throws 500 - Server error
 */
export async function POST(request: Request) {
  logRequest('/api/auth/logout', 'POST');

  try {
    // Get user before logout (to log audit event)
    const { userId } = await getCurrentUser();
    
    await logout();
    
    // Log audit event for logout
    if (userId) {
      logLogout(userId, extractIpAddress(request), extractUserAgent(request)).catch((err) => {
        console.error('Failed to log logout audit event:', err);
      });
    }
    
    logResponse('/api/auth/logout', 'POST', 200);
    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorSecure('Error during logout', error, { endpoint: '/api/auth/logout', method: 'POST' });
    logError(error, { endpoint: '/api/auth/logout' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
