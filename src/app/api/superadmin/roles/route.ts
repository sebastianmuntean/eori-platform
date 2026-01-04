import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { roles } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireRole } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

export async function GET() {
  console.log('Step 1: GET /api/superadmin/roles - Fetching all roles');

  try {
    await requireRole('superadmin');
    console.log('Step 2: Querying database for roles');
    const allRoles = await db.select().from(roles);
    console.log(`✓ Found ${allRoles.length} roles in database`);

    return NextResponse.json({
      success: true,
      data: allRoles,
    });
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    logError(error, { endpoint: '/api/superadmin/roles', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  console.log('Step 1: POST /api/superadmin/roles - Creating new role');

  try {
    await requireRole('superadmin');
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = createRoleSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description } = validation.data;

    console.log(`Step 3: Checking if role "${name}" already exists`);
    const existingRole = await db.select().from(roles).where(eq(roles.name, name)).limit(1);

    if (existingRole.length > 0) {
      console.log(`❌ Role "${name}" already exists`);
      return NextResponse.json(
        { success: false, error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    console.log(`Step 4: Inserting new role "${name}" into database`);
    const [newRole] = await db
      .insert(roles)
      .values({
        name,
        description: description || null,
      })
      .returning();

    console.log(`✓ Role created successfully with id: ${newRole.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newRole,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating role:', error);
    logError(error, { endpoint: '/api/superadmin/roles', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

