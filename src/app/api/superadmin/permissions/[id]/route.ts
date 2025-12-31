import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { permissions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').optional(),
  description: z.string().optional(),
  resource: z.string().min(1, 'Resource is required').optional(),
  action: z.string().min(1, 'Action is required').optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  console.log(`Step 1: GET /api/superadmin/permissions/${params.id} - Fetching permission`);

  try {
    console.log(`Step 2: Querying database for permission with id: ${params.id}`);
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, params.id)).limit(1);

    if (!permission) {
      console.log(`❌ Permission with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Permission found: ${permission.name}`);
    return NextResponse.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error('❌ Error fetching permission:', error);
    logError(error, { endpoint: `/api/superadmin/permissions/${params.id}`, method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  console.log(`Step 1: PUT /api/superadmin/permissions/${params.id} - Updating permission`);

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = updatePermissionSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    console.log(`Step 3: Checking if permission with id ${params.id} exists`);
    const [existingPermission] = await db.select().from(permissions).where(eq(permissions.id, params.id)).limit(1);

    if (!existingPermission) {
      console.log(`❌ Permission with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if name is being updated and if it conflicts with existing permission
    if (updateData.name && updateData.name !== existingPermission.name) {
      console.log(`Step 4: Checking if permission name "${updateData.name}" is already taken`);
      const [nameConflict] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.name, updateData.name))
        .limit(1);

      if (nameConflict) {
        console.log(`❌ Permission name "${updateData.name}" is already taken`);
        return NextResponse.json(
          { success: false, error: 'Permission with this name already exists' },
          { status: 400 }
        );
      }
    }

    console.log(`Step 5: Updating permission with id ${params.id}`);
    const updateValues: {
      name?: string;
      description?: string | null;
      resource?: string;
      action?: string;
      updatedAt?: Date;
    } = {};
    if (updateData.name !== undefined) {
      updateValues.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      updateValues.description = updateData.description || null;
    }
    if (updateData.resource !== undefined) {
      updateValues.resource = updateData.resource;
    }
    if (updateData.action !== undefined) {
      updateValues.action = updateData.action;
    }
    updateValues.updatedAt = new Date();

    const [updatedPermission] = await db
      .update(permissions)
      .set(updateValues)
      .where(eq(permissions.id, params.id))
      .returning();

    console.log(`✓ Permission updated successfully: ${updatedPermission.name}`);
    return NextResponse.json({
      success: true,
      data: updatedPermission,
    });
  } catch (error) {
    console.error('❌ Error updating permission:', error);
    logError(error, { endpoint: `/api/superadmin/permissions/${params.id}`, method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  console.log(`Step 1: DELETE /api/superadmin/permissions/${params.id} - Deleting permission`);

  try {
    console.log(`Step 2: Checking if permission with id ${params.id} exists`);
    const [existingPermission] = await db.select().from(permissions).where(eq(permissions.id, params.id)).limit(1);

    if (!existingPermission) {
      console.log(`❌ Permission with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    console.log(`Step 3: Deleting permission "${existingPermission.name}" with id ${params.id}`);
    await db.delete(permissions).where(eq(permissions.id, params.id));

    console.log(`✓ Permission deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting permission:', error);
    logError(error, { endpoint: `/api/superadmin/permissions/${params.id}`, method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




