import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';

export async function GET() {
  console.log('Step 1: GET /api/auth/me - Getting current user');

  try {
    const { userId, user } = await getCurrentUser();

    if (!userId || !user) {
      console.log('❌ No user found in session');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`✓ Current user retrieved: ${user.id}`);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/auth/me', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


