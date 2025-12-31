import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users, roles, userRoles } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createUserRoleSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  roleId: z.string().uuid('Role ID must be a valid UUID'),
});

export async function GET() {
  console.log('Step 1: GET /api/superadmin/user-roles - Fetching users with roles');

  try {
    console.log('Step 2: Querying database for users with roles');
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`✓ Found ${allUsers.length} users`);

    // For each user, get their roles
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const userRolesList = await db
          .select({
            role: roles,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userRolesList.map((ur) => ur.role),
        };
      })
    );

    console.log(`✓ Returning ${usersWithRoles.length} users with roles`);
    return NextResponse.json({
      success: true,
      data: usersWithRoles,
    });
  } catch (error) {
    console.error('❌ Error fetching user-roles:', error);
    logError(error, { endpoint: '/api/superadmin/user-roles', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  console.log('Step 1: POST /api/superadmin/user-roles - Creating user-role association');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = createUserRoleSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, roleId } = validation.data;

    console.log(`Step 3: Checking if user ${userId} exists`);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      console.log(`❌ User with id ${userId} not found`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Step 4: Checking if role ${roleId} exists`);
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) {
      console.log(`❌ Role with id ${roleId} not found`);
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    console.log(`Step 5: Checking if association already exists`);
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1);

    if (existing) {
      console.log(`❌ User-role association already exists`);
      return NextResponse.json(
        { success: false, error: 'This user already has this role' },
        { status: 400 }
      );
    }

    console.log(`Step 6: Creating user-role association`);
    const [newAssociation] = await db
      .insert(userRoles)
      .values({
        userId,
        roleId,
      })
      .returning();

    console.log(`✓ User-role association created successfully`);
    return NextResponse.json(
      {
        success: true,
        data: newAssociation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating user-role association:', error);
    logError(error, { endpoint: '/api/superadmin/user-roles', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(request: Request) {
  console.log('Step 1: DELETE /api/superadmin/user-roles - Removing user-role association');

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');

    if (!userId || !roleId) {
      console.log('❌ Missing userId or roleId query parameters');
      return NextResponse.json(
        { success: false, error: 'userId and roleId query parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Checking if association exists (userId: ${userId}, roleId: ${roleId})`);
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1);

    if (!existing) {
      console.log(`❌ User-role association not found`);
      return NextResponse.json(
        { success: false, error: 'User-role association not found' },
        { status: 404 }
      );
    }

    console.log(`Step 3: Deleting user-role association`);
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

    console.log(`✓ User-role association deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'User-role association deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting user-role association:', error);
    logError(error, { endpoint: '/api/superadmin/user-roles', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




