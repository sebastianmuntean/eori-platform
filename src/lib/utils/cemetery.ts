import { z } from 'zod';
import { and, or, ilike, sql, type SQL } from 'drizzle-orm';

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
 */
export function buildSearchCondition(
  search: string | null,
  fields: Array<{ column: any; useCoalesce?: boolean }>
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
    return ilike(column, searchPattern);
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
