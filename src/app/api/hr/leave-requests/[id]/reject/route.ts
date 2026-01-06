import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendLeaveRequestRejectionNotification } from '@/lib/services/hr-notifications';

const rejectLeaveRequestSchema = z.object({
  rejectionReason: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = rejectLeaveRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [leaveRequest] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: data.rejectionReason || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    // Send notification email (non-blocking)
    sendLeaveRequestRejectionNotification(id, data.rejectionReason).catch((error) => {
      console.error('Failed to send leave request rejection notification:', error);
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests/[id]/reject', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


