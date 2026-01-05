/**
 * Formatters for fixed asset data
 */

/**
 * Format monetary value with validation
 * @param value - String or null value to format
 * @param locale - Locale for formatting (default: 'ro-RO')
 * @returns Formatted string with currency or '-' if invalid
 */
export function formatMonetaryValue(
  value: string | null,
  locale: string = 'ro-RO'
): string {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return `${num.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} RON`;
}

/**
 * Format date value
 * @param value - String or null date value
 * @returns Formatted date string or '-' if invalid
 */
export function formatDate(value: string | null): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ro-RO');
  } catch {
    return '-';
  }
}



