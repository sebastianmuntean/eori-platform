import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { inventorySessions, inventoryItems, parishes, warehouses, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, desc, asc, like, or, gte, lte, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';

const createInventorySessionSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  warehouseId: z.string().uuid('Invalid warehouse ID').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['draft', 'in_progress', 'completed', 'cancelled']).optional().default('draft'),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pangare/inventar - Fetch all inventory sessions with pagination and filtering
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const parishId = searchParams.get('parishId');
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (parishId) {
      conditions.push(eq(inventorySessions.parishId, parishId));
    }

    if (warehouseId) {
      conditions.push(eq(inventorySessions.warehouseId, warehouseId));
    }

    if (status) {
      conditions.push(eq(inventorySessions.status, status as 'draft' | 'in_progress' | 'completed' | 'cancelled'));
    }

    if (dateFrom) {
      conditions.push(gte(inventorySessions.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(inventorySessions.date, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count efficiently
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventorySessions)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results with JOINs to avoid N+1 queries
    const offset = (page - 1) * pageSize;
    const orderBy = sortBy === 'date' 
      ? (sortOrder === 'desc' ? desc(inventorySessions.date) : asc(inventorySessions.date))
      : (sortOrder === 'desc' ? desc(inventorySessions.createdAt) : asc(inventorySessions.createdAt));

    // Build query with LEFT JOINs for related data (flattened select to match Drizzle syntax)
    let sessionsQuery = db
      .select({
        id: inventorySessions.id,
        parishId: inventorySessions.parishId,
        warehouseId: inventorySessions.warehouseId,
        date: inventorySessions.date,
        status: inventorySessions.status,
        notes: inventorySessions.notes,
        createdBy: inventorySessions.createdBy,
        createdAt: inventorySessions.createdAt,
        updatedAt: inventorySessions.updatedAt,
        // Joined data (flattened)
        parishIdJoin: parishes.id,
        parishName: parishes.name,
        warehouseIdJoin: warehouses.id,
        warehouseName: warehouses.name,
        userIdJoin: users.id,
        userName: users.name,
      })
      .from(inventorySessions)
      .leftJoin(parishes, eq(inventorySessions.parishId, parishes.id))
      .leftJoin(warehouses, eq(inventorySessions.warehouseId, warehouses.id))
      .leftJoin(users, eq(inventorySessions.createdBy, users.id));

    const sessionsQueryWithWhere = whereClause ? sessionsQuery.where(whereClause) : sessionsQuery;
    const sessionsData = await sessionsQueryWithWhere
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    // Get item counts for all sessions in a single batch query to avoid N+1
    const sessionIds = sessionsData.map(s => s.id);
    const itemCounts = sessionIds.length > 0
      ? await db
          .select({
            sessionId: inventoryItems.sessionId,
            count: sql<number>`COUNT(*)`,
          })
          .from(inventoryItems)
          .where(inArray(inventoryItems.sessionId, sessionIds))
          .groupBy(inventoryItems.sessionId)
      : [];

    const itemCountMap = new Map(itemCounts.map(ic => [ic.sessionId, Number(ic.count || 0)]));

    // Transform the data to match the expected format
    const enrichedSessions = sessionsData.map((session) => ({
      id: session.id,
      parishId: session.parishId,
      warehouseId: session.warehouseId,
      date: session.date,
      status: session.status,
      notes: session.notes,
      createdBy: session.createdBy,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      parish: session.parishIdJoin ? { id: session.parishIdJoin, name: session.parishName || '' } : null,
      warehouse: session.warehouseIdJoin ? { id: session.warehouseIdJoin, name: session.warehouseName || '' } : null,
      createdByUser: session.userIdJoin ? { id: session.userIdJoin, name: session.userName || '' } : null,
      itemCount: itemCountMap.get(session.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedSessions,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching inventory sessions:', error);
    logError(error, { endpoint: '/api/pangare/inventar', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pangare/inventar - Create a new inventory session
 */
export async function POST(request: Request) {
  try {
    // CSRF protection
    const { requireCsrfToken } = await import('@/lib/middleware/csrf');
    const csrfError = await requireCsrfToken(request);
    if (csrfError) return csrfError;

    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createInventorySessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate parish exists
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 400 }
      );
    }

    // Validate warehouse if provided
    if (data.warehouseId) {
      const [warehouse] = await db
        .select()
        .from(warehouses)
        .where(eq(warehouses.id, data.warehouseId))
        .limit(1);

      if (!warehouse) {
        return NextResponse.json(
          { success: false, error: 'Warehouse not found' },
          { status: 400 }
        );
      }
    }

    // Create session
    const [newSession] = await db
      .insert(inventorySessions)
      .values({
        parishId: data.parishId,
        warehouseId: data.warehouseId || null,
        date: data.date,
        status: data.status || 'draft',
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newSession,
    });
  } catch (error) {
    console.error('❌ Error creating inventory session:', error);
    logError(error, { endpoint: '/api/pangare/inventar', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

