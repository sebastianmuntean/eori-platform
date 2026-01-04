import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/client';
import { auditLogs, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requireRole } from '@/lib/auth';
import { eq, and, desc, asc, like, gte, lte, sql, or } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  userId: z.string().uuid().optional(),
  action: z.enum(['create', 'update', 'delete', 'read', 'login', 'logout', 'export', 'import', 'approve', 'reject']).optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'action', 'resource_type']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/audit-logs - Query audit logs (admin only)
 * 
 * Supports filtering, pagination, and sorting.
 * Only users with 'superadmin' role can access this endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and superadmin role
    await requireAuth();
    await requireRole('superadmin');

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '50',
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      resourceId: searchParams.get('resourceId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'created_at',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      page,
      pageSize,
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      search,
      sortBy,
      sortOrder,
    } = validation.data;

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }

    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    if (search) {
      conditions.push(
        or(
          like(auditLogs.endpoint, `%${search}%`),
          like(auditLogs.resourceType, `%${search}%`),
          like(auditLogs.userAgent, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs);
    
    if (whereClause) {
      countQuery = countQuery.where(whereClause) as any;
    }

    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query with joins for user information
    let query = db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userEmail: users.email,
        userName: users.name,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        requestMethod: auditLogs.requestMethod,
        endpoint: auditLogs.endpoint,
        changes: auditLogs.changes,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id));

    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    // Apply sorting
    if (sortBy === 'created_at') {
      query = (sortOrder === 'desc'
        ? query.orderBy(desc(auditLogs.createdAt))
        : query.orderBy(asc(auditLogs.createdAt))) as any;
    } else if (sortBy === 'action') {
      query = (sortOrder === 'desc'
        ? query.orderBy(desc(auditLogs.action))
        : query.orderBy(asc(auditLogs.action))) as any;
    } else if (sortBy === 'resource_type') {
      query = (sortOrder === 'desc'
        ? query.orderBy(desc(auditLogs.resourceType))
        : query.orderBy(asc(auditLogs.resourceType))) as any;
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const logs = await (query.limit(pageSize).offset(offset) as any);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    logError(error, { endpoint: '/api/audit-logs', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

