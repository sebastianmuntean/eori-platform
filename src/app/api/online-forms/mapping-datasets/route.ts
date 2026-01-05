import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { formMappingDatasets, parishes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, and, sql, isNull } from 'drizzle-orm';
import { createDatasetSchema } from '@/lib/validations/form-mapping-datasets';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { sanitizeSearch, validateEnum, isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

// Allowed target modules
const ALLOWED_TARGET_MODULES = ['registratura', 'general_register', 'events', 'partners'] as const;

/**
 * GET /api/online-forms/mapping-datasets - List mapping datasets with filtering
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate pagination
    const { page, pageSize, offset } = parsePaginationParams(searchParams);
    
    // Parse and validate filters
    const search = sanitizeSearch(searchParams.get('search'));
    const targetModule = validateEnum(
      searchParams.get('targetModule'),
      ALLOWED_TARGET_MODULES,
      null
    );
    const rawParishId = searchParams.get('parishId');
    const parishId = rawParishId && isValidUUID(rawParishId) ? rawParishId : null;

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(formMappingDatasets.name, `%${search}%`),
          like(formMappingDatasets.description || '', `%${search}%`)
        )!
      );
    }

    if (targetModule) {
      conditions.push(eq(formMappingDatasets.targetModule, targetModule));
    }

    // Check parish access if parishId is provided
    if (parishId) {
      await requireParishAccess(parishId, false);
      // Show global templates (parish_id IS NULL) OR templates for this parish
      conditions.push(
        or(
          eq(formMappingDatasets.parishId, parishId),
          isNull(formMappingDatasets.parishId)
        )!
      );
    } else if (user.parishId) {
      // If user has a parish, show global templates and their parish templates
      conditions.push(
        or(
          eq(formMappingDatasets.parishId, user.parishId),
          isNull(formMappingDatasets.parishId)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(formMappingDatasets)
      .where(whereClause);

    const total = Number(totalCountResult[0]?.count || 0);

    // Get datasets with parish name
    const datasets = await db
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
      })
      .from(formMappingDatasets)
      .leftJoin(parishes, eq(formMappingDatasets.parishId, parishes.id))
      .where(whereClause)
      .orderBy(desc(formMappingDatasets.createdAt))
      .limit(pageSize)
      .offset(offset);

    logger.info(`Fetched ${datasets.length} mapping datasets`, { page, total, userId });

    return NextResponse.json({
      success: true,
      data: datasets,
      pagination: calculatePagination(total, page, pageSize),
    });
  }, { endpoint: '/api/online-forms/mapping-datasets', method: 'GET' });
}

/**
 * POST /api/online-forms/mapping-datasets - Create new mapping dataset
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createDatasetSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check parish access if parishId is provided
    if (data.parishId) {
      await requireParishAccess(data.parishId, true);
    }

    // Use transaction for atomicity
    const dataset = await db.transaction(async (tx) => {
      // If setting as default, unset other defaults for same target module
      if (data.isDefault) {
        await tx
          .update(formMappingDatasets)
          .set({ isDefault: false })
          .where(
            and(
              eq(formMappingDatasets.targetModule, data.targetModule),
              data.parishId
                ? eq(formMappingDatasets.parishId, data.parishId)
                : isNull(formMappingDatasets.parishId)
            )
          );
      }

      // Create dataset
      const [newDataset] = await tx
        .insert(formMappingDatasets)
        .values({
          name: data.name,
          description: data.description || null,
          targetModule: data.targetModule,
          parishId: data.parishId || null,
          isDefault: data.isDefault || false,
          mappings: data.mappings || [],
          createdBy: userId,
        })
        .returning();

      return newDataset;
    });

    logger.info(`Mapping dataset created`, { datasetId: dataset.id, userId });

    return createSuccessResponse(dataset);
  }, { endpoint: '/api/online-forms/mapping-datasets', method: 'POST' });
}


