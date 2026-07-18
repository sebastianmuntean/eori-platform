import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, like, and, isNull, sql, gte, lte, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { addParishFilter } from '@/lib/api-utils/authorization';
import { handleApiRoute, createErrorResponse } from '@/lib/api-utils/error-handling';

const searchDocumentsSchema = z.object({
  parishId: z.string().uuid().optional(),
  documentType: z.enum(['incoming', 'outgoing', 'internal']).optional(),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  year: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  senderName: z.string().optional(),
  recipientName: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  pageSize: z.number().int().min(1).max(100).optional(),
});

/**
 * POST /api/registry/search - Advanced search for documents
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);
    const { userId, user } = await getCurrentUser();

    const body = await request.json();
    const validation = searchDocumentsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    const paginationParams = new URLSearchParams();
    paginationParams.set('page', String(data.page || 1));
    if (data.limit !== undefined) {
      paginationParams.set('limit', String(data.limit));
    } else if (data.pageSize !== undefined) {
      paginationParams.set('pageSize', String(data.pageSize));
    }
    const { page, pageSize, offset } = parsePaginationParams(paginationParams);

    const conditions: SQL[] = [isNull(documentRegistry.deletedAt)];

    if (data.parishId) {
      conditions.push(eq(documentRegistry.parishId, data.parishId));
    } else {
      await addParishFilter(conditions, documentRegistry, user?.parishId ?? null, userId ?? undefined);
    }

    if (data.documentType) {
      conditions.push(eq(documentRegistry.documentType, data.documentType));
    }

    if (data.status) {
      conditions.push(eq(documentRegistry.status, data.status));
    }

    if (data.priority) {
      conditions.push(eq(documentRegistry.priority, data.priority));
    }

    if (data.year) {
      conditions.push(eq(documentRegistry.registrationYear, data.year));
    }

    if (data.startDate) {
      const startDateStr = new Date(data.startDate).toISOString().split('T')[0];
      conditions.push(gte(documentRegistry.registrationDate, startDateStr));
    }

    if (data.endDate) {
      const endDateStr = new Date(data.endDate).toISOString().split('T')[0];
      conditions.push(lte(documentRegistry.registrationDate, endDateStr));
    }

    if (data.subject) {
      conditions.push(like(documentRegistry.subject, `%${data.subject}%`));
    }

    if (data.content) {
      conditions.push(like(documentRegistry.content || '', `%${data.content}%`));
    }

    if (data.senderName) {
      conditions.push(like(documentRegistry.senderName || '', `%${data.senderName}%`));
    }

    if (data.recipientName) {
      conditions.push(like(documentRegistry.recipientName || '', `%${data.recipientName}%`));
    }

    if (data.departmentId) {
      conditions.push(eq(documentRegistry.departmentId, data.departmentId));
    }

    if (data.assignedTo) {
      conditions.push(eq(documentRegistry.assignedTo, data.assignedTo));
    }

    const whereClause = and(...conditions);

    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documentRegistry)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const documents = await db
      .select()
      .from(documentRegistry)
      .where(whereClause)
      .orderBy(sql`${documentRegistry.registrationDate} DESC NULLS LAST`)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/registry/search', method: 'POST' });
}
