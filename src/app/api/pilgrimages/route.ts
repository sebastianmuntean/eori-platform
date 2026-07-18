import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/api-utils/pagination';
import { formatValidationErrors } from '@/lib/api-utils/validation';
import { handleApiRoute, createErrorResponse } from '@/lib/api-utils/error-handling';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';
import { createPilgrimageSchema } from '@/lib/validations/pilgrimages';
import { listPilgrimages, createPilgrimage } from '@/lib/services/pilgrimages-service';

/**
 * GET /api/pilgrimages - Fetch all pilgrimages with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);

    const result = await listPilgrimages({
      page,
      pageSize,
      search: searchParams.get('search'),
      parishId: searchParams.get('parishId'),
      status: searchParams.get('status'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }, { endpoint: '/api/pilgrimages', method: 'GET' });
}

/**
 * POST /api/pilgrimages - Create a new pilgrimage
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(PILGRIMAGES_PERMISSIONS.CREATE);
    const { userId } = await requireAuth();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const validation = createPilgrimageSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    await requireParishAccess(validation.data.parishId, true);

    const newPilgrimage = await createPilgrimage(validation.data, userId);

    return NextResponse.json(
      {
        success: true,
        data: newPilgrimage,
      },
      { status: 201 }
    );
  }, { endpoint: '/api/pilgrimages', method: 'POST' });
}
