import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { registerConfigurations, parishes, generalRegister } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateRegisterConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  parishId: z.string().uuid().optional().nullable(),
  resetsAnnually: z.boolean().optional(),
  startingNumber: z.number().int().min(1).optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registratura/register-configurations/[id] - Get single register configuration
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const [config] = await db
      .select({
        id: registerConfigurations.id,
        name: registerConfigurations.name,
        parishId: registerConfigurations.parishId,
        resetsAnnually: registerConfigurations.resetsAnnually,
        startingNumber: registerConfigurations.startingNumber,
        notes: registerConfigurations.notes,
        createdBy: registerConfigurations.createdBy,
        createdAt: registerConfigurations.createdAt,
        updatedAt: registerConfigurations.updatedAt,
        updatedBy: registerConfigurations.updatedBy,
        parish: {
          id: parishes.id,
          name: parishes.name,
          code: parishes.code,
        },
      })
      .from(registerConfigurations)
      .leftJoin(parishes, eq(registerConfigurations.parishId, parishes.id))
      .where(eq(registerConfigurations.id, id))
      .limit(1);

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Register configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: config,
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/register-configurations/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/registratura/register-configurations/[id] - Update register configuration
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateRegisterConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if register configuration exists
    const [existingConfig] = await db
      .select()
      .from(registerConfigurations)
      .where(eq(registerConfigurations.id, id))
      .limit(1);

    if (!existingConfig) {
      console.log(`❌ Register configuration ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Register configuration not found' },
        { status: 404 }
      );
    }

    // If parishId is provided, verify it exists
    if (data.parishId !== undefined && data.parishId !== null) {
      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.resetsAnnually !== undefined) updateData.resetsAnnually = data.resetsAnnually;
    if (data.startingNumber !== undefined) updateData.startingNumber = data.startingNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update register configuration
    const [updatedConfig] = await db
      .update(registerConfigurations)
      .set(updateData)
      .where(eq(registerConfigurations.id, id))
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: updatedConfig,
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/register-configurations/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/registratura/register-configurations/[id] - Delete register configuration
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if register configuration exists
    const [existingConfig] = await db
      .select()
      .from(registerConfigurations)
      .where(eq(registerConfigurations.id, id))
      .limit(1);

    if (!existingConfig) {
      console.log(`❌ Register configuration ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Register configuration not found' },
        { status: 404 }
      );
    }

    // Check if there are any documents using this register configuration
    const documents = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.registerConfigurationId, id))
      .limit(1);

    if (documents.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete register configuration: documents reference it` 
        },
        { status: 400 }
      );
    }

    // Delete register configuration
    await db
      .delete(registerConfigurations)
      .where(eq(registerConfigurations.id, id));

    return NextResponse.json(
      {
        success: true,
        message: 'Register configuration deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/register-configurations/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

