import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { eq, desc, asc, and, isNull, sql, SQL } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { sanitizeSearch } from '@/lib/api-utils/validation';
import { calculatePagination } from '@/lib/api-utils/pagination';
import type { CreateClientInput, UpdateClientInput } from '@/lib/validations/clients';

const ALLOWED_SORT_FIELDS = ['code', 'name', 'companyName', 'createdAt'] as const;

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
  name?: string;
}

export interface ClientResponse {
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

export interface ListClientsParams {
  page: number;
  pageSize: number;
  search?: string | null;
  sortBy?: string | null;
  sortOrder?: SortOrder;
}

function validateSortParams(
  sortByParam: string | null | undefined,
  sortOrderParam: SortOrder | undefined
): { sortBy: AllowedSortField; sortOrder: SortOrder } {
  const sortBy = ALLOWED_SORT_FIELDS.includes(sortByParam as AllowedSortField)
    ? (sortByParam as AllowedSortField)
    : 'code';
  const sortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';
  return { sortBy, sortOrder };
}

function buildSearchConditions(search: string): SQL[] {
  if (!search?.trim()) {
    return [];
  }

  const searchPattern = `%${search.trim()}%`;

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

function buildViewWhereSQL(search: string): SQL {
  const baseWhere = sql`deleted_at IS NULL AND is_active = true`;

  if (!search?.trim()) {
    return baseWhere;
  }

  const searchPattern = `%${search.trim()}%`;
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

function buildTableWhereClause(search: string): SQL | undefined {
  const conditions: SQL[] = [
    eq(clients.isActive, true),
    isNull(clients.deletedAt),
  ];

  conditions.push(...buildSearchConditions(search));

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

function applyTableSorting(
  baseQuery: any,
  sortBy: AllowedSortField,
  sortOrder: SortOrder
) {
  if (sortBy === 'code') {
    return sortOrder === 'desc'
      ? baseQuery.orderBy(desc(clients.code))
      : baseQuery.orderBy(asc(clients.code));
  }

  if (sortBy === 'createdAt') {
    return sortOrder === 'desc'
      ? baseQuery.orderBy(desc(clients.createdAt))
      : baseQuery.orderBy(asc(clients.createdAt));
  }

  return baseQuery;
}

async function fetchClientsFromTable(
  search: string,
  sortBy: AllowedSortField,
  sortOrder: SortOrder,
  page: number,
  pageSize: number
): Promise<ClientResponse[]> {
  const whereClause = buildTableWhereClause(search);
  const baseQuery = db.select().from(clients);
  const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;
  const query = applyTableSorting(queryWithWhere, sortBy, sortOrder);
  const offset = (page - 1) * pageSize;
  const results = await query.limit(pageSize).offset(offset);
  return results as ClientResponse[];
}

async function getCountFromTable(search: string): Promise<number> {
  const whereClause = buildTableWhereClause(search);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(whereClause);

  return Number(countResult[0]?.count || 0);
}

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
  `) as any;

  const rows = Array.isArray(result) ? result : (result.rows || []);
  return rows.map((row: ClientViewRow) => mapClientViewRowToResponse(row));
}

async function getCountFromView(search: string): Promise<number> {
  const viewWhereSQL = buildViewWhereSQL(search);

  const countResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM clients_view 
    WHERE ${viewWhereSQL}
  `) as any;

  const countRows = Array.isArray(countResult) ? countResult : (countResult.rows || []);
  return Number((countRows[0] as { count: string | number })?.count || 0);
}

/**
 * List active, non-deleted clients with pagination, search, and sorting
 */
export async function listClients(params: ListClientsParams) {
  const { page, pageSize } = params;
  const search = sanitizeSearch(params.search ?? null);
  const { sortBy, sortOrder } = validateSortParams(params.sortBy, params.sortOrder);

  const useView = sortBy === 'name' || sortBy === 'companyName';

  const [data, totalCount] = await Promise.all([
    useView
      ? fetchClientsFromView(search, sortOrder, page, pageSize)
      : fetchClientsFromTable(search, sortBy, sortOrder, page, pageSize),
    useView ? getCountFromView(search) : getCountFromTable(search),
  ]);

  return {
    data,
    pagination: calculatePagination(totalCount, page, pageSize),
  };
}

/**
 * Get a single client by ID (excludes soft-deleted)
 */
export async function getClientById(id: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
    .limit(1);

  if (!client) {
    throw new NotFoundError('Client not found');
  }

  return client;
}

/**
 * Create a new client
 */
export async function createClient(input: CreateClientInput, userId: string) {
  const existingClient = await db
    .select()
    .from(clients)
    .where(and(eq(clients.code, input.code), isNull(clients.deletedAt)))
    .limit(1);

  if (existingClient.length > 0) {
    throw new ValidationError('Client with this code already exists');
  }

  const [newClient] = await db
    .insert(clients)
    .values({
      code: input.code,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      cnp: input.cnp || null,
      birthDate: input.birthDate || null,
      companyName: input.companyName || null,
      cui: input.cui || null,
      regCom: input.regCom || null,
      address: input.address || null,
      city: input.city || null,
      county: input.county || null,
      postalCode: input.postalCode || null,
      phone: input.phone || null,
      email: input.email || null,
      bankName: input.bankName || null,
      iban: input.iban || null,
      notes: input.notes || null,
      isActive: input.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return newClient;
}

/**
 * Update an existing client
 */
export async function updateClient(
  id: string,
  input: UpdateClientInput,
  userId: string
) {
  const currentClient = await getClientById(id);

  if (input.code && input.code !== currentClient.code) {
    const existingClient = await db
      .select()
      .from(clients)
      .where(and(eq(clients.code, input.code), isNull(clients.deletedAt)))
      .limit(1);

    if (existingClient.length > 0 && existingClient[0].id !== id) {
      throw new ValidationError('Client with this code already exists');
    }
  }

  const [updatedClient] = await db
    .update(clients)
    .set({
      ...input,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(clients.id, id))
    .returning();

  if (!updatedClient) {
    throw new NotFoundError('Client not found');
  }

  return updatedClient;
}

/**
 * Soft-delete a client
 */
export async function softDeleteClient(id: string, userId: string) {
  await getClientById(id);

  const [deletedClient] = await db
    .update(clients)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(clients.id, id))
    .returning();

  if (!deletedClient) {
    throw new NotFoundError('Client not found');
  }

  return deletedClient;
}
