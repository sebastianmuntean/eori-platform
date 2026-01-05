import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, parishes, clients, departments, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

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
  // Get the max registration number for this parish, year, and type
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
 * GET /api/registratura/documents - List documents with filtering and pagination
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/registratura/documents - Fetching documents');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const parishId = searchParams.get('parishId');
    const documentType = searchParams.get('documentType') as 'incoming' | 'outgoing' | 'internal' | null;
    const status = searchParams.get('status');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const sortBy = searchParams.get('sortBy') || 'registrationDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions
    const conditions = [isNull(documentRegistry.deletedAt)]; // Only non-deleted documents

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
    }

    if (documentType) {
      conditions.push(eq(documentRegistry.documentType, documentType));
    }

    if (status) {
      conditions.push(eq(documentRegistry.status, status as any));
    }

    if (year) {
      conditions.push(eq(documentRegistry.registrationYear, year));
    }

    const whereClause = conditions.length > 1 ? and(...conditions as any[]) : conditions[0];

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documentRegistry)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(documentRegistry).where(whereClause);

    // Apply sorting
    if (sortBy === 'registrationDate' && documentRegistry.registrationDate) {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(documentRegistry.registrationDate))
        : query.orderBy(asc(documentRegistry.registrationDate));
    } else if (sortBy === 'registrationNumber') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(documentRegistry.registrationNumber))
        : query.orderBy(asc(documentRegistry.registrationNumber));
    } else if (sortBy === 'priority') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(documentRegistry.priority))
        : query.orderBy(asc(documentRegistry.priority));
    } else {
      query = query.orderBy(desc(documentRegistry.createdAt));
    }

    const documents = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    logError(error, { endpoint: '/api/registratura/documents', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/documents - Create a new document
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/registratura/documents - Creating new document');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createDocumentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parish exists
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      console.log(`❌ Parish ${data.parishId} not found`);
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 400 }
      );
    }

    // Generate registration number if status is 'registered'
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

    // Create document
    console.log('Step 2: Creating document');
    const [newDocument] = await db
      .insert(documentRegistry)
      .values({
        parishId: data.parishId,
        documentType: data.documentType,
        registrationNumber,
        registrationYear,
        formattedNumber,
        registrationDate: data.registrationDate ? new Date(data.registrationDate) : null,
        externalNumber: data.externalNumber || null,
        externalDate: data.externalDate ? new Date(data.externalDate) : null,
        senderClientId: data.senderClientId || null,
        senderName: data.senderName || null,
        senderDocNumber: data.senderDocNumber || null,
        senderDocDate: data.senderDocDate ? new Date(data.senderDocDate) : null,
        recipientClientId: data.recipientClientId || null,
        recipientName: data.recipientName || null,
        subject: data.subject,
        content: data.content || null,
        priority: data.priority || 'normal',
        status: data.status || 'draft',
        departmentId: data.departmentId || null,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        fileIndex: data.fileIndex || null,
        parentDocumentId: data.parentDocumentId || null,
        isSecret: data.isSecret || false,
        secretDeclassificationList: data.secretDeclassificationList || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    console.log(`✓ Document created successfully: ${newDocument.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating document:', error);
    logError(error, { endpoint: '/api/registratura/documents', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

