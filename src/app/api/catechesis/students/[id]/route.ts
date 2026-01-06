import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisStudents } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateCatechesisStudentSchema } from '@/lib/validations/catechesis/students';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/catechesis/students/[id] - Get student by ID
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

    return NextResponse.json(createSuccessResponse(student));
  }, { endpoint: '/api/catechesis/students/[id]', method: 'GET' });
}

/**
 * PUT /api/catechesis/students/[id] - Update student
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
    const validation = updateCatechesisStudentSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    // Check if student exists
    const [existingStudent] = await db
      .select()
      .from(catechesisStudents)
      .where(eq(catechesisStudents.id, id))
      .limit(1);

    if (!existingStudent) {
      return createErrorResponse('Student not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingStudent.parishId, true);

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.parentName !== undefined) updateData.parentName = data.parentName;
    if (data.parentEmail !== undefined) updateData.parentEmail = data.parentEmail || null;
    if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedStudent] = await db
      .update(catechesisStudents)
      .set(updateData)
      .where(eq(catechesisStudents.id, id))
      .returning();

    logger.info('Updated student', { studentId: id, userId });

    return NextResponse.json(createSuccessResponse(updatedStudent));
  }, { endpoint: '/api/catechesis/students/[id]', method: 'PUT' });
}

/**
 * DELETE /api/catechesis/students/[id] - Delete student
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

    // Check if student exists
    const [existingStudent] = await db
      .select()
      .from(catechesisStudents)
      .where(eq(catechesisStudents.id, id))
      .limit(1);

    if (!existingStudent) {
      return createErrorResponse('Student not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingStudent.parishId, true);

    const [deletedStudent] = await db
      .delete(catechesisStudents)
      .where(eq(catechesisStudents.id, id))
      .returning();

    logger.info('Deleted student', { studentId: id, userId });

    return NextResponse.json(createSuccessResponse(deletedStudent));
  }, { endpoint: '/api/catechesis/students/[id]', method: 'DELETE' });
}







