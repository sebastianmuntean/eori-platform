import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentArchive } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const archiveDocumentSchema = z.object({
  archiveIndicator: z.string().max(50).optional().nullable(),
  archiveTerm: z.string().max(50).optional().nullable(),
  archiveLocation: z.string().max(255).optional().nullable(),
});

/**
 * POST /api/registratura/documents/[id]/archive - Archive document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/documents/${id}/archive - Archiving document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = archiveDocumentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if document exists
    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if already archived
    const [existingArchive] = await db
      .select()
      .from(documentArchive)
      .where(eq(documentArchive.documentId, id))
      .limit(1);

    if (existingArchive) {
      return NextResponse.json(
        { success: false, error: 'Document already archived' },
        { status: 400 }
      );
    }

    // Create archive record
    const [archiveRecord] = await db
      .insert(documentArchive)
      .values({
        documentId: id,
        archiveIndicator: data.archiveIndicator || null,
        archiveTerm: data.archiveTerm || null,
        archiveLocation: data.archiveLocation || null,
        archivedBy: userId,
      })
      .returning();

    // Update document status to archived
    const [updatedDocument] = await db
      .update(documentRegistry)
      .set({
        status: 'archived',
        fileIndex: data.archiveIndicator || document.fileIndex,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(documentRegistry.id, id))
      .returning();

    if (!updatedDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Document archived successfully`);
    return NextResponse.json({
      success: true,
      data: {
        document: updatedDocument,
        archive: archiveRecord,
      },
    });
  } catch (error) {
    console.error('❌ Error archiving document:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/archive', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


