import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentWorkflow } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const resolveDocumentSchema = z.object({
  resolutionStatus: z.enum(['approved', 'rejected']).optional(),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/registratura/documents/[id]/resolve - Resolve document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/documents/${id}/resolve - Resolving document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = resolveDocumentSchema.safeParse(body);

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

    // Determine action based on resolutionStatus
    const action = data.resolutionStatus === 'approved' ? 'approved' : data.resolutionStatus === 'rejected' ? 'rejected' : 'resolved';
    
    // Create workflow record for resolution
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

    // Update document status
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
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
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Document resolved successfully`);
    return NextResponse.json({
      success: true,
      data: updatedDocument,
      workflow: workflowRecord,
    });
  } catch (error) {
    console.error('❌ Error resolving document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/resolve', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

