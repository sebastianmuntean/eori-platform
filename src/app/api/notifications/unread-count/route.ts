import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { notifications } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';

/**
 * GET /api/notifications/unread-count - Get unread notification count for current user
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/notifications/unread-count - Fetching unread count');

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get unread count for current user
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const count = Number(countResult[0]?.count || 0);

    console.log(`✓ Unread count: ${count}`);
    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    logError(error, { endpoint: '/api/notifications/unread-count', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

