import { db } from '@/database/client';
import { registerConfigurations, parishes } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, isNotNull } from 'drizzle-orm';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * POST /api/registry/register-configurations/create-for-parishes
 * Creates register configurations for all active parishes that don't have one
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_CREATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const activeParishes = await db
      .select({
        id: parishes.id,
        name: parishes.name,
        code: parishes.code,
      })
      .from(parishes)
      .where(eq(parishes.isActive, true));

    const existingConfigs = await db
      .select({
        parishId: registerConfigurations.parishId,
      })
      .from(registerConfigurations)
      .where(isNotNull(registerConfigurations.parishId));

    const existingParishIds = new Set(
      existingConfigs.map((config) => config.parishId).filter(Boolean) as string[]
    );

    const parishesWithoutRegisters = activeParishes.filter(
      (parish) => !existingParishIds.has(parish.id)
    );

    const createdRegisters = [];

    for (const parish of parishesWithoutRegisters) {
      const [newConfig] = await db
        .insert(registerConfigurations)
        .values({
          name: `Registru ${parish.name}`,
          parishId: parish.id,
          resetsAnnually: true,
          startingNumber: 1,
          notes: `Registru pentru parohia ${parish.name} (${parish.code})`,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      createdRegisters.push({
        id: newConfig.id,
        name: newConfig.name,
        parishId: parish.id,
        parishName: parish.name,
        parishCode: parish.code,
      });
    }

    return createSuccessResponse({
      created: createdRegisters.length,
      registers: createdRegisters,
    });
  }, { endpoint: '/api/registry/register-configurations/create-for-parishes', method: 'POST' });
}
