import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { payments, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError, NotFoundError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { eq, and, like, sql } from 'drizzle-orm';
import { z } from 'zod';
import { sendEmailWithTemplateName, getTemplateByName } from '@/lib/email';
import { getClientName, isValidEmail } from '@/lib/utils/client-helpers';

const MAX_PAYMENT_AMOUNT = 999999999.99;

const quickPaymentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  clientId: z.string().uuid('Invalid client ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(MAX_PAYMENT_AMOUNT, 'Amount exceeds maximum allowed'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason is too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
  sendEmail: z.boolean().optional().default(false),
  emailAddress: z.string().email('Invalid email address').optional(),
}).refine((data) => {
  // If sendEmail is true, emailAddress must be provided
  if (data.sendEmail && !data.emailAddress) {
    return false;
  }
  return true;
}, {
  message: 'Email address is required when sendEmail is true',
  path: ['emailAddress'],
});

/**
 * POST /api/accounting/payments/quick - Create a quick payment (incasare rapida)
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/accounting/payments/quick - Creating quick payment');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = quickPaymentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Authorization check - verify user has access to the parish
    console.log(`Step 2: Checking user access to parish ${data.parishId}`);
    try {
      await requireParishAccess(data.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        console.log(`❌ User does not have access to parish ${data.parishId}`);
        return NextResponse.json(
          { success: false, error: 'You do not have access to this parish' },
          { status: 403 }
        );
      }
      if (error instanceof NotFoundError) {
        console.log(`❌ Parish ${data.parishId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check if parish exists and is active
    console.log(`Step 3: Verifying parish ${data.parishId} is active`);
    const [existingParish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, data.parishId))
      .limit(1);

    if (!existingParish) {
      console.log(`❌ Parish ${data.parishId} not found`);
      return NextResponse.json(
        { success: false, error: 'Parish not found' },
        { status: 404 }
      );
    }

    if (!existingParish.isActive) {
      console.log(`❌ Parish ${data.parishId} is inactive`);
      return NextResponse.json(
        { success: false, error: 'Parish is inactive' },
        { status: 400 }
      );
    }

    // Check if client exists and is active
    console.log(`Step 4: Checking if client ${data.clientId} exists`);
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, data.clientId))
      .limit(1);

    if (!existingClient) {
      console.log(`❌ Client ${data.clientId} not found`);
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!existingClient.isActive) {
      console.log(`❌ Client ${data.clientId} is inactive`);
      return NextResponse.json(
        { success: false, error: 'Client is inactive' },
        { status: 400 }
      );
    }

    // Generate payment number and create payment in a transaction to prevent race conditions
    console.log('Step 5: Generating payment number and creating payment');
    const currentYear = new Date().getFullYear();
    const paymentPrefix = `INC-${currentYear}-`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Use transaction to ensure atomic payment number generation
    const newPayment = await db.transaction(async (tx) => {
      // Calculate start position for SUBSTRING (1-based, so prefix length + 1)
      const substringStart = paymentPrefix.length + 1;
      
      // Optimized query: Use SQL aggregation to find max number directly
      const [maxResult] = await tx
        .select({
          maxNum: sql<number | null>`
            COALESCE(
              MAX(
                CAST(
                  SUBSTRING(${payments.paymentNumber} FROM ${substringStart}) 
                  AS INTEGER
                )
              ),
              0
            )
          `
        })
        .from(payments)
        .where(
          and(
            eq(payments.parishId, data.parishId),
            like(payments.paymentNumber, `${paymentPrefix}%`)
          )
        );

      const maxNumber = maxResult?.maxNum ?? 0;
      const nextNumber = maxNumber + 1;
      const paymentNumber = `${paymentPrefix}${String(nextNumber).padStart(3, '0')}`;
      
      console.log(`✓ Generated payment number: ${paymentNumber}`);

      // Create payment within transaction
      try {
        const [payment] = await tx
          .insert(payments)
          .values({
            parishId: data.parishId,
            paymentNumber: paymentNumber,
            date: currentDate,
            type: 'income',
            category: data.category,
            clientId: data.clientId,
            amount: data.amount.toString(),
            currency: 'RON', // TODO: Make configurable per parish
            description: data.reason,
            paymentMethod: null,
            referenceNumber: null,
            status: 'completed',
            createdBy: userId,
          })
          .returning();

        return payment;
      } catch (insertError: any) {
        // Handle unique constraint violation (payment number duplicate)
        if (insertError?.code === '23505' || insertError?.constraint?.includes('payment_number')) {
          console.warn('⚠️ Payment number conflict detected, retrying...');
          // Retry with incremented number (should be rare)
          const retryNumber = nextNumber + 1;
          const retryPaymentNumber = `${paymentPrefix}${String(retryNumber).padStart(3, '0')}`;
          
          const [payment] = await tx
            .insert(payments)
            .values({
              parishId: data.parishId,
              paymentNumber: retryPaymentNumber,
              date: currentDate,
              type: 'income',
              category: data.category,
              clientId: data.clientId,
              amount: data.amount.toString(),
              currency: 'RON', // TODO: Make configurable per parish
              description: data.reason,
              paymentMethod: null,
              referenceNumber: null,
              status: 'completed',
              createdBy: userId,
            })
            .returning();
          
          return payment;
        }
        throw insertError;
      }
    });

    console.log(`✓ Payment created successfully: ${newPayment.id}`);

    // Send email receipt if requested
    if (data.sendEmail && data.emailAddress) {
      const emailToSend = data.emailAddress.trim();
      if (isValidEmail(emailToSend)) {
        console.log(`Step 6: Sending email receipt to ${emailToSend}`);
        try {
          // Get client display name using helper
          const clientName = getClientName(existingClient);

          // Format payment date (parse string date properly)
          const paymentDateObj = new Date(currentDate + 'T00:00:00');
          const paymentDate = paymentDateObj.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Format amount
          const currency = 'RON'; // TODO: Make configurable per parish
          const formattedAmount = new Intl.NumberFormat('ro-RO', {
            style: 'currency',
            currency: currency
          }).format(data.amount);

          // Try to get email template
          const template = await getTemplateByName('Chitanta Plata');
          
          if (template) {
            await sendEmailWithTemplateName(
              'Chitanta Plata',
              emailToSend,
              clientName,
              {
                client: {
                  name: clientName,
                  email: emailToSend,
                },
                payment: {
                  number: newPayment.paymentNumber,
                  date: paymentDate,
                  amount: formattedAmount,
                  currency: currency,
                  reason: data.reason,
                },
                parish: {
                  name: existingParish.name,
                },
              }
            );
            console.log(`✓ Email receipt sent successfully to ${emailToSend}`);
          } else {
            console.warn('⚠️ Email template "Chitanta Plata" not found - skipping email send');
          }
        } catch (emailError) {
          // Log error but don't fail payment creation
          console.error('❌ Error sending email receipt:', emailError);
          logError(emailError, { 
            endpoint: '/api/accounting/payments/quick', 
            method: 'POST', 
            context: 'email_sending',
            paymentId: newPayment.id 
          });
        }
      } else {
        console.warn(`⚠️ Invalid email address provided: ${emailToSend} - skipping email send`);
      }
    } else {
      console.log('⚠️ Email receipt not requested - skipping email send');
    }

    return NextResponse.json(
      {
        success: true,
        data: newPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating quick payment:', error);
    logError(error, { endpoint: '/api/accounting/payments/quick', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

