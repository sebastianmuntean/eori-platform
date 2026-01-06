import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentWorkflow } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const cancelDocumentSchema = z.object({
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/registratura/documents/[id]/cancel - Cancel document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/documents/${id}/cancel - Cancelling document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = cancelDocumentSchema.safeParse(body);

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

    // Update document status to archived (closest equivalent to cancelled)
    await db
      .update(documentRegistry)
      .set({
        status: 'archived',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(documentRegistry.id, id));

    // Add workflow entry to record the cancellation
    await db
      .insert(documentWorkflow)
      .values({
        documentId: id,
        fromUserId: userId,
        action: 'rejected',
        notes: data.notes || 'Document anulat',
        isExpired: false,
      });

    console.log(`✓ Document cancelled successfully: ${id}`);
    return NextResponse.json(
      {
        success: true,
        data: {
          documentId: id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error cancelling document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/cancel', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}








