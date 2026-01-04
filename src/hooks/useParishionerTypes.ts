'use client';

import { useState, useCallback } from 'react';

export interface ParishionerType {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseParishionerTypesReturn {
  types: ParishionerType[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchTypes: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
    all?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createType: (data: Partial<ParishionerType>) => Promise<ParishionerType | null>;
  updateType: (id: string, data: Partial<ParishionerType>) => Promise<ParishionerType | null>;
  deleteType: (id: string) => Promise<boolean>;
}

export function useParishionerTypes(): UseParishionerTypesReturn {
  const [types, setTypes] = useState<ParishionerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseParishionerTypesReturn['pagination']>(null);

  const fetchTypes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.all) queryParams.append('all', 'true');
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/parishioners/types?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch types');
      }

      setTypes(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch types';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createType = useCallback(async (data: Partial<ParishionerType>): Promise<ParishionerType | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parishioners/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create type');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create type';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateType = useCallback(async (id: string, data: Partial<ParishionerType>): Promise<ParishionerType | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update type');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update type';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteType = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete type');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete type';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    types,
    loading,
    error,
    pagination,
    fetchTypes,
    createType,
    updateType,
    deleteType,
  };
}

