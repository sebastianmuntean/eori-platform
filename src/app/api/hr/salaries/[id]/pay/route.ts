import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendSalaryPaymentNotification } from '@/lib/services/hr-notifications';

const paySalarySchema = z.object({
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentReference: z.string().max(100).optional().nullable(),
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
    const validation = paySalarySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

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

    const paidDate = data.paidDate || new Date().toISOString().split('T')[0];

    const [updatedSalary] = await db
      .update(salaries)
      .set({
        status: 'paid',
        paidDate,
        paymentReference: data.paymentReference || null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(salaries.id, id))
      .returning();

    // Send notification email (non-blocking)
    sendSalaryPaymentNotification(id).catch((error) => {
      console.error('Failed to send salary payment notification:', error);
    });

    return NextResponse.json({
      success: true,
      data: updatedSalary,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries/[id]/pay', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

