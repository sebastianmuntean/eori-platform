import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { invoices, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql, max, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { generateStockMovementsFromInvoice } from '@/lib/stock-movements';

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vat: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative(),
  productId: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid().optional().nullable(),
  unitCost: z.number().nonnegative().optional().nullable(),
});

const createInvoiceSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  series: z.string().min(1, 'Series is required').max(20).optional().default('INV'),
  number: z.number().int().positive().optional(), // Optional - will be auto-generated if not provided
  invoiceNumber: z.string().max(50).optional().or(z.literal('')), // Optional - will be auto-generated from series+number, allow empty string
  type: z.enum(['issued', 'received'], { errorMap: () => ({ message: 'Type must be issued or received' }) }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  clientId: z.string().uuid('Invalid client ID'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  currency: z.string().length(3).optional().default('RON'),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional().default('draft'),
  warehouseId: z.string().uuid('Invalid warehouse ID').optional().nullable().or(z.literal('')),
}).transform((data) => ({
  ...data,
  // Convert empty string to undefined for invoiceNumber
  invoiceNumber: data.invoiceNumber === '' ? undefined : data.invoiceNumber,
  // Convert empty string to null for warehouseId
  warehouseId: data.warehouseId === '' ? null : data.warehouseId,
}));

/**
 * GET /api/accounting/invoices - Fetch all invoices with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/accounting/invoices - Fetching invoices');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const type = searchParams.get('type'); // 'issued' | 'received'
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, parishId: ${parishId}, type: ${type}, status: ${status}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(invoices.invoiceNumber, searchPattern),
          sql`COALESCE(${invoices.description}, '') LIKE ${searchPattern}`
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(invoices.parishId, parishId));
    }

    if (type) {
      conditions.push(eq(invoices.type, type as 'issued' | 'received'));
    }

    if (status) {
      conditions.push(eq(invoices.status, status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'));
    }

    if (clientId) {
      conditions.push(eq(invoices.clientId, clientId));
    }

    if (dateFrom) {
      conditions.push(gte(invoices.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(invoices.date, dateTo));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(invoices);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    // Explicitly select columns to avoid warehouse_id issue until migration 0022 is applied
    let query = db.select({
      id: invoices.id,
      parishId: invoices.parishId,
      series: invoices.series,
      number: invoices.number,
      invoiceNumber: invoices.invoiceNumber,
      type: invoices.type,
      date: invoices.date,
      dueDate: invoices.dueDate,
      clientId: invoices.clientId,
      amount: invoices.amount,
      vat: invoices.vat,
      total: invoices.total,
      currency: invoices.currency,
      status: invoices.status,
      paymentDate: invoices.paymentDate,
      description: invoices.description,
      items: invoices.items,
      createdBy: invoices.createdBy,
      createdAt: invoices.createdAt,
      updatedAt: invoices.updatedAt,
      updatedBy: invoices.updatedBy,
    }).from(invoices);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'date') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(invoices.date))
        : query.orderBy(asc(invoices.date));
    } else if (sortBy === 'invoiceNumber') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(invoices.invoiceNumber))
        : query.orderBy(asc(invoices.invoiceNumber));
    } else if (sortBy === 'total') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(invoices.total))
        : query.orderBy(asc(invoices.total));
    } else {
      query = query.orderBy(desc(invoices.createdAt));
    }

    const allInvoices = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allInvoices,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    logError(error, { endpoint: '/api/accounting/invoices', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/invoices - Create a new invoice
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/accounting/invoices - Creating new invoice');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createInvoiceSchema.safeParse(body);

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

    // Check if client exists
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

    // Get or generate series and number
    console.log('Step 4: Getting or generating invoice series and number');
    const series = data.series || 'INV';
    
    // If number is not provided, get the next number for this series, parish, type, and warehouse
    let invoiceNumber = data.number;
    if (!invoiceNumber) {
      const conditions = [
        eq(invoices.parishId, data.parishId),
        eq(invoices.series, series),
        eq(invoices.type, data.type)
      ];

      // Include warehouseId in the query if provided
      if (data.warehouseId) {
        conditions.push(eq(invoices.warehouseId, data.warehouseId));
      } else {
        // If no warehouseId, only get invoices without warehouse
        conditions.push(isNull(invoices.warehouseId));
      }

      const maxNumberResult = await db
        .select({ maxNumber: max(invoices.number) })
        .from(invoices)
        .where(and(...conditions));
      
      const maxNumber = maxNumberResult[0]?.maxNumber 
        ? Number(maxNumberResult[0].maxNumber) 
        : 0;
      
      invoiceNumber = maxNumber + 1;
      console.log(`✓ Generated next invoice number: ${invoiceNumber} for series ${series}, warehouse ${data.warehouseId || 'none'}`);
    }

    // Generate invoice_number from series and number if not provided
    const generatedInvoiceNumber = data.invoiceNumber || `${series}-${String(invoiceNumber).padStart(6, '0')}`;

    // Check if invoice with same series+number already exists
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.parishId, data.parishId),
          eq(invoices.series, series),
          eq(invoices.number, invoiceNumber.toString()),
          eq(invoices.type, data.type)
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      console.log(`❌ Invoice with series ${series} and number ${invoiceNumber} already exists`);
      return NextResponse.json(
        { success: false, error: `Invoice with series ${series} and number ${invoiceNumber} already exists` },
        { status: 400 }
      );
    }

    // Calculate totals from items
    console.log('Step 5: Calculating totals from items');
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const vatTotal = data.items.reduce((sum, item) => sum + (item.vat || 0), 0);
    const total = subtotal + vatTotal;

    // Create invoice
    // Note: Using raw SQL to handle both 'date' and 'issue_date' columns for backward compatibility
    // The database may still have 'issue_date' as NOT NULL from older migrations
    console.log('Step 6: Creating invoice');
    const result = await db.execute(sql`
      INSERT INTO invoices (
        parish_id, series, number, invoice_number, type,
        issue_date, date, due_date,
        client_id,
        amount, subtotal, vat, vat_amount, total,
        currency, status, description, items,
        warehouse_id, created_by, created_at, updated_at
      ) VALUES (
        ${data.parishId}::uuid,
        ${series},
        ${invoiceNumber.toString()}::numeric,
        ${generatedInvoiceNumber},
        ${data.type}::invoice_type,
        ${data.date}::date,
        ${data.date}::date,
        ${data.dueDate}::date,
        ${data.clientId}::uuid,
        ${subtotal.toString()}::numeric,
        ${subtotal.toString()}::numeric,
        ${vatTotal.toString()}::numeric,
        ${vatTotal.toString()}::numeric,
        ${total.toString()}::numeric,
        ${data.currency || 'RON'},
        ${data.status || 'draft'}::invoice_status,
        ${data.description || null},
        ${JSON.stringify(data.items)}::jsonb,
        ${data.warehouseId || null}::uuid,
        ${userId}::uuid,
        NOW(),
        NOW()
      ) RETURNING id
    `);
    
    // Extract invoice ID from result
    let invoiceId: string;
    if (result && typeof result === 'object') {
      if ('rows' in result && Array.isArray(result.rows) && result.rows.length > 0) {
        invoiceId = result.rows[0].id;
      } else if (Array.isArray(result) && result.length > 0) {
        invoiceId = result[0].id;
      } else if ('id' in result) {
        invoiceId = (result as any).id;
      } else {
        throw new Error('Failed to get invoice ID from insert result');
      }
    } else {
      throw new Error('Failed to get invoice ID from insert result');
    }
    
    // Fetch the created invoice using Drizzle
    const [newInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    
    if (!newInvoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    console.log(`✓ Invoice created successfully: ${newInvoice.id}`);

    // Generate stock movements if invoice has stock items
    try {
      await generateStockMovementsFromInvoice(
        newInvoice.id,
        data.type,
        data.date,
        data.items,
        data.parishId,
        data.clientId,
        userId
      );
      console.log('✓ Stock movements generated for invoice');
    } catch (stockError) {
      console.error('⚠ Error generating stock movements:', stockError);
      // Don't fail the invoice creation, but log the error
    }

    return NextResponse.json(
      {
        success: true,
        data: newInvoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    logError(error, { endpoint: '/api/accounting/invoices', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

