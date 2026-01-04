import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { payments, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const createPaymentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  paymentNumber: z.string().min(1, 'Payment number is required').max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['income', 'expense'], { errorMap: () => ({ message: 'Type must be income or expense' }) }),
  category: z.string().max(100).optional().nullable(),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional().default('RON'),
  description: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'check']).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional().default('pending'),
});

/**
 * GET /api/accounting/payments - Fetch all payments with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/accounting/payments - Fetching payments');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const type = searchParams.get('type'); // 'income' | 'expense'
    const status = searchParams.get('status'); // 'pending' | 'completed' | 'cancelled'
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, parishId: ${parishId}, type: ${type}, status: ${status}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(payments.paymentNumber, `%${search}%`),
          like(payments.description || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(payments.parishId, parishId));
    }

    if (type) {
      conditions.push(eq(payments.type, type as 'income' | 'expense'));
    }

    if (status) {
      conditions.push(eq(payments.status, status as 'pending' | 'completed' | 'cancelled'));
    }

    if (category) {
      conditions.push(like(payments.category || '', `%${category}%`));
    }

    if (dateFrom) {
      conditions.push(gte(payments.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(payments.date, dateTo));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(payments);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(payments);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'date') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(payments.date))
        : query.orderBy(asc(payments.date));
    } else if (sortBy === 'paymentNumber') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(payments.paymentNumber))
        : query.orderBy(asc(payments.paymentNumber));
    } else if (sortBy === 'amount') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(payments.amount))
        : query.orderBy(asc(payments.amount));
    } else {
      query = query.orderBy(desc(payments.createdAt));
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
    console.error('❌ Error fetching payments:', error);
    logError(error, { endpoint: '/api/accounting/payments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/payments - Create a new payment
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/accounting/payments - Creating new payment');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parish exists
    console.log(`Step 2: Checking if parish ${data.parishId} exists`);
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      console.log(`❌ Parish ${data.parishId} not found`);
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 400 }
      );
    }

    // Check if partner exists (if provided)
    if (data.clientId) {
      console.log(`Step 3: Checking if client ${data.clientId} exists`);
      const [existingClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.clientId))
        .limit(1);

      if (!existingClient) {
        console.log(`❌ Client ${data.clientId} not found`);
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 400 }
        );
      }
    }

    // Create payment
    console.log('Step 4: Creating payment');
    const [newPayment] = await db
      .insert(payments)
      .values({
        parishId: data.parishId,
        paymentNumber: data.paymentNumber,
        date: data.date,
        type: data.type,
        category: data.category || null,
        clientId: data.clientId || null,
        amount: data.amount.toString(),
        currency: data.currency || 'RON',
        description: data.description || null,
        paymentMethod: data.paymentMethod || null,
        referenceNumber: data.referenceNumber || null,
        status: data.status || 'pending',
        createdBy: userId,
      })
      .returning();

    console.log(`✓ Payment created successfully: ${newPayment.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating payment:', error);
    logError(error, { endpoint: '/api/accounting/payments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



