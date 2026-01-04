import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { deaneries, dioceses } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, desc, asc, and } from 'drizzle-orm';
import { z } from 'zod';

const createDeanerySchema = z.object({
  dioceseId: z.string().uuid('Invalid diocese ID'),
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  deanName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  console.log('Step 1: GET /api/deaneries - Fetching deaneries');

  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const dioceseId = searchParams.get('dioceseId');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(deaneries.name, `%${search}%`),
          like(deaneries.code, `%${search}%`),
          like(deaneries.city || '', `%${search}%`)
        )!
      );
    }

    if (dioceseId) {
      conditions.push(eq(deaneries.dioceseId, dioceseId));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    const totalCountResult = await db
      .select({ count: deaneries.id })
      .from(deaneries)
      .where(whereClause);
    const totalCount = totalCountResult.length;

    let query = db.select().from(deaneries);
    if (whereClause) {
      query = query.where(whereClause);
    }

    if (sortBy === 'name') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(deaneries.name))
        : query.orderBy(asc(deaneries.name));
    } else if (sortBy === 'code') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(deaneries.code))
        : query.orderBy(asc(deaneries.code));
    } else {
      query = query.orderBy(desc(deaneries.createdAt));
    }

    // If all=true, don't apply LIMIT and OFFSET
    const allDeaneries = all 
      ? await query 
      : await query.limit(pageSize).offset((page - 1) * pageSize);

    return NextResponse.json({
      success: true,
      data: allDeaneries,
      pagination: all ? null : {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching deaneries:', error);
    logError(error, { endpoint: '/api/deaneries', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  console.log('Step 1: POST /api/deaneries - Creating new deanery');

  try {
    const body = await request.json();
    const validation = createDeanerySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingDiocese = await db
      .select()
      .from(dioceses)
      .where(eq(dioceses.id, data.dioceseId))
      .limit(1);

    if (existingDiocese.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Diocese not found' },
        { status: 400 }
      );
    }

    const existingDeanery = await db
      .select()
      .from(deaneries)
      .where(
        and(
          eq(deaneries.dioceseId, data.dioceseId),
          eq(deaneries.code, data.code)
        )
      )
      .limit(1);

    if (existingDeanery.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Deanery with this code already exists in this diocese' },
        { status: 400 }
      );
    }

    const [newDeanery] = await db
      .insert(deaneries)
      .values({
        dioceseId: data.dioceseId,
        code: data.code,
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        deanName: data.deanName || null,
        phone: data.phone || null,
        email: data.email || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newDeanery,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating deanery:', error);
    logError(error, { endpoint: '/api/deaneries', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


