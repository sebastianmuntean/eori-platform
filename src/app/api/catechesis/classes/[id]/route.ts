import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisClasses } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateCatechesisClassSchema } from '@/lib/validations/catechesis/classes';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/classes/[id] - Get class by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { id } = await params;

    const [classItem] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, id))
      .limit(1);

    if (!classItem) {
      return createErrorResponse('Class not found', 404);
    }

    // Check parish access
    await requireParishAccess(classItem.parishId, false);

    return NextResponse.json(createSuccessResponse(classItem));
  }, { endpoint: '/api/catechesis/classes/[id]', method: 'GET' });
}

/**
 * PUT /api/catechesis/classes/[id] - Update class
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateCatechesisClassSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    // Check if class exists
    const [existingClass] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, id))
      .limit(1);

    if (!existingClass) {
      return createErrorResponse('Class not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingClass.parishId, true);

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.grade !== undefined) updateData.grade = data.grade;
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedClass] = await db
      .update(catechesisClasses)
      .set(updateData)
      .where(eq(catechesisClasses.id, id))
      .returning();

    logger.info('Updated class', { classId: id, userId });

    return NextResponse.json(createSuccessResponse(updatedClass));
  }, { endpoint: '/api/catechesis/classes/[id]', method: 'PUT' });
}

/**
 * DELETE /api/catechesis/classes/[id] - Delete class
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { id } = await params;

    // Check if class exists
    const [existingClass] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, id))
      .limit(1);

    if (!existingClass) {
      return createErrorResponse('Class not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingClass.parishId, true);

    const [deletedClass] = await db
      .delete(catechesisClasses)
      .where(eq(catechesisClasses.id, id))
      .returning();

    logger.info('Deleted class', { classId: id, userId });

    return NextResponse.json(createSuccessResponse(deletedClass));
  }, { endpoint: '/api/catechesis/classes/[id]', method: 'DELETE' });
}



