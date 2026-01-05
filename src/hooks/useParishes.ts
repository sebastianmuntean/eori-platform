'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Parish {
  id: string;
  deaneryId: string | null;
  dioceseId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

interface UseParishesReturn {
  parishes: Parish[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchParishes: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    dioceseId?: string;
    deaneryId?: string;
    sortBy?: string;
    sortOrder?: string;
    all?: boolean;
  }) => Promise<void>;
  createParish: (data: Partial<Parish>) => Promise<Parish | null>;
  updateParish: (id: string, data: Partial<Parish>) => Promise<Parish | null>;
  deleteParish: (id: string) => Promise<boolean>;
}

export function useParishes(): UseParishesReturn {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseParishesReturn['pagination']>(null);

  const fetchParishes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.dioceseId) queryParams.append('dioceseId', params.dioceseId);
      if (params.deaneryId) queryParams.append('deaneryId', params.deaneryId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.all) queryParams.append('all', 'true');

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
    } finally {
      setLoading(false);
    }
  }, []);

  const createParish = useCallback(async (data: Partial<Parish>): Promise<Parish | null> => {
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

      setParishes((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create parish';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateParish = useCallback(async (
    id: string,
    data: Partial<Parish>
  ): Promise<Parish | null> => {
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

      setParishes((prev) => prev.map((parish) => (parish.id === id ? result.data : parish)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parish';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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

      setParishes((prev) => prev.filter((parish) => parish.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete parish';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    parishes,
    loading,
    error,
    pagination,
    fetchParishes,
    createParish,
    updateParish,
    deleteParish,
  };
}


