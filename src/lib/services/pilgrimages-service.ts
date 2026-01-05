import { db } from '@/database/client';
import { pilgrimages } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

/**
 * Get pilgrimage by ID, throws NotFoundError if not found
 */
export async function getPilgrimageById(pilgrimageId: string) {
  const [pilgrimage] = await db
    .select()
    .from(pilgrimages)
    .where(eq(pilgrimages.id, pilgrimageId))
    .limit(1);

  if (!pilgrimage) {
    throw new NotFoundError('Pilgrimage not found');
  }

  return pilgrimage;
}

/**
 * Build where clause from conditions array
 */
export function buildWhereClause(conditions: any[]) {
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/**
 * Validate and normalize pagination parameters
 */
export function validatePagination(
  page: string | null,
  pageSize: string | null,
  maxPageSize: number = 100
) {
  const pageNum = Math.max(1, parseInt(page || '1') || 1);
  const pageSizeNum = Math.min(maxPageSize, Math.max(1, parseInt(pageSize || '10') || 10));
  return { page: pageNum, pageSize: pageSizeNum };
}

/**
 * Validate date range
 */
export function validateDateRange(dateFrom: string | null, dateTo: string | null) {
  if (dateFrom && dateTo) {
    if (dateFrom > dateTo) {
      throw new Error('Start date must be before or equal to end date');
    }
  }
}



