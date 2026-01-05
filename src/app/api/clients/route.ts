import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { formatValidationErrors } from '@/lib/api-utils/validation';
import { eq, desc, asc, and, isNull, sql, ilike, SQL } from 'drizzle-orm';
import { z } from 'zod';

// Constants
const ALLOWED_SORT_FIELDS = ['code', 'name', 'companyName', 'createdAt'] as const;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

// Type definitions
type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];
type SortOrder = 'asc' | 'desc';

interface ClientViewRow {
  id: string;
  code: string;
  first_name: string | null;
  last_name: string | null;
  cnp: string | null;
  birth_date: string | null;
  company_name: string | null;
  cui: string | null;
  reg_com: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  bank_name: string | null;
  iban: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  deleted_at: Date | null;
  name?: string; // Calculated field from view
}

interface ClientResponse {
  id: string;
  code: string;
  firstName: string | null;
  lastName: string | null;
  cnp: string | null;
  birthDate: string | null;
  companyName: string | null;
  cui: string | null;
  regCom: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  iban: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  deletedAt: Date | null;
}

// Validation schemas
const createClientSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  cnp: z.string()
    .refine((val) => !val || val.length === 13, 'CNP must be exactly 13 digits')
    .refine((val) => !val || /^\d{13}$/.test(val), 'CNP must contain only digits')
    .optional(),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
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
  iban: z.string()
    .max(34)
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/i, 'Invalid IBAN format')
    .transform((val) => val.toUpperCase())
    .optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Build search conditions for client queries using Drizzle ORM
 * @param search - Search term to filter by
 * @returns Array of SQL conditions for search
 */
function buildSearchConditions(search: string): SQL[] {
  if (!search?.trim()) {
    return [];
  }
  
  const trimmedSearch = search.trim();
  const searchPattern = `%${trimmedSearch}%`;
  
  return [
    sql`(
      ${clients.code} ILIKE ${searchPattern}
      OR COALESCE(${clients.firstName}, '') ILIKE ${searchPattern}
      OR COALESCE(${clients.lastName}, '') ILIKE ${searchPattern}
      OR COALESCE(${clients.companyName}, '') ILIKE ${searchPattern}
      OR COALESCE(${clients.cnp}, '') ILIKE ${searchPattern}
      OR COALESCE(${clients.cui}, '') ILIKE ${searchPattern}
      OR COALESCE(${clients.city}, '') ILIKE ${searchPattern}
      OR COALESCE(${clients.email}, '') ILIKE ${searchPattern}
      OR CONCAT(COALESCE(${clients.firstName}, ''), ' ', COALESCE(${clients.lastName}, '')) ILIKE ${searchPattern}
    )`,
  ];
}

/**
 * Build base WHERE SQL for clients_view (always filters active and non-deleted)
 * @returns Base WHERE SQL condition
 */
function buildViewBaseWhereSQL(): SQL {
  return sql`deleted_at IS NULL AND is_active = true`;
}

/**
 * Build complete WHERE SQL for view queries with optional search
 * @param search - Search term to filter by
 * @returns Complete WHERE SQL condition
 */
function buildViewWhereSQL(search: string): SQL {
  const baseWhere = buildViewBaseWhereSQL();
  
  if (!search?.trim()) {
    return baseWhere;
  }
  
  const trimmedSearch = search.trim();
  const searchPattern = `%${trimmedSearch}%`;
  const searchSQL = sql`(
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
  
  return sql`${baseWhere} AND ${searchSQL}`;
}

/**
 * Convert database row (snake_case) to API response format (camelCase)
 * @param row - Database row from clients_view
 * @returns Client response object
 */
function mapClientViewRowToResponse(row: ClientViewRow): ClientResponse {
  return {
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
  };
}

/**
 * Validate and sanitize pagination parameters
 * @param pageParam - Page number from query string
 * @param pageSizeParam - Page size from query string
 * @returns Validated page and pageSize
 */
function validatePagination(
  pageParam: string | null,
  pageSizeParam: string | null
): { page: number; pageSize: number } {
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  return { page, pageSize };
}

/**
 * Validate and sanitize sort parameters
 * @param sortByParam - Sort field from query string
 * @param sortOrderParam - Sort order from query string
 * @returns Validated sortBy and sortOrder
 */
function validateSortParams(
  sortByParam: string | null,
  sortOrderParam: string | null
): { sortBy: AllowedSortField; sortOrder: SortOrder } {
  const sortBy = ALLOWED_SORT_FIELDS.includes(sortByParam as AllowedSortField)
    ? (sortByParam as AllowedSortField)
    : 'code';
  const sortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';
  return { sortBy, sortOrder };
}

/**
 * Build WHERE clause for table queries
 * @param search - Search term
 * @returns WHERE clause or undefined
 */
function buildTableWhereClause(search: string): SQL | undefined {
  const conditions: SQL[] = [
    eq(clients.isActive, true),
    isNull(clients.deletedAt),
  ];

  // Add search conditions
  const searchConditions = buildSearchConditions(search);
  conditions.push(...searchConditions);

  return conditions.length > 0 
    ? (conditions.length === 1 ? conditions[0] : and(...conditions))
    : undefined;
}

/**
 * Apply sorting to table query
 * @param query - Drizzle query builder
 * @param sortBy - Sort field
 * @param sortOrder - Sort direction
 * @returns Query with sorting applied
 */
function applyTableSorting(
  query: ReturnType<typeof db.select>,
  sortBy: AllowedSortField,
  sortOrder: SortOrder
) {
  if (sortBy === 'code') {
    return sortOrder === 'desc' 
      ? query.orderBy(desc(clients.code))
      : query.orderBy(asc(clients.code));
  }
  
  if (sortBy === 'createdAt') {
    return sortOrder === 'desc' 
      ? query.orderBy(desc(clients.createdAt))
      : query.orderBy(asc(clients.createdAt));
  }
  
  return query;
}

/**
 * Fetch clients from table (for code/createdAt sorting)
 * @param search - Search term
 * @param sortBy - Sort field
 * @param sortOrder - Sort direction
 * @param page - Page number
 * @param pageSize - Items per page
 * @returns Array of client responses
 */
async function fetchClientsFromTable(
  search: string,
  sortBy: AllowedSortField,
  sortOrder: SortOrder,
  page: number,
  pageSize: number
): Promise<ClientResponse[]> {
  const whereClause = buildTableWhereClause(search);
  let query = db.select().from(clients);
  
  if (whereClause) {
    query = query.where(whereClause);
  }
  
  query = applyTableSorting(query, sortBy, sortOrder);
  const offset = (page - 1) * pageSize;
  
  const results = await query.limit(pageSize).offset(offset);
  return results as ClientResponse[];
}

/**
 * Get total count from table
 * @param search - Search term
 * @returns Total count
 */
async function getCountFromTable(search: string): Promise<number> {
  const whereClause = buildTableWhereClause(search);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(whereClause);
  
  return Number(countResult[0]?.count || 0);
}

/**
 * Fetch clients from view (for name/companyName sorting)
 * @param search - Search term
 * @param sortOrder - Sort direction
 * @param page - Page number
 * @param pageSize - Items per page
 * @returns Array of client responses
 */
async function fetchClientsFromView(
  search: string,
  sortOrder: SortOrder,
  page: number,
  pageSize: number
): Promise<ClientResponse[]> {
  const viewWhereSQL = buildViewWhereSQL(search);
  const orderDirection = sortOrder === 'desc' ? sql`DESC` : sql`ASC`;
  const offset = (page - 1) * pageSize;
  
  const result = await db.execute(sql`
    SELECT * 
    FROM clients_view 
    WHERE ${viewWhereSQL}
    ORDER BY name ${orderDirection}
    LIMIT ${pageSize} OFFSET ${offset}
  `);
  
  const rows = Array.isArray(result) ? result : (result.rows || []);
  return rows.map((row: ClientViewRow) => mapClientViewRowToResponse(row));
}

/**
 * Get total count from view
 * @param search - Search term
 * @returns Total count
 */
async function getCountFromView(search: string): Promise<number> {
  const viewWhereSQL = buildViewWhereSQL(search);
  
  const countResult = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM clients_view 
    WHERE ${viewWhereSQL}
  `);
  
  const countRows = Array.isArray(countResult) ? countResult : (countResult.rows || []);
  return Number((countRows[0] as { count: string | number })?.count || 0);
}

/**
 * GET /api/clients - List clients with pagination, search, and sorting
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 10, max: 100)
 * - search: Search term (searches code, name, company, CNP, CUI, city, email)
 * - sortBy: Sort field (code, name, companyName, createdAt)
 * - sortOrder: Sort direction (asc, desc)
 * 
 * @param request - Next.js request object
 * @returns Paginated list of active, non-deleted clients
 */
export async function GET(request: Request) {
  try {
    console.log('[API /clients] GET request received');
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize parameters
    const { page, pageSize } = validatePagination(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );
    const search = searchParams.get('search') || '';
    const { sortBy, sortOrder } = validateSortParams(
      searchParams.get('sortBy'),
      searchParams.get('sortOrder')
    );

    console.log('[API /clients] Query params:', { page, pageSize, search, sortBy, sortOrder });

    // Use view when sorting by name for better performance (view has pre-calculated "name" field)
    const useView = sortBy === 'name' || sortBy === 'companyName';
    
    // Fetch data and count in parallel based on query type
    const [allClients, totalCount] = await Promise.all([
      useView
        ? fetchClientsFromView(search, sortOrder, page, pageSize)
        : fetchClientsFromTable(search, sortBy, sortOrder, page, pageSize),
      useView
        ? getCountFromView(search)
        : getCountFromTable(search),
    ]);

    console.log('[API /clients] Query result:', {
      clientsCount: allClients.length,
      totalCount,
      useView,
      sortBy,
      sortOrder,
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

/**
 * POST /api/clients - Create a new client
 * 
 * Requires authentication. Validates input and checks for duplicate codes.
 * 
 * @param request - Next.js request object with client data in body
 * @returns Created client object
 */
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
    let body: unknown;
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

    // Create new client
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

