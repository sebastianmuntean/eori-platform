import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import {
  handleApiRoute,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api-utils/error-handling';
import { AuthorizationError } from '@/lib/errors';
import {
  getGeneralRegisterDocument,
  updateGeneralRegisterDocument,
  deleteGeneralRegisterDocument,
} from '@/lib/services/general-register-service';
import { z } from 'zod';

const updateDocumentSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500).optional(),
  description: z.string().optional().nullable(),
  solutionStatus: z.enum(['approved', 'rejected', 'redirected']).optional().nullable(),
  distributedUserIds: z.array(z.string().uuid()).optional().default([]),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function assertDocumentAccess(
  parishId: string | null,
  createdBy: string,
  userId: string,
  options: { allowCreatorBypass?: boolean } = {}
): Promise<void> {
  const allowCreatorBypass = options.allowCreatorBypass ?? false;
  if (allowCreatorBypass && createdBy === userId) {
    return;
  }
  if (parishId) {
    try {
      await requireParishAccess(parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw new AuthorizationError('You do not have access to this document');
      }
      throw error;
    }
  }
}

/**
 * GET /api/registry/general-register/[id] - Get document by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;

      if (!isValidUUID(id)) {
        return createErrorResponse('Invalid document ID format', 400);
      }

      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

      const document = await getGeneralRegisterDocument(id);
      await assertDocumentAccess(document.parishId, document.createdBy, userId, {
        allowCreatorBypass: true,
      });

      return createSuccessResponse(document);
    },
    { endpoint: '/api/registry/general-register/[id]', method: 'GET' }
  );
}

/**
 * PATCH /api/registry/general-register/[id] - Update document
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;

      if (!isValidUUID(id)) {
        return createErrorResponse('Invalid document ID format', 400);
      }

      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_UPDATE);

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return createErrorResponse('Invalid JSON in request body', 400);
      }

      const validation = updateDocumentSchema.safeParse(body);
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

      const document = await getGeneralRegisterDocument(id);
      await assertDocumentAccess(document.parishId, document.createdBy, userId);

      const updatedDocument = await updateGeneralRegisterDocument(
        id,
        validation.data,
        userId,
        { hasUpdatePermission: true }
      );

      return createSuccessResponse(updatedDocument);
    },
    { endpoint: '/api/registry/general-register/[id]', method: 'PATCH' }
  );
}

/**
 * DELETE /api/registry/general-register/[id] - Delete document
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;

      if (!isValidUUID(id)) {
        return createErrorResponse('Invalid document ID format', 400);
      }

      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_DELETE);

      const document = await getGeneralRegisterDocument(id);
      await assertDocumentAccess(document.parishId, document.createdBy, userId);

      const result = await deleteGeneralRegisterDocument(id);
      return createSuccessResponse(result);
    },
    { endpoint: '/api/registry/general-register/[id]', method: 'DELETE' }
  );
}
