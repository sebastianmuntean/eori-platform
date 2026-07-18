import { db } from '@/database/client';
import { documentRegistry, documentWorkflow, departments, users } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const routeDocumentSchema = z.object({
  toUserId: z.string().uuid().optional().nullable(),
  toDepartmentId: z.string().uuid().optional().nullable(),
  action: z.enum(['sent', 'received', 'resolved', 'returned', 'approved', 'rejected']),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registry/documents/[id]/workflow - Get workflow history
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);

    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

    const workflowHistory = await db
      .select()
      .from(documentWorkflow)
      .where(eq(documentWorkflow.documentId, id))
      .orderBy(desc(documentWorkflow.createdAt));

    return createSuccessResponse(workflowHistory);
  }, { endpoint: '/api/registry/documents/[id]/workflow', method: 'GET' });
}

/**
 * POST /api/registry/documents/[id]/workflow - Route/send document
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
    const validation = routeDocumentSchema.safeParse(body);

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

    if (!data.toUserId && !data.toDepartmentId) {
      return createErrorResponse('Either toUserId or toDepartmentId must be provided', 400);
    }

    if (data.toUserId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, data.toUserId))
        .limit(1);

      if (!user) {
        return createErrorResponse('User not found', 400);
      }
    }

    if (data.toDepartmentId) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, data.toDepartmentId))
        .limit(1);

      if (!dept) {
        return createErrorResponse('Department not found', 400);
      }
    }

    const [workflowRecord] = await db
      .insert(documentWorkflow)
      .values({
        documentId: id,
        fromUserId: userId,
        toUserId: data.toUserId || null,
        toDepartmentId: data.toDepartmentId || null,
        action: data.action,
        resolution: data.resolution || null,
        notes: data.notes || null,
        isExpired: false,
      })
      .returning();

    let newStatus = document.status;
    if (data.action === 'sent' || data.action === 'received') {
      newStatus = 'in_work';
    } else if (data.action === 'resolved') {
      newStatus = 'resolved';
    }

    await db
      .update(documentRegistry)
      .set({
        status: newStatus,
        assignedTo: data.toUserId || document.assignedTo,
        departmentId: data.toDepartmentId || document.departmentId,
        updatedBy: userId,
        updatedAt: new Date(),
        ...(data.action === 'resolved' && !document.resolvedDate
          ? { resolvedDate: new Date().toISOString().split('T')[0] }
          : {}),
      })
      .where(eq(documentRegistry.id, id));

    return createSuccessResponse(workflowRecord);
  }, { endpoint: '/api/registry/documents/[id]/workflow', method: 'POST' });
}
