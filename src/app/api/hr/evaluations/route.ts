import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { evaluations, employees, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc, asc, and, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const createEvaluationSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  evaluatorId: z.string().uuid('Invalid evaluator ID'),
  evaluationPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evaluationPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evaluationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallScore: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  overallComment: z.string().optional().nullable(),
  strengths: z.string().optional().nullable(),
  improvementAreas: z.string().optional().nullable(),
  status: z.enum(['draft', 'completed', 'acknowledged']).optional().default('draft'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const employeeId = searchParams.get('employeeId');
    const evaluatorId = searchParams.get('evaluatorId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'evaluationDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(evaluations.employeeId, employeeId));
    }

    if (evaluatorId) {
      conditions.push(eq(evaluations.evaluatorId, evaluatorId));
    }

    if (status) {
      conditions.push(eq(evaluations.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(evaluations)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    let orderBy;
    switch (sortBy) {
      case 'id':
        orderBy = sortOrder === 'asc' ? asc(evaluations.id) : desc(evaluations.id);
        break;
      case 'employeeId':
        orderBy = sortOrder === 'asc' ? asc(evaluations.employeeId) : desc(evaluations.employeeId);
        break;
      case 'evaluatorId':
        orderBy = sortOrder === 'asc' ? asc(evaluations.evaluatorId) : desc(evaluations.evaluatorId);
        break;
      case 'evaluationPeriodStart':
        orderBy = sortOrder === 'asc' ? asc(evaluations.evaluationPeriodStart) : desc(evaluations.evaluationPeriodStart);
        break;
      case 'evaluationPeriodEnd':
        orderBy = sortOrder === 'asc' ? asc(evaluations.evaluationPeriodEnd) : desc(evaluations.evaluationPeriodEnd);
        break;
      case 'evaluationDate':
        orderBy = sortOrder === 'asc' ? asc(evaluations.evaluationDate) : desc(evaluations.evaluationDate);
        break;
      case 'overallScore':
        orderBy = sortOrder === 'asc' ? asc(evaluations.overallScore) : desc(evaluations.overallScore);
        break;
      case 'status':
        orderBy = sortOrder === 'asc' ? asc(evaluations.status) : desc(evaluations.status);
        break;
      case 'createdAt':
        orderBy = sortOrder === 'asc' ? asc(evaluations.createdAt) : desc(evaluations.createdAt);
        break;
      case 'updatedAt':
        orderBy = sortOrder === 'asc' ? asc(evaluations.updatedAt) : desc(evaluations.updatedAt);
        break;
      default:
        orderBy = desc(evaluations.evaluationDate);
    }

    const offset = (page - 1) * pageSize;
    const evaluationsList = await db
      .select()
      .from(evaluations)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: evaluationsList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluations', method: 'GET' });
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
    const validation = createEvaluationSchema.safeParse(body);

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

    // Check if evaluator exists
    const [existingEvaluator] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.evaluatorId))
      .limit(1);

    if (!existingEvaluator) {
      return NextResponse.json(
        { success: false, error: 'Evaluator not found' },
        { status: 400 }
      );
    }

    // Create evaluation
    const [newEvaluation] = await db
      .insert(evaluations)
      .values({
        employeeId: data.employeeId,
        evaluatorId: data.evaluatorId,
        evaluationPeriodStart: data.evaluationPeriodStart,
        evaluationPeriodEnd: data.evaluationPeriodEnd,
        evaluationDate: data.evaluationDate,
        overallScore: data.overallScore || null,
        overallComment: data.overallComment || null,
        strengths: data.strengths || null,
        improvementAreas: data.improvementAreas || null,
        status: data.status || 'draft',
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newEvaluation,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluations', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




