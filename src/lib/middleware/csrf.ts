/**
 * CSRF Protection Middleware
 * 
 * Validates CSRF tokens for state-changing operations (POST, PUT, DELETE, PATCH)
 */

import { NextResponse } from 'next/server';
import { validateCsrfToken, getCsrfTokenFromHeader } from '@/lib/csrf';
import { createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * Require CSRF token for state-changing operations
 * Returns null if CSRF check passes, or an error response if it fails
 */
export async function requireCsrfToken(request: Request): Promise<NextResponse | null> {
  const method = request.method;
  
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Get CSRF token from header
  const token = getCsrfTokenFromHeader(request.headers);
  
  // Validate token
  const isValid = await validateCsrfToken(token);

  if (!isValid) {
    return createErrorResponse(
      'Invalid or missing CSRF token. Please refresh the page and try again.',
      403
    );
  }

  return null; // CSRF check passed
}

/**
 * Wrapper for API route handlers that require CSRF protection
 */
export function withCsrfProtection<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    // Extract request from args (usually first parameter)
    const request = args[0] as Request;
    
    const csrfError = await requireCsrfToken(request);
    if (csrfError) {
      return csrfError;
    }

    return handler(...args);
  };
}







