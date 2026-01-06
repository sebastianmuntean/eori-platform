/**
 * Utility functions for catechesis module
 */

/**
 * Convert empty strings to null for optional fields
 */
export function normalizeOptionalField(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

/**
 * Convert date to ISO date string (YYYY-MM-DD) for date inputs
 */
export function dateToInputValue(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Convert number to string, handling null/undefined
 */
export function numberToString(value: number | null | undefined): string {
  return value?.toString() || '';
}

/**
 * Parse string to number, handling empty strings
 */
export function stringToNumber(value: string | null | undefined): number | null {
  if (!value || !value.trim()) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Create modal close handlers
 */
export function createModalCloseHandlers(
  onClose: () => void,
  onReset?: () => void
) {
  return {
    onClose: () => {
      onClose();
      onReset?.();
    },
    onCancel: () => {
      onClose();
      onReset?.();
    },
  };
}

