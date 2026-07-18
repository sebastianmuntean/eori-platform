import { db } from '@/database/client';
import { generalRegister, generalRegisterAttachments } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * DELETE /api/registry/general-register/[id]/attachments/[attachmentId] - Delete attachment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_UPDATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

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
      return createErrorResponse('Attachment not found', 404);
    }

    if (attachment.uploadedBy !== userId && document.createdBy !== userId) {
      return createErrorResponse('Not authorized to delete this attachment', 403);
    }

    if (existsSync(attachment.storagePath)) {
      try {
        await unlink(attachment.storagePath);
      } catch {
        // Continue with database deletion even if file deletion fails
      }
    }

    await db
      .delete(generalRegisterAttachments)
      .where(eq(generalRegisterAttachments.id, attachmentId));

    return createSuccessResponse(null, 'Attachment deleted successfully');
  }, { endpoint: '/api/registry/general-register/[id]/attachments/[attachmentId]', method: 'DELETE' });
}
