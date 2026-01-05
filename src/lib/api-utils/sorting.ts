/**
 * Sorting utilities for API routes
 */

import { asc, desc, SQL } from 'drizzle-orm';

/**
 * Parse and validate sort order
 */
export function parseSortOrder(sortOrder: string | null): 'asc' | 'desc' {
  return sortOrder === 'asc' ? 'asc' : 'desc';
}

/**
 * Create a safe order by clause with validation
 */
export function createOrderBy<T extends Record<string, any>>(
  table: T,
  sortBy: string | null,
  defaultSortBy: keyof T,
  allowedFields: readonly (keyof T)[],
  sortOrder: 'asc' | 'desc' = 'desc'
): SQL {
  const field = allowedFields.includes(sortBy as keyof T) 
    ? (sortBy as keyof T)
    : defaultSortBy;

  return sortOrder === 'asc' 
    ? asc(table[field] as any)
    : desc(table[field] as any);
}



