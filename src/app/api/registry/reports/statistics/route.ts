import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull, sql, type SQL } from 'drizzle-orm';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { addParishFilter } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse } from '@/lib/api-utils/error-handling';

/**
 * GET /api/registry/reports/statistics - Get document statistics
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);
    const { userId, user } = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const departmentId = searchParams.get('departmentId');

    const conditions: SQL[] = [isNull(documentRegistry.deletedAt)];

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    } else {
      await addParishFilter(conditions, documentRegistry, user?.parishId ?? null, userId ?? undefined);
    }

    if (year) {
      conditions.push(eq(documentRegistry.registrationYear, year));
    }

    if (departmentId) {
      conditions.push(eq(documentRegistry.departmentId, departmentId));
    }

    const whereClause = and(...conditions);

    const byType = await db
      .select({
        documentType: documentRegistry.documentType,
        count: sql<number>`COUNT(*)`,
      })
      .from(documentRegistry)
      .where(whereClause)
      .groupBy(documentRegistry.documentType);

    const byStatus = await db
      .select({
        status: documentRegistry.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(documentRegistry)
      .where(whereClause)
      .groupBy(documentRegistry.status);

    const byPriority = await db
      .select({
        priority: documentRegistry.priority,
        count: sql<number>`COUNT(*)`,
      })
      .from(documentRegistry)
      .where(whereClause)
      .groupBy(documentRegistry.priority);

    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documentRegistry)
      .where(whereClause);
    const total = Number(totalResult[0]?.count || 0);

    return createSuccessResponse({
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.documentType || 'unknown'] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status || 'unknown'] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority || 'unknown'] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
    });
  }, { endpoint: '/api/registry/reports/statistics', method: 'GET' });
}
