import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import {
  handleApiRoute,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api-utils/error-handling';
import {
  getWorkflowTree,
  createWorkflowStep,
} from '@/lib/services/general-register-workflow-service';
import { z } from 'zod';

const routeDocumentSchema = z.object({
  parentStepId: z.string().uuid().optional().nullable(),
  toUserId: z.string().uuid(),
  action: z.enum(['sent', 'forwarded', 'returned']),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registry/general-register/[id]/workflow - Get workflow history as tree
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;
      await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

      const tree = await getWorkflowTree(id);
      return createSuccessResponse(tree);
    },
    { endpoint: '/api/registry/general-register/[id]/workflow', method: 'GET' }
  );
}

/**
 * POST /api/registry/general-register/[id]/workflow - Create workflow step
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApiRoute(
    async () => {
      const { id } = await params;
      const { userId } = await requireAuth();
      await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_UPDATE);

      const body = await request.json();
      const validation = routeDocumentSchema.safeParse(body);

      if (!validation.success) {
        return createErrorResponse(validation.error.errors[0].message, 400);
      }

      const workflowStep = await createWorkflowStep(id, userId, validation.data);

      return NextResponse.json(
        { success: true, data: workflowStep },
        { status: 201 }
      );
    },
    { endpoint: '/api/registry/general-register/[id]/workflow', method: 'POST' }
  );
}
