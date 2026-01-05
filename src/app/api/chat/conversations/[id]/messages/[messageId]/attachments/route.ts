import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { uploadChatFile, validateChatFile } from '@/lib/services/chat-file-service';
import { broadcastMessage } from '@/lib/services/chat-sse-service';
import { db } from '@/database/client';
import { messages } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { CHAT_CONFIG } from '@/lib/config/chat-config';

/**
 * POST /api/chat/conversations/[id]/messages/[messageId]/attachments - Upload attachment for a message
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id: conversationId, messageId } = await params;
  console.log(`Step 1: POST /api/chat/conversations/${conversationId}/messages/${messageId}/attachments - Uploading attachment`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify message belongs to conversation and user is sender
    const [message] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        )
      )
      .limit(1);

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found or unauthorized' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateChatFile(file);
    if (!validation.valid) {
      console.log(`❌ File validation failed: ${validation.error}`);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload file
    const result = await uploadChatFile({
      conversationId,
      messageId,
      file,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      uploadedBy: userId,
    });

    // Broadcast message update via SSE
    await broadcastMessage(conversationId, messageId);

    console.log(`✓ Attachment uploaded successfully: ${result.id}`);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error uploading attachment:', error);
    logError(error, {
      endpoint: '/api/chat/conversations/[id]/messages/[messageId]/attachments',
      method: 'POST',
    });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

