import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';
import { db } from '@/database/client';
import { onlineFormSubmissions, onlineForms, onlineFormEmailValidations } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import { createEmailValidation, sendValidationCodeEmail } from '@/lib/online-forms/email-validation';

const resendCodeSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/public/online-forms/resend-code - Resend validation code
 * Public endpoint (no authentication required)
 */
export async function POST(request: NextRequest) {
  console.log('Step 1: POST /api/public/online-forms/resend-code - Resending validation code');

  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(3, 60000)(request); // 3 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validation = resendCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { submissionId, email } = validation.data;

    // Get submission
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

    if (submission.email !== email) {
      return NextResponse.json(
        { success: false, error: 'Email does not match submission' },
        { status: 400 }
      );
    }

    // Get form
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

    // Check if already verified
    if (submission.emailValidatedAt) {
      return NextResponse.json(
        { success: false, error: 'Email already validated' },
        { status: 400 }
      );
    }

    // Create new validation code
    const { code } = await createEmailValidation(submissionId, email);
    await sendValidationCodeEmail(email, code, form.name);

    console.log(`✓ Validation code resent to ${email} for submission: ${submissionId}`);

    return NextResponse.json({
      success: true,
      message: 'Validation code resent successfully',
    });
  } catch (error) {
    logError(error, { endpoint: '/api/public/online-forms/resend-code', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




