import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { receiptAttachments, receipts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { uploadParishionerFile } from '@/lib/services/parishioner-file-service';

/**
 * GET /api/parishioners/receipts/[id]/attachments - Get all attachments for a receipt
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const attachments = await db
      .select()
      .from(receiptAttachments)
      .where(eq(receiptAttachments.receiptId, id));

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/[id]/attachments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/parishioners/receipts/[id]/attachments - Upload attachment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload file using shared service
    const uploadResult = await uploadParishionerFile({
      entityId: id,
      file,
      uploadedBy: userId,
      uploadDir: 'receipts',
    });

    // Create attachment record
    const [newAttachment] = await db
      .insert(receiptAttachments)
      .values({
        receiptId: id,
        fileName: uploadResult.fileName,
        storageName: uploadResult.storageName,
        storagePath: uploadResult.storagePath,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        uploadedBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newAttachment,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/[id]/attachments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

