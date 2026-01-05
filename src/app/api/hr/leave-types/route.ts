import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveTypes, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql, isNull } from 'drizzle-orm';
import { z } from 'zod';

const createLeaveTypeSchema = z.object({
  parishId: z.string().uuid().optional().nullable(),
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  maxDaysPerYear: z.number().int().min(0).optional().nullable(),
  isPaid: z.boolean().optional().default(true),
  requiresApproval: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(leaveTypes.name, `%${search}%`),
          like(leaveTypes.code, `%${search}%`)
        )!
      );
    }

    if (parishId) {
      if (parishId === 'global') {
        conditions.push(isNull(leaveTypes.parishId));
      } else {
        conditions.push(eq(leaveTypes.parishId, parishId));
      }
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(leaveTypes.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaveTypes)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    const sortColumn = leaveTypes[sortBy as keyof typeof leaveTypes];
    if (sortColumn) {
      orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderBy = asc(leaveTypes.name);
    }

    const offset = (page - 1) * pageSize;
    const leaveTypesList = await db
      .select()
      .from(leaveTypes)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: leaveTypesList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-types', method: 'GET' });
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
    const validation = createLeaveTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parish exists (if provided)
    if (data.parishId) {
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
    }

    // Create leave type
    const [newLeaveType] = await db
      .insert(leaveTypes)
      .values({
        parishId: data.parishId || null,
        code: data.code,
        name: data.name,
        description: data.description || null,
        maxDaysPerYear: data.maxDaysPerYear || null,
        isPaid: data.isPaid ?? true,
        requiresApproval: data.requiresApproval ?? true,
        isActive: data.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newLeaveType,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-types', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



