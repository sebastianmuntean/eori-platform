/**
 * HR module utility functions
 * Shared utilities for HR components (tables, forms, etc.)
 */

/**
 * Contract status color mapping
 */
export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
} as const;

/**
 * Employee status color mapping
 */
export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-gray-800',
  retired: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Salary status color mapping
 */
export const SALARY_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  calculated: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

/**
 * Time entry status color mapping
 */
export const TIME_ENTRY_STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  holiday: 'bg-blue-100 text-blue-800',
  sick_leave: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Format a date string to locale date string
 * @param dateString - Date string in ISO format or null
 * @returns Formatted date string or '-' if null/empty
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return '-';
  }
}

/**
 * Format a numeric value as currency
 * @param value - Numeric value as string or number
 * @param currency - Currency code (default: 'RON')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: string | number,
  currency: string = 'RON',
  decimals: number = 2
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return `0.00 ${currency}`;
  return `${numValue.toFixed(decimals)} ${currency}`;
}

/**
 * Get status badge class names
 * @param status - Status value
 * @param colorMap - Color mapping object
 * @returns CSS class names for status badge
 */
export function getStatusBadgeClasses(
  status: string,
  colorMap: Record<string, string>
): string {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  const colorClasses = colorMap[status] || 'bg-gray-100 text-gray-800';
  return `${baseClasses} ${colorClasses}`;
}

/**
 * Format contract type for display
 * @param contractType - Contract type (e.g., 'indeterminate', 'determinate')
 * @returns Formatted contract type string
 */
export function formatContractType(contractType: string): string {
  return contractType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Get employee display name from employee object
 * @param employee - Employee object with firstName and lastName
 * @returns Full name string or '-'
 */
export function getEmployeeDisplayName(employee: { firstName: string; lastName: string } | null | undefined): string {
  if (!employee) return '-';
  return `${employee.firstName} ${employee.lastName}`;
}

/**
 * Leave request status color mapping
 */
export const LEAVE_REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Format salary period for display
 * @param period - Date string in ISO format
 * @returns Formatted period string (e.g., "January 2024")
 */
export function formatSalaryPeriod(period: string): string {
  try {
    return new Date(period).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' });
  } catch {
    return formatDate(period);
  }
}

/**
 * Format hours for display
 * @param hours - Hours as string or number
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted hours string with 'h' suffix
 */
export function formatHours(hours: string | number | null, decimals: number = 2): string {
  if (hours === null || hours === undefined) return '-';
  const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
  if (isNaN(numHours) || numHours === 0) return '-';
  return `${numHours.toFixed(decimals)}h`;
}

/**
 * Format worked days ratio
 * @param worked - Worked days
 * @param total - Total working days
 * @returns Formatted string (e.g., "20 / 22")
 */
export function formatWorkedDays(worked: number, total: number): string {
  return `${worked} / ${total}`;
}

/**
 * Common page size options for tables
 */
export const PAGE_SIZE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

/**
 * Default page size for tables
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Debounce delay for search inputs (ms)
 */
export const SEARCH_DEBOUNCE_DELAY = 300;

