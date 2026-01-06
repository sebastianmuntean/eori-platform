import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisStudents, catechesisEnrollments, catechesisClasses } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/students/[id]/enrollments - Get all enrollments for a student
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

    // Get enrollments with class info
    const enrollments = await db
      .select({
        enrollmentId: catechesisEnrollments.id,
        classId: catechesisClasses.id,
        className: catechesisClasses.name,
        classGrade: catechesisClasses.grade,
        status: catechesisEnrollments.status,
        enrolledAt: catechesisEnrollments.enrolledAt,
        notes: catechesisEnrollments.notes,
      })
      .from(catechesisEnrollments)
      .innerJoin(catechesisClasses, eq(catechesisEnrollments.classId, catechesisClasses.id))
      .where(eq(catechesisEnrollments.studentId, id));

    logger.info(`Fetched ${enrollments.length} enrollments for student`, { studentId: id, userId });

    return NextResponse.json(createSuccessResponse(enrollments));
  }, { endpoint: `/api/catechesis/students/${id}/enrollments`, method: 'GET' });
}



