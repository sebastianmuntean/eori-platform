/**
 * Shared utilities for CRUD hooks
 * Reduces code duplication across entity-specific CRUD hooks
 */

/**
 * Creates a filter handler that resets pagination to page 1
 * Used when filters change to ensure user sees results from the first page
 */
export function createFilterHandler(onPageChange: (page: number) => void) {
  return () => {
    onPageChange(1);
  };
}

/**
 * Creates multiple filter handlers at once
 * Returns an object with handler functions for each filter
 */
export function createFilterHandlers<T extends Record<string, string>>(
  filterNames: (keyof T)[],
  onPageChange: (page: number) => void
): Record<string, () => void> {
  const handlers: Record<string, () => void> = {};
  
  filterNames.forEach((name) => {
    handlers[`handle${String(name).charAt(0).toUpperCase() + String(name).slice(1)}Change`] = createFilterHandler(onPageChange);
  });
  
  return handlers;
}

/**
 * Standard filter handler that resets to page 1
 */
export const createStandardFilterHandler = (onPageChange: (page: number) => void) => () => {
  onPageChange(1);
};

/**
 * Converts empty string to undefined for API calls
 * Prevents sending empty strings when API expects undefined
 */
export function normalizeFilterValue(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

/**
 * Converts boolean filter string to boolean or undefined
 * Handles 'active'/'inactive' string filters
 */
export function normalizeBooleanFilter(
  value: string | undefined,
  activeValue: string = 'active',
  inactiveValue: string = 'inactive'
): boolean | undefined {
  if (!value) return undefined;
  if (value === activeValue) return true;
  if (value === inactiveValue) return false;
  return undefined;
}

