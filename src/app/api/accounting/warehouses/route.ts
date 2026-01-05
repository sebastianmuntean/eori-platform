import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { warehouses, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createWarehouseSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['general', 'retail', 'storage', 'temporary']).optional().default('general'),
  address: z.string().optional().nullable(),
  responsibleName: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  invoiceSeries: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/accounting/warehouses - Fetch all warehouses with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    // Require authentication and permission
    await requirePermission(ACCOUNTING_PERMISSIONS.WAREHOUSES_VIEW);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(warehouses.code, `%${search}%`),
          like(warehouses.name, `%${search}%`),
          like(warehouses.address || '', `%${search}%`),
          like(warehouses.invoiceSeries || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(warehouses.parishId, parishId));
    }

    if (type) {
      conditions.push(eq(warehouses.type, type as 'general' | 'retail' | 'storage' | 'temporary'));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(warehouses.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    if (sortBy === 'name') {
      orderBy = sortOrder === 'desc' ? desc(warehouses.name) : asc(warehouses.name);
    } else if (sortBy === 'code') {
      orderBy = sortOrder === 'desc' ? desc(warehouses.code) : asc(warehouses.code);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(warehouses.createdAt) : asc(warehouses.createdAt);
    } else {
      orderBy = asc(warehouses.name);
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(warehouses)
      .where(whereClause);
    
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(warehouses);
    if (whereClause) {
      query = query.where(whereClause);
    }

    const allWarehouses = await query.orderBy(orderBy).limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allWarehouses,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching warehouses:', error);
    logError(error, { endpoint: '/api/accounting/warehouses', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/warehouses - Create a new warehouse
 */
export async function POST(request: Request) {
  try {
    // Require authentication and permission
    const { userId } = await requireAuth();
    await requirePermission(ACCOUNTING_PERMISSIONS.WAREHOUSES_CREATE);

    const body = await request.json();
    const validation = createWarehouseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parish exists
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 400 }
      );
    }

    // Check if code already exists for this parish
    const [existingWarehouse] = await db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.parishId, data.parishId),
          eq(warehouses.code, data.code)
        )
      )
      .limit(1);

    if (existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse code already exists for this parish' },
        { status: 400 }
      );
    }

    // Create warehouse
    const [newWarehouse] = await db
      .insert(warehouses)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newWarehouse,
    });
  } catch (error) {
    console.error('❌ Error creating warehouse:', error);
    logError(error, { endpoint: '/api/accounting/warehouses', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

