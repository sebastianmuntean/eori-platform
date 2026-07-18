import { requireAuth, requirePermission } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import {
  handleApiRoute,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api-utils/error-handling';
import { resolveGeneralRegisterDocument } from '@/lib/services/general-register-workflow-service';
import { generalRegisterResolutionStatusEnum } from '@/database/schema/register';
import { z } from 'zod';

const resolveDocumentSchema = z.object({
  resolutionStatus: z.enum(
    generalRegisterResolutionStatusEnum.enumValues as [string, ...string[]]
  ),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  workflowStepId: z.string().uuid().optional().nullable(),
});

/**
 * POST /api/registry/general-register/[id]/resolve - Resolve document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;
      // Auth only at HTTP layer; resolve eligibility is enforced in the service
      // (creator, in_work assignee, or general_register.resolve_any).
      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

      const body = await request.json();
      const validation = resolveDocumentSchema.safeParse(body);

      if (!validation.success) {
        return createErrorResponse(validation.error.errors[0].message, 400);
      }

      const hasResolveAnyPermission = await hasPermission(
        userId,
        'general_register.resolve_any'
      );

      const result = await resolveGeneralRegisterDocument(
        id,
        userId,
        {
          resolutionStatus: validation.data.resolutionStatus as 'approved' | 'rejected',
          resolution: validation.data.resolution,
          notes: validation.data.notes,
          workflowStepId: validation.data.workflowStepId,
        },
        hasResolveAnyPermission
      );

      return createSuccessResponse(result);
    },
    { endpoint: '/api/registry/general-register/[id]/resolve', method: 'POST' }
  );
}
