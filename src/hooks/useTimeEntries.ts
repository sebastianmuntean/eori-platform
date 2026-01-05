'use client';

import { useState, useCallback } from 'react';

export interface TimeEntry {
  id: string;
  employeeId: string;
  entryDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  breakDurationMinutes: number;
  workedHours: string | null;
  overtimeHours: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'sick_leave' | 'vacation';
  notes: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

interface UseTimeEntriesReturn {
  timeEntries: TimeEntry[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchTimeEntries: (params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createTimeEntry: (data: Partial<TimeEntry>) => Promise<TimeEntry | null>;
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => Promise<TimeEntry | null>;
  deleteTimeEntry: (id: string) => Promise<boolean>;
  approveTimeEntry: (id: string) => Promise<boolean>;
}

export function useTimeEntries(): UseTimeEntriesReturn {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseTimeEntriesReturn['pagination']>(null);

  const fetchTimeEntries = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/time-entries?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time entries');
      }

      setTimeEntries(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch time entries';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTimeEntry = useCallback(async (data: Partial<TimeEntry>): Promise<TimeEntry | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create time entry');
      }

      await fetchTimeEntries();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create time entry';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeEntries]);

  const updateTimeEntry = useCallback(async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/time-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update time entry');
      }

      await fetchTimeEntries();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update time entry';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeEntries]);

  const deleteTimeEntry = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/time-entries/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete time entry');
      }

      await fetchTimeEntries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete time entry';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeEntries]);

  const approveTimeEntry = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/time-entries/${id}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve time entry');
      }

      await fetchTimeEntries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve time entry';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeEntries]);

  return {
    timeEntries,
    loading,
    error,
    pagination,
    fetchTimeEntries,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    approveTimeEntry,
  };
}



