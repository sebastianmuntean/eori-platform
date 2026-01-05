/**
 * Custom hook for managing table sorting state
 * Provides consistent sorting management across HR tables
 */

import { useState, useCallback, useMemo } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortOrder;
}

export interface UseTableSortOptions<T> {
  initialSortBy?: keyof T;
  initialSortOrder?: SortOrder;
  onSortChange?: (sortBy: keyof T, sortOrder: SortOrder) => void;
}

export interface UseTableSortReturn<T> {
  sortBy: keyof T;
  sortOrder: SortOrder;
  sortConfig: SortConfig<T>;
  handleSort: (key: keyof T) => void;
  resetSort: () => void;
}

/**
 * Hook for managing table sorting state
 * @param options - Sorting options
 * @returns Sorting state and operations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTableSort<T = any>({
  initialSortBy,
  initialSortOrder = 'asc',
  onSortChange,
}: UseTableSortOptions<T> = {}): UseTableSortReturn<T> {
  const [sortBy, setSortBy] = useState<keyof T>(initialSortBy as keyof T);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const handleSort = useCallback(
    (key: keyof T) => {
      if (sortBy === key) {
        // Toggle order if same column
        const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(newOrder);
        onSortChange?.(key, newOrder);
      } else {
        // New column, default to ascending
        setSortBy(key);
        setSortOrder('asc');
        onSortChange?.(key, 'asc');
      }
    },
    [sortBy, sortOrder, onSortChange]
  );

  const resetSort = useCallback(() => {
    if (initialSortBy) {
      setSortBy(initialSortBy);
      setSortOrder(initialSortOrder);
      onSortChange?.(initialSortBy, initialSortOrder);
    }
  }, [initialSortBy, initialSortOrder, onSortChange]);

  const sortConfig = useMemo(
    () => ({
      key: sortBy,
      direction: sortOrder,
    }),
    [sortBy, sortOrder]
  );

  return {
    sortBy,
    sortOrder,
    sortConfig,
    handleSort,
    resetSort,
  };
}

