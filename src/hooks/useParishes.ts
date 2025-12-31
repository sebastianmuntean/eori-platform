'use client';

import { useState, useCallback } from 'react';

export interface Parish {
  id: string;
  dioceseId: string;
  deaneryId: string | null;
  code: string;
  name: string;
  patronSaintDay: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  priestName: string | null;
  vicarName: string | null;
  parishionerCount: number | null;
  foundedYear: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dioceseName?: string;
  deaneryName?: string;
}

export interface ParishesResponse {
  data: Parish[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseParishesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dioceseId?: string;
  deaneryId?: string;
  city?: string;
  county?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface UseParishesReturn {
  parishes: Parish[];
  loading: boolean;
  error: string | null;
  pagination: ParishesResponse['pagination'] | null;
  fetchParishes: (params?: UseParishesParams) => Promise<void>;
  getParish: (id: string) => Promise<Parish | null>;
  createParish: (data: Partial<Parish>) => Promise<boolean>;
  updateParish: (id: string, data: Partial<Parish>) => Promise<boolean>;
  deleteParish: (id: string) => Promise<boolean>;
}

export function useParishes(): UseParishesReturn {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ParishesResponse['pagination'] | null>(null);

  const fetchParishes = useCallback(async (params: UseParishesParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.dioceseId) queryParams.append('dioceseId', params.dioceseId);
      if (params.deaneryId) queryParams.append('deaneryId', params.deaneryId);
      if (params.city) queryParams.append('city', params.city);
      if (params.county) queryParams.append('county', params.county);
      if (params.isActive) queryParams.append('isActive', params.isActive);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/parishes?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch parishes');
      }

      setParishes(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parishes';
      setError(errorMessage);
      console.error('❌ Error fetching parishes:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getParish = useCallback(async (id: string): Promise<Parish | null> => {
    try {
      const response = await fetch(`/api/parishes/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch parish');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parish';
      setError(errorMessage);
      return null;
    }
  }, []);

  const createParish = useCallback(async (data: Partial<Parish>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create parish');
      }

      await fetchParishes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create parish';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchParishes]);

  const updateParish = useCallback(async (id: string, data: Partial<Parish>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update parish');
      }

      await fetchParishes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parish';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchParishes]);

  const deleteParish = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishes/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete parish');
      }

      await fetchParishes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete parish';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchParishes]);

  return {
    parishes,
    loading,
    error,
    pagination,
    fetchParishes,
    getParish,
    createParish,
    updateParish,
    deleteParish,
  };
}
