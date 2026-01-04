import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/registratura/general-register/[id] - Get document by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log(`Step 1: GET /api/registratura/general-register/[id] - Fetching document`);
    const { id } = await params;
    
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    console.log(`✓ Document ${id} found`);
    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/general-register/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

const updateDocumentSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500).optional(),
  description: z.string().optional().nullable(),
  solutionStatus: z.enum(['approved', 'rejected', 'redirected']).optional().nullable(),
  distributedUserIds: z.array(z.string().uuid()).optional().default([]),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type DocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
type SolutionStatus = 'approved' | 'rejected' | 'redirected' | null;

/**
 * Calculate document status based on solution status and distributed users
 */
function calculateStatusFromSolution(
  solutionStatus: SolutionStatus,
  distributedUserIds: string[]
): DocumentStatus {
  if (solutionStatus === 'approved' || solutionStatus === 'rejected') {
    return 'resolved';
  }
  
  if (solutionStatus === 'redirected' && distributedUserIds.length > 0) {
    return 'distributed';
  }
  
  if (!solutionStatus) {
    return distributedUserIds.length > 0 ? 'distributed' : 'in_work';
  }
  
  return 'in_work';
}

/**
 * Validate that all user IDs exist in the database
 */
async function validateUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }
  
  const validUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.id, userIds));
  
  const validUserIds = validUsers.map(user => user.id);
  const invalidUserIds = userIds.filter(id => !validUserIds.includes(id));
  
  if (invalidUserIds.length > 0) {
    console.log(`⚠️ Invalid user IDs found: ${invalidUserIds.join(', ')}`);
  }
  
  return validUserIds;
}

/**
 * Create initial workflow step for document creator
 */
async function createCreatorWorkflowStep(
  documentId: string,
  createdBy: string,
  solutionStatus: SolutionStatus,
  notes: string | null
): Promise<void> {
  const isResolved = solutionStatus === 'approved' || solutionStatus === 'rejected';
  
  await db.insert(generalRegisterWorkflow).values({
    documentId,
    parentStepId: null,
    fromUserId: createdBy,
    toUserId: createdBy,
    action: 'sent',
    stepStatus: 'completed',
    resolutionStatus: solutionStatus === 'approved' ? 'approved' : 
                     solutionStatus === 'rejected' ? 'rejected' : null,
    notes,
    isExpired: false,
    completedAt: isResolved ? new Date() : null,
  });
}

/**
 * Create workflow steps for distributed users
 */
async function createDistributionWorkflowSteps(
  documentId: string,
  createdBy: string,
  toUserIds: string[],
  notes: string | null
): Promise<void> {
  if (toUserIds.length === 0) {
    return;
  }
  
  const workflowSteps = toUserIds.map(toUserId => ({
    documentId,
    parentStepId: null,
    fromUserId: createdBy,
    toUserId,
    action: 'forwarded' as const,
    stepStatus: 'pending' as const,
    notes,
    isExpired: false,
  }));
  
  await db.insert(generalRegisterWorkflow).values(workflowSteps);
}

/**
 * Create resolution workflow step
 */
async function createResolutionWorkflowStep(
  documentId: string,
  userId: string,
  solutionStatus: 'approved' | 'rejected',
  notes: string | null
): Promise<void> {
  await db.insert(generalRegisterWorkflow).values({
    documentId,
    parentStepId: null,
    fromUserId: userId,
    toUserId: userId,
    action: solutionStatus,
    stepStatus: 'completed',
    resolutionStatus: solutionStatus,
    notes,
    isExpired: false,
    completedAt: new Date(),
  });
}

/**
 * PATCH /api/registratura/general-register/[id] - Update document with automatic status calculation
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[API PATCH /api/registratura/general-register/${id}] Request received`);

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

    // Validate and filter distributed user IDs
    const distributedUserIds = data.distributedUserIds || [];
    const validUserIds = await validateUserIds(distributedUserIds);
    
    if (validUserIds.length !== distributedUserIds.length) {
      console.log(`⚠️ Some user IDs were invalid, using only valid ones`);
    }

    // Calculate status automatically based on solution and distributions
    const newStatus = calculateStatusFromSolution(
      data.solutionStatus || null,
      validUserIds
    );

    // Prepare update data with proper types
    const updateData: {
      updatedBy: string;
      updatedAt: Date;
      status: DocumentStatus;
      subject?: string;
      description?: string | null;
      dueDate?: Date | null;
    } = {
      updatedBy: userId,
      updatedAt: new Date(),
      status: newStatus,
    };

    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Update document
    const [updatedDocument] = await db
      .update(generalRegister)
      .set(updateData)
      .where(eq(generalRegister.id, id))
      .returning();

    if (!updatedDocument) {
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // Check if workflow steps already exist for this document
    const existingSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(eq(generalRegisterWorkflow.documentId, id));

    // Only create workflow steps if this is the first save (no existing steps)
    if (existingSteps.length === 0) {
      // Create creator workflow step
      await createCreatorWorkflowStep(
        id,
        document.createdBy,
        data.solutionStatus || null,
        data.notes || null
      );

      // Create distribution workflow steps if users are distributed
      if (validUserIds.length > 0) {
        await createDistributionWorkflowSteps(
          id,
          document.createdBy,
          validUserIds,
          data.notes || null
        );
      }
    } else if (data.solutionStatus === 'approved' || data.solutionStatus === 'rejected') {
      // If workflow steps exist and we're resolving, create resolution step
      await createResolutionWorkflowStep(
        id,
        userId,
        data.solutionStatus,
        data.notes || null
      );
    }

    console.log(`✓ Document ${id} updated successfully with status: ${newStatus}`);
    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error('❌ Error updating document:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]', method: 'PATCH' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

