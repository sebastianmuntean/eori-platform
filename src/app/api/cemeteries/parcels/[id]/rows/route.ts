import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryRows, cemeteryParcels } from '@/database/schema';
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

const createRowSchema = z.object({
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

    // Verify parcel exists
    const [parcel] = await db
      .select()
      .from(cemeteryParcels)
      .where(eq(cemeteryParcels.id, id))
      .limit(1);

    if (!parcel) {
      return NextResponse.json(
        { success: false, error: 'Parcel not found' },
        { status: 404 }
      );
    }

    const conditions = [eq(cemeteryRows.parcelId, id)];

    // Build search condition
    const searchCondition = buildSearchCondition(search, [
      { column: cemeteryRows.code },
      { column: cemeteryRows.name, useCoalesce: true },
    ]);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteryRows);
    const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    const baseQuery = db.select().from(cemeteryRows);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

    // Apply sorting
    let finalQuery;
    if (sortBy === 'code') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(cemeteryRows.code))
        : queryWithWhere.orderBy(asc(cemeteryRows.code));
    } else if (sortBy === 'name') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(cemeteryRows.name))
        : queryWithWhere.orderBy(asc(cemeteryRows.name));
    } else if (sortBy === 'createdAt') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(cemeteryRows.createdAt))
        : queryWithWhere.orderBy(asc(cemeteryRows.createdAt));
    } else {
      finalQuery = queryWithWhere.orderBy(asc(cemeteryRows.code));
    }

    const allRows = await finalQuery.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allRows,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/parcels/[id]/rows', method: 'GET' });
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
    await requirePermission(CEMETERY_PERMISSIONS.ROWS_CREATE);

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
    const validation = createRowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify parcel exists
    const [parcel] = await db
      .select()
      .from(cemeteryParcels)
      .where(eq(cemeteryParcels.id, id))
      .limit(1);

    if (!parcel) {
      return NextResponse.json(
        { success: false, error: 'Parcel not found' },
        { status: 404 }
      );
    }

    const data = validation.data;

    // Check for unique code per parcel
    const existingRow = await db
      .select()
      .from(cemeteryRows)
      .where(
        and(
          eq(cemeteryRows.parcelId, id),
          eq(cemeteryRows.code, data.code)
        )
      )
      .limit(1);

    if (existingRow.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Row with this code already exists in this parcel' },
        { status: 400 }
      );
    }

    const [newRow] = await db
      .insert(cemeteryRows)
      .values({
        parcelId: id,
        cemeteryId: parcel.cemeteryId,
        parishId: parcel.parishId,
        code: data.code,
        name: data.name || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newRow,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/parcels/[id]/rows', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

