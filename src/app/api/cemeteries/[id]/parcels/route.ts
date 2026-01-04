import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryParcels, cemeteries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { 
  normalizePaginationParams, 
  normalizeSortParams, 
  validateUuid,
  buildSearchCondition 
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

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteryParcels);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    let query = db.select().from(cemeteryParcels);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'code') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryParcels.code))
        : query.orderBy(asc(cemeteryParcels.code));
    } else if (sortBy === 'name') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryParcels.name))
        : query.orderBy(asc(cemeteryParcels.name));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryParcels.createdAt))
        : query.orderBy(asc(cemeteryParcels.createdAt));
    } else {
      query = query.orderBy(asc(cemeteryParcels.code));
    }

    const allParcels = await query.limit(pageSize).offset(offset);

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
    await requirePermission('cemeteries.parcels.create');

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

