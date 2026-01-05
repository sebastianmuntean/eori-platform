'use client';

import { useState, useCallback } from 'react';

export interface Cemetery {
  id: string;
  parishId: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  county: string | null;
  totalArea: string | null;
  totalPlots: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseCemeteriesReturn {
  cemeteries: Cemetery[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchCemeteries: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createCemetery: (data: Partial<Cemetery>) => Promise<Cemetery | null>;
  updateCemetery: (id: string, data: Partial<Cemetery>) => Promise<Cemetery | null>;
  deleteCemetery: (id: string) => Promise<boolean>;
}

export function useCemeteries(): UseCemeteriesReturn {
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCemeteriesReturn['pagination']>(null);

  const fetchCemeteries = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/cemeteries?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch cemeteries');
      }

      setCemeteries(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cemeteries';
      setError(errorMessage);
      console.error('Error fetching cemeteries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCemetery = useCallback(async (data: Partial<Cemetery>): Promise<Cemetery | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cemeteries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create cemetery');
      }

      setCemeteries((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create cemetery';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCemetery = useCallback(async (
    id: string,
    data: Partial<Cemetery>
  ): Promise<Cemetery | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update cemetery');
      }

      setCemeteries((prev) => prev.map((cemetery) => (cemetery.id === id ? result.data : cemetery)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cemetery';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCemetery = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete cemetery');
      }

      setCemeteries((prev) => prev.filter((cemetery) => cemetery.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cemetery';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cemeteries,
    loading,
    error,
    pagination,
    fetchCemeteries,
    createCemetery,
    updateCemetery,
    deleteCemetery,
  };
}



