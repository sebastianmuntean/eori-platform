import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deaneries } from '@/drizzle/schema/core/deaneries';
import { dioceses } from '@/drizzle/schema/core/dioceses';
import { eq, like, or, desc, asc, sql, and } from 'drizzle-orm';
import { createDeanerySchema, deaneryQuerySchema } from '@/src/lib/validations/deaneries';

/**
 * GET /api/deaneries - List all deaneries with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('GET /api/deaneries - Fetching deaneries');

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = deaneryQuerySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
      dioceseId: searchParams.get('dioceseId'),
      isActive: searchParams.get('isActive'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { page, pageSize, search, dioceseId, isActive, sortBy, sortOrder } = queryResult.data;

    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(deaneries.code, `%${search}%`),
          like(deaneries.name, `%${search}%`),
          like(deaneries.city, `%${search}%`),
          like(deaneries.county, `%${search}%`),
          like(deaneries.deanName, `%${search}%`)
        )
      );
    }

    if (dioceseId) {
      conditions.push(eq(deaneries.dioceseId, dioceseId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(deaneries.isActive, isActive === 'true'));
    }

    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(deaneries);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    // Build main query with join to get diocese info
    let query = db
      .select({
        id: deaneries.id,
        dioceseId: deaneries.dioceseId,
        code: deaneries.code,
        name: deaneries.name,
        address: deaneries.address,
        city: deaneries.city,
        county: deaneries.county,
        deanName: deaneries.deanName,
        phone: deaneries.phone,
        email: deaneries.email,
        isActive: deaneries.isActive,
        createdAt: deaneries.createdAt,
        updatedAt: deaneries.updatedAt,
        dioceseName: dioceses.name,
        dioceseCode: dioceses.code,
      })
      .from(deaneries)
      .leftJoin(dioceses, eq(deaneries.dioceseId, dioceses.id));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Apply sorting
    const sortColumn = {
      code: deaneries.code,
      name: deaneries.name,
      city: deaneries.city,
      deanName: deaneries.deanName,
      createdAt: deaneries.createdAt,
    }[sortBy] || deaneries.name;

    query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)) as typeof query;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const items = await query.limit(pageSize).offset(offset);

    console.log(`✓ Found ${items.length} deaneries (total: ${totalCount})`);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching deaneries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deaneries' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deaneries - Create a new deanery
 */
export async function POST(request: Request) {
  console.log('POST /api/deaneries - Creating new deanery');

  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createDeanerySchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if diocese exists
    const [diocese] = await db
      .select({ id: dioceses.id })
      .from(dioceses)
      .where(eq(dioceses.id, data.dioceseId))
      .limit(1);

    if (!diocese) {
      return NextResponse.json(
        { success: false, error: 'Dieceza selectată nu există' },
        { status: 400 }
      );
    }

    // Check if code already exists within the diocese
    const [existing] = await db
      .select({ id: deaneries.id })
      .from(deaneries)
      .where(and(
        eq(deaneries.dioceseId, data.dioceseId),
        eq(deaneries.code, data.code)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Un protopopiat cu acest cod există deja în această dieceză' },
        { status: 400 }
      );
    }

    // Insert new deanery
    const [newDeanery] = await db
      .insert(deaneries)
      .values({
        dioceseId: data.dioceseId,
        code: data.code,
        name: data.name,
        address: data.address,
        city: data.city,
        county: data.county,
        deanName: data.deanName,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
      })
      .returning();

    console.log(`✓ Deanery created: ${newDeanery.id}`);

    return NextResponse.json(
      { success: true, data: newDeanery },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating deanery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deanery' },
      { status: 500 }
    );
  }
}
