import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisLessons } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateCatechesisLessonSchema } from '@/lib/validations/catechesis/lessons';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/lessons/[id] - Get lesson by ID
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

    const [lesson] = await db
      .select()
      .from(catechesisLessons)
      .where(eq(catechesisLessons.id, id))
      .limit(1);

    if (!lesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check parish access
    await requireParishAccess(lesson.parishId, false);

    return NextResponse.json(createSuccessResponse(lesson));
  }, { endpoint: '/api/catechesis/lessons/[id]', method: 'GET' });
}

/**
 * PUT /api/catechesis/lessons/[id] - Update lesson
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
    const validation = updateCatechesisLessonSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    // Check if lesson exists
    const [existingLesson] = await db
      .select()
      .from(catechesisLessons)
      .where(eq(catechesisLessons.id, id))
      .limit(1);

    if (!existingLesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingLesson.parishId, true);

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.classId !== undefined) updateData.classId = data.classId || null;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    const [updatedLesson] = await db
      .update(catechesisLessons)
      .set(updateData)
      .where(eq(catechesisLessons.id, id))
      .returning();

    logger.info('Updated lesson', { lessonId: id, userId });

    return NextResponse.json(createSuccessResponse(updatedLesson));
  }, { endpoint: '/api/catechesis/lessons/[id]', method: 'PUT' });
}

/**
 * DELETE /api/catechesis/lessons/[id] - Delete lesson
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

    // Check if lesson exists
    const [existingLesson] = await db
      .select()
      .from(catechesisLessons)
      .where(eq(catechesisLessons.id, id))
      .limit(1);

    if (!existingLesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingLesson.parishId, true);

    const [deletedLesson] = await db
      .delete(catechesisLessons)
      .where(eq(catechesisLessons.id, id))
      .returning();

    logger.info('Deleted lesson', { lessonId: id, userId });

    return NextResponse.json(createSuccessResponse(deletedLesson));
  }, { endpoint: '/api/catechesis/lessons/[id]', method: 'DELETE' });
}







