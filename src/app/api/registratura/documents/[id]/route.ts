import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, parishes, clients, departments, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

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
 * GET /api/registratura/documents/[id] - Get document details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/registratura/documents/${id} - Fetching document`);

  try {
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

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('❌ Error fetching document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/registratura/documents/[id] - Update document
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PUT /api/registratura/documents/${id} - Updating document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if document exists
    const [existingDocument] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!existingDocument) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
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
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Document updated successfully: ${updatedDocument.id}`);
    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error('❌ Error updating document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/registratura/documents/[id] - Soft delete document
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: DELETE /api/registratura/documents/${id} - Deleting document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if document exists
    const [existingDocument] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!existingDocument) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Soft delete
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
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Document deleted successfully: ${deletedDocument.id}`);
    return NextResponse.json({
      success: true,
      data: deletedDocument,
    });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


