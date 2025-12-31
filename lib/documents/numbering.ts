/**
 * Document Numbering Utility
 * 
 * Provides atomic document number generation per parish/year/direction
 */

import { db } from "@/lib/db";
import { documentNumberCounters } from "@/drizzle/schema/documents/document-number-counters";
import { sql } from "drizzle-orm";
import { format } from "date-fns";

export interface DocumentNumber {
  number: number;
  formatted: string;
}

/**
 * Get the next document number atomically
 * 
 * Uses INSERT ... ON CONFLICT DO UPDATE to ensure atomic increment
 * even under concurrent access.
 * 
 * @param parishId - The parish ID
 * @param year - The registration year
 * @param direction - 'in' or 'out'
 * @param dateFormat - Optional date format for formatted number (default: 'dd.MM.yyyy')
 * @returns The next number and formatted string
 */
export async function getNextDocumentNumber(
  parishId: string,
  year: number,
  direction: "in" | "out",
  dateFormat: string = "dd.MM.yyyy"
): Promise<DocumentNumber> {
  // Use a transaction for atomicity
  const result = await db.transaction(async (tx) => {
    // Atomic upsert with increment
    const [counter] = await tx
      .insert(documentNumberCounters)
      .values({
        parishId,
        year,
        direction,
        currentValue: 1,
      })
      .onConflictDoUpdate({
        target: [
          documentNumberCounters.parishId,
          documentNumberCounters.year,
          documentNumberCounters.direction
        ],
        set: {
          currentValue: sql`${documentNumberCounters.currentValue} + 1`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ currentValue: documentNumberCounters.currentValue });

    return counter.currentValue;
  });

  const formatted = `${result}/${format(new Date(), dateFormat)}`;

  return {
    number: result,
    formatted,
  };
}

/**
 * Get the current document number without incrementing
 * 
 * @param parishId - The parish ID
 * @param year - The registration year
 * @param direction - 'in' or 'out'
 * @returns The current number or 0 if no documents exist
 */
export async function getCurrentDocumentNumber(
  parishId: string,
  year: number,
  direction: "in" | "out"
): Promise<number> {
  const [counter] = await db
    .select({ currentValue: documentNumberCounters.currentValue })
    .from(documentNumberCounters)
    .where(
      sql`${documentNumberCounters.parishId} = ${parishId} 
          AND ${documentNumberCounters.year} = ${year} 
          AND ${documentNumberCounters.direction} = ${direction}`
    );

  return counter?.currentValue ?? 0;
}

/**
 * Reset document numbering for a new year
 * 
 * This should be called at the start of each new year to initialize counters.
 * Note: This doesn't reset existing counters, it just ensures they exist.
 * 
 * @param parishId - The parish ID
 * @param year - The year to initialize
 */
export async function initializeYearCounters(
  parishId: string,
  year: number
): Promise<void> {
  // Initialize both directions with 0 if they don't exist
  await db
    .insert(documentNumberCounters)
    .values([
      { parishId, year, direction: "in", currentValue: 0 },
      { parishId, year, direction: "out", currentValue: 0 },
    ])
    .onConflictDoNothing();
}
