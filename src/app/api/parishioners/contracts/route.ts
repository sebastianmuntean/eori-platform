import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishionerContracts, clients, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const createContractSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required').max(50),
  parishionerId: z.string().uuid('Invalid parishioner ID'),
  parishId: z.string().uuid('Invalid parish ID'),
  contractType: z.enum(['donation', 'service', 'rental', 'other']),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'renewed']).optional().default('draft'),
  title: z.string().max(255).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional().nullable(),
  signingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Signing date must be in YYYY-MM-DD format').optional().nullable(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number').optional().nullable(),
  currency: z.string().length(3).optional().default('RON'),
  terms: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  renewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Renewal date must be in YYYY-MM-DD format').optional().nullable(),
  autoRenewal: z.boolean().optional().default(false),
  parentContractId: z.string().uuid('Invalid parent contract ID').optional().nullable(),
});

/**
 * GET /api/parishioners/contracts - Fetch all contracts with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100); // Max 100 items per page
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const parishionerId = searchParams.get('parishionerId');
    const contractType = searchParams.get('contractType');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(parishionerContracts.contractNumber, `%${search}%`),
          like(parishionerContracts.title || '', `%${search}%`),
          like(parishionerContracts.description || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(parishionerContracts.parishId, parishId));
    }

    if (parishionerId) {
      conditions.push(eq(parishionerContracts.parishionerId, parishionerId));
    }

    if (contractType) {
      conditions.push(eq(parishionerContracts.contractType, contractType as 'donation' | 'service' | 'rental' | 'other'));
    }

    if (status) {
      conditions.push(eq(parishionerContracts.status, status as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed'));
    }

    if (dateFrom) {
      conditions.push(gte(parishionerContracts.startDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(parishionerContracts.endDate || parishionerContracts.startDate, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    if (sortBy === 'contractNumber') {
      orderBy = sortOrder === 'desc' ? desc(parishionerContracts.contractNumber) : asc(parishionerContracts.contractNumber);
    } else if (sortBy === 'startDate') {
      orderBy = sortOrder === 'desc' ? desc(parishionerContracts.startDate) : asc(parishionerContracts.startDate);
    } else if (sortBy === 'amount') {
      orderBy = sortOrder === 'desc' ? desc(parishionerContracts.amount) : asc(parishionerContracts.amount);
    } else {
      orderBy = desc(parishionerContracts.startDate);
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(parishionerContracts)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get contracts with pagination
    const offset = (page - 1) * pageSize;
    const allContracts = await db
      .select()
      .from(parishionerContracts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: allContracts,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/parishioners/contracts - Create a new contract
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if contract number already exists
    const existingContract = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.contractNumber, data.contractNumber))
      .limit(1);

    if (existingContract.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Contract with this number already exists' },
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

    const [newContract] = await db
      .insert(parishionerContracts)
      .values({
        contractNumber: data.contractNumber,
        parishionerId: data.parishionerId,
        parishId: data.parishId,
        contractType: data.contractType,
        status: data.status || 'draft',
        title: data.title || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        signingDate: data.signingDate || null,
        amount: data.amount || null,
        currency: data.currency || 'RON',
        terms: data.terms || null,
        description: data.description || null,
        notes: data.notes || null,
        renewalDate: data.renewalDate || null,
        autoRenewal: data.autoRenewal || false,
        parentContractId: data.parentContractId || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newContract,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

