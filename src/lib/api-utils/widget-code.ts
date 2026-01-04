/**
 * Widget code generation utilities
 */

import { randomBytes } from 'crypto';
import { db } from '@/database/client';
import { onlineForms } from '@/database/schema';
import { eq } from 'drizzle-orm';

const MAX_GENERATION_ATTEMPTS = 10;
const WIDGET_CODE_PREFIX = 'form_';
const WIDGET_CODE_RANDOM_BYTES = 8;

/**
 * Generate a unique widget code
 */
export function generateWidgetCode(): string {
  const randomPart = randomBytes(WIDGET_CODE_RANDOM_BYTES).toString('hex');
  return `${WIDGET_CODE_PREFIX}${randomPart}`;
}

/**
 * Ensure widget code is unique by checking database
 * Returns a unique widget code or throws an error
 */
export async function ensureUniqueWidgetCode(
  providedCode: string | undefined | null
): Promise<string> {
  let widgetCode = providedCode || generateWidgetCode();
  let attempts = 0;

  while (attempts < MAX_GENERATION_ATTEMPTS) {
    const [existing] = await db
      .select()
      .from(onlineForms)
      .where(eq(onlineForms.widgetCode, widgetCode))
      .limit(1);

    if (!existing) {
      return widgetCode;
    }

    widgetCode = generateWidgetCode();
    attempts++;
  }

  throw new Error('Failed to generate unique widget code after multiple attempts');
}

