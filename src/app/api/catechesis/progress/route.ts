import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisProgress, catechesisEnrollments, catechesisLessons, catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { createCatechesisProgressSchema } from '@/lib/validations/catechesis/progress';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/progress - List progress records with filtering
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const lessonId = searchParams.get('lessonId');

    const conditions = [];

    if (enrollmentId) {
      conditions.push(eq(catechesisProgress.enrollmentId, enrollmentId));
    }

    if (lessonId) {
      conditions.push(eq(catechesisProgress.lessonId, lessonId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get progress with enrollment, lesson, and student info
    const progressRecords = await db
      .select({
        id: catechesisProgress.id,
        enrollmentId: catechesisProgress.enrollmentId,
        lessonId: catechesisProgress.lessonId,
        lessonTitle: catechesisLessons.title,
        studentId: catechesisStudents.id,
        studentFirstName: catechesisStudents.firstName,
        studentLastName: catechesisStudents.lastName,
        status: catechesisProgress.status,
        startedAt: catechesisProgress.startedAt,
        completedAt: catechesisProgress.completedAt,
        timeSpentMinutes: catechesisProgress.timeSpentMinutes,
        score: catechesisProgress.score,
        notes: catechesisProgress.notes,
        createdAt: catechesisProgress.createdAt,
        updatedAt: catechesisProgress.updatedAt,
      })
      .from(catechesisProgress)
      .innerJoin(catechesisEnrollments, eq(catechesisProgress.enrollmentId, catechesisEnrollments.id))
      .innerJoin(catechesisLessons, eq(catechesisProgress.lessonId, catechesisLessons.id))
      .innerJoin(catechesisStudents, eq(catechesisEnrollments.studentId, catechesisStudents.id))
      .where(whereClause);

    logger.info(`Fetched ${progressRecords.length} progress records`, { userId });

    return NextResponse.json(createSuccessResponse(progressRecords));
  }, { endpoint: '/api/catechesis/progress', method: 'GET' });
}

/**
 * POST /api/catechesis/progress - Create a new progress record
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createCatechesisProgressSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check if enrollment exists
    const [enrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, data.enrollmentId))
      .limit(1);

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404);
    }

    // Check if lesson exists
    const [lesson] = await db
      .select()
      .from(catechesisLessons)
      .where(eq(catechesisLessons.id, data.lessonId))
      .limit(1);

    if (!lesson) {
      return createErrorResponse('Lesson not found', 404);
    }

    // Check for existing progress record
    const [existingProgress] = await db
      .select()
      .from(catechesisProgress)
      .where(
        and(
          eq(catechesisProgress.enrollmentId, data.enrollmentId),
          eq(catechesisProgress.lessonId, data.lessonId)
        )
      )
      .limit(1);

    if (existingProgress) {
      return createErrorResponse('Progress record already exists. Use PUT to update.', 400);
    }

    // Get student to check parish access
    const [student] = await db
      .select()
      .from(catechesisStudents)
      .where(eq(catechesisStudents.id, enrollment.studentId))
      .limit(1);

    if (student) {
      await requireParishAccess(student.parishId, true);
    }

    // Create progress record
    const [newProgress] = await db
      .insert(catechesisProgress)
      .values({
        enrollmentId: data.enrollmentId,
        lessonId: data.lessonId,
        status: data.status || 'not_started',
        timeSpentMinutes: data.timeSpentMinutes || null,
        score: data.score ? String(data.score) : null,
        notes: data.notes || null,
      })
      .returning();

    logger.info('Created progress record', { progressId: newProgress.id, userId });

    return NextResponse.json(
      createSuccessResponse(newProgress),
      { status: 201 }
    );
  }, { endpoint: '/api/catechesis/progress', method: 'POST' });
}



