import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { positions, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createPositionSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  departmentId: z.string().uuid().optional().nullable(),
  code: z.string().min(1, 'Code is required').max(50),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  minSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  maxSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/hr/positions - Fetch all positions
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const departmentId = searchParams.get('departmentId');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'title';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(positions.title, `%${search}%`),
          like(positions.code, `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(positions.parishId, parishId));
    }

    if (departmentId) {
      conditions.push(eq(positions.departmentId, departmentId));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(positions.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(positions)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    const sortColumn = positions[sortBy as keyof typeof positions];
    if (sortColumn) {
      orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderBy = asc(positions.title);
    }

    const offset = (page - 1) * pageSize;
    const positionsList = await db
      .select()
      .from(positions)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: positionsList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/positions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/hr/positions - Create a new position
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
    const validation = createPositionSchema.safeParse(body);

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

    // Check for duplicate code
    const [existingPosition] = await db
      .select()
      .from(positions)
      .where(eq(positions.code, data.code))
      .limit(1);

    if (existingPosition) {
      return NextResponse.json(
        { success: false, error: 'Position code already exists' },
        { status: 400 }
      );
    }

    // Create position
    const [newPosition] = await db
      .insert(positions)
      .values({
        parishId: data.parishId,
        departmentId: data.departmentId || null,
        code: data.code,
        title: data.title,
        description: data.description || null,
        minSalary: data.minSalary || null,
        maxSalary: data.maxSalary || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newPosition,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/positions', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

