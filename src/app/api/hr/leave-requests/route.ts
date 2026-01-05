import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests, employees, leaveTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc, asc, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const createLeaveRequestSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  leaveTypeId: z.string().uuid('Invalid leave type ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const employeeId = searchParams.get('employeeId');
    const leaveTypeId = searchParams.get('leaveTypeId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(leaveRequests.employeeId, employeeId));
    }

    if (leaveTypeId) {
      conditions.push(eq(leaveRequests.leaveTypeId, leaveTypeId));
    }

    if (status) {
      conditions.push(eq(leaveRequests.status, status as any));
    }

    if (dateFrom) {
      conditions.push(gte(leaveRequests.startDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(leaveRequests.endDate, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaveRequests)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    const sortColumn = leaveRequests[sortBy as keyof typeof leaveRequests];
    if (sortColumn) {
      orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderBy = desc(leaveRequests.startDate);
    }

    const offset = (page - 1) * pageSize;
    const requestsList = await db
      .select()
      .from(leaveRequests)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: requestsList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests', method: 'GET' });
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
    const validation = createLeaveRequestSchema.safeParse(body);

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

    // Check if leave type exists
    const [existingLeaveType] = await db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.id, data.leaveTypeId))
      .limit(1);

    if (!existingLeaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found' },
        { status: 400 }
      );
    }

    // Calculate total days
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

    // Create leave request
    const [newRequest] = await db
      .insert(leaveRequests)
      .values({
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: diffDays,
        reason: data.reason || null,
        status: 'pending',
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/leave-requests', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



