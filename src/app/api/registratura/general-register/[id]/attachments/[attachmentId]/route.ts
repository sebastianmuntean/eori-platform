import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * DELETE /api/registratura/general-register/[id]/attachments/[attachmentId] - Delete attachment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  console.log(`Step 1: DELETE /api/registratura/general-register/${id}/attachments/${attachmentId} - Deleting attachment`);

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
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
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
      .from(generalRegisterAttachments)
      .where(
        and(
          eq(generalRegisterAttachments.id, attachmentId),
          eq(generalRegisterAttachments.documentId, id)
        )
      )
      .limit(1);

    if (!attachment) {
      console.log(`❌ Attachment ${attachmentId} not found`);
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check permission - only creator or document creator can delete
    if (attachment.uploadedBy !== userId && document.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this attachment' },
        { status: 403 }
      );
    }

    // Delete file from storage
    if (existsSync(attachment.storagePath)) {
      try {
        await unlink(attachment.storagePath);
      } catch (error) {
        console.error('❌ Failed to delete file from storage:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete attachment record
    console.log(`[API DELETE /api/registratura/general-register/${id}/attachments/${attachmentId}] Deleting attachment from table: general_register_attachments`);
    await db
      .delete(generalRegisterAttachments)
      .where(eq(generalRegisterAttachments.id, attachmentId));

    console.log(`[API DELETE /api/registratura/general-register/${id}/attachments/${attachmentId}] ✓ Attachment deleted successfully from table: general_register_attachments, ID: ${attachmentId}`);
    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting attachment:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/attachments/[attachmentId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


