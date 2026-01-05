import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { registerConfigurations, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, or, isNull } from 'drizzle-orm';
import { z } from 'zod';

const createRegisterConfigSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  parishId: z.string().uuid().optional().nullable(),
  resetsAnnually: z.boolean().optional().default(false),
  startingNumber: z.number().int().min(1).optional().default(1),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/registratura/register-configurations - List all register configurations
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');

    // Build query conditions
    const conditions = [];
    if (parishId) {
      conditions.push(eq(registerConfigurations.parishId, parishId));
    }

    const configs = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(registerConfigurations.name);

    return NextResponse.json(
      {
        success: true,
        data: configs,
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/register-configurations', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/register-configurations - Create new register configuration
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createRegisterConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If parishId is provided, verify it exists
    if (data.parishId) {
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

    // Create register configuration
    const [newConfig] = await db
      .insert(registerConfigurations)
      .values({
        name: data.name,
        parishId: data.parishId || null,
        resetsAnnually: data.resetsAnnually || false,
        startingNumber: data.startingNumber || 1,
        notes: data.notes || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newConfig,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/register-configurations', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


