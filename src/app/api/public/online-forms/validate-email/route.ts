import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';
import { validateEmailSchema } from '@/lib/validations/online-forms';
import { verifyEmailCode } from '@/lib/online-forms/email-validation';
import { db } from '@/database/client';
import { onlineFormSubmissions, onlineForms } from '@/database/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/public/online-forms/validate-email - Validate email code
 * Public endpoint (no authentication required)
 */
export async function POST(request: NextRequest) {
  console.log('Step 1: POST /api/public/online-forms/validate-email - Validating email code');

  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(10, 60000)(request); // 10 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validation = validateEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { submissionId, email, code } = validation.data;

    // Verify code
    const isValid = await verifyEmailCode(submissionId, email, code);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired validation code' },
        { status: 400 }
      );
    }

    // Get submission and form
    const [submission] = await db
      .select()
      .from(onlineFormSubmissions)
      .where(eq(onlineFormSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.id, submission.formId))
      .limit(1);

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    // Update submission status
    let newStatus = 'validated' as const;
    if (form.emailValidationMode === 'end') {
      // If validation was at end, submission is now validated and can be processed
      newStatus = 'validated';
    }

    await db
      .update(onlineFormSubmissions)
      .set({ status: newStatus })
      .where(eq(onlineFormSubmissions.id, submissionId));

    console.log(`✓ Email validated for submission: ${submissionId}`);

    return NextResponse.json({
      success: true,
      message: 'Email validated successfully',
    });
  } catch (error) {
    logError(error, { endpoint: '/api/public/online-forms/validate-email', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




