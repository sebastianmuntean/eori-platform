import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employeeTraining, employees, trainingCourses } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createEmployeeTrainingSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  courseId: z.string().uuid('Invalid course ID'),
  enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'cancelled']).optional().default('enrolled'),
  score: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  certificateNumber: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const employeeId = searchParams.get('employeeId');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'enrollmentDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(employeeTraining.employeeId, employeeId));
    }

    if (courseId) {
      conditions.push(eq(employeeTraining.courseId, courseId));
    }

    if (status) {
      conditions.push(eq(employeeTraining.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employeeTraining)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    // Map sortBy to actual column, with validation
    if (sortBy === 'enrollmentDate') {
      orderBy = sortOrder === 'asc' ? asc(employeeTraining.enrollmentDate) : desc(employeeTraining.enrollmentDate);
    } else if (sortBy === 'completionDate') {
      orderBy = sortOrder === 'asc' ? asc(employeeTraining.completionDate) : desc(employeeTraining.completionDate);
    } else if (sortBy === 'status') {
      orderBy = sortOrder === 'asc' ? asc(employeeTraining.status) : desc(employeeTraining.status);
    } else if (sortBy === 'score') {
      orderBy = sortOrder === 'asc' ? asc(employeeTraining.score) : desc(employeeTraining.score);
    } else {
      orderBy = desc(employeeTraining.enrollmentDate);
    }

    const offset = (page - 1) * pageSize;
    const trainingList = await db
      .select()
      .from(employeeTraining)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: trainingList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employee-training', method: 'GET' });
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
    const validation = createEmployeeTrainingSchema.safeParse(body);

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

    // Check if course exists
    const [existingCourse] = await db
      .select()
      .from(trainingCourses)
      .where(eq(trainingCourses.id, data.courseId))
      .limit(1);

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Training course not found' },
        { status: 400 }
      );
    }

    // Create employee training
    const [newTraining] = await db
      .insert(employeeTraining)
      .values({
        employeeId: data.employeeId,
        courseId: data.courseId,
        enrollmentDate: data.enrollmentDate,
        completionDate: data.completionDate || null,
        status: data.status || 'enrolled',
        score: data.score || null,
        certificateNumber: data.certificateNumber || null,
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newTraining,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employee-training', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




