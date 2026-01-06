import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryParcels, cemeteries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { 
  normalizePaginationParams, 
  normalizeSortParams, 
  validateUuid,
  buildSearchCondition,
  buildWhereClause
} from '@/lib/utils/cemetery';

const createParcelSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().max(255).optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = normalizePaginationParams(searchParams);
    const search = searchParams.get('search');
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['code', 'name', 'createdAt'] as const,
      'code'
    );

    // Verify cemetery exists
    const [cemetery] = await db
      .select()
      .from(cemeteries)
      .where(eq(cemeteries.id, id))
      .limit(1);

    if (!cemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    const conditions = [eq(cemeteryParcels.cemeteryId, id)];

    // Build search condition
    const searchCondition = buildSearchCondition(search, [
      { column: cemeteryParcels.code },
      { column: cemeteryParcels.name, useCoalesce: true },
    ]);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteryParcels);
    const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    const baseQuery = db.select().from(cemeteryParcels);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

    // Apply sorting
    let finalQuery;
    if (sortBy === 'code') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(cemeteryParcels.code))
        : queryWithWhere.orderBy(asc(cemeteryParcels.code));
    } else if (sortBy === 'name') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(cemeteryParcels.name))
        : queryWithWhere.orderBy(asc(cemeteryParcels.name));
    } else if (sortBy === 'createdAt') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(cemeteryParcels.createdAt))
        : queryWithWhere.orderBy(asc(cemeteryParcels.createdAt));
    } else {
      finalQuery = queryWithWhere.orderBy(asc(cemeteryParcels.code));
    }

    const allParcels = await finalQuery.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allParcels,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/[id]/parcels', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and permission
    await requireAuth();
    await requirePermission(CEMETERY_PERMISSIONS.PARCELS_CREATE);

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = createParcelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify cemetery exists
    const [cemetery] = await db
      .select()
      .from(cemeteries)
      .where(eq(cemeteries.id, id))
      .limit(1);

    if (!cemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    const data = validation.data;

    // Check for unique code per cemetery
    const existingParcel = await db
      .select()
      .from(cemeteryParcels)
      .where(
        and(
          eq(cemeteryParcels.cemeteryId, id),
          eq(cemeteryParcels.code, data.code)
        )
      )
      .limit(1);

    if (existingParcel.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Parcel with this code already exists in this cemetery' },
        { status: 400 }
      );
    }

    const [newParcel] = await db
      .insert(cemeteryParcels)
      .values({
        cemeteryId: id,
        parishId: cemetery.parishId,
        code: data.code,
        name: data.name || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newParcel,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/[id]/parcels', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

