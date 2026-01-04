import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { sendEmailWithTemplate } from '@/lib/email';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const sendBulkEmailSchema = z.object({
  recipients: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      name: z.string().min(1, 'Recipient name is required'),
    })
  ).min(1, 'At least one recipient is required').max(100, 'Maximum 100 recipients allowed per request'),
  variables: z.record(z.any()).optional().default({}),
});

/**
 * POST /api/email-templates/[id]/send-bulk - Send emails to multiple recipients using a template
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require authentication
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = sendBulkEmailSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Send bulk email validation failed', { errors: validation.error.errors, templateId: id, userId });
      const firstError = validation.error.errors[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { recipients, variables } = validation.data;

    logger.info('Starting bulk email send', { templateId: id, recipientCount: recipients.length, userId });

    const results = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    // Send emails sequentially to avoid rate limiting
    for (const recipient of recipients) {
      try {
        await sendEmailWithTemplate(
          id,
          recipient.email,
          recipient.name,
          variables
        );
        results.successful++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          email: recipient.email,
          error: errorMessage,
        });
        logger.warn('Failed to send email to recipient', { 
          templateId: id, 
          email: recipient.email, 
          error: errorMessage,
          userId 
        });
      }
    }

    logger.info('Bulk email send completed', { 
      templateId: id, 
      successful: results.successful, 
      failed: results.failed, 
      userId 
    });

    return createSuccessResponse(results, `Emails sent: ${results.successful} successful, ${results.failed} failed`);
  } catch (error) {
    logger.error('Error sending bulk emails', error, { endpoint: `/api/email-templates/${id}/send-bulk`, method: 'POST' });
    logError(error, { endpoint: `/api/email-templates/${id}/send-bulk`, method: 'POST' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}
