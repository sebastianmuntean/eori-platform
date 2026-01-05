import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, onlineFormFields } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, asc, and } from 'drizzle-orm';
import { createFormFieldSchema } from '@/lib/validations/online-forms';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/api-utils/validation';

/**
 * GET /api/online-forms/[id]/fields - Get all fields for a form
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
    await requireParishAccess(form.parishId, false);

    // Get fields ordered by orderIndex
    const fields = await db
      .select()
      .from(onlineFormFields)
      .where(eq(onlineFormFields.formId, id))
      .orderBy(asc(onlineFormFields.orderIndex));

    logger.info(`Fetched ${fields.length} fields for form`, { formId: id, userId });
    return createSuccessResponse(fields);
  }, { endpoint: `/api/online-forms/${id}/fields`, method: 'GET' });
}

/**
 * POST /api/online-forms/[id]/fields - Create a new field
 */
export async function POST(
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

    const body = await request.json();
    const validation = createFormFieldSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, formId: id, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check if field key already exists for this form
    const [existingField] = await db
      .select()
      .from(onlineFormFields)
      .where(
        and(
          eq(onlineFormFields.formId, id),
          eq(onlineFormFields.fieldKey, data.fieldKey)
        )
      )
      .limit(1);

    if (existingField) {
      return createErrorResponse('Field with this key already exists', 400);
    }

    // Create field
    const [newField] = await db
      .insert(onlineFormFields)
      .values({
        formId: id,
        fieldKey: data.fieldKey,
        fieldType: data.fieldType,
        label: data.label,
        placeholder: data.placeholder || null,
        helpText: data.helpText || null,
        isRequired: data.isRequired ?? false,
        validationRules: data.validationRules || null,
        options: data.options || null,
        orderIndex: data.orderIndex ?? 0,
      })
      .returning();

    logger.info(`Field created`, { fieldId: newField.id, formId: id, userId });
    return createSuccessResponse(newField);
  }, { endpoint: `/api/online-forms/${id}/fields`, method: 'POST' });
}

