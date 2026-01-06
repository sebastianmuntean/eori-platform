import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { payments, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const createDonationSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  paymentNumber: z.string().min(1, 'Payment number is required').max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional().default('RON'),
  description: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'check']).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional().default('pending'),
});

/**
 * GET /api/accounting/donations - Fetch all donations (filtered payments)
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/accounting/donations - Fetching donations');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions - donations are payments with type='income' and category='donation'
    const conditions = [
      eq(payments.type, 'income'),
      eq(payments.category, 'donation'),
    ];

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

    if (status) {
      conditions.push(eq(payments.status, status as 'pending' | 'completed' | 'cancelled'));
    }

    if (dateFrom) {
      conditions.push(gte(payments.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(payments.date, dateTo));
    }

    const whereClause = and(...conditions as any[]);

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(payments).where(whereClause);
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const baseQuery = db.select().from(payments).where(whereClause);

    // Apply sorting
    let query;
    if (sortBy === 'date') {
      query = sortOrder === 'desc' 
        ? baseQuery.orderBy(desc(payments.date))
        : baseQuery.orderBy(asc(payments.date));
    } else if (sortBy === 'paymentNumber') {
      query = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(payments.paymentNumber))
        : baseQuery.orderBy(asc(payments.paymentNumber));
    } else if (sortBy === 'amount') {
      query = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(payments.amount))
        : baseQuery.orderBy(asc(payments.amount));
    } else {
      query = baseQuery.orderBy(desc(payments.createdAt));
    }

    const allDonations = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allDonations,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching donations:', error);
    logError(error, { endpoint: '/api/accounting/donations', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/donations - Create a new donation (creates payment with type='income' and category='donation')
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/accounting/donations - Creating new donation');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createDonationSchema.safeParse(body);

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

    // Check if client exists (if provided)
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
          { success: false, error: 'Client not found' },
          { status: 400 }
        );
      }
    }

    // Create donation as payment with type='income' and category='donation'
    console.log('Step 4: Creating donation');
    const [newDonation] = await db
      .insert(payments)
      .values({
        parishId: data.parishId,
        paymentNumber: data.paymentNumber,
        date: data.date,
        type: 'income',
        category: 'donation',
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

    console.log(`✓ Donation created successfully: ${newDonation.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newDonation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating donation:', error);
    logError(error, { endpoint: '/api/accounting/donations', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

