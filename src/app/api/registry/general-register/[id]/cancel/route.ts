import { requireAuth, requirePermission } from '@/lib/auth';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import {
  handleApiRoute,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api-utils/error-handling';
import { cancelGeneralRegisterDocument } from '@/lib/services/general-register-workflow-service';
import { z } from 'zod';

const cancelDocumentSchema = z.object({
  cancelAll: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/registry/general-register/[id]/cancel - Cancel document or workflow branch
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;
      // Auth + view; cancel eligibility (creator / in_work assignee) is enforced in the service.
      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

      const body = await request.json();
      const validation = cancelDocumentSchema.safeParse(body);

      if (!validation.success) {
        return createErrorResponse(validation.error.errors[0].message, 400);
      }

      const result = await cancelGeneralRegisterDocument(id, userId, validation.data);
      return createSuccessResponse(result);
    },
    { endpoint: '/api/registry/general-register/[id]/cancel', method: 'POST' }
  );
}
