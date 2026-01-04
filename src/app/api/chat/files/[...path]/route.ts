import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/database/client';
import { messageAttachments, conversationParticipants, messages } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/chat/files/[...path] - Serve chat file attachments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const fileName = pathArray[pathArray.length - 1];

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return new NextResponse('Not authenticated', { status: 401 });
    }

    // Find attachment by storage name
    const [attachment] = await db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.storageName, fileName))
      .limit(1);

    if (!attachment) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Get message to get conversationId
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, attachment.messageId))
      .limit(1);

    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    // Verify user is participant
    const [userParticipant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, message.conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (!userParticipant) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Check if file exists
    if (!existsSync(attachment.storagePath)) {
      return new NextResponse('File not found on disk', { status: 404 });
    }

    // Read and serve file
    const fileBuffer = await readFile(attachment.storagePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${attachment.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving chat file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

