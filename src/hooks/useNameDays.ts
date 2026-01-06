'use client';

import { useState, useCallback } from 'react';

export interface NameDay {
  id: string;
  code: string;
  firstName: string | null;
  lastName: string | null;
  nameDay: string | null;
  phone: string | null;
  email: string | null;
  parishId: string | null;
  upcomingNameDay: string;
  daysUntil: number;
}

interface UseNameDaysReturn {
  nameDays: NameDay[];
  loading: boolean;
  error: string | null;
  fetchNameDays: (params?: {
    dateFrom?: string;
    dateTo?: string;
    parishId?: string;
    daysAhead?: number;
  }) => Promise<void>;
}

export function useNameDays(): UseNameDaysReturn {
  const [nameDays, setNameDays] = useState<NameDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNameDays = useCallback(async (params: {
    dateFrom?: string;
    dateTo?: string;
    parishId?: string;
    daysAhead?: number;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.daysAhead) queryParams.append('daysAhead', params.daysAhead.toString());

      const response = await fetch(`/api/parishioners/name-days?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch name days');
      }

      setNameDays(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch name days';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nameDays,
    loading,
    error,
    fetchNameDays,
  };
}






