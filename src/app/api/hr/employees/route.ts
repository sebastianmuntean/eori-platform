import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employees, parishes, departments, positions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
  employeeNumber: z.string().min(1, 'Employee number is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  cnp: z.string().max(13).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format'),
  employmentStatus: z.enum(['active', 'on_leave', 'terminated', 'retired']).optional().default('active'),
  bankName: z.string().max(255).optional().nullable(),
  iban: z.string().max(34).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/hr/employees - Fetch all employees with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('hr.employees.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const departmentId = searchParams.get('departmentId');
    const positionId = searchParams.get('positionId');
    const employmentStatus = searchParams.get('employmentStatus');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'lastName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(employees.firstName, `%${search}%`),
          like(employees.lastName, `%${search}%`),
          like(employees.employeeNumber, `%${search}%`),
          like(employees.email || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(employees.parishId, parishId));
    }

    if (departmentId) {
      conditions.push(eq(employees.departmentId, departmentId));
    }

    if (positionId) {
      conditions.push(eq(employees.positionId, positionId));
    }

    if (employmentStatus) {
      conditions.push(eq(employees.employmentStatus, employmentStatus as any));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(employees.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Build order by clause
    let orderBy;
    // Map sortBy to actual column, with validation
    if (sortBy === 'lastName') {
      orderBy = sortOrder === 'asc' ? asc(employees.lastName) : desc(employees.lastName);
    } else if (sortBy === 'firstName') {
      orderBy = sortOrder === 'asc' ? asc(employees.firstName) : desc(employees.firstName);
    } else if (sortBy === 'employeeNumber') {
      orderBy = sortOrder === 'asc' ? asc(employees.employeeNumber) : desc(employees.employeeNumber);
    } else if (sortBy === 'email') {
      orderBy = sortOrder === 'asc' ? asc(employees.email) : desc(employees.email);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'asc' ? asc(employees.createdAt) : desc(employees.createdAt);
    } else {
      orderBy = asc(employees.lastName);
    }

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const employeesList = await db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: employeesList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/hr/employees - Create a new employee
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

    const hasPermission = await checkPermission('hr.employees.create');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createEmployeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parish exists
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 400 }
      );
    }

    // Check for duplicate employee number
    const [existingEmployee] = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeNumber, data.employeeNumber))
      .limit(1);

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee number already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate CNP if provided
    if (data.cnp) {
      const [existingCnp] = await db
        .select()
        .from(employees)
        .where(eq(employees.cnp, data.cnp))
        .limit(1);

      if (existingCnp) {
        return NextResponse.json(
          { success: false, error: 'CNP already exists' },
          { status: 400 }
        );
      }
    }

    // Create employee
    const [newEmployee] = await db
      .insert(employees)
      .values({
        parishId: data.parishId,
        userId: data.userId || null,
        employeeNumber: data.employeeNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        cnp: data.cnp || null,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        postalCode: data.postalCode || null,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        hireDate: data.hireDate,
        employmentStatus: data.employmentStatus || 'active',
        bankName: data.bankName || null,
        iban: data.iban || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newEmployee,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

