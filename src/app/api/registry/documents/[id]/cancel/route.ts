import { db } from '@/database/client';
import { documentRegistry, documentWorkflow } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const cancelDocumentSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/registry/documents/[id]/cancel - Cancel document
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
    const validation = cancelDocumentSchema.safeParse(body);

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

    await db
      .update(documentRegistry)
      .set({
        status: 'archived',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(documentRegistry.id, id));

    await db
      .insert(documentWorkflow)
      .values({
        documentId: id,
        fromUserId: userId,
        action: 'rejected',
        notes: data.notes || 'Document anulat',
        isExpired: false,
      });

    return createSuccessResponse({ documentId: id });
  }, { endpoint: '/api/registry/documents/[id]/cancel', method: 'POST' });
}
