import { db } from '@/database/client';
import { generalRegister, generalRegisterAttachments, generalRegisterWorkflow } from '@/database/schema';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registry';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const UPLOAD_DIR = process.env.UPLOAD_DIR || resolve(process.cwd(), 'uploads', 'general-register');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/registry/general-register/[id]/attachments - Get all attachments for a document (optionally filtered by workflow step)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const workflowStepId = searchParams.get('workflowStepId');

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

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
      attachments = await db
        .select()
        .from(generalRegisterAttachments)
        .where(eq(generalRegisterAttachments.documentId, id))
        .orderBy(desc(generalRegisterAttachments.createdAt));
    }

    return createSuccessResponse(attachments);
  }, { endpoint: '/api/registry/general-register/[id]/attachments', method: 'GET' });
}

/**
 * POST /api/registry/general-register/[id]/attachments - Upload attachment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return handleApiRoute(async () => {
    await requirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_UPDATE);
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      return createErrorResponse('Document not found', 404);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workflowStepIdRaw = formData.get('workflowStepId');
    const workflowStepId =
      typeof workflowStepIdRaw === 'string' && workflowStepIdRaw.trim()
        ? workflowStepIdRaw.trim()
        : null;

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    if (!workflowStepId) {
      return createErrorResponse(
        'Selectați un pas din workflow pentru a lega atașamentul.',
        400
      );
    }

    const [step] = await db
      .select({ id: generalRegisterWorkflow.id })
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.id, workflowStepId),
          eq(generalRegisterWorkflow.documentId, id)
        )
      )
      .limit(1);

    if (!step) {
      return createErrorResponse(
        'Pasul din workflow nu există sau nu aparține acestui document.',
        400
      );
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
      .insert(generalRegisterAttachments)
      .values({
        documentId: id,
        workflowStepId,
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
  }, { endpoint: '/api/registry/general-register/[id]/attachments', method: 'POST' });
}
