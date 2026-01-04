import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, parishes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { updateOnlineFormSchema } from '@/lib/validations/online-forms';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/api-utils/validation';

/**
 * GET /api/online-forms/[id] - Get a single online form
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

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid form ID', 400);
    }

    const [form] = await db
      .select({
        id: onlineForms.id,
        parishId: onlineForms.parishId,
        parishName: parishes.name,
        name: onlineForms.name,
        description: onlineForms.description,
        isActive: onlineForms.isActive,
        emailValidationMode: onlineForms.emailValidationMode,
        submissionFlow: onlineForms.submissionFlow,
        targetModule: onlineForms.targetModule,
        widgetCode: onlineForms.widgetCode,
        successMessage: onlineForms.successMessage,
        errorMessage: onlineForms.errorMessage,
        createdBy: onlineForms.createdBy,
        createdAt: onlineForms.createdAt,
        updatedAt: onlineForms.updatedAt,
        updatedBy: onlineForms.updatedBy,
      })
      .from(onlineForms)
      .leftJoin(parishes, eq(onlineForms.parishId, parishes.id))
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!form) {
      return createErrorResponse('Form not found', 404);
    }

    // Check parish access
    if (form.parishId) {
      await requireParishAccess(form.parishId, false);
    }

    logger.info(`Form fetched`, { formId: id, userId });
    return createSuccessResponse(form);
  }, { endpoint: `/api/online-forms/${id}`, method: 'GET' });
}

/**
 * PUT /api/online-forms/[id] - Update an online form
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid form ID', 400);
    }

    // Check if form exists
    const [existingForm] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!existingForm) {
      return createErrorResponse('Form not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingForm.parishId, true);

    const body = await request.json();
    const validation = updateOnlineFormSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, formId: id, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Update form
    const [updatedForm] = await db
      .update(onlineForms)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(onlineForms.id, id))
      .returning();

    logger.info(`Form updated`, { formId: id, userId });
    return createSuccessResponse(updatedForm);
  }, { endpoint: `/api/online-forms/${id}`, method: 'PUT' });
}

/**
 * DELETE /api/online-forms/[id] - Delete an online form
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid form ID', 400);
    }

    // Check if form exists
    const [existingForm] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!existingForm) {
      return createErrorResponse('Form not found', 404);
    }

    // Check parish access
    await requireParishAccess(existingForm.parishId, true);

    // Delete form (cascade will handle related records)
    await db.delete(onlineForms).where(eq(onlineForms.id, id));

    logger.info(`Form deleted`, { formId: id, userId });
    return createSuccessResponse(null, 'Form deleted successfully');
  }, { endpoint: `/api/online-forms/${id}`, method: 'DELETE' });
}


