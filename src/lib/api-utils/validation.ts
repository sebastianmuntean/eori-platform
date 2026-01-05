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

/**
 * Format Zod validation errors for API response
 * @param errors - Array of Zod validation errors
 * @returns Formatted error response with message, all errors, and field-level errors
 */
export function formatValidationErrors(errors: import('zod').ZodIssue[]): {
  message: string;
  errors: string[];
  fields: Record<string, string>;
} {
  const errorMessages = errors.map(err => err.message);
  const fieldErrors: Record<string, string> = {};
  
  errors.forEach(err => {
    const path = err.path.join('.');
    if (path) {
      fieldErrors[path] = err.message;
    }
  });
  
  return {
    message: errorMessages[0] || 'Validation failed',
    errors: errorMessages,
    fields: fieldErrors,
  };
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(value: string | null): boolean {
  if (!value) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

