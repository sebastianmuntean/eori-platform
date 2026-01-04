import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, desc, asc, and, sql, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { 
  buildSearchCondition, 
  normalizePaginationParams, 
  normalizeSortParams,
  validateUuid,
  buildWhereClause
} from '@/lib/utils/cemetery';

const createCemeterySchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  totalArea: z.number().positive().optional().nullable(),
  totalPlots: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = normalizePaginationParams(searchParams);
    const search = searchParams.get('search');
    const parishId = searchParams.get('parishId');
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['name', 'code', 'createdAt'] as const,
      'name'
    );

    const conditions = [];

    // Validate parishId if provided
    if (parishId) {
      const uuidValidation = validateUuid(parishId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: uuidValidation.error },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteries.parishId, parishId));
    }

    // Build search condition
    const searchCondition = buildSearchCondition(search, [
      { column: cemeteries.code },
      { column: cemeteries.name },
      { column: cemeteries.address, useCoalesce: true },
      { column: cemeteries.city, useCoalesce: true },
      { column: cemeteries.county, useCoalesce: true },
    ]);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteries);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    let query = db.select().from(cemeteries);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'code') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteries.code))
        : query.orderBy(asc(cemeteries.code));
    } else if (sortBy === 'name') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteries.name))
        : query.orderBy(asc(cemeteries.name));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteries.createdAt))
        : query.orderBy(asc(cemeteries.createdAt));
    } else {
      query = query.orderBy(asc(cemeteries.name));
    }

    const allCemeteries = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allCemeteries,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication and permission
    const { userId } = await requireAuth();
    await requirePermission(CEMETERY_PERMISSIONS.CEMETERIES_CREATE);

    const body = await request.json();
    const validation = createCemeterySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify parish exists
    const { parishes } = await import('@/database/schema');
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    // Check for unique code per parish
    const existingCemetery = await db
      .select()
      .from(cemeteries)
      .where(
        and(
          eq(cemeteries.parishId, data.parishId),
          eq(cemeteries.code, data.code)
        )
      )
      .limit(1);

    if (existingCemetery.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cemetery with this code already exists in this parish' },
        { status: 400 }
      );
    }

    const [newCemetery] = await db
      .insert(cemeteries)
      .values({
        parishId: data.parishId,
        code: data.code,
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        totalArea: data.totalArea?.toString() || null,
        totalPlots: data.totalPlots || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newCemetery,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

