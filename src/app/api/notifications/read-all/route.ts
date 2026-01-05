import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { notifications } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { requireCsrfToken } from '@/lib/middleware/csrf';

/**
 * PATCH /api/notifications/read-all - Mark all notifications as read for current user
 */
export async function PATCH(request: Request) {
  console.log('Step 1: PATCH /api/notifications/read-all - Marking all as read');

  try {
    // CSRF protection
    const csrfError = await requireCsrfToken(request);
    if (csrfError) return csrfError;

    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update all unread notifications for current user
    const updatedNotifications = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning();

    const count = updatedNotifications.length;

    console.log(`✓ Marked ${count} notifications as read`);
    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    logError(error, { endpoint: '/api/notifications/read-all', method: 'PATCH' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

