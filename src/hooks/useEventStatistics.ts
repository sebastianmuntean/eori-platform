'use client';

import { useState, useCallback } from 'react';

export interface EventStatistics {
  total: number;
  byType: {
    wedding: number;
    baptism: number;
    funeral: number;
  };
  byStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  byMonth: Array<{
    month: string;
    count: number;
  }>;
  upcoming: number;
}

interface UseEventStatisticsReturn {
  statistics: EventStatistics | null;
  loading: boolean;
  error: string | null;
  fetchStatistics: (params?: {
    parishId?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
}

export function useEventStatistics(): UseEventStatisticsReturn {
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`/api/events/statistics?${queryParams.toString()}`);
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

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
}

