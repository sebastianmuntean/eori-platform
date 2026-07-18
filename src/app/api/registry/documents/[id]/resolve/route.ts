import { db } from '@/database/client';
import { documentRegistry, documentWorkflow } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const resolveDocumentSchema = z.object({
  resolutionStatus: z.enum(['approved', 'rejected']).optional(),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/registry/documents/[id]/resolve - Resolve document
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
    const validation = resolveDocumentSchema.safeParse(body);

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

    const action =
      data.resolutionStatus === 'approved'
        ? 'approved'
        : data.resolutionStatus === 'rejected'
          ? 'rejected'
          : 'resolved';

    const [workflowRecord] = await db
      .insert(documentWorkflow)
      .values({
        documentId: id,
        fromUserId: userId,
        action: action,
        resolution: data.resolution || null,
        notes: data.notes || null,
        isExpired: false,
      })
      .returning();

    const today = new Date().toISOString().split('T')[0];
    const [updatedDocument] = await db
      .update(documentRegistry)
      .set({
        status: 'resolved',
        resolvedDate: today,
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
      workflow: workflowRecord,
    });
  }, { endpoint: '/api/registry/documents/[id]/resolve', method: 'POST' });
}
