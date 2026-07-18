import { db } from '@/database/client';
import { documentRegistry, documentArchive } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const archiveDocumentSchema = z.object({
  archiveIndicator: z.string().max(50).optional().nullable(),
  archiveTerm: z.string().max(50).optional().nullable(),
  archiveLocation: z.string().max(255).optional().nullable(),
});

/**
 * POST /api/registry/documents/[id]/archive - Archive document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_UPDATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = archiveDocumentSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

    const [existingArchive] = await db
      .select()
      .from(documentArchive)
      .where(eq(documentArchive.documentId, id))
      .limit(1);

    if (existingArchive) {
      return createErrorResponse('Document already archived', 400);
    }

    const [archiveRecord] = await db
      .insert(documentArchive)
      .values({
        documentId: id,
        archiveIndicator: data.archiveIndicator || null,
        archiveTerm: data.archiveTerm || null,
        archiveLocation: data.archiveLocation || null,
        archivedBy: userId,
      })
      .returning();

    const [updatedDocument] = await db
      .update(documentRegistry)
      .set({
        status: 'archived',
        fileIndex: data.archiveIndicator || document.fileIndex,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(documentRegistry.id, id))
      .returning();

    if (!updatedDocument) {
      return createErrorResponse('Document not found', 404);
    }

    return createSuccessResponse({
      document: updatedDocument,
      archive: archiveRecord,
    });
  }, { endpoint: '/api/registry/documents/[id]/archive', method: 'POST' });
}
