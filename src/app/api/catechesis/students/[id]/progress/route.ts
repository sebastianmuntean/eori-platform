import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisStudents, catechesisProgress, catechesisEnrollments, catechesisLessons } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/students/[id]/progress - Get all progress records for a student
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

    // Check if student exists
    const [student] = await db
      .select()
      .from(catechesisStudents)
      .where(eq(catechesisStudents.id, id))
      .limit(1);

    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    // Check parish access
    await requireParishAccess(student.parishId, false);

    // Get progress with lesson and enrollment info
    const progressRecords = await db
      .select({
        progressId: catechesisProgress.id,
        lessonId: catechesisLessons.id,
        lessonTitle: catechesisLessons.title,
        enrollmentId: catechesisEnrollments.id,
        status: catechesisProgress.status,
        startedAt: catechesisProgress.startedAt,
        completedAt: catechesisProgress.completedAt,
        timeSpentMinutes: catechesisProgress.timeSpentMinutes,
        score: catechesisProgress.score,
        notes: catechesisProgress.notes,
      })
      .from(catechesisProgress)
      .innerJoin(catechesisEnrollments, eq(catechesisProgress.enrollmentId, catechesisEnrollments.id))
      .innerJoin(catechesisLessons, eq(catechesisProgress.lessonId, catechesisLessons.id))
      .where(eq(catechesisEnrollments.studentId, id));

    logger.info(`Fetched ${progressRecords.length} progress records for student`, { studentId: id, userId });

    return NextResponse.json(createSuccessResponse(progressRecords));
  }, { endpoint: `/api/catechesis/students/${id}/progress`, method: 'GET' });
}



