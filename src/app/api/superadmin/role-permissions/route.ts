import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { roles, permissions, rolePermissions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createRolePermissionSchema = z.object({
  roleId: z.string().uuid('Role ID must be a valid UUID'),
  permissionId: z.string().uuid('Permission ID must be a valid UUID'),
});

export async function GET() {
  console.log('Step 1: GET /api/superadmin/role-permissions - Fetching roles with permissions');

  try {
    console.log('Step 2: Querying database for roles with permissions');
    
    // Get all roles
    const allRoles = await db.select().from(roles);
    console.log(`✓ Found ${allRoles.length} roles`);

    // For each role, get its permissions
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const rolePerms = await db
          .select({
            permission: permissions,
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, role.id));

        return {
          ...role,
          permissions: rolePerms.map((rp) => rp.permission),
        };
      })
    );

    console.log(`✓ Returning ${rolesWithPermissions.length} roles with permissions`);
    return NextResponse.json({
      success: true,
      data: rolesWithPermissions,
    });
  } catch (error) {
    console.error('❌ Error fetching role-permissions:', error);
    logError(error, { endpoint: '/api/superadmin/role-permissions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  console.log('Step 1: POST /api/superadmin/role-permissions - Creating role-permission association');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = createRolePermissionSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roleId, permissionId } = validation.data;

    console.log(`Step 3: Checking if role ${roleId} exists`);
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) {
      console.log(`❌ Role with id ${roleId} not found`);
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    console.log(`Step 4: Checking if permission ${permissionId} exists`);
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, permissionId)).limit(1);
    if (!permission) {
      console.log(`❌ Permission with id ${permissionId} not found`);
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    console.log(`Step 5: Checking if association already exists`);
    const [existing] = await db
      .select()
      .from(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
      .limit(1);

    if (existing) {
      console.log(`❌ Role-permission association already exists`);
      return NextResponse.json(
        { success: false, error: 'This role already has this permission' },
        { status: 400 }
      );
    }

    console.log(`Step 6: Creating role-permission association`);
    const [newAssociation] = await db
      .insert(rolePermissions)
      .values({
        roleId,
        permissionId,
      })
      .returning();

    console.log(`✓ Role-permission association created successfully`);
    return NextResponse.json(
      {
        success: true,
        data: newAssociation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating role-permission association:', error);
    logError(error, { endpoint: '/api/superadmin/role-permissions', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(request: Request) {
  console.log('Step 1: DELETE /api/superadmin/role-permissions - Removing role-permission association');

  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');
    const permissionId = searchParams.get('permissionId');

    if (!roleId || !permissionId) {
      console.log('❌ Missing roleId or permissionId query parameters');
      return NextResponse.json(
        { success: false, error: 'roleId and permissionId query parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Checking if association exists (roleId: ${roleId}, permissionId: ${permissionId})`);
    const [existing] = await db
      .select()
      .from(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
      .limit(1);

    if (!existing) {
      console.log(`❌ Role-permission association not found`);
      return NextResponse.json(
        { success: false, error: 'Role-permission association not found' },
        { status: 404 }
      );
    }

    console.log(`Step 3: Deleting role-permission association`);
    await db
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));

    console.log(`✓ Role-permission association deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'Role-permission association deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting role-permission association:', error);
    logError(error, { endpoint: '/api/superadmin/role-permissions', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




