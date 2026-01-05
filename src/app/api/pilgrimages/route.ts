import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimages } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validatePagination, validateDateRange, buildWhereClause } from '@/lib/services/pilgrimages-service';
import { formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const createPilgrimageSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional().nullable(),
  destination: z.string().max(255).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  minParticipants: z.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled']).optional().default('draft'),
  pricePerPerson: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional().nullable(),
  currency: z.string().length(3).optional().default('RON'),
  organizerName: z.string().max(255).optional().nullable(),
  organizerContact: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  // Validate endDate >= startDate
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, { message: 'End date must be after or equal to start date', path: ['endDate'] })
.refine((data) => {
  // Validate maxParticipants >= minParticipants
  if (data.maxParticipants !== null && data.minParticipants !== null) {
    return data.maxParticipants >= data.minParticipants;
  }
  return true;
}, { message: 'Maximum participants must be greater than or equal to minimum participants', path: ['maxParticipants'] })
.refine((data) => {
  // Validate registrationDeadline <= startDate
  if (data.registrationDeadline && data.startDate) {
    return data.registrationDeadline <= data.startDate;
  }
  return true;
}, { message: 'Registration deadline must be before or equal to start date', path: ['registrationDeadline'] });

/**
 * GET /api/pilgrimages - Fetch all pilgrimages with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view pilgrimages
    const hasPermission = await checkPermission('pilgrimages:view');
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
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
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

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(pilgrimages.title, `%${search}%`),
          like(pilgrimages.destination || '', `%${search}%`),
          like(pilgrimages.description || '', `%${search}%`),
          like(pilgrimages.organizerName || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(pilgrimages.parishId, parishId));
    }

    if (status) {
      conditions.push(eq(pilgrimages.status, status as any));
    }

    if (dateFrom) {
      conditions.push(gte(pilgrimages.startDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(pilgrimages.endDate, dateTo));
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(pilgrimages);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(pilgrimages);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Apply sorting
    if (sortBy === 'startDate') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(pilgrimages.startDate))
        : query.orderBy(asc(pilgrimages.startDate));
    } else if (sortBy === 'createdAt') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(pilgrimages.createdAt))
        : query.orderBy(asc(pilgrimages.createdAt));
    } else if (sortBy === 'title') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(pilgrimages.title))
        : query.orderBy(asc(pilgrimages.title));
    } else {
      query = query.orderBy(desc(pilgrimages.createdAt));
    }

    const allPilgrimages = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allPilgrimages,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching pilgrimages:', error);
    logError(error, { endpoint: '/api/pilgrimages', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages - Create a new pilgrimage
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

    // Check permission to create pilgrimages
    const hasPermission = await checkPermission('pilgrimages:create');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = createPilgrimageSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check parish access (also verifies parish exists)
    await requireParishAccess(data.parishId, true);

    // Create pilgrimage
    const [newPilgrimage] = await db
      .insert(pilgrimages)
      .values({
        parishId: data.parishId,
        title: data.title,
        description: data.description || null,
        destination: data.destination || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        registrationDeadline: data.registrationDeadline || null,
        maxParticipants: data.maxParticipants || null,
        minParticipants: data.minParticipants || null,
        status: data.status || 'draft',
        pricePerPerson: data.pricePerPerson || null,
        currency: data.currency || 'RON',
        organizerName: data.organizerName || null,
        organizerContact: data.organizerContact || null,
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newPilgrimage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating pilgrimage:', error);
    logError(error, { endpoint: '/api/pilgrimages', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

