import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineFormSubmissions, onlineForms } from '@/database/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { processSubmission } from '@/lib/online-forms/submission-processor';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/api-utils/validation';

/**
 * GET /api/online-forms/submissions/[id] - Get a single submission
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid submission ID', 400);
    }

    const [submission] = await db
      .select({
        id: onlineFormSubmissions.id,
        formId: onlineFormSubmissions.formId,
        formName: onlineForms.name,
        submissionToken: onlineFormSubmissions.submissionToken,
        status: onlineFormSubmissions.status,
        email: onlineFormSubmissions.email,
        emailValidatedAt: onlineFormSubmissions.emailValidatedAt,
        formData: onlineFormSubmissions.formData,
        targetRecordId: onlineFormSubmissions.targetRecordId,
        submittedAt: onlineFormSubmissions.submittedAt,
        processedAt: onlineFormSubmissions.processedAt,
        processedBy: onlineFormSubmissions.processedBy,
        parishId: onlineForms.parishId,
      })
      .from(onlineFormSubmissions)
      .leftJoin(onlineForms, eq(onlineFormSubmissions.formId, onlineForms.id))
      .where(eq(onlineFormSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return createErrorResponse('Submission not found', 404);
    }

    // Check parish access
    if (submission.parishId) {
      await requireParishAccess(submission.parishId, false);
    }

    logger.info(`Submission fetched`, { submissionId: id, userId });
    return createSuccessResponse(submission);
  }, { endpoint: `/api/online-forms/submissions/${id}`, method: 'GET' });
}

/**
 * POST /api/online-forms/submissions/[id]/process - Process a submission
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return handleApiRoute(async () => {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid submission ID', 400);
    }

    // Verify submission exists and check parish access
    const [submission] = await db
      .select({
        id: onlineFormSubmissions.id,
        formId: onlineFormSubmissions.formId,
        status: onlineFormSubmissions.status,
        parishId: onlineForms.parishId,
      })
      .from(onlineFormSubmissions)
      .leftJoin(onlineForms, eq(onlineFormSubmissions.formId, onlineForms.id))
      .where(eq(onlineFormSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return createErrorResponse('Submission not found', 404);
    }

    // Check parish access
    if (submission.parishId) {
      await requireParishAccess(submission.parishId, false);
    }

    // Validate submission status
    if (submission.status === 'completed') {
      return createErrorResponse('Submission has already been processed', 400);
    }

    if (submission.status === 'rejected') {
      return createErrorResponse('Submission has been rejected and cannot be processed', 400);
    }

    const result = await processSubmission(id, userId);

    if (!result.success) {
      logger.warn('Submission processing failed', { submissionId: id, error: result.error, userId });
      return createErrorResponse(result.error || 'Processing failed', 400);
    }

    logger.info(`Submission processed`, { submissionId: id, targetRecordId: result.targetRecordId, userId });
    return createSuccessResponse({
      submissionId: id,
      targetRecordId: result.targetRecordId,
    });
  }, { endpoint: `/api/online-forms/submissions/${id}/process`, method: 'POST' });
}


