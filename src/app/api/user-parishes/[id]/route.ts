import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userParishes } from '@/drizzle/schema/auth/user-parishes';
import { eq } from 'drizzle-orm';
import { updateUserParishSchema } from '@/src/lib/validations/user-parishes';

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/user-parishes/[id] - Update a user-parish assignment
 */
export async function PUT(request: Request, { params }: RouteParams) {
  console.log(`PUT /api/user-parishes/${params.id}`);

  try {
    const body = await request.json();

    // Validate request body
    const validation = updateUserParishSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const [existing] = await db
      .select({ id: userParishes.id, userId: userParishes.userId })
      .from(userParishes)
      .where(eq(userParishes.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Asocierea utilizator-parohie nu a fost găsită' },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primaries for this user
    if (validation.data.isPrimary) {
      await db
        .update(userParishes)
        .set({ isPrimary: false })
        .where(eq(userParishes.userId, existing.userId));
    }

    // Update assignment
    const updateData: Record<string, unknown> = {};
    if (validation.data.isPrimary !== undefined) {
      updateData.isPrimary = validation.data.isPrimary;
    }
    if (validation.data.accessLevel !== undefined) {
      updateData.accessLevel = validation.data.accessLevel;
    }

    const [updated] = await db
      .update(userParishes)
      .set(updateData)
      .where(eq(userParishes.id, params.id))
      .returning();

    console.log(`✓ User-parish assignment updated: ${params.id}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error updating user-parish assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user-parish assignment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-parishes/[id] - Remove a user-parish assignment
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  console.log(`DELETE /api/user-parishes/${params.id}`);

  try {
    // Check if assignment exists
    const [existing] = await db
      .select({ id: userParishes.id })
      .from(userParishes)
      .where(eq(userParishes.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Asocierea utilizator-parohie nu a fost găsită' },
        { status: 404 }
      );
    }

    // Delete assignment
    await db.delete(userParishes).where(eq(userParishes.id, params.id));

    console.log(`✓ User-parish assignment deleted: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Asocierea utilizator-parohie a fost ștearsă',
    });
  } catch (error) {
    console.error('❌ Error deleting user-parish assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user-parish assignment' },
      { status: 500 }
    );
  }
}
