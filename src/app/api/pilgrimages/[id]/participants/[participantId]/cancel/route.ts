import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageParticipants } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

/**
 * POST /api/pilgrimages/[id]/participants/[participantId]/cancel - Cancel a participant
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { id, participantId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(participantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const hasPermission = await checkPermission('pilgrimages.update');
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

    const [participant] = await db
      .select()
      .from(pilgrimageParticipants)
      .where(
        and(
          eq(pilgrimageParticipants.id, participantId),
          eq(pilgrimageParticipants.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    const [updatedParticipant] = await db
      .update(pilgrimageParticipants)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(pilgrimageParticipants.id, participantId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedParticipant,
    });
  } catch (error) {
    console.error('❌ Error cancelling participant:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/participants/[participantId]/cancel', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

