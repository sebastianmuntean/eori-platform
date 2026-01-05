import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { notifications } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { isValidUUID } from '@/lib/api-utils/validation';
import { requireCsrfToken } from '@/lib/middleware/csrf';

/**
 * PATCH /api/notifications/[id]/read - Mark notification as read
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PATCH /api/notifications/${id}/read - Marking as read`);

  try {
    // CSRF protection
    const csrfError = await requireCsrfToken(request);
    if (csrfError) return csrfError;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }

    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if notification exists and belongs to current user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification) {
      console.log(`❌ Notification ${id} not found or doesn't belong to user ${userId}`);
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification to mark as read
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    console.log(`✓ Notification marked as read: ${id}`);
    return NextResponse.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    logError(error, { endpoint: '/api/notifications/[id]/read', method: 'PATCH' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

