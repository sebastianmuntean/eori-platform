'use client';

import { useState, useCallback } from 'react';

export interface Diocese {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bishopName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiocesesResponse {
  data: Diocese[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseDiocesesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface UseDiocesesReturn {
  dioceses: Diocese[];
  loading: boolean;
  error: string | null;
  pagination: DiocesesResponse['pagination'] | null;
  fetchDioceses: (params?: UseDiocesesParams) => Promise<void>;
  getDiocese: (id: string) => Promise<Diocese | null>;
  createDiocese: (data: Partial<Diocese>) => Promise<boolean>;
  updateDiocese: (id: string, data: Partial<Diocese>) => Promise<boolean>;
  deleteDiocese: (id: string) => Promise<boolean>;
}

export function useDioceses(): UseDiocesesReturn {
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DiocesesResponse['pagination'] | null>(null);

  const fetchDioceses = useCallback(async (params: UseDiocesesParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive) queryParams.append('isActive', params.isActive);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/dioceses?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dioceses');
      }

      setDioceses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dioceses';
      setError(errorMessage);
      console.error('❌ Error fetching dioceses:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDiocese = useCallback(async (id: string): Promise<Diocese | null> => {
    try {
      const response = await fetch(`/api/dioceses/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch diocese');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch diocese';
      setError(errorMessage);
      return null;
    }
  }, []);

  const createDiocese = useCallback(async (data: Partial<Diocese>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dioceses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create diocese');
      }

      await fetchDioceses();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create diocese';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDioceses]);

  const updateDiocese = useCallback(async (id: string, data: Partial<Diocese>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dioceses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update diocese');
      }

      await fetchDioceses();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update diocese';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDioceses]);

  const deleteDiocese = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dioceses/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete diocese');
      }

      await fetchDioceses();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete diocese';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDioceses]);

  return {
    dioceses,
    loading,
    error,
    pagination,
    fetchDioceses,
    getDiocese,
    createDiocese,
    updateDiocese,
    deleteDiocese,
  };
}
