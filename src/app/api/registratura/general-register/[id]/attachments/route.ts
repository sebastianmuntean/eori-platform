import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterAttachments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';

// File storage directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || resolve(process.cwd(), 'uploads', 'general-register');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/registratura/general-register/[id]/attachments - Get all attachments for a document (optionally filtered by workflow step)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const workflowStepId = searchParams.get('workflowStepId');

  console.log(`Step 1: GET /api/registratura/general-register/${id}/attachments - Fetching attachments`);

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

    // Get attachments - if workflowStepId is provided, filter by it; otherwise get all attachments for document (including global ones with workflowStepId = null)
    let attachments;
    if (workflowStepId) {
      attachments = await db
        .select()
        .from(generalRegisterAttachments)
        .where(
          and(
            eq(generalRegisterAttachments.documentId, id),
            eq(generalRegisterAttachments.workflowStepId, workflowStepId)
          )
        )
        .orderBy(desc(generalRegisterAttachments.createdAt));
    } else {
      // Get all attachments for document (both global and step-specific)
      attachments = await db
        .select()
        .from(generalRegisterAttachments)
        .where(eq(generalRegisterAttachments.documentId, id))
        .orderBy(desc(generalRegisterAttachments.createdAt));
    }

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('❌ Error fetching attachments:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]/attachments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/general-register/[id]/attachments - Upload attachment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/registratura/general-register/${id}/attachments - Uploading attachment`);

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workflowStepId = formData.get('workflowStepId') as string | null;

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
    console.log(`[API POST /api/registratura/general-register/${id}/attachments] Inserting attachment into table: general_register_attachments`);
    const [newAttachment] = await db
      .insert(generalRegisterAttachments)
      .values({
        documentId: id,
        workflowStepId: workflowStepId || null,
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
    logError(error, { endpoint: '/api/registratura/general-register/[id]/attachments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

