import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishes } from '@/database/schema';
import { formatErrorResponse, logError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  validateDiocese,
  validateDeaneryBelongsToDiocese,
  validateParishCodeUnique,
} from './_validation';

const createParishSchema = z.object({
  deaneryId: z.string().uuid().optional().nullable(),
  dioceseId: z.string().uuid('Invalid diocese ID'),
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  patronSaintDay: z.string().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  priestName: z.string().optional(),
  vicarName: z.string().optional(),
  parishionerCount: z.number().int().optional().nullable(),
  foundedYear: z.number().int().optional().nullable(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * @openapi
 * /api/parishes:
 *   get:
 *     summary: Get all parishes with pagination and filtering
 *     description: |
 *       Retrieves a paginated list of parishes with optional filtering by diocese,
 *       deanery, and search query. Requires authentication.
 *     tags: [Parishes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number (1-indexed)
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - name: all
 *         in: query
 *         description: Return all parishes without pagination
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: search
 *         in: query
 *         description: Search query (searches name, code, city)
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - name: dioceseId
 *         in: query
 *         description: Filter by diocese ID
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: deaneryId
 *         in: query
 *         description: Filter by deanery ID
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         required: false
 *         schema:
 *           type: string
 *           enum: [name, code, city, createdAt]
 *           default: name
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of parishes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const search = (searchParams.get('search') || '').trim().substring(0, 100);
    const dioceseId = searchParams.get('dioceseId');
    const deaneryId = searchParams.get('deaneryId');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(parishes.name, `%${search}%`),
          like(parishes.code, `%${search}%`),
          like(parishes.city, `%${search}%`)
        )!
      );
    }

    if (dioceseId) {
      conditions.push(eq(parishes.dioceseId, dioceseId));
    }

    if (deaneryId) {
      conditions.push(eq(parishes.deaneryId, deaneryId));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    // Get total count using SQL count function
    const baseCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(parishes);
    
    const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const baseQuery = db.select().from(parishes);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;
    
    let queryWithOrder;
    if (sortBy === 'name') {
      queryWithOrder = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(desc(parishes.name))
        : queryWithWhere.orderBy(asc(parishes.name));
    } else if (sortBy === 'code') {
      queryWithOrder = sortOrder === 'desc'
        ? queryWithWhere.orderBy(desc(parishes.code))
        : queryWithWhere.orderBy(asc(parishes.code));
    } else {
      queryWithOrder = queryWithWhere.orderBy(desc(parishes.createdAt));
    }

    // If all=true, don't apply LIMIT and OFFSET
    const allParishes = all 
      ? await queryWithOrder 
      : await queryWithOrder.limit(pageSize).offset((page - 1) * pageSize);

    return NextResponse.json({
      success: true,
      data: allParishes,
      pagination: all ? null : {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching parishes:', error);
    logError(error, { endpoint: '/api/parishes', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

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
    const validation = createParishSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate diocese exists
    await validateDiocese(data.dioceseId);

    // Validate deanery exists and belongs to diocese if provided
    if (data.deaneryId) {
      await validateDeaneryBelongsToDiocese(data.deaneryId, data.dioceseId);
    }

    // Validate parish code is unique
    await validateParishCodeUnique(data.code);

    const insertValues = {
      deaneryId: data.deaneryId || null,
      dioceseId: data.dioceseId,
      code: data.code,
      name: data.name,
      patronSaintDay: data.patronSaintDay || null,
      address: data.address || null,
      city: data.city || null,
      county: data.county || null,
      postalCode: data.postalCode || null,
      latitude: data.latitude !== null && data.latitude !== undefined ? String(data.latitude) : null,
      longitude: data.longitude !== null && data.longitude !== undefined ? String(data.longitude) : null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      priestName: data.priestName || null,
      vicarName: data.vicarName || null,
      parishionerCount: data.parishionerCount || null,
      foundedYear: data.foundedYear || null,
      notes: data.notes || null,
      isActive: data.isActive ?? true,
    };
    
    const [newParish] = await db
      .insert(parishes)
      .values(insertValues)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newParish,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating parish:', error);
    logError(error, { endpoint: '/api/parishes', method: 'POST' });
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
