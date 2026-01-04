'use client';

import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig<T> = {
  key: keyof T;
  direction: SortDirection;
};

export interface TableState<T> {
  page: number;
  pageSize: number;
  sortConfig: SortConfig<T> | null;
  filters: Record<string, any>;
}

export function useTable<T extends Record<string, any>>(
  initialData: T[] = [],
  initialPageSize: number = 10
) {

  const [state, setState] = useState<TableState<T>>({
    page: 1,
    pageSize: initialPageSize,
    sortConfig: null,
    filters: {},
  });

  const handleSort = (key: keyof T) => {
    console.log('Step 2: Handling sort for key:', key);
    setState((prev) => {
      let direction: SortDirection = 'asc';
      
      if (prev.sortConfig?.key === key) {
        if (prev.sortConfig.direction === 'asc') {
          direction = 'desc';
        } else if (prev.sortConfig.direction === 'desc') {
          direction = null;
        }
      }

      const newSortConfig = direction ? { key, direction } : null;
      console.log('✓ Sort config updated:', newSortConfig);
      
      return {
        ...prev,
        sortConfig: newSortConfig,
        page: 1, // Reset to first page on sort
      };
    });
  };

  const handlePageChange = (newPage: number) => {
    console.log('Step 3: Changing page to:', newPage);
    setState((prev) => {
      console.log('✓ Page changed to:', newPage);
      return { ...prev, page: newPage };
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    console.log('Step 4: Changing page size to:', newPageSize);
    setState((prev) => {
      console.log('✓ Page size changed to:', newPageSize);
      return { ...prev, pageSize: newPageSize, page: 1 };
    });
  };

  const handleFilter = (key: string, value: any) => {
    console.log('Step 5: Applying filter:', key, '=', value);
    setState((prev) => {
      const newFilters = { ...prev.filters };
      if (value === null || value === undefined || value === '') {
        delete newFilters[key];
        console.log('✓ Filter removed:', key);
      } else {
        newFilters[key] = value;
        console.log('✓ Filter applied:', key, '=', value);
      }
      return {
        ...prev,
        filters: newFilters,
        page: 1, // Reset to first page on filter
      };
    });
  };

  const clearFilters = () => {
    console.log('Step 6: Clearing all filters');
    setState((prev) => {
      console.log('✓ All filters cleared');
      return { ...prev, filters: {}, page: 1 };
    });
  };

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    console.log('Step 7: Processing table data');
    let result = [...initialData];

    // Apply filters
    if (Object.keys(state.filters).length > 0) {
      console.log('Step 7.1: Applying filters');
      result = result.filter((item) => {
        return Object.entries(state.filters).every(([key, value]) => {
          const itemValue = item[key];
          if (value === null || value === undefined || value === '') return true;
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(String(value).toLowerCase());
          }
          return itemValue === value;
        });
      });
      console.log('✓ Filtered data count:', result.length);
    }

    // Apply sorting
    if (state.sortConfig && state.sortConfig.direction) {
      console.log('Step 7.2: Applying sort');
      result = [...result].sort((a, b) => {
        const aValue = a[state.sortConfig!.key];
        const bValue = b[state.sortConfig!.key];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return state.sortConfig!.direction === 'asc' ? comparison : -comparison;
      });
      console.log('✓ Data sorted');
    }

    console.log('✓ Data processing completed');
    return result;
  }, [initialData, state.filters, state.sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    console.log('Step 8: Paginating data');
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const result = processedData.slice(start, end);
    console.log('✓ Paginated data:', result.length, 'items (page', state.page, ')');
    return result;
  }, [processedData, state.page, state.pageSize]);

  const totalPages = Math.ceil(processedData.length / state.pageSize);
  const totalItems = processedData.length;

  return {
    data: paginatedData,
    page: state.page,
    pageSize: state.pageSize,
    totalPages,
    totalItems,
    sortConfig: state.sortConfig,
    filters: state.filters,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleFilter,
    clearFilters,
  };
}




