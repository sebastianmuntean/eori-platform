import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { departments, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, desc, asc, and } from 'drizzle-orm';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  headName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/departments - Fetch all departments with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/departments - Fetching departments');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const isActive = searchParams.get('isActive'); // 'true' | 'false'
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, parishId: ${parishId}, isActive: ${isActive}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(departments.name, `%${search}%`),
          like(departments.code, `%${search}%`),
          like(departments.headName || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(departments.parishId, parishId));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(departments.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    // Get total count
    const countQuery = whereClause
      ? db.select({ count: departments.id }).from(departments).where(whereClause)
      : db.select({ count: departments.id }).from(departments);
    const totalCountResult = await countQuery;
    const totalCount = totalCountResult.length;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const baseQuery = whereClause
      ? db.select().from(departments).where(whereClause)
      : db.select().from(departments);

    // Apply sorting
    let query;
    if (sortBy === 'name') {
      query = sortOrder === 'desc' 
        ? baseQuery.orderBy(desc(departments.name))
        : baseQuery.orderBy(asc(departments.name));
    } else if (sortBy === 'code') {
      query = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(departments.code))
        : baseQuery.orderBy(asc(departments.code));
    } else {
      query = baseQuery.orderBy(desc(departments.createdAt));
    }

    const allDepartments = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allDepartments,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    logError(error, { endpoint: '/api/departments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/departments - Create a new department
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/departments - Creating new department');

  try {
    const body = await request.json();
    const validation = createDepartmentSchema.safeParse(body);

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

    // Check for duplicate code within the same parish
    console.log(`Step 3: Checking for duplicate code ${data.code} in parish ${data.parishId}`);
    const [existingDepartment] = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.parishId, data.parishId),
          eq(departments.code, data.code)
        )
      )
      .limit(1);

    if (existingDepartment) {
      console.log(`❌ Department with code ${data.code} already exists in this parish`);
      return NextResponse.json(
        { success: false, error: 'Department with this code already exists in this parish' },
        { status: 400 }
      );
    }

    // Create department
    console.log('Step 4: Creating department');
    const [newDepartment] = await db
      .insert(departments)
      .values({
        parishId: data.parishId,
        code: data.code,
        name: data.name,
        description: data.description || null,
        headName: data.headName || null,
        phone: data.phone || null,
        email: data.email || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    console.log(`✓ Department created successfully: ${newDepartment.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newDepartment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating department:', error);
    logError(error, { endpoint: '/api/departments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

