import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisClasses, parishes } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, and, sql } from 'drizzle-orm';
import { createCatechesisClassSchema } from '@/lib/validations/catechesis/classes';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { createOrderBy, parseSortOrder } from '@/lib/api-utils/sorting';
import { sanitizeSearch, parseBoolean, isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

// Allowed sort fields for classes
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'grade', 'isActive'] as const;

/**
 * GET /api/catechesis/classes - List classes with filtering and pagination
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate pagination
    // Note: parsePaginationParams expects 'limit' but frontend sends 'pageSize'
    const limit = searchParams.get('limit') || searchParams.get('pageSize') || '10';
    const pageParam = searchParams.get('page') || '1';
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (page - 1) * pageSize;
    
    // Parse and validate filters
    const search = sanitizeSearch(searchParams.get('search'));
    const rawParishId = searchParams.get('parishId');
    const parishId = rawParishId && isValidUUID(rawParishId) ? rawParishId : null;
    const grade = searchParams.get('grade');
    const teacherId = searchParams.get('teacherId') && isValidUUID(searchParams.get('teacherId')!) ? searchParams.get('teacherId')! : null;
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
          like(catechesisClasses.name, `%${search}%`),
          like(catechesisClasses.description || '', `%${search}%`),
          like(catechesisClasses.grade || '', `%${search}%`)
        )!
      );
    }

    // Filter by user's parish if they have one (unless they're accessing a specific parish)
    if (parishId) {
      conditions.push(eq(catechesisClasses.parishId, parishId));
    } else if (user.parishId) {
      conditions.push(eq(catechesisClasses.parishId, user.parishId));
    }

    if (grade) {
      conditions.push(eq(catechesisClasses.grade, grade));
    }

    if (teacherId) {
      conditions.push(eq(catechesisClasses.teacherId, teacherId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(catechesisClasses.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build safe order by
    const orderBy = createOrderBy(
      catechesisClasses,
      sortBy,
      'createdAt',
      ALLOWED_SORT_FIELDS,
      sortOrder
    );

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(catechesisClasses)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get classes with parish info
    const classes = await db
      .select({
        id: catechesisClasses.id,
        parishId: catechesisClasses.parishId,
        parishName: parishes.name,
        name: catechesisClasses.name,
        description: catechesisClasses.description,
        grade: catechesisClasses.grade,
        teacherId: catechesisClasses.teacherId,
        startDate: catechesisClasses.startDate,
        endDate: catechesisClasses.endDate,
        maxStudents: catechesisClasses.maxStudents,
        isActive: catechesisClasses.isActive,
        createdAt: catechesisClasses.createdAt,
        updatedAt: catechesisClasses.updatedAt,
      })
      .from(catechesisClasses)
      .leftJoin(parishes, eq(catechesisClasses.parishId, parishes.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    logger.info(`Fetched ${classes.length} classes`, { page, totalCount, userId });

    return NextResponse.json({
      success: true,
      data: classes,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/catechesis/classes', method: 'GET' });
}

/**
 * POST /api/catechesis/classes - Create a new class
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createCatechesisClassSchema.safeParse(body);

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

    // Create class
    const [newClass] = await db
      .insert(catechesisClasses)
      .values({
        parishId: data.parishId,
        name: data.name,
        description: data.description || null,
        grade: data.grade || null,
        teacherId: data.teacherId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        maxStudents: data.maxStudents || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    logger.info('Created class', { classId: newClass.id, userId });

    return NextResponse.json(
      createSuccessResponse(newClass),
      { status: 201 }
    );
  }, { endpoint: '/api/catechesis/classes', method: 'POST' });
}

