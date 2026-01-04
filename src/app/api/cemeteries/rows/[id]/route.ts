import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryRows, cemeteryGraves } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid } from '@/lib/utils/cemetery';

const updateRowSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().max(255).optional().nullable(),
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

    const [row] = await db
      .select()
      .from(cemeteryRows)
      .where(eq(cemeteryRows.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: row,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/rows/[id]', method: 'GET' });
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
    await requirePermission('cemeteries.rows.update');

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
    const validation = updateRowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current row
    const [currentRow] = await db
      .select()
      .from(cemeteryRows)
      .where(eq(cemeteryRows.id, id))
      .limit(1);

    if (!currentRow) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    // Check for unique code if code is being updated
    if (data.code && data.code !== currentRow.code) {
      const existingRow = await db
        .select()
        .from(cemeteryRows)
        .where(
          and(
            eq(cemeteryRows.parcelId, currentRow.parcelId),
            eq(cemeteryRows.code, data.code)
          )
        )
        .limit(1);

      if (existingRow.length > 0 && existingRow[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Row with this code already exists in this parcel' },
          { status: 400 }
        );
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt: Date;
      updatedBy?: string;
      code?: string;
      name?: string | null;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;

    const [updatedRow] = await db
      .update(cemeteryRows)
      .set(updateData)
      .where(eq(cemeteryRows.id, id))
      .returning();

    if (!updatedRow) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRow,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/rows/[id]', method: 'PUT' });
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
    await requirePermission('cemeteries.rows.delete');

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    // Check for related records before deletion
    const [gravesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.rowId, id));

    if (Number(gravesCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete row with existing graves. Please delete all graves first.' },
        { status: 400 }
      );
    }

    const [deletedRow] = await db
      .delete(cemeteryRows)
      .where(eq(cemeteryRows.id, id))
      .returning();

    if (!deletedRow) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedRow,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/rows/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

