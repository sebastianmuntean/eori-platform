import { NextResponse } from 'next/server';
import { logout } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';

export async function POST() {
  console.log('Step 1: Logout request received');

  try {
    await logout();
    console.log('✓ Logout successful');
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { endpoint: '/api/auth/logout' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
