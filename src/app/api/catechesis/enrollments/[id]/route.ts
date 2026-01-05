import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisEnrollments, catechesisClasses, catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateCatechesisEnrollmentSchema } from '@/lib/validations/catechesis/enrollments';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/enrollments/[id] - Get enrollment by ID
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

    const [enrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, id))
      .limit(1);

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404);
    }

    // Check class access
    const [classItem] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, enrollment.classId))
      .limit(1);

    if (classItem) {
      await requireParishAccess(classItem.parishId, false);
    }

    return NextResponse.json(createSuccessResponse(enrollment));
  }, { endpoint: '/api/catechesis/enrollments/[id]', method: 'GET' });
}

/**
 * PUT /api/catechesis/enrollments/[id] - Update enrollment
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
    const validation = updateCatechesisEnrollmentSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    // Check if enrollment exists
    const [existingEnrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, id))
      .limit(1);

    if (!existingEnrollment) {
      return createErrorResponse('Enrollment not found', 404);
    }

    // Check class access
    const [classItem] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, existingEnrollment.classId))
      .limit(1);

    if (classItem) {
      await requireParishAccess(classItem.parishId, true);
    }

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedEnrollment] = await db
      .update(catechesisEnrollments)
      .set(updateData)
      .where(eq(catechesisEnrollments.id, id))
      .returning();

    logger.info('Updated enrollment', { enrollmentId: id, userId });

    return NextResponse.json(createSuccessResponse(updatedEnrollment));
  }, { endpoint: '/api/catechesis/enrollments/[id]', method: 'PUT' });
}

/**
 * DELETE /api/catechesis/enrollments/[id] - Delete enrollment
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

    // Check if enrollment exists
    const [existingEnrollment] = await db
      .select()
      .from(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, id))
      .limit(1);

    if (!existingEnrollment) {
      return createErrorResponse('Enrollment not found', 404);
    }

    // Check class access
    const [classItem] = await db
      .select()
      .from(catechesisClasses)
      .where(eq(catechesisClasses.id, existingEnrollment.classId))
      .limit(1);

    if (classItem) {
      await requireParishAccess(classItem.parishId, true);
    }

    const [deletedEnrollment] = await db
      .delete(catechesisEnrollments)
      .where(eq(catechesisEnrollments.id, id))
      .returning();

    logger.info('Deleted enrollment', { enrollmentId: id, userId });

    return NextResponse.json(createSuccessResponse(deletedEnrollment));
  }, { endpoint: '/api/catechesis/enrollments/[id]', method: 'DELETE' });
}



