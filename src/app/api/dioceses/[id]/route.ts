import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dioceses } from '@/drizzle/schema/core/dioceses';
import { deaneries } from '@/drizzle/schema/core/deaneries';
import { eq } from 'drizzle-orm';
import { updateDioceseSchema } from '@/src/lib/validations/dioceses';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/dioceses/[id] - Get a single diocese by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  console.log(`GET /api/dioceses/${params.id}`);

  try {
    const [diocese] = await db
      .select()
      .from(dioceses)
      .where(eq(dioceses.id, params.id))
      .limit(1);

    if (!diocese) {
      return NextResponse.json(
        { success: false, error: 'Dieceza nu a fost găsită' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: diocese });
  } catch (error) {
    console.error('❌ Error fetching diocese:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch diocese' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dioceses/[id] - Update a diocese
 */
export async function PUT(request: Request, { params }: RouteParams) {
  console.log(`PUT /api/dioceses/${params.id}`);

  try {
    const body = await request.json();

    // Validate request body
    const validation = updateDioceseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if diocese exists
    const [existing] = await db
      .select({ id: dioceses.id })
      .from(dioceses)
      .where(eq(dioceses.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Dieceza nu a fost găsită' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it's unique
    if (validation.data.code) {
      const [codeExists] = await db
        .select({ id: dioceses.id })
        .from(dioceses)
        .where(eq(dioceses.code, validation.data.code))
        .limit(1);

      if (codeExists && codeExists.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'O dieceză cu acest cod există deja' },
          { status: 400 }
        );
      }
    }

    // Update diocese
    const [updated] = await db
      .update(dioceses)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(dioceses.id, params.id))
      .returning();

    console.log(`✓ Diocese updated: ${params.id}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error updating diocese:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update diocese' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dioceses/[id] - Delete a diocese (soft delete by setting isActive=false)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  console.log(`DELETE /api/dioceses/${params.id}`);

  try {
    // Check if diocese exists
    const [existing] = await db
      .select({ id: dioceses.id })
      .from(dioceses)
      .where(eq(dioceses.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Dieceza nu a fost găsită' },
        { status: 404 }
      );
    }

    // Check if there are any deaneries associated with this diocese
    const [deaneryCount] = await db
      .select({ count: eq(deaneries.dioceseId, params.id) })
      .from(deaneries)
      .where(eq(deaneries.dioceseId, params.id))
      .limit(1);

    if (deaneryCount) {
      // Soft delete - set isActive to false
      await db
        .update(dioceses)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(dioceses.id, params.id));

      console.log(`✓ Diocese soft-deleted: ${params.id}`);

      return NextResponse.json({
        success: true,
        message: 'Dieceza a fost dezactivată (există protopopiate asociate)',
      });
    }

    // Hard delete if no deaneries
    await db.delete(dioceses).where(eq(dioceses.id, params.id));

    console.log(`✓ Diocese deleted: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Dieceza a fost ștearsă',
    });
  } catch (error) {
    console.error('❌ Error deleting diocese:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete diocese' },
      { status: 500 }
    );
  }
}
