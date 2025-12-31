import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes } from '@/drizzle/schema/core/parishes';
import { dioceses } from '@/drizzle/schema/core/dioceses';
import { deaneries } from '@/drizzle/schema/core/deaneries';
import { eq, like, or, desc, asc, sql, and } from 'drizzle-orm';
import { createParishSchema, parishQuerySchema } from '@/src/lib/validations/parishes';

/**
 * GET /api/parishes - List all parishes with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('GET /api/parishes - Fetching parishes');

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = parishQuerySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
      dioceseId: searchParams.get('dioceseId'),
      deaneryId: searchParams.get('deaneryId'),
      city: searchParams.get('city'),
      county: searchParams.get('county'),
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

    const { page, pageSize, search, dioceseId, deaneryId, city, county, isActive, sortBy, sortOrder } = queryResult.data;

    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(parishes.code, `%${search}%`),
          like(parishes.name, `%${search}%`),
          like(parishes.city, `%${search}%`),
          like(parishes.county, `%${search}%`),
          like(parishes.priestName, `%${search}%`)
        )
      );
    }

    if (dioceseId) {
      conditions.push(eq(parishes.dioceseId, dioceseId));
    }

    if (deaneryId) {
      conditions.push(eq(parishes.deaneryId, deaneryId));
    }

    if (city) {
      conditions.push(eq(parishes.city, city));
    }

    if (county) {
      conditions.push(eq(parishes.county, county));
    }

    if (isActive !== undefined) {
      conditions.push(eq(parishes.isActive, isActive === 'true'));
    }

    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(parishes);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    // Build main query with joins
    let query = db
      .select({
        id: parishes.id,
        dioceseId: parishes.dioceseId,
        deaneryId: parishes.deaneryId,
        code: parishes.code,
        name: parishes.name,
        patronSaintDay: parishes.patronSaintDay,
        address: parishes.address,
        city: parishes.city,
        county: parishes.county,
        postalCode: parishes.postalCode,
        latitude: parishes.latitude,
        longitude: parishes.longitude,
        phone: parishes.phone,
        email: parishes.email,
        website: parishes.website,
        priestName: parishes.priestName,
        vicarName: parishes.vicarName,
        parishionerCount: parishes.parishionerCount,
        foundedYear: parishes.foundedYear,
        notes: parishes.notes,
        isActive: parishes.isActive,
        createdAt: parishes.createdAt,
        updatedAt: parishes.updatedAt,
        dioceseName: dioceses.name,
        deaneryName: deaneries.name,
      })
      .from(parishes)
      .leftJoin(dioceses, eq(parishes.dioceseId, dioceses.id))
      .leftJoin(deaneries, eq(parishes.deaneryId, deaneries.id));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Apply sorting
    const sortColumn = {
      code: parishes.code,
      name: parishes.name,
      city: parishes.city,
      county: parishes.county,
      priestName: parishes.priestName,
      createdAt: parishes.createdAt,
    }[sortBy] || parishes.name;

    query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn)) as typeof query;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const items = await query.limit(pageSize).offset(offset);

    console.log(`✓ Found ${items.length} parishes (total: ${totalCount})`);

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
    console.error('❌ Error fetching parishes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parishes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/parishes - Create a new parish
 */
export async function POST(request: Request) {
  console.log('POST /api/parishes - Creating new parish');

  try {
    const body = await request.json();
    
    // Validate request body
    const validation = createParishSchema.safeParse(body);
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

    // Check if deanery exists (if provided)
    if (data.deaneryId) {
      const [deanery] = await db
        .select({ id: deaneries.id, dioceseId: deaneries.dioceseId })
        .from(deaneries)
        .where(eq(deaneries.id, data.deaneryId))
        .limit(1);

      if (!deanery) {
        return NextResponse.json(
          { success: false, error: 'Protopopiatul selectat nu există' },
          { status: 400 }
        );
      }

      // Verify deanery belongs to the selected diocese
      if (deanery.dioceseId !== data.dioceseId) {
        return NextResponse.json(
          { success: false, error: 'Protopopiatul selectat nu aparține diecezei selectate' },
          { status: 400 }
        );
      }
    }

    // Check if code already exists
    const [existing] = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.code, data.code))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'O parohie cu acest cod există deja' },
        { status: 400 }
      );
    }

    // Insert new parish
    const [newParish] = await db
      .insert(parishes)
      .values({
        dioceseId: data.dioceseId,
        deaneryId: data.deaneryId,
        code: data.code,
        name: data.name,
        patronSaintDay: data.patronSaintDay,
        address: data.address,
        city: data.city,
        county: data.county,
        postalCode: data.postalCode,
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
        phone: data.phone,
        email: data.email,
        website: data.website,
        priestName: data.priestName,
        vicarName: data.vicarName,
        parishionerCount: data.parishionerCount,
        foundedYear: data.foundedYear,
        notes: data.notes,
        isActive: data.isActive,
      })
      .returning();

    console.log(`✓ Parish created: ${newParish.id}`);

    return NextResponse.json(
      { success: true, data: newParish },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating parish:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create parish' },
      { status: 500 }
    );
  }
}
