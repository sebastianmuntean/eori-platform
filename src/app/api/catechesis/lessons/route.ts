import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { catechesisLessons, parishes, catechesisClasses } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, and, sql } from 'drizzle-orm';
import { createCatechesisLessonSchema } from '@/lib/validations/catechesis/lessons';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { createOrderBy, parseSortOrder } from '@/lib/api-utils/sorting';
import { sanitizeSearch, parseBoolean, isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';

// Allowed sort fields for lessons
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'orderIndex', 'isPublished'] as const;

/**
 * GET /api/catechesis/lessons - List lessons with filtering and pagination
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
    const classId = searchParams.get('classId') && isValidUUID(searchParams.get('classId')!) ? searchParams.get('classId')! : null;
    const isPublished = parseBoolean(searchParams.get('isPublished'));
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
          like(catechesisLessons.title, `%${search}%`),
          like(catechesisLessons.description || '', `%${search}%`)
        )!
      );
    }

    // Filter by user's parish if they have one (unless they're accessing a specific parish)
    if (parishId) {
      conditions.push(eq(catechesisLessons.parishId, parishId));
    } else if (user.parishId) {
      conditions.push(eq(catechesisLessons.parishId, user.parishId));
    }

    if (classId) {
      conditions.push(eq(catechesisLessons.classId, classId));
    }

    if (isPublished !== undefined) {
      conditions.push(eq(catechesisLessons.isPublished, isPublished));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build safe order by
    const orderBy = createOrderBy(
      catechesisLessons,
      sortBy,
      'createdAt',
      ALLOWED_SORT_FIELDS,
      sortOrder
    );

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(catechesisLessons)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get lessons with parish and class info
    const lessons = await db
      .select({
        id: catechesisLessons.id,
        parishId: catechesisLessons.parishId,
        parishName: parishes.name,
        classId: catechesisLessons.classId,
        className: catechesisClasses.name,
        title: catechesisLessons.title,
        description: catechesisLessons.description,
        orderIndex: catechesisLessons.orderIndex,
        durationMinutes: catechesisLessons.durationMinutes,
        isPublished: catechesisLessons.isPublished,
        createdAt: catechesisLessons.createdAt,
        updatedAt: catechesisLessons.updatedAt,
      })
      .from(catechesisLessons)
      .leftJoin(parishes, eq(catechesisLessons.parishId, parishes.id))
      .leftJoin(catechesisClasses, eq(catechesisLessons.classId, catechesisClasses.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    logger.info(`Fetched ${lessons.length} lessons`, { page, totalCount, userId });

    return NextResponse.json({
      success: true,
      data: lessons,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/catechesis/lessons', method: 'GET' });
}

/**
 * POST /api/catechesis/lessons - Create a new lesson
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createCatechesisLessonSchema.safeParse(body);

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

    // Create lesson
    const [newLesson] = await db
      .insert(catechesisLessons)
      .values({
        parishId: data.parishId,
        classId: data.classId || null,
        title: data.title,
        description: data.description || null,
        content: data.content || null,
        orderIndex: data.orderIndex || 0,
        durationMinutes: data.durationMinutes || null,
        isPublished: data.isPublished ?? false,
        createdBy: userId,
      })
      .returning();

    logger.info('Created lesson', { lessonId: newLesson.id, userId });

    return NextResponse.json(
      createSuccessResponse(newLesson),
      { status: 201 }
    );
  }, { endpoint: '/api/catechesis/lessons', method: 'POST' });
}



