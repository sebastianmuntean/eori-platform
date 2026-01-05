import { db } from '@/database/client';
import { registerConfigurations, generalRegister } from '@/database/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

export interface GenerateRegistrationNumberParams {
  registerConfigId: string;
  year?: number;
}

export interface GenerateRegistrationNumberResult {
  documentNumber: number;
  year: number;
}

/**
 * Generate the next registration number for a register configuration
 * @param params - Register configuration ID and optional year
 * @returns Next registration number and year
 */
export async function generateRegistrationNumber(
  params: GenerateRegistrationNumberParams
): Promise<GenerateRegistrationNumberResult> {
  const { registerConfigId, year } = params;

  // Get register configuration
  const [registerConfig] = await db
    .select()
    .from(registerConfigurations)
    .where(eq(registerConfigurations.id, registerConfigId))
    .limit(1);

  if (!registerConfig) {
    throw new Error('Register configuration not found');
  }

  // Determine the year to use
  const currentYear = year || new Date().getFullYear();
  const useYear = registerConfig.resetsAnnually ? currentYear : undefined;

  // Build query conditions
  const conditions = [eq(generalRegister.registerConfigurationId, registerConfigId)];

  // If resets annually, scope by year
  if (useYear !== undefined) {
    conditions.push(eq(generalRegister.year, useYear));
  }

  // Find max document_number for the scope
  const [maxDoc] = await db
    .select({ 
      maxNumber: sql<number>`COALESCE(MAX(${generalRegister.documentNumber}), 0)` 
    })
    .from(generalRegister)
    .where(and(...conditions));

  const maxNumber = maxDoc?.maxNumber || 0;
  
  // Calculate next number
  const nextNumber = maxNumber === 0 
    ? registerConfig.startingNumber 
    : maxNumber + 1;

  return {
    documentNumber: nextNumber,
    year: currentYear,
  };
}




