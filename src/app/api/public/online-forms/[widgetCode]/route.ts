import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { onlineForms, onlineFormFields } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, asc } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

/**
 * GET /api/public/online-forms/[widgetCode] - Get form definition for widget
 * Public endpoint (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetCode: string }> }
) {
  const { widgetCode } = await params;
  console.log(`Step 1: GET /api/public/online-forms/${widgetCode} - Fetching form for widget`);

  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(20, 60000)(request); // 20 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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

    // Get form fields ordered by orderIndex
    const fields = await db
      .select()
      .from(onlineFormFields)
      .where(eq(onlineFormFields.formId, form.id))
      .orderBy(asc(onlineFormFields.orderIndex));

    console.log(`✓ Form fetched: ${form.id}, ${fields.length} fields`);

    return NextResponse.json({
      success: true,
      data: {
        id: form.id,
        name: form.name,
        description: form.description,
        emailValidationMode: form.emailValidationMode,
        submissionFlow: form.submissionFlow,
        successMessage: form.successMessage,
        errorMessage: form.errorMessage,
        fields: fields.map(field => ({
          id: field.id,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          label: field.label,
          placeholder: field.placeholder,
          helpText: field.helpText,
          isRequired: field.isRequired,
          validationRules: field.validationRules,
          options: field.options,
          orderIndex: field.orderIndex,
        })),
      },
    });
  } catch (error) {
    logError(error, { endpoint: `/api/public/online-forms/${widgetCode}`, method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


