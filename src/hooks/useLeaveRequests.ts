'use client';

import { useState, useCallback } from 'react';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

interface UseLeaveRequestsReturn {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchLeaveRequests: (params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    leaveTypeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createLeaveRequest: (data: Partial<LeaveRequest>) => Promise<LeaveRequest | null>;
  updateLeaveRequest: (id: string, data: Partial<LeaveRequest>) => Promise<LeaveRequest | null>;
  deleteLeaveRequest: (id: string) => Promise<boolean>;
  approveLeaveRequest: (id: string) => Promise<boolean>;
  rejectLeaveRequest: (id: string, reason?: string) => Promise<boolean>;
}

export function useLeaveRequests(): UseLeaveRequestsReturn {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseLeaveRequestsReturn['pagination']>(null);

  const fetchLeaveRequests = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    leaveTypeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.leaveTypeId) queryParams.append('leaveTypeId', params.leaveTypeId);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/leave-requests?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leave requests');
      }

      setLeaveRequests(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave requests';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeaveRequest = useCallback(async (data: Partial<LeaveRequest>): Promise<LeaveRequest | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create leave request');
      }

      await fetchLeaveRequests();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create leave request';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveRequests]);

  const updateLeaveRequest = useCallback(async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/leave-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update leave request');
      }

      await fetchLeaveRequests();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update leave request';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveRequests]);

  const deleteLeaveRequest = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/leave-requests/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete leave request');
      }

      await fetchLeaveRequests();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete leave request';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveRequests]);

  const approveLeaveRequest = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/leave-requests/${id}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve leave request');
      }

      await fetchLeaveRequests();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve leave request';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveRequests]);

  const rejectLeaveRequest = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/leave-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason || null }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject leave request');
      }

      await fetchLeaveRequests();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject leave request';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLeaveRequests]);

  return {
    leaveRequests,
    loading,
    error,
    pagination,
    fetchLeaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
  };
}






