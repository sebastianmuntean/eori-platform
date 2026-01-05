import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisStudents, parishes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, and, sql } from 'drizzle-orm';
import { createCatechesisStudentSchema } from '@/lib/validations/catechesis/students';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { createOrderBy, parseSortOrder } from '@/lib/api-utils/sorting';
import { sanitizeSearch, parseBoolean, isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

// Allowed sort fields for students
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'isActive'] as const;

/**
 * GET /api/catechesis/students - List students with filtering and pagination
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate pagination
    const limit = searchParams.get('limit') || searchParams.get('pageSize') || '10';
    const pageParam = searchParams.get('page') || '1';
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (page - 1) * pageSize;
    
    // Parse and validate filters
    const search = sanitizeSearch(searchParams.get('search'));
    const rawParishId = searchParams.get('parishId');
    const parishId = rawParishId && isValidUUID(rawParishId) ? rawParishId : null;
    const isActive = parseBoolean(searchParams.get('isActive'));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseSortOrder(searchParams.get('sortOrder'));

    // Check parish access if parishId is provided
    if (parishId) {
      await requireParishAccess(parishId, false);
    }

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(catechesisStudents.firstName, `%${search}%`),
          like(catechesisStudents.lastName, `%${search}%`),
          like(catechesisStudents.parentName || '', `%${search}%`),
          like(catechesisStudents.parentEmail || '', `%${search}%`)
        )!
      );
    }

    // Filter by user's parish if they have one (unless they're accessing a specific parish)
    if (parishId) {
      conditions.push(eq(catechesisStudents.parishId, parishId));
    } else if (user.parishId) {
      conditions.push(eq(catechesisStudents.parishId, user.parishId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(catechesisStudents.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build safe order by
    const orderBy = createOrderBy(
      catechesisStudents,
      sortBy,
      'createdAt',
      ALLOWED_SORT_FIELDS,
      sortOrder
    );

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(catechesisStudents)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get students with parish info
    const students = await db
      .select({
        id: catechesisStudents.id,
        parishId: catechesisStudents.parishId,
        parishName: parishes.name,
        firstName: catechesisStudents.firstName,
        lastName: catechesisStudents.lastName,
        dateOfBirth: catechesisStudents.dateOfBirth,
        parentName: catechesisStudents.parentName,
        parentEmail: catechesisStudents.parentEmail,
        parentPhone: catechesisStudents.parentPhone,
        address: catechesisStudents.address,
        notes: catechesisStudents.notes,
        isActive: catechesisStudents.isActive,
        createdAt: catechesisStudents.createdAt,
        updatedAt: catechesisStudents.updatedAt,
      })
      .from(catechesisStudents)
      .leftJoin(parishes, eq(catechesisStudents.parishId, parishes.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    logger.info(`Fetched ${students.length} students`, { page, totalCount, userId });

    return NextResponse.json({
      success: true,
      data: students,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/catechesis/students', method: 'GET' });
}

/**
 * POST /api/catechesis/students - Create a new student
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createCatechesisStudentSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Validation failed', { errors: validation.error.errors, userId });
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const data = validation.data;

    // Check parish access
    await requireParishAccess(data.parishId, true);

    // Create student
    const [newStudent] = await db
      .insert(catechesisStudents)
      .values({
        parishId: data.parishId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        parentName: data.parentName || null,
        parentEmail: data.parentEmail || null,
        parentPhone: data.parentPhone || null,
        address: data.address || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    logger.info('Created student', { studentId: newStudent.id, userId });

    return NextResponse.json(
      createSuccessResponse(newStudent),
      { status: 201 }
    );
  }, { endpoint: '/api/catechesis/students', method: 'POST' });
}



