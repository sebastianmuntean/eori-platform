import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { formatValidationErrors, isValidUUID } from '@/lib/api-utils/validation';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { updateClientSchema } from '@/lib/validations/clients';
import {
  getClientById,
  updateClient,
  softDeleteClient,
} from '@/lib/services/clients-service';

/**
 * GET /api/clients/[id] - Get a single client by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    await requirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_VIEW);

    const { id } = await params;

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid client ID format', 400);
    }

    const client = await getClientById(id);
    return createSuccessResponse(client);
  }, { endpoint: '/api/clients/[id]', method: 'GET' });
}

/**
 * PUT /api/clients/[id] - Update an existing client
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    await requirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_UPDATE);
    const { userId } = await requireAuth();

    const { id } = await params;

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid client ID format', 400);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const validation = updateClientSchema.safeParse(body);

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

    const updatedClient = await updateClient(id, validation.data, userId);
    return createSuccessResponse(updatedClient);
  }, { endpoint: '/api/clients/[id]', method: 'PUT' });
}

/**
 * DELETE /api/clients/[id] - Soft delete a client
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    await requirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_DELETE);
    const { userId } = await requireAuth();

    const { id } = await params;

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid client ID format', 400);
    }

    const deletedClient = await softDeleteClient(id, userId);
    return createSuccessResponse(deletedClient);
  }, { endpoint: '/api/clients/[id]', method: 'DELETE' });
}
