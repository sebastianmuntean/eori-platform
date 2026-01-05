import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { timeEntries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sendTimeEntryApprovalNotification } from '@/lib/services/hr-notifications';

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

    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id))
      .limit(1);

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Time entry not found' },
        { status: 404 }
      );
    }

    const [updatedEntry] = await db
      .update(timeEntries)
      .set({
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, id))
      .returning();

    // Send notification email (non-blocking)
    sendTimeEntryApprovalNotification(id).catch((error) => {
      console.error('Failed to send time entry approval notification:', error);
    });

    return NextResponse.json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/time-entries/[id]/approve', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


