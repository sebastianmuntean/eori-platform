import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { permissions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid('Each ID must be a valid UUID')).min(1, 'At least one permission ID is required'),
});

export async function DELETE(request: Request) {
  console.log('Step 1: DELETE /api/superadmin/permissions/bulk-delete - Bulk deleting permissions');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { ids } = validation.data;
    console.log(`Step 3: Deleting ${ids.length} permissions`);

    // Check if all permissions exist
    const existingPermissions = await db
      .select()
      .from(permissions)
      .where(inArray(permissions.id, ids));

    if (existingPermissions.length !== ids.length) {
      console.log(`❌ Some permissions not found. Found: ${existingPermissions.length}, Requested: ${ids.length}`);
      return NextResponse.json(
        { success: false, error: 'Some permissions not found' },
        { status: 404 }
      );
    }

    // Delete all permissions
    await db.delete(permissions).where(inArray(permissions.id, ids));

    console.log(`✓ Successfully deleted ${ids.length} permissions`);
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${ids.length} permission${ids.length !== 1 ? 's' : ''}`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error('❌ Error bulk deleting permissions:', error);
    logError(error, { endpoint: '/api/superadmin/permissions/bulk-delete', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


