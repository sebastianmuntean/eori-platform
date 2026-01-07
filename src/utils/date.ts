/**
 * Utility functions for date formatting
 */

/**
 * Formats a date string to a localized date string
 * @param date - Date string or null
 * @param locale - Locale string (e.g., 'en-US', 'ro-RO')
 * @returns Formatted date string or '-' if date is null
 */
export function formatDate(date: string | null, locale: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale);
}

