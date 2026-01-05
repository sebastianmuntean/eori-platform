import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisProgress, catechesisEnrollments, catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { trackProgressSchema } from '@/lib/validations/catechesis/progress';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/catechesis/progress/track - Track progress automatically (start/complete)
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = trackProgressSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Get enrollment and student to check access
    const [enrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, data.enrollmentId))
      .limit(1);

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404);
    }

    const [student] = await db
      .select()
      .from(catechesisStudents)
      .where(eq(catechesisStudents.id, enrollment.studentId))
      .limit(1);

    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    await requireParishAccess(student.parishId, false);

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

    let progressRecord;

    if (existingProgress) {
      // Update existing progress
      const updateData: any = { updatedAt: new Date() };

      if (data.action === 'start') {
        updateData.status = 'in_progress';
        if (!existingProgress.startedAt) {
          updateData.startedAt = new Date();
        }
      } else if (data.action === 'complete') {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
        if (!existingProgress.startedAt) {
          updateData.startedAt = new Date();
        }
      }

      if (data.timeSpentMinutes !== undefined && data.timeSpentMinutes !== null) {
        updateData.timeSpentMinutes = data.timeSpentMinutes;
      }

      if (data.score !== undefined && data.score !== null) {
        updateData.score = String(data.score);
      }

      const [updated] = await db
        .update(catechesisProgress)
        .set(updateData)
        .where(eq(catechesisProgress.id, existingProgress.id))
        .returning();

      progressRecord = updated;
    } else {
      // Create new progress record
      const insertData: any = {
        enrollmentId: data.enrollmentId,
        lessonId: data.lessonId,
        status: data.action === 'complete' ? 'completed' : 'in_progress',
        startedAt: new Date(),
        timeSpentMinutes: data.timeSpentMinutes || null,
        score: data.score ? String(data.score) : null,
      };

      if (data.action === 'complete') {
        insertData.completedAt = new Date();
      }

      const [created] = await db
        .insert(catechesisProgress)
        .values(insertData)
        .returning();

      progressRecord = created;
    }

    logger.info('Tracked progress', { 
      progressId: progressRecord.id, 
      action: data.action, 
      userId 
    });

    return NextResponse.json(createSuccessResponse(progressRecord));
  }, { endpoint: '/api/catechesis/progress/track', method: 'POST' });
}



