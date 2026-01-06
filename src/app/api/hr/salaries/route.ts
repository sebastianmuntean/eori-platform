import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries, employees, employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc, asc, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const createSalarySchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  contractId: z.string().uuid('Invalid contract ID'),
  salaryPeriod: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/),
  grossSalary: z.string().regex(/^\d+(\.\d{1,2})?$/),
  netSalary: z.string().regex(/^\d+(\.\d{1,2})?$/),
  totalBenefits: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default('0'),
  totalDeductions: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default('0'),
  workingDays: z.number().int().min(0),
  workedDays: z.number().int().min(0),
  status: z.enum(['draft', 'calculated', 'approved', 'paid', 'cancelled']).optional().default('draft'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const employeeId = searchParams.get('employeeId');
    const contractId = searchParams.get('contractId');
    const status = searchParams.get('status');
    const periodFrom = searchParams.get('periodFrom');
    const periodTo = searchParams.get('periodTo');
    const sortBy = searchParams.get('sortBy') || 'salaryPeriod';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(salaries.employeeId, employeeId));
    }

    if (contractId) {
      conditions.push(eq(salaries.contractId, contractId));
    }

    if (status) {
      conditions.push(eq(salaries.status, status as any));
    }

    if (periodFrom) {
      conditions.push(gte(salaries.salaryPeriod, periodFrom));
    }

    if (periodTo) {
      conditions.push(lte(salaries.salaryPeriod, periodTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(salaries)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    switch (sortBy) {
      case 'id':
        orderBy = sortOrder === 'asc' ? asc(salaries.id) : desc(salaries.id);
        break;
      case 'employeeId':
        orderBy = sortOrder === 'asc' ? asc(salaries.employeeId) : desc(salaries.employeeId);
        break;
      case 'contractId':
        orderBy = sortOrder === 'asc' ? asc(salaries.contractId) : desc(salaries.contractId);
        break;
      case 'salaryPeriod':
        orderBy = sortOrder === 'asc' ? asc(salaries.salaryPeriod) : desc(salaries.salaryPeriod);
        break;
      case 'baseSalary':
        orderBy = sortOrder === 'asc' ? asc(salaries.baseSalary) : desc(salaries.baseSalary);
        break;
      case 'grossSalary':
        orderBy = sortOrder === 'asc' ? asc(salaries.grossSalary) : desc(salaries.grossSalary);
        break;
      case 'netSalary':
        orderBy = sortOrder === 'asc' ? asc(salaries.netSalary) : desc(salaries.netSalary);
        break;
      case 'status':
        orderBy = sortOrder === 'asc' ? asc(salaries.status) : desc(salaries.status);
        break;
      case 'createdAt':
        orderBy = sortOrder === 'asc' ? asc(salaries.createdAt) : desc(salaries.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder === 'asc' ? asc(salaries.updatedAt) : desc(salaries.updatedAt);
        break;
      default:
        orderBy = desc(salaries.salaryPeriod);
    }

    const offset = (page - 1) * pageSize;
    const salariesList = await db
      .select()
      .from(salaries)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: salariesList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

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
    const validation = createSalarySchema.safeParse(body);

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

    // Check if contract exists
    const [existingContract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.id, data.contractId))
      .limit(1);

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 400 }
      );
    }

    // Create salary
    const [newSalary] = await db
      .insert(salaries)
      .values({
        employeeId: data.employeeId,
        contractId: data.contractId,
        salaryPeriod: data.salaryPeriod,
        baseSalary: data.baseSalary,
        grossSalary: data.grossSalary,
        netSalary: data.netSalary,
        totalBenefits: data.totalBenefits || '0',
        totalDeductions: data.totalDeductions || '0',
        workingDays: data.workingDays,
        workedDays: data.workedDays,
        status: data.status || 'draft',
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newSalary,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

