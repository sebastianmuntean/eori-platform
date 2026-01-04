import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, isNull, sql, ilike } from 'drizzle-orm';
import { z } from 'zod';

// Allowed sort fields for validation
const ALLOWED_SORT_FIELDS = ['code', 'name', 'companyName', 'createdAt'] as const;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

const createClientSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  cnp: z.string().length(13, 'CNP must be exactly 13 digits').regex(/^\d{13}$/, 'CNP must contain only digits').optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format').optional().nullable(),
  companyName: z.string().max(255).optional(),
  cui: z.string().max(20).optional(),
  regCom: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email format').optional().nullable(),
  bankName: z.string().max(255).optional(),
  iban: z.string().max(34).regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, 'Invalid IBAN format').optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Build search conditions for client queries
 */
function buildSearchConditions(search: string) {
  if (!search?.trim()) {
    return [];
  }
  
  const trimmedSearch = search.trim();
  const searchPattern = `%${trimmedSearch}%`;
  
  return [
    or(
      ilike(clients.code, searchPattern),
      sql`COALESCE(${clients.firstName}, '') ILIKE ${searchPattern}`,
      sql`COALESCE(${clients.lastName}, '') ILIKE ${searchPattern}`,
      sql`COALESCE(${clients.companyName}, '') ILIKE ${searchPattern}`,
      sql`COALESCE(${clients.cnp}, '') ILIKE ${searchPattern}`,
      sql`COALESCE(${clients.cui}, '') ILIKE ${searchPattern}`,
      sql`COALESCE(${clients.city}, '') ILIKE ${searchPattern}`,
      sql`COALESCE(${clients.email}, '') ILIKE ${searchPattern}`,
      sql`CONCAT(COALESCE(${clients.firstName}, ''), ' ', COALESCE(${clients.lastName}, '')) ILIKE ${searchPattern}`
    )!
  ];
}

/**
 * Build SQL search conditions for view queries
 */
function buildViewSearchSQL(search: string): sql.Sql | null {
  if (!search?.trim()) {
    return null;
  }
  
  const trimmedSearch = search.trim();
  const searchPattern = `%${trimmedSearch}%`;
  
  return sql`(
    code ILIKE ${searchPattern}
    OR COALESCE(first_name, '') ILIKE ${searchPattern}
    OR COALESCE(last_name, '') ILIKE ${searchPattern}
    OR COALESCE(company_name, '') ILIKE ${searchPattern}
    OR COALESCE(cnp, '') ILIKE ${searchPattern}
    OR COALESCE(cui, '') ILIKE ${searchPattern}
    OR COALESCE(city, '') ILIKE ${searchPattern}
    OR COALESCE(email, '') ILIKE ${searchPattern}
    OR CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) ILIKE ${searchPattern}
  )`;
}

/**
 * Format validation errors for response
 */
function formatValidationErrors(errors: z.ZodIssue[]) {
  const errorMessages = errors.map(err => err.message);
  const fieldErrors: Record<string, string> = {};
  
  errors.forEach(err => {
    const path = err.path.join('.');
    if (path) {
      fieldErrors[path] = err.message;
    }
  });
  
  return {
    message: errorMessages[0] || 'Validation failed',
    errors: errorMessages,
    fields: fieldErrors,
  };
}

export async function GET(request: Request) {
  try {
    console.log('[API /clients] GET request received');
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
    const search = searchParams.get('search') || '';
    const sortByParam = searchParams.get('sortBy') || 'code';
    const sortBy = ALLOWED_SORT_FIELDS.includes(sortByParam as typeof ALLOWED_SORT_FIELDS[number]) 
      ? sortByParam 
      : 'code';
    const sortOrderParam = searchParams.get('sortOrder') || 'asc';
    const sortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';

    console.log('[API /clients] Query params:', { page, pageSize, search, sortBy, sortOrder });

    // Build base conditions (always filter active and non-deleted clients)
    const conditions = [
      eq(clients.isActive, true),
      isNull(clients.deletedAt),
    ];

    // Add search conditions
    const searchConditions = buildSearchConditions(search);
    conditions.push(...searchConditions);

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Use view when sorting by name for better performance (view has pre-calculated "name" field)
    const useView = sortBy === 'name' || sortBy === 'companyName';
    
    // Get total count
    let totalCount = 0;
    if (useView) {
      // Build WHERE conditions for view using SQL
      let viewWhereSQL = sql`deleted_at IS NULL AND is_active = true`;
      const searchSQL = buildViewSearchSQL(search);
      if (searchSQL) {
        viewWhereSQL = sql`${viewWhereSQL} AND ${searchSQL}`;
      }
      
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM clients_view 
        WHERE ${viewWhereSQL}
      `);
      // Handle both { rows: [...] } and array formats
      const countRows = Array.isArray(countResult) ? countResult : (countResult.rows || []);
      totalCount = Number((countRows[0] as { count: string | number })?.count || 0);
    } else {
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(whereClause);
      totalCount = Number(totalCountResult[0]?.count || 0);
    }

    // Build query
    let allClients;
    if (useView) {
      // Use clients_view with raw SQL for better performance
      let viewWhereSQL = sql`deleted_at IS NULL AND is_active = true`;
      const searchSQL = buildViewSearchSQL(search);
      if (searchSQL) {
        viewWhereSQL = sql`${viewWhereSQL} AND ${searchSQL}`;
      }
      
      const orderDirection = sortOrder === 'desc' ? sql`DESC` : sql`ASC`;
      const offset = (page - 1) * pageSize;
      
      const result = await db.execute(sql`
        SELECT * 
        FROM clients_view 
        WHERE ${viewWhereSQL}
        ORDER BY name ${orderDirection}
        LIMIT ${pageSize} OFFSET ${offset}
      `);
      
      // Map snake_case to camelCase to match Client interface
      // Handle both { rows: [...] } and array formats
      const rows = Array.isArray(result) ? result : (result.rows || []);
      allClients = rows.map((row: any) => ({
        id: row.id,
        code: row.code,
        firstName: row.first_name,
        lastName: row.last_name,
        cnp: row.cnp,
        birthDate: row.birth_date,
        companyName: row.company_name,
        cui: row.cui,
        regCom: row.reg_com,
        address: row.address,
        city: row.city,
        county: row.county,
        postalCode: row.postal_code,
        phone: row.phone,
        email: row.email,
        bankName: row.bank_name,
        iban: row.iban,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: row.created_at,
        createdBy: row.created_by,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
        deletedAt: row.deleted_at,
      }));
    } else {
      // Use regular clients table for other sorts
      let query = db.select().from(clients);
      if (whereClause) {
        query = query.where(whereClause);
      }
      
      if (sortBy === 'code') {
        query = sortOrder === 'desc' 
          ? query.orderBy(desc(clients.code))
          : query.orderBy(asc(clients.code));
      } else if (sortBy === 'createdAt') {
        query = sortOrder === 'desc' 
          ? query.orderBy(desc(clients.createdAt))
          : query.orderBy(asc(clients.createdAt));
      }
      
      const offset = (page - 1) * pageSize;
      allClients = await query.limit(pageSize).offset(offset);
    }

    console.log('[API /clients] Query result:', {
      clientsCount: allClients.length,
      totalCount,
      whereClause: whereClause ? 'has conditions' : 'no conditions',
    });

    return NextResponse.json({
      success: true,
      data: allClients,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/clients', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = createClientSchema.safeParse(body);

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

    // Check for duplicate code (excluding deleted clients)
    const existingClient = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.code, data.code),
          isNull(clients.deletedAt)
        )
      )
      .limit(1);

    if (existingClient.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Client with this code already exists' },
        { status: 400 }
      );
    }

    const [newClient] = await db
      .insert(clients)
      .values({
        code: data.code,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        cnp: data.cnp || null,
        birthDate: data.birthDate || null,
        companyName: data.companyName || null,
        cui: data.cui || null,
        regCom: data.regCom || null,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        postalCode: data.postalCode || null,
        phone: data.phone || null,
        email: data.email || null,
        bankName: data.bankName || null,
        iban: data.iban || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newClient,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/clients', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

