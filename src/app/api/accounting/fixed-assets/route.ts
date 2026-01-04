import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { fixedAssets, parishes, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createFixedAssetSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  inventoryNumber: z.string().min(1, 'Inventory number is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  acquisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable().or(z.literal('').transform(() => null)),
  acquisitionValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary value').optional().nullable().or(z.literal('').transform(() => null)),
  currentValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary value').optional().nullable().or(z.literal('').transform(() => null)),
  depreciationMethod: z.string().max(20).optional().nullable(),
  usefulLifeYears: z.number().int().positive().optional().nullable(),
  status: z.enum(['active', 'inactive', 'disposed', 'damaged']).optional().default('active'),
  disposalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable().or(z.literal('').transform(() => null)),
  disposalValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary value').optional().nullable().or(z.literal('').transform(() => null)),
  disposalReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/accounting/fixed-assets - Fetch all fixed assets with pagination, filtering, and sorting
 */
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Check parish access - users can only access their own parish unless they have admin role
    const isAdmin = await hasRole(userId, 'superadmin') || await hasRole(userId, 'episcop');
    if (parishId && !isAdmin && user.parishId !== parishId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this parish' },
        { status: 403 }
      );
    }

    // Build query conditions
    const conditions: any[] = [];
    
    // Enforce parish restriction for non-admin users
    if (!isAdmin && user.parishId) {
      conditions.push(eq(fixedAssets.parishId, user.parishId));
    }

    if (search) {
      conditions.push(
        or(
          like(fixedAssets.inventoryNumber, `%${search}%`),
          like(fixedAssets.name, `%${search}%`),
          like(fixedAssets.description || '', `%${search}%`),
          like(fixedAssets.location || '', `%${search}%`)
        )!
      );
    }

    if (parishId && isAdmin) {
      // Only admins can filter by any parish
      conditions.push(eq(fixedAssets.parishId, parishId));
    }

    if (category) {
      conditions.push(eq(fixedAssets.category, category));
    }

    if (type) {
      conditions.push(eq(fixedAssets.type, type));
    }

    if (status) {
      conditions.push(eq(fixedAssets.status, status as 'active' | 'inactive' | 'disposed' | 'damaged'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    if (sortBy === 'name') {
      orderBy = sortOrder === 'desc' ? desc(fixedAssets.name) : asc(fixedAssets.name);
    } else if (sortBy === 'inventoryNumber') {
      orderBy = sortOrder === 'desc' ? desc(fixedAssets.inventoryNumber) : asc(fixedAssets.inventoryNumber);
    } else if (sortBy === 'acquisitionDate') {
      orderBy = sortOrder === 'desc' ? desc(fixedAssets.acquisitionDate) : asc(fixedAssets.acquisitionDate);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(fixedAssets.createdAt) : asc(fixedAssets.createdAt);
    } else {
      orderBy = asc(fixedAssets.name);
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(fixedAssets)
      .where(whereClause);
    
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(fixedAssets);
    if (whereClause) {
      query = query.where(whereClause);
    }

    const allAssets = await query.orderBy(orderBy).limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allAssets,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching fixed assets:', error);
    logError(error, { endpoint: '/api/accounting/fixed-assets', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/fixed-assets - Create a new fixed asset
 */
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
    const validation = createFixedAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check parish access - users can only create assets for their own parish unless they have admin role
    const isAdmin = await hasRole(userId, 'superadmin') || await hasRole(userId, 'episcop');
    if (!isAdmin && user.parishId !== data.parishId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this parish' },
        { status: 403 }
      );
    }

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

    // Check if inventory number already exists for this parish
    const [existingAsset] = await db
      .select()
      .from(fixedAssets)
      .where(
        and(
          eq(fixedAssets.parishId, data.parishId),
          eq(fixedAssets.inventoryNumber, data.inventoryNumber)
        )
      )
      .limit(1);

    if (existingAsset) {
      return NextResponse.json(
        { success: false, error: 'Inventory number already exists for this parish' },
        { status: 400 }
      );
    }

    // Create fixed asset
    const [newAsset] = await db
      .insert(fixedAssets)
      .values({
        ...data,
        acquisitionDate: data.acquisitionDate && data.acquisitionDate !== '' ? data.acquisitionDate : null,
        disposalDate: data.disposalDate && data.disposalDate !== '' ? data.disposalDate : null,
        acquisitionValue: data.acquisitionValue && data.acquisitionValue !== '' ? data.acquisitionValue : null,
        currentValue: data.currentValue && data.currentValue !== '' ? data.currentValue : null,
        disposalValue: data.disposalValue && data.disposalValue !== '' ? data.disposalValue : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newAsset,
    });
  } catch (error) {
    console.error('❌ Error creating fixed asset:', error);
    logError(error, { endpoint: '/api/accounting/fixed-assets', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

