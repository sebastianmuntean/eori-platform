import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { burials, cemeteryGraves, cemeteries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, desc, asc, and, sql, gte, lte, or, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { 
  normalizePaginationParams, 
  normalizeSortParams, 
  validateUuid,
  buildSearchCondition,
  buildWhereClause
} from '@/lib/utils/cemetery';

const createBurialSchema = z.object({
  graveId: z.string().uuid('Invalid grave ID'),
  cemeteryId: z.string().uuid('Invalid cemetery ID'),
  parishId: z.string().uuid('Invalid parish ID'),
  deceasedClientId: z.string().uuid('Invalid client ID').optional().nullable(),
  deceasedName: z.string().min(1, 'Deceased name is required').max(255),
  deceasedBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  deceasedDeathDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Death date must be in YYYY-MM-DD format'),
  burialDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Burial date must be in YYYY-MM-DD format'),
  burialCertificateNumber: z.string().max(50).optional().nullable(),
  burialCertificateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = normalizePaginationParams(searchParams);
    const search = searchParams.get('search');
    const parishId = searchParams.get('parishId');
    const cemeteryId = searchParams.get('cemeteryId');
    const graveId = searchParams.get('graveId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['burialDate', 'deceasedName', 'createdAt'] as const,
      'burialDate',
      'desc'
    );

    const conditions = [];

    // Validate and add filters
    if (parishId) {
      const uuidValidation = validateUuid(parishId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid parishId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(burials.parishId, parishId));
    }

    if (cemeteryId) {
      const uuidValidation = validateUuid(cemeteryId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid cemeteryId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(burials.cemeteryId, cemeteryId));
    }

    if (graveId) {
      const uuidValidation = validateUuid(graveId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid graveId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(burials.graveId, graveId));
    }

    if (dateFrom) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
        return NextResponse.json(
          { success: false, error: 'Invalid dateFrom format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(gte(burials.burialDate, dateFrom));
    }

    if (dateTo) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        return NextResponse.json(
          { success: false, error: 'Invalid dateTo format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(lte(burials.burialDate, dateTo));
    }

    // Build search condition
    const searchCondition = buildSearchCondition(search, [
      { column: burials.deceasedName },
      { column: burials.burialCertificateNumber, useCoalesce: true },
      { column: burials.notes, useCoalesce: true },
    ]);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(burials);
    const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    const baseQuery = db.select().from(burials);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

    // Apply sorting
    let finalQuery;
    if (sortBy === 'burialDate') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(burials.burialDate))
        : queryWithWhere.orderBy(asc(burials.burialDate));
    } else if (sortBy === 'deceasedName') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(burials.deceasedName))
        : queryWithWhere.orderBy(asc(burials.deceasedName));
    } else if (sortBy === 'createdAt') {
      finalQuery = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(burials.createdAt))
        : queryWithWhere.orderBy(asc(burials.createdAt));
    } else {
      finalQuery = queryWithWhere.orderBy(desc(burials.burialDate));
    }

    const allBurials = await finalQuery.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allBurials,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/burials', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication and permission
    const { userId } = await requireAuth();
    await requirePermission(CEMETERY_PERMISSIONS.BURIALS_CREATE);

    const body = await request.json();
    const validation = createBurialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Business rule validation: burialDate must be >= deceasedDeathDate
    if (data.deceasedDeathDate && data.burialDate < data.deceasedDeathDate) {
      return NextResponse.json(
        { success: false, error: 'Burial date must be on or after death date' },
        { status: 400 }
      );
    }

    // Verify grave exists
    const [grave] = await db
      .select()
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.id, data.graveId))
      .limit(1);

    if (!grave) {
      return NextResponse.json(
        { success: false, error: 'Grave not found' },
        { status: 404 }
      );
    }

    // Verify cemetery matches
    if (grave.cemeteryId !== data.cemeteryId) {
      return NextResponse.json(
        { success: false, error: 'Cemetery ID does not match grave' },
        { status: 400 }
      );
    }

    // Check grave status - should be free or reserved
    if (grave.status === 'occupied') {
      return NextResponse.json(
        { success: false, error: 'Grave is already occupied' },
        { status: 400 }
      );
    }

    // Verify client exists if provided
    if (data.deceasedClientId) {
      const { clients } = await import('@/database/schema');
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.deceasedClientId))
        .limit(1);

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Create burial
      const [newBurial] = await tx
        .insert(burials)
        .values({
          graveId: data.graveId,
          cemeteryId: data.cemeteryId,
          parishId: data.parishId,
          deceasedClientId: data.deceasedClientId || null,
          deceasedName: data.deceasedName,
          deceasedBirthDate: data.deceasedBirthDate || null,
          deceasedDeathDate: data.deceasedDeathDate,
          burialDate: data.burialDate,
          burialCertificateNumber: data.burialCertificateNumber || null,
          burialCertificateDate: data.burialCertificateDate || null,
          notes: data.notes || null,
          createdBy: userId,
        })
        .returning();

      // Update grave status to 'occupied'
      await tx
        .update(cemeteryGraves)
        .set({ status: 'occupied', updatedAt: new Date() })
        .where(eq(cemeteryGraves.id, data.graveId));

      return newBurial;
    });

    const newBurial = result;

    return NextResponse.json(
      {
        success: true,
        data: newBurial,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/burials', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

