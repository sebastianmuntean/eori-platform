import { db } from '@/database/client';
import { documentRegistry, documentAttachments } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * DELETE /api/registry/documents/[id]/attachments/[attachmentId] - Delete attachment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_UPDATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

    const [attachment] = await db
      .select()
      .from(documentAttachments)
      .where(and(eq(documentAttachments.id, attachmentId), eq(documentAttachments.documentId, id)))
      .limit(1);

    if (!attachment) {
      return createErrorResponse('Attachment not found', 404);
    }

    try {
      if (existsSync(attachment.storagePath)) {
        await unlink(attachment.storagePath);
      }
    } catch {
      // Continue with database deletion even if file deletion fails
    }

    const [deletedAttachment] = await db
      .delete(documentAttachments)
      .where(eq(documentAttachments.id, attachmentId))
      .returning();

    if (!deletedAttachment) {
      return createErrorResponse('Attachment not found', 404);
    }

    return createSuccessResponse(deletedAttachment);
  }, { endpoint: '/api/registry/documents/[id]/attachments/[attachmentId]', method: 'DELETE' });
}
