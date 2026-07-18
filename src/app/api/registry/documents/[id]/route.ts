import { db } from '@/database/client';
import { documentRegistry, generalRegister } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const updateDocumentSchema = z.object({
  documentType: z.enum(['incoming', 'outgoing', 'internal']).optional(),
  registrationDate: z.string().optional().nullable(),
  externalNumber: z.string().optional().nullable(),
  externalDate: z.string().optional().nullable(),
  senderClientId: z.string().uuid().optional().nullable(),
  senderName: z.string().optional().nullable(),
  senderDocNumber: z.string().optional().nullable(),
  senderDocDate: z.string().optional().nullable(),
  recipientClientId: z.string().uuid().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  subject: z.string().min(1).max(500).optional(),
  content: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  fileIndex: z.string().optional().nullable(),
  parentDocumentId: z.string().uuid().optional().nullable(),
  isSecret: z.boolean().optional(),
  secretDeclassificationList: z.array(z.string()).optional().nullable(),
});

/**
 * GET /api/registry/documents/[id] - Get document details
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
      const [generalRegisterDoc] = await db
        .select()
        .from(generalRegister)
        .where(eq(generalRegister.id, id))
        .limit(1);

      if (generalRegisterDoc) {
        return createErrorResponse('Document not found', 404);
      }

      return createErrorResponse('Document not found', 404);
    }

    return createSuccessResponse(document);
  }, { endpoint: '/api/registry/documents/[id]', method: 'GET' });
}

/**
 * PUT /api/registry/documents/[id] - Update document
 */
export async function PUT(
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
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    const [existingDocument] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!existingDocument) {
      return createErrorResponse('Document not found', 404);
    }

    const updateData: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (data.documentType !== undefined) updateData.documentType = data.documentType;
    if (data.registrationDate !== undefined) updateData.registrationDate = data.registrationDate ? new Date(data.registrationDate) : null;
    if (data.externalNumber !== undefined) updateData.externalNumber = data.externalNumber;
    if (data.externalDate !== undefined) updateData.externalDate = data.externalDate ? new Date(data.externalDate) : null;
    if (data.senderClientId !== undefined) updateData.senderClientId = data.senderClientId;
    if (data.senderName !== undefined) updateData.senderName = data.senderName;
    if (data.senderDocNumber !== undefined) updateData.senderDocNumber = data.senderDocNumber;
    if (data.senderDocDate !== undefined) updateData.senderDocDate = data.senderDocDate ? new Date(data.senderDocDate) : null;
    if (data.recipientClientId !== undefined) updateData.recipientClientId = data.recipientClientId;
    if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.fileIndex !== undefined) updateData.fileIndex = data.fileIndex;
    if (data.parentDocumentId !== undefined) updateData.parentDocumentId = data.parentDocumentId;
    if (data.isSecret !== undefined) updateData.isSecret = data.isSecret;
    if (data.secretDeclassificationList !== undefined) updateData.secretDeclassificationList = data.secretDeclassificationList;

    const [updatedDocument] = await db
      .update(documentRegistry)
      .set(updateData)
      .where(eq(documentRegistry.id, id))
      .returning();

    if (!updatedDocument) {
      return createErrorResponse('Document not found', 404);
    }

    return createSuccessResponse(updatedDocument);
  }, { endpoint: '/api/registry/documents/[id]', method: 'PUT' });
}

/**
 * DELETE /api/registry/documents/[id] - Soft delete document
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_DELETE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [existingDocument] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!existingDocument) {
      return createErrorResponse('Document not found', 404);
    }

    const [deletedDocument] = await db
      .update(documentRegistry)
      .set({
        deletedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(documentRegistry.id, id))
      .returning();

    if (!deletedDocument) {
      return createErrorResponse('Document not found', 404);
    }

    return createSuccessResponse(deletedDocument);
  }, { endpoint: '/api/registry/documents/[id]', method: 'DELETE' });
}
