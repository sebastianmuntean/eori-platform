import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryConcessionPayments, cemeteryConcessions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { eq, desc, asc, and, sql, gte, lte } from 'drizzle-orm';
import { 
  normalizePaginationParams, 
  normalizeSortParams, 
  validateUuid 
} from '@/lib/utils/cemetery';

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = normalizePaginationParams(searchParams);
    const parishId = searchParams.get('parishId');
    const cemeteryId = searchParams.get('cemeteryId');
    const concessionId = searchParams.get('concessionId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['paymentDate', 'amount', 'createdAt'] as const,
      'paymentDate',
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
      conditions.push(eq(cemeteryConcessionPayments.parishId, parishId));
    }

    if (concessionId) {
      const uuidValidation = validateUuid(concessionId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid concessionId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryConcessionPayments.concessionId, concessionId));
    }

    if (dateFrom) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
        return NextResponse.json(
          { success: false, error: 'Invalid dateFrom format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(gte(cemeteryConcessionPayments.paymentDate, dateFrom));
    }

    if (dateTo) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        return NextResponse.json(
          { success: false, error: 'Invalid dateTo format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(lte(cemeteryConcessionPayments.paymentDate, dateTo));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(cemeteryConcessionPayments);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query - join with concessions to filter by cemeteryId if needed
    let query = db.select({
      id: cemeteryConcessionPayments.id,
      concessionId: cemeteryConcessionPayments.concessionId,
      parishId: cemeteryConcessionPayments.parishId,
      paymentDate: cemeteryConcessionPayments.paymentDate,
      amount: cemeteryConcessionPayments.amount,
      currency: cemeteryConcessionPayments.currency,
      periodStart: cemeteryConcessionPayments.periodStart,
      periodEnd: cemeteryConcessionPayments.periodEnd,
      receiptNumber: cemeteryConcessionPayments.receiptNumber,
      receiptDate: cemeteryConcessionPayments.receiptDate,
      transactionId: cemeteryConcessionPayments.transactionId,
      notes: cemeteryConcessionPayments.notes,
      createdAt: cemeteryConcessionPayments.createdAt,
      createdBy: cemeteryConcessionPayments.createdBy,
    }).from(cemeteryConcessionPayments);

    // Handle cemeteryId filter with join
    if (cemeteryId) {
      const uuidValidation = validateUuid(cemeteryId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid cemeteryId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      query = query
        .innerJoin(cemeteryConcessions, eq(cemeteryConcessionPayments.concessionId, cemeteryConcessions.id));
      
      const joinConditions = [eq(cemeteryConcessions.cemeteryId, cemeteryId)];
      if (whereClause) {
        joinConditions.push(whereClause);
      }
      query = query.where(and(...joinConditions));
    } else if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'paymentDate') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessionPayments.paymentDate))
        : query.orderBy(asc(cemeteryConcessionPayments.paymentDate));
    } else if (sortBy === 'amount') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessionPayments.amount))
        : query.orderBy(asc(cemeteryConcessionPayments.amount));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(cemeteryConcessionPayments.createdAt))
        : query.orderBy(asc(cemeteryConcessionPayments.createdAt));
    } else {
      query = query.orderBy(desc(cemeteryConcessionPayments.paymentDate));
    }

    const allPayments = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allPayments,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/payments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

