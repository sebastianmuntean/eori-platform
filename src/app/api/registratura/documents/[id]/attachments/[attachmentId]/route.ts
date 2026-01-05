import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * DELETE /api/registratura/documents/[id]/attachments/[attachmentId] - Delete attachment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  console.log(`Step 1: DELETE /api/registratura/documents/${id}/attachments/${attachmentId} - Deleting attachment`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if document exists
    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get attachment
    const [attachment] = await db
      .select()
      .from(documentAttachments)
      .where(and(eq(documentAttachments.id, attachmentId), eq(documentAttachments.documentId, id)))
      .limit(1);

    if (!attachment) {
      console.log(`❌ Attachment ${attachmentId} not found`);
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      if (existsSync(attachment.storagePath)) {
        await unlink(attachment.storagePath);
        console.log(`✓ File deleted: ${attachment.storagePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to delete file: ${error}`);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment record
    const [deletedAttachment] = await db
      .delete(documentAttachments)
      .where(eq(documentAttachments.id, attachmentId))
      .returning();

    if (!deletedAttachment) {
      console.log(`❌ Attachment ${attachmentId} not found after delete`);
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Attachment deleted successfully: ${deletedAttachment.id}`);
    return NextResponse.json({
      success: true,
      data: deletedAttachment,
    });
  } catch (error) {
    console.error('❌ Error deleting attachment:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/attachments/[attachmentId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




