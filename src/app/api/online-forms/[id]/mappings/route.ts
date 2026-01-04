import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, onlineFormFieldMappings } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { createFieldMappingSchema } from '@/lib/validations/online-forms';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/api-utils/validation';

/**
 * GET /api/online-forms/[id]/mappings - Get all field mappings for a form
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

    // Get mappings
    const mappings = await db
      .select()
      .from(onlineFormFieldMappings)
      .where(eq(onlineFormFieldMappings.formId, id));

    logger.info(`Fetched ${mappings.length} mappings for form`, { formId: id, userId });
    return createSuccessResponse(mappings);
  }, { endpoint: `/api/online-forms/${id}/mappings`, method: 'GET' });
}

/**
 * POST /api/online-forms/[id]/mappings - Create a new field mapping
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
    const validation = createFieldMappingSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, formId: id, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check if mapping already exists for this field key
    const [existingMapping] = await db
      .select()
      .from(onlineFormFieldMappings)
      .where(
        and(
          eq(onlineFormFieldMappings.formId, id),
          eq(onlineFormFieldMappings.fieldKey, data.fieldKey)
        )
      )
      .limit(1);

    if (existingMapping) {
      return createErrorResponse('Mapping for this field key already exists', 400);
    }

    // Create mapping
    const [newMapping] = await db
      .insert(onlineFormFieldMappings)
      .values({
        formId: id,
        fieldKey: data.fieldKey,
        targetTable: data.targetTable,
        targetColumn: data.targetColumn,
        transformation: data.transformation || null,
      })
      .returning();

    logger.info(`Mapping created`, { mappingId: newMapping.id, formId: id, userId });
    return createSuccessResponse(newMapping);
  }, { endpoint: `/api/online-forms/${id}/mappings`, method: 'POST' });
}

