import { db } from '@/database/client';
import { deaneries, dioceses, parishes } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { ValidationError } from '@/lib/errors';

/**
 * Validates that a diocese exists
 */
export async function validateDiocese(dioceseId: string): Promise<void> {
  const [diocese] = await db
    .select()
    .from(dioceses)
    .where(eq(dioceses.id, dioceseId))
    .limit(1);

  if (!diocese) {
    throw new ValidationError('Diocese not found');
  }
}

/**
 * Validates that a deanery exists and belongs to the specified diocese
 */
export async function validateDeaneryBelongsToDiocese(
  deaneryId: string,
  dioceseId: string
): Promise<void> {
  const [deanery] = await db
    .select()
    .from(deaneries)
    .where(
      and(
        eq(deaneries.id, deaneryId),
        eq(deaneries.dioceseId, dioceseId)
      )
    )
    .limit(1);

  if (!deanery) {
    throw new ValidationError('Deanery does not belong to the specified diocese');
  }
}

/**
 * Validates that a parish code is unique
 */
export async function validateParishCodeUnique(
  code: string,
  excludeParishId?: string
): Promise<void> {
  let query = db
    .select()
    .from(parishes)
    .where(eq(parishes.code, code))
    .limit(1);

  const [existingParish] = await query;

  if (existingParish && (!excludeParishId || existingParish.id !== excludeParishId)) {
    throw new ValidationError('Parish with this code already exists');
  }
}

