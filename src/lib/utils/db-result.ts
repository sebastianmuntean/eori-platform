/**
 * Utility functions for handling database result formats
 */

/**
 * Extracts the ID from a database INSERT result that returns an ID
 * Handles different return formats from postgres-js/drizzle
 * 
 * @param result - The result from db.execute with RETURNING id
 * @returns The extracted ID string
 * @throws Error if the ID cannot be extracted
 */
export function extractIdFromDbResult(result: unknown): string {
  if (!result || typeof result !== 'object') {
    console.error('❌ Unexpected result type from db.execute:', typeof result, result);
    throw new Error('Failed to get ID from insert result: invalid result type');
  }

  // Handle postgres-js format: { rows: [{ id: '...' }] }
  if ('rows' in result && Array.isArray(result.rows) && result.rows.length > 0) {
    const id = result.rows[0]?.id;
    if (id) {
      return String(id);
    }
  }

  // Handle array format: [{ id: '...' }]
  if (Array.isArray(result) && result.length > 0) {
    const id = result[0]?.id;
    if (id) {
      return String(id);
    }
  }

  // Handle direct object with id property: { id: '...' }
  if ('id' in result) {
    const id = (result as { id: unknown }).id;
    if (id) {
      return String(id);
    }
  }

  // If we get here, we couldn't extract the ID
  console.error('❌ Unexpected result format from db.execute:', JSON.stringify(result, null, 2));
  throw new Error('Failed to get ID from insert result: ID not found in result');
}







