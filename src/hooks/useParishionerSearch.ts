'use client';

import { useState, useCallback } from 'react';
import { Client } from './useClients';

interface SearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  firstName?: string;
  lastName?: string;
  cnp?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  parishId?: string;
  parishionerTypeId?: string;
  isParishioner?: boolean;
  isActive?: boolean;
  birthDateFrom?: string;
  birthDateTo?: string;
  nameDayFrom?: string;
  nameDayTo?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface UseParishionerSearchReturn {
  results: Client[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  search: (params: SearchParams) => Promise<void>;
}

export function useParishionerSearch(): UseParishionerSearchReturn {
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseParishionerSearchReturn['pagination']>(null);

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.firstName) queryParams.append('firstName', params.firstName);
      if (params.lastName) queryParams.append('lastName', params.lastName);
      if (params.cnp) queryParams.append('cnp', params.cnp);
      if (params.phone) queryParams.append('phone', params.phone);
      if (params.email) queryParams.append('email', params.email);
      if (params.address) queryParams.append('address', params.address);
      if (params.city) queryParams.append('city', params.city);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.parishionerTypeId) queryParams.append('parishionerTypeId', params.parishionerTypeId);
      if (params.isParishioner !== undefined) queryParams.append('isParishioner', params.isParishioner.toString());
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.birthDateFrom) queryParams.append('birthDateFrom', params.birthDateFrom);
      if (params.birthDateTo) queryParams.append('birthDateTo', params.birthDateTo);
      if (params.nameDayFrom) queryParams.append('nameDayFrom', params.nameDayFrom);
      if (params.nameDayTo) queryParams.append('nameDayTo', params.nameDayTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/parishioners/search?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to search');
      }

      setResults(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    pagination,
    search,
  };
}







