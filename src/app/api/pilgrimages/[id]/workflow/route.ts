import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageWorkflow, users } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

/**
 * GET /api/pilgrimages/[id]/workflow - Get workflow history for a pilgrimage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const workflowHistory = await db
      .select({
        id: pilgrimageWorkflow.id,
        action: pilgrimageWorkflow.action,
        fromStatus: pilgrimageWorkflow.fromStatus,
        toStatus: pilgrimageWorkflow.toStatus,
        notes: pilgrimageWorkflow.notes,
        createdAt: pilgrimageWorkflow.createdAt,
        performedBy: pilgrimageWorkflow.performedBy,
        performerName: users.name,
        performerEmail: users.email,
      })
      .from(pilgrimageWorkflow)
      .leftJoin(users, eq(pilgrimageWorkflow.performedBy, users.id))
      .where(eq(pilgrimageWorkflow.pilgrimageId, id))
      .orderBy(desc(pilgrimageWorkflow.createdAt));

    return NextResponse.json({
      success: true,
      data: workflowHistory,
    });
  } catch (error) {
    console.error('❌ Error fetching workflow history:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/workflow', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

