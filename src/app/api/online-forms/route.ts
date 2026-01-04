import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, parishes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, and, sql } from 'drizzle-orm';
import { createOnlineFormSchema } from '@/lib/validations/online-forms';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { createOrderBy, parseSortOrder } from '@/lib/api-utils/sorting';
import { sanitizeSearch, validateEnum, parseBoolean, isValidUUID } from '@/lib/api-utils/validation';
import { ensureUniqueWidgetCode } from '@/lib/api-utils/widget-code';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

// Allowed sort fields for online forms
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'isActive'] as const;

// Allowed target modules
const ALLOWED_TARGET_MODULES = ['registratura', 'general_register', 'events', 'partners'] as const;

/**
 * GET /api/online-forms - List online forms with filtering and pagination
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
    const rawParishId = searchParams.get('parishId');
    const parishId = rawParishId && isValidUUID(rawParishId) ? rawParishId : null;
    const targetModule = validateEnum(
      searchParams.get('targetModule'),
      ALLOWED_TARGET_MODULES,
      null
    );
    const isActive = parseBoolean(searchParams.get('isActive'));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseSortOrder(searchParams.get('sortOrder'));

    // Check parish access if parishId is provided
    if (parishId) {
      await requireParishAccess(parishId, false);
    }

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(onlineForms.name, `%${search}%`),
          like(onlineForms.description || '', `%${search}%`),
          like(onlineForms.widgetCode, `%${search}%`)
        )!
      );
    }

    // Filter by user's parish if they have one (unless they're accessing a specific parish)
    if (parishId) {
      conditions.push(eq(onlineForms.parishId, parishId));
    } else if (user.parishId) {
      // If user has a parish, only show forms from their parish
      conditions.push(eq(onlineForms.parishId, user.parishId));
    }

    if (targetModule) {
      conditions.push(eq(onlineForms.targetModule, targetModule));
    }

    if (isActive !== undefined) {
      conditions.push(eq(onlineForms.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build safe order by
    const orderBy = createOrderBy(
      onlineForms,
      sortBy,
      'createdAt',
      ALLOWED_SORT_FIELDS,
      sortOrder
    );

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(onlineForms)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get forms with parish info
    const forms = await db
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
        createdAt: onlineForms.createdAt,
        updatedAt: onlineForms.updatedAt,
      })
      .from(onlineForms)
      .leftJoin(parishes, eq(onlineForms.parishId, parishes.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    logger.info(`Fetched ${forms.length} forms`, { page, totalCount, userId });

    return NextResponse.json({
      success: true,
      data: forms,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/online-forms', method: 'GET' });
}

/**
 * POST /api/online-forms - Create a new online form
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createOnlineFormSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check parish access
    await requireParishAccess(data.parishId, true);

    // Ensure widget code is unique
    const widgetCode = await ensureUniqueWidgetCode(data.widgetCode);

    // Create form
    const [newForm] = await db
      .insert(onlineForms)
      .values({
        parishId: data.parishId,
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        emailValidationMode: data.emailValidationMode || 'end',
        submissionFlow: data.submissionFlow || 'review',
        targetModule: data.targetModule,
        widgetCode,
        successMessage: data.successMessage || null,
        errorMessage: data.errorMessage || null,
        createdBy: userId,
        updatedAt: new Date(),
      })
      .returning();

    logger.info(`Form created`, { formId: newForm.id, widgetCode, userId });

    return createSuccessResponse(newForm);
  }, { endpoint: '/api/online-forms', method: 'POST' });
}

