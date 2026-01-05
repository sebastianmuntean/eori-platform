import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { trainingCourses } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateTrainingCourseSchema = z.object({
  parishId: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  provider: z.string().max(255).optional().nullable(),
  durationHours: z.number().int().min(0).optional().nullable(),
  cost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  isCertified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [course] = await db
      .select()
      .from(trainingCourses)
      .where(eq(trainingCourses.id, id))
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Training course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/training-courses/[id]', method: 'GET' });
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
    const validation = updateTrainingCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.durationHours !== undefined) updateData.durationHours = data.durationHours;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.isCertified !== undefined) updateData.isCertified = data.isCertified;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedCourse] = await db
      .update(trainingCourses)
      .set(updateData)
      .where(eq(trainingCourses.id, id))
      .returning();

    if (!updatedCourse) {
      return NextResponse.json(
        { success: false, error: 'Training course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/training-courses/[id]', method: 'PUT' });
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
    const [deletedCourse] = await db
      .delete(trainingCourses)
      .where(eq(trainingCourses.id, id))
      .returning();

    if (!deletedCourse) {
      return NextResponse.json(
        { success: false, error: 'Training course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedCourse,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/training-courses/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



