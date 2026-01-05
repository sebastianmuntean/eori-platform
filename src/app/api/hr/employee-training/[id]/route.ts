import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employeeTraining } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateEmployeeTrainingSchema = z.object({
  employeeId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'cancelled']).optional(),
  score: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  certificateNumber: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
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

    return NextResponse.json({
      success: true,
      data: training,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employee-training/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updateEmployeeTrainingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.courseId !== undefined) updateData.courseId = data.courseId;
    if (data.enrollmentDate !== undefined) updateData.enrollmentDate = data.enrollmentDate;
    if (data.completionDate !== undefined) updateData.completionDate = data.completionDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.certificateNumber !== undefined) updateData.certificateNumber = data.certificateNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedTraining] = await db
      .update(employeeTraining)
      .set(updateData)
      .where(eq(employeeTraining.id, id))
      .returning();

    if (!updatedTraining) {
      return NextResponse.json(
        { success: false, error: 'Employee training not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTraining,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employee-training/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [deletedTraining] = await db
      .delete(employeeTraining)
      .where(eq(employeeTraining.id, id))
      .returning();

    if (!deletedTraining) {
      return NextResponse.json(
        { success: false, error: 'Employee training not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedTraining,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employee-training/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



