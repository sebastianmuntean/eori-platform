import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';
import { updatePilgrimageSchema } from '@/lib/validations/pilgrimages';
import {
  getPilgrimageById,
  updatePilgrimage,
  deletePilgrimage,
} from '@/lib/services/pilgrimages-service';

/**
 * GET /api/pilgrimages/[id] - Get pilgrimage by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    await requirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

    const { id } = await params;

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid pilgrimage ID format', 400);
    }

    const pilgrimage = await getPilgrimageById(id);
    await requireParishAccess(pilgrimage.parishId, false);

    return createSuccessResponse(pilgrimage);
  }, { endpoint: '/api/pilgrimages/[id]', method: 'GET' });
}

/**
 * PUT /api/pilgrimages/[id] - Update pilgrimage
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    await requirePermission(PILGRIMAGES_PERMISSIONS.UPDATE);
    const { userId } = await requireAuth();

    const { id } = await params;

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid pilgrimage ID format', 400);
    }

    const existingPilgrimage = await getPilgrimageById(id);
    await requireParishAccess(existingPilgrimage.parishId, true);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const validation = updatePilgrimageSchema.safeParse(body);

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

    const data = validation.data;

    if (data.parishId && data.parishId !== existingPilgrimage.parishId) {
      await requireParishAccess(data.parishId, true);
    }

    const updatedPilgrimage = await updatePilgrimage(id, data, userId);
    return createSuccessResponse(updatedPilgrimage);
  }, { endpoint: '/api/pilgrimages/[id]', method: 'PUT' });
}

/**
 * DELETE /api/pilgrimages/[id] - Delete pilgrimage
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(async () => {
    await requirePermission(PILGRIMAGES_PERMISSIONS.DELETE);

    const { id } = await params;

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid pilgrimage ID format', 400);
    }

    const pilgrimage = await getPilgrimageById(id);
    await requireParishAccess(pilgrimage.parishId, true);

    const deletedPilgrimage = await deletePilgrimage(id);
    return createSuccessResponse(deletedPilgrimage);
  }, { endpoint: '/api/pilgrimages/[id]', method: 'DELETE' });
}
