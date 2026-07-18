import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/api-utils/pagination';
import { formatValidationErrors } from '@/lib/api-utils/validation';
import { handleApiRoute, createErrorResponse } from '@/lib/api-utils/error-handling';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { createClientSchema } from '@/lib/validations/clients';
import { listClients, createClient } from '@/lib/services/clients-service';

/**
 * GET /api/clients - List clients with pagination, search, and sorting
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_VIEW);

    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);
    // Clients historically default to ascending sort (code)
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    const result = await listClients({
      page,
      pageSize,
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }, { endpoint: '/api/clients', method: 'GET' });
}

/**
 * POST /api/clients - Create a new client
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_CREATE);
    const { userId } = await requireAuth();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const validation = createClientSchema.safeParse(body);

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

    const newClient = await createClient(validation.data, userId);

    return NextResponse.json(
      {
        success: true,
        data: newClient,
      },
      { status: 201 }
    );
  }, { endpoint: '/api/clients', method: 'POST' });
}
