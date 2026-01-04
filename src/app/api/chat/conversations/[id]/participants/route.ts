import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { getConversationById, addParticipantsToConversation } from '@/lib/services/chat-service';
import { z } from 'zod';

const addParticipantsSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1, 'At least one participant is required'),
  accessFullHistory: z.boolean().default(false),
});

/**
 * POST /api/chat/conversations/[id]/participants - Add participants to conversation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user is participant in the conversation
    const conversation = await getConversationById(conversationId, userId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const validation = addParticipantsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }

    const { participantIds, accessFullHistory } = validation.data;

    await addParticipantsToConversation(conversationId, participantIds, accessFullHistory);

    return NextResponse.json({ success: true, message: 'Participants added successfully' });
  } catch (error) {
    logError(error, { endpoint: '/api/chat/conversations/[id]/participants', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), { status: formatErrorResponse(error).statusCode });
  }
}

