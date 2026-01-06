import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisProgress, catechesisEnrollments, catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateCatechesisProgressSchema } from '@/lib/validations/catechesis/progress';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/progress/[id] - Get progress record by ID
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

    const [progress] = await db
      .select()
      .from(catechesisProgress)
      .where(eq(catechesisProgress.id, id))
      .limit(1);

    if (!progress) {
      return createErrorResponse('Progress record not found', 404);
    }

    // Get enrollment and student to check access
    const [enrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, progress.enrollmentId))
      .limit(1);

    if (enrollment) {
      const [student] = await db
        .select()
        .from(catechesisStudents)
        .where(eq(catechesisStudents.id, enrollment.studentId))
        .limit(1);

      if (student) {
        await requireParishAccess(student.parishId, false);
      }
    }

    return NextResponse.json(createSuccessResponse(progress));
  }, { endpoint: '/api/catechesis/progress/[id]', method: 'GET' });
}

/**
 * PUT /api/catechesis/progress/[id] - Update progress record
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
    const validation = updateCatechesisProgressSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    // Check if progress exists
    const [existingProgress] = await db
      .select()
      .from(catechesisProgress)
      .where(eq(catechesisProgress.id, id))
      .limit(1);

    if (!existingProgress) {
      return createErrorResponse('Progress record not found', 404);
    }

    // Get enrollment and student to check access
    const [enrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, existingProgress.enrollmentId))
      .limit(1);

    if (enrollment) {
      const [student] = await db
        .select()
        .from(catechesisStudents)
        .where(eq(catechesisStudents.id, enrollment.studentId))
        .limit(1);

      if (student) {
        await requireParishAccess(student.parishId, true);
      }
    }

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.status !== undefined) {
      updateData.status = data.status;
      // Update timestamps based on status
      if (data.status === 'in_progress' && !existingProgress.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === 'completed') {
        updateData.completedAt = new Date();
        if (!existingProgress.startedAt) {
          updateData.startedAt = new Date();
        }
      }
    }
    if (data.timeSpentMinutes !== undefined) updateData.timeSpentMinutes = data.timeSpentMinutes;
    if (data.score !== undefined) updateData.score = data.score ? String(data.score) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedProgress] = await db
      .update(catechesisProgress)
      .set(updateData)
      .where(eq(catechesisProgress.id, id))
      .returning();

    logger.info('Updated progress record', { progressId: id, userId });

    return NextResponse.json(createSuccessResponse(updatedProgress));
  }, { endpoint: '/api/catechesis/progress/[id]', method: 'PUT' });
}







