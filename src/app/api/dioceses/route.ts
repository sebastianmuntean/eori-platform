import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { dioceses } from '@/database/schema';
import { formatErrorResponse, logError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { createDioceseSchema } from '@/lib/validations/dioceses';
import { eq, ilike, or, desc, asc, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        const searchPattern = `%${trimmedSearch}%`;
        conditions.push(
          or(
            ilike(dioceses.name, searchPattern),
            ilike(dioceses.code, searchPattern),
            sql`COALESCE(${dioceses.city}, '') ILIKE ${searchPattern}`
          )!
        );
      }
    }

    const whereClause = conditions.length > 0
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Use SQL COUNT for efficient counting
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(dioceses)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    let query = db.select().from(dioceses).where(whereClause);

    if (sortBy === 'name') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(dioceses.name))
        : query.orderBy(asc(dioceses.name));
    } else if (sortBy === 'code') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(dioceses.code))
        : query.orderBy(asc(dioceses.code));
    } else {
      query = query.orderBy(desc(dioceses.createdAt));
    }

    // If all=true, don't apply LIMIT and OFFSET
    const allDioceses = all 
      ? await query 
      : await query.limit(pageSize).offset((page - 1) * pageSize);

    return NextResponse.json({
      success: true,
      data: allDioceses,
      pagination: all ? null : {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/dioceses', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createDioceseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        formatErrorResponse(new ValidationError(validation.error.errors[0].message)),
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingDiocese = await db
      .select()
      .from(dioceses)
      .where(eq(dioceses.code, data.code))
      .limit(1);

    if (existingDiocese.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Diocese with this code already exists' },
        { status: 400 }
      );
    }

    const [newDiocese] = await db
      .insert(dioceses)
      .values({
        code: data.code,
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        country: data.country || 'România',
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        bishopName: data.bishopName || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newDiocese,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/dioceses', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


