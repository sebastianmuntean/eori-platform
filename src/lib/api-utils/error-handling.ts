/**
 * Standardized error handling for API routes
 */

import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { logAuditEvent, extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';
import { getCurrentUser } from '@/lib/auth';

/**
 * Wrap API route handler with standardized error handling
 */
export async function handleApiRoute<T>(
  handler: () => Promise<NextResponse>,
  context: { endpoint: string; method: string }
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    logger.error(`Error in ${context.method} ${context.endpoint}`, error, context);
    logError(error, context);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, statusCode: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: statusCode }
  );
}

