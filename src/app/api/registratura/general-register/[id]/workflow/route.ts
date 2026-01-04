import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const routeDocumentSchema = z.object({
  parentStepId: z.string().uuid().optional().nullable(),
  toUserId: z.string().uuid(),
  action: z.enum(['sent', 'forwarded', 'returned']),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registratura/general-register/[id]/workflow - Get workflow history as tree
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/registratura/general-register/${id}/workflow - Fetching workflow history`);

  try {
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

    // Get all workflow steps for this document
    const workflowSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(eq(generalRegisterWorkflow.documentId, id))
      .orderBy(desc(generalRegisterWorkflow.createdAt));

    // Build tree structure
    const stepMap = new Map(workflowSteps.map(step => [step.id, { ...step, children: [] }]));
    const rootSteps: any[] = [];

    for (const step of workflowSteps) {
      const stepWithChildren = stepMap.get(step.id)!;
      if (step.parentStepId) {
        const parent = stepMap.get(step.parentStepId);
        if (parent) {
          parent.children.push(stepWithChildren);
        }
      } else {
        rootSteps.push(stepWithChildren);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        steps: workflowSteps,
        tree: rootSteps,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching workflow history:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/workflow', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/general-register/[id]/workflow - Create workflow step (forward/return document)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/general-register/${id}/workflow - Creating workflow step`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = routeDocumentSchema.safeParse(body);

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

    // Validate user exists
    if (data.toUserId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, data.toUserId))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 400 }
        );
      }
    }

    // If parentStepId is provided, validate it exists and belongs to this document
    if (data.parentStepId) {
      const [parentStep] = await db
        .select()
        .from(generalRegisterWorkflow)
        .where(
          and(
            eq(generalRegisterWorkflow.id, data.parentStepId),
            eq(generalRegisterWorkflow.documentId, id)
          )
        )
        .limit(1);

      if (!parentStep) {
        return NextResponse.json(
          { success: false, error: 'Parent step not found' },
          { status: 400 }
        );
      }
    }

    // Create workflow step
    console.log(`[API POST /api/registratura/general-register/${id}/workflow] Inserting workflow step into table: general_register_workflow`);
    const [workflowStep] = await db
      .insert(generalRegisterWorkflow)
      .values({
        documentId: id,
        parentStepId: data.parentStepId || null,
        fromUserId: userId,
        toUserId: data.toUserId,
        action: data.action,
        stepStatus: 'pending',
        notes: data.notes || null,
        isExpired: false,
      })
      .returning();

    // Update document status to 'in_work' or 'distributed' if not already
    if (document.status === 'draft' || document.status === 'registered') {
      console.log(`[API POST /api/registratura/general-register/${id}/workflow] Updating document in table: general_register`);
      await db
        .update(generalRegister)
        .set({
          status: 'distributed',
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(generalRegister.id, id));
    } else if (document.status !== 'in_work' && document.status !== 'distributed') {
      console.log(`[API POST /api/registratura/general-register/${id}/workflow] Updating document in table: general_register`);
      await db
        .update(generalRegister)
        .set({
          status: 'in_work',
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(generalRegister.id, id));
    }

    console.log(`✓ Workflow step created successfully`);
    return NextResponse.json(
      {
        success: true,
        data: workflowStep,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating workflow step:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/workflow', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


