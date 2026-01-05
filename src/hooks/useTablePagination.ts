/**
 * Custom hook for managing table pagination state
 * Provides consistent pagination management across HR tables
 */

import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/hr';

export interface UseTablePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export interface UseTablePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPagination: () => void;
  pageSizeOptions: typeof PAGE_SIZE_OPTIONS;
}

/**
 * Hook for managing table pagination state
 * @param options - Pagination options
 * @returns Pagination state and operations
 */
export function useTablePagination({
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
}: UseTablePaginationOptions = {}): UseTablePaginationReturn {
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      onPageChange?.(newPage, pageSize);
    },
    [pageSize, onPageChange]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeState(newPageSize);
      setPageState(1); // Reset to first page when changing page size
      onPageChange?.(1, newPageSize);
    },
    [onPageChange] // setPageState is stable, not needed in dependencies
  );

  const resetPagination = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
    onPageChange?.(initialPage, initialPageSize);
  }, [initialPage, initialPageSize, onPageChange]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}

