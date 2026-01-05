import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryConcessions, cemeteryGraves } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid, validateDateRange } from '@/lib/utils/cemetery';

const updateConcessionSchema = z.object({
  contractNumber: z.string().min(1).max(50).optional(),
  contractDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  durationYears: z.number().int().positive().optional(),
  annualFee: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const [concession] = await db
      .select()
      .from(cemeteryConcessions)
      .where(eq(cemeteryConcessions.id, id))
      .limit(1);

    if (!concession) {
      return NextResponse.json(
        { success: false, error: 'Concession not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: concession,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and permission
    const { userId } = await requireAuth();
    await requirePermission(CEMETERY_PERMISSIONS.CONCESSIONS_UPDATE);

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateConcessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Business rule validation: if dates are being updated, validate range
    if (data.startDate && data.expiryDate) {
      const dateRangeValidation = validateDateRange(data.startDate, data.expiryDate);
      if (!dateRangeValidation.valid) {
        return NextResponse.json(
          { success: false, error: dateRangeValidation.error },
          { status: 400 }
        );
      }
    }

    // Check for unique contract number if code is being updated
    if (data.contractNumber) {
      const currentConcession = await db
        .select()
        .from(cemeteryConcessions)
        .where(eq(cemeteryConcessions.id, id))
        .limit(1);

      if (currentConcession.length > 0) {
        const existingConcession = await db
          .select()
          .from(cemeteryConcessions)
          .where(
            and(
              eq(cemeteryConcessions.parishId, currentConcession[0].parishId),
              eq(cemeteryConcessions.contractNumber, data.contractNumber)
            )
          )
          .limit(1);

        if (existingConcession.length > 0 && existingConcession[0].id !== id) {
          return NextResponse.json(
            { success: false, error: 'Concession with this contract number already exists in this parish' },
            { status: 400 }
          );
        }
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt: Date;
      updatedBy: string;
      contractNumber?: string;
      contractDate?: string;
      startDate?: string;
      expiryDate?: string;
      durationYears?: number;
      annualFee?: string;
      currency?: string;
      status?: 'active' | 'expired' | 'cancelled' | 'pending';
      notes?: string | null;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.contractNumber !== undefined) updateData.contractNumber = data.contractNumber;
    if (data.contractDate !== undefined) updateData.contractDate = data.contractDate;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.durationYears !== undefined) updateData.durationYears = data.durationYears;
    if (data.annualFee !== undefined) updateData.annualFee = data.annualFee.toString();
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedConcession] = await db
      .update(cemeteryConcessions)
      .set(updateData)
      .where(eq(cemeteryConcessions.id, id))
      .returning();

    if (!updatedConcession) {
      return NextResponse.json(
        { success: false, error: 'Concession not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedConcession,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and permission
    await requireAuth();
    await requirePermission(CEMETERY_PERMISSIONS.CONCESSIONS_DELETE);

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const deletedConcession = await db.transaction(async (tx) => {
      const [concession] = await tx
        .delete(cemeteryConcessions)
        .where(eq(cemeteryConcessions.id, id))
        .returning();

      if (!concession) {
        throw new Error('Concession not found');
      }

      // Check if there are other active concessions for this grave
      const otherConcessions = await tx
        .select()
        .from(cemeteryConcessions)
        .where(
          and(
            eq(cemeteryConcessions.graveId, concession.graveId),
            eq(cemeteryConcessions.status, 'active')
          )
        )
        .limit(1);

      // Check if there are burials for this grave
      const { burials } = await import('@/database/schema');
      const graveBurials = await tx
        .select()
        .from(burials)
        .where(eq(burials.graveId, concession.graveId))
        .limit(1);

      // Determine new grave status
      let newStatus: 'free' | 'occupied' | 'reserved' = 'free';
      if (graveBurials.length > 0) {
        newStatus = 'occupied';
      } else if (otherConcessions.length > 0) {
        newStatus = 'reserved';
      }

      // Update grave status
      await tx
        .update(cemeteryGraves)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(cemeteryGraves.id, concession.graveId));

      return concession;
    });

    return NextResponse.json({
      success: true,
      data: deletedConcession,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Concession not found') {
      return NextResponse.json(
        { success: false, error: 'Concession not found' },
        { status: 404 }
      );
    }
    logError(error, { endpoint: '/api/cemeteries/concessions/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

