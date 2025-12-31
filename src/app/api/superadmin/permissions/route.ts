import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { permissions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional(),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
});

export async function GET() {
  console.log('Step 1: GET /api/superadmin/permissions - Fetching all permissions');

  try {
    console.log('Step 2: Querying database for permissions');
    const allPermissions = await db.select().from(permissions);
    console.log(`✓ Found ${allPermissions.length} permissions in database`);

    return NextResponse.json({
      success: true,
      data: allPermissions,
    });
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    logError(error, { endpoint: '/api/superadmin/permissions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  console.log('Step 1: POST /api/superadmin/permissions - Creating new permission');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = createPermissionSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, resource, action } = validation.data;

    console.log(`Step 3: Checking if permission "${name}" already exists`);
    const existingPermission = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);

    if (existingPermission.length > 0) {
      console.log(`❌ Permission "${name}" already exists`);
      return NextResponse.json(
        { success: false, error: 'Permission with this name already exists' },
        { status: 400 }
      );
    }

    console.log(`Step 4: Inserting new permission "${name}" into database`);
    const [newPermission] = await db
      .insert(permissions)
      .values({
        name,
        description: description || null,
        resource,
        action,
      })
      .returning();

    console.log(`✓ Permission created successfully with id: ${newPermission.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newPermission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating permission:', error);
    logError(error, { endpoint: '/api/superadmin/permissions', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




