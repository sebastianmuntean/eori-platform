import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dioceses } from '@/drizzle/schema/core/dioceses';
import { eq, like, or, desc, asc, sql, and } from 'drizzle-orm';
import { createDioceseSchema, dioceseQuerySchema } from '@/src/lib/validations/dioceses';

/**
 * GET /api/dioceses - List all dioceses with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('GET /api/dioceses - Fetching dioceses');

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = dioceseQuerySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
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

    const { page, pageSize, search, isActive, sortBy, sortOrder } = queryResult.data;

    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(dioceses.code, `%${search}%`),
          like(dioceses.name, `%${search}%`),
          like(dioceses.city, `%${search}%`),
          like(dioceses.county, `%${search}%`),
          like(dioceses.bishopName, `%${search}%`)
        )
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(dioceses.isActive, isActive === 'true'));
    }

    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(dioceses);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    // Build main query with sorting
    let query = db.select().from(dioceses);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Apply sorting
    const sortColumn = {
      code: dioceses.code,
      name: dioceses.name,
      city: dioceses.city,
      createdAt: dioceses.createdAt,
    }[sortBy] || dioceses.name;

    query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)) as typeof query;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const items = await query.limit(pageSize).offset(offset);

    console.log(`✓ Found ${items.length} dioceses (total: ${totalCount})`);

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
    console.error('❌ Error fetching dioceses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dioceses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dioceses - Create a new diocese
 */
export async function POST(request: Request) {
  console.log('POST /api/dioceses - Creating new diocese');

  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createDioceseSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if code already exists
    const [existing] = await db
      .select({ id: dioceses.id })
      .from(dioceses)
      .where(eq(dioceses.code, data.code))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'O dieceză cu acest cod există deja' },
        { status: 400 }
      );
    }

    // Insert new diocese
    const [newDiocese] = await db
      .insert(dioceses)
      .values({
        code: data.code,
        name: data.name,
        address: data.address,
        city: data.city,
        county: data.county,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        bishopName: data.bishopName,
        isActive: data.isActive,
      })
      .returning();

    console.log(`✓ Diocese created: ${newDiocese.id}`);

    return NextResponse.json(
      { success: true, data: newDiocese },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating diocese:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create diocese' },
      { status: 500 }
    );
  }
}
