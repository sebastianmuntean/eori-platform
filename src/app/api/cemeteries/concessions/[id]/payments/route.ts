import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryConcessionPayments, cemeteryConcessions, payments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { 
  normalizePaginationParams, 
  normalizeSortParams, 
  validateUuid,
  validateDateRange 
} from '@/lib/utils/cemetery';

const createPaymentSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional().default('RON'),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Period start must be in YYYY-MM-DD format'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Period end must be in YYYY-MM-DD format'),
  receiptNumber: z.string().max(50).optional().nullable(),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().optional().nullable(),
  createAccountingPayment: z.boolean().optional().default(true),
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
    
    const { sortBy, sortOrder } = normalizeSortParams(
      searchParams,
      ['paymentDate', 'amount', 'createdAt'] as const,
      'paymentDate',
      'desc'
    );

    // Verify concession exists
    const [concession] = await db
      .select()
      .from(cemeteryConcessions)
      .where(eq(cemeteryConcessions.id, id))
      .limit(1);

    if (!concession) {
      return NextResponse.json(
        { success: false, error: 'Concession not found' },
        { status: 404 }
      );
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryConcessionPayments)
      .where(eq(cemeteryConcessionPayments.concessionId, id));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    let query = db
      .select()
      .from(cemeteryConcessionPayments)
      .where(eq(cemeteryConcessionPayments.concessionId, id));

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
    logError(error, { endpoint: '/api/cemeteries/concessions/[id]/payments', method: 'GET' });
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
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify concession exists
    const [concession] = await db
      .select()
      .from(cemeteryConcessions)
      .where(eq(cemeteryConcessions.id, id))
      .limit(1);

    if (!concession) {
      return NextResponse.json(
        { success: false, error: 'Concession not found' },
        { status: 404 }
      );
    }

    const data = validation.data;

    // Validate period is within concession period (use Date objects for proper comparison)
    const periodStartDate = new Date(data.periodStart);
    const periodEndDate = new Date(data.periodEnd);
    const concessionStartDate = new Date(concession.startDate);
    const concessionExpiryDate = new Date(concession.expiryDate);

    if (periodStartDate < concessionStartDate || periodEndDate > concessionExpiryDate) {
      return NextResponse.json(
        { success: false, error: 'Payment period must be within concession period' },
        { status: 400 }
      );
    }

    // Verify client exists before creating payments (if accounting payment is requested)
    if (data.createAccountingPayment) {
      const { clients } = await import('@/database/schema');
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, concession.holderClientId))
        .limit(1);

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Client not found for accounting payment' },
          { status: 400 }
        );
      }
    }

    // Business rule validation: periodStart must be <= periodEnd
    const dateRangeValidation = validateDateRange(data.periodStart, data.periodEnd);
    if (!dateRangeValidation.valid) {
      return NextResponse.json(
        { success: false, error: dateRangeValidation.error },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Create concession payment
      const [newPayment] = await tx
        .insert(cemeteryConcessionPayments)
        .values({
          concessionId: id,
          parishId: concession.parishId,
          paymentDate: data.paymentDate,
          amount: data.amount.toString(),
          currency: data.currency || 'RON',
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          receiptNumber: data.receiptNumber || null,
          receiptDate: data.receiptDate || null,
          notes: data.notes || null,
          createdBy: userId,
        })
        .returning();

      // Create accounting payment if requested
      if (data.createAccountingPayment) {
        // Generate payment number
        const paymentCountResult = await tx
          .select({ count: sql<number>`count(*)` })
          .from(payments)
          .where(eq(payments.parishId, concession.parishId));
        const paymentCount = Number(paymentCountResult[0]?.count || 0);
        const paymentNumber = `INC-${paymentCount + 1}`;

        await tx.insert(payments).values({
          parishId: concession.parishId,
          paymentNumber,
          date: data.paymentDate,
          type: 'income',
          category: 'Concesiune cimitir',
          clientId: concession.holderClientId,
          amount: data.amount.toString(),
          currency: data.currency || 'RON',
          description: `Plată concesiune ${concession.contractNumber} - Perioada ${data.periodStart} - ${data.periodEnd}`,
          status: 'completed',
          createdBy: userId,
          transactionId: newPayment.id,
        });
      }

      return newPayment;
    });

    const newPayment = result;

    return NextResponse.json(
      {
        success: true,
        data: newPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/[id]/payments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

