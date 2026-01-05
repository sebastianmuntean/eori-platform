import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineFormSubmissions, onlineForms } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { createOrderBy, parseSortOrder } from '@/lib/api-utils/sorting';
import { validateEnum, isValidUUID } from '@/lib/api-utils/validation';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

// Allowed sort fields for submissions
const ALLOWED_SORT_FIELDS = ['submittedAt', 'processedAt', 'status'] as const;

// Allowed submission statuses
const ALLOWED_STATUSES = ['pending_validation', 'validated', 'processing', 'completed', 'rejected'] as const;

/**
 * GET /api/online-forms/submissions - List form submissions
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
    const rawFormId = searchParams.get('formId');
    const formId = rawFormId && isValidUUID(rawFormId) ? rawFormId : null;
    const status = validateEnum(
      searchParams.get('status'),
      ALLOWED_STATUSES,
      null
    );
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = parseSortOrder(searchParams.get('sortOrder'));

    // Build query conditions
    const conditions = [];

    if (formId) {
      conditions.push(eq(onlineFormSubmissions.formId, formId));
    }

    if (status) {
      conditions.push(eq(onlineFormSubmissions.status, status));
    }

    // Filter by user's parish if they have one
    if (user.parishId) {
      // Join with forms to filter by parish
      // This will be handled in the query below
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build safe order by
    const orderBy = createOrderBy(
      onlineFormSubmissions,
      sortBy,
      'submittedAt',
      ALLOWED_SORT_FIELDS,
      sortOrder
    );

    // Add parish filter if user has a parish
    if (user.parishId) {
      conditions.push(eq(onlineForms.parishId, user.parishId));
    }

    const finalWhereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(onlineFormSubmissions)
      .leftJoin(onlineForms, eq(onlineFormSubmissions.formId, onlineForms.id))
      .where(finalWhereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get submissions with form info
    const submissions = await db
      .select({
        id: onlineFormSubmissions.id,
        formId: onlineFormSubmissions.formId,
        formName: onlineForms.name,
        submissionToken: onlineFormSubmissions.submissionToken,
        status: onlineFormSubmissions.status,
        email: onlineFormSubmissions.email,
        emailValidatedAt: onlineFormSubmissions.emailValidatedAt,
        formData: onlineFormSubmissions.formData,
        targetRecordId: onlineFormSubmissions.targetRecordId,
        submittedAt: onlineFormSubmissions.submittedAt,
        processedAt: onlineFormSubmissions.processedAt,
        processedBy: onlineFormSubmissions.processedBy,
      })
      .from(onlineFormSubmissions)
      .leftJoin(onlineForms, eq(onlineFormSubmissions.formId, onlineForms.id))
      .where(finalWhereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    logger.info(`Fetched ${submissions.length} submissions`, { page, totalCount, userId });

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/online-forms/submissions', method: 'GET' });
}


