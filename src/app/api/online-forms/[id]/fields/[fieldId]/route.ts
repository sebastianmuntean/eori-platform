import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, onlineFormFields } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { updateFormFieldSchema } from '@/lib/validations/online-forms';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/api-utils/validation';

/**
 * PUT /api/online-forms/[id]/fields/[fieldId] - Update a field
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;
  
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    if (!isValidUUID(id) || !isValidUUID(fieldId)) {
      return createErrorResponse('Invalid form or field ID', 400);
    }

    // Check if form exists
    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!form) {
      return createErrorResponse('Form not found', 404);
    }

    // Check parish access
    await requireParishAccess(form.parishId, true);

    // Check if field exists
    const [existingField] = await db
      .select()
      .from(onlineFormFields)
      .where(
        and(
          eq(onlineFormFields.id, fieldId),
          eq(onlineFormFields.formId, id)
        )
      )
      .limit(1);

    if (!existingField) {
      return createErrorResponse('Field not found', 404);
    }

    const body = await request.json();
    const validation = updateFormFieldSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, fieldId, formId: id, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // If fieldKey is being updated, check for conflicts
    if (data.fieldKey && data.fieldKey !== existingField.fieldKey) {
      const [conflictingField] = await db
        .select()
        .from(onlineFormFields)
        .where(
          and(
            eq(onlineFormFields.formId, id),
            eq(onlineFormFields.fieldKey, data.fieldKey)
          )
        )
        .limit(1);

      if (conflictingField) {
        return createErrorResponse('Field with this key already exists', 400);
      }
    }

    // Update field
    const [updatedField] = await db
      .update(onlineFormFields)
      .set(data)
      .where(eq(onlineFormFields.id, fieldId))
      .returning();

    logger.info(`Field updated`, { fieldId, formId: id, userId });
    return createSuccessResponse(updatedField);
  }, { endpoint: `/api/online-forms/${id}/fields/${fieldId}`, method: 'PUT' });
}

/**
 * DELETE /api/online-forms/[id]/fields/[fieldId] - Delete a field
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;
  
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    if (!isValidUUID(id) || !isValidUUID(fieldId)) {
      return createErrorResponse('Invalid form or field ID', 400);
    }

    // Check if form exists
    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, id))
      .limit(1);

    if (!form) {
      return createErrorResponse('Form not found', 404);
    }

    // Check parish access
    await requireParishAccess(form.parishId, true);

    // Check if field exists
    const [existingField] = await db
      .select()
      .from(onlineFormFields)
      .where(
        and(
          eq(onlineFormFields.id, fieldId),
          eq(onlineFormFields.formId, id)
        )
      )
      .limit(1);

    if (!existingField) {
      return createErrorResponse('Field not found', 404);
    }

    // Delete field
    await db
      .delete(onlineFormFields)
      .where(eq(onlineFormFields.id, fieldId));

    logger.info(`Field deleted`, { fieldId, formId: id, userId });
    return createSuccessResponse(null, 'Field deleted successfully');
  }, { endpoint: `/api/online-forms/${id}/fields/${fieldId}`, method: 'DELETE' });
}


