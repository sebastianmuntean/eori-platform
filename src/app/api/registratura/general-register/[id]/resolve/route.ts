import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow, generalRegisterResolutionStatusEnum } from '@/database/schema/register';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { eq, and, or, isNull } from 'drizzle-orm';
import { z } from 'zod';

const resolveDocumentSchema = z.object({
  resolutionStatus: z.enum(generalRegisterResolutionStatusEnum.enumValues as [string, ...string[]]),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  workflowStepId: z.string().uuid().optional().nullable(), // Optional: specific step to resolve, otherwise resolve all pending steps for user
});

/**
 * POST /api/registratura/general-register/[id]/resolve - Resolve document with approval/rejection
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/general-register/${id}/resolve - Resolving document`);

  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
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

    // Check permission: user must have resolve_any permission OR be creator OR have pending step
    const hasResolveAnyPermission = await hasPermission(userId, 'general_register.resolve_any');
    const isCreator = document.createdBy === userId;

    // Find pending steps for this user
    let stepsToUpdate: typeof generalRegisterWorkflow.$inferSelect[] = [];
    if (data.workflowStepId) {
      // Resolve specific step
      const [step] = await db
        .select()
        .from(generalRegisterWorkflow)
        .where(
          and(
            eq(generalRegisterWorkflow.id, data.workflowStepId),
            eq(generalRegisterWorkflow.documentId, id),
            eq(generalRegisterWorkflow.toUserId, userId),
            eq(generalRegisterWorkflow.stepStatus, 'pending')
          )
        )
        .limit(1);
      if (step) {
        stepsToUpdate = [step];
      }
    } else {
      // Find all pending steps for this user
      stepsToUpdate = await db
        .select()
        .from(generalRegisterWorkflow)
        .where(
          and(
            eq(generalRegisterWorkflow.documentId, id),
            eq(generalRegisterWorkflow.toUserId, userId),
            eq(generalRegisterWorkflow.stepStatus, 'pending')
          )
        );
    }

    const hasPendingStep = stepsToUpdate.length > 0;

    if (!hasResolveAnyPermission && !isCreator && !hasPendingStep) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to resolve this document' },
        { status: 403 }
      );
    }

    if (stepsToUpdate.length === 0 && !hasResolveAnyPermission && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'No pending steps found for this user' },
        { status: 400 }
      );
    }

    // If no specific step and user has permission/is creator, create a resolution step
    if (stepsToUpdate.length === 0 && (hasResolveAnyPermission || isCreator)) {
      console.log(`[API POST /api/registratura/general-register/${id}/resolve] Inserting resolution step into table: general_register_workflow`);
      const [newStep] = await db
        .insert(generalRegisterWorkflow)
        .values({
          documentId: id,
          parentStepId: null,
          fromUserId: userId,
          toUserId: userId, // Self-resolution
          action: (data.resolutionStatus === 'approved' ? 'approved' : 'rejected') as 'approved' | 'rejected',
          stepStatus: 'completed' as const,
          resolutionStatus: data.resolutionStatus as 'approved' | 'rejected',
          resolution: data.resolution || null,
          notes: data.notes || null,
          isExpired: false,
          completedAt: new Date(),
        })
        .returning();
      
      stepsToUpdate.push(newStep);
    } else {
      // Update existing pending steps
      for (const step of stepsToUpdate) {
        console.log(`[API POST /api/registratura/general-register/${id}/resolve] Updating workflow step in table: general_register_workflow, step ID: ${step.id}`);
        await db
          .update(generalRegisterWorkflow)
          .set({
            stepStatus: 'completed' as const,
            resolutionStatus: data.resolutionStatus as 'approved' | 'rejected',
            resolution: data.resolution || null,
            notes: data.notes || null,
            completedAt: new Date(),
          })
          .where(eq(generalRegisterWorkflow.id, step.id));
      }
    }

    // Check if all steps are completed to update document status
    const allSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(eq(generalRegisterWorkflow.documentId, id));

    const allCompleted = allSteps.every(step => step.stepStatus === 'completed');
    const hasApproved = allSteps.some(step => step.resolutionStatus === 'approved');

    // Update document status
    let newStatus: 'draft' | 'registered' | 'in_work' | 'distributed' | 'resolved' | 'archived' | 'cancelled' = document.status;
    if (allCompleted) {
      newStatus = 'resolved';
    } else if (document.status !== 'in_work' && document.status !== 'distributed') {
      newStatus = 'in_work';
    }

    await db
      .update(generalRegister)
      .set({
        status: newStatus,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(generalRegister.id, id));

    console.log(`✓ Document resolved successfully`);
    return NextResponse.json(
      {
        success: true,
        data: {
          documentId: id,
          resolutionStatus: data.resolutionStatus,
          stepsUpdated: stepsToUpdate.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error resolving document:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/resolve', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

