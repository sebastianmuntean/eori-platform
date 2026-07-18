import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentAttachments } from '@/database/schema';
import { requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createErrorResponse } from '@/lib/api-utils/error-handling';

/**
 * GET /api/registry/documents/[id]/attachments/[attachmentId]/download - Download attachment
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW);

    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

    const [attachment] = await db
      .select()
      .from(documentAttachments)
      .where(and(eq(documentAttachments.id, attachmentId), eq(documentAttachments.documentId, id)))
      .limit(1);

    if (!attachment) {
      return createErrorResponse('Attachment not found', 404);
    }

    if (!existsSync(attachment.storagePath)) {
      return createErrorResponse('File not found', 404);
    }

    const fileBuffer = await readFile(attachment.storagePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize?.toString() || fileBuffer.length.toString(),
      },
    });
  }, { endpoint: '/api/registry/documents/[id]/attachments/[attachmentId]/download', method: 'GET' });
}
