import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentWorkflow, departments, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';

const routeDocumentSchema = z.object({
  toUserId: z.string().uuid().optional().nullable(),
  toDepartmentId: z.string().uuid().optional().nullable(),
  action: z.enum(['sent', 'received', 'resolved', 'returned', 'approved', 'rejected']),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registratura/documents/[id]/workflow - Get workflow history
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/registratura/documents/${id}/workflow - Fetching workflow history`);

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

    // Get workflow history
    const workflowHistory = await db
      .select()
      .from(documentWorkflow)
      .where(eq(documentWorkflow.documentId, id))
      .orderBy(desc(documentWorkflow.createdAt));

    return NextResponse.json({
      success: true,
      data: workflowHistory,
    });
  } catch (error) {
    console.error('❌ Error fetching workflow history:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/workflow', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/documents/[id]/workflow - Route/send document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/documents/${id}/workflow - Routing document`);

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

    // Validate that at least one destination is provided
    if (!data.toUserId && !data.toDepartmentId) {
      return NextResponse.json(
        { success: false, error: 'Either toUserId or toDepartmentId must be provided' },
        { status: 400 }
      );
    }

    // Validate user/department exists if provided
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

    if (data.toDepartmentId) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, data.toDepartmentId))
        .limit(1);

      if (!dept) {
        return NextResponse.json(
          { success: false, error: 'Department not found' },
          { status: 400 }
        );
      }
    }

    // Get current user's department (if any) - simplified, you might want to add user-department relation
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Create workflow record
    const [workflowRecord] = await db
      .insert(documentWorkflow)
      .values({
        documentId: id,
        fromUserId: userId,
        toUserId: data.toUserId || null,
        toDepartmentId: data.toDepartmentId || null,
        action: data.action,
        resolution: data.resolution || null,
        notes: data.notes || null,
        isExpired: false,
      })
      .returning();

    // Update document status based on action
    let newStatus = document.status;
    if (data.action === 'sent' || data.action === 'received') {
      newStatus = 'in_work';
    } else if (data.action === 'resolved') {
      newStatus = 'resolved';
    }

    // Update document
    await db
      .update(documentRegistry)
      .set({
        status: newStatus,
        assignedTo: data.toUserId || document.assignedTo,
        departmentId: data.toDepartmentId || document.departmentId,
        updatedBy: userId,
        updatedAt: new Date(),
        ...(data.action === 'resolved' && !document.resolvedDate
          ? { resolvedDate: new Date() }
          : {}),
      })
      .where(eq(documentRegistry.id, id));

    console.log(`✓ Document routed successfully`);
    return NextResponse.json(
      {
        success: true,
        data: workflowRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error routing document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/workflow', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


