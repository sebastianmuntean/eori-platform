import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sendLeaveRequestApprovalNotification } from '@/lib/services/hr-notifications';

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

    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Leave request not found' },
        { status: 404 }
      );
    }

    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    // Send notification email (non-blocking)
    sendLeaveRequestApprovalNotification(id).catch((error) => {
      console.error('Failed to send leave request approval notification:', error);
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests/[id]/approve', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


