import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, isNull } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/registratura/documents/[id]/attachments/[attachmentId]/download - Download attachment
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  console.log(`Step 1: GET /api/registratura/documents/${id}/attachments/${attachmentId}/download - Downloading attachment`);

  try {
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

    // Get attachment
    const [attachment] = await db
      .select()
      .from(documentAttachments)
      .where(and(eq(documentAttachments.id, attachmentId), eq(documentAttachments.documentId, id)))
      .limit(1);

    if (!attachment) {
      console.log(`❌ Attachment ${attachmentId} not found`);
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(attachment.storagePath)) {
      console.log(`❌ File not found at path: ${attachment.storagePath}`);
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(attachment.storagePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize?.toString() || fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error downloading attachment:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/attachments/[attachmentId]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




