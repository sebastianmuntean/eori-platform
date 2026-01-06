import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageDocuments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';

/**
 * GET /api/pilgrimages/[id]/documents/[documentId]/download - Download a document
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await getPilgrimageById(id);

    const [document] = await db
      .select()
      .from(pilgrimageDocuments)
      .where(
        and(
          eq(pilgrimageDocuments.id, documentId),
          eq(pilgrimageDocuments.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Read file from filesystem
    const fileBuffer = await readFile(document.filePath);

    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize?.toString() || fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error downloading document:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/documents/[documentId]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







