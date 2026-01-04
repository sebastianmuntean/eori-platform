import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { burials, cemeteryGraves, cemeteryConcessions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid } from '@/lib/utils/cemetery';

const updateBurialSchema = z.object({
  deceasedClientId: z.string().uuid().optional().nullable(),
  deceasedName: z.string().min(1).max(255).optional(),
  deceasedBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  deceasedDeathDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  burialDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  burialCertificateNumber: z.string().max(50).optional().nullable(),
  burialCertificateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
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

    const [burial] = await db
      .select()
      .from(burials)
      .where(eq(burials.id, id))
      .limit(1);

    if (!burial) {
      return NextResponse.json(
        { success: false, error: 'Burial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: burial,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/burials/[id]', method: 'GET' });
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
    await requirePermission('cemeteries.burials.update');

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
    const validation = updateBurialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Business rule validation: burialDate must be >= deceasedDeathDate
    if (data.deceasedDeathDate && data.burialDate && data.burialDate < data.deceasedDeathDate) {
      return NextResponse.json(
        { success: false, error: 'Burial date must be on or after death date' },
        { status: 400 }
      );
    }

    // Verify client exists if provided
    if (data.deceasedClientId) {
      const { clients } = await import('@/database/schema');
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.deceasedClientId))
        .limit(1);

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt: Date;
      updatedBy: string;
      deceasedClientId?: string | null;
      deceasedName?: string;
      deceasedBirthDate?: string | null;
      deceasedDeathDate?: string;
      burialDate?: string;
      burialCertificateNumber?: string | null;
      burialCertificateDate?: string | null;
      notes?: string | null;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.deceasedClientId !== undefined) updateData.deceasedClientId = data.deceasedClientId;
    if (data.deceasedName !== undefined) updateData.deceasedName = data.deceasedName;
    if (data.deceasedBirthDate !== undefined) updateData.deceasedBirthDate = data.deceasedBirthDate;
    if (data.deceasedDeathDate !== undefined) updateData.deceasedDeathDate = data.deceasedDeathDate;
    if (data.burialDate !== undefined) updateData.burialDate = data.burialDate;
    if (data.burialCertificateNumber !== undefined) updateData.burialCertificateNumber = data.burialCertificateNumber;
    if (data.burialCertificateDate !== undefined) updateData.burialCertificateDate = data.burialCertificateDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedBurial] = await db
      .update(burials)
      .set(updateData)
      .where(eq(burials.id, id))
      .returning();

    if (!updatedBurial) {
      return NextResponse.json(
        { success: false, error: 'Burial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBurial,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/burials/[id]', method: 'PUT' });
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
    await requirePermission('cemeteries.burials.delete');

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
    const deletedBurial = await db.transaction(async (tx) => {
      const [burial] = await tx
        .delete(burials)
        .where(eq(burials.id, id))
        .returning();

      if (!burial) {
        throw new Error('Burial not found');
      }

      // Check if there are other burials for this grave
      const otherBurials = await tx
        .select({ count: sql<number>`count(*)` })
        .from(burials)
        .where(eq(burials.graveId, burial.graveId));

      const otherBurialsCount = Number(otherBurials[0]?.count || 0);

      // If no other burials, check if there's a concession to determine status
      if (otherBurialsCount === 0) {
        const [concession] = await tx
          .select()
          .from(cemeteryConcessions)
          .where(
            and(
              eq(cemeteryConcessions.graveId, burial.graveId),
              eq(cemeteryConcessions.status, 'active')
            )
          )
          .limit(1);

        const newStatus = concession ? 'reserved' : 'free';

        await tx
          .update(cemeteryGraves)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(cemeteryGraves.id, burial.graveId));
      }

      return burial;
    });

    return NextResponse.json({
      success: true,
      data: deletedBurial,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Burial not found') {
      return NextResponse.json(
        { success: false, error: 'Burial not found' },
        { status: 404 }
      );
    }
    logError(error, { endpoint: '/api/cemeteries/burials/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

