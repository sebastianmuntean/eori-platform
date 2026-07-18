import { db } from '@/database/client';
import { pilgrimages, parishes, pilgrimageWorkflow } from '@/database/schema';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { sanitizeSearch } from '@/lib/api-utils/validation';
import { calculatePagination } from '@/lib/api-utils/pagination';
import { parseSortOrder } from '@/lib/api-utils/sorting';
import type {
  CreatePilgrimageInput,
  UpdatePilgrimageInput,
} from '@/lib/validations/pilgrimages';

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
 * @deprecated Prefer parsePaginationParams from api-utils/pagination
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
      throw new ValidationError('Start date must be before or equal to end date');
    }
  }
}

export interface ListPilgrimagesParams {
  page: number;
  pageSize: number;
  search?: string | null;
  parishId?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
}

/**
 * List pilgrimages with filtering, sorting, and pagination
 */
export async function listPilgrimages(params: ListPilgrimagesParams) {
  const { page, pageSize } = params;
  const search = sanitizeSearch(params.search ?? null);
  const parishId = params.parishId;
  const status = params.status;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = parseSortOrder(params.sortOrder ?? null);

  validateDateRange(dateFrom ?? null, dateTo ?? null);

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(pilgrimages.title, `%${search}%`),
        like(pilgrimages.destination || '', `%${search}%`),
        like(pilgrimages.description || '', `%${search}%`),
        like(pilgrimages.organizerName || '', `%${search}%`)
      )!
    );
  }

  if (parishId) {
    conditions.push(eq(pilgrimages.parishId, parishId));
  }

  if (status) {
    conditions.push(
      eq(
        pilgrimages.status,
        status as
          | 'draft'
          | 'open'
          | 'closed'
          | 'in_progress'
          | 'completed'
          | 'cancelled'
      )
    );
  }

  if (dateFrom) {
    conditions.push(gte(pilgrimages.startDate, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(pilgrimages.endDate, dateTo));
  }

  const whereClause = buildWhereClause(conditions);

  const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(pilgrimages);
  const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;
  const totalCountResult = await countQuery;
  const totalCount = Number(totalCountResult[0]?.count || 0);

  const offset = (page - 1) * pageSize;
  const baseQuery = db.select().from(pilgrimages);
  const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

  let queryWithOrder;
  if (sortBy === 'startDate') {
    queryWithOrder =
      sortOrder === 'desc'
        ? queryWithWhere.orderBy(desc(pilgrimages.startDate))
        : queryWithWhere.orderBy(asc(pilgrimages.startDate));
  } else if (sortBy === 'title') {
    queryWithOrder =
      sortOrder === 'desc'
        ? queryWithWhere.orderBy(desc(pilgrimages.title))
        : queryWithWhere.orderBy(asc(pilgrimages.title));
  } else if (sortBy === 'createdAt') {
    queryWithOrder =
      sortOrder === 'desc'
        ? queryWithWhere.orderBy(desc(pilgrimages.createdAt))
        : queryWithWhere.orderBy(asc(pilgrimages.createdAt));
  } else {
    queryWithOrder = queryWithWhere.orderBy(desc(pilgrimages.createdAt));
  }

  const data = await queryWithOrder.limit(pageSize).offset(offset);

  return {
    data,
    pagination: calculatePagination(totalCount, page, pageSize),
  };
}

/**
 * Create a new pilgrimage
 */
export async function createPilgrimage(input: CreatePilgrimageInput, userId: string) {
  const [newPilgrimage] = await db
    .insert(pilgrimages)
    .values({
      parishId: input.parishId,
      title: input.title,
      description: input.description || null,
      destination: input.destination || null,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      registrationDeadline: input.registrationDeadline || null,
      maxParticipants: input.maxParticipants || null,
      minParticipants: input.minParticipants || null,
      status: input.status || 'draft',
      pricePerPerson: input.pricePerPerson || null,
      currency: input.currency || 'RON',
      organizerName: input.organizerName || null,
      organizerContact: input.organizerContact || null,
      notes: input.notes || null,
      createdBy: userId,
    })
    .returning();

  return newPilgrimage;
}

/**
 * Update an existing pilgrimage
 */
export async function updatePilgrimage(
  id: string,
  input: UpdatePilgrimageInput,
  userId: string
) {
  const existingPilgrimage = await getPilgrimageById(id);

  if (input.parishId && input.parishId !== existingPilgrimage.parishId) {
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, input.parishId))
      .limit(1);

    if (!existingParish) {
      throw new ValidationError('Parish not found');
    }
  }

  // Cross-field date/participant validation using merged values
  const mergedStartDate = input.startDate !== undefined ? input.startDate : existingPilgrimage.startDate;
  const mergedEndDate = input.endDate !== undefined ? input.endDate : existingPilgrimage.endDate;
  const mergedDeadline =
    input.registrationDeadline !== undefined
      ? input.registrationDeadline
      : existingPilgrimage.registrationDeadline;
  const mergedMax =
    input.maxParticipants !== undefined
      ? input.maxParticipants
      : existingPilgrimage.maxParticipants;
  const mergedMin =
    input.minParticipants !== undefined
      ? input.minParticipants
      : existingPilgrimage.minParticipants;

  if (mergedStartDate && mergedEndDate && mergedEndDate < mergedStartDate) {
    throw new ValidationError('End date must be after or equal to start date');
  }
  if (
    mergedMax !== null &&
    mergedMax !== undefined &&
    mergedMin !== null &&
    mergedMin !== undefined &&
    mergedMax < mergedMin
  ) {
    throw new ValidationError(
      'Maximum participants must be greater than or equal to minimum participants'
    );
  }
  if (mergedDeadline && mergedStartDate && mergedDeadline > mergedStartDate) {
    throw new ValidationError('Registration deadline must be before or equal to start date');
  }

  const oldStatus = existingPilgrimage.status;
  const updateData: Record<string, unknown> = {
    ...input,
    updatedAt: new Date(),
    updatedBy: userId,
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const [updatedPilgrimage] = await db
    .update(pilgrimages)
    .set(updateData)
    .where(eq(pilgrimages.id, id))
    .returning();

  if (!updatedPilgrimage) {
    throw new NotFoundError('Pilgrimage not found');
  }

  if (input.status && input.status !== oldStatus) {
    await db.insert(pilgrimageWorkflow).values({
      pilgrimageId: id,
      action:
        input.status === 'open'
          ? 'published'
          : input.status === 'cancelled'
            ? 'cancelled'
            : 'approved',
      fromStatus: oldStatus,
      toStatus: input.status,
      performedBy: userId,
    });
  }

  return updatedPilgrimage;
}

/**
 * Delete a pilgrimage
 */
export async function deletePilgrimage(id: string) {
  await getPilgrimageById(id);

  const [deletedPilgrimage] = await db
    .delete(pilgrimages)
    .where(eq(pilgrimages.id, id))
    .returning();

  if (!deletedPilgrimage) {
    throw new NotFoundError('Pilgrimage not found');
  }

  return deletedPilgrimage;
}
