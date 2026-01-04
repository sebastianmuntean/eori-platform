import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contracts, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const createContractSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  contractNumber: z.string().min(1, 'Contract number is required').max(50),
  direction: z.enum(['incoming', 'outgoing'], { errorMap: () => ({ message: 'Direction must be incoming or outgoing' }) }),
  type: z.enum(['rental', 'concession', 'sale_purchase', 'loan', 'other'], { errorMap: () => ({ message: 'Invalid contract type' }) }),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'renewed']).optional().default('draft'),
  clientId: z.string().uuid('Invalid client ID'),
  title: z.string().max(255).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  signingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Signing date must be in YYYY-MM-DD format').optional().nullable(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number'),
  currency: z.string().length(3).optional().default('RON'),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'semiannual', 'annual', 'one_time', 'custom'], { errorMap: () => ({ message: 'Invalid payment frequency' }) }),
  assetReference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  renewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Renewal date must be in YYYY-MM-DD format').optional().nullable(),
  autoRenewal: z.boolean().optional().default(false),
  parentContractId: z.string().uuid('Invalid parent contract ID').optional().nullable(),
  invoiceItemTemplate: z.any().optional().nullable(), // Template for invoice line items
});

/**
 * GET /api/accounting/contracts - Fetch all contracts with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/accounting/contracts - Fetching contracts');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const direction = searchParams.get('direction'); // 'incoming' | 'outgoing'
    const type = searchParams.get('type'); // 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other'
    const status = searchParams.get('status'); // 'draft' | 'active' | 'expired' | 'terminated' | 'renewed'
    const clientId = searchParams.get('clientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, parishId: ${parishId}, direction: ${direction}, type: ${type}, status: ${status}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(contracts.contractNumber, `%${search}%`),
          like(contracts.title || '', `%${search}%`),
          like(contracts.description || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(contracts.parishId, parishId));
    }

    if (direction) {
      conditions.push(eq(contracts.direction, direction as 'incoming' | 'outgoing'));
    }

    if (type) {
      conditions.push(eq(contracts.type, type as 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other'));
    }

    if (status) {
      conditions.push(eq(contracts.status, status as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed'));
    }

    if (clientId) {
      conditions.push(eq(contracts.clientId, clientId));
    }

    if (dateFrom) {
      conditions.push(gte(contracts.startDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(contracts.endDate, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    const sortColumn = contracts[sortBy as keyof typeof contracts];
    if (sortColumn) {
      orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderBy = desc(contracts.startDate);
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const contractsList = await db
      .select()
      .from(contracts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    console.log(`✓ Found ${contractsList.length} contracts (total: ${total})`);

    return NextResponse.json({
      success: true,
      data: contractsList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching contracts:', error);
    logError(error, { endpoint: '/api/accounting/contracts', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/contracts - Create a new contract
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/accounting/contracts - Creating new contract');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createContractSchema.safeParse(body);

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
        { success: false, error: 'Partner not found' },
        { status: 400 }
      );
    }

    // Check if parent contract exists (if provided)
    if (data.parentContractId) {
      console.log(`Step 4: Checking if parent contract ${data.parentContractId} exists`);
      const [existingParentContract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, data.parentContractId))
        .limit(1);

      if (!existingParentContract) {
        console.log(`❌ Parent contract ${data.parentContractId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parent contract not found' },
          { status: 400 }
        );
      }
    }

    // Create contract
    console.log('Step 5: Creating contract');
    const [newContract] = await db
      .insert(contracts)
      .values({
        parishId: data.parishId,
        contractNumber: data.contractNumber,
        direction: data.direction,
        type: data.type,
        status: data.status || 'draft',
        clientId: data.clientId,
        title: data.title || null,
        startDate: data.startDate,
        endDate: data.endDate,
        signingDate: data.signingDate || null,
        amount: data.amount,
        currency: data.currency || 'RON',
        paymentFrequency: data.paymentFrequency,
        assetReference: data.assetReference || null,
        description: data.description || null,
        terms: data.terms || null,
        notes: data.notes || null,
        renewalDate: data.renewalDate || null,
        autoRenewal: data.autoRenewal || false,
        parentContractId: data.parentContractId || null,
        createdBy: userId,
      })
      .returning();

    console.log(`✓ Contract created successfully: ${newContract.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newContract,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating contract:', error);
    logError(error, { endpoint: '/api/accounting/contracts', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

