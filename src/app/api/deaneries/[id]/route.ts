import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deaneries } from '@/drizzle/schema/core/deaneries';
import { dioceses } from '@/drizzle/schema/core/dioceses';
import { parishes } from '@/drizzle/schema/core/parishes';
import { eq, and } from 'drizzle-orm';
import { updateDeanerySchema } from '@/src/lib/validations/deaneries';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/deaneries/[id] - Get a single deanery by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  console.log(`GET /api/deaneries/${params.id}`);

  try {
    const [deanery] = await db
      .select({
        id: deaneries.id,
        dioceseId: deaneries.dioceseId,
        code: deaneries.code,
        name: deaneries.name,
        address: deaneries.address,
        city: deaneries.city,
        county: deaneries.county,
        deanName: deaneries.deanName,
        phone: deaneries.phone,
        email: deaneries.email,
        isActive: deaneries.isActive,
        createdAt: deaneries.createdAt,
        updatedAt: deaneries.updatedAt,
        dioceseName: dioceses.name,
        dioceseCode: dioceses.code,
      })
      .from(deaneries)
      .leftJoin(dioceses, eq(deaneries.dioceseId, dioceses.id))
      .where(eq(deaneries.id, params.id))
      .limit(1);

    if (!deanery) {
      return NextResponse.json(
        { success: false, error: 'Protopopiatul nu a fost găsit' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deanery });
  } catch (error) {
    console.error('❌ Error fetching deanery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deanery' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/deaneries/[id] - Update a deanery
 */
export async function PUT(request: Request, { params }: RouteParams) {
  console.log(`PUT /api/deaneries/${params.id}`);

  try {
    const body = await request.json();

    // Validate request body
    const validation = updateDeanerySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if deanery exists
    const [existing] = await db
      .select({ id: deaneries.id, dioceseId: deaneries.dioceseId })
      .from(deaneries)
      .where(eq(deaneries.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Protopopiatul nu a fost găsit' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it's unique within diocese
    if (validation.data.code) {
      const [codeExists] = await db
        .select({ id: deaneries.id })
        .from(deaneries)
        .where(and(
          eq(deaneries.dioceseId, existing.dioceseId),
          eq(deaneries.code, validation.data.code)
        ))
        .limit(1);

      if (codeExists && codeExists.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'Un protopopiat cu acest cod există deja în această dieceză' },
          { status: 400 }
        );
      }
    }

    // Update deanery
    const [updated] = await db
      .update(deaneries)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(deaneries.id, params.id))
      .returning();

    console.log(`✓ Deanery updated: ${params.id}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error updating deanery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deanery' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deaneries/[id] - Delete a deanery
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  console.log(`DELETE /api/deaneries/${params.id}`);

  try {
    // Check if deanery exists
    const [existing] = await db
      .select({ id: deaneries.id })
      .from(deaneries)
      .where(eq(deaneries.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Protopopiatul nu a fost găsit' },
        { status: 404 }
      );
    }

    // Check if there are any parishes associated with this deanery
    const [parishCount] = await db
      .select({ count: parishes.id })
      .from(parishes)
      .where(eq(parishes.deaneryId, params.id))
      .limit(1);

    if (parishCount) {
      // Soft delete - set isActive to false
      await db
        .update(deaneries)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(deaneries.id, params.id));

      console.log(`✓ Deanery soft-deleted: ${params.id}`);

      return NextResponse.json({
        success: true,
        message: 'Protopopiatul a fost dezactivat (există parohii asociate)',
      });
    }

    // Hard delete if no parishes
    await db.delete(deaneries).where(eq(deaneries.id, params.id));

    console.log(`✓ Deanery deleted: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Protopopiatul a fost șters',
    });
  } catch (error) {
    console.error('❌ Error deleting deanery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete deanery' },
      { status: 500 }
    );
  }
}
