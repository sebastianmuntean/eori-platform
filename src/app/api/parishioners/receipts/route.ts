import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { receipts, clients, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql, ilike } from 'drizzle-orm';
import { z } from 'zod';

const createReceiptSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required').max(50),
  parishionerId: z.string().uuid('Invalid parishioner ID'),
  parishId: z.string().uuid('Invalid parish ID'),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Receipt date must be in YYYY-MM-DD format'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number'),
  currency: z.string().length(3).optional().default('RON'),
  purpose: z.string().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  status: z.enum(['draft', 'issued', 'cancelled']).optional().default('draft'),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/parishioners/receipts - Fetch all receipts with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100); // Max 100 items per page
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const parishionerId = searchParams.get('parishionerId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'receiptDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(receipts.receiptNumber, `%${search}%`),
          like(receipts.purpose || '', `%${search}%`),
          like(receipts.notes || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(receipts.parishId, parishId));
    }

    if (parishionerId) {
      conditions.push(eq(receipts.parishionerId, parishionerId));
    }

    if (status) {
      conditions.push(eq(receipts.status, status as 'draft' | 'issued' | 'cancelled'));
    }

    if (dateFrom) {
      conditions.push(gte(receipts.receiptDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(receipts.receiptDate, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    if (sortBy === 'receiptNumber') {
      orderBy = sortOrder === 'desc' ? desc(receipts.receiptNumber) : asc(receipts.receiptNumber);
    } else if (sortBy === 'receiptDate') {
      orderBy = sortOrder === 'desc' ? desc(receipts.receiptDate) : asc(receipts.receiptDate);
    } else if (sortBy === 'amount') {
      orderBy = sortOrder === 'desc' ? desc(receipts.amount) : asc(receipts.amount);
    } else {
      orderBy = desc(receipts.receiptDate);
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(receipts)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get receipts with pagination
    const offset = (page - 1) * pageSize;
    const allReceipts = await db
      .select({
        id: receipts.id,
        receiptNumber: receipts.receiptNumber,
        parishionerId: receipts.parishionerId,
        parishId: receipts.parishId,
        receiptDate: receipts.receiptDate,
        amount: receipts.amount,
        currency: receipts.currency,
        purpose: receipts.purpose,
        paymentMethod: receipts.paymentMethod,
        status: receipts.status,
        notes: receipts.notes,
        issuedBy: receipts.issuedBy,
        createdAt: receipts.createdAt,
        updatedAt: receipts.updatedAt,
      })
      .from(receipts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: allReceipts,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/parishioners/receipts - Create a new receipt
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createReceiptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if receipt number already exists
    const existingReceipt = await db
      .select()
      .from(receipts)
      .where(eq(receipts.receiptNumber, data.receiptNumber))
      .limit(1);

    if (existingReceipt.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Receipt with this number already exists' },
        { status: 400 }
      );
    }

    // Verify parishioner exists
    const [parishioner] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, data.parishionerId))
      .limit(1);

    if (!parishioner) {
      return NextResponse.json(
        { success: false, error: 'Parishioner not found' },
        { status: 404 }
      );
    }

    // Verify parish exists
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    const [newReceipt] = await db
      .insert(receipts)
      .values({
        receiptNumber: data.receiptNumber,
        parishionerId: data.parishionerId,
        parishId: data.parishId,
        receiptDate: data.receiptDate,
        amount: data.amount,
        currency: data.currency || 'RON',
        purpose: data.purpose || null,
        paymentMethod: data.paymentMethod || null,
        status: data.status || 'draft',
        notes: data.notes || null,
        issuedBy: data.status === 'issued' ? userId : null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newReceipt,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

