import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisEnrollments, catechesisClasses, catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { createCatechesisEnrollmentSchema } from '@/lib/validations/catechesis/enrollments';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/enrollments - List enrollments with filtering
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    const conditions = [];

    if (classId) {
      conditions.push(eq(catechesisEnrollments.classId, classId));
      // Check class access
      const [classItem] = await db
        .select()
        .from(catechesisClasses)
        .where(eq(catechesisClasses.id, classId))
        .limit(1);
      if (classItem) {
        await requireParishAccess(classItem.parishId, false);
      }
    }

    if (studentId) {
      conditions.push(eq(catechesisEnrollments.studentId, studentId));
      // Check student access
      const [student] = await db
        .select()
        .from(catechesisStudents)
        .where(eq(catechesisStudents.id, studentId))
        .limit(1);
      if (student) {
        await requireParishAccess(student.parishId, false);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get enrollments with class and student info
    const enrollments = await db
      .select({
        id: catechesisEnrollments.id,
        classId: catechesisClasses.id,
        className: catechesisClasses.name,
        studentId: catechesisStudents.id,
        studentFirstName: catechesisStudents.firstName,
        studentLastName: catechesisStudents.lastName,
        status: catechesisEnrollments.status,
        enrolledAt: catechesisEnrollments.enrolledAt,
        notes: catechesisEnrollments.notes,
        createdAt: catechesisEnrollments.createdAt,
        updatedAt: catechesisEnrollments.updatedAt,
      })
      .from(catechesisEnrollments)
      .innerJoin(catechesisClasses, eq(catechesisEnrollments.classId, catechesisClasses.id))
      .innerJoin(catechesisStudents, eq(catechesisEnrollments.studentId, catechesisStudents.id))
      .where(whereClause);

    logger.info(`Fetched ${enrollments.length} enrollments`, { userId });

    return NextResponse.json(createSuccessResponse(enrollments));
  }, { endpoint: '/api/catechesis/enrollments', method: 'GET' });
}

/**
 * POST /api/catechesis/enrollments - Create a new enrollment
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createCatechesisEnrollmentSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check if class exists
    const [classItem] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, data.classId))
      .limit(1);

    if (!classItem) {
      return createErrorResponse('Class not found', 404);
    }

    // Check if student exists
    const [student] = await db
      .select()
      .from(catechesisStudents)
      .where(eq(catechesisStudents.id, data.studentId))
      .limit(1);

    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    // Check parish access (both class and student should be from same parish)
    await requireParishAccess(classItem.parishId, true);
    if (classItem.parishId !== student.parishId) {
      return createErrorResponse('Class and student must be from the same parish', 400);
    }

    // Check for duplicate enrollment
    const [existingEnrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(
        and(
          eq(catechesisEnrollments.classId, data.classId),
          eq(catechesisEnrollments.studentId, data.studentId)
        )
      )
      .limit(1);

    if (existingEnrollment) {
      return createErrorResponse('Student is already enrolled in this class', 400);
    }

    // Create enrollment
    const [newEnrollment] = await db
      .insert(catechesisEnrollments)
      .values({
        classId: data.classId,
        studentId: data.studentId,
        status: data.status || 'active',
        notes: data.notes || null,
      })
      .returning();

    logger.info('Created enrollment', { enrollmentId: newEnrollment.id, userId });

    return NextResponse.json(
      createSuccessResponse(newEnrollment),
      { status: 201 }
    );
  }, { endpoint: '/api/catechesis/enrollments', method: 'POST' });
}



