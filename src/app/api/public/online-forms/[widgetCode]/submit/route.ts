import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, onlineFormSubmissions, onlineFormFields } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';
import { submitFormSchema } from '@/lib/validations/online-forms';
import { randomBytes } from 'crypto';
import { createEmailValidation, sendValidationCodeEmail } from '@/lib/online-forms/email-validation';

/**
 * Generate a unique submission token
 */
function generateSubmissionToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * POST /api/public/online-forms/[widgetCode]/submit - Submit form data
 * Public endpoint (no authentication required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ widgetCode: string }> }
) {
  const { widgetCode } = await params;
  console.log(`Step 1: POST /api/public/online-forms/${widgetCode}/submit - Submitting form`);

  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(5, 60000)(request); // 5 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validation = submitFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { formData, email } = validation.data;

    // Get form by widget code
    const [form] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.widgetCode, widgetCode))
      .limit(1);

    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      );
    }

    if (!form.isActive) {
      return NextResponse.json(
        { success: false, error: 'Form is not active' },
        { status: 403 }
      );
    }

    // Validate form fields
    const fields = await db
      .select()
      .from(onlineFormFields)
      .where(eq(onlineFormFields.formId, form.id));

    for (const field of fields) {
      if (field.isRequired && !formData[field.fieldKey]) {
        return NextResponse.json(
          { success: false, error: `Field ${field.label} is required` },
          { status: 400 }
        );
      }
    }

    // Generate submission token
    let submissionToken = generateSubmissionToken();
    let attempts = 0;
    while (attempts < 10) {
      const [existing] = await db
        .select()
        .from(onlineFormSubmissions)
        .where(eq(onlineFormSubmissions.submissionToken, submissionToken))
        .limit(1);
      if (!existing) break;
      submissionToken = generateSubmissionToken();
      attempts++;
    }

    // Determine initial status based on email validation mode
    let status: 'pending_validation' | 'validated' = 'pending_validation';
    if (form.emailValidationMode === 'end' && !email) {
      // If validation is at end but no email provided, skip validation
      status = 'validated';
    } else if (form.emailValidationMode === 'start' && email) {
      // If validation is at start and email provided, create validation code
      status = 'pending_validation';
    } else if (form.emailValidationMode === 'end') {
      status = 'validated';
    }

    // Create submission
    const [submission] = await db
      .insert(onlineFormSubmissions)
      .values({
        formId: form.id,
        submissionToken,
        status,
        email: email || null,
        formData,
        submittedAt: new Date(),
      })
      .returning();

    // If email validation is at start and email is provided, send validation code
    if (form.emailValidationMode === 'start' && email) {
      const { code } = await createEmailValidation(submission.id, email);
      await sendValidationCodeEmail(email, code, form.name);
    }

    // If submission flow is direct and validation is not needed, process immediately
    if (form.submissionFlow === 'direct' && status === 'validated') {
      // Processing will be handled by a separate endpoint or background job
      // For now, we just mark it as validated
    }

    console.log(`✓ Submission created: ${submission.id}, status: ${status}`);

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        submissionToken: submission.submissionToken,
        status: submission.status,
        requiresEmailValidation: form.emailValidationMode === 'start' && !!email,
      },
    });
  } catch (error) {
    logError(error, { endpoint: `/api/public/online-forms/${widgetCode}/submit`, method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




