import { db } from '@/database/client';
import { registerConfigurations, parishes, generalRegister } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const updateRegisterConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  parishId: z.string().uuid().optional().nullable(),
  resetsAnnually: z.boolean().optional(),
  startingNumber: z.number().int().min(1).optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registry/register-configurations/[id] - Get single register configuration
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_VIEW);

    const [config] = await db
      .select({
        id: registerConfigurations.id,
        name: registerConfigurations.name,
        parishId: registerConfigurations.parishId,
        resetsAnnually: registerConfigurations.resetsAnnually,
        startingNumber: registerConfigurations.startingNumber,
        notes: registerConfigurations.notes,
        createdBy: registerConfigurations.createdBy,
        createdAt: registerConfigurations.createdAt,
        updatedAt: registerConfigurations.updatedAt,
        updatedBy: registerConfigurations.updatedBy,
        parish: {
          id: parishes.id,
          name: parishes.name,
          code: parishes.code,
        },
      })
      .from(registerConfigurations)
      .leftJoin(parishes, eq(registerConfigurations.parishId, parishes.id))
      .where(eq(registerConfigurations.id, id))
      .limit(1);

    if (!config) {
      return createErrorResponse('Register configuration not found', 404);
    }

    return createSuccessResponse(config);
  }, { endpoint: '/api/registry/register-configurations/[id]', method: 'GET' });
}

/**
 * PUT /api/registry/register-configurations/[id] - Update register configuration
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_UPDATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = updateRegisterConfigSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    const [existingConfig] = await db
      .select()
      .from(registerConfigurations)
      .where(eq(registerConfigurations.id, id))
      .limit(1);

    if (!existingConfig) {
      return createErrorResponse('Register configuration not found', 404);
    }

    if (data.parishId !== undefined && data.parishId !== null) {
      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        return createErrorResponse('Parish not found', 400);
      }
    }

    const updateData: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.resetsAnnually !== undefined) updateData.resetsAnnually = data.resetsAnnually;
    if (data.startingNumber !== undefined) updateData.startingNumber = data.startingNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedConfig] = await db
      .update(registerConfigurations)
      .set(updateData)
      .where(eq(registerConfigurations.id, id))
      .returning();

    return createSuccessResponse(updatedConfig);
  }, { endpoint: '/api/registry/register-configurations/[id]', method: 'PUT' });
}

/**
 * DELETE /api/registry/register-configurations/[id] - Delete register configuration
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_DELETE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [existingConfig] = await db
      .select()
      .from(registerConfigurations)
      .where(eq(registerConfigurations.id, id))
      .limit(1);

    if (!existingConfig) {
      return createErrorResponse('Register configuration not found', 404);
    }

    const documents = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.registerConfigurationId, id))
      .limit(1);

    if (documents.length > 0) {
      return createErrorResponse(
        'Cannot delete register configuration: documents reference it',
        400
      );
    }

    await db
      .delete(registerConfigurations)
      .where(eq(registerConfigurations.id, id));

    return createSuccessResponse(null, 'Register configuration deleted successfully');
  }, { endpoint: '/api/registry/register-configurations/[id]', method: 'DELETE' });
}
