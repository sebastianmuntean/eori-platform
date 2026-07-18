import { db } from '@/database/client';
import { documentRegistry, documentConnections } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const createConnectionSchema = z.object({
  connectedDocumentId: z.string().uuid('Invalid connected document ID'),
  connectionType: z.enum(['related', 'response', 'attachment', 'amendment']),
});

/**
 * GET /api/registry/documents/[id]/connections - Get connected documents
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

    const connections = await db
      .select()
      .from(documentConnections)
      .where(
        or(
          eq(documentConnections.documentId, id),
          eq(documentConnections.connectedDocumentId, id)
        )
      );

    const connectedDocumentIds = connections.map((conn) =>
      conn.documentId === id ? conn.connectedDocumentId : conn.documentId
    );

    const connectedDocuments = connectedDocumentIds.length > 0
      ? await db
          .select()
          .from(documentRegistry)
          .where(
            and(
              or(...connectedDocumentIds.map((docId) => eq(documentRegistry.id, docId))),
              isNull(documentRegistry.deletedAt)
            )
          )
      : [];

    const connectionsWithDetails = connections.map((conn) => {
      const connectedDocId = conn.documentId === id ? conn.connectedDocumentId : conn.documentId;
      const connectedDoc = connectedDocuments.find((doc) => doc.id === connectedDocId);
      return {
        ...conn,
        connectedDocument: connectedDoc,
      };
    });

    return createSuccessResponse(connectionsWithDetails);
  }, { endpoint: '/api/registry/documents/[id]/connections', method: 'GET' });
}

/**
 * POST /api/registry/documents/[id]/connections - Add connection
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
    const validation = createConnectionSchema.safeParse(body);

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

    const [connectedDocument] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, data.connectedDocumentId), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!connectedDocument) {
      return createErrorResponse('Connected document not found', 404);
    }

    const [existingConnection] = await db
      .select()
      .from(documentConnections)
      .where(
        and(
          eq(documentConnections.documentId, id),
          eq(documentConnections.connectedDocumentId, data.connectedDocumentId)
        )
      )
      .limit(1);

    if (existingConnection) {
      return createErrorResponse('Connection already exists', 400);
    }

    const [newConnection] = await db
      .insert(documentConnections)
      .values({
        documentId: id,
        connectedDocumentId: data.connectedDocumentId,
        connectionType: data.connectionType,
      })
      .returning();

    return createSuccessResponse(newConnection);
  }, { endpoint: '/api/registry/documents/[id]/connections', method: 'POST' });
}
