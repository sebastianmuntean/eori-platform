import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sendSalaryApprovalNotification } from '@/lib/services/hr-notifications';

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

    const [salary] = await db
      .select()
      .from(salaries)
      .where(eq(salaries.id, id))
      .limit(1);

    if (!salary) {
      return NextResponse.json(
        { success: false, error: 'Salary not found' },
        { status: 404 }
      );
    }

    const [updatedSalary] = await db
      .update(salaries)
      .set({
        status: 'approved',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(salaries.id, id))
      .returning();

    // Send notification email (non-blocking)
    sendSalaryApprovalNotification(id).catch((error) => {
      console.error('Failed to send salary approval notification:', error);
    });

    return NextResponse.json({
      success: true,
      data: updatedSalary,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries/[id]/approve', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

