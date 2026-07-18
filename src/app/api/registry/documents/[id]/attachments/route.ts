import { db } from '@/database/client';
import { documentRegistry, documentAttachments } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const UPLOAD_DIR = process.env.UPLOAD_DIR || resolve(process.cwd(), 'uploads', 'documents');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/registry/documents/[id]/attachments - Get all attachments for a document
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    const attachments = await db
      .select()
      .from(documentAttachments)
      .where(eq(documentAttachments.documentId, id));

    return createSuccessResponse(attachments);
  }, { endpoint: '/api/registry/documents/[id]/attachments', method: 'GET' });
}

/**
 * POST /api/registry/documents/[id]/attachments - Upload attachment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.DOCUMENTS_UPDATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [document] = await db
      .select()
      .from(documentRegistry)
      .where(and(eq(documentRegistry.id, id), isNull(documentRegistry.deletedAt)))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse('File size exceeds 10MB limit', 400);
    }

    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const storagePath = resolve(UPLOAD_DIR, id, uniqueFileName);

    try {
      await mkdir(resolve(UPLOAD_DIR, id), { recursive: true });
    } catch {
      // Directory may already exist
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(storagePath, buffer);

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

    return createSuccessResponse(newAttachment);
  }, { endpoint: '/api/registry/documents/[id]/attachments', method: 'POST' });
}
