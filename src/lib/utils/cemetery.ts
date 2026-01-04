import { and, or, ilike, sql, type SQL, type Column } from 'drizzle-orm';

/**
 * Validates and normalizes pagination parameters
 */
export function normalizePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10') || 10));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

/**
 * Validates sort parameters
 */
export function normalizeSortParams<T extends string>(
  searchParams: URLSearchParams,
  allowedFields: readonly T[],
  defaultField: T,
  defaultOrder: 'asc' | 'desc' = 'asc'
): { sortBy: T; sortOrder: 'asc' | 'desc' } {
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');
  
  const validSortBy = allowedFields.includes(sortBy as T) ? (sortBy as T) : defaultField;
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  
  return { sortBy: validSortBy, sortOrder: validSortOrder };
}

/**
 * Builds a search condition for multiple fields
 * 
 * @param search - Search string to match against
 * @param fields - Array of column definitions with optional coalesce flag
 * @returns SQL condition or undefined if search is empty
 */
export function buildSearchCondition(
  search: string | null,
  fields: Array<{ column: Column | SQL; useCoalesce?: boolean }>
): SQL | undefined {
  if (!search || !search.trim()) {
    return undefined;
  }
  
  const trimmedSearch = search.trim();
  const searchPattern = `%${trimmedSearch}%`;
  
  const conditions = fields.map(({ column, useCoalesce }) => {
    if (useCoalesce) {
      return sql`COALESCE(${column}, '') ILIKE ${searchPattern}`;
    }
    return ilike(column as Column, searchPattern);
  });
  
  if (conditions.length === 0) {
    return undefined;
  }
  
  return conditions.length === 1 ? conditions[0] : or(...conditions)!;
}

/**
 * Validates UUID parameter
 */
export function validateUuid(id: string | null | undefined): { valid: boolean; error?: string } {
  if (!id) {
    return { valid: false, error: 'ID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true };
}

/**
 * Validates date range
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  
  if (end < start) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  return { valid: true };
}

/**
 * Type guard for grave status
 */
export type GraveStatus = 'free' | 'occupied' | 'reserved' | 'maintenance';

export function isValidGraveStatus(status: string): status is GraveStatus {
  const validStatuses: readonly GraveStatus[] = ['free', 'occupied', 'reserved', 'maintenance'];
  return validStatuses.includes(status as GraveStatus);
}

/**
 * Type guard for concession status
 */
export type ConcessionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export function isValidConcessionStatus(status: string): status is ConcessionStatus {
  const validStatuses: readonly ConcessionStatus[] = ['active', 'expired', 'cancelled', 'pending'];
  return validStatuses.includes(status as ConcessionStatus);
}

/**
 * Builds a where clause from an array of conditions
 */
export function buildWhereClause(conditions: SQL[]): SQL | undefined {
  if (conditions.length === 0) {
    return undefined;
  }
  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

/**
 * Generates a unique payment number using timestamp to avoid race conditions
 * 
 * @param parishId - Parish UUID (first 8 chars used for uniqueness)
 * @param prefix - Payment prefix (default: 'INC')
 * @returns Unique payment number
 */
export function generatePaymentNumber(parishId: string, prefix: string = 'INC'): string {
  const timestamp = Date.now();
  const parishPrefix = parishId.substring(0, 8).replace(/-/g, '').toUpperCase();
  return `${prefix}-${parishPrefix}-${timestamp}`;
}

/**
 * Builds an update data object with only defined fields
 * Automatically includes updatedAt and updatedBy fields
 * 
 * @param userId - User ID for updatedBy field
 * @param data - Partial data object with fields to update
 * @returns Update data object with only defined fields plus updatedAt and updatedBy
 */
export function buildUpdateData<T extends Record<string, any>>(
  userId: string,
  data: Partial<T>
): Partial<T> & { updatedAt: Date; updatedBy: string } {
  const updateData: Partial<T> & { updatedAt: Date; updatedBy: string } = {
    updatedAt: new Date(),
    updatedBy: userId,
  } as Partial<T> & { updatedAt: Date; updatedBy: string };

  // Only include fields that are explicitly defined (not undefined)
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      (updateData as any)[key] = value;
    }
  }

  return updateData;
}
