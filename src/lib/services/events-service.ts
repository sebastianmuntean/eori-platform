import { db } from '@/database/client';
import { churchEvents } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

/**
 * Get event by ID, throws NotFoundError if not found
 */
export async function getEventById(eventId: string) {
  const [event] = await db
    .select()
    .from(churchEvents)
    .where(eq(churchEvents.id, eventId))
    .limit(1);

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  return event;
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
      throw new Error('Invalid date range: start date must be before end date');
    }
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateFrom && !dateRegex.test(dateFrom)) {
    throw new Error('Invalid date format: start date must be in YYYY-MM-DD format');
  }
  if (dateTo && !dateRegex.test(dateTo)) {
    throw new Error('Invalid date format: end date must be in YYYY-MM-DD format');
  }
  
  return { dateFrom, dateTo };
}

