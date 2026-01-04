import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryGraves, cemeteryRows } from '@/database/schema';
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
  isValidGraveStatus,
  buildWhereClause
} from '@/lib/utils/cemetery';

const createGraveSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  status: z.enum(['free', 'occupied', 'reserved', 'maintenance']).optional().default('free'),
  width: z.number().positive().optional().nullable(),
  length: z.number().positive().optional().nullable(),
  positionX: z.number().int().optional().nullable(),
  positionY: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
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
    const status = searchParams.get('status');
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['code', 'status', 'createdAt'] as const,
      'code'
    );

    // Verify row exists
    const [row] = await db
      .select()
      .from(cemeteryRows)
      .where(eq(cemeteryRows.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    const conditions = [eq(cemeteryGraves.rowId, id)];

    if (status && isValidGraveStatus(status)) {
      conditions.push(eq(cemeteryGraves.status, status));
    }

    // Build search condition
    const searchCondition = buildSearchCondition(search, [
      { column: cemeteryGraves.code },
      { column: cemeteryGraves.notes, useCoalesce: true },
    ]);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteryGraves);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    let query = db.select().from(cemeteryGraves);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'code') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryGraves.code))
        : query.orderBy(asc(cemeteryGraves.code));
    } else if (sortBy === 'status') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryGraves.status))
        : query.orderBy(asc(cemeteryGraves.status));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryGraves.createdAt))
        : query.orderBy(asc(cemeteryGraves.createdAt));
    } else {
      query = query.orderBy(asc(cemeteryGraves.code));
    }

    const allGraves = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allGraves,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/rows/[id]/graves', method: 'GET' });
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
    await requirePermission(CEMETERY_PERMISSIONS.GRAVES_CREATE);

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
    const validation = createGraveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify row exists
    const [row] = await db
      .select()
      .from(cemeteryRows)
      .where(eq(cemeteryRows.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    const data = validation.data;

    // Check for unique code per row
    const existingGrave = await db
      .select()
      .from(cemeteryGraves)
      .where(
        and(
          eq(cemeteryGraves.rowId, id),
          eq(cemeteryGraves.code, data.code)
        )
      )
      .limit(1);

    if (existingGrave.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Grave with this code already exists in this row' },
        { status: 400 }
      );
    }

    const [newGrave] = await db
      .insert(cemeteryGraves)
      .values({
        rowId: id,
        parcelId: row.parcelId,
        cemeteryId: row.cemeteryId,
        parishId: row.parishId,
        code: data.code,
        status: data.status || 'free',
        width: data.width?.toString() || null,
        length: data.length?.toString() || null,
        positionX: data.positionX || null,
        positionY: data.positionY || null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newGrave,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/rows/[id]/graves', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

