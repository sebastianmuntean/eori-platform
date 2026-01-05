import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/registratura/general-register/[id]/attachments/[attachmentId]/download - Download attachment
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  console.log(`Step 1: GET /api/registratura/general-register/${id}/attachments/${attachmentId}/download - Downloading attachment`);

  try {
    // Check if document exists
    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
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
      .from(generalRegisterAttachments)
      .where(
        and(
          eq(generalRegisterAttachments.id, attachmentId),
          eq(generalRegisterAttachments.documentId, id)
        )
      )
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
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error downloading attachment:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/attachments/[attachmentId]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




