'use client';

import { useState, useCallback } from 'react';

export interface LeaveType {
  id: string;
  parishId: string | null;
  code: string;
  name: string;
  description: string | null;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseLeaveTypesReturn {
  leaveTypes: LeaveType[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchLeaveTypes: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createLeaveType: (data: Partial<LeaveType>) => Promise<LeaveType | null>;
  updateLeaveType: (id: string, data: Partial<LeaveType>) => Promise<LeaveType | null>;
  deleteLeaveType: (id: string) => Promise<boolean>;
}

export function useLeaveTypes(): UseLeaveTypesReturn {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseLeaveTypesReturn['pagination']>(null);

  const fetchLeaveTypes = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/leave-types?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leave types');
      }

      setLeaveTypes(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave types';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeaveType = useCallback(async (data: Partial<LeaveType>): Promise<LeaveType | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/leave-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create leave type');
      }

      await fetchLeaveTypes();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create leave type';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveTypes]);

  const updateLeaveType = useCallback(async (id: string, data: Partial<LeaveType>): Promise<LeaveType | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/leave-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update leave type');
      }

      await fetchLeaveTypes();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update leave type';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveTypes]);

  const deleteLeaveType = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/leave-types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete leave type');
      }

      await fetchLeaveTypes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete leave type';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveTypes]);

  return {
    leaveTypes,
    loading,
    error,
    pagination,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
  };
}






