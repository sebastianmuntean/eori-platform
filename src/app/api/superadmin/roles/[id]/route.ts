import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { roles } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').optional(),
  description: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  console.log(`Step 1: GET /api/superadmin/roles/${params.id} - Fetching role`);

  try {
    console.log(`Step 2: Querying database for role with id: ${params.id}`);
    const [role] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);

    if (!role) {
      console.log(`❌ Role with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Role found: ${role.name}`);
    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('❌ Error fetching role:', error);
    logError(error, { endpoint: `/api/superadmin/roles/${params.id}`, method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  console.log(`Step 1: PUT /api/superadmin/roles/${params.id} - Updating role`);

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    console.log(`Step 3: Checking if role with id ${params.id} exists`);
    const [existingRole] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);

    if (!existingRole) {
      console.log(`❌ Role with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if name is being updated and if it conflicts with existing role
    if (updateData.name && updateData.name !== existingRole.name) {
      console.log(`Step 4: Checking if role name "${updateData.name}" is already taken`);
      const [nameConflict] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, updateData.name))
        .limit(1);

      if (nameConflict) {
        console.log(`❌ Role name "${updateData.name}" is already taken`);
        return NextResponse.json(
          { success: false, error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    console.log(`Step 5: Updating role with id ${params.id}`);
    const updateValues: { name?: string; description?: string | null; updatedAt?: Date } = {};
    if (updateData.name !== undefined) {
      updateValues.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      updateValues.description = updateData.description || null;
    }
    updateValues.updatedAt = new Date();

    const [updatedRole] = await db
      .update(roles)
      .set(updateValues)
      .where(eq(roles.id, params.id))
      .returning();

    console.log(`✓ Role updated successfully: ${updatedRole.name}`);
    return NextResponse.json({
      success: true,
      data: updatedRole,
    });
  } catch (error) {
    console.error('❌ Error updating role:', error);
    logError(error, { endpoint: `/api/superadmin/roles/${params.id}`, method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  console.log(`Step 1: DELETE /api/superadmin/roles/${params.id} - Deleting role`);

  try {
    console.log(`Step 2: Checking if role with id ${params.id} exists`);
    const [existingRole] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);

    if (!existingRole) {
      console.log(`❌ Role with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    console.log(`Step 3: Deleting role "${existingRole.name}" with id ${params.id}`);
    await db.delete(roles).where(eq(roles.id, params.id));

    console.log(`✓ Role deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting role:', error);
    logError(error, { endpoint: `/api/superadmin/roles/${params.id}`, method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

