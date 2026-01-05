'use client';

import { useState, useCallback } from 'react';

export interface PilgrimageStatistics {
  participants: {
    total: number;
    registered: number;
    confirmed: number;
    paid: number;
    cancelled: number;
    waitlisted: number;
  };
  payments: {
    totalAmount: number;
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
  };
  revenue: {
    total: number;
    paid: number;
    outstanding: number;
  };
}

interface UsePilgrimageStatisticsReturn {
  statistics: PilgrimageStatistics | null;
  loading: boolean;
  error: string | null;
  fetchStatistics: (pilgrimageId: string) => Promise<void>;
  fetchGlobalStatistics: (params?: {
    parishId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<void>;
}

export function usePilgrimageStatistics(): UsePilgrimageStatisticsReturn {
  const [statistics, setStatistics] = useState<PilgrimageStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async (pilgrimageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/statistics`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics');
      }

      setStatistics(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGlobalStatistics = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await fetch(`/api/pilgrimages/statistics?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch global statistics');
      }

      setStatistics(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch global statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    fetchGlobalStatistics,
  };
}



