import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import {
  createConversation,
  getUserConversations,
} from '@/lib/services/chat-service';
import { z } from 'zod';

const createConversationSchema = z.object({
  type: z.enum(['direct', 'group']),
  participantIds: z.array(z.string().uuid()).min(1),
  title: z.string().optional(),
});

/**
 * GET /api/chat/conversations - List user's conversations
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/chat/conversations - Fetching conversations');

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
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getUserConversations(userId, { page, pageSize });

    console.log(`✓ Fetched ${result.conversations.length} conversations`);

    return NextResponse.json({
      success: true,
      data: result.conversations,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    logError(error, { endpoint: '/api/chat/conversations', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/chat/conversations - Create a new conversation
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/chat/conversations - Creating conversation');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { type, participantIds, title } = validation.data;

    // Validate title for group conversations
    if (type === 'group' && !title) {
      return NextResponse.json(
        { success: false, error: 'Title is required for group conversations' },
        { status: 400 }
      );
    }

    const result = await createConversation({
      userId,
      type,
      participantIds,
      title,
    });

    console.log(`✓ Conversation created with ID: ${result.id}`);

    return NextResponse.json(
      {
        success: true,
        data: { id: result.id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    logError(error, { endpoint: '/api/chat/conversations', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

