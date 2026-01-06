import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employeeTraining } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const completeTrainingSchema = z.object({
  completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  score: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  certificateNumber: z.string().max(100).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const validation = completeTrainingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [training] = await db
      .select()
      .from(employeeTraining)
      .where(eq(employeeTraining.id, id))
      .limit(1);

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Employee training not found' },
        { status: 404 }
      );
    }

    const completionDate = data.completionDate || new Date().toISOString().split('T')[0];

    const [updatedTraining] = await db
      .update(employeeTraining)
      .set({
        status: 'completed',
        completionDate,
        score: data.score || null,
        certificateNumber: data.certificateNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(employeeTraining.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedTraining,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employee-training/[id]/complete', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







