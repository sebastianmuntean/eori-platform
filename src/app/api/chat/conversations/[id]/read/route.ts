import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { markConversationAsRead } from '@/lib/services/chat-service';

/**
 * PATCH /api/chat/conversations/[id]/read - Mark conversation as read
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PATCH /api/chat/conversations/${id}/read - Marking as read`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await markConversationAsRead(id, userId);

    console.log(`✓ Conversation marked as read: ${id}`);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
    logError(error, { endpoint: '/api/chat/conversations/[id]/read', method: 'PATCH' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

