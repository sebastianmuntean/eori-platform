'use client';

import { useState, useEffect, useCallback } from 'react';

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
  createdAt: Date;
  updatedAt: Date;
}

interface UseDeaneriesReturn {
  deaneries: Deanery[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchDeaneries: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    dioceseId?: string;
    sortBy?: string;
    sortOrder?: string;
    all?: boolean;
  }) => Promise<void>;
  createDeanery: (data: Partial<Deanery>) => Promise<Deanery | null>;
  updateDeanery: (id: string, data: Partial<Deanery>) => Promise<Deanery | null>;
  deleteDeanery: (id: string) => Promise<boolean>;
}

export function useDeaneries(): UseDeaneriesReturn {
  const [deaneries, setDeaneries] = useState<Deanery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDeaneriesReturn['pagination']>(null);

  const fetchDeaneries = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.dioceseId) queryParams.append('dioceseId', params.dioceseId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.all) queryParams.append('all', 'true');

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
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeanery = useCallback(async (data: Partial<Deanery>): Promise<Deanery | null> => {
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

      setDeaneries((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deanery';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeanery = useCallback(async (
    id: string,
    data: Partial<Deanery>
  ): Promise<Deanery | null> => {
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

      setDeaneries((prev) => prev.map((deanery) => (deanery.id === id ? result.data : deanery)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deanery';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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

      setDeaneries((prev) => prev.filter((deanery) => deanery.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deanery';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deaneries,
    loading,
    error,
    pagination,
    fetchDeaneries,
    createDeanery,
    updateDeanery,
    deleteDeanery,
  };
}


