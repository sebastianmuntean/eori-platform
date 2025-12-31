import { NextResponse } from 'next/server';
import { formatErrorResponse, logError } from '@/lib/errors';
import { sendEmailWithTemplate } from '@/lib/email';
import { z } from 'zod';

const sendBulkEmailSchema = z.object({
  recipients: z.array(
    z.object({
      email: z.string().email('Invalid email address'),
      name: z.string().min(1, 'Recipient name is required'),
    })
  ).min(1, 'At least one recipient is required'),
  variables: z.record(z.any()).optional().default({}),
});

/**
 * POST /api/email-templates/[id]/send-bulk - Send emails to multiple recipients using a template
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: POST /api/email-templates/${params.id}/send-bulk - Sending bulk emails`);

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = sendBulkEmailSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { recipients, variables } = validation.data;

    console.log(`Step 3: Sending emails to ${recipients.length} recipients`);
    console.log(`  Template ID: ${params.id}`);
    console.log(`  Variables: ${JSON.stringify(variables)}`);

    const results = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    // Send emails sequentially to avoid rate limiting
    for (const recipient of recipients) {
      try {
        console.log(`Step 3.${results.successful + results.failed + 1}: Sending to ${recipient.email}`);
        await sendEmailWithTemplate(
          params.id,
          recipient.email,
          recipient.name,
          variables
        );
        results.successful++;
        console.log(`✓ Email sent successfully to ${recipient.email}`);
      } catch (error: any) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          email: recipient.email,
          error: errorMessage,
        });
        console.error(`❌ Failed to send email to ${recipient.email}: ${errorMessage}`);
      }
    }

    console.log(`✓ Bulk email send completed: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Email-uri trimise: ${results.successful} cu succes, ${results.failed} eșuate`,
      data: results,
    });
  } catch (error) {
    console.error('❌ Error sending bulk emails:', error);
    logError(error, { endpoint: `/api/email-templates/${params.id}/send-bulk`, method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


