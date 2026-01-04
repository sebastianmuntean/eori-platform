import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { getConversationById, markConversationAsRead } from '@/lib/services/chat-service';

/**
 * GET /api/chat/conversations/[id] - Get conversation details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/chat/conversations/${id} - Fetching conversation`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const conversation = await getConversationById(id, userId);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Conversation fetched: ${id}`);

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    logError(error, { endpoint: '/api/chat/conversations/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


