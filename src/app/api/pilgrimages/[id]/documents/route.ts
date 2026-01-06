import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageDocuments } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const UPLOAD_DIR = process.env.PILGRIMAGE_DOCUMENTS_UPLOAD_DIR || resolve(process.cwd(), 'uploads', 'pilgrimages');
const MAX_FILE_SIZE = parseInt(process.env.MAX_PILGRIMAGE_DOCUMENT_SIZE || '10485760'); // 10MB default

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
  documentType: z.enum(['program', 'information', 'contract', 'insurance', 'visa_info', 'other']),
  title: z.string().min(1).max(255),
  isPublic: z.boolean().optional().default(false),
});

/**
 * GET /api/pilgrimages/[id]/documents - Get all documents for a pilgrimage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

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

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const documents = await db
      .select()
      .from(pilgrimageDocuments)
      .where(eq(pilgrimageDocuments.pilgrimageId, id));

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/documents', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages/[id]/documents - Upload a document
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

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages:update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const title = formData.get('title') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    const validation = createDocumentSchema.safeParse({
      documentType,
      title: title || file.name,
      isPublic,
    });

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    await mkdir(resolve(UPLOAD_DIR, id), { recursive: true });

    // Generate unique filename with sanitized extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    if (!fileExtension) {
      return NextResponse.json(
        { success: false, error: 'Invalid file extension' },
        { status: 400 }
      );
    }
    const fileName = `${randomUUID()}.${fileExtension}`;
    // Use resolve to make it clear this is a runtime path, not a static import
    const filePath = resolve(UPLOAD_DIR, id, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document record
    const [newDocument] = await db
      .insert(pilgrimageDocuments)
      .values({
        pilgrimageId: id,
        documentType: validation.data.documentType as any,
        title: validation.data.title,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        isPublic: validation.data.isPublic,
        uploadedBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/documents', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

