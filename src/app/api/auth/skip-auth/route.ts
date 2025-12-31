import { NextResponse } from 'next/server';

/**
 * API endpoint to skip authentication - DISABLED
 * Mock authentication has been removed. Please use the normal login flow.
 */
export async function POST() {
  console.log('❌ Skip-auth endpoint called - mock authentication is disabled');
  
  return NextResponse.json(
    { 
      success: false, 
      error: 'Mock authentication has been disabled. Please use the normal login flow at /api/auth/login' 
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
