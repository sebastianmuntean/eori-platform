'use client';

import { useState, useCallback } from 'react';

export interface Warehouse {
  id: string;
  parishId: string;
  code: string;
  name: string;
  type: 'general' | 'retail' | 'storage' | 'temporary';
  address: string | null;
  responsibleName: string | null;
  phone: string | null;
  email: string | null;
  invoiceSeries: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

interface UseWarehousesReturn {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchWarehouses: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    type?: 'general' | 'retail' | 'storage' | 'temporary';
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createWarehouse: (data: Partial<Warehouse>) => Promise<Warehouse | null>;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => Promise<Warehouse | null>;
  deleteWarehouse: (id: string) => Promise<boolean>;
}

export function useWarehouses(): UseWarehousesReturn {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseWarehousesReturn['pagination']>(null);

  const fetchWarehouses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.type) queryParams.append('type', params.type);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/warehouses?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch warehouses');
      }

      setWarehouses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouses';
      setError(errorMessage);
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWarehouse = useCallback(async (data: Partial<Warehouse>): Promise<Warehouse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create warehouse');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create warehouse';
      setError(errorMessage);
      console.error('Error creating warehouse:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWarehouse = useCallback(async (id: string, data: Partial<Warehouse>): Promise<Warehouse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update warehouse');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update warehouse';
      setError(errorMessage);
      console.error('Error updating warehouse:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWarehouse = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/warehouses/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete warehouse');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete warehouse';
      setError(errorMessage);
      console.error('Error deleting warehouse:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    warehouses,
    loading,
    error,
    pagination,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
}

