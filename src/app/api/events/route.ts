import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validatePagination, validateDateRange, buildWhereClause } from '@/lib/services/events-service';

const createEventSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  type: z.enum(['wedding', 'baptism', 'funeral'], { errorMap: () => ({ message: 'Type must be wedding, baptism, or funeral' }) }),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional().default('pending'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  priestName: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/events - Fetch all events with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/events - Fetching events');

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view events
    const hasPermission = await checkPermission('events:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize } = validatePagination(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const type = searchParams.get('type'); // 'wedding' | 'baptism' | 'funeral'
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'eventDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate date range
    try {
      validateDateRange(dateFrom, dateTo);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid date range' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, parishId: ${parishId}, type: ${type}, status: ${status}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(churchEvents.location || '', `%${search}%`),
          like(churchEvents.priestName || '', `%${search}%`),
          like(churchEvents.notes || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(churchEvents.parishId, parishId));
    }

    if (type) {
      conditions.push(eq(churchEvents.type, type as 'wedding' | 'baptism' | 'funeral'));
    }

    if (status) {
      conditions.push(eq(churchEvents.status, status as 'pending' | 'confirmed' | 'completed' | 'cancelled'));
    }

    if (dateFrom) {
      conditions.push(gte(churchEvents.eventDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(churchEvents.eventDate, dateTo));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Get total count
    const countQuery = whereClause
      ? db.select({ count: sql<number>`count(*)`.as('count') }).from(churchEvents).where(whereClause)
      : db.select({ count: sql<number>`count(*)`.as('count') }).from(churchEvents);
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const baseQuery = whereClause
      ? db.select().from(churchEvents).where(whereClause)
      : db.select().from(churchEvents);

    // Apply sorting
    let query;
    if (sortBy === 'eventDate') {
      query = sortOrder === 'desc' 
        ? baseQuery.orderBy(desc(churchEvents.eventDate))
        : baseQuery.orderBy(asc(churchEvents.eventDate));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(churchEvents.createdAt))
        : baseQuery.orderBy(asc(churchEvents.createdAt));
    } else if (sortBy === 'type') {
      query = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(churchEvents.type))
        : baseQuery.orderBy(asc(churchEvents.type));
    } else {
      query = baseQuery.orderBy(desc(churchEvents.createdAt));
    }

    const allEvents = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allEvents,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    logError(error, { endpoint: '/api/events', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/events - Create a new event
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/events - Creating new event');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to create events
    const hasPermission = await checkPermission('events:create');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

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

    // Create event
    console.log('Step 3: Creating event');
    const [newEvent] = await db
      .insert(churchEvents)
      .values({
        parishId: data.parishId,
        type: data.type,
        status: data.status || 'pending',
        eventDate: data.eventDate || null,
        location: data.location || null,
        priestName: data.priestName || null,
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    console.log(`✓ Event created successfully: ${newEvent.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating event:', error);
    logError(error, { endpoint: '/api/events', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



