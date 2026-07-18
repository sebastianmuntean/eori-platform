import { db } from '@/database/client';
import { registerConfigurations, parishes } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { addParishFilter } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const createRegisterConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  parishId: z.string().uuid().optional().nullable(),
  resetsAnnually: z.boolean().optional().default(false),
  startingNumber: z.number().int().min(1).optional().default(1),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registry/register-configurations - List all register configurations
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_VIEW);
    const { userId, user } = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');

    const conditions: SQL[] = [];
    if (parishId) {
      conditions.push(eq(registerConfigurations.parishId, parishId));
    } else {
      await addParishFilter(conditions, registerConfigurations, user?.parishId ?? null, userId ?? undefined);
    }

    const configs = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(registerConfigurations.name);

    return createSuccessResponse(configs);
  }, { endpoint: '/api/registry/register-configurations', method: 'GET' });
}

/**
 * POST /api/registry/register-configurations - Create new register configuration
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_CREATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createRegisterConfigSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    if (data.parishId) {
      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        return createErrorResponse('Parish not found', 400);
      }
    }

    const [newConfig] = await db
      .insert(registerConfigurations)
      .values({
        name: data.name,
        parishId: data.parishId || null,
        resetsAnnually: data.resetsAnnually || false,
        startingNumber: data.startingNumber || 1,
        notes: data.notes || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return createSuccessResponse(newConfig);
  }, { endpoint: '/api/registry/register-configurations', method: 'POST' });
}
