'use client';

import { useState, useCallback } from 'react';

export interface Position {
  id: string;
  parishId: string;
  departmentId: string | null;
  code: string;
  title: string;
  description: string | null;
  minSalary: string | null;
  maxSalary: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UsePositionsReturn {
  positions: Position[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchPositions: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    departmentId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createPosition: (data: Partial<Position>) => Promise<Position | null>;
  updatePosition: (id: string, data: Partial<Position>) => Promise<Position | null>;
  deletePosition: (id: string) => Promise<boolean>;
}

export function usePositions(): UsePositionsReturn {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsePositionsReturn['pagination']>(null);

  const fetchPositions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.departmentId) queryParams.append('departmentId', params.departmentId);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/positions?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch positions');
      }

      setPositions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPosition = useCallback(async (data: Partial<Position>): Promise<Position | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create position');
      }

      await fetchPositions();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create position';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPositions]);

  const updatePosition = useCallback(async (id: string, data: Partial<Position>): Promise<Position | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update position');
      }

      await fetchPositions();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update position';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPositions]);

  const deletePosition = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/positions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete position');
      }

      await fetchPositions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete position';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPositions]);

  return {
    positions,
    loading,
    error,
    pagination,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  };
}



