import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisLessons, catechesisClasses } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { assignLessonToClassSchema } from '@/lib/validations/catechesis/lessons';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/catechesis/lessons/[id]/assign - Assign lesson to a class
 */
export async function POST(
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
    const validation = assignLessonToClassSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    // Check if lesson exists
    const [lesson] = await db
      .select()
      .from(catechesisLessons)
      .where(eq(catechesisLessons.id, id))
      .limit(1);

    if (!lesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check if class exists
    const [classItem] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, validation.data.classId))
      .limit(1);

    if (!classItem) {
      return createErrorResponse('Class not found', 404);
    }

    // Check parish access for both lesson and class
    await requireParishAccess(lesson.parishId, true);
    await requireParishAccess(classItem.parishId, true);

    // Update lesson to assign it to the class
    const [updatedLesson] = await db
      .update(catechesisLessons)
      .set({
        classId: validation.data.classId,
        orderIndex: validation.data.orderIndex || 0,
        updatedAt: new Date(),
      })
      .where(eq(catechesisLessons.id, id))
      .returning();

    logger.info('Assigned lesson to class', { lessonId: id, classId: validation.data.classId, userId });

    return NextResponse.json(createSuccessResponse(updatedLesson));
  }, { endpoint: '/api/catechesis/lessons/[id]/assign', method: 'POST' });
}



