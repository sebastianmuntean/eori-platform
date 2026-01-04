/**
 * Validation utilities for API routes
 */

/**
 * Validate and sanitize search string
 */
export function sanitizeSearch(search: string | null): string {
  if (!search) return '';
  return search.trim().slice(0, 255); // Limit length to prevent DoS
}

/**
 * Validate enum value against allowed values
 */
export function validateEnum<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  defaultValue: T | null = null
): T | null {
  if (!value) return defaultValue;
  return allowedValues.includes(value as T) ? (value as T) : defaultValue;
}

/**
 * Validate boolean query parameter
 */
export function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * Validate UUID string
 */
export function isValidUUID(value: string | null): boolean {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

