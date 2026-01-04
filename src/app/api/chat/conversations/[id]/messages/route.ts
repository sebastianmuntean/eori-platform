import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import {
  getConversationMessages,
  createMessage,
} from '@/lib/services/chat-service';
import { broadcastMessage } from '@/lib/services/chat-sse-service';
import { CHAT_CONFIG, validateMessageContent } from '@/lib/config/chat-config';
import { z } from 'zod';

const createMessageSchema = z.object({
  content: z.string().nullable().optional().refine(
    (val) => !val || validateMessageContent(val).valid,
    {
      message: `Message content exceeds ${CHAT_CONFIG.MAX_MESSAGE_LENGTH_DISPLAY} character limit`,
    }
  ),
});

/**
 * GET /api/chat/conversations/[id]/messages - Get messages for a conversation
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/chat/conversations/${id}/messages - Fetching messages`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const beforeMessageId = searchParams.get('beforeMessageId') || undefined;

    const result = await getConversationMessages(id, userId, {
      page,
      pageSize,
      beforeMessageId,
    });

    console.log(`✓ Fetched ${result.messages.length} messages`);

    return NextResponse.json({
      success: true,
      data: result.messages,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    logError(error, { endpoint: '/api/chat/conversations/[id]/messages', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/chat/conversations/[id]/messages - Send a new message
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/chat/conversations/${id}/messages - Sending message`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createMessageSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Content or attachments must be provided
    if (!content && (!body.attachments || body.attachments.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Message content or attachments required' },
        { status: 400 }
      );
    }

    const result = await createMessage(id, userId, content || null);

    // Broadcast message via SSE
    await broadcastMessage(id, result.id);

    console.log(`✓ Message sent with ID: ${result.id}`);

    return NextResponse.json(
      {
        success: true,
        data: { id: result.id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error sending message:', error);
    logError(error, { endpoint: '/api/chat/conversations/[id]/messages', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

