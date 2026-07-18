import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, parishes } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, like, or, desc, asc, and, isNull, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { addParishFilter } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const createDocumentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  documentType: z.enum(['incoming', 'outgoing', 'internal']),
  registrationDate: z.string().optional(),
  externalNumber: z.string().optional().nullable(),
  externalDate: z.string().optional().nullable(),
  senderClientId: z.string().uuid().optional().nullable(),
  senderName: z.string().optional().nullable(),
  senderDocNumber: z.string().optional().nullable(),
  senderDocDate: z.string().optional().nullable(),
  recipientClientId: z.string().uuid().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  subject: z.string().min(1, 'Subject is required').max(500),
  content: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional().default('draft'),
  departmentId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  fileIndex: z.string().optional().nullable(),
  parentDocumentId: z.string().uuid().optional().nullable(),
  isSecret: z.boolean().optional().default(false),
  secretDeclassificationList: z.array(z.string()).optional().nullable(),
});

/**
 * Helper function to generate document registration number
 * Uses MAX(registration_number) from existing documents instead of counters table
 */
async function generateDocumentNumber(
  parishId: string,
  documentType: 'incoming' | 'outgoing' | 'internal',
  year: number
): Promise<{ registrationNumber: number; formattedNumber: string }> {
  const [maxDoc] = await db
    .select({ maxNumber: sql<number>`COALESCE(MAX(${documentRegistry.registrationNumber}), 0)` })
    .from(documentRegistry)
    .where(
      and(
        eq(documentRegistry.parishId, parishId),
        eq(documentRegistry.registrationYear, year),
        eq(documentRegistry.documentType, documentType),
        isNull(documentRegistry.deletedAt)
      )
    );

  const nextNumber = (maxDoc?.maxNumber || 0) + 1;
  const formattedNumber = `${nextNumber}/${year}`;

  return {
    registrationNumber: nextNumber,
    formattedNumber,
  };
}

/**
 * GET /api/registry/documents - List documents with filtering and pagination
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);
    const { userId, user } = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePaginationParams(searchParams);
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const documentType = searchParams.get('documentType') as 'incoming' | 'outgoing' | 'internal' | null;
    const status = searchParams.get('status');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const sortBy = searchParams.get('sortBy') || 'registrationDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const conditions: SQL[] = [isNull(documentRegistry.deletedAt)];

    if (search) {
      conditions.push(
        or(
          like(documentRegistry.subject, `%${search}%`),
          like(documentRegistry.content || '', `%${search}%`),
          like(documentRegistry.formattedNumber || '', `%${search}%`),
          like(documentRegistry.senderName || '', `%${search}%`),
          like(documentRegistry.recipientName || '', `%${search}%`)
        )!
      );
    }

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    } else {
      await addParishFilter(conditions, documentRegistry, user?.parishId ?? null, userId ?? undefined);
    }

    if (documentType) {
      conditions.push(eq(documentRegistry.documentType, documentType));
    }

    if (status) {
      conditions.push(eq(documentRegistry.status, status as 'draft' | 'registered' | 'in_work' | 'resolved' | 'archived'));
    }

    if (year) {
      conditions.push(eq(documentRegistry.registrationYear, year));
    }

    const whereClause = and(...conditions);

    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documentRegistry)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const baseQuery = db.select().from(documentRegistry).where(whereClause);

    let queryWithOrder;
    if (sortBy === 'registrationDate' && documentRegistry.registrationDate) {
      queryWithOrder = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(documentRegistry.registrationDate))
        : baseQuery.orderBy(asc(documentRegistry.registrationDate));
    } else if (sortBy === 'registrationNumber') {
      queryWithOrder = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(documentRegistry.registrationNumber))
        : baseQuery.orderBy(asc(documentRegistry.registrationNumber));
    } else if (sortBy === 'priority') {
      queryWithOrder = sortOrder === 'desc'
        ? baseQuery.orderBy(desc(documentRegistry.priority))
        : baseQuery.orderBy(asc(documentRegistry.priority));
    } else {
      queryWithOrder = baseQuery.orderBy(desc(documentRegistry.createdAt));
    }

    const documents = await queryWithOrder.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  }, { endpoint: '/api/registry/documents', method: 'GET' });
}

/**
 * POST /api/registry/documents - Create a new document
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_CREATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createDocumentSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const data = validation.data;

    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      return createErrorResponse('Parish not found', 400);
    }

    let registrationNumber: number | null = null;
    let registrationYear: number | null = null;
    let formattedNumber: string | null = null;

    if (data.status === 'registered' || data.registrationDate) {
      const registrationDate = data.registrationDate ? new Date(data.registrationDate) : new Date();
      registrationYear = registrationDate.getFullYear();

      const numberData = await generateDocumentNumber(data.parishId, data.documentType, registrationYear);
      registrationNumber = numberData.registrationNumber;
      formattedNumber = numberData.formattedNumber;
    }

    const [newDocument] = await db
      .insert(documentRegistry)
      .values({
        parishId: data.parishId,
        documentType: data.documentType,
        registrationNumber,
        registrationYear,
        formattedNumber,
        registrationDate: data.registrationDate || null,
        externalNumber: data.externalNumber || null,
        externalDate: data.externalDate || null,
        senderClientId: data.senderClientId || null,
        senderName: data.senderName || null,
        senderDocNumber: data.senderDocNumber || null,
        senderDocDate: data.senderDocDate || null,
        recipientClientId: data.recipientClientId || null,
        recipientName: data.recipientName || null,
        subject: data.subject,
        content: data.content || null,
        priority: data.priority || 'normal',
        status: data.status || 'draft',
        departmentId: data.departmentId || null,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate || null,
        fileIndex: data.fileIndex || null,
        parentDocumentId: data.parentDocumentId || null,
        isSecret: data.isSecret || false,
        secretDeclassificationList: data.secretDeclassificationList || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return createSuccessResponse(newDocument);
  }, { endpoint: '/api/registry/documents', method: 'POST' });
}
