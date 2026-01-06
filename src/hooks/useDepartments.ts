'use client';

import { useState, useCallback } from 'react';

export interface Department {
  id: string;
  parishId: string;
  code: string;
  name: string;
  description: string | null;
  headName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchDepartments: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createDepartment: (data: Partial<Department>) => Promise<Department | null>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<boolean>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDepartmentsReturn['pagination']>(null);

  const fetchDepartments = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/departments?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch departments');
      }

      setDepartments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = useCallback(async (data: Partial<Department>): Promise<Department | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create department');
      }

      // Refresh the list after creation
      await fetchDepartments();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments]);

  const updateDepartment = useCallback(async (
    id: string,
    data: Partial<Department>
  ): Promise<Department | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update department');
      }

      // Refresh the list after update
      await fetchDepartments();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments]);

  const deleteDepartment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete department');
      }

      // Refresh the list after deletion
      await fetchDepartments();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    pagination,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

