import { db } from '@/database/client';
import { documentNumberCounters } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const generateNumberSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  documentType: z.enum(['incoming', 'outgoing', 'internal']),
  year: z.number().int().min(2000).max(2100).optional(),
});

/**
 * POST /api/registry/number/generate - Generate document registration number
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_CREATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = generateNumberSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;
    const year = data.year || new Date().getFullYear();

    const [existingCounter] = await db
      .select()
      .from(documentNumberCounters)
      .where(
        and(
          eq(documentNumberCounters.parishId, data.parishId),
          eq(documentNumberCounters.year, year),
          eq(documentNumberCounters.documentType, data.documentType)
        )
      )
      .limit(1);

    let nextNumber: number;

    if (existingCounter) {
      nextNumber = existingCounter.currentValue + 1;
      await db
        .update(documentNumberCounters)
        .set({
          currentValue: nextNumber,
          updatedAt: new Date(),
        })
        .where(eq(documentNumberCounters.id, existingCounter.id));
    } else {
      nextNumber = 1;
      await db.insert(documentNumberCounters).values({
        parishId: data.parishId,
        year,
        documentType: data.documentType,
        currentValue: nextNumber,
      });
    }

    const formattedNumber = `${nextNumber}/${year}`;

    return createSuccessResponse({
      registrationNumber: nextNumber,
      formattedNumber,
      year,
    });
  }, { endpoint: '/api/registry/number/generate', method: 'POST' });
}
