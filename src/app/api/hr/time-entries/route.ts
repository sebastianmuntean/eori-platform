import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { timeEntries, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc, asc, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const createTimeEntrySchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  breakDurationMinutes: z.number().int().min(0).optional().default(0),
  workedHours: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  overtimeHours: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default('0'),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'holiday', 'sick_leave', 'vacation']).optional().default('present'),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const employeeId = searchParams.get('employeeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'entryDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(timeEntries.employeeId, employeeId));
    }

    if (dateFrom) {
      conditions.push(gte(timeEntries.entryDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(timeEntries.entryDate, dateTo));
    }

    if (status) {
      conditions.push(eq(timeEntries.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(timeEntries)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    const sortColumn = timeEntries[sortBy as keyof typeof timeEntries];
    if (sortColumn) {
      orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderBy = desc(timeEntries.entryDate);
    }

    const offset = (page - 1) * pageSize;
    const entriesList = await db
      .select()
      .from(timeEntries)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: entriesList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/time-entries', method: 'GET' });
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
    const validation = createTimeEntrySchema.safeParse(body);

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

    // Create time entry
    const [newEntry] = await db
      .insert(timeEntries)
      .values({
        employeeId: data.employeeId,
        entryDate: data.entryDate,
        checkInTime: data.checkInTime || null,
        checkOutTime: data.checkOutTime || null,
        breakDurationMinutes: data.breakDurationMinutes || 0,
        workedHours: data.workedHours || null,
        overtimeHours: data.overtimeHours || '0',
        status: data.status || 'present',
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/time-entries', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

