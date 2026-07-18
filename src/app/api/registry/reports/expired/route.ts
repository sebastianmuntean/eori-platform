import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull, sql, type SQL } from 'drizzle-orm';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { addParishFilter } from '@/lib/api-utils/authorization';
import { handleApiRoute } from '@/lib/api-utils/error-handling';

/**
 * GET /api/registry/reports/expired - Get documents with expired due dates
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);
    const { userId, user } = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const departmentId = searchParams.get('departmentId');

    const conditions: SQL[] = [
      isNull(documentRegistry.deletedAt),
      sql`${documentRegistry.dueDate} IS NOT NULL`,
      sql`${documentRegistry.dueDate} < CURRENT_DATE`,
      sql`${documentRegistry.status} NOT IN ('resolved', 'archived')`,
    ];

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    } else {
      await addParishFilter(conditions, documentRegistry, user?.parishId ?? null, userId ?? undefined);
    }

    if (departmentId) {
      conditions.push(eq(documentRegistry.departmentId, departmentId));
    }

    const whereClause = and(...conditions);

    const expiredDocuments = await db
      .select()
      .from(documentRegistry)
      .where(whereClause)
      .orderBy(sql`${documentRegistry.dueDate} ASC`);

    return NextResponse.json({
      success: true,
      data: expiredDocuments,
      count: expiredDocuments.length,
    });
  }, { endpoint: '/api/registry/reports/expired', method: 'GET' });
}
