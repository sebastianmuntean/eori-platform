import { NextResponse } from 'next/server';
import { logRequest, logResponse, logWarn } from '@/lib/logger';

/**
 * POST /api/auth/skip-auth - Skip authentication (DISABLED)
 *
 * This endpoint is permanently disabled outside local development.
 * Mock authentication has been removed; use /api/auth/login.
 *
 * @returns { success: false, error: string }
 * @throws 410 - Gone (endpoint no longer available)
 * @throws 404 - Not found outside development
 */
export async function POST() {
  logRequest('/api/auth/skip-auth', 'POST');

  if (process.env.NODE_ENV !== 'development') {
    logWarn('Skip-auth endpoint called outside development', {
      endpoint: '/api/auth/skip-auth',
    });
    logResponse('/api/auth/skip-auth', 'POST', 404);
    return NextResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }

  logWarn('Skip-auth endpoint called - mock authentication is disabled', {
    endpoint: '/api/auth/skip-auth',
  });

  logResponse('/api/auth/skip-auth', 'POST', 410);
  return NextResponse.json(
    {
      success: false,
      error:
        'Mock authentication has been disabled. Please use the normal login flow at /api/auth/login',
    },
    { status: 410 }
  );
}
