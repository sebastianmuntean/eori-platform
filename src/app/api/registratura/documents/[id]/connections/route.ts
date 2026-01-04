import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentConnections } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull, or } from 'drizzle-orm';
import { z } from 'zod';

const createConnectionSchema = z.object({
  connectedDocumentId: z.string().uuid('Invalid connected document ID'),
  connectionType: z.enum(['related', 'response', 'attachment', 'amendment']),
});

/**
 * GET /api/registratura/documents/[id]/connections - Get connected documents
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/registratura/documents/${id}/connections - Fetching connections`);

  try {
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

    // Get all connections (both directions)
    const connections = await db
      .select()
      .from(documentConnections)
      .where(
        or(
          eq(documentConnections.documentId, id),
          eq(documentConnections.connectedDocumentId, id)
        )
      );

    // Get connected documents details
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

    // Map connections with document details
    const connectionsWithDetails = connections.map((conn) => {
      const connectedDocId = conn.documentId === id ? conn.connectedDocumentId : conn.documentId;
      const connectedDoc = connectedDocuments.find((doc) => doc.id === connectedDocId);
      return {
        ...conn,
        connectedDocument: connectedDoc,
      };
    });

    return NextResponse.json({
      success: true,
      data: connectionsWithDetails,
    });
  } catch (error) {
    console.error('❌ Error fetching connections:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/connections', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/documents/[id]/connections - Add connection
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/documents/${id}/connections - Adding connection`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createConnectionSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

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

    // Check if connected document exists
    const [connectedDocument] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, data.connectedDocumentId), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!connectedDocument) {
      console.log(`❌ Connected document ${data.connectedDocumentId} not found`);
      return NextResponse.json(
        { success: false, error: 'Connected document not found' },
        { status: 404 }
      );
    }

    // Check if connection already exists
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
      return NextResponse.json(
        { success: false, error: 'Connection already exists' },
        { status: 400 }
      );
    }

    // Create connection
    const [newConnection] = await db
      .insert(documentConnections)
      .values({
        documentId: id,
        connectedDocumentId: data.connectedDocumentId,
        connectionType: data.connectionType,
      })
      .returning();

    console.log(`✓ Connection created successfully: ${newConnection.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newConnection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating connection:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/connections', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


