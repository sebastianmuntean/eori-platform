import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { receipts, receiptAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/parishioners/receipts/[id]/attachments/[attachmentId]/download - Download attachment
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params;

    // Check if receipt exists
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id))
      .limit(1);

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Get attachment
    const [attachment] = await db
      .select()
      .from(receiptAttachments)
      .where(and(eq(receiptAttachments.id, attachmentId), eq(receiptAttachments.receiptId, id)))
      .limit(1);

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(attachment.storagePath)) {
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
        'Content-Length': attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/[id]/attachments/[attachmentId]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







