import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishionerTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and } from 'drizzle-orm';
import { z } from 'zod';

const createTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/parishioners/types - Fetch all parishioner types
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(parishionerTypes.name, `%${search}%`),
          like(parishionerTypes.description || '', `%${search}%`)
        )!
      );
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(parishionerTypes.isActive, isActive === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db.select().from(parishionerTypes);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

    let queryWithOrder;
    if (sortBy === 'name') {
      queryWithOrder = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(parishionerTypes.name))
        : queryWithWhere.orderBy(asc(parishionerTypes.name));
    } else {
      queryWithOrder = queryWithWhere.orderBy(desc(parishionerTypes.createdAt));
    }

    const allTypes = all 
      ? await queryWithOrder 
      : await queryWithOrder.limit(pageSize).offset((page - 1) * pageSize);

    const totalCountResult = await db
      .select()
      .from(parishionerTypes)
      .where(whereClause);
    const totalCount = totalCountResult.length;

    return NextResponse.json({
      success: true,
      data: allTypes,
      pagination: all ? undefined : {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/types', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/parishioners/types - Create a new parishioner type
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTypeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [newType] = await db
      .insert(parishionerTypes)
      .values({
        name: data.name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newType,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/types', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




