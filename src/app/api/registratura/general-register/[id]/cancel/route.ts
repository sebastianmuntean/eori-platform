import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const cancelDocumentSchema = z.object({
  cancelAll: z.boolean().optional().default(false), // If true, cancel all branches (only for creator), if false, cancel only user's branch
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/registratura/general-register/[id]/cancel - Cancel document or workflow branch
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/general-register/${id}/cancel - Cancelling document`);

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
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    const isCreator = document.createdBy === userId;

    // If cancelAll is true, user must be the creator
    if (data.cancelAll && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'Only document creator can cancel all branches' },
        { status: 403 }
      );
    }

    if (data.cancelAll) {
      // Cancel all workflow steps and the document
      await db
        .update(generalRegisterWorkflow)
        .set({
          stepStatus: 'completed',
          action: 'cancelled',
          notes: data.notes || null,
          completedAt: new Date(),
        })
        .where(eq(generalRegisterWorkflow.documentId, id));

      await db
        .update(generalRegister)
        .set({
          status: 'cancelled',
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(generalRegister.id, id));
    } else {
      // Cancel only pending steps for this user
      const userPendingSteps = await db
        .select()
        .from(generalRegisterWorkflow)
        .where(
          and(
            eq(generalRegisterWorkflow.documentId, id),
            eq(generalRegisterWorkflow.toUserId, userId),
            eq(generalRegisterWorkflow.stepStatus, 'pending')
          )
        );

      if (userPendingSteps.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No pending steps found for this user' },
          { status: 400 }
        );
      }

      // Cancel user's pending steps
      for (const step of userPendingSteps) {
        await db
          .update(generalRegisterWorkflow)
          .set({
            stepStatus: 'completed',
            action: 'cancelled',
            notes: data.notes || null,
            completedAt: new Date(),
          })
          .where(eq(generalRegisterWorkflow.id, step.id));
      }

      // Check if all steps are now cancelled or completed
      const allSteps = await db
        .select()
        .from(generalRegisterWorkflow)
        .where(eq(generalRegisterWorkflow.documentId, id));

      const allCompleted = allSteps.every(step => step.stepStatus === 'completed');
      
      // Update document status if all steps are completed
      if (allCompleted) {
        await db
          .update(generalRegister)
          .set({
            status: 'cancelled',
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(generalRegister.id, id));
      }
    }

    console.log(`✓ Document/workflow cancelled successfully`);
    return NextResponse.json(
      {
        success: true,
        data: {
          documentId: id,
          cancelledAll: data.cancelAll,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error cancelling document:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/cancel', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




