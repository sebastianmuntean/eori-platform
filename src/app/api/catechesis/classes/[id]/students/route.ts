import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisClasses, catechesisEnrollments, catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/classes/[id]/students - Get all students enrolled in a class
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

    // Get enrollments with student info
    const enrollments = await db
      .select({
        enrollmentId: catechesisEnrollments.id,
        studentId: catechesisStudents.id,
        firstName: catechesisStudents.firstName,
        lastName: catechesisStudents.lastName,
        dateOfBirth: catechesisStudents.dateOfBirth,
        parentName: catechesisStudents.parentName,
        parentEmail: catechesisStudents.parentEmail,
        parentPhone: catechesisStudents.parentPhone,
        status: catechesisEnrollments.status,
        enrolledAt: catechesisEnrollments.enrolledAt,
        notes: catechesisEnrollments.notes,
      })
      .from(catechesisEnrollments)
      .innerJoin(catechesisStudents, eq(catechesisEnrollments.studentId, catechesisStudents.id))
      .where(eq(catechesisEnrollments.classId, id));

    logger.info(`Fetched ${enrollments.length} students for class`, { classId: id, userId });

    return NextResponse.json(createSuccessResponse(enrollments));
  }, { endpoint: `/api/catechesis/classes/${id}/students`, method: 'GET' });
}



