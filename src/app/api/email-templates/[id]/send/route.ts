import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { sendEmailWithTemplate } from '@/lib/email';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const sendTestEmailSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  variables: z.record(z.any()).optional().default({}),
});

/**
 * POST /api/email-templates/[id]/send - Send a test email using a template
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
    const validation = sendTestEmailSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Send test email validation failed', { errors: validation.error.errors, templateId: id, userId });
      const firstError = validation.error.errors[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { recipientEmail, recipientName, variables } = validation.data;

    logger.info('Sending test email', { templateId: id, recipientEmail, userId });

    await sendEmailWithTemplate(
      id,
      recipientEmail,
      recipientName,
      variables
    );

    logger.info('Test email sent successfully', { templateId: id, recipientEmail, userId });
    return createSuccessResponse({ message: 'Test email sent successfully' });
  } catch (error) {
    logger.error('Error sending test email', error, { endpoint: `/api/email-templates/${id}/send`, method: 'POST' });
    logError(error, { endpoint: `/api/email-templates/${id}/send`, method: 'POST' });
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
