import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { formMappingDatasets, parishes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { updateDatasetSchema } from '@/lib/validations/form-mapping-datasets';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/api-utils/validation';

/**
 * GET /api/online-forms/mapping-datasets/[id] - Get dataset by ID
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
      return createErrorResponse('Invalid dataset ID', 400);
    }

    const [dataset] = await db
      .select({
        id: formMappingDatasets.id,
        name: formMappingDatasets.name,
        description: formMappingDatasets.description,
        targetModule: formMappingDatasets.targetModule,
        parishId: formMappingDatasets.parishId,
        parishName: parishes.name,
        isDefault: formMappingDatasets.isDefault,
        mappings: formMappingDatasets.mappings,
        createdBy: formMappingDatasets.createdBy,
        createdAt: formMappingDatasets.createdAt,
        updatedAt: formMappingDatasets.updatedAt,
        updatedBy: formMappingDatasets.updatedBy,
      })
      .from(formMappingDatasets)
      .leftJoin(parishes, eq(formMappingDatasets.parishId, parishes.id))
      .where(eq(formMappingDatasets.id, id))
      .limit(1);

    if (!dataset) {
      return createErrorResponse('Dataset not found', 404);
    }

    // Check parish access
    if (dataset.parishId) {
      await requireParishAccess(dataset.parishId, false);
    }

    logger.info(`Mapping dataset fetched`, { datasetId: id, userId });
    return createSuccessResponse(dataset);
  }, { endpoint: `/api/online-forms/mapping-datasets/${id}`, method: 'GET' });
}

/**
 * PUT /api/online-forms/mapping-datasets/[id] - Update dataset
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
      return createErrorResponse('Invalid dataset ID', 400);
    }

    const body = await request.json();
    const validation = updateDatasetSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, datasetId: id, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check if dataset exists
    const [existing] = await db
      .select()
      .from(formMappingDatasets)
      .where(eq(formMappingDatasets.id, id))
      .limit(1);

    if (!existing) {
      return createErrorResponse('Dataset not found', 404);
    }

    // Check parish access
    if (existing.parishId) {
      await requireParishAccess(existing.parishId, true);
    }

    // If setting as default, unset other defaults (use transaction)
    const dataset = await db.transaction(async (tx) => {
      if (data.isDefault === true) {
        const targetModule = data.targetModule || existing.targetModule;
        const parishId = data.parishId !== undefined ? data.parishId : existing.parishId;

        await tx
          .update(formMappingDatasets)
          .set({ isDefault: false })
          .where(
            and(
              eq(formMappingDatasets.targetModule, targetModule),
              eq(formMappingDatasets.id, id), // Don't unset current one
              parishId
                ? eq(formMappingDatasets.parishId, parishId)
                : isNull(formMappingDatasets.parishId)
            )
          );
      }

      // Update dataset
      const [updated] = await tx
        .update(formMappingDatasets)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.targetModule && { targetModule: data.targetModule }),
          ...(data.parishId !== undefined && { parishId: data.parishId || null }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          ...(data.mappings && { mappings: data.mappings }),
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(formMappingDatasets.id, id))
        .returning();

      return updated;
    });

    logger.info(`Mapping dataset updated`, { datasetId: id, userId });
    return createSuccessResponse(dataset);
  }, { endpoint: `/api/online-forms/mapping-datasets/${id}`, method: 'PUT' });
}

/**
 * DELETE /api/online-forms/mapping-datasets/[id] - Delete dataset
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
      return createErrorResponse('Invalid dataset ID', 400);
    }

    // Check if dataset exists
    const [existing] = await db
      .select()
      .from(formMappingDatasets)
      .where(eq(formMappingDatasets.id, id))
      .limit(1);

    if (!existing) {
      return createErrorResponse('Dataset not found', 404);
    }

    // Check parish access
    if (existing.parishId) {
      await requireParishAccess(existing.parishId, true);
    }

    // Delete dataset
    await db
      .delete(formMappingDatasets)
      .where(eq(formMappingDatasets.id, id));

    logger.info(`Mapping dataset deleted`, { datasetId: id, userId });
    return createSuccessResponse(null, 'Dataset deleted successfully');
  }, { endpoint: `/api/online-forms/mapping-datasets/${id}`, method: 'DELETE' });
}


