import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employmentContracts, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createEmploymentContractSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  contractNumber: z.string().min(1, 'Contract number is required').max(50),
  contractType: z.enum(['indeterminate', 'determinate', 'part_time', 'internship', 'consultant']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  probationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3).optional().default('RON'),
  workingHoursPerWeek: z.number().int().min(1).max(168),
  workLocation: z.string().max(255).optional().nullable(),
  jobDescription: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'suspended']).optional().default('draft'),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/hr/employment-contracts - Fetch all employment contracts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(employmentContracts.contractNumber, `%${search}%`),
          like(employmentContracts.workLocation || '', `%${search}%`)
        )!
      );
    }

    if (employeeId) {
      conditions.push(eq(employmentContracts.employeeId, employeeId));
    }

    if (status) {
      conditions.push(eq(employmentContracts.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employmentContracts)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    const sortColumn = employmentContracts[sortBy as keyof typeof employmentContracts];
    if (sortColumn) {
      orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderBy = desc(employmentContracts.startDate);
    }

    const offset = (page - 1) * pageSize;
    const contractsList = await db
      .select()
      .from(employmentContracts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

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
    logError(error, { endpoint: '/api/hr/employment-contracts', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/hr/employment-contracts - Create a new employment contract
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createEmploymentContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if employee exists
    const [existingEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 400 }
      );
    }

    // Check for duplicate contract number
    const [existingContract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.contractNumber, data.contractNumber))
      .limit(1);

    if (existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract number already exists' },
        { status: 400 }
      );
    }

    // Create contract
    const [newContract] = await db
      .insert(employmentContracts)
      .values({
        employeeId: data.employeeId,
        contractNumber: data.contractNumber,
        contractType: data.contractType,
        startDate: data.startDate,
        endDate: data.endDate || null,
        probationEndDate: data.probationEndDate || null,
        baseSalary: data.baseSalary,
        currency: data.currency || 'RON',
        workingHoursPerWeek: data.workingHoursPerWeek,
        workLocation: data.workLocation || null,
        jobDescription: data.jobDescription || null,
        status: data.status || 'draft',
        notes: data.notes || null,
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
    logError(error, { endpoint: '/api/hr/employment-contracts', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

