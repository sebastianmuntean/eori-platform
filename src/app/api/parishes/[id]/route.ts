import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parishes } from '@/drizzle/schema/core/parishes';
import { dioceses } from '@/drizzle/schema/core/dioceses';
import { deaneries } from '@/drizzle/schema/core/deaneries';
import { eq } from 'drizzle-orm';
import { updateParishSchema } from '@/src/lib/validations/parishes';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/parishes/[id] - Get a single parish by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  console.log(`GET /api/parishes/${params.id}`);

  try {
    const [parish] = await db
      .select({
        id: parishes.id,
        dioceseId: parishes.dioceseId,
        deaneryId: parishes.deaneryId,
        code: parishes.code,
        name: parishes.name,
        patronSaintDay: parishes.patronSaintDay,
        address: parishes.address,
        city: parishes.city,
        county: parishes.county,
        postalCode: parishes.postalCode,
        latitude: parishes.latitude,
        longitude: parishes.longitude,
        phone: parishes.phone,
        email: parishes.email,
        website: parishes.website,
        priestName: parishes.priestName,
        vicarName: parishes.vicarName,
        parishionerCount: parishes.parishionerCount,
        foundedYear: parishes.foundedYear,
        notes: parishes.notes,
        isActive: parishes.isActive,
        createdAt: parishes.createdAt,
        updatedAt: parishes.updatedAt,
        dioceseName: dioceses.name,
        deaneryName: deaneries.name,
      })
      .from(parishes)
      .leftJoin(dioceses, eq(parishes.dioceseId, dioceses.id))
      .leftJoin(deaneries, eq(parishes.deaneryId, deaneries.id))
      .where(eq(parishes.id, params.id))
      .limit(1);

    if (!parish) {
      return NextResponse.json(
        { success: false, error: 'Parohia nu a fost găsită' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: parish });
  } catch (error) {
    console.error('❌ Error fetching parish:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parish' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/parishes/[id] - Update a parish
 */
export async function PUT(request: Request, { params }: RouteParams) {
  console.log(`PUT /api/parishes/${params.id}`);

  try {
    const body = await request.json();

    // Validate request body
    const validation = updateParishSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if parish exists
    const [existing] = await db
      .select({ id: parishes.id, dioceseId: parishes.dioceseId })
      .from(parishes)
      .where(eq(parishes.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Parohia nu a fost găsită' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it's unique
    if (validation.data.code) {
      const [codeExists] = await db
        .select({ id: parishes.id })
        .from(parishes)
        .where(eq(parishes.code, validation.data.code))
        .limit(1);

      if (codeExists && codeExists.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'O parohie cu acest cod există deja' },
          { status: 400 }
        );
      }
    }

    // If deaneryId is being updated, verify it belongs to the parish's diocese
    if (validation.data.deaneryId) {
      const [deanery] = await db
        .select({ id: deaneries.id, dioceseId: deaneries.dioceseId })
        .from(deaneries)
        .where(eq(deaneries.id, validation.data.deaneryId))
        .limit(1);

      if (!deanery) {
        return NextResponse.json(
          { success: false, error: 'Protopopiatul selectat nu există' },
          { status: 400 }
        );
      }

      if (deanery.dioceseId !== existing.dioceseId) {
        return NextResponse.json(
          { success: false, error: 'Protopopiatul selectat nu aparține diecezei parohiei' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      ...validation.data,
      updatedAt: new Date(),
    };

    // Convert lat/long to strings if present
    if (validation.data.latitude !== undefined) {
      updateData.latitude = validation.data.latitude?.toString();
    }
    if (validation.data.longitude !== undefined) {
      updateData.longitude = validation.data.longitude?.toString();
    }

    // Update parish
    const [updated] = await db
      .update(parishes)
      .set(updateData)
      .where(eq(parishes.id, params.id))
      .returning();

    console.log(`✓ Parish updated: ${params.id}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error updating parish:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update parish' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/parishes/[id] - Delete a parish (soft delete)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  console.log(`DELETE /api/parishes/${params.id}`);

  try {
    // Check if parish exists
    const [existing] = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Parohia nu a fost găsită' },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    // (Parishes typically have many associated records, so we don't hard delete)
    await db
      .update(parishes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(parishes.id, params.id));

    console.log(`✓ Parish soft-deleted: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Parohia a fost dezactivată',
    });
  } catch (error) {
    console.error('❌ Error deleting parish:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete parish' },
      { status: 500 }
    );
  }
}
