import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventDocuments, churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { getEventById } from '@/lib/services/events-service';

// For now, we'll store files in a local uploads directory
// In production, you'd want to use cloud storage (S3, etc.)
const UPLOAD_DIR = process.env.EVENT_DOCUMENTS_UPLOAD_DIR || resolve(process.cwd(), 'uploads', 'events');
const MAX_FILE_SIZE = parseInt(process.env.MAX_EVENT_DOCUMENT_SIZE || '10485760'); // 10MB default

// Allowed MIME types for event documents
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const createDocumentSchema = z.object({
  description: z.string().optional().nullable(),
});

/**
 * GET /api/events/[eventId]/documents - Get all documents for an event
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: GET /api/events/${eventId}/documents - Fetching documents`);

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

    const documents = await db
      .select()
      .from(churchEventDocuments)
      .where(eq(churchEventDocuments.eventId, eventId));

    console.log(`✓ Found ${documents.length} documents`);
    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    logError(error, { endpoint: '/api/events/[eventId]/documents', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/events/[eventId]/documents - Upload a document
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: POST /api/events/${eventId}/documents - Uploading document`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to upload documents
    const hasPermission = await checkPermission('events:update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

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
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.log(`❌ Invalid file type: ${file.type}`);
      return NextResponse.json(
        { success: false, error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description) {
      const validation = createDocumentSchema.safeParse({ description });
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0].message },
          { status: 400 }
        );
      }
    }

    // Generate unique filename with sanitized extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    if (!fileExtension) {
      return NextResponse.json(
        { success: false, error: 'Invalid file extension' },
        { status: 400 }
      );
    }
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    // Use resolve to make it clear this is a runtime path, not a static import
    const storagePath = resolve(UPLOAD_DIR, eventId, uniqueFileName);

    // Ensure upload directory exists
    try {
      await mkdir(resolve(UPLOAD_DIR, eventId), { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create upload directory:', error);
      // Continue anyway - might already exist
    }

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(storagePath, buffer);

    // Create document record
    console.log('Step 2: Creating document record');
    const [newDocument] = await db
      .insert(churchEventDocuments)
      .values({
        eventId,
        fileName: uniqueFileName,
        filePath: storagePath,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size.toString(),
        description: description || null,
        uploadedBy: userId,
      })
      .returning();

    console.log(`✓ Document uploaded successfully: ${newDocument.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    logError(error, { endpoint: '/api/events/[eventId]/documents', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



