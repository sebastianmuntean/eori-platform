import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { sendEmailWithTemplate } from '@/lib/email';
import { z } from 'zod';

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
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: POST /api/email-templates/${params.id}/send - Sending test email`);

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = sendTestEmailSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { recipientEmail, recipientName, variables } = validation.data;

    console.log(`Step 3: Sending test email`);
    console.log(`  Template ID: ${params.id}`);
    console.log(`  Recipient: ${recipientEmail} (${recipientName})`);
    console.log(`  Variables: ${JSON.stringify(variables)}`);

    await sendEmailWithTemplate(
      params.id,
      recipientEmail,
      recipientName,
      variables
    );

    console.log(`✓ Test email sent successfully`);
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    logError(error, { endpoint: `/api/email-templates/${params.id}/send`, method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


