import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { registerConfigurations, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, isNotNull } from 'drizzle-orm';

/**
 * POST /api/registratura/register-configurations/create-for-parishes
 * Creates register configurations for all active parishes that don't have one
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/registratura/register-configurations/create-for-parishes - Creating registers for parishes');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all active parishes
    const activeParishes = await db
      .select({
        id: parishes.id,
        name: parishes.name,
        code: parishes.code,
      })
      .from(parishes)
      .where(eq(parishes.isActive, true));

    console.log(`Found ${activeParishes.length} active parishes`);

    // Get existing register configurations with parish_id
    const existingConfigs = await db
      .select({
        parishId: registerConfigurations.parishId,
      })
      .from(registerConfigurations)
      .where(isNotNull(registerConfigurations.parishId));

    const existingParishIds = new Set(
      existingConfigs.map((config) => config.parishId).filter(Boolean) as string[]
    );

    console.log(`Found ${existingParishIds.size} parishes that already have registers`);

    // Filter parishes that don't have registers
    const parishesWithoutRegisters = activeParishes.filter(
      (parish) => !existingParishIds.has(parish.id)
    );

    console.log(`Creating registers for ${parishesWithoutRegisters.length} parishes`);

    const createdRegisters = [];

    // Create register for each parish without one
    for (const parish of parishesWithoutRegisters) {
      const [newConfig] = await db
        .insert(registerConfigurations)
        .values({
          name: `Registru ${parish.name}`,
          parishId: parish.id,
          resetsAnnually: true,
          startingNumber: 1,
          notes: `Registru pentru parohia ${parish.name} (${parish.code})`,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      createdRegisters.push({
        id: newConfig.id,
        name: newConfig.name,
        parishId: parish.id,
        parishName: parish.name,
        parishCode: parish.code,
      });

      console.log(`✓ Created register for parish: ${parish.name} (${parish.code})`);
    }

    console.log(`✓ Created ${createdRegisters.length} register configurations`);

    return NextResponse.json(
      {
        success: true,
        data: {
          created: createdRegisters.length,
          registers: createdRegisters,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error creating registers for parishes:', error);
    logError(error, { endpoint: '/api/registratura/register-configurations/create-for-parishes', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

