import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryConcessions, cemeteryGraves, cemeteries, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { eq, desc, asc, and, sql, gte, lte, or, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { 
  normalizePaginationParams, 
  normalizeSortParams, 
  validateUuid,
  buildSearchCondition,
  validateDateRange 
} from '@/lib/utils/cemetery';

const createConcessionSchema = z.object({
  graveId: z.string().uuid('Invalid grave ID'),
  cemeteryId: z.string().uuid('Invalid cemetery ID'),
  parishId: z.string().uuid('Invalid parish ID'),
  holderClientId: z.string().uuid('Invalid client ID'),
  contractNumber: z.string().min(1, 'Contract number is required').max(50),
  contractDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Contract date must be in YYYY-MM-DD format'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  durationYears: z.number().int().positive('Duration must be positive'),
  annualFee: z.number().positive('Annual fee must be positive'),
  currency: z.string().length(3).optional().default('RON'),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional().default('active'),
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
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['contractDate', 'contractNumber', 'expiryDate', 'createdAt'] as const,
      'contractDate',
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
      conditions.push(eq(cemeteryConcessions.parishId, parishId));
    }

    if (cemeteryId) {
      const uuidValidation = validateUuid(cemeteryId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid cemeteryId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryConcessions.cemeteryId, cemeteryId));
    }

    if (graveId) {
      const uuidValidation = validateUuid(graveId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid graveId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryConcessions.graveId, graveId));
    }

    if (status) {
      const validStatuses = ['active', 'expired', 'cancelled', 'pending'] as const;
      if (validStatuses.includes(status as any)) {
        conditions.push(eq(cemeteryConcessions.status, status as typeof validStatuses[number]));
      }
    }

    if (clientId) {
      const uuidValidation = validateUuid(clientId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid clientId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryConcessions.holderClientId, clientId));
    }

    // Build search condition
    const searchCondition = buildSearchCondition(search, [
      { column: cemeteryConcessions.contractNumber },
      { column: cemeteryConcessions.notes, useCoalesce: true },
    ]);

    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteryConcessions);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    let query = db.select().from(cemeteryConcessions);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'contractNumber') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessions.contractNumber))
        : query.orderBy(asc(cemeteryConcessions.contractNumber));
    } else if (sortBy === 'contractDate') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessions.contractDate))
        : query.orderBy(asc(cemeteryConcessions.contractDate));
    } else if (sortBy === 'expiryDate') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessions.expiryDate))
        : query.orderBy(asc(cemeteryConcessions.expiryDate));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessions.createdAt))
        : query.orderBy(asc(cemeteryConcessions.createdAt));
    } else {
      query = query.orderBy(desc(cemeteryConcessions.contractDate));
    }

    const allConcessions = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allConcessions,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication and permission
    const { userId } = await requireAuth();
    await requirePermission('cemeteries.concessions.create');

    const body = await request.json();
    const validation = createConcessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Business rule validation: expiryDate must be > startDate
    const dateRangeValidation = validateDateRange(data.startDate, data.expiryDate);
    if (!dateRangeValidation.valid) {
      return NextResponse.json(
        { success: false, error: dateRangeValidation.error },
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

    // Verify client exists
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, data.holderClientId))
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check for unique contract number per parish
    const existingConcession = await db
      .select()
      .from(cemeteryConcessions)
      .where(
        and(
          eq(cemeteryConcessions.parishId, data.parishId),
          eq(cemeteryConcessions.contractNumber, data.contractNumber)
        )
      )
      .limit(1);

    if (existingConcession.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Concession with this contract number already exists in this parish' },
        { status: 400 }
      );
    }

    // Check if grave is available (status should be 'free')
    if (grave.status !== 'free') {
      return NextResponse.json(
        { success: false, error: 'Grave is not available for concession. Current status: ' + grave.status },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Create concession
      const [newConcession] = await tx
        .insert(cemeteryConcessions)
        .values({
          graveId: data.graveId,
          cemeteryId: data.cemeteryId,
          parishId: data.parishId,
          holderClientId: data.holderClientId,
          contractNumber: data.contractNumber,
          contractDate: data.contractDate,
          startDate: data.startDate,
          expiryDate: data.expiryDate,
          durationYears: data.durationYears,
          annualFee: data.annualFee.toString(),
          currency: data.currency || 'RON',
          status: data.status || 'active',
          notes: data.notes || null,
          createdBy: userId,
        })
        .returning();

      // Update grave status to 'reserved'
      await tx
        .update(cemeteryGraves)
        .set({ status: 'reserved', updatedAt: new Date() })
        .where(eq(cemeteryGraves.id, data.graveId));

      return newConcession;
    });

    const newConcession = result;

    return NextResponse.json(
      {
        success: true,
        data: newConcession,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

