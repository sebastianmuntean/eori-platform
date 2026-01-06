'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFixedAssets } from './useFixedAssets';
import { useParishes } from './useParishes';

export interface FixedAssetsFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  parishId?: string;
  category?: string;
  type?: string;
  status?: 'active' | 'inactive' | 'disposed' | 'damaged';
  sortBy?: string;
  sortOrder?: string;
}

interface UseFixedAssetsFiltersOptions {
  category?: string;
  defaultPageSize?: number;
  filterParams?: {
    status?: string;
    category?: string;
  };
}

/**
 * Custom hook for managing fixed assets filtering, pagination, and data fetching
 * Centralizes all filter-related logic to eliminate duplication
 */
export function useFixedAssetsFilters(options: UseFixedAssetsFiltersOptions = {}) {
  const { category, defaultPageSize = 10, filterParams = {} } = options;

  const {
    fixedAssets,
    loading,
    error,
    pagination,
    fetchFixedAssets,
  } = useFixedAssets();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract filter params values to avoid object reference issues
  const filterStatus = filterParams?.status;
  const filterCategory = filterParams?.category;

  // Build query parameters object
  const queryParams = useMemo<FixedAssetsFilterParams>(() => {
    const params: FixedAssetsFilterParams = {
      page: currentPage,
      pageSize: defaultPageSize,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
    };

    if (category) {
      params.category = category;
    }

    if (filterStatus) {
      params.status = filterStatus as FixedAssetsFilterParams['status'];
    }

    if (filterCategory) {
      params.category = filterCategory;
    }

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    ) as FixedAssetsFilterParams;
  }, [currentPage, defaultPageSize, searchTerm, parishFilter, category, filterStatus, filterCategory]);

  // Fetch parishes on mount
  useEffect(() => {
    fetchParishes({ all: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchParishes is stable (memoized with empty deps)

  // Fetch fixed assets when filters change
  useEffect(() => {
    fetchFixedAssets(queryParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, parishFilter, category, filterStatus, filterCategory]); // fetchFixedAssets is stable

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleParishFilterChange = useCallback((value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setParishFilter('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refreshData = useCallback(() => {
    fetchFixedAssets(queryParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, parishFilter, category, filterStatus, filterCategory]);

  return {
    // Data
    fixedAssets,
    parishes,
    loading,
    error,
    pagination,
    
    // Filters
    searchTerm,
    parishFilter,
    currentPage,
    
    // Handlers
    handleSearchChange,
    handleParishFilterChange,
    handleClearFilters,
    handlePageChange,
    refreshData,
    
    // Query params for manual fetching
    queryParams,
  };
}







