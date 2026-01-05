import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { products, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createProductSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  unit: z.string().max(20).optional().default('buc'),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Purchase price must be a valid number').optional().nullable(),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Sale price must be a valid number').optional().nullable(),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'VAT rate must be a valid number').optional().default('19'),
  barcode: z.string().max(100).optional().nullable(),
  trackStock: z.boolean().optional().default(true),
  minStock: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Min stock must be a valid number').optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/accounting/products - Fetch all products with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const trackStock = searchParams.get('trackStock');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.code, `%${search}%`),
          like(products.name, `%${search}%`),
          like(products.description || '', `%${search}%`),
          like(products.barcode || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(products.parishId, parishId));
    }

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive === 'true'));
    }

    if (trackStock !== null && trackStock !== undefined) {
      conditions.push(eq(products.trackStock, trackStock === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    if (sortBy === 'name') {
      orderBy = sortOrder === 'desc' ? desc(products.name) : asc(products.name);
    } else if (sortBy === 'code') {
      orderBy = sortOrder === 'desc' ? desc(products.code) : asc(products.code);
    } else if (sortBy === 'category') {
      orderBy = sortOrder === 'desc' ? desc(products.category) : asc(products.category);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(products.createdAt) : asc(products.createdAt);
    } else {
      orderBy = asc(products.name);
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
    
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(products);
    if (whereClause) {
      query = query.where(whereClause);
    }

    const allProducts = await query.orderBy(orderBy).limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allProducts,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    logError(error, { endpoint: '/api/accounting/products', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/products - Create a new product
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

    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parish exists
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 400 }
      );
    }

    // Check if code already exists for this parish
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.parishId, data.parishId),
          eq(products.code, data.code)
        )
      )
      .limit(1);

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product code already exists for this parish' },
        { status: 400 }
      );
    }

    // Create product
    const [newProduct] = await db
      .insert(products)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    logError(error, { endpoint: '/api/accounting/products', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

