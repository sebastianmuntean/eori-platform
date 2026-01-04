import { NextResponse } from 'next/server';
import { logRequest, logResponse, logWarn } from '@/lib/logger';

/**
 * POST /api/auth/skip-auth - Skip authentication (DISABLED)
 * 
 * This endpoint has been disabled. Mock authentication has been removed.
 * Please use the normal login flow at /api/auth/login.
 * 
 * @returns { success: false, error: string }
 * @throws 410 - Gone (endpoint no longer available)
 */
export async function POST() {
  logRequest('/api/auth/skip-auth', 'POST');
  logWarn('Skip-auth endpoint called - mock authentication is disabled', {
    endpoint: '/api/auth/skip-auth',
  });
  
  logResponse('/api/auth/skip-auth', 'POST', 410);
  return NextResponse.json(
    { 
      success: false, 
      error: 'Mock authentication has been disabled. Please use the normal login flow at /api/auth/login' 
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
