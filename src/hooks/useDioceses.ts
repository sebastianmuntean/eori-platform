'use client';

import { useState, useEffect, useCallback } from 'react';

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
  createdAt: Date;
  updatedAt: Date;
}

interface UseDiocesesReturn {
  dioceses: Diocese[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchDioceses: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    all?: boolean;
  }) => Promise<void>;
  createDiocese: (data: Partial<Diocese>) => Promise<Diocese | null>;
  updateDiocese: (id: string, data: Partial<Diocese>) => Promise<Diocese | null>;
  deleteDiocese: (id: string) => Promise<boolean>;
}

export function useDioceses(): UseDiocesesReturn {
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDiocesesReturn['pagination']>(null);

  const fetchDioceses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.all) queryParams.append('all', 'true');

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
    } finally {
      setLoading(false);
    }
  }, []);

  const createDiocese = useCallback(async (data: Partial<Diocese>): Promise<Diocese | null> => {
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

      setDioceses((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create diocese';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDiocese = useCallback(async (
    id: string,
    data: Partial<Diocese>
  ): Promise<Diocese | null> => {
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

      setDioceses((prev) => prev.map((diocese) => (diocese.id === id ? result.data : diocese)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update diocese';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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

      setDioceses((prev) => prev.filter((diocese) => diocese.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete diocese';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dioceses,
    loading,
    error,
    pagination,
    fetchDioceses,
    createDiocese,
    updateDiocese,
    deleteDiocese,
  };
}


