import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventDocuments, churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { getEventById } from '@/lib/services/events-service';

/**
 * GET /api/events/[eventId]/documents/[id]/download - Download a document
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { eventId, id } = await params;
  console.log(`Step 1: GET /api/events/${eventId}/documents/${id}/download - Downloading document`);

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view events
    const hasPermission = await checkPermission('events:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    // Get document
    const [document] = await db
      .select()
      .from(churchEventDocuments)
      .where(eq(churchEventDocuments.id, id))
      .limit(1);

    if (!document || document.eventId !== eventId) {
      console.log(`❌ Document ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!existsSync(document.filePath)) {
      console.log(`❌ File not found at path: ${document.filePath}`);
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(document.filePath);

    // Determine content type from file type or file extension
    const contentType = document.fileType || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        ...(document.fileSize && { 'Content-Length': document.fileSize }),
      },
    });
  } catch (error) {
    console.error('❌ Error downloading document:', error);
    logError(error, { endpoint: '/api/events/[eventId]/documents/[id]/download', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



