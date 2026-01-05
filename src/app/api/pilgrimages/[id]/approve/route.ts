import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimages, pilgrimageWorkflow } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

/**
 * POST /api/pilgrimages/[id]/approve - Approve a pilgrimage
 */
export async function POST(
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

    const hasPermission = await checkPermission('pilgrimages:update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    if (pilgrimage.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Only draft pilgrimages can be approved' },
        { status: 400 }
      );
    }

    const [updatedPilgrimage] = await db
      .update(pilgrimages)
      .set({
        status: 'open',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(pilgrimages.id, id))
      .returning();

    // Record workflow
    await db.insert(pilgrimageWorkflow).values({
      pilgrimageId: id,
      action: 'approved',
      fromStatus: 'draft',
      toStatus: 'open',
      performedBy: userId,
    });

    return NextResponse.json({
      success: true,
      data: updatedPilgrimage,
    });
  } catch (error) {
    console.error('❌ Error approving pilgrimage:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/approve', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

