/**
 * Custom hook for managing table filter state and operations
 * Provides consistent filter management across HR tables
 */

import { useState, useCallback, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableFilters = Record<string, any>;

export interface UseTableFiltersOptions<T extends TableFilters> {
  initialFilters: T;
  onFilterChange?: (filters: T) => void;
}

export interface UseTableFiltersReturn<T extends TableFilters> {
  filters: T;
  setFilter: (key: keyof T, value: string | number | boolean | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  updateFilters: (updates: Partial<T>) => void;
}

/**
 * Hook for managing table filter state
 * @param initialFilters - Initial filter values
 * @param onFilterChange - Optional callback when filters change
 * @returns Filter state and operations
 */
export function useTableFilters<T extends TableFilters>({
  initialFilters,
  onFilterChange,
}: UseTableFiltersOptions<T>): UseTableFiltersReturn<T> {
  const [filters, setFilters] = useState<T>(initialFilters);

  const setFilter = useCallback(
    (key: keyof T, value: string | number | boolean | null) => {
      setFilters((prev) => {
        const updated = { ...prev, [key]: value };
        onFilterChange?.(updated);
        return updated;
      });
    },
    [onFilterChange]
  );

  const updateFilters = useCallback(
    (updates: Partial<T>) => {
      setFilters((prev) => {
        const updated = { ...prev, ...updates };
        onFilterChange?.(updated);
        return updated;
      });
    },
    [onFilterChange]
  );

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    onFilterChange?.(initialFilters);
  }, [initialFilters, onFilterChange]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const initialValue = initialFilters[key as keyof T];
      return value !== initialValue && value !== '' && value !== null && value !== undefined;
    });
  }, [filters, initialFilters]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    updateFilters,
  };
}

