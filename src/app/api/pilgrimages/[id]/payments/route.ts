import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimagePayments, pilgrimageParticipants } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const createPaymentSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  paymentReference: z.string().max(255).optional().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional().default('pending'),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/payments - Get all payments for a pilgrimage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const payments = await db
      .select()
      .from(pilgrimagePayments)
      .where(eq(pilgrimagePayments.pilgrimageId, id));

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/payments', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages/[id]/payments - Create a new payment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify participant belongs to this pilgrimage
    const [participant] = await db
      .select()
      .from(pilgrimageParticipants)
      .where(
        and(
          eq(pilgrimageParticipants.id, data.participantId),
          eq(pilgrimageParticipants.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 400 }
      );
    }

    const [newPayment] = await db
      .insert(pilgrimagePayments)
      .values({
        pilgrimageId: id,
        participantId: data.participantId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod as any,
        paymentReference: data.paymentReference || null,
        status: data.status || 'pending',
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    // Update participant's paid amount if payment is completed
    if (data.status === 'completed') {
      const currentPaid = parseFloat(participant.paidAmount || '0');
      const newPaid = currentPaid + parseFloat(data.amount);
      
      // Update payment status on participant
      let newPaymentStatus = participant.paymentStatus;
      if (newPaid >= parseFloat(participant.totalAmount || '0')) {
        newPaymentStatus = 'paid';
      } else if (newPaid > 0) {
        newPaymentStatus = 'partial';
      }

      await db
        .update(pilgrimageParticipants)
        .set({
          paidAmount: newPaid.toString(),
          paymentStatus: newPaymentStatus as any,
          updatedAt: new Date(),
        })
        .where(eq(pilgrimageParticipants.id, data.participantId));
    }

    return NextResponse.json(
      {
        success: true,
        data: newPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating payment:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/payments', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

