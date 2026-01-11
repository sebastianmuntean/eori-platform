import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimagePayments, pilgrimageParticipants } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updatePaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'other']).optional(),
  paymentReference: z.string().max(255).optional().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/payments/[paymentId] - Get payment by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(paymentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const [payment] = await db
      .select()
      .from(pilgrimagePayments)
      .where(
        and(
          eq(pilgrimagePayments.id, paymentId),
          eq(pilgrimagePayments.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('❌ Error fetching payment:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/payments/[paymentId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id]/payments/[paymentId] - Update payment
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(paymentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const body = await request.json();
    const validation = updatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [existingPayment] = await db
      .select()
      .from(pilgrimagePayments)
      .where(
        and(
          eq(pilgrimagePayments.id, paymentId),
          eq(pilgrimagePayments.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedPayment] = await db
      .update(pilgrimagePayments)
      .set(updateData)
      .where(eq(pilgrimagePayments.id, paymentId))
      .returning();

    // Update participant's paid amount if status changed to/from completed
    if (data.status && data.status !== existingPayment.status) {
      const [participant] = await db
        .select()
        .from(pilgrimageParticipants)
        .where(eq(pilgrimageParticipants.id, existingPayment.participantId))
        .limit(1);

      if (participant) {
        // Recalculate paid amount
        const payments = await db
          .select()
          .from(pilgrimagePayments)
          .where(
            and(
              eq(pilgrimagePayments.participantId, existingPayment.participantId),
              eq(pilgrimagePayments.status, 'completed')
            )
          );

        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
        let newPaymentStatus = participant.paymentStatus;
        if (totalPaid >= parseFloat(participant.totalAmount || '0')) {
          newPaymentStatus = 'paid';
        } else if (totalPaid > 0) {
          newPaymentStatus = 'partial';
        } else {
          newPaymentStatus = 'pending';
        }

        await db
          .update(pilgrimageParticipants)
          .set({
            paidAmount: totalPaid.toString(),
            paymentStatus: newPaymentStatus as any,
            updatedAt: new Date(),
          })
          .where(eq(pilgrimageParticipants.id, existingPayment.participantId));
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPayment,
    });
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/payments/[paymentId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id]/payments/[paymentId] - Delete payment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(paymentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const [deletedPayment] = await db
      .delete(pilgrimagePayments)
      .where(
        and(
          eq(pilgrimagePayments.id, paymentId),
          eq(pilgrimagePayments.pilgrimageId, id)
        )
      )
      .returning();

    if (!deletedPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update participant's paid amount
    const [participant] = await db
      .select()
      .from(pilgrimageParticipants)
      .where(eq(pilgrimageParticipants.id, deletedPayment.participantId))
      .limit(1);

    if (participant) {
      const payments = await db
        .select()
        .from(pilgrimagePayments)
        .where(
          and(
            eq(pilgrimagePayments.participantId, deletedPayment.participantId),
            eq(pilgrimagePayments.status, 'completed')
          )
        );

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      let newPaymentStatus = participant.paymentStatus;
      if (totalPaid >= parseFloat(participant.totalAmount || '0')) {
        newPaymentStatus = 'paid';
      } else if (totalPaid > 0) {
        newPaymentStatus = 'partial';
      } else {
        newPaymentStatus = 'pending';
      }

      await db
        .update(pilgrimageParticipants)
        .set({
          paidAmount: totalPaid.toString(),
          paymentStatus: newPaymentStatus as any,
          updatedAt: new Date(),
        })
        .where(eq(pilgrimageParticipants.id, deletedPayment.participantId));
    }

    return NextResponse.json({
      success: true,
      data: deletedPayment,
    });
  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/payments/[paymentId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

