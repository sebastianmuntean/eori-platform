import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventDocuments, churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { getEventById } from '@/lib/services/events-service';

/**
 * DELETE /api/events/[eventId]/documents/[id] - Delete a document
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { eventId, id } = await params;
  console.log(`Step 1: DELETE /api/events/${eventId}/documents/${id} - Deleting document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to update events
    const hasPermission = await checkPermission('events:update');
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

    // Delete file from filesystem
    try {
      if (existsSync(document.filePath)) {
        await unlink(document.filePath);
        console.log(`✓ File deleted: ${document.filePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to delete file: ${error}`);
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record
    const [deletedDocument] = await db
      .delete(churchEventDocuments)
      .where(eq(churchEventDocuments.id, id))
      .returning();

    if (!deletedDocument) {
      console.log(`❌ Document ${id} not found after delete`);
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Document deleted successfully: ${deletedDocument.id}`);
    return NextResponse.json({
      success: true,
      data: deletedDocument,
    });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    logError(error, { endpoint: '/api/events/[eventId]/documents/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

