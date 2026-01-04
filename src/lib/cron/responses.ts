import { NextResponse } from 'next/server';

/**
 * Creates a standard success response for cron endpoints
 */
export function createCronSuccessResponse<T = unknown>(data: T) {
  return NextResponse.json({
    success: true,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Creates a standard error response for cron endpoints
 */
export function createCronErrorResponse(
  error: unknown,
  statusCode: number = 500
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status: statusCode }
  );
}

/**
 * Creates a health check response for GET endpoints
 */
export function createHealthCheckResponse(endpointName: string) {
  return NextResponse.json({
    success: true,
    message: `${endpointName} cron endpoint is active`,
    timestamp: new Date().toISOString(),
  });
}

