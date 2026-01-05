import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, and, isNull, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const searchDocumentsSchema = z.object({
  parishId: z.string().uuid().optional(),
  documentType: z.enum(['incoming', 'outgoing', 'internal']).optional(),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  year: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  senderName: z.string().optional(),
  recipientName: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

/**
 * POST /api/registratura/search - Advanced search for documents
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/registratura/search - Searching documents');

  try {
    const body = await request.json();
    const validation = searchDocumentsSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const page = data.page || 1;
    const pageSize = data.limit || 10;

    // Build query conditions (AND logic)
    const conditions = [isNull(documentRegistry.deletedAt)]; // Only non-deleted documents

    if (data.parishId) {
      conditions.push(eq(documentRegistry.parishId, data.parishId));
    }

    if (data.documentType) {
      conditions.push(eq(documentRegistry.documentType, data.documentType));
    }

    if (data.status) {
      conditions.push(eq(documentRegistry.status, data.status));
    }

    if (data.priority) {
      conditions.push(eq(documentRegistry.priority, data.priority));
    }

    if (data.year) {
      conditions.push(eq(documentRegistry.registrationYear, data.year));
    }

    if (data.startDate) {
      const startDateStr = new Date(data.startDate).toISOString().split('T')[0];
      conditions.push(gte(documentRegistry.registrationDate, startDateStr));
    }

    if (data.endDate) {
      const endDateStr = new Date(data.endDate).toISOString().split('T')[0];
      conditions.push(lte(documentRegistry.registrationDate, endDateStr));
    }

    if (data.subject) {
      conditions.push(like(documentRegistry.subject, `%${data.subject}%`));
    }

    if (data.content) {
      conditions.push(like(documentRegistry.content || '', `%${data.content}%`));
    }

    if (data.senderName) {
      conditions.push(like(documentRegistry.senderName || '', `%${data.senderName}%`));
    }

    if (data.recipientName) {
      conditions.push(like(documentRegistry.recipientName || '', `%${data.recipientName}%`));
    }

    if (data.departmentId) {
      conditions.push(eq(documentRegistry.departmentId, data.departmentId));
    }

    if (data.assignedTo) {
      conditions.push(eq(documentRegistry.assignedTo, data.assignedTo));
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
    const documents = await db
      .select()
      .from(documentRegistry)
      .where(whereClause)
      .orderBy(sql`${documentRegistry.registrationDate} DESC NULLS LAST`)
      .limit(pageSize)
      .offset(offset);

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
    console.error('❌ Error searching documents:', error);
    logError(error, { endpoint: '/api/registratura/search', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

