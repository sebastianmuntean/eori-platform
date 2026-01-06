import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisClasses, catechesisLessons } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/classes/[id]/lessons - Get all lessons for a class
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    // Check if class exists
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

    // Get lessons for this class, ordered by orderIndex
    const lessons = await db
      .select()
      .from(catechesisLessons)
      .where(eq(catechesisLessons.classId, id))
      .orderBy(asc(catechesisLessons.orderIndex));

    logger.info(`Fetched ${lessons.length} lessons for class`, { classId: id, userId });

    return NextResponse.json(createSuccessResponse(lessons));
  }, { endpoint: `/api/catechesis/classes/${id}/lessons`, method: 'GET' });
}



