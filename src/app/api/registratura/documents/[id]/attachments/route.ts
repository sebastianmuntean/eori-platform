import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry, documentAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';

// File storage directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || resolve(process.cwd(), 'uploads', 'documents');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/registratura/documents/[id]/attachments - Get all attachments for a document
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/registratura/documents/${id}/attachments - Fetching attachments`);

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

    // Get attachments
    const attachments = await db
      .select()
      .from(documentAttachments)
      .where(eq(documentAttachments.documentId, id));

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('❌ Error fetching attachments:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/attachments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/documents/[id]/attachments - Upload attachment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/documents/${id}/attachments - Uploading attachment`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log(`❌ File too large: ${file.size} bytes`);
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    // Use resolve to make it clear this is a runtime path, not a static import
    const storagePath = resolve(UPLOAD_DIR, id, uniqueFileName);

    // Ensure upload directory exists
    try {
      await mkdir(resolve(UPLOAD_DIR, id), { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create upload directory:', error);
      // Continue anyway - might already exist
    }

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(storagePath, buffer);

    // Create attachment record
    console.log('Step 2: Creating attachment record');
    const [newAttachment] = await db
      .insert(documentAttachments)
      .values({
        documentId: id,
        fileName: file.name,
        storageName: uniqueFileName,
        storagePath: storagePath,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        version: 1,
        isSigned: false,
        uploadedBy: userId,
      })
      .returning();

    console.log(`✓ Attachment uploaded successfully: ${newAttachment.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newAttachment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error uploading attachment:', error);
    logError(error, { endpoint: '/api/registratura/documents/[id]/attachments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}








