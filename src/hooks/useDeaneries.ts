'use client';

import { useState, useCallback } from 'react';

export interface Deanery {
  id: string;
  dioceseId: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  county: string | null;
  deanName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dioceseName?: string;
  dioceseCode?: string;
}

export interface DeaneriesResponse {
  data: Deanery[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseDeaneriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dioceseId?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface UseDeaneriesReturn {
  deaneries: Deanery[];
  loading: boolean;
  error: string | null;
  pagination: DeaneriesResponse['pagination'] | null;
  fetchDeaneries: (params?: UseDeaneriesParams) => Promise<void>;
  getDeanery: (id: string) => Promise<Deanery | null>;
  createDeanery: (data: Partial<Deanery>) => Promise<boolean>;
  updateDeanery: (id: string, data: Partial<Deanery>) => Promise<boolean>;
  deleteDeanery: (id: string) => Promise<boolean>;
}

export function useDeaneries(): UseDeaneriesReturn {
  const [deaneries, setDeaneries] = useState<Deanery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DeaneriesResponse['pagination'] | null>(null);

  const fetchDeaneries = useCallback(async (params: UseDeaneriesParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.dioceseId) queryParams.append('dioceseId', params.dioceseId);
      if (params.isActive) queryParams.append('isActive', params.isActive);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/deaneries?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch deaneries');
      }

      setDeaneries(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deaneries';
      setError(errorMessage);
      console.error('❌ Error fetching deaneries:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeanery = useCallback(async (id: string): Promise<Deanery | null> => {
    try {
      const response = await fetch(`/api/deaneries/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch deanery');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deanery';
      setError(errorMessage);
      return null;
    }
  }, []);

  const createDeanery = useCallback(async (data: Partial<Deanery>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/deaneries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create deanery');
      }

      await fetchDeaneries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deanery';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDeaneries]);

  const updateDeanery = useCallback(async (id: string, data: Partial<Deanery>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deaneries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update deanery');
      }

      await fetchDeaneries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deanery';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDeaneries]);

  const deleteDeanery = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deaneries/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete deanery');
      }

      await fetchDeaneries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deanery';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDeaneries]);

  return {
    deaneries,
    loading,
    error,
    pagination,
    fetchDeaneries,
    getDeanery,
    createDeanery,
    updateDeanery,
    deleteDeanery,
  };
}
